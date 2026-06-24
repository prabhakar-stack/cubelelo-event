/**
 * One-off MongoDB → Supabase (Postgres) data port. READ-ONLY on Mongo.
 * Runs entirely over a direct Postgres connection (DATABASE_URL):
 * applies 0001_init.sql (idempotent) then ports every collection.
 *
 *   npx tsx scripts/migrate-to-supabase.ts --dry       # Mongo counts only, no DB writes
 *   npx tsx scripts/migrate-to-supabase.ts             # apply schema + port
 *   npx tsx scripts/migrate-to-supabase.ts --skip-ddl  # port only (tables already exist)
 */
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { Pool } from 'pg';

import { User } from '../lib/models/User';
import { Competition } from '../lib/models/Competition';
import { PaidParticipant } from '../lib/models/PaidParticipant';
import { Result } from '../lib/models/Result';
import { EventBest } from '../lib/models/EventBest';
import { Order } from '../lib/models/Order';
import { PromoCode } from '../lib/models/PromoCode';
import { PastResult } from '../lib/models/PastResult';
import { CubeSession } from '../lib/models/CubeSession';
import { Solve } from '../lib/models/Solve';
import { DailyChallenge, DailyChallengeEntry } from '../lib/models/DailyChallenge';
import { Problem } from '../lib/models/Problem';
import { UserSubmission } from '../lib/models/UserSubmission';
import { PointTransaction } from '../lib/models/PointTransaction';
import { ShopItem } from '../lib/models/ShopItem';
import { ShopOrder } from '../lib/models/ShopOrder';
import { FunFact } from '../lib/models/FunFact';
import { SiteConfig } from '../lib/models/SiteConfig';
import { Blog } from '../lib/models/Blog';
import { Carousel } from '../lib/models/Carousel';
import { AuditLog } from '../lib/models/AuditLog';
import { Notification } from '../lib/models/Notification';
import { PartialAdmin } from '../lib/models/PartialAdmin';

const DRY = process.argv.includes('--dry');
const SKIP_DDL = process.argv.includes('--skip-ddl');
const CONN = process.env.DATABASE_URL || process.env.SUPABASE_URL || '';

const pool = (!DRY)
  ? new Pool({ connectionString: CONN, ssl: { rejectUnauthorized: false }, max: 4 })
  : (null as any);
if (!DRY && !CONN) { console.error('Set DATABASE_URL (Postgres connection string) for a live port (or use --dry).'); process.exit(1); }

const oid = (d: any) => d?._id?.toString() ?? null;
const iso = (d: any) => (d ? new Date(d).toISOString() : null);
const jparse = (s: any, fb: any) => { try { return typeof s === 'string' ? JSON.parse(s) : (s ?? fb); } catch { return fb; } };
const chunk = <T,>(arr: T[], n: number) => Array.from({ length: Math.ceil(arr.length / n) }, (_, i) => arr.slice(i * n, i * n + n));
// jsonb columns need objects/arrays serialized; everything else passes through.
const ser = (v: any) => (v !== null && typeof v === 'object' && !(v instanceof Date)) ? JSON.stringify(v) : v;
// Coerce possibly-float Mongo numbers into integers for integer columns.
const int = (v: any) => (v === null || v === undefined || v === '') ? null : Math.round(Number(v));
// Deep-clone a Mongo doc to a plain JSON object (ObjectId→hex, Date→ISO) for storage.
const clean = (d: any) => JSON.parse(JSON.stringify(d ?? {}));
// Top-level field names the Mongoose schema knows about (anything else is "extra").
function knownKeys(model: any): Set<string> {
  const s = new Set<string>(['_id', '__v', 'id']);
  for (const p of Object.keys(model?.schema?.paths ?? {})) s.add(p.split('.')[0]);
  return s;
}

