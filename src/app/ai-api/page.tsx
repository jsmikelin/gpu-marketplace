import Link from 'next/link';

export default function AIAPIPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Hero */}
      <section className="relative overflow-hidden px-6 py-32 text-center">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-transparent to-purple-900/20" />
        <div className="relative max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm mb-8">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            AI API 转售平台 — 即将上线
          </div>
          <h1 className="text-5xl font-bold mb-6 leading-tight">
            全球顶级 AI 模型
            <br />
            <span className="text-blue-400">一个平台，全部搞定</span>
          </h1>
          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
            通过香港长江国际有限公司接入 Mars AI 聚合网络，覆盖 GPT-4o、Claude 3.5、DeepSeek V3、Gemini 等数十个模型。无需科学上网，全球直连。
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/ai-api/pricing"
              className="px-8 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium transition-colors"
            >
              查看套餐
            </Link>
            <Link
              href="/ai-api/docs"
              className="px-8 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-medium transition-colors border border-gray-700"
            >
              API 文档
            </Link>
          </div>
        </div>
      </section>

      {/* 模型展示 */}
      <section className="px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">支持的模型</h2>
          <p className="text-gray-400 text-center mb-12">一个 API Key，调用所有主流模型</p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: 'GPT-4o', provider: 'OpenAI', color: 'bg-green-500/10 border-green-500/20 text-green-400', desc: '最新旗舰多模态' },
              { name: 'GPT-4o Mini', provider: 'OpenAI', color: 'bg-green-500/10 border-green-500/20 text-green-400', desc: '高性价比快速响应' },
              { name: 'Claude 3.5', provider: 'Anthropic', color: 'bg-orange-500/10 border-orange-500/20 text-orange-400', desc: '超强推理与写作' },
              { name: 'Claude Opus 4', provider: 'Anthropic', color: 'bg-orange-500/10 border-orange-500/20 text-orange-400', desc: '最高智能水平' },
              { name: 'DeepSeek V3', provider: 'DeepSeek', color: 'bg-blue-500/10 border-blue-500/20 text-blue-400', desc: '国产顶级开源' },
              { name: 'DeepSeek R1', provider: 'DeepSeek', color: 'bg-blue-500/10 border-blue-500/20 text-blue-400', desc: '深度推理专家' },
              { name: 'Gemini 2.5 Pro', provider: 'Google', color: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400', desc: 'Google 最强模型' },
              { name: 'Gemini 2.5 Flash', provider: 'Google', color: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400', desc: '极速响应低成本' },
            ].map((model) => (
              <div key={model.name} className={`p-5 rounded-xl border ${model.color}`}>
                <div className="text-xs font-medium opacity-60 mb-1">{model.provider}</div>
                <div className="font-semibold text-base mb-1">{model.name}</div>
                <div className="text-xs opacity-70">{model.desc}</div>
              </div>
            ))}
          </div>

          <p className="text-center text-gray-500 text-sm mt-6">
            还有 GPT-4.1、Claude Sonnet、GLM-4/5、Whisper、TTS 等数十个模型...
          </p>
        </div>
      </section>

      {/* 优势 */}
      <section className="px-6 py-20 bg-gray-900/50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">为什么选择我们</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: '全球直连',
                desc: '无需 VPN，直接访问 OpenAI、Anthropic、Google 等官方 API。',
                icon: '🌐',
              },
              {
                title: '价格更低',
                desc: '通过聚合采购，成本比官方更低。透明定价，无隐藏费用。',
                icon: '💰',
              },
              {
                title: '稳定可靠',
                desc: '企业级高速线路，99.9% 可用性保障，多地区冗余部署。',
                icon: '⚡',
              },
              {
                title: '一个 Key 全通用',
                desc: '一个 API Key 调用所有支持的模型，无需管理多个账户。',
                icon: '🔑',
              },
              {
                title: '实时用量明细',
                desc: '随时查看调用记录、用量统计，清晰了解消费情况。',
                icon: '📊',
              },
              {
                title: '技术团队支持',
                desc: '提供技术对接支持，快速响应你的集成问题。',
                icon: '🎯',
              },
            ].map((item) => (
              <div key={item.title} className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
                <div className="text-3xl mb-4">{item.icon}</div>
                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">准备好接入了？</h2>
          <p className="text-gray-400 mb-8">
            注册账户，选择套餐，获取 API Key，最快 5 分钟完成接入。
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/auth/signup"
              className="px-8 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium transition-colors"
            >
              立即开始
            </Link>
            <Link
              href="/ai-api/docs"
              className="px-8 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-medium transition-colors border border-gray-700"
            >
              查看文档
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 border-t border-gray-800 text-center text-gray-500 text-sm">
        香港长江国际有限公司 · © 2026 RiverGPU.com · 
        <Link href="/ai-api/docs" className="text-blue-400 hover:text-blue-300 ml-1">API 文档</Link>
      </footer>
    </div>
  );
}
