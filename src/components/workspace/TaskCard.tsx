import { useState, useRef, useEffect, useCallback } from "react";
import { RotateCw, AlertCircle, ChevronDown, ChevronUp, Copy, ArrowUp, Image as ImageIcon, Palette, Download, Paintbrush, PenLine } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import type { GenerateTask } from "@/types/task";

interface TaskCardProps {
  task: GenerateTask;
  onRetry?: (taskId: string) => void;
  onApplyPrompt?: (prompt: string) => void;
  onApplyReferenceImage?: (imageUrl: string) => void;
  onEditImage?: (imageUrl: string, task: GenerateTask) => void;
  onInpaint?: (imageUrl: string) => void;
}

const ratioToAspect = (ratio?: string): string => {
  const map: Record<string, string> = {
    "1:1": "1/1", "2:3": "2/3", "3:2": "3/2",
    "3:4": "3/4", "4:3": "4/3", "16:9": "16/9", "9:16": "9/16",
  };
  return map[ratio ?? ""] ?? "1/1";
};

const TaskCard = ({ task, onRetry, onApplyPrompt, onApplyReferenceImage, onEditImage, onInpaint }: TaskCardProps) => {
  const isGenerating = task.status === "generating" || task.status === "submitting";
  const isError = task.status === "error";
  const isSuccess = task.status === "success";
  const hasReferenceImages = (task.referenceImages?.length ?? 0) > 0;
  const aspectRatio = ratioToAspect(task.ratio);

  const [promptExpanded, setPromptExpanded] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);
  const promptRef = useRef<HTMLParagraphElement>(null);

  const checkTruncation = useCallback(() => {
    const el = promptRef.current;
    if (!el || promptExpanded) return;
    setIsTruncated(el.scrollHeight > el.clientHeight + 1);
  }, [promptExpanded]);

  useEffect(() => {
    checkTruncation();
    const el = promptRef.current;
    if (!el) return;
    const ro = new ResizeObserver(checkTruncation);
    ro.observe(el);
    return () => ro.disconnect();
  }, [checkTruncation, task.prompt]);

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(task.prompt);
      toast({ title: "复制成功" });
    } catch {
      toast({ title: "复制失败，请重试", variant: "destructive" });
    }
  };

  const handleApplyPrompt = () => {
    onApplyPrompt?.(task.prompt);
  };

  const handleCopyImage = async (url: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob }),
      ]);
      toast({ title: "参考图已复制" });
    } catch {
      toast({ title: "复制失败，浏览器可能不支持复制图片", variant: "destructive" });
    }
  };

  const handleApplyImage = (url: string) => {
    onApplyReferenceImage?.(url);
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
                <div className="w-full max-w-[340px] min-w-[240px]">
                  <Skeleton className="w-full rounded-lg bg-workspace-chip animate-pulse" style={{ aspectRatio }} />
                </div>
              )}
              {isSuccess && task.images.length === 1 && (
                <div className="relative group/img overflow-hidden rounded-lg w-full max-w-[340px] min-w-[240px]">
                  <img
                    src={task.images[0]}
                    alt="生成结果"
                    className="w-full object-cover"
                    style={{ aspectRatio }}
                    loading="lazy"
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
                        <TooltipContent side="top">局部重绘制</TooltipContent>
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
                  <Skeleton
                    key={i}
                    className="w-full rounded-lg bg-workspace-chip animate-pulse"
                    style={{ aspectRatio }}
                  />
                ))}
              {isSuccess &&
                task.images.map((src, i) => (
                  <div key={i} className="relative group/img overflow-hidden rounded-lg">
                    <img
                      src={src}
                      alt={`生成结果 ${i + 1}`}
                      className="w-full object-cover"
                      style={{ aspectRatio }}
                      loading="lazy"
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
                      </TooltipProvider>
                    </div>
                    {/* 底部右下角：局部重绘制 + 编辑图像 */}
                    <div className="absolute bottom-1.5 right-1.5 flex items-center gap-1 opacity-0 group-hover/img:opacity-100 transition-opacity duration-150">
                      <TooltipProvider delayDuration={200}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button onClick={() => onInpaint?.(src)} className="flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors cursor-pointer active:scale-90">
                              <Paintbrush className="h-3.5 w-3.5" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top">局部重绘制</TooltipContent>
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
                      </TooltipProvider>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* 右侧：属性区 — flex-[2] ≈ 40%, min 280px, max 340px */}
        <div className="w-full lg:flex-[2] lg:min-w-[280px] lg:max-w-[340px] shrink-0 flex flex-col">
          {/* 1) 提示词区（主信息） */}
          <div className="relative pb-[10px] mb-[10px] border-b border-workspace-border/40">
            <div className="relative">
              <p
                ref={promptRef}
                className={`text-sm text-workspace-surface-foreground leading-relaxed pr-16 ${
                  promptExpanded ? "" : "line-clamp-6"
                }`}
              >
                {task.prompt}
              </p>
              {/* 操作按钮 — 常驻显示 */}
              <div className="absolute top-0 right-0 flex items-center gap-1">
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={handleCopyPrompt}
                        className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground/70 hover:text-workspace-surface-foreground hover:bg-workspace-chip transition-all duration-150 cursor-pointer active:scale-95"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top">复制提示词</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={handleApplyPrompt}
                        className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground/70 hover:text-workspace-surface-foreground hover:bg-workspace-chip transition-all duration-150 cursor-pointer active:scale-95"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top">应用提示词</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
            {(isTruncated || promptExpanded) && (
              <button
                onClick={() => setPromptExpanded((v) => !v)}
                className="mt-1 flex items-center gap-1 self-start text-xs text-muted-foreground hover:text-workspace-surface-foreground transition-colors cursor-pointer"
              >
                {promptExpanded ? (
                  <>
                    <ChevronUp className="h-3 w-3" /> 收起
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3" /> 展开
                  </>
                )}
              </button>
            )}
          </div>

          {/* 2) 核心参数标签区：模型 → 比例 → 风格 → 分辨率 → 生成中 */}
          <div className="flex flex-wrap items-center gap-1.5">
            {task.modelName && (
              <span className="flex items-center gap-1.5 rounded-full bg-workspace-chip px-2.5 py-1 text-xs text-workspace-panel-foreground h-[26px]">
                <img src={task.modelImage} alt="" className="h-4 w-4 rounded-full object-cover" />
                {task.modelName}
              </span>
            )}
            {task.ratio && (
              <span className="flex items-center gap-1 rounded-full bg-workspace-chip px-2.5 py-1 text-xs text-workspace-panel-foreground h-[26px]">
                □ {task.ratio}
              </span>
            )}
            {task.styleName && (
              <span className="flex items-center gap-1 rounded-full bg-workspace-chip px-2.5 py-1 text-xs text-workspace-panel-foreground h-[26px]">
                <Palette className="h-3 w-3" />
                {task.styleName}
              </span>
            )}
            {task.resolution && (
              <span className="flex items-center gap-1 rounded-full bg-workspace-chip px-2.5 py-1 text-xs text-workspace-panel-foreground h-[26px]">
                {task.resolution}
              </span>
            )}
            {task.similarity != null && task.generationMode === "image-to-image" && (
              <span className="flex items-center gap-1 rounded-full bg-workspace-chip px-2.5 py-1 text-xs text-workspace-panel-foreground h-[26px]">
                相似度 {task.similarity}%
              </span>
            )}
            {isGenerating && (
              <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs text-primary h-[26px]">
                <RotateCw className="h-3 w-3 animate-spin" />
                生成中...
              </span>
            )}
          </div>

          {/* 3) 图生图标签 + 参考图缩略图 */}
          {hasReferenceImages && (
            <div className="flex flex-col gap-1.5 mt-3">
              <span className="inline-flex items-center gap-1 self-start rounded-full bg-workspace-chip px-2.5 py-1 text-xs text-workspace-panel-foreground h-[26px]">
                <ImageIcon className="h-3 w-3" />
                图生图
              </span>

              <div className="flex flex-wrap gap-1.5">
                {task.referenceImages!.map((src, i) => (
                  <div
                    key={i}
                    className="group/ref relative h-9 w-9 overflow-hidden rounded-lg border border-workspace-border/40 transition-all duration-150 hover:scale-[1.04] hover:border-workspace-border/80 hover:shadow-sm"
                  >
                    <img
                      src={src}
                      alt={`参考图 ${i + 1}`}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                    {/* hover 操作 — 增强遮罩+圆形按钮底色 */}
                    <div className="absolute inset-0 flex items-center justify-center gap-1.5 bg-black/65 opacity-0 group-hover/ref:opacity-100 transition-opacity duration-[140ms]">
                      <button
                        onClick={() => handleCopyImage(src)}
                        title="复制参考图"
                        className="flex h-5 w-5 items-center justify-center rounded-full bg-white/25 text-white hover:bg-white/40 transition-colors duration-150 cursor-pointer active:scale-90"
                      >
                        <Copy className="h-2.5 w-2.5" />
                      </button>
                      <button
                        onClick={() => handleApplyImage(src)}
                        title="应用为参考图"
                        className="flex h-5 w-5 items-center justify-center rounded-full bg-white/25 text-white hover:bg-white/40 transition-colors duration-150 cursor-pointer active:scale-90"
                      >
                        <ArrowUp className="h-2.5 w-2.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
