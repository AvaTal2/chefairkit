"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  supabase,
} from "@/lib/supabase/client";

import {
  FREE_SUBSCRIPTION,
  getPlanPermissions,
  type PlanPermissions,
  type SubscriptionRecord,
} from "@/lib/subscription/permissions";

type UseSubscriptionResult = {
  loading: boolean;

  subscription:
    SubscriptionRecord;

  permissions:
    PlanPermissions;

  refresh:
    () => Promise<void>;
};

export function useSubscription(): UseSubscriptionResult {
  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    subscription,
    setSubscription,
  ] =
    useState<SubscriptionRecord>(
      FREE_SUBSCRIPTION
    );

  const loadSubscription =
    useCallback(
      async () => {
        setLoading(true);

        const {
          data: { user },
        } =
          await supabase.auth.getUser();

        if (!user) {
          setSubscription(
            FREE_SUBSCRIPTION
          );

          setLoading(false);
          return;
        }

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
              user.id
            )
            .maybeSingle();

        if (error) {
          console.error(
            "Load subscription error:",
            error
          );

          setSubscription(
            FREE_SUBSCRIPTION
          );

          setLoading(false);
          return;
        }

        if (!data) {
          setSubscription(
            FREE_SUBSCRIPTION
          );

          setLoading(false);
          return;
        }

        setSubscription(
          data as SubscriptionRecord
        );

        setLoading(false);
      },
      []
    );

  useEffect(() => {
    loadSubscription();
  }, [
    loadSubscription,
  ]);

  const permissions =
    useMemo(
      () =>
        getPlanPermissions(
          subscription
        ),
      [
        subscription,
      ]
    );

  return {
    loading,
    subscription,
    permissions,
    refresh:
      loadSubscription,
  };
}
