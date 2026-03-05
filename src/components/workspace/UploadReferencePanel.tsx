import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { Upload, X } from "lucide-react";
import { toast } from "sonner";
import type { ModelConfig } from "@/config/modelConfig";
import { getEnabledImageLikes, getLikeTypeLabel, hasTypedUpload } from "@/config/modelConfig";

const ACCEPTED_FORMATS = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
const MAX_SIZE_MB = 10;
const MIN_RESOLUTION = 300;

interface UploadReferencePanelProps {
  model: ModelConfig;
  /** 受控：当前参考图列表 */
  images?: string[];
  /** 受控：参考图变更回调 */
  onImagesChange?: (images: string[]) => void;
}

const UploadReferencePanel = ({ model, images: controlledImages, onImagesChange }: UploadReferencePanelProps) => {
  const enabledLikes = getEnabledImageLikes(model);
  const isTyped = hasTypedUpload(model);

  const [activeType, setActiveType] = useState(enabledLikes[0]?.like_type ?? 0);

  // Simple mode: no enabled image_like types, just a basic upload zone
  if (!isTyped) {
    return (
      <div className="space-y-3">
        <UploadZone
          key="simple"
          multi={true}
          placeholder="将图片拖至此处或单击上传"
          images={controlledImages}
          onImagesChange={onImagesChange}
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
                "flex-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-all",
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
          />
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

const MAX_MULTI_IMAGES = 5;

const UploadZone = ({ multi, placeholder }: { multi: boolean; placeholder: string }) => {
  const single = !multi;
  const [images, setImages] = useState<string[]>([]);
  const addInputRef = useRef<HTMLInputElement | null>(null);
  const replaceInputRef = useRef<HTMLInputElement | null>(null);
  const [replaceIndex, setReplaceIndex] = useState<number>(-1);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  if (single) {
    return <SingleUploadZone placeholder={placeholder} />;
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
      setImages((prev) => [...prev, result.preview!]);
      setTimeout(() => {
        scrollRef.current?.scrollTo({ left: scrollRef.current.scrollWidth, behavior: "smooth" });
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
      setImages((prev) => {
        const next = [...prev];
        if (prev[replaceIndex]) URL.revokeObjectURL(prev[replaceIndex]);
        next[replaceIndex] = result.preview!;
        return next;
      });
    }
  };

  const handleRemove = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    setImages((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
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

const SingleUploadZone = ({ placeholder }: { placeholder: string }) => {
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleClick = () => inputRef.current?.click();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    const result = await validateFile(file);
    if (result.valid && result.preview) {
      if (preview) URL.revokeObjectURL(preview);
      setPreview(result.preview);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
  };

  return (
    <div
      onClick={handleClick}
      className="relative flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-workspace-border/60 bg-workspace-chip/20 transition-colors hover:border-primary/40 hover:bg-workspace-chip/40 overflow-hidden aspect-video"
    >
      <input ref={inputRef} type="file" accept=".jpeg,.jpg,.png,.webp" className="hidden" onChange={handleFile} />
      {preview ? (
        <>
          <img src={preview} alt="preview" className="absolute inset-0 h-full w-full object-cover" />
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

export default UploadReferencePanel;
