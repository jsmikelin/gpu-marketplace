export const metadata = {
  title: 'AI Models & Pricing — GPT-4o, Claude, DeepSeek, Gemini',
  description:
    'Browse all available AI models. GPT-4o Mini from $0.12/M tokens, Claude 3.5 from $2.50/M, DeepSeek V3 from $0.22/M. One API key, all models. Global direct access.',
};

const MODELS = [
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'OpenAI',
    tagline: 'High performance, low cost',
    description:
      'Fast, affordable, and capable. Ideal for high-volume applications, chatbots, and tasks that require quick responses at scale.',
    useCases: ['Chatbots', 'Content generation', 'Code completion', 'Data extraction'],
    inputPrice: 0.075,
    outputPrice: 0.30,
    retailInput: 0.12,
    retailOutput: 0.48,
    contextWindow: '128K tokens',
    speed: 'Instant',
    icon: '🤖',
    color: 'from-green-600 to-green-700',
    popular: true,
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    tagline: 'Flagship multimodal',
    description:
      'OpenAI\'s latest flagship model with native multimodality. Best for complex reasoning, creative tasks, and vision understanding.',
    useCases: ['Advanced reasoning', 'Image understanding', 'Creative writing', 'Code generation'],
    inputPrice: 1.25,
    outputPrice: 5.00,
    retailInput: 2.00,
    retailOutput: 8.00,
    contextWindow: '128K tokens',
    speed: 'Fast',
    icon: '🚀',
    color: 'from-green-500 to-emerald-600',
    popular: true,
  },
  {
    id: 'claude-3-5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    tagline: 'Exceptional reasoning & writing',
    description:
      'Best-in-class for nuanced reasoning, long documents, and sophisticated writing. Extended context for analyzing large codebases.',
    useCases: ['Long document analysis', 'Code review', 'Technical writing', 'Research'],
    inputPrice: 1.50,
    outputPrice: 7.50,
    retailInput: 2.50,
    retailOutput: 12.00,
    contextWindow: '200K tokens',
    speed: 'Fast',
    icon: '📝',
    color: 'from-orange-500 to-orange-600',
    popular: true,
  },
  {
    id: 'claude-opus-4',
    name: 'Claude Opus 4',
    provider: 'Anthropic',
    tagline: 'Highest intelligence level',
    description:
      'Anthropic\'s most capable model. For the most complex tasks requiring deep reasoning, multi-step analysis, and nuanced understanding.',
    useCases: ['Complex problem solving', 'Research', 'Strategic analysis', 'Long-context tasks'],
    inputPrice: 7.50,
    outputPrice: 37.50,
    retailInput: 12.00,
    retailOutput: 60.00,
    contextWindow: '200K tokens',
    speed: 'Standard',
    icon: '🧠',
    color: 'from-orange-600 to-amber-600',
    popular: false,
  },
  {
    id: 'deepseek-v3',
    name: 'DeepSeek V3',
    provider: 'DeepSeek',
    tagline: 'Best open-source value',
    description:
      'Cutting-edge open-source model from DeepSeek. Exceptional performance at a fraction of the cost. Great for code and technical tasks.',
    useCases: ['Code generation', 'Technical tasks', 'Reasoning', 'Multilingual'],
    inputPrice: 0.135,
    outputPrice: 0.54,
    retailInput: 0.22,
    retailOutput: 0.88,
    contextWindow: '64K tokens',
    speed: 'Fast',
    icon: '🔱',
    color: 'from-blue-600 to-blue-700',
    popular: true,
  },
  {
    id: 'deepseek-r1',
    name: 'DeepSeek R1',
    provider: 'DeepSeek',
    tagline: 'Advanced reasoning expert',
    description:
      'Specialized in complex reasoning, chain-of-thought analysis, and step-by-step problem solving. Perfect for math and logical tasks.',
    useCases: ['Math problems', 'Logical reasoning', 'Research', 'Code debugging'],
    inputPrice: 0.135,
    outputPrice: 0.54,
    retailInput: 0.22,
    retailOutput: 0.88,
    contextWindow: '64K tokens',
    speed: 'Standard',
    icon: '🔬',
    color: 'from-cyan-600 to-blue-700',
    popular: true,
  },
  {
    id: 'gemini-2-5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'Google',
    tagline: 'Fast & cost-effective',
    description:
      'Google\'s optimized flash model. Excellent speed at very low cost. Great for high-frequency, volume-driven applications.',
    useCases: ['High-volume tasks', 'Summarization', 'Translations', 'Quick queries'],
    inputPrice: 0.0375,
    outputPrice: 0.15,
    retailInput: 0.08,
    retailOutput: 0.30,
    contextWindow: '1M tokens',
    speed: 'Instant',
    icon: '⚡',
    color: 'from-yellow-500 to-orange-500',
    popular: false,
  },
  {
    id: 'gemini-2-5-pro',
    name: 'Gemini 2.5 Pro',
    provider: 'Google',
    tagline: 'Google\'s most powerful model',
    description:
      'Google\'s most capable model with 1M token context. Native multimodal understanding with industry-leading context length.',
    useCases: ['Long documents', 'Multimodal tasks', 'Complex analysis', 'Large codebase'],
    inputPrice: 0.625,
    outputPrice: 2.50,
    retailInput: 1.00,
    retailOutput: 4.00,
    contextWindow: '1M tokens',
    speed: 'Fast',
    icon: '🌟',
    color: 'from-yellow-400 to-amber-500',
    popular: false,
  },
  {
    id: 'glm-4',
    name: 'GLM-4',
    provider: 'Zhipu AI',
    tagline: 'Top Chinese open-source model',
    description:
      'China\'s leading open-source LLM from Zhipu AI. Excellent Chinese language capabilities at competitive pricing.',
    useCases: ['Chinese language', 'Multimodal tasks', 'Code generation', 'Business analysis'],
    inputPrice: 0.07,
    outputPrice: 0.28,
    retailInput: 0.14,
    retailOutput: 0.55,
    contextWindow: '128K tokens',
    speed: 'Fast',
    icon: '🇨🇳',
    color: 'from-red-500 to-pink-600',
    popular: false,
  },
];

