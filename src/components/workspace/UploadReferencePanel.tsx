import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { Upload, X } from "lucide-react";
import { toast } from "sonner";
import type { UploadRefConfig } from "@/config/modelConfig";

const ACCEPTED_FORMATS = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
const MAX_SIZE_MB = 10;
const MIN_RESOLUTION = 300;

interface UploadReferencePanelProps {
  config: UploadRefConfig;
}

const UploadReferencePanel = ({ config }: UploadReferencePanelProps) => {
  const [activeType, setActiveType] = useState(config.types?.[0]?.id ?? "upload");
  const [similarity, setSimilarity] = useState(50);

  const isPerson = activeType === "person";

  const handleSimilarityChange = (delta: number) => {
    setSimilarity((prev) => Math.min(100, Math.max(0, prev + delta)));
  };

  // Simple mode: just upload area(s)
  if (config.mode === "simple") {
    return (
      <div className="space-y-3">
        <UploadZone
          key="simple"
          multi={config.multiUpload}
          placeholder={config.placeholder ?? "将图片拖至此处或单击上传"}
        />
      </div>
    );
  }

  // Typed mode: tabs for each type
  return (
    <div className="space-y-3">
      {/* Type tabs */}
      {config.types && config.types.length > 0 && (
        <div className="flex gap-1 rounded-[10px] bg-workspace-chip/50 p-1">
          {config.types.map((type) => (
            <button
              key={type.id}
              onClick={() => setActiveType(type.id)}
              className={cn(
                "flex-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-all",
                activeType === type.id
                  ? "bg-primary text-primary-foreground"
                  : "text-workspace-panel-foreground/60 hover:text-workspace-panel-foreground/80"
              )}
            >
              {type.label}
            </button>
          ))}
        </div>
      )}

      {/* Upload areas — render all types, show only active to preserve state */}
      {config.types?.map((type) => (
        <div key={type.id} className={cn(activeType !== type.id && "hidden")}>
          <UploadZone
            multi={type.id === "person" ? false : config.multiUpload}
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

  // Single mode: one image only
  if (single) {
    return <SingleUploadZone placeholder={placeholder} />;
  }

  // Multi mode: dynamic list up to MAX_MULTI_IMAGES
  const canAddMore = images.length < MAX_MULTI_IMAGES;

  const handleAdd = () => {
    addInputRef.current?.click();
  };

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
      // Scroll to end after adding
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
        {/* Existing images */}
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

        {/* Add button / empty slots */}
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

        {/* Show a second empty slot when no images yet */}
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

      {/* Image count indicator */}
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
