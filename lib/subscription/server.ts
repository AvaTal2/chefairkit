import {
  createClient,
} from "@supabase/supabase-js";

import {
  FREE_SUBSCRIPTION,
  getPlanPermissions,
  type PlanPermissions,
  type SubscriptionRecord,
} from "@/lib/subscription/permissions";

const getSupabaseAdmin = () => {
  const supabaseUrl =
    process.env
      .NEXT_PUBLIC_SUPABASE_URL;

  const serviceRoleKey =
    process.env
      .SUPABASE_SERVICE_ROLE_KEY;

  if (
    !supabaseUrl ||
    !serviceRoleKey
  ) {
    throw new Error(
      "Missing Supabase server environment variables"
    );
  }

  return createClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        persistSession:
          false,
        autoRefreshToken:
          false,
      },
    }
  );
};

export async function getSubscriptionForUser(
  userId: string
): Promise<SubscriptionRecord> {
  const supabase =
    getSupabaseAdmin();

  const {
    data,
    error,
  } =
    await supabase
      .from(
        "user_subscriptions"
      )
      .select(
        `
        id,
        user_id,
        plan,
        status,
        billing_type,
        starts_at,
        expires_at,
        cancel_at_period_end,
        stripe_customer_id,
        stripe_subscription_id,
        stripe_price_id,
        created_at,
        updated_at
        `
      )
      .eq(
        "user_id",
        userId
      )
      .maybeSingle();

  if (error) {
    console.error(
      "Server subscription lookup error:",
      error
    );

    return {
      ...FREE_SUBSCRIPTION,
    };
  }

  if (!data) {
    return {
      ...FREE_SUBSCRIPTION,
    };
  }

  return data as SubscriptionRecord;
}

export async function getPermissionsForUser(
  userId: string
): Promise<PlanPermissions> {
  const subscription =
    await getSubscriptionForUser(
      userId
    );

  return getPlanPermissions(
    subscription
  );
}
