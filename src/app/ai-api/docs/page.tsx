export default function DocsPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold mb-2">API 文档</h1>
        <p className="text-gray-400 mb-12">
          完全兼容 OpenAI API，零成本迁移现有应用
        </p>

        {/* 快速开始 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 border-b border-gray-800 pb-2">快速开始</h2>
          
          <div className="space-y-6">
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <h3 className="font-semibold mb-4">1. 获取 API Key</h3>
              <p className="text-gray-400 text-sm mb-4">
                注册并购买套餐后，在 Dashboard → AI API → API Keys 页面创建 Key。
              </p>
            </div>

            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <h3 className="font-semibold mb-4">2. 调用 API</h3>
              <p className="text-gray-400 text-sm mb-4">
                将 OpenAI 的 API 地址换成你的域名，即可自动路由到 Mars AI：
              </p>
              <div className="bg-gray-950 rounded-lg p-4 text-sm font-mono text-green-400 overflow-x-auto">
{`# 官方（需要 VPN）
https://api.openai.com/v1/chat/completions

# 你的网站（无需 VPN）
https://rivergpu.com/api/ai/v1/chat/completions`}
              </div>
            </div>

            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <h3 className="font-semibold mb-4">3. 代码示例</h3>
              <p className="text-gray-400 text-sm mb-4">Python 示例：</p>
              <div className="bg-gray-950 rounded-lg p-4 text-sm font-mono text-green-400 overflow-x-auto">
{`from openai import OpenAI

client = OpenAI(
    api_key="riv_your_api_key_here",
    base_url="https://rivergpu.com/api/ai/v1"  # 改成你的网站地址
)

response = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[{"role": "user", "content": "Hello!"}]
)

print(response.choices[0].message.content)`}
              </div>
            </div>

            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <h3 className="font-semibold mb-4">Node.js 示例：</h3>
              <div className="bg-gray-950 rounded-lg p-4 text-sm font-mono text-green-400 overflow-x-auto">
{`import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: 'riv_your_api_key_here',
  baseURL: 'https://rivergpu.com/api/ai/v1',
});

const chat = await client.chat.completions.create({
  model: 'gpt-4o-mini',
  messages: [{ role: 'user', content: 'Hello!' }],
});

console.log(chat.choices[0].message.content);`}
              </div>
            </div>
          </div>
        </section>

        {/* 支持的模型 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 border-b border-gray-800 pb-2">支持的模型</h2>
          <div className="grid gap-3">
            {[
              { cat: 'OpenAI', models: 'gpt-4o, gpt-4o-mini, gpt-4.1, gpt-4.1-mini, gpt-4.1-nano' },
              { cat: 'Anthropic', models: 'claude-opus-4.6, claude-sonnet-4.6, claude-haiku-4-5-20251001' },
              { cat: 'DeepSeek', models: 'deepseek-v3, deepseek-v3.2, deepseek-r1, deepseek-r1-distill-qwen-32b' },
              { cat: 'Google', models: 'gemini-2.5-flash, gemini-2.5-pro, gemini-3-pro-preview' },
              { cat: '智谱 AI', models: 'glm-4.6, glm-4.7, glm-5' },
              { cat: '语音', models: 'whisper-1, tts-1, tts-1-hd' },
            ].map((item) => (
              <div key={item.cat} className="flex gap-4 bg-gray-900 rounded-lg p-4 border border-gray-800">
                <div className="w-24 flex-shrink-0 text-gray-400 text-sm font-medium pt-1">{item.cat}</div>
                <div className="text-gray-300 text-sm font-mono">{item.models}</div>
              </div>
            ))}
          </div>
        </section>

        {/* 错误码 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 border-b border-gray-800 pb-2">错误码</h2>
          <div className="space-y-2">
            {[
              { code: '401', msg: 'API Key 无效或未提供' },
              { code: '403', msg: 'API Key 被禁用或账户欠费' },
              { code: '429', msg: '本月额度已用完，请升级套餐' },
              { code: '500', msg: '上游供应商服务器错误' },
              { code: '503', msg: '服务暂时不可用，请稍后重试' },
            ].map((e) => (
              <div key={e.code} className="flex gap-4 bg-gray-900 rounded-lg p-4 border border-gray-800">
                <span className="font-mono text-red-400 w-12">{e.code}</span>
                <span className="text-gray-300 text-sm">{e.msg}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm pt-8 border-t border-gray-800">
          遇到问题？<a href="mailto:support@rivergpu.com" className="text-blue-400">联系技术支持</a>
        </div>
      </div>
    </div>
  );
}
