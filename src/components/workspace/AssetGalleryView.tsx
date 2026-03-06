import { useMemo, useState } from "react";
import { ArrowLeft, Search, Copy, Download, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { GenerateTask } from "@/types/task";

interface AssetImage {
  url: string;
  task: GenerateTask;
  imageIndex: number;
}

interface AssetGalleryViewProps {
  tasks: GenerateTask[];
  onBack: () => void;
  onImageClick: (imageUrl: string, task: GenerateTask, imageIndex: number) => void;
  onDeleteImage?: (taskId: string, imageIndex: number) => void;
}

const AssetGalleryView = ({ tasks, onBack, onImageClick, onDeleteImage }: AssetGalleryViewProps) => {
  const [search, setSearch] = useState("");

  const assets = useMemo<AssetImage[]>(() => {
    const list: AssetImage[] = [];
    // 按 createdAt 倒序，展示所有 success 任务的图片
    const sorted = [...tasks]
      .filter((t) => t.status === "success" && t.images.length > 0)
      .sort((a, b) => b.createdAt - a.createdAt);
    for (const task of sorted) {
      task.images.forEach((url, idx) => {
        list.push({ url, task, imageIndex: idx });
      });
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
      <div className="flex-1 overflow-y-auto workspace-scroll p-4 sm:p-6 lg:p-8">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <FolderEmpty className="h-12 w-12 mb-3 opacity-40" />
            <p className="text-sm">{assets.length === 0 ? "暂无生成图片" : "未找到匹配结果"}</p>
          </div>
        ) : (
          <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 2xl:columns-6" style={{ columnGap: 12 }}>
            {filtered.map((item, i) => (
              <AssetCard key={`${item.task.id}-${item.imageIndex}-${i}`} item={item} onClick={onImageClick} onDelete={onDeleteImage} />
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

/* Single asset card with hover prompt overlay */
const AssetCard = ({
  item,
  onClick,
}: {
  item: AssetImage;
  onClick: (url: string, task: GenerateTask, idx: number) => void;
}) => {
  return (
    <div
      className="group relative mb-3 inline-block w-full cursor-pointer overflow-hidden rounded-lg border border-border bg-workspace-panel break-inside-avoid transition-shadow hover:shadow-lg"
      onClick={() => onClick(item.url, item.task, item.imageIndex)}
    >
      <img
        src={item.url}
        alt={item.task.prompt}
        className="w-full h-auto block transition-transform duration-200 group-hover:scale-105"
        loading="lazy"
      />
      {/* Hover overlay */}
      <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100 pointer-events-none">
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
      </div>
    </div>
  );
};

export default AssetGalleryView;
