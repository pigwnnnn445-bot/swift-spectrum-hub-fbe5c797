import { cn } from "@/lib/utils";

interface OptionChipGroupProps {
  options: string[];
  selected: string;
  onSelect: (value: string) => void;
  extra?: React.ReactNode;
}

const OptionChipGroup = ({ options, selected, onSelect, extra }: OptionChipGroupProps) => {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
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
      {extra}
    </div>
  );
};

export default OptionChipGroup;
