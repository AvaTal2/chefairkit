"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { useSubscription } from "@/hooks/useSubscription";

type IngredientItem = {
  id: string;
  user_id: string;
  name: string;
  brand: string | null;

  pack_quantity: number;
  pack_unit: string;
  pack_price: number;

  category: string | null;
  notes: string | null;

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

  created_at: string;
  updated_at: string;
};

type FormState = {
  name: string;
  brand: string;

  packQuantity: string;
  packUnit: string;
  packPrice: string;

  category: string;
  notes: string;

  nutritionBasisQuantity: string;
  nutritionBasisUnit: string;

  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  sugar: string;
  fiber: string;
  sodium: string;

  nutritionSource: string;
  nutritionVerified: boolean;
};

const EMPTY_FORM: FormState = {
  name: "",
  brand: "",

  packQuantity: "",
  packUnit: "g",
  packPrice: "",

  category: "",
  notes: "",

  nutritionBasisQuantity: "100",
  nutritionBasisUnit: "g",

  calories: "",
  protein: "",
  carbs: "",
  fat: "",
  sugar: "",
  fiber: "",
  sodium: "",

  nutritionSource: "",
  nutritionVerified: false,
};

export default function IngredientsPage() {
  const router = useRouter();

  const {
    loading: subscriptionLoading,
    permissions,
  } = useSubscription();

  const [ingredients, setIngredients] = useState<IngredientItem[]>([]);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingOriginal, setEditingOriginal] =
    useState<IngredientItem | null>(null);

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<
    "success" | "error" | ""
  >("");

  useEffect(() => {
    loadIngredients();
  }, []);

  const loadIngredients = async () => {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { data, error } = await supabase
      .from("ingredients")
      .select("*")
      .eq("user_id", user.id)
      .order("name", { ascending: true });

    if (error) {
      setMessage(
        "โหลดคลังวัตถุดิบไม่สำเร็จ: " + error.message
      );
      setMessageType("error");
      setLoading(false);
      return;
    }

    setIngredients(data || []);
    setLoading(false);
  };

  const ingredientLimit =
    permissions.isFree
      ? 30
      : null;

  const ingredientLimitReached =
    ingredientLimit !== null &&
    ingredients.length >= ingredientLimit;

  const filteredIngredients = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return ingredients;

    return ingredients.filter((item) => {
      return (
        item.name.toLowerCase().includes(keyword) ||
        (item.brand || "").toLowerCase().includes(keyword) ||
        (item.category || "").toLowerCase().includes(keyword)
      );
    });
  }, [ingredients, search]);

  const updateForm = (
    field: keyof FormState,
    value: string | boolean
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setEditingOriginal(null);
  };

  const handleEdit = (item: IngredientItem) => {
    setEditingId(item.id);
    setEditingOriginal(item);

    setForm({
      name: item.name || "",
      brand: item.brand || "",

      packQuantity: String(item.pack_quantity ?? ""),
      packUnit: item.pack_unit || "g",
      packPrice: String(item.pack_price ?? ""),

      category: item.category || "",
      notes: item.notes || "",

      nutritionBasisQuantity: String(
        item.nutrition_basis_quantity ?? 100
      ),
      nutritionBasisUnit:
        item.nutrition_basis_unit || "g",

      calories: String(item.calories_kcal ?? ""),
      protein: String(item.protein_g ?? ""),
      carbs: String(item.carbs_g ?? ""),
      fat: String(item.fat_g ?? ""),
      sugar: String(item.sugar_g ?? ""),
      fiber: String(item.fiber_g ?? ""),
      sodium: String(item.sodium_mg ?? ""),

      nutritionSource: item.nutrition_source || "",
      nutritionVerified:
        item.nutrition_verified || false,
    });

    setMessage("");
    setMessageType("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const syncIngredientToRecipes = async (
    ingredientId: string,
    payload: {
      name: string;
      pack_quantity: number;
      pack_unit: string;
      pack_price: number;
    }
  ) => {
    const { error } = await supabase
      .from("recipe_ingredients")
      .update({
        ingredient_name: payload.name,
        pack_quantity: payload.pack_quantity,
        pack_unit: payload.pack_unit,
        pack_price: payload.pack_price,
      })
      .eq("ingredient_id", ingredientId);

    return error;
  };

  const handleSave = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setSaving(true);
    setMessage("");
    setMessageType("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    if (
      !editingId &&
      ingredientLimit !== null
    ) {
      const {
        count: latestIngredientCount,
        error: ingredientCountError,
      } = await supabase
        .from("ingredients")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("user_id", user.id);

      if (ingredientCountError) {
        setMessage(
          "ตรวจสอบจำนวนวัตถุดิบไม่สำเร็จ: " +
            ingredientCountError.message
        );

        setMessageType("error");
        setSaving(false);
        return;
      }

      if (
        (latestIngredientCount || 0) >=
        ingredientLimit
      ) {
        setMessage(
          `แพ็กเกจ Free เพิ่มวัตถุดิบได้สูงสุด ${ingredientLimit} รายการ`
        );

        setMessageType("error");
        setSaving(false);
        return;
      }
    }

    const name = form.name.trim();

    const packQuantity = Number(
      form.packQuantity || 0
    );

    const packPrice = Number(
      form.packPrice || 0
    );

    const nutritionBasisQuantity = Number(
      form.nutritionBasisQuantity || 100
    );

    if (!name) {
      setMessage("กรุณากรอกชื่อวัตถุดิบ");
      setMessageType("error");
      setSaving(false);
      return;
    }

    if (
      packQuantity < 0 ||
      packPrice < 0 ||
      nutritionBasisQuantity <= 0
    ) {
      setMessage(
        "ขนาดแพ็ก ราคา และฐานโภชนาการต้องเป็นค่าที่ถูกต้อง"
      );
      setMessageType("error");
      setSaving(false);
      return;
    }

    const payload = {
      user_id: user.id,

      name,

      brand:
        form.brand.trim() || null,

      pack_quantity:
        packQuantity,

      pack_unit:
        form.packUnit,

      pack_price:
        packPrice,

      category:
        form.category.trim() || null,

      notes:
        form.notes.trim() || null,

      nutrition_basis_quantity:
        nutritionBasisQuantity,

      nutrition_basis_unit:
        form.nutritionBasisUnit,

      calories_kcal:
        Number(form.calories || 0),

      protein_g:
        Number(form.protein || 0),

      carbs_g:
        Number(form.carbs || 0),

      fat_g:
        Number(form.fat || 0),

      sugar_g:
        Number(form.sugar || 0),

      fiber_g:
        Number(form.fiber || 0),

      sodium_mg:
        Number(form.sodium || 0),

      nutrition_source:
        form.nutritionSource.trim() || null,

      nutrition_verified:
        form.nutritionVerified,
    };

    if (editingId) {
      const priceChanged =
        editingOriginal &&
        (
          Number(editingOriginal.pack_price) !==
            packPrice ||
          Number(
            editingOriginal.pack_quantity
          ) !== packQuantity ||
          editingOriginal.pack_unit !==
            form.packUnit ||
          editingOriginal.name !== name
        );

      const { error } = await supabase
        .from("ingredients")
        .update(payload)
        .eq("id", editingId);

      if (error) {
        setMessage(
          "แก้ไขวัตถุดิบไม่สำเร็จ: " +
            error.message
        );
        setMessageType("error");
        setSaving(false);
        return;
      }

      let synced = false;

      if (priceChanged) {
        const {
          count,
          error: countError,
        } = await supabase
          .from("recipe_ingredients")
          .select("id", {
            count: "exact",
            head: true,
          })
          .eq(
            "ingredient_id",
            editingId
          );

        if (
          !countError &&
          count &&
          count > 0
        ) {
          const shouldSync =
            window.confirm(
              `วัตถุดิบ "${name}" ถูกใช้ใน ${count} สูตร\n\n` +
                `ต้องการอัปเดตราคาและขนาดแพ็กใหม่ไปยังสูตรที่เชื่อมทั้งหมดหรือไม่?\n\n` +
                `กด OK = อัปเดตทุกสูตร\n` +
                `กด Cancel = เก็บราคาเดิมในสูตรไว้`
            );

          if (shouldSync) {
            const syncError =
              await syncIngredientToRecipes(
                editingId,
                {
                  name,
                  pack_quantity:
                    packQuantity,
                  pack_unit:
                    form.packUnit,
                  pack_price:
                    packPrice,
                }
              );

            if (syncError) {
              setMessage(
                "แก้ไขวัตถุดิบแล้ว แต่ Sync สูตรไม่สำเร็จ: " +
                  syncError.message
              );

              setMessageType(
                "error"
              );

              setSaving(false);
              return;
            }

            synced = true;
          }
        }
      }

      resetForm();

      await loadIngredients();

      setMessage(
        synced
          ? "แก้ไขวัตถุดิบและอัปเดตราคาในสูตรที่เชื่อมเรียบร้อยแล้ว"
          : "แก้ไขวัตถุดิบเรียบร้อยแล้ว"
      );

      setMessageType("success");
      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from("ingredients")
      .insert(payload);

    if (error) {
      setMessage(
        "เพิ่มวัตถุดิบไม่สำเร็จ: " +
          error.message
      );

      setMessageType("error");
      setSaving(false);
      return;
    }

    resetForm();

    await loadIngredients();

    setMessage(
      "เพิ่มวัตถุดิบเข้าคลังเรียบร้อยแล้ว"
    );

    setMessageType("success");
    setSaving(false);
  };

  const handleDelete = async (
    item: IngredientItem
  ) => {
    const confirmed =
      window.confirm(
        `ต้องการลบ "${item.name}" ออกจากคลังวัตถุดิบใช่หรือไม่?\n\n` +
          `สูตรเดิมจะไม่ถูกลบ แต่จะเลิกเชื่อมกับวัตถุดิบรายการนี้`
      );

    if (!confirmed) return;

    const { error } = await supabase
      .from("ingredients")
      .delete()
      .eq("id", item.id);

    if (error) {
      setMessage(
        "ลบวัตถุดิบไม่สำเร็จ: " +
          error.message
      );

      setMessageType("error");
      return;
    }

    if (editingId === item.id) {
      resetForm();
    }

    await loadIngredients();

    setMessage(
      `ลบ "${item.name}" เรียบร้อยแล้ว`
    );

    setMessageType("success");
  };

  const calculateUnitCost = (
    item: IngredientItem
  ) => {
    const qty = Number(
      item.pack_quantity || 0
    );

    const price = Number(
      item.pack_price || 0
    );

    if (
      qty <= 0 ||
      price <= 0
    ) {
      return 0;
    }

    return price / qty;
  };

  const formatNumber = (
    value: number
  ) => {
    return Number(
      value || 0
    ).toLocaleString(
      "th-TH",
      {
        maximumFractionDigits: 3,
      }
    );
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="max-w-7xl mx-auto">

        {/* HEADER */}

        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800">
              คลังวัตถุดิบของฉัน
            </h1>

            <p className="text-sm text-slate-500 mt-1">
              เก็บราคา ขนาดแพ็ก และข้อมูลโภชนาการไว้ใช้กับทุกสูตร
            </p>
          </div>

          <div className="text-sm text-slate-500">
            ทั้งหมด{" "}
            <span className="font-bold text-slate-800">
              {ingredients.length}
            </span>{" "}
            รายการ
          </div>
        </div>

        {!subscriptionLoading &&
          ingredientLimit !== null && (
          <div
            className={`mb-5 rounded-2xl border px-5 py-4 ${
              ingredientLimitReached
                ? "bg-amber-50 border-amber-200"
                : "bg-white border-slate-200"
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-slate-800">
                  วัตถุดิบที่บันทึกไว้ {ingredients.length} / {ingredientLimit}
                </p>

                <p className="text-xs text-slate-500 mt-1">
                  แพ็กเกจ Free เพิ่มวัตถุดิบได้สูงสุด {ingredientLimit} รายการ
                </p>
              </div>

              {ingredientLimitReached && (
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

        {/* MESSAGE */}

        {message && (
          <div
            className={`mb-5 rounded-xl px-4 py-3 text-sm border ${
              messageType === "success"
                ? "bg-green-50 border-green-100 text-green-700"
                : "bg-red-50 border-red-100 text-red-600"
            }`}
          >
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* =====================================================
              FORM
          ===================================================== */}

          <section className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <div className="flex items-start justify-between gap-3 mb-6">
              <div>
                <h2 className="font-bold text-slate-800">
                  {editingId
                    ? "แก้ไขวัตถุดิบ"
                    : "เพิ่มวัตถุดิบ"}
                </h2>

                <p className="text-xs text-slate-400 mt-1">
                  {!editingId &&
                  ingredientLimitReached
                    ? "ถึงจำนวนวัตถุดิบสูงสุดของแพ็กเกจ Free แล้ว"
                    : "ข้อมูลต้นทุนและโภชนาการของวัตถุดิบ"}
                </p>
              </div>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-xs font-bold text-slate-500"
                >
                  ยกเลิก
                </button>
              )}
            </div>

            <form
              onSubmit={handleSave}
              className="space-y-6"
            >

              {/* BASIC */}

              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-800">
                  ข้อมูลวัตถุดิบ
                </h3>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    ชื่อวัตถุดิบ
                  </label>

                  <input
                    value={form.name}
                    onChange={(e) =>
                      updateForm(
                        "name",
                        e.target.value
                      )
                    }
                    required
                    placeholder="เช่น มายองเนส"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    ยี่ห้อ / แบรนด์
                  </label>

                  <input
                    value={form.brand}
                    onChange={(e) =>
                      updateForm(
                        "brand",
                        e.target.value
                      )
                    }
                    placeholder="เช่น ARO"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      ขนาดแพ็ก
                    </label>

                    <input
                      type="number"
                      min="0"
                      step="0.001"
                      value={
                        form.packQuantity
                      }
                      onChange={(e) =>
                        updateForm(
                          "packQuantity",
                          e.target.value
                        )
                      }
                      placeholder="1000"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      หน่วย
                    </label>

                    <select
                      value={
                        form.packUnit
                      }
                      onChange={(e) =>
                        updateForm(
                          "packUnit",
                          e.target.value
                        )
                      }
                      className="w-full px-3 py-3 rounded-xl border border-slate-200 text-sm bg-white"
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
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    ราคาซื้อ
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      form.packPrice
                    }
                    onChange={(e) =>
                      updateForm(
                        "packPrice",
                        e.target.value
                      )
                    }
                    placeholder="120"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    หมวดหมู่
                  </label>

                  <input
                    value={
                      form.category
                    }
                    onChange={(e) =>
                      updateForm(
                        "category",
                        e.target.value
                      )
                    }
                    placeholder="ซอส / เนื้อสัตว์ / เครื่องปรุง"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
              </div>

              {/* NUTRITION */}

              <div className="border-t border-slate-100 pt-6 space-y-4">
                <div>
                  <h3 className="font-bold text-slate-800">
                    ข้อมูลโภชนาการ
                  </h3>

                  <p className="text-xs text-slate-400 mt-1">
                    ใช้ข้อมูลจากฉลากสินค้า หรือฐานข้อมูลโภชนาการที่เชื่อถือได้
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      ค่าต่อ
                    </label>

                    <input
                      type="number"
                      min="0.001"
                      step="0.001"
                      value={
                        form.nutritionBasisQuantity
                      }
                      onChange={(e) =>
                        updateForm(
                          "nutritionBasisQuantity",
                          e.target.value
                        )
                      }
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      หน่วย
                    </label>

                    <select
                      value={
                        form.nutritionBasisUnit
                      }
                      onChange={(e) =>
                        updateForm(
                          "nutritionBasisUnit",
                          e.target.value
                        )
                      }
                      className="w-full px-3 py-3 rounded-xl border border-slate-200 text-sm bg-white"
                    >
                      <option value="g">
                        g
                      </option>

                      <option value="ml">
                        ml
                      </option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <NutritionInput
                    label="พลังงาน"
                    unit="kcal"
                    value={form.calories}
                    onChange={(value) =>
                      updateForm(
                        "calories",
                        value
                      )
                    }
                  />

                  <NutritionInput
                    label="โปรตีน"
                    unit="g"
                    value={form.protein}
                    onChange={(value) =>
                      updateForm(
                        "protein",
                        value
                      )
                    }
                  />

                  <NutritionInput
                    label="คาร์โบไฮเดรต"
                    unit="g"
                    value={form.carbs}
                    onChange={(value) =>
                      updateForm(
                        "carbs",
                        value
                      )
                    }
                  />

                  <NutritionInput
                    label="ไขมัน"
                    unit="g"
                    value={form.fat}
                    onChange={(value) =>
                      updateForm(
                        "fat",
                        value
                      )
                    }
                  />

                  <NutritionInput
                    label="น้ำตาล"
                    unit="g"
                    value={form.sugar}
                    onChange={(value) =>
                      updateForm(
                        "sugar",
                        value
                      )
                    }
                  />

                  <NutritionInput
                    label="ใยอาหาร"
                    unit="g"
                    value={form.fiber}
                    onChange={(value) =>
                      updateForm(
                        "fiber",
                        value
                      )
                    }
                  />

                  <NutritionInput
                    label="โซเดียม"
                    unit="mg"
                    value={form.sodium}
                    onChange={(value) =>
                      updateForm(
                        "sodium",
                        value
                      )
                    }
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    แหล่งข้อมูล
                  </label>

                  <select
                    value={
                      form.nutritionSource
                    }
                    onChange={(e) =>
                      updateForm(
                        "nutritionSource",
                        e.target.value
                      )
                    }
                    className="w-full px-3 py-3 rounded-xl border border-slate-200 text-sm bg-white"
                  >
                    <option value="">
                      เลือกแหล่งข้อมูล
                    </option>

                    <option value="product_label">
                      ฉลากสินค้า
                    </option>

                    <option value="thai_food_composition">
                      Thai Food Composition
                    </option>

                    <option value="usda">
                      USDA
                    </option>

                    <option value="manual">
                      กรอกเอง
                    </option>

                    <option value="ai_assisted">
                      AI ช่วยค้นหา
                    </option>
                  </select>
                </div>

                <label className="flex items-center gap-3 bg-green-50 border border-green-100 rounded-xl p-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={
                      form.nutritionVerified
                    }
                    onChange={(e) =>
                      updateForm(
                        "nutritionVerified",
                        e.target.checked
                      )
                    }
                  />

                  <span className="text-sm font-semibold text-green-700">
                    ตรวจสอบข้อมูลโภชนาการแล้ว
                  </span>
                </label>
              </div>

              {/* NOTES */}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  หมายเหตุ
                </label>

                <textarea
                  value={form.notes}
                  onChange={(e) =>
                    updateForm(
                      "notes",
                      e.target.value
                    )
                  }
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={
                  saving ||
                  subscriptionLoading ||
                  (!editingId &&
                    ingredientLimitReached)
                }
                className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white font-bold py-3 rounded-xl"
              >
                {saving
                  ? "กำลังบันทึก..."
                  : editingId
                    ? "บันทึกการแก้ไข"
                    : ingredientLimitReached
                      ? "ถึงจำนวนวัตถุดิบสูงสุดแล้ว"
                      : "เพิ่มเข้าคลัง"}
              </button>
            </form>
          </section>

          {/* =====================================================
              TABLE
          ===================================================== */}

          <section className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">

            <div className="p-6 border-b border-slate-100">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h2 className="font-bold text-slate-800">
                    วัตถุดิบที่บันทึกไว้
                  </h2>

                  <p className="text-xs text-slate-400 mt-1">
                    แสดงต้นทุนและโภชนาการแบบย่อ
                  </p>
                </div>

                <input
                  value={search}
                  onChange={(e) =>
                    setSearch(
                      e.target.value
                    )
                  }
                  placeholder="ค้นหา..."
                  className="w-full md:w-64 px-4 py-2.5 rounded-xl border border-slate-200 text-sm"
                />
              </div>
            </div>

            {loading ? (
              <div className="p-10 text-center text-slate-500">
                กำลังโหลด...
              </div>
            ) : filteredIngredients.length === 0 ? (
              <div className="p-10 text-center">
                ยังไม่มีวัตถุดิบ
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredIngredients.map(
                  (item) => {
                    const unitCost =
                      calculateUnitCost(
                        item
                      );

                    return (
                      <div
                        key={item.id}
                        className="p-5 hover:bg-slate-50"
                      >
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">

                          <div>
                            <Link
                              href={`/ingredients/${item.id}`}
                              className="font-bold text-slate-800 hover:text-amber-600"
                            >
                              {item.name}
                            </Link>

                            <div className="text-xs text-slate-400 mt-1">
                              {item.brand || "ไม่ระบุแบรนด์"}

                              {" • "}

                              {formatNumber(
                                item.pack_quantity
                              )}{" "}
                              {item.pack_unit}

                              {" • "}

                              {Number(
                                item.pack_price
                              ).toFixed(
                                2
                              )}{" "}
                              บาท
                            </div>

                            <div className="mt-3 flex flex-wrap gap-2">
                              <NutritionBadge
                                text={`${Number(
                                  item.calories_kcal ||
                                    0
                                ).toFixed(
                                  0
                                )} kcal`}
                              />

                              <NutritionBadge
                                text={`P ${Number(
                                  item.protein_g ||
                                    0
                                ).toFixed(
                                  1
                                )} g`}
                              />

                              <NutritionBadge
                                text={`C ${Number(
                                  item.carbs_g ||
                                    0
                                ).toFixed(
                                  1
                                )} g`}
                              />

                              <NutritionBadge
                                text={`F ${Number(
                                  item.fat_g ||
                                    0
                                ).toFixed(
                                  1
                                )} g`}
                              />

                              {item.nutrition_verified && (
                                <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-lg font-semibold">
                                  ✓ ตรวจแล้ว
                                </span>
                              )}
                            </div>

                            <div className="text-xs text-slate-400 mt-2">
                              ต่อ{" "}
                              {item.nutrition_basis_quantity ||
                                100}{" "}
                              {item.nutrition_basis_unit ||
                                "g"}
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-sm font-bold text-slate-700">
                              {unitCost >
                              0
                                ? `${unitCost.toFixed(
                                    4
                                  )} บาท/${item.pack_unit}`
                                : "-"}
                            </div>

                            <div className="flex gap-2 mt-3">
                              <Link
                                href={`/ingredients/${item.id}`}
                                className="px-3 py-1.5 rounded-lg border border-amber-200 text-amber-600 text-xs font-bold"
                              >
                                รายละเอียด
                              </Link>

                              <button
                                type="button"
                                onClick={() =>
                                  handleEdit(
                                    item
                                  )
                                }
                                className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-bold"
                              >
                                แก้ไข
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  handleDelete(
                                    item
                                  )
                                }
                                className="px-3 py-1.5 rounded-lg border border-red-100 text-red-500 text-xs font-bold"
                              >
                                ลบ
                              </button>
                            </div>
                          </div>

                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            )}

          </section>

        </div>
      </div>
    </main>
  );
}

function NutritionInput({
  label,
  unit,
  value,
  onChange,
}: {
  label: string;
  unit: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1.5">
        {label}
      </label>

      <div className="relative">
        <input
          type="number"
          min="0"
          step="0.001"
          value={value}
          onChange={(e) =>
            onChange(
              e.target.value
            )
          }
          className="w-full px-3 py-2.5 pr-12 rounded-xl border border-slate-200 text-sm"
        />

        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
          {unit}
        </span>
      </div>
    </div>
  );
}

function NutritionBadge({
  text,
}: {
  text: string;
}) {
  return (
    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-lg">
      {text}
    </span>
  );
}