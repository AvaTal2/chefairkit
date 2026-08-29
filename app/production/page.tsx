"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Factory,
  ChefHat,
  Calculator,
  PackageCheck,
  Scale,
  ShoppingCart,
  Plus,
  Trash2,
  ClipboardList,
  Percent,
  FileText,
  PlayCircle,
  BookOpenCheck,
  CheckCircle2,
  Clock3,
  History,
  Save,
} from "lucide-react";

import { supabase } from "@/lib/supabase/client";
import { useSubscription } from "@/hooks/useSubscription";

type Recipe = {
  id: string;
  name: string;
  category: string | null;
  yield_amount: number | null;
  yield_unit: string | null;
  servings: number | null;
};

type LinkedIngredient = {
  prep_yield_percent: number | null;
  cooking_yield_percent: number | null;
};

type RecipeIngredient = {
  id: string;
  ingredient_id: string | null;
  ingredient_name: string;
  quantity: number;
  unit: string;
  pack_price: number | null;
  pack_quantity: number | null;
  pack_unit: string | null;

  ingredient: LinkedIngredient | null;
};

type ProductionMode = "yield" | "servings";
type ProductionStatus = "planned" | "in_progress" | "done";

type CalculatedIngredient = RecipeIngredient & {
  productionQuantity: number;

  prepYieldPercent: number;
  cookingYieldPercent: number;
  overallYieldPercent: number;

  beforeCookingQuantity: number;
  rawPurchaseQuantity: number;

  packUnit: string;

  requiredInPackUnit: number | null;

  usedCost: number;

  canCalculatePurchase: boolean;
};

type ProductionPlanItem = {
  planId: string;

  recipeId: string;
  recipeName: string;

  mode: ProductionMode;

  targetAmount: number;
  targetUnit: string;

  factor: number;

  fullBatches: number;
  partialBatchPercent: number;

  productionYield: number | null;
  productionServings: number | null;

  status: ProductionStatus;

  ingredients: CalculatedIngredient[];
};

type CombinedIngredient = {
  key: string;

  ingredient_id: string | null;
  ingredient_name: string;

  recipeQuantity: number;
  rawQuantity: number;

  unit: string;

  pack_quantity: number | null;
  pack_unit: string | null;
  pack_price: number | null;

  packsNeeded: number | null;
  purchaseQuantity: number | null;
  leftover: number | null;
  purchaseCost: number | null;

  usedCost: number;

  canCalculatePurchase: boolean;
};

const formatNumber = (value: number) => {
  if (!Number.isFinite(value)) return "-";

  return new Intl.NumberFormat("th-TH", {
    maximumFractionDigits: 3,
  }).format(value);
};

const normalizeUnit = (
  unit: string | null | undefined
) => {
  const value = (unit || "")
    .trim()
    .toLowerCase();

  const unitMap: Record<string, string> = {
    g: "g",
    gram: "g",
    grams: "g",
    กรัม: "g",

    kg: "kg",
    kilogram: "kg",
    kilograms: "kg",
    กิโลกรัม: "kg",
    กก: "kg",

    ml: "ml",
    milliliter: "ml",
    milliliters: "ml",
    มล: "ml",
    มิลลิลิตร: "ml",

    l: "l",
    liter: "l",
    liters: "l",
    litre: "l",
    litres: "l",
    ลิตร: "l",

    piece: "piece",
    pieces: "piece",
    ชิ้น: "piece",

    pack: "pack",
    packs: "pack",
    แพ็ก: "pack",

    bottle: "bottle",
    bottles: "bottle",
    ขวด: "bottle",

    bag: "bag",
    bags: "bag",
    ถุง: "bag",

    box: "box",
    boxes: "box",
    กล่อง: "box",

    tsp: "tsp",
    ช้อนชา: "tsp",

    tbsp: "tbsp",
    ช้อนโต๊ะ: "tbsp",

    cup: "cup",
    ถ้วย: "cup",
  };

  return unitMap[value] || value;
};

const displayUnit = (
  unit: string | null | undefined
) => {
  const normalized = normalizeUnit(unit);

  const unitMap: Record<string, string> = {
    g: "กรัม",
    kg: "กก.",
    ml: "มล.",
    l: "ลิตร",
    piece: "ชิ้น",
    pack: "แพ็ก",
    bottle: "ขวด",
    bag: "ถุง",
    box: "กล่อง",
    tsp: "ช้อนชา",
    tbsp: "ช้อนโต๊ะ",
    cup: "ถ้วย",
  };

  return unitMap[normalized] || unit || "";
};

const convertQuantity = (
  value: number,
  fromUnit: string,
  toUnit: string
): number | null => {
  const from = normalizeUnit(fromUnit);
  const to = normalizeUnit(toUnit);

  if (!from || !to) return null;

  if (from === to) {
    return value;
  }

  const weightUnits: Record<string, number> = {
    g: 1,
    kg: 1000,
  };

  const volumeUnits: Record<string, number> = {
    ml: 1,
    l: 1000,
  };

  if (
    weightUnits[from] &&
    weightUnits[to]
  ) {
    const base =
      value * weightUnits[from];

    return base / weightUnits[to];
  }

  if (
    volumeUnits[from] &&
    volumeUnits[to]
  ) {
    const base =
      value * volumeUnits[from];

    return base / volumeUnits[to];
  }

  return null;
};

const getBaseUnit = (
  unit: string
) => {
  const normalized =
    normalizeUnit(unit);

  if (
    normalized === "g" ||
    normalized === "kg"
  ) {
    return "g";
  }

  if (
    normalized === "ml" ||
    normalized === "l"
  ) {
    return "ml";
  }

  return normalized;
};

const getSafeYield = (
  value: number | null | undefined
) => {
  const parsed = Number(
    value ?? 100
  );

  if (
    !Number.isFinite(parsed) ||
    parsed <= 0 ||
    parsed > 100
  ) {
    return 100;
  }

  return parsed;
};

