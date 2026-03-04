/**
 * 生成任务类型定义
 */

export type TaskStatus = "idle" | "submitting" | "generating" | "success" | "error";

export interface GenerateTask {
  id: string;
  prompt: string;
  status: TaskStatus;
  /** 使用的模型名称 */
  modelName: string;
  /** 使用的模型图标 */
  modelImage: string;
  /** 比例 */
  ratio: string;
  /** 分辨率 */
  resolution: string;
  /** 生成张数 */
  count: number;
  /** 生成成功后的图片 URL 数组 */
  images: string[];
  /** 失败时的错误信息 */
  errorMessage?: string;
  /** 创建时间 */
  createdAt: number;
  /** 原始请求参数（方便重试） */
  requestPayload: Record<string, unknown>;
}
