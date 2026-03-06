import { PaintBucket } from "lucide-react";
import TaskAttributePanel from "./TaskAttributePanel";
import type { GenerateTask } from "@/types/task";

interface ImageDetailRightPanelProps {
  task: GenerateTask;
  onApplyPrompt?: (prompt: string) => void;
  onOpenInpaint?: () => void;
}

const ImageDetailRightPanel = ({ task, onApplyPrompt, onOpenInpaint }: ImageDetailRightPanelProps) => {
  return (
    <div className="overflow-y-auto workspace-scroll pr-1">
      <TaskAttributePanel task={task} onApplyPrompt={onApplyPrompt} />

      {onOpenInpaint && (
        <div className="mt-3 pt-3 border-t border-workspace-border/40">
          <button
            onClick={onOpenInpaint}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-workspace-border/60 bg-workspace-chip/40 px-4 py-2.5 text-sm font-medium text-workspace-surface-foreground hover:bg-workspace-chip transition-colors duration-150 cursor-pointer active:scale-[0.98]"
          >
            <PaintBucket className="h-4 w-4" />
            局部重绘
          </button>
        </div>
      )}
    </div>
  );
};

export default ImageDetailRightPanel;
