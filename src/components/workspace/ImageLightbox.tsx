import { useState, useRef, useCallback, useEffect } from "react";
import { X, ZoomIn, ZoomOut } from "lucide-react";

interface ImageLightboxProps {
  src: string;
  alt?: string;
  onClose: () => void;
}

const ImageLightbox = ({ src, alt = "大图", onClose }: ImageLightboxProps) => {
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleZoomIn = useCallback(() => {
    setScale((s) => Math.min(s * 1.5, 5));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale((s) => {
      const next = s / 1.5;
      if (next <= 1) { setTranslate({ x: 0, y: 0 }); return 1; }
      return next;
    });
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setScale((s) => Math.min(s * 1.15, 5));
    } else {
      setScale((s) => {
        const next = s / 1.15;
        if (next <= 1) { setTranslate({ x: 0, y: 0 }); return 1; }
        return next;
      });
    }
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (scale <= 1) return;
    isDragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [scale]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };
    setTranslate((t) => ({ x: t.x + dx, y: t.y + dy }));
  }, []);

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === containerRef.current && scale <= 1) onClose();
  }, [onClose, scale]);

  const handleDoubleClick = useCallback(() => {
    if (scale > 1) { setScale(1); setTranslate({ x: 0, y: 0 }); }
    else setScale(2.5);
  }, [scale]);

  return (
    <div className="fixed inset-0 z-[300] flex flex-col bg-black/95">
      <div className="flex items-center justify-between px-4 py-3 shrink-0">
        <span className="text-xs text-white/50">
          {scale > 1 ? `${Math.round(scale * 100)}%` : "双击放大"}
        </span>
        <div className="flex items-center gap-2">
          <button onClick={handleZoomOut} disabled={scale <= 1}
            className="flex h-8 w-8 items-center justify-center rounded-full text-white/70 hover:bg-white/10 transition disabled:opacity-30 cursor-pointer">
            <ZoomOut className="h-4 w-4" />
          </button>
          <button onClick={handleZoomIn} disabled={scale >= 5}
            className="flex h-8 w-8 items-center justify-center rounded-full text-white/70 hover:bg-white/10 transition disabled:opacity-30 cursor-pointer">
            <ZoomIn className="h-4 w-4" />
          </button>
          <button onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-white/70 hover:bg-white/10 transition cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
      <div ref={containerRef}
        className="flex-1 flex items-center justify-center overflow-hidden touch-none select-none"
        onClick={handleBackdropClick} onWheel={handleWheel}
        onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp}>
        <img src={src} alt={alt} onDoubleClick={handleDoubleClick} draggable={false}
          className="max-w-[95vw] max-h-[85vh] object-contain transition-transform duration-150 ease-out"
          style={{
            transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
            cursor: scale > 1 ? "grab" : "zoom-in",
          }}
        />
      </div>
    </div>
  );
};

export default ImageLightbox;