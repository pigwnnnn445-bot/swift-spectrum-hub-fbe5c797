import { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import type { GenerateTask, GenerationMode } from "@/types/task";
import { fetchModelsData } from "@/api/modelService";
import { mockGenerate } from "@/api/mockGenerate";
import type { ModelConfig, Provider } from "@/config/modelConfig";
import { toast } from "@/hooks/use-toast";

interface TaskContextValue {
  tasks: GenerateTask[];
  models: ModelConfig[];
  providers: Provider[];
  addTask: (task: GenerateTask) => void;
  updateTask: (taskId: string, patch: Partial<GenerateTask>) => void;
  /** Run mock generate for a task (sets generating → success/error) */
  runGenerate: (taskId: string, count: number) => Promise<void>;
}

const TaskContext = createContext<TaskContextValue | null>(null);

export const useTaskContext = () => {
  const ctx = useContext(TaskContext);
  if (!ctx) throw new Error("useTaskContext must be used within TaskProvider");
  return ctx;
};

export const TaskProvider = ({ children }: { children: React.ReactNode }) => {
  const [tasks, setTasks] = useState<GenerateTask[]>([]);
  const [models, setModels] = useState<ModelConfig[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);

  useEffect(() => {
    fetchModelsData().then((data) => {
      setProviders(data.provider_list);
      setModels(data.model_list);
    });
  }, []);

  const addTask = useCallback((task: GenerateTask) => {
    setTasks((prev) => [task, ...prev]);
  }, []);

  const updateTask = useCallback((taskId: string, patch: Partial<GenerateTask>) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...patch } : t)));
  }, []);

  const runGenerate = useCallback(async (taskId: string, count: number) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: "generating" as const } : t)));
    try {
      const result = await mockGenerate(count);
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id !== taskId) return t;
          if (result.success) return { ...t, status: "success" as const, images: result.images ?? [] };
          return { ...t, status: "error" as const, errorMessage: result.errorMessage };
        })
      );
    } catch {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, status: "error" as const, errorMessage: "网络异常，请稍后重试" } : t
        )
      );
    }
  }, []);

  return (
    <TaskContext.Provider value={{ tasks, models, providers, addTask, updateTask, runGenerate }}>
      {children}
    </TaskContext.Provider>
  );
};
