import TaskAttributePanel from "./TaskAttributePanel";
import type { GenerateTask } from "@/types/task";

interface ImageDetailRightPanelProps {
  task: GenerateTask;
  onApplyPrompt?: (prompt: string) => void;
}

const ImageDetailRightPanel = ({ task, onApplyPrompt }: ImageDetailRightPanelProps) => {
  return (
    <div className="overflow-y-auto workspace-scroll pr-1">
      <TaskAttributePanel task={task} onApplyPrompt={onApplyPrompt} />
    </div>
  );
};

export default ImageDetailRightPanel;
