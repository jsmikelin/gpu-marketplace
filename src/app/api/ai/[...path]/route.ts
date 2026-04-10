/**
 * AI API 代理路由
 * 路径: /api/ai/v1/chat/completions 等
 * 
 * 工作流程:
 * 1. 验证 API Key（通过 Supabase）
 * 2. 检查用量限额
 * 3. 选最优供应商（价格优先 + 故障切换）
 * 4. 转发请求，记录用量
 * 5. 返回结果
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  selectBestSupplier,
  callWithFallback,
  validateApiKeyFromSupabase,
  recordUsageAsync,
} from '@/lib/ai-router';

// 从 Authorization header 提取 Key
function extractApiKey(request: NextRequest): string | null {
  const auth = request.headers.get('authorization') || '';
  if (auth.startsWith('Bearer ')) return auth.slice(7).trim();
  return null;
}

// 主路由处理
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const pathStr = path.join('/');

  // 只处理 chat/completions
  if (!pathStr.includes('chat/completions')) {
    return NextResponse.json(
      { error: { type: 'not_found', message: 'Endpoint not found' } },
      { status: 404 }
    );
  }

  try {
    const apiKey = extractApiKey(request);
    if (!apiKey) {
      return NextResponse.json(
        { error: { type: 'authentication_error', message: 'Missing API key' } },
        { status: 401 }
      );
    }

    // 1. 验证 Key
    const auth = await validateApiKeyFromSupabase(apiKey);
    if (!auth.valid) {
      return NextResponse.json(
        { error: { type: 'authentication_error', message: auth.reason } },
        { status: 401 }
      );
    }

    // 2. 读取请求体
    const body = await request.json();
    const model = body.model as string;

    if (!model) {
      return NextResponse.json(
        { error: { type: 'invalid_request', message: 'model is required' } },
        { status: 400 }
      );
    }

    // 3. 检查用量限额
    if (auth.monthlyLimit && auth.usedThisMonth !== undefined) {
      if (auth.usedThisMonth >= auth.monthlyLimit) {
        return NextResponse.json(
          { error: { type: 'rate_limit_exceeded', message: 'Monthly quota exceeded. Please upgrade your plan.' } },
          { status: 429 }
        );
      }
    }

    // 4. 选择最优供应商
    const supplier = await selectBestSupplier(model);
    if (!supplier) {
      return NextResponse.json(
        { error: { type: 'service_unavailable', message: 'No available suppliers' } },
        { status: 503 }
      );
    }

    // 5. 转发请求（带故障切换）
    const { data, status, supplierId, latencyMs } = await callWithFallback(model, body, supplier);

    // 6. 异步记录用量（不阻塞返回）
    if (status === 200 && data && typeof data === 'object') {
      const sd = data as Record<string, unknown>;
      const usage = (sd.usage as { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number }) || {};
      const totalTokens = usage.total_tokens || 0;

      if (totalTokens > 0 && auth.keyId) {
        // 估算成本（我们付给供应商的）
        const costEstimate = estimateChatCost(usage.prompt_tokens || 0, usage.completion_tokens || 0, model);
        recordUsageAsync(
          auth.keyId,
          model,
          usage.prompt_tokens || 0,
          usage.completion_tokens || 0,
          totalTokens,
          supplierId,
          latencyMs,
          costEstimate
        ).catch(console.error);
      }
    }

    return NextResponse.json(data, { status });

  } catch (error) {
    console.error('[AI API Error]', error);
    return NextResponse.json(
      { error: { type: 'server_error', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

// GET 处理（如 models list）
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const pathStr = path.join('/');

  try {
    const supplier = (await selectBestSupplier('gpt-4o-mini'))!;
    const resp = await fetch(`${supplier.apiBaseUrl}/${pathStr}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${supplier.apiKey}` },
    });
    const data = await resp.json().catch(() => ({}));
    return NextResponse.json(data, { status: resp.status });
  } catch (error) {
    console.error('[AI API Error]', error);
    return NextResponse.json({ error: { message: 'Internal server error' } }, { status: 500 });
  }
}

// 估算 Chat Completion 的成本
function estimateChatCost(promptTokens: number, completionTokens: number, model: string): number {
  const wholesalePrices: Record<string, { input: number; output: number }> = {
    'gpt-4o-mini':  { input: 0.075, output: 0.30 },
    'gpt-4o':       { input: 1.25, output: 5.00 },
    'claude-sonnet-4-20250514': { input: 1.50, output: 7.50 },
    'claude-opus-4-6':         { input: 7.50, output: 37.50 },
    'deepseek-v3':  { input: 0.135, output: 0.54 },
    'deepseek-r1':  { input: 0.135, output: 0.54 },
    'gemini-2.5-flash': { input: 0.0375, output: 0.15 },
    'gemini-2.5-pro':   { input: 0.625, output: 2.50 },
    'glm-4.6': { input: 0.07, output: 0.28 },
  };
  const p = wholesalePrices[model] || { input: 0.10, output: 0.40 };
  return (promptTokens / 1_000_000 * p.input) + (completionTokens / 1_000_000 * p.output);
}
