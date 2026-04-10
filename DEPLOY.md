# YangtzeCompute — Deployment Guide

## Quick Start (Local Dev)

```bash
cd C:/Users/Administrator/gpu-marketplace
npm install
npm run dev
# Opens at http://localhost:3000
```

## Step 1: Set Up Supabase (Free)

1. Go to https://supabase.com → Create new project
2. Region: Pick nearest to your users (Singapore or Tokyo recommended)
3. Copy your project URL and API keys
4. Go to **SQL Editor** → Run `supabase/schema.sql` first
5. Then run `supabase/schema_resellers.sql`
6. Go to **Authentication** → Settings → Disable "Confirm email" for testing

## Step 2: Set Up Stripe (Required for Payments)

1. Sign up at https://stripe.com (use your HK company)
2. Dashboard → Developers → API Keys → Copy keys
3. Set up webhook:
   - Endpoint URL: `https://your-domain.com/api/stripe/webhook`
   - Events: `checkout.session.completed`
   - Copy webhook secret

## Step 3: Configure Environment Variables

Edit `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## Step 4: Create Admin Account

1. Register on your site → Role: Customer (default)
2. Go to Supabase Dashboard → Table Editor → `profiles`
3. Find your user → Change `role` to `admin`
4. Done — navigate to `/admin`

## Step 5: Deploy to Vercel (Free)

```bash
npm install -g vercel
vercel login
vercel --prod
```

Or connect GitHub repo at https://vercel.com/new

Add all `.env.local` variables to Vercel's Environment Variables.

## Step 6: Set Up Domain

1. Buy domain at Namecheap (~$10/yr) or Cloudflare
2. Add domain in Vercel → Project → Domains
3. Update `NEXT_PUBLIC_APP_URL` in Vercel env vars
4. Update Stripe webhook URL to production domain

## Business Operations

### Creating First Supplier
1. Supplier registers at `/auth/register?role=supplier`
2. You go to `/admin/suppliers` → Approve
3. Supplier logs in → Adds products at `/supplier/products`

### Creating First Reseller
1. Reseller registers at `/auth/register?role=reseller`
2. You go to `/admin/resellers` → Approve → Set commission %
3. Reseller shares their referral link
4. Their customers register → auto-linked

### Order Flow
1. Customer browses → clicks Deploy → Stripe checkout
2. Payment confirmed → webhook creates order
3. Supplier sees "Action Required" in `/supplier/orders`
4. Supplier uploads SSH/API credentials
5. Customer views credentials in `/dashboard/orders`

## Commission Settings

Default rates (adjust per supplier/reseller in admin):
- Platform commission from supplier: **20%**
- Reseller commission from platform: **10%**

Example: Customer pays $100
- Supplier payout: $80
- Platform keeps: $20
  - Reseller gets: $10 (from platform's $20)
  - Platform net: $10

## Test Stripe Payment

Card: `4242 4242 4242 4242`
Expiry: any future date
CVC: any 3 digits
