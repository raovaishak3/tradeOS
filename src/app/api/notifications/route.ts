import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * GET /api/notifications — Get recent notifications
 * POST /api/notifications — Create a notification
 * PUT /api/notifications — Acknowledge a notification
 */
export async function GET(request: NextRequest) {
  const status = request.nextUrl.searchParams.get("status");
  const db = createAdminClient();

  let query = db.from("notifications").select("*").order("created_at", { ascending: false }).limit(50);
  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const unread = (data || []).filter(n => n.status !== "acknowledged" && n.status !== "archived").length;
  return NextResponse.json({ notifications: data || [], unread });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const db = createAdminClient();

  const { data, error } = await db.from("notifications").insert({
    category: body.category || "system",
    priority: body.priority || "medium",
    title: body.title,
    summary: body.summary,
    description: body.description || "",
    subsystem: body.subsystem || "manual",
    market: body.market || null,
    action_required: body.action_required || false,
    status: "created",
    metadata: body.metadata || {},
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ notification: data }, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const { id, status } = await request.json();
  const db = createAdminClient();

  await db.from("notifications")
    .update({ status, acknowledged_at: status === "acknowledged" ? new Date().toISOString() : null })
    .eq("id", id);

  return NextResponse.json({ success: true });
}
