import { ChevronDown } from "lucide-react";

interface ModelSelectCardProps {
  name: string;
  subtitle: string;
  icon?: string;
}

const ModelSelectCard = ({ name, subtitle }: ModelSelectCardProps) => {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-workspace-border bg-workspace-chip/50 p-3 cursor-pointer hover:bg-workspace-chip transition-colors">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/20">
        <span className="text-lg">🍌</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-workspace-surface-foreground">{name}</div>
        <div className="mt-0.5 text-xs text-workspace-panel-foreground/60 leading-relaxed line-clamp-2">{subtitle}</div>
      </div>
      <ChevronDown className="h-4 w-4 shrink-0 text-workspace-panel-foreground/50 mt-1" />
    </div>
  );
};

export default ModelSelectCard;
