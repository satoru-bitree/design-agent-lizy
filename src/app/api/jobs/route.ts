import { NextResponse } from "next/server";
import { ai } from "@/lib/ai";
import type { GenerationInput, JobKind } from "@/lib/ai/types";

export const runtime = "nodejs";

const VALID_KINDS: JobKind[] = ["package", "style_shot", "short_video"];

type Body = { kind?: unknown; input?: unknown };

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json(
      { code: "INVALID_INPUT", message: "Invalid JSON body" },
      { status: 400 },
    );
  }

  if (typeof body.kind !== "string" || !VALID_KINDS.includes(body.kind as JobKind)) {
    return NextResponse.json(
      { code: "INVALID_INPUT", message: "kind must be one of package|style_shot|short_video" },
      { status: 400 },
    );
  }

  if (!body.input || typeof body.input !== "object") {
    return NextResponse.json(
      { code: "INVALID_INPUT", message: "input is required" },
      { status: 400 },
    );
  }

  try {
    const { jobId, uploads } = await ai.startGeneration(
      body.kind as JobKind,
      body.input as GenerationInput,
    );
    return NextResponse.json({ jobId, uploads });
  } catch (e) {
    return NextResponse.json(
      {
        code: "GENERATION_FAILED",
        message: e instanceof Error ? e.message : "생성 요청 실패",
      },
      { status: 500 },
    );
  }
}
