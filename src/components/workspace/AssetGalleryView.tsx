import { useMemo, useState, useRef } from "react";
import { ArrowLeft, Search, Download, MoreHorizontal, Copy, RefreshCw, Trash2, AlertTriangle, FileText } from "lucide-react";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import BackToTopButton from "./BackToTopButton";
import ConfirmDialog from "./ConfirmDialog";
import { toast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import type { GenerateTask } from "@/types/task";

interface AssetItem {
  type: "success" | "error";
  url: string;
  task: GenerateTask;
  imageIndex: number;
}

interface AssetGalleryViewProps {
  tasks: GenerateTask[];
  onBack: () => void;
  onImageClick: (imageUrl: string, task: GenerateTask, imageIndex: number) => void;
  onDeleteImage?: (taskId: string, imageIndex: number) => void;
  onDeleteTask?: (taskId: string) => void;
  onGoToGallery?: () => void;
  onRegenerate?: (taskId: string) => void;
  onApplyPrompt?: (prompt: string) => void;
}

const AssetGalleryView = ({ tasks, onBack, onImageClick, onDeleteImage, onDeleteTask, onGoToGallery, onRegenerate, onApplyPrompt }: AssetGalleryViewProps) => {
  const [search, setSearch] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const assets = useMemo<AssetItem[]>(() => {
    const list: AssetItem[] = [];
    const sorted = [...tasks]
      .filter((t) => (t.status === "success" && t.images.length > 0) || t.status === "error")
      .sort((a, b) => b.createdAt - a.createdAt);
    for (const task of sorted) {
      if (task.status === "error") {
        list.push({ type: "error", url: "", task, imageIndex: -1 });
      } else {
        task.images.forEach((url, idx) => {
          list.push({ type: "success", url, task, imageIndex: idx });
        });
      }
    }
    return list;
  }, [tasks]);

  const filtered = useMemo(() => {
    if (!search.trim()) return assets;
    const q = search.trim().toLowerCase();
    return assets.filter((a) => a.task.prompt.toLowerCase().includes(q));
  }, [assets, search]);

  return (
    <div className="flex h-screen w-full flex-col bg-workspace-surface">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-workspace-panel border-b border-workspace-border/60 sm:px-6 lg:px-8">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>返回</span>
        </button>
        <div className="ml-auto flex items-center">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="搜索提示词..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-48 rounded-lg border border-border bg-background pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>
      </div>

      {/* Gallery */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto workspace-scroll p-4 sm:p-6 lg:p-8">
        {filtered.length === 0 ? (
          assets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <FolderEmpty className="h-12 w-12 mb-3 opacity-40 text-muted-foreground" />
              <p className="text-lg font-semibold text-foreground">哎呀，您的作品为空</p>
              <p className="mt-2 text-sm text-muted-foreground">快去灵感显影室看看吧</p>
              <button
                onClick={() => onGoToGallery?.()}
                className="mt-5 rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                去灵感显影室
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <FolderEmpty className="h-12 w-12 mb-3 opacity-40" />
              <p className="text-sm">未找到匹配结果</p>
            </div>
          )
        ) : (
          <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 2xl:columns-6" style={{ columnGap: 12 }}>
            {filtered.map((item, i) => (
              <AssetCard
                key={`${item.task.id}-${item.imageIndex}-${i}`}
                item={item}
                onClick={onImageClick}
                onDeleteImage={onDeleteImage}
                onDeleteTask={onDeleteTask}
                onRegenerate={onRegenerate}
                onApplyPrompt={onApplyPrompt}
              />
            ))}
          </div>
        )}
      </div>

      <BackToTopButton scrollContainerRef={scrollRef} />
    </div>
  );
};

/* Empty state icon */
const FolderEmpty = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    <line x1="9" y1="14" x2="15" y2="14" />
  </svg>
);

