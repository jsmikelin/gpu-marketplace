'use client'
import { useState } from 'react'

export default function AdminSettingsPage() {
  const [saved, setSaved] = useState(false)
  const [settings, setSettings] = useState({
    defaultSupplierCommission: '20',
    defaultResellerCommission: '10',
    companyName: 'Yangtze International Ltd.',
    supportEmail: 'support@yangtzecompute.com',
    minOrderHours: '1',
    currency: 'USD',
  })

  function save() {
    // In production: save to a settings table in Supabase
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Platform Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Default configuration for the marketplace</p>
      </div>

      <div className="max-w-xl space-y-6">
        <div className="card p-6">
          <h2 className="font-semibold mb-4">Commission Defaults</h2>
          <div className="space-y-4">
            <div>
              <label className="label">Default Supplier Commission (%)</label>
              <input
                type="number" min="0" max="50" step="0.5"
                className="input"
                value={settings.defaultSupplierCommission}
                onChange={(e) => setSettings((s) => ({ ...s, defaultSupplierCommission: e.target.value }))}
              />
              <p className="text-xs text-gray-400 mt-1">Applied to new suppliers. Overridable per-supplier.</p>
            </div>
            <div>
              <label className="label">Default Reseller Commission (%)</label>
              <input
                type="number" min="0" max="30" step="0.5"
                className="input"
                value={settings.defaultResellerCommission}
                onChange={(e) => setSettings((s) => ({ ...s, defaultResellerCommission: e.target.value }))}
              />
              <p className="text-xs text-gray-400 mt-1">Applied to new resellers. Overridable per-reseller.</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="font-semibold mb-4">Company Information</h2>
          <div className="space-y-4">
            <div>
              <label className="label">Company Name</label>
              <input className="input" value={settings.companyName} onChange={(e) => setSettings((s) => ({ ...s, companyName: e.target.value }))} />
            </div>
            <div>
              <label className="label">Support Email</label>
              <input type="email" className="input" value={settings.supportEmail} onChange={(e) => setSettings((s) => ({ ...s, supportEmail: e.target.value }))} />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="font-semibold mb-4">Order Settings</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Min. Order Duration (hours)</label>
              <input type="number" min="1" className="input" value={settings.minOrderHours} onChange={(e) => setSettings((s) => ({ ...s, minOrderHours: e.target.value }))} />
            </div>
            <div>
              <label className="label">Currency</label>
              <select className="input" value={settings.currency} onChange={(e) => setSettings((s) => ({ ...s, currency: e.target.value }))}>
                <option value="USD">USD — US Dollar</option>
                <option value="EUR">EUR — Euro</option>
                <option value="GBP">GBP — British Pound</option>
                <option value="HKD">HKD — Hong Kong Dollar</option>
              </select>
            </div>
          </div>
        </div>

        <button onClick={save} className="btn-primary px-8">
          {saved ? '✓ Saved!' : 'Save Settings'}
        </button>
      </div>
    </div>
  )
}
