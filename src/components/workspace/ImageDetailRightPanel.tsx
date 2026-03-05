import { Palette, ImageIcon } from "lucide-react";
import type { GenerateTask } from "@/types/task";

interface ImageDetailRightPanelProps {
  task: GenerateTask;
}

const ImageDetailRightPanel = ({ task }: ImageDetailRightPanelProps) => {
  return (
    <div className="flex flex-col gap-4 overflow-y-auto workspace-scroll pr-1">
      {/* Prompt */}
      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Prompt</h3>
        <p className="text-sm text-workspace-surface-foreground leading-relaxed break-words">{task.prompt}</p>
      </div>

      {/* Model */}
      {task.modelName && (
        <div className="flex items-center gap-2">
          <img src={task.modelImage} alt="" className="h-5 w-5 rounded-full object-cover" />
          <span className="text-sm text-workspace-panel-foreground">{task.modelName}</span>
        </div>
      )}

      {/* Ratio */}
      {task.ratio && (
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">比例</span>
          <span className="rounded-full bg-workspace-chip px-2.5 py-0.5 text-xs text-workspace-panel-foreground">
            □ {task.ratio}
          </span>
        </div>
      )}

      {/* Resolution */}
      {task.resolution && (
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">分辨率</span>
          <span className="rounded-full bg-workspace-chip px-2.5 py-0.5 text-xs text-workspace-panel-foreground">
            {task.resolution}
          </span>
        </div>
      )}

      {/* Style */}
      {task.styleName && (
        <div className="flex items-center gap-1.5">
          <Palette className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">风格</span>
          <span className="rounded-full bg-workspace-chip px-2.5 py-0.5 text-xs text-workspace-panel-foreground">
            {task.styleName}
          </span>
        </div>
      )}

      {/* Similarity */}
      {task.similarity != null && task.generationMode === "image-to-image" && (
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">相似度</span>
          <span className="rounded-full bg-workspace-chip px-2.5 py-0.5 text-xs text-workspace-panel-foreground">
            {task.similarity}%
          </span>
        </div>
      )}

      {/* Reference Images */}
      {task.referenceImages && task.referenceImages.length > 0 && (
        <div>
          <div className="flex items-center gap-1 mb-2">
            <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">参考图</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {task.referenceImages.map((src, i) => (
              <img
                key={i}
                src={src}
                alt={`参考图 ${i + 1}`}
                className="h-10 w-10 rounded-lg object-cover border border-workspace-border/40"
                loading="lazy"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageDetailRightPanel;
