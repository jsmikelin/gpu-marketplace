import Link from 'next/link';
import { CheckoutButton } from './components/CheckoutButton';

const PLANS = [
  {
    name: 'Starter',
    credits: '100万 Tokens',
    creditsRaw: 1_000_000,
    price: 9.9,
    priceUnit: '月',
    description: '适合个人开发者和测试用途',
    features: [
      'GPT-4o Mini / GPT-4.1 Mini',
      'Claude Haiku / Sonnet',
      'DeepSeek V3 / R1',
      'Gemini 2.5 Flash',
      '实时用量统计',
      'Email 支持',
    ],
    highlight: false,
    cta: '立即购买',
  },
  {
    name: 'Pro',
    credits: '1000万 Tokens',
    creditsRaw: 10_000_000,
    price: 69,
    priceUnit: '月',
    description: '适合中小企业和中等规模应用',
    features: [
      '全部可用模型',
      'GPT-4o / Claude 3.5 / Gemini 2.5 Pro',
      '优先调用通道',
      '实时用量统计',
      'API Key 管理',
      '技术客服支持',
    ],
    highlight: true,
    cta: '推荐选择',
  },
  {
    name: 'Enterprise',
    credits: '无限畅用',
    creditsRaw: -1,
    price: '定制',
    priceUnit: '',
    description: '适合大规模商业应用',
    features: [
      '全部模型 + 定制额度',
      '专属客户经理',
      'SLA 服务保障',
      '自定义账单周期',
      'API 优先级通道',
      '7×24 紧急支持',
    ],
    highlight: false,
    cta: '联系销售',
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="px-6 py-16 text-center border-b border-gray-800">
        <h1 className="text-4xl font-bold mb-4">AI API 套餐</h1>
        <p className="text-gray-400 text-lg max-w-xl mx-auto">
          选择适合你的套餐，所有模型统一计费，一个 Key 全部通用
        </p>
      </div>

      {/* 提示 */}
      <div className="px-6 py-6 bg-blue-900/20 border-b border-blue-800/20">
        <div className="max-w-5xl mx-auto flex items-center gap-3 text-sm text-blue-300">
          <span>💡</span>
          <span>
            <strong>提示：</strong>套餐额度按月重置。所有模型统一计费，不区分输入/输出。
            价格基于 Mars AI 聚合网络实时成本，如有调整提前通知。
          </span>
        </div>
      </div>

      {/* Plans */}
      <section className="px-6 py-16">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl border p-8 flex flex-col ${
                  plan.highlight
                    ? 'bg-blue-900/10 border-blue-500/40 shadow-xl shadow-blue-500/5'
                    : 'bg-gray-900 border-gray-800'
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-blue-600 rounded-full text-xs font-medium">
                    最受欢迎
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                  <p className="text-gray-400 text-sm">{plan.description}</p>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    {typeof plan.price === 'number' ? (
                      <>
                        <span className="text-4xl font-bold">${plan.price}</span>
                        <span className="text-gray-400">/{plan.priceUnit}</span>
                      </>
                    ) : (
                      <span className="text-3xl font-bold">{plan.price}</span>
                    )}
                  </div>
                  <div className="text-gray-500 text-sm mt-1">{plan.credits}</div>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                      <span className="text-green-400">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>

                <CheckoutButton
                  planSlug={plan.name.toLowerCase()}
                  planName={plan.name}
                  price={plan.price}
                  highlight={plan.highlight}
                  disabled={plan.name === 'Enterprise'}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 py-16 bg-gray-900/50 border-t border-gray-800">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-8 text-center">常见问题</h2>
          <div className="space-y-6">
            {[
              {
                q: '额度没用完可以累积到下个月吗？',
                a: '目前套餐额度按月重置，不累积。建议按月升级套餐。',
              },
              {
                q: '支持哪些支付方式？',
                a: '支持信用卡（Stripe）、PayPal、银行转账，大额可分期。',
              },
              {
                q: 'API 调用失败会扣额度吗？',
                a: '不会。只有成功调用的请求才会消耗额度。',
              },
              {
                q: '如何查看用量明细？',
                a: '登录后进入 Dashboard → AI API → 用量统计，实时查看每次调用的明细。',
              },
            ].map((item) => (
              <div key={item.q} className="border border-gray-800 rounded-xl p-6">
                <h3 className="font-medium mb-2">{item.q}</h3>
                <p className="text-gray-400 text-sm">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="px-6 py-8 border-t border-gray-800 text-center">
        <p className="text-gray-500 text-sm">
          © 2026 香港长江国际有限公司 · RiverGPU.com
        </p>
      </footer>
    </div>
  );
}
