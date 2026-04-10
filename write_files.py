"""Write all source files for GPU marketplace."""
import os

BASE = "C:/Users/Administrator/gpu-marketplace/src"

def write(path, content):
    full = os.path.join(BASE, path).replace("\\", "/")
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"  OK: {path}")

# =========================================================
# types/index.ts
# =========================================================
write("types/index.ts", """\
export type Role = 'admin' | 'customer' | 'supplier' | 'reseller'
export type Status = 'active' | 'suspended' | 'pending'
export type OrderStatus =
  | 'pending_payment' | 'paid' | 'processing'
  | 'active' | 'completed' | 'cancelled' | 'refunded' | 'disputed'
export type BillingType = 'hourly' | 'monthly'

export interface Profile {
  id: string
  role: Role
  full_name: string | null
  company: string | null
  country: string | null
  phone: string | null
  status: Status
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Supplier {
  id: string
  commission_rate: number
  payment_method: string | null
  payment_details: Record<string, string> | null
  approved_at: string | null
  approved_by: string | null
  rejection_reason: string | null
  total_revenue: number
  total_orders: number
  notes: string | null
  profile?: Profile
}

export interface Reseller {
  id: string
  commission_rate: number
  referral_code: string
  approved_at: string | null
  approved_by: string | null
  rejection_reason: string | null
  total_commission: number
  total_orders: number
  customer_count: number
  notes: string | null
  profile?: Profile
}

export interface Customer {
  id: string
  reseller_id: string | null
  use_case: string | null
  total_spent: number
  total_orders: number
  credit_balance: number
  kyc_status: 'none' | 'pending' | 'verified' | 'rejected'
  notes: string | null
  profile?: Profile
  reseller?: Profile
}

export interface Product {
  id: string
  supplier_id: string
  name: string
  gpu_model: string
  gpu_count: number
  vram_gb: number | null
  vcpus: number | null
  ram_gb: number | null
  storage_tb: number | null
  location: string
  region_code: string | null
  price_hourly: number
  price_monthly: number | null
  available_units: number
  status: 'active' | 'inactive' | 'draft'
  description: string | null
  tags: string[] | null
  created_at: string
  updated_at: string
  supplier?: { full_name: string | null; company: string | null }
}

export interface Order {
  id: string
  order_number: string
  customer_id: string
  product_id: string
  supplier_id: string
  reseller_id: string | null
  quantity: number
  billing_type: BillingType
  duration_value: number
  unit_price: number
  subtotal: number
  platform_commission_rate: number
  platform_commission: number
  reseller_commission_rate: number
  reseller_commission: number
  supplier_payout: number
  status: OrderStatus
  stripe_session_id: string | null
  stripe_payment_intent_id: string | null
  paid_at: string | null
  started_at: string | null
  expires_at: string | null
  completed_at: string | null
  cancelled_at: string | null
  cancel_reason: string | null
  admin_notes: string | null
  created_at: string
  product?: Product
  customer?: Profile
  supplier?: Profile
  reseller?: Profile
}

export interface OrderCredential {
  id: string
  order_id: string
  credential_type: 'ssh' | 'api_key' | 'console' | 'vpn' | 'other'
  host: string | null
  port: number | null
  username: string | null
  password: string | null
  api_key: string | null
  console_url: string | null
  extra_info: Record<string, string> | null
  delivered_at: string
}

export interface Transaction {
  id: string
  order_id: string | null
  profile_id: string
  type: 'payment' | 'payout' | 'refund' | 'commission' | 'credit'
  amount: number
  currency: string
  status: 'pending' | 'completed' | 'failed'
  stripe_id: string | null
  description: string | null
  created_at: string
}

export interface DashboardStats {
  totalRevenue: number
  totalOrders: number
  activeOrders: number
  pendingApprovals: number
  totalSuppliers: number
  totalResellers: number
  totalCustomers: number
  revenueThisMonth: number
}
""")

# =========================================================
# lib files
# =========================================================
write("lib/supabase/client.ts", """\
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
""")

