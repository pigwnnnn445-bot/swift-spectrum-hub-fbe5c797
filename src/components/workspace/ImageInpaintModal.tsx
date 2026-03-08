import { useState, useRef, useEffect, useCallback } from "react";
import { X, Move, Paintbrush, Eraser, Undo2, Redo2, Trash2, ZoomIn, ZoomOut, Minus, Plus, Sparkles } from "lucide-react";
import { Dialog, DialogPortal, DialogOverlay, DialogTitle } from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

/* ─── types ─── */
type ActiveTool = "move" | "brush" | "eraser";

export interface InpaintPayload {
  baseImageUrl: string;
  maskDataUrl: string;
  prompt: string;
}

interface Props {
  open: boolean;
  imageUrl: string;
  /** 本次局部重绘消耗的积分价格 */
  price?: number;
  /** Override z-index for overlay & content (default z-50) */
  overlayClassName?: string;
  onClose: () => void;
  onGenerate: (payload: InpaintPayload) => void;
}

/* ─── constants ─── */
const MIN_BRUSH = 5;
const MAX_BRUSH = 200;
const BRUSH_STEP = 10;
const DEFAULT_BRUSH = 50;
const MAX_HISTORY = 20;
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.25;
const MASK_COLOR = "rgba(99,102,241,0.45)"; // primary-ish translucent

/* ─── helpers ─── */
function buildInpaintPayload(
  baseImageUrl: string,
  maskCanvas: HTMLCanvasElement | null,
  prompt: string,
): InpaintPayload {
  return {
    baseImageUrl,
    maskDataUrl: maskCanvas?.toDataURL("image/png") ?? "",
    prompt: prompt.trim(),
  };
}

