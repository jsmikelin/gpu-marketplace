-- Additional schema: resellers table + helper functions
-- Run this AFTER the main schema.sql

-- ==========================================
-- RESELLERS TABLE
-- ==========================================
create table public.resellers (
  id uuid references public.profiles(id) on delete cascade primary key,
  commission_rate numeric(5,2) not null default 10.00,
  referral_code text unique not null default upper(substr(md5(random()::text), 1, 8)),
  approved_at timestamptz,
  approved_by uuid references public.profiles(id),
  rejection_reason text,
  total_commission numeric(12,2) default 0,
  total_orders int default 0,
  customer_count int default 0,
  notes text
);

-- Add reseller_id to customers
alter table public.customers add column if not exists reseller_id uuid references public.resellers(id);

-- Update orders table to support reseller + split commissions
alter table public.orders rename column commission_rate to platform_commission_rate;
alter table public.orders rename column commission_amount to platform_commission;
alter table public.orders add column if not exists reseller_id uuid references public.resellers(id);
alter table public.orders add column if not exists reseller_commission_rate numeric(5,2) not null default 0;
alter table public.orders add column if not exists reseller_commission numeric(12,2) not null default 0;

-- Add resellers role to profiles check (if using check constraint)
-- ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
-- ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
--   CHECK (role IN ('admin', 'customer', 'supplier', 'reseller'));

-- ==========================================
-- HELPER FUNCTIONS (called from webhook)
-- ==========================================

create or replace function public.increment_customer_stats(p_customer_id uuid, p_amount numeric)
returns void language plpgsql security definer as $$
begin
  update public.customers
  set total_spent = total_spent + p_amount,
      total_orders = total_orders + 1
  where id = p_customer_id;
end;
$$;

create or replace function public.increment_supplier_stats(p_supplier_id uuid, p_payout numeric)
returns void language plpgsql security definer as $$
begin
  update public.suppliers
  set total_revenue = total_revenue + p_payout,
      total_orders = total_orders + 1
  where id = p_supplier_id;
end;
$$;

create or replace function public.increment_reseller_stats(p_reseller_id uuid, p_commission numeric)
returns void language plpgsql security definer as $$
begin
  update public.resellers
  set total_commission = total_commission + p_commission,
      total_orders = total_orders + 1
  where id = p_reseller_id;
end;
$$;

create or replace function public.decrement_product_units(p_product_id uuid, p_quantity int)
returns void language plpgsql security definer as $$
begin
  update public.products
  set available_units = greatest(0, available_units - p_quantity)
  where id = p_product_id;
end;
$$;

-- Update handle_new_user to support reseller role
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  user_role text;
begin
  user_role := coalesce(new.raw_user_meta_data->>'role', 'customer');
  insert into public.profiles (id, full_name, role, company, country)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    user_role,
    new.raw_user_meta_data->>'company',
    new.raw_user_meta_data->>'country'
  )
  on conflict (id) do nothing;

  if user_role = 'supplier' then
    insert into public.suppliers (id) values (new.id) on conflict do nothing;
  elsif user_role = 'reseller' then
    insert into public.resellers (id) values (new.id) on conflict do nothing;
    -- Handle referral: link customers to reseller based on ref_code
  else
    insert into public.customers (id) values (new.id) on conflict do nothing;
    -- If referred, find reseller by referral code
    if new.raw_user_meta_data->>'ref_code' is not null then
      update public.customers
      set reseller_id = (
        select id from public.resellers
        where referral_code = upper(new.raw_user_meta_data->>'ref_code')
        limit 1
      )
      where id = new.id;
      -- Increment reseller customer count
      update public.resellers
      set customer_count = customer_count + 1
      where referral_code = upper(new.raw_user_meta_data->>'ref_code');
    end if;
  end if;

  return new;
end;
$$;

-- RLS for resellers
alter table public.resellers enable row level security;
create policy reseller_own on public.resellers for all using (id = auth.uid());
create policy reseller_admin on public.resellers for all using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);
