-- Tenancy
create table if not exists tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text,
  created_at timestamptz not null default now()
);

create table if not exists tenant_users (
  tenant_id uuid not null references tenants(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  role text not null check (role in ('owner','staff','reseller','admin')),
  created_at timestamptz not null default now(),
  primary key (tenant_id, user_id)
);

-- Customers
create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  full_name text,
  phone text,
  email text,
  created_at timestamptz not null default now()
);

-- Appointments
create table if not exists appointments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  customer_id uuid references customers(id) on delete set null,
  staff_id uuid,
  service_id uuid,
  start_ts timestamptz not null,
  end_ts timestamptz not null,
  status text not null check (status in ('booked','confirmed','canceled','completed','no_show')),
  source text not null default 'manual',
  external_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_appt_tenant_start on appointments(tenant_id, start_ts);
create index if not exists idx_appt_status on appointments(status);

-- Waitlist
create table if not exists waitlist_entries (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  customer_id uuid references customers(id) on delete set null,
  desired_service_id uuid,
  preferred_staff_id uuid,
  earliest_ts timestamptz,
  latest_ts timestamptz,
  priority_score int not null default 0,
  status text not null default 'active' check (status in ('active','contacted','booked','expired')),
  created_at timestamptz not null default now()
);

create index if not exists idx_waitlist_active on waitlist_entries(tenant_id, status, priority_score desc);

-- Rules
create table if not exists automation_rules (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  rule_key text not null, -- e.g. reminder_24h, gap_fill
  enabled boolean not null default true,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (tenant_id, rule_key)
);

-- Jobs queue
create table if not exists jobs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  type text not null, -- reminder | gap_fill | rebook | follow_up
  run_at timestamptz not null,
  status text not null default 'queued' check (status in ('queued','running','succeeded','failed','dead')),
  attempts int not null default 0,
  locked_at timestamptz,
  locked_by text,
  payload jsonb not null default '{}'::jsonb,
  last_error text,
  created_at timestamptz not null default now()
);

create index if not exists idx_jobs_due on jobs(status, run_at);
create index if not exists idx_jobs_tenant on jobs(tenant_id, status, run_at);

create table if not exists job_attempts (
  id bigserial primary key,
  job_id uuid not null references jobs(id) on delete cascade,
  attempt_no int not null,
  status text not null check (status in ('started','succeeded','failed')),
  error text,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

-- Messages (placeholder, provider-agnostic)
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  channel text not null check (channel in ('sms','email')),
  "to" text not null,
  body text not null,
  provider_id text,
  status text not null default 'queued' check (status in ('queued','sent','failed')),
  created_at timestamptz not null default now()
);

-- Revenue attribution
create table if not exists revenue_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  type text not null check (type in ('recovered_booking','prevented_no_show','rebooked')),
  amount_cents int not null default 0,
  appointment_id uuid references appointments(id) on delete set null,
  job_id uuid references jobs(id) on delete set null,
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
