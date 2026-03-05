import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { GenerateTask } from "@/types/task";

export interface HistoryImageItem {
  imageUrl: string;
  task: GenerateTask;
  imageIndex: number;
}

interface ImageHistoryRailProps {
  tasks: GenerateTask[];
  selectedImageUrl: string;
  onSelect: (item: HistoryImageItem) => void;
}

const ImageHistoryRail = ({ tasks, selectedImageUrl, onSelect }: ImageHistoryRailProps) => {
  const allImages = useMemo(() => {
    const items: HistoryImageItem[] = [];
    // tasks already ordered by createdAt desc
    for (const task of tasks) {
      if (task.status === "success" && task.images.length > 0) {
        task.images.forEach((url, idx) => {
          items.push({ imageUrl: url, task, imageIndex: idx });
        });
      }
    }
    return items;
  }, [tasks]);

  if (allImages.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 overflow-y-auto workspace-scroll py-1 px-1">
      {allImages.map((item, i) => (
        <button
          key={`${item.task.id}-${item.imageIndex}-${i}`}
          onClick={() => onSelect(item)}
          className={cn(
            "shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all cursor-pointer hover:opacity-90",
            item.imageUrl === selectedImageUrl
              ? "border-primary shadow-[0_0_8px_hsl(var(--primary)/0.3)]"
              : "border-transparent hover:border-workspace-border"
          )}
        >
          <img
            src={item.imageUrl}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </button>
      ))}
    </div>
  );
};

export default ImageHistoryRail;
