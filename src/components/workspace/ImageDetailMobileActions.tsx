import { useState, useMemo } from "react";
import { Copy, Download, RefreshCw, Trash2, MoreHorizontal } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import ConfirmDialog from "./ConfirmDialog";
import MidjourneyActionBar from "./MidjourneyActionBar";
import { toast } from "@/hooks/use-toast";
import type { GenerateTask, MjAction } from "@/types/task";

interface ActionItem {
  key: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  destructive?: boolean;
}

interface ImageDetailMobileActionsProps {
  imageUrl?: string;
  task?: GenerateTask;
  onRegenerate?: () => void;
  onDelete?: () => void;
  onMjAction?: (task: GenerateTask, action: MjAction) => void;
}

const ImageDetailMobileActions = ({ imageUrl, task, onRegenerate, onDelete, onMjAction }: ImageDetailMobileActionsProps) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

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

  // Build action list dynamically
  const actions = useMemo<ActionItem[]>(() => {
    const list: ActionItem[] = [];
    list.push({
      key: "copy",
      icon: <Copy className="h-4 w-4" />,
      label: "复制图片",
      onClick: handleCopyImage,
    });
    list.push({
      key: "download",
      icon: <Download className="h-4 w-4" />,
      label: "下载图片",
      onClick: handleDownloadImage,
    });
    if (!isMj && onRegenerate) {
      list.push({
        key: "regenerate",
        icon: <RefreshCw className="h-4 w-4" />,
        label: "重新生成",
        onClick: onRegenerate,
      });
    }
    if (onDelete) {
      list.push({
        key: "delete",
        icon: <Trash2 className="h-4 w-4" />,
        label: "删除图片",
        onClick: () => setDeleteDialogOpen(true),
        destructive: true,
      });
    }
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageUrl, isMj, !!onRegenerate, !!onDelete]);

  const MAX_VISIBLE = 3;
  const needsMore = actions.length > MAX_VISIBLE;
  const visibleActions = needsMore ? actions.slice(0, MAX_VISIBLE - 1) : actions;
  const overflowActions = needsMore ? actions.slice(MAX_VISIBLE - 1) : [];

  const handleOverflowAction = (action: ActionItem) => {
    setMoreOpen(false);
    // Small delay so drawer closes before action fires
    setTimeout(() => action.onClick(), 150);
  };

  return (
    <div className="shrink-0 lg:hidden overflow-y-auto" style={{ maxHeight: '50vh' }}>
      {/* Midjourney action bar — show BEFORE utility buttons for visibility */}
      {isMj && task && onMjAction && (
        <div className="px-4 pt-2 pb-1">
          <MidjourneyActionBar
            stage={task.mjStage!}
            onAction={(action) => onMjAction(task, action)}
          />
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center justify-center gap-3 px-4 py-2 border-t border-workspace-border/40">
        <TooltipProvider delayDuration={200}>
          {visibleActions.map((action) => (
            <Tooltip key={action.key}>
              <TooltipTrigger asChild>
                <button onClick={action.onClick} className={btnClass}>
                  {action.icon}
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">{action.label}</TooltipContent>
            </Tooltip>
          ))}
          {needsMore && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button onClick={() => setMoreOpen(true)} className={btnClass}>
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">更多功能</TooltipContent>
            </Tooltip>
          )}
        </TooltipProvider>
      </div>

      {/* Overflow drawer */}
      <Drawer open={moreOpen} onOpenChange={setMoreOpen}>
        <DrawerContent className="z-[200] pb-safe" overlayClassName="z-[200]">
          <div className="px-4 pb-6 pt-2 flex flex-col gap-1">
            {overflowActions.map((action) => (
              <button
                key={action.key}
                onClick={() => handleOverflowAction(action)}
                className={`flex items-center gap-3 w-full rounded-xl px-4 py-3 text-sm font-medium transition-colors active:scale-[0.98] cursor-pointer ${
                  action.destructive
                    ? "text-destructive hover:bg-destructive/10"
                    : "text-workspace-surface-foreground hover:bg-workspace-chip/60"
                }`}
              >
                {action.icon}
                {action.label}
              </button>
            ))}
          </div>
        </DrawerContent>
      </Drawer>

      {/* Delete confirm dialog */}
      {onDelete && (
        <ConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={onDelete}
        />
      )}
    </div>
  );
};

export default ImageDetailMobileActions;
