import { createClient } from '@/lib/supabase/server'
import { StatCard } from '@/components/ui/stat-card'
import { Badge } from '@/components/ui/badge'
import { formatMoney, formatDateTime } from '@/lib/utils'
import Link from 'next/link'

export default async function ResellerDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [
    { data: profile },
    { data: reseller },
    { data: recentOrders },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('resellers').select('*').eq('id', user.id).single(),
    supabase.from('orders')
      .select('id, order_number, status, subtotal, reseller_commission, created_at, profiles!customer_id(full_name, company)')
      .eq('reseller_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  const isApproved = profile?.status === 'active'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const referralLink = `${appUrl}/auth/register?ref=${reseller?.referral_code ?? ''}`

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Reseller Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Welcome back, {profile?.company ?? profile?.full_name}
        </p>
      </div>

      {!isApproved && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-xl p-5">
          <div className="font-semibold text-yellow-800 mb-1">⏳ Account Pending Approval</div>
          <div className="text-sm text-yellow-600">
            Your reseller account is under review. Once approved, you can start earning commissions.
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="My Customers" value={reseller?.customer_count ?? 0} icon="👥" />
        <StatCard label="Total Orders" value={reseller?.total_orders ?? 0} icon="📦" />
        <StatCard label="Commission Earned" value={formatMoney(reseller?.total_commission ?? 0)} icon="💰" color="text-green-600" />
        <StatCard label="My Commission Rate" value={`${reseller?.commission_rate ?? 10}%`} icon="📊" />
      </div>

      {/* Referral link */}
      {isApproved && reseller?.referral_code && (
        <div className="card p-5 mb-6">
          <h3 className="font-semibold mb-2">📨 Your Referral Link</h3>
          <p className="text-sm text-gray-500 mb-3">Share this link to invite customers — you earn {reseller.commission_rate}% commission on all their orders.</p>
          <div className="flex gap-2">
            <input
              readOnly
              value={referralLink}
              className="input flex-1 font-mono text-xs bg-gray-50"
            />
            <button
              onClick={() => navigator.clipboard.writeText(referralLink)}
              className="btn-secondary px-4 text-sm"
            >
              Copy
            </button>
          </div>
          <div className="mt-2 text-xs text-gray-400">
            Referral code: <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded">{reseller.referral_code}</span>
          </div>
        </div>
      )}

      {/* Recent Orders */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
          <h2 className="font-semibold">Recent Customer Orders</h2>
          <Link href="/reseller/orders" className="text-xs text-green-600">View all →</Link>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              <th className="px-4 py-2.5 text-left">Order #</th>
              <th className="px-4 py-2.5 text-left">Customer</th>
              <th className="px-4 py-2.5 text-left">Amount</th>
              <th className="px-4 py-2.5 text-left">My Commission</th>
              <th className="px-4 py-2.5 text-left">Status</th>
              <th className="px-4 py-2.5 text-left">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 text-sm">
            {(recentOrders ?? []).length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  No orders yet. Share your referral link to get started.
                </td>
              </tr>
            ) : (
              (recentOrders ?? []).map((o: Record<string, unknown>) => {
                const cust = o.profiles as Record<string, string> | null
                return (
                  <tr key={o.id as string} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 font-mono text-xs">{o.order_number as string}</td>
                    <td className="px-4 py-2.5">{cust?.company ?? cust?.full_name ?? '—'}</td>
                    <td className="px-4 py-2.5 font-medium">{formatMoney(o.subtotal as number)}</td>
                    <td className="px-4 py-2.5 text-green-600 font-medium">{formatMoney(o.reseller_commission as number)}</td>
                    <td className="px-4 py-2.5"><Badge status={o.status as string} /></td>
                    <td className="px-4 py-2.5 text-gray-400 text-xs">{formatDateTime(o.created_at as string)}</td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
