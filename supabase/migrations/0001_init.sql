-- ============================================================================
-- Cubelelo — Supabase/Postgres schema (migrated from MongoDB)
-- Conventions: surrogate uuid PK, natural business keys (unique), FKs target
-- the natural keys the app joins on, legacy_mongo_id preserved for the port,
-- jsonb for document-shaped/small arrays, integer paise for money.
-- ============================================================================

-- ── Identity ────────────────────────────────────────────────────────────────
create table if not exists users (
  id                      uuid primary key default gen_random_uuid(),
  user_id                 text unique not null,           -- CL ID (canonical key)
  email                   text unique not null,
  password_hash           text,
  token                   text,
  role                    text not null default 'user' check (role in ('user','judge','moderator','admin')),
  first_name              text,
  last_name               text,
  wca_id                  text,
  wca_verified            boolean default false,
  dob                     text,
  gender                  text,
  city                    text,
  country                 text,
  mobile                  text,
  profile_picture         text,
  social_media            jsonb default '{}'::jsonb,
  active                  boolean default true,
  privacy_public          boolean default true,
  notif_email             boolean default true,
  notif_push              boolean default true,
  theme                   text default 'dark' check (theme in ('dark','light')),
  email_verified          boolean default false,
  verify_token            text,
  verify_token_expiry     timestamptz,
  reset_token             text,
  reset_token_expiry      timestamptz,
  migration_email_sent_at timestamptz,
  points_balance          integer default 0,
  streak_current          integer default 0,
  streak_longest          integer default 0,
  streak_last_date        text,
  streak_freezes_used     integer default 0,
  streak_freezes          integer default 0,
  premium_until           timestamptz,
  profile_completion_pct  integer default 0,
  profile_rewarded_at     timestamptz,
  keybindings             jsonb,
  created_at              timestamptz default now(),
  updated_at              timestamptz default now(),
  legacy_mongo_id         text unique
);

-- ── Competitions ────────────────────────────────────────────────────────────
create table if not exists competitions (
  id                  uuid primary key default gen_random_uuid(),
  competition_id      text unique not null,
  name                text not null,
  short_name          text,
  type                text,
  profile_image       text,
  another_image       text,
  status              text default 'upcoming' check (status in ('upcoming','live','past')),
  registration_open   boolean default false,
  featured            boolean default false,
  start_date          text,
  end_date            text,
  description         text,
  verified            text default 'false',
  rules               jsonb default '[]'::jsonb,
  faqs                jsonb default '[]'::jsonb,
  created_by_admin_id text,
  is_free             boolean default true,
  base_fee            integer default 0,      -- paise
  per_event_fee       integer default 0,      -- paise
  max_entries         integer default 100,
  rounds              integer default 1,
  current_round       integer default 1,
  advancement_count   integer default 16,
  round_opened_at     timestamptz,
  round_closed_at     timestamptz,
  competitor_ids      jsonb default '[]'::jsonb,
  qualified_user_ids  jsonb default '[]'::jsonb,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now(),
  legacy_mongo_id     text unique
);

create table if not exists competition_events (
  id               uuid primary key default gen_random_uuid(),
  competition_id   text not null references competitions(competition_id) on delete cascade,
  event_id         text,
  event_name       text,
  start            text,
  "end"            text,
  result_verified  text default 'false',
  default_scramble boolean default true,
  scramble_pattern jsonb default '[]'::jsonb,
  competitor_ids   jsonb default '[]'::jsonb,
  legacy_mongo_id  text
);
create index if not exists idx_comp_events_comp on competition_events(competition_id);

create table if not exists prize_tiers (
  id             uuid primary key default gen_random_uuid(),
  competition_id text not null references competitions(competition_id) on delete cascade,
  rank_start     integer not null,
  rank_end       integer not null,
  mode           text not null check (mode in ('fixed','pool')),
  amount         integer default 0,      -- paise (mode = fixed)
  pool_total     integer default 0,      -- paise (mode = pool)
  distribution   text check (distribution in ('uniform','linear','log'))
);
create index if not exists idx_prize_tiers_comp on prize_tiers(competition_id);

create table if not exists paid_participants (
  id              uuid primary key default gen_random_uuid(),
  user_id         text not null references users(user_id) on delete cascade,
  competition_id  text not null references competitions(competition_id) on delete cascade,
  name            text,
  email           text,
  order_id        text,
  events          jsonb default '[]'::jsonb,
  total           text,
  payment_status  text,
  reg_datetime    text,
  created_at      timestamptz default now(),
  legacy_mongo_id text unique,
  unique (user_id, competition_id)
);

