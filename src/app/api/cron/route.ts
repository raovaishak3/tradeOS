import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/cron — Triggered by Vercel Cron to auto-analyze all pairs
 * Only runs during London and New York sessions (7am-9pm UTC)
 */
export async function GET(request: NextRequest) {
  // Verify cron secret (Vercel sends this)
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // Allow without auth for now (can secure later)
  }

  const hour = new Date().getUTCHours();
  
  // Only analyze during active sessions (7am - 9pm UTC)
  if (hour < 7 || hour > 21) {
    return NextResponse.json({ skipped: true, reason: "Outside trading hours" });
  }

  // Call the analyze all endpoint
  const baseUrl = process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : "https://trade-os-coral.vercel.app";

  const res = await fetch(`${baseUrl}/api/analyze/all`, { method: "POST" });
  const data = await res.json();

  return NextResponse.json({ 
    cron: true, 
    time: new Date().toISOString(),
    ...data 
  });
}
