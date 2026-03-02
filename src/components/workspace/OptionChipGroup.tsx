import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp } from "lucide-react";

interface OptionChipGroupProps {
  options: string[];
  selected: string;
  onSelect: (value: string) => void;
  /** 一行最多显示几个，超出则折叠，需点击"更多"展开 */
  maxVisible?: number;
}

const OptionChipGroup = ({ options, selected, onSelect, maxVisible }: OptionChipGroupProps) => {
  const [expanded, setExpanded] = useState(false);

  const shouldCollapse = maxVisible != null && options.length > maxVisible;
  const visibleOptions = shouldCollapse && !expanded ? options.slice(0, maxVisible) : options;

  return (
    <div className="flex flex-wrap gap-2">
      {visibleOptions.map((option) => (
        <button
          key={option}
          onClick={() => onSelect(option)}
          className={cn(
            "rounded-[10px] px-4 py-1.5 text-sm font-medium transition-all",
            "border",
            selected === option
              ? "bg-primary text-primary-foreground border-primary shadow-[0_0_12px_hsl(var(--workspace-glow))]"
              : "bg-workspace-chip/50 text-workspace-panel-foreground/80 border-workspace-border hover:bg-workspace-chip"
          )}
        >
          {option}
        </button>
      ))}
      {shouldCollapse && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="rounded-[10px] border border-workspace-border bg-workspace-chip/30 px-3 py-1.5 text-xs text-workspace-panel-foreground/60 hover:text-workspace-panel-foreground/80 transition-colors flex items-center gap-1"
        >
          {expanded ? "收起" : "更多"}
          {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>
      )}
    </div>
  );
};

export default OptionChipGroup;