/* Single asset card */
const AssetCard = ({
  item,
  onClick,
  onDeleteImage,
  onDeleteTask,
  onRegenerate,
  onApplyPrompt,
}: {
  item: AssetItem;
  onClick: (url: string, task: GenerateTask, idx: number) => void;
  onDeleteImage?: (taskId: string, imageIndex: number) => void;
  onDeleteTask?: (taskId: string) => void;
  onRegenerate?: (taskId: string) => void;
  onApplyPrompt?: (prompt: string) => void;
}) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [promptOpen, setPromptOpen] = useState(false);
  const isMobile = useIsMobile();
  const isError = item.type === "error";

  const handleCopy = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      const res = await fetch(item.url);
      const blob = await res.blob();
      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
      toast({ title: "已复制到剪贴板" });
    } catch {
      toast({ title: "复制失败", variant: "destructive" });
    }
  };

  const handleDownload = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const a = document.createElement("a");
    a.href = item.url;
    a.download = `image_${item.task.id}_${item.imageIndex}.png`;
    a.click();
  };

  const handleDeleteClick = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setConfirmDelete(true);
  };

  const handleConfirmDelete = () => {
    if (isError) {
      onDeleteTask?.(item.task.id);
    } else {
      onDeleteImage?.(item.task.id, item.imageIndex);
    }
    setConfirmDelete(false);
    toast({ title: isError ? "失败记录已删除" : "图片已删除" });
  };

  const handleCardClick = () => {
    if (isError) return;
    onClick(item.url, item.task, item.imageIndex);
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(item.task.prompt).then(() => {
      toast({ title: "提示词已复制" });
    }).catch(() => {
      toast({ title: "复制失败", variant: "destructive" });
    });
  };

  const handleApply = () => {
    onApplyPrompt?.(item.task.prompt);
    setPromptOpen(false);
    toast({ title: "提示词已应用" });
  };

  const btnClass = "flex h-7 w-7 items-center justify-center rounded-md bg-black/50 text-white/90 hover:bg-black/70 backdrop-blur transition-colors";

  const mobileBtnClass = "flex h-7 w-7 items-center justify-center rounded-md bg-black/50 text-white/90 active:bg-black/70 backdrop-blur transition-colors";

  return (
    <div
      className={`group relative mb-3 inline-block w-full overflow-hidden rounded-lg border border-border bg-workspace-panel break-inside-avoid transition-shadow hover:shadow-lg ${isError ? "cursor-default" : "cursor-pointer"}`}
      onClick={handleCardClick}
    >
      {isError ? (
        <div className="flex flex-col items-center justify-center gap-2 px-4 py-8 text-center">
          <AlertTriangle className="h-8 w-8 text-destructive/70" />
          <p className="text-sm font-medium text-destructive">生成失败</p>
          {item.task.errorMessage && (
            <p className="line-clamp-2 text-xs text-muted-foreground">{item.task.errorMessage}</p>
          )}
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground/70 italic">{item.task.prompt}</p>
          <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground/50">
            <span>{item.task.modelName}</span>
            <span>·</span>
            <span>{new Date(item.task.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      ) : (
        <img
          src={item.url}
          alt={item.task.prompt}
          className="w-full h-auto block transition-transform duration-200 group-hover:scale-105"
          loading="lazy"
        />
      )}

      {/* Mobile: always-visible bottom bar with Download + More */}
      {isMobile && !isError && (
        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-end gap-1.5 p-1.5 bg-gradient-to-t from-black/60 to-transparent">
          <button
            onClick={(e) => { e.stopPropagation(); handleDownload(); }}
            className={mobileBtnClass}
            title="下载"
          >
            <Download className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setMoreOpen(true); }}
            className={mobileBtnClass}
            title="更多"
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Desktop: hover overlay */}
      {!isMobile && (
        <div className={`absolute inset-0 flex flex-col justify-between opacity-0 transition-opacity duration-200 group-hover:opacity-100 ${isError ? "bg-black/30" : "bg-gradient-to-t from-black/70 via-black/10 to-black/30"}`}>
          <div className="flex justify-end gap-1.5 p-2">
            {!isError && (
              <>
                <button onClick={(e) => handleCopy(e)} className={btnClass} title="复制图片">
                  <Copy className="h-3.5 w-3.5" />
                </button>
                <button onClick={(e) => handleDownload(e)} className={btnClass} title="下载图片">
                  <Download className="h-3.5 w-3.5" />
                </button>
              </>
            )}
            <button onClick={(e) => handleDeleteClick(e)} className={btnClass} title="删除">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>

          {!isError && (
            <div className="w-full p-2.5">
              <p className="line-clamp-4 text-xs leading-relaxed text-white/90">
                {item.task.prompt}
              </p>
              <div className="mt-1.5 flex items-center gap-2 text-[10px] text-white/60">
                <span>{item.task.modelName}</span>
                <span>·</span>
                <span>{new Date(item.task.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mobile: error card delete button */}
      {isMobile && isError && (
        <div className="absolute top-1.5 right-1.5">
          <button
            onClick={(e) => { e.stopPropagation(); setMoreOpen(true); }}
            className={mobileBtnClass}
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Mobile More drawer */}
      {isMobile && (
        <Drawer open={moreOpen} onOpenChange={setMoreOpen}>
          <DrawerContent className="z-[200] pb-safe" overlayClassName="z-[200]">
            <div className="px-4 pb-6 pt-2 flex flex-col gap-1">
              {!isError && (
                <button
                  onClick={() => { setMoreOpen(false); setTimeout(() => handleCopy(), 150); }}
                  className="flex items-center gap-3 w-full rounded-xl px-4 py-3 text-sm font-medium text-foreground hover:bg-accent transition-colors active:scale-[0.98]"
                >
                  <Copy className="h-4 w-4" />
                  复制图片
                </button>
              )}
              {!isError && onRegenerate && (
                <button
                  onClick={() => { setMoreOpen(false); setTimeout(() => onRegenerate(item.task.id), 150); }}
                  className="flex items-center gap-3 w-full rounded-xl px-4 py-3 text-sm font-medium text-foreground hover:bg-accent transition-colors active:scale-[0.98]"
                >
                  <RefreshCw className="h-4 w-4" />
                  重新生成
                </button>
              )}
              <button
                onClick={() => { setMoreOpen(false); setTimeout(() => handleDeleteClick(), 150); }}
                className="flex items-center gap-3 w-full rounded-xl px-4 py-3 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors active:scale-[0.98]"
              >
                <Trash2 className="h-4 w-4" />
                {isError ? "删除记录" : "删除图片"}
              </button>
              {!isError && (
                <button
                  onClick={() => { setMoreOpen(false); setTimeout(() => setPromptOpen(true), 150); }}
                  className="flex items-center gap-3 w-full rounded-xl px-4 py-3 text-sm font-medium text-foreground hover:bg-accent transition-colors active:scale-[0.98]"
                >
                  <FileText className="h-4 w-4" />
                  查看提示词
                </button>
              )}
            </div>
          </DrawerContent>
        </Drawer>
      )}

      {/* Mobile Prompt drawer */}
      {isMobile && (
        <Drawer open={promptOpen} onOpenChange={setPromptOpen}>
          <DrawerContent className="z-[200] pb-safe" overlayClassName="z-[200]">
            <div className="px-4 pb-6 pt-2">
              <p className="text-sm font-medium text-foreground mb-2">提示词</p>
              <div className="rounded-lg bg-muted/50 p-3 text-sm text-foreground leading-relaxed max-h-[40vh] overflow-y-auto workspace-scroll">
                {item.task.prompt}
              </div>
              <div className="mt-1.5 flex items-center gap-2 text-[10px] text-muted-foreground">
                <span>{item.task.modelName}</span>
                <span>·</span>
                <span>{new Date(item.task.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={handleCopyPrompt}
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-accent transition-colors active:scale-[0.98]"
                >
                  <Copy className="h-4 w-4" />
                  复制
                </button>
                {onApplyPrompt && (
                  <button
                    onClick={handleApply}
                    className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors active:scale-[0.98]"
                  >
                    应用提示词
                  </button>
                )}
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      )}

      {/* Delete confirmation - desktop uses overlay, mobile uses dialog */}
      {isMobile ? (
        <ConfirmDialog open={confirmDelete} onOpenChange={setConfirmDelete} onConfirm={handleConfirmDelete} />
      ) : (
        confirmDelete && (
          <div
            className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black/60 backdrop-blur-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm font-medium text-white">{isError ? "确认删除此失败记录？" : "确认删除这张图片？"}</p>
            <div className="flex gap-2">
              <button
                onClick={handleConfirmDelete}
                className="rounded-md bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                删除
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setConfirmDelete(false); }}
                className="rounded-md bg-white/20 px-4 py-1.5 text-xs font-medium text-white hover:bg-white/30 transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        )
      )}
    </div>
  );
};

export default AssetGalleryView;
