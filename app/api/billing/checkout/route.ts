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

type CheckoutBody = {
  billingType:
    | "auto_renew"
    | "promptpay_monthly";
};

export async function POST(
  request: NextRequest
) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        {
          error:
            "ยังไม่ได้ตั้งค่า STRIPE_SECRET_KEY",
        },
        {
          status: 500,
        }
      );
    }

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
            "กรุณาเข้าสู่ระบบก่อนสมัครแพ็กเกจ",
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
            "Session ไม่ถูกต้อง กรุณาเข้าสู่ระบบใหม่",
        },
        {
          status: 401,
        }
      );
    }

    const body =
      (await request.json()) as CheckoutBody;

    if (
      body.billingType !==
        "auto_renew" &&
      body.billingType !==
        "promptpay_monthly"
    ) {
      return NextResponse.json(
        {
          error:
            "รูปแบบการชำระเงินไม่ถูกต้อง",
        },
        {
          status: 400,
        }
      );
    }

    const user =
      userData.user;

    const origin =
      request.nextUrl.origin;

    const {
      data:
        subscriptionRow,
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
          user.id
        )
        .maybeSingle();

    let customerId =
      subscriptionRow
        ?.stripe_customer_id ||
      null;

    if (!customerId) {
      const customer =
        await stripe.customers.create(
          {
            email:
              user.email ||
              undefined,

            metadata: {
              user_id:
                user.id,
            },
          }
        );

      customerId =
        customer.id;
    }

    if (
      body.billingType ===
      "auto_renew"
    ) {
      const recurringPriceId =
        process.env
          .STRIPE_PRO_MONTHLY_RECURRING_PRICE_ID;

      if (!recurringPriceId) {
        return NextResponse.json(
          {
            error:
              "ยังไม่ได้ตั้งค่า STRIPE_PRO_MONTHLY_RECURRING_PRICE_ID",
          },
          {
            status: 500,
          }
        );
      }

      const session =
        await stripe.checkout.sessions.create(
          {
            mode:
              "subscription",

            customer:
              customerId,

            allow_promotion_codes:
              true,

            line_items: [
              {
                price:
                  recurringPriceId,

                quantity: 1,
              },
            ],

            success_url:
              `${origin}/billing/success?session_id={CHECKOUT_SESSION_ID}`,

            cancel_url:
              `${origin}/pricing?cancelled=1`,

            metadata: {
              user_id:
                user.id,

              plan:
                "pro",

              billing_type:
                "stripe_subscription",
            },

            subscription_data: {
              metadata: {
                user_id:
                  user.id,

                plan:
                  "pro",
              },
            },
          }
        );

      return NextResponse.json(
        {
          url:
            session.url,
        }
      );
    }

    const oneTimePriceId =
      process.env
        .STRIPE_PRO_MONTHLY_ONETIME_PRICE_ID;

    if (!oneTimePriceId) {
      return NextResponse.json(
        {
          error:
            "ยังไม่ได้ตั้งค่า STRIPE_PRO_MONTHLY_ONETIME_PRICE_ID",
        },
        {
          status: 500,
        }
      );
    }

    const session =
      await stripe.checkout.sessions.create(
        {
          mode:
            "payment",

          customer:
            customerId,

          allow_promotion_codes:
            true,

          payment_method_types: [
            "promptpay",
          ],

          line_items: [
            {
              price:
                oneTimePriceId,

              quantity: 1,
            },
          ],

          success_url:
            `${origin}/billing/success?session_id={CHECKOUT_SESSION_ID}`,

          cancel_url:
            `${origin}/pricing?cancelled=1`,

          metadata: {
            user_id:
              user.id,

            plan:
              "pro",

            billing_type:
              "manual",
          },

          payment_intent_data: {
            metadata: {
              user_id:
                user.id,

              plan:
                "pro",

              billing_type:
                "manual",
            },
          },
        }
      );

    return NextResponse.json(
      {
        url:
          session.url,
      }
    );
  } catch (error) {
    console.error(
      "Create checkout session error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "สร้างหน้าชำระเงินไม่สำเร็จ",
      },
      {
        status: 500,
      }
    );
  }
}
