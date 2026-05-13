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
    // fal-ai/client wraps non-2xx responses in ApiError whose `message` is only
    // the HTTP status text (e.g. "Unprocessable Entity"). Validation details
    // live on `body` / `status`. Surface both so server logs and the client
    // toast can show what fal actually rejected.
    const err = e as { message?: string; status?: number; body?: unknown };
    const detail =
      err.body !== undefined
        ? typeof err.body === "string"
          ? err.body
          : JSON.stringify(err.body)
        : undefined;
    console.error("[api/jobs] startGeneration failed:", {
      kind: body.kind,
      message: err.message,
      status: err.status,
      body: err.body,
    });
    const message = detail
      ? `${err.message ?? "생성 요청 실패"} — ${detail}`
      : (err.message ?? "생성 요청 실패");
    return NextResponse.json(
      { code: "GENERATION_FAILED", message },
      { status: 500 },
    );
  }
}
