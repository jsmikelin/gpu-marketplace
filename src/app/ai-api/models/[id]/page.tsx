import { notFound } from 'next/navigation';

export async function generateStaticParams() {
  return [
    { id: 'gpt-4o-mini' },
    { id: 'gpt-4o' },
    { id: 'claude-3-5-sonnet' },
    { id: 'claude-opus-4' },
    { id: 'deepseek-v3' },
    { id: 'deepseek-r1' },
    { id: 'gemini-2-5-flash' },
    { id: 'gemini-2-5-pro' },
    { id: 'glm-4' },
  ];
}

const MODELS: Record<string, {
  name: string; provider: string; providerUrl: string;
  tagline: string; description: string;
  useCases: string[]; features: string[];
  inputPrice: number; outputPrice: number;
  retailInput: number; retailOutput: number;
  contextWindow: string; speed: string; latency: string;
  icon: string; color: string; colorText: string;
  officialInput: number; officialOutput: number;
  codeExample: string; modelId: string;
  metaTitle: string; metaDesc: string;
}> = {
  'gpt-4o-mini': {
    modelId: 'gpt-4o-mini',
    name: 'GPT-4o Mini', provider: 'OpenAI', providerUrl: 'https://openai.com',
    tagline: 'High performance at unbeatable cost',
    description: 'GPT-4o Mini is OpenAI\'s most cost-efficient model, delivering exceptional performance for a wide range of tasks at a fraction of the cost of larger models. Perfect for high-volume applications where speed and cost matter most.',
    useCases: ['Chatbots & virtual assistants', 'Content generation & copywriting', 'Code completion & refactoring', 'Data extraction & classification', 'Multilingual translation'],
    features: ['128K context window', 'Multimodal (text + vision)', 'Sub-second response time', 'Native function calling', 'JSON mode support'],
    inputPrice: 0.075, outputPrice: 0.30,
    retailInput: 0.12, retailOutput: 0.48,
    contextWindow: '128K tokens', speed: '<1s', latency: '~200ms',
    officialInput: 0.15, officialOutput: 0.60,
    icon: '🤖', color: 'from-green-600 to-green-700', colorText: 'text-green-400',
    metaTitle: 'GPT-4o Mini API — $0.12/M Tokens — RiverGPU',
    metaDesc: 'Access GPT-4o Mini via API at $0.12/M input tokens. 50% cheaper than OpenAI official. No VPN required. 128K context. Sign up free.',
    codeExample: `from openai import OpenAI
client = OpenAI(
    api_key="YOUR_RIVERGPU_KEY",
    base_url="https://rivergpu.com/api/ai/v1"
)
resp = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[{"role": "user", "content": "Explain quantum computing in simple terms"}]
)
print(resp.choices[0].message.content)`,
  },
  'gpt-4o': {
    modelId: 'gpt-4o',
    name: 'GPT-4o', provider: 'OpenAI', providerUrl: 'https://openai.com',
    tagline: 'OpenAI\'s flagship multimodal model',
    description: 'GPT-4o ("omni") is OpenAI\'s most advanced model, understanding text, audio, and images in real-time. Sets the benchmark for complex reasoning, creative tasks, and vision understanding.',
    useCases: ['Advanced reasoning & analysis', 'Image & document understanding', 'Creative writing & brainstorming', 'Complex code generation', 'Real-time audio vision'],
    features: ['128K context window', 'Native multimodal', 'Real-time audio/vision', 'Advanced reasoning', 'Function calling & tool use'],
    inputPrice: 1.25, outputPrice: 5.00,
    retailInput: 2.00, retailOutput: 8.00,
    contextWindow: '128K tokens', speed: 'Fast', latency: '~400ms',
    officialInput: 2.50, officialOutput: 10.00,
    icon: '🚀', color: 'from-green-500 to-emerald-600', colorText: 'text-green-400',
    metaTitle: 'GPT-4o API — $2.00/M Input — RiverGPU',
    metaDesc: 'GPT-4o API access at $2.00/M input tokens. 20% below OpenAI official price. Multimodal — text, images, audio. No VPN needed.',
    codeExample: `from openai import OpenAI
client = OpenAI(
    api_key="YOUR_RIVERGPU_KEY",
    base_url="https://rivergpu.com/api/ai/v1"
)
resp = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Analyze this data and suggest improvements"}]
)
print(resp.choices[0].message.content)`,
  },
  'claude-3-5-sonnet': {
    modelId: 'claude-sonnet-4-20250514',
    name: 'Claude 3.5 Sonnet', provider: 'Anthropic', providerUrl: 'https://anthropic.com',
    tagline: 'Best-in-class reasoning and writing',
    description: 'Claude 3.5 Sonnet delivers Anthropic\'s best balance of intelligence and speed. Exceptional at analyzing long documents, writing, and multi-step reasoning. 200K context for massive documents.',
    useCases: ['Long document analysis & summarization', 'Code review & generation', 'Technical writing', 'Research & due diligence', 'Conversational AI'],
    features: ['200K context window', 'Industry-leading writing quality', 'Extended reasoning chain', 'Table & document parsing', 'Code execution'],
    inputPrice: 1.50, outputPrice: 7.50,
    retailInput: 2.50, retailOutput: 12.00,
    contextWindow: '200K tokens', speed: 'Fast', latency: '~350ms',
    officialInput: 3.00, officialOutput: 15.00,
    icon: '📝', color: 'from-orange-500 to-orange-600', colorText: 'text-orange-400',
    metaTitle: 'Claude 3.5 Sonnet API — $2.50/M Tokens — RiverGPU',
    metaDesc: 'Claude 3.5 Sonnet API access at $2.50/M input tokens. 17% below Anthropic official. 200K context. Best for long documents and code. No VPN.',
    codeExample: `from anthropic import Anthropic
client = Anthropic(
    api_key="YOUR_RIVERGPU_KEY",
    base_url="https://rivergpu.com/api/ai/v1"
)
resp = client.messages.create(
    model="claude-3-5-sonnet-20250514",
    max_tokens=1024,
    messages=[{"role": "user", "content": "Review this code for security issues"}]
)
print(resp.content[0].text)`,
  },
  'claude-opus-4': {
    modelId: 'claude-opus-4-6',
    name: 'Claude Opus 4', provider: 'Anthropic', providerUrl: 'https://anthropic.com',
    tagline: 'Maximum intelligence for complex tasks',
    description: 'Claude Opus 4 is Anthropic\'s most capable model for the most demanding tasks. Maximum reasoning depth, nuanced understanding, and precise instruction following for complex problem-solving.',
    useCases: ['Complex research & analysis', 'Multi-step problem solving', 'Strategic planning', 'Deep code understanding', 'High-stakes decision support'],
    features: ['200K context window', 'Maximum reasoning capability', 'Superior instruction following', 'Nuanced judgment', 'Complex task completion'],
    inputPrice: 7.50, outputPrice: 37.50,
    retailInput: 12.00, retailOutput: 60.00,
    contextWindow: '200K tokens', speed: 'Standard', latency: '~600ms',
    officialInput: 15.00, officialOutput: 75.00,
    icon: '🧠', color: 'from-orange-600 to-amber-600', colorText: 'text-orange-400',
    metaTitle: 'Claude Opus 4 API — $12.00/M Input — RiverGPU',
    metaDesc: 'Claude Opus 4 API at $12.00/M input. 20% below Anthropic official. Best for complex research and high-stakes analysis. No VPN required.',
    codeExample: `from anthropic import Anthropic
client = Anthropic(
    api_key="YOUR_RIVERGPU_KEY",
    base_url="https://rivergpu.com/api/ai/v1"
)
resp = client.messages.create(
    model="claude-opus-4-6",
    max_tokens=2048,
    messages=[{"role": "user", "content": "Design a distributed system architecture"}]
)
print(resp.content[0].text)`,
  },
  'deepseek-v3': {
    modelId: 'deepseek-v3',
    name: 'DeepSeek V3', provider: 'DeepSeek', providerUrl: 'https://deepseek.com',
    tagline: 'Best open-source value',
    description: 'DeepSeek V3 is a cutting-edge open-source model rivaling GPT-4o at a fraction of the cost. Developed by Chinese AI lab DeepSeek, excelling at code and technical tasks.',
    useCases: ['Code generation & debugging', 'Technical documentation', 'Math & reasoning', 'Multilingual tasks', 'Research assistance'],
    features: ['64K context window', 'Expert code generation', 'Strong reasoning', 'Cost-efficient', 'Open weights available'],
    inputPrice: 0.135, outputPrice: 0.54,
    retailInput: 0.22, retailOutput: 0.88,
    contextWindow: '64K tokens', speed: 'Fast', latency: '~250ms',
    officialInput: 0.27, officialOutput: 1.08,
    icon: '🔱', color: 'from-blue-600 to-blue-700', colorText: 'text-blue-400',
    metaTitle: 'DeepSeek V3 API — $0.22/M Tokens — RiverGPU',
    metaDesc: 'DeepSeek V3 API at $0.22/M input tokens. 19% below official. Open-source model rivaling GPT-4. Great for code and technical tasks. No VPN.',
    codeExample: `from openai import OpenAI
client = OpenAI(
    api_key="YOUR_RIVERGPU_KEY",
    base_url="https://rivergpu.com/api/ai/v1"
)
resp = client.chat.completions.create(
    model="deepseek-v3",
    messages=[{"role": "user", "content": "Write a Python function to sort a list"}]
)
print(resp.choices[0].message.content)`,
  },
  'deepseek-r1': {
    modelId: 'deepseek-r1',
    name: 'DeepSeek R1', provider: 'DeepSeek', providerUrl: 'https://deepseek.com',
    tagline: 'Advanced reasoning expert',
    description: 'DeepSeek R1 specializes in chain-of-thought reasoning. Excels at math, logic puzzles, and complex problem-solving by showing its thinking process.',
    useCases: ['Math & physics problems', 'Logical reasoning puzzles', 'Code debugging & optimization', 'Research synthesis', 'Step-by-step analysis'],
    features: ['64K context window', 'Chain-of-thought reasoning', 'Visible thinking process', 'Expert math capability', 'Self-verification'],
    inputPrice: 0.135, outputPrice: 0.54,
    retailInput: 0.22, retailOutput: 0.88,
    contextWindow: '64K tokens', speed: 'Standard', latency: '~500ms',
    officialInput: 0.27, officialOutput: 1.08,
    icon: '🔬', color: 'from-cyan-600 to-blue-700', colorText: 'text-cyan-400',
    metaTitle: 'DeepSeek R1 API — $0.22/M Tokens — RiverGPU',
    metaDesc: 'DeepSeek R1 API at $0.22/M input. Chain-of-thought reasoning model. Great for math, logic, and complex problem-solving. 19% off official price.',
    codeExample: `from openai import OpenAI
client = OpenAI(
    api_key="YOUR_RIVERGPU_KEY",
    base_url="https://rivergpu.com/api/ai/v1"
)
resp = client.chat.completions.create(
    model="deepseek-r1",
    messages=[{"role": "user", "content": "Prove that there are infinitely many prime numbers"}]
)
print(resp.choices[0].message.content)`,
  },
  'gemini-2-5-flash': {
    modelId: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash', provider: 'Google', providerUrl: 'https://deepmind.google',
    tagline: 'Blazing fast at ultra-low cost',
    description: 'Gemini 2.5 Flash is Google\'s optimized model balancing speed and capability. Incredibly fast responses at the lowest price point. 1M token context makes it ideal for massive documents.',
    useCases: ['High-volume batch processing', 'Document summarization', 'Quick translations', 'Real-time chat', 'Long document Q&A'],
    features: ['1M context window', 'Ultra-fast response', 'Native multimodal', 'Lowest cost per token', 'Excellent batch performance'],
    inputPrice: 0.0375, outputPrice: 0.15,
    retailInput: 0.08, retailOutput: 0.30,
    contextWindow: '1M tokens', speed: 'Instant', latency: '~150ms',
    officialInput: 0.075, officialOutput: 0.30,
    icon: '⚡', color: 'from-yellow-500 to-orange-500', colorText: 'text-yellow-400',
    metaTitle: 'Gemini 2.5 Flash API — $0.08/M Tokens — RiverGPU',
    metaDesc: 'Gemini 2.5 Flash API at $0.08/M input tokens. 1M context window. Ultra-fast. Lowest cost per token. No VPN needed. Start free.',
    codeExample: `import google.generativeai as genai
genai.configure(api_key="YOUR_RIVERGPU_KEY", base_url="https://rivergpu.com/api/ai/v1")
model = genai.GenerativeModel("gemini-2.5-flash")
resp = model.generate_content("Summarize this article in 3 sentences")
print(resp.text)`,
  },
  'gemini-2-5-pro': {
    modelId: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro', provider: 'Google', providerUrl: 'https://deepmind.google',
    tagline: 'Google\'s most powerful model',
    description: 'Gemini 2.5 Pro is Google\'s most capable model with a groundbreaking 1M token context window. Handles entire codebases, books, and document collections in a single prompt.',
    useCases: ['Analyzing entire codebases', 'Long document understanding', 'Complex multimodal tasks', 'Research synthesis', 'Large-scale data analysis'],
    features: ['1M context window', 'Google\'s最强 capability', 'Native multimodal', 'Code understanding', 'Long-range dependencies'],
    inputPrice: 0.625, outputPrice: 2.50,
    retailInput: 1.00, retailOutput: 4.00,
    contextWindow: '1M tokens', speed: 'Fast', latency: '~400ms',
    officialInput: 1.25, officialOutput: 5.00,
    icon: '🌟', color: 'from-yellow-400 to-amber-500', colorText: 'text-yellow-400',
    metaTitle: 'Gemini 2.5 Pro API — $1.00/M Tokens — RiverGPU',
    metaDesc: 'Gemini 2.5 Pro API at $1.00/M input. 20% below Google official. 1M token context — analyze entire codebases. No VPN required.',
    codeExample: `import google.generativeai as genai
genai.configure(api_key="YOUR_RIVERGPU_KEY", base_url="https://rivergpu.com/api/ai/v1")
model = genai.GenerativeModel("gemini-2.5-pro")
resp = model.generate_content("Analyze this entire codebase for security issues")
print(resp.text)`,
  },
  'glm-4': {
    modelId: 'glm-4.6',
    name: 'GLM-4', provider: 'Zhipu AI', providerUrl: 'https://zhipuai.cn',
    tagline: 'China\'s leading open-source LLM',
    description: 'GLM-4 from Zhipu AI is China\'s most capable open-source model. Excellent Chinese language processing, competitive pricing, and strong performance on business tasks.',
    useCases: ['Chinese language tasks', 'Business document processing', 'Code generation', 'Multimodal tasks', 'Enterprise applications'],
    features: ['128K context window', 'Excellent Chinese capability', 'Multimodal support', 'Cost-effective', 'Strong business performance'],
    inputPrice: 0.07, outputPrice: 0.28,
    retailInput: 0.14, retailOutput: 0.55,
    contextWindow: '128K tokens', speed: 'Fast', latency: '~200ms',
    officialInput: 0.14, officialOutput: 0.56,
    icon: '🇨🇳', color: 'from-red-500 to-pink-600', colorText: 'text-red-400',
    metaTitle: 'GLM-4 API — $0.14/M Tokens — RiverGPU — China AI Model',
    metaDesc: 'GLM-4 API access at $0.14/M input. China\'s best open-source LLM. Excellent Chinese language. 128K context. Direct access without VPN.',
    codeExample: `from openai import OpenAI
client = OpenAI(
    api_key="YOUR_RIVERGPU_KEY",
    base_url="https://rivergpu.com/api/ai/v1"
)
resp = client.chat.completions.create(
    model="glm-4.6",
    messages=[{"role": "user", "content": "分析这份中文商业报告"}]
)
print(resp.choices[0].message.content)`,
  },
};

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const model = MODELS[id];
  if (!model) return {};
  return {
    title: model.metaTitle,
    description: model.metaDesc,
    openGraph: {
      title: model.metaTitle,
      description: model.metaDesc,
      type: 'website',
    },
  };
}

