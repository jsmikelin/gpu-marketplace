'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { formatDateTime, formatMoney } from '@/lib/utils'

type OrderRow = {
  id: string
  order_number: string
  status: string
  billing_type: string
  duration_value: number
  quantity: number
  subtotal: number
  created_at: string
  product_name: string | null
  product_location: string | null
  credentials: CredRow[]
}

type CredRow = {
  id: string
  credential_type: string
  host: string | null
  port: number | null
  username: string | null
  password: string | null
  api_key: string | null
  console_url: string | null
  delivered_at: string
}

export default function CustomerOrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [selected, setSelected] = useState<OrderRow | null>(null)
  const [modal, setModal] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('orders')
        .select(`
          id, order_number, status, billing_type, duration_value, quantity, subtotal, created_at,
          products(name, gpu_model, location),
          order_credentials(id, credential_type, host, port, username, password, api_key, console_url, delivered_at)
        `)
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false })

      const mapped = (data ?? []).map((o: Record<string, unknown>) => {
        const prod = o.products as Record<string, string> | null
        return {
          id: o.id as string,
          order_number: o.order_number as string,
          status: o.status as string,
          billing_type: o.billing_type as string,
          duration_value: o.duration_value as number,
          quantity: o.quantity as number,
          subtotal: o.subtotal as number,
          created_at: o.created_at as string,
          product_name: prod?.name ?? null,
          product_location: prod?.location ?? null,
          credentials: (o.order_credentials as CredRow[]) ?? [],
        }
      })
      setOrders(mapped)
    }
    load()
  }, [])

  function openOrder(o: OrderRow) {
    setSelected(o)
    setModal(true)
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">My Orders</h1>
        <p className="text-sm text-gray-500 mt-1">Your compute deployments and access credentials</p>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="table-th">Order #</th>
              <th className="table-th">Product</th>
              <th className="table-th">Duration</th>
              <th className="table-th">Amount</th>
              <th className="table-th">Credentials</th>
              <th className="table-th">Status</th>
              <th className="table-th">Date</th>
              <th className="table-th">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orders.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-400">No orders yet</td></tr>
            )}
            {orders.map((o) => (
              <tr key={o.id} className="hover:bg-gray-50">
                <td className="table-td font-mono text-xs">{o.order_number}</td>
                <td className="table-td">
                  <div className="font-medium text-sm">{o.product_name ?? '—'}</div>
                  <div className="text-xs text-gray-400">{o.product_location}</div>
                </td>
                <td className="table-td text-xs text-gray-500">
                  {o.quantity}x {o.duration_value} {o.billing_type === 'monthly' ? 'mo' : 'hr'}
                </td>
                <td className="table-td font-medium">{formatMoney(o.subtotal)}</td>
                <td className="table-td">
                  {o.credentials.length > 0 ? (
                    <span className="badge bg-green-100 text-green-800">✓ Available</span>
                  ) : (
                    <span className="badge bg-gray-100 text-gray-500">Pending</span>
                  )}
                </td>
                <td className="table-td"><Badge status={o.status} /></td>
                <td className="table-td text-xs text-gray-400">{formatDateTime(o.created_at)}</td>
                <td className="table-td">
                  <button onClick={() => openOrder(o)} className="text-xs btn-secondary py-1 px-2">
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={`Order ${selected?.order_number}`}
        footer={<button onClick={() => setModal(false)} className="btn-primary">Close</button>}
      >
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-500">Product:</span> {selected.product_name}</div>
              <div><span className="text-gray-500">Location:</span> {selected.product_location}</div>
              <div><span className="text-gray-500">Duration:</span> {selected.quantity}x {selected.duration_value} {selected.billing_type === 'monthly' ? 'month(s)' : 'hour(s)'}</div>
              <div><span className="text-gray-500">Amount:</span> {formatMoney(selected.subtotal)}</div>
              <div><span className="text-gray-500">Status:</span> <Badge status={selected.status} /></div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3">Access Credentials</h4>
              {selected.credentials.length === 0 ? (
                <div className="text-center py-6 text-gray-400 bg-gray-50 rounded-xl">
                  <div className="text-3xl mb-2">⏳</div>
                  <div className="text-sm">Credentials will appear here once your order is processed.</div>
                  <div className="text-xs text-gray-300 mt-1">Typically within 1–2 hours of payment</div>
                </div>
              ) : (
                selected.credentials.map((c) => (
                  <div key={c.id} className="bg-gray-900 text-green-400 font-mono text-xs p-4 rounded-xl space-y-1.5">
                    <div className="text-gray-500 uppercase text-xs mb-2">— {c.credential_type.toUpperCase()} ACCESS —</div>
                    {c.host && <div><span className="text-gray-400">Host:</span> {c.host}{c.port ? `:${c.port}` : ''}</div>}
                    {c.username && <div><span className="text-gray-400">Username:</span> {c.username}</div>}
                    {c.password && <div><span className="text-gray-400">Password:</span> {c.password}</div>}
                    {c.api_key && <div><span className="text-gray-400">API Key:</span> {c.api_key}</div>}
                    {c.console_url && <div><span className="text-gray-400">URL:</span> <a href={c.console_url} target="_blank" rel="noreferrer" className="text-blue-400 underline">{c.console_url}</a></div>}
                    <div className="text-gray-600 text-xs mt-2 pt-2 border-t border-gray-700">
                      Delivered: {formatDateTime(c.delivered_at)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
