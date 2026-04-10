'use client'
import { useState, useEffect, useCallback } from 'react'
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
  supplier_payout: number
  created_at: string
  customer_name: string | null
  product_name: string | null
  has_credentials: boolean
}

type CredForm = {
  credential_type: string
  host: string
  port: string
  username: string
  password: string
  api_key: string
  console_url: string
}

export default function SupplierOrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [selected, setSelected] = useState<OrderRow | null>(null)
  const [credModal, setCredModal] = useState(false)
  const [cred, setCred] = useState<CredForm>({ credential_type: 'ssh', host: '', port: '', username: '', password: '', api_key: '', console_url: '' })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [userId, setUserId] = useState('')

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)
    const { data } = await supabase
      .from('orders')
      .select(`
        id, order_number, status, billing_type, duration_value, quantity, subtotal, supplier_payout, created_at,
        profiles!customer_id(full_name, company),
        products(name)
      `)
      .eq('supplier_id', user.id)
      .order('created_at', { ascending: false })

    // Check which orders already have credentials
    const orderIds = (data ?? []).map((o: Record<string, unknown>) => o.id as string)
    const { data: creds } = await supabase.from('order_credentials').select('order_id').in('order_id', orderIds)
    const credSet = new Set((creds ?? []).map((c: Record<string, string>) => c.order_id))

    const mapped = (data ?? []).map((o: Record<string, unknown>) => {
      const cust = o.profiles as Record<string, string> | null
      const prod = o.products as Record<string, string> | null
      return {
        id: o.id as string,
        order_number: o.order_number as string,
        status: o.status as string,
        billing_type: o.billing_type as string,
        duration_value: o.duration_value as number,
        quantity: o.quantity as number,
        subtotal: o.subtotal as number,
        supplier_payout: o.supplier_payout as number,
        created_at: o.created_at as string,
        customer_name: cust?.company ?? cust?.full_name ?? null,
        product_name: prod?.name ?? null,
        has_credentials: credSet.has(o.id as string),
      }
    })
    setOrders(mapped)
  }, [])

  useEffect(() => { load() }, [load])

  function openCred(order: OrderRow) {
    setSelected(order)
    setCred({ credential_type: 'ssh', host: '', port: '', username: '', password: '', api_key: '', console_url: '' })
    setMsg('')
    setCredModal(true)
  }

  async function submitCred() {
    if (!selected) return
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('order_credentials').insert({
      order_id: selected.id,
      credential_type: cred.credential_type,
      host: cred.host || null,
      port: cred.port ? parseInt(cred.port) : null,
      username: cred.username || null,
      password: cred.password || null,
      api_key: cred.api_key || null,
      console_url: cred.console_url || null,
      delivered_by: userId,
    })

    if (!error) {
      // Update order to active
      await supabase.from('orders').update({ status: 'active', started_at: new Date().toISOString() }).eq('id', selected.id)
      setMsg('Credentials delivered! Order is now active.')
      load()
    } else {
      setMsg('Error: ' + error.message)
    }
    setSaving(false)
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Orders</h1>
        <p className="text-sm text-gray-500 mt-1">Orders assigned to you — deliver credentials after payment</p>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="table-th">Order #</th>
              <th className="table-th">Product</th>
              <th className="table-th">Customer</th>
              <th className="table-th">Duration</th>
              <th className="table-th">Payout</th>
              <th className="table-th">Status</th>
              <th className="table-th">Date</th>
              <th className="table-th">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orders.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-400">No orders yet</td></tr>
            )}
            {orders.map((o) => (
              <tr key={o.id} className={`hover:bg-gray-50 ${o.status === 'paid' && !o.has_credentials ? 'bg-yellow-50' : ''}`}>
                <td className="table-td font-mono text-xs">{o.order_number}</td>
                <td className="table-td text-xs">{o.product_name ?? '—'}</td>
                <td className="table-td text-xs">{o.customer_name ?? '—'}</td>
                <td className="table-td text-xs text-gray-500">
                  {o.quantity}x {o.duration_value} {o.billing_type === 'monthly' ? 'mo' : 'hr'}
                </td>
                <td className="table-td font-medium text-green-600">{formatMoney(o.supplier_payout)}</td>
                <td className="table-td">
                  {o.status === 'paid' && !o.has_credentials ? (
                    <span className="badge bg-yellow-100 text-yellow-800 animate-pulse">⚠ Action Required</span>
                  ) : (
                    <Badge status={o.status} />
                  )}
                </td>
                <td className="table-td text-xs text-gray-400">{formatDateTime(o.created_at)}</td>
                <td className="table-td">
                  {(o.status === 'paid' || o.status === 'processing') && !o.has_credentials && (
                    <button onClick={() => openCred(o)} className="text-xs bg-green-600 hover:bg-green-700 text-white py-1 px-3 rounded-lg transition-colors">
                      Upload Credentials
                    </button>
                  )}
                  {o.has_credentials && (
                    <span className="text-xs text-green-600">✓ Delivered</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        open={credModal}
        onClose={() => setCredModal(false)}
        title={`Deliver Credentials — ${selected?.order_number}`}
        footer={
          <>
            {msg && <span className={`text-sm mr-auto ${msg.startsWith('Error') ? 'text-red-600' : 'text-green-600'}`}>{msg}</span>}
            <button onClick={() => setCredModal(false)} className="btn-secondary">Close</button>
            <button onClick={submitCred} disabled={saving} className="btn-primary">
              {saving ? 'Sending...' : 'Deliver to Customer'}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="label">Access Type</label>
            <select className="input" value={cred.credential_type} onChange={(e) => setCred((c) => ({ ...c, credential_type: e.target.value }))}>
              <option value="ssh">SSH</option>
              <option value="api_key">API Key</option>
              <option value="console">Web Console</option>
              <option value="vpn">VPN</option>
              <option value="other">Other</option>
            </select>
          </div>
          {(cred.credential_type === 'ssh') && (
            <>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="label">Host / IP</label>
                  <input className="input" placeholder="192.168.1.1" value={cred.host} onChange={(e) => setCred((c) => ({ ...c, host: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Port</label>
                  <input className="input" placeholder="22" value={cred.port} onChange={(e) => setCred((c) => ({ ...c, port: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="label">Username</label>
                  <input className="input" placeholder="root" value={cred.username} onChange={(e) => setCred((c) => ({ ...c, username: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Password</label>
                  <input className="input" placeholder="••••••••" value={cred.password} onChange={(e) => setCred((c) => ({ ...c, password: e.target.value }))} />
                </div>
              </div>
            </>
          )}
          {cred.credential_type === 'api_key' && (
            <div>
              <label className="label">API Key</label>
              <input className="input font-mono" placeholder="sk-..." value={cred.api_key} onChange={(e) => setCred((c) => ({ ...c, api_key: e.target.value }))} />
            </div>
          )}
          {(cred.credential_type === 'console' || cred.credential_type === 'vpn') && (
            <div>
              <label className="label">Access URL</label>
              <input className="input" placeholder="https://..." value={cred.console_url} onChange={(e) => setCred((c) => ({ ...c, console_url: e.target.value }))} />
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}
