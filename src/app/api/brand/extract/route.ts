import { NextResponse } from "next/server";
import { ai } from "@/lib/ai";
import { AIError } from "@/lib/ai/types";

export const runtime = "nodejs";

type Body = {
  fileName?: unknown;
  fileSize?: unknown;
  mimeType?: unknown;
  sourceUrl?: unknown;
};

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

  if (typeof body.fileName !== "string" || body.fileName.length === 0) {
    return NextResponse.json(
      { code: "INVALID_INPUT", message: "fileName is required" },
      { status: 400 },
    );
  }

  try {
    const result = await ai.extractBrandGuide({
      fileName: body.fileName,
      fileSize: typeof body.fileSize === "number" ? body.fileSize : 0,
      mimeType:
        typeof body.mimeType === "string"
          ? body.mimeType
          : "application/octet-stream",
      sourceUrl:
        typeof body.sourceUrl === "string" ? body.sourceUrl : undefined,
    });
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof AIError) {
      return NextResponse.json(
        { code: e.code, message: e.message },
        { status: 500 },
      );
    }
    return NextResponse.json(
      { code: "EXTRACTION_FAILED", message: "분석에 실패했습니다." },
      { status: 500 },
    );
  }
}
