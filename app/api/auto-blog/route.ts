import { NextResponse } from "next/server";

/**
 * ChefWorkKit
 *
 * Automatic AI blog generation is disabled.
 *
 * This route remains available only to reject
 * requests from old cron jobs or integrations.
 *
 * No Gemini API calls.
 * No Supabase database writes.
 * No keyword updates.
 */

export async function GET() {
  return NextResponse.json(
    {
      success: false,
      code: "AUTO_BLOG_DISABLED",
      message:
        "ระบบสร้างบทความอัตโนมัติด้วย AI ถูกปิดใช้งานแล้ว",
    },
    {
      status: 410,
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}