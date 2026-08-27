"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Factory,
  ChefHat,
  Calculator,
  PackageCheck,
  Scale,
} from "lucide-react";

import Navbar from "@/components/navbar";
import { supabase } from "@/lib/supabase/client";

type Recipe = {
  id: string;
  name: string;
  category: string | null;
  yield_amount: number | null;
  yield_unit: string | null;
  servings: number | null;
};

type RecipeIngredient = {
  id: string;
  ingredient_name: string;
  quantity: number;
  unit: string;
};

type ProductionMode = "yield" | "servings";

const formatNumber = (value: number) => {
  if (!Number.isFinite(value)) return "-";

  return new Intl.NumberFormat("th-TH", {
    maximumFractionDigits: 3,
  }).format(value);
};

const displayUnit = (unit: string | null) => {
  const unitMap: Record<string, string> = {
    g: "กรัม",
    kg: "กก.",
    ml: "มล.",
    l: "ลิตร",
    L: "ลิตร",
    piece: "ชิ้น",
    pack: "แพ็ก",
    bottle: "ขวด",
    bag: "ถุง",
    box: "กล่อง",
    tsp: "ช้อนชา",
    tbsp: "ช้อนโต๊ะ",
    cup: "ถ้วย",
  };

  if (!unit) return "";

  return unitMap[unit] || unit;
};

