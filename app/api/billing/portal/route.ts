import { NextResponse } from "next/server";

/**
 * ChefWorkKit - Free Edition
 *
 * Stripe Billing Portal has been disabled.
 *
 * ChefWorkKit is now a free application.
 * No paid subscriptions are required.
 *
 * This endpoint is retained to reject
 * requests from older application versions.
 *
 * No Stripe API calls.
 * No Supabase database modifications.
 */

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      code: "BILLING_PORTAL_DISABLED",
      error:
        "ChefWorkKit เปิดให้ใช้งานฟรีแล้ว ไม่จำเป็นต้องจัดการแพ็กเกจหรือการชำระเงิน",
    },
    {
      status: 410,
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}