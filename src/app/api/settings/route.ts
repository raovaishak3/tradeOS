import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * GET /api/settings — Get all settings (masks API keys)
 */
export async function GET() {
  const db = createAdminClient();
  const { data, error } = await db
    .from("user_settings")
    .select("*")
    .order("category");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Mask API keys in response
  const masked = (data || []).map(s => ({
    ...s,
    value: s.key.includes("api_key") && s.value
      ? s.value.slice(0, 4) + "..." + s.value.slice(-4)
      : s.value,
  }));

  return NextResponse.json({ settings: masked });
}

/**
 * PUT /api/settings — Update settings
 * Body: { key: string, value: string }
 */
export async function PUT(request: NextRequest) {
  const { key, value } = await request.json();
  if (!key) return NextResponse.json({ error: "Key required" }, { status: 400 });

  const db = createAdminClient();
  const { error } = await db
    .from("user_settings")
    .update({ value, updated_at: new Date().toISOString() })
    .eq("key", key);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, key });
}
