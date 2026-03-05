import { Palette, Image as ImageIcon } from "lucide-react";
import type { GenerateTask } from "@/types/task";

interface ImageDetailRightPanelProps {
  task: GenerateTask;
}

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-1">
    <span className="text-[11px] font-medium uppercase tracking-wider text-workspace-panel-foreground/50">{label}</span>
    <div className="text-sm text-workspace-surface-foreground">{children}</div>
  </div>
);

const ImageDetailRightPanel = ({ task }: ImageDetailRightPanelProps) => {
  return (
    <div className="space-y-4 overflow-y-auto workspace-scroll pr-1">
      {/* Prompt */}
      <Row label="提示词">
        <p className="leading-relaxed text-sm whitespace-pre-wrap break-words">{task.prompt}</p>
      </Row>

      {/* Model */}
      {task.modelName && (
        <Row label="模型">
          <span className="flex items-center gap-1.5">
            <img src={task.modelImage} alt="" className="h-4 w-4 rounded-full object-cover" />
            {task.modelName}
          </span>
        </Row>
      )}

      {/* Ratio */}
      {task.ratio && (
        <Row label="比例">
          <span className="flex items-center gap-1">□ {task.ratio}</span>
        </Row>
      )}

      {/* Resolution */}
      {task.resolution && (
        <Row label="分辨率">{task.resolution}</Row>
      )}

      {/* Style */}
      {task.styleName && (
        <Row label="风格">
          <span className="flex items-center gap-1">
            <Palette className="h-3 w-3" />
            {task.styleName}
          </span>
        </Row>
      )}

      {/* Generation mode */}
      {task.generationMode === "image-to-image" && (
        <Row label="生成模式">
          <span className="flex items-center gap-1">
            <ImageIcon className="h-3 w-3" /> 图生图
          </span>
        </Row>
      )}

      {/* Similarity */}
      {task.similarity != null && task.generationMode === "image-to-image" && (
        <Row label="相似度">{task.similarity}%</Row>
      )}

      {/* Reference images */}
      {task.referenceImages && task.referenceImages.length > 0 && (
        <Row label="参考图">
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
        </Row>
      )}
    </div>
  );
};

export default ImageDetailRightPanel;