async function insertBatch(table: string, batch: any[], conflict?: string) {
  const cols = Object.keys(batch[0]);
  const values: any[] = [];
  const tuples = batch.map((r, i) => {
    const ph = cols.map((_, j) => `$${i * cols.length + j + 1}`);
    cols.forEach(c => values.push(ser(r[c])));
    return `(${ph.join(',')})`;
  });
  const colList = cols.map(c => `"${c}"`).join(',');
  let sql = `insert into ${table} (${colList}) values ${tuples.join(',')}`;
  if (conflict) {
    const setList = cols.filter(c => c !== conflict).map(c => `"${c}"=excluded."${c}"`).join(',');
    sql += ` on conflict (${conflict}) do update set ${setList}`;
  }
  await pool.query(sql, values);
}

async function insertRows(table: string, rows: any[], conflict?: string) {
  if (!rows.length) return;
  for (const batch of chunk(rows, 200)) {
    try {
      await insertBatch(table, batch, conflict);
    } catch {
      // One bad row shouldn't zero the table — retry row-by-row, skipping/reporting failures.
      for (const r of batch) {
        try { await insertBatch(table, [r], conflict); }
        catch (e: any) { console.error(`  ✗ ${table} skipped 1 row: ${e.message}`); }
      }
    }
  }
}

// Like insertRows, but a failed row is logged to migration_anomalies (with the
// original Mongo doc) instead of silently skipped — zero data loss.
async function insertRowsTracked(table: string, rows: any[], docs: any[], conflict: string, anomalies: any[]) {
  for (let b = 0; b < rows.length; b += 200) {
    const rb = rows.slice(b, b + 200), db = docs.slice(b, b + 200);
    try {
      await insertBatch(table, rb, conflict);
    } catch {
      for (let i = 0; i < rb.length; i++) {
        try { await insertBatch(table, [rb[i]], conflict); }
        catch (e: any) {
          anomalies.push({
            source_collection: table, source_mongo_id: oid(db[i]), anomaly_type: 'validation_error',
            extra_fields: null, error_message: e.message, full_document: clean(db[i]),
          });
        }
      }
    }
  }
}

async function count(table: string): Promise<number> {
  const r = await pool.query(`select count(*)::int as n from ${table}`);
  return r.rows[0].n;
}

const ctx: { challengeMap: Record<string, string>; userMap: Record<string, string> } = { challengeMap: {}, userMap: {} };
// Resolve a stored user reference (which may be a Mongo _id or a CL ID) to the
// canonical user_id. CL IDs pass through unchanged; legacy _ids are remapped.
const mapUser = (uid: any) => (uid == null ? null : (ctx.userMap[uid] ?? uid));

type Spec = {
  table: string;
  model: any;
  transform: (d: any) => any;
  children?: { table: string; rows: (d: any) => any[] }[];
  after?: () => Promise<void>;
};

