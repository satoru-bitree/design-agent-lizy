import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { ai } from "@/lib/ai";
import { db, schema } from "@/lib/db";
import type { Job } from "@/lib/ai/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  // Terminal-state short-circuit: once a job has succeeded or failed it will
  // never change, so re-hitting fal's queue API is wasted spend. Serve the
  // cached row directly.
  try {
    const cached = await db.query.jobs.findFirst({
      where: eq(schema.jobs.id, params.id),
    });
    if (cached && (cached.status === "succeeded" || cached.status === "failed")) {
      return NextResponse.json(rowToJob(cached));
    }
  } catch (e) {
    // Cache miss / DB hiccup shouldn't break polling — fall through to fal.
    console.error("[api/jobs/[id]] cache read failed:", e);
  }

  const job = await ai.getJob(params.id);
  if (!job) {
    return NextResponse.json(
      { code: "NOT_FOUND", message: "Job not found" },
      { status: 404 },
    );
  }

  // Write-through: cache the latest poll result so subsequent terminal hits
  // can skip fal, and so a refresh can paint last-known status without
  // waiting on the next poll tick.
  try {
    await db
      .insert(schema.jobs)
      .values({
        id: job.id,
        kind: job.kind,
        status: job.status,
        progress: job.progress,
        result: job.result ?? null,
        error: job.error ?? null,
        startedAt: job.startedAt,
      })
      .onConflictDoUpdate({
        target: schema.jobs.id,
        set: {
          status: job.status,
          progress: job.progress,
          result: job.result ?? null,
          error: job.error ?? null,
          updatedAt: sql`now()`,
        },
      });
  } catch (e) {
    // Persistence failure shouldn't fail the poll — the next tick will retry.
    console.error("[api/jobs/[id]] write-through failed:", e);
  }

  return NextResponse.json(job);
}

function rowToJob(row: typeof schema.jobs.$inferSelect): Job {
  return {
    id: row.id,
    kind: row.kind,
    status: row.status,
    progress: row.progress,
    result: row.result ?? undefined,
    error: row.error ?? undefined,
    startedAt: row.startedAt,
  };
}
