import type { Metadata } from "next";
import { BrandGuideClient } from "./brand-client";

export const metadata: Metadata = {
  title: "브랜드 가이드",
};

export default function BrandPage() {
  return <BrandGuideClient />;
}
