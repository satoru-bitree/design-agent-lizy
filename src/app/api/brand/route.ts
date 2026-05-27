import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import type { BrandPersisted } from "@/lib/db/schema";

export const runtime = "nodejs";
// Brand state is per-user-session draft work — there's no upstream cache to
// reuse, and the singleton row is always read live. Skip Next.js fetch cache.
export const dynamic = "force-dynamic";

const BRAND_ID = "current";

export async function GET() {
  try {
    const row = await db.query.brandState.findFirst({
      where: eq(schema.brandState.id, BRAND_ID),
    });
    return NextResponse.json({ brand: row?.data ?? null });
  } catch (e) {
    console.error("[api/brand] GET failed:", e);
    return NextResponse.json(
      { code: "DB_ERROR", message: dbErrorMessage(e) },
      { status: 500 },
    );
  }
}

export async function PUT(req: Request) {
  let body: { brand?: BrandPersisted };
  try {
    body = (await req.json()) as { brand?: BrandPersisted };
  } catch {
    return NextResponse.json(
      { code: "INVALID_INPUT", message: "Invalid JSON body" },
      { status: 400 },
    );
  }
  if (!body.brand || typeof body.brand !== "object") {
    return NextResponse.json(
      { code: "INVALID_INPUT", message: "brand payload is required" },
      { status: 400 },
    );
  }
  try {
    await db
      .insert(schema.brandState)
      .values({ id: BRAND_ID, data: body.brand })
      .onConflictDoUpdate({
        target: schema.brandState.id,
        set: { data: body.brand, updatedAt: sql`now()` },
      });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[api/brand] PUT failed:", e);
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
