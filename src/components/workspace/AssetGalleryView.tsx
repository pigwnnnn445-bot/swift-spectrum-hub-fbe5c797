import { useMemo, useState, useRef } from "react";
import { ArrowLeft, Search, Copy, Download, Trash2, AlertTriangle } from "lucide-react";
import BackToTopButton from "./BackToTopButton";
import { toast } from "@/hooks/use-toast";
import type { GenerateTask } from "@/types/task";

interface AssetItem {
  type: "success" | "error";
  /** 成功时为图片 URL，失败时为空字符串 */
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
}

const AssetGalleryView = ({ tasks, onBack, onImageClick, onDeleteImage, onDeleteTask }: AssetGalleryViewProps) => {
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
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>返回</span>
        </button>
        <h1 className="text-base font-semibold text-foreground">资产管理</h1>
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
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <FolderEmpty className="h-12 w-12 mb-3 opacity-40" />
            <p className="text-sm">{assets.length === 0 ? "暂无生成图片" : "未找到匹配结果"}</p>
          </div>
        ) : (
          <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 2xl:columns-6" style={{ columnGap: 12 }}>
            {filtered.map((item, i) => (
              <AssetCard
                key={`${item.task.id}-${item.imageIndex}-${i}`}
                item={item}
                onClick={onImageClick}
                onDeleteImage={onDeleteImage}
                onDeleteTask={onDeleteTask}
              />
            ))}
          </div>
        )}
      </div>
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
}: {
  item: AssetItem;
  onClick: (url: string, task: GenerateTask, idx: number) => void;
  onDeleteImage?: (taskId: string, imageIndex: number) => void;
  onDeleteTask?: (taskId: string) => void;
}) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isError = item.type === "error";

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(item.url);
      const blob = await res.blob();
      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
      toast({ title: "已复制到剪贴板" });
    } catch {
      toast({ title: "复制失败", variant: "destructive" });
    }
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    const a = document.createElement("a");
    a.href = item.url;
    a.download = `image_${item.task.id}_${item.imageIndex}.png`;
    a.click();
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDelete(true);
  };

  const handleConfirmDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isError) {
      onDeleteTask?.(item.task.id);
    } else {
      onDeleteImage?.(item.task.id, item.imageIndex);
    }
    setConfirmDelete(false);
    toast({ title: isError ? "失败记录已删除" : "图片已删除" });
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDelete(false);
  };

  const handleCardClick = () => {
    if (isError) return; // error 卡片不进入详情
    onClick(item.url, item.task, item.imageIndex);
  };

  const btnClass = "flex h-7 w-7 items-center justify-center rounded-md bg-black/50 text-white/90 hover:bg-black/70 backdrop-blur transition-colors";

  return (
    <div
      className={`group relative mb-3 inline-block w-full overflow-hidden rounded-lg border border-border bg-workspace-panel break-inside-avoid transition-shadow hover:shadow-lg ${isError ? "cursor-default" : "cursor-pointer"}`}
      onClick={handleCardClick}
    >
      {isError ? (
        /* 失败占位卡片 */
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
        /* 成功图片 */
        <img
          src={item.url}
          alt={item.task.prompt}
          className="w-full h-auto block transition-transform duration-200 group-hover:scale-105"
          loading="lazy"
        />
      )}

      {/* Hover overlay — 成功：完整按钮+prompt；失败：仅删除按钮 */}
      <div className={`absolute inset-0 flex flex-col justify-between opacity-0 transition-opacity duration-200 group-hover:opacity-100 ${isError ? "bg-black/30" : "bg-gradient-to-t from-black/70 via-black/10 to-black/30"}`}>
        <div className="flex justify-end gap-1.5 p-2">
          {!isError && (
            <>
              <button onClick={handleCopy} className={btnClass} title="复制图片">
                <Copy className="h-3.5 w-3.5" />
              </button>
              <button onClick={handleDownload} className={btnClass} title="下载图片">
                <Download className="h-3.5 w-3.5" />
              </button>
            </>
          )}
          <button onClick={handleDeleteClick} className={btnClass} title="删除">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Bottom prompt info — 仅成功卡片 */}
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

      {/* Delete confirmation overlay */}
      {confirmDelete && (
        <div
          className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black/60 backdrop-blur-sm"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-sm font-medium text-white">{isError ? "确认删除此失败记录？" : "确认删除这张图片？"}</p>
          <div className="flex gap-2">
            <button
              onClick={handleConfirmDelete}
              className="rounded-md bg-destructive px-4 py-1.5 text-xs font-medium text-destructive-foreground hover:bg-destructive/90 transition-colors"
            >
              删除
            </button>
            <button
              onClick={handleCancelDelete}
              className="rounded-md bg-white/20 px-4 py-1.5 text-xs font-medium text-white hover:bg-white/30 transition-colors"
            >
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetGalleryView;
