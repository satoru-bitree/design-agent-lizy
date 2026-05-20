import { NextResponse } from "next/server";
import { ai } from "@/lib/ai";
import { AIError, type BrandSectionInterpretInput } from "@/lib/ai/types";

export const runtime = "nodejs";

type Body = {
  section?: unknown;
  text?: unknown;
  imageDataUrl?: unknown;
  fileName?: unknown;
  mimeType?: unknown;
};

const SECTIONS = new Set<BrandSectionInterpretInput["section"]>([
  "palette",
  "typography",
  "mood",
  "logo",
]);

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

  if (
    typeof body.section !== "string" ||
    !SECTIONS.has(body.section as BrandSectionInterpretInput["section"])
  ) {
    return NextResponse.json(
      {
        code: "INVALID_INPUT",
        message: "section must be palette|typography|mood|logo",
      },
      { status: 400 },
    );
  }

  const section = body.section as BrandSectionInterpretInput["section"];

  try {
    let input: BrandSectionInterpretInput;
    if (section === "logo") {
      if (
        typeof body.imageDataUrl !== "string" ||
        body.imageDataUrl.length === 0
      ) {
        return NextResponse.json(
          {
            code: "INVALID_INPUT",
            message: "imageDataUrl is required for logo section",
          },
          { status: 400 },
        );
      }
      input = {
        section: "logo",
        imageDataUrl: body.imageDataUrl,
        fileName:
          typeof body.fileName === "string" ? body.fileName : "brand-logo.png",
        mimeType:
          typeof body.mimeType === "string" ? body.mimeType : undefined,
      };
    } else {
      if (typeof body.text !== "string" || body.text.trim().length === 0) {
        return NextResponse.json(
          { code: "INVALID_INPUT", message: "text is required" },
          { status: 400 },
        );
      }
      input = { section, text: body.text };
    }

    const result = await ai.interpretBrandSection(input);
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof AIError) {
      return NextResponse.json(
        { code: e.code, message: e.message },
        { status: 500 },
      );
    }
    return NextResponse.json(
      { code: "EXTRACTION_FAILED", message: "해석에 실패했습니다." },
      { status: 500 },
    );
  }
}
