"use client";

import { useMemo, useState } from "react";

type Ingredient = {
  id: string;
  ingredient_name: string;
  quantity: number;
  unit: string;
  pack_price: number | null;
  pack_quantity: number | null;
  pack_unit: string | null;
};

type RecipeScalerProps = {
  ingredients: Ingredient[];
  baseYield: number | null;
  yieldUnit: string | null;
  baseServings: number | null;
  totalCost: number;
};

const QUICK_FACTORS = [
  { label: "¼ สูตร", value: 0.25 },
  { label: "½ สูตร", value: 0.5 },
  { label: "1 สูตร", value: 1 },
  { label: "1.5 สูตร", value: 1.5 },
  { label: "2 สูตร", value: 2 },
  { label: "5 สูตร", value: 5 },
];

export default function RecipeScaler({
  ingredients,
  baseYield,
  yieldUnit,
  baseServings,
  totalCost,
}: RecipeScalerProps) {
  const [factor, setFactor] = useState(1);
  const [customFactor, setCustomFactor] = useState("");
  const [targetServings, setTargetServings] = useState("");

  const scaledIngredients = useMemo(() => {
    return ingredients.map((item) => ({
      ...item,
      scaledQuantity: Number(item.quantity || 0) * factor,
    }));
  }, [ingredients, factor]);

  const scaledYield =
    baseYield && baseYield > 0 ? baseYield * factor : null;

  const scaledServings =
    baseServings && baseServings > 0
      ? baseServings * factor
      : null;

  const scaledCost = totalCost * factor;

  const applyQuickFactor = (value: number) => {
    setFactor(value);
    setCustomFactor("");
    setTargetServings("");
  };

  const applyCustomFactor = () => {
    const value = Number(customFactor);

    if (!value || value <= 0) return;

    setFactor(value);
    setTargetServings("");
  };

  const calculateFromServings = () => {
    const target = Number(targetServings);

    if (!baseServings || baseServings <= 0) return;
    if (!target || target <= 0) return;

    const calculatedFactor = target / baseServings;

    setFactor(calculatedFactor);
    setCustomFactor("");
  };

  const formatNumber = (value: number) => {
    if (Number.isInteger(value)) {
      return value.toLocaleString("th-TH");
    }

    return value.toLocaleString("th-TH", {
      maximumFractionDigits: 3,
    });
  };

  return (
    <section className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100">
        <h2 className="font-bold text-slate-800 text-lg">
          ปรับปริมาณสูตร
        </h2>

        <p className="text-sm text-slate-500 mt-1">
          ย่อหรือขยายสูตร ระบบจะคำนวณวัตถุดิบ Yield จำนวนเสิร์ฟ และต้นทุนใหม่ให้ทันที
        </p>
      </div>

      <div className="p-6 space-y-6">
        <div>
          <p className="text-sm font-semibold text-slate-700 mb-3">
            เลือกขนาดสูตร
          </p>

          <div className="flex flex-wrap gap-2">
            {QUICK_FACTORS.map((item) => {
              const active = factor === item.value;

              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => applyQuickFactor(item.value)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold border transition ${
                    active
                      ? "bg-amber-500 border-amber-500 text-white"
                      : "bg-white border-slate-200 text-slate-600 hover:border-amber-300 hover:text-amber-600"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-50 rounded-2xl p-4">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              กำหนดจำนวนสูตรเอง
            </label>

            <div className="flex gap-2">
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={customFactor}
                onChange={(e) => setCustomFactor(e.target.value)}
                placeholder="เช่น 3.5"
                className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-amber-500"
              />

              <button
                type="button"
                onClick={applyCustomFactor}
                className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-4 rounded-xl text-sm"
              >
                คำนวณ
              </button>
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              ต้องการผลิตกี่เสิร์ฟ / ชิ้น
            </label>

            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                value={targetServings}
                onChange={(e) => setTargetServings(e.target.value)}
                placeholder={
                  baseServings
                    ? `สูตรเดิมได้ ${baseServings}`
                    : "สูตรนี้ยังไม่ได้ระบุจำนวน"
                }
                disabled={!baseServings}
                className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-amber-500 disabled:bg-slate-100 disabled:text-slate-400"
              />

              <button
                type="button"
                onClick={calculateFromServings}
                disabled={!baseServings}
                className="bg-slate-800 hover:bg-slate-900 disabled:bg-slate-300 text-white font-bold px-4 rounded-xl text-sm"
              >
                คำนวณ
              </button>
            </div>

            {!baseServings && (
              <p className="text-xs text-slate-400 mt-2">
                ต้องระบุจำนวนเสิร์ฟ / ชิ้นของสูตรต้นฉบับก่อน
              </p>
            )}
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-xs text-amber-700 font-semibold">
                กำลังคำนวณที่
              </p>

              <p className="text-2xl font-extrabold text-amber-700 mt-1">
                {formatNumber(factor)} สูตร
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:min-w-[420px]">
              <div>
                <p className="text-xs text-slate-500">
                  Yield ใหม่
                </p>

                <p className="font-bold text-slate-800 mt-1">
                  {scaledYield !== null
                    ? `${formatNumber(scaledYield)} ${yieldUnit || ""}`
                    : "-"}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500">
                  จำนวนเสิร์ฟ
                </p>

                <p className="font-bold text-slate-800 mt-1">
                  {scaledServings !== null
                    ? formatNumber(scaledServings)
                    : "-"}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500">
                  ต้นทุนรวม
                </p>

                <p className="font-bold text-amber-700 mt-1">
                  {scaledCost.toFixed(2)} บาท
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="border border-slate-200 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 bg-slate-50 border-b border-slate-200">
            <h3 className="font-bold text-slate-800">
              วัตถุดิบหลังปรับสูตร
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="text-slate-500 border-b border-slate-100">
                  <th className="text-left px-5 py-3">
                    วัตถุดิบ
                  </th>

                  <th className="text-right px-5 py-3">
                    สูตรต้นฉบับ
                  </th>

                  <th className="text-right px-5 py-3">
                    ปริมาณใหม่
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {scaledIngredients.map((item) => (
                  <tr key={item.id}>
                    <td className="px-5 py-4 font-semibold text-slate-700">
                      {item.ingredient_name}
                    </td>

                    <td className="px-5 py-4 text-right text-slate-500">
                      {formatNumber(Number(item.quantity || 0))}{" "}
                      {item.unit}
                    </td>

                    <td className="px-5 py-4 text-right font-bold text-amber-600">
                      {formatNumber(item.scaledQuantity)}{" "}
                      {item.unit}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}