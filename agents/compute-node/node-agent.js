/**
 * RiverGPU 算力调度网节点 Agent
 * 
 * 安装在 GPU 服务器上，负责：
 * 1. 向调度网发送心跳（GPU 状态）
 * 2. 接收任务分配
 * 3. 执行任务（Docker 容器）
 * 4. 返回执行结果
 * 
 * 使用方法：
 *   node node-agent.js --token YOUR_NODE_TOKEN --endpoint https://rivergpu.com
 */

import { parseArgs } from 'util';
import { fetch } from 'node-fetch';
import si from 'systeminformation';

// 解析命令行参数
const { values: args } = parseArgs({
  options: {
    token: { type: 'string', short: 't' },
    endpoint: { type: 'string', short: 'e', default: 'https://rivergpu.com' },
    interval: { type: 'string', short: 'i', default: '15' }, // 心跳间隔（秒）
    nodeId: { type: 'string', short: 'n' },
  },
});

const NODE_TOKEN = args.token || process.env.RGPU_NODE_TOKEN;
const SCHEDULER_URL = args.endpoint || process.env.RGPU_SCHEDULER_URL || 'https://rivergpu.com';
const HEARTBEAT_INTERVAL = parseInt(args.interval) * 1000;
const NODE_ID = args.nodeId || process.env.RGPU_NODE_ID;

if (!NODE_TOKEN) {
  console.error('❌ 请提供节点 Token: --token YOUR_NODE_TOKEN');
  process.exit(1);
}

console.log(`
╔══════════════════════════════════════════════╗
║     RiverGPU 算力节点 Agent v1.0            ║
║     算力调度网 · 节点端程序                  ║
╚══════════════════════════════════════════════╝
`);

console.log(`📡 调度网: ${SCHEDULER_URL}`);
console.log(`🔑 Token: ${NODE_TOKEN.slice(0, 12)}...`);
console.log(`💓 心跳间隔: ${HEARTBEAT_INTERVAL / 1000}秒`);
console.log('');

// 状态
let isRunning = true;
let activeTasks = new Map(); // taskId -> task info

// 获取 GPU 信息
async function getGpuMetrics() {
  try {
    const gpu = await si.graphics();
    const mem = await si.mem();

    const gpuData = gpu.controllers[0] || {};
    const utilization = gpuData.utilizationGpu || 0;
    const vramUsed = gpuData.utilizationMemory || 0;
    const vramTotal = gpuData.memoryTotal || 0;
    const temp = gpuData.temperatureGpu || 0;

    return {
      gpu_utilization: utilization,
      memory_used_gb: Math.round(mem.used / (1024 * 1024 * 1024) * 10) / 10,
      memory_total_gb: Math.round(mem.total / (1024 * 1024 * 1024) * 10) / 10,
      active_tasks: activeTasks.size,
      temperature_c: temp,
      disk_used_gb: 0,
      disk_total_gb: 0,
    };
  } catch (err) {
    // 非 GPU 环境（开发测试）
    return {
      gpu_utilization: 10,
      memory_used_gb: 2,
      memory_total_gb: 16,
      active_tasks: activeTasks.size,
      temperature_c: 45,
    };
  }
}

