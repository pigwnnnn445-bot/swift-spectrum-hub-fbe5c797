/**
 * Mock 图片生成接口
 *
 * ⚠️ 仅供开发测试使用，发布时替换为真实 API 调用
 */

// ── Mock 图片池 ──
const MOCK_IMAGES = [
  "https://picsum.photos/seed/gen1/512/512",
  "https://picsum.photos/seed/gen2/512/768",
  "https://picsum.photos/seed/gen3/768/512",
  "https://picsum.photos/seed/gen4/512/512",
  "https://picsum.photos/seed/gen5/512/768",
  "https://picsum.photos/seed/gen6/768/512",
  "https://picsum.photos/seed/gen7/512/512",
  "https://picsum.photos/seed/gen8/768/768",
];

/** Mock 成功率（0~1），可调节测试 */
const MOCK_SUCCESS_RATE = 0.8;

/** Mock 延迟范围（ms） */
const MOCK_DELAY_MIN = 2000;
const MOCK_DELAY_MAX = 4000;

export interface MockGenerateResult {
  success: boolean;
  images?: string[];
  errorMessage?: string;
}

/**
 * 模拟图片生成请求
 * @param count 生成张数
 * @returns 成功时返回图片数组，失败时返回错误信息
 */
export async function mockGenerate(count: number): Promise<MockGenerateResult> {
  // ── 随机延迟 2~4 秒 ──
  const delay = MOCK_DELAY_MIN + Math.random() * (MOCK_DELAY_MAX - MOCK_DELAY_MIN);
  await new Promise((resolve) => setTimeout(resolve, delay));

  // ── 随机成功/失败 ──
  const isSuccess = Math.random() < MOCK_SUCCESS_RATE;

  if (isSuccess) {
    // 随机选取 count 张图片
    const images: string[] = [];
    for (let i = 0; i < count; i++) {
      const idx = Math.floor(Math.random() * MOCK_IMAGES.length);
      // 添加时间戳避免缓存
      images.push(`${MOCK_IMAGES[idx]}?t=${Date.now()}_${i}`);
    }
    return { success: true, images };
  }

  return {
    success: false,
    errorMessage: "生成失败，服务暂时不可用，请稍后重试",
  };
}
