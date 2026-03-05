/**
 * 模型配置类型定义 — 与后端接口数据结构对齐
 *
 * 数据流向说明：
 * - 模型列表及其关联配置项由后端接口提供
 * - 每个模型的 `*_flg` 字段决定侧边栏显示哪些配置区块（1=展示，0=不展示）
 * - 模型的在线/下线状态由后端 show_flg 控制
 *
 * 接口定义：
 *   POST /api/models → ApiResponse<ModelsData>
 *
 * 服务层入口：src/api/modelService.ts
 */

/** API 统一响应包装 */
export interface ApiResponse<T> {
  code: number;
  cost: number;
  data: T;
}

/** 模型提供商（大类） */
export interface Provider {
  id: number;
  name: string;
  image: string;
}

/** 分辨率选项（含附加价格） */
export interface ResolutionOption {
  resolution: string;
  price: number;
}

/** 风格资源项（含预览图和 prompt 内容） */
export interface StyleResource {
  id: number;
  /** 该风格对应的 prompt 片段，"自动" 时为空字符串 */
  content: string;
  /** 风格预览图 URL */
  image: string;
  /** 风格显示名称 */
  resource_name: string;
  sort: number;
  tab_id: number;
}

/** 风格标签页 */
export interface StyleTab {
  id: number;
  resource: StyleResource[];
  resource_name: string;
  tab_name: string;
}

/**
 * 图片参考/相似度类型
 * like_type: 1=人物参考, 3=风格参考, 4=图像参考
 */
export interface ImageLikeOption {
  /** 该类型是否启用：1=启用，0=禁用 */
  image_like_flg: number;
  /** 是否必填 */
  is_required?: number;
  /** 参考类型标识：1=人物，3=风格，4=图像 */
  like_type: number;
  /** 是否支持多张上传 */
  more_image_flg: number;
  /** 是否仅支持单张上传 */
  one_image_flg: number;
}

/** 模型完整配置 */
export interface ModelConfig {
  id: number;
  name: string;
  /** 模型描述 */
  content: string;
  /** 模型图标/缩略图 URL */
  image: string;
  /** 单次生成消耗的积分/点数 */
  price: number;
  /** 所属提供商 ID，对应 Provider.id */
  model_type_id: number;
  /** 是否为 Midjourney 模型 */
  is_mj: boolean;

  // ─── 功能开关（_flg: 1=展示，0=不展示） ───────────

  /** 比例选择 */
  ratio_flg: number;
  ratio: string[];
  ratio_price: number;

  /** 分辨率选择 */
  resolution_flg: number;
  resolution: ResolutionOption[];

  /** 风格选择 */
  style_flg: number;
  style: StyleTab[];
  style_price: number;

  /** 图片参考/相似度配置 */
  image_like: ImageLikeOption[];
  image_like_flg: number;

  /** 生成数量（0=不可配置） */
  image_num: number;

  /** 是否支持上传参考图 */
  image_reference_flg: number;
  image_reference_price: number;

  // ─── 操作按钮开关 ───────────

  add_flg: number;
  download_flg: number;
  download_price: number;
  edit_prompt_flg: number;
  edit_prompt_price: number;
  enlarge_picture_flg: number;
  enlarge_picture_price: number;
  regenerate_flg: number;
  regenerate_price: number;
  remove_background_flg: number;
  remove_background_price: number;

  /** 局部重绘（Inpaint） */
  inpaint_flg: number;
  inpaint_price: number;

  /** 编辑图像 */
  edit_image_flg: number;
  edit_image_price: number;

  /** 展示标志（后端控制） */
  show_flg: number;
}

/** 接口返回的完整数据结构 */
export interface ModelsData {
  provider_list: Provider[];
  model_list: ModelConfig[];
}

// ─── 工具函数 ───────────────────────────

const LIKE_TYPE_LABELS: Record<number, string> = {
  1: "人物参考",
  3: "风格参考",
  4: "图像参考",
};

export function getLikeTypeLabel(likeType: number): string {
  return LIKE_TYPE_LABELS[likeType] ?? "参考";
}

/** 获取模型中已启用的 image_like 类型列表 */
export function getEnabledImageLikes(model: ModelConfig): ImageLikeOption[] {
  return model.image_like.filter((item) => item.image_like_flg === 1);
}

/** 判断模型是否有 typed 上传模式（多种参考类型） */
export function hasTypedUpload(model: ModelConfig): boolean {
  return getEnabledImageLikes(model).length > 0;
}
