import { useState } from "react";
import { cn } from "@/lib/utils";
import { Upload } from "lucide-react";

const UploadReferencePanel = () => {
  const [activeTab, setActiveTab] = useState("upload");
  const [imageMode, setImageMode] = useState("multi");

  const tabs = [
    { id: "upload", label: "仅上传图片" },
    { id: "style", label: "风格参考" },
    { id: "person", label: "人物参考" },
  ];

  const modes = [
    { id: "single", label: "单张图" },
    { id: "multi", label: "多张图" },
  ];

  return (
    <div className="space-y-3">
      {/* Tabs */}
      <div className="flex gap-1 rounded-[10px] bg-workspace-chip/50 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-all",
              activeTab === tab.id
                ? "bg-primary text-primary-foreground"
                : "text-workspace-panel-foreground/60 hover:text-workspace-panel-foreground/80"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Mode toggle */}
      <div className="flex gap-1 rounded-[10px] bg-workspace-chip/50 p-1">
        {modes.map((mode) => (
          <button
            key={mode.id}
            onClick={() => setImageMode(mode.id)}
            className={cn(
              "flex-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
              imageMode === mode.id
                ? "bg-workspace-chip text-workspace-surface-foreground"
                : "text-workspace-panel-foreground/60 hover:text-workspace-panel-foreground/80"
            )}
          >
            {mode.label}
          </button>
        ))}
      </div>

      {/* Upload areas */}
      <div className="grid grid-cols-2 gap-2">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-workspace-border/60 bg-workspace-chip/20 transition-colors hover:border-primary/40 hover:bg-workspace-chip/40"
          >
            <Upload className="mb-1 h-5 w-5 text-workspace-panel-foreground/40" />
            <span className="text-[10px] text-workspace-panel-foreground/40 text-center px-1">
              点击或拖动图片上传
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UploadReferencePanel;
