import { cn } from "@/lib/utils";

export interface GalleryItem {
  id: number;
  image: string;
  type: "image" | "text-overlay" | "portrait" | "landscape" | "pet" | "illustration";
  title: string;
  description: string;
  height: number; // in px for masonry
}

interface GalleryCardProps {
  item: GalleryItem;
  onUsePrompt?: (prompt: string) => void;
}

const GalleryCard = ({ item, onUsePrompt }: GalleryCardProps) => {
  return (
    <div
      className="group relative mb-3 overflow-hidden rounded-xl cursor-pointer"
      style={{ breakInside: "avoid" }}
    >
      <img
        src={item.image}
        alt={item.title}
        className="w-full object-cover transition-all duration-300 group-hover:scale-[1.03] group-hover:brightness-110"
        style={{ height: item.height }}
        loading="lazy"
      />
      {/* Hover overlay */}
      <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 p-3">
        <p className="text-xs text-white leading-relaxed line-clamp-3 mb-2 drop-shadow-md">
          {item.description}
        </p>
        <button
          onClick={() => onUsePrompt?.(item.description)}
          className="w-[90%] mx-auto rounded-lg bg-gradient-to-r from-primary to-workspace-neon px-4 py-1.5 text-xs font-medium text-white transition-all hover:brightness-110 text-center"
        >
          制作同款
        </button>
      </div>
    </div>
  );
};

export default GalleryCard;
