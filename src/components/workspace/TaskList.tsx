import type { GenerateTask } from "@/types/task";
import TaskCard from "./TaskCard";

interface TaskListProps {
  tasks: GenerateTask[];
  onRetry?: (taskId: string) => void;
  onApplyPrompt?: (prompt: string) => void;
  onApplyReferenceImage?: (imageUrl: string) => void;
  onEditImage?: (imageUrl: string, task: GenerateTask) => void;
  onInpaint?: (imageUrl: string) => void;
  onImageClick?: (imageUrl: string, task: GenerateTask, imageIndex: number) => void;
}

const TaskList = ({ tasks, onRetry, onApplyPrompt, onApplyReferenceImage, onEditImage, onInpaint, onImageClick }: TaskListProps) => {
  if (tasks.length === 0) return null;

  return (
    <div className="px-4 pt-2.5 pb-6 sm:px-6 lg:px-8">
      <h2 className="text-xs font-semibold text-workspace-panel-foreground/40 uppercase tracking-widest mb-3 select-none">
        今天
      </h2>
      <div className="space-y-3">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onRetry={onRetry}
            onApplyPrompt={onApplyPrompt}
            onApplyReferenceImage={onApplyReferenceImage}
            onEditImage={onEditImage}
            onInpaint={onInpaint}
            onImageClick={onImageClick}
          />
        ))}
      </div>
    </div>
  );
};

export default TaskList;
