'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const supabase = createClient()
    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }
    // Route by role
    const role = data.user?.user_metadata?.role ?? 'customer'
    if (role === 'admin') router.push('/admin')
    else if (role === 'supplier') router.push('/supplier')
    else if (role === 'reseller') router.push('/reseller')
    else router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-white">
            ⚡ Yangtze<span className="text-green-400">Compute</span>
          </Link>
          <h1 className="text-xl font-semibold text-white mt-4">Welcome back</h1>
          <p className="text-gray-400 text-sm mt-1">Sign in to your account</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-950 border border-red-800 text-red-300 text-sm px-4 py-3 rounded-lg">
                {error}
              </div>
            )}
            <div>
              <label className="label text-gray-300">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:ring-green-500"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="label text-gray-300">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:ring-green-500"
                placeholder="••••••••"
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 mt-2">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            Don&apos;t have an account?{' '}
            <Link href="/auth/register" className="text-green-400 hover:text-green-300">
              Create account
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
