# Cubelelo Events Platform — Development Summary

**Stack:** Next.js 15 (App Router) · MongoDB + Mongoose · NextAuth v5 (JWT) · Razorpay · cubing.js · Tailwind CSS · TypeScript  
**Build order:** Module 1 → Module 2 → Module 3 (per PRD)  
**Admin:** `prabhakar@cubelelo.com` — hardcoded in `ADMIN_EMAILS` in `lib/auth.ts`, always gets `role: 'admin'`

---

## Module 1 — Timer Terminal

**Routes:** `/timer` (main terminal), `/terminal` → redirects to `/timer`

### Timer Engine
- Web Worker isolated from React (`public/timerWorker.js`), `performance.now()` accuracy
- Spacebar hold-to-arm (desktop), two-finger touch (mobile)
- WCA inspection: 8s free, +2 at 15s, DNF at 17s
- DNF/+2 marking, undo last solve, solve notes, target time mode
- Live ao5/ao12 with WCA trimming rules
- PB detection with celebration banner
- Keyboard shortcuts: Space, D (DNF), P (+2), Z (undo), Escape
- BLD memo phase flow (separate memo timer before solve)

### Scramble Engine (cubing.js)
All WCA events: 3x3, 2x2, 4x4, 5x5, 6x6, 7x7, Pyraminx, Megaminx, Skewb, Square-1, OH, BLD  
2D cube net visualizer rendered client-side via cubing.js for every event

### Sessions
Named sessions, auto-save to DB (`/api/solves`) for logged-in users, local-only for guests with signup prompt

---

## Module 2 — Competition

### Auth & Accounts (`lib/auth.ts`)
- Email + password via `CredentialsProvider` + bcryptjs
- Google OAuth (`GoogleProvider`) — works on mobile web
- CL ID system: unique `userId` (e.g. `CL0001`) assigned on registration
- JWT strategy, session passes `role`, `userId`, `name`, `image`
- `ADMIN_EMAILS = ['prabhakar@cubelelo.com']` enforced in `jwt` callback — overrides DB role
- Password reset: `/api/auth/forgot-password` + `/api/auth/reset-password` (token-based)

### Public Pages
| Route | Description |
|---|---|
| `/` | Homepage: hero, live/upcoming/past competitions, carousel, announcement banner |
| `/competitions` | Full listing with filters (upcoming/live/past, event type) |
| `/competitions/[id]` | Detail: events, schedule, prizes, rules, register CTA, non-refundable notice |
| `/compete/[id]/lobby` | Countdown to scramble reveal, competitor list, round rules |
| `/compete/[id]` | Competition terminal: server-locked scramble, inspection, timer, video link, onboarding modal |
| `/compete/[id]/results` | Results archive: podium, event tabs, solve breakdown, certificate download |
| `/profile/[clid]` | Public profile: name, CL ID, WCA ID, PBs, competition history, daily streak badge |
| `/profile/me` | Own profile with edit controls |
| `/profile/me/settings` | Password change, notifications, privacy toggle, theme toggle |
| `/register` | Signup: name, email, password, Google OAuth |
| `/login` | Email + password, Google OAuth, dev-bypass panel |
| `/register/migrate` | Existing user account claim: CL ID or old email → OTP → set password |
| `/search/[query]` | User search by name or CL ID |

### Payments
- **Provider:** Razorpay (UPI, cards, netbanking, wallets) — `serverExternalPackages: ['razorpay']` in `next.config.ts`
- Per-event fee calculation (base fee + per-event fee)
- Promo/discount codes: percent or fixed, usage limits, per-competition scope, expiry date
- GST invoice PDF auto-generated on payment, downloadable from profile
- Refund UI in admin panel

### Competition Engine
- Multi-round structure: R1 → R2 → Final, admin configures advancement counts
- Simultaneous scramble reveal to all competitors when admin opens round
- Round open/close windows enforced on timer — submissions blocked outside window
- WCA cutoff enforcement (misses cutoff in 2 solves → round ends)
- WCA time limit enforcement (over limit → auto DNF)
- Auto-advancement on round close with email/push notifications
- Live leaderboard (polling, Socket.io-ready architecture)
- Video link submission required after all solves (YouTube/Drive, external only)

