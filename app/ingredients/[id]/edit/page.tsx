"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Save,
  ArrowLeft,
  Scale,
  Package,
  BadgeDollarSign,
  Percent,
} from "lucide-react";

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

  prep_yield_percent: number | null;
  cooking_yield_percent: number | null;

  created_at: string;
  updated_at: string;
};

export default function EditIngredientPage() {
  const params = useParams();
  const router = useRouter();

  const ingredientId = params.id as string;

  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("");

  const [packQuantity, setPackQuantity] = useState("");
  const [packUnit, setPackUnit] = useState("g");
  const [packPrice, setPackPrice] = useState("");

  const [prepYieldPercent, setPrepYieldPercent] =
    useState("100");

  const [cookingYieldPercent, setCookingYieldPercent] =
    useState("100");

  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (ingredientId) {
      loadIngredient();
    }
  }, [ingredientId]);

  const loadIngredient = async () => {
    setLoading(true);
    setMessage("");

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
        `
        id,
        user_id,
        name,
        brand,
        pack_quantity,
        pack_unit,
        pack_price,
        category,
        notes,
        prep_yield_percent,
        cooking_yield_percent,
        created_at,
        updated_at
        `
      )
      .eq("id", ingredientId)
      .single();

    if (error || !data) {
      setMessage(
        "ไม่พบวัตถุดิบ หรือคุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้"
      );
      setLoading(false);
      return;
    }

    const ingredient = data as Ingredient;

    setName(ingredient.name || "");
    setBrand(ingredient.brand || "");
    setCategory(ingredient.category || "");

    setPackQuantity(
      ingredient.pack_quantity
        ? String(ingredient.pack_quantity)
        : ""
    );

    setPackUnit(ingredient.pack_unit || "g");

    setPackPrice(
      ingredient.pack_price
        ? String(ingredient.pack_price)
        : ""
    );

    setPrepYieldPercent(
      ingredient.prep_yield_percent
        ? String(ingredient.prep_yield_percent)
        : "100"
    );

    setCookingYieldPercent(
      ingredient.cooking_yield_percent
        ? String(ingredient.cooking_yield_percent)
        : "100"
    );

    setNotes(ingredient.notes || "");

    setLoading(false);
  };

  const prepYield = Number(prepYieldPercent || 0);
  const cookingYield = Number(cookingYieldPercent || 0);

  const prepLoss = useMemo(() => {
    if (prepYield <= 0 || prepYield > 100) return 0;

    return 100 - prepYield;
  }, [prepYield]);

  const cookingLoss = useMemo(() => {
    if (
      cookingYield <= 0 ||
      cookingYield > 100
    ) {
      return 0;
    }

    return 100 - cookingYield;
  }, [cookingYield]);

  const overallYield = useMemo(() => {
    if (
      prepYield <= 0 ||
      cookingYield <= 0
    ) {
      return 0;
    }

    return (
      (prepYield / 100) *
      (cookingYield / 100) *
      100
    );
  }, [prepYield, cookingYield]);

  const usableCostPerUnit = useMemo(() => {
    const quantity = Number(packQuantity || 0);
    const price = Number(packPrice || 0);

    if (
      quantity <= 0 ||
      price <= 0 ||
      overallYield <= 0
    ) {
      return 0;
    }

    const usableQuantity =
      quantity * (overallYield / 100);

    if (usableQuantity <= 0) {
      return 0;
    }

    return price / usableQuantity;
  }, [
    packQuantity,
    packPrice,
    overallYield,
  ]);

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

    const cleanName = name.trim();

    if (!cleanName) {
      setMessage("กรุณากรอกชื่อวัตถุดิบ");
      setSaving(false);
      return;
    }

    const quantity = Number(packQuantity);
    const price = Number(packPrice);

    if (quantity <= 0) {
      setMessage(
        "ขนาดแพ็กต้องมากกว่า 0"
      );
      setSaving(false);
      return;
    }

    if (price < 0) {
      setMessage(
        "ราคาวัตถุดิบต้องไม่ติดลบ"
      );
      setSaving(false);
      return;
    }

    if (
      prepYield <= 0 ||
      prepYield > 100
    ) {
      setMessage(
        "Prep Yield ต้องอยู่ระหว่าง 0.01 - 100%"
      );
      setSaving(false);
      return;
    }

    if (
      cookingYield <= 0 ||
      cookingYield > 100
    ) {
      setMessage(
        "Cooking Yield ต้องอยู่ระหว่าง 0.01 - 100%"
      );
      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from("ingredients")
      .update({
        name: cleanName,

        brand:
          brand.trim() || null,

        category:
          category.trim() || null,

        pack_quantity: quantity,
        pack_unit: packUnit,
        pack_price: price,

        prep_yield_percent:
          prepYield,

        cooking_yield_percent:
          cookingYield,

        notes:
          notes.trim() || null,

        updated_at:
          new Date().toISOString(),
      })
      .eq("id", ingredientId)
      .eq("user_id", user.id);

    if (error) {
      setMessage(
        "บันทึกข้อมูลไม่สำเร็จ: " +
          error.message
      );

      setSaving(false);
      return;
    }

    router.push(
      `/ingredients/${ingredientId}`
    );

    router.refresh();
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center text-slate-500">
            กำลังโหลดข้อมูลวัตถุดิบ...
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="max-w-4xl mx-auto">

        {/* HEADER */}

        <div className="mb-8">
          <button
            type="button"
            onClick={() =>
              router.push(
                `/ingredients/${ingredientId}`
              )
            }
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-amber-600 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            กลับรายละเอียดวัตถุดิบ
          </button>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 mt-3">
            แก้ไขวัตถุดิบ
          </h1>

          <p className="text-sm text-slate-500 mt-1">
            แก้ไขข้อมูลการซื้อ ราคา
            และค่า Yield สำหรับการผลิต
          </p>
        </div>

        <form
          onSubmit={handleSave}
          className="space-y-6"
        >

          {/* BASIC INFO */}

          <section className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="bg-amber-50 text-amber-600 p-2.5 rounded-xl">
                <Package className="w-5 h-5" />
              </div>

              <div>
                <h2 className="font-bold text-slate-800">
                  ข้อมูลวัตถุดิบ
                </h2>

                <p className="text-xs text-slate-400 mt-0.5">
                  ข้อมูลหลักและข้อมูลการซื้อ
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  ชื่อวัตถุดิบ
                </label>

                <input
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                  placeholder="เช่น อกไก่"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  แบรนด์
                </label>

                <input
                  value={brand}
                  onChange={(e) =>
                    setBrand(e.target.value)
                  }
                  placeholder="เช่น ARO"
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
                    setCategory(e.target.value)
                  }
                  placeholder="เช่น เนื้อสัตว์"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* PURCHASE DATA */}

            <div className="border-t border-slate-100 mt-6 pt-6">
              <div className="flex items-center gap-2 mb-4">
                <BadgeDollarSign className="w-5 h-5 text-amber-500" />

                <h3 className="font-bold text-slate-800">
                  ข้อมูลการซื้อ
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    ขนาดแพ็ก
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.001"
                    value={packQuantity}
                    onChange={(e) =>
                      setPackQuantity(
                        e.target.value
                      )
                    }
                    placeholder="1000"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    หน่วยแพ็ก
                  </label>

                  <select
                    value={packUnit}
                    onChange={(e) =>
                      setPackUnit(
                        e.target.value
                      )
                    }
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm bg-white"
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

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    ราคาแพ็ก
                  </label>

                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={packPrice}
                      onChange={(e) =>
                        setPackPrice(
                          e.target.value
                        )
                      }
                      placeholder="120"
                      className="w-full px-4 pr-12 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-amber-500"
                    />

                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                      บาท
                    </span>
                  </div>
                </div>

              </div>
            </div>
          </section>

          {/* YIELD */}

          <section className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="bg-emerald-50 text-emerald-600 p-2.5 rounded-xl">
                <Percent className="w-5 h-5" />
              </div>

              <div>
                <h2 className="font-bold text-slate-800">
                  Yield และการสูญเสีย
                </h2>

                <p className="text-xs text-slate-400 mt-0.5">
                  ใช้สำหรับคำนวณปริมาณซื้อและการผลิตจริง
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* PREP */}

              <div className="border border-slate-200 rounded-2xl p-5">
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Prep Yield %
                </label>

                <p className="text-xs text-slate-400 mb-3">
                  เปอร์เซ็นต์น้ำหนักที่เหลือหลังปอก
                  ตัดแต่ง เลาะกระดูก หรือเตรียมวัตถุดิบ
                </p>

                <div className="relative">
                  <input
                    type="number"
                    min="0.01"
                    max="100"
                    step="0.01"
                    value={
                      prepYieldPercent
                    }
                    onChange={(e) =>
                      setPrepYieldPercent(
                        e.target.value
                      )
                    }
                    className="w-full px-4 pr-10 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-amber-500"
                  />

                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                    %
                  </span>
                </div>

                <div className="mt-3 bg-slate-50 rounded-xl px-4 py-3 flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    Prep Loss
                  </span>

                  <span className="text-sm font-bold text-red-500">
                    {prepLoss.toFixed(2)}%
                  </span>
                </div>
              </div>

              {/* COOK */}

              <div className="border border-slate-200 rounded-2xl p-5">
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Cooking Yield %
                </label>

                <p className="text-xs text-slate-400 mb-3">
                  เปอร์เซ็นต์น้ำหนักที่เหลือหลังต้ม
                  ทอด ย่าง อบ หรือปรุงสุก
                </p>

                <div className="relative">
                  <input
                    type="number"
                    min="0.01"
                    max="100"
                    step="0.01"
                    value={
                      cookingYieldPercent
                    }
                    onChange={(e) =>
                      setCookingYieldPercent(
                        e.target.value
                      )
                    }
                    className="w-full px-4 pr-10 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-amber-500"
                  />

                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                    %
                  </span>
                </div>

                <div className="mt-3 bg-slate-50 rounded-xl px-4 py-3 flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    Cooking Loss
                  </span>

                  <span className="text-sm font-bold text-red-500">
                    {cookingLoss.toFixed(
                      2
                    )}
                    %
                  </span>
                </div>
              </div>

            </div>

            {/* OVERALL */}

            <div className="mt-5 bg-slate-800 text-white rounded-2xl p-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

                <div>
                  <p className="text-xs text-slate-400">
                    Overall Yield
                  </p>

                  <p className="text-2xl font-extrabold text-amber-400 mt-1">
                    {overallYield.toFixed(2)}%
                  </p>
                </div>

                <div className="text-sm text-slate-300 sm:text-right">
                  วัตถุดิบซื้อมา 1,000 หน่วย
                  <br />

                  ใช้งานหลังตัดแต่งและปรุงได้ประมาณ{" "}
                  <strong className="text-white">
                    {(
                      1000 *
                      (overallYield / 100)
                    ).toFixed(1)}
                  </strong>{" "}
                  หน่วย
                </div>
              </div>
            </div>

            {/* COST AFTER YIELD */}

            <div className="mt-4 bg-amber-50 border border-amber-100 rounded-2xl p-5">
              <div className="flex items-center gap-3">
                <Scale className="w-5 h-5 text-amber-600" />

                <div>
                  <p className="text-xs text-slate-500">
                    ต้นทุนต่อหน่วยหลังหัก Loss
                  </p>

                  <p className="font-extrabold text-amber-700 text-xl mt-1">
                    {usableCostPerUnit.toFixed(
                      4
                    )}{" "}
                    บาท/{packUnit}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* NOTES */}

          <section className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <label className="block text-sm font-bold text-slate-700 mb-2">
              หมายเหตุ
            </label>

            <textarea
              value={notes}
              onChange={(e) =>
                setNotes(e.target.value)
              }
              rows={4}
              placeholder="รายละเอียดเพิ่มเติม เช่น วิธีเตรียมวัตถุดิบ"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-amber-500"
            />
          </section>

          {message && (
            <div className="bg-red-50 border border-red-100 text-red-600 rounded-xl px-4 py-3 text-sm">
              {message}
            </div>
          )}

          {/* ACTION */}

          <div className="flex flex-col sm:flex-row gap-3">

            <button
              type="button"
              onClick={() =>
                router.push(
                  `/ingredients/${ingredientId}`
                )
              }
              className="flex-1 border border-slate-200 bg-white text-slate-700 font-bold py-3 rounded-xl hover:border-amber-300 transition"
            >
              ยกเลิก
            </button>

            <button
              type="submit"
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition"
            >
              <Save className="w-4 h-4" />

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