export default function ProductionPage() {
  const router = useRouter();

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipeId, setSelectedRecipeId] = useState("");

  const [recipeIngredients, setRecipeIngredients] = useState<
    RecipeIngredient[]
  >([]);

  const [mode, setMode] = useState<ProductionMode>("yield");
  const [targetAmount, setTargetAmount] = useState("");

  const [loadingRecipes, setLoadingRecipes] = useState(true);
  const [loadingRecipe, setLoadingRecipe] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadRecipes();
  }, []);

  const loadRecipes = async () => {
    setLoadingRecipes(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { data, error } = await supabase
      .from("recipes")
      .select(
        "id, name, category, yield_amount, yield_unit, servings"
      )
      .order("name", { ascending: true });

    if (error) {
      setMessage("โหลดสูตรไม่สำเร็จ: " + error.message);
      setLoadingRecipes(false);
      return;
    }

    setRecipes(data || []);
    setLoadingRecipes(false);
  };

  const selectedRecipe = useMemo(() => {
    return (
      recipes.find((recipe) => recipe.id === selectedRecipeId) ||
      null
    );
  }, [recipes, selectedRecipeId]);

  const originalAmount = useMemo(() => {
    if (!selectedRecipe) return 0;

    if (mode === "yield") {
      return Number(selectedRecipe.yield_amount || 0);
    }

    return Number(selectedRecipe.servings || 0);
  }, [selectedRecipe, mode]);

  const factor = useMemo(() => {
    const target = Number(targetAmount);

    if (originalAmount <= 0 || target <= 0) {
      return 0;
    }

    return target / originalAmount;
  }, [targetAmount, originalAmount]);

  const totalBatches = factor;

  const loadRecipeIngredients = async (recipeId: string) => {
    setLoadingRecipe(true);
    setMessage("");
    setRecipeIngredients([]);

    const { data, error } = await supabase
      .from("recipe_ingredients")
      .select("id, ingredient_name, quantity, unit")
      .eq("recipe_id", recipeId)
      .order("ingredient_name", { ascending: true });

    if (error) {
      setMessage(
        "โหลดวัตถุดิบของสูตรไม่สำเร็จ: " + error.message
      );
      setLoadingRecipe(false);
      return;
    }

    setRecipeIngredients(data || []);
    setLoadingRecipe(false);
  };

  const handleRecipeChange = async (recipeId: string) => {
    setSelectedRecipeId(recipeId);
    setTargetAmount("");
    setRecipeIngredients([]);

    if (!recipeId) return;

    const recipe = recipes.find((item) => item.id === recipeId);

    if (recipe) {
      if (Number(recipe.yield_amount || 0) > 0) {
        setMode("yield");
      } else if (Number(recipe.servings || 0) > 0) {
        setMode("servings");
      }
    }

    await loadRecipeIngredients(recipeId);
  };

  const calculatedIngredients = useMemo(() => {
    if (factor <= 0) return [];

    return recipeIngredients.map((item) => ({
      ...item,
      productionQuantity: Number(item.quantity || 0) * factor,
    }));
  }, [recipeIngredients, factor]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-10 sm:py-14">
        {/* Header */}

        <div className="text-center max-w-2xl mx-auto mb-9">
          <div className="flex justify-center mb-4">
            <div className="bg-amber-50 text-amber-600 p-3 rounded-2xl">
              <Factory className="w-7 h-7" />
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-800">
            Production Calculator
          </h1>

          <p className="text-sm text-slate-500 mt-3 leading-relaxed">
            เลือกสูตรที่บันทึกไว้ แล้วระบุจำนวนที่ต้องการผลิต
            ระบบจะคำนวณจำนวนสูตรและวัตถุดิบที่ต้องใช้ให้อัตโนมัติ
          </p>
        </div>

        {/* Recipe Selection */}

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
          ) : recipes.length === 0 ? (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-sm text-amber-700">
              ยังไม่มีสูตรที่บันทึก กรุณาเพิ่มสูตรก่อนใช้งาน
              Production Calculator
            </div>
          ) : (
            <select
              value={selectedRecipeId}
              onChange={(e) => handleRecipeChange(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-amber-500"
            >
              <option value="">— เลือกสูตร —</option>

              {recipes.map((recipe) => (
                <option key={recipe.id} value={recipe.id}>
                  {recipe.name}
                  {recipe.category ? ` — ${recipe.category}` : ""}
                </option>
              ))}
            </select>
          )}
        </section>

        {selectedRecipe && (
          <>
            {/* Original Recipe */}

            <section className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm mb-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="bg-slate-100 text-slate-600 p-2.5 rounded-xl">
                  <Scale className="w-5 h-5" />
                </div>

                <div>
                  <h2 className="font-extrabold text-slate-800">
                    2. ข้อมูลสูตรต้นฉบับ
                  </h2>

                  <p className="text-xs text-slate-400 mt-0.5">
                    {selectedRecipe.name}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-2xl p-4">
                  <p className="text-xs text-slate-400">
                    Yield ต่อ 1 สูตร
                  </p>

                  <p className="text-xl font-extrabold text-slate-800 mt-1">
                    {selectedRecipe.yield_amount
                      ? `${formatNumber(
                          Number(selectedRecipe.yield_amount)
                        )} ${displayUnit(selectedRecipe.yield_unit)}`
                      : "-"}
                  </p>
                </div>

                <div className="bg-slate-50 rounded-2xl p-4">
                  <p className="text-xs text-slate-400">
                    จำนวนเสิร์ฟ / ชิ้น ต่อ 1 สูตร
                  </p>

                  <p className="text-xl font-extrabold text-slate-800 mt-1">
                    {selectedRecipe.servings
                      ? formatNumber(Number(selectedRecipe.servings))
                      : "-"}
                  </p>
                </div>
              </div>
            </section>

            {/* Target */}

            <section className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm mb-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="bg-amber-50 text-amber-600 p-2.5 rounded-xl">
                  <Calculator className="w-5 h-5" />
                </div>

                <div>
                  <h2 className="font-extrabold text-slate-800">
                    3. ต้องการผลิตเท่าไร?
                  </h2>

                  <p className="text-xs text-slate-400 mt-0.5">
                    ระบบจะคำนวณจำนวนสูตรให้อัตโนมัติ
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                <button
                  type="button"
                  disabled={
                    Number(selectedRecipe.yield_amount || 0) <= 0
                  }
                  onClick={() => {
                    setMode("yield");
                    setTargetAmount("");
                  }}
                  className={`p-4 rounded-2xl border text-left transition disabled:opacity-40 disabled:cursor-not-allowed ${
                    mode === "yield"
                      ? "border-amber-400 bg-amber-50"
                      : "border-slate-200 hover:border-amber-200"
                  }`}
                >
                  <p className="font-bold text-slate-800">
                    ตาม Yield
                  </p>

                  <p className="text-xs text-slate-500 mt-1">
                    เช่น สูตรเดิมได้ 1,000 กรัม ต้องการผลิต 5,000
                    กรัม
                  </p>
                </button>

                <button
                  type="button"
                  disabled={Number(selectedRecipe.servings || 0) <= 0}
                  onClick={() => {
                    setMode("servings");
                    setTargetAmount("");
                  }}
                  className={`p-4 rounded-2xl border text-left transition disabled:opacity-40 disabled:cursor-not-allowed ${
                    mode === "servings"
                      ? "border-amber-400 bg-amber-50"
                      : "border-slate-200 hover:border-amber-200"
                  }`}
                >
                  <p className="font-bold text-slate-800">
                    ตามจำนวนเสิร์ฟ / ชิ้น
                  </p>

                  <p className="text-xs text-slate-500 mt-1">
                    เช่น สูตรเดิมได้ 20 ชิ้น ต้องการผลิต 150 ชิ้น
                  </p>
                </button>
              </div>

              <div className="max-w-md">
                <label className="block text-xs font-bold text-slate-600 mb-2">
                  {mode === "yield"
                    ? `Yield ที่ต้องการ (${displayUnit(
                        selectedRecipe.yield_unit
                      )})`
                    : "จำนวนเสิร์ฟ / ชิ้น ที่ต้องการ"}
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.001"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  placeholder={
                    mode === "yield"
                      ? "เช่น 5000"
                      : "เช่น 150"
                  }
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500"
                />
              </div>
            </section>

            {/* Result */}

            {factor > 0 && (
              <section className="bg-slate-800 rounded-3xl p-6 sm:p-7 text-white">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-white/10 p-2.5 rounded-xl">
                    <PackageCheck className="w-5 h-5 text-amber-400" />
                  </div>

                  <div>
                    <h2 className="font-extrabold">
                      แผนการผลิต
                    </h2>

                    <p className="text-xs text-slate-400 mt-0.5">
                      {selectedRecipe.name}
                    </p>
                  </div>
                </div>

                {/* Summary */}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-7">
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                    <p className="text-xs text-slate-400">
                      สูตรต้นฉบับ
                    </p>

                    <p className="text-lg font-extrabold mt-1">
                      1 สูตร
                    </p>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                    <p className="text-xs text-slate-400">
                      จำนวนที่ต้องผลิต
                    </p>

                    <p className="text-lg font-extrabold text-amber-400 mt-1">
                      {formatNumber(Number(targetAmount))}{" "}
                      {mode === "yield"
                        ? displayUnit(selectedRecipe.yield_unit)
                        : "ชิ้น / เสิร์ฟ"}
                    </p>
                  </div>

                  <div className="bg-amber-500 rounded-2xl p-4">
                    <p className="text-xs text-amber-100">
                      ต้องทำทั้งหมด
                    </p>

                    <p className="text-2xl font-extrabold mt-1">
                      {formatNumber(totalBatches)} สูตร
                    </p>
                  </div>
                </div>

                {/* Ingredients */}

                <div>
                  <h3 className="font-bold mb-3">
                    วัตถุดิบที่ต้องใช้
                  </h3>

                  {loadingRecipe ? (
                    <div className="text-sm text-slate-400 py-4">
                      กำลังคำนวณวัตถุดิบ...
                    </div>
                  ) : calculatedIngredients.length === 0 ? (
                    <div className="bg-white/5 rounded-xl p-4 text-sm text-slate-400">
                      สูตรนี้ยังไม่มีข้อมูลวัตถุดิบ
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-700">
                      {calculatedIngredients.map((item) => (
                        <div
                          key={item.id}
                          className="py-3.5 flex items-center justify-between gap-4"
                        >
                          <div>
                            <p className="text-sm text-slate-200">
                              {item.ingredient_name}
                            </p>

                            <p className="text-[11px] text-slate-500 mt-0.5">
                              สูตรเดิม{" "}
                              {formatNumber(Number(item.quantity))}{" "}
                              {displayUnit(item.unit)}
                            </p>
                          </div>

                          <p className="font-extrabold text-amber-400 text-right">
                            {formatNumber(item.productionQuantity)}{" "}
                            {displayUnit(item.unit)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            )}
          </>
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