import { PaintBucket, Copy, Download, RefreshCw } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { toast } from "@/hooks/use-toast";
import TaskAttributePanel from "./TaskAttributePanel";
import type { GenerateTask } from "@/types/task";

interface ImageDetailRightPanelProps {
  task: GenerateTask;
  imageUrl?: string;
  onApplyPrompt?: (prompt: string) => void;
  onOpenInpaint?: () => void;
  onRegenerate?: () => void;
}

const ImageDetailRightPanel = ({ task, imageUrl, onApplyPrompt, onOpenInpaint, onRegenerate }: ImageDetailRightPanelProps) => {
  const handleCopyImage = async () => {
    if (!imageUrl) return;
    try {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
      toast({ title: "复制成功" });
    } catch {
      toast({ title: "复制失败，浏览器可能不支持复制图片", variant: "destructive" });
    }
  };

  const handleDownloadImage = async () => {
    if (!imageUrl) return;
    try {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `image_${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast({ title: "下载失败", variant: "destructive" });
    }
  };

  const btnClass =
    "flex h-9 w-9 items-center justify-center rounded-xl border border-workspace-border/60 bg-workspace-chip/40 text-workspace-surface-foreground hover:bg-workspace-chip transition-colors duration-150 cursor-pointer active:scale-[0.96]";

  return (
    <div className="overflow-y-auto workspace-scroll pr-1">
      <TaskAttributePanel task={task} onApplyPrompt={onApplyPrompt} />

      <div className="mt-3 pt-3 border-t border-workspace-border/40 flex flex-col gap-2">
        {onOpenInpaint && (
          <button
            onClick={onOpenInpaint}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-workspace-border/60 bg-workspace-chip/40 px-4 py-2.5 text-sm font-medium text-workspace-surface-foreground hover:bg-workspace-chip transition-colors duration-150 cursor-pointer active:scale-[0.98]"
          >
            <PaintBucket className="h-4 w-4" />
            局部重绘
          </button>
        )}

        <TooltipProvider delayDuration={200}>
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <button onClick={handleCopyImage} className={btnClass}>
                  <Copy className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">复制图片</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button onClick={handleDownloadImage} className={btnClass}>
                  <Download className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">下载图片</TooltipContent>
            </Tooltip>
            {onRegenerate && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button onClick={onRegenerate} className={btnClass}>
                    <RefreshCw className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">重新生成图片</TooltipContent>
              </Tooltip>
            )}
          </div>
        </TooltipProvider>
      </div>
    </div>
  );
};

export default ImageDetailRightPanel;
