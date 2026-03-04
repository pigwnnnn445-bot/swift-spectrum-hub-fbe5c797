import { useState, useCallback } from "react";
import { Menu } from "lucide-react";
import SettingsSidebar from "./SettingsSidebar";
import HeroPromptBar from "./HeroPromptBar";
import MasonryGallery from "./MasonryGallery";
import StickyPromptBar from "./StickyPromptBar";
import TopNavBar from "./TopNavBar";
import { fetchModelsData } from "@/api/modelService";
import type { ModelConfig, Provider } from "@/config/modelConfig";
import { useEffect } from "react";

const ImageGenDarkPage = () => {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [models, setModels] = useState<ModelConfig[]>([]);
  const [selectedModel, setSelectedModel] = useState<ModelConfig | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [extraCost, setExtraCost] = useState(0);

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

        <HeroPromptBar prompt={prompt} onPromptChange={setPrompt} cost={totalCost} />

        <div className="sticky top-0 z-40">
          <StickyPromptBar visible={showStickyBar} prompt={prompt} onPromptChange={setPrompt} cost={totalCost} />
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
