"use client";

import { BrandGuidePanel } from "@/components/dashboard/brand-guide-panel";
import { useJobsStore } from "@/lib/stores/jobs-store";

export function BrandGuideClient() {
  const status = useJobsStore((s) => s.brand.status);

  return (
    <main className="p-5 sm:p-8">
      <div className="mx-auto flex w-full max-w-[680px] flex-col gap-6">
        <div>
          <h1 className="font-display text-h1 font-bold text-fg">
            브랜드 가이드
          </h1>
          <p className="mt-2.5 font-kr text-[14px] text-fg-dim">
            {status === "ready"
              ? "설정이 적용되어 있습니다. 생성되는 모든 에셋에 자동 반영됩니다."
              : "로고를 올리고 컬러·타이포·무드를 설명하면 생성 시 자동 적용됩니다. (최초 1회 설정)"}
          </p>
        </div>

        <BrandGuidePanel />
      </div>
    </main>
  );
}
