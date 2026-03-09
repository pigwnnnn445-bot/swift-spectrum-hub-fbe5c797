import { useState, useCallback, useRef, useEffect } from "react";
import { Menu } from "lucide-react";
import SettingsSidebar from "./SettingsSidebar";
import HeroPromptBar from "./HeroPromptBar";
import MobileParamBar from "./MobileParamBar";
import MasonryGallery from "./MasonryGallery";
import { cn } from "@/lib/utils";
import TopNavBar from "./TopNavBar";
import TaskList from "./TaskList";
import EditImageModal from "./EditImageModal";
import ImageInpaintModal from "./ImageInpaintModal";
import ImageDetailWorkspace from "./ImageDetailWorkspace";
import AssetGalleryView from "./AssetGalleryView";
import BackToTopButton from "./BackToTopButton";
import type { InpaintPayload } from "./ImageInpaintModal";
import type { ComposerPayload } from "./ImageEditComposer";
import { fetchModelsData } from "@/api/modelService";
import { mockGenerate } from "@/api/mockGenerate";
import type { ModelConfig, Provider } from "@/config/modelConfig";
import { getEnabledImageLikes } from "@/config/modelConfig";
import type { GenerateTask, GenerationMode } from "@/types/task";
import { toast } from "@/hooks/use-toast";

