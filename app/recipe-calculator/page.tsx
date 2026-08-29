"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  Calculator,
  RotateCcw,
  Scale,
  Copy,
  Printer,
  Check,
  Save,
} from "lucide-react";

import { supabase } from "@/lib/supabase/client";

type Ingredient = {
  id: number;
  name: string;
  quantity: string;
  unit: string;
};

type Mode = "multiplier" | "yield" | "servings";

const makeIngredient = (id: number): Ingredient => ({
  id,
  name: "",
  quantity: "",
  unit: "g",
});

export default function RecipeCalculatorPage() {
  const router = useRouter();

  const [ingredients, setIngredients] = useState<Ingredient[]>([
    makeIngredient(1),
    makeIngredient(2),
    makeIngredient(3),
  ]);

  const [nextId, setNextId] = useState(4);
  const [copied, setCopied] = useState(false);
  const [savingToAccount, setSavingToAccount] = useState(false);

  const [mode, setMode] = useState<Mode>("multiplier");

  const [multiplier, setMultiplier] = useState("2");

  const [originalYield, setOriginalYield] = useState("");
  const [targetYield, setTargetYield] = useState("");
  const [yieldUnit, setYieldUnit] = useState("g");

  const [originalServings, setOriginalServings] = useState("");
  const [targetServings, setTargetServings] = useState("");

  const factor = useMemo(() => {
    if (mode === "multiplier") {
      const value = Number(multiplier);

      return value > 0 ? value : 0;
    }

    if (mode === "yield") {
      const original = Number(originalYield);
      const target = Number(targetYield);

      if (original <= 0 || target <= 0) {
        return 0;
      }

      return target / original;
    }

    const original = Number(originalServings);
    const target = Number(targetServings);

    if (original <= 0 || target <= 0) {
      return 0;
    }

    return target / original;
  }, [
    mode,
    multiplier,
    originalYield,
    targetYield,
    originalServings,
    targetServings,
  ]);

  const updateIngredient = (
    id: number,
    field: keyof Ingredient,
    value: string
  ) => {
    setIngredients((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    );
  };

  const addIngredient = () => {
    setIngredients((current) => [
      ...current,
      makeIngredient(nextId),
    ]);

    setNextId((current) => current + 1);
  };

  const removeIngredient = (id: number) => {
    setIngredients((current) => {
      if (current.length <= 1) {
        return current;
      }

      return current.filter((item) => item.id !== id);
    });
  };

  const resetCalculator = () => {
    setIngredients([
      makeIngredient(1),
      makeIngredient(2),
      makeIngredient(3),
    ]);

    setNextId(4);

    setMode("multiplier");
    setMultiplier("2");

    setOriginalYield("");
    setTargetYield("");
    setYieldUnit("g");

    setOriginalServings("");
    setTargetServings("");

    setCopied(false);
  };

  const formatNumber = (value: number) => {
    if (!Number.isFinite(value)) {
      return "-";
    }

    return new Intl.NumberFormat("th-TH", {
      maximumFractionDigits: 3,
    }).format(value);
  };

  const validIngredients = ingredients.filter(
    (item) =>
      item.name.trim() !== "" &&
      Number(item.quantity) > 0
  );

  const getCalculationDescription = () => {
    if (mode === "yield") {
      return `ปรับ Yield จาก ${originalYield} ${yieldUnit} เป็น ${targetYield} ${yieldUnit}`;
    }

    if (mode === "servings") {
      return `ปรับจาก ${originalServings} เสิร์ฟ/ชิ้น เป็น ${targetServings} เสิร์ฟ/ชิ้น`;
    }

    return `ปรับสูตร × ${formatNumber(factor)}`;
  };

  const handleCopyRecipe = async () => {
    if (factor <= 0 || validIngredients.length === 0) {
      return;
    }

    const lines = validIngredients.map((item) => {
      const calculated = Number(item.quantity) * factor;

      return `${item.name} ${formatNumber(calculated)} ${item.unit}`;
    });

    const text = [
      "สูตรที่คำนวณแล้ว",
      getCalculationDescription(),
      "",
      ...lines,
      "",
      "คำนวณด้วย ChefAir Kit",
    ].join("\n");

    try {
      await navigator.clipboard.writeText(text);

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      alert("ไม่สามารถคัดลอกได้ กรุณาลองใหม่อีกครั้ง");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSaveToAccount = async () => {
    if (factor <= 0 || validIngredients.length === 0) {
      alert("กรุณาใส่วัตถุดิบและคำนวณสูตรก่อน");
      return;
    }

    setSavingToAccount(true);

    try {
      const calculatedIngredients = validIngredients.map((item) => ({
        name: item.name.trim(),
        quantity: Number(item.quantity) * factor,
        unit: item.unit,
      }));

      let calculatedYieldAmount: number | null = null;
      let calculatedYieldUnit = yieldUnit;

      if (mode === "yield" && Number(targetYield) > 0) {
        calculatedYieldAmount = Number(targetYield);
        calculatedYieldUnit = yieldUnit;
      }

      let calculatedServings: number | null = null;

      if (
        mode === "servings" &&
        Number(targetServings) > 0
      ) {
        calculatedServings = Number(targetServings);
      }

      const transferData = {
        source: "recipe-calculator",
        createdAt: Date.now(),
        calculationMode: mode,
        calculationDescription:
          getCalculationDescription(),

        yieldAmount: calculatedYieldAmount,
        yieldUnit: calculatedYieldUnit,
        servings: calculatedServings,

        ingredients: calculatedIngredients,
      };

      sessionStorage.setItem(
        "chefair_recipe_transfer",
        JSON.stringify(transferData)
      );

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        sessionStorage.setItem(
          "chefair_after_login_redirect",
          "/recipes/new?from=calculator"
        );

        router.push("/login");
        return;
      }

      router.push("/recipes/new?from=calculator");
    } catch (error) {
      console.error(error);

      alert(
        "ไม่สามารถเตรียมข้อมูลสูตรสำหรับบันทึกได้ กรุณาลองใหม่อีกครั้ง"
      );

      setSavingToAccount(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">

      <main className="max-w-6xl mx-auto px-4 py-10 sm:py-14">
        {/* Header */}

        <div className="text-center max-w-2xl mx-auto mb-9">
          <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-600 text-xs font-bold px-3 py-1.5 rounded-full mb-4">
            ใช้งานฟรี • ไม่ต้องสมัครสมาชิก
          </div>

          <div className="flex justify-center mb-4">
            <div className="bg-amber-50 text-amber-600 p-3 rounded-2xl">
              <Scale className="w-7 h-7" />
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-800">
            เครื่องคำนวณสูตรอาหาร
          </h1>

          <p className="text-sm text-slate-500 mt-3 leading-relaxed">
            ย่อ ขยาย หรือปรับสูตรตาม Yield และจำนวนที่ต้องการ
            ระบบจะคำนวณวัตถุดิบทุกตัวให้อัตโนมัติ
          </p>
        </div>

        {/* Mode */}

        <section className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm mb-6">
          <p className="text-sm font-bold text-slate-800 mb-4">
            ต้องการคำนวณแบบไหน?
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setMode("multiplier")}
              className={`p-4 rounded-2xl border text-left transition ${
                mode === "multiplier"
                  ? "border-amber-400 bg-amber-50"
                  : "border-slate-200 hover:border-amber-200"
              }`}
            >
              <p className="font-bold text-slate-800">
                คูณ / ย่อสูตร
              </p>

              <p className="text-xs text-slate-500 mt-1">
                เช่น ½ สูตร, 2 สูตร, 5 สูตร
              </p>
            </button>

            <button
              type="button"
              onClick={() => setMode("yield")}
              className={`p-4 rounded-2xl border text-left transition ${
                mode === "yield"
                  ? "border-amber-400 bg-amber-50"
                  : "border-slate-200 hover:border-amber-200"
              }`}
            >
              <p className="font-bold text-slate-800">
                ปรับตาม Yield
              </p>

              <p className="text-xs text-slate-500 mt-1">
                จากน้ำหนักสูตรเดิม → น้ำหนักที่ต้องการ
              </p>
            </button>

            <button
              type="button"
              onClick={() => setMode("servings")}
              className={`p-4 rounded-2xl border text-left transition ${
                mode === "servings"
                  ? "border-amber-400 bg-amber-50"
                  : "border-slate-200 hover:border-amber-200"
              }`}
            >
              <p className="font-bold text-slate-800">
                ปรับตามจำนวน
              </p>

              <p className="text-xs text-slate-500 mt-1">
                เช่น 20 ชิ้น → 75 ชิ้น
              </p>
            </button>
          </div>

          {mode === "multiplier" && (
            <div className="mt-5">
              <label className="block text-xs font-bold text-slate-600 mb-2">
                ต้องการกี่เท่าของสูตรเดิม?
              </label>

              <div className="flex flex-wrap gap-2 mb-3">
                {[
                  ["¼ สูตร", "0.25"],
                  ["½ สูตร", "0.5"],
                  ["1 สูตร", "1"],
                  ["1.5 สูตร", "1.5"],
                  ["2 สูตร", "2"],
                  ["3 สูตร", "3"],
                  ["5 สูตร", "5"],
                  ["10 สูตร", "10"],
                ].map(([label, value]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setMultiplier(value)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition ${
                      multiplier === value
                        ? "bg-amber-500 border-amber-500 text-white"
                        : "bg-white border-slate-200 text-slate-600 hover:border-amber-300"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="max-w-xs">
                <input
                  type="number"
                  min="0.001"
                  step="0.001"
                  value={multiplier}
                  onChange={(e) =>
                    setMultiplier(e.target.value)
                  }
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm"
                  placeholder="เช่น 2.5"
                />
              </div>
            </div>
          )}

          {mode === "yield" && (
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr_auto] gap-3 items-end">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2">
                  สูตรเดิมได้
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.001"
                  value={originalYield}
                  onChange={(e) =>
                    setOriginalYield(e.target.value)
                  }
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm"
                  placeholder="1000"
                />
              </div>

              <div className="hidden sm:block pb-3 text-slate-300">
                →
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2">
                  ต้องการ
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.001"
                  value={targetYield}
                  onChange={(e) =>
                    setTargetYield(e.target.value)
                  }
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm"
                  placeholder="6500"
                />
              </div>

              <select
                value={yieldUnit}
                onChange={(e) =>
                  setYieldUnit(e.target.value)
                }
                className="border border-slate-200 rounded-xl px-3 py-3 text-sm bg-white"
              >
                <option value="g">กรัม</option>
                <option value="kg">กิโลกรัม</option>
                <option value="ml">มิลลิลิตร</option>
                <option value="l">ลิตร</option>
              </select>
            </div>
          )}

          {mode === "servings" && (
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-3 items-end max-w-2xl">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2">
                  สูตรเดิมได้กี่เสิร์ฟ / ชิ้น
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.001"
                  value={originalServings}
                  onChange={(e) =>
                    setOriginalServings(e.target.value)
                  }
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm"
                  placeholder="20"
                />
              </div>

              <div className="hidden sm:block pb-3 text-slate-300">
                →
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2">
                  ต้องการกี่เสิร์ฟ / ชิ้น
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.001"
                  value={targetServings}
                  onChange={(e) =>
                    setTargetServings(e.target.value)
                  }
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm"
                  placeholder="75"
                />
              </div>
            </div>
          )}

          <div className="mt-5 bg-slate-50 rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
            <span className="text-xs text-slate-500">
              ตัวคูณที่ระบบใช้
            </span>

            <span className="text-lg font-extrabold text-amber-600">
              {factor > 0
                ? `× ${formatNumber(factor)}`
                : "-"}
            </span>
          </div>
        </section>

        {/* Ingredients */}

        <section className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4 mb-5">
            <div>
              <h2 className="font-extrabold text-slate-800">
                วัตถุดิบสูตรเดิม
              </h2>

              <p className="text-xs text-slate-400 mt-1">
                ใส่ปริมาณตามสูตรต้นฉบับ
              </p>
            </div>

            <button
              type="button"
              onClick={resetCalculator}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-amber-600"
            >
              <RotateCcw className="w-4 h-4" />
              ล้างข้อมูล
            </button>
          </div>

          <div className="space-y-3">
            {ingredients.map((item, index) => {
              const quantity = Number(item.quantity);

              const calculated =
                factor > 0 && quantity > 0
                  ? quantity * factor
                  : 0;

              return (
                <div
                  key={item.id}
                  className="grid grid-cols-1 sm:grid-cols-[40px_1fr_130px_110px_160px_42px] gap-2 sm:items-center"
                >
                  <div className="hidden sm:block text-xs font-bold text-slate-300 text-center">
                    {index + 1}
                  </div>

                  <input
                    value={item.name}
                    onChange={(e) =>
                      updateIngredient(
                        item.id,
                        "name",
                        e.target.value
                      )
                    }
                    placeholder="ชื่อวัตถุดิบ"
                    className="border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm"
                  />

                  <input
                    type="number"
                    min="0"
                    step="0.001"
                    value={item.quantity}
                    onChange={(e) =>
                      updateIngredient(
                        item.id,
                        "quantity",
                        e.target.value
                      )
                    }
                    placeholder="ปริมาณ"
                    className="border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm"
                  />

                  <select
                    value={item.unit}
                    onChange={(e) =>
                      updateIngredient(
                        item.id,
                        "unit",
                        e.target.value
                      )
                    }
                    className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white"
                  >
                    <option value="g">g</option>
                    <option value="kg">kg</option>
                    <option value="ml">ml</option>
                    <option value="l">L</option>
                    <option value="piece">ชิ้น</option>
                    <option value="egg">ฟอง</option>
                    <option value="fruit">ลูก</option>
                    <option value="tsp">ช้อนชา</option>
                    <option value="tbsp">ช้อนโต๊ะ</option>
                    <option value="cup">ถ้วย</option>
                  </select>

                  <div className="bg-amber-50 rounded-xl px-3.5 py-2.5 flex sm:block justify-between">
                    <span className="sm:hidden text-xs text-slate-400">
                      สูตรใหม่
                    </span>

                    <span className="text-sm font-extrabold text-amber-700">
                      {calculated > 0
                        ? `${formatNumber(calculated)} ${item.unit}`
                        : "-"}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      removeIngredient(item.id)
                    }
                    className="h-[42px] rounded-xl text-red-400 hover:bg-red-50 flex items-center justify-center"
                    aria-label="ลบวัตถุดิบ"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={addIngredient}
            className="mt-4 flex items-center gap-1.5 text-xs font-bold text-amber-600"
          >
            <Plus className="w-4 h-4" />
            เพิ่มวัตถุดิบ
          </button>
        </section>

        {/* Result */}

        {factor > 0 && validIngredients.length > 0 && (
          <section className="mt-6 bg-slate-800 rounded-3xl p-6 sm:p-7 text-white">
            <div className="flex items-center gap-3 mb-5">
              <div className="bg-white/10 p-2.5 rounded-xl">
                <Calculator className="w-5 h-5 text-amber-400" />
              </div>

              <div>
                <h2 className="font-extrabold">
                  สูตรที่คำนวณแล้ว
                </h2>

                <p className="text-xs text-slate-400 mt-0.5">
                  {getCalculationDescription()}
                </p>
              </div>
            </div>

            <div className="divide-y divide-slate-700">
              {validIngredients.map((item) => {
                const calculated =
                  Number(item.quantity) * factor;

                return (
                  <div
                    key={item.id}
                    className="py-3 flex items-center justify-between gap-4"
                  >
                    <span className="text-sm text-slate-200">
                      {item.name}
                    </span>

                    <span className="font-extrabold text-amber-400">
                      {formatNumber(calculated)}{" "}
                      {item.unit}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Result Actions */}

            <div className="border-t border-slate-700 mt-5 pt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={handleCopyRecipe}
                className="flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold px-4 py-3 rounded-xl transition text-sm"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    คัดลอกแล้ว
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    คัดลอกสูตร
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 text-white font-bold px-4 py-3 rounded-xl transition text-sm"
              >
                <Printer className="w-4 h-4" />
                พิมพ์ / บันทึก PDF
              </button>

              <button
                type="button"
                onClick={handleSaveToAccount}
                disabled={savingToAccount}
                className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white font-bold px-4 py-3 rounded-xl transition text-sm"
              >
                <Save className="w-4 h-4" />

                {savingToAccount
                  ? "กำลังเตรียมสูตร..."
                  : "บันทึกเป็นสูตรของฉัน"}
              </button>
            </div>
          </section>
        )}

        {/* Member conversion */}

        <section className="mt-6 bg-amber-50 border border-amber-100 rounded-3xl p-6 text-center">
          <h3 className="font-extrabold text-slate-800">
            ต้องการเก็บสูตรนี้ไว้ใช้ครั้งต่อไป?
          </h3>

          <p className="text-xs text-slate-500 mt-2 max-w-lg mx-auto">
            คำนวณสูตรด้านบนให้เรียบร้อย แล้วกด
            “บันทึกเป็นสูตรของฉัน”
            ระบบจะส่งวัตถุดิบและปริมาณที่คำนวณแล้วไปยังหน้าสร้างสูตร
          </p>
        </section>
      </main>
    </div>
  );
}