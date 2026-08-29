import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY || ""
);

function getSupabaseAdmin() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing Supabase server environment variables"
    );
  }

  return createClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}

export async function POST(
  request: NextRequest
) {
  try {
    const authHeader =
      request.headers.get(
        "authorization"
      );

    const accessToken =
      authHeader?.startsWith(
        "Bearer "
      )
        ? authHeader.slice(7)
        : null;

    if (!accessToken) {
      return NextResponse.json(
        {
          error:
            "กรุณาเข้าสู่ระบบก่อน",
        },
        {
          status: 401,
        }
      );
    }

    const supabaseAdmin =
      getSupabaseAdmin();

    const {
      data: userData,
      error: userError,
    } =
      await supabaseAdmin.auth.getUser(
        accessToken
      );

    if (
      userError ||
      !userData.user
    ) {
      return NextResponse.json(
        {
          error:
            "Session ไม่ถูกต้อง",
        },
        {
          status: 401,
        }
      );
    }

    const {
      data:
        subscription,
      error:
        subscriptionError,
    } =
      await supabaseAdmin
        .from(
          "user_subscriptions"
        )
        .select(
          "stripe_customer_id"
        )
        .eq(
          "user_id",
          userData.user.id
        )
        .maybeSingle();

    if (
      subscriptionError ||
      !subscription
        ?.stripe_customer_id
    ) {
      return NextResponse.json(
        {
          error:
            "ยังไม่มีข้อมูลสมาชิก Stripe",
        },
        {
          status: 400,
        }
      );
    }

    const portalSession =
      await stripe.billingPortal.sessions.create(
        {
          customer:
            subscription
              .stripe_customer_id,

          return_url:
            `${request.nextUrl.origin}/account`,
        }
      );

    return NextResponse.json(
      {
        url:
          portalSession.url,
      }
    );
  } catch (error) {
    console.error(
      "Create billing portal error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "เปิดหน้าจัดการสมาชิกไม่สำเร็จ",
      },
      {
        status: 500,
      }
    );
  }
}
