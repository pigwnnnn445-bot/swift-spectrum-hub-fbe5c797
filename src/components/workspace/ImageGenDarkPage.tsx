import { useState, useCallback, useRef, useEffect } from "react";
import { Menu } from "lucide-react";
import SettingsSidebar from "./SettingsSidebar";
import HeroPromptBar from "./HeroPromptBar";
import MasonryGallery from "./MasonryGallery";
import StickyPromptBar from "./StickyPromptBar";
import TopNavBar from "./TopNavBar";
import TaskList from "./TaskList";
import { fetchModelsData } from "@/api/modelService";
import { mockGenerate } from "@/api/mockGenerate";
import type { ModelConfig, Provider } from "@/config/modelConfig";
import { getEnabledImageLikes } from "@/config/modelConfig";
import type { GenerateTask } from "@/types/task";
import { toast } from "@/hooks/use-toast";

const ImageGenDarkPage = () => {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [models, setModels] = useState<ModelConfig[]>([]);
  const [selectedModel, setSelectedModel] = useState<ModelConfig | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [extraCost, setExtraCost] = useState(0);
  const [imageCount, setImageCount] = useState(1);
  const [tasks, setTasks] = useState<GenerateTask[]>([]);
  const [hasEnteredCreationMode, setHasEnteredCreationMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCooldown, setIsCooldown] = useState(false);
  const cooldownRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const promptInputRef = useRef<HTMLTextAreaElement | null>(null);
  // 参考图状态（用于"应用为参考图"回填）
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  // 组件卸载时清理 cooldown timeout
  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearTimeout(cooldownRef.current);
    };
  }, []);

  useEffect(() => {
    fetchModelsData().then((data) => {
      setProviders(data.provider_list);
      setModels(data.model_list);
      if (data.model_list.length > 0) setSelectedModel(data.model_list[0]);
    });
  }, []);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    setShowStickyBar(scrollTop > 200);
  }, []);

  const handleExtraCostChange = useCallback((extra: number) => {
    setExtraCost(extra);
  }, []);

  // ── 检查是否有任务正在生成（仅用于按钮文案等实时状态） ──
  const isGenerating = tasks.some((t) => t.status === "generating" || t.status === "submitting");

  // ── 提交生成任务 ──
  const handleSubmit = useCallback(async () => {
    if (!selectedModel || !prompt.trim() || isSubmitting || isCooldown) return;

    if (!prompt.trim()) {
      toast({ title: "请输入提示词", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);

    // 点击发送后立即开始 2 秒静默冷却
    if (cooldownRef.current) clearTimeout(cooldownRef.current);
    setIsCooldown(true);
    cooldownRef.current = setTimeout(() => {
      setIsCooldown(false);
      cooldownRef.current = null;
    }, 2000);

    const taskId = `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const count = imageCount;

    const newTask: GenerateTask = {
      id: taskId,
      prompt: prompt.trim(),
      status: "submitting",
      modelName: selectedModel.name,
      modelImage: selectedModel.image,
      ratio: selectedModel.ratio?.[0] ?? "1:1",
      resolution: selectedModel.resolution?.[0]?.resolution ?? "",
      count,
      images: [],
      createdAt: Date.now(),
      requestPayload: {
        model_id: selectedModel.id,
        prompt: prompt.trim(),
        count,
      },
    };

    // 插入到列表顶部
    setHasEnteredCreationMode(true);
    setTasks((prev) => [newTask, ...prev]);

    // 切换为 generating
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: "generating" as const } : t))
    );

    // ── 调用 mock 接口（发布时替换为真实 API） ──
    try {
      const result = await mockGenerate(count);
      setIsSubmitting(false);
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id !== taskId) return t;
          if (result.success) {
            return { ...t, status: "success" as const, images: result.images ?? [] };
          }
          return { ...t, status: "error" as const, errorMessage: result.errorMessage };
        })
      );
    } catch {
      setIsSubmitting(false);
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, status: "error" as const, errorMessage: "网络异常，请稍后重试" } : t
        )
      );
    }
  }, [selectedModel, prompt, isSubmitting, isCooldown]);

  // ── 重试任务 ──
  const handleRetry = useCallback(async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: "generating" as const, errorMessage: undefined } : t))
    );

    try {
      const result = await mockGenerate(task.count);
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id !== taskId) return t;
          if (result.success) {
            return { ...t, status: "success" as const, images: result.images ?? [] };
          }
          return { ...t, status: "error" as const, errorMessage: result.errorMessage };
        })
      );
    } catch {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, status: "error" as const, errorMessage: "网络异常，请稍后重试" } : t
        )
      );
    }
  }, [tasks]);

  // ── 应用提示词回填 ──
  const handleApplyPrompt = useCallback((text: string) => {
    setPrompt(text);
    // 聚焦并光标定位末尾
    setTimeout(() => {
      const el = promptInputRef.current;
      if (el) {
        el.focus();
        el.setSelectionRange(text.length, text.length);
      }
    }, 50);
  }, []);

  // ── 应用为参考图 ──
  const handleApplyReferenceImage = useCallback((imageUrl: string) => {
    if (!selectedModel) return;

    // 检查模型是否支持参考图
    const enabledLikes = getEnabledImageLikes(selectedModel);
    if (selectedModel.image_like_flg !== 1 || enabledLikes.length === 0) {
      toast({ title: "当前模型不支持上传参考图", variant: "destructive" });
      return;
    }

    // 检查重复
    if (referenceImages.includes(imageUrl)) {
      toast({ title: "请不要上传重复图片", variant: "destructive" });
      return;
    }

    // 上限：使用 UploadReferencePanel 的 MAX_MULTI_IMAGES = 5
    const maxImages = 5;
    setReferenceImages((prev) => {
      if (prev.length >= maxImages) {
        // FIFO 替换最早一张
        return [...prev.slice(1), imageUrl];
      }
      return [...prev, imageUrl];
    });
    toast({ title: "参考图已添加" });
  }, [selectedModel, referenceImages]);

  if (!selectedModel) return null;

  const totalCost = selectedModel.price + extraCost;
  

  return (
    <div className="flex h-screen w-full overflow-hidden bg-workspace-panel">
      <SettingsSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
        models={models}
        providers={providers}
        onExtraCostChange={handleExtraCostChange}
        imageCount={imageCount}
        onImageCountChange={setImageCount}
      />

      <main className="relative flex-1 overflow-y-auto bg-workspace-surface workspace-scroll" onScroll={handleScroll}>
        <div className="sticky top-0 z-50 flex items-center">
          <button
            onClick={() => setSidebarOpen(true)}
            className="ml-2 mr-1 flex h-8 w-8 items-center justify-center rounded-lg bg-background/80 backdrop-blur border border-border lg:hidden shrink-0"
          >
            <Menu className="h-4 w-4 text-foreground" />
          </button>
          <div className="flex-1 min-w-0">
            <TopNavBar />
          </div>
        </div>

        <HeroPromptBar
          prompt={prompt}
          onPromptChange={setPrompt}
          cost={totalCost}
          isGenerating={isGenerating}
          isSubmitDisabled={isSubmitting || isCooldown}
          onSubmit={handleSubmit}
          hasActiveTask={hasEnteredCreationMode}
          promptInputRef={promptInputRef}
        />

        {/* 吸顶输入条：进入创作模式后由 HeroPromptBar 吸顶，无需 StickyPromptBar */}
        {!hasEnteredCreationMode && (
          <div className="sticky top-[41px] z-40">
            <StickyPromptBar
              visible={showStickyBar}
              prompt={prompt}
              onPromptChange={setPrompt}
              cost={totalCost}
              isGenerating={isGenerating}
              onSubmit={handleSubmit}
            />
          </div>
        )}

        {/* 任务列表 */}
        <TaskList tasks={tasks} onRetry={handleRetry} />

        {/* 灵感画廊：进入创作模式后隐藏 */}
        {!hasEnteredCreationMode && (
          <div className="px-4 pb-8 sm:px-6 lg:px-8">
            <h2 className="mb-5 mt-2 text-lg font-semibold text-workspace-panel-foreground">
              🎨 灵感显影室
            </h2>
            <MasonryGallery onUsePrompt={setPrompt} />
          </div>
        )}
      </main>
    </div>
  );
};

export default ImageGenDarkPage;
