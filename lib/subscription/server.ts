import {
  FREE_SUBSCRIPTION,
  getPlanPermissions,
  type PlanPermissions,
  type SubscriptionRecord,
} from "@/lib/subscription/permissions";

/**
 * ChefWorkKit Free Edition
 *
 * ระบบสมาชิกแบบชำระเงินถูกยกเลิกแล้ว
 * ผู้ใช้งานทุกคนได้รับสิทธิ์ Free Edition
 *
 * ไม่เรียก Supabase user_subscriptions
 * ไม่เรียก Stripe
 * ไม่ตรวจวันหมดอายุสมาชิก
 *
 * คงชื่อฟังก์ชันเดิมเพื่อรองรับโค้ดส่วนอื่น
 */

export async function getSubscriptionForUser(
  _userId: string
): Promise<SubscriptionRecord> {
  return {
    ...FREE_SUBSCRIPTION,
  };
}

export async function getPermissionsForUser(
  _userId: string
): Promise<PlanPermissions> {
  return getPlanPermissions(FREE_SUBSCRIPTION);
}