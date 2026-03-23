/**
 * 生成任务类型定义
 */

export type TaskStatus = "idle" | "submitting" | "generating" | "success" | "error";

export type GenerationMode = "text-to-image" | "image-to-image";

/** Midjourney 任务阶段 */
export type MjStage = "initial" | "upscaled" | "upscaled_max";

/** Midjourney 操作类型 */
export type MjAction =
  | "U1" | "U2" | "U3" | "U4"
  | "V1" | "V2" | "V3" | "V4"
  | "upscale_subtle" | "upscale_creative"
  | "vary_subtle" | "vary_strong"
  | "zoom_out_2x" | "zoom_out_1_5x"
  | "pan_left" | "pan_right" | "pan_up" | "pan_down"
  | "redo_upscale_subtle" | "redo_upscale_creative"
  | "refresh";

/** 根据 MJ Action 推断结果阶段和生成数量 */
export function getMjActionResult(action: MjAction): { stage: MjStage; count: number } {
  switch (action) {
    case "U1": case "U2": case "U3": case "U4":
      return { stage: "upscaled", count: 1 };
    case "upscale_subtle": case "upscale_creative":
      return { stage: "upscaled_max", count: 1 };
    case "redo_upscale_subtle": case "redo_upscale_creative":
      return { stage: "upscaled_max", count: 1 };
    case "V1": case "V2": case "V3": case "V4":
    case "vary_subtle": case "vary_strong":
    case "zoom_out_2x": case "zoom_out_1_5x":
    case "pan_left": case "pan_right": case "pan_up": case "pan_down":
    case "refresh":
      return { stage: "initial", count: 4 };
  }
}

export interface GenerateTask {
  id: string;
  prompt: string;
  status: TaskStatus;
  /** 使用的模型名称 */
  modelName: string;
  /** 使用的模型 ID */
  modelId?: number;
  /** 使用的模型图标 */
  modelImage: string;
  /** 比例 */
  ratio: string;
  /** 分辨率 */
  resolution: string;
  /** 风格名称 */
  styleName?: string;
  /** 风格 ID */
  styleId?: number | null;
  /** 生成模式 */
  generationMode?: GenerationMode;
  /** 相似度（图生图时） */
  similarity?: number;
  /** 生成张数 */
  count: number;
  /** 生成成功后的图片 URL 数组 */
  images: string[];
  /** 失败时的错误信息 */
  errorMessage?: string;
  /** 图生图参考图 URL 数组（存在时表示图生图任务） */
  referenceImages?: string[];
  /** 局部重绘原图 URL */
  baseImage?: string;
  /** 局部重绘蒙版数据（dataURL） */
  maskData?: string;
  /** 创建时间 */
  createdAt: number;
  /** 原始请求参数（方便重试 / 资产管理复用） */
  requestPayload: Record<string, unknown>;

  // ─── Midjourney 专属字段 ───
  /** 是否为 Midjourney 任务 */
  isMj?: boolean;
  /** Midjourney 任务阶段 */
  mjStage?: MjStage;
  /** 触发此任务的 MJ 操作 */
  mjAction?: MjAction;
  /** 来源任务 ID（MJ 操作链路追踪） */
  mjParentTaskId?: string;
  /** U 操作选中的图片索引（0-3） */
  mjSelectedIndex?: number;
}
