import { ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Maximize2, Wand2, ZoomOut } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import type { MjStage, MjAction } from "@/types/task";

interface MidjourneyActionBarProps {
  stage: MjStage;
  onAction: (action: MjAction) => void;
}

const gridBtn =
  "inline-flex items-center justify-center gap-1.5 h-10 px-5 rounded-xl border border-workspace-border/50 bg-workspace-chip/30 text-sm font-medium text-workspace-surface-foreground hover:bg-workspace-chip hover:border-workspace-border transition-all duration-150 cursor-pointer active:scale-[0.96] select-none";

const iconBtn =
  "flex h-10 w-10 items-center justify-center rounded-xl border border-workspace-border/50 bg-workspace-chip/30 text-workspace-surface-foreground hover:bg-workspace-chip hover:border-workspace-border transition-all duration-150 cursor-pointer active:scale-[0.96]";

const MidjourneyActionBar = ({ stage, onAction }: MidjourneyActionBarProps) => {
  if (stage === "initial") {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-2">
          {(["U1", "U2", "U3", "U4"] as MjAction[]).map((a) => (
            <button key={a} onClick={() => onAction(a)} className={gridBtn}>{a}</button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {(["V1", "V2", "V3", "V4"] as MjAction[]).map((a) => (
            <button key={a} onClick={() => onAction(a)} className={gridBtn}>{a}</button>
          ))}
        </div>
      </div>
    );
  }

  if (stage === "upscaled") {
    return (
      <TooltipProvider delayDuration={200}>
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <button onClick={() => onAction("upscale_subtle")} className={gridBtn}>
              <Maximize2 className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">Subtle</span>
            </button>
            <button onClick={() => onAction("upscale_creative")} className={gridBtn}>
              <Maximize2 className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">Creative</span>
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => onAction("vary_subtle")} className={gridBtn}>
              <Wand2 className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">Vary Subtle</span>
            </button>
            <button onClick={() => onAction("vary_strong")} className={gridBtn}>
              <Wand2 className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">Vary Strong</span>
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => onAction("zoom_out_2x")} className={gridBtn}>
              <ZoomOut className="h-3.5 w-3.5 shrink-0" /> 2x
            </button>
            <button onClick={() => onAction("zoom_out_1_5x")} className={gridBtn}>
              <ZoomOut className="h-3.5 w-3.5 shrink-0" /> 1.5x
            </button>
            <Tooltip>
              <TooltipTrigger asChild>
                <button onClick={() => onAction("pan_left")} className={iconBtn}><ArrowLeft className="h-4 w-4" /></button>
              </TooltipTrigger>
              <TooltipContent side="top">向左平移</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button onClick={() => onAction("pan_right")} className={iconBtn}><ArrowRight className="h-4 w-4" /></button>
              </TooltipTrigger>
              <TooltipContent side="top">向右平移</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button onClick={() => onAction("pan_up")} className={iconBtn}><ArrowUp className="h-4 w-4" /></button>
              </TooltipTrigger>
              <TooltipContent side="top">向上平移</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button onClick={() => onAction("pan_down")} className={iconBtn}><ArrowDown className="h-4 w-4" /></button>
              </TooltipTrigger>
              <TooltipContent side="top">向下平移</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </TooltipProvider>
    );
  }

  if (stage === "upscaled_max") {
    return (
      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => onAction("redo_upscale_subtle")} className={gridBtn}>
          <Maximize2 className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">Redo Subtle</span>
        </button>
        <button onClick={() => onAction("redo_upscale_creative")} className={gridBtn}>
          <Maximize2 className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">Redo Creative</span>
        </button>
        <button onClick={() => onAction("vary_subtle")} className={gridBtn}>
          <Wand2 className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">Vary Subtle</span>
        </button>
        <button onClick={() => onAction("vary_strong")} className={gridBtn}>
          <Wand2 className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">Vary Strong</span>
        </button>
      </div>
    );
  }

  return null;
};

export default MidjourneyActionBar;