create table if not exists results (
  id                 uuid primary key default gen_random_uuid(),
  result_id          text unique,
  competition_id     text references competitions(competition_id) on delete cascade,
  competition_name   text,
  event_id           text,
  user_id            text references users(user_id) on delete set null,
  first_name         text,
  last_name          text,
  email              text,
  wca_id             text default 'NA',
  country            text default 'India',
  status_verified    text,
  status_judge       text,
  status_remark      text,
  status_flag_reason text,
  best_time          integer default 360000,
  average_time       integer default 360000,
  value1 integer default 360000, value2 integer default 360000, value3 integer default 360000,
  value4 integer default 360000, value5 integer default 360000,
  plus2_array        jsonb default '[]'::jsonb,
  verification_array jsonb default '[]'::jsonb,
  value_x            jsonb default '[]'::jsonb,
  video_link         text,
  created_at         timestamptz default now(),
  updated_at         timestamptz default now(),
  legacy_mongo_id    text unique
);
create index if not exists idx_results_comp_event on results(competition_id, event_id);
create index if not exists idx_results_user_comp on results(user_id, competition_id);

create table if not exists event_bests (
  id              uuid primary key default gen_random_uuid(),
  user_id         text not null references users(user_id) on delete cascade,
  event_id        text not null,
  competition_id  text,
  name            text,
  best_single     text,
  best_average    text,
  updated_at      timestamptz default now(),
  legacy_mongo_id text unique,
  unique (user_id, event_id)
);

create table if not exists orders (
  id                 uuid primary key default gen_random_uuid(),
  order_id           text unique not null,
  comp_id            text,                       -- soft ref (may be competitionId or _id legacy)
  user_id            text references users(user_id) on delete set null,
  event_ids          jsonb default '[]'::jsonb,
  amount             text,
  receipt            text,
  status             text default 'created' check (status in ('created','processing','paid','failed')),
  razorpay_payment_id text,
  razorpay_signature  text,
  invoice_number     text,
  invoiced_at        timestamptz,
  refund_status      text default 'none' check (refund_status in ('none','requested','processed')),
  refund_reason      text,
  promo_code         text,
  created_at         timestamptz default now(),
  updated_at         timestamptz default now(),
  legacy_mongo_id    text unique
);
create index if not exists idx_orders_comp on orders(comp_id);

create table if not exists promo_codes (
  id             uuid primary key default gen_random_uuid(),
  code           text unique not null,
  type           text not null check (type in ('percent','fixed')),
  value          integer not null,
  max_uses       integer default 0,
  used_count     integer default 0,
  min_amount     integer default 0,
  competition_id text,
  expires_at     timestamptz,
  active         boolean default true,
  used_by        jsonb default '[]'::jsonb,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now(),
  legacy_mongo_id text unique
);

create table if not exists past_results (
  id              uuid primary key default gen_random_uuid(),
  competition_id  text,
  event_id        text,
  name            text,
  rank            text,
  legacy_mongo_id text unique
);
create index if not exists idx_past_results_comp on past_results(competition_id);

-- ── Practice / Timer ─────────────────────────────────────────────────────────
create table if not exists cube_sessions (
  id              uuid primary key default gen_random_uuid(),
  user_id         text not null references users(user_id) on delete cascade,
  name            text not null,
  puzzle_type     text not null,
  solve_count     integer default 0,
  best_single     integer,
  best_ao5        integer,
  ended_at        timestamptz,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  legacy_mongo_id text unique
);

create table if not exists solves (
  id              uuid primary key default gen_random_uuid(),
  user_id         text references users(user_id) on delete cascade,
  session_id      text,
  session_name    text,
  puzzle_type     text,
  time_ms         integer,
  scramble        text,
  status          text,
  notes           text,
  is_pb           boolean default false,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  legacy_mongo_id text unique
);
create index if not exists idx_solves_user on solves(user_id);

create table if not exists daily_challenges (
  id              uuid primary key default gen_random_uuid(),
  date            text unique not null,
  puzzle_type     text not null,
  scramble        text not null,
  created_at      timestamptz default now(),
  legacy_mongo_id text unique
);

create table if not exists daily_challenge_entries (
  id              uuid primary key default gen_random_uuid(),
  challenge_id    uuid references daily_challenges(id) on delete cascade,  -- remapped during port
  date            text,
  user_id         text references users(user_id) on delete cascade,
  user_name       text,
  time_ms         integer,
  status          text default 'OK' check (status in ('OK','+2','DNF')),
  submitted_at    timestamptz default now(),
  legacy_mongo_id text unique,
  unique (challenge_id, user_id)
);

-- ── Cube ecosystem & economy ──────────────────────────────────────────────────
create table if not exists problems (
  id                 uuid primary key default gen_random_uuid(),
  problem_id         text unique not null,
  mode               text default 'practice' check (mode in ('daily','archived','practice')),
  puzzle_type        text not null,
  scramble           text not null,
  step_limit         integer default 0,
  optimal_move_count integer default 0,
  difficulty         text default 'medium' check (difficulty in ('easy','medium','hard','expert')),
  base_points        integer default 100,
  hints              jsonb default '[]'::jsonb,
  solutions          jsonb default '{}'::jsonb,
  active_date        text,
  archived_at        timestamptz,
  stats              jsonb default '{}'::jsonb,
  active             boolean default true,
  created_at         timestamptz default now(),
  updated_at         timestamptz default now(),
  legacy_mongo_id    text unique
);

