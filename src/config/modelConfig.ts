/**
 * 模型配置表
 * 
 * 数据流向说明：
 * - 此配置将来由后端接口提供，前端通过 API 获取模型列表及其关联的配置项
 * - 每个模型的 `features` 字段决定侧边栏显示哪些配置区块
 * - 模型的在线/下线状态由后端控制，下线模型不会出现在列表中
 * 
 * 预留接口示例：
 *   GET /api/models          → ModelConfig[]
 *   GET /api/models/:id      → ModelConfig
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
  /** 该模型支持的功能配置项 */
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

/**
 * Mock 模型配置数据
 * TODO: 替换为后端接口调用 fetchModels(): Promise<ModelConfig[]>
 */
export const modelConfigs: ModelConfig[] = [
  {
    id: "nano-banana-2",
    name: "Nano-banana 2",
    description: "高级图像生成模型，输出高度一致，细节更清晰，图像更稳定",
    icon: "🍌",
    online: true,
    features: {
      ratios: ["1:1", "2:3", "3:2", "3:4", "16:9", "4:3", "9:16"],
      resolutions: ["1K", "2K", "4K"],
      counts: [1, 2, 3, 4],
      styles: [
        "自动", "印象派", "卡通", "折纸", "花札", "龙珠", "雕塑", "4D",
        "草图", "毛绒玩具", "毛毡", "洛可可", "蒸汽朋克", "吉卜力", "巴洛克",
        "波西米亚风格", "未来主义", "Funko Pop", "包豪斯", "波普艺术",
        "赛博朋克", "地中海", "像素风", "极简主义", "写实",
      ],
      uploadRef: {
        mode: "typed",
        multiUpload: true,
        types: [
          { id: "person", label: "人物参考" },
          { id: "image", label: "图像参考" },
          { id: "style", label: "风格参考" },
        ],
      },
    },
  },
  {
    id: "nano-banana-pro",
    name: "Nano-banana pro",
    description: "更鲜明的风格和更丰富的细节",
    icon: "🍌",
    online: true,
    features: {
      ratios: ["1:1", "2:3", "3:2", "3:4", "16:9", "4:3", "9:16"],
      resolutions: ["1K", "2K", "4K"],
      counts: [1],
      uploadRef: {
        mode: "simple",
        multiUpload: true,
        placeholder: "将图片拖至此处或单击上传",
      },
    },
  },
  {
    id: "midjourney-v6-1",
    name: "Midjourney V6.1",
    description: "稳定可控模型",
    icon: "🎨",
    online: true,
    features: {
      ratios: ["1:1", "2:3", "3:2", "3:4", "16:9", "4:3", "9:16"],
      styles: [
        "自动", "印象派", "卡通", "折纸", "花札", "龙珠", "雕塑", "4D",
        "草图", "毛绒玩具", "毛毡", "洛可可", "蒸汽朋克", "吉卜力", "巴洛克",
        "波西米亚风格", "未来主义", "Funko Pop", "包豪斯", "波普艺术",
        "赛博朋克", "地中海", "像素风", "极简主义", "写实",
      ],
      uploadRef: {
        mode: "typed",
        multiUpload: true,
        types: [
          { id: "person", label: "人物参考" },
          { id: "image", label: "图像参考" },
          { id: "style", label: "风格参考" },
        ],
      },
    },
  },
  {
    id: "chatgpt-image-1",
    name: "ChatGPT-image-1",
    description: "理解能力强，可生成带文字的图片",
    icon: "🤖",
    online: true,
    features: {
      ratios: ["1:1", "2:3", "3:2"],
      counts: [1],
      uploadRef: {
        mode: "simple",
        multiUpload: false,
        placeholder: "将图片拖至此处或单击上传",
      },
    },
  },
];

/**
 * 获取在线模型列表
 * TODO: 替换为 async function fetchOnlineModels()
 */
export function getOnlineModels(): ModelConfig[] {
  return modelConfigs.filter((m) => m.online);
}
