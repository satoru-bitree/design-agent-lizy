import type { Metadata } from "next";
import { ComingSoon } from "@/components/layout/coming-soon";

export const metadata: Metadata = {
  title: "히스토리",
};

export default function HistoryPage() {
  return <ComingSoon title="히스토리" />;
}
