import TaskAttributePanel from "./TaskAttributePanel";
import type { GenerateTask } from "@/types/task";

interface ImageDetailRightPanelProps {
  task: GenerateTask;
}

const ImageDetailRightPanel = ({ task }: ImageDetailRightPanelProps) => {
  return (
    <div className="overflow-y-auto workspace-scroll pr-1">
      <TaskAttributePanel task={task} />
    </div>
  );
};

export default ImageDetailRightPanel;