const specs: Spec[] = [
  {
    table: 'users', model: User,
    transform: (d) => ({
      legacy_mongo_id: oid(d), user_id: d.userId || ('MIG-' + String(d._id).slice(-10)), email: d.email, password_hash: d.password ?? null,
      token: d.token ?? null, role: d.role ?? 'user',
      first_name: d.name?.firstName ?? null, last_name: d.name?.lastName ?? null,
      wca_id: d.wcaId ?? null, wca_verified: !!d.wcaVerified, dob: d.dob ?? null, gender: d.gender ?? null,
      city: d.city ?? null, country: d.country ?? null, mobile: d.mobile ?? null, profile_picture: d.profilePicture ?? null,
      social_media: d.socialMedia ?? {}, active: d.active !== false, privacy_public: d.privacyPublic !== false,
      notif_email: d.notifEmail !== false, notif_push: d.notifPush !== false, theme: d.theme ?? 'dark',
      email_verified: !!d.emailVerified, points_balance: d.pointsBalance ?? 0,
      streak_current: d.streak?.current ?? 0, streak_longest: d.streak?.longest ?? 0,
      streak_last_date: d.streak?.lastSolvedDate ?? null, streak_freezes_used: d.streak?.freezesUsed ?? 0,
      streak_freezes: d.streakFreezes ?? 0, premium_until: iso(d.premiumUntil),
      profile_completion_pct: d.profileCompletion?.percent ?? 0, profile_rewarded_at: iso(d.profileCompletion?.rewardedAt),
      keybindings: d.keybindings ?? null, migration_email_sent_at: iso(d.migrationEmailSentAt),
      created_at: iso(d.createdAt), updated_at: iso(d.updatedAt),
    }),
    after: async () => {
      const r = await pool.query('select user_id, legacy_mongo_id from users');
      for (const row of r.rows) {
        if (row.legacy_mongo_id) ctx.userMap[row.legacy_mongo_id] = row.user_id;
        ctx.userMap[row.user_id] = row.user_id;
      }
    },
  },
  {
    table: 'competitions', model: Competition,
    transform: (d) => ({
      legacy_mongo_id: oid(d), competition_id: d.competitionId, name: d.competitionName, short_name: d.shortName ?? null,
      type: d.competitionType ?? null, profile_image: d.competitionProfile ?? null, another_image: d.anotherImage ?? null,
      status: d.status ?? 'upcoming', registration_open: !!d.registrationOpen, featured: !!d.featured,
      start_date: d.start ?? null, end_date: d.end ?? null, description: d.description ?? null,
      verified: d.verified ?? 'false', rules: jparse(d.rules, []), faqs: jparse(d.faqs, []),
      created_by_admin_id: d.createdByAdminId ?? null, is_free: d.isFree !== false,
      base_fee: d.baseFee ?? 0, per_event_fee: d.perEventFee ?? 0, max_entries: d.maxEntries ?? 100,
      rounds: d.rounds ?? 1, current_round: d.currentRound ?? 1, advancement_count: d.advancementCount ?? 16,
      round_opened_at: iso(d.roundOpenedAt), round_closed_at: iso(d.roundClosedAt),
      competitor_ids: d.competitorsIds ?? [], qualified_user_ids: d.qualifiedUserIds ?? [],
      created_at: iso(d.createdAt), updated_at: iso(d.updatedAt),
    }),
    children: [
      { table: 'competition_events', rows: (d) => (d.events ?? []).map((e: any) => ({
        legacy_mongo_id: oid(e), competition_id: d.competitionId, event_id: e.eventId, event_name: e.eventName,
        start: e.start, end: e.end, result_verified: e.resultVerified ?? 'false',
        default_scramble: e.scramble?.defaultScramble !== false, scramble_pattern: e.scramble?.scramblePattern ?? [],
        competitor_ids: e.competitorsIds ?? [],
      })) },
      { table: 'prize_tiers', rows: (d) => (d.prizes ?? []).map((p: any) => ({
        competition_id: d.competitionId, rank_start: p.rankStart, rank_end: p.rankEnd, mode: p.mode,
        amount: p.amount ?? 0, pool_total: p.poolTotal ?? 0, distribution: p.distribution ?? null,
      })) },
    ],
  },
  { table: 'paid_participants', model: PaidParticipant, transform: (d) => ({
    legacy_mongo_id: oid(d), user_id: d.userId, competition_id: d.competitionId, name: d.name ?? null, email: d.email ?? null,
    order_id: d.orderId ?? null, events: d.events ?? [], total: d.total ?? null, payment_status: d.paymentStatus ?? null,
    reg_datetime: d.regDateAndTime ?? null, created_at: iso(d.createdAt),
  }) },
  { table: 'results', model: Result, transform: (d) => ({
    legacy_mongo_id: oid(d), result_id: d.resultId, competition_id: d.competitionId, competition_name: d.competitionName,
    event_id: d.eventId, user_id: d.userId, first_name: d.firstName, last_name: d.lastName, email: d.email,
    wca_id: d.wcaId ?? 'NA', country: d.country ?? 'India',
    status_verified: d.status?.verified != null ? String(d.status.verified) : null, status_judge: d.status?.judge ?? null,
    status_remark: d.status?.remark ?? null, status_flag_reason: (d.status as any)?.flagReason ?? null,
    best_time: int(d.bestTime) ?? 360000, average_time: int(d.averageTime) ?? 360000,
    value1: int(d.value1) ?? 360000, value2: int(d.value2) ?? 360000, value3: int(d.value3) ?? 360000, value4: int(d.value4) ?? 360000, value5: int(d.value5) ?? 360000,
    plus2_array: d.plus2Array ?? [], verification_array: d.verificationArray ?? [], value_x: d.valueX ?? [],
    video_link: d.videoLink?.videoLink ?? null, created_at: iso(d.createdAt), updated_at: iso(d.updatedAt),
  }) },
  { table: 'event_bests', model: EventBest, transform: (d) => ({
    legacy_mongo_id: oid(d), user_id: d.userId, event_id: d.eventId, competition_id: d.competitionId ?? null,
    name: d.name ?? null, best_single: d.bestSingle != null ? String(d.bestSingle) : null,
    best_average: d.bestAverage != null ? String(d.bestAverage) : null, updated_at: iso(d.updatedAt),
  }) },
  { table: 'orders', model: Order, transform: (d) => ({
    legacy_mongo_id: oid(d), order_id: d.orderId, comp_id: d.compId ?? null, user_id: d.userId ?? null,
    event_ids: d.eventIds ?? [], amount: d.amount ?? null, receipt: d.receipt ?? null, status: d.status ?? 'created',
    razorpay_payment_id: d.razorpayPaymentId ?? null, razorpay_signature: d.razorpaySignature ?? null,
    invoice_number: d.invoiceNumber ?? null, invoiced_at: iso(d.invoicedAt), refund_status: d.refundStatus ?? 'none',
    refund_reason: d.refundReason ?? null, promo_code: d.promoCode ?? null, created_at: iso(d.createdAt), updated_at: iso(d.updatedAt),
  }) },
  { table: 'promo_codes', model: PromoCode, transform: (d) => ({
    legacy_mongo_id: oid(d), code: d.code, type: d.type, value: d.value, max_uses: d.maxUses ?? 0, used_count: d.usedCount ?? 0,
    min_amount: d.minAmount ?? 0, competition_id: d.competitionId ?? null, expires_at: iso(d.expiresAt), active: d.active !== false,
    used_by: d.usedBy ?? [], created_at: iso(d.createdAt), updated_at: iso(d.updatedAt),
  }) },
  { table: 'past_results', model: PastResult, transform: (d) => ({
    legacy_mongo_id: oid(d), competition_id: d.competitionId ?? null, event_id: d.eventId ?? null, name: d.name ?? null, rank: d.rank ?? null,
  }) },
  { table: 'cube_sessions', model: CubeSession, transform: (d) => ({
    legacy_mongo_id: oid(d), user_id: d.userId, name: d.name, puzzle_type: d.puzzleType, solve_count: d.solveCount ?? 0,
    best_single: int(d.bestSingle), best_ao5: int(d.bestAo5), ended_at: iso(d.endedAt), created_at: iso(d.createdAt), updated_at: iso(d.updatedAt),
  }) },
  { table: 'solves', model: Solve, transform: (d) => ({
    legacy_mongo_id: oid(d), user_id: d.userId ?? null, session_id: d.sessionId ?? null, session_name: d.sessionName ?? null,
    puzzle_type: d.puzzleType ?? null, time_ms: int(d.timeInMs), scramble: d.scramble ?? null, status: d.status ?? null,
    notes: d.notes ?? null, is_pb: !!d.isPB, created_at: iso(d.createdAt), updated_at: iso(d.updatedAt),
  }) },
  {
    table: 'daily_challenges', model: DailyChallenge,
    transform: (d) => ({ legacy_mongo_id: oid(d), date: d.date, puzzle_type: d.puzzleType, scramble: d.scramble, created_at: iso(d.createdAt) }),
    after: async () => {
      const r = await pool.query('select id, legacy_mongo_id from daily_challenges');
      for (const row of r.rows) if (row.legacy_mongo_id) ctx.challengeMap[row.legacy_mongo_id] = row.id;
    },
  },
  { table: 'daily_challenge_entries', model: DailyChallengeEntry, transform: (d) => ({
    legacy_mongo_id: oid(d), challenge_id: ctx.challengeMap[d.challengeId] ?? null, date: d.date, user_id: d.userId,
    user_name: d.userName ?? null, time_ms: d.timeInMs ?? null, status: d.status ?? 'OK', submitted_at: iso(d.submittedAt),
  }) },
  { table: 'problems', model: Problem, transform: (d) => ({
    legacy_mongo_id: oid(d), problem_id: d.problemId, mode: d.mode ?? 'practice', puzzle_type: d.puzzleType, scramble: d.scramble,
    step_limit: d.stepLimit ?? 0, optimal_move_count: d.optimalMoveCount ?? 0, difficulty: d.difficulty ?? 'medium',
    base_points: d.basePoints ?? 100, hints: d.hints ?? [], solutions: d.solutions ?? {}, active_date: d.activeDate ?? null,
    archived_at: iso(d.archivedAt), stats: d.stats ?? {}, active: d.active !== false, created_at: iso(d.createdAt), updated_at: iso(d.updatedAt),
  }) },
  { table: 'user_submissions', model: UserSubmission, transform: (d) => ({
    legacy_mongo_id: oid(d), problem_id: d.problemId, user_id: d.userId, date: d.date ?? null, status: d.status ?? 'in_progress',
    hints_used: d.hintsUsed ?? 0, hints_revealed: d.hintsRevealed ?? [], penalty_percent: d.penaltyPercent ?? 0,
    hints_locked: !!d.hintsLocked, last_hint_at: iso(d.lastHintAt), best_solution: d.bestSolution ?? null,
    best_move_count: int(d.bestMoveCount), best_time_ms: int(d.bestTimeMs), within_step_limit: d.withinStepLimit ?? null,
    final_score: int(d.finalScore), points_awarded: int(d.pointsAwarded), solved_at: iso(d.solvedAt),
    attempts: d.attempts ?? [], created_at: iso(d.createdAt), updated_at: iso(d.updatedAt),
  }) },
  { table: 'point_transactions', model: PointTransaction, transform: (d) => ({
    legacy_mongo_id: oid(d), user_id: d.userId, amount: d.amount, reason: d.reason, ref_type: d.refType ?? null,
    ref_id: d.refId ?? null, balance_after: d.balanceAfter, note: d.note ?? null, created_at: iso(d.createdAt),
  }) },
  { table: 'shop_items', model: ShopItem, transform: (d) => ({
    legacy_mongo_id: oid(d), item_id: d.itemId, name: d.name, description: d.description ?? null, image_url: d.imageUrl ?? null,
    category: d.category, kind: d.kind, price_points: d.pricePoints, payload: d.payload ?? null, stock: d.stock ?? null,
    active: d.active !== false, created_at: iso(d.createdAt), updated_at: iso(d.updatedAt),
  }) },
  { table: 'shop_orders', model: ShopOrder, transform: (d) => ({
    legacy_mongo_id: oid(d), order_id: d.orderId, user_id: d.userId, item_id: d.itemId ?? null, kind: d.kind ?? null,
    price_points: d.pricePoints ?? null, status: d.status ?? 'pending', fulfillment: d.fulfillment ?? null,
    created_at: iso(d.createdAt), updated_at: iso(d.updatedAt),
  }) },
  { table: 'fun_facts', model: FunFact, transform: (d) => ({ legacy_mongo_id: oid(d), text: d.text, category: d.category ?? null, active: d.active !== false, created_at: iso(d.createdAt) }) },
  { table: 'site_configs', model: SiteConfig, transform: (d) => ({ legacy_mongo_id: oid(d), key: d.key, value: d.value ?? null, created_at: iso(d.createdAt), updated_at: iso(d.updatedAt) }) },
  { table: 'blogs', model: Blog, transform: (d) => ({ legacy_mongo_id: oid(d), legacy_id: d.id ?? null, image: d.image ?? null, title: d.title, body: d.body ?? null, link: d.link ?? null, display: d.display !== false, author: d.author ?? null, date: d.date ?? null, position: d.position ?? 0, created_at: iso(d.createdAt), updated_at: iso(d.updatedAt) }) },
  { table: 'carousels', model: Carousel, transform: (d) => ({ legacy_mongo_id: oid(d), legacy_id: d.id ?? null, image: d.image ?? null, link: d.link ?? null, colour: d.colour ?? 'white', position: d.position ?? 'left', text: d.text ?? '{}', key: d.key ?? 0, display: d.display !== false, mobile_carousel: !!d.mobileCarousel, created_at: iso(d.createdAt), updated_at: iso(d.updatedAt) }) },
  { table: 'audit_logs', model: AuditLog, transform: (d) => ({ legacy_mongo_id: oid(d), admin_id: d.adminId ?? null, admin_name: d.adminName ?? null, admin_email: d.adminEmail ?? null, action: d.action, target: d.target ?? null, reason: d.reason ?? null, meta: d.meta ?? null, created_at: iso(d.createdAt) }) },
  { table: 'notifications', model: Notification, transform: (d) => ({ legacy_mongo_id: oid(d), user_id: d.userId, type: d.type ?? 'info', title: d.title, body: d.body ?? null, link: d.link ?? null, read: !!d.read, created_at: iso(d.createdAt) }) },
  { table: 'partial_admins', model: PartialAdmin, transform: (d) => ({ legacy_mongo_id: oid(d), user_id: d.userId, competition_ids: d.competitionIds ?? [], created_at: iso(d.createdAt), updated_at: iso(d.updatedAt) }) },
];

