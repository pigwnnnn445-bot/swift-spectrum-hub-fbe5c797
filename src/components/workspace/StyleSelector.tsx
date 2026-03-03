import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, Check } from "lucide-react";
import type { StyleResource } from "@/config/modelConfig";

interface StyleSelectorProps {
  resources: StyleResource[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}

const StyleSelector = ({ resources, selectedId, onSelect }: StyleSelectorProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = resources.find((r) => r.id === selectedId) ?? resources[0];

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
        className="flex w-full items-center gap-3 rounded-xl border border-workspace-border bg-workspace-chip/50 p-2.5 cursor-pointer hover:bg-workspace-chip transition-colors text-left"
      >
        <img
          src={selected?.image}
          alt={selected?.resource_name}
          className="h-10 w-10 rounded-lg object-cover shrink-0"
        />
        <span className="flex-1 text-sm text-workspace-panel-foreground/80">{selected?.resource_name}</span>
        {open
          ? <ChevronUp className="h-4 w-4 shrink-0 text-workspace-panel-foreground/50" />
          : <ChevronDown className="h-4 w-4 shrink-0 text-workspace-panel-foreground/50" />
        }
      </button>

      {/* Dropdown grid */}
      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-[360px] overflow-y-auto rounded-xl border border-workspace-border bg-workspace-panel shadow-lg workspace-scroll p-2">
          <div className="grid grid-cols-4 gap-1.5">
            {resources.map((res) => (
              <button
                key={res.id}
                onClick={() => { onSelect(res.id); setOpen(false); }}
                className={cn(
                  "group relative flex flex-col items-center gap-1 rounded-lg p-1.5 transition-colors",
                  selectedId === res.id
                    ? "bg-workspace-chip"
                    : "hover:bg-workspace-chip/60"
                )}
              >
                <div className="relative w-full aspect-square rounded-lg overflow-hidden">
                  <img
                    src={res.image}
                    alt={res.resource_name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                  {selectedId === res.id && (
                    <div className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary">
                      <Check className="h-2.5 w-2.5 text-primary-foreground" />
                    </div>
                  )}
                </div>
                <span className={cn(
                  "text-[10px] leading-tight text-center truncate w-full",
                  selectedId === res.id
                    ? "text-workspace-surface-foreground font-medium"
                    : "text-workspace-panel-foreground/60"
                )}>
                  {res.resource_name}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StyleSelector;