write("lib/supabase/server.ts", """\
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(list) {
          try { list.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch {}
        },
      },
    }
  )
}

export async function createAdminClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(list) {
          try { list.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch {}
        },
      },
    }
  )
}
""")

write("lib/stripe.ts", """\
import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia' as never,
})

export const formatAmount = (amount: number, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
""")

write("lib/utils.ts", """\
import { clsx, type ClassValue } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatDate(d: string | Date) {
  return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(d))
}

export function formatDateTime(d: string | Date) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(new Date(d))
}

export function formatMoney(n: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n)
}

export const STATUS_COLORS: Record<string, string> = {
  active:          'bg-green-100 text-green-800',
  pending:         'bg-yellow-100 text-yellow-800',
  suspended:       'bg-red-100 text-red-800',
  approved:        'bg-green-100 text-green-800',
  rejected:        'bg-red-100 text-red-800',
  paid:            'bg-blue-100 text-blue-800',
  processing:      'bg-purple-100 text-purple-800',
  completed:       'bg-gray-100 text-gray-700',
  cancelled:       'bg-red-100 text-red-800',
  refunded:        'bg-orange-100 text-orange-800',
  pending_payment: 'bg-yellow-100 text-yellow-800',
  disputed:        'bg-red-100 text-red-800',
  draft:           'bg-gray-100 text-gray-600',
  inactive:        'bg-gray-100 text-gray-600',
  none:            'bg-gray-100 text-gray-600',
  verified:        'bg-green-100 text-green-800',
  open:            'bg-blue-100 text-blue-800',
  in_progress:     'bg-purple-100 text-purple-800',
  resolved:        'bg-green-100 text-green-800',
  closed:          'bg-gray-100 text-gray-600',
}
""")

# =========================================================
# globals.css
# =========================================================
write("app/globals.css", """\
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body { @apply bg-gray-50 text-gray-900 antialiased; }
}

@layer components {
  .btn-primary   { @apply bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed; }
  .btn-secondary { @apply bg-white hover:bg-gray-50 text-gray-700 font-medium px-4 py-2 rounded-lg border border-gray-300 transition-colors disabled:opacity-50; }
  .btn-danger    { @apply bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2 rounded-lg transition-colors; }
  .btn-warning   { @apply bg-yellow-500 hover:bg-yellow-600 text-white font-medium px-4 py-2 rounded-lg transition-colors; }
  .card          { @apply bg-white rounded-xl border border-gray-200 shadow-sm; }
  .input         { @apply w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent; }
  .label         { @apply block text-sm font-medium text-gray-700 mb-1; }
  .badge         { @apply inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize; }
  .table-th      { @apply px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider; }
  .table-td      { @apply px-4 py-3 text-sm text-gray-900; }
  .sidebar-link  { @apply flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors; }
  .sidebar-link-active   { @apply bg-green-50 text-green-700; }
  .sidebar-link-inactive { @apply text-gray-600 hover:bg-gray-100 hover:text-gray-900; }
}
""")

# =========================================================
# Root layout
# =========================================================
write("app/layout.tsx", """\
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'YangtzeCompute | GPU Cloud Marketplace',
  description: 'Enterprise GPU compute on demand. Flexible hourly and monthly plans.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
""")

# =========================================================
# COMPONENTS — Badge
# =========================================================
write("components/ui/badge.tsx", """\
import { STATUS_COLORS } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface BadgeProps {
  status: string
  label?: string
  className?: string
}

export function Badge({ status, label, className }: BadgeProps) {
  return (
    <span className={cn('badge', STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-700', className)}>
      {label ?? status.replace(/_/g, ' ')}
    </span>
  )
}
""")

# =========================================================
# COMPONENTS — StatCard
# =========================================================
write("components/ui/stat-card.tsx", """\
interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  icon?: string
  color?: string
}

export function StatCard({ label, value, sub, icon, color = 'text-gray-900' }: StatCardProps) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-500">{label}</span>
        {icon && <span className="text-xl">{icon}</span>}
      </div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
    </div>
  )
}
""")