const ImageGenDarkPage = () => {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [models, setModels] = useState<ModelConfig[]>([]);
  const [selectedModel, setSelectedModel] = useState<ModelConfig | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSticky, setIsSticky] = useState(false);
  const promptContainerRef = useRef<HTMLDivElement>(null);
  const [prompt, setPrompt] = useState("");
  const [extraCost, setExtraCost] = useState(0);
  const [imageCount, setImageCount] = useState(1);
  const [tasks, setTasks] = useState<GenerateTask[]>([]);
  const [hasEnteredCreationMode, setHasEnteredCreationMode] = useState(false);
  const [showInspirationOnly, setShowInspirationOnly] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCooldown, setIsCooldown] = useState(false);
  const cooldownRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const promptInputRef = useRef<HTMLTextAreaElement | null>(null);
  const mainScrollRef = useRef<HTMLElement>(null);
  // 参考图状态（用于"应用为参考图"回填）
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  // Sidebar 参数追踪（用于构建任务快照）
  const [sidebarRatio, setSidebarRatio] = useState("");
  const [sidebarResolution, setSidebarResolution] = useState("");
  const [sidebarStyleId, setSidebarStyleId] = useState<number | null>(null);
  const [sidebarStyleName, setSidebarStyleName] = useState("");
  const [sidebarSimilarity, setSidebarSimilarity] = useState(50);
  // 编辑图像弹窗状态
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingImageUrl, setEditingImageUrl] = useState("");
  const [editingTask, setEditingTask] = useState<GenerateTask | null>(null);
  // 局部重绘弹窗状态
  const [inpaintModalOpen, setInpaintModalOpen] = useState(false);
  const [inpaintImageUrl, setInpaintImageUrl] = useState("");
  // 大图详情视图状态
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailImageUrl, setDetailImageUrl] = useState("");
  const [detailTask, setDetailTask] = useState<GenerateTask | null>(null);
  const [detailImageIndex, setDetailImageIndex] = useState(0);
  // 视图模式：gen=生成页 | assets=资产管理
  const [viewMode, setViewMode] = useState<"gen" | "assets">("gen");
  // 组件卸载时清理 cooldown timeout
  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearTimeout(cooldownRef.current);
    };
  }, []);

  // scrollTop-based sticky visual detection (for title hiding & background blur)
  useEffect(() => {
    const scrollEl = mainScrollRef.current;
    if (!scrollEl) return;
    let ticking = false;
    const THRESHOLD = 100; // when scrolled past ~100px, hide title and show sticky visual
    const HYSTERESIS = 24;
    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const scrollTop = scrollEl.scrollTop;
        setIsSticky((prev) => {
          if (!prev && scrollTop >= THRESHOLD) return true;
          if (prev && scrollTop < THRESHOLD - HYSTERESIS) return false;
          return prev;
        });
        ticking = false;
      });
    };
    scrollEl.addEventListener("scroll", handleScroll, { passive: true });
    return () => scrollEl.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    fetchModelsData().then((data) => {
      setProviders(data.provider_list);
      setModels(data.model_list);
      if (data.model_list.length > 0) setSelectedModel(data.model_list[0]);
    });
  }, []);

  const handleExtraCostChange = useCallback((extra: number) => {
    setExtraCost(extra);
  }, []);


  // ── 提交生成任务 ──
  const handleSubmit = useCallback(() => {
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

    const hasRefImages = referenceImages.length > 0;
    const generationMode: GenerationMode = hasRefImages ? "image-to-image" : "text-to-image";

    const newTask: GenerateTask = {
      id: taskId,
      prompt: prompt.trim(),
      status: "submitting",
      modelId: selectedModel.id,
      modelName: selectedModel.name,
      modelImage: selectedModel.image,
      ratio: sidebarRatio || selectedModel.ratio?.[0] || "1:1",
      resolution: sidebarResolution || selectedModel.resolution?.[0]?.resolution || "",
      styleName: sidebarStyleName || undefined,
      styleId: sidebarStyleId,
      generationMode,
      similarity: hasRefImages ? sidebarSimilarity : undefined,
      count,
      images: [],
      referenceImages: hasRefImages ? [...referenceImages] : undefined,
      createdAt: Date.now(),
      requestPayload: {
        model_id: selectedModel.id,
        prompt: prompt.trim(),
        count,
        ratio: sidebarRatio || selectedModel.ratio?.[0] || "1:1",
        resolution: sidebarResolution || selectedModel.resolution?.[0]?.resolution || "",
        style_id: sidebarStyleId,
        generation_mode: generationMode,
        similarity: hasRefImages ? sidebarSimilarity : undefined,
        reference_images: hasRefImages ? [...referenceImages] : undefined,
      },
    };

    // 插入到列表顶部
    setHasEnteredCreationMode(true);
    setPrompt("");
    setTasks((prev) => [newTask, ...prev]);

    // 切换为 generating
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: "generating" as const } : t))
    );

    // 任务已创建并插入列表，立即恢复可提交状态（允许并行发送）
    setIsSubmitting(false);

    // ── 调用 mock 接口（发布时替换为真实 API） ──
    // 闭包捕获 taskId，确保并发任务结果精确回写
    mockGenerate(count).then((result) => {
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id !== taskId) return t;
          if (result.success) {
            return { ...t, status: "success" as const, images: result.images ?? [] };
          }
          return { ...t, status: "error" as const, errorMessage: result.errorMessage };
        })
      );
    }).catch(() => {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, status: "error" as const, errorMessage: "网络异常，请稍后重试" } : t
        )
      );
    });
  }, [selectedModel, prompt, isSubmitting, isCooldown, imageCount, referenceImages, sidebarRatio, sidebarResolution, sidebarStyleId, sidebarStyleName, sidebarSimilarity]);

  // ── 重试任务（从快照新建，count=1，原任务保留） ──
  const handleRetry = useCallback(async (taskId: string) => {
    const originTask = tasks.find((t) => t.id === taskId);
    if (!originTask) return;

    const newTaskId = `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const retryCount = 1;

    const newTask: GenerateTask = {
      id: newTaskId,
      prompt: originTask.prompt,
      status: "submitting",
      modelId: originTask.modelId,
      modelName: originTask.modelName,
      modelImage: originTask.modelImage,
      ratio: originTask.ratio,
      resolution: originTask.resolution,
      styleName: originTask.styleName,
      styleId: originTask.styleId,
      generationMode: originTask.generationMode,
      similarity: originTask.similarity,
      count: retryCount,
      images: [],
      referenceImages: originTask.referenceImages ? [...originTask.referenceImages] : undefined,
      createdAt: Date.now(),
      requestPayload: {
        ...originTask.requestPayload,
        count: retryCount,
      },
    };

    setHasEnteredCreationMode(true);
    setTasks((prev) => [newTask, ...prev]);

    // 切换为 generating
    setTasks((prev) =>
      prev.map((t) => (t.id === newTaskId ? { ...t, status: "generating" as const } : t))
    );

    try {
      const result = await mockGenerate(retryCount);
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id !== newTaskId) return t;
          if (result.success) {
            return { ...t, status: "success" as const, images: result.images ?? [] };
          }
          return { ...t, status: "error" as const, errorMessage: result.errorMessage };
        })
      );
    } catch {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === newTaskId ? { ...t, status: "error" as const, errorMessage: "网络异常，请稍后重试" } : t
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

  // ── 点击成功图片打开详情视图 ──
  const handleImageClick = useCallback((imageUrl: string, task: GenerateTask, imageIndex: number) => {
    setDetailImageUrl(imageUrl);
    setDetailTask(task);
    setDetailImageIndex(imageIndex);
    setDetailOpen(true);
  }, []);

  // ── 详情视图 Generate 回调 ──
  const handleDetailGenerate = useCallback((payload: ComposerPayload) => {
    setDetailOpen(false);
    setDetailTask(null);
    const newTaskId = `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const hasRef = payload.referenceImages && payload.referenceImages.length > 0;
    const newTask: GenerateTask = {
      id: newTaskId,
      prompt: payload.editPrompt,
      status: "submitting",
      modelId: payload.model.id,
      modelName: payload.model.name,
      modelImage: payload.model.image,
      ratio: payload.ratio,
      resolution: payload.resolution,
      styleName: payload.styleName || undefined,
      styleId: payload.styleId,
      generationMode: hasRef ? "image-to-image" : "text-to-image",
      similarity: payload.similarity,
      count: payload.imageCount ?? 1,
      images: [],
      referenceImages: hasRef ? [...payload.referenceImages] : undefined,
      createdAt: Date.now(),
      requestPayload: {
        model_id: payload.model.id,
        prompt: payload.editPrompt,
        count: payload.imageCount ?? 1,
        ratio: payload.ratio,
        resolution: payload.resolution,
        style_id: payload.styleId,
        similarity: payload.similarity,
        reference_images: hasRef ? [...payload.referenceImages] : [],
      },
    };
    setHasEnteredCreationMode(true);
    setTasks((prev) => [newTask, ...prev]);
    setTasks((prev) => prev.map((t) => (t.id === newTaskId ? { ...t, status: "generating" as const } : t)));
    mockGenerate(payload.imageCount ?? 1).then((result) => {
      setTasks((prev) => prev.map((t) => {
        if (t.id !== newTaskId) return t;
        if (result.success) return { ...t, status: "success" as const, images: result.images ?? [] };
        return { ...t, status: "error" as const, errorMessage: result.errorMessage };
      }));
    }).catch(() => {
      setTasks((prev) => prev.map((t) => t.id === newTaskId ? { ...t, status: "error" as const, errorMessage: "网络异常，请稍后重试" } : t));
    });
  }, []);

  if (!selectedModel) return null;

  const totalCost = selectedModel.price + extraCost;

  // 资产管理视图
  if (viewMode === "assets") {
    return (
      <div className="flex h-screen w-full overflow-hidden bg-workspace-panel">
        <AssetGalleryView
          tasks={tasks}
          onBack={() => setViewMode("gen")}
          onImageClick={handleImageClick}
          onGoToGallery={() => {
            setViewMode("gen");
            setHasEnteredCreationMode(false);
            setShowInspirationOnly(false);
            setTimeout(() => {
              // 滚动容器回到顶部，确保从标题开始展示
              if (mainScrollRef.current) {
                mainScrollRef.current.scrollTo({ top: 0, behavior: "smooth" });
              }
            }, 100);
          }}
          onDeleteImage={(taskId, imageIndex) => {
            setTasks((prev) => prev
              .map((t) => {
                if (t.id !== taskId) return t;
                const newImages = t.images.filter((_, i) => i !== imageIndex);
                return { ...t, images: newImages };
              })
              .filter((t) => !(t.status === "success" && t.images.length === 0))
            );
          }}
          onDeleteTask={(taskId) => {
            setTasks((prev) => prev.filter((t) => t.id !== taskId));
          }}
        />
        {/* 大图详情视图（复用） */}
        {detailOpen && detailTask && (
          <ImageDetailWorkspace
            initialImageUrl={detailImageUrl}
            initialImageIndex={detailImageIndex}
            initialTask={detailTask}
            tasks={tasks}
            models={models}
            onGenerate={handleDetailGenerate}
            onInpaintGenerate={(payload: InpaintPayload, originTask: GenerateTask) => {
              setDetailOpen(false);
              setDetailTask(null);
              setViewMode("gen");
              const newTaskId = `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
              const newTask: GenerateTask = {
                id: newTaskId, prompt: payload.prompt, status: "submitting",
                modelId: originTask.modelId, modelName: originTask.modelName, modelImage: originTask.modelImage,
                ratio: originTask.ratio, resolution: originTask.resolution,
                styleName: originTask.styleName, styleId: originTask.styleId,
                generationMode: "image-to-image", similarity: originTask.similarity,
                count: 1, images: [],
                referenceImages: originTask.referenceImages ? [...originTask.referenceImages] : undefined,
                baseImage: payload.baseImageUrl, maskData: payload.maskDataUrl,
                createdAt: Date.now(),
                requestPayload: { ...originTask.requestPayload, prompt: payload.prompt, count: 1, generation_mode: "image-to-image", base_image: payload.baseImageUrl, mask_data: payload.maskDataUrl },
              };
              setHasEnteredCreationMode(true);
              setTasks((prev) => [newTask, ...prev]);
              setTasks((prev) => prev.map((t) => (t.id === newTaskId ? { ...t, status: "generating" as const } : t)));
              mockGenerate(1).then((result) => {
                setTasks((prev) => prev.map((t) => { if (t.id !== newTaskId) return t; if (result.success) return { ...t, status: "success" as const, images: result.images ?? [] }; return { ...t, status: "error" as const, errorMessage: result.errorMessage }; }));
              }).catch(() => {
                setTasks((prev) => prev.map((t) => t.id === newTaskId ? { ...t, status: "error" as const, errorMessage: "网络异常，请稍后重试" } : t));
              });
            }}
            onDeleteImage={(taskId, imageIndex) => {
              setTasks((prev) => prev.map((t) => {
                if (t.id !== taskId) return t;
                return { ...t, images: t.images.filter((_, i) => i !== imageIndex) };
              }));
            }}
            onClose={() => { setDetailOpen(false); setDetailTask(null); }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-workspace-panel">
      <SettingsSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        selectedModel={selectedModel}
        onModelChange={(model) => { setSelectedModel(model); setImageCount(1); setReferenceImages([]); }}
        models={models}
        providers={providers}
        onExtraCostChange={handleExtraCostChange}
        imageCount={imageCount}
        onImageCountChange={setImageCount}
        onRatioChange={setSidebarRatio}
        onResolutionChange={setSidebarResolution}
        onStyleChange={(id, name) => { setSidebarStyleId(id); setSidebarStyleName(name); }}
        onSimilarityChange={setSidebarSimilarity}
        referenceImages={referenceImages}
        onReferenceImagesChange={setReferenceImages}
      />

      <main ref={mainScrollRef} className="relative flex-1 overflow-y-auto bg-workspace-surface workspace-scroll">
        <div className="sticky top-0 z-50 flex items-center">
          <div className="flex-1 min-w-0">
            <TopNavBar onOpenAssets={() => setViewMode("assets")} />
          </div>
        </div>

        {/* ── 统一提示词输入区：单实例 HeroPromptBar + MobileParamBar ── */}
        {!detailOpen && (
          <div
            ref={promptContainerRef}
            className={cn(
              "sticky top-[41px] z-40 transition-shadow duration-200",
              isSticky
                ? "bg-workspace-panel/95 backdrop-blur-xl border-b border-workspace-border/60 shadow-sm"
                : "bg-transparent"
            )}
          >
            {/* 移动端/平板端 */}
            <div className="lg:hidden mx-3 my-2 rounded-2xl bg-muted/30 px-3 py-3 overflow-visible mobile-input-module">
              <HeroPromptBar
                prompt={prompt}
                onPromptChange={setPrompt}
                cost={totalCost}
                isSubmitDisabled={isSubmitting || isCooldown}
                onSubmit={handleSubmit}
                hasActiveTask={hasEnteredCreationMode || isSticky}
                promptInputRef={promptInputRef}
              />
              <div className="mt-2">
                <MobileParamBar
                  selectedModel={selectedModel}
                  models={models}
                  onModelChange={(model) => { setSelectedModel(model); setImageCount(1); setReferenceImages([]); }}
                  imageCount={imageCount}
                  onImageCountChange={setImageCount}
                  onRatioChange={setSidebarRatio}
                  onResolutionChange={setSidebarResolution}
                  onStyleChange={(id, name) => { setSidebarStyleId(id); setSidebarStyleName(name); }}
                  onSimilarityChange={setSidebarSimilarity}
                  referenceImages={referenceImages}
                  onReferenceImagesChange={setReferenceImages}
                />
              </div>
            </div>
            {/* PC 端 */}
            <div className="hidden lg:block">
              <HeroPromptBar
                prompt={prompt}
                onPromptChange={setPrompt}
                cost={totalCost}
                isSubmitDisabled={isSubmitting || isCooldown}
                onSubmit={handleSubmit}
                hasActiveTask={hasEnteredCreationMode || isSticky}
                promptInputRef={promptInputRef}
              />
            </div>
          </div>
        )}

        {/* 空状态：创作模式下任务全删且未点击去灵感显影室 */}
        {tasks.length === 0 && hasEnteredCreationMode && !showInspirationOnly && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-lg font-semibold text-foreground">哎呀，您的作品为空</p>
            <p className="mt-2 text-sm text-muted-foreground">快去灵感显影室看看吧</p>
            <button
              onClick={() => setShowInspirationOnly(true)}
              className="mt-5 rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              去灵感显影室
            </button>
          </div>
        )}

        {/* 点击去灵感显影室后：只展示素材库 */}
        {tasks.length === 0 && hasEnteredCreationMode && showInspirationOnly && (
          <div id="inspiration-gallery" className="mt-8 px-4 pb-8 sm:px-6 lg:px-8">
            <h2 className="mb-5 mt-2 text-lg font-semibold text-workspace-panel-foreground">
              🎨 灵感显影室
            </h2>
            <MasonryGallery onUsePrompt={setPrompt} />
          </div>
        )}

        {/* 有任务时：正常展示任务列表 */}
        {tasks.length > 0 && (
          <TaskList
            tasks={tasks}
            onRetry={handleRetry}
            onApplyPrompt={handleApplyPrompt}
            onApplyReferenceImage={handleApplyReferenceImage}
            onEditImage={(url, task) => { setEditingImageUrl(url); setEditingTask(task); setEditModalOpen(true); }}
            onInpaint={(url) => { setInpaintImageUrl(url); setInpaintModalOpen(true); }}
            onImageClick={handleImageClick}
            onDeleteImage={(taskId, imageIndex) => {
              setTasks((prev) => prev
                .map((t) => {
                  if (t.id !== taskId) return t;
                  return { ...t, images: t.images.filter((_, i) => i !== imageIndex) };
                })
                .filter((t) => !(t.status === "success" && t.images.length === 0))
              );
            }}
            onDeleteTask={(taskId) => {
              setTasks((prev) => prev.filter((t) => t.id !== taskId));
            }}
          />
        )}

        {/* 未进入创作模式时：展示灵感画廊 */}
        {!hasEnteredCreationMode && (
          <div id="inspiration-gallery" className="mt-8 px-4 pb-8 sm:px-6 lg:px-8">
            <h2 className="mb-5 mt-2 text-lg font-semibold text-workspace-panel-foreground">
              🎨 灵感显影室
            </h2>
            <MasonryGallery onUsePrompt={setPrompt} />
          </div>
        )}
      </main>

      <BackToTopButton scrollContainerRef={mainScrollRef} />

      <EditImageModal
        open={editModalOpen}
        imageUrl={editingImageUrl}
        task={editingTask}
        models={models}
        onClose={() => { setEditModalOpen(false); setEditingTask(null); }}
        onGenerate={(payload) => {
          // TODO: 接入真实编辑图像接口，目前创建占位任务
          const newTaskId = `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
          const newTask: GenerateTask = {
            id: newTaskId,
            prompt: payload.editPrompt,
            status: "submitting",
            modelId: payload.modelId,
            modelName: payload.modelName,
            modelImage: payload.modelImage,
            ratio: payload.ratio,
            resolution: payload.resolution,
            styleName: payload.styleName,
            styleId: payload.styleId,
            generationMode: payload.generationMode,
            similarity: payload.similarity,
            count: 1,
            images: [],
            referenceImages: payload.referenceImages,
            createdAt: Date.now(),
            requestPayload: payload as unknown as Record<string, unknown>,
          };
          setHasEnteredCreationMode(true);
          setTasks((prev) => [newTask, ...prev]);
          // mock generate
          setTasks((prev) => prev.map((t) => (t.id === newTaskId ? { ...t, status: "generating" as const } : t)));
          mockGenerate(1).then((result) => {
            setTasks((prev) => prev.map((t) => {
              if (t.id !== newTaskId) return t;
              if (result.success) return { ...t, status: "success" as const, images: result.images ?? [] };
              return { ...t, status: "error" as const, errorMessage: result.errorMessage };
            }));
          }).catch(() => {
            setTasks((prev) => prev.map((t) => t.id === newTaskId ? { ...t, status: "error" as const, errorMessage: "网络异常，请稍后重试" } : t));
          });
        }}
      />

      <ImageInpaintModal
        open={inpaintModalOpen}
        imageUrl={inpaintImageUrl}
        onClose={() => { setInpaintModalOpen(false); setInpaintImageUrl(""); }}
        onGenerate={(payload: InpaintPayload) => {
          // 校验蒙版
          if (!payload.maskDataUrl) {
            toast({ title: "请先涂抹需要修改的区域", variant: "destructive" });
            return;
          }
          setInpaintModalOpen(false);
          setInpaintImageUrl("");

          const newTaskId = `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
          const taskModel = selectedModel!;
          const taskRatio = sidebarRatio || taskModel.ratio?.[0] || "1:1";
          const taskResolution = sidebarResolution || taskModel.resolution?.[0]?.resolution || "";

          const newTask: GenerateTask = {
            id: newTaskId,
            prompt: payload.prompt,
            status: "submitting",
            modelId: taskModel.id,
            modelName: taskModel.name,
            modelImage: taskModel.image,
            ratio: taskRatio,
            resolution: taskResolution,
            styleName: sidebarStyleName || undefined,
            styleId: sidebarStyleId,
            generationMode: "image-to-image",
            similarity: sidebarSimilarity,
            count: 1,
            images: [],
            baseImage: payload.baseImageUrl,
            maskData: payload.maskDataUrl,
            createdAt: Date.now(),
            requestPayload: {
              model_id: taskModel.id,
              prompt: payload.prompt,
              count: 1,
              ratio: taskRatio,
              resolution: taskResolution,
              style_id: sidebarStyleId,
              generation_mode: "image-to-image",
              similarity: sidebarSimilarity,
              base_image: payload.baseImageUrl,
              mask_data: payload.maskDataUrl,
            },
          };

          setHasEnteredCreationMode(true);
          setTasks((prev) => [newTask, ...prev]);
          setTasks((prev) => prev.map((t) => (t.id === newTaskId ? { ...t, status: "generating" as const } : t)));

          mockGenerate(1).then((result) => {
            setTasks((prev) => prev.map((t) => {
              if (t.id !== newTaskId) return t;
              if (result.success) return { ...t, status: "success" as const, images: result.images ?? [] };
              return { ...t, status: "error" as const, errorMessage: result.errorMessage };
            }));
          }).catch(() => {
            setTasks((prev) => prev.map((t) => t.id === newTaskId ? { ...t, status: "error" as const, errorMessage: "网络异常，请稍后重试" } : t));
          });
        }}
      />

      {/* 大图详情视图 */}
      {detailOpen && detailTask && (
        <ImageDetailWorkspace
           initialImageUrl={detailImageUrl}
           initialImageIndex={detailImageIndex}
           initialTask={detailTask}
          tasks={tasks}
          models={models}
          onGenerate={handleDetailGenerate}
          onInpaintGenerate={(payload: InpaintPayload, originTask: GenerateTask) => {
            // Close detail view first
            setDetailOpen(false);
            setDetailTask(null);

            const newTaskId = `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

            const newTask: GenerateTask = {
              id: newTaskId,
              prompt: payload.prompt,
              status: "submitting",
              modelId: originTask.modelId,
              modelName: originTask.modelName,
              modelImage: originTask.modelImage,
              ratio: originTask.ratio,
              resolution: originTask.resolution,
              styleName: originTask.styleName,
              styleId: originTask.styleId,
              generationMode: "image-to-image",
              similarity: originTask.similarity,
              count: 1,
              images: [],
              referenceImages: originTask.referenceImages ? [...originTask.referenceImages] : undefined,
              baseImage: payload.baseImageUrl,
              maskData: payload.maskDataUrl,
              createdAt: Date.now(),
              requestPayload: {
                ...originTask.requestPayload,
                prompt: payload.prompt,
                count: 1,
                generation_mode: "image-to-image",
                base_image: payload.baseImageUrl,
                mask_data: payload.maskDataUrl,
              },
            };

            setHasEnteredCreationMode(true);
            setTasks((prev) => [newTask, ...prev]);
            setTasks((prev) => prev.map((t) => (t.id === newTaskId ? { ...t, status: "generating" as const } : t)));

            mockGenerate(1).then((result) => {
              setTasks((prev) => prev.map((t) => {
                if (t.id !== newTaskId) return t;
                if (result.success) return { ...t, status: "success" as const, images: result.images ?? [] };
                return { ...t, status: "error" as const, errorMessage: result.errorMessage };
              }));
            }).catch(() => {
              setTasks((prev) => prev.map((t) => t.id === newTaskId ? { ...t, status: "error" as const, errorMessage: "网络异常，请稍后重试" } : t));
            });
          }}
          onDeleteImage={(taskId, imageIndex) => {
            setTasks((prev) => prev.map((t) => {
              if (t.id !== taskId) return t;
              return { ...t, images: t.images.filter((_, i) => i !== imageIndex) };
            }));
          }}
          onClose={() => { setDetailOpen(false); setDetailTask(null); }}
        />
      )}
    </div>
  );
};

export default ImageGenDarkPage;