create table if not exists user_submissions (
  id               uuid primary key default gen_random_uuid(),
  problem_id       text not null references problems(problem_id) on delete cascade,
  user_id          text not null references users(user_id) on delete cascade,
  date             text,
  status           text default 'in_progress' check (status in ('in_progress','solved','over_limit','dnf')),
  hints_used       integer default 0,
  hints_revealed   jsonb default '[]'::jsonb,
  penalty_percent  integer default 0,
  hints_locked     boolean default false,
  last_hint_at     timestamptz,
  best_solution    text,
  best_move_count  integer,
  best_time_ms     integer,
  within_step_limit boolean,
  final_score      integer,
  points_awarded   integer,
  solved_at        timestamptz,
  attempts         jsonb default '[]'::jsonb,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now(),
  legacy_mongo_id  text unique,
  unique (problem_id, user_id)
);

create table if not exists point_transactions (
  id              uuid primary key default gen_random_uuid(),
  user_id         text not null references users(user_id) on delete cascade,
  amount          integer not null,
  reason          text not null,
  ref_type        text,
  ref_id          text,
  balance_after   integer not null,
  note            text,
  created_at      timestamptz default now(),
  legacy_mongo_id text unique
);
create index if not exists idx_point_tx_user on point_transactions(user_id, created_at desc);

create table if not exists shop_items (
  id              uuid primary key default gen_random_uuid(),
  item_id         text unique not null,
  name            text not null,
  description     text,
  image_url       text,
  category        text not null check (category in ('digital','physical')),
  kind            text not null check (kind in ('streak_freeze','premium_days','coupon','merch','cube')),
  price_points    integer not null,
  payload         jsonb,
  stock           integer,
  active          boolean default true,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  legacy_mongo_id text unique
);

create table if not exists shop_orders (
  id              uuid primary key default gen_random_uuid(),
  order_id        text unique not null,
  user_id         text not null references users(user_id) on delete cascade,
  item_id         text references shop_items(item_id) on delete set null,
  kind            text,
  price_points    integer,
  status          text default 'pending' check (status in ('completed','pending','shipped','cancelled','refunded')),
  fulfillment     jsonb,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  legacy_mongo_id text unique
);

create table if not exists fun_facts (
  id              uuid primary key default gen_random_uuid(),
  text            text not null,
  category        text,
  active          boolean default true,
  created_at      timestamptz default now(),
  legacy_mongo_id text unique
);

-- ── Content / Ops ─────────────────────────────────────────────────────────────
create table if not exists site_configs (
  id              uuid primary key default gen_random_uuid(),
  key             text unique not null,
  value           jsonb,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  legacy_mongo_id text unique
);

create table if not exists blogs (
  id              uuid primary key default gen_random_uuid(),
  legacy_id       text,
  image           text,
  title           text not null,
  body            text,
  link            text,
  display         boolean default true,
  author          text,
  date            text,
  position        integer default 0,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  legacy_mongo_id text unique
);

create table if not exists carousels (
  id              uuid primary key default gen_random_uuid(),
  legacy_id       text,
  image           text,
  link            text,
  colour          text default 'white',
  position        text default 'left',
  text            text default '{}',
  key             integer default 0,
  display         boolean default true,
  mobile_carousel boolean default false,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  legacy_mongo_id text unique
);

create table if not exists audit_logs (
  id              uuid primary key default gen_random_uuid(),
  admin_id        text,
  admin_name      text,
  admin_email     text,
  action          text not null,
  target          text,
  reason          text,
  meta            jsonb,
  created_at      timestamptz default now(),
  legacy_mongo_id text unique
);
create index if not exists idx_audit_created on audit_logs(created_at desc);

create table if not exists notifications (
  id              uuid primary key default gen_random_uuid(),
  user_id         text not null references users(user_id) on delete cascade,
  type            text default 'info',
  title           text not null,
  body            text,
  link            text,
  read            boolean default false,
  created_at      timestamptz default now(),
  legacy_mongo_id text unique
);
create index if not exists idx_notif_user on notifications(user_id, created_at desc);

create table if not exists partial_admins (
  id              uuid primary key default gen_random_uuid(),
  user_id         text unique references users(user_id) on delete cascade,
  competition_ids jsonb default '[]'::jsonb,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  legacy_mongo_id text unique
);

-- ── Zero-data-loss failsafe ─────────────────────────────────────────────────
-- Records Mongo fields the schema doesn't map (extra_fields) and any rows that
-- failed to insert (validation_error). full_document preserves the ENTIRE
-- original document so nothing is ever lost — admins resolve these manually.
create table if not exists migration_anomalies (
  id                uuid primary key default gen_random_uuid(),
  source_collection text not null,
  source_mongo_id   text,
  anomaly_type      text not null check (anomaly_type in ('extra_fields','validation_error')),
  extra_fields      jsonb,
  error_message     text,
  full_document     jsonb not null,
  resolved          boolean default false,
  resolved_by       text,
  resolved_at       timestamptz,
  created_at        timestamptz default now()
);
create index if not exists idx_anomalies_unresolved on migration_anomalies(resolved, created_at desc);
create index if not exists idx_anomalies_collection on migration_anomalies(source_collection);
