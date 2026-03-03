/**
 * 模型服务层 — API 卡槽
 *
 * 当前使用 mock 数据进行开发测试。
 * 发布时：
 *   1. 删除 src/config/mockModelData.ts
 *   2. 将下方函数替换为真实 API 调用
 */
import type { ModelConfig, ModelsData, Provider } from "@/config/modelConfig";
import { mockModelsData } from "@/config/mockModelData";

// ─── API 端点（发布时启用） ───────────────────────────
// const API_BASE = import.meta.env.VITE_API_BASE ?? "";

/**
 * 获取全部数据（提供商 + 模型列表）
 * TODO: 替换为真实接口  POST /api/models → ApiResponse<ModelsData>
 */
export async function fetchModelsData(): Promise<ModelsData> {
  // ── 真实接口（发布时取消注释） ──
  // const res = await fetch(`${API_BASE}/api/models`, { method: "POST" });
  // if (!res.ok) throw new Error("Failed to fetch models");
  // const json = await res.json();
  // return json.data;

  // ── Mock 数据（发布时删除） ──
  return mockModelsData;
}

/** 获取提供商列表 */
export async function fetchProviders(): Promise<Provider[]> {
  const data = await fetchModelsData();
  return data.provider_list;
}

/** 获取全部模型列表 */
export async function fetchModels(): Promise<ModelConfig[]> {
  const data = await fetchModelsData();
  return data.model_list;
}
