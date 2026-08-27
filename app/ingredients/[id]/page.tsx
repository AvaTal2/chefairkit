"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

type Ingredient = {
  id: string;
  user_id: string;
  name: string;
  brand: string | null;
  pack_quantity: number;
  pack_unit: string;
  pack_price: number;
  category: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type RecipeUsage = {
  id: string;
  recipe_id: string;
  ingredient_id: string | null;
  ingredient_name: string;
  quantity: number;
  unit: string;
  pack_price: number | null;
  pack_quantity: number | null;
  pack_unit: string | null;
  recipe: {
    id: string;
    name: string;
    category: string | null;
  } | null;
};

export default function IngredientDetailPage() {
  const params = useParams();
  const router = useRouter();

  const ingredientId = params.id as string;

  const [ingredient, setIngredient] = useState<Ingredient | null>(null);
  const [usage, setUsage] = useState<RecipeUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (ingredientId) {
      loadData();
    }
  }, [ingredientId]);

  const loadData = async () => {
    setLoading(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { data: ingredientData, error: ingredientError } = await supabase
      .from("ingredients")
      .select("*")
      .eq("id", ingredientId)
      .single();

    if (ingredientError || !ingredientData) {
      setMessage("ไม่พบวัตถุดิบ หรือคุณไม่มีสิทธิ์เข้าถึง");
      setLoading(false);
      return;
    }

    const { data: usageData, error: usageError } = await supabase
      .from("recipe_ingredients")
      .select(
        `
        id,
        recipe_id,
        ingredient_id,
        ingredient_name,
        quantity,
        unit,
        pack_price,
        pack_quantity,
        pack_unit,
        recipe:recipes (
          id,
          name,
          category
        )
      `
      )
      .eq("ingredient_id", ingredientId);

    if (usageError) {
      setMessage("โหลดสูตรที่ใช้วัตถุดิบนี้ไม่สำเร็จ: " + usageError.message);
      setLoading(false);
      return;
    }

    setIngredient(ingredientData);
    setUsage(
  ((usageData || []) as unknown) as RecipeUsage[]
);
    setLoading(false);
  };

  const unitCost = useMemo(() => {
    if (!ingredient) return 0;

    const qty = Number(ingredient.pack_quantity || 0);
    const price = Number(ingredient.pack_price || 0);

    if (qty <= 0 || price <= 0) return 0;

    return price / qty;
  }, [ingredient]);

  const calculateOldRecipeCost = (item: RecipeUsage) => {
    const packPrice = Number(item.pack_price || 0);
    const packQuantity = Number(item.pack_quantity || 0);
    const quantity = Number(item.quantity || 0);

    if (packPrice <= 0 || packQuantity <= 0 || quantity <= 0) {
      return 0;
    }

    return (packPrice / packQuantity) * quantity;
  };

  const calculateNewRecipeCost = (item: RecipeUsage) => {
    if (!ingredient) return 0;

    const packPrice = Number(ingredient.pack_price || 0);
    const packQuantity = Number(ingredient.pack_quantity || 0);
    const quantity = Number(item.quantity || 0);

    if (packPrice <= 0 || packQuantity <= 0 || quantity <= 0) {
      return 0;
    }

    return (packPrice / packQuantity) * quantity;
  };

  const handleSyncAll = async () => {
    if (!ingredient) return;

    const confirmed = window.confirm(
      `ต้องการอัปเดตราคาและขนาดแพ็กของ "${ingredient.name}" ในสูตรที่เชื่อมทั้งหมด ${usage.length} สูตรใช่หรือไม่?`
    );

    if (!confirmed) return;

    setSyncing(true);
    setMessage("");

    const { error } = await supabase
      .from("recipe_ingredients")
      .update({
        pack_price: ingredient.pack_price,
        pack_quantity: ingredient.pack_quantity,
        pack_unit: ingredient.pack_unit,
        ingredient_name: ingredient.name,
      })
      .eq("ingredient_id", ingredient.id);

    if (error) {
      setMessage("อัปเดตราคาสูตรไม่สำเร็จ: " + error.message);
      setSyncing(false);
      return;
    }

    await loadData();
    setMessage("อัปเดตราคาในสูตรที่เชื่อมทั้งหมดเรียบร้อยแล้ว");
    setSyncing(false);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center text-slate-500">
            กำลังโหลดข้อมูลวัตถุดิบ...
          </div>
        </div>
      </main>
    );
  }

  if (!ingredient) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center">
            <h1 className="font-bold text-slate-800 text-lg">
              ไม่พบวัตถุดิบ
            </h1>

            {message && (
              <p className="text-sm text-red-500 mt-2">
                {message}
              </p>
            )}

            <Link
              href="/ingredients"
              className="inline-block mt-5 bg-amber-500 text-white font-bold px-5 py-2.5 rounded-xl"
            >
              กลับไปคลังวัตถุดิบ
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-7">
          <div>
            <Link
              href="/ingredients"
              className="text-sm text-slate-500 hover:text-amber-600"
            >
              ← คลังวัตถุดิบ
            </Link>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 mt-2">
              {ingredient.name}
            </h1>

            <div className="flex flex-wrap gap-2 mt-2 text-sm">
              {ingredient.brand && (
                <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full">
                  {ingredient.brand}
                </span>
              )}

              {ingredient.category && (
                <span className="bg-amber-50 text-amber-700 px-3 py-1 rounded-full">
                  {ingredient.category}
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleSyncAll}
            disabled={syncing || usage.length === 0}
            className="bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition"
          >
            {syncing
              ? "กำลังอัปเดต..."
              : `อัปเดตราคาใน ${usage.length} สูตร`}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <p className="text-xs text-slate-400">
              ขนาดแพ็กปัจจุบัน
            </p>

            <p className="text-xl font-extrabold text-slate-800 mt-1">
              {ingredient.pack_quantity} {ingredient.pack_unit}
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <p className="text-xs text-slate-400">
              ราคาปัจจุบัน
            </p>

            <p className="text-xl font-extrabold text-slate-800 mt-1">
              {Number(ingredient.pack_price || 0).toFixed(2)} บาท
            </p>
          </div>

          <div className="bg-amber-500 text-white rounded-2xl p-5 shadow-sm">
            <p className="text-xs text-amber-100">
              ต้นทุนต่อหน่วย
            </p>

            <p className="text-xl font-extrabold mt-1">
              {unitCost.toFixed(4)} บาท/{ingredient.pack_unit}
            </p>
          </div>
        </div>

        <section className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h2 className="font-bold text-slate-800">
              สูตรที่ใช้วัตถุดิบนี้
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              เปรียบเทียบต้นทุน snapshot เดิมในสูตร กับราคาปัจจุบันในคลังวัตถุดิบ
            </p>
          </div>

          {usage.length === 0 ? (
            <div className="p-10 text-center">
              <div className="text-4xl mb-3">🥣</div>

              <h3 className="font-bold text-slate-800">
                ยังไม่มีสูตรที่เชื่อมกับวัตถุดิบนี้
              </h3>

              <p className="text-sm text-slate-500 mt-1">
                เมื่อเลือกวัตถุดิบนี้ในสูตรใหม่ รายการจะมาแสดงที่นี่
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="text-left px-5 py-3">
                      สูตร
                    </th>

                    <th className="text-right px-5 py-3">
                      ปริมาณใช้
                    </th>

                    <th className="text-right px-5 py-3">
                      ราคาแพ็กเดิม
                    </th>

                    <th className="text-right px-5 py-3">
                      ราคาปัจจุบัน
                    </th>

                    <th className="text-right px-5 py-3">
                      ต้นทุนเดิม
                    </th>

                    <th className="text-right px-5 py-3">
                      ต้นทุนใหม่
                    </th>

                    <th className="text-right px-5 py-3">
                      ต่างกัน
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {usage.map((item) => {
                    const oldCost = calculateOldRecipeCost(item);
                    const newCost = calculateNewRecipeCost(item);
                    const diff = newCost - oldCost;

                    return (
                      <tr key={item.id}>
                        <td className="px-5 py-4">
                          {item.recipe ? (
                            <Link
                              href={`/recipes/${item.recipe.id}`}
                              className="font-bold text-slate-700 hover:text-amber-600"
                            >
                              {item.recipe.name}
                            </Link>
                          ) : (
                            <span className="text-slate-400">
                              ไม่พบสูตร
                            </span>
                          )}

                          {item.recipe?.category && (
                            <div className="text-xs text-slate-400 mt-1">
                              {item.recipe.category}
                            </div>
                          )}
                        </td>

                        <td className="px-5 py-4 text-right text-slate-600">
                          {item.quantity} {item.unit}
                        </td>

                        <td className="px-5 py-4 text-right text-slate-600">
                          {Number(item.pack_price || 0).toFixed(2)} บาท
                        </td>

                        <td className="px-5 py-4 text-right font-semibold text-slate-700">
                          {Number(ingredient.pack_price || 0).toFixed(2)} บาท
                        </td>

                        <td className="px-5 py-4 text-right text-slate-600">
                          {oldCost.toFixed(2)} บาท
                        </td>

                        <td className="px-5 py-4 text-right font-bold text-slate-800">
                          {newCost.toFixed(2)} บาท
                        </td>

                        <td
                          className={`px-5 py-4 text-right font-bold ${
                            diff > 0
                              ? "text-red-500"
                              : diff < 0
                              ? "text-green-600"
                              : "text-slate-400"
                          }`}
                        >
                          {diff > 0 ? "+" : ""}
                          {diff.toFixed(2)} บาท
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {ingredient.notes && (
          <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm mt-5">
            <p className="text-xs text-slate-400">
              หมายเหตุ
            </p>

            <p className="text-sm text-slate-700 mt-2 whitespace-pre-line">
              {ingredient.notes}
            </p>
          </section>
        )}

        {message && (
          <div
            className={`rounded-xl px-4 py-3 text-sm mt-5 ${
              message.includes("เรียบร้อย")
                ? "bg-green-50 border border-green-100 text-green-700"
                : "bg-red-50 border border-red-100 text-red-600"
            }`}
          >
            {message}
          </div>
        )}
      </div>
    </main>
  );
}