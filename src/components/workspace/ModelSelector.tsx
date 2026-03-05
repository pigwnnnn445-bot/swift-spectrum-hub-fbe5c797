import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ModelConfig } from "@/config/modelConfig";

interface ModelSelectorProps {
  models: ModelConfig[];
  selected: ModelConfig;
  onSelect: (model: ModelConfig) => void;
}

const ModelSelector = ({ models, selected, onSelect }: ModelSelectorProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg border border-workspace-border bg-workspace-chip/50 px-3 py-1.5 cursor-pointer hover:bg-workspace-chip transition-colors text-left"
      >
        <img src={selected.image} alt={selected.name} className="h-5 w-5 rounded object-cover shrink-0" />
        <span className="text-sm text-workspace-surface-foreground truncate max-w-[140px]">{selected.name}</span>
        <ChevronDown className={cn("h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute left-0 bottom-full z-50 mb-1 rounded-xl border border-workspace-border bg-workspace-panel shadow-lg overflow-hidden max-h-[300px] overflow-y-auto workspace-scroll min-w-[240px]">
          {models.map((model) => (
            <button
              key={model.id}
              onClick={() => { onSelect(model); setOpen(false); }}
              className={cn(
                "flex w-full items-center gap-2.5 p-2.5 text-left transition-colors hover:bg-workspace-chip/60",
                model.id === selected.id && "bg-workspace-chip/40"
              )}
            >
              <img src={model.image} alt={model.name} className="h-8 w-8 shrink-0 rounded-lg object-cover" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-workspace-surface-foreground">{model.name}</div>
                <div className="text-[10px] text-muted-foreground line-clamp-1">{model.content}</div>
              </div>
              <span className="text-[10px] text-muted-foreground shrink-0">⚡{model.price}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ModelSelector;
