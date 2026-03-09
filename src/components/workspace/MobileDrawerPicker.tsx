/**
 * A responsive bottom-sheet drawer for mobile/tablet parameter selection.
 * Uses z-[150] to ensure visibility above detail views (z-[100]).
 */
import * as React from "react";
import { Drawer as DrawerPrimitive } from "vaul";
import { cn } from "@/lib/utils";

interface MobileDrawerPickerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const MobileDrawerPicker = ({ open, onClose, title, children }: MobileDrawerPickerProps) => (
  <DrawerPrimitive.Root open={open} onOpenChange={(v) => { if (!v) onClose(); }} shouldScaleBackground>
    <DrawerPrimitive.Portal>
      <DrawerPrimitive.Overlay className="fixed inset-0 z-[150] bg-black/80" />
      <DrawerPrimitive.Content
        className="fixed inset-x-0 bottom-0 z-[150] mt-24 flex h-auto max-h-[70dvh] flex-col rounded-t-[10px] border bg-background"
      >
        <div className="mx-auto mt-4 h-2 w-[100px] rounded-full bg-muted" />
        <div className="grid gap-1.5 p-4 text-center sm:text-left pb-2">
          <DrawerPrimitive.Title className="text-lg font-semibold leading-none tracking-tight">
            {title}
          </DrawerPrimitive.Title>
        </div>
        <div className="px-4 pb-6 overflow-y-auto workspace-scroll">
          {children}
        </div>
      </DrawerPrimitive.Content>
    </DrawerPrimitive.Portal>
  </DrawerPrimitive.Root>
);

export default MobileDrawerPicker;
