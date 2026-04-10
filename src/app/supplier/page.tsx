import { createClient } from '@/lib/supabase/server'
import { StatCard } from '@/components/ui/stat-card'
import { Badge } from '@/components/ui/badge'
import { formatMoney, formatDateTime } from '@/lib/utils'
import Link from 'next/link'

export default async function SupplierDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [
    { data: profile },
    { data: supplier },
    { data: recentOrders },
    { data: products },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('suppliers').select('*').eq('id', user.id).single(),
    supabase.from('orders')
      .select('id, order_number, status, subtotal, supplier_payout, created_at, profiles!customer_id(full_name, company), products(name)')
      .eq('supplier_id', user.id)
      .order('created_at', { ascending: false })
      .limit(8),
    supabase.from('products')
      .select('id, name, status, available_units, price_hourly')
      .eq('supplier_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const isApproved = profile?.status === 'active'

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Supplier Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Welcome back, {profile?.company ?? profile?.full_name}
        </p>
      </div>

      {!isApproved && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-xl p-5">
          <div className="font-semibold text-yellow-800 mb-1">⏳ Account Pending Approval</div>
          <div className="text-sm text-yellow-600">
            Your supplier account is under review. You will receive an email once approved (typically 1–2 business days).
            You can upload your resources now and they will go live after approval.
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Orders" value={supplier?.total_orders ?? 0} icon="📦" />
        <StatCard label="Total Revenue" value={formatMoney(supplier?.total_revenue ?? 0)} icon="💰" color="text-green-600" />
        <StatCard label="Commission Rate" value={`${supplier?.commission_rate ?? 20}%`} icon="📊" />
        <StatCard label="Active Products" value={(products ?? []).filter((p: Record<string, unknown>) => p.status === 'active').length} icon="🖥️" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
            <h2 className="font-semibold">Recent Orders</h2>
            <Link href="/supplier/orders" className="text-xs text-green-600 hover:text-green-700">View all →</Link>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-2 text-left">Order</th>
                <th className="px-4 py-2 text-left">Customer</th>
                <th className="px-4 py-2 text-left">Payout</th>
                <th className="px-4 py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm">
              {(recentOrders ?? []).length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">No orders yet</td></tr>
              ) : (
                (recentOrders ?? []).map((o: Record<string, unknown>) => {
                  const cust = o.profiles as Record<string, string> | null
                  return (
                    <tr key={o.id as string} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5 font-mono text-xs">{o.order_number as string}</td>
                      <td className="px-4 py-2.5">{cust?.company ?? cust?.full_name ?? '—'}</td>
                      <td className="px-4 py-2.5 text-green-600 font-medium">{formatMoney(o.supplier_payout as number)}</td>
                      <td className="px-4 py-2.5"><Badge status={o.status as string} /></td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Products */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
            <h2 className="font-semibold">My Products</h2>
            <Link href="/supplier/products" className="text-xs text-green-600 hover:text-green-700">Manage →</Link>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-2 text-left">Product</th>
                <th className="px-4 py-2 text-left">Price/hr</th>
                <th className="px-4 py-2 text-left">Units</th>
                <th className="px-4 py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm">
              {(products ?? []).length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                    No products yet.{' '}
                    <Link href="/supplier/products" className="text-green-600 hover:underline">Add your first →</Link>
                  </td>
                </tr>
              ) : (
                (products ?? []).map((p: Record<string, unknown>) => (
                  <tr key={p.id as string} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 font-medium">{p.name as string}</td>
                    <td className="px-4 py-2.5">{formatMoney(p.price_hourly as number)}</td>
                    <td className="px-4 py-2.5">
                      <span className={(p.available_units as number) > 0 ? 'text-green-600' : 'text-red-500'}>
                        {p.available_units as number}
                      </span>
                    </td>
                    <td className="px-4 py-2.5"><Badge status={p.status as string} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
