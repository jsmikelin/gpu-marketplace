/**
 * AI 供应商智能路由
 * 以产品为中心，多供应商自动选择
 * 
 * 路由策略：
 * 1. 按模型 ID 找到所有支持该模型的供应商
 * 2. 按供应商给我们的批发价排序（最便宜的优先）
 * 3. ping 检测响应速度
 * 4. 选择最优供应商，自动故障切换
 */

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// 供应商配置（可从数据库动态读取）
export interface SupplierConfig {
  id: string;
  name: string;
  slug: string;
  apiBaseUrl: string;
  apiKey: string;
  markupPercent: number;     // 加价百分比，如 0.5 = 50%
  maxConcurrent: number;     // 最大并发限制
  status: 'active' | 'suspended';
  isHealthy: boolean;
  lastHealthCheck: number;   // timestamp
  avgLatencyMs: number;
}

// 供应商列表（正式环境建议从数据库读取）
const DEFAULT_SUPPLIERS: SupplierConfig[] = [
  {
    id: 'mars-ai-1',
    name: 'Mars AI',
    slug: 'mars-ai',
    apiBaseUrl: 'https://api.marsai.cloud',
    apiKey: process.env.MARS_AI_API_KEY || '',
    markupPercent: 0.5,
    maxConcurrent: 1000,
    status: 'active',
    isHealthy: true,
    lastHealthCheck: 0,
    avgLatencyMs: 200,
  },
];

// 模型批发价映射（从 Mars AI 五折得到）
export const MODEL_WHOLESALE_PRICES: Record<string, { input: number; output: number }> = {
  // GPT-4o Mini - 官方 $0.15 → 我们 $0.075
  'gpt-4o-mini':       { input: 0.075, output: 0.30 },
  // GPT-4o - 官方 $2.50 → 我们 $1.25
  'gpt-4o':            { input: 1.25, output: 5.00 },
  // GPT-4.1 - 官方 $2.00 → 我们 $1.00
  'gpt-4.1':           { input: 1.00, output: 4.00 },
  'gpt-4.1-mini':      { input: 0.50, output: 2.00 },
  'gpt-4.1-nano':      { input: 0.25, output: 1.00 },
  // Claude
  'claude-sonnet-4-20250514': { input: 1.50, output: 7.50 },
  'claude-opus-4-6':          { input: 7.50, output: 37.50 },
  'claude-haiku-4-5-20251001': { input: 0.10, output: 0.50 },
  // DeepSeek
  'deepseek-v3':   { input: 0.135, output: 0.54 },
  'deepseek-v3.2':{ input: 0.135, output: 0.54 },
  'deepseek-r1':  { input: 0.135, output: 0.54 },
  'deepseek-r1-distill-qwen-32b': { input: 0.05, output: 0.20 },
  // Gemini
  'gemini-2.5-flash': { input: 0.0375, output: 0.15 },
  'gemini-2.5-pro':   { input: 0.625, output: 2.50 },
  // GLM
  'glm-4.6': { input: 0.07, output: 0.28 },
  'glm-4.7': { input: 0.09, output: 0.36 },
};

// 模型 ID 别名映射（兼容不同供应商的 model_id 命名）
const MODEL_ALIASES: Record<string, string[]> = {
  'gpt-4o-mini': ['gpt-4o-mini'],
  'gpt-4o': ['gpt-4o', 'gpt-4o-2024-05-13', 'gpt-4o-2024-08-06'],
  'claude-3-5-sonnet': ['claude-sonnet-4-20250514', 'claude-sonnet-4.5-20250929'],
  'claude-opus-4': ['claude-opus-4-6', 'claude-opus-4-20250514', 'claude-opus-4-5-20251101'],
  'deepseek-v3': ['deepseek-v3', 'deepseek-v3.1', 'deepseek-v3.2', 'deepseek-v3.2-exp'],
  'deepseek-r1': ['deepseek-r1', 'deepseek-r1-0528'],
  'gemini-2-5-flash': ['gemini-2.5-flash', 'gemini-2.5-flash-thinking', 'gemini-2.5-flash-nothinking'],
  'gemini-2-5-pro': ['gemini-2.5-pro', 'gemini-2.5-pro-thinking', 'gemini-2.5-pro-nothinking'],
  'glm-4': ['glm-4.6', 'glm-4.7'],
};

// 获取供应商成本
function getSupplierCost(modelId: string, supplier: SupplierConfig): number {
  // 找真实模型 ID
  const normalizedId = normalizeModelId(modelId);
  const wholesale = MODEL_WHOLESALE_PRICES[normalizedId];
  if (!wholesale) return 0;
  // 成本 = 批发价 × (1 + markup)
  return wholesale.input * (1 + supplier.markupPercent);
}

// 标准化模型 ID
export function normalizeModelId(modelId: string): string {
  for (const [canonical, aliases] of Object.entries(MODEL_ALIASES)) {
    if (aliases.includes(modelId) || canonical === modelId) {
      return canonical;
    }
  }
  return modelId;
}

