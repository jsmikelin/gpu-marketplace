import { createClient } from '@/lib/supabase/server'

export default async function ResellerInvitePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: reseller } = await supabase
    .from('resellers')
    .select('referral_code, commission_rate')
    .eq('id', user.id)
    .single()

  const code = reseller?.referral_code ?? ''
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const landingUrl = `${appUrl}/r/${code}`
  const registerUrl = `${appUrl}/auth/register?ref=${code}`

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Invite Customers</h1>
        <p className="text-sm text-gray-500 mt-1">
          Share your links to earn {reseller?.commission_rate ?? 10}% commission on every order
        </p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Your referral code */}
        <div className="card p-6">
          <h2 className="font-semibold mb-1">Your Referral Code</h2>
          <p className="text-sm text-gray-500 mb-4">Share this code or the links below with potential customers</p>
          <div className="bg-gray-900 text-green-400 font-mono text-3xl font-bold text-center py-6 rounded-xl tracking-widest">
            {code || 'Loading...'}
          </div>
        </div>

        {/* Dedicated landing page */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">🌐</span>
            <h2 className="font-semibold">Your Personal Landing Page</h2>
            <span className="badge bg-green-100 text-green-700 text-xs">Recommended</span>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            A dedicated page branded with your name. Customers who visit and register are automatically linked to your account.
          </p>
          <div className="flex gap-2 mb-3">
            <input
              readOnly
              value={landingUrl}
              className="input flex-1 font-mono text-xs bg-gray-50"
              onFocus={(e) => e.target.select()}
            />
          </div>
          <a
            href={landingUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-green-600 hover:underline"
          >
            Preview your landing page →
          </a>
        </div>

        {/* Direct register link */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">📝</span>
            <h2 className="font-semibold">Direct Registration Link</h2>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Takes customers directly to the registration form with your referral code pre-filled.
          </p>
          <div className="flex gap-2">
            <input
              readOnly
              value={registerUrl}
              className="input flex-1 font-mono text-xs bg-gray-50"
              onFocus={(e) => e.target.select()}
            />
          </div>
        </div>

        {/* Email template */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">📧</span>
            <h2 className="font-semibold">Email Template</h2>
          </div>
          <p className="text-sm text-gray-500 mb-3">Copy and paste this into your email:</p>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-700 font-mono whitespace-pre-wrap">
{`Subject: Access to GPU Cloud Computing — YangtzeCompute

Hi [Name],

I wanted to share a platform I use for GPU compute resources — YangtzeCompute.

They offer high-performance NVIDIA GPUs from verified providers worldwide, with flexible hourly and monthly billing.

Sign up through my partner link for direct support:
${landingUrl}

Or use my referral code at registration: ${code}

Best regards`}
          </div>
        </div>

        {/* How it works */}
        <div className="card p-6 bg-green-50">
          <h2 className="font-semibold mb-3 text-green-800">How Commissions Work</h2>
          <div className="space-y-2 text-sm text-green-700">
            <div className="flex items-start gap-2">
              <span className="mt-0.5">1️⃣</span>
              <span>Customer registers via your link or enters your referral code <span className="font-mono font-bold">{code}</span></span>
            </div>
            <div className="flex items-start gap-2">
              <span className="mt-0.5">2️⃣</span>
              <span>They are automatically linked to your reseller account</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="mt-0.5">3️⃣</span>
              <span>Every order they place earns you <span className="font-bold">{reseller?.commission_rate ?? 10}% commission</span></span>
            </div>
            <div className="flex items-start gap-2">
              <span className="mt-0.5">4️⃣</span>
              <span>Track earnings in real-time on your <a href="/reseller/commissions" className="underline">Commissions</a> page</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
