import { useState, useRef, useEffect } from "react";
import { Menu } from "lucide-react";
import SettingsSidebar from "./SettingsSidebar";
import HeroPromptBar from "./HeroPromptBar";
import MasonryGallery from "./MasonryGallery";
import StickyPromptBar from "./StickyPromptBar";

const ImageGenDarkPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [heroPromptVisible, setHeroPromptVisible] = useState(true);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const scrollEl = scrollRef.current;
    const sentinel = sentinelRef.current;
    if (!scrollEl || !sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setHeroPromptVisible(entry.isIntersecting);
      },
      { root: scrollEl, threshold: 0 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-workspace-panel">
      {/* Left sidebar */}
      <SettingsSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Right main area */}
      <main ref={scrollRef} className="relative flex-1 overflow-y-auto bg-workspace-surface workspace-scroll">
        {/* Mobile menu trigger */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed left-3 top-3 z-30 flex h-10 w-10 items-center justify-center rounded-xl bg-workspace-panel/90 backdrop-blur border border-workspace-border/30 lg:hidden"
        >
          <Menu className="h-5 w-5 text-workspace-surface-foreground" />
        </button>

        {/* Hero area */}
        <HeroPromptBar />
        {/* Sentinel to detect when hero prompt scrolls out */}
        <div ref={sentinelRef} className="h-0 w-0" />

        {/* Sticky prompt bar — sticky within main scroll container */}
        <div className="sticky top-0 z-40">
          <StickyPromptBar visible={!heroPromptVisible} />
        </div>

        {/* Gallery section */}
        <div className="px-4 pb-8 sm:px-6 lg:px-8">
          <h2 className="mb-5 mt-2 text-lg font-semibold text-workspace-panel-foreground/80">
            🎨 灵感显影室
          </h2>
          <MasonryGallery />
        </div>
      </main>
    </div>
  );
};

export default ImageGenDarkPage;