export default async function ModelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const model = MODELS[id];
  if (!model) notFound();

  const savingsInput = (((model.officialInput - model.retailInput) / model.officialInput) * 100).toFixed(0);
  const savingsOutput = (((model.officialOutput - model.retailOutput) / model.officialOutput) * 100).toFixed(0);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Breadcrumb */}
      <div className="border-b border-gray-800 bg-gray-900/50">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <nav className="flex items-center gap-2 text-sm text-gray-500">
            <a href="/ai-api" className="hover:text-white transition-colors">AI API</a>
            <span>›</span>
            <a href="/ai-api/models" className="hover:text-white transition-colors">Models</a>
            <span>›</span>
            <span className="text-gray-300">{model.name}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Hero */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-4xl">{model.icon}</span>
            <div>
              <div className="text-sm text-gray-500 uppercase tracking-wider">{model.provider}</div>
              <h1 className="text-4xl font-bold">{model.name}</h1>
            </div>
          </div>
          <p className="text-xl text-gray-400 leading-relaxed max-w-2xl">{model.description}</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Pricing */}
            <div className={`bg-gradient-to-br ${model.color} bg-opacity-10 border border-gray-700/50 rounded-2xl p-6`}>
              <h2 className="font-bold text-lg mb-4">API Pricing</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-black/20 rounded-xl p-4">
                  <div className="text-xs text-gray-400 mb-1">Input (per 1M tokens)</div>
                  <div className="text-3xl font-bold">${model.retailInput}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Official: ${model.officialInput} · <span className="text-green-400">{savingsInput}% cheaper</span>
                  </div>
                </div>
                <div className="bg-black/20 rounded-xl p-4">
                  <div className="text-xs text-gray-400 mb-1">Output (per 1M tokens)</div>
                  <div className="text-3xl font-bold">${model.retailOutput}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Official: ${model.officialOutput} · <span className="text-green-400">{savingsOutput}% cheaper</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Code Example */}
            <div>
              <h2 className="font-bold text-lg mb-4">Quick Start</h2>
              <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-800">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/60" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                    <div className="w-3 h-3 rounded-full bg-green-500/60" />
                  </div>
                  <span className="text-xs text-gray-500 ml-2">Python example</span>
                </div>
                <pre className="p-4 text-sm font-mono text-green-400 overflow-x-auto leading-relaxed">
                  <code>{model.codeExample}</code>
                </pre>
              </div>
            </div>

            {/* Use Cases */}
            <div>
              <h2 className="font-bold text-lg mb-4">Best For</h2>
              <div className="grid grid-cols-2 gap-3">
                {model.useCases.map((uc) => (
                  <div key={uc} className="flex items-center gap-2 text-sm text-gray-300">
                    <span className="text-green-400">✓</span>
                    {uc}
                  </div>
                ))}
              </div>
            </div>

            {/* Features */}
            <div>
              <h2 className="font-bold text-lg mb-4">Features</h2>
              <div className="grid grid-cols-2 gap-2">
                {model.features.map((f) => (
                  <div key={f} className="flex items-center gap-2 text-sm text-gray-300 bg-gray-900 rounded-lg px-3 py-2">
                    <span className="text-blue-400">●</span>
                    {f}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stats */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h3 className="font-semibold mb-4 text-sm text-gray-400 uppercase tracking-wider">Model Info</h3>
              <div className="space-y-4">
                <div>
                  <div className="text-xs text-gray-500">Context Window</div>
                  <div className="font-semibold">{model.contextWindow}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Speed</div>
                  <div className="font-semibold">{model.speed}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Avg. Latency</div>
                  <div className="font-semibold">{model.latency}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Internal Model ID</div>
                  <div className="font-mono text-xs text-gray-400 mt-1 bg-gray-800 rounded px-2 py-1 break-all">
                    {model.modelId}
                  </div>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <div className="text-sm text-gray-400 mb-2">Get API Access</div>
              <a
                href="/auth/signup"
                className="block text-center py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium transition-colors mb-2"
              >
                Get Free API Key
              </a>
              <a
                href="/ai-api/docs"
                className="block text-center py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-medium transition-colors text-sm border border-gray-700"
              >
                View Full Docs
              </a>
            </div>

            {/* Supplier Status */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h3 className="font-semibold mb-4 text-sm text-gray-400 uppercase tracking-wider">
                Active Suppliers
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-400" />
                    <span>Mars AI</span>
                  </div>
                  <span className="text-green-400 text-xs">Active</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-gray-600" />
                    <span>Supplier B</span>
                  </div>
                  <span className="text-gray-500 text-xs">Coming soon</span>
                </div>
              </div>
              <div className="mt-3 text-xs text-gray-500">
                Routing: <span className="text-green-400">Price optimized</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="px-6 py-8 border-t border-gray-800 text-center text-gray-500 text-sm mt-16">
        © 2026 香港长江国际有限公司 · RiverGPU.com
      </footer>
    </div>
  );
}
