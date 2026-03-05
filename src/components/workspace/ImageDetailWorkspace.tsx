import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useTaskContext } from "@/contexts/TaskContext";
import ImageDetailRightPanel from "./ImageDetailRightPanel";
import ImageHistoryRail from "./ImageHistoryRail";
import ImageEditComposer from "./ImageEditComposer";
import type { HistoryImage } from "./ImageHistoryRail";
import type { GenerateTask, GenerationMode } from "@/types/task";

/** Summarize prompt into a short title for filename */
function summarizePrompt(prompt: string, maxLen = 16): string {
  // Remove special characters, keep Chinese/English/numbers/spaces
  const cleaned = prompt.replace(/[^\\u4e00-\\u9fa5a-zA-Z0-9\\s]/g, " ").trim();
  const words = cleaned.split(/\\s+/).filter(Boolean);
  let result = "";
  for (const w of words) {
    if (result.length + w.length > maxLen) break;
    result += (result ? " " : "") + w;
  }
  return result || cleaned.slice(0, maxLen);
}

/** Format createdAt timestamp to YYYYMMDD */
function formatDate(ts: number): string {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

const ImageDetailWorkspace = () => {
  const { taskId: paramTaskId, imageIndex: paramImageIndex } = useParams<{
    taskId: string;
    imageIndex: string;
  }>();
  const navigate = useNavigate();
  const { tasks, models, providers, addTask, runGenerate } = useTaskContext();

  // Current selected image state
  const [selectedTaskId, setSelectedTaskId] = useState(paramTaskId || "");
  const [selectedImageIndex, setSelectedImageIndex] = useState(Number(paramImageIndex) || 0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize from URL params
  useEffect(() => {
    if (paramTaskId) setSelectedTaskId(paramTaskId);
    if (paramImageIndex != null) setSelectedImageIndex(Number(paramImageIndex) || 0);
  }, [paramTaskId, paramImageIndex]);

  // Build history images list from all successful tasks
  const historyImages = useMemo<HistoryImage[]>(() => {
    const result: HistoryImage[] = [];
    for (const t of tasks) {
      if (t.status !== "success") continue;
      t.images.forEach((url, idx) => {
        result.push({ taskId: t.id, imageIndex: idx, imageUrl: url, task: t });
      });
    }
    return result;
  }, [tasks]);

  // Current task & image
  const currentTask = tasks.find((t) => t.id === selectedTaskId);
  const currentImageUrl = currentTask?.images?.[selectedImageIndex] || "";

  // File name
  const fileName = currentTask
    ? `Rita_${formatDate(currentTask.createdAt)}_作品_${summarizePrompt(currentTask.prompt)}`
    : "Rita_作品";

  // Handle history rail click
  const handleHistorySelect = useCallback((item: HistoryImage) => {
    setSelectedTaskId(item.taskId);
    setSelectedImageIndex(item.imageIndex);
  }, []);

  // Handle generate from composer
  const handleGenerate = useCallback(
    async (payload: {
      editPrompt: string;
      modelId: number;
      modelName: string;
      modelImage: string;
      ratio: string;
      resolution: string;
      styleName?: string;
      styleId?: number | null;
      similarity?: number;
      baseImageUrl: string;
    }) => {
      setIsSubmitting(true);
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
        generationMode: "image-to-image" as GenerationMode,
        similarity: payload.similarity,
        count: 1,
        images: [],
        referenceImages: [payload.baseImageUrl],
        createdAt: Date.now(),
        requestPayload: payload as unknown as Record<string, unknown>,
      };

      addTask(newTask);
      await runGenerate(newTaskId, 1);
      setIsSubmitting(false);

      // Navigate back to main page so user sees the new task
      navigate("/");
    },
    [addTask, runGenerate, navigate]
  );

  if (!currentTask || !currentImageUrl) {
    return (
      <div className="flex h-screen items-center justify-center bg-workspace-panel">
        <div className="text-center space-y-4">
          <p className="text-workspace-panel-foreground/60">未找到该图片</p>
          <button onClick={() => navigate("/")} className="text-primary hover:underline text-sm">
            返回首页
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-workspace-panel">
      {/* Top bar */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-workspace-border/40 bg-workspace-surface shrink-0">
        <button
          onClick={() => navigate("/")}
          className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-workspace-chip transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4 text-workspace-surface-foreground" />
        </button>
        <h1 className="text-sm font-medium text-workspace-surface-foreground truncate">{fileName}</h1>
      </header>

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Center: large image preview + bottom composer */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Image preview */}
          <div className="flex-1 flex items-center justify-center overflow-auto p-6 bg-workspace-panel">
            <img
              src={currentImageUrl}
              alt="预览"
              className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
            />
          </div>

          {/* Bottom composer */}
          <div className="shrink-0 border-t border-workspace-border/40 bg-workspace-surface p-4 overflow-y-auto max-h-[45vh] workspace-scroll">
            <ImageEditComposer
              task={currentTask}
              models={models}
              onGenerate={handleGenerate}
              isSubmitting={isSubmitting}
              baseImageUrl={currentImageUrl}
            />
          </div>
        </div>

        {/* Right panel: attributes */}
        <aside className="hidden lg:flex flex-col w-[280px] shrink-0 border-l border-workspace-border/40 bg-workspace-surface p-4 overflow-hidden">
          <h3 className="text-xs font-medium uppercase tracking-wider text-workspace-panel-foreground/50 mb-3">图片属性</h3>
          <div className="flex-1 overflow-hidden">
            <ImageDetailRightPanel task={currentTask} />
          </div>
        </aside>

        {/* History rail */}
        <aside className="hidden md:flex flex-col w-[84px] shrink-0 border-l border-workspace-border/40 bg-workspace-surface p-2 overflow-hidden">
          <h3 className="text-[10px] font-medium uppercase tracking-wider text-workspace-panel-foreground/50 mb-2 text-center">历史</h3>
          <div className="flex-1 overflow-hidden">
            <ImageHistoryRail
              images={historyImages}
              selectedTaskId={selectedTaskId}
              selectedImageIndex={selectedImageIndex}
              onSelect={handleHistorySelect}
            />
          </div>
        </aside>
      </div>
    </div>
  );
};

export default ImageDetailWorkspace;
