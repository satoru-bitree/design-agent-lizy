"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { CloudUpload } from "lucide-react";
import { cn } from "@/lib/utils";

export type BrandSectionUploadProps = {
  onFile: (file: File) => void;
  /** Label rendered inside the dropzone. */
  label?: string;
  className?: string;
  /** Compact 1-line strip for in-section uploads (palette/typo/mood). */
  compact?: boolean;
};

const ACCEPT = {
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/webp": [".webp"],
  "image/gif": [".gif"],
  "image/avif": [".avif"],
  "image/svg+xml": [".svg"],
};

const MAX_BYTES = 20 * 1024 * 1024;

export function BrandSectionUpload({
  onFile,
  label = "이미지 업로드",
  className,
  compact,
}: BrandSectionUploadProps) {
  const onDrop = useCallback(
    (files: File[]) => {
      if (files[0]) onFile(files[0]);
    },
    [onFile],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPT,
    maxSize: MAX_BYTES,
    multiple: false,
  });

  if (compact) {
    return (
      <div
        {...getRootProps({
          role: "button",
          tabIndex: 0,
          "aria-label": label,
        })}
        className={cn(
          "flex h-[60px] cursor-pointer items-center justify-center gap-2 rounded-md border-[1.5px] border-dashed bg-surface-2 outline-none transition-colors duration-base ease-lz focus-visible:border-mint focus-visible:ring-2 focus-visible:ring-mint-ring",
          isDragActive
            ? "border-mint bg-mint-soft"
            : "border-fg-faint hover:border-border-strong",
          className,
        )}
      >
        <input {...getInputProps()} />
        <CloudUpload className="h-3.5 w-3.5 text-mint" strokeWidth={1.75} />
        <span className="font-kr text-[11px] text-fg-dim">{label}</span>
        <span className="font-kr text-[10px] text-fg-faint">(PNG·JPG·SVG·WEBP)</span>
      </div>
    );
  }

  return (
    <div
      {...getRootProps({
        role: "button",
        tabIndex: 0,
        "aria-label": label,
      })}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-[1.5px] border-dashed bg-surface-2 px-6 py-7 outline-none transition-colors duration-base ease-lz focus-visible:border-mint focus-visible:ring-2 focus-visible:ring-mint-ring",
        isDragActive ? "border-mint bg-mint-soft" : "border-fg-faint",
        className,
      )}
    >
      <input {...getInputProps()} />
      <div
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-pill bg-surface-3 text-mint transition-transform duration-micro ease-lz",
          isDragActive && "-translate-y-0.5",
        )}
      >
        <CloudUpload className="h-5 w-5" strokeWidth={1.5} />
      </div>
      <div className="font-kr text-[13px] font-semibold text-fg">{label}</div>
      <div className="px-4 text-center font-kr text-meta text-fg-muted">
        PNG · JPG · SVG · WEBP · 최대 20MB
      </div>
    </div>
  );
}
