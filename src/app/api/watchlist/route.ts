import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET() {
  const db = createAdminClient();
  const { data, error } = await db
    .from("watchlist")
    .select("*")
    .eq("enabled", true)
    .order("symbol");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ watchlist: data });
}
