"use client";

import {
  useCallback,
  useMemo,
} from "react";

import {
  FREE_SUBSCRIPTION,
  getPlanPermissions,
  type PlanPermissions,
  type SubscriptionRecord,
} from "@/lib/subscription/permissions";

type UseSubscriptionResult = {
  loading: boolean;
  subscription: SubscriptionRecord;
  permissions: PlanPermissions;
  refresh: () => Promise<void>;
};

export function useSubscription(): UseSubscriptionResult {
  const subscription = FREE_SUBSCRIPTION;

  const permissions = useMemo(
    () => getPlanPermissions(subscription),
    [subscription]
  );

  const refresh = useCallback(async () => {
    // Free Edition:
    // ไม่มีการตรวจสอบแพ็กเกจหรือเรียกฐานข้อมูล Subscription
  }, []);

  return {
    loading: false,
    subscription,
    permissions,
    refresh,
  };
}