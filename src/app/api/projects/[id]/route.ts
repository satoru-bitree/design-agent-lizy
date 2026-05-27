import { NextResponse } from "next/server";
import { eq, inArray } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import type { Job } from "@/lib/ai/types";
import { rowToProject } from "@/lib/db/serialize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const row = await db.query.projects.findFirst({
      where: eq(schema.projects.id, params.id),
    });
    if (!row) {
      return NextResponse.json(
        { code: "NOT_FOUND", message: "Project not found" },
        { status: 404 },
      );
    }

    const jobIdList = Object.values(row.jobIds ?? {}).filter(
      (v): v is string => typeof v === "string",
    );
    const jobs: Record<string, Job> = {};
    if (jobIdList.length > 0) {
      const jobRows = await db.query.jobs.findMany({
        where: inArray(schema.jobs.id, jobIdList),
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

    return NextResponse.json({ project: rowToProject(row), jobs });
  } catch (e) {
    console.error("[api/projects/[id]] GET failed:", e);
    return NextResponse.json(
      { code: "DB_ERROR", message: dbErrorMessage(e) },
      { status: 500 },
    );
  }
}

type PatchBody = Partial<{
  name: string;
  product: unknown;
  references: unknown;
  jobIds: unknown;
  startErrors: unknown;
  styleShotSettings: unknown;
  shortVideoSettings: unknown;
}>;

// Partial update — used by the store after submitGeneration/Revision lands a
// new jobId, after a kickOffKind failure, after retry, and after providers
// resolve a CDN URL. The whole project shape isn't shipped, only the slot
// that changed.
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  let body: PatchBody;
  try {
    body = (await req.json()) as PatchBody;
  } catch {
    return NextResponse.json(
      { code: "INVALID_INPUT", message: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const update: Record<string, unknown> = {};
  if (body.name !== undefined) update.name = body.name;
  if (body.product !== undefined) update.product = body.product;
  if (body.references !== undefined) update.references = body.references;
  if (body.jobIds !== undefined) update.jobIds = body.jobIds;
  if (body.startErrors !== undefined) update.startErrors = body.startErrors;
  if (body.styleShotSettings !== undefined)
    update.styleShotSettings = body.styleShotSettings;
  if (body.shortVideoSettings !== undefined)
    update.shortVideoSettings = body.shortVideoSettings;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ ok: true, noop: true });
  }

  try {
    const result = await db
      .update(schema.projects)
      .set(update)
      .where(eq(schema.projects.id, params.id))
      .returning({ id: schema.projects.id });
    if (result.length === 0) {
      return NextResponse.json(
        { code: "NOT_FOUND", message: "Project not found" },
        { status: 404 },
      );
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[api/projects/[id]] PATCH failed:", e);
    return NextResponse.json(
      { code: "DB_ERROR", message: dbErrorMessage(e) },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  try {
    // Look up the project first so we can clean up its orphaned job rows in
    // the same handler. The store does this client-side too, but the DB has
    // no FK and would otherwise hold dead cache rows forever.
    const row = await db.query.projects.findFirst({
      where: eq(schema.projects.id, params.id),
    });
    if (!row) {
      return NextResponse.json(
        { code: "NOT_FOUND", message: "Project not found" },
        { status: 404 },
      );
    }
    const jobIdList = Object.values(row.jobIds ?? {}).filter(
      (v): v is string => typeof v === "string",
    );
    await db.delete(schema.projects).where(eq(schema.projects.id, params.id));
    if (jobIdList.length > 0) {
      await db.delete(schema.jobs).where(inArray(schema.jobs.id, jobIdList));
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[api/projects/[id]] DELETE failed:", e);
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
