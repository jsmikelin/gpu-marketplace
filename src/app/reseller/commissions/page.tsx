import { createClient } from '@/lib/supabase/server'
import { StatCard } from '@/components/ui/stat-card'
import { Badge } from '@/components/ui/badge'
import { formatDateTime, formatMoney } from '@/lib/utils'

export default async function ResellerCommissionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [
    { data: reseller },
    { data: transactions },
  ] = await Promise.all([
    supabase.from('resellers').select('commission_rate, total_commission, total_orders, customer_count').eq('id', user.id).single(),
    supabase.from('transactions')
      .select('*')
      .eq('profile_id', user.id)
      .eq('type', 'commission')
      .order('created_at', { ascending: false })
      .limit(100),
  ])

  const pending = (transactions ?? []).filter((t: Record<string, unknown>) => t.status === 'pending').reduce((s: number, t: Record<string, unknown>) => s + (t.amount as number), 0)
  const paid = (transactions ?? []).filter((t: Record<string, unknown>) => t.status === 'completed').reduce((s: number, t: Record<string, unknown>) => s + (t.amount as number), 0)

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Commissions</h1>
        <p className="text-sm text-gray-500 mt-1">Your earnings from customer orders</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Commission Rate" value={`${reseller?.commission_rate ?? 10}%`} icon="📊" />
        <StatCard label="Total Earned" value={formatMoney(reseller?.total_commission ?? 0)} icon="💰" color="text-green-600" />
        <StatCard label="Paid Out" value={formatMoney(paid)} icon="✅" />
        <StatCard label="Pending Payout" value={formatMoney(pending)} icon="⏳" color={pending > 0 ? 'text-yellow-600' : 'text-gray-900'} />
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold">Commission History</h2>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="table-th">Date</th>
              <th className="table-th">Amount</th>
              <th className="table-th">Status</th>
              <th className="table-th">Reference</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 text-sm">
            {(transactions ?? []).length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-gray-400">
                  No commissions yet. Share your referral link to start earning.
                </td>
              </tr>
            )}
            {(transactions ?? []).map((t: Record<string, unknown>) => (
              <tr key={t.id as string} className="hover:bg-gray-50">
                <td className="table-td text-xs text-gray-500">{formatDateTime(t.created_at as string)}</td>
                <td className="table-td font-semibold text-green-600">+{formatMoney(t.amount as number, t.currency as string)}</td>
                <td className="table-td"><Badge status={t.status as string} /></td>
                <td className="table-td text-xs text-gray-400">{(t.description as string) ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-sm text-gray-400">
        Commissions are paid out monthly. Contact <a href="mailto:support@yangtzecompute.com" className="text-green-600 hover:underline">support@yangtzecompute.com</a> for payout requests.
      </div>
    </div>
  )
}
