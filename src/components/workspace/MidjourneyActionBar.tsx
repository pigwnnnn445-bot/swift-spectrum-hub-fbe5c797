import { Download, RefreshCw, ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Maximize2, Wand2, ZoomOut } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import type { MjStage, MjAction } from "@/types/task";

interface MidjourneyActionBarProps {
  stage: MjStage;
  onAction: (action: MjAction) => void;
  onDownload?: () => void;
}

const chipBtn =
  "flex items-center gap-1.5 h-9 px-4 rounded-full border border-workspace-border/60 bg-workspace-chip/40 text-sm text-workspace-surface-foreground hover:bg-workspace-chip transition-colors duration-150 cursor-pointer active:scale-[0.97] select-none";

const iconBtn =
  "flex h-9 w-9 items-center justify-center rounded-full border border-workspace-border/60 bg-workspace-chip/40 text-workspace-surface-foreground hover:bg-workspace-chip transition-colors duration-150 cursor-pointer active:scale-[0.97]";

const downloadBtn =
  "flex items-center gap-1.5 h-9 px-5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors duration-150 cursor-pointer active:scale-[0.97] select-none";

const MidjourneyActionBar = ({ stage, onAction, onDownload }: MidjourneyActionBarProps) => {
  if (stage === "initial") {
    return (
      <div className="flex flex-wrap items-center gap-2 pt-3">
        <TooltipProvider delayDuration={200}>
          {/* U1-U4 + Refresh */}
          <div className="flex items-center gap-2">
            {(["U1", "U2", "U3", "U4"] as MjAction[]).map((a) => (
              <button key={a} onClick={() => onAction(a)} className={chipBtn}>{a}</button>
            ))}
            <Tooltip>
              <TooltipTrigger asChild>
                <button onClick={() => onAction("refresh")} className={iconBtn}>
                  <RefreshCw className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">重新生成</TooltipContent>
            </Tooltip>
          </div>
          {/* V1-V4 + Download */}
          <div className="flex items-center gap-2">
            {(["V1", "V2", "V3", "V4"] as MjAction[]).map((a) => (
              <button key={a} onClick={() => onAction(a)} className={chipBtn}>{a}</button>
            ))}
            {onDownload && (
              <button onClick={onDownload} className={downloadBtn}>
                <Download className="h-4 w-4" />
                <span>下载</span>
              </button>
            )}
          </div>
        </TooltipProvider>
      </div>
    );
  }

  if (stage === "upscaled") {
    return (
      <div className="flex flex-wrap items-center gap-2 pt-3">
        <TooltipProvider delayDuration={200}>
          {/* Row 1: Upscale + Vary */}
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => onAction("upscale_subtle")} className={chipBtn}>
              <Maximize2 className="h-3.5 w-3.5" /> Upscale (Subtle)
            </button>
            <button onClick={() => onAction("upscale_creative")} className={chipBtn}>
              <Maximize2 className="h-3.5 w-3.5" /> Upscale (Creative)
            </button>
            <button onClick={() => onAction("vary_subtle")} className={chipBtn}>
              <Wand2 className="h-3.5 w-3.5" /> Vary (Subtle)
            </button>
            <button onClick={() => onAction("vary_strong")} className={chipBtn}>
              <Wand2 className="h-3.5 w-3.5" /> Vary (Strong)
            </button>
          </div>
          {/* Row 2: Zoom Out + Arrows + Download */}
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => onAction("zoom_out_2x")} className={chipBtn}>
              <ZoomOut className="h-3.5 w-3.5" /> Zoom Out 2x
            </button>
            <button onClick={() => onAction("zoom_out_1_5x")} className={chipBtn}>
              <ZoomOut className="h-3.5 w-3.5" /> Zoom Out 1.5x
            </button>
            <Tooltip>
              <TooltipTrigger asChild>
                <button onClick={() => onAction("pan_left")} className={iconBtn}>
                  <ArrowLeft className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">向左平移</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button onClick={() => onAction("pan_right")} className={iconBtn}>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">向右平移</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button onClick={() => onAction("pan_up")} className={iconBtn}>
                  <ArrowUp className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">向上平移</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button onClick={() => onAction("pan_down")} className={iconBtn}>
                  <ArrowDown className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">向下平移</TooltipContent>
            </Tooltip>
            {onDownload && (
              <button onClick={onDownload} className={downloadBtn}>
                <Download className="h-4 w-4" />
                <span>下载</span>
              </button>
            )}
          </div>
        </TooltipProvider>
      </div>
    );
  }

  if (stage === "upscaled_max") {
    return (
      <div className="flex flex-wrap items-center gap-2 pt-3">
        <button onClick={() => onAction("redo_upscale_subtle")} className={chipBtn}>
          <Maximize2 className="h-3.5 w-3.5" /> Redo Upscale (Subtle)
        </button>
        <button onClick={() => onAction("redo_upscale_creative")} className={chipBtn}>
          <Maximize2 className="h-3.5 w-3.5" /> Redo Upscale (Creative)
        </button>
        <button onClick={() => onAction("vary_subtle")} className={chipBtn}>
          <Wand2 className="h-3.5 w-3.5" /> Vary (Subtle)
        </button>
        <button onClick={() => onAction("vary_strong")} className={chipBtn}>
          <Wand2 className="h-3.5 w-3.5" /> Vary (Strong)
        </button>
        {onDownload && (
          <button onClick={onDownload} className={downloadBtn}>
            <Download className="h-4 w-4" />
            <span>下载</span>
          </button>
        )}
      </div>
    );
  }

  return null;
};

export default MidjourneyActionBar;
