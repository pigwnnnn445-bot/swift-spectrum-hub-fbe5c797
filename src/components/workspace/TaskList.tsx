import type { GenerateTask } from "@/types/task";
import TaskCard from "./TaskCard";

interface TaskListProps {
  tasks: GenerateTask[];
  onRetry?: (taskId: string) => void;
}

const TaskList = ({ tasks, onRetry }: TaskListProps) => {
  if (tasks.length === 0) return null;

  return (
    <div className="px-4 pt-2.5 pb-6 sm:px-6 lg:px-8 space-y-4">
      <h2 className="text-sm font-medium text-workspace-panel-foreground/50 uppercase tracking-wider">
        今天
      </h2>
      <div className="space-y-4">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} onRetry={onRetry} />
        ))}
      </div>
    </div>
  );
};

export default TaskList;