/* ─── component ─── */
const ImageInpaintModal = ({ open, imageUrl, price = 0, overlayClassName, onClose, onGenerate }: Props) => {
  /* state */
  const [activeTool, setActiveTool] = useState<ActiveTool>("brush");
  const [brushSize, setBrushSize] = useState(DEFAULT_BRUSH);
  const [zoom, setZoom] = useState(1);
  const [prompt, setPrompt] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasMask, setHasMask] = useState(false);

  /* refs */
  const containerRef = useRef<HTMLDivElement>(null);
  const displayCanvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null); // off-screen mask
  const imgRef = useRef<HTMLImageElement | null>(null);
  const isPaintingRef = useRef(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);

  /* pan state */
  const panRef = useRef({ x: 0, y: 0 });
  const panStartRef = useRef<{ x: number; y: number; px: number; py: number } | null>(null);

  /* undo / redo */
  const historyRef = useRef<ImageData[]>([]);
  const historyIndexRef = useRef(-1);

  /* cursor position for brush outline */
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);

  /* prompt textarea auto-resize */
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const resizePrompt = useCallback(() => {
    const el = promptRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, []);
  useEffect(() => { resizePrompt(); }, [prompt, resizePrompt]);

  /* ─── reset on open ─── */
  useEffect(() => {
    if (!open) return;
    setActiveTool("brush");
    setBrushSize(DEFAULT_BRUSH);
    setZoom(1);
    setPrompt("");
    setIsSubmitting(false);
    setHasMask(false);
    panRef.current = { x: 0, y: 0 };
    historyRef.current = [];
    historyIndexRef.current = -1;
    setCursorPos(null);
  }, [open]);

  /* ─── load image + init canvases ─── */
  useEffect(() => {
    if (!open || !imageUrl) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imgRef.current = img;
      // init mask canvas same size as image
      const mc = maskCanvasRef.current ?? document.createElement("canvas");
      mc.width = img.naturalWidth;
      mc.height = img.naturalHeight;
      const mctx = mc.getContext("2d");
      if (mctx) mctx.clearRect(0, 0, mc.width, mc.height);
      maskCanvasRef.current = mc;
      pushHistory();
      renderAll();
    };
    img.src = imageUrl;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, imageUrl]);

  /* ─── render loop ─── */
  const renderAll = useCallback(() => {
    const dc = displayCanvasRef.current;
    const img = imgRef.current;
    const mc = maskCanvasRef.current;
    if (!dc || !img) return;
    const container = containerRef.current;
    if (!container) return;

    const cw = container.clientWidth;
    const ch = container.clientHeight;
    dc.width = cw;
    dc.height = ch;

    const ctx = dc.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, cw, ch);

    // compute scaled image size to fit container, then apply zoom
    const baseScale = Math.min(cw / img.naturalWidth, ch / img.naturalHeight);
    const scale = baseScale * zoom;
    const iw = img.naturalWidth * scale;
    const ih = img.naturalHeight * scale;
    const ox = (cw - iw) / 2 + panRef.current.x;
    const oy = (ch - ih) / 2 + panRef.current.y;

    ctx.drawImage(img, ox, oy, iw, ih);
    if (mc) ctx.drawImage(mc, 0, 0, mc.width, mc.height, ox, oy, iw, ih);
  }, [zoom]);

  useEffect(() => { if (open) renderAll(); }, [open, zoom, renderAll]);

  /* resize observer */
  useEffect(() => {
    if (!open) return;
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => renderAll());
    ro.observe(el);
    return () => ro.disconnect();
  }, [open, renderAll]);

  /* ─── coordinate helpers ─── */
  const canvasToImage = useCallback((cx: number, cy: number) => {
    const dc = displayCanvasRef.current;
    const img = imgRef.current;
    const container = containerRef.current;
    if (!dc || !img || !container) return null;
    const cw = container.clientWidth;
    const ch = container.clientHeight;
    const baseScale = Math.min(cw / img.naturalWidth, ch / img.naturalHeight);
    const scale = baseScale * zoom;
    const iw = img.naturalWidth * scale;
    const ih = img.naturalHeight * scale;
    const ox = (cw - iw) / 2 + panRef.current.x;
    const oy = (ch - ih) / 2 + panRef.current.y;
    const ix = (cx - ox) / scale;
    const iy = (cy - oy) / scale;
    return { x: ix, y: iy };
  }, [zoom]);

  /* ─── mask painting helpers ─── */
  const paintOnMask = useCallback((x: number, y: number, erase: boolean) => {
    const mc = maskCanvasRef.current;
    if (!mc) return;
    const ctx = mc.getContext("2d")!;
    ctx.globalCompositeOperation = erase ? "destination-out" : "source-over";
    ctx.fillStyle = MASK_COLOR;
    ctx.beginPath();
    ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
    ctx.fill();
  }, [brushSize]);

  const paintLine = useCallback((from: { x: number; y: number }, to: { x: number; y: number }, erase: boolean) => {
    const mc = maskCanvasRef.current;
    if (!mc) return;
    const ctx = mc.getContext("2d")!;
    ctx.globalCompositeOperation = erase ? "destination-out" : "source-over";
    ctx.strokeStyle = MASK_COLOR;
    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  }, [brushSize]);

  /* ─── history helpers ─── */
  const pushHistory = useCallback(() => {
    const mc = maskCanvasRef.current;
    if (!mc) return;
    const ctx = mc.getContext("2d")!;
    const data = ctx.getImageData(0, 0, mc.width, mc.height);
    const h = historyRef.current;
    const idx = historyIndexRef.current;
    // discard future states
    historyRef.current = h.slice(0, idx + 1);
    historyRef.current.push(data);
    if (historyRef.current.length > MAX_HISTORY) historyRef.current.shift();
    historyIndexRef.current = historyRef.current.length - 1;
  }, []);

  const restoreHistory = useCallback((idx: number) => {
    const mc = maskCanvasRef.current;
    if (!mc) return;
    const h = historyRef.current;
    if (idx < 0 || idx >= h.length) return;
    const ctx = mc.getContext("2d")!;
    ctx.putImageData(h[idx], 0, 0);
    historyIndexRef.current = idx;
    checkMask();
    renderAll();
  }, [renderAll]);

  const handleUndo = useCallback(() => {
    const idx = historyIndexRef.current;
    if (idx > 0) restoreHistory(idx - 1);
  }, [restoreHistory]);

  const handleRedo = useCallback(() => {
    const idx = historyIndexRef.current;
    if (idx < historyRef.current.length - 1) restoreHistory(idx + 1);
  }, [restoreHistory]);

  const handleClear = useCallback(() => {
    const mc = maskCanvasRef.current;
    if (!mc) return;
    const ctx = mc.getContext("2d")!;
    ctx.clearRect(0, 0, mc.width, mc.height);
    pushHistory();
    setHasMask(false);
    renderAll();
    toast({ title: "画布已清空" });
  }, [pushHistory, renderAll]);

  /* check if mask has content */
  const checkMask = useCallback(() => {
    const mc = maskCanvasRef.current;
    if (!mc) { setHasMask(false); return; }
    const ctx = mc.getContext("2d")!;
    const data = ctx.getImageData(0, 0, mc.width, mc.height).data;
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] > 0) { setHasMask(true); return; }
    }
    setHasMask(false);
  }, []);

  /* ─── pointer handlers ─── */
  const getPos = useCallback((e: React.PointerEvent) => {
    const rect = displayCanvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    const pos = getPos(e);
    if (activeTool === "move") {
      panStartRef.current = { x: panRef.current.x, y: panRef.current.y, px: e.clientX, py: e.clientY };
      return;
    }
    isPaintingRef.current = true;
    const imgPos = canvasToImage(pos.x, pos.y);
    if (!imgPos) return;
    paintOnMask(imgPos.x, imgPos.y, activeTool === "eraser");
    lastPosRef.current = imgPos;
    renderAll();
  }, [activeTool, canvasToImage, paintOnMask, renderAll, getPos]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const pos = getPos(e);
    setCursorPos(activeTool !== "move" ? pos : null);

    if (activeTool === "move" && panStartRef.current) {
      const dx = e.clientX - panStartRef.current.px;
      const dy = e.clientY - panStartRef.current.py;
      panRef.current = { x: panStartRef.current.x + dx, y: panStartRef.current.y + dy };
      renderAll();
      return;
    }
    if (!isPaintingRef.current) return;
    const imgPos = canvasToImage(pos.x, pos.y);
    if (!imgPos) return;
    if (lastPosRef.current) {
      paintLine(lastPosRef.current, imgPos, activeTool === "eraser");
    }
    lastPosRef.current = imgPos;
    renderAll();
  }, [activeTool, canvasToImage, paintLine, renderAll, getPos]);

  const handlePointerUp = useCallback(() => {
    if (activeTool === "move") { panStartRef.current = null; return; }
    if (isPaintingRef.current) {
      isPaintingRef.current = false;
      lastPosRef.current = null;
      pushHistory();
      checkMask();
    }
  }, [activeTool, pushHistory, checkMask]);

  /* wheel zoom */
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoom((z) => {
      const next = z + (e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP);
      return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(next * 100) / 100));
    });
  }, []);

  /* ─── zoom controls ─── */
  const zoomIn = () => setZoom((z) => Math.min(MAX_ZOOM, Math.round((z + ZOOM_STEP) * 100) / 100));
  const zoomOut = () => setZoom((z) => Math.max(MIN_ZOOM, Math.round((z - ZOOM_STEP) * 100) / 100));

  /* ─── generate ─── */
  const handleGenerate = useCallback(() => {
    if (!hasMask) {
      toast({ title: "请先涂抹需要修改的区域", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    const finalPrompt = prompt.trim() || "基于原始图像自动编辑";
    const payload = buildInpaintPayload(imageUrl, maskCanvasRef.current, finalPrompt);
    onGenerate(payload);
  }, [hasMask, imageUrl, prompt, onGenerate]);

  /* brush cursor size on display canvas */
  const displayBrushRadius = (() => {
    const img = imgRef.current;
    const container = containerRef.current;
    if (!img || !container) return brushSize / 2;
    const cw = container.clientWidth;
    const ch = container.clientHeight;
    const baseScale = Math.min(cw / img.naturalWidth, ch / img.naturalHeight);
    return (brushSize / 2) * baseScale * zoom;
  })();

  /* tool buttons data */
  const tools: { id: ActiveTool; icon: typeof Move; label: string }[] = [
    { id: "move", icon: Move, label: "移动" },
    { id: "brush", icon: Paintbrush, label: "画笔" },
    { id: "eraser", icon: Eraser, label: "橡皮擦" },
  ];

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogPortal>
        <DialogOverlay className={overlayClassName} />
        <DialogPrimitive.Content
          className={cn(
            "fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] z-50 max-w-4xl w-[95vw] h-[90vh] max-h-[90vh] flex flex-col p-0 gap-0 bg-workspace-surface border border-workspace-border overflow-hidden rounded-lg shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            overlayClassName
          )}
          onPointerDownOutside={() => onClose()}
        >
        <DialogTitle className="sr-only">区域重绘</DialogTitle>
        {/* ── header ── */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-workspace-border/60 shrink-0">
          <h2 className="text-base font-semibold text-workspace-surface-foreground">区域重绘</h2>
          <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-workspace-surface-foreground hover:bg-workspace-chip transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── canvas area ── */}
        <div
          ref={containerRef}
          className="flex-1 relative overflow-hidden bg-workspace-panel select-none"
          style={{ cursor: activeTool === "move" ? "grab" : "none" }}
          onWheel={handleWheel}
        >
          <canvas
            ref={displayCanvasRef}
            className="absolute inset-0 w-full h-full"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={() => { handlePointerUp(); setCursorPos(null); }}
          />
          {/* brush cursor overlay */}
          {activeTool !== "move" && cursorPos && (
            <div
              className="pointer-events-none absolute rounded-full border-2 border-primary/70"
              style={{
                width: displayBrushRadius * 2,
                height: displayBrushRadius * 2,
                left: cursorPos.x - displayBrushRadius,
                top: cursorPos.y - displayBrushRadius,
              }}
            />
          )}
        </div>

        {/* ── bottom toolbar ── */}
        <div className="shrink-0 border-t border-workspace-border/60 px-4 py-3 flex flex-col gap-3">
          {/* row 1: tools left | aux right */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            {/* tools */}
            <div className="flex items-center gap-1">
              <TooltipProvider delayDuration={200}>
                {tools.map((t) => (
                  <Tooltip key={t.id}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setActiveTool(t.id)}
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                          activeTool === t.id
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:text-workspace-surface-foreground hover:bg-workspace-chip"
                        )}
                      >
                        <t.icon className="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top">{t.label}</TooltipContent>
                  </Tooltip>
                ))}
              </TooltipProvider>

              {/* brush size — only for brush / eraser */}
              {activeTool !== "move" && (
                <div className="flex items-center gap-2 ml-3 pl-3 border-l border-workspace-border/40">
                  <button onClick={() => setBrushSize((s) => Math.max(MIN_BRUSH, s - BRUSH_STEP))} className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:text-workspace-surface-foreground hover:bg-workspace-chip transition-colors">
                    <Minus className="h-3 w-3" />
                  </button>
                  <Slider
                    value={[brushSize]}
                    onValueChange={([v]) => setBrushSize(v)}
                    min={MIN_BRUSH}
                    max={MAX_BRUSH}
                    step={1}
                    className="w-24"
                  />
                  <button onClick={() => setBrushSize((s) => Math.min(MAX_BRUSH, s + BRUSH_STEP))} className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:text-workspace-surface-foreground hover:bg-workspace-chip transition-colors">
                    <Plus className="h-3 w-3" />
                  </button>
                  <span className="text-xs text-muted-foreground w-8 text-center tabular-nums">{brushSize}</span>
                </div>
              )}
            </div>

            {/* aux: undo/redo/clear + zoom */}
            <div className="flex items-center gap-1">
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button onClick={handleUndo} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-workspace-surface-foreground hover:bg-workspace-chip transition-colors">
                      <Undo2 className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top">上一步</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button onClick={handleRedo} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-workspace-surface-foreground hover:bg-workspace-chip transition-colors">
                      <Redo2 className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top">下一步</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button onClick={handleClear} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-workspace-surface-foreground hover:bg-workspace-chip transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top">清除</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <div className="flex items-center gap-0.5 ml-2 pl-2 border-l border-workspace-border/40">
                <button onClick={zoomOut} className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:text-workspace-surface-foreground hover:bg-workspace-chip transition-colors">
                  <ZoomOut className="h-3.5 w-3.5" />
                </button>
                <span className="text-xs text-muted-foreground w-10 text-center tabular-nums">{Math.round(zoom * 100)}%</span>
                <button onClick={zoomIn} className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:text-workspace-surface-foreground hover:bg-workspace-chip transition-colors">
                  <ZoomIn className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* row 2: prompt + generate */}
          <div className="flex items-end gap-3">
            <textarea
              ref={promptRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="基于原始图像自动编辑"
              className="flex-1 rounded-lg border border-workspace-border/60 bg-workspace-panel px-3 py-2 text-sm text-workspace-surface-foreground placeholder:text-muted-foreground/60 resize-none focus:outline-none focus:ring-1 focus:ring-primary/40 workspace-scroll"
              style={{ minHeight: 40, maxHeight: 160 }}
              rows={1}
            />
            <button
              onClick={() => console.log("open prompt generator")}
              className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 h-8 text-xs font-medium text-primary hover:bg-primary/20 transition-colors cursor-pointer shrink-0"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">提示词生成器</span>
            </button>
            <button
              onClick={handleGenerate}
              disabled={isSubmitting}
              className="inline-flex items-center justify-center whitespace-nowrap transition-all disabled:opacity-60 disabled:cursor-not-allowed shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] bg-gradient-to-r from-primary to-workspace-neon h-8 w-8 sm:w-auto sm:px-3 text-sm font-bold rounded-full text-white gap-1"
            >
              <span className="hidden sm:inline">发送</span>
              <span>⚡</span>
              <span className="hidden sm:inline text-white/70">{price > 0 ? price : 1}</span>
            </button>
          </div>
        </div>
      </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
};

export default ImageInpaintModal;
