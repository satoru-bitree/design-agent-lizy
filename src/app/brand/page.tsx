import type { Metadata } from "next";
import { BrandGuideClient } from "./brand-client";

export const metadata: Metadata = {
  title: "브랜드 가이드",
};

export default function BrandPage({
  searchParams,
}: {
  searchParams: { from?: string };
}) {
  return <BrandGuideClient fromWizard={searchParams.from === "wizard"} />;
}
