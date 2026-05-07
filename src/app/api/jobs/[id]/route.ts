import { NextResponse } from "next/server";
import { ai } from "@/lib/ai";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const job = await ai.getJob(params.id);
  if (!job) {
    return NextResponse.json(
      { code: "NOT_FOUND", message: "Job not found" },
      { status: 404 },
    );
  }
  return NextResponse.json(job);
}
