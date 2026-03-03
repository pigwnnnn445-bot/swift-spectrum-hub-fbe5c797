/**
 * 模型配置类型定义
 *
 * 数据流向说明：
 * - 模型列表及其关联配置项由后端接口提供
 * - 每个模型的 `features` 字段决定侧边栏显示哪些配置区块
 * - 模型的在线/下线状态由后端控制，下线模型不会出现在列表中
 *
 * 接口定义：
 *   GET /api/models          → ModelConfig[]
 *   GET /api/models/:id      → ModelConfig
 *
 * 服务层入口：src/api/modelService.ts
 */

export interface UploadRefConfig {
  /** 上传模式：'typed' 支持按类型（人物/图像/风格）切换上传，'simple' 仅显示简单上传区域 */
  mode: "typed" | "simple";
  /** 每个类型是否支持多张上传 */
  multiUpload: boolean;
  /** simple 模式下的提示文案 */
  placeholder?: string;
  /** typed 模式下的类型列表 */
  types?: { id: string; label: string }[];
}

export interface ModelConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  /** 是否在线（后端控制，前端过滤用） */
  online: boolean;
  /** 单次生成消耗的积分/点数 */
  cost: number;
  /** 该模型支持的功能配置项，后端开启则前端展示，未开启则不展示 */
  features: {
    ratios?: string[];
    resolutions?: string[];
    counts?: number[];
    styles?: string[];
    /** 是否显示相似度调整组件 */
    similarity?: boolean;
    uploadRef?: UploadRefConfig;
  };
}
