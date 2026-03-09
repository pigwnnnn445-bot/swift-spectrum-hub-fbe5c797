/**
 * A responsive bottom-sheet drawer for mobile/tablet parameter selection.
 * Renders a Vaul Drawer from the bottom with a title, scrollable content, and overlay dismiss.
 */
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

interface MobileDrawerPickerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const MobileDrawerPicker = ({ open, onClose, title, children }: MobileDrawerPickerProps) => (
  <Drawer open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
    <DrawerContent className="max-h-[70dvh]">
      <DrawerHeader className="pb-2">
        <DrawerTitle>{title}</DrawerTitle>
      </DrawerHeader>
      <div className="px-4 pb-6 overflow-y-auto workspace-scroll">
        {children}
      </div>
    </DrawerContent>
  </Drawer>
);

export default MobileDrawerPicker;
