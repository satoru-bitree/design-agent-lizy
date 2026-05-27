import type { ProjectRow } from "./schema";
import type { GenerationProject } from "@/lib/stores/jobs-store";
import type { AssetType } from "@/lib/mock-data";

// DB row → client-shape GenerationProject. Reconstructs the transient
// product/reference fields with empty objectUrl/dataUrl — the client always
// strips these on persist, and providers use `remoteUrl` when present (see
// GenerationInput.productImageRemoteUrl).
export function rowToProject(row: ProjectRow): GenerationProject {
  const references = row.references ?? undefined;
  return {
    id: row.id,
    name: row.name,
    market: row.market,
    brandMessage: row.brandMessage,
    brandGuide: row.brandGuide,
    product: {
      fileName: row.product.fileName,
      fileSize: row.product.fileSize,
      objectUrl: "",
      remoteUrl: row.product.remoteUrl,
    },
    references: references
      ? (Object.fromEntries(
          Object.entries(references).map(([k, v]) => [
            k,
            v ? { fileName: v.fileName, dataUrl: "", remoteUrl: v.remoteUrl } : v,
          ]),
        ) as GenerationProject["references"])
      : undefined,
    assetTypes: row.assetTypes,
    styleShotSettings: row.styleShotSettings ?? undefined,
    shortVideoSettings: row.shortVideoSettings ?? undefined,
    jobIds: row.jobIds as Partial<Record<AssetType, string>>,
    startErrors: row.startErrors as Partial<Record<AssetType, string>>,
    createdAt: row.createdAt,
  };
}
