"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import {
  AssetUploadForm,
  type SubmitData,
} from "@/components/dashboard/asset-upload-form";
import { BrandGuidePanel } from "@/components/dashboard/brand-guide-panel";
import { compressImageFile } from "@/lib/image-compress";
import { useJobsStore } from "@/lib/stores/jobs-store";

export function DashboardClient() {
  const router = useRouter();
  const brand = useJobsStore((s) => s.brand);
  const submit = useJobsStore((s) => s.submitGeneration);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (data: SubmitData) => {
    if (brand.status !== "ready") return;
    setSubmitting(true);
    try {
      const objectUrl = URL.createObjectURL(data.file);
      // Compress to ~1536px JPEG so the request body stays small and uploads
      // fast — see src/lib/image-compress.ts for the trade-off rationale.
      const dataUrl = await compressImageFile(data.file);

      const refEntries = data.referenceFiles
        ? await Promise.all(
            (Object.entries(data.referenceFiles) as [
              keyof typeof data.referenceFiles,
              File,
            ][]).map(async ([kind, f]) => {
              const dUrl = await compressImageFile(f);
              return [kind, { fileName: f.name, dataUrl: dUrl }] as const;
            }),
          )
        : [];
      const references =
        refEntries.length > 0 ? Object.fromEntries(refEntries) : undefined;

      const projectId = await submit({
        product: {
          fileName: data.file.name,
          fileSize: data.file.size,
          objectUrl,
          dataUrl,
        },
        references,
        market: data.market,
        brandMessage: data.brandMessage,
        brandGuide: brand.guide,
        assetTypes: data.assetTypes,
        styleShotSettings: data.styleShotSettings,
        shortVideoSettings: data.shortVideoSettings,
      });
      router.push(`/projects/${projectId}`);
    } catch {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative">
      <main className="p-5 sm:p-8">
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1.45fr_1fr]">
          <AssetUploadForm
            brandStatus={brand.status}
            submitting={submitting}
            onSubmit={handleSubmit}
          />
          <BrandGuidePanel />
        </div>
      </main>

      {/* Quick-action FAB — bottom-right (placeholder; not wired in Phase 2) */}
      <button
        type="button"
        aria-label="빠른 액션"
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-pill bg-mint text-bg shadow-fab outline-none transition-all duration-micro ease-lz hover:scale-105 hover:bg-mint-hover hover:shadow-[0_6px_28px_rgba(0,200,150,0.32)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint active:scale-100 active:bg-mint-press"
      >
        <Plus className="h-6 w-6" strokeWidth={2.5} />
      </button>
    </div>
  );
}

