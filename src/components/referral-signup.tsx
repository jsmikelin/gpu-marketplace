'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function ReferralSignup() {
  const router = useRouter()
  const [code, setCode] = useState('')

  function handleStart() {
    const url = code.trim()
      ? `/auth/register?ref=${encodeURIComponent(code.trim().toUpperCase())}`
      : '/auth/register'
    router.push(url)
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Referral code (optional)"
          maxLength={10}
          className="flex-1 px-4 py-3 bg-green-900/50 border border-green-700 text-white placeholder-green-600 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
          onKeyDown={(e) => e.key === 'Enter' && handleStart()}
        />
        <button
          onClick={handleStart}
          className="bg-green-500 hover:bg-green-400 text-white font-semibold px-6 py-3 rounded-xl transition-colors whitespace-nowrap"
        >
          Get Started →
        </button>
      </div>
      {code && (
        <div className="text-xs text-green-300 opacity-80">
          ✓ Referral code <span className="font-mono font-bold">{code}</span> will be applied
        </div>
      )}
      <div className="text-xs text-green-700">
        Have a partner referral code? Enter it above. Or leave blank for direct signup.
      </div>
    </div>
  )
}
