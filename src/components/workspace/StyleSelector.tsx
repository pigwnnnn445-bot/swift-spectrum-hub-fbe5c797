import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, Check } from "lucide-react";

interface StyleSelectorProps {
  styles: string[];
  selected: string;
  onSelect: (style: string) => void;
}

/**
 * 每个风格对应一个渐变色作为缩略图占位
 * TODO: 后续替换为后端返回的风格预览图 URL
 */
const styleGradients: Record<string, string> = {
  "自动": "from-violet-500/60 to-fuchsia-500/60",
  "印象派": "from-amber-400/60 to-rose-400/60",
  "卡通": "from-pink-400/60 to-sky-400/60",
  "折纸": "from-rose-300/60 to-orange-200/60",
  "花札": "from-red-500/60 to-pink-300/60",
  "龙珠": "from-orange-400/60 to-yellow-300/60",
  "雕塑": "from-stone-400/60 to-slate-300/60",
  "4D": "from-cyan-400/60 to-teal-300/60",
  "草图": "from-gray-300/60 to-stone-200/60",
  "毛绒玩具": "from-amber-200/60 to-yellow-100/60",
  "毛毡": "from-emerald-400/60 to-lime-300/60",
  "洛可可": "from-pink-300/60 to-amber-200/60",
  "蒸汽朋克": "from-amber-600/60 to-stone-500/60",
  "吉卜力": "from-green-400/60 to-sky-300/60",
  "巴洛克": "from-yellow-600/60 to-red-400/60",
  "波西米亚风格": "from-orange-300/60 to-rose-300/60",
  "未来主义": "from-blue-500/60 to-violet-500/60",
  "Funko Pop": "from-yellow-400/60 to-pink-400/60",
  "包豪斯": "from-red-500/60 to-blue-500/60",
  "波普艺术": "from-yellow-300/60 to-red-500/60",
  "赛博朋克": "from-fuchsia-500/60 to-cyan-400/60",
  "地中海": "from-blue-400/60 to-cyan-200/60",
  "像素风": "from-green-500/60 to-emerald-300/60",
  "极简主义": "from-slate-200/60 to-gray-100/60",
  "写实": "from-stone-500/60 to-gray-400/60",
};

const getGradient = (style: string) =>
  styleGradients[style] ?? "from-primary/40 to-workspace-neon/30";

const StyleSelector = ({ styles, selected, onSelect }: StyleSelectorProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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
        <div className={cn("h-10 w-10 rounded-lg bg-gradient-to-br shrink-0", getGradient(selected))} />
        <span className="flex-1 text-sm text-workspace-panel-foreground/80">{selected}</span>
        {open
          ? <ChevronUp className="h-4 w-4 shrink-0 text-workspace-panel-foreground/50" />
          : <ChevronDown className="h-4 w-4 shrink-0 text-workspace-panel-foreground/50" />
        }
      </button>

      {/* Dropdown grid */}
      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-[360px] overflow-y-auto rounded-xl border border-workspace-border bg-workspace-panel shadow-lg workspace-scroll p-2">
          <div className="grid grid-cols-4 gap-1.5">
            {styles.map((style) => (
              <button
                key={style}
                onClick={() => { onSelect(style); setOpen(false); }}
                className={cn(
                  "group relative flex flex-col items-center gap-1 rounded-lg p-1.5 transition-colors",
                  selected === style
                    ? "bg-workspace-chip"
                    : "hover:bg-workspace-chip/60"
                )}
              >
                <div className="relative w-full aspect-square rounded-lg overflow-hidden">
                  <div className={cn("h-full w-full bg-gradient-to-br", getGradient(style))} />
                  {selected === style && (
                    <div className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary">
                      <Check className="h-2.5 w-2.5 text-primary-foreground" />
                    </div>
                  )}
                </div>
                <span className={cn(
                  "text-[10px] leading-tight text-center truncate w-full",
                  selected === style
                    ? "text-workspace-surface-foreground font-medium"
                    : "text-workspace-panel-foreground/60"
                )}>
                  {style}
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
