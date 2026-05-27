import { NextResponse } from "next/server";
import { desc, inArray } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import type { Job } from "@/lib/ai/types";
import { rowToProject } from "@/lib/db/serialize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await db.query.projects.findMany({
      orderBy: [desc(schema.projects.createdAt)],
    });

    // Collect every jobId referenced by every project so the dashboard can
    // render last-known status without a second roundtrip per card.
    const jobIds = new Set<string>();
    for (const row of rows) {
      for (const id of Object.values(row.jobIds ?? {})) {
        if (id) jobIds.add(id);
      }
    }
    const jobs: Record<string, Job> = {};
    if (jobIds.size > 0) {
      const jobRows = await db.query.jobs.findMany({
        where: inArray(schema.jobs.id, Array.from(jobIds)),
      });
      for (const j of jobRows) {
        jobs[j.id] = {
          id: j.id,
          kind: j.kind,
          status: j.status,
          progress: j.progress,
          result: j.result ?? undefined,
          error: j.error ?? undefined,
          startedAt: j.startedAt,
        };
      }
    }

    return NextResponse.json({
      projects: rows.map(rowToProject),
      jobs,
    });
  } catch (e) {
    console.error("[api/projects] GET failed:", e);
    return NextResponse.json(
      { code: "DB_ERROR", message: dbErrorMessage(e) },
      { status: 500 },
    );
  }
}

type CreateBody = {
  id?: unknown;
  name?: unknown;
  market?: unknown;
  brandMessage?: unknown;
  brandGuide?: unknown;
  product?: unknown;
  references?: unknown;
  assetTypes?: unknown;
  styleShotSettings?: unknown;
  shortVideoSettings?: unknown;
  jobIds?: unknown;
  startErrors?: unknown;
  createdAt?: unknown;
};

export async function POST(req: Request) {
  let body: CreateBody;
  try {
    body = (await req.json()) as CreateBody;
  } catch {
    return NextResponse.json(
      { code: "INVALID_INPUT", message: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const missing: string[] = [];
  if (typeof body.id !== "string") missing.push("id");
  if (typeof body.name !== "string") missing.push("name");
  if (typeof body.market !== "string") missing.push("market");
  if (typeof body.brandMessage !== "string") missing.push("brandMessage");
  if (!body.brandGuide || typeof body.brandGuide !== "object")
    missing.push("brandGuide");
  if (!body.product || typeof body.product !== "object") missing.push("product");
  if (!Array.isArray(body.assetTypes)) missing.push("assetTypes");
  if (typeof body.createdAt !== "number") missing.push("createdAt");
  if (missing.length > 0) {
    return NextResponse.json(
      { code: "INVALID_INPUT", message: `Missing/invalid: ${missing.join(", ")}` },
      { status: 400 },
    );
  }

  try {
    await db
      .insert(schema.projects)
      .values({
        id: body.id as string,
        name: body.name as string,
        market: body.market as string,
        brandMessage: body.brandMessage as string,
        brandGuide: body.brandGuide as never,
        product: body.product as never,
        references: (body.references ?? null) as never,
        assetTypes: body.assetTypes as never,
        styleShotSettings: (body.styleShotSettings ?? null) as never,
        shortVideoSettings: (body.shortVideoSettings ?? null) as never,
        jobIds: (body.jobIds ?? {}) as never,
        startErrors: (body.startErrors ?? {}) as never,
        createdAt: body.createdAt as number,
      })
      .onConflictDoNothing();
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e) {
    console.error("[api/projects] POST failed:", e);
    return NextResponse.json(
      { code: "DB_ERROR", message: dbErrorMessage(e) },
      { status: 500 },
    );
  }
}

function dbErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  return "Database error";
}
