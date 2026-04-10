import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { Product } from '@/types'

interface Props {
  params: Promise<{ code: string }>
}

async function getResellerData(code: string) {
  const supabase = await createClient()
  const { data: reseller } = await supabase
    .from('resellers')
    .select('id, referral_code, commission_rate, profiles!id(full_name, company, country)')
    .eq('referral_code', code.toUpperCase())
    .single()
  return reseller
}

async function getProducts(): Promise<Product[]> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('status', 'active')
      .gt('available_units', 0)
      .order('price_hourly', { ascending: true })
      .limit(9)
    return (data as Product[]) ?? []
  } catch {
    return []
  }
}

function getIcon(model: string) {
  if (model.includes('H100')) return '⚡'
  if (model.includes('A100')) return '🔥'
  if (model.includes('A6000')) return '💡'
  if (model.includes('4090')) return '🚀'
  return '🖥️'
}

export default async function ResellerLandingPage({ params }: Props) {
  const { code } = await params
  const reseller = await getResellerData(code)

  if (!reseller) notFound()

  const profile = (reseller.profiles as unknown) as Record<string, string> | null
  const resellerName = profile?.company ?? profile?.full_name ?? 'Our Partner'
  const products = await getProducts()
  const registerUrl = `/auth/register?ref=${reseller.referral_code}`

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* NAV */}
      <nav className="border-b border-gray-800 bg-gray-950/95 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚡</span>
            <span className="font-bold text-xl">Yangtze<span className="text-green-400">Compute</span></span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="text-sm text-gray-300 hover:text-white px-3 py-1.5">Sign In</Link>
            <Link href={registerUrl} className="text-sm bg-green-600 hover:bg-green-500 text-white px-4 py-1.5 rounded-lg transition-colors">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* PARTNER BANNER */}
      <div className="bg-gradient-to-r from-blue-950 to-green-950 border-b border-blue-800/50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <div className="text-3xl">🤝</div>
          <div>
            <div className="text-sm text-blue-300 font-medium">Exclusive offer from</div>
            <div className="text-xl font-bold">{resellerName}</div>
          </div>
          <div className="ml-auto text-right hidden md:block">
            <div className="text-xs text-gray-400">Partner referral code</div>
            <div className="font-mono font-bold text-green-400 text-lg">{reseller.referral_code}</div>
          </div>
        </div>
      </div>

      {/* HERO */}
      <section className="relative overflow-hidden py-20 px-4">
        <div className="absolute inset-0 bg-gradient-to-b from-green-950/20 to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-blue-950 border border-blue-800 rounded-full px-4 py-1.5 text-xs text-blue-300 mb-6">
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
            You were invited by {resellerName}
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight tracking-tight">
            Enterprise GPU Compute
            <span className="block text-green-400">On Demand</span>
          </h1>
          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
            Access high-performance NVIDIA GPU clusters from verified suppliers worldwide.
            Referred by {resellerName} — register now to get started.
          </p>
          <Link href={registerUrl} className="inline-block bg-green-600 hover:bg-green-500 text-white font-semibold px-10 py-4 rounded-xl text-lg transition-colors">
            Create Account via {resellerName} →
          </Link>
          <div className="mt-4 text-xs text-gray-500">
            Register with referral code <span className="font-mono text-green-400">{reseller.referral_code}</span> for partner support
          </div>
        </div>
      </section>

      {/* PRODUCTS */}
      {products.length > 0 && (
        <section className="py-16 px-4">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-8">Available GPU Resources</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {products.map((p) => (
                <div key={p.id} className="bg-gray-900 border border-gray-800 hover:border-green-700 rounded-2xl p-5 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className="text-xl">{getIcon(p.gpu_model)}</span>
                      <h3 className="font-semibold mt-1">{p.name}</h3>
                      <p className="text-xs text-gray-400">{p.gpu_model} · {p.location}</p>
                    </div>
                    <span className="text-xs bg-green-950 text-green-400 px-2 py-0.5 rounded-full border border-green-900">
                      {p.available_units} avail
                    </span>
                  </div>
                  <div className="flex items-end justify-between mt-4 pt-3 border-t border-gray-800">
                    <div>
                      <div className="text-xl font-bold">${Number(p.price_hourly).toFixed(2)}<span className="text-xs text-gray-400 font-normal">/hr</span></div>
                      {p.price_monthly && <div className="text-xs text-gray-500">${Number(p.price_monthly).toFixed(0)}/mo</div>}
                    </div>
                    <Link href={registerUrl} className="text-sm bg-green-600 hover:bg-green-500 text-white px-4 py-1.5 rounded-lg transition-colors">
                      Deploy →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-16 px-4 text-center">
        <div className="max-w-md mx-auto">
          <h2 className="text-2xl font-bold mb-3">Ready to get started?</h2>
          <p className="text-gray-400 mb-6 text-sm">
            Sign up through {resellerName}&apos;s referral link and get access to enterprise GPU computing with partner-level support.
          </p>
          <Link href={registerUrl} className="inline-block bg-green-600 hover:bg-green-500 text-white font-semibold px-8 py-3 rounded-xl transition-colors">
            Create Free Account →
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-gray-800 py-8 px-4 text-center text-xs text-gray-600">
        <div>⚡ YangtzeCompute — Operated by Yangtze International Ltd. | Hong Kong</div>
        <div className="mt-1">
          <a href="/terms" className="hover:text-gray-400 mx-2">Terms</a>
          <a href="/privacy" className="hover:text-gray-400 mx-2">Privacy</a>
          <a href="mailto:support@yangtzecompute.com" className="hover:text-gray-400 mx-2">Support</a>
        </div>
      </footer>
    </div>
  )
}
