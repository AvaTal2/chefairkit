"use client";

import { useMemo } from "react";

type NutritionProfile = {
  id: string;
  nutrition_basis_quantity: number | null;
  nutrition_basis_unit: string | null;

  calories_kcal: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  sugar_g: number | null;
  fiber_g: number | null;
  sodium_mg: number | null;

  nutrition_source: string | null;
  nutrition_verified: boolean | null;
};

type Ingredient = {
  id: string;
  ingredient_id: string | null;
  ingredient_name: string;
  quantity: number;
  unit: string;

  ingredient: NutritionProfile | null;
};

type RecipeNutritionProps = {
  ingredients: Ingredient[];
  yieldAmount: number | null;
  yieldUnit: string | null;
  servings: number | null;
};

type NutritionTotals = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  sugar: number;
  fiber: number;
  sodium: number;
};

const EMPTY_NUTRITION: NutritionTotals = {
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  sugar: 0,
  fiber: 0,
  sodium: 0,
};

const convertQuantity = (
  value: number,
  fromUnit: string,
  toUnit: string
): number | null => {
  if (fromUnit === toUnit) return value;

  const weightUnits: Record<string, number> = {
    g: 1,
    kg: 1000,
  };

  const volumeUnits: Record<string, number> = {
    ml: 1,
    l: 1000,
  };

  if (weightUnits[fromUnit] && weightUnits[toUnit]) {
    const baseValue = value * weightUnits[fromUnit];
    return baseValue / weightUnits[toUnit];
  }

  if (volumeUnits[fromUnit] && volumeUnits[toUnit]) {
    const baseValue = value * volumeUnits[fromUnit];
    return baseValue / volumeUnits[toUnit];
  }

  return null;
};

export default function RecipeNutrition({
  ingredients,
  yieldAmount,
  yieldUnit,
  servings,
}: RecipeNutritionProps) {
  const calculation = useMemo(() => {
    let totals: NutritionTotals = {
      ...EMPTY_NUTRITION,
    };

    let calculatedCount = 0;
    const missing: string[] = [];
    const unverified: string[] = [];

    ingredients.forEach((item) => {
      const nutrition = item.ingredient;

      if (!nutrition) {
        missing.push(item.ingredient_name);
        return;
      }

      const basisQuantity = Number(
        nutrition.nutrition_basis_quantity || 0
      );

      const basisUnit =
        nutrition.nutrition_basis_unit || "g";

      if (basisQuantity <= 0) {
        missing.push(item.ingredient_name);
        return;
      }

      const usedQuantity = convertQuantity(
        Number(item.quantity || 0),
        item.unit,
        basisUnit
      );

      if (usedQuantity === null) {
        missing.push(item.ingredient_name);
        return;
      }

      const factor =
        usedQuantity / basisQuantity;

      totals.calories +=
        Number(
          nutrition.calories_kcal || 0
        ) * factor;

      totals.protein +=
        Number(
          nutrition.protein_g || 0
        ) * factor;

      totals.carbs +=
        Number(
          nutrition.carbs_g || 0
        ) * factor;

      totals.fat +=
        Number(
          nutrition.fat_g || 0
        ) * factor;

      totals.sugar +=
        Number(
          nutrition.sugar_g || 0
        ) * factor;

      totals.fiber +=
        Number(
          nutrition.fiber_g || 0
        ) * factor;

      totals.sodium +=
        Number(
          nutrition.sodium_mg || 0
        ) * factor;

      calculatedCount++;

      if (!nutrition.nutrition_verified) {
        unverified.push(
          item.ingredient_name
        );
      }
    });

    return {
      totals,
      calculatedCount,
      missing,
      unverified,
    };
  }, [ingredients]);

  const perServing = useMemo(() => {
    if (!servings || servings <= 0) {
      return null;
    }

    return divideNutrition(
      calculation.totals,
      servings
    );
  }, [calculation, servings]);

  const per100 = useMemo(() => {
    if (
      !yieldAmount ||
      yieldAmount <= 0 ||
      !yieldUnit
    ) {
      return null;
    }

    let normalizedYield: number | null =
      null;

    let displayUnit = "";

    if (
      yieldUnit === "g" ||
      yieldUnit === "kg"
    ) {
      normalizedYield =
        convertQuantity(
          yieldAmount,
          yieldUnit,
          "g"
        );

      displayUnit = "100 g";
    }

    if (
      yieldUnit === "ml" ||
      yieldUnit === "l"
    ) {
      normalizedYield =
        convertQuantity(
          yieldAmount,
          yieldUnit,
          "ml"
        );

      displayUnit = "100 ml";
    }

    if (
      !normalizedYield ||
      normalizedYield <= 0
    ) {
      return null;
    }

    const factor =
      100 / normalizedYield;

    return {
      nutrition: multiplyNutrition(
        calculation.totals,
        factor
      ),
      displayUnit,
    };
  }, [
    calculation,
    yieldAmount,
    yieldUnit,
  ]);

  const hasNutrition =
    calculation.calculatedCount > 0;

  if (!hasNutrition) {
    return (
      <section className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6">
        <h2 className="font-bold text-slate-800 text-lg">
          ข้อมูลโภชนาการ
        </h2>

        <div className="mt-4 bg-amber-50 border border-amber-100 rounded-2xl p-5">
          <p className="font-semibold text-amber-700">
            ยังไม่สามารถคำนวณโภชนาการของสูตรนี้
          </p>

          <p className="text-sm text-amber-600 mt-1">
            กรุณาเชื่อมวัตถุดิบกับคลังวัตถุดิบ
            และเพิ่มข้อมูลโภชนาการก่อน
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="font-bold text-slate-800 text-lg">
              ข้อมูลโภชนาการ
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              คำนวณจากข้อมูลโภชนาการของวัตถุดิบที่เชื่อมกับคลัง
            </p>
          </div>

          <div className="text-xs text-slate-500 bg-slate-50 px-3 py-2 rounded-xl">
            คำนวณได้{" "}
            <span className="font-bold text-slate-700">
              {calculation.calculatedCount}
            </span>{" "}
            / {ingredients.length} รายการ
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* TOTAL */}

        <div>
          <h3 className="font-bold text-slate-700 mb-3">
            ทั้งสูตร
          </h3>

          <NutritionGrid
            nutrition={
              calculation.totals
            }
          />
        </div>

        {/* PER 100 */}

        {per100 && (
          <div className="border-t border-slate-100 pt-6">
            <h3 className="font-bold text-slate-700 mb-3">
              ต่อ {per100.displayUnit}
            </h3>

            <NutritionGrid
              nutrition={
                per100.nutrition
              }
            />
          </div>
        )}

        {/* PER SERVING */}

        {perServing && (
          <div className="border-t border-slate-100 pt-6">
            <h3 className="font-bold text-slate-700 mb-1">
              ต่อ 1 เสิร์ฟ / ชิ้น
            </h3>

            <p className="text-xs text-slate-400 mb-3">
              สูตรนี้กำหนดไว้{" "}
              {servings} เสิร์ฟ / ชิ้น
            </p>

            <NutritionGrid
              nutrition={
                perServing
              }
            />
          </div>
        )}

        {/* WARNING */}

        {calculation.missing.length >
          0 && (
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
            <p className="text-sm font-bold text-amber-700">
              ⚠ มีวัตถุดิบที่ยังไม่ถูกนำมาคำนวณ
            </p>

            <p className="text-xs text-amber-600 mt-2">
              {calculation.missing.join(
                ", "
              )}
            </p>

            <p className="text-xs text-amber-600 mt-2">
              อาจเกิดจากยังไม่ได้เชื่อมกับคลัง
              ไม่มีข้อมูลโภชนาการ
              หรือหน่วยไม่สามารถแปลงได้
            </p>
          </div>
        )}

        {calculation.unverified.length >
          0 && (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
            <p className="text-sm font-semibold text-slate-700">
              ข้อมูลบางรายการยังไม่ได้ยืนยัน
            </p>

            <p className="text-xs text-slate-500 mt-2">
              {calculation.unverified.join(
                ", "
              )}
            </p>
          </div>
        )}

        <p className="text-xs text-slate-400 leading-relaxed">
          * ค่าที่แสดงเป็นค่าประมาณจากข้อมูลวัตถุดิบที่บันทึกไว้
          ไม่ใช่ผลวิเคราะห์จากห้องปฏิบัติการ
        </p>
      </div>
    </section>
  );
}

