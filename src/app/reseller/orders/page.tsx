import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { formatDateTime, formatMoney } from '@/lib/utils'

export default async function ResellerOrdersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('orders')
    .select(`
      id, order_number, status, subtotal, reseller_commission, billing_type,
      duration_value, quantity, created_at,
      profiles!customer_id(full_name, company),
      products(name, gpu_model)
    `)
    .eq('reseller_id', user.id)
    .order('created_at', { ascending: false })

  const orders = (data ?? []) as Record<string, unknown>[]

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Customer Orders</h1>
        <p className="text-sm text-gray-500 mt-1">All orders placed by your customers</p>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="table-th">Order #</th>
              <th className="table-th">Customer</th>
              <th className="table-th">Product</th>
              <th className="table-th">Duration</th>
              <th className="table-th">Amount</th>
              <th className="table-th">My Commission</th>
              <th className="table-th">Status</th>
              <th className="table-th">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orders.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-400">No orders yet</td></tr>
            )}
            {orders.map((o) => {
              const cust = o.profiles as Record<string, string> | null
              const prod = o.products as Record<string, string> | null
              return (
                <tr key={o.id as string} className="hover:bg-gray-50">
                  <td className="table-td font-mono text-xs">{o.order_number as string}</td>
                  <td className="table-td text-sm">{cust?.company ?? cust?.full_name ?? '—'}</td>
                  <td className="table-td text-xs text-gray-500">{prod?.name ?? '—'}</td>
                  <td className="table-td text-xs text-gray-500">
                    {o.quantity as number}x {o.duration_value as number} {o.billing_type === 'monthly' ? 'mo' : 'hr'}
                  </td>
                  <td className="table-td font-medium">{formatMoney(o.subtotal as number)}</td>
                  <td className="table-td font-semibold text-green-600">{formatMoney(o.reseller_commission as number)}</td>
                  <td className="table-td"><Badge status={o.status as string} /></td>
                  <td className="table-td text-xs text-gray-400">{formatDateTime(o.created_at as string)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
