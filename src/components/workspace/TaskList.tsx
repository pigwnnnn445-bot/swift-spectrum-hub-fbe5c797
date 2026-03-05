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
      <h2 className="text-sm font-medium text-workspace-panel-foreground/50 uppercase tracking-wider mb-3">
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
          />
        ))}
      </div>
    </div>
  );
};

export default TaskList;
