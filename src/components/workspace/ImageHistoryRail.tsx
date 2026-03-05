import { cn } from "@/lib/utils";
import type { GenerateTask } from "@/types/task";

export interface HistoryImage {
  taskId: string;
  imageIndex: number;
  imageUrl: string;
  task: GenerateTask;
}

interface ImageHistoryRailProps {
  images: HistoryImage[];
  selectedTaskId: string;
  selectedImageIndex: number;
  onSelect: (item: HistoryImage) => void;
}

const ImageHistoryRail = ({ images, selectedTaskId, selectedImageIndex, onSelect }: ImageHistoryRailProps) => {
  return (
    <div className="flex flex-col gap-2 overflow-y-auto workspace-scroll py-1 pr-1">
      {images.map((item) => {
        const isActive = item.taskId === selectedTaskId && item.imageIndex === selectedImageIndex;
        return (
          <button
            key={`${item.taskId}-${item.imageIndex}`}
            onClick={() => onSelect(item)}
            className={cn(
              "shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all cursor-pointer hover:opacity-90",
              isActive
                ? "border-primary shadow-[0_0_8px_hsl(var(--workspace-glow))]"
                : "border-workspace-border/40 hover:border-workspace-border"
            )}
          >
            <img
              src={item.imageUrl}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </button>
        );
      })}
    </div>
  );
};

export default ImageHistoryRail;
