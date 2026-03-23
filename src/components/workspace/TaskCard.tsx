import { useState, useRef, useEffect, useCallback } from "react";
import { RotateCw, AlertCircle, Copy, Download, Paintbrush, PenLine, Loader2, Trash2 } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import TaskAttributePanel from "./TaskAttributePanel";
import MidjourneyActionBar from "./MidjourneyActionBar";
import ConfirmDialog from "./ConfirmDialog";
import type { GenerateTask, MjAction } from "@/types/task";

interface TaskCardProps {
  task: GenerateTask;
  onRetry?: (taskId: string) => void;
  onApplyPrompt?: (prompt: string) => void;
  onApplyReferenceImage?: (imageUrl: string) => void;
  onEditImage?: (imageUrl: string, task: GenerateTask) => void;
  onInpaint?: (imageUrl: string) => void;
  onImageClick?: (imageUrl: string, task: GenerateTask, imageIndex: number) => void;
  onDeleteImage?: (taskId: string, imageIndex: number) => void;
  onDeleteTask?: (taskId: string) => void;
  onMjAction?: (task: GenerateTask, action: MjAction, selectedImageIndex?: number) => void;
}

const ratioToAspect = (ratio?: string): string => {
  const map: Record<string, string> = {
    "1:1": "1/1", "2:3": "2/3", "3:2": "3/2",
    "3:4": "3/4", "4:3": "4/3", "16:9": "16/9", "9:16": "9/16",
  };
  return map[ratio ?? ""] ?? "1/1";
};

