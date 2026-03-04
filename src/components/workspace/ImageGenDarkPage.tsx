import { useState, useCallback } from "react";
import { Menu } from "lucide-react";
import SettingsSidebar from "./SettingsSidebar";
import HeroPromptBar from "./HeroPromptBar";
import MasonryGallery from "./MasonryGallery";
import StickyPromptBar from "./StickyPromptBar";
import TopNavBar from "./TopNavBar";
import TaskList from "./TaskList";
import { fetchModelsData } from "@/api/modelService";
import { mockGenerate } from "@/api/mockGenerate";
import type { ModelConfig, Provider } from "@/config/modelConfig";
import type { GenerateTask } from "@/types/task";
import { useEffect } from "react";
import { toast } from "@/hooks/use-toast";

const ImageGenDarkPage = () => {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [models, setModels] = useState<ModelConfig[]>([]);
  const [selectedModel, setSelectedModel] = useState<ModelConfig | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [extraCost, setExtraCost] = useState(0);
  const [tasks, setTasks] = useState<GenerateTask[]>([]);

  useEffect(() => {
    fetchModelsData().then((data) => {
      setProviders(data.provider_list);
      setModels(data.model_list);
      if (data.model_list.length > 0) setSelectedModel(data.model_list[0]);
    });
  }, []);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    setShowStickyBar(scrollTop > 200);
  }, []);

  const handleExtraCostChange = useCallback((extra: number) => {
    setExtraCost(extra);
  }, []);

  // ── 检查是否有任务正在生成 ──
  const isGenerating = tasks.some((t) => t.status === "generating" || t.status === "submitting");

  // ── 提交生成任务 ──
  const handleSubmit = useCallback(async () => {
    if (!selectedModel || !prompt.trim() || isGenerating) return;

    if (!prompt.trim()) {
      toast({ title: "请输入提示词", variant: "destructive" });
      return;
    }

    const taskId = `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    // 默认生成 4 张（若模型 image_num > 0 则用模型值）
    const count = selectedModel.image_num > 0 ? selectedModel.image_num : 4;

    const newTask: GenerateTask = {
      id: taskId,
      prompt: prompt.trim(),
      status: "submitting",
      modelName: selectedModel.name,
      modelImage: selectedModel.image,
      ratio: selectedModel.ratio?.[0] ?? "1:1",
      resolution: selectedModel.resolution?.[0]?.resolution ?? "",
      count,
      images: [],
      createdAt: Date.now(),
      requestPayload: {
        model_id: selectedModel.id,
        prompt: prompt.trim(),
        count,
      },
    };

    // 插入到列表顶部
    setTasks((prev) => [newTask, ...prev]);

    // 切换为 generating
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: "generating" as const } : t))
    );

    // ── 调用 mock 接口（发布时替换为真实 API） ──
    try {
      const result = await mockGenerate(count);
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id !== taskId) return t;
          if (result.success) {
            return { ...t, status: "success" as const, images: result.images ?? [] };
          }
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
  }, [selectedModel, prompt, isGenerating]);

  // ── 重试任务 ──
  const handleRetry = useCallback(async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: "generating" as const, errorMessage: undefined } : t))
    );

    try {
      const result = await mockGenerate(task.count);
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id !== taskId) return t;
          if (result.success) {
            return { ...t, status: "success" as const, images: result.images ?? [] };
          }
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
  }, [tasks]);

  if (!selectedModel) return null;

  const totalCost = selectedModel.price + extraCost;
  const hasTasks = tasks.length > 0;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-workspace-panel">
      <SettingsSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
        models={models}
        providers={providers}
        onExtraCostChange={handleExtraCostChange}
      />

      <main className="relative flex-1 overflow-y-auto bg-workspace-surface workspace-scroll" onScroll={handleScroll}>
        <div className="sticky top-0 z-50 flex items-center">
          <button
            onClick={() => setSidebarOpen(true)}
            className="ml-2 mr-1 flex h-8 w-8 items-center justify-center rounded-lg bg-background/80 backdrop-blur border border-border lg:hidden shrink-0"
          >
            <Menu className="h-4 w-4 text-foreground" />
          </button>
          <div className="flex-1 min-w-0">
            <TopNavBar />
          </div>
        </div>

        <HeroPromptBar
          prompt={prompt}
          onPromptChange={setPrompt}
          cost={totalCost}
          isGenerating={isGenerating}
          onSubmit={handleSubmit}
          hasActiveTask={isGenerating}
        />

        <div className="sticky top-[41px] z-40">
          <StickyPromptBar
            visible={showStickyBar}
            prompt={prompt}
            onPromptChange={setPrompt}
            cost={totalCost}
            isGenerating={isGenerating}
            onSubmit={handleSubmit}
          />
        </div>

        {/* 任务列表 */}
        <TaskList tasks={tasks} onRetry={handleRetry} />

        {/* 灵感画廊：有任务时隐藏 */}
        {!hasTasks && (
          <div className="px-4 pb-8 sm:px-6 lg:px-8">
            <h2 className="mb-5 mt-2 text-lg font-semibold text-workspace-panel-foreground">
              🎨 灵感显影室
            </h2>
            <MasonryGallery onUsePrompt={setPrompt} />
          </div>
        )}
      </main>
    </div>
  );
};

export default ImageGenDarkPage;
