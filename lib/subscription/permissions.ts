export type PlanName =
  | "free"
  | "pro"
  | "business";

export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "cancelled"
  | "expired";

export type BillingType =
  | "manual"
  | "stripe_subscription"
  | null;

export type SubscriptionRecord = {
  id?: string;
  user_id?: string;

  plan: PlanName;
  status: SubscriptionStatus;

  billing_type: BillingType;

  starts_at: string | null;
  expires_at: string | null;

  cancel_at_period_end: boolean;

  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  stripe_price_id?: string | null;

  created_at?: string;
  updated_at?: string;
};

export type PlanPermissions = {
  plan: PlanName;

  isFree: boolean;
  isPro: boolean;
  isBusiness: boolean;

  canUseAdvancedCost: boolean;
  canUseDynamicQr: boolean;
  canUseQrAnalytics: boolean;
  canUseProduction: boolean;
  canUseSop: boolean;
  canUseAiSop: boolean;
  canUseVersionHistory: boolean;
  canExport: boolean;

  recipeLimit: number | null;
  dynamicQrLimit: number | null;
  aiSopMonthlyLimit: number | null;
};

export const FREE_SUBSCRIPTION: SubscriptionRecord = {
  plan: "free",
  status: "active",
  billing_type: null,
  starts_at: null,
  expires_at: null,
  cancel_at_period_end: false,
};

export const isSubscriptionActive = (
  subscription:
    | SubscriptionRecord
    | null
    | undefined
) => {
  if (!subscription) {
    return true;
  }

  if (subscription.plan === "free") {
    return true;
  }

  if (
    subscription.status !== "active" &&
    subscription.status !== "trialing"
  ) {
    return false;
  }

  if (subscription.expires_at) {
    const expiresAt = new Date(
      subscription.expires_at
    ).getTime();

    if (
      Number.isFinite(expiresAt) &&
      expiresAt <= Date.now()
    ) {
      return false;
    }
  }

  return true;
};

export const getEffectivePlan = (
  subscription:
    | SubscriptionRecord
    | null
    | undefined
): PlanName => {
  if (!subscription) {
    return "free";
  }

  if (!isSubscriptionActive(subscription)) {
    return "free";
  }

  return subscription.plan;
};

export const getPlanPermissions = (
  subscription:
    | SubscriptionRecord
    | null
    | undefined
): PlanPermissions => {
  const plan = getEffectivePlan(subscription);

  const isFree = plan === "free";
  const isPro = plan === "pro";
  const isBusiness = plan === "business";

  /*
   * ChefWorkKit Free Access
   *
   * ฟังก์ชันที่ไม่ใช่ AI เปิดให้ใช้ฟรีทั้งหมด
   * เก็บโครงสร้าง Subscription เดิมไว้
   * เพื่อรองรับการใช้งานในอนาคต
   *
   * AI ถูกปิดสำหรับทุกแพ็กเกจ
   *
   * หมายเหตุ:
   * ต้องปิด AI API ฝั่ง Server แยกต่างหาก
   */

  return {
    plan,

    isFree,
    isPro,
    isBusiness,

    canUseAdvancedCost: true,
    canUseDynamicQr: true,
    canUseQrAnalytics: true,
    canUseProduction: true,
    canUseSop: true,
    canUseAiSop: false,
    canUseVersionHistory: true,
    canExport: true,

    recipeLimit: null,
    dynamicQrLimit: null,
    aiSopMonthlyLimit: 0,
  };
};