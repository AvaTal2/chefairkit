"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Copy,
  Loader2,
  Search,
  SlidersHorizontal,
} from "lucide-react";

import { supabase } from "@/lib/supabase/client";

type Recipe = {
  id: string;
  name: string;
  category: string | null;
  yield_amount: number | null;
  yield_unit: string | null;
  servings: number | null;
  created_at: string;
};

type SortMode =
  | "newest"
  | "oldest"
  | "name_asc"
  | "name_desc";

export default function RecipesPage() {
  const router = useRouter();

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sortMode, setSortMode] =
    useState<SortMode>("newest");

  const [duplicatingId, setDuplicatingId] =
    useState<string | null>(null);

  const [message, setMessage] = useState("");

  useEffect(() => {
    loadRecipes();
  }, []);

  const loadRecipes = async () => {
    setLoading(true);

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
        "id, name, category, yield_amount, yield_unit, servings, created_at"
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(
        "โหลดสูตรไม่สำเร็จ: " + error.message
      );
      setLoading(false);
      return;
    }

    setRecipes((data || []) as Recipe[]);
    setLoading(false);
  };

  const categories = useMemo(() => {
    return Array.from(
      new Set(
        recipes
          .map((recipe) => recipe.category?.trim())
          .filter((value): value is string => Boolean(value))
      )
    ).sort((a, b) =>
      a.localeCompare(b, "th")
    );
  }, [recipes]);

  const visibleRecipes = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase("th");

    const result = recipes.filter((recipe) => {
      const matchesSearch =
        !keyword ||
        recipe.name
          .toLocaleLowerCase("th")
          .includes(keyword) ||
        (recipe.category || "")
          .toLocaleLowerCase("th")
          .includes(keyword);

      const matchesCategory =
        category === "all" ||
        recipe.category === category;

      return matchesSearch && matchesCategory;
    });

    return [...result].sort((a, b) => {
      if (sortMode === "oldest") {
        return (
          new Date(a.created_at).getTime() -
          new Date(b.created_at).getTime()
        );
      }

      if (sortMode === "name_asc") {
        return a.name.localeCompare(
          b.name,
          "th",
          { sensitivity: "base" }
        );
      }

      if (sortMode === "name_desc") {
        return b.name.localeCompare(
          a.name,
          "th",
          { sensitivity: "base" }
        );
      }

      return (
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime()
      );
    });
  }, [recipes, search, category, sortMode]);

  const handleDuplicateRecipe = async (
    recipe: Recipe
  ) => {
    if (duplicatingId) {
      return;
    }

    setDuplicatingId(recipe.id);
    setMessage("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const {
        data: sourceRecipe,
        error: sourceRecipeError,
      } = await supabase
        .from("recipes")
        .select(
          "name, category, yield_amount, yield_unit, servings, notes"
        )
        .eq("id", recipe.id)
        .eq("user_id", user.id)
        .single();

      if (sourceRecipeError || !sourceRecipe) {
        throw new Error(
          sourceRecipeError?.message ||
            "ไม่พบสูตรต้นฉบับ"
        );
      }

      const {
        data: sourceIngredients,
        error: sourceIngredientsError,
      } = await supabase
        .from("recipe_ingredients")
        .select(
          `
          ingredient_id,
          ingredient_name,
          quantity,
          unit,
          pack_price,
          pack_quantity,
          pack_unit
          `
        )
        .eq("recipe_id", recipe.id)
        .order("created_at", {
          ascending: true,
        });

      if (sourceIngredientsError) {
        throw new Error(
          sourceIngredientsError.message
        );
      }

      const {
        data: newRecipe,
        error: newRecipeError,
      } = await supabase
        .from("recipes")
        .insert({
          user_id: user.id,
          name: `${sourceRecipe.name} - สำเนา`,
          category: sourceRecipe.category,
          yield_amount: sourceRecipe.yield_amount,
          yield_unit: sourceRecipe.yield_unit,
          servings: sourceRecipe.servings,
          notes: sourceRecipe.notes,
        })
        .select(
          "id, name, category, yield_amount, yield_unit, servings, created_at"
        )
        .single();

      if (newRecipeError || !newRecipe) {
        throw new Error(
          newRecipeError?.message ||
            "สร้างสำเนาสูตรไม่สำเร็จ"
        );
      }

      if (
        sourceIngredients &&
        sourceIngredients.length > 0
      ) {
        const ingredientPayload =
          sourceIngredients.map((item) => ({
            recipe_id: newRecipe.id,
            ingredient_id: item.ingredient_id,
            ingredient_name:
              item.ingredient_name,
            quantity: item.quantity,
            unit: item.unit,
            pack_price: item.pack_price,
            pack_quantity:
              item.pack_quantity,
            pack_unit: item.pack_unit,
          }));

        const {
          error: ingredientInsertError,
        } = await supabase
          .from("recipe_ingredients")
          .insert(ingredientPayload);

        if (ingredientInsertError) {
          await supabase
            .from("recipes")
            .delete()
            .eq("id", newRecipe.id)
            .eq("user_id", user.id);

          throw new Error(
            "คัดลอกวัตถุดิบไม่สำเร็จ: " +
              ingredientInsertError.message
          );
        }
      }

      setRecipes((current) => [
        newRecipe as Recipe,
        ...current,
      ]);

      setMessage(
        `สร้างสำเนา "${sourceRecipe.name}" เรียบร้อยแล้ว`
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? "ทำสำเนาสูตรไม่สำเร็จ: " +
              error.message
          : "ทำสำเนาสูตรไม่สำเร็จ"
      );
    } finally {
      setDuplicatingId(null);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800">
              สูตรของฉัน
            </h1>

            <p className="text-sm text-slate-500 mt-1">
              บันทึกและจัดการสูตรอาหารของคุณ
            </p>
          </div>

          <Link
            href="/recipes/new"
            className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-4 py-2.5 rounded-xl transition text-sm"
          >
            + เพิ่มสูตรใหม่
          </Link>
        </div>

        {!loading && recipes.length > 0 && (
          <section className="bg-white border border-slate-200 rounded-2xl p-4 mb-5 shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px_220px] gap-3">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

                <input
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                  placeholder="ค้นหาชื่อสูตร หรือหมวดหมู่..."
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="relative">
                <SlidersHorizontal className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />

                <select
                  value={category}
                  onChange={(e) =>
                    setCategory(e.target.value)
                  }
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:border-amber-500"
                >
                  <option value="all">
                    ทุกหมวดหมู่
                  </option>

                  {categories.map((item) => (
                    <option
                      key={item}
                      value={item}
                    >
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <select
                value={sortMode}
                onChange={(e) =>
                  setSortMode(
                    e.target.value as SortMode
                  )
                }
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:border-amber-500"
              >
                <option value="newest">
                  ใหม่ล่าสุด
                </option>

                <option value="oldest">
                  เก่าสุด
                </option>

                <option value="name_asc">
                  ชื่อ A → Z
                </option>

                <option value="name_desc">
                  ชื่อ Z → A
                </option>
              </select>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 mt-3">
              <p className="text-xs text-slate-500">
                แสดง {visibleRecipes.length} จาก{" "}
                {recipes.length} สูตร
              </p>

              {(search ||
                category !== "all" ||
                sortMode !== "newest") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setCategory("all");
                    setSortMode("newest");
                  }}
                  className="text-xs font-bold text-amber-600 hover:text-amber-700"
                >
                  ล้างตัวกรอง
                </button>
              )}
            </div>
          </section>
        )}

        {message && (
          <div
            className={`mb-5 border rounded-xl px-4 py-3 text-sm ${
              message.startsWith(
                "สร้างสำเนา"
              )
                ? "bg-emerald-50 border-emerald-100 text-emerald-700"
                : "bg-red-50 border-red-100 text-red-600"
            }`}
          >
            {message}
          </div>
        )}

        {loading ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500">
            กำลังโหลดสูตร...
          </div>
        ) : recipes.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center">
            <div className="text-4xl mb-3">🍳</div>

            <h2 className="font-bold text-slate-800 text-lg">
              ยังไม่มีสูตรที่บันทึก
            </h2>

            <p className="text-sm text-slate-500 mt-2 mb-5">
              เริ่มสร้างสูตรแรกของคุณได้เลย
            </p>

            <Link
              href="/recipes/new"
              className="inline-block bg-amber-500 hover:bg-amber-600 text-white font-bold px-5 py-2.5 rounded-xl transition text-sm"
            >
              เพิ่มสูตรแรก
            </Link>
          </div>
        ) : visibleRecipes.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center">
            <div className="text-4xl mb-3">🔎</div>

            <h2 className="font-bold text-slate-800 text-lg">
              ไม่พบสูตรที่ค้นหา
            </h2>

            <p className="text-sm text-slate-500 mt-2">
              ลองเปลี่ยนคำค้นหรือเลือกหมวดหมู่อื่น
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {visibleRecipes.map((recipe) => (
              <article
                key={recipe.id}
                className="bg-white border border-slate-200 hover:border-amber-300 rounded-2xl p-5 shadow-sm transition"
              >
                <Link
                  href={`/recipes/${recipe.id}`}
                  className="block"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-bold text-slate-800 text-lg">
                        {recipe.name}
                      </h2>

                      {recipe.category && (
                        <p className="text-xs text-amber-600 mt-1 font-semibold">
                          {recipe.category}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-5 text-sm">
                    <div className="bg-slate-50 rounded-xl p-3">
                      <p className="text-xs text-slate-400">
                        Yield
                      </p>

                      <p className="font-bold text-slate-700 mt-1">
                        {recipe.yield_amount
                          ? `${recipe.yield_amount} ${
                              recipe.yield_unit ??
                              ""
                            }`
                          : "-"}
                      </p>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-3">
                      <p className="text-xs text-slate-400">
                        จำนวนเสิร์ฟ
                      </p>

                      <p className="font-bold text-slate-700 mt-1">
                        {recipe.servings ?? "-"}
                      </p>
                    </div>
                  </div>
                </Link>

                <div className="border-t border-slate-100 mt-4 pt-4 flex items-center justify-between gap-3">
                  <Link
                    href={`/recipes/${recipe.id}`}
                    className="text-xs font-bold text-amber-600 hover:text-amber-700"
                  >
                    เปิดสูตร
                  </Link>

                  <button
                    type="button"
                    onClick={() =>
                      handleDuplicateRecipe(
                        recipe
                      )
                    }
                    disabled={
                      duplicatingId !== null
                    }
                    className="inline-flex items-center gap-1.5 border border-slate-200 hover:border-amber-300 hover:bg-amber-50 disabled:opacity-50 text-slate-600 hover:text-amber-700 font-bold px-3 py-2 rounded-lg text-xs transition"
                  >
                    {duplicatingId ===
                    recipe.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}

                    {duplicatingId ===
                    recipe.id
                      ? "กำลังทำสำเนา..."
                      : "ทำสำเนา"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
