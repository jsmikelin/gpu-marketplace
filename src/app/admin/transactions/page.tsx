import { createAdminClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { formatDateTime, formatMoney } from '@/lib/utils'

export default async function AdminTransactionsPage() {
  const supabase = await createAdminClient()
  const { data } = await supabase
    .from('transactions')
    .select('*, profiles(full_name, company, role)')
    .order('created_at', { ascending: false })
    .limit(200)

  const rows = (data ?? []) as Record<string, unknown>[]

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Transactions</h1>
        <p className="text-sm text-gray-500 mt-1">Full financial ledger</p>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="table-th">Date</th>
              <th className="table-th">Account</th>
              <th className="table-th">Role</th>
              <th className="table-th">Type</th>
              <th className="table-th">Amount</th>
              <th className="table-th">Currency</th>
              <th className="table-th">Status</th>
              <th className="table-th">Description</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-400">No transactions yet</td></tr>
            )}
            {rows.map((r) => {
              const p = r.profiles as Record<string, string> | null
              return (
                <tr key={r.id as string} className="hover:bg-gray-50">
                  <td className="table-td text-xs text-gray-500">{formatDateTime(r.created_at as string)}</td>
                  <td className="table-td text-sm">{p?.company ?? p?.full_name ?? '—'}</td>
                  <td className="table-td"><Badge status={p?.role ?? 'unknown'} /></td>
                  <td className="table-td">
                    <span className={`badge ${
                      r.type === 'payment' ? 'bg-blue-100 text-blue-800' :
                      r.type === 'payout' ? 'bg-purple-100 text-purple-800' :
                      r.type === 'commission' ? 'bg-green-100 text-green-800' :
                      r.type === 'refund' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {r.type as string}
                    </span>
                  </td>
                  <td className={`table-td font-semibold ${
                    r.type === 'payment' || r.type === 'commission' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {r.type === 'payout' || r.type === 'refund' ? '−' : '+'}
                    {formatMoney(r.amount as number, r.currency as string)}
                  </td>
                  <td className="table-td text-gray-400">{r.currency as string}</td>
                  <td className="table-td"><Badge status={r.status as string} /></td>
                  <td className="table-td text-xs text-gray-500">{(r.description as string) ?? '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
