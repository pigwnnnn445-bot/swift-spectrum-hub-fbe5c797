/**
 * 详情页专用参考图上传组件
 *
 * 功能：
 * - 按参考类型 Tab 切换（整图/人物/面部/风格），由模型 image_like 配置驱动
 * - 每个 type 独立管理 images / similarity / uploadMode
 * - 支持单张/多张模式切换（仅当 type 同时启用 one_image_flg + more_image_flg）
 * - 相似度控件仅当 type.similarity_flg === 1 时渲染
 * - required 由任一启用 type 的 is_required=1 驱动
 */
import { useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Upload, X, Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import type { ModelConfig, ImageLikeOption } from "@/config/modelConfig";
import {
  getOrderedEnabledImageLikes,
  getLikeTypeLabel,
  likeTypeToKey,
  type ReferenceTypeKey,
} from "@/config/modelConfig";

/* ── constants ──────────────────────────────── */
const ACCEPTED_FORMATS = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
const MAX_SIZE_MB = 10;
const MIN_RESOLUTION = 300;
const MAX_MULTI_IMAGES = 5;
const SIMILARITY_STEP = 5;
const SIMILARITY_DEFAULT = 50;

/* ── per-type state ─────────────────────────── */
export interface TypeRefState {
  images: string[];
  similarity: number;
  uploadMode: "single" | "multi";
}

export type ReferenceByType = Partial<Record<ReferenceTypeKey, TypeRefState>>;

/* ── props ──────────────────────────────────── */
interface DetailUploadReferencePanelProps {
  model: ModelConfig;
  value: ReferenceByType;
  onChange: (next: ReferenceByType) => void;
}

/* ── helpers ─────────────────────────────────── */
function isRequired(enabledLikes: ImageLikeOption[]): boolean {
  return enabledLikes.some((item) => item.is_required === 1);
}

/** 生效参考场景：image_like_flg===1 且至少支持单图或多图之一 */
function getEffectiveTypes(model: ModelConfig): ImageLikeOption[] {
  return getOrderedEnabledImageLikes(model).filter(
    (t) => t.one_image_flg === 1 || t.more_image_flg === 1
  );
}

/** more_image_flg=1 → multi；否则 single */
function uploadModeForType(item: ImageLikeOption): "single" | "multi" {
  return item.more_image_flg === 1 ? "multi" : "single";
}

function getOrCreateState(
  current: ReferenceByType,
  key: ReferenceTypeKey,
  item: ImageLikeOption
): TypeRefState {
  return (
    current[key] ?? {
      images: [],
      similarity: SIMILARITY_DEFAULT,
      uploadMode: uploadModeForType(item),
    }
  );
}

const validateFile = (file: File): Promise<{ valid: boolean; preview?: string }> =>
  new Promise((resolve) => {
    if (!ACCEPTED_FORMATS.includes(file.type)) {
      toast.error("请上传 jpeg, png, jpg, webp 格式的图片");
      return resolve({ valid: false });
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.warning("照片大小请勿超过10M。如超出，系统将自动为您压缩");
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      if (img.width < MIN_RESOLUTION || img.height < MIN_RESOLUTION) {
        toast.error("为了保证生图质量，请上传分辨率大于300px×300px的图片");
        URL.revokeObjectURL(url);
        return resolve({ valid: false });
      }
      resolve({ valid: true, preview: url });
    };
    img.onerror = () => {
      toast.error("图片加载失败，请重试");
      URL.revokeObjectURL(url);
      resolve({ valid: false });
    };
    img.src = url;
  });

/* ── main component ──────────────────────────── */
const DetailUploadReferencePanel = ({
  model,
  value,
  onChange,
}: DetailUploadReferencePanelProps) => {
  const enabledTypes = getEffectiveTypes(model);
  const required = isRequired(enabledTypes);

  const [activeType, setActiveType] = useState<number>(
    enabledTypes[0]?.like_type ?? 4
  );

  const updateTypeState = useCallback(
    (key: ReferenceTypeKey, updater: (prev: TypeRefState) => TypeRefState, item: ImageLikeOption) => {
      onChange({
        ...value,
        [key]: updater(getOrCreateState(value, key, item)),
      });
    },
    [value, onChange]
  );

  if (enabledTypes.length === 0) return null;

  return (
    <div className="space-y-3">
      {/* 始终显示的顶部文案 */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-workspace-panel-foreground/80">
          上传参考图
        </span>
        <span
          className={cn(
            "text-[10px] px-1.5 py-0.5 rounded",
            required
              ? "bg-destructive/10 text-destructive"
              : "bg-muted text-muted-foreground"
          )}
        >
          {required ? "必填" : "选填"}
        </span>
      </div>

      {/* Tabs: 仅 enabledTypes >= 2 时渲染 */}
      {enabledTypes.length >= 2 && (
        <div className="flex gap-1 rounded-[10px] bg-workspace-chip/50 p-1">
          {enabledTypes.map((item) => (
            <button
              key={item.like_type}
              onClick={() => setActiveType(item.like_type)}
              className={cn(
                "flex-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-all cursor-pointer",
                activeType === item.like_type
                  ? "bg-primary text-primary-foreground"
                  : "text-workspace-panel-foreground/60 hover:text-workspace-panel-foreground/80"
              )}
            >
              {getLikeTypeLabel(item.like_type)}
            </button>
          ))}
        </div>
      )}

      {/* Per-type content */}
      {enabledTypes.map((item) => {
        const key = likeTypeToKey(item.like_type);
        if (!key) return null;
        const state = getOrCreateState(value, key, item);
        const isActive = enabledTypes.length === 1 || activeType === item.like_type;

        return (
          <div key={item.like_type} className={cn(!isActive && "hidden")}>
            <TypeUploadSection
              item={item}
              typeKey={key}
              state={state}
              onUpdate={(updater) => updateTypeState(key, updater, item)}
            />
          </div>
        );
      })}
    </div>
  );
};

/* ── per-type section ────────────────────────── */
function TypeUploadSection({
  item,
  state,
  onUpdate,
}: {
  item: ImageLikeOption;
  typeKey: ReferenceTypeKey;
  state: TypeRefState;
  onUpdate: (updater: (prev: TypeRefState) => TypeRefState) => void;
}) {
  // more_image_flg=1 → multi (no toggle); otherwise single
  const isMulti = item.more_image_flg === 1;
  const maxImages = isMulti ? MAX_MULTI_IMAGES : 1;

  return (
    <div className="space-y-3">
      {/* Upload zone */}
      <UploadZone
        images={state.images}
        maxImages={maxImages}
        onImagesChange={(images) => onUpdate((prev) => ({ ...prev, images }))}
      />

      {/* Similarity: only when similarity_flg === 1 */}
      {item.similarity_flg === 1 && (
        <SimilarityControl
          value={state.similarity}
          onChange={(similarity) => onUpdate((prev) => ({ ...prev, similarity }))}
        />
      )}
    </div>
  );
}

/* ── upload zone ─────────────────────────────── */
function UploadZone({
  images,
  maxImages,
  onImagesChange,
}: {
  images: string[];
  maxImages: number;
  onImagesChange: (images: string[]) => void;
}) {
  const addInputRef = useRef<HTMLInputElement | null>(null);
  const replaceInputRef = useRef<HTMLInputElement | null>(null);
  const [replaceIndex, setReplaceIndex] = useState(-1);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const canAddMore = images.length < maxImages;

  const handleAddFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    if (images.length >= maxImages) {
      toast.error(`最多上传${maxImages}张图片`);
      return;
    }
    const result = await validateFile(file);
    if (result.valid && result.preview) {
      onImagesChange([...images, result.preview]);
      setTimeout(() => {
        scrollRef.current?.scrollTo({
          left: scrollRef.current.scrollWidth,
          behavior: "smooth",
        });
      }, 50);
    }
  };

  const handleReplace = (index: number) => {
    setReplaceIndex(index);
    replaceInputRef.current?.click();
  };

  const handleReplaceFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    const result = await validateFile(file);
    if (result.valid && result.preview) {
      const next = [...images];
      if (images[replaceIndex]) URL.revokeObjectURL(images[replaceIndex]);
      next[replaceIndex] = result.preview;
      onImagesChange(next);
    }
  };

  const handleRemove = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    URL.revokeObjectURL(images[index]);
    onImagesChange(images.filter((_, i) => i !== index));
  };

  return (
    <div>
      <input
        ref={addInputRef}
        type="file"
        accept=".jpeg,.jpg,.png,.webp"
        className="hidden"
        onChange={handleAddFile}
      />
      <input
        ref={replaceInputRef}
        type="file"
        accept=".jpeg,.jpg,.png,.webp"
        className="hidden"
        onChange={handleReplaceFile}
      />

      <div
        ref={scrollRef}
        className={cn(
          "flex gap-2 overflow-x-auto pb-1 workspace-scroll",
          images.length === 0 && "grid grid-cols-2"
        )}
      >
        {images.map((src, i) => (
          <div
            key={i}
            onClick={() => handleReplace(i)}
            className="relative flex-shrink-0 w-[calc(50%-4px)] aspect-square rounded-xl overflow-hidden cursor-pointer border border-workspace-border/60"
          >
            <img
              src={src}
              alt="preview"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <button
              onClick={(e) => handleRemove(e, i)}
              className="absolute top-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/50 hover:bg-black/70 transition-colors"
            >
              <X className="h-3 w-3 text-white" />
            </button>
          </div>
        ))}

        {canAddMore && (
          <div
            onClick={() => addInputRef.current?.click()}
            className={cn(
              "flex-shrink-0 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-workspace-border/60 bg-workspace-chip/20 transition-colors hover:border-primary/40 hover:bg-workspace-chip/40 aspect-square",
              images.length === 0 ? "w-full" : "w-[calc(50%-4px)]"
            )}
          >
            <Upload className="mb-1 h-5 w-5 text-workspace-panel-foreground/40" />
            <span className="text-[10px] text-workspace-panel-foreground/40 text-center px-1">
              将图片拖至此处或单击上传
            </span>
          </div>
        )}

        {/* Second empty slot when no images */}
        {images.length === 0 && maxImages > 1 && (
          <div
            onClick={() => addInputRef.current?.click()}
            className="flex-shrink-0 w-full flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-workspace-border/60 bg-workspace-chip/20 transition-colors hover:border-primary/40 hover:bg-workspace-chip/40 aspect-square"
          >
            <Upload className="mb-1 h-5 w-5 text-workspace-panel-foreground/40" />
            <span className="text-[10px] text-workspace-panel-foreground/40 text-center px-1">
              将图片拖至此处或单击上传
            </span>
          </div>
        )}
      </div>

      {images.length > 0 && maxImages > 1 && (
        <div className="text-center mt-1.5">
          <span className="text-[10px] text-workspace-panel-foreground/40">
            {images.length}/{maxImages}
          </span>
        </div>
      )}
    </div>
  );
}