// 发送心跳
async function sendHeartbeat() {
  try {
    const metrics = await getGpuMetrics();

    const resp = await fetch(`${SCHEDULER_URL}/api/compute/heartbeat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Node-Token': NODE_TOKEN,
      },
      body: JSON.stringify(metrics),
    });

    if (!resp.ok) {
      const err = await resp.text();
      console.error(`[心跳] 失败 (${resp.status}): ${err}`);
      return;
    }

    const data = await resp.json();

    if (data.pending_tasks?.length > 0) {
      console.log(`📋 收到 ${data.pending_tasks.length} 个新任务`);
      for (const task of data.pending_tasks) {
        executeTask(task);
      }
    }

    // 简洁的日志输出（每10次心跳一次）
    if (Math.random() < 0.1) {
      console.log(`💓 心跳 OK | GPU: ${metrics.gpu_utilization}% | 内存: ${metrics.memory_used_gb}/${metrics.memory_total_gb}GB | 任务: ${activeTasks.size}`);
    }

  } catch (err) {
    console.error(`[心跳] 网络错误: ${err.message}`);
  }
}

// 执行任务
async function executeTask(task) {
  if (activeTasks.has(task.id)) {
    console.log(`⏭ 任务 ${task.task_number} 已在执行中，跳过`);
    return;
  }

  activeTasks.set(task.id, { ...task, started_at: Date.now() });
  console.log(`🚀 开始执行任务 ${task.task_number} (${task.task_type}/${task.model})`);

  // 通知调度网：任务开始
  await fetch(`${SCHEDULER_URL}/api/compute/tasks/${task.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Node-Token': NODE_TOKEN,
    },
    body: JSON.stringify({ status: 'running' }),
  });

  try {
    let result;
    const startTime = Date.now();

    // 根据任务类型执行
    switch (task.task_type) {
      case 'inference':
        result = await runInference(task);
        break;
      case 'training':
        result = await runTraining(task);
        break;
      case 'batch':
        result = await runBatch(task);
        break;
      default:
        result = { error: `Unknown task type: ${task.task_type}` };
    }

    const durationSeconds = Math.round((Date.now() - startTime) / 1000);
    const gpuHours = durationSeconds / 3600;

    // 通知调度网：任务完成
    await fetch(`${SCHEDULER_URL}/api/compute/tasks/${task.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Node-Token': NODE_TOKEN,
      },
      body: JSON.stringify({
        status: result.error ? 'failed' : 'completed',
        output_result: result,
        duration_seconds: durationSeconds,
        gpu_hours: gpuHours,
        cost_usd: 0, // 由调度网根据节点价格计算
      }),
    });

    console.log(`✅ 任务 ${task.task_number} 完成，耗时 ${durationSeconds}秒`);

  } catch (err) {
    console.error(`❌ 任务 ${task.task_number} 失败: ${err.message}`);

    await fetch(`${SCHEDULER_URL}/api/compute/tasks/${task.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Node-Token': NODE_TOKEN,
      },
      body: JSON.stringify({
        status: 'failed',
        error_message: err.message,
      }),
    });
  } finally {
    activeTasks.delete(task.id);
  }
}

// 推理任务（示例：实际会调用 AI 模型）
async function runInference(task) {
  // 实际实现：调用本地 AI 模型或 Docker 容器
  // 这里用模拟结果
  await new Promise(r => setTimeout(r, 1000 + Math.random() * 2000));

  return {
    model: task.model,
    prompt: task.prompt,
    output: `Inference result from ${task.model}... [simulated]`,
    tokens_used: Math.floor(Math.random() * 1000) + 100,
    latency_ms: Math.floor(Math.random() * 500) + 100,
  };
}

// 训练任务
async function runTraining(task) {
  await new Promise(r => setTimeout(r, 5000 + Math.random() * 10000));
  return {
    base_model: task.base_model,
    status: 'completed',
    epochs_completed: 10,
    final_loss: (Math.random() * 0.5 + 0.1).toFixed(4),
    output_model: `Model saved to /models/${task.task_number}/final`,
  };
}

// 批量任务
async function runBatch(task) {
  await new Promise(r => setTimeout(r, 3000 + Math.random() * 5000));
  return {
    batch_size: 100,
    processed: 100,
    failed: 0,
    output_files: [`/output/${task.task_number}/results.jsonl`],
  };
}

// 优雅关闭
async function shutdown() {
  console.log('\n🛑 正在关闭节点 Agent...');
  isRunning = false;

  if (activeTasks.size > 0) {
    console.log(`⏳ 等待 ${activeTasks.size} 个任务完成...`);
    // 等待最多 30 秒
    const maxWait = Date.now() + 30000;
    while (activeTasks.size > 0 && Date.now() < maxWait) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  console.log('👋 Agent 已关闭');
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// 主循环
async function main() {
  console.log('✅ 启动完成，开始发送心跳...\n');

  // 立即发送一次心跳
  await sendHeartbeat();

  // 定时心跳
  setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
