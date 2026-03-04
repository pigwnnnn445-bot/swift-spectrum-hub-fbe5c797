import { useState } from "react";
import { HelpCircle, Zap } from "lucide-react";
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
    <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-background/80 backdrop-blur-sm sm:px-6 lg:px-8">
      {/* Left: title + quota */}
      <div className="flex items-center gap-3">
        <h1 className="text-base font-semibold text-foreground whitespace-nowrap">
          图像生成
        </h1>

        <Popover>
          <PopoverTrigger asChild>
            <button className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs text-muted-foreground hover:bg-accent transition-colors">
              <HelpCircle className="h-3.5 w-3.5" />
              <span className="font-medium text-foreground">
                {mockQuota.used}/{mockQuota.total}
              </span>
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            className="w-56 rounded-xl border-border bg-popover p-4 text-sm"
          >
            <p className="mb-3 font-semibold text-foreground">配额信息</p>
            <div className="space-y-2 text-muted-foreground">
              <div className="flex justify-between">
                <span>当前套餐</span>
                <span className="text-foreground">{mockQuota.plan}</span>
              </div>
              <div className="flex justify-between">
                <span>总配额</span>
                <span className="text-foreground">{mockQuota.total}</span>
              </div>
              <div className="flex justify-between">
                <span>已用配额</span>
                <span className="text-foreground">{mockQuota.used}</span>
              </div>
              <div className="flex justify-between">
                <span>剩余配额</span>
                <span className="text-foreground">{mockQuota.remain}</span>
              </div>
              <div className="flex justify-between">
                <span>重置时间</span>
                <span className="text-foreground">{mockQuota.resetDate}</span>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Right: upgrade */}
      <Button
        size="sm"
        onClick={() => setUpgradeOpen(true)}
        className="gap-1.5 rounded-lg text-xs"
      >
        <Zap className="h-3.5 w-3.5" />
        升级
      </Button>

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
