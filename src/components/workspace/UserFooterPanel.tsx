import { User } from "lucide-react";

const UserFooterPanel = () => {
  return (
    <div className="border-t border-workspace-border/30 p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-workspace-chip">
          <User className="h-4 w-4 text-workspace-panel-foreground/60" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-workspace-surface-foreground truncate">用户</div>
          <div className="text-xs text-workspace-panel-foreground/50">免费版 · 5 积分</div>
        </div>
      </div>
    </div>
  );
};

export default UserFooterPanel;
