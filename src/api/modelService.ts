/**
 * 模型服务层 — API 卡槽
 *
 * 当前使用 mock 数据进行开发测试。
 * 发布时：
 *   1. 删除 src/config/mockModelData.ts
 *   2. 将下方 fetchModels() 替换为真实 API 调用
 */
import type { ModelConfig } from "@/config/modelConfig";
import { mockModelConfigs } from "@/config/mockModelData";

// ─── API 端点（发布时启用） ───────────────────────────
// const API_BASE = import.meta.env.VITE_API_BASE ?? "";

/**
 * 获取全部模型列表
 * TODO: 替换为真实接口  GET /api/models → ModelConfig[]
 */
export async function fetchModels(): Promise<ModelConfig[]> {
  // ── 真实接口（发布时取消注释） ──
  // const res = await fetch(`${API_BASE}/api/models`);
  // if (!res.ok) throw new Error("Failed to fetch models");
  // return res.json();

  // ── Mock 数据（发布时删除） ──
  return mockModelConfigs;
}

/**
 * 获取在线模型列表
 * TODO: 后端可直接返回在线列表  GET /api/models?online=true
 */
export async function fetchOnlineModels(): Promise<ModelConfig[]> {
  const all = await fetchModels();
  return all.filter((m) => m.online);
}
