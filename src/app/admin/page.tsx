import { createAdminClient } from '@/lib/supabase/server'
import { StatCard } from '@/components/ui/stat-card'
import { Badge } from '@/components/ui/badge'
import { formatMoney, formatDateTime } from '@/lib/utils'

async function getStats() {
  const supabase = await createAdminClient()
  const [
    { count: totalOrders },
    { count: totalCustomers },
    { count: pendingSuppliers },
    { count: pendingResellers },
    { data: recentOrders },
    { data: revenue },
  ] = await Promise.all([
    supabase.from('orders').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'customer'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'supplier').eq('status', 'pending'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'reseller').eq('status', 'pending'),
    supabase.from('orders')
      .select('id, order_number, subtotal, status, created_at, profiles!customer_id(full_name, company)')
      .order('created_at', { ascending: false })
      .limit(10),
    supabase.from('orders')
      .select('platform_commission')
      .eq('status', 'completed'),
  ])

  const totalRevenue = (revenue ?? []).reduce((s: number, r: Record<string, number>) => s + (r.platform_commission ?? 0), 0)

  return {
    totalOrders: totalOrders ?? 0,
    totalCustomers: totalCustomers ?? 0,
    pendingApprovals: (pendingSuppliers ?? 0) + (pendingResellers ?? 0),
    totalRevenue,
    recentOrders: recentOrders ?? [],
  }
}

export default async function AdminDashboard() {
  const stats = await getStats()

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Platform Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Overview of YangtzeCompute marketplace</p>
      </div>

      {stats.pendingApprovals > 0 && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <div className="font-medium text-yellow-800">{stats.pendingApprovals} pending approvals</div>
            <div className="text-sm text-yellow-600">Review new supplier/reseller applications</div>
          </div>
          <div className="ml-auto flex gap-2">
            <a href="/admin/suppliers" className="text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-3 py-1.5 rounded-lg transition-colors">
              Suppliers →
            </a>
            <a href="/admin/resellers" className="text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-3 py-1.5 rounded-lg transition-colors">
              Resellers →
            </a>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Revenue" value={formatMoney(stats.totalRevenue)} icon="💰" color="text-green-600" />
        <StatCard label="Total Orders" value={stats.totalOrders.toLocaleString()} icon="📦" />
        <StatCard label="Customers" value={stats.totalCustomers.toLocaleString()} icon="👥" />
        <StatCard label="Pending Approvals" value={stats.pendingApprovals} icon="⏳" color={stats.pendingApprovals > 0 ? 'text-yellow-600' : 'text-gray-900'} />
      </div>

      {/* Recent Orders */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Recent Orders</h2>
          <a href="/admin/orders" className="text-sm text-green-600 hover:text-green-700">View all →</a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="table-th">Order #</th>
                <th className="table-th">Customer</th>
                <th className="table-th">Amount</th>
                <th className="table-th">Status</th>
                <th className="table-th">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {stats.recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400 text-sm">No orders yet</td>
                </tr>
              ) : (
                stats.recentOrders.map((o: Record<string, unknown>) => (
                  <tr key={o.id as string} className="hover:bg-gray-50">
                    <td className="table-td font-mono text-xs">{o.order_number as string}</td>
                    <td className="table-td">
                      {(() => {
                        const p = o.profiles as Record<string, string> | null
                        return p?.company ?? p?.full_name ?? '—'
                      })()}
                    </td>
                    <td className="table-td font-medium">{formatMoney(o.subtotal as number)}</td>
                    <td className="table-td"><Badge status={o.status as string} /></td>
                    <td className="table-td text-gray-500 text-xs">{formatDateTime(o.created_at as string)}</td>
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
