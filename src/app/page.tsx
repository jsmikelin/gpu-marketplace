import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { Product } from '@/types'
import { ReferralSignup } from '@/components/referral-signup'

async function getProducts(): Promise<Product[]> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('status', 'active')
      .gt('available_units', 0)
      .order('price_hourly', { ascending: true })
      .limit(12)
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

function Spec({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-gray-800 rounded-lg px-2.5 py-1.5">
      <span className="text-gray-500">{label}: </span>
      <span className="text-gray-200 font-medium">{value}</span>
    </div>
  )
}

export default async function HomePage() {
  const products = await getProducts()

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* NAV */}
      <nav className="border-b border-gray-800 bg-gray-950/95 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <span className="text-2xl">⚡</span>
              <span className="font-bold text-xl">Yangtze<span className="text-green-400">Compute</span></span>
            </div>
            <div className="hidden md:flex items-center gap-8 text-sm text-gray-400">
              <a href="#products" className="hover:text-white transition-colors">Products</a>
              <a href="#features" className="hover:text-white transition-colors">Features</a>
              <a href="#about" className="hover:text-white transition-colors">About</a>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/auth/login" className="text-sm text-gray-300 hover:text-white transition-colors px-3 py-1.5">
                Sign In
              </Link>
              <Link href="/auth/register" className="text-sm bg-green-600 hover:bg-green-500 text-white px-4 py-1.5 rounded-lg transition-colors">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative overflow-hidden py-24 px-4">
        <div className="absolute inset-0 bg-gradient-to-b from-green-950/30 to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-green-950 border border-green-800 rounded-full px-4 py-1.5 text-xs text-green-400 mb-6">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            Global GPU network — online now
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight tracking-tight">
            Enterprise GPU Compute
            <span className="block text-green-400">On Demand</span>
          </h1>
          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Access high-performance NVIDIA GPU clusters from verified suppliers worldwide.
            Pay by the hour or month. Deploy in minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="#products" className="bg-green-600 hover:bg-green-500 text-white font-medium px-8 py-3.5 rounded-xl text-base transition-colors">
              Browse GPUs →
            </a>
            <Link href="/auth/register?role=supplier" className="border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white font-medium px-8 py-3.5 rounded-xl text-base transition-colors">
              Become a Supplier
            </Link>
          </div>
        </div>
      </section>

      {/* STATS BAR */}
      <section className="border-y border-gray-800 py-10">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { label: 'GPU Nodes', value: '500+' },
              { label: 'Avg. Uptime', value: '99.9%' },
              { label: 'Locations', value: '15+' },
              { label: 'Active Clients', value: '1,200+' },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-3xl font-bold text-green-400">{s.value}</div>
                <div className="text-sm text-gray-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRODUCTS */}
      <section id="products" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">Available GPU Resources</h2>
            <p className="text-gray-400">Real-time inventory from verified global suppliers</p>
          </div>

          {products.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <div className="text-5xl mb-4">🖥️</div>
              <p>No resources available right now. Check back soon.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((p) => (
                <div key={p.id} className="bg-gray-900 border border-gray-800 hover:border-green-700 rounded-2xl p-6 transition-colors group">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <span className="text-2xl">{getIcon(p.gpu_model)}</span>
                      <h3 className="font-semibold text-lg mt-1 text-white">{p.name}</h3>
                      <p className="text-sm text-gray-400">{p.gpu_model}</p>
                    </div>
                    <span className="bg-green-950 text-green-400 text-xs px-2.5 py-1 rounded-full border border-green-900 whitespace-nowrap">
                      {p.available_units} avail
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                    <Spec label="GPUs" value={`${p.gpu_count}x`} />
                    {p.vram_gb && <Spec label="VRAM" value={`${p.vram_gb} GB`} />}
                    {p.ram_gb && <Spec label="RAM" value={`${p.ram_gb} GB`} />}
                    {p.vcpus && <Spec label="vCPUs" value={p.vcpus} />}
                    {p.storage_tb && <Spec label="Storage" value={`${p.storage_tb} TB`} />}
                    <Spec label="Location" value={p.location} />
                  </div>

                  <div className="flex items-end justify-between border-t border-gray-800 pt-4">
                    <div>
                      <div className="text-2xl font-bold">
                        ${Number(p.price_hourly).toFixed(2)}
                        <span className="text-sm font-normal text-gray-400">/hr</span>
                      </div>
                      {p.price_monthly && (
                        <div className="text-xs text-gray-500">${Number(p.price_monthly).toFixed(0)}/month</div>
                      )}
                    </div>
                    <Link
                      href={`/auth/register`}
                      className="bg-green-600 hover:bg-green-500 text-white text-sm px-4 py-2 rounded-lg transition-colors"
                    >
                      Deploy →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="bg-gray-900 py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-3">Why YangtzeCompute?</h2>
          <p className="text-center text-gray-400 mb-12">Built for AI teams, researchers, and businesses</p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: '🌏', title: 'Global Supplier Network', desc: 'Verified GPU providers across Asia, Europe, and North America. Pick the region closest to your users.' },
              { icon: '💳', title: 'Transparent Billing', desc: 'Pay securely with any major credit card via Stripe. Hourly or monthly billing. No hidden fees.' },
              { icon: '🔒', title: 'Vetted Suppliers Only', desc: 'Every compute provider undergoes manual verification. Only approved suppliers appear on the marketplace.' },
              { icon: '⚡', title: 'Instant Credentials', desc: 'SSH keys, API tokens, or console access delivered immediately after payment confirmation.' },
              { icon: '🤝', title: 'Reseller Program', desc: "Earn commission by referring customers. Get your unique referral link and track earnings in real time." },
              { icon: '📊', title: 'Full Dashboard', desc: 'Monitor all orders, manage credentials, view invoices, and submit support tickets from one place.' },
            ].map((f) => (
              <div key={f.title} className="text-center px-4">
                <div className="text-4xl mb-3">{f.icon}</div>
                <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PARTNER PROGRAMS */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Partner Programs</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="border border-gray-800 rounded-2xl p-8 hover:border-green-700 transition-colors">
              <div className="text-4xl mb-4">🏭</div>
              <h3 className="text-xl font-bold mb-3">GPU Supplier</h3>
              <ul className="text-gray-400 text-sm space-y-2 mb-6">
                <li>✓ List your idle GPU resources</li>
                <li>✓ Set your own pricing</li>
                <li>✓ Receive payouts via USDT, wire transfer</li>
                <li>✓ Dedicated supplier dashboard</li>
              </ul>
              <Link href="/auth/register?role=supplier" className="block text-center bg-green-600 hover:bg-green-500 text-white px-6 py-2.5 rounded-lg transition-colors text-sm font-medium">
                Apply as Supplier
              </Link>
            </div>
            <div className="border border-gray-800 rounded-2xl p-8 hover:border-blue-700 transition-colors">
              <div className="text-4xl mb-4">🤝</div>
              <h3 className="text-xl font-bold mb-3">Reseller / Agent</h3>
              <ul className="text-gray-400 text-sm space-y-2 mb-6">
                <li>✓ Earn commission on every referral</li>
                <li>✓ Manage your customer portfolio</li>
                <li>✓ Exclusive reseller pricing</li>
                <li>✓ Real-time commission tracking</li>
              </ul>
              <Link href="/auth/register?role=reseller" className="block text-center bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-lg transition-colors text-sm font-medium">
                Become a Reseller
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA with referral code */}
      <section className="bg-green-950 border-y border-green-900 py-20 px-4 text-center">
        <div className="max-w-md mx-auto">
          <h2 className="text-3xl font-bold mb-4">Ready to Scale Your AI Workload?</h2>
          <p className="text-green-300 mb-8 opacity-80">Sign up in 2 minutes. No contracts. Pay as you go.</p>
          <ReferralSignup />
        </div>
      </section>

      {/* FOOTER */}
      <footer id="about" className="border-t border-gray-800 py-10 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start gap-8">
            <div>
              <div className="font-bold text-xl mb-2">⚡ YangtzeCompute</div>
              <div className="text-sm text-gray-500">Operated by 香港长江国际有限公司 (Yangtze International Ltd.)</div>
              <div className="text-xs text-gray-600 mt-1">Unit 1, 1/F, Yeung Yiu Chung No.8 Ind. Bldg., Hong Kong</div>
            </div>
            <div className="grid grid-cols-2 gap-8 text-sm text-gray-500">
              <div>
                <div className="font-medium text-gray-400 mb-3">Platform</div>
                <div className="space-y-2">
                  <a href="#products" className="block hover:text-white">Products</a>
                  <Link href="/auth/register?role=supplier" className="block hover:text-white">Supplier Program</Link>
                  <Link href="/auth/register?role=reseller" className="block hover:text-white">Reseller Program</Link>
                </div>
              </div>
              <div>
                <div className="font-medium text-gray-400 mb-3">Company</div>
                <div className="space-y-2">
                  <a href="mailto:support@yangtzecompute.com" className="block hover:text-white">support@yangtzecompute.com</a>
                  <a href="/terms" className="block hover:text-white">Terms of Service</a>
                  <a href="/privacy" className="block hover:text-white">Privacy Policy</a>
                  <Link href="/auth/login" className="block hover:text-white">Admin Login</Link>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-gray-800 text-center text-xs text-gray-600">
            © 2026 香港长江国际有限公司 (Yangtze International Ltd.). All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
