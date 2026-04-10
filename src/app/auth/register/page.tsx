'use client'
import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const ROLES = [
  { value: 'customer', label: 'Customer', icon: '👤', desc: 'Buy GPU compute resources' },
  { value: 'supplier', label: 'Supplier', icon: '🏭', desc: 'Sell your GPU resources' },
  { value: 'reseller', label: 'Reseller / Agent', icon: '🤝', desc: 'Refer customers & earn commission' },
]

function RegisterForm() {
  const router = useRouter()
  const params = useSearchParams()
  const defaultRole = params.get('role') ?? 'customer'
  const refCode = params.get('ref') ?? ''

  const [role, setRole] = useState(defaultRole)
  const [refCodeInput, setRefCodeInput] = useState(params.get('ref') ?? '')
  const [form, setForm] = useState({ email: '', password: '', full_name: '', company: '', country: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function update(k: string, v: string) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const supabase = createClient()
    const { error: err } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          role,
          full_name: form.full_name,
          company: form.company,
          country: form.country,
          ref_code: refCodeInput.toUpperCase(),
        },
      },
    })
    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }
    if (role === 'supplier') router.push('/supplier?welcome=1')
    else if (role === 'reseller') router.push('/reseller?welcome=1')
    else router.push('/dashboard?welcome=1')
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-white">
            ⚡ Yangtze<span className="text-green-400">Compute</span>
          </Link>
          <h1 className="text-xl font-semibold text-white mt-4">Create your account</h1>
          <p className="text-gray-400 text-sm mt-1">Join our global GPU marketplace</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
          {/* Role Selector */}
          <div className="mb-6">
            <div className="label text-gray-300 mb-2">I want to...</div>
            <div className="grid grid-cols-3 gap-3">
              {ROLES.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  className={`p-3 rounded-xl border text-left transition-colors ${
                    role === r.value
                      ? 'border-green-500 bg-green-950'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <div className="text-2xl mb-1">{r.icon}</div>
                  <div className="text-xs font-medium text-white">{r.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{r.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-950 border border-red-800 text-red-300 text-sm px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label text-gray-300">Full Name</label>
                <input
                  required
                  value={form.full_name}
                  onChange={(e) => update('full_name', e.target.value)}
                  className="input bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                  placeholder="John Smith"
                />
              </div>
              <div>
                <label className="label text-gray-300">Company (optional)</label>
                <input
                  value={form.company}
                  onChange={(e) => update('company', e.target.value)}
                  className="input bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                  placeholder="Acme Inc."
                />
              </div>
            </div>

            <div>
              <label className="label text-gray-300">Country</label>
              <input
                required
                value={form.country}
                onChange={(e) => update('country', e.target.value)}
                className="input bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                placeholder="United States"
              />
            </div>

            <div>
              <label className="label text-gray-300">Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                className="input bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="label text-gray-300">Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={form.password}
                onChange={(e) => update('password', e.target.value)}
                className="input bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                placeholder="Min. 8 characters"
              />
            </div>

            {/* Referral Code */}
            <div>
              <label className="label text-gray-300">
                Referral Code <span className="text-gray-500 font-normal">(optional)</span>
              </label>
              <input
                value={refCodeInput}
                readOnly={!!params.get('ref')}
                onChange={(e) => setRefCodeInput(e.target.value.toUpperCase())}
                className={`input bg-gray-800 border-gray-700 text-white placeholder-gray-500 font-mono tracking-widest ${params.get('ref') ? 'opacity-70 cursor-default' : ''}`}
                placeholder="e.g. ABC12345"
                maxLength={10}
              />
              {refCodeInput && (
                <div className="mt-1.5 bg-blue-950 border border-blue-800 text-blue-300 text-xs px-3 py-2 rounded-lg">
                  ✓ Partner referral code applied: <span className="font-mono font-bold">{refCodeInput}</span>
                </div>
              )}
            </div>

            {(role === 'supplier' || role === 'reseller') && (
              <div className="bg-yellow-950 border border-yellow-800 text-yellow-300 text-xs px-3 py-2 rounded-lg">
                {role === 'supplier'
                  ? '⚠️ Supplier accounts require manual approval (1–2 business days) before you can list resources.'
                  : '⚠️ Reseller accounts require manual approval before you can earn commissions.'}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 mt-2">
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-4 text-center text-xs text-gray-500">
            By registering you agree to our{' '}
            <a href="/terms" className="text-green-400 hover:underline">Terms of Service</a>
            {' '}and{' '}
            <a href="/privacy" className="text-green-400 hover:underline">Privacy Policy</a>
          </div>

          <div className="mt-4 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-green-400 hover:text-green-300">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-950 flex items-center justify-center"><div className="text-white">Loading...</div></div>}>
      <RegisterForm />
    </Suspense>
  )
}
