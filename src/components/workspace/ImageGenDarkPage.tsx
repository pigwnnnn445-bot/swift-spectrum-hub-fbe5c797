import { useState } from "react";
import { Menu } from "lucide-react";
import SettingsSidebar from "./SettingsSidebar";
import HeroPromptBar from "./HeroPromptBar";
import MasonryGallery from "./MasonryGallery";

const ImageGenDarkPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-workspace-panel">
      {/* Left sidebar */}
      <SettingsSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Right main area */}
      <main className="flex-1 overflow-y-auto bg-workspace-surface workspace-scroll">
        {/* Mobile menu trigger */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed left-3 top-3 z-30 flex h-10 w-10 items-center justify-center rounded-xl bg-workspace-panel/90 backdrop-blur border border-workspace-border/30 lg:hidden"
        >
          <Menu className="h-5 w-5 text-workspace-surface-foreground" />
        </button>

        {/* Hero area */}
        <HeroPromptBar />

        {/* Gallery section */}
        <div className="px-4 pb-8 sm:px-6 lg:px-8">
          <h2 className="mb-5 mt-2 text-lg font-semibold text-workspace-panel-foreground/80">
            🎨 浏览创意
          </h2>
          <MasonryGallery />
        </div>
      </main>
    </div>
  );
};

export default ImageGenDarkPage;
