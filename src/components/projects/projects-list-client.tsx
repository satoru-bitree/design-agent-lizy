"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Folder, Package, Camera, Film, type LucideIcon } from "lucide-react";
import { StatusDot } from "@/components/ui/status-dot";
import {
  deriveProjectStatus,
  useJobsStore,
  type GenerationProject,
} from "@/lib/stores/jobs-store";
import type { AssetType, ProjectStatus } from "@/lib/mock-data";

const KIND_ICON: Record<AssetType, LucideIcon> = {
  package: Package,
  style_shot: Camera,
  short_video: Film,
};

const KIND_LABEL: Record<AssetType, string> = {
  package: "패키지",
  style_shot: "스타일샷",
  short_video: "숏폼",
};

export function ProjectsListClient() {
  const projects = useJobsStore((s) => s.generationProjects);
  const jobs = useJobsStore((s) => s.jobs);

  const list = useMemo(
    () => Object.values(projects).sort((a, b) => b.createdAt - a.createdAt),
    [projects],
  );

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="font-kr text-h1 font-bold tracking-[-0.005em] text-fg">
          프로젝트
        </h1>
        <p className="font-kr text-[14px] text-fg-dim">
          지금까지 생성한 에셋 프로젝트입니다. 카드를 눌러 결과를 확인하세요.
        </p>
      </header>

      {list.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((project) => (
            <li key={project.id}>
              <ProjectCard
                project={project}
                status={deriveProjectStatus(project, jobs)}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function ProjectCard({
  project,
  status,
}: {
  project: GenerationProject;
  status: ProjectStatus;
}) {
  return (
    <Link
      href={`/projects/${project.id}`}
      className="group flex h-full flex-col gap-4 rounded-xl border border-border bg-surface-1 p-5 outline-none transition-colors duration-micro ease-lz hover:border-border-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="line-clamp-2 flex-1 font-kr text-h3 font-bold leading-[1.35] text-fg">
          {project.name}
        </h3>
        <StatusBadge status={status} />
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
        {project.assetTypes.map((kind) => {
          const Icon = KIND_ICON[kind];
          return (
            <span
              key={kind}
              className="inline-flex items-center gap-1.5 font-kr text-meta text-fg-dim"
            >
              <Icon
                className="h-3.5 w-3.5 text-fg-muted"
                strokeWidth={1.5}
              />
              {KIND_LABEL[kind]}
            </span>
          );
        })}
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-border pt-3 text-meta">
        <span className="font-kr text-fg-muted">{project.market}</span>
        <span className="font-mono text-fg-muted">
          {formatRelative(project.createdAt)}
        </span>
      </div>
    </Link>
  );
}

/* -------------------------------------------------------------------------- */

function StatusBadge({ status }: { status: ProjectStatus }) {
  if (status === "in_progress") {
    return (
      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-pill bg-mint-soft px-2.5 py-1 font-mono text-[11px] text-mint">
        <StatusDot tone="pending" />
        생성 중
      </span>
    );
  }
  if (status === "review") {
    return (
      <span className="inline-flex shrink-0 items-center rounded-pill border border-mint px-2.5 py-1 font-mono text-[11px] text-mint">
        검토 대기
      </span>
    );
  }
  if (status === "approved") {
    return (
      <span className="inline-flex shrink-0 items-center rounded-pill bg-mint px-2.5 py-1 font-mono text-[11px] font-medium text-bg">
        승인 완료
      </span>
    );
  }
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-pill border border-border bg-surface-2 px-2.5 py-1 font-mono text-[11px] text-fg-muted">
      <StatusDot tone="idle" />
      대기
    </span>
  );
}

/* -------------------------------------------------------------------------- */

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-6 rounded-xl border border-border bg-surface-1 px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-pill bg-surface-2 text-fg-muted">
        <Folder className="h-6 w-6" strokeWidth={1.5} />
      </div>
      <div className="flex flex-col gap-2">
        <h2 className="font-display text-h2 font-bold text-fg">
          아직 생성한 프로젝트가 없습니다
        </h2>
        <p className="max-w-md font-kr text-[14px] leading-[1.55] text-fg-dim">
          대시보드에서 브랜드 가이드를 적용하고 제품 이미지를 업로드하면 새
          프로젝트가 여기에 쌓입니다.
        </p>
      </div>
      <Link
        href="/dashboard"
        className="inline-flex h-11 items-center gap-2 rounded-md bg-mint px-5 font-kr text-[13px] font-semibold text-bg outline-none transition-all duration-micro ease-lz hover:bg-mint-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint active:scale-[0.98] active:bg-mint-press"
      >
        <span aria-hidden className="text-[14px] leading-none">
          ✦
        </span>
        새 에셋 요청
      </Link>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function formatRelative(ts: number): string {
  const diff = Math.max(0, Date.now() - ts);
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "방금 전";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}일 전`;
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
