/**
 * ChefWorkKit Free Edition
 *
 * ทุกฟีเจอร์ที่ไม่ใช่ AI เปิดให้ใช้งานฟรี
 * ไม่มีการจำกัดจำนวนสูตรหรือวัตถุดิบ
 * ไม่มีระบบแพ็กเกจแบบชำระเงิน
 *
 * คง Type และชื่อฟังก์ชันเดิมไว้
 * เพื่อรองรับโค้ดส่วนอื่นของระบบ
 */

export type PlanName = "free" | "pro" | "business";

export type FeatureKey =
  | "cost_calculator"
  | "qr_generator"
  | "recipe_storage"
  | "ingredient_library"
  | "recipe_scaling"
  | "production_calculator"
  | "shopping_list"
  | "nutrition"
  | "export_pdf"
  | "export_excel"
  | "ai_tools";

export type PlanConfig = {
  name: PlanName;
  label: string;
  priceMonthly: number | null;

  limits: {
    recipes: number | null;
    ingredients: number | null;
    aiRequestsPerMonth: number;
  };

  features: Record<FeatureKey, boolean>;
};

/**
 * สิทธิ์มาตรฐานของ Free Edition
 */
const FREE_FEATURES: Record<FeatureKey, boolean> = {
  cost_calculator: true,
  qr_generator: true,
  recipe_storage: true,
  ingredient_library: true,
  recipe_scaling: true,
  production_calculator: true,
  shopping_list: true,
  nutrition: true,
  export_pdf: true,
  export_excel: true,

  // ปิดระบบ AI ทั้งหมด
  ai_tools: false,
};

const FREE_LIMITS = {
  recipes: null,
  ingredients: null,
  aiRequestsPerMonth: 0,
};

/**
 * คงชื่อแพ็กเกจเดิมเพื่อความเข้ากันได้
 * แต่ทุกแพ็กเกจได้รับสิทธิ์เท่ากัน
 */
export const PLANS: Record<PlanName, PlanConfig> = {
  free: {
    name: "free",
    label: "Free Edition",
    priceMonthly: 0,
    limits: { ...FREE_LIMITS },
    features: { ...FREE_FEATURES },
  },

  pro: {
    name: "pro",
    label: "Free Edition",
    priceMonthly: 0,
    limits: { ...FREE_LIMITS },
    features: { ...FREE_FEATURES },
  },

  business: {
    name: "business",
    label: "Free Edition",
    priceMonthly: 0,
    limits: { ...FREE_LIMITS },
    features: { ...FREE_FEATURES },
  },
};

/**
 * ทุกผู้ใช้ได้รับสิทธิ์ Free Edition
 */
export function getPlan(
  _plan?: string | null
): PlanConfig {
  return PLANS.free;
}

/**
 * ตรวจสอบสิทธิ์การใช้งานฟีเจอร์
 */
export function canUseFeature(
  _plan: string | null | undefined,
  feature: FeatureKey
): boolean {
  return FREE_FEATURES[feature];
}

/**
 * ไม่จำกัดจำนวนสูตร
 */
export function getRecipeLimit(
  _plan?: string | null
): number | null {
  return null;
}

/**
 * ไม่จำกัดจำนวนวัตถุดิบ
 */
export function getIngredientLimit(
  _plan?: string | null
): number | null {
  return null;
}

/**
 * ปิด AI
 */
export function getAiMonthlyLimit(
  _plan?: string | null
): number {
  return 0;
}