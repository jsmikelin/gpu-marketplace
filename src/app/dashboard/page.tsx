import { createClient } from '@/lib/supabase/server'
import { StatCard } from '@/components/ui/stat-card'
import { Badge } from '@/components/ui/badge'
import { formatMoney, formatDateTime } from '@/lib/utils'
import Link from 'next/link'

export default async function CustomerDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [
    { data: profile },
    { data: customer },
    { data: recentOrders },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('customers').select('*').eq('id', user.id).single(),
    supabase.from('orders')
      .select('id, order_number, status, subtotal, billing_type, duration_value, created_at, products(name, gpu_model, location)')
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const activeOrders = (recentOrders ?? []).filter((o: Record<string, unknown>) => o.status === 'active')

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">My Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Welcome back, {profile?.full_name ?? user.email}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Active Deployments" value={activeOrders.length} icon="⚡" color="text-green-600" />
        <StatCard label="Total Orders" value={customer?.total_orders ?? 0} icon="📦" />
        <StatCard label="Total Spent" value={formatMoney(customer?.total_spent ?? 0)} icon="💳" />
        <StatCard label="Account Balance" value={formatMoney(customer?.credit_balance ?? 0)} icon="💰" />
      </div>

      {/* Active Orders */}
      {activeOrders.length > 0 && (
        <div className="card overflow-hidden mb-6">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-green-700">⚡ Active Deployments</h2>
          </div>
          <table className="w-full">
            <thead className="bg-green-50 text-xs text-green-700 uppercase">
              <tr>
                <th className="px-4 py-2.5 text-left">Order #</th>
                <th className="px-4 py-2.5 text-left">Resource</th>
                <th className="px-4 py-2.5 text-left">Duration</th>
                <th className="px-4 py-2.5 text-left">Cost</th>
                <th className="px-4 py-2.5 text-left">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm">
              {activeOrders.map((o: Record<string, unknown>) => {
                const prod = o.products as Record<string, string> | null
                return (
                  <tr key={o.id as string} className="hover:bg-green-50/50">
                    <td className="px-4 py-2.5 font-mono text-xs">{o.order_number as string}</td>
                    <td className="px-4 py-2.5">
                      <div className="font-medium">{prod?.name ?? '—'}</div>
                      <div className="text-xs text-gray-400">{prod?.location}</div>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-500">
                      {o.duration_value as number} {o.billing_type === 'monthly' ? 'month(s)' : 'hour(s)'}
                    </td>
                    <td className="px-4 py-2.5 font-medium">{formatMoney(o.subtotal as number)}</td>
                    <td className="px-4 py-2.5">
                      <Link href={`/dashboard/orders`} className="text-xs text-green-600 hover:underline">View Credentials →</Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Recent Orders */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
          <h2 className="font-semibold">Recent Orders</h2>
          <Link href="/dashboard/orders" className="text-xs text-green-600">View all →</Link>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              <th className="px-4 py-2.5 text-left">Order #</th>
              <th className="px-4 py-2.5 text-left">Product</th>
              <th className="px-4 py-2.5 text-left">Amount</th>
              <th className="px-4 py-2.5 text-left">Status</th>
              <th className="px-4 py-2.5 text-left">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 text-sm">
            {(recentOrders ?? []).length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  No orders yet.{' '}
                  <Link href="/#products" className="text-green-600 hover:underline">Browse GPU resources →</Link>
                </td>
              </tr>
            ) : (
              (recentOrders ?? []).map((o: Record<string, unknown>) => {
                const prod = o.products as Record<string, string> | null
                return (
                  <tr key={o.id as string} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 font-mono text-xs">{o.order_number as string}</td>
                    <td className="px-4 py-2.5">{prod?.name ?? '—'}</td>
                    <td className="px-4 py-2.5 font-medium">{formatMoney(o.subtotal as number)}</td>
                    <td className="px-4 py-2.5"><Badge status={o.status as string} /></td>
                    <td className="px-4 py-2.5 text-xs text-gray-400">{formatDateTime(o.created_at as string)}</td>
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
