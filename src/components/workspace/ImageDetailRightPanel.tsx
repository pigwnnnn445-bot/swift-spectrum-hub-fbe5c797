import { useState } from "react";
import { PaintBucket, Copy, Download, RefreshCw, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogOverlay, AlertDialogPortal } from "@/components/ui/alert-dialog";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { toast } from "@/hooks/use-toast";
import TaskAttributePanel from "./TaskAttributePanel";
import MidjourneyActionBar from "./MidjourneyActionBar";
import type { GenerateTask, MjAction } from "@/types/task";

interface ImageDetailRightPanelProps {
  task: GenerateTask;
  imageUrl?: string;
  isMj?: boolean;
  onApplyPrompt?: (prompt: string) => void;
  onOpenInpaint?: () => void;
  onRegenerate?: () => void;
  onDelete?: () => void;
  onMjAction?: (action: MjAction) => void;
}

const ImageDetailRightPanel = ({ task, imageUrl, isMj, onApplyPrompt, onOpenInpaint, onRegenerate, onDelete, onMjAction }: ImageDetailRightPanelProps) => {
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

        {/* Midjourney action bar between inpaint and copy/delete */}
        {isMj && task.mjStage && onMjAction && (
          <div className="w-full mt-2">
            <MidjourneyActionBar
              stage={task.mjStage}
              onAction={onMjAction}
            />
          </div>
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
            {!isMj && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button onClick={handleDownloadImage} className={btnClass}>
                    <Download className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">下载图片</TooltipContent>
              </Tooltip>
            )}
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
            {onDelete && (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button onClick={() => setDeleteDialogOpen(true)} className={btnClass}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">删除图片</TooltipContent>
                </Tooltip>
                <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                  <AlertDialogPortal>
                    <AlertDialogOverlay className="z-[200]" />
                    <AlertDialogPrimitive.Content className="fixed left-[50%] top-[50%] z-[200] grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-lg">
                      <AlertDialogHeader>
                        <AlertDialogTitle>确认删除</AlertDialogTitle>
                        <AlertDialogDescription>确认删除这张图片？此操作不可撤销。</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction onClick={onDelete} className="bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">删除</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogPrimitive.Content>
                  </AlertDialogPortal>
                </AlertDialog>
              </>
            )}
          </div>
        </TooltipProvider>
      </div>
    </div>
  );
};

export default ImageDetailRightPanel;
