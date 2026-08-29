"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useSubscription } from "@/hooks/useSubscription";

type LibraryIngredient = {
  id: string;
  name: string;
  brand: string | null;
  pack_quantity: number;
  pack_unit: string;
  pack_price: number;
};

type Ingredient = {
  libraryId: string | null;
  name: string;
  quantity: string;
  unit: string;
  packPrice: string;
  packQuantity: string;
  packUnit: string;
  search: string;
};

type TransferIngredient = {
  name: string;
  quantity: number;
  unit: string;
};

type RecipeTransferData = {
  source?: string;
  createdAt?: number;
  calculationMode?: string;
  calculationDescription?: string;
  yieldAmount?: number | null;
  yieldUnit?: string | null;
  servings?: number | null;
  ingredients?: TransferIngredient[];
};

const createEmptyIngredient = (): Ingredient => ({
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
    const valueInGrams = value * weightUnits[fromUnit];
    return valueInGrams / weightUnits[toUnit];
  }

  if (volumeUnits[fromUnit] && volumeUnits[toUnit]) {
    const valueInMl = value * volumeUnits[fromUnit];
    return valueInMl / volumeUnits[toUnit];
  }

  return null;
};

const normalizeUnit = (unit?: string | null) => {
  if (!unit) return "g";

  const unitMap: Record<string, string> = {
    g: "g",
    kg: "kg",
    ml: "ml",
    l: "l",
    L: "l",

    piece: "piece",
    ชิ้น: "piece",

    pack: "pack",
    แพ็ก: "pack",

    bottle: "bottle",
    ขวด: "bottle",

    bag: "bag",
    ถุง: "bag",

    box: "box",
    กล่อง: "box",

    egg: "piece",
    ฟอง: "piece",

    fruit: "piece",
    ลูก: "piece",

    tsp: "tsp",
    ช้อนชา: "tsp",

    tbsp: "tbsp",
    ช้อนโต๊ะ: "tbsp",

    cup: "cup",
    ถ้วย: "cup",
  };

  return unitMap[unit] || unit;
};