# =========================================================
# COMPONENTS — DataTable
# =========================================================
write("components/ui/data-table.tsx", """\
'use client'
import { useState } from 'react'

interface Column<T> {
  key: string
  label: string
  render?: (row: T) => React.ReactNode
  sortable?: boolean
}

interface DataTableProps<T extends Record<string, unknown>> {
  columns: Column<T>[]
  data: T[]
  searchKeys?: string[]
  emptyMessage?: string
}

export function DataTable<T extends Record<string, unknown>>({
  columns, data, searchKeys = [], emptyMessage = 'No data found',
}: DataTableProps<T>) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const PER_PAGE = 20

  const filtered = search
    ? data.filter((row) =>
        searchKeys.some((k) =>
          String(row[k] ?? '').toLowerCase().includes(search.toLowerCase())
        )
      )
    : data

  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  return (
    <div>
      {searchKeys.length > 0 && (
        <div className="mb-4">
          <input
            className="input max-w-xs"
            placeholder="Search..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className="table-th">{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {paged.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-gray-400">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paged.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50 transition-colors">
                  {columns.map((col) => (
                    <td key={col.key} className="table-td">
                      {col.render ? col.render(row) : String(row[col.key] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
          <span>Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length}</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-secondary py-1 px-3 disabled:opacity-40"
            >
              ← Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn-secondary py-1 px-3 disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
""")

# =========================================================
# COMPONENTS — Modal
# =========================================================
write("components/ui/modal.tsx", """\
'use client'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  footer?: React.ReactNode
}

export function Modal({ open, onClose, title, children, footer }: ModalProps) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>
        <div className="px-6 py-4">{children}</div>
        {footer && <div className="px-6 py-4 border-t flex justify-end gap-3">{footer}</div>}
      </div>
    </div>
  )
}
""")

# =========================================================
# COMPONENTS — AdminSidebar
# =========================================================
write("components/layout/admin-sidebar.tsx", """\
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: '📊' },
  { href: '/admin/suppliers', label: 'Suppliers', icon: '🏭' },
  { href: '/admin/resellers', label: 'Resellers', icon: '🤝' },
  { href: '/admin/customers', label: 'Customers', icon: '👥' },
  { href: '/admin/products', label: 'Products', icon: '🖥️' },
  { href: '/admin/orders', label: 'Orders', icon: '📦' },
  { href: '/admin/transactions', label: 'Transactions', icon: '💰' },
  { href: '/admin/tickets', label: 'Support Tickets', icon: '🎫' },
  { href: '/admin/settings', label: 'Settings', icon: '⚙️' },
]

export function AdminSidebar() {
  const pathname = usePathname()
  return (
    <aside className="w-60 bg-white border-r border-gray-200 flex flex-col min-h-screen">
      <div className="px-4 py-5 border-b border-gray-100">
        <div className="font-bold text-lg">⚡ YangtzeCompute</div>
        <div className="text-xs text-gray-500 mt-0.5">Admin Portal</div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map((item) => {
          const active = item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn('sidebar-link', active ? 'sidebar-link-active' : 'sidebar-link-inactive')}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
      <div className="px-3 py-4 border-t border-gray-100">
        <form action="/api/auth/signout" method="post">
          <button className="sidebar-link sidebar-link-inactive w-full text-left text-red-500 hover:bg-red-50">
            <span>🚪</span><span>Sign Out</span>
          </button>
        </form>
      </div>
    </aside>
  )
}
""")

