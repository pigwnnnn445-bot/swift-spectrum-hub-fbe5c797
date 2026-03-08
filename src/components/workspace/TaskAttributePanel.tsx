import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronDown, ChevronUp, Copy, ArrowUp, Image as ImageIcon, Palette, ZoomIn } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import type { GenerateTask } from "@/types/task";

interface TaskAttributePanelProps {
  task: GenerateTask;
  /** Optional: called when user clicks "apply prompt" */
  onApplyPrompt?: (prompt: string) => void;
}

const TaskAttributePanel = ({ task, onApplyPrompt }: TaskAttributePanelProps) => {
  const hasReferenceImages = (task.referenceImages?.length ?? 0) > 0;
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

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


  return (
    <div className="flex flex-col">
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

      {/* 2) 核心参数标签区：模型 → 比例 → 风格 → 分辨率 */}
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
                {/* hover 操作 */}
                <div className="absolute inset-0 flex items-center justify-center gap-1.5 bg-black/65 opacity-0 group-hover/ref:opacity-100 transition-opacity duration-[140ms]">
                  <button
                    onClick={() => handleCopyImage(src)}
                    title="复制参考图"
                    className="flex h-5 w-5 items-center justify-center rounded-full bg-white/25 text-white hover:bg-white/40 transition-colors duration-150 cursor-pointer active:scale-90"
                  >
                    <Copy className="h-2.5 w-2.5" />
                  </button>
                  <button
                    onClick={() => { setPreviewImage(src); setPreviewOpen(true); }}
                    title="查看大图"
                    className="flex h-5 w-5 items-center justify-center rounded-full bg-white/25 text-white hover:bg-white/40 transition-colors duration-150 cursor-pointer active:scale-90"
                  >
                    <ZoomIn className="h-2.5 w-2.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 参考图大图预览 */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] p-2 bg-black/95 border-none flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
          {previewImage && (
            <img src={previewImage} alt="参考图预览" className="max-w-full max-h-[85vh] object-contain rounded" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TaskAttributePanel;
