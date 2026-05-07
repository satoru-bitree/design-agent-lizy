import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { AssetUploadForm } from "@/components/dashboard/asset-upload-form";
import { BrandGuidePanel } from "@/components/dashboard/brand-guide-panel";

export const metadata: Metadata = {
  title: "대시보드 · Agentic Creative",
};

export default function DashboardPage() {
  return (
    <div className="relative">
      <main className="p-5 sm:p-8">
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1.45fr_1fr]">
          <AssetUploadForm />
          <BrandGuidePanel />
        </div>
      </main>

      {/* Quick-action FAB — bottom-right */}
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