const makePlanId = () => {
  if (
    typeof crypto !== "undefined" &&
    "randomUUID" in crypto
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()}`;
};

export default function ProductionPage() {
  const router = useRouter();

  const {
    loading: subscriptionLoading,
    permissions,
  } = useSubscription();

  const [
    recipes,
    setRecipes,
  ] = useState<Recipe[]>([]);

  const [
    selectedRecipeId,
    setSelectedRecipeId,
  ] = useState("");

  const [
    recipeIngredients,
    setRecipeIngredients,
  ] = useState<RecipeIngredient[]>([]);

  const [
    mode,
    setMode,
  ] =
    useState<ProductionMode>(
      "yield"
    );

  const [
    targetAmount,
    setTargetAmount,
  ] = useState("");

  const [
    productionPlan,
    setProductionPlan,
  ] = useState<ProductionPlanItem[]>([]);

  const [
    loadingRecipes,
    setLoadingRecipes,
  ] = useState(true);

  const [
    loadingRecipe,
    setLoadingRecipe,
  ] = useState(false);

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    runTitle,
    setRunTitle,
  ] = useState("");

  const [
    productionDate,
    setProductionDate,
  ] = useState(
    new Date()
      .toISOString()
      .slice(0, 10)
  );

  const [
    runNotes,
    setRunNotes,
  ] = useState("");

  const [
    savingRun,
    setSavingRun,
  ] = useState(false);

  const [
    runSavedMessage,
    setRunSavedMessage,
  ] = useState("");

  useEffect(() => {
    if (subscriptionLoading) {
      return;
    }

    if (!permissions.canUseProduction) {
      setLoadingRecipes(false);
      return;
    }

    loadRecipes();
  }, [
    subscriptionLoading,
    permissions.canUseProduction,
  ]);

  const loadRecipes =
    async () => {
      setLoadingRecipes(true);
      setMessage("");

      const {
        data: { user },
      } =
        await supabase.auth.getUser();

      if (!user) {
        sessionStorage.setItem(
          "chefair_after_login_redirect",
          "/production"
        );

        router.push("/login");
        return;
      }

      const {
        data,
        error,
      } = await supabase
        .from("recipes")
        .select(
          "id, name, category, yield_amount, yield_unit, servings"
        )
        .eq(
          "user_id",
          user.id
        )
        .order("name", {
          ascending: true,
        });

      if (error) {
        setMessage(
          "โหลดสูตรไม่สำเร็จ: " +
            error.message
        );

        setLoadingRecipes(false);
        return;
      }

      setRecipes(
        (data || []) as Recipe[]
      );

      setLoadingRecipes(false);
    };

  const selectedRecipe =
    useMemo(() => {
      return (
        recipes.find(
          (recipe) =>
            recipe.id ===
            selectedRecipeId
        ) || null
      );
    }, [
      recipes,
      selectedRecipeId,
    ]);

  const originalAmount =
    useMemo(() => {
      if (!selectedRecipe) {
        return 0;
      }

      if (mode === "yield") {
        return Number(
          selectedRecipe.yield_amount ||
            0
        );
      }

      return Number(
        selectedRecipe.servings ||
          0
      );
    }, [
      selectedRecipe,
      mode,
    ]);

  const factor =
    useMemo(() => {
      const target =
        Number(targetAmount);

      if (
        originalAmount <= 0 ||
        target <= 0
      ) {
        return 0;
      }

      return (
        target / originalAmount
      );
    }, [
      targetAmount,
      originalAmount,
    ]);

  const loadRecipeIngredients =
    async (
      recipeId: string
    ) => {
      setLoadingRecipe(true);
      setMessage("");
      setRecipeIngredients([]);

      const {
        data,
        error,
      } = await supabase
        .from(
          "recipe_ingredients"
        )
        .select(
          `
          id,
          ingredient_id,
          ingredient_name,
          quantity,
          unit,
          pack_price,
          pack_quantity,
          pack_unit,
          ingredient:ingredients (
            prep_yield_percent,
            cooking_yield_percent
          )
          `
        )
        .eq(
          "recipe_id",
          recipeId
        )
        .order(
          "ingredient_name",
          {
            ascending: true,
          }
        );

      if (error) {
        setMessage(
          "โหลดวัตถุดิบของสูตรไม่สำเร็จ: " +
            error.message
        );

        setLoadingRecipe(false);
        return;
      }

      setRecipeIngredients(
        ((data ||
          []) as unknown) as RecipeIngredient[]
      );

      setLoadingRecipe(false);
    };

  const handleRecipeChange =
    async (
      recipeId: string
    ) => {
      setSelectedRecipeId(
        recipeId
      );

      setTargetAmount("");
      setRecipeIngredients([]);
      setMessage("");

      if (!recipeId) return;

      const recipe =
        recipes.find(
          (item) =>
            item.id === recipeId
        );

      if (recipe) {
        if (
          Number(
            recipe.yield_amount ||
              0
          ) > 0
        ) {
          setMode("yield");
        } else if (
          Number(
            recipe.servings ||
              0
          ) > 0
        ) {
          setMode("servings");
        }
      }

      await loadRecipeIngredients(
        recipeId
      );
    };

  const productionIngredients =
    useMemo<
      CalculatedIngredient[]
    >(() => {
      if (factor <= 0) {
        return [];
      }

      return recipeIngredients.map(
        (item) => {
          /*
           * productionQuantity
           * = ปริมาณพร้อมใช้ที่สูตรต้องการ
           */
          const productionQuantity =
            Number(
              item.quantity || 0
            ) * factor;

          const prepYieldPercent =
            getSafeYield(
              item.ingredient
                ?.prep_yield_percent
            );

          const cookingYieldPercent =
            getSafeYield(
              item.ingredient
                ?.cooking_yield_percent
            );

          const overallYieldPercent =
            (prepYieldPercent /
              100) *
            (cookingYieldPercent /
              100) *
            100;

          /*
           * สูตรต้องการของพร้อมใช้
           * → ย้อนกลับก่อน Cooking Loss
           */
          const beforeCookingQuantity =
            productionQuantity /
            (cookingYieldPercent /
              100);

          /*
           * ก่อนปรุง
           * → ย้อนกลับ Prep Loss
           * = ปริมาณดิบที่ต้องเตรียม/ซื้อ
           */
          const rawPurchaseQuantity =
            beforeCookingQuantity /
            (prepYieldPercent /
              100);

          const packQuantity =
            Number(
              item.pack_quantity ||
                0
            );

          const packPrice =
            Number(
              item.pack_price || 0
            );

          const packUnit =
            item.pack_unit ||
            item.unit;

          /*
           * ต้นทุนจริงใช้ raw quantity
           * เพราะของที่สูญเสียก็เป็นต้นทุน
           */
          const requiredInPackUnit =
            convertQuantity(
              rawPurchaseQuantity,
              item.unit,
              packUnit
            );

          const canCalculatePurchase =
            packQuantity > 0 &&
            packPrice > 0 &&
            requiredInPackUnit !==
              null;

          const usedCost =
            canCalculatePurchase
              ? (packPrice /
                  packQuantity) *
                requiredInPackUnit!
              : 0;

          return {
            ...item,

            productionQuantity,

            prepYieldPercent,
            cookingYieldPercent,
            overallYieldPercent,

            beforeCookingQuantity,
            rawPurchaseQuantity,

            packUnit,
            requiredInPackUnit,

            usedCost,
            canCalculatePurchase,
          };
        }
      );
    }, [
      recipeIngredients,
      factor,
    ]);

  const productionYield =
    selectedRecipe &&
    selectedRecipe.yield_amount &&
    factor > 0
      ? Number(
          selectedRecipe.yield_amount
        ) * factor
      : null;

  const productionServings =
    selectedRecipe &&
    selectedRecipe.servings &&
    factor > 0
      ? Number(
          selectedRecipe.servings
        ) * factor
      : null;

  const currentUsedCost =
    useMemo(() => {
      return productionIngredients.reduce(
        (sum, item) =>
          sum +
          Number(
            item.usedCost || 0
          ),
        0
      );
    }, [
      productionIngredients,
    ]);

  const ingredientsWithLoss =
    useMemo(() => {
      return productionIngredients.filter(
        (item) =>
          item.overallYieldPercent <
          100
      ).length;
    }, [
      productionIngredients,
    ]);

  const fullBatches =
    factor > 0
      ? Math.floor(factor)
      : 0;

  const partialBatchPercent =
    factor > 0
      ? Number(
          (
            (factor - fullBatches) *
            100
          ).toFixed(1)
        )
      : 0;

  const addToProductionPlan =
    () => {
      setMessage("");

      if (!selectedRecipe) {
        setMessage(
          "กรุณาเลือกสูตรก่อน"
        );

        return;
      }

      if (factor <= 0) {
        setMessage(
          "กรุณาระบุจำนวนที่ต้องการผลิต"
        );

        return;
      }

      if (
        recipeIngredients.length ===
        0
      ) {
        setMessage(
          "สูตรนี้ยังไม่มีวัตถุดิบสำหรับวางแผนการผลิต"
        );

        return;
      }

      const targetUnit =
        mode === "yield"
          ? displayUnit(
              selectedRecipe.yield_unit
            )
          : "ชิ้น / เสิร์ฟ";

      const newItem: ProductionPlanItem =
        {
          planId:
            makePlanId(),

          recipeId:
            selectedRecipe.id,

          recipeName:
            selectedRecipe.name,

          mode,

          targetAmount:
            Number(targetAmount),

          targetUnit,

          factor,

          fullBatches,
          partialBatchPercent,

          productionYield,
          productionServings,

          status:
            "planned",

          ingredients:
            productionIngredients.map(
              (item) => ({
                ...item,
              })
            ),
        };

      setProductionPlan(
        (current) => [
          ...current,
          newItem,
        ]
      );

      setSelectedRecipeId("");
      setRecipeIngredients([]);
      setTargetAmount("");
      setMessage("");
    };

  const removePlanItem = (
    planId: string
  ) => {
    setProductionPlan(
      (current) =>
        current.filter(
          (item) =>
            item.planId !==
            planId
        )
    );
  };

  const updatePlanStatus = (
    planId: string,
    status: ProductionStatus
  ) => {
    setProductionPlan(
      (current) =>
        current.map(
          (item) =>
            item.planId ===
            planId
              ? {
                  ...item,
                  status,
                }
              : item
        )
    );
  };

  const clearProductionPlan =
    () => {
      setProductionPlan([]);
    };

  const combinedIngredients =
    useMemo<
      CombinedIngredient[]
    >(() => {
      const grouped =
        new Map<
          string,
          {
            key: string;

            ingredient_id:
              | string
              | null;

            ingredient_name: string;

            recipeQuantity: number;
            rawQuantity: number;

            unit: string;

            pack_quantity:
              | number
              | null;

            pack_unit:
              | string
              | null;

            pack_price:
              | number
              | null;
          }
        >();

      productionPlan.forEach(
        (plan) => {
          plan.ingredients.forEach(
            (item) => {
              const baseUnit =
                getBaseUnit(
                  item.unit
                );

              const recipeToBase =
                convertQuantity(
                  item.productionQuantity,
                  item.unit,
                  baseUnit
                );

              const rawToBase =
                convertQuantity(
                  item.rawPurchaseQuantity,
                  item.unit,
                  baseUnit
                );

              /*
               * ถ้าแปลงหน่วยไม่ได้
               * ใช้หน่วยเดิมแยกกลุ่ม
               */
              if (
                recipeToBase ===
                  null ||
                rawToBase === null
              ) {
                const identity =
                  item.ingredient_id
                    ? `id:${item.ingredient_id}`
                    : `name:${item.ingredient_name
                        .trim()
                        .toLowerCase()}`;

                const key =
                  `${identity}::${normalizeUnit(
                    item.unit
                  )}`;

                const existing =
                  grouped.get(key);

                if (existing) {
                  existing.recipeQuantity +=
                    item.productionQuantity;

                  existing.rawQuantity +=
                    item.rawPurchaseQuantity;
                } else {
                  grouped.set(
                    key,
                    {
                      key,

                      ingredient_id:
                        item.ingredient_id,

                      ingredient_name:
                        item.ingredient_name,

                      recipeQuantity:
                        item.productionQuantity,

                      rawQuantity:
                        item.rawPurchaseQuantity,

                      unit:
                        item.unit,

                      pack_quantity:
                        item.pack_quantity,

                      pack_unit:
                        item.pack_unit,

                      pack_price:
                        item.pack_price,
                    }
                  );
                }

                return;
              }

              /*
               * ถ้ามี ingredient_id
               * ให้ใช้ ID รวมวัตถุดิบ
               * แม่นกว่าการใช้ชื่อ
               */
              const identity =
                item.ingredient_id
                  ? `id:${item.ingredient_id}`
                  : `name:${item.ingredient_name
                      .trim()
                      .toLowerCase()}`;

              const key =
                `${identity}::${baseUnit}`;

              const existing =
                grouped.get(key);

              if (existing) {
                existing.recipeQuantity +=
                  recipeToBase;

                existing.rawQuantity +=
                  rawToBase;

                if (
                  !existing.pack_quantity &&
                  item.pack_quantity
                ) {
                  existing.pack_quantity =
                    item.pack_quantity;

                  existing.pack_unit =
                    item.pack_unit;

                  existing.pack_price =
                    item.pack_price;
                }
              } else {
                grouped.set(
                  key,
                  {
                    key,

                    ingredient_id:
                      item.ingredient_id,

                    ingredient_name:
                      item.ingredient_name,

                    recipeQuantity:
                      recipeToBase,

                    rawQuantity:
                      rawToBase,

                    unit: baseUnit,

                    pack_quantity:
                      item.pack_quantity,

                    pack_unit:
                      item.pack_unit,

                    pack_price:
                      item.pack_price,
                  }
                );
              }
            }
          );
        }
      );

      return Array.from(
        grouped.values()
      )
        .map((item) => {
          const packQuantity =
            Number(
              item.pack_quantity ||
                0
            );

          const packPrice =
            Number(
              item.pack_price || 0
            );

          const packUnit =
            item.pack_unit ||
            item.unit;

          /*
           * Shopping List ใช้ RAW
           * ไม่ใช้ recipeQuantity
           */
          const requiredInPackUnit =
            convertQuantity(
              item.rawQuantity,
              item.unit,
              packUnit
            );

          const canCalculatePurchase =
            packQuantity > 0 &&
            packPrice > 0 &&
            requiredInPackUnit !==
              null;

          const packsNeeded =
            canCalculatePurchase
              ? Math.ceil(
                  requiredInPackUnit! /
                    packQuantity
                )
              : null;

          const purchaseQuantity =
            packsNeeded !== null
              ? packsNeeded *
                packQuantity
              : null;

          const purchaseCost =
            packsNeeded !== null
              ? packsNeeded *
                packPrice
              : null;

          const leftover =
            purchaseQuantity !==
              null &&
            requiredInPackUnit !==
              null
              ? Math.max(
                  purchaseQuantity -
                    requiredInPackUnit,
                  0
                )
              : null;

          const usedCost =
            canCalculatePurchase
              ? (packPrice /
                  packQuantity) *
                requiredInPackUnit!
              : 0;

          return {
            ...item,

            pack_unit:
              packUnit,

            packsNeeded,
            purchaseQuantity,
            leftover,
            purchaseCost,
            usedCost,

            canCalculatePurchase,
          };
        })
        .sort((a, b) =>
          a.ingredient_name.localeCompare(
            b.ingredient_name,
            "th"
          )
        );
    }, [productionPlan]);

  const planUsedCost =
    useMemo(() => {
      return combinedIngredients.reduce(
        (sum, item) =>
          sum +
          Number(
            item.usedCost || 0
          ),
        0
      );
    }, [
      combinedIngredients,
    ]);

  const planPurchaseCost =
    useMemo(() => {
      return combinedIngredients.reduce(
        (sum, item) =>
          sum +
          Number(
            item.purchaseCost || 0
          ),
        0
      );
    }, [
      combinedIngredients,
    ]);

  const handleSaveProductionRun =
    async () => {
      setMessage("");
      setRunSavedMessage("");

      if (
        productionPlan.length ===
        0
      ) {
        setMessage(
          "กรุณาเพิ่มสูตรเข้าแผนการผลิตอย่างน้อย 1 รายการ"
        );

        return;
      }

      if (
        !productionDate
      ) {
        setMessage(
          "กรุณาเลือกวันที่ผลิต"
        );

        return;
      }

      setSavingRun(true);

      const {
        data: { user },
      } =
        await supabase.auth.getUser();

      if (!user) {
        setSavingRun(false);

        sessionStorage.setItem(
          "chefair_after_login_redirect",
          "/production"
        );

        router.push("/login");
        return;
      }

      const finalTitle =
        runTitle.trim() ||
        `แผนผลิต ${new Intl.DateTimeFormat(
          "th-TH",
          {
            dateStyle:
              "medium",
          }
        ).format(
          new Date(
            `${productionDate}T00:00:00`
          )
        )}`;

      const allDone =
        productionPlan.every(
          (item) =>
            item.status ===
            "done"
        );

      const anyInProgress =
        productionPlan.some(
          (item) =>
            item.status ===
            "in_progress"
        );

      const runStatus =
        allDone
          ? "done"
          : anyInProgress
          ? "in_progress"
          : "planned";

      const {
        data: runData,
        error: runError,
      } =
        await supabase
          .from(
            "production_runs"
          )
          .insert({
            user_id:
              user.id,

            title:
              finalTitle,

            production_date:
              productionDate,

            status:
              runStatus,

            total_used_cost:
              Number(
                planUsedCost.toFixed(
                  2
                )
              ),

            total_purchase_cost:
              Number(
                planPurchaseCost.toFixed(
                  2
                )
              ),

            shopping_list:
              combinedIngredients,

            notes:
              runNotes.trim() ||
              null,
          })
          .select("id")
          .single();

      if (
        runError ||
        !runData
      ) {
        setMessage(
          "บันทึกแผนการผลิตไม่สำเร็จ: " +
            (
              runError?.message ||
              "ไม่สามารถสร้าง Production Run ได้"
            )
        );

        setSavingRun(false);
        return;
      }

      const itemPayload =
        productionPlan.map(
          (item) => ({
            run_id:
              runData.id,

            user_id:
              user.id,

            recipe_id:
              item.recipeId ||
              null,

            recipe_name:
              item.recipeName,

            mode:
              item.mode,

            target_amount:
              item.targetAmount,

            target_unit:
              item.targetUnit,

            factor:
              item.factor,

            full_batches:
              item.fullBatches,

            partial_batch_percent:
              item.partialBatchPercent,

            production_yield:
              item.productionYield,

            production_servings:
              item.productionServings,

            status:
              item.status,

            ingredients:
              item.ingredients,
          })
        );

      const {
        error:
          itemInsertError,
      } =
        await supabase
          .from(
            "production_run_items"
          )
          .insert(
            itemPayload
          );

      if (
        itemInsertError
      ) {
        await supabase
          .from(
            "production_runs"
          )
          .delete()
          .eq(
            "id",
            runData.id
          )
          .eq(
            "user_id",
            user.id
          );

        setMessage(
          "บันทึกรายการสูตรในแผนไม่สำเร็จ: " +
            itemInsertError.message
        );

        setSavingRun(false);
        return;
      }

      setSavingRun(false);

      setRunSavedMessage(
        "✓ บันทึกแผนการผลิตลง Production History แล้ว"
      );

      window.setTimeout(() => {
        setRunSavedMessage(
          ""
        );
      }, 5000);
    };

  /*
   * PRODUCTION SHEET
   *
   * เก็บ Production Plan ปัจจุบันไว้ใน sessionStorage
   * แล้วส่งผู้ใช้ไปหน้า /production/sheet
   *
   * ตอนนี้ยังไม่บันทึก Production History ลง Supabase
   */
  const handleCreateProductionSheet =
    () => {
      setMessage("");

      if (
        productionPlan.length ===
        0
      ) {
        setMessage(
          "กรุณาเพิ่มสูตรเข้าแผนการผลิตอย่างน้อย 1 รายการ"
        );

        return;
      }

      const payload = {
        createdAt: Date.now(),

        productionPlan,

        combinedIngredients,

        planUsedCost,
        planPurchaseCost,
      };

      sessionStorage.setItem(
        "chefair_production_sheet",
        JSON.stringify(payload)
      );

      router.push(
        "/production/sheet"
      );
    };

  if (
    subscriptionLoading
  ) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-3xl p-10 text-center text-slate-500">
          กำลังตรวจสอบแพ็กเกจ...
        </div>
      </main>
    );
  }

  if (
    !permissions.canUseProduction
  ) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-3xl p-8 sm:p-10 text-center">
          <Factory className="w-12 h-12 text-amber-400 mx-auto" />

          <h1 className="text-2xl font-extrabold text-slate-800 mt-4">
            Production Center
          </h1>

          <p className="text-sm text-slate-500 mt-2">
            ฟังก์ชันวางแผนการผลิตและ Shopping List ใช้ได้ในแพ็กเกจ Pro หรือ Business
          </p>

          <button
            type="button"
            onClick={() =>
              router.push(
                "/pricing"
              )
            }
            className="mt-6 bg-amber-500 hover:bg-amber-600 text-white font-bold px-5 py-3 rounded-xl text-sm"
          >
            ดูแพ็กเกจ Pro
          </button>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="max-w-7xl mx-auto px-4 py-10 sm:py-14">

        {/* HEADER */}

        <div className="text-center max-w-2xl mx-auto mb-9">
          <div className="flex justify-center mb-4">
            <div className="bg-amber-50 text-amber-600 p-3 rounded-2xl">
              <Factory className="w-7 h-7" />
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-800">
            Production Center
          </h1>

          <p className="text-sm text-slate-500 mt-3 leading-relaxed">
            วางแผนการผลิตหลายสูตร
            คำนวณ Yield / Loss
            ปริมาณวัตถุดิบดิบที่ต้องเตรียม
            และรวม Shopping List
            อัตโนมัติ
          </p>

          <div className="mt-4">
            <button
              type="button"
              onClick={() =>
                router.push(
                  "/production/history"
                )
              }
              className="inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-xl text-sm shadow-sm transition"
            >
              <History className="w-4 h-4" />
              Production History
            </button>
          </div>
        </div>

        {/* CURRENT PLAN */}

        {productionPlan.length >
          0 && (
          <section className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm mb-6">
            <div className="px-5 sm:px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="bg-amber-50 text-amber-600 p-2.5 rounded-xl">
                  <ClipboardList className="w-5 h-5" />
                </div>

                <div>
                  <h2 className="font-extrabold text-slate-800">
                    แผนการผลิตวันนี้
                  </h2>

                  <p className="text-xs text-slate-400 mt-0.5">
                    {
                      productionPlan.length
                    }{" "}
                    รายการ
                  </p>
                </div>
              </div>

              {/* PRODUCTION SHEET ACTIONS */}

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={
                    handleCreateProductionSheet
                  }
                  className="inline-flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition"
                >
                  <FileText className="w-4 h-4" />
                  สร้าง Production Sheet
                </button>

                <button
                  type="button"
                  onClick={
                    clearProductionPlan
                  }
                  className="text-xs font-bold text-red-500 hover:bg-red-50 px-4 py-2.5 rounded-xl transition"
                >
                  ล้างแผนทั้งหมด
                </button>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {productionPlan.map(
                (item) => (
                  <div
                    key={
                      item.planId
                    }
                    className="p-5 sm:px-6"
                  >
                    <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-bold text-slate-800">
                            {
                              item.recipeName
                            }
                          </p>

                          <ProductionStatusBadge
                            status={
                              item.status
                            }
                          />
                        </div>

                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-slate-500">
                          <span>
                            เป้าหมาย{" "}
                            {formatNumber(
                              item.targetAmount
                            )}{" "}
                            {
                              item.targetUnit
                            }
                          </span>

                          <span>
                            {formatNumber(
                              item.factor
                            )}{" "}
                            สูตร
                          </span>

                          <span>
                            {item.fullBatches} Batch เต็ม
                            {item.partialBatchPercent >
                            0
                              ? ` + ${formatNumber(
                                  item.partialBatchPercent
                                )}% Batch`
                              : ""}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <select
                          value={
                            item.status
                          }
                          onChange={(e) =>
                            updatePlanStatus(
                              item.planId,
                              e.target
                                .value as ProductionStatus
                            )
                          }
                          className="border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white text-slate-700"
                        >
                          <option value="planned">
                            รอผลิต
                          </option>
                          <option value="in_progress">
                            กำลังผลิต
                          </option>
                          <option value="done">
                            เสร็จแล้ว
                          </option>
                        </select>

                        <button
                          type="button"
                          onClick={() =>
                            router.push(
                              `/recipes/${item.recipeId}/sop`
                            )
                          }
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 border border-slate-200 hover:bg-slate-50 px-3 py-2 rounded-xl"
                        >
                          <BookOpenCheck className="w-4 h-4" />
                          SOP
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            router.push(
                              `/recipes/${item.recipeId}/sop/view`
                            )
                          }
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 px-3 py-2 rounded-xl"
                        >
                          <PlayCircle className="w-4 h-4" />
                          Kitchen Mode
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            removePlanItem(
                              item.planId
                            )
                          }
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-red-500 hover:bg-red-50 px-3 py-2 rounded-xl"
                        >
                          <Trash2 className="w-4 h-4" />
                          ลบ
                        </button>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          </section>
        )}

        {productionPlan.length >
          0 && (
          <section className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm mb-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="bg-emerald-50 text-emerald-600 p-2.5 rounded-xl">
                <Save className="w-5 h-5" />
              </div>

              <div>
                <h2 className="font-extrabold text-slate-800">
                  บันทึกแผนการผลิต
                </h2>

                <p className="text-xs text-slate-400 mt-0.5">
                  เก็บแผนนี้ไว้ใน Production History เพื่อเปิดดูย้อนหลัง
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2">
                  ชื่องานผลิต
                </label>

                <input
                  type="text"
                  value={
                    runTitle
                  }
                  onChange={(e) =>
                    setRunTitle(
                      e.target.value
                    )
                  }
                  placeholder="เช่น เตรียมขายงานวันเสาร์"
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2">
                  วันที่ผลิต
                </label>

                <input
                  type="date"
                  value={
                    productionDate
                  }
                  onChange={(e) =>
                    setProductionDate(
                      e.target.value
                    )
                  }
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2">
                  หมายเหตุ
                </label>

                <input
                  type="text"
                  value={
                    runNotes
                  }
                  onChange={(e) =>
                    setRunNotes(
                      e.target.value
                    )
                  }
                  placeholder="ไม่บังคับ"
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={
                  handleSaveProductionRun
                }
                disabled={
                  savingRun
                }
                className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold px-5 py-3 rounded-xl text-sm transition"
              >
                <Save className="w-4 h-4" />

                {savingRun
                  ? "กำลังบันทึก..."
                  : "บันทึก Production Run"}
              </button>

              {runSavedMessage && (
                <span className="text-sm font-bold text-emerald-600">
                  {runSavedMessage}
                </span>
              )}
            </div>
          </section>
        )}

        {/* STEP 1 */}

        <section className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm mb-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="bg-amber-50 text-amber-600 p-2.5 rounded-xl">
              <ChefHat className="w-5 h-5" />
            </div>

            <div>
              <h2 className="font-extrabold text-slate-800">
                1. เลือกสูตรที่จะผลิต
              </h2>

              <p className="text-xs text-slate-400 mt-0.5">
                ดึงข้อมูลจากสูตรของฉัน
              </p>
            </div>
          </div>

          {loadingRecipes ? (
            <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-500">
              กำลังโหลดสูตร...
            </div>
          ) : recipes.length ===
            0 ? (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-sm text-amber-700">
              ยังไม่มีสูตรที่บันทึก
              กรุณาสร้างสูตรก่อนใช้งาน
              Production Center
            </div>
          ) : (
            <select
              value={
                selectedRecipeId
              }
              onChange={(e) =>
                handleRecipeChange(
                  e.target.value
                )
              }
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-amber-500"
            >
              <option value="">
                — เลือกสูตร —
              </option>

              {recipes.map(
                (recipe) => (
                  <option
                    key={
                      recipe.id
                    }
                    value={
                      recipe.id
                    }
                  >
                    {recipe.name}
                    {recipe.category
                      ? ` — ${recipe.category}`
                      : ""}
                  </option>
                )
              )}
            </select>
          )}
        </section>

        {selectedRecipe && (
          <>
            {/* STEP 2 */}

            <section className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm mb-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="bg-slate-100 text-slate-600 p-2.5 rounded-xl">
                  <Scale className="w-5 h-5" />
                </div>

                <div>
                  <h2 className="font-extrabold text-slate-800">
                    2.
                    ข้อมูลสูตรต้นฉบับ
                  </h2>

                  <p className="text-xs text-slate-400 mt-0.5">
                    {
                      selectedRecipe.name
                    }
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-2xl p-4">
                  <p className="text-xs text-slate-400">
                    Yield ต่อ 1
                    สูตร
                  </p>

                  <p className="text-xl font-extrabold text-slate-800 mt-1">
                    {selectedRecipe.yield_amount
                      ? `${formatNumber(
                          Number(
                            selectedRecipe.yield_amount
                          )
                        )} ${displayUnit(
                          selectedRecipe.yield_unit
                        )}`
                      : "-"}
                  </p>
                </div>

                <div className="bg-slate-50 rounded-2xl p-4">
                  <p className="text-xs text-slate-400">
                    จำนวนเสิร์ฟ /
                    ชิ้น ต่อ 1 สูตร
                  </p>

                  <p className="text-xl font-extrabold text-slate-800 mt-1">
                    {selectedRecipe.servings
                      ? formatNumber(
                          Number(
                            selectedRecipe.servings
                          )
                        )
                      : "-"}
                  </p>
                </div>
              </div>
            </section>

            {/* STEP 3 */}

            <section className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm mb-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="bg-amber-50 text-amber-600 p-2.5 rounded-xl">
                  <Calculator className="w-5 h-5" />
                </div>

                <div>
                  <h2 className="font-extrabold text-slate-800">
                    3.
                    ต้องการผลิตเท่าไร?
                  </h2>

                  <p className="text-xs text-slate-400 mt-0.5">
                    เลือกคำนวณตาม
                    Yield
                    หรือจำนวนชิ้น/เสิร์ฟ
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                <button
                  type="button"
                  disabled={
                    Number(
                      selectedRecipe.yield_amount ||
                        0
                    ) <= 0
                  }
                  onClick={() => {
                    setMode(
                      "yield"
                    );
                    setTargetAmount(
                      ""
                    );
                  }}
                  className={`p-4 rounded-2xl border text-left transition disabled:opacity-40 disabled:cursor-not-allowed ${
                    mode ===
                    "yield"
                      ? "border-amber-400 bg-amber-50"
                      : "border-slate-200 hover:border-amber-200"
                  }`}
                >
                  <p className="font-bold text-slate-800">
                    ตาม Yield
                  </p>

                  <p className="text-xs text-slate-500 mt-1">
                    เช่น 1,000 กรัม
                    → 5,000 กรัม
                  </p>
                </button>

                <button
                  type="button"
                  disabled={
                    Number(
                      selectedRecipe.servings ||
                        0
                    ) <= 0
                  }
                  onClick={() => {
                    setMode(
                      "servings"
                    );
                    setTargetAmount(
                      ""
                    );
                  }}
                  className={`p-4 rounded-2xl border text-left transition disabled:opacity-40 disabled:cursor-not-allowed ${
                    mode ===
                    "servings"
                      ? "border-amber-400 bg-amber-50"
                      : "border-slate-200 hover:border-amber-200"
                  }`}
                >
                  <p className="font-bold text-slate-800">
                    ตามจำนวนเสิร์ฟ /
                    ชิ้น
                  </p>

                  <p className="text-xs text-slate-500 mt-1">
                    เช่น 20 ชิ้น →
                    150 ชิ้น
                  </p>
                </button>
              </div>

              <div className="max-w-md">
                <label className="block text-xs font-bold text-slate-600 mb-2">
                  {mode ===
                  "yield"
                    ? `Yield ที่ต้องการ (${displayUnit(
                        selectedRecipe.yield_unit
                      )})`
                    : "จำนวนเสิร์ฟ / ชิ้น ที่ต้องการ"}
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.001"
                  value={
                    targetAmount
                  }
                  onChange={(e) =>
                    setTargetAmount(
                      e.target.value
                    )
                  }
                  placeholder={
                    mode ===
                    "yield"
                      ? "เช่น 5000"
                      : "เช่น 150"
                  }
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500"
                />
              </div>
            </section>

            {/* CURRENT CALCULATION */}

            {factor > 0 && (
              <section className="space-y-6 mb-6">
                <div className="bg-slate-800 rounded-3xl p-6 sm:p-7 text-white">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="bg-white/10 p-2.5 rounded-xl">
                      <PackageCheck className="w-5 h-5 text-amber-400" />
                    </div>

                    <div>
                      <h2 className="font-extrabold">
                        แผนการผลิต
                      </h2>

                      <p className="text-xs text-slate-400 mt-0.5">
                        {
                          selectedRecipe.name
                        }
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                      <p className="text-xs text-slate-400">
                        ต้องทำ
                      </p>

                      <p className="text-xl font-extrabold text-amber-400 mt-1">
                        {formatNumber(
                          factor
                        )}{" "}
                        สูตร
                      </p>

                      <p className="text-[11px] text-slate-400 mt-1">
                        {fullBatches} Batch เต็ม
                        {partialBatchPercent >
                        0
                          ? ` + ${formatNumber(
                              partialBatchPercent
                            )}% Batch`
                          : ""}
                      </p>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                      <p className="text-xs text-slate-400">
                        Yield รวม
                      </p>

                      <p className="font-bold mt-1">
                        {productionYield !==
                        null
                          ? `${formatNumber(
                              productionYield
                            )} ${displayUnit(
                              selectedRecipe.yield_unit
                            )}`
                          : "-"}
                      </p>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                      <p className="text-xs text-slate-400">
                        จำนวนผลิต
                      </p>

                      <p className="font-bold mt-1">
                        {productionServings !==
                        null
                          ? `${formatNumber(
                              productionServings
                            )} ชิ้น / เสิร์ฟ`
                          : "-"}
                      </p>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                      <p className="text-xs text-slate-400">
                        วัตถุดิบมี
                        Loss
                      </p>

                      <p className="font-bold mt-1">
                        {
                          ingredientsWithLoss
                        }{" "}
                        รายการ
                      </p>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                      <p className="text-xs text-slate-400">
                        ต้นทุนวัตถุดิบจริง
                      </p>

                      <p className="font-bold mt-1">
                        {currentUsedCost.toFixed(
                          2
                        )}{" "}
                        บาท
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={
                      addToProductionPlan
                    }
                    className="mt-6 w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-5 py-3 rounded-xl font-bold text-sm transition"
                  >
                    <Plus className="w-4 h-4" />
                    เพิ่มเข้าแผนการผลิต
                  </button>
                </div>

                {/* INGREDIENT LOSS TABLE */}

                <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                  <div className="px-6 py-5 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <Percent className="w-5 h-5 text-emerald-600" />

                      <h3 className="font-bold text-slate-800">
                        วัตถุดิบและ
                        Yield Loss
                      </h3>
                    </div>

                    <p className="text-xs text-slate-400 mt-1">
                      ปริมาณในสูตร =
                      ปริมาณพร้อมใช้
                      ระบบคำนวณย้อนกลับว่าต้องเตรียมวัตถุดิบดิบเท่าไร
                    </p>
                  </div>

                  {loadingRecipe ? (
                    <div className="p-6 text-sm text-slate-500">
                      กำลังโหลด...
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[1050px] text-sm">
                        <thead className="bg-slate-50 text-slate-500">
                          <tr>
                            <th className="text-left px-5 py-3">
                              วัตถุดิบ
                            </th>

                            <th className="text-right px-5 py-3">
                              สูตรเดิม
                            </th>

                            <th className="text-right px-5 py-3">
                              ต้องใช้จริง
                            </th>

                            <th className="text-right px-5 py-3">
                              Prep Yield
                            </th>

                            <th className="text-right px-5 py-3">
                              Cooking
                              Yield
                            </th>

                            <th className="text-right px-5 py-3">
                              ก่อนปรุง
                            </th>

                            <th className="text-right px-5 py-3">
                              ต้องเตรียมดิบ
                            </th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                          {productionIngredients.map(
                            (
                              item
                            ) => (
                              <tr
                                key={
                                  item.id
                                }
                              >
                                <td className="px-5 py-4">
                                  <p className="font-semibold text-slate-700">
                                    {
                                      item.ingredient_name
                                    }
                                  </p>

                                  {!item.ingredient_id && (
                                    <p className="text-[11px] text-amber-600 mt-1">
                                      ไม่ได้เชื่อมกับคลังวัตถุดิบ
                                      — ใช้ Yield
                                      100%
                                    </p>
                                  )}
                                </td>

                                <td className="px-5 py-4 text-right text-slate-500">
                                  {formatNumber(
                                    Number(
                                      item.quantity
                                    )
                                  )}{" "}
                                  {displayUnit(
                                    item.unit
                                  )}
                                </td>

                                <td className="px-5 py-4 text-right font-bold text-slate-800">
                                  {formatNumber(
                                    item.productionQuantity
                                  )}{" "}
                                  {displayUnit(
                                    item.unit
                                  )}
                                </td>

                                <td className="px-5 py-4 text-right">
                                  <span
                                    className={
                                      item.prepYieldPercent <
                                      100
                                        ? "font-bold text-emerald-600"
                                        : "text-slate-400"
                                    }
                                  >
                                    {formatNumber(
                                      item.prepYieldPercent
                                    )}
                                    %
                                  </span>
                                </td>

                                <td className="px-5 py-4 text-right">
                                  <span
                                    className={
                                      item.cookingYieldPercent <
                                      100
                                        ? "font-bold text-emerald-600"
                                        : "text-slate-400"
                                    }
                                  >
                                    {formatNumber(
                                      item.cookingYieldPercent
                                    )}
                                    %
                                  </span>
                                </td>

                                <td className="px-5 py-4 text-right text-slate-600">
                                  {formatNumber(
                                    item.beforeCookingQuantity
                                  )}{" "}
                                  {displayUnit(
                                    item.unit
                                  )}
                                </td>

                                <td className="px-5 py-4 text-right">
                                  <p className="font-extrabold text-amber-600">
                                    {formatNumber(
                                      item.rawPurchaseQuantity
                                    )}{" "}
                                    {displayUnit(
                                      item.unit
                                    )}
                                  </p>

                                  {item.overallYieldPercent <
                                    100 && (
                                    <p className="text-[11px] text-slate-400 mt-1">
                                      Overall
                                      Yield{" "}
                                      {formatNumber(
                                        item.overallYieldPercent
                                      )}
                                      %
                                    </p>
                                  )}
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </section>
            )}
          </>
        )}

        {/* PRODUCTION OVERVIEW */}

        {productionPlan.length >
          0 && (
          <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <ProductionOverviewCard
              icon={
                <Clock3 className="w-5 h-5" />
              }
              label="รอผลิต"
              value={
                productionPlan.filter(
                  (item) =>
                    item.status ===
                    "planned"
                ).length
              }
            />

            <ProductionOverviewCard
              icon={
                <PlayCircle className="w-5 h-5" />
              }
              label="กำลังผลิต"
              value={
                productionPlan.filter(
                  (item) =>
                    item.status ===
                    "in_progress"
                ).length
              }
            />

            <ProductionOverviewCard
              icon={
                <CheckCircle2 className="w-5 h-5" />
              }
              label="เสร็จแล้ว"
              value={
                productionPlan.filter(
                  (item) =>
                    item.status ===
                    "done"
                ).length
              }
            />
          </section>
        )}

        {/* COMBINED SHOPPING LIST */}

        {productionPlan.length >
          0 && (
          <section className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            <div className="px-6 py-5 bg-slate-800 text-white">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-amber-400" />

                <h2 className="font-extrabold">
                  Shopping List รวม
                </h2>
              </div>

              <p className="text-xs text-slate-300 mt-1">
                รวมวัตถุดิบจากทุกสูตร
                และชดเชย Prep /
                Cooking Loss
                ก่อนคำนวณจำนวนแพ็กที่ต้องซื้อ
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-5 border-b border-slate-100">
              <div className="bg-slate-50 rounded-2xl p-4">
                <p className="text-xs text-slate-400">
                  ต้นทุนวัตถุดิบจริงรวม
                </p>

                <p className="text-xl font-extrabold text-slate-800 mt-1">
                  {planUsedCost.toFixed(
                    2
                  )}{" "}
                  บาท
                </p>

                <p className="text-[11px] text-slate-400 mt-1">
                  รวมวัตถุดิบที่สูญเสียจาก
                  Yield Loss แล้ว
                </p>
              </div>

              <div className="bg-amber-50 rounded-2xl p-4">
                <p className="text-xs text-amber-600">
                  เงินที่ต้องเตรียมซื้อรวม
                </p>

                <p className="text-xl font-extrabold text-amber-700 mt-1">
                  {planPurchaseCost.toFixed(
                    2
                  )}{" "}
                  บาท
                </p>

                <p className="text-[11px] text-amber-600 mt-1">
                  คำนวณตามจำนวนแพ็กเต็มที่ต้องซื้อ
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1200px] text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="text-left px-5 py-3">
                      วัตถุดิบ
                    </th>

                    <th className="text-right px-5 py-3">
                      สูตรต้องใช้
                    </th>

                    <th className="text-right px-5 py-3">
                      ต้องเตรียมดิบ
                    </th>

                    <th className="text-right px-5 py-3">
                      ขนาดแพ็ก
                    </th>

                    <th className="text-right px-5 py-3">
                      ต้องซื้อ
                    </th>

                    <th className="text-right px-5 py-3">
                      ซื้อรวม
                    </th>

                    <th className="text-right px-5 py-3">
                      คงเหลือ
                    </th>

                    <th className="text-right px-5 py-3">
                      ค่าใช้จ่าย
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {combinedIngredients.map(
                    (item) => (
                      <tr
                        key={
                          item.key
                        }
                      >
                        <td className="px-5 py-4">
                          <p className="font-semibold text-slate-700">
                            {
                              item.ingredient_name
                            }
                          </p>

                          {!item.canCalculatePurchase && (
                            <p className="text-[11px] text-red-500 mt-1 font-normal">
                              ไม่มีข้อมูลราคา/แพ็ก
                              หรือไม่สามารถแปลงหน่วยได้
                            </p>
                          )}
                        </td>

                        <td className="px-5 py-4 text-right text-slate-500">
                          {formatNumber(
                            item.recipeQuantity
                          )}{" "}
                          {displayUnit(
                            item.unit
                          )}
                        </td>

                        <td className="px-5 py-4 text-right font-extrabold text-amber-600">
                          {formatNumber(
                            item.rawQuantity
                          )}{" "}
                          {displayUnit(
                            item.unit
                          )}
                        </td>

                        <td className="px-5 py-4 text-right text-slate-500">
                          {item.pack_quantity
                            ? `${formatNumber(
                                Number(
                                  item.pack_quantity
                                )
                              )} ${displayUnit(
                                item.pack_unit
                              )}`
                            : "-"}
                        </td>

                        <td className="px-5 py-4 text-right font-bold">
                          {item.packsNeeded !==
                          null
                            ? `${formatNumber(
                                item.packsNeeded
                              )} แพ็ก`
                            : "-"}
                        </td>

                        <td className="px-5 py-4 text-right">
                          {item.purchaseQuantity !==
                          null
                            ? `${formatNumber(
                                item.purchaseQuantity
                              )} ${displayUnit(
                                item.pack_unit
                              )}`
                            : "-"}
                        </td>

                        <td className="px-5 py-4 text-right">
                          {item.leftover !==
                          null
                            ? `${formatNumber(
                                item.leftover
                              )} ${displayUnit(
                                item.pack_unit
                              )}`
                            : "-"}
                        </td>

                        <td className="px-5 py-4 text-right font-bold text-amber-600">
                          {item.purchaseCost !==
                          null
                            ? `${item.purchaseCost.toFixed(
                                2
                              )} บาท`
                            : "-"}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>

                <tfoot className="bg-amber-50">
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-4 text-right font-bold text-slate-700"
                    >
                      งบซื้อวัตถุดิบขั้นต่ำรวม
                    </td>

                    <td className="px-5 py-4 text-right font-extrabold text-amber-600">
                      {planPurchaseCost.toFixed(
                        2
                      )}{" "}
                      บาท
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>
        )}

        {message && (
          <div className="mt-6 bg-red-50 border border-red-100 text-red-600 rounded-xl px-4 py-3 text-sm">
            {message}
          </div>
        )}
      </main>
    </div>
  );
}

function ProductionStatusBadge({
  status,
}: {
  status: ProductionStatus;
}) {
  const styles =
    status === "done"
      ? "bg-emerald-50 text-emerald-700"
      : status === "in_progress"
      ? "bg-blue-50 text-blue-700"
      : "bg-amber-50 text-amber-700";

  const label =
    status === "done"
      ? "เสร็จแล้ว"
      : status === "in_progress"
      ? "กำลังผลิต"
      : "รอผลิต";

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold ${styles}`}
    >
      {label}
    </span>
  );
}

function ProductionOverviewCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center gap-2 text-slate-500">
        {icon}

        <span className="text-xs font-bold">
          {label}
        </span>
      </div>

      <p className="text-2xl font-extrabold text-slate-800 mt-2">
        {value}
      </p>
    </div>
  );
}

