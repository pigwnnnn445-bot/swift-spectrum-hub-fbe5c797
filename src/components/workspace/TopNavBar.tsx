import { FolderOpen, ChevronRight } from "lucide-react";

const TopNavBar = () => {
  return (
    <div>
      <div className="relative flex items-center justify-end px-4 py-2 bg-workspace-panel sm:px-6 lg:px-8">
        {/* Right: asset management */}
        <button className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors cursor-pointer">
          <FolderOpen className="h-4 w-4" />
          <span className="hidden sm:inline">资产管理</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="h-px bg-workspace-border/60" />
    </div>
  );
};

export default TopNavBar;