async function applyDDL() {
  const sql = fs.readFileSync(path.join(process.cwd(), 'supabase/migrations/0001_init.sql'), 'utf8');
  await pool.query(sql);
  console.log('Schema applied (0001_init.sql).');
}

async function run() {
  await mongoose.connect(process.env.MONGODB_URI!);
  console.log(DRY ? '— DRY RUN (no writes) —' : '— LIVE PORT —');
  if (!DRY && !SKIP_DDL) await applyDDL();
  if (!DRY) await pool.query('truncate table migration_anomalies').catch(() => {});

  const anomalies: any[] = [];

  for (const spec of specs) {
    const docs: any[] = await spec.model.find().lean();
    const known = knownKeys(spec.model);

    // FAILSAFE 1 — flag fields the schema doesn't map (the matching fields still migrate below).
    let extraCount = 0;
    for (const d of docs) {
      const extra = Object.keys(d).filter(k => !known.has(k));
      if (extra.length) {
        extraCount++;
        anomalies.push({
          source_collection: spec.table, source_mongo_id: oid(d), anomaly_type: 'extra_fields',
          extra_fields: Object.fromEntries(extra.map(k => [k, d[k]])), error_message: null, full_document: clean(d),
        });
      }
    }

    const rows = docs.map(spec.transform);
    if (!DRY) for (const r of rows) if (r && r.user_id != null) r.user_id = mapUser(r.user_id);

    if (!DRY && rows.length) {
      // FAILSAFE 2 — a row that fails to insert is logged (with its full doc), never dropped.
      await insertRowsTracked(spec.table, rows, docs, 'legacy_mongo_id', anomalies);
      if (spec.after) await spec.after();
      for (const child of spec.children ?? []) {
        for (const d of docs) {
          const crows = child.rows(d);
          if (!crows.length) continue;
          try { await insertBatch(child.table, crows); }
          catch (e: any) {
            anomalies.push({
              source_collection: child.table, source_mongo_id: oid(d), anomaly_type: 'validation_error',
              extra_fields: null, error_message: e.message, full_document: clean(d),
            });
          }
        }
      }
    }

    const target = (!DRY) ? await count(spec.table) : 0;
    const flag = extraCount ? ` ⚑${extraCount} extra-field` : '';
    console.log(`${spec.table.padEnd(24)} mongo ${String(docs.length).padStart(6)}${DRY ? '' : ` → supabase ${target}`}${flag}`);
  }

  if (!DRY && anomalies.length) await insertRows('migration_anomalies', anomalies);
  console.log(`\nanomalies logged: ${anomalies.length}${anomalies.length ? '  → review at /admin/migration' : ''}`);

  await mongoose.disconnect();
  if (pool) await pool.end();
  console.log('Done.');
}

run().catch((e) => { console.error(e); process.exit(1); });
