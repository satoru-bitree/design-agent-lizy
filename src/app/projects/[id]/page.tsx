import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SideNav } from "@/components/layout/side-nav";
import { BottomBar } from "@/components/layout/bottom-bar";
import { ProjectHeader } from "@/components/projects/project-header";
import { ReviewBoard } from "@/components/projects/review-board";
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
  const project = getProject(params.id);
  if (!project) notFound();

  return (
    <div className="flex">
      {/* Sidebar shown lg+ only; below lg accessible via TopNav hamburger */}
      <SideNav className="sticky top-16 hidden h-[calc(100vh-4rem)] lg:flex" />

      <div className="flex min-w-0 flex-1 flex-col">
        <main className="flex-1 px-5 py-6 sm:px-8 sm:py-8">
          <div className="mx-auto max-w-screen-2xl space-y-8">
            <ProjectHeader project={project} />
            <ReviewBoard project={project} />
          </div>
        </main>

        <BottomBar />
      </div>
    </div>
  );
}
