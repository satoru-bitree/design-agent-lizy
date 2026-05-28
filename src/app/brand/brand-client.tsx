"use client";

import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { BrandGuidePanel } from "@/components/dashboard/brand-guide-panel";
import { useJobsStore } from "@/lib/stores/jobs-store";

export function BrandGuideClient({ fromWizard }: { fromWizard?: boolean }) {
  const router = useRouter();
  const status = useJobsStore((s) => s.brand.status);

  return (
    <main className="p-5 sm:p-8">
      {/* When arriving mid-request from the Step 4 warning, leave room so the
          sticky completion bar doesn't cover the panel's last section. */}
      <div className={fromWizard ? "pb-24" : undefined}>
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
      </div>

      {fromWizard && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-bg/95 backdrop-blur">
          <div className="mx-auto flex w-full max-w-[680px] items-center justify-between gap-3 px-5 py-3 sm:px-0">
            <span className="font-kr text-[12px] text-fg-muted">
              에셋 요청을 위해 브랜드 가이드를 설정 중입니다
            </span>
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="inline-flex h-[42px] shrink-0 items-center gap-1.5 rounded-lg bg-mint px-5 font-kr text-[13px] font-semibold text-bg outline-none transition-all duration-micro ease-lz hover:bg-mint-hover active:scale-[0.98] active:bg-mint-press focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint"
            >
              <Check className="h-4 w-4" strokeWidth={2.25} />
              설정 완료하고 돌아가기
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
