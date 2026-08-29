"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useParams,
  useRouter,
} from "next/navigation";

import Link from "next/link";

import { supabase } from "@/lib/supabase/client";

import RecipeScaler from "@/components/recipes/recipe-scaler";

import ProductionCalculator from "@/components/recipes/production-calculator";

import RecipeNutrition from "@/components/recipes/recipe-nutrition";

type NutritionProfile = {
  id: string;

  nutrition_basis_quantity:
    number | null;

  nutrition_basis_unit:
    string | null;

  calories_kcal:
    number | null;

  protein_g:
    number | null;

  carbs_g:
    number | null;

  fat_g:
    number | null;

  sugar_g:
    number | null;

  fiber_g:
    number | null;

  sodium_mg:
    number | null;

  nutrition_source:
    string | null;

  nutrition_verified:
    boolean | null;
};

type Recipe = {
  id: string;
  user_id: string;

  name: string;

  category:
    string | null;

  yield_amount:
    number | null;

  yield_unit:
    string | null;

  servings:
    number | null;

  notes:
    string | null;

  created_at:
    string;
};

type Ingredient = {
  id: string;

  recipe_id: string;

  ingredient_id:
    string | null;

  ingredient_name:
    string;

  quantity:
    number;

  unit:
    string;

  pack_price:
    number | null;

  pack_quantity:
    number | null;

  pack_unit:
    string | null;

  ingredient:
    NutritionProfile | null;
};

const convertQuantity = (
  value: number,
  fromUnit: string,
  toUnit: string
): number | null => {
  if (fromUnit === toUnit) {
    return value;
  }

  const weightUnits: Record<
    string,
    number
  > = {
    g: 1,
    kg: 1000,
  };

  const volumeUnits: Record<
    string,
    number
  > = {
    ml: 1,
    l: 1000,
  };

  if (
    weightUnits[fromUnit] &&
    weightUnits[toUnit]
  ) {
    const base =
      value *
      weightUnits[fromUnit];

    return (
      base /
      weightUnits[toUnit]
    );
  }

  if (
    volumeUnits[fromUnit] &&
    volumeUnits[toUnit]
  ) {
    const base =
      value *
      volumeUnits[fromUnit];

    return (
      base /
      volumeUnits[toUnit]
    );
  }

  return null;
};

