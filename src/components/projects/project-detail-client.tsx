"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import {
  deriveAssetView,
  deriveProjectStatus,
  useJobsStore,
  type AssetView,
} from "@/lib/stores/jobs-store";
import { ProjectHeader } from "@/components/projects/project-header";
import { ReviewBoard } from "@/components/projects/review-board";
import type { AssetType, Project } from "@/lib/mock-data";

const POLL_INTERVAL_MS = 1500;

export type ProjectDetailClientProps = {
  projectId: string;
  /** Server-side legacy project (e.g. fixture proj-1). null if not found server-side. */
  fallbackProject: Project | null;
};

export function ProjectDetailClient({
  projectId,
  fallbackProject,
}: ProjectDetailClientProps) {
  const generated = useJobsStore((s) => s.generationProjects[projectId]);
  const jobs = useJobsStore((s) => s.jobs);
  const pollJob = useJobsStore((s) => s.pollJob);

  // Polling: only for generated projects with active jobs.
  // Effect re-runs only when project id changes (jobIds is stable per session).
  useEffect(() => {
    if (!generated) return;
    const ids = Object.values(generated.jobIds).filter(Boolean) as string[];
    if (ids.length === 0) return;

    const tick = (): boolean => {
      const currentJobs = useJobsStore.getState().jobs;
      const allDone = ids.every((id) => {
        const j = currentJobs[id];
        return j && (j.status === "succeeded" || j.status === "failed");
      });
      if (allDone) return true;
      ids.forEach((id) => {
        const j = currentJobs[id];
        if (j && (j.status === "succeeded" || j.status === "failed")) return;
        void pollJob(id);
      });
      return false;
    };

    tick(); // initial

    const interval = setInterval(() => {
      if (tick()) clearInterval(interval);
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generated?.id, pollJob]);

  const data = useMemo(() => {
    if (generated) {
      const views: Partial<Record<AssetType, AssetView>> = {};
      generated.assetTypes.forEach((kind) => {
        views[kind] = deriveAssetView(
          kind,
          generated.jobIds[kind],
          generated.startErrors[kind],
          jobs,
        );
      });
      return {
        name: generated.name,
        status: deriveProjectStatus(generated, jobs),
        assetTypes: generated.assetTypes,
        views: views as Record<AssetType, AssetView>,
      };
    }
    if (fallbackProject) {
      const views: Partial<Record<AssetType, AssetView>> = {};
      fallbackProject.assets.forEach((a) => {
        views[a.type] = {
          kind: a.type,
          status: "ready",
          variants: a.variants,
        };
      });
      return {
        name: fallbackProject.name,
        status: fallbackProject.status,
        assetTypes: fallbackProject.assetTypes,
        views: views as Record<AssetType, AssetView>,
      };
    }
    return null;
  }, [generated, fallbackProject, jobs]);

  if (!data) {
    return <NotFoundView projectId={projectId} />;
  }

  return (
    <>
      <ProjectHeader name={data.name} status={data.status} />
      <ReviewBoard assetTypes={data.assetTypes} views={data.views} />
    </>
  );
}

function NotFoundView({ projectId }: { projectId: string }) {
  return (
    <div className="flex flex-col items-center gap-5 py-16 text-center">
      <h1 className="font-display text-h2 font-bold text-fg">
        프로젝트를 찾을 수 없습니다
      </h1>
      <p className="max-w-md font-kr text-[14px] leading-[1.55] text-fg-dim">
        ID{" "}
        <span className="font-mono text-fg">{projectId}</span>
        {" "}에 해당하는 프로젝트가 없습니다.
        <br />
        새로고침으로 클라이언트 상태가 사라졌거나, 잘못된 링크일 수 있습니다.
      </p>
      <Link
        href="/"
        className="inline-flex h-11 items-center gap-2 rounded-md bg-mint px-5 font-kr text-[13px] font-semibold text-bg outline-none transition-all duration-micro ease-lz hover:bg-mint-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint active:scale-[0.98] active:bg-mint-press"
      >
        <span aria-hidden>←</span>
        대시보드로 돌아가기
      </Link>
    </div>
  );
}
