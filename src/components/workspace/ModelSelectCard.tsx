import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ModelConfig } from "@/config/modelConfig";

interface ModelSelectCardProps {
  models: ModelConfig[];
  selected: ModelConfig;
  onSelect: (model: ModelConfig) => void;
}

const ModelSelectCard = ({ models, selected, onSelect }: ModelSelectCardProps) => {
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
      {/* Trigger */}
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-3 rounded-xl border border-workspace-border bg-workspace-chip/50 p-3 cursor-pointer hover:bg-workspace-chip transition-colors text-left"
      >
        <img
          src={selected.image}
          alt={selected.name}
          className="h-10 w-10 shrink-0 rounded-lg object-cover"
        />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-workspace-surface-foreground">{selected.name}</div>
        </div>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-workspace-panel-foreground/50 transition-transform", open && "rotate-180")} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-xl border border-workspace-border bg-workspace-panel shadow-lg overflow-hidden max-h-[400px] overflow-y-auto workspace-scroll">
          {models.map((model) => (
            <button
              key={model.id}
              onClick={() => { onSelect(model); setOpen(false); }}
              className={cn(
                "flex w-full items-start gap-3 p-3 text-left transition-colors hover:bg-workspace-chip/60",
                model.id === selected.id && "bg-workspace-chip/40"
              )}
            >
              <img
                src={model.image}
                alt={model.name}
                className="h-10 w-10 shrink-0 rounded-lg object-cover"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-workspace-surface-foreground">{model.name}</span>
                  <span className="text-[10px] text-workspace-panel-foreground/40">⚡{model.price}</span>
                </div>
                <div className="mt-0.5 text-xs text-workspace-panel-foreground/60 leading-relaxed line-clamp-2">
                  {model.content}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ModelSelectCard;
