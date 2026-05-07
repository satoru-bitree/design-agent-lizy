"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { X } from "lucide-react";

export type ImageLightboxProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  src: string;
  alt: string;
  caption?: string;
};

export function ImageLightbox({
  open,
  onOpenChange,
  src,
  alt,
  caption,
}: ImageLightboxProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        {/* Heavier scrim than edit dialog — image preview wants emphasis. No blur (DS rule). */}
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/85 data-[open]:animate-in data-[open]:fade-in-0 data-[closed]:animate-out data-[closed]:fade-out-0 data-[closed]:duration-micro" />

        <DialogPrimitive.Popup className="fixed left-1/2 top-1/2 z-50 flex max-h-[92vh] max-w-[92vw] -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-3 outline-none data-[open]:animate-fade-scale-in data-[closed]:animate-fade-scale-out">
          <DialogPrimitive.Title className="sr-only">{alt}</DialogPrimitive.Title>

          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={alt}
              className="max-h-[82vh] max-w-[92vw] rounded-md object-contain shadow-modal"
            />

            <DialogPrimitive.Close
              render={
                <button
                  type="button"
                  aria-label="닫기"
                  className="absolute right-3 top-3 flex h-8 w-8 cursor-pointer items-center justify-center rounded-pill bg-bg/80 text-fg-dim outline-none transition-colors duration-micro ease-lz hover:bg-bg hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint"
                />
              }
            >
              <X className="h-4 w-4" strokeWidth={1.75} />
            </DialogPrimitive.Close>
          </div>

          {caption && (
            <div className="font-kr text-[13px] text-fg-dim">{caption}</div>
          )}
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
