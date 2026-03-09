import { FolderOpen, ChevronRight, Sun, Moon } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

interface TopNavBarProps {
  onOpenAssets?: () => void;
}

const TopNavBar = ({ onOpenAssets }: TopNavBarProps) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div>
      <div className="relative flex items-center justify-end gap-2 px-4 py-2 bg-workspace-panel sm:px-6 lg:px-8">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors cursor-pointer"
          title={theme === "light" ? "切换到暗色模式" : "切换到亮色模式"}
        >
          {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          <span className="hidden sm:inline">{theme === "light" ? "暗色模式" : "亮色模式"}</span>
        </button>

        {/* Right: asset management */}
        <button
          onClick={onOpenAssets}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors cursor-pointer"
        >
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