export default function NewRecipePage() {
  const router = useRouter();

  const {
    loading: subscriptionLoading,
    permissions,
  } = useSubscription();

  const [recipeCount, setRecipeCount] = useState(0);
  const [loadingRecipeLimit, setLoadingRecipeLimit] = useState(true);

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [yieldAmount, setYieldAmount] = useState("");
  const [yieldUnit, setYieldUnit] = useState("g");
  const [servings, setServings] = useState("");
  const [notes, setNotes] = useState("");

  const [library, setLibrary] = useState<LibraryIngredient[]>([]);

  const [ingredients, setIngredients] = useState<Ingredient[]>([
    createEmptyIngredient(),
  ]);

  const [openLibraryIndex, setOpenLibraryIndex] =
    useState<number | null>(null);

  const [loadingLibrary, setLoadingLibrary] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [importedFromCalculator, setImportedFromCalculator] =
    useState(false);

  const [calculationDescription, setCalculationDescription] =
    useState("");

  useEffect(() => {
    loadIngredientLibrary();
    loadRecipeTransfer();
  }, []);

  useEffect(() => {
    if (subscriptionLoading) {
      return;
    }

    loadRecipeCount();
  }, [
    subscriptionLoading,
    permissions.recipeLimit,
  ]);

  const loadRecipeCount = async () => {
    setLoadingRecipeLimit(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoadingRecipeLimit(false);
      return;
    }

    const {
      count,
      error,
    } = await supabase
      .from("recipes")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("user_id", user.id);

    if (error) {
      console.error(
        "ตรวจสอบจำนวนสูตรไม่สำเร็จ:",
        error
      );

      setLoadingRecipeLimit(false);
      return;
    }

    setRecipeCount(count || 0);
    setLoadingRecipeLimit(false);
  };

  const loadRecipeTransfer = () => {
    try {
      const rawData = sessionStorage.getItem(
        "chefair_recipe_transfer"
      );

      if (!rawData) {
        return;
      }

      const transferData: RecipeTransferData =
        JSON.parse(rawData);

      if (
        transferData.source !== "recipe-calculator" ||
        !Array.isArray(transferData.ingredients) ||
        transferData.ingredients.length === 0
      ) {
        return;
      }

      // ป้องกันข้อมูลเก่าค้างนานเกินไป
      if (
        transferData.createdAt &&
        Date.now() - transferData.createdAt >
          1000 * 60 * 60 * 12
      ) {
        sessionStorage.removeItem(
          "chefair_recipe_transfer"
        );

        return;
      }

      const importedIngredients: Ingredient[] =
        transferData.ingredients
          .filter(
            (item) =>
              item.name?.trim() &&
              Number(item.quantity) > 0
          )
          .map((item) => {
            const normalizedUnit = normalizeUnit(
              item.unit
            );

            return {
              libraryId: null,
              name: item.name.trim(),
              quantity: String(item.quantity),
              unit: normalizedUnit,
              packPrice: "",
              packQuantity: "",
              packUnit: normalizedUnit,
              search: item.name.trim(),
            };
          });

      if (importedIngredients.length > 0) {
        setIngredients(importedIngredients);
        setImportedFromCalculator(true);
      }

      if (
        transferData.yieldAmount !== null &&
        transferData.yieldAmount !== undefined &&
        Number(transferData.yieldAmount) > 0
      ) {
        setYieldAmount(
          String(transferData.yieldAmount)
        );
      }

      if (transferData.yieldUnit) {
        const normalizedYieldUnit =
          normalizeUnit(transferData.yieldUnit);

        if (
          ["g", "kg", "ml", "l", "piece"].includes(
            normalizedYieldUnit
          )
        ) {
          setYieldUnit(normalizedYieldUnit);
        }
      }

      if (
        transferData.servings !== null &&
        transferData.servings !== undefined &&
        Number(transferData.servings) > 0
      ) {
        setServings(
          String(transferData.servings)
        );
      }

      if (transferData.calculationDescription) {
        setCalculationDescription(
          transferData.calculationDescription
        );
      }
    } catch (error) {
      console.error(
        "ไม่สามารถอ่านข้อมูลจาก Recipe Calculator:",
        error
      );

      sessionStorage.removeItem(
        "chefair_recipe_transfer"
      );
    }
  };

  const loadIngredientLibrary = async () => {
    setLoadingLibrary(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { data, error } = await supabase
      .from("ingredients")
      .select(
        "id, name, brand, pack_quantity, pack_unit, pack_price"
      )
      .order("name", { ascending: true });

    if (error) {
      setMessage(
        "โหลดคลังวัตถุดิบไม่สำเร็จ: " +
          error.message
      );

      setLoadingLibrary(false);
      return;
    }

    setLibrary(data || []);
    setLoadingLibrary(false);
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
    field: keyof Ingredient,
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
              packPrice: String(
                item.pack_price ?? ""
              ),
              packQuantity: String(
                item.pack_quantity ?? ""
              ),
              packUnit:
                item.pack_unit || "g",
              unit:
                row.unit ||
                item.pack_unit ||
                "g",
            }
          : row
      )
    );

    setOpenLibraryIndex(null);
  };

  const clearLibrarySelection = (
    index: number
  ) => {
    setIngredients(
      ingredients.map((item, i) =>
        i === index
          ? {
              ...item,
              libraryId: null,
              search: item.name,
              packPrice: "",
              packQuantity: "",
              packUnit: item.unit,
            }
          : item
      )
    );
  };

  const getFilteredLibrary = (
    search: string
  ) => {
    const keyword =
      search.trim().toLowerCase();

    if (!keyword) {
      return library.slice(0, 10);
    }

    return library
      .filter((item) => {
        const nameText =
          item.name.toLowerCase();

        const brandText = (
          item.brand || ""
        ).toLowerCase();

        return (
          nameText.includes(keyword) ||
          brandText.includes(keyword)
        );
      })
      .slice(0, 10);
  };

  const estimatedTotalCost = useMemo(() => {
    return ingredients.reduce(
      (sum, item) => {
        const usedQuantity = Number(
          item.quantity || 0
        );

        const packPrice = Number(
          item.packPrice || 0
        );

        const packQuantity = Number(
          item.packQuantity || 0
        );

        if (
          usedQuantity <= 0 ||
          packPrice <= 0 ||
          packQuantity <= 0
        ) {
          return sum;
        }

        const convertedUsedQuantity =
          convertQuantity(
            usedQuantity,
            item.unit,
            item.packUnit
          );

        if (
          convertedUsedQuantity === null
        ) {
          return sum;
        }

        return (
          sum +
          (packPrice / packQuantity) *
            convertedUsedQuantity
        );
      },
      0
    );
  }, [ingredients]);

  const recipeLimitReached =
    permissions.recipeLimit !== null &&
    recipeCount >= permissions.recipeLimit;

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

    if (
      permissions.recipeLimit !== null
    ) {
      const {
        count:
          latestRecipeCount,
        error:
          recipeCountError,
      } = await supabase
        .from("recipes")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("user_id", user.id);

      if (recipeCountError) {
        setMessage(
          "ตรวจสอบจำนวนสูตรไม่สำเร็จ: " +
            recipeCountError.message
        );

        setSaving(false);
        return;
      }

      if (
        (latestRecipeCount || 0) >=
        permissions.recipeLimit
      ) {
        setRecipeCount(
          latestRecipeCount || 0
        );

        setMessage(
          `แพ็กเกจ Free บันทึกได้สูงสุด ${permissions.recipeLimit} สูตร`
        );

        setSaving(false);
        return;
      }
    }

    if (!name.trim()) {
      setMessage("กรุณากรอกชื่อสูตร");
      setSaving(false);
      return;
    }

    const validIngredients =
      ingredients.filter(
        (item) =>
          item.name.trim() &&
          Number(item.quantity || 0) > 0
      );

    if (validIngredients.length === 0) {
      setMessage(
        "กรุณาเพิ่มวัตถุดิบอย่างน้อย 1 รายการ"
      );

      setSaving(false);
      return;
    }

    const {
      data: recipe,
      error: recipeError,
    } = await supabase
      .from("recipes")
      .insert({
        user_id: user.id,
        name: name.trim(),
        category:
          category.trim() || null,
        yield_amount: yieldAmount
          ? Number(yieldAmount)
          : null,
        yield_unit: yieldUnit,
        servings: servings
          ? Number(servings)
          : null,
        notes:
          notes.trim() || null,
      })
      .select()
      .single();

    if (recipeError || !recipe) {
      setMessage(
        recipeError?.message ||
          "ไม่สามารถบันทึกสูตรได้"
      );

      setSaving(false);
      return;
    }

    const ingredientRows =
      validIngredients.map((item) => ({
        recipe_id: recipe.id,

        ingredient_id:
          item.libraryId,

        ingredient_name:
          item.name.trim(),

        quantity: Number(
          item.quantity || 0
        ),

        unit: item.unit,

        pack_price: Number(
          item.packPrice || 0
        ),

        pack_quantity: Number(
          item.packQuantity || 0
        ),

        pack_unit:
          item.packUnit ||
          item.unit,
      }));

    const { error: ingredientError } =
      await supabase
        .from("recipe_ingredients")
        .insert(ingredientRows);

    if (ingredientError) {
      await supabase
        .from("recipes")
        .delete()
        .eq("id", recipe.id);

      setMessage(
        "บันทึกวัตถุดิบไม่สำเร็จ: " +
          ingredientError.message
      );

      setSaving(false);
      return;
    }

    // สูตรถูกบันทึกสำเร็จแล้ว
    // ลบข้อมูลพักจาก Calculator
    sessionStorage.removeItem(
      "chefair_recipe_transfer"
    );

    sessionStorage.removeItem(
      "chefair_after_login_redirect"
    );

    router.push(
      `/recipes/${recipe.id}`
    );

    router.refresh();
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-slate-800">
            เพิ่มสูตรใหม่
          </h1>

          <p className="text-sm text-slate-500 mt-1">
            เลือกวัตถุดิบจากคลัง
            แล้วกรอกเฉพาะปริมาณที่ใช้ในสูตร
          </p>
        </div>

        {!subscriptionLoading &&
          !loadingRecipeLimit &&
          permissions.recipeLimit !== null && (
          <div
            className={`mb-6 rounded-2xl border px-5 py-4 ${
              recipeLimitReached
                ? "bg-amber-50 border-amber-200"
                : "bg-white border-slate-200"
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-slate-800">
                  สูตรที่บันทึกไว้ {recipeCount} / {permissions.recipeLimit}
                </p>

                <p className="text-xs text-slate-500 mt-1">
                  แพ็กเกจ Free บันทึกสูตรได้สูงสุด {permissions.recipeLimit} สูตร
                </p>
              </div>

              {recipeLimitReached && (
                <button
                  type="button"
                  onClick={() =>
                    router.push("/pricing")
                  }
                  className="inline-flex items-center justify-center bg-amber-500 hover:bg-amber-600 text-white font-bold px-4 py-2.5 rounded-xl text-sm"
                >
                  ดูแพ็กเกจ Pro
                </button>
              )}
            </div>
          </div>
        )}

        {/* แจ้งเตือนเมื่อมาจาก Recipe Calculator */}

        {importedFromCalculator && (
          <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 shrink-0 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold">
                ✓
              </div>

              <div>
                <p className="text-sm font-bold text-emerald-800">
                  นำสูตรจากเครื่องคำนวณมาให้แล้ว
                </p>

                <p className="text-xs text-emerald-700 mt-1">
                  วัตถุดิบและปริมาณด้านล่าง
                  เป็นค่าที่คำนวณใหม่แล้ว
                  สามารถตรวจสอบ แก้ไข
                  และเชื่อมกับคลังวัตถุดิบก่อนบันทึกได้
                </p>

                {calculationDescription && (
                  <p className="text-xs font-semibold text-emerald-700 mt-2">
                    {calculationDescription}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

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
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                  required
                  autoFocus={
                    importedFromCalculator
                  }
                  placeholder="เช่น น้ำจิ้มซีฟู้ด"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  หมวดหมู่
                </label>

                <input
                  value={category}
                  onChange={(e) =>
                    setCategory(
                      e.target.value
                    )
                  }
                  placeholder="เช่น น้ำจิ้ม / เบเกอรี่ / อาหาร"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-amber-500"
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
                      setYieldAmount(
                        e.target.value
                      )
                    }
                    placeholder="1000"
                    className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-amber-500"
                  />

                  <select
                    value={yieldUnit}
                    onChange={(e) =>
                      setYieldUnit(
                        e.target.value
                      )
                    }
                    className="px-3 border border-slate-200 rounded-xl text-sm bg-white"
                  >
                    <option value="g">
                      กรัม
                    </option>

                    <option value="kg">
                      กิโลกรัม
                    </option>

                    <option value="ml">
                      มิลลิลิตร
                    </option>

                    <option value="l">
                      ลิตร
                    </option>

                    <option value="piece">
                      ชิ้น
                    </option>
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
                    setServings(
                      e.target.value
                    )
                  }
                  placeholder="เช่น 20"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-amber-500"
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
                placeholder="รายละเอียดเพิ่มเติมของสูตร"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-amber-500"
              />
            </div>
          </section>

          {/* วัตถุดิบ */}

          <section className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
              <div>
                <h2 className="font-bold text-slate-800">
                  วัตถุดิบในสูตร
                </h2>

                <p className="text-xs text-slate-400 mt-1">
                  ค้นหาจากคลังวัตถุดิบ
                  หรือพิมพ์รายการใหม่ได้
                </p>
              </div>

              <button
                type="button"
                onClick={addIngredient}
                className="text-sm font-bold text-amber-600 hover:text-amber-700"
              >
                + เพิ่มวัตถุดิบ
              </button>
            </div>

            {loadingLibrary && (
              <div className="bg-slate-50 rounded-xl px-4 py-3 text-sm text-slate-500 mb-4">
                กำลังโหลดคลังวัตถุดิบ...
              </div>
            )}

            <div className="space-y-4">
              {ingredients.map(
                (item, index) => {
                  const filteredLibrary =
                    getFilteredLibrary(
                      item.search
                    );

                  const usedQuantity =
                    Number(
                      item.quantity || 0
                    );

                  const packPrice =
                    Number(
                      item.packPrice || 0
                    );

                  const packQuantity =
                    Number(
                      item.packQuantity ||
                        0
                    );

                  const convertedUsedQuantity =
                    usedQuantity > 0
                      ? convertQuantity(
                          usedQuantity,
                          item.unit,
                          item.packUnit
                        )
                      : null;

                  const estimatedCost =
                    convertedUsedQuantity !==
                      null &&
                    packPrice > 0 &&
                    packQuantity > 0
                      ? (packPrice /
                          packQuantity) *
                        convertedUsedQuantity
                      : 0;

                  const unitCanConvert =
                    item.unit ===
                      item.packUnit ||
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
                        {/* วัตถุดิบ */}

                        <div className="md:col-span-5 relative">
                          <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                            วัตถุดิบ
                          </label>

                          <input
                            value={
                              item.search
                            }
                            onFocus={() =>
                              setOpenLibraryIndex(
                                index
                              )
                            }
                            onChange={(
                              e
                            ) => {
                              const value =
                                e.target
                                  .value;

                              setOpenLibraryIndex(
                                index
                              );

                              setIngredients(
                                ingredients.map(
                                  (
                                    row,
                                    i
                                  ) =>
                                    i ===
                                    index
                                      ? {
                                          ...row,
                                          search:
                                            value,
                                          name: value,
                                          libraryId:
                                            null,
                                          packPrice:
                                            "",
                                          packQuantity:
                                            "",
                                          packUnit:
                                            row.unit,
                                        }
                                      : row
                                )
                              );
                            }}
                            placeholder="ค้นหา เช่น มายองเนส"
                            className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-amber-500"
                          />

                          {openLibraryIndex ===
                            index &&
                            filteredLibrary.length >
                              0 && (
                              <div className="absolute z-30 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-64 overflow-y-auto">
                                {filteredLibrary.map(
                                  (
                                    libraryItem
                                  ) => (
                                    <button
                                      key={
                                        libraryItem.id
                                      }
                                      type="button"
                                      onMouseDown={(
                                        e
                                      ) => {
                                        e.preventDefault();

                                        selectLibraryIngredient(
                                          index,
                                          libraryItem
                                        );
                                      }}
                                      className="w-full text-left px-4 py-3 hover:bg-amber-50 border-b border-slate-100 last:border-b-0"
                                    >
                                      <div className="font-semibold text-sm text-slate-700">
                                        {
                                          libraryItem.name
                                        }
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
                                        ).toFixed(
                                          2
                                        )}{" "}
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
                                ✓
                                เชื่อมกับคลังวัตถุดิบ
                              </span>

                              <button
                                type="button"
                                onClick={() =>
                                  clearLibrarySelection(
                                    index
                                  )
                                }
                                className="text-xs text-slate-400 hover:text-slate-600"
                              >
                                ยกเลิกการเลือก
                              </button>
                            </div>
                          )}
                        </div>

                        {/* ปริมาณ */}

                        <div className="md:col-span-2">
                          <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                            ปริมาณใช้
                          </label>

                          <input
                            type="number"
                            min="0"
                            step="0.001"
                            value={
                              item.quantity
                            }
                            onChange={(
                              e
                            ) =>
                              updateIngredient(
                                index,
                                "quantity",
                                e.target
                                  .value
                              )
                            }
                            placeholder="300"
                            className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-amber-500"
                          />
                        </div>

                        {/* หน่วย */}

                        <div className="md:col-span-2">
                          <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                            หน่วย
                          </label>

                          <select
                            value={item.unit}
                            onChange={(
                              e
                            ) =>
                              updateIngredient(
                                index,
                                "unit",
                                e.target
                                  .value
                              )
                            }
                            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white"
                          >
                            <option value="g">
                              g
                            </option>

                            <option value="kg">
                              kg
                            </option>

                            <option value="ml">
                              ml
                            </option>

                            <option value="l">
                              L
                            </option>

                            <option value="piece">
                              ชิ้น
                            </option>

                            <option value="pack">
                              แพ็ก
                            </option>

                            <option value="bottle">
                              ขวด
                            </option>

                            <option value="bag">
                              ถุง
                            </option>

                            <option value="box">
                              กล่อง
                            </option>

                            <option value="tsp">
                              ช้อนชา
                            </option>

                            <option value="tbsp">
                              ช้อนโต๊ะ
                            </option>

                            <option value="cup">
                              ถ้วย
                            </option>
                          </select>
                        </div>

                        {/* Cost */}

                        <div className="md:col-span-2">
                          <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                            ต้นทุนที่ใช้
                          </label>

                          <div className="h-[42px] px-3 flex items-center justify-end bg-slate-50 rounded-xl text-sm font-bold text-slate-700">
                            {unitCanConvert
                              ? `${estimatedCost.toFixed(
                                  2
                                )} บาท`
                              : "-"}
                          </div>
                        </div>

                        {/* Delete */}

                        <div className="md:col-span-1">
                          <button
                            type="button"
                            onClick={() =>
                              removeIngredient(
                                index
                              )
                            }
                            className="w-full h-[42px] rounded-xl border border-red-100 text-red-500 text-xs font-bold hover:bg-red-50"
                          >
                            ลบ
                          </button>
                        </div>
                      </div>

                      {/* Pack info */}

                      <div className="mt-3 bg-slate-50 rounded-xl px-4 py-3">
                        <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs">
                          <div>
                            <span className="text-slate-400">
                              ขนาดแพ็ก:
                            </span>{" "}
                            <span className="font-semibold text-slate-600">
                              {item.packQuantity ||
                                "-"}{" "}
                              {item.packUnit}
                            </span>
                          </div>

                          <div>
                            <span className="text-slate-400">
                              ราคาแพ็ก:
                            </span>{" "}
                            <span className="font-semibold text-slate-600">
                              {item.packPrice
                                ? `${Number(
                                    item.packPrice
                                  ).toFixed(
                                    2
                                  )} บาท`
                                : "-"}
                            </span>
                          </div>

                          {item.unit !==
                            item.packUnit && (
                            <>
                              {unitCanConvert ? (
                                <div className="text-green-600 font-semibold">
                                  ✓
                                  ระบบแปลงหน่วยให้อัตโนมัติ
                                </div>
                              ) : (
                                <div className="text-amber-600 font-semibold">
                                  ⚠
                                  ไม่สามารถแปลงหน่วยนี้อัตโนมัติ
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }
              )}
            </div>

            {/* Total Cost */}

            <div className="mt-5 bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-center justify-between gap-4">
              <span className="text-sm font-semibold text-slate-700">
                ต้นทุนวัตถุดิบโดยประมาณ
              </span>

              <span className="text-xl font-extrabold text-amber-600">
                {estimatedTotalCost.toFixed(
                  2
                )}{" "}
                บาท
              </span>
            </div>
          </section>

          {/* Message */}

          {message && (
            <div className="bg-red-50 text-red-600 border border-red-100 rounded-xl px-4 py-3 text-sm">
              {message}
            </div>
          )}

          {/* Actions */}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() =>
                router.push("/recipes")
              }
              className="flex-1 border border-slate-200 bg-white text-slate-700 font-bold py-3 rounded-xl"
            >
              ยกเลิก
            </button>

            <button
              type="submit"
              disabled={
                saving ||
                subscriptionLoading ||
                loadingRecipeLimit ||
                recipeLimitReached
              }
              className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition"
            >
              {saving
                ? "กำลังบันทึก..."
                : recipeLimitReached
                ? "ถึงจำนวนสูตรสูงสุดแล้ว"
                : "บันทึกสูตร"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}