import { NextResponse } from "next/server";

/**
 * ChefWorkKit
 *
 * AI SOP generation has been permanently disabled.
 *
 * The application now uses manual SOP creation and editing.
 * This endpoint is retained to safely reject requests
 * from older application versions.
 *
 * No external AI API calls.
 * No Supabase service-role access.
 * No AI usage tracking.
 */

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      code: "AI_FEATURE_DISABLED",
      error:
        "ระบบสร้าง SOP ด้วย AI ถูกปิดใช้งานแล้ว กรุณาสร้างหรือแก้ไข SOP ด้วยตนเอง",
    },
    {
      status: 410,
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}