### Anti-Cheat & Verification
- Statistical outlier flag: result >30% faster than user history → flagged (not auto-DQ)
- WCA historical data used as baseline if WCA ID linked
- Submission timing plausibility check
- Judge verification queue in admin: Verify / +2 / DNF / DQ per result
- Manual result override with reason logged
- DQ flow, competitor appeal submission
- Full audit log: every admin action timestamped with admin name

### User Migration
- Bulk import API: all existing users, CL IDs, competition history from old platform
- Account claim flow at `/register/migrate` — self-service, no support tickets needed
- Migration progress dashboard in `/admin/migration`
- Duplicate account merge tool in admin

### Admin Panel (`/admin/*`)
| Section | Capabilities |
|---|---|
| Competitions | Create, edit, duplicate, status control (Draft → Published → Live → Completed) |
| Rounds & Scrambles | Generate sets, preview, lock, assign per round per event. Admin-configurable set size |
| Results | Verification queue, manual override, DQ flow, audit log |
| Users | Search, ban, role management (Admin/Judge/Moderator), WCA ID verify |
| Payments | Transaction log, refunds, GST invoices, promo codes |
| Content | Homepage banners, announcements — CMS-style, no code deploy needed |
| Rank Tier Config | Admin-editable tier thresholds (not hardcoded) via `SiteConfig` model |
| Migration | Import status, unclaimed accounts, bulk email |

### Certificates
- SVG generated server-side at `/api/competitions/[id]/certificate`
- Podium (rank 1–3): gold/silver/bronze styling
- Participation: all other competitors
- Downloadable from results page — `Content-Disposition: attachment`

---

## Module 3 — Practice Mode

| Route | Description |
|---|---|
| `/practice` | Hub: real DB solve data, PB grid per event, session list, overall stats, inline quick timer |
| `/practice/history` | Full history: progress trend chart, real activity heatmap, ao5/ao12, session list, paginated solve log |
| `/practice/sessions/[name]` | Per-session detail: all solves expandable (scramble/notes/timestamp), PB badge, penalty counts |
| `/practice/daily` | Redirects to `/daily-challenge` |
| `/daily-challenge` | Daily scramble (fixed per day, same for all users, resets midnight IST), one submission per user, streak tracking, global leaderboard |

---

## Static Pages
| Route | Description |
|---|---|
| `/about-us` | Platform story, stats (10k+ cubers, 200+ comps), 6 pillar cards |
| `/rules` | 6 sections: Eligibility, Timing, Scrambles, Video, Penalties, Fair Play |
| `/faqs` | 5 categories, accordion UI, 20+ Q&As |
| `/privacy-policy` | 10 sections, Indian tax/data compliance |
| `/contact-us` | 4 quick-action cards + contact form → `/api/contact` |

**Footer** (`components/ui/Footer.tsx`) — links to all static pages, wired into global layout (`app/layout.tsx`)

---

## API Routes

### Auth
- `POST /api/auth/register` — create account, assign CL ID
- `POST /api/auth/forgot-password` — send reset token
- `POST /api/auth/reset-password` — consume token, set new password
- `POST /api/auth/migrate-claim` — verify old CL ID/email, activate migrated account

### Competitions
- `GET/POST /api/competitions` — list all, create new
- `GET/PATCH /api/competitions/[id]` — detail, update status
- `POST /api/competitions/[id]/register` — register + Razorpay order creation (promo applied here)
- `POST /api/orders/verify` — verify Razorpay signature, confirm registration, track promo usage
- `GET /api/orders/invoice/[id]` — GST invoice PDF
- `GET/POST /api/competitions/[id]/results` — results list, submit solve
- `GET /api/competitions/[id]/leaderboard` — ranked results for event
- `GET /api/competitions/[id]/certificate` — SVG certificate download
- `POST /api/competitions/[id]/duplicate` — clone competition

### Solves & Practice
- `GET/POST /api/solves` — user solve history with PB detection

### Daily Challenge
- `GET/POST /api/daily-challenge` — today's scramble, submit result, compute streak
- `GET /api/daily-challenge/leaderboard` — today's ranked leaderboard

### Profile
- `GET/PATCH /api/profile` — own profile
- `GET /api/profile/[clid]` — public profile + PBs + competition history + daily streak

### Promo Codes
- `POST /api/promo/validate` — validate code, return discount amount
- `GET/POST/PATCH/DELETE /api/admin/promos` — admin CRUD

