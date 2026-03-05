import { cn } from "@/lib/utils";

interface RatioSelectorProps {
  options: string[];
  selected: string;
  onSelect: (value: string) => void;
}

const RatioSelector = ({ options, selected, onSelect }: RatioSelectorProps) => {
  if (options.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onSelect(opt)}
          className={cn(
            "rounded-lg px-3 py-1 text-xs font-medium border transition-all cursor-pointer",
            selected === opt
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-workspace-chip/50 text-workspace-panel-foreground/80 border-workspace-border hover:bg-workspace-chip"
          )}
        >
          {opt}
        </button>
      ))}
    </div>
  );
};

export default RatioSelector;
