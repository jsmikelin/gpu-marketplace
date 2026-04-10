import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { formatDateTime, formatMoney } from '@/lib/utils'

export default async function BillingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [
    { data: customer },
    { data: transactions },
  ] = await Promise.all([
    supabase.from('customers').select('total_spent, credit_balance').eq('id', user.id).single(),
    supabase.from('transactions')
      .select('*')
      .eq('profile_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Billing</h1>
        <p className="text-sm text-gray-500 mt-1">Your transaction history</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="card p-5">
          <div className="text-sm text-gray-500 mb-1">Total Spent</div>
          <div className="text-2xl font-bold text-gray-900">{formatMoney(customer?.total_spent ?? 0)}</div>
        </div>
        <div className="card p-5">
          <div className="text-sm text-gray-500 mb-1">Credit Balance</div>
          <div className="text-2xl font-bold text-green-600">{formatMoney(customer?.credit_balance ?? 0)}</div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold">Transaction History</h2>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="table-th">Date</th>
              <th className="table-th">Type</th>
              <th className="table-th">Amount</th>
              <th className="table-th">Status</th>
              <th className="table-th">Description</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 text-sm">
            {(transactions ?? []).length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No transactions yet</td></tr>
            )}
            {(transactions ?? []).map((t: Record<string, unknown>) => (
              <tr key={t.id as string} className="hover:bg-gray-50">
                <td className="table-td text-xs text-gray-500">{formatDateTime(t.created_at as string)}</td>
                <td className="table-td">
                  <span className={`badge ${
                    t.type === 'payment' ? 'bg-blue-100 text-blue-800' :
                    t.type === 'refund' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-700'
                  }`}>{t.type as string}</span>
                </td>
                <td className={`table-td font-semibold ${t.type === 'refund' ? 'text-green-600' : 'text-red-600'}`}>
                  {t.type === 'refund' ? '+' : '−'}{formatMoney(t.amount as number, t.currency as string)}
                </td>
                <td className="table-td"><Badge status={t.status as string} /></td>
                <td className="table-td text-xs text-gray-500">{(t.description as string) ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
