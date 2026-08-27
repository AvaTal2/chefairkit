"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

type LibraryIngredient = {
  id: string;
  name: string;
  brand: string | null;
  pack_quantity: number;
  pack_unit: string;
  pack_price: number;
};

type RecipeIngredient = {
  rowId: string | null;
  libraryId: string | null;
  name: string;
  quantity: string;
  unit: string;
  packPrice: string;
  packQuantity: string;
  packUnit: string;
  search: string;
};

const createEmptyIngredient = (): RecipeIngredient => ({
  rowId: null,
  libraryId: null,
  name: "",
  quantity: "",
  unit: "g",
  packPrice: "",
  packQuantity: "",
  packUnit: "g",
  search: "",
});

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
    const base = value * weightUnits[fromUnit];
    return base / weightUnits[toUnit];
  }

  if (volumeUnits[fromUnit] && volumeUnits[toUnit]) {
    const base = value * volumeUnits[fromUnit];
    return base / volumeUnits[toUnit];
  }

  return null;
};

export default function EditRecipePage() {
  const params = useParams();
  const router = useRouter();

  const recipeId = params.id as string;

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [yieldAmount, setYieldAmount] = useState("");
  const [yieldUnit, setYieldUnit] = useState("g");
  const [servings, setServings] = useState("");
  const [notes, setNotes] = useState("");

  const [library, setLibrary] = useState<LibraryIngredient[]>([]);
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([]);

  const [openLibraryIndex, setOpenLibraryIndex] =
    useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadPage();
  }, [recipeId]);

  const loadPage = async () => {
    setLoading(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const [
      recipeResult,
      ingredientResult,
      libraryResult,
    ] = await Promise.all([
      supabase
        .from("recipes")
        .select("*")
        .eq("id", recipeId)
        .single(),

      supabase
        .from("recipe_ingredients")
        .select("*")
        .eq("recipe_id", recipeId)
        .order("created_at", { ascending: true }),

      supabase
        .from("ingredients")
        .select(
          "id, name, brand, pack_quantity, pack_unit, pack_price"
        )
        .order("name", { ascending: true }),
    ]);

    if (recipeResult.error || !recipeResult.data) {
      setMessage("ไม่พบสูตร หรือคุณไม่มีสิทธิ์เข้าถึง");
      setLoading(false);
      return;
    }

    if (ingredientResult.error) {
      setMessage(
        "โหลดวัตถุดิบในสูตรไม่สำเร็จ: " +
          ingredientResult.error.message
      );
      setLoading(false);
      return;
    }

    if (libraryResult.error) {
      setMessage(
        "โหลดคลังวัตถุดิบไม่สำเร็จ: " +
          libraryResult.error.message
      );
      setLoading(false);
      return;
    }

    const recipe = recipeResult.data;

    setName(recipe.name || "");
    setCategory(recipe.category || "");
    setYieldAmount(
      recipe.yield_amount !== null
        ? String(recipe.yield_amount)
        : ""
    );
    setYieldUnit(recipe.yield_unit || "g");
    setServings(
      recipe.servings !== null
        ? String(recipe.servings)
        : ""
    );
    setNotes(recipe.notes || "");

    setLibrary(libraryResult.data || []);

    const rows =
      (ingredientResult.data || []).map((item) => ({
        rowId: item.id,
        libraryId: item.ingredient_id || null,
        name: item.ingredient_name || "",
        quantity: String(item.quantity ?? ""),
        unit: item.unit || "g",
        packPrice: String(item.pack_price ?? ""),
        packQuantity: String(item.pack_quantity ?? ""),
        packUnit: item.pack_unit || item.unit || "g",
        search: item.ingredient_name || "",
      }));

    setIngredients(
      rows.length > 0 ? rows : [createEmptyIngredient()]
    );

    setLoading(false);
  };

  const addIngredient = () => {
    setIngredients([
      ...ingredients,
      createEmptyIngredient(),
    ]);
  };

  const removeIngredient = (index: number) => {
    if (ingredients.length === 1) return;

    setIngredients(
      ingredients.filter((_, i) => i !== index)
    );

    if (openLibraryIndex === index) {
      setOpenLibraryIndex(null);
    }
  };

  const updateIngredient = (
    index: number,
    field: keyof RecipeIngredient,
    value: string | null
  ) => {
    setIngredients(
      ingredients.map((item, i) =>
        i === index
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    );
  };

  const selectLibraryIngredient = (
    index: number,
    item: LibraryIngredient
  ) => {
    setIngredients(
      ingredients.map((row, i) =>
        i === index
          ? {
              ...row,
              libraryId: item.id,
              name: item.name,
              search: item.brand
                ? `${item.name} — ${item.brand}`
                : item.name,
              packPrice: String(item.pack_price ?? ""),
              packQuantity: String(item.pack_quantity ?? ""),
              packUnit: item.pack_unit || "g",
              unit: row.unit || item.pack_unit || "g",
            }
          : row
      )
    );

    setOpenLibraryIndex(null);
  };

  const clearLibrarySelection = (index: number) => {
    setIngredients(
      ingredients.map((item, i) =>
        i === index
          ? {
              ...item,
              libraryId: null,
              search: item.name,
            }
          : item
      )
    );
  };

  const getFilteredLibrary = (search: string) => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return library.slice(0, 10);
    }

    return library
      .filter((item) => {
        const nameText = item.name.toLowerCase();
        const brandText = (item.brand || "").toLowerCase();

        return (
          nameText.includes(keyword) ||
          brandText.includes(keyword)
        );
      })
      .slice(0, 10);
  };

  const estimatedTotalCost = useMemo(() => {
    return ingredients.reduce((sum, item) => {
      const usedQuantity = Number(item.quantity || 0);
      const packPrice = Number(item.packPrice || 0);
      const packQuantity = Number(item.packQuantity || 0);

      if (
        usedQuantity <= 0 ||
        packPrice <= 0 ||
        packQuantity <= 0
      ) {
        return sum;
      }

      const converted = convertQuantity(
        usedQuantity,
        item.unit,
        item.packUnit
      );

      if (converted === null) {
        return sum;
      }

      return (
        sum +
        (packPrice / packQuantity) * converted
      );
    }, 0);
  }, [ingredients]);

  const handleSave = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setSaving(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const validIngredients =
      ingredients.filter(
        (item) =>
          item.name.trim() &&
          Number(item.quantity || 0) > 0
      );

    if (validIngredients.length === 0) {
      setMessage("กรุณาเพิ่มวัตถุดิบอย่างน้อย 1 รายการ");
      setSaving(false);
      return;
    }

    const { error: recipeError } = await supabase
      .from("recipes")
      .update({
        name: name.trim(),
        category: category.trim() || null,
        yield_amount: yieldAmount
          ? Number(yieldAmount)
          : null,
        yield_unit: yieldUnit,
        servings: servings
          ? Number(servings)
          : null,
        notes: notes.trim() || null,
      })
      .eq("id", recipeId);

    if (recipeError) {
      setMessage(
        "แก้ไขสูตรไม่สำเร็จ: " +
          recipeError.message
      );
      setSaving(false);
      return;
    }

    const { error: deleteError } = await supabase
      .from("recipe_ingredients")
      .delete()
      .eq("recipe_id", recipeId);

    if (deleteError) {
      setMessage(
        "ล้างวัตถุดิบเดิมไม่สำเร็จ: " +
          deleteError.message
      );
      setSaving(false);
      return;
    }

    const rows = validIngredients.map((item) => ({
      recipe_id: recipeId,
      ingredient_id: item.libraryId,
      ingredient_name: item.name.trim(),
      quantity: Number(item.quantity || 0),
      unit: item.unit,
      pack_price: Number(item.packPrice || 0),
      pack_quantity: Number(item.packQuantity || 0),
      pack_unit: item.packUnit || item.unit,
    }));

    const { error: insertError } = await supabase
      .from("recipe_ingredients")
      .insert(rows);

    if (insertError) {
      setMessage(
        "บันทึกวัตถุดิบใหม่ไม่สำเร็จ: " +
          insertError.message
      );
      setSaving(false);
      return;
    }

    router.push(`/recipes/${recipeId}`);
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

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <button
            type="button"
            onClick={() => router.back()}
            className="text-sm text-slate-500 hover:text-amber-600"
          >
            ← กลับ
          </button>

          <h1 className="text-2xl font-extrabold text-slate-800 mt-2">
            แก้ไขสูตร
          </h1>

          <p className="text-sm text-slate-500 mt-1">
            แก้ไขสูตรและเชื่อมวัตถุดิบกับคลัง
          </p>
        </div>

        <form
          onSubmit={handleSave}
          className="space-y-6"
        >
          {/* ข้อมูลสูตร */}
          <section className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <h2 className="font-bold text-slate-800 mb-5">
              ข้อมูลสูตร
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  ชื่อสูตร
                </label>

                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  หมวดหมู่
                </label>

                <input
                  value={category}
                  onChange={(e) =>
                    setCategory(e.target.value)
                  }
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Yield ที่ได้จริง
                </label>

                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    step="0.001"
                    value={yieldAmount}
                    onChange={(e) =>
                      setYieldAmount(e.target.value)
                    }
                    className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-sm"
                  />

                  <select
                    value={yieldUnit}
                    onChange={(e) =>
                      setYieldUnit(e.target.value)
                    }
                    className="px-3 border border-slate-200 rounded-xl text-sm bg-white"
                  >
                    <option value="g">กรัม</option>
                    <option value="kg">กิโลกรัม</option>
                    <option value="ml">มิลลิลิตร</option>
                    <option value="l">ลิตร</option>
                    <option value="piece">ชิ้น</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  จำนวนเสิร์ฟ / จำนวนชิ้น
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.001"
                  value={servings}
                  onChange={(e) =>
                    setServings(e.target.value)
                  }
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                หมายเหตุ
              </label>

              <textarea
                value={notes}
                onChange={(e) =>
                  setNotes(e.target.value)
                }
                rows={3}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm"
              />
            </div>
          </section>

          {/* วัตถุดิบ */}
          <section className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-bold text-slate-800">
                  วัตถุดิบในสูตร
                </h2>

                <p className="text-xs text-slate-400 mt-1">
                  เลือกจากคลังเพื่อเชื่อมราคาและโภชนาการ
                </p>
              </div>

              <button
                type="button"
                onClick={addIngredient}
                className="text-sm font-bold text-amber-600"
              >
                + เพิ่มวัตถุดิบ
              </button>
            </div>

            <div className="space-y-4">
              {ingredients.map((item, index) => {
                const filteredLibrary =
                  getFilteredLibrary(item.search);

                const usedQuantity = Number(
                  item.quantity || 0
                );

                const packPrice = Number(
                  item.packPrice || 0
                );

                const packQuantity = Number(
                  item.packQuantity || 0
                );

                const converted =
                  usedQuantity > 0
                    ? convertQuantity(
                        usedQuantity,
                        item.unit,
                        item.packUnit
                      )
                    : null;

                const estimatedCost =
                  converted !== null &&
                  packPrice > 0 &&
                  packQuantity > 0
                    ? (packPrice / packQuantity) *
                      converted
                    : 0;

                const unitCanConvert =
                  item.unit === item.packUnit ||
                  convertQuantity(
                    usedQuantity || 1,
                    item.unit,
                    item.packUnit
                  ) !== null;

                return (
                  <div
                    key={index}
                    className="border border-slate-200 rounded-2xl p-4"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                      <div className="md:col-span-5 relative">
                        <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                          วัตถุดิบ
                        </label>

                        <input
                          value={item.search}
                          onFocus={() =>
                            setOpenLibraryIndex(index)
                          }
                          onChange={(e) => {
                            const value = e.target.value;

                            setOpenLibraryIndex(index);

                            setIngredients(
                              ingredients.map((row, i) =>
                                i === index
                                  ? {
                                      ...row,
                                      search: value,
                                      name: value,
                                      libraryId: null,
                                    }
                                  : row
                              )
                            );
                          }}
                          placeholder="ค้นหาวัตถุดิบ"
                          className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm"
                        />

                        {openLibraryIndex === index &&
                          filteredLibrary.length > 0 && (
                            <div className="absolute z-30 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-64 overflow-y-auto">
                              {filteredLibrary.map(
                                (libraryItem) => (
                                  <button
                                    key={libraryItem.id}
                                    type="button"
                                    onMouseDown={(e) => {
                                      e.preventDefault();

                                      selectLibraryIngredient(
                                        index,
                                        libraryItem
                                      );
                                    }}
                                    className="w-full text-left px-4 py-3 hover:bg-amber-50 border-b border-slate-100 last:border-b-0"
                                  >
                                    <div className="font-semibold text-sm text-slate-700">
                                      {libraryItem.name}
                                    </div>

                                    <div className="text-xs text-slate-400 mt-1">
                                      {libraryItem.brand
                                        ? `${libraryItem.brand} • `
                                        : ""}

                                      {
                                        libraryItem.pack_quantity
                                      }{" "}
                                      {
                                        libraryItem.pack_unit
                                      }{" "}
                                      •{" "}
                                      {Number(
                                        libraryItem.pack_price
                                      ).toFixed(2)}{" "}
                                      บาท
                                    </div>
                                  </button>
                                )
                              )}
                            </div>
                          )}

                        {item.libraryId && (
                          <div className="mt-1.5 flex items-center gap-2">
                            <span className="text-xs text-green-600 font-semibold">
                              ✓ เชื่อมกับคลังวัตถุดิบ
                            </span>

                            <button
                              type="button"
                              onClick={() =>
                                clearLibrarySelection(index)
                              }
                              className="text-xs text-slate-400"
                            >
                              ยกเลิกการเชื่อม
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                          ปริมาณใช้
                        </label>

                        <input
                          type="number"
                          min="0"
                          step="0.001"
                          value={item.quantity}
                          onChange={(e) =>
                            updateIngredient(
                              index,
                              "quantity",
                              e.target.value
                            )
                          }
                          className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                          หน่วย
                        </label>

                        <select
                          value={item.unit}
                          onChange={(e) =>
                            updateIngredient(
                              index,
                              "unit",
                              e.target.value
                            )
                          }
                          className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white"
                        >
                          <option value="g">g</option>
                          <option value="kg">kg</option>
                          <option value="ml">ml</option>
                          <option value="l">L</option>
                          <option value="piece">ชิ้น</option>
                          <option value="pack">แพ็ก</option>
                          <option value="bottle">ขวด</option>
                          <option value="bag">ถุง</option>
                          <option value="box">กล่อง</option>
                        </select>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                          ต้นทุน
                        </label>

                        <div className="h-[42px] px-3 flex items-center justify-end bg-slate-50 rounded-xl text-sm font-bold">
                          {unitCanConvert
                            ? `${estimatedCost.toFixed(2)} บาท`
                            : "-"}
                        </div>
                      </div>

                      <div className="md:col-span-1">
                        <button
                          type="button"
                          onClick={() =>
                            removeIngredient(index)
                          }
                          className="w-full h-[42px] rounded-xl border border-red-100 text-red-500 text-xs font-bold"
                        >
                          ลบ
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 bg-slate-50 rounded-xl px-4 py-3 text-xs">
                      <div className="flex flex-wrap gap-x-6 gap-y-2">
                        <div>
                          ขนาดแพ็ก:{" "}
                          <strong>
                            {item.packQuantity || "-"}{" "}
                            {item.packUnit}
                          </strong>
                        </div>

                        <div>
                          ราคาแพ็ก:{" "}
                          <strong>
                            {item.packPrice
                              ? `${Number(
                                  item.packPrice
                                ).toFixed(2)} บาท`
                              : "-"}
                          </strong>
                        </div>

                        {item.unit !== item.packUnit && (
                          <div
                            className={
                              unitCanConvert
                                ? "text-green-600 font-semibold"
                                : "text-amber-600 font-semibold"
                            }
                          >
                            {unitCanConvert
                              ? "✓ ระบบแปลงหน่วยให้อัตโนมัติ"
                              : "⚠ ไม่สามารถแปลงหน่วยนี้อัตโนมัติ"}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-center justify-between">
              <span className="text-sm font-semibold">
                ต้นทุนวัตถุดิบโดยประมาณ
              </span>

              <span className="text-xl font-extrabold text-amber-600">
                {estimatedTotalCost.toFixed(2)} บาท
              </span>
            </div>
          </section>

          {message && (
            <div className="bg-red-50 border border-red-100 text-red-600 rounded-xl px-4 py-3 text-sm">
              {message}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() =>
                router.push(`/recipes/${recipeId}`)
              }
              className="flex-1 border border-slate-200 bg-white text-slate-700 font-bold py-3 rounded-xl"
            >
              ยกเลิก
            </button>

            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white font-bold py-3 rounded-xl"
            >
              {saving
                ? "กำลังบันทึก..."
                : "บันทึกการแก้ไข"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}