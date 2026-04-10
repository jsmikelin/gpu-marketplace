'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function CheckoutButton({
  planSlug,
  planName,
  price,
  disabled = false,
  highlight = false,
}: {
  planSlug: string;
  planName: string;
  price: number;
  disabled?: boolean;
  highlight?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleCheckout() {
    if (disabled || loading) return;
    setLoading(true);

    try {
      // 获取当前用户的 token
      const { data: { session } } = await import('@supabase/supabase-js').then(m =>
        m.createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        ).auth.getSession()
      );

      if (!session?.access_token) {
        // 未登录，跳转登录，登录后返回定价页
        router.push('/auth/login?redirect=/ai-api/pricing');
        return;
      }

      const res = await fetch('/api/ai/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ planSlug }),
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || '创建订单失败，请重试');
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      alert('网络错误，请重试');
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleCheckout}
      disabled={disabled || loading}
      className={`w-full py-3 rounded-lg font-medium transition-colors ${
        highlight
          ? 'bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800'
          : 'bg-gray-800 hover:bg-gray-700 disabled:bg-gray-900 border border-gray-700'
      } disabled:opacity-50 disabled:cursor-not-allowed transition-all`}
    >
      {loading ? '跳转支付...' : `立即购买 · $${price}/月`}
    </button>
  );
}
