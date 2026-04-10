'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface OrderInfo {
  order_number: string;
  status: string;
  api_key?: {
    key_full: string;
    key_prefix: string;
    name: string;
  };
  ai_plans?: {
    name: string;
    credits_monthly: string;
  };
}

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order_id');
  const sessionId = searchParams.get('session_id');
  const [order, setOrder] = useState<OrderInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    // 通过 order_id 获取订单和 API Key 信息
    fetch(`/api/ai/orders/${orderId}`)
      .then(r => r.json())
      .then(data => {
        setOrder(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🎉</div>
          <p className="text-gray-400">加载中...</p>
        </div>
      </div>
    );
  }

  if (!orderId) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold mb-4">订单信息不存在</h1>
          <Link href="/ai-api/pricing" className="text-blue-400 hover:text-blue-300">
            返回定价页
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Success Hero */}
      <section className="px-6 py-20 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="text-6xl mb-6">🎉</div>
          <h1 className="text-4xl font-bold mb-4">购买成功！</h1>
          <p className="text-gray-400 text-lg mb-2">
            感谢您的信任，您的 AI API 账户已开通
          </p>
          {order?.order_number && (
            <p className="text-gray-500 text-sm mb-8">
              订单号：{order.order_number}
            </p>
          )}
        </div>
      </section>

      {/* API Key Display */}
      {order?.api_key?.key_full ? (
        <section className="px-6 pb-16">
          <div className="max-w-xl mx-auto">
            <div className="bg-green-900/20 border border-green-500/30 rounded-2xl p-6 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />
                <span className="text-green-400 font-medium">API Key 已生成</span>
              </div>
              <div className="bg-gray-900 rounded-lg p-4 mb-4 break-all">
                <code className="text-green-400 font-mono text-sm">{order.api_key.key_full}</code>
              </div>
              <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3 text-sm text-yellow-300">
                ⚠️ 请立即复制保存此 Key，它不会再显示第二次
              </div>
            </div>

            {/* Plan Info */}
            {order.ai_plans && (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
                <h3 className="font-semibold mb-3">您的订阅</h3>
                <div className="space-y-2 text-sm text-gray-400">
                  <div className="flex justify-between">
                    <span>套餐</span>
                    <span className="text-white">{order.ai_plans.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>月度额度</span>
                    <span className="text-white">{order.ai_plans.credits_monthly}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>状态</span>
                    <span className="text-green-400">● Active</span>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Start */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
              <h3 className="font-semibold mb-3">快速开始</h3>
              <div className="bg-gray-950 rounded-lg p-4 text-sm font-mono text-green-400 overflow-x-auto">
{`from openai import OpenAI

client = OpenAI(
    api_key="${order.api_key.key_full.slice(0, 16)}...",
    base_url="https://rivergpu.com/api/ai/v1"
)

response = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[{"role": "user", "content": "Hello!"}]
)
print(response.choices[0].message.content)`}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <Link
                href="/ai-api/docs"
                className="block text-center py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium transition-colors"
              >
                查看完整 API 文档
              </Link>
              <Link
                href="/ai-api/models"
                className="block text-center py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-medium transition-colors border border-gray-700"
              >
                浏览支持的模型
              </Link>
            </div>
          </div>
        </section>
      ) : (
        <section className="px-6 pb-16 text-center">
          <div className="max-w-xl mx-auto">
            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-2xl p-6">
              <div className="text-4xl mb-4">⏳</div>
              <h2 className="text-xl font-bold mb-2">支付确认中...</h2>
              <p className="text-gray-400 text-sm mb-4">
                支付已收到，API Key 正在生成中。请稍等 1-2 分钟。
              </p>
              <p className="text-gray-500 text-xs">
                如果 5 分钟后仍未收到 Key，请联系客服
              </p>
            </div>
          </div>
        </section>
      )}

      <footer className="px-6 py-8 border-t border-gray-800 text-center text-gray-500 text-sm">
        © 2026 香港长江国际有限公司 · RiverGPU.com
      </footer>
    </div>
  );
}
