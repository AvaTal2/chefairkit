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

export const PLANS: Record<PlanName, PlanConfig> = {
  free: {
    name: "free",
    label: "Free",
    priceMonthly: 0,

    limits: {
      recipes: 5,
      ingredients: 30,
      aiRequestsPerMonth: 0,
    },

    features: {
      cost_calculator: true,
      qr_generator: true,

      recipe_storage: true,
      ingredient_library: true,
      recipe_scaling: true,

      production_calculator: false,
      shopping_list: false,

      // ตอนพัฒนายังเปิดไว้ก่อน
      nutrition: true,

      export_pdf: false,
      export_excel: false,
      ai_tools: false,
    },
  },

  pro: {
    name: "pro",
    label: "Pro",

    // ยังไม่กำหนดราคาจริง
    priceMonthly: null,

    limits: {
      recipes: null,
      ingredients: null,

      // ตัวเลขชั่วคราว ปรับภายหลังได้
      aiRequestsPerMonth: 100,
    },

    features: {
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
      ai_tools: true,
    },
  },

  business: {
    name: "business",
    label: "Business",

    priceMonthly: null,

    limits: {
      recipes: null,
      ingredients: null,

      // ตัวเลขชั่วคราว
      aiRequestsPerMonth: 500,
    },

    features: {
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
      ai_tools: true,
    },
  },
};

export function getPlan(
  plan?: string | null
): PlanConfig {
  if (
    plan === "pro" ||
    plan === "business"
  ) {
    return PLANS[plan];
  }

  return PLANS.free;
}

export function canUseFeature(
  plan: string | null | undefined,
  feature: FeatureKey
): boolean {
  return getPlan(plan).features[feature];
}

export function getRecipeLimit(
  plan?: string | null
): number | null {
  return getPlan(plan).limits.recipes;
}

export function getIngredientLimit(
  plan?: string | null
): number | null {
  return getPlan(plan).limits.ingredients;
}

export function getAiMonthlyLimit(
  plan?: string | null
): number {
  return getPlan(plan).limits.aiRequestsPerMonth;
}