# =========================================================
# COMPONENTS — SupplierSidebar
# =========================================================
write("components/layout/supplier-sidebar.tsx", """\
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/supplier', label: 'Dashboard', icon: '📊' },
  { href: '/supplier/products', label: 'My Products', icon: '🖥️' },
  { href: '/supplier/orders', label: 'Orders', icon: '📦' },
  { href: '/supplier/earnings', label: 'Earnings', icon: '💰' },
  { href: '/supplier/profile', label: 'Profile', icon: '👤' },
]

export function SupplierSidebar() {
  const pathname = usePathname()
  return (
    <aside className="w-60 bg-white border-r border-gray-200 flex flex-col min-h-screen">
      <div className="px-4 py-5 border-b border-gray-100">
        <div className="font-bold text-lg">⚡ YangtzeCompute</div>
        <div className="text-xs text-gray-500 mt-0.5">Supplier Portal</div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map((item) => {
          const active = item.href === '/supplier' ? pathname === '/supplier' : pathname.startsWith(item.href)
          return (
            <Link key={item.href} href={item.href}
              className={cn('sidebar-link', active ? 'sidebar-link-active' : 'sidebar-link-inactive')}>
              <span>{item.icon}</span><span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
      <div className="px-3 py-4 border-t">
        <form action="/api/auth/signout" method="post">
          <button className="sidebar-link sidebar-link-inactive w-full text-left text-red-500 hover:bg-red-50">
            <span>🚪</span><span>Sign Out</span>
          </button>
        </form>
      </div>
    </aside>
  )
}
""")

# =========================================================
# COMPONENTS — ResellerSidebar
# =========================================================
write("components/layout/reseller-sidebar.tsx", """\
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/reseller', label: 'Dashboard', icon: '📊' },
  { href: '/reseller/customers', label: 'My Customers', icon: '👥' },
  { href: '/reseller/orders', label: 'Orders', icon: '📦' },
  { href: '/reseller/commissions', label: 'Commissions', icon: '💰' },
  { href: '/reseller/invite', label: 'Invite Customers', icon: '📨' },
  { href: '/reseller/profile', label: 'Profile', icon: '👤' },
]

export function ResellerSidebar() {
  const pathname = usePathname()
  return (
    <aside className="w-60 bg-white border-r border-gray-200 flex flex-col min-h-screen">
      <div className="px-4 py-5 border-b border-gray-100">
        <div className="font-bold text-lg">⚡ YangtzeCompute</div>
        <div className="text-xs text-gray-500 mt-0.5">Reseller Portal</div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map((item) => {
          const active = item.href === '/reseller' ? pathname === '/reseller' : pathname.startsWith(item.href)
          return (
            <Link key={item.href} href={item.href}
              className={cn('sidebar-link', active ? 'sidebar-link-active' : 'sidebar-link-inactive')}>
              <span>{item.icon}</span><span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
      <div className="px-3 py-4 border-t">
        <form action="/api/auth/signout" method="post">
          <button className="sidebar-link sidebar-link-inactive w-full text-left text-red-500 hover:bg-red-50">
            <span>🚪</span><span>Sign Out</span>
          </button>
        </form>
      </div>
    </aside>
  )
}
""")

# =========================================================
# COMPONENTS — CustomerSidebar
# =========================================================
write("components/layout/customer-sidebar.tsx", """\
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/dashboard', label: 'Overview', icon: '📊' },
  { href: '/dashboard/orders', label: 'My Orders', icon: '📦' },
  { href: '/dashboard/billing', label: 'Billing', icon: '💳' },
  { href: '/dashboard/support', label: 'Support', icon: '🎫' },
  { href: '/dashboard/profile', label: 'Profile', icon: '👤' },
]

export function CustomerSidebar() {
  const pathname = usePathname()
  return (
    <aside className="w-60 bg-white border-r border-gray-200 flex flex-col min-h-screen">
      <div className="px-4 py-5 border-b border-gray-100">
        <div className="font-bold text-lg">⚡ YangtzeCompute</div>
        <div className="text-xs text-gray-500 mt-0.5">Customer Portal</div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map((item) => {
          const active = item.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(item.href)
          return (
            <Link key={item.href} href={item.href}
              className={cn('sidebar-link', active ? 'sidebar-link-active' : 'sidebar-link-inactive')}>
              <span>{item.icon}</span><span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
      <div className="px-3 py-4 border-t">
        <Link href="/" className="sidebar-link sidebar-link-inactive text-sm mb-1 block">
          <span>🌐</span><span>Back to Store</span>
        </Link>
        <form action="/api/auth/signout" method="post">
          <button className="sidebar-link sidebar-link-inactive w-full text-left text-red-500 hover:bg-red-50">
            <span>🚪</span><span>Sign Out</span>
          </button>
        </form>
      </div>
    </aside>
  )
}
""")

print("Components done.")
