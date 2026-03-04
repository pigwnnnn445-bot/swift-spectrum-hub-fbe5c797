import { useState } from "react";
import { Zap, Rocket, FolderOpen, ChevronRight } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { mockModelsData } from "@/config/mockModelData";

// Mock data
const mockQuota = {
  plan: "Pro Plan",
  active: true,
  subscriptionUsed: 0,
  subscriptionTotal: 100,
  paidQuota: 5074,
  remainingTime: "1d 3h 56min",
};

const TopNavBar = () => {
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  return (
    <div>
    <div className="relative flex items-center justify-center px-4 py-2 bg-workspace-panel sm:px-6 lg:px-8">
      {/* Center: quota + upgrade */}
      <div className="flex items-center gap-1">
        <Popover>
          <PopoverTrigger asChild>
            <button className="flex items-center gap-1 text-sm text-foreground hover:bg-accent rounded-lg px-2 py-1 transition-colors cursor-pointer">
              <Zap className="h-3.5 w-3.5 text-primary" />
              <span className="font-medium">{mockQuota.subscriptionTotal}</span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-72 rounded-xl border-border bg-popover p-5 text-sm">
            {/* Plan header */}
            <div className="flex items-center justify-between mb-4">
              <p className="font-semibold text-foreground">您的{mockQuota.plan}套餐</p>
              {mockQuota.active && (
                <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-medium text-primary">
                  可用
                </span>
              )}
            </div>

            {/* Quota stats */}
            <div className="space-y-1.5 text-muted-foreground mb-4">
              <p>订阅配额: <span className="font-semibold text-foreground">{mockQuota.subscriptionUsed}</span>/{mockQuota.subscriptionTotal}</p>
              <p>附加配额: <span className="font-semibold text-foreground">{mockQuota.paidQuota}</span></p>
              <p>到期时间: <span className="font-semibold text-foreground">{mockQuota.remainingTime}</span></p>
            </div>

            {/* Model cost list */}
            <div className="border-t border-border pt-3">
              <p className="text-xs text-muted-foreground mb-2">配额使用说明:</p>
              <div className="max-h-40 overflow-y-auto space-y-2.5 workspace-scroll">
                {mockModelsData.model_list.map((m) => (
                  <div key={m.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img src={m.image} alt={m.name} className="h-5 w-5 rounded-full object-cover" />
                      <div>
                        <p className="text-sm font-medium text-foreground leading-tight">{m.name}</p>
                        <p className="text-xs text-muted-foreground">{m.content}</p>
                      </div>
                    </div>
                    {m.price === 0 ? (
                      <span className="text-xs font-medium text-primary">Free</span>
                    ) : (
                      <span className="flex items-center gap-0.5 text-xs font-medium text-primary">
                        <Zap className="h-3 w-3" /> {m.price}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>

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
      <button className="absolute right-4 sm:right-6 lg:right-8 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors cursor-pointer">
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
    <div className="h-px bg-workspace-border/60" />
    </div>
  );
};

export default TopNavBar;