export default function RecipeDetailPage() {
  const params =
    useParams();

  const router =
    useRouter();

  const recipeId =
    params.id as string;

  const [
    recipe,
    setRecipe,
  ] =
    useState<Recipe | null>(
      null
    );

  const [
    ingredients,
    setIngredients,
  ] = useState<
    Ingredient[]
  >([]);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    deleting,
    setDeleting,
  ] =
    useState(false);

  const [
    message,
    setMessage,
  ] =
    useState("");

  useEffect(() => {
    if (recipeId) {
      loadRecipe();
    }
  }, [recipeId]);

  const loadRecipe =
    async () => {
      setLoading(true);
      setMessage("");

      const {
        data: { user },
      } =
        await supabase.auth.getUser();

      if (!user) {
        router.push(
          "/login"
        );

        return;
      }

      const {
        data: recipeData,
        error: recipeError,
      } =
        await supabase
          .from("recipes")
          .select("*")
          .eq(
            "id",
            recipeId
          )
          .single();

      if (
        recipeError ||
        !recipeData
      ) {
        setMessage(
          "ไม่พบสูตร หรือคุณไม่มีสิทธิ์เข้าถึงสูตรนี้"
        );

        setLoading(
          false
        );

        return;
      }

      const {
        data:
          ingredientData,
        error:
          ingredientError,
      } =
        await supabase
          .from(
            "recipe_ingredients"
          )
          .select(`
            id,
            recipe_id,
            ingredient_id,
            ingredient_name,
            quantity,
            unit,
            pack_price,
            pack_quantity,
            pack_unit,
            ingredient:ingredients (
              id,
              nutrition_basis_quantity,
              nutrition_basis_unit,
              calories_kcal,
              protein_g,
              carbs_g,
              fat_g,
              sugar_g,
              fiber_g,
              sodium_mg,
              nutrition_source,
              nutrition_verified
            )
          `)
          .eq(
            "recipe_id",
            recipeId
          )
          .order(
            "created_at",
            {
              ascending:
                true,
            }
          );

      if (
        ingredientError
      ) {
        setMessage(
          "โหลดวัตถุดิบไม่สำเร็จ: " +
            ingredientError.message
        );

        setLoading(
          false
        );

        return;
      }

      setRecipe(
        recipeData
      );

      setIngredients(
        ((ingredientData ||
          []) as unknown) as Ingredient[]
      );

      setLoading(
        false
      );
    };

  const handleBack = () => {
    if (
      typeof window !== "undefined" &&
      window.history.length > 1
    ) {
      router.back();
      return;
    }

    router.push("/recipes");
  };

  const calculateIngredientCost =
    (
      item: Ingredient
    ) => {
      const packPrice =
        Number(
          item.pack_price ||
            0
        );

      const packQuantity =
        Number(
          item.pack_quantity ||
            0
        );

      const usedQuantity =
        Number(
          item.quantity ||
            0
        );

      if (
        packPrice <= 0 ||
        packQuantity <= 0 ||
        usedQuantity <= 0
      ) {
        return 0;
      }

      const packUnit =
        item.pack_unit ||
        item.unit;

      const convertedQuantity =
        convertQuantity(
          usedQuantity,
          item.unit,
          packUnit
        );

      if (
        convertedQuantity ===
        null
      ) {
        return 0;
      }

      return (
        (packPrice /
          packQuantity) *
        convertedQuantity
      );
    };

  const totalCost =
    useMemo(() => {
      return ingredients.reduce(
        (
          sum,
          item
        ) =>
          sum +
          calculateIngredientCost(
            item
          ),
        0
      );
    }, [ingredients]);

  const costPerYieldUnit =
    useMemo(() => {
      if (
        !recipe?.yield_amount ||
        recipe.yield_amount <=
          0
      ) {
        return 0;
      }

      return (
        totalCost /
        recipe.yield_amount
      );
    }, [
      recipe,
      totalCost,
    ]);

  const costPerServing =
    useMemo(() => {
      if (
        !recipe?.servings ||
        recipe.servings <= 0
      ) {
        return 0;
      }

      return (
        totalCost /
        recipe.servings
      );
    }, [
      recipe,
      totalCost,
    ]);

  const handleDelete =
    async () => {
      const confirmed =
        window.confirm(
          "ต้องการลบสูตรนี้ใช่หรือไม่? ข้อมูลวัตถุดิบทั้งหมดจะถูกลบด้วย"
        );

      if (!confirmed) {
        return;
      }

      setDeleting(true);
      setMessage("");

      const { error } =
        await supabase
          .from("recipes")
          .delete()
          .eq(
            "id",
            recipeId
          );

      if (error) {
        setMessage(
          "ลบสูตรไม่สำเร็จ: " +
            error.message
        );

        setDeleting(
          false
        );

        return;
      }

      router.push(
        "/recipes"
      );

      router.refresh();
    };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center text-slate-500">
            กำลังโหลดสูตร...
          </div>
        </div>
      </main>
    );
  }

  if (!recipe) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center">
            <h1 className="font-bold text-slate-800 text-lg">
              ไม่พบสูตร
            </h1>

            {message && (
              <p className="text-sm text-red-500 mt-2">
                {message}
              </p>
            )}

            <Link
              href="/recipes"
              className="inline-block mt-5 bg-amber-500 text-white font-bold px-5 py-2.5 rounded-xl"
            >
              กลับไปสูตรของฉัน
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="max-w-5xl mx-auto">

        {/* HEADER */}

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-7">
          <div>
            <button
              type="button"
              onClick={handleBack}
              className="text-sm text-slate-500 hover:text-amber-600 transition"
            >
              ← กลับ
            </button>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 mt-2">
              {recipe.name}
            </h1>

            {recipe.category && (
              <p className="text-sm font-semibold text-amber-600 mt-1">
                {recipe.category}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">

            {/* SOP */}

            <Link
              href={`/recipes/${recipe.id}/sop`}
              className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition"
            >
              SOP
            </Link>

            <Link
              href={`/recipes/${recipe.id}/edit`}
              className="border border-slate-200 bg-white hover:border-amber-300 text-slate-700 font-bold px-4 py-2.5 rounded-xl text-sm"
            >
              แก้ไขสูตร
            </Link>

            <button
              onClick={
                handleDelete
              }
              disabled={
                deleting
              }
              className="border border-red-200 bg-white hover:bg-red-50 text-red-500 font-bold px-4 py-2.5 rounded-xl text-sm disabled:opacity-50"
            >
              {deleting
                ? "กำลังลบ..."
                : "ลบสูตร"}
            </button>
          </div>
        </div>

        {/* COST SUMMARY */}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <p className="text-xs text-slate-400">
              ต้นทุนรวมทั้งสูตร
            </p>

            <p className="text-2xl font-extrabold text-slate-800 mt-1">
              {totalCost.toFixed(
                2
              )}{" "}
              บาท
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <p className="text-xs text-slate-400">
              ต้นทุนต่อ Yield
            </p>

            <p className="text-2xl font-extrabold text-slate-800 mt-1">
              {costPerYieldUnit.toFixed(
                3
              )}{" "}
              บาท
            </p>

            <p className="text-xs text-slate-400 mt-1">
              ต่อ{" "}
              {recipe.yield_unit ||
                "หน่วย"}
            </p>
          </div>

          <div className="bg-amber-500 rounded-2xl p-5 shadow-sm text-white">
            <p className="text-xs text-amber-100">
              ต้นทุนต่อเสิร์ฟ / ชิ้น
            </p>

            <p className="text-2xl font-extrabold mt-1">
              {costPerServing.toFixed(
                2
              )}{" "}
              บาท
            </p>

            <p className="text-xs text-amber-100 mt-1">
              {recipe.servings
                ? `${recipe.servings} เสิร์ฟ / ชิ้น`
                : "ยังไม่ได้ระบุจำนวน"}
            </p>
          </div>
        </div>

        {/* INGREDIENTS */}

        <section className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden mb-6">
          <div className="p-6 border-b border-slate-100">
            <h2 className="font-bold text-slate-800">
              วัตถุดิบในสูตร
            </h2>
          </div>

          {ingredients.length ===
          0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              สูตรนี้ยังไม่มีวัตถุดิบ
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="text-left px-5 py-3">
                      วัตถุดิบ
                    </th>

                    <th className="text-right px-5 py-3">
                      ปริมาณใช้
                    </th>

                    <th className="text-right px-5 py-3">
                      ราคาซื้อ
                    </th>

                    <th className="text-right px-5 py-3">
                      ขนาดแพ็ก
                    </th>

                    <th className="text-right px-5 py-3">
                      ต้นทุน
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {ingredients.map(
                    (item) => (
                      <tr
                        key={
                          item.id
                        }
                      >
                        <td className="px-5 py-4 font-semibold text-slate-700">
                          {
                            item.ingredient_name
                          }

                          {item.ingredient && (
                            <div className="text-xs text-green-600 mt-1">
                              ✓ เชื่อมกับคลัง
                            </div>
                          )}
                        </td>

                        <td className="px-5 py-4 text-right">
                          {
                            item.quantity
                          }{" "}
                          {
                            item.unit
                          }
                        </td>

                        <td className="px-5 py-4 text-right">
                          {Number(
                            item.pack_price ||
                              0
                          ).toFixed(
                            2
                          )}{" "}
                          บาท
                        </td>

                        <td className="px-5 py-4 text-right">
                          {
                            item.pack_quantity
                          }{" "}
                          {item.pack_unit ||
                            item.unit}
                        </td>

                        <td className="px-5 py-4 text-right font-bold">
                          {calculateIngredientCost(
                            item
                          ).toFixed(
                            2
                          )}{" "}
                          บาท
                        </td>
                      </tr>
                    )
                  )}
                </tbody>

                <tfoot className="bg-slate-50">
                  <tr>
                    <td
                      colSpan={4}
                      className="px-5 py-4 text-right font-bold"
                    >
                      รวมต้นทุน
                    </td>

                    <td className="px-5 py-4 text-right font-extrabold text-amber-600">
                      {totalCost.toFixed(
                        2
                      )}{" "}
                      บาท
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </section>

        {/* NUTRITION */}

        <div className="mb-6">
          <RecipeNutrition
            ingredients={
              ingredients
            }
            yieldAmount={
              recipe.yield_amount
            }
            yieldUnit={
              recipe.yield_unit
            }
            servings={
              recipe.servings
            }
          />
        </div>

        {/* SCALER */}

        <div className="mb-6">
          <RecipeScaler
            ingredients={
              ingredients
            }
            baseYield={
              recipe.yield_amount
            }
            yieldUnit={
              recipe.yield_unit
            }
            baseServings={
              recipe.servings
            }
            totalCost={
              totalCost
            }
          />
        </div>

        {/* PRODUCTION */}

        <div
          id="production"
          className="mb-6 scroll-mt-28"
        >
          <ProductionCalculator
            ingredients={
              ingredients
            }
            baseYield={
              recipe.yield_amount
            }
            yieldUnit={
              recipe.yield_unit
            }
            baseServings={
              recipe.servings
            }
            totalCost={
              totalCost
            }
          />
        </div>

        {/* YIELD */}

        <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <p className="text-xs text-slate-400">
              Yield ที่ได้จริง
            </p>

            <p className="font-bold mt-1">
              {recipe.yield_amount
                ? `${recipe.yield_amount} ${recipe.yield_unit || ""}`
                : "ยังไม่ได้ระบุ"}
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <p className="text-xs text-slate-400">
              จำนวนเสิร์ฟ / ชิ้น
            </p>

            <p className="font-bold mt-1">
              {recipe.servings ||
                "ยังไม่ได้ระบุ"}
            </p>
          </div>
        </section>

        {recipe.notes && (
          <section className="bg-white border border-slate-200 rounded-2xl p-5 mt-5">
            <p className="text-xs text-slate-400">
              หมายเหตุ
            </p>

            <p className="text-sm text-slate-700 mt-2 whitespace-pre-line">
              {
                recipe.notes
              }
            </p>
          </section>
        )}

        {message && (
          <div className="bg-red-50 border border-red-100 text-red-600 rounded-xl px-4 py-3 text-sm mt-5">
            {message}
          </div>
        )}

      </div>
    </main>
  );
}