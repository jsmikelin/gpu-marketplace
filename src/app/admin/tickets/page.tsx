import { createAdminClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { formatDateTime } from '@/lib/utils'

export default async function AdminTicketsPage() {
  const supabase = await createAdminClient()
  const { data } = await supabase
    .from('support_tickets')
    .select('*, profiles!customer_id(full_name, company)')
    .order('created_at', { ascending: false })
    .limit(100)

  const tickets = (data ?? []) as Record<string, unknown>[]

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Support Tickets</h1>
        <p className="text-sm text-gray-500 mt-1">{tickets.filter((t) => t.status === 'open').length} open tickets</p>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="table-th">Date</th>
              <th className="table-th">Customer</th>
              <th className="table-th">Subject</th>
              <th className="table-th">Priority</th>
              <th className="table-th">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {tickets.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-400">No tickets yet</td></tr>
            )}
            {tickets.map((t) => {
              const p = t.profiles as Record<string, string> | null
              return (
                <tr key={t.id as string} className="hover:bg-gray-50">
                  <td className="table-td text-xs text-gray-500">{formatDateTime(t.created_at as string)}</td>
                  <td className="table-td text-sm">{p?.company ?? p?.full_name ?? '—'}</td>
                  <td className="table-td font-medium">{t.subject as string}</td>
                  <td className="table-td">
                    <span className={`badge ${
                      t.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                      t.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                      'bg-gray-100 text-gray-700'
                    }`}>{t.priority as string}</span>
                  </td>
                  <td className="table-td"><Badge status={t.status as string} /></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
