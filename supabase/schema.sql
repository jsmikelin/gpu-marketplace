-- Yangtze International GPU Marketplace
create extension if not exists "uuid-ossp";

create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  role text not null default 'customer',
  full_name text, company text, country text, phone text,
  status text not null default 'active',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.suppliers (
  id uuid references public.profiles(id) on delete cascade primary key,
  commission_rate numeric(5,2) not null default 20.00,
  payment_method text, payment_details jsonb,
  approved_at timestamptz, approved_by uuid references public.profiles(id),
  rejection_reason text, total_revenue numeric(12,2) default 0,
  total_orders int default 0, notes text
);

create table public.customers (
  id uuid references public.profiles(id) on delete cascade primary key,
  use_case text, total_spent numeric(12,2) default 0,
  total_orders int default 0, credit_balance numeric(12,2) default 0,
  kyc_status text default 'none', notes text
);

create table public.products (
  id uuid default uuid_generate_v4() primary key,
  supplier_id uuid references public.profiles(id) on delete cascade not null,
  name text not null, gpu_model text not null, gpu_count int not null default 1,
  vram_gb int, vcpus int, ram_gb int, storage_tb numeric(6,2),
  location text not null, region_code text,
  price_hourly numeric(10,4) not null, price_monthly numeric(10,2),
  available_units int not null default 0,
  status text not null default 'active',
  description text, tags text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.orders (
  id uuid default uuid_generate_v4() primary key,
  order_number text unique not null,
  customer_id uuid references public.profiles(id) not null,
  product_id uuid references public.products(id) not null,
  supplier_id uuid references public.profiles(id) not null,
  quantity int not null default 1, billing_type text not null,
  duration_value int not null, unit_price numeric(10,4) not null,
  subtotal numeric(12,2) not null, commission_rate numeric(5,2) not null,
  commission_amount numeric(12,2) not null, supplier_payout numeric(12,2) not null,
  status text not null default 'pending_payment',
  stripe_session_id text, stripe_payment_intent_id text,
  paid_at timestamptz, started_at timestamptz,
  expires_at timestamptz, completed_at timestamptz,
  cancelled_at timestamptz, cancel_reason text, admin_notes text,
  created_at timestamptz not null default now()
);

create table public.order_credentials (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references public.orders(id) on delete cascade not null,
  credential_type text not null, host text, port int, username text, password text,
  api_key text, console_url text, extra_info jsonb,
  delivered_at timestamptz not null default now(),
  delivered_by uuid references public.profiles(id)
);

create table public.transactions (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references public.orders(id),
  profile_id uuid references public.profiles(id) not null,
  type text not null, amount numeric(12,2) not null,
  currency text not null default 'USD',
  status text not null default 'pending',
  stripe_id text, description text,
  created_at timestamptz not null default now()
);

create table public.support_tickets (
  id uuid default uuid_generate_v4() primary key,
  customer_id uuid references public.profiles(id) not null,
  order_id uuid references public.orders(id),
  subject text not null, message text not null,
  status text not null default 'open',
  priority text not null default 'normal',
  resolved_at timestamptz, created_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid default uuid_generate_v4() primary key,
  admin_id uuid references public.profiles(id),
  action text not null, target_type text, target_id uuid,
  old_data jsonb, new_data jsonb, ip_address text,
  created_at timestamptz not null default now()
);

-- RLS
alter table public.profiles enable row level security;
alter table public.suppliers enable row level security;
alter table public.customers enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_credentials enable row level security;
alter table public.transactions enable row level security;
alter table public.support_tickets enable row level security;
alter table public.audit_logs enable row level security;

create policy own_profile on public.profiles for select using (auth.uid() = id);
create policy update_own on public.profiles for update using (auth.uid() = id);
create policy products_read on public.products for select using (status = 'active');
create policy products_own on public.products for all using (supplier_id = auth.uid());
create policy orders_cust on public.orders for select using (customer_id = auth.uid());
create policy orders_supp on public.orders for select using (supplier_id = auth.uid());
create policy orders_ins on public.orders for insert with check (customer_id = auth.uid());
create policy creds_cust on public.order_credentials for select using (
  exists (select 1 from public.orders o where o.id = order_id and o.customer_id = auth.uid())
);
create policy txn_own on public.transactions for select using (profile_id = auth.uid());
create policy ticket_own on public.support_tickets for select using (customer_id = auth.uid());
create policy ticket_ins on public.support_tickets for insert with check (customer_id = auth.uid());