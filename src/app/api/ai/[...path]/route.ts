/**
 * AI API 代理核心
 * 路径: /api/ai/v1/chat/completions 等
 * 
 * 工作流程:
 * 1. 验证 API Key
 * 2. 检查用量限额
 * 3. 记录调用日志
 * 4. 转发给 Mars AI
 * 5. 返回结果给客户
 */

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// 供应商配置（正式环境建议存数据库）
const SUPPLIERS: Record<string, {
  apiBase: string;
  apiKey: string;
  markup: number;
}> = {
  'mars-ai': {
    apiBase: 'https://api.marsai.cloud',
    apiKey: process.env.MARS_AI_API_KEY || '',
    markup: 0, // 后续从数据库读取
  }
};

// 主力供应商
const DEFAULT_SUPPLIER = 'mars-ai';

// 初始化 Supabase（服务端）
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// SHA256 哈希
function hashKey(key: string): string {
  return crypto.createHash('sha256').update(key).update('rivergpu_salt').digest('hex');
}

// 从 Authorization header 提取 Key
function extractApiKey(request: NextRequest): string | null {
  const auth = request.headers.get('authorization') || '';
  if (auth.startsWith('Bearer ')) {
    return auth.slice(7).trim();
  }
  return null;
}

// 验证 API Key 并获取客户信息
async function validateApiKey(supabase: ReturnType<typeof createClient>, key: string) {
  const keyHash = hashKey(key);
  
  const { data, error } = await supabase
    .from('ai_api_keys')
    .select(`
      id, name, monthly_limit, used_this_month, status, expires_at,
      profile_id, plan_id, key_prefix,
      ai_plans(credits_amount)
    `)
    .eq('key_hash', keyHash)
    .single();

  if (error || !data) return { valid: false, reason: 'Invalid API key' };
  if (data.status !== 'active') return { valid: false, reason: 'API key is not active' };
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return { valid: false, reason: 'API key has expired' };
  }

  return { valid: true, keyData: data };
}

// 更新用量（异步，不阻塞返回）
async function recordUsage(
  supabase: ReturnType<typeof createClient>,
  keyId: string,
  tokens: number,
  costUsd: number,
  model: string,
  supplierId: string,
  latencyMs: number,
  error?: string
) {
  await supabase.from('ai_usage_logs').insert({
    api_key_id: keyId,
    model,
    prompt_tokens: 0,
    completion_tokens: 0,
    total_tokens: tokens,
    cost_usd: costUsd,
    supplier_id: supplierId,
    latency_ms: latencyMs,
    error_message: error || null,
  });

  // 更新本月已用
  await supabase
    .from('ai_api_keys')
    .update({ 
      used_this_month: supabase.rpc('increment', { x: tokens }),
      last_used_at: new Date().toISOString()
    })
    .eq('id', keyId);
}

// 计算 token 成本（简化估算）
function estimateCost(inputTokens: number, outputTokens: number, model: string): number {
  // GPT-4o Mini 参考价 ($/1M tokens)
  const prices: Record<string, { input: number; output: number }> = {
    'gpt-4o-mini': { input: 0.15, output: 0.60 },
    'gpt-4o': { input: 2.5, output: 10 },
    'gpt-4.1': { input: 2.0, output: 8 },
    'claude-sonnet-4': { input: 3.0, output: 15 },
    'claude-opus-4': { input: 15, output: 75 },
    'deepseek-v3': { input: 0.1, output: 0.4 },
    'deepseek-r1': { input: 0.1, output: 0.4 },
    'gemini-2.5-flash': { input: 0.075, output: 0.3 },
    'gemini-2.5-pro': { input: 1.25, output: 5 },
  };
  
  const price = prices[model] || prices['gpt-4o-mini'];
  return ((inputTokens * price.input) + (outputTokens * price.output)) / 1_000_000;
}

// 转发请求到上游供应商
async function forwardToSupplier(
  supplier: typeof SUPPLIERS['mars-ai'],
  path: string,
  body: string,
  model: string
): Promise<{ status: number; data: unknown; latencyMs: number }> {
  const start = Date.now();
  
  const response = await fetch(`${supplier.apiBase}/${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supplier.apiKey}`,
    },
    body,
  });

  const latencyMs = Date.now() - start;
  let data;
  try {
    data = await response.json();
  } catch {
    data = { error: { message: 'Failed to parse supplier response' } };
  }

  return { status: response.status, data, latencyMs };
}

// 主路由处理
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    const pathStr = path.join('/');
    const fullPath = `v1/${pathStr}`;
    
    const apiKey = extractApiKey(request);
    if (!apiKey) {
      return NextResponse.json(
        { error: { type: 'invalid_request', message: 'Missing API key' } },
        { status: 401 }
      );
    }

    const supabase = getSupabaseAdmin();

    // 1. 验证 Key
    const validation = await validateApiKey(supabase, apiKey);
    if (!validation.valid) {
      return NextResponse.json(
        { error: { type: 'authentication_error', message: validation.reason } },
        { status: 401 }
      );
    }
    const { keyData } = validation;

    // 2. 读取请求体
    const body = await request.json();
    const model = body.model as string;

    // 3. 检查用量限额
    if (keyData.monthly_limit && keyData.used_this_month >= keyData.monthly_limit) {
      return NextResponse.json(
        { error: { type: 'rate_limit_exceeded', message: 'Monthly quota exceeded' } },
        { status: 429 }
      );
    }

    // 4. 转发给供应商
    const supplier = SUPPLIERS[DEFAULT_SUPPLIER];
    const { status: supplierStatus, data: supplierData, latencyMs } = 
      await forwardToSupplier(supplier, fullPath, JSON.stringify(body), model);

    // 5. 估算并记录用量
    if (supplierStatus === 200 && supplierData && typeof supplierData === 'object') {
      const sd = supplierData as Record<string, unknown>;
      const usage = (sd.usage as { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number }) || {};
      const totalTokens = usage.total_tokens || 0;
      
      if (totalTokens > 0) {
        const cost = estimateCost(
          usage.prompt_tokens || 0,
          usage.completion_tokens || 0,
          model
        );
        // 异步记录，不阻塞返回
        recordUsage(supabase, keyData.id, totalTokens, cost, model, '', latencyMs)
          .catch(console.error);
      }
    }

    // 6. 返回结果
    return NextResponse.json(supplierData, { status: supplierStatus });

  } catch (error) {
    console.error('[AI API Error]', error);
    return NextResponse.json(
      { error: { type: 'server_error', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

// GET 请求处理（如 models list）
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    const pathStr = path.join('/');
    const fullPath = `v1/${pathStr}`;

    const supplier = SUPPLIERS[DEFAULT_SUPPLIER];
    
    const response = await fetch(`${supplier.apiBase}/${fullPath}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${supplier.apiKey}`,
      },
    });

    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });

  } catch (error) {
    console.error('[AI API Error]', error);
    return NextResponse.json(
      { error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