export default function ModelsPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-6 py-16 text-center">
          <h1 className="text-4xl font-bold mb-4">AI Models & Pricing</h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            All major models in one place. Prices up to 50% lower than official APIs.
            No VPN required. Global direct access.
          </p>
        </div>
      </div>

      {/* Models Grid */}
      <section className="px-6 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {MODELS.map((model) => (
              <a
                key={model.id}
                href={`/ai-api/models/${model.id}`}
                className="group bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-gray-600 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/20"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{model.icon}</span>
                    <div>
                      <div className="text-xs text-gray-500 uppercase tracking-wider">{model.provider}</div>
                      <h2 className="font-bold text-lg group-hover:text-blue-400 transition-colors">
                        {model.name}
                      </h2>
                    </div>
                  </div>
                  {model.popular && (
                    <span className="text-xs bg-blue-500/10 border border-blue-500/30 text-blue-400 px-2 py-0.5 rounded-full">
                      Popular
                    </span>
                  )}
                </div>

                <p className="text-gray-400 text-sm mb-4 leading-relaxed">
                  {model.tagline}
                </p>

                {/* Pricing */}
                <div className="bg-gray-800/50 rounded-xl p-4 mb-4">
                  <div className="text-xs text-gray-500 mb-2">Input / Output price</div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold text-green-400">${model.retailInput}</span>
                    <span className="text-gray-500 text-xs">/1M in</span>
                    <span className="text-gray-600 mx-1">·</span>
                    <span className="text-xl font-bold text-green-400">${model.retailOutput}</span>
                    <span className="text-gray-500 text-xs">/1M out</span>
                  </div>
                </div>

                {/* Meta */}
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>📏 {model.contextWindow}</span>
                  <span>⚡ {model.speed}</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Compare Table */}
      <section className="px-6 py-16 border-t border-gray-800 bg-gray-900/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold mb-8 text-center">Price Comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Model</th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium">Input (1M)</th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium">Output (1M)</th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium">vs Official</th>
                </tr>
              </thead>
              <tbody>
                {MODELS.map((m) => {
                  const officialInput = (m.inputPrice * 2).toFixed(2);
                  const savings = (((parseFloat(officialInput) - m.retailInput) / parseFloat(officialInput)) * 100).toFixed(0);
                  return (
                    <tr key={m.id} className="border-b border-gray-800/50 hover:bg-gray-800/20 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-medium">{m.name}</span>
                        <span className="text-gray-500 text-xs ml-2">{m.provider}</span>
                      </td>
                      <td className="text-right py-3 px-4 text-green-400 font-mono">${m.retailInput}</td>
                      <td className="text-right py-3 px-4 text-green-400 font-mono">${m.retailOutput}</td>
                      <td className="text-right py-3 px-4 text-blue-400">~{savings}% off</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-16 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold mb-4">Get Started in Minutes</h2>
          <p className="text-gray-400 mb-8">
            One API key. All models. No VPN needed.
          </p>
          <div className="flex items-center justify-center gap-4">
            <a href="/auth/signup" className="px-8 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium transition-colors">
              Create Free Account
            </a>
            <a href="/ai-api/docs" className="px-8 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-medium transition-colors border border-gray-700">
              View API Docs
            </a>
          </div>
        </div>
      </section>

      <footer className="px-6 py-8 border-t border-gray-800 text-center text-gray-500 text-sm">
        © 2026 香港长江国际有限公司 · RiverGPU.com · Prices are for reference only and may vary.
      </footer>
    </div>
  );
}
