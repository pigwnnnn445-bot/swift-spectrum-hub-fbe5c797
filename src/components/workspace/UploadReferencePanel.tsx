import { useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Upload, X, Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import type { ModelConfig } from "@/config/modelConfig";
import { getEnabledImageLikes, getLikeTypeLabel, hasTypedUpload } from "@/config/modelConfig";

const ACCEPTED_FORMATS = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
const MAX_SIZE_MB = 10;
const MIN_RESOLUTION = 300;
const MAX_MULTI_IMAGES = 5;

/** Per-type images + similarity keyed by like_type */
export type ReferenceImagesByType = Record<number, string[]>;
export type SimilarityByType = Record<number, number>;

interface UploadReferencePanelProps {
  model: ModelConfig;
  /** Per-type images map: { [like_type]: string[] } */
  imagesByType?: ReferenceImagesByType;
  onImagesByTypeChange?: (imagesByType: ReferenceImagesByType) => void;
  /** Per-type similarity map */
  similarityByType?: SimilarityByType;
  onSimilarityByTypeChange?: (similarityByType: SimilarityByType) => void;
}

const UploadReferencePanel = ({
  model,
  imagesByType: controlledByType,
  onImagesByTypeChange,
  similarityByType: controlledSim,
  onSimilarityByTypeChange,
}: UploadReferencePanelProps) => {
  const enabledLikes = getEnabledImageLikes(model);
  const isTyped = hasTypedUpload(model);

  const [activeType, setActiveType] = useState(enabledLikes[0]?.like_type ?? 0);

  const byType = controlledByType ?? {};
  const simByType = controlledSim ?? {};

  const getTypeImages = (likeType: number): string[] => byType[likeType] ?? [];

  const setTypeImages = useCallback(
    (likeType: number, images: string[]) => {
      const next = { ...controlledByType, [likeType]: images };
      onImagesByTypeChange?.(next);
    },
    [controlledByType, onImagesByTypeChange]
  );

  const getTypeSimilarity = (likeType: number): number => simByType[likeType] ?? 50;

  const setTypeSimilarity = useCallback(
    (likeType: number, value: number) => {
      const next = { ...controlledSim, [likeType]: value };
      onSimilarityByTypeChange?.(next);
    },
    [controlledSim, onSimilarityByTypeChange]
  );

  // Simple mode: no typed uploads
  if (!isTyped) {
    return (
      <div className="space-y-3">
        <UploadZone
          key="simple"
          multi={true}
          placeholder="将图片拖至此处或单击上传"
          images={getTypeImages(0)}
          onImagesChange={(imgs) => setTypeImages(0, imgs)}
        />
      </div>
    );
  }

  // Typed mode: tabs for each enabled type
  return (
    <div className="space-y-3">
      {enabledLikes.length > 1 && (
        <div className="flex gap-1 rounded-[10px] bg-workspace-chip/50 p-1">
          {enabledLikes.map((item) => (
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

      {enabledLikes.map((item) => (
        <div key={item.like_type} className={cn(activeType !== item.like_type && "hidden")}>
          <UploadZone
            multi={item.more_image_flg === 1}
            placeholder="单击或拖动图像即可上传"
            images={getTypeImages(item.like_type)}
            onImagesChange={(imgs) => setTypeImages(item.like_type, imgs)}
          />
          {/* Per-type similarity */}
          {item.similarity_flg === 1 && (
            <div className="mt-3 space-y-2.5">
              <h3 className="text-xs font-medium uppercase tracking-wider text-workspace-panel-foreground/50 text-center">
                相似度
              </h3>
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() =>
                    setTypeSimilarity(item.like_type, Math.max(0, getTypeSimilarity(item.like_type) - 1))
                  }
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-workspace-chip hover:bg-workspace-chip-active/30 cursor-pointer transition-colors"
                >
                  <Minus className="h-4 w-4 text-workspace-panel-foreground" />
                </button>
                <span className="min-w-[2.5rem] text-center text-sm font-medium text-workspace-panel-foreground">
                  {getTypeSimilarity(item.like_type)}
                </span>
                <button
                  onClick={() =>
                    setTypeSimilarity(item.like_type, Math.min(100, getTypeSimilarity(item.like_type) + 1))
                  }
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-workspace-chip hover:bg-workspace-chip-active/30 cursor-pointer transition-colors"
                >
                  <Plus className="h-4 w-4 text-workspace-panel-foreground" />
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const validateFile = (file: File): Promise<{ valid: boolean; preview?: string }> => {
  return new Promise((resolve) => {
    if (!ACCEPTED_FORMATS.includes(file.type)) {
      toast.error("请上传jpeg,png,jpg,webp的图片");
      return resolve({ valid: false });
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.warning("照片大小请勿超过10M。如超出，系统将自动为您压缩");
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      if (img.width < MIN_RESOLUTION || img.height < MIN_RESOLUTION) {
        toast.error("为了保证生图质量，请您上传的图片分辨率大于300px*300px");
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
};

const UploadZone = ({
  multi,
  placeholder,
  images,
  onImagesChange,
}: {
  multi: boolean;
  placeholder: string;
  images: string[];
  onImagesChange: (images: string[]) => void;
}) => {
  const single = !multi;
  const addInputRef = useRef<HTMLInputElement | null>(null);
  const replaceInputRef = useRef<HTMLInputElement | null>(null);
  const [replaceIndex, setReplaceIndex] = useState<number>(-1);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  if (single) {
    return (
      <SingleUploadZone
        placeholder={placeholder}
        image={images[0] ?? null}
        onImageChange={(img) => onImagesChange(img ? [img] : [])}
      />
    );
  }

  const canAddMore = images.length < MAX_MULTI_IMAGES;

  const handleAdd = () => addInputRef.current?.click();

  const handleAddFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    if (images.length >= MAX_MULTI_IMAGES) {
      toast.error(`最多上传${MAX_MULTI_IMAGES}张图片`);
      return;
    }
    const result = await validateFile(file);
    if (result.valid && result.preview) {
      onImagesChange([...images, result.preview]);
      setTimeout(() => {
        scrollRef.current?.scrollTo({ left: scrollRef.current!.scrollWidth, behavior: "smooth" });
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
      <input ref={addInputRef} type="file" accept=".jpeg,.jpg,.png,.webp" className="hidden" onChange={handleAddFile} />
      <input ref={replaceInputRef} type="file" accept=".jpeg,.jpg,.png,.webp" className="hidden" onChange={handleReplaceFile} />

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
            <img src={src} alt="preview" className="absolute inset-0 h-full w-full object-cover" />
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
            onClick={handleAdd}
            className={cn(
              "flex-shrink-0 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-workspace-border/60 bg-workspace-chip/20 transition-colors hover:border-primary/40 hover:bg-workspace-chip/40 aspect-square",
              images.length === 0 ? "w-full" : "w-[calc(50%-4px)]"
            )}
          >
            <Upload className="mb-1 h-5 w-5 text-workspace-panel-foreground/40" />
            <span className="text-[10px] text-workspace-panel-foreground/40 text-center px-1">
              {placeholder}
            </span>
          </div>
        )}

        {images.length === 0 && (
          <div
            onClick={handleAdd}
            className="flex-shrink-0 w-full flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-workspace-border/60 bg-workspace-chip/20 transition-colors hover:border-primary/40 hover:bg-workspace-chip/40 aspect-square"
          >
            <Upload className="mb-1 h-5 w-5 text-workspace-panel-foreground/40" />
            <span className="text-[10px] text-workspace-panel-foreground/40 text-center px-1">
              {placeholder}
            </span>
          </div>
        )}
      </div>

      {images.length > 0 && (
        <div className="text-center mt-1.5">
          <span className="text-[10px] text-workspace-panel-foreground/40">
            {images.length}/{MAX_MULTI_IMAGES}
          </span>
        </div>
      )}
    </div>
  );
};

const SingleUploadZone = ({
  placeholder,
  image,
  onImageChange,
}: {
  placeholder: string;
  image: string | null;
  onImageChange: (img: string | null) => void;
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleClick = () => inputRef.current?.click();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    const result = await validateFile(file);
    if (result.valid && result.preview) {
      if (image) URL.revokeObjectURL(image);
      onImageChange(result.preview);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (image) URL.revokeObjectURL(image);
    onImageChange(null);
  };

  return (
    <div
      onClick={handleClick}
      className="relative flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-workspace-border/60 bg-workspace-chip/20 transition-colors hover:border-primary/40 hover:bg-workspace-chip/40 overflow-hidden aspect-video"
    >
      <input ref={inputRef} type="file" accept=".jpeg,.jpg,.png,.webp" className="hidden" onChange={handleFile} />
      {image ? (
        <>
          <img src={image} alt="preview" className="absolute inset-0 h-full w-full object-cover" />
          <button
            onClick={handleRemove}
            className="absolute top-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/50 hover:bg-black/70 transition-colors"
          >
            <X className="h-3 w-3 text-white" />
          </button>
        </>
      ) : (
        <>
          <Upload className="mb-1 h-5 w-5 text-workspace-panel-foreground/40" />
          <span className="text-[10px] text-workspace-panel-foreground/40 text-center px-1">{placeholder}</span>
        </>
      )}
    </div>
  );
};

/** Flatten all per-type images into a single array */
export function flattenImagesByType(byType: ReferenceImagesByType): string[] {
  return Object.values(byType).flat();
}

/** Get total image count across all types */
export function getTotalImagesByTypeCount(byType: ReferenceImagesByType): number {
  return Object.values(byType).reduce((sum, imgs) => sum + imgs.length, 0);
}

/** Get the first available similarity from types that have images */
export function getActiveSimilarity(
  byType: ReferenceImagesByType,
  simByType: SimilarityByType
): number {
  for (const [key, imgs] of Object.entries(byType)) {
    if (imgs.length > 0 && simByType[Number(key)] !== undefined) {
      return simByType[Number(key)];
    }
  }
  return 50;
}

export default UploadReferencePanel;
