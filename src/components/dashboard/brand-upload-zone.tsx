"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { CloudUpload } from "lucide-react";
import { cn } from "@/lib/utils";

export type BrandUploadZoneProps = {
  onFile: (file: File) => void;
  className?: string;
  /** Compact trigger for "filled" state (small "변경" pill). */
  compact?: boolean;
};

const ACCEPT = {
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/svg+xml": [".svg"],
  "application/pdf": [".pdf"],
};

const MAX_BYTES = 20 * 1024 * 1024;

export function BrandUploadZone({
  onFile,
  className,
  compact,
}: BrandUploadZoneProps) {
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
          "aria-label": "브랜드 자산 다시 업로드",
        })}
        className={cn(
          "inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-pill border border-border bg-surface-2 px-2.5 py-1 font-kr text-[11px] text-fg-dim outline-none transition-colors duration-micro ease-lz hover:border-mint hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint",
          className,
        )}
      >
        <input {...getInputProps()} />
        <CloudUpload className="h-3 w-3" strokeWidth={1.75} />
        <span>변경</span>
      </div>
    );
  }

  return (
    <div
      {...getRootProps({
        role: "button",
        tabIndex: 0,
        "aria-label": "브랜드 자산 업로드 (PDF·PNG·JPG·SVG, 최대 20MB)",
      })}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-[1.5px] border-dashed bg-surface-2 px-6 py-8 outline-none transition-colors duration-base ease-lz focus-visible:border-mint focus-visible:ring-2 focus-visible:ring-mint-ring",
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
      <div className="font-kr text-[13px] font-semibold text-fg">
        브랜드 가이드 업로드
      </div>
      <div className="px-4 text-center font-kr text-meta text-fg-muted">
        PDF · 이미지 · SVG · 최대 20MB
      </div>
    </div>
  );
}
