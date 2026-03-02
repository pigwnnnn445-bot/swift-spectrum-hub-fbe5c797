import { useState } from "react";
import { cn } from "@/lib/utils";
import { Upload } from "lucide-react";
import type { UploadRefConfig } from "@/config/modelConfig";

interface UploadReferencePanelProps {
  config: UploadRefConfig;
}

const UploadReferencePanel = ({ config }: UploadReferencePanelProps) => {
  const [activeType, setActiveType] = useState(config.types?.[0]?.id ?? "upload");

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
        multi={config.multiUpload}
        placeholder="点击或拖动图片上传"
      />
    </div>
  );
};

const UploadZone = ({ multi, placeholder }: { multi: boolean; placeholder: string }) => {
  const count = multi ? 2 : 1;
  return (
    <div className={cn("grid gap-2", multi ? "grid-cols-2" : "grid-cols-1")}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-workspace-border/60 bg-workspace-chip/20 transition-colors hover:border-primary/40 hover:bg-workspace-chip/40"
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