function NutritionGrid({
  nutrition,
}: {
  nutrition: NutritionTotals;
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <NutritionCard
        label="พลังงาน"
        value={nutrition.calories}
        unit="kcal"
        decimals={0}
        highlight
      />

      <NutritionCard
        label="โปรตีน"
        value={nutrition.protein}
        unit="g"
      />

      <NutritionCard
        label="คาร์โบไฮเดรต"
        value={nutrition.carbs}
        unit="g"
      />

      <NutritionCard
        label="ไขมัน"
        value={nutrition.fat}
        unit="g"
      />

      <NutritionCard
        label="น้ำตาล"
        value={nutrition.sugar}
        unit="g"
      />

      <NutritionCard
        label="ใยอาหาร"
        value={nutrition.fiber}
        unit="g"
      />

      <NutritionCard
        label="โซเดียม"
        value={nutrition.sodium}
        unit="mg"
        decimals={0}
      />
    </div>
  );
}

function NutritionCard({
  label,
  value,
  unit,
  decimals = 1,
  highlight = false,
}: {
  label: string;
  value: number;
  unit: string;
  decimals?: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl p-4 ${
        highlight
          ? "bg-amber-50 border border-amber-100"
          : "bg-slate-50"
      }`}
    >
      <p className="text-xs text-slate-500">
        {label}
      </p>

      <p
        className={`font-extrabold text-lg mt-1 ${
          highlight
            ? "text-amber-600"
            : "text-slate-800"
        }`}
      >
        {value.toLocaleString(
          "th-TH",
          {
            minimumFractionDigits:
              decimals,
            maximumFractionDigits:
              decimals,
          }
        )}
      </p>

      <p className="text-xs text-slate-400">
        {unit}
      </p>
    </div>
  );
}

function divideNutrition(
  nutrition: NutritionTotals,
  divider: number
): NutritionTotals {
  return {
    calories:
      nutrition.calories / divider,

    protein:
      nutrition.protein / divider,

    carbs:
      nutrition.carbs / divider,

    fat:
      nutrition.fat / divider,

    sugar:
      nutrition.sugar / divider,

    fiber:
      nutrition.fiber / divider,

    sodium:
      nutrition.sodium / divider,
  };
}

function multiplyNutrition(
  nutrition: NutritionTotals,
  factor: number
): NutritionTotals {
  return {
    calories:
      nutrition.calories * factor,

    protein:
      nutrition.protein * factor,

    carbs:
      nutrition.carbs * factor,

    fat:
      nutrition.fat * factor,

    sugar:
      nutrition.sugar * factor,

    fiber:
      nutrition.fiber * factor,

    sodium:
      nutrition.sodium * factor,
  };
}