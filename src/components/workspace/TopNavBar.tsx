import { useState } from "react";
import { Zap, Rocket, FolderOpen, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// Mock data
const mockQuota = {
  plan: "免费版",
  total: 100,
  used: 100,
  remain: 0,
  resetDate: "2026-04-01",
};

const TopNavBar = () => {
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-background/80 backdrop-blur-sm sm:px-6 lg:px-8">
      {/* Left: title + quota + upgrade */}
      <div className="flex items-center gap-1">
        <div className="flex items-center gap-1 text-sm text-foreground">
          <Zap className="h-3.5 w-3.5 text-primary" />
          <span className="font-medium">{mockQuota.total}</span>
        </div>

        <div className="mx-2 h-4 w-px bg-border" />

        <button
          onClick={() => setUpgradeOpen(true)}
          className="flex items-center gap-1 text-sm font-medium text-foreground hover:text-primary transition-colors cursor-pointer"
        >
          <Rocket className="h-3.5 w-3.5 text-accent-foreground" />
          <span>Upgrade</span>
        </button>
      </div>

      {/* Right: asset management */}
      <button className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors cursor-pointer">
        <FolderOpen className="h-4 w-4" />
        <span className="hidden sm:inline">资产管理</span>
        <ChevronRight className="h-3.5 w-3.5" />
      </button>

      {/* Upgrade modal */}
      <Dialog open={upgradeOpen} onOpenChange={setUpgradeOpen}>
        <DialogContent className="sm:max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle>升级套餐</DialogTitle>
            <DialogDescription>
              解锁更多生成配额与高级功能
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4 text-sm text-muted-foreground">
            <p>• 更多每日生成配额</p>
            <p>• 高清图像输出</p>
            <p>• 优先队列</p>
            <p>• 更多模型选择</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpgradeOpen(false)}>
              稍后再说
            </Button>
            <Button onClick={() => setUpgradeOpen(false)}>
              立即升级
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TopNavBar;
