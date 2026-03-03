/**
 * Mock 模型配置数据（仅供开发测试使用）
 * 
 * ⚠️ 发布前请删除此文件，并将 api/modelService.ts 中的数据源切换为真实后端接口
 */
import type { ModelConfig } from "./modelConfig";

export const mockModelConfigs: ModelConfig[] = [
  {
    id: "nano-banana-2",
    name: "Nano-banana 2",
    description: "高级图像生成模型，输出高度一致，细节更清晰，图像更稳定",
    icon: "🍌",
    online: true,
    cost: 5,
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
      similarity: true,
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
    cost: 8,
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
    cost: 10,
    features: {
      ratios: ["1:1", "2:3", "3:2", "3:4", "16:9", "4:3", "9:16"],
      styles: [
        "自动", "印象派", "卡通", "折纸", "花札", "龙珠", "雕塑", "4D",
        "草图", "毛绒玩具", "毛毡", "洛可可", "蒸汽朋克", "吉卜力", "巴洛克",
        "波西米亚风格", "未来主义", "Funko Pop", "包豪斯", "波普艺术",
        "赛博朋克", "地中海", "像素风", "极简主义", "写实",
      ],
      similarity: true,
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
    cost: 12,
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
