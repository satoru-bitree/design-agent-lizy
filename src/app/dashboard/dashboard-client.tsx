"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AssetUploadForm,
  type SubmitData,
} from "@/components/dashboard/asset-upload-form";
import { compressImageFile } from "@/lib/image-compress";
import { useJobsStore } from "@/lib/stores/jobs-store";

export function DashboardClient() {
  const router = useRouter();
  const brand = useJobsStore((s) => s.brand);
  const submit = useJobsStore((s) => s.submitGeneration);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (data: SubmitData) => {
    // Brand guide is no longer a gate — generation proceeds with whatever
    // guide state exists (empty guide is tolerated by the providers).
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
    } catch (e) {
      console.error("[dashboard] submitGeneration failed:", e);
      setSubmitting(false);
    }
  };

  return (
    <main className="p-5 sm:p-8">
      <AssetUploadForm
        brandStatus={brand.status}
        submitting={submitting}
        onSubmit={handleSubmit}
      />
    </main>
  );
}

