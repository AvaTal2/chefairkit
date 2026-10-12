import { NextResponse } from "next/server";

/**
 * ChefWorkKit - Free Edition
 *
 * Stripe Checkout has been disabled.
 *
 * All application features are now intended
 * to be available without purchasing a plan.
 *
 * This endpoint is retained to safely reject
 * requests from older application versions.
 *
 * No Stripe API calls.
 * No new customers.
 * No checkout sessions.
 * No Supabase database modifications.
 */

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      code: "BILLING_DISABLED",
      error:
        "ChefWorkKit เปิดให้ใช้งานฟรีแล้ว ไม่จำเป็นต้องสมัครแพ็กเกจหรือชำระเงิน",
    },
    {
      status: 410,
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}