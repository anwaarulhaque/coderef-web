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

-- ---------------------------------------------------------------------------------------------------------------------
-- CodeRef Start (/start): personal and team start pages made of widgets. A separate product with its own billing
-- (start_subscriptions), so buying or cancelling it never touches CodeRef Pro's columns on users.
-- ---------------------------------------------------------------------------------------------------------------------
create table if not exists start_teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  owner_id uuid not null references users(id) on delete cascade,
  logo_url text,
  brand_color text,
  default_page_id uuid,
  seat_limit int not null default 10,
  allowed_domains text[] not null default '{}',
  announcement text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists start_team_members (
  team_id uuid not null references start_teams(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  role text not null default 'viewer' check (role in ('owner', 'admin', 'editor', 'viewer')),
  joined_at timestamptz not null default now(),
  primary key (team_id, user_id)
);
create index if not exists start_team_members_user_idx on start_team_members (user_id);

create table if not exists start_team_invites (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references start_teams(id) on delete cascade,
  email text not null,
  role text not null default 'viewer' check (role in ('admin', 'editor', 'viewer')),
  token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique (team_id, email)
);

create table if not exists start_pages (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references users(id) on delete cascade,
  team_id uuid references start_teams(id) on delete cascade,
  title text not null,
  icon text not null default '',
  position int not null default 0,
  theme jsonb not null default '{}',
  visibility text not null default 'private' check (visibility in ('private', 'team', 'public')),
  share_id text unique,
  password_hash text,
  is_template boolean not null default false,
  template_category text,
  template_description text not null default '',
  clone_count int not null default 0,
  views int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists start_pages_owner_idx on start_pages (owner_id, position);
create index if not exists start_pages_team_idx on start_pages (team_id, position);
create index if not exists start_pages_gallery_idx on start_pages (is_template, clone_count desc) where is_template;

create table if not exists start_widgets (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references start_pages(id) on delete cascade,
  type text not null,
  title text not null default '',
  col int not null default 0,
  position int not null default 0,
  collapsed boolean not null default false,
  color text not null default '',
  config jsonb not null default '{}',
  data jsonb not null default '{}',
  updated_at timestamptz not null default now()
);
create index if not exists start_widgets_page_idx on start_widgets (page_id, col, position);

-- One row per paid Start plan: a personal PRO (user_id) or a team plan (team_id).
create table if not exists start_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  team_id uuid references start_teams(id) on delete set null,
  plan text not null check (plan in ('start_pro_yearly', 'start_team_monthly', 'start_enterprise')),
  subscription_id text unique,
  status text not null default 'active',
  pro_until timestamptz,
  seats int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists start_subscriptions_user_idx on start_subscriptions (user_id);
create index if not exists start_subscriptions_team_idx on start_subscriptions (team_id);

-- Browser-extension access tokens (crt_…). Only the hash is stored.
create table if not exists start_tokens (
  token_hash text primary key,
  user_id uuid not null references users(id) on delete cascade,
  name text not null default 'Browser',
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);
create index if not exists start_tokens_user_idx on start_tokens (user_id);

-- Links saved from the extension before they are filed into a widget.
create table if not exists start_inbox (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  title text not null,
  url text not null,
  created_at timestamptz not null default now()
);
create index if not exists start_inbox_user_idx on start_inbox (user_id, created_at desc);

-- Team analytics: link clicks per page, widget and day. No user or IP is stored.
create table if not exists start_link_clicks (
  page_id uuid not null references start_pages(id) on delete cascade,
  widget_id uuid not null,
  url text not null,
  day date not null default current_date,
  count int not null default 0,
  primary key (page_id, widget_id, url, day)
);