const TaskCard = ({ task, onRetry, onApplyPrompt, onApplyReferenceImage, onEditImage, onInpaint, onImageClick, onDeleteImage, onDeleteTask, onMjAction }: TaskCardProps) => {
  const isGenerating = task.status === "generating" || task.status === "submitting";
  const isError = task.status === "error";
  const isSuccess = task.status === "success";
  const aspectRatio = ratioToAspect(task.ratio);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<(() => void) | null>(null);

  const requestDelete = (action: () => void) => {
    setPendingDelete(() => action);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    pendingDelete?.();
    setConfirmOpen(false);
    setPendingDelete(null);
  };

  const handleCopyResultImage = async (url: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
      toast({ title: "图片已复制" });
    } catch {
      toast({ title: "复制失败，浏览器可能不支持复制图片", variant: "destructive" });
    }
  };

  const handleDownloadImage = async (url: string, index: number) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `generated-${task.id}-${index + 1}.png`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      toast({ title: "下载失败，请重试", variant: "destructive" });
    }
  };

  return (
    <div className="rounded-xl border border-workspace-border/60 bg-workspace-surface overflow-hidden">
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-5 p-4">

        {/* 左侧：图片区域 — flex-[3] ≈ 60% */}
        <div className="flex-[3] min-w-0">
          {/* ── 单图：count === 1 ── */}
          {task.count === 1 && (
            <>
              {isGenerating && (
                <div className="relative w-full max-w-[340px] min-w-[240px]">
                  <Skeleton className="w-full rounded-lg bg-workspace-chip animate-pulse" style={{ aspectRatio }} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none rounded-lg">
                    <Loader2 className="h-8 w-8 text-muted-foreground/50 animate-spin" />
                    <div className="absolute bottom-3 left-3 flex items-center gap-1 text-sm text-muted-foreground/70 font-medium">
                      <span>Generating...</span>
                      <span className="generating-arrow-1">›</span>
                      <span className="generating-arrow-2">›</span>
                      <span className="generating-arrow-3">›</span>
                    </div>
                  </div>
                </div>
              )}
              {isSuccess && task.images.length === 1 && (
                <div className="relative group/img overflow-hidden rounded-lg w-full max-w-[340px] min-w-[240px]">
                  <img
                    src={task.images[0]}
                    alt="生成结果"
                    className="w-full object-cover cursor-pointer"
                    style={{ aspectRatio }}
                    loading="lazy"
                    onClick={() => onImageClick?.(task.images[0], task, 0)}
                  />
                  <div className="absolute top-1.5 right-1.5 flex items-center gap-1 opacity-0 group-hover/img:opacity-100 transition-opacity duration-150">
                    <TooltipProvider delayDuration={200}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button onClick={() => handleCopyResultImage(task.images[0])} className="flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors cursor-pointer active:scale-90">
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">复制图片</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button onClick={() => handleDownloadImage(task.images[0], 0)} className="flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors cursor-pointer active:scale-90">
                            <Download className="h-3.5 w-3.5" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">下载图片</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button onClick={() => onRetry?.(task.id)} className="flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors cursor-pointer active:scale-90">
                            <RotateCw className="h-3.5 w-3.5" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">重新生成图片</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button onClick={() => requestDelete(() => onDeleteImage?.(task.id, 0))} className="flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white hover:bg-red-600/80 transition-colors cursor-pointer active:scale-90">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">删除图片</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  {/* 底部右下角：局部重绘 + 编辑图像 */}
                  <div className="absolute bottom-1.5 right-1.5 flex items-center gap-1 opacity-0 group-hover/img:opacity-100 transition-opacity duration-150">
                    <TooltipProvider delayDuration={200}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button onClick={() => onInpaint?.(task.images[0])} className="flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors cursor-pointer active:scale-90">
                            <Paintbrush className="h-3.5 w-3.5" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top">局部重绘</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button onClick={() => onEditImage?.(task.images[0], task)} className="flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors cursor-pointer active:scale-90">
                            <PenLine className="h-3.5 w-3.5" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top">编辑图像</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              )}
              {isError && (
                <div className="relative group/img w-full min-w-[240px] max-w-[340px] flex items-center justify-center rounded-lg bg-destructive/10 border border-destructive/20" style={{ aspectRatio }}>
                  <div className="flex flex-col items-center gap-2 text-center px-6 py-4">
                    <AlertCircle className="h-8 w-8 text-destructive/70" />
                    <p className="text-sm text-destructive/80">{task.errorMessage || "生成失败"}</p>
                  </div>
                   <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity duration-150 rounded-lg">
                    <TooltipProvider delayDuration={200}>
                       <Tooltip>
                        <TooltipTrigger asChild>
                          <button onClick={() => onRetry?.(task.id)} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/40 transition-colors cursor-pointer active:scale-90">
                            <RotateCw className="h-4 w-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">重新生成图片</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button onClick={() => requestDelete(() => onDeleteTask?.(task.id))} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white hover:bg-red-600/80 transition-colors cursor-pointer active:scale-90">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">删除图片</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── 多图：count > 1 — 统一响应式网格，列数 2~4 由容器宽度决定 ── */}
          {task.count > 1 && (
            <div
              className="w-full"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(max(120px, calc(25% - 6px)), 1fr))",
                gap: "0.5rem",
              }}
            >
              {isGenerating &&
                Array.from({ length: task.count }).map((_, i) => (
                  <div key={i} className="relative">
                    <Skeleton
                      className="w-full rounded-lg bg-workspace-chip animate-pulse"
                      style={{ aspectRatio }}
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none rounded-lg">
                      <Loader2 className="h-6 w-6 text-muted-foreground/50 animate-spin" />
                      <div className="absolute bottom-2 left-2 flex items-center gap-0.5 text-xs text-muted-foreground/70 font-medium">
                        <span>Generating...</span>
                        <span className="generating-arrow-1">›</span>
                        <span className="generating-arrow-2">›</span>
                        <span className="generating-arrow-3">›</span>
                      </div>
                    </div>
                  </div>
                ))}
              {isSuccess &&
                task.images.map((src, i) => (
                  <div key={i} className="relative group/img overflow-hidden rounded-lg">
                    <img
                      src={src}
                      alt={`生成结果 ${i + 1}`}
                      className="w-full object-cover cursor-pointer"
                      style={{ aspectRatio }}
                      loading="lazy"
                      onClick={() => onImageClick?.(src, task, i)}
                    />
                    <div className="absolute top-1.5 right-1.5 flex items-center gap-1 opacity-0 group-hover/img:opacity-100 transition-opacity duration-150">
                      <TooltipProvider delayDuration={200}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button onClick={() => handleCopyResultImage(src)} className="flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors cursor-pointer active:scale-90">
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom">复制图片</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button onClick={() => handleDownloadImage(src, i)} className="flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors cursor-pointer active:scale-90">
                              <Download className="h-3.5 w-3.5" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom">下载图片</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button onClick={() => onRetry?.(task.id)} className="flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors cursor-pointer active:scale-90">
                              <RotateCw className="h-3.5 w-3.5" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom">重新生成图片</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button onClick={() => requestDelete(() => onDeleteImage?.(task.id, i))} className="flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white hover:bg-red-600/80 transition-colors cursor-pointer active:scale-90">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom">删除图片</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    {/* 底部右下角：局部重绘 + 编辑图像 */}
                    <div className="absolute bottom-1.5 right-1.5 flex items-center gap-1 opacity-0 group-hover/img:opacity-100 transition-opacity duration-150">
                      <TooltipProvider delayDuration={200}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button onClick={() => onInpaint?.(src)} className="flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors cursor-pointer active:scale-90">
                              <Paintbrush className="h-3.5 w-3.5" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top">局部重绘</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button onClick={() => onEditImage?.(src, task)} className="flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors cursor-pointer active:scale-90">
                              <PenLine className="h-3.5 w-3.5" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top">编辑图像</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                ))}
              {isError &&
                Array.from({ length: task.count }).map((_, i) => (
                  <div
                    key={i}
                    className="relative group/img flex items-center justify-center rounded-lg bg-destructive/10 border border-destructive/20"
                    style={{ aspectRatio }}
                  >
                    <div className="flex flex-col items-center gap-1.5 text-center px-3 py-2">
                      <AlertCircle className="h-6 w-6 text-destructive/70" />
                      <p className="text-xs text-destructive/80">{task.errorMessage || "生成失败"}</p>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity duration-150 rounded-lg">
                      <TooltipProvider delayDuration={200}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button onClick={() => onRetry?.(task.id)} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/40 transition-colors cursor-pointer active:scale-90">
                              <RotateCw className="h-4 w-4" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom">重新生成图片</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button onClick={() => requestDelete(() => onDeleteTask?.(task.id))} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white hover:bg-red-600/80 transition-colors cursor-pointer active:scale-90">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom">删除图片</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Midjourney 操作按钮 */}
        {task.isMj && task.mjStage && isSuccess && (
          <MidjourneyActionBar
            stage={task.mjStage}
            onAction={(action) => onMjAction?.(task, action)}
            onDownload={() => {
              if (task.images.length > 0) {
                task.images.forEach((url, i) => handleDownloadImage(url, i));
              }
            }}
          />
        )}

        {/* 右侧：属性区 — flex-[2] ≈ 40%, min 280px, max 340px */}
        <div className="w-full lg:flex-[2] lg:min-w-[280px] lg:max-w-[340px] shrink-0 flex flex-col">
          <TaskAttributePanel
            task={task}
            onApplyPrompt={onApplyPrompt}
          />
        </div>
      </div>
      <ConfirmDialog open={confirmOpen} onOpenChange={setConfirmOpen} onConfirm={handleConfirmDelete} />
    </div>
  );
};

export default TaskCard;
