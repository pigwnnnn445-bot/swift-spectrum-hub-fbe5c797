import { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Menu } from "lucide-react";
import SettingsSidebar from "./SettingsSidebar";
import HeroPromptBar from "./HeroPromptBar";
import MasonryGallery from "./MasonryGallery";
import StickyPromptBar from "./StickyPromptBar";
import TopNavBar from "./TopNavBar";
import TaskList from "./TaskList";
import EditImageModal from "./EditImageModal";
import ImageInpaintModal from "./ImageInpaintModal";
import type { InpaintPayload } from "./ImageInpaintModal";
import { useTaskContext } from "@/contexts/TaskContext";
import { getEnabledImageLikes } from "@/config/modelConfig";
import type { ModelConfig } from "@/config/modelConfig";
import type { GenerateTask, GenerationMode } from "@/types/task";
import { toast } from "@/hooks/use-toast";

const ImageGenDarkPage = () => {
  const { tasks, models, providers, addTask, runGenerate } = useTaskContext();

  const [selectedModel, setSelectedModel] = useState<ModelConfig | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [extraCost, setExtraCost] = useState(0);
  const [imageCount, setImageCount] = useState(1);
  const [hasEnteredCreationMode, setHasEnteredCreationMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCooldown, setIsCooldown] = useState(false);
  const cooldownRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const promptInputRef = useRef<HTMLTextAreaElement | null>(null);
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [sidebarRatio, setSidebarRatio] = useState("");
  const [sidebarResolution, setSidebarResolution] = useState("");
  const [sidebarStyleId, setSidebarStyleId] = useState<number | null>(null);
  const [sidebarStyleName, setSidebarStyleName] = useState("");
  const [sidebarSimilarity, setSidebarSimilarity] = useState(50);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingImageUrl, setEditingImageUrl] = useState("");
  const [editingTask, setEditingTask] = useState<GenerateTask | null>(null);
  const [inpaintModalOpen, setInpaintModalOpen] = useState(false);
  const [inpaintImageUrl, setInpaintImageUrl] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearTimeout(cooldownRef.current);
    };
  }, []);

  // Set initial model when models load
  useEffect(() => {
    if (models.length > 0 && !selectedModel) {
      setSelectedModel(models[0]);
    }
  }, [models, selectedModel]);

  // Sync hasEnteredCreationMode with tasks
  useEffect(() => {
    if (tasks.length > 0) setHasEnteredCreationMode(true);
  }, [tasks]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    setShowStickyBar(scrollTop > 200);
  }, []);

  const handleExtraCostChange = useCallback((extra: number) => {
    setExtraCost(extra);
  }, []);

  const isGenerating = tasks.some((t) => t.status === "generating" || t.status === "submitting");

  const handleSubmit = useCallback(async () => {
    if (!selectedModel || !prompt.trim() || isSubmitting || isCooldown) return;

    setIsSubmitting(true);

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

    setHasEnteredCreationMode(true);
    setPrompt("");
    addTask(newTask);
    await runGenerate(taskId, count);
    setIsSubmitting(false);
  }, [selectedModel, prompt, isSubmitting, isCooldown, imageCount, referenceImages, sidebarRatio, sidebarResolution, sidebarStyleId, sidebarStyleName, sidebarSimilarity, addTask, runGenerate]);

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
      requestPayload: { ...originTask.requestPayload, count: retryCount },
    };

    setHasEnteredCreationMode(true);
    addTask(newTask);
    await runGenerate(newTaskId, retryCount);
  }, [tasks, addTask, runGenerate]);

  const handleApplyPrompt = useCallback((text: string) => {
    setPrompt(text);
    setTimeout(() => {
      const el = promptInputRef.current;
      if (el) { el.focus(); el.setSelectionRange(text.length, text.length); }
    }, 50);
  }, []);

  const handleApplyReferenceImage = useCallback((imageUrl: string) => {
    if (!selectedModel) return;
    const enabledLikes = getEnabledImageLikes(selectedModel);
    if (selectedModel.image_like_flg !== 1 || enabledLikes.length === 0) {
      toast({ title: "当前模型不支持上传参考图", variant: "destructive" });
      return;
    }
    if (referenceImages.includes(imageUrl)) {
      toast({ title: "请不要上传重复图片", variant: "destructive" });
      return;
    }
    const maxImages = 5;
    setReferenceImages((prev) => {
      if (prev.length >= maxImages) return [...prev.slice(1), imageUrl];
      return [...prev, imageUrl];
    });
    toast({ title: "参考图已添加" });
  }, [selectedModel, referenceImages]);

  const handleImageClick = useCallback((taskId: string, imageIndex: number) => {
    navigate(`/image/${taskId}/${imageIndex}`);
  }, [navigate]);

  if (!selectedModel) return null;

  const totalCost = selectedModel.price + extraCost;

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

        <TaskList
          tasks={tasks}
          onRetry={handleRetry}
          onApplyPrompt={handleApplyPrompt}
          onApplyReferenceImage={handleApplyReferenceImage}
          onEditImage={(url, task) => { setEditingImageUrl(url); setEditingTask(task); setEditModalOpen(true); }}
          onInpaint={(url) => { setInpaintImageUrl(url); setInpaintModalOpen(true); }}
          onImageClick={handleImageClick}
        />

        {!hasEnteredCreationMode && (
          <div className="px-4 pb-8 sm:px-6 lg:px-8">
            <h2 className="mb-5 mt-2 text-lg font-semibold text-workspace-panel-foreground">
              🎨 灵感显影室
            </h2>
            <MasonryGallery onUsePrompt={setPrompt} />
          </div>
        )}
      </main>

      <EditImageModal
        open={editModalOpen}
        imageUrl={editingImageUrl}
        task={editingTask}
        models={models}
        onClose={() => { setEditModalOpen(false); setEditingTask(null); }}
        onGenerate={(payload) => {
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
          addTask(newTask);
          runGenerate(newTaskId, 1);
        }}
      />

      <ImageInpaintModal
        open={inpaintModalOpen}
        imageUrl={inpaintImageUrl}
        onClose={() => { setInpaintModalOpen(false); setInpaintImageUrl(""); }}
        onGenerate={(payload: InpaintPayload) => {
          setInpaintModalOpen(false);
          toast({ title: "局部重绘已提交（占位）" });
          console.log("[Inpaint payload]", payload);
        }}
      />
    </div>
  );
};

export default ImageGenDarkPage;
