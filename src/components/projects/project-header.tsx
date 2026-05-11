"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { StatusDot } from "@/components/ui/status-dot";
import { cn } from "@/lib/utils";
import type { ProjectStatus } from "@/lib/mock-data";

const STATUS_LABEL: Record<ProjectStatus, string> = {
  pending: "대기 중",
  in_progress: "생성 중",
  review: "검토 대기 중",
  approved: "승인 완료",
};

export function ProjectHeader({
  name,
  status,
  onDelete,
}: {
  name: string;
  status: ProjectStatus;
  onDelete?: () => void;
}) {
  const [confirming, setConfirming] = useState(false);

  const headingPrefix =
    status === "review" || status === "approved"
      ? "에셋 생성 완료"
      : status === "in_progress"
        ? "에셋 생성 중"
        : "에셋 준비 중";

  const monitoringActive = status !== "in_progress";

  return (
    <header className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-4">
        <h1 className="font-kr text-h1 font-bold tracking-[-0.005em] text-fg">
          {headingPrefix} — {name}
        </h1>

        {onDelete && (
          <div className="flex shrink-0 items-center gap-2">
            {confirming ? (
              <>
                <span className="font-kr text-[12px] text-fg-dim">
                  정말 삭제할까요?
                </span>
                <button
                  type="button"
                  onClick={onDelete}
                  className="inline-flex h-8 items-center rounded-md border border-state-danger/40 bg-state-danger/10 px-3 font-kr text-[12px] font-semibold text-state-danger outline-none transition-colors duration-micro ease-lz hover:bg-state-danger/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-state-danger"
                >
                  삭제
                </button>
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  className="inline-flex h-8 items-center rounded-md px-3 font-kr text-[12px] text-fg-dim outline-none transition-colors duration-micro ease-lz hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint"
                >
                  취소
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setConfirming(true)}
                aria-label="프로젝트 삭제"
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-surface-2 px-3 font-kr text-[12px] text-fg-dim outline-none transition-colors duration-micro ease-lz hover:border-state-danger/50 hover:text-state-danger focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint",
                )}
              >
                <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                <span>삭제</span>
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center rounded-pill border border-mint px-2.5 py-1 font-kr text-[11px] font-medium text-mint">
          {STATUS_LABEL[status]}
        </span>
        <span className="inline-flex items-center gap-2 font-kr text-[13px] text-fg-dim">
          <StatusDot tone={monitoringActive ? "active" : "pending"} />
          {monitoringActive
            ? "에이전트 모니터링 활성화됨"
            : "에이전트가 에셋을 생성 중입니다"}
        </span>
      </div>
    </header>
  );
}
