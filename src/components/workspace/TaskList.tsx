import type { GenerateTask } from "@/types/task";
import TaskCard from "./TaskCard";

interface TaskListProps {
  tasks: GenerateTask[];
  onRetry?: (taskId: string) => void;
  onApplyPrompt?: (prompt: string) => void;
  onApplyReferenceImage?: (imageUrl: string) => void;
}

const TaskList = ({ tasks, onRetry, onApplyPrompt, onApplyReferenceImage }: TaskListProps) => {
  if (tasks.length === 0) return null;

  return (
    <div className="px-4 pt-2.5 pb-6 sm:px-6 lg:px-8">
      <h2 className="text-xs font-semibold text-workspace-panel-foreground/40 uppercase tracking-widest mb-2.5 select-none">
        今天
      </h2>
      <div className="space-y-3.5">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onRetry={onRetry}
            onApplyPrompt={onApplyPrompt}
            onApplyReferenceImage={onApplyReferenceImage}
          />
        ))}
      </div>
    </div>
  );
};

export default TaskList;
