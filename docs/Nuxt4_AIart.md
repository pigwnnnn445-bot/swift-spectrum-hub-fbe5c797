# Nuxt4 AI 图像生成页面 — 重构施工文档

> **目标框架**: Nuxt 4 + `@nuxt/ui` (v3)  
> **源原型**: React (Vite + Tailwind + shadcn/ui)  
> **文档版本**: 2026-03-03  
> **适用页面**: AI Art 图像生成工作台（路由 `/`）

---

## 目录

1. [布局结构与目录结构总览](#1-布局结构与目录结构总览)
2. [组件拆解清单](#2-组件拆解清单)
3. [@nuxt/ui 映射指南](#3-nuxtui-映射指南)
4. [占位与文案说明](#4-占位与文案说明)
5. [CSS 变量与页面级样式提示](#5-css-变量与页面级样式提示)
6. [状态机与逻辑插槽](#6-状态机与逻辑插槽)

---

## 1. 布局结构与目录结构总览

### 1.1 页面布局结构

```
┌─────────────────────────────────────────────────────┐
│  全屏容器 (flex h-screen)                             │
│ ┌──────────────┬────────────────────────────────────┐│
│ │              │                                    ││
│ │ SettingsSidebar │        Main Content Area        ││
│ │ (固定 300px)    │       (flex-1, overflow-y-auto)  ││
│ │              │ ┌────────────────────────────────┐ ││
│ │ · 图像生成标题 │ │     HeroPromptBar              │ ││
│ │ · 切换模型     │ │  · 主标题 "把想象，变成图像"      │ ││
│ │ · 比例选择     │ │  · Prompt 输入框 + 发送按钮      │ ││
│ │ · 分辨率       │ └────────────────────────────────┘ ││
│ │ · 生成数量     │ ┌────────────────────────────────┐ ││
│ │ · 风格选择     │ │     StickyPromptBar (吸顶)      │ ││
│ │ · 上传参考图   │ │  (Hero输入框不可见时吸顶显示)     │ ││
│ │ · 相似度       │ └────────────────────────────────┘ ││
│ │              │ ┌────────────────────────────────┐ ││
│ │              │ │  🎨 灵感显影室                    │ ││
│ │ ┌──────────┐ │ │  MasonryGallery (瀑布流)        │ ││
│ │ │UserFooter│ │ │  · GalleryCard × N              │ ││
│ │ └──────────┘ │ └────────────────────────────────┘ ││
│ └──────────────┴────────────────────────────────────┘│
└─────────────────────────────────────────────────────┘
```

**关键布局规则：**
- 侧边栏固定宽度 `300px`，桌面端（`lg+`）始终可见
- 移动端侧边栏默认隐藏，通过左上角汉堡按钮（`Menu` 图标）触发滑入，覆盖层为 `bg-black/50` 遮罩
- 主内容区 `flex-1`，独立纵向滚动（`overflow-y-auto`）
- StickyPromptBar 吸顶于主内容区顶部（`sticky top-0 z-40`），仅覆盖右侧内容区宽度

### 1.2 推荐目录结构

```
pages/
  index.vue                          # 页面入口

components/
  workspace/
    ImageGenPage.vue                 # 页面容器（组装侧边栏 + 主内容区）
    SettingsSidebar.vue              # 左侧参数面板
    ModelSelectCard.vue              # 模型选择下拉卡片
    OptionChipGroup.vue              # 通用选项 Chip 组（比例/分辨率/数量）
    StyleSelector.vue                # 风格选择触发式下拉面板
    UploadReferencePanel.vue         # 上传参考图（含 typed/simple 两种模式）
    UploadZone.vue                   # 单个上传区域（单图/多图）
    UserFooterPanel.vue              # 侧边栏底部用户信息
    HeroPromptBar.vue                # Hero 区域（主标题 + 提示词输入框）
    StickyPromptBar.vue              # 吸顶提示词条
    MasonryGallery.vue               # 瀑布流画廊容器
    GalleryCard.vue                  # 画廊单张卡片
    SidebarSection.vue               # 侧边栏通用分区标题组件

composables/
  useAutoResize.ts                   # textarea 自适应高度 hook
  useClickOutside.ts                 # 点击外部关闭下拉 hook

config/
  modelConfig.ts                     # 模型配置类型 & mock 数据

assets/css/
  workspace.css                      # 页面级 CSS 变量与自定义滚动条（禁止修改全局 main.css）
```

---

## 2. 组件拆解清单

### 2.1 页面级容器

| 组件 | 职责 | Props |
|------|------|-------|
| `ImageGenPage.vue` | 页面根组件，管理全局状态（`selectedModel`, `prompt`, `sidebarOpen`, `heroPromptVisible`），组装侧边栏与主内容区 | 无（页面组件） |

### 2.2 左侧设置面板

| 组件 | 职责 | Props |
|------|------|-------|
| `SettingsSidebar.vue` | 固定 300px 左侧参数面板，包含模型/比例/分辨率/数量/风格/上传/相似度区块 | `open: boolean`, `selectedModel: ModelConfig`, `onClose`, `onModelChange` |
| `SidebarSection.vue` | 通用分区标题（标题 + 可选右侧额外内容） | `title: string`, `extra?: slot` |
| `ModelSelectCard.vue` | 模型选择下拉卡片，收起时显示当前模型图标+名称，展开时显示所有模型+描述 | `models: ModelConfig[]`, `selected: ModelConfig`, `onSelect` |
| `OptionChipGroup.vue` | 通用 Chip 选择组，支持折叠（`maxVisible`），超出显示"更多"按钮 | `options: string[]`, `selected: string`, `onSelect`, `maxVisible?: number` |
| `StyleSelector.vue` | 风格选择器，触发式下拉面板，内部 4 列网格，每项含渐变色占位缩略图 | `styles: string[]`, `selected: string`, `onSelect` |
| `UploadReferencePanel.vue` | 上传参考图面板，支持 `typed`（按类型切换）和 `simple`（直接上传）两种模式 | `config: UploadRefConfig` |
| `UploadZone.vue` | 单个上传区域，支持单图模式和多图模式（最多 5 张） | `multi: boolean`, `placeholder: string` |
| `UserFooterPanel.vue` | 侧边栏底部用户信息（头像图标 + 用户名 + 积分） | 无 |

### 2.3 主内容区

| 组件 | 职责 | Props |
|------|------|-------|
| `HeroPromptBar.vue` | Hero 区域，含主标题和提示词输入框 + 发送按钮 | `prompt: string`, `cost: number`, `onPromptChange`, `onSubmit` |
| `StickyPromptBar.vue` | 吸顶提示词条，Hero 输入框滚出可视区时显示 | `visible: boolean`, `prompt: string`, `cost: number`, `onPromptChange`, `onSubmit` |
| `MasonryGallery.vue` | 瀑布流画廊容器 | `onUsePrompt` |
| `GalleryCard.vue` | 单张画廊卡片，悬浮显示提示词 + "制作同款"按钮 | `item: GalleryItem`, `onUsePrompt` |

### 2.4 Composables

| Composable | 职责 |
|------------|------|
| `useAutoResize` | textarea 根据内容自适应高度，接受 `maxHeight` 参数 |
| `useClickOutside` | 监听点击事件，点击目标元素外部时触发回调（用于关闭下拉面板） |

---

## 3. @nuxt/ui 映射指南

### 3.1 组件映射表

| 原型元素 | @nuxt/ui 组件 | 使用说明 |
|----------|---------------|----------|
| 发送按钮（Hero + 吸顶） | `<UButton>` | `size="md"`, 自定义渐变色背景（见 CSS 章节），内含图标 `Zap` + 文本"发送" + 积分数 |
| "制作同款"按钮（画廊卡片） | `<UButton>` | `size="sm"`, 同渐变色，宽度 90%，居中 |
| 汉堡菜单按钮（移动端） | `<UButton>` | `variant="ghost"`, 仅图标 `Menu`, `lg:hidden` |
| 比例/分辨率/数量 Chip | `<UButton>` | `variant` 切换：选中态 `solid`（primary），未选中态 `outline` |
| "更多/收起"折叠按钮 | `<UButton>` | `variant="ghost"`, `size="xs"`, 内含 `ChevronDown`/`ChevronUp` 图标 |
| 模型选择下拉 | `<USelectMenu>` 或手动实现 | 建议使用 `<USelectMenu>` 配合自定义 option slot 实现图标+名称+描述的展示。收起时隐藏描述，仅展示图标+名称 |
| 风格选择下拉 | 手动实现 | `@nuxt/ui` 无直接对应的网格下拉组件，需手动实现触发按钮 + 浮层（使用 `<UPopover>` 包裹 4 列网格内容） |
| 上传参考图类型切换 Tab | `<UTabs>` | 3 个 tab：`人物参考` / `图像参考` / `风格参考`，选中态 primary 背景 |
| 上传区域 | 手动实现 | `@nuxt/ui` 无上传组件，需手动实现 drag & click 上传区域 |
| Prompt 输入框（Hero + 吸顶） | `<UTextarea>` | `autoresize` 属性，自定义 `maxHeight`/`minHeight`。**注意：focus 状态不加 shadow，需覆写 `:ui` prop 去掉默认 focus ring** |
| 相似度加减按钮 | `<UButton>` | `variant="ghost"`, 圆形，内含 `Minus`/`Plus` 图标 |
| 遮罩层（移动端侧边栏背景） | `<UOverlay>` 或 `<div>` | `fixed inset-0 bg-black/50`，点击关闭侧边栏 |
| Toast 提示（上传校验） | `<UToast>` / `useToast()` | 文件格式错误、尺寸超限、分辨率不足时的提示 |

### 3.2 关键样式覆写说明

#### UTextarea — 去除 focus shadow
```
:ui="{
  base: 'focus:ring-0 focus:shadow-none',
}"
```

#### UButton — 所有可点击元素
- 所有 `<UButton>` 和 `<a>` 标签 hover 时鼠标样式为 `cursor-pointer`（`@nuxt/ui` 按钮默认支持）
- 所有按钮必须有 hover 效果（背景色变化或 `brightness-110`）

#### USelectMenu — 模型选择
- 收起状态：显示模型 `icon`（emoji）+ `name`
- 展开状态：每个 option 显示 `icon` + `name` + `description`
- 选中项背景高亮

---

## 4. 占位与文案说明

### 4.1 图片占位规范

**严禁自由发挥生成装饰性图片元素。** 所有图片位置使用空 `<img>` 标签占位：

| 位置 | 宽度 | 高度 | 说明 |
|------|------|------|------|
| 画廊卡片图片 | `100%` (列宽自适应) | 各卡片独立高度（260-360px 混合） | `<img src="" alt="" width="100%" :height="item.height" />` 圆角 `12px` |
| 风格选择缩略图 | 列宽自适应 | `aspect-square` | 使用渐变色背景占位 div，非 img |
| 用户头像 | `32px` | `32px` | 圆形，使用 `User` 图标占位 |

### 4.2 核心文案清单（必须原封不动保留）

| 位置 | 文案内容 |
|------|----------|
| Hero 主标题 | `把想象，变成图像` |
| Prompt placeholder | `输入您的提示词，比如：可爱的猫` |
| 发送按钮 | `发送` |
| 画廊标题 | `🎨 灵感显影室` |
| 画廊卡片按钮 | `制作同款` |
| 侧边栏标题 | `图像生成` |
| 侧边栏分区标题 | `切换模型` / `比例` / `分辨率` / `生成数量` / `风格` / `上传参考图` / `相似度` |
| 折叠按钮 | `更多` / `收起` |
| 上传区提示 | `单击或拖动图像即可上传` |
| 上传区提示（simple 模式） | `将图片拖至此处或单击上传` |
| 上传校验 — 格式错误 | `请上传jpeg,png,jpg,webp的图片` |
| 上传校验 — 尺寸超限 | `照片大小请勿超过10M。如超出，系统将自动为您压缩` |
| 上传校验 — 分辨率不足 | `为了保证生图质量，请您上传的图片分辨率大于300px*300px` |
| 上传校验 — 多图上限 | `最多上传5张图片` |
| 用户名 | `用户` |
| 用户信息 | `免费版 · 5 积分` |
| 上传类型 Tab | `人物参考` / `图像参考` / `风格参考` |

### 4.3 模型 Mock 数据（必须完整保留）

| ID | 名称 | 图标 | 描述 | 积分 |
|----|------|------|------|------|
| `nano-banana-2` | Nano-banana 2 | 🍌 | 高级图像生成模型，输出高度一致，细节更清晰，图像更稳定 | 5 |
| `nano-banana-pro` | Nano-banana pro | 🍌 | 更鲜明的风格和更丰富的细节 | 8 |
| `midjourney-v6-1` | Midjourney V6.1 | 🎨 | 稳定可控模型 | 10 |
| `chatgpt-image-1` | ChatGPT-image-1 | 🤖 | 理解能力强，可生成带文字的图片 | 12 |

**每个模型的 features 配置详见 `config/modelConfig.ts`，必须完整迁移。**

### 4.4 画廊 Mock 数据

共 27 条画廊数据，每条包含 `id`, `image`(空占位), `type`, `title`, `description`, `height`。**description 字段即为提示词文案，必须原封不动保留。** 完整数据：

| ID | 标题 | 描述（提示词） | 高度 |
|----|------|---------------|------|
| 1 | 可爱猫咪 | 一只戴着眼镜的橙色小猫，工作室照明，暖色调 | 280 |
| 2 | 赛博城市 | 未来赛博朋克城市夜景，霓虹灯在湿润街道上反射，飞行器穿梭 | 320 |
| 3 | 幻想少女 | 蓝色长发的动漫少女在幻想花园中，空灵的光线，精致的插画风格 | 360 |
| 4 | 金色巨龙 | 金色巨龙盘旋在暴风云中，奇幻数字绘画，戏剧性光影 | 300 |
| 5 | 禅意花园 | 宁静的日式禅意花园，樱花盛开，锦鲤游弋，石灯笼 | 260 |
| 6 | 金色时刻 | 雀斑少女的肖像，金色夕阳光线，浅景深，自然美 | 340 |
| 7 | 深海珊瑚 | 水下珊瑚礁场景，热带鱼群和水母，清澈海水 | 280 |
| 8 | 蒸汽猫头鹰 | 蒸汽朋克机械猫头鹰栖息在齿轮上，铜色调，精密零件 | 320 |
| 9 | 极光之夜 | 北极光倒映在冰冻湖面，雪山环绕，绿紫交织 | 260 |
| 10 | 巧克力蛋糕 | 精致的巧克力蛋糕配莓果和金叶装饰，暗调美食摄影 | 300 |
| 11 | 太空漫步 | 宇航员漂浮在太空中，地球为背景，星云和星辰 | 340 |
| 12 | 向日葵柯基 | 可爱的柯基犬在向日葵田中奔跑，金色阳光 | 280 |
| 13 | 霓虹巷道 | 雨后的赛博朋克小巷，地面倒映着霓虹招牌，蒸汽升腾 | 300 |
| 14 | 午后猫咪 | 慵懒的橘猫趴在窗台上晒太阳，柔和的侧光 | 260 |
| 15 | 竹林小径 | 静谧的竹林小径，阳光透过竹叶洒落斑驳光影 | 340 |
| 16 | 冰霜之龙 | 冰蓝色巨龙在雪山之巅呼啸，冰晶飞舞，极寒氛围 | 280 |
| 17 | 晨雾少女 | 清晨薄雾中的少女侧影，逆光剪影，梦幻氛围 | 320 |
| 18 | 深海水母 | 发光水母群在深海中漂浮，生物荧光，幽蓝色调 | 300 |
| 19 | 机械飞鸟 | 精密的机械鸟展翅飞翔，齿轮与羽毛交织，蒸汽朋克美学 | 260 |
| 20 | 星空帐篷 | 极光下的野外露营，帐篷内透出温暖灯光，银河横跨天际 | 340 |
| 21 | 抹茶甜点 | 精致的日式抹茶甜点拼盘，和风器皿，清新配色 | 280 |
| 22 | 月球基地 | 宇航员站在月球表面远眺地球，科幻建筑群落 | 320 |
| 23 | 星空少女 | 少女仰望星空，发丝随风飘动，星尘围绕，唯美插画 | 300 |
| 24 | 雪地柯基 | 柯基在雪地中欢快奔跑，雪花纷飞，冬日暖阳 | 260 |
| 25 | 星空猫咪 | 猫咪坐在屋顶仰望星空，月光洒落，宁静夜晚 | 340 |
| 26 | 未来都市 | 高楼林立的未来城市全景，飞行列车穿梭，科技感十足 | 280 |
| 27 | 枫叶庭院 | 秋日日式庭院，红枫倒映在池塘中，宁静致远 | 300 |

### 4.5 风格列表（25 项，必须完整保留）

```
自动, 印象派, 卡通, 折纸, 花札, 龙珠, 雕塑, 4D,
草图, 毛绒玩具, 毛毡, 洛可可, 蒸汽朋克, 吉卜力, 巴洛克,
波西米亚风格, 未来主义, Funko Pop, 包豪斯, 波普艺术,
赛博朋克, 地中海, 像素风, 极简主义, 写实
```

每个风格对应一个渐变色缩略图占位（见 `StyleSelector` 中的 `styleGradients` 映射表），必须完整保留。

---

## 5. CSS 变量与页面级样式提示

### 5.1 主题变量（写入 `assets/css/workspace.css`，禁止修改全局变量）

以下为页面级 workspace 专用变量，需在 `assets/css/workspace.css` 中定义。其他 CSS 变量（如 `--color-primary`）使用 `@nuxt/ui` / Tailwind CSS 默认值，不要修改。

```css
/* assets/css/workspace.css */

/* ===== 页面级 workspace 变量 ===== */
:root {
  /* Light Mode（默认） */
  --workspace-panel: 240 20% 97%;
  --workspace-panel-foreground: 240 10% 30%;
  --workspace-surface: 0 0% 100%;
  --workspace-surface-foreground: 240 10% 15%;
  --workspace-chip: 240 15% 93%;
  --workspace-chip-active: 240 73.9% 61%;
  --workspace-glass: 240 20% 97% / 0.8;
  --workspace-border: 240 15% 85%;
  --workspace-glow: 240 73.9% 61% / 0.1;
  --workspace-neon: 175 70% 45%;
}

.dark {
  /* Dark Mode */
  --workspace-panel: 240 10% 14%;
  --workspace-panel-foreground: 0 0% 92%;
  --workspace-surface: 240 6.7% 20.6%;
  --workspace-surface-foreground: 0 0% 100%;
  --workspace-chip: 240 10% 24%;
  --workspace-chip-active: 240 73.9% 61%;
  --workspace-glass: 240 10% 16% / 0.7;
  --workspace-border: 240 10% 30%;
  --workspace-glow: 240 73.9% 61% / 0.15;
  --workspace-neon: 175 70% 50%;
}
```

### 5.2 @nuxt/ui 主题变量映射

在 `app.config.ts` 或 `nuxt.config.ts` 中配置 @nuxt/ui 的主题色：

```
Light Mode:
  --color-primary: 240 73.9% 61%     (紫蓝色)
  --ui-bg: 0 0% 100%
  --ui-foreground: 0 0% 9%
  --ui-border: 240 15% 88%

Dark Mode:
  --color-primary: 240 73.9% 61%     (保持一致)
  --ui-bg: 240 6.7% 20.6%
  --ui-foreground: 0 0% 100%
  --ui-border: 240 16% 94%
```

### 5.3 自定义滚动条（写入 `workspace.css`）

```css
/* 自定义滚动条 */
.workspace-scroll::-webkit-scrollbar {
  width: 4px;
}
.workspace-scroll::-webkit-scrollbar-track {
  background: transparent;
}
.workspace-scroll::-webkit-scrollbar-thumb {
  background: hsl(240 10% 80%);
  border-radius: 4px;
}
.dark .workspace-scroll::-webkit-scrollbar-thumb {
  background: hsl(240 10% 30%);
}

/* 隐藏 Prompt textarea 滚动条 */
.prompt-textarea {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.prompt-textarea::-webkit-scrollbar {
  display: none;
}
```

### 5.4 Tailwind 扩展配置

在 `tailwind.config.ts` 中注册 workspace 颜色 token，使其可通过 `bg-workspace-panel` 等类名使用：

```ts
// tailwind.config.ts 中 extend.colors 新增：
workspace: {
  panel: "hsl(var(--workspace-panel))",
  "panel-foreground": "hsl(var(--workspace-panel-foreground))",
  surface: "hsl(var(--workspace-surface))",
  "surface-foreground": "hsl(var(--workspace-surface-foreground))",
  chip: "hsl(var(--workspace-chip))",
  "chip-active": "hsl(var(--workspace-chip-active))",
  border: "hsl(var(--workspace-border))",
  neon: "hsl(var(--workspace-neon))",
}
```

### 5.5 特殊样式说明

| 元素 | 样式描述 |
|------|----------|
| 发送按钮 | 渐变背景 `bg-gradient-to-r from-primary to-workspace-neon`，文字白色，hover 时 `brightness-110`，`shadow-md` |
| 选中态 Chip | `bg-primary text-primary-foreground border-primary`，亮色模式添加微弱发光 `shadow-[0_0_12px_hsl(var(--workspace-glow))]` |
| 未选中 Chip | `bg-workspace-chip/50 text-workspace-panel-foreground/80 border-workspace-border`，hover 时 `bg-workspace-chip` |
| 画廊卡片 | 圆角 `12px`，hover 时图片 `scale(1.03)` + `brightness(1.1)` |
| 画廊悬浮遮罩 | `bg-gradient-to-t from-black/80 via-black/30 to-transparent`，文字 `hsl(60 10% 95%)`（暖白），`drop-shadow` 增强可读性 |
| Prompt 输入框容器 | 圆角 `16px`，`border border-workspace-border/60`，`bg-workspace-surface`，`shadow-lg` |
| 侧边栏 | `bg-workspace-panel`，右侧 `border-r border-workspace-border/30` |
| 模型选择下拉面板 | `bg-workspace-panel`，`border border-workspace-border`，`shadow-lg`，`rounded-xl` |

---

## 6. 状态机与逻辑插槽

### 6.1 全局页面状态

```ts
interface PageState {
  // 侧边栏
  sidebarOpen: boolean               // 移动端侧边栏展开状态

  // 当前选中模型
  selectedModel: ModelConfig          // 默认取在线模型列表第一项

  // Prompt
  prompt: string                      // Hero 与 Sticky 双向同步

  // 吸顶判断
  heroPromptVisible: boolean          // IntersectionObserver 检测 Hero 输入框是否在可视区
}
```

### 6.2 侧边栏本地状态

```ts
interface SidebarLocalState {
  ratio: string                       // 当前比例，默认 features.ratios[0]
  resolution: string                  // 当前分辨率，默认 features.resolutions[0]
  count: string                       // 当前生成数量，默认 features.counts[0]
  style: string                       // 当前风格，默认 features.styles[0] 或 "自动"
  similarity: number                  // 相似度 0-100，默认 50，步长 1
}
```

**关键行为：切换模型时，所有侧边栏本地状态重置为新模型的默认值。**

### 6.3 条件渲染逻辑

侧边栏各区块根据 `selectedModel.features` 动态显示/隐藏：

| 区块 | 显示条件 |
|------|----------|
| 比例 | `features.ratios?.length > 0` |
| 分辨率 | `features.resolutions?.length > 0` |
| 生成数量 | `features.counts?.length > 0` |
| 风格 | `features.styles?.length > 0` |
| 上传参考图 | `features.uploadRef` 存在 |
| 相似度 | `features.similarity === true` |

### 6.4 交互事件占位（需对接真实接口）

```ts
// ====== 事件函数占位 ======

/**
 * 提交生图请求
 * 触发点：Hero/Sticky 的"发送"按钮点击
 * 参数：prompt, selectedModel, ratio, resolution, count, style, similarity, uploadedImages
 * 预期行为：
 *   1. 校验 prompt 非空
 *   2. 设置 isGenerating = true
 *   3. 调用后端接口
 *   4. 接收结果后更新画廊/展示生成的图片
 *   5. 扣减积分
 */
async function handleGenerate() {
  // TODO: 对接后端 API
}

/**
 * 获取模型列表
 * 触发点：页面初始化
 * 预期行为：替换 mock 数据，从后端获取在线模型列表
 */
async function fetchModels(): Promise<ModelConfig[]> {
  // TODO: GET /api/models
}

/**
 * 获取画廊灵感数据
 * 触发点：页面初始化
 * 预期行为：替换 mock 数据，从后端获取画廊展示数据
 */
async function fetchGalleryData(): Promise<GalleryItem[]> {
  // TODO: GET /api/gallery
}
```

### 6.5 交互状态

| 状态 | 类型 | 说明 |
|------|------|------|
| `isGenerating` | `boolean` | 生图请求进行中，发送按钮显示 loading 状态（禁用 + spinner），禁止重复提交 |
| `sidebarOpen` | `boolean` | 移动端侧边栏展开/收起 |
| `heroPromptVisible` | `boolean` | 通过 `IntersectionObserver` 观察 Hero 区域底部 sentinel 元素，决定吸顶条的显隐 |
| `modelDropdownOpen` | `boolean` | 模型选择下拉面板展开/收起 |
| `styleDropdownOpen` | `boolean` | 风格选择下拉面板展开/收起 |
| `chipExpanded` | `boolean` | 比例选项 Chip 组的折叠/展开状态（maxVisible=4） |

### 6.6 IntersectionObserver 吸顶逻辑

```
主内容区（scrollable container）内放置一个 0 高度的 sentinel <div>，
位于 HeroPromptBar 正下方。

使用 IntersectionObserver 观察该 sentinel：
  - root: 主内容区滚动容器
  - threshold: 0
  - 当 sentinel 不可见（entry.isIntersecting === false）时：
    → heroPromptVisible = false → 显示 StickyPromptBar
  - 当 sentinel 可见时：
    → heroPromptVisible = true → 隐藏 StickyPromptBar

StickyPromptBar 的显隐通过 CSS transition 控制：
  - 可见：opacity-100, 正常高度
  - 隐藏：max-h-0, opacity-0, pointer-events-none
```

### 6.7 文件上传校验规则

| 规则 | 值 | 校验失败提示 |
|------|----|-------------|
| 允许格式 | `jpeg, png, jpg, webp` | `请上传jpeg,png,jpg,webp的图片` |
| 最大文件大小 | `10MB` | `照片大小请勿超过10M。如超出，系统将自动为您压缩`（warning 级别，不阻断上传） |
| 最小分辨率 | `300×300px` | `为了保证生图质量，请您上传的图片分辨率大于300px*300px` |
| 多图上限 | `5 张` | `最多上传5张图片` |

---

## 附录：模型 Features 完整配置

### Nano-banana 2
- ratios: `1:1, 2:3, 3:2, 3:4, 16:9, 4:3, 9:16`
- resolutions: `1K, 2K, 4K`
- counts: `1, 2, 3, 4`
- styles: 25 项完整列表
- similarity: ✅
- uploadRef: typed 模式，multiUpload，3 类型（人物参考/图像参考/风格参考）

### Nano-banana pro
- ratios: `1:1, 2:3, 3:2, 3:4, 16:9, 4:3, 9:16`
- resolutions: `1K, 2K, 4K`
- counts: `1`
- styles: ❌
- similarity: ❌
- uploadRef: simple 模式，multiUpload

### Midjourney V6.1
- ratios: `1:1, 2:3, 3:2, 3:4, 16:9, 4:3, 9:16`
- resolutions: ❌
- counts: ❌
- styles: 25 项完整列表
- similarity: ✅
- uploadRef: typed 模式，multiUpload，3 类型

### ChatGPT-image-1
- ratios: `1:1, 2:3, 3:2`
- resolutions: ❌
- counts: `1`
- styles: ❌
- similarity: ❌
- uploadRef: simple 模式，单图上传
