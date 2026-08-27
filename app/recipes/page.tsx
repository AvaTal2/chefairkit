"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

export default function RecipesPage() {
  const router = useRouter();

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecipes();
  }, []);

  const loadRecipes = async () => {
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
      .order("created_at", { ascending: false });

    if (!error && data) {
      setRecipes(data);
    }

    setLoading(false);
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
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recipes.map((recipe) => (
              <Link
                key={recipe.id}
                href={`/recipes/${recipe.id}`}
                className="bg-white border border-slate-200 hover:border-amber-300 rounded-2xl p-5 shadow-sm transition"
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
                    <p className="text-xs text-slate-400">Yield</p>
                    <p className="font-bold text-slate-700 mt-1">
                      {recipe.yield_amount
                        ? `${recipe.yield_amount} ${recipe.yield_unit ?? ""}`
                        : "-"}
                    </p>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-400">จำนวนเสิร์ฟ</p>
                    <p className="font-bold text-slate-700 mt-1">
                      {recipe.servings ?? "-"}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}