import { NextResponse } from "next/server";

/**
 * ChefWorkKit - Free Edition
 *
 * Stripe payments and subscriptions
 * are no longer supported.
 *
 * This endpoint is retained only to reject
 * requests from old Stripe integrations.
 *
 * No Stripe API calls.
 * No Supabase database modifications.
 */

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      code: "STRIPE_DISABLED",
      message:
        "ระบบชำระเงิน Stripe ถูกปิดใช้งานแล้ว เนื่องจาก ChefWorkKit เปิดให้ใช้งานฟรี",
    },
    {
      status: 410,
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}