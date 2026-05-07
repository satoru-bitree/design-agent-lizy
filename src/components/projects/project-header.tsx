import { StatusDot } from "@/components/ui/status-dot";
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
}: {
  name: string;
  status: ProjectStatus;
}) {
  const headingPrefix =
    status === "review" || status === "approved"
      ? "에셋 생성 완료"
      : status === "in_progress"
        ? "에셋 생성 중"
        : "에셋 준비 중";

  const monitoringActive = status !== "in_progress";

  return (
    <header className="flex flex-col gap-3">
      <h1 className="font-kr text-h1 font-bold tracking-[-0.005em] text-fg">
        {headingPrefix} — {name}
      </h1>

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
