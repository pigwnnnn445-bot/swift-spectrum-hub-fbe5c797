import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { Upload, Minus, Plus, X } from "lucide-react";
import { toast } from "sonner";
import type { UploadRefConfig } from "@/config/modelConfig";

const ACCEPTED_FORMATS = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
const MAX_SIZE_MB = 10;
const MIN_RESOLUTION = 300;

interface UploadReferencePanelProps {
  config: UploadRefConfig;
}

const UploadReferencePanel = ({ config }: UploadReferencePanelProps) => {
  const [activeType, setActiveType] = useState(config.types?.[0]?.id ?? "upload");
  const [similarity, setSimilarity] = useState(50);

  const isPerson = activeType === "person";

  const handleSimilarityChange = (delta: number) => {
    setSimilarity((prev) => Math.min(100, Math.max(0, prev + delta)));
  };

  // Simple mode: just upload area(s)
  if (config.mode === "simple") {
    return (
      <div className="space-y-3">
        <UploadZone
          multi={config.multiUpload}
          placeholder={config.placeholder ?? "将图片拖至此处或单击上传"}
        />
      </div>
    );
  }

  // Typed mode: tabs for each type
  return (
    <div className="space-y-3">
      {/* Type tabs */}
      {config.types && config.types.length > 0 && (
        <div className="flex gap-1 rounded-[10px] bg-workspace-chip/50 p-1">
          {config.types.map((type) => (
            <button
              key={type.id}
              onClick={() => setActiveType(type.id)}
              className={cn(
                "flex-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-all",
                activeType === type.id
                  ? "bg-primary text-primary-foreground"
                  : "text-workspace-panel-foreground/60 hover:text-workspace-panel-foreground/80"
              )}
            >
              {type.label}
            </button>
          ))}
        </div>
      )}

      {/* Upload areas */}
      <UploadZone
        multi={isPerson ? false : config.multiUpload}
        placeholder="单击或拖动图像即可上传"
      />

      {/* Similarity control for person type */}
      {isPerson && (
        <div className="flex flex-col items-center gap-2 pt-1">
          <span className="text-xs text-workspace-panel-foreground/60">相似</span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleSimilarityChange(-5)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-workspace-chip hover:bg-workspace-chip-active/30 transition-colors"
            >
              <Minus className="h-4 w-4 text-workspace-panel-foreground" />
            </button>
            <span className="min-w-[2.5rem] text-center text-sm font-medium text-workspace-panel-foreground">
              {similarity}
            </span>
            <button
              onClick={() => handleSimilarityChange(5)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-workspace-chip hover:bg-workspace-chip-active/30 transition-colors"
            >
              <Plus className="h-4 w-4 text-workspace-panel-foreground" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const UploadZone = ({ multi, placeholder }: { multi: boolean; placeholder: string }) => {
  const single = !multi;
  const count = multi ? 2 : 1;
  return (
    <div className={cn("grid gap-2", multi ? "grid-cols-2" : "grid-cols-1")}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-workspace-border/60 bg-workspace-chip/20 transition-colors hover:border-primary/40 hover:bg-workspace-chip/40",
            single ? "aspect-video" : "aspect-square"
          )}
        >
          <Upload className="mb-1 h-5 w-5 text-workspace-panel-foreground/40" />
          <span className="text-[10px] text-workspace-panel-foreground/40 text-center px-1">
            {placeholder}
          </span>
        </div>
      ))}
    </div>
  );
};

export default UploadReferencePanel;
