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

function addThirtyDays(
  fromDate: Date
) {
  const date =
    new Date(
      fromDate
    );

  date.setDate(
    date.getDate() + 30
  );

  return date;
}

async function activateManualPro(
  userId: string,
  session: Stripe.Checkout.Session
) {
  const supabase =
    getSupabaseAdmin();

  const now =
    new Date();

  const {
    data:
      existing,
  } =
    await supabase
      .from(
        "user_subscriptions"
      )
      .select(
        "id, expires_at"
      )
      .eq(
        "user_id",
        userId
      )
      .maybeSingle();

  let periodStart =
    now;

  if (
    existing?.expires_at
  ) {
    const currentExpiry =
      new Date(
        existing.expires_at
      );

    if (
      currentExpiry.getTime() >
      now.getTime()
    ) {
      periodStart =
        currentExpiry;
    }
  }

  const periodEnd =
    addThirtyDays(
      periodStart
    );

  const customerId =
    typeof session.customer ===
    "string"
      ? session.customer
      : session.customer?.id ||
        null;

  const {
    data:
      subscriptionData,
    error:
      subscriptionError,
  } =
    await supabase
      .from(
        "user_subscriptions"
      )
      .upsert(
        {
          user_id:
            userId,

          plan:
            "pro",

          status:
            "active",

          billing_type:
            "manual",

          starts_at:
            now.toISOString(),

          expires_at:
            periodEnd.toISOString(),

          cancel_at_period_end:
            false,

          stripe_customer_id:
            customerId,

          stripe_subscription_id:
            null,

          stripe_price_id:
            process.env
              .STRIPE_PRO_MONTHLY_ONETIME_PRICE_ID ||
            null,

          updated_at:
            now.toISOString(),
        },
        {
          onConflict:
            "user_id",
        }
      )
      .select("id")
      .single();

  if (
    subscriptionError
  ) {
    throw subscriptionError;
  }

  await supabase
    .from(
      "subscription_payments"
    )
    .insert({
      user_id:
        userId,

      subscription_id:
        subscriptionData.id,

      plan:
        "pro",

      payment_method:
        "promptpay",

      amount:
        Number(
          session.amount_total ||
            0
        ) / 100,

      currency:
        session.currency ||
        "thb",

      status:
        "paid",

      stripe_payment_intent_id:
        typeof session.payment_intent ===
        "string"
          ? session.payment_intent
          : session.payment_intent?.id ||
            null,

      stripe_checkout_session_id:
        session.id,

      paid_at:
        now.toISOString(),

      period_start:
        periodStart.toISOString(),

      period_end:
        periodEnd.toISOString(),

      updated_at:
        now.toISOString(),
    });
}

async function syncStripeSubscription(
  subscription: Stripe.Subscription
) {
  const supabase =
    getSupabaseAdmin();

  const userId =
    subscription.metadata
      .user_id;

  if (!userId) {
    console.error(
      "Stripe subscription missing user_id metadata:",
      subscription.id
    );

    return;
  }

  const item =
    subscription.items
      .data[0];

  const customerId =
    typeof subscription.customer ===
    "string"
      ? subscription.customer
      : subscription.customer.id;

  const status =
    subscription.status ===
      "active" ||
    subscription.status ===
      "trialing"
      ? subscription.status
      : subscription.status ===
        "past_due"
      ? "past_due"
      : subscription.status ===
        "canceled"
      ? "cancelled"
      : "expired";

  const periodStart =
    item?.current_period_start
      ? new Date(
          item.current_period_start *
            1000
        ).toISOString()
      : new Date().toISOString();

  const periodEnd =
    item?.current_period_end
      ? new Date(
          item.current_period_end *
            1000
        ).toISOString()
      : null;

  await supabase
    .from(
      "user_subscriptions"
    )
    .upsert(
      {
        user_id:
          userId,

        plan:
          "pro",

        status,

        billing_type:
          "stripe_subscription",

        starts_at:
          periodStart,

        expires_at:
          periodEnd,

        cancel_at_period_end:
          subscription
            .cancel_at_period_end,

        stripe_customer_id:
          customerId,

        stripe_subscription_id:
          subscription.id,

        stripe_price_id:
          item?.price.id ||
          null,

        updated_at:
          new Date().toISOString(),
      },
      {
        onConflict:
          "user_id",
      }
    );
}

export async function POST(
  request: NextRequest
) {
  try {
    const webhookSecret =
      process.env
        .STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      return NextResponse.json(
        {
          error:
            "Missing STRIPE_WEBHOOK_SECRET",
        },
        {
          status: 500,
        }
      );
    }

    const signature =
      request.headers.get(
        "stripe-signature"
      );

    if (!signature) {
      return NextResponse.json(
        {
          error:
            "Missing Stripe signature",
        },
        {
          status: 400,
        }
      );
    }

    const rawBody =
      await request.text();

    let event:
      Stripe.Event;

    try {
      event =
        stripe.webhooks.constructEvent(
          rawBody,
          signature,
          webhookSecret
        );
    } catch (error) {
      console.error(
        "Stripe webhook signature error:",
        error
      );

      return NextResponse.json(
        {
          error:
            "Invalid webhook signature",
        },
        {
          status: 400,
        }
      );
    }

    switch (
      event.type
    ) {
      case "checkout.session.completed": {
        const session =
          event.data
            .object as Stripe.Checkout.Session;

        const userId =
          session.metadata
            ?.user_id;

        const billingType =
          session.metadata
            ?.billing_type;

        if (
          userId &&
          billingType ===
            "manual" &&
          session.payment_status ===
            "paid"
        ) {
          await activateManualPro(
            userId,
            session
          );
        }

        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription =
          event.data
            .object as Stripe.Subscription;

        await syncStripeSubscription(
          subscription
        );

        break;
      }

      default:
        break;
    }

    return NextResponse.json(
      {
        received: true,
      }
    );
  } catch (error) {
    console.error(
      "Stripe webhook error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Webhook processing failed",
      },
      {
        status: 500,
      }
    );
  }
}
