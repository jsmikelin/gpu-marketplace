'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatMoney } from '@/lib/utils'

type CustomerRow = {
  id: string
  full_name: string | null
  company: string | null
  country: string | null
  status: string
  total_spent: number
  total_orders: number
  created_at: string
}

export default function ResellerCustomersPage() {
  const [customers, setCustomers] = useState<CustomerRow[]>([])
  const [search, setSearch] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [refLink, setRefLink] = useState('')

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Get referral code
    const { data: res } = await supabase.from('resellers').select('referral_code').eq('id', user.id).single()
    const code = res?.referral_code ?? ''
    setRefLink(`${window.location.origin}/auth/register?ref=${code}`)

    // Get customers under this reseller
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, company, country, status, created_at, customers!inner(total_spent, total_orders, reseller_id)')
      .eq('role', 'customer')
      .eq('customers.reseller_id', user.id)
      .order('created_at', { ascending: false })

    const mapped = (data ?? []).map((r: Record<string, unknown>) => {
      const c = r.customers as Record<string, unknown>
      return {
        id: r.id as string,
        full_name: r.full_name as string | null,
        company: r.company as string | null,
        country: r.country as string | null,
        status: r.status as string,
        total_spent: (c?.total_spent as number) ?? 0,
        total_orders: (c?.total_orders as number) ?? 0,
        created_at: r.created_at as string,
      }
    })
    setCustomers(mapped)
  }, [])

  useEffect(() => { load() }, [load])

  function sendInvite() {
    const subject = encodeURIComponent('You have been invited to YangtzeCompute')
    const body = encodeURIComponent(`Hi,\n\nI invite you to use YangtzeCompute — a GPU cloud marketplace.\n\nSign up here: ${refLink}\n\nBest regards`)
    window.open(`mailto:${inviteEmail}?subject=${subject}&body=${body}`)
  }

  const displayed = search
    ? customers.filter((c) =>
        (c.full_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (c.company ?? '').toLowerCase().includes(search.toLowerCase())
      )
    : customers

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">My Customers</h1>
        <p className="text-sm text-gray-500 mt-1">Customers registered through your referral link</p>
      </div>

      {/* Invite section */}
      <div className="card p-5 mb-6">
        <h3 className="font-semibold mb-3">📨 Invite a Customer</h3>
        <div className="flex gap-3">
          <input
            type="email"
            className="input flex-1"
            placeholder="customer@example.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
          />
          <button onClick={sendInvite} disabled={!inviteEmail} className="btn-primary">
            Send Invite
          </button>
        </div>
        <div className="mt-2 text-xs text-gray-400">
          Or share your referral link directly:{' '}
          <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded break-all">{refLink}</span>
        </div>
      </div>

      <div className="mb-4">
        <input
          className="input max-w-xs"
          placeholder="Search customers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="table-th">Customer</th>
              <th className="table-th">Country</th>
              <th className="table-th">Status</th>
              <th className="table-th">Orders</th>
              <th className="table-th">Total Spent</th>
              <th className="table-th">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {displayed.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                  No customers yet. Share your referral link to get started.
                </td>
              </tr>
            )}
            {displayed.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="table-td">
                  <div className="font-medium">{c.company ?? c.full_name ?? '—'}</div>
                  <div className="text-xs text-gray-400">{c.full_name}</div>
                </td>
                <td className="table-td text-gray-500">{c.country ?? '—'}</td>
                <td className="table-td"><Badge status={c.status} /></td>
                <td className="table-td">{c.total_orders}</td>
                <td className="table-td font-medium text-green-600">{formatMoney(c.total_spent)}</td>
                <td className="table-td text-xs text-gray-400">{formatDate(c.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
