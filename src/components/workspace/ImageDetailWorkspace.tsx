import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, MoreHorizontal, Copy, Download, RefreshCw, Trash2 } from "lucide-react";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import ConfirmDialog from "./ConfirmDialog";
import { toast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import ImageLightbox from "./ImageLightbox";
import ImageDetailRightPanel from "./ImageDetailRightPanel";
import ImageDetailMobileActions from "./ImageDetailMobileActions";
import MidjourneyActionBar from "./MidjourneyActionBar";
import ImageHistoryRail from "./ImageHistoryRail";
import ImageEditComposer from "./ImageEditComposer";
import TaskAttributePanel from "./TaskAttributePanel";
import type { HistoryImageItem } from "./ImageHistoryRail";
import type { ComposerPayload, ImageEditComposerHandle } from "./ImageEditComposer";
import type { InpaintPayload } from "./ImageInpaintModal";
import type { GenerateTask, MjAction } from "@/types/task";
import type { ModelConfig } from "@/config/modelConfig";

interface ImageDetailWorkspaceProps {
  /** The image URL that was clicked to open this view */
  initialImageUrl: string;
  /** The index of the clicked image within its task */
  initialImageIndex: number;
  /** The task that owns the clicked image */
  initialTask: GenerateTask;
  /** All tasks (for history rail) */
  tasks: GenerateTask[];
  /** All available models */
  models: ModelConfig[];
  /** Called when Generate is clicked */
  onGenerate: (payload: ComposerPayload) => void;
  /** Called when inpaint Generate is clicked from detail; parent creates task & closes detail */
  onInpaintGenerate?: (payload: InpaintPayload, task: GenerateTask) => void;
  /** Called to delete current image */
  onDeleteImage?: (taskId: string, imageIndex: number) => void;
  /** Called for Midjourney actions */
  onMjAction?: (task: GenerateTask, action: MjAction) => void;
  /** Called to close this view */
  onClose: () => void;
}

/** Summarize prompt into a short title (12-20 chars) */
function summarizePrompt(prompt: string): string {
  // Take first meaningful segment, strip punctuation, limit length
  const clean = prompt
    .replace(/[，。！？、；：""''（）【】《》\n\r]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const words = clean.split(" ").filter(Boolean);
  let result = "";
  for (const w of words) {
    if ((result + w).length > 20) break;
    result += (result ? " " : "") + w;
  }
  return result || clean.slice(0, 20);
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

const ImageDetailWorkspace = ({
  initialImageUrl,
  initialImageIndex,
  initialTask,
  tasks,
  models,
  onGenerate,
  onInpaintGenerate,
  onDeleteImage,
  onMjAction,
  onClose,
}: ImageDetailWorkspaceProps) => {
  const [selectedImageUrl, setSelectedImageUrl] = useState(initialImageUrl);
  const [selectedTask, setSelectedTask] = useState(initialTask);
  const [selectedImageIndex, setSelectedImageIndex] = useState(initialImageIndex);
  const composerRef = useRef<ImageEditComposerHandle>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [displayUrl, setDisplayUrl] = useState(initialImageUrl);
  const [topMoreOpen, setTopMoreOpen] = useState(false);
  const [topDeleteOpen, setTopDeleteOpen] = useState(false);
  const isMobile = useIsMobile();

  // Keep old image visible until new one loads to prevent flicker
  useEffect(() => {
    if (selectedImageUrl === displayUrl) return;
    const img = new Image();
    img.src = selectedImageUrl;
    if (img.complete) {
      setDisplayUrl(selectedImageUrl);
    } else {
      img.onload = () => setDisplayUrl(selectedImageUrl);
      img.onerror = () => setDisplayUrl(selectedImageUrl);
    }
  }, [selectedImageUrl, displayUrl]);

  const handleApplyPrompt = useCallback((prompt: string) => {
    composerRef.current?.applyPrompt(prompt);
  }, []);

  const handleOpenInpaint = useCallback(() => {
    composerRef.current?.openInpaint();
  }, []);

  // Close lightbox when selected image changes
  useEffect(() => {
    setLightboxOpen(false);
  }, [selectedImageUrl]);

  // When initial props change (shouldn't normally), sync
  useEffect(() => {
    setSelectedImageUrl(initialImageUrl);
    setSelectedTask(initialTask);
    setSelectedImageIndex(initialImageIndex);
  }, [initialImageUrl, initialTask, initialImageIndex]);

  const handleHistorySelect = useCallback((item: HistoryImageItem) => {
    setSelectedImageUrl(item.imageUrl);
    setSelectedTask(item.task);
    setSelectedImageIndex(item.imageIndex);
  }, []);

  // Build flat history list (same logic as ImageHistoryRail)
  const allImages = useMemo<HistoryImageItem[]>(() => {
    const items: HistoryImageItem[] = [];
    for (const task of tasks) {
      if (task.status === "success" && task.images.length > 0) {
        task.images.forEach((url, idx) => {
          items.push({ imageUrl: url, task, imageIndex: idx });
        });
      }
    }
    return items;
  }, [tasks]);

  // Preload adjacent images for instant switching
  useEffect(() => {
    const idx = allImages.findIndex(
      (item) => item.imageUrl === selectedImageUrl && item.task.id === selectedTask.id && item.imageIndex === selectedImageIndex
    );
    const toPreload: string[] = [];
    if (idx > 0) toPreload.push(allImages[idx - 1].imageUrl);
    if (idx < allImages.length - 1) toPreload.push(allImages[idx + 1].imageUrl);
    toPreload.forEach((url) => {
      const img = new Image();
      img.src = url;
    });
  }, [allImages, selectedImageUrl, selectedTask.id, selectedImageIndex]);

  // Safety net: if all images are gone after deletion, close the detail view
  useEffect(() => {
    if (allImages.length === 0) {
      onClose();
    }
  }, [allImages.length, onClose]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.repeat) return;

      const isArrowPrev = e.key === "ArrowLeft" || e.key === "ArrowUp";
      const isArrowNext = e.key === "ArrowRight" || e.key === "ArrowDown";
      if (!isArrowPrev && !isArrowNext) return;

      // Skip if focus is in an input element
      const el = document.activeElement;
      if (el) {
        const tag = el.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
        if ((el as HTMLElement).contentEditable === "true") return;
      }

      // Skip if any Radix popover/dialog/select is open
      if (document.querySelector("[data-state=\"open\"]")) return;

      const currentIdx = allImages.findIndex(
        (item) => item.imageUrl === selectedImageUrl && item.task.id === selectedTask.id && item.imageIndex === selectedImageIndex
      );
      if (currentIdx === -1) return;

      const nextIdx = isArrowNext ? currentIdx + 1 : currentIdx - 1;
      if (nextIdx < 0 || nextIdx >= allImages.length) return;

      e.preventDefault();
      handleHistorySelect(allImages[nextIdx]);
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [allImages, selectedImageUrl, selectedTask.id, selectedImageIndex, handleHistorySelect]);

  // Current index & boundary flags for arrow buttons
  const currentIdx = useMemo(() =>
    allImages.findIndex(
      (item) => item.imageUrl === selectedImageUrl && item.task.id === selectedTask.id && item.imageIndex === selectedImageIndex
    ), [allImages, selectedImageUrl, selectedTask.id, selectedImageIndex]);
  const hasPrev = currentIdx > 0;
  const hasNext = currentIdx >= 0 && currentIdx < allImages.length - 1;

  const handlePrev = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasPrev) handleHistorySelect(allImages[currentIdx - 1]);
  }, [hasPrev, currentIdx, allImages, handleHistorySelect]);

  const handleNext = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasNext) handleHistorySelect(allImages[currentIdx + 1]);
  }, [hasNext, currentIdx, allImages, handleHistorySelect]);

  const filePrefix = useMemo(() => {
    const date = formatDate(selectedTask.createdAt);
    return `Rita_${date}_作品`;
  }, [selectedTask]);

  const fileSuffix = useMemo(() => {
    return summarizePrompt(selectedTask.prompt);
  }, [selectedTask]);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-workspace-panel">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-workspace-border shrink-0">
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-workspace-chip transition-colors cursor-pointer shrink-0"
        >
          <ArrowLeft className="h-4 w-4 text-workspace-surface-foreground" />
        </button>
        <div className="flex items-center min-w-0 flex-1">
          <span className="text-sm font-medium text-workspace-surface-foreground whitespace-nowrap shrink-0">{filePrefix}</span>
          <span className="text-sm text-muted-foreground truncate ml-1.5">_{fileSuffix}</span>
        </div>
        {isMobile && (
          <button
            onClick={() => setTopMoreOpen(true)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-workspace-border bg-workspace-chip/50 text-workspace-surface-foreground hover:bg-workspace-chip transition-colors cursor-pointer shrink-0 ml-2"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Mobile top-bar more drawer */}
      {isMobile && (
        <Drawer open={topMoreOpen} onOpenChange={setTopMoreOpen}>
          <DrawerContent className="z-[200] pb-safe" overlayClassName="z-[200]">
            <div className="px-4 pb-6 pt-2 flex flex-col gap-1">
              <button
                onClick={async () => {
                  setTopMoreOpen(false);
                  if (!selectedImageUrl) return;
                  try {
                    const res = await fetch(selectedImageUrl);
                    const blob = await res.blob();
                    await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
                    toast({ title: "已复制到剪贴板" });
                  } catch { toast({ title: "复制失败", variant: "destructive" }); }
                }}
                className="flex items-center gap-3 w-full rounded-xl px-4 py-3 text-sm font-medium text-foreground hover:bg-accent transition-colors active:scale-[0.98]"
              >
                <Copy className="h-4 w-4" /> 复制图片
              </button>
              <button
                onClick={() => {
                  setTopMoreOpen(false);
                  if (!selectedImageUrl) return;
                  const a = document.createElement("a");
                  a.href = selectedImageUrl;
                  a.download = `image_${selectedTask.id}_${selectedImageIndex}.png`;
                  a.click();
                }}
                className="flex items-center gap-3 w-full rounded-xl px-4 py-3 text-sm font-medium text-foreground hover:bg-accent transition-colors active:scale-[0.98]"
              >
                <Download className="h-4 w-4" /> 下载图片
              </button>
              {!selectedTask.isMj && (
                <button
                  onClick={() => {
                    setTopMoreOpen(false);
                    const model = models.find(m => m.id === selectedTask.modelId) || models[0];
                    onGenerate({
                      editPrompt: selectedTask.prompt,
                      model,
                      ratio: selectedTask.ratio || "1:1",
                      resolution: selectedTask.resolution || "",
                      styleId: selectedTask.styleId ?? null,
                      styleName: selectedTask.styleName || "",
                      similarity: selectedTask.similarity ?? 50,
                      referenceImages: selectedTask.referenceImages || [],
                      imageCount: 1,
                    });
                  }}
                  className="flex items-center gap-3 w-full rounded-xl px-4 py-3 text-sm font-medium text-foreground hover:bg-accent transition-colors active:scale-[0.98]"
                >
                  <RefreshCw className="h-4 w-4" /> 重新生成
                </button>
              )}
              {onDeleteImage && (
                <button
                  onClick={() => { setTopMoreOpen(false); setTimeout(() => setTopDeleteOpen(true), 150); }}
                  className="flex items-center gap-3 w-full rounded-xl px-4 py-3 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors active:scale-[0.98]"
                >
                  <Trash2 className="h-4 w-4" /> 删除图片
                </button>
              )}
            </div>
          </DrawerContent>
        </Drawer>
      )}

      {/* Mobile top-bar delete confirm */}
      {isMobile && (
        <ConfirmDialog
          open={topDeleteOpen}
          onOpenChange={setTopDeleteOpen}
          onConfirm={() => {
            if (onDeleteImage) {
              onDeleteImage(selectedTask.id, selectedImageIndex);
              const remaining = allImages.filter(
                (item) => !(item.task.id === selectedTask.id && item.imageIndex === selectedImageIndex)
              );
              if (remaining.length === 0) {
                onClose();
              } else {
                const nextIdx = Math.min(currentIdx, remaining.length - 1);
                handleHistorySelect(remaining[nextIdx]);
              }
            }
            setTopDeleteOpen(false);
            toast({ title: "图片已删除" });
          }}
        />
      )}

      {/* Main content area */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Center: big image + right panel */}
        <div className="flex flex-1 min-w-0 overflow-hidden">
          {/* Big image */}
          <div className="relative flex-1 flex items-center justify-center p-6 overflow-auto min-w-0">
            <img
              src={displayUrl}
              alt="大图预览"
              className="max-w-full max-h-full object-contain rounded-lg cursor-zoom-in active:scale-[0.98] transition-transform"
              onClick={() => setLightboxOpen(true)}
            />
            {/* Prev arrow */}
            <button
              onClick={handlePrev}
              disabled={!hasPrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-all hover:bg-black/60 active:scale-95 disabled:opacity-0 disabled:pointer-events-none cursor-pointer"
              aria-label="上一张"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            {/* Next arrow */}
            <button
              onClick={handleNext}
              disabled={!hasNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-all hover:bg-black/60 active:scale-95 disabled:opacity-0 disabled:pointer-events-none cursor-pointer"
              aria-label="下一张"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* Right attributes panel */}
          <div className="w-[280px] shrink-0 border-l border-workspace-border p-4 overflow-y-auto workspace-scroll hidden lg:block">
            <ImageDetailRightPanel
              task={selectedTask}
              imageUrl={selectedImageUrl}
              isMj={!!selectedTask.isMj}
              onApplyPrompt={handleApplyPrompt}
              onOpenInpaint={onInpaintGenerate ? handleOpenInpaint : undefined}
              onRegenerate={!selectedTask.isMj ? () => {
                const model = models.find(m => m.id === selectedTask.modelId) || models[0];
                onGenerate({
                  editPrompt: selectedTask.prompt,
                  model,
                  ratio: selectedTask.ratio || "1:1",
                  resolution: selectedTask.resolution || "",
                  styleId: selectedTask.styleId ?? null,
                  styleName: selectedTask.styleName || "",
                  similarity: selectedTask.similarity ?? 50,
                  referenceImages: selectedTask.referenceImages || [],
                  imageCount: 1,
                });
              } : undefined}
              onDelete={onDeleteImage ? () => {
                onDeleteImage(selectedTask.id, selectedImageIndex);
                const remaining = allImages.filter(
                  (item) => !(item.task.id === selectedTask.id && item.imageIndex === selectedImageIndex)
                );
                if (remaining.length === 0) {
                  onClose();
                } else {
                  const nextIdx = Math.min(currentIdx, remaining.length - 1);
                  handleHistorySelect(remaining[nextIdx]);
                }
              } : undefined}
              onMjAction={selectedTask.isMj && onMjAction ? (action) => { onMjAction(selectedTask, action); onClose(); } : undefined}
            />
          </div>
        </div>

        {/* Far right: history rail */}
        <div className="w-[72px] shrink-0 border-l border-workspace-border overflow-y-auto workspace-scroll hidden md:flex flex-col items-center py-2">
          <ImageHistoryRail
            tasks={tasks}
            selectedImageUrl={selectedImageUrl}
            onSelect={handleHistorySelect}
          />
        </div>
      </div>


      {/* Mobile MJ actions displayed directly */}
      {isMobile && selectedTask.isMj && selectedTask.mjStage && onMjAction && (
        <div className="shrink-0 lg:hidden border-t border-workspace-border/40 px-4 py-2">
          <MidjourneyActionBar
            stage={selectedTask.mjStage}
            onAction={(action) => { onMjAction(selectedTask, action); onClose(); }}
          />
        </div>
      )}

      {/* Mobile: model attributes only (no prompt) */}
      {isMobile && (
        <div className="shrink-0 lg:hidden border-t border-workspace-border/40 px-4 py-3">
          <TaskAttributePanel task={selectedTask} hidePrompt />
        </div>
      )}


      {/* Bottom composer */}

      {/* Fullscreen lightbox */}
      {lightboxOpen && (
        <ImageLightbox src={selectedImageUrl} onClose={() => setLightboxOpen(false)} />
      )}

      {!selectedTask.isMj && (
        <ImageEditComposer
          ref={composerRef}
          key={`${selectedTask.id}-${selectedImageIndex}`}
          task={selectedTask}
          currentImageUrl={selectedImageUrl}
          models={models}
          onGenerate={onGenerate}
          onInpaintGenerate={onInpaintGenerate ? (payload, task) => {
            onInpaintGenerate(payload, task);
          } : undefined}
        />
      )}
    </div>
  );
};

export default ImageDetailWorkspace;
