import { useState, useEffect, useCallback, type RefObject } from "react";
import { ArrowUp } from "lucide-react";

interface BackToTopButtonProps {
  scrollContainerRef: RefObject<HTMLElement>;
}

const BackToTopButton = ({ scrollContainerRef }: BackToTopButtonProps) => {
  const [visible, setVisible] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setVisible(el.scrollTop > 2 * window.innerHeight);
  }, [scrollContainerRef]);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkScroll, { passive: true });
    return () => el.removeEventListener("scroll", checkScroll);
  }, [scrollContainerRef, checkScroll]);

  const scrollToTop = () => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!visible) return null;

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-6 right-6 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all hover:bg-primary/90 active:scale-95"
      aria-label="回到顶部"
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
};

export default BackToTopButton;
