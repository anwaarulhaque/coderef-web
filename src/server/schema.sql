-- CodeRef accounts. Idempotent: safe to run on every deploy (npm run api:migrate).

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now(),
  last_login_at timestamptz,
  dodo_customer_id text,
  subscription_id text,
  subscription_status text,
  subscription_plan text,
  pro_until timestamptz,
  lifetime boolean not null default false,
  lifetime_payment_id text
);

create table if not exists login_codes (
  email text primary key,
  code_hash text not null,
  expires_at timestamptz not null,
  attempts int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists sessions (
  token_hash text primary key,
  user_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  user_agent text
);
create index if not exists sessions_user_idx on sessions (user_id);

create table if not exists items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  kind text not null,
  title text not null,
  data jsonb not null,
  share_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists items_user_kind_idx on items (user_id, kind, updated_at desc);

create table if not exists rate_limits (
  key text not null,
  window_start timestamptz not null,
  count int not null default 0,
  primary key (key, window_start)
);

create table if not exists webhook_events (
  id text primary key,
  type text,
  received_at timestamptz not null default now(),
  payload jsonb,
  processed boolean not null default false,
  error text
);

-- Dodo product ids per mode and plan. Written by `npm run dodo:setup` when it creates the products; read by the app
-- (src/server/products.ts), so a new product needs no code change or redeploy. dodo-products.json is the fallback.
create table if not exists dodo_products (
  mode text not null,
  plan text not null,
  product_id text not null,
  updated_at timestamptz not null default now(),
  primary key (mode, plan)
);

-- Admin panel (/admin). Separate from customer accounts but the same passwordless idea: staff sign in with an emailed
-- one-time code, and only addresses listed here can get one. The only superadmin is config.admin.superadminEmail
-- (seeded by `npm run admin:seed`); employees are added by the superadmin.
create table if not exists admins (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text not null default '',
  role text not null default 'employee' check (role in ('superadmin', 'employee')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  last_login_at timestamptz
);
alter table admins drop column if exists password_hash;

create table if not exists admin_login_codes (
  email text primary key,
  code_hash text not null,
  expires_at timestamptz not null,
  attempts int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists admin_sessions (
  token_hash text primary key,
  admin_id uuid not null references admins(id) on delete cascade,
  expires_at timestamptz not null,
  user_agent text
);

-- Refund requests from /account/subscription/ (one per payment). Support gets an email at support@coderef.xyz and the
-- request shows in the admin panel; the money itself is refunded in the Dodo dashboard, whose refund.succeeded webhook
-- marks the request refunded.
create table if not exists refund_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  email text not null,
  payment_id text not null unique,
  reason text not null default '',
  status text not null default 'pending' check (status in ('pending', 'refunded', 'declined')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by text
);
