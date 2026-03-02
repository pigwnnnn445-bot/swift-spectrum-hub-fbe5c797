import { cn } from "@/lib/utils";

interface StyleSelectorProps {
  styles: string[];
  selected: string;
  onSelect: (style: string) => void;
}

const StyleSelector = ({ styles, selected, onSelect }: StyleSelectorProps) => {
  return (
    <div className="flex flex-wrap gap-2">
      {styles.map((style) => (
        <button
          key={style}
          onClick={() => onSelect(style)}
          className={cn(
            "rounded-[10px] px-3 py-1.5 text-xs font-medium transition-all border",
            selected === style
              ? "bg-primary text-primary-foreground border-primary shadow-[0_0_12px_hsl(var(--workspace-glow))]"
              : "bg-workspace-chip/50 text-workspace-panel-foreground/80 border-workspace-border hover:bg-workspace-chip"
          )}
        >
          {style}
        </button>
      ))}
    </div>
  );
};

export default StyleSelector;
