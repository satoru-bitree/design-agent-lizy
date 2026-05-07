import type { Metadata } from "next";
import { SideNav } from "@/components/layout/side-nav";
import { BottomBar } from "@/components/layout/bottom-bar";
import { ProjectsListClient } from "@/components/projects/projects-list-client";

export const metadata: Metadata = {
  title: "프로젝트",
};

export default function ProjectsPage() {
  return (
    <div className="flex">
      <SideNav className="sticky top-16 hidden h-[calc(100vh-4rem)] lg:flex" />

      <div className="flex min-w-0 flex-1 flex-col">
        <main className="flex-1 px-5 py-6 sm:px-8 sm:py-8">
          <div className="mx-auto max-w-screen-2xl">
            <ProjectsListClient />
          </div>
        </main>

        <BottomBar />
      </div>
    </div>
  );
}
