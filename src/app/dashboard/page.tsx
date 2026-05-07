import type { Metadata } from "next";
import { DashboardClient } from "./dashboard-client";

export const metadata: Metadata = {
  title: "대시보드 · Agentic Creative",
};

export default function DashboardPage() {
  return <DashboardClient />;
}