### Admin
- `/api/admin/competitions/[id]/rounds` — round management
- `/api/admin/competitions/[id]/scrambles` — scramble set generation/locking
- `/api/admin/results` — flagged results queue, override, DQ
- `/api/admin/users` — search, ban, role
- `/api/admin/payments` — transaction log, refunds
- `/api/admin/export/[id]` — CSV export of competition results
- `/api/admin/config` — rank tier thresholds (SiteConfig)
- `/api/admin/seed` — dev seed endpoint

### Other
- `GET /api/users/search` — search users by name or CL ID
- `GET /api/wca` — WCA ID verification via WCA public API
- `POST /api/contact` — contact form (logs always, emails if `RESEND_API_KEY` set)

---

## Data Models (`lib/models/`)

| Model | Collection | Key Fields |
|---|---|---|
| `User` | `users` | `userId, email, name, role, wcaId, wcaVerified, profilePicture, state, city` |
| `Competition` | `competitions` | `competitionId, name, status, events, rounds, isFree, baseFee, perEventFee` |
| `Round` | `rounds` | `competitionId, eventId, roundNumber, advancementCount, status, opensAt, closesAt` |
| `ScrambleSet` | `scramblesets` | `roundId, scrambles, lockedAt, lockedBy` |
| `PaidParticipant` | `paidparticipants` | `userId, competitionId, events, paymentStatus` |
| `Result` | `results` | `userId, competitionId, eventId, solves, bestTime, averageTime, flagStatus, videoUrl` |
| `Order` | `orders` | `userId, competitionId, amount, razorpayOrderId, status, promoCode` |
| `Solve` | `solves` | `userId, sessionId, sessionName, puzzleType, timeInMs, scramble, status, notes, isPB` |
| `EventBest` | `eventbests` | `userId, eventId, bestSingle, bestAverage` |
| `DailyChallenge` | `dailychallenges` | `date, puzzleType, scramble` |
| `DailyChallengeEntry` | `dailychallengeentries` | `challengeId, userId, date, timeInMs, status` |
| `PromoCode` | `promocodes` | `code, type, value, maxUses, usedCount, usedBy, competitionId, expiresAt` |
| `SiteConfig` | `siteconfigs` | `key, value` (rank tier thresholds, etc.) |
| `Blog` | `blogs` | `title, content, author, publishedAt` |
| `Carousel` | `carousels` | `imageUrl, linkUrl, order, active` |

---

## Key Technical Decisions

| Decision | Choice | Reason |
|---|---|---|
| ORM | Mongoose (no Prisma) | Existing data in MongoDB, lean() for performance |
| Auth | NextAuth v5 JWT strategy | No DB session table, works with Mongoose adapter |
| Password hashing | bcryptjs (not bcrypt) | Pure JS, no native bindings needed |
| Scrambles | cubing.js | Handles both WCA scramble gen AND 2D visualizer in one package |
| Payments | Razorpay | India-first, UPI support, GST invoice built-in |
| Timer | Web Worker + performance.now() | Isolated from React render cycle, sub-ms accuracy |
| Dynamic params | `await params` | Next.js 15 requirement — params is a Promise |
| File truncation fix | bash heredoc (`cat > file << 'EOF'`) | Edit tool truncates large files mid-write |

---

## File Structure (key paths)

```
app/
  (auth)/login, /register, /register/migrate
  admin/  competitions, users, payments, promos, content, migration
  api/    auth, competitions, solves, daily-challenge, profile, admin, orders, promo, contact, wca
  compete/[id]/  lobby, results
  competitions/[id]/
  daily-challenge/
  practice/  history, sessions/[name], daily
  profile/  [clid], me, me/settings
  terminal/
  timer/
  search/[query]/
  about-us, rules, faqs, privacy-policy, contact-us/

components/
  ui/  NavBar, Footer, SessionProviderWrapper, ClientMain
  TimerDisplay, ScrambleVisualizer, (timer hooks)

lib/
  auth.ts          NextAuth config + ADMIN_EMAILS
  mongoose.ts      Mongoose connection singleton
  mongodb.ts       MongoClient for NextAuth adapter
  models/          All 15 Mongoose models
  cube.ts          cubing.js wrapper
  utils/           competition helpers

docs/
  live-site-audit.md    Page-by-page audit of events.cubelelo.com (conducted June 2026)
  development-summary.md  This file
```

---

*Last updated: June 2026*
