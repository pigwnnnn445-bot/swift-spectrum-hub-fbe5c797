/**
 * A responsive bottom-sheet drawer for mobile/tablet parameter selection.
 * Renders a Vaul Drawer from the bottom with a title, scrollable content, and overlay dismiss.
 * Uses z-[150] to ensure visibility above detail views (z-[100]).
 */
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerOverlay,
  DrawerPortal,
} from "@/components/ui/drawer";

interface MobileDrawerPickerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const MobileDrawerPicker = ({ open, onClose, title, children }: MobileDrawerPickerProps) => (
  <Drawer open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
    <DrawerPortal>
      <DrawerOverlay className="z-[150]" />
      <DrawerContent className="max-h-[70dvh] z-[150]">
        <DrawerHeader className="pb-2">
          <DrawerTitle>{title}</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-6 overflow-y-auto workspace-scroll">
          {children}
        </div>
      </DrawerContent>
    </DrawerPortal>
  </Drawer>
);

export default MobileDrawerPicker;
