import { useState, useRef, useEffect, useCallback } from "react";
import { Menu } from "lucide-react";
import SettingsSidebar from "./SettingsSidebar";
import HeroPromptBar from "./HeroPromptBar";
import MasonryGallery from "./MasonryGallery";
import StickyPromptBar from "./StickyPromptBar";
import { fetchModelsData } from "@/api/modelService";
import type { ModelConfig, Provider } from "@/config/modelConfig";

const ImageGenDarkPage = () => {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [models, setModels] = useState<ModelConfig[]>([]);
  const [selectedModel, setSelectedModel] = useState<ModelConfig | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [heroPromptVisible, setHeroPromptVisible] = useState(true);
  const [prompt, setPrompt] = useState("");
  const [extraCost, setExtraCost] = useState(0);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLElement>(null);

  useEffect(() => {
    fetchModelsData().then((data) => {
      setProviders(data.provider_list);
      setModels(data.model_list);
      if (data.model_list.length > 0) setSelectedModel(data.model_list[0]);
    });
  }, []);

  useEffect(() => {
    const scrollEl = scrollRef.current;
    const sentinel = sentinelRef.current;
    if (!scrollEl || !sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => setHeroPromptVisible(entry.isIntersecting),
      { root: scrollEl, threshold: 0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  const handleExtraCostChange = useCallback((extra: number) => {
    setExtraCost(extra);
  }, []);

  if (!selectedModel) return null;

  const totalCost = selectedModel.price + extraCost;

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

      <main ref={scrollRef} className="relative flex-1 overflow-y-auto bg-workspace-surface workspace-scroll">
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed left-3 top-3 z-30 flex h-10 w-10 items-center justify-center rounded-xl bg-workspace-panel/90 backdrop-blur border border-workspace-border/60 lg:hidden"
        >
          <Menu className="h-5 w-5 text-workspace-surface-foreground" />
        </button>

        <HeroPromptBar prompt={prompt} onPromptChange={setPrompt} cost={totalCost} />
        <div ref={sentinelRef} className="h-0 w-0" />

        <div className="sticky top-0 z-40">
          <StickyPromptBar visible={!heroPromptVisible} prompt={prompt} onPromptChange={setPrompt} cost={totalCost} />
        </div>

        <div className="px-4 pb-8 sm:px-6 lg:px-8">
          <h2 className="mb-5 mt-2 text-lg font-semibold text-workspace-panel-foreground">
            🎨 灵感显影室
          </h2>
          <MasonryGallery onUsePrompt={setPrompt} />
        </div>
      </main>
    </div>
  );
};

export default ImageGenDarkPage;