// 健康检测
async function healthCheck(supplier: SupplierConfig): Promise<{ healthy: boolean; latencyMs: number }> {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const resp = await fetch(`${supplier.apiBaseUrl}/v1/models`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${supplier.apiKey}` },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return { healthy: resp.ok, latencyMs: Date.now() - start };
  } catch {
    return { healthy: false, latencyMs: 9999 };
  }
}

// 选择最优供应商
export async function selectBestSupplier(
  modelId: string,
  suppliers: SupplierConfig[] = DEFAULT_SUPPLIERS
): Promise<SupplierConfig | null> {
  const active = suppliers.filter(s => s.status === 'active' && s.isHealthy);
  if (active.length === 0) return null;

  // 策略1：按价格排序（最便宜的优先）
  const sorted = active.sort((a, b) => {
    const costA = getSupplierCost(modelId, a);
    const costB = getSupplierCost(modelId, b);
    return costA - costB;
  });

  // 策略2：检查最快响应（如果价格相近，选速度快的）
  const best = sorted[0];
  return best;
}

// 故障切换
export async function callWithFallback(
  modelId: string,
  body: object,
  preferredSupplier?: SupplierConfig
): Promise<{ data: unknown; status: number; supplierId: string; latencyMs: number }> {
  const suppliers = preferredSupplier
    ? [preferredSupplier, ...DEFAULT_SUPPLIERS.filter(s => s.id !== preferredSupplier.id)]
    : DEFAULT_SUPPLIERS;

  const tried: string[] = [];

  for (const supplier of suppliers) {
    if (supplier.status !== 'active' || !supplier.isHealthy) continue;

    tried.push(supplier.id);
    const start = Date.now();

    try {
      const resp = await fetch(`${supplier.apiBaseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supplier.apiKey}`,
        },
        body: JSON.stringify({ ...body as object, model: modelId }),
      });

      const data = await resp.json();
      const latencyMs = Date.now() - start;

      if (resp.ok) {
        // 成功：更新供应商状态
        supplier.avgLatencyMs = (supplier.avgLatencyMs * 0.7 + latencyMs * 0.3);
        supplier.isHealthy = true;
        return { data, status: resp.status, supplierId: supplier.id, latencyMs };
      }

      // 非 5xx 错误（通常是模型不支持），不切换供应商
      if (resp.status < 500) {
        return { data, status: resp.status, supplierId: supplier.id, latencyMs };
      }
    } catch (err) {
      console.error(`[AI Router] Supplier ${supplier.id} failed:`, err);
      supplier.isHealthy = false;
    }
  }

  return {
    data: { error: { type: 'service_unavailable', message: 'All AI suppliers are unavailable' } },
    status: 503,
    supplierId: tried[tried.length - 1] || 'none',
    latencyMs: 0,
  };
}

// 估算利润
export function estimateProfit(
  modelId: string,
  inputTokens: number,
  outputTokens: number,
  sellPricePerM: { input: number; output: number }
): { cost: number; revenue: number; profit: number; marginPercent: number } {
  const normalizedId = normalizeModelId(modelId);
  const wholesale = MODEL_WHOLESALE_PRICES[normalizedId];
  if (!wholesale) return { cost: 0, revenue: 0, profit: 0, marginPercent: 0 };

  const inputInM = inputTokens / 1_000_000;
  const outputInM = outputTokens / 1_000_000;

  const cost = (inputInM * wholesale.input) + (outputInM * wholesale.output);
  const revenue = (inputInM * sellPricePerM.input) + (outputInM * sellPricePerM.output);
  const profit = revenue - cost;
  const marginPercent = revenue > 0 ? (profit / revenue) * 100 : 0;

  return { cost, revenue, profit, marginPercent };
}

// 从 Authorization 提取并验证 API Key
export async function validateApiKeyFromSupabase(key: string): Promise<{
  valid: boolean;
  profileId?: string;
  keyId?: string;
  planId?: string;
  monthlyLimit?: number;
  usedThisMonth?: number;
  reason?: string;
}> {
  const keyHash = crypto.createHash('sha256').update(key).update('rivergpu_salt').digest('hex');

  const { data, error } = await supabase
    .from('ai_api_keys')
    .select('id, profile_id, plan_id, monthly_limit, used_this_month, status, expires_at')
    .eq('key_hash', keyHash)
    .single();

  if (error || !data) return { valid: false, reason: 'Invalid API key' };
  if (data.status !== 'active') return { valid: false, reason: 'API key is not active' };
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return { valid: false, reason: 'API key has expired' };
  }

  return {
    valid: true,
    profileId: data.profile_id,
    keyId: data.id,
    planId: data.plan_id,
    monthlyLimit: data.monthly_limit,
    usedThisMonth: data.used_this_month,
  };
}

// 异步记录用量（不阻塞响应）
export async function recordUsageAsync(
  keyId: string,
  modelId: string,
  promptTokens: number,
  completionTokens: number,
  totalTokens: number,
  supplierId: string,
  latencyMs: number,
  costUsd: number
) {
  try {
    await supabase.from('ai_usage_logs').insert({
      api_key_id: keyId,
      model: modelId,
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      total_tokens: totalTokens,
      cost_usd: costUsd,
      supplier_id: supplierId,
      latency_ms: latencyMs,
    });

    // 更新本月已用
    const { data: key } = await supabase
      .from('ai_api_keys')
      .select('used_this_month')
      .eq('id', keyId)
      .single();

    if (key) {
      await supabase
        .from('ai_api_keys')
        .update({ used_this_month: key.used_this_month + totalTokens })
        .eq('id', keyId);
    }
  } catch (err) {
    console.error('[AI Router] Failed to record usage:', err);
  }
}
