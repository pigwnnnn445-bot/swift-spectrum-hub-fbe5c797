import { useState } from "react";
import { Copy, Download, RefreshCw, Trash2 } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import ConfirmDialog from "./ConfirmDialog";
import MidjourneyActionBar from "./MidjourneyActionBar";
import { toast } from "@/hooks/use-toast";
import type { GenerateTask, MjAction } from "@/types/task";

interface ImageDetailMobileActionsProps {
  imageUrl?: string;
  task?: GenerateTask;
  onRegenerate?: () => void;
  onDelete?: () => void;
  onMjAction?: (task: GenerateTask, action: MjAction) => void;
}

const ImageDetailMobileActions = ({ imageUrl, task, onRegenerate, onDelete, onMjAction }: ImageDetailMobileActionsProps) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

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

  const isMj = task?.isMj && task?.mjStage;

  return (
    <div className="shrink-0 lg:hidden">
      {/* Standard action buttons */}
      <div className="flex items-center justify-center gap-3 px-4 py-2 border-t border-workspace-border/40">
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={handleCopyImage} className={btnClass}>
                <Copy className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">复制图片</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={handleDownloadImage} className={btnClass}>
                <Download className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">下载图片</TooltipContent>
          </Tooltip>
          {!isMj && onRegenerate && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button onClick={onRegenerate} className={btnClass}>
                  <RefreshCw className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">重新生成图片</TooltipContent>
            </Tooltip>
          )}
          {onDelete && (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button onClick={() => setDeleteDialogOpen(true)} className={btnClass}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">删除图片</TooltipContent>
              </Tooltip>
              <ConfirmDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                onConfirm={onDelete}
              />
            </>
          )}
        </TooltipProvider>
      </div>

      {/* Midjourney action bar */}
      {isMj && task && onMjAction && (
        <div className="px-4 pb-2">
          <MidjourneyActionBar
            stage={task.mjStage!}
            onAction={(action) => onMjAction(task, action)}
            onDownload={handleDownloadImage}
          />
        </div>
      )}
    </div>
  );
};

export default ImageDetailMobileActions;
