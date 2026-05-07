import type { Metadata } from "next";
import { SideNav } from "@/components/layout/side-nav";
import { BottomBar } from "@/components/layout/bottom-bar";
import { ProjectDetailClient } from "@/components/projects/project-detail-client";
import { getProject } from "@/lib/mock-data";

type PageProps = { params: { id: string } };

export function generateMetadata({ params }: PageProps): Metadata {
  const project = getProject(params.id);
  return {
    title: project
      ? `${project.name} · Agentic Creative`
      : "프로젝트 · Agentic Creative",
  };
}

export default function ProjectDetailPage({ params }: PageProps) {
  // Generated projects live in the client store. Server-side we only know
  // about static fixtures (e.g. proj-1) — pass that through as a fallback.
  const fallbackProject = getProject(params.id) ?? null;

  return (
    <div className="flex">
      <SideNav className="sticky top-16 hidden h-[calc(100vh-4rem)] lg:flex" />

      <div className="flex min-w-0 flex-1 flex-col">
        <main className="flex-1 px-5 py-6 sm:px-8 sm:py-8">
          <div className="mx-auto max-w-screen-2xl space-y-8">
            <ProjectDetailClient
              projectId={params.id}
              fallbackProject={fallbackProject}
            />
          </div>
        </main>

        <BottomBar />
      </div>
    </div>
  );
}