/* ── similarity control ──────────────────────── */
function SimilarityControl({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-1">
      <span className="text-xs text-workspace-panel-foreground/60">相似</span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(Math.max(0, value - SIMILARITY_STEP))}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-workspace-chip hover:bg-workspace-chip-active/30 cursor-pointer transition-colors"
        >
          <Minus className="h-3.5 w-3.5 text-workspace-panel-foreground" />
        </button>
        <span className="min-w-[2rem] text-center text-sm font-medium text-workspace-panel-foreground tabular-nums">
          {value}
        </span>
        <button
          onClick={() => onChange(Math.min(100, value + SIMILARITY_STEP))}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-workspace-chip hover:bg-workspace-chip-active/30 cursor-pointer transition-colors"
        >
          <Plus className="h-3.5 w-3.5 text-workspace-panel-foreground" />
        </button>
      </div>
    </div>
  );
}

/* ── utility: get total image count across all types ── */
export function getTotalImageCount(ref: ReferenceByType): number {
  return Object.values(ref).reduce((sum, s) => sum + (s?.images.length ?? 0), 0);
}

/** Get only types that have images uploaded (for payload submission) */
export function getSubmittableReference(
  ref: ReferenceByType
): Partial<Record<ReferenceTypeKey, { images: string[]; similarity?: number }>> {
  const result: Partial<Record<ReferenceTypeKey, { images: string[]; similarity?: number }>> = {};
  for (const [key, state] of Object.entries(ref)) {
    if (state && state.images.length > 0) {
      result[key as ReferenceTypeKey] = {
        images: state.images,
        similarity: state.similarity,
      };
    }
  }
  return result;
}

export default DetailUploadReferencePanel;
