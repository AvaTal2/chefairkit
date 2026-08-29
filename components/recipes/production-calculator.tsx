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

type ProductionCalculatorProps = {
  ingredients: Ingredient[];
  baseYield: number | null;
  yieldUnit: string | null;
  baseServings: number | null;
  totalCost: number;
};

type CalculationMode = "servings" | "yield";

const normalizeUnit = (unit: string | null | undefined) => {
  const value = (unit || "").trim().toLowerCase();

  const map: Record<string, string> = {
    g: "g",
    gram: "g",
    grams: "g",
    กรัม: "g",

    kg: "kg",
    kilogram: "kg",
    kilograms: "kg",
    กิโลกรัม: "kg",
    กก: "kg",

    ml: "ml",
    milliliter: "ml",
    milliliters: "ml",
    มล: "ml",
    มิลลิลิตร: "ml",

    l: "l",
    liter: "l",
    liters: "l",
    litre: "l",
    litres: "l",
    ลิตร: "l",

    piece: "piece",
    pieces: "piece",
    ชิ้น: "piece",

    pack: "pack",
    packs: "pack",
    แพ็ก: "pack",

    bottle: "bottle",
    bottles: "bottle",
    ขวด: "bottle",

    bag: "bag",
    bags: "bag",
    ถุง: "bag",

    box: "box",
    boxes: "box",
    กล่อง: "box",
  };

  return map[value] || value;
};

const convertQuantity = (
  value: number,
  fromUnit: string,
  toUnit: string
): number | null => {
  const from = normalizeUnit(fromUnit);
  const to = normalizeUnit(toUnit);

  if (!from || !to) {
    return null;
  }

  if (from === to) {
    return value;
  }

  const weightUnits: Record<string, number> = {
    g: 1,
    kg: 1000,
  };

  const volumeUnits: Record<string, number> = {
    ml: 1,
    l: 1000,
  };

  if (weightUnits[from] && weightUnits[to]) {
    const valueInGrams = value * weightUnits[from];

    return valueInGrams / weightUnits[to];
  }

  if (volumeUnits[from] && volumeUnits[to]) {
    const valueInMl = value * volumeUnits[from];

    return valueInMl / volumeUnits[to];
  }

  return null;
};

export default function ProductionCalculator({
  ingredients,
  baseYield,
  yieldUnit,
  baseServings,
  totalCost,
}: ProductionCalculatorProps) {
  const [mode, setMode] =
    useState<CalculationMode>("servings");

  const [targetValue, setTargetValue] =
    useState("");

  const [factor, setFactor] =
    useState<number | null>(null);

  const [error, setError] =
    useState("");

  const changeMode = (newMode: CalculationMode) => {
    setMode(newMode);
    setTargetValue("");
    setFactor(null);
    setError("");
  };

  const calculateProduction = () => {
    setError("");

    const target = Number(targetValue);

    if (!target || target <= 0) {
      setFactor(null);
      setError("กรุณาระบุจำนวนที่ต้องการผลิต");
      return;
    }

    if (mode === "servings") {
      if (!baseServings || baseServings <= 0) {
        setFactor(null);
        setError(
          "สูตรนี้ยังไม่ได้ระบุจำนวนเสิร์ฟ / จำนวนชิ้น"
        );
        return;
      }

      setFactor(target / baseServings);
      return;
    }

    if (!baseYield || baseYield <= 0) {
      setFactor(null);
      setError(
        "สูตรนี้ยังไม่ได้ระบุ Yield"
      );
      return;
    }

    setFactor(target / baseYield);
  };

  const productionIngredients = useMemo(() => {
    if (factor === null || factor <= 0) {
      return [];
    }

    return ingredients.map((item) => {
      const productionQuantity =
        Number(item.quantity || 0) * factor;

      const packQuantity =
        Number(item.pack_quantity || 0);

      const packPrice =
        Number(item.pack_price || 0);

      const packUnit =
        item.pack_unit || item.unit;

      const requiredInPackUnit =
        convertQuantity(
          productionQuantity,
          item.unit,
          packUnit
        );

      const canCalculatePurchase =
        packQuantity > 0 &&
        packPrice > 0 &&
        requiredInPackUnit !== null;

      const packsNeeded =
        canCalculatePurchase
          ? Math.ceil(
              requiredInPackUnit! / packQuantity
            )
          : null;

      const purchaseQuantity =
        packsNeeded !== null
          ? packsNeeded * packQuantity
          : null;

      const purchaseCost =
        packsNeeded !== null
          ? packsNeeded * packPrice
          : null;

      const leftoverInPackUnit =
        purchaseQuantity !== null &&
        requiredInPackUnit !== null
          ? Math.max(
              purchaseQuantity -
                requiredInPackUnit,
              0
            )
          : null;

      return {
        ...item,
        productionQuantity,
        packUnit,
        requiredInPackUnit,
        packsNeeded,
        purchaseQuantity,
        purchaseCost,
        leftoverInPackUnit,
      };
    });
  }, [ingredients, factor]);

  const productionYield =
    factor !== null &&
    baseYield &&
    baseYield > 0
      ? baseYield * factor
      : null;

  const productionServings =
    factor !== null &&
    baseServings &&
    baseServings > 0
      ? baseServings * factor
      : null;

  const productionCost =
    factor !== null
      ? totalCost * factor
      : null;

  const totalPurchaseCost =
    useMemo(() => {
      return productionIngredients.reduce(
        (sum, item) =>
          sum +
          Number(item.purchaseCost || 0),
        0
      );
    }, [productionIngredients]);

  const formatNumber = (value: number) => {
    if (!Number.isFinite(value)) {
      return "-";
    }

    if (Number.isInteger(value)) {
      return value.toLocaleString("th-TH");
    }

    return value.toLocaleString("th-TH", {
      maximumFractionDigits: 3,
    });
  };

  const canUseServings =
    !!baseServings && baseServings > 0;

  const canUseYield =
    !!baseYield && baseYield > 0;

  return (
    <section className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100">
        <h2 className="font-bold text-slate-800 text-lg">
          Production Calculator
        </h2>

        <p className="text-sm text-slate-500 mt-1">
          คำนวณจำนวน Batch วัตถุดิบ ต้นทุน
          และรายการซื้อสำหรับรอบการผลิต
        </p>
      </div>

      <div className="p-6 space-y-6">

        {/* MODE */}

        <div>
          <p className="text-sm font-semibold text-slate-700 mb-3">
            ต้องการคำนวณการผลิตจากอะไร
          </p>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                changeMode("servings")
              }
              className={`px-4 py-2.5 rounded-xl text-sm font-bold border transition ${
                mode === "servings"
                  ? "bg-amber-500 border-amber-500 text-white"
                  : "bg-white border-slate-200 text-slate-600 hover:border-amber-300"
              }`}
            >
              จำนวนชิ้น / เสิร์ฟ
            </button>

            <button
              type="button"
              onClick={() =>
                changeMode("yield")
              }
              className={`px-4 py-2.5 rounded-xl text-sm font-bold border transition ${
                mode === "yield"
                  ? "bg-amber-500 border-amber-500 text-white"
                  : "bg-white border-slate-200 text-slate-600 hover:border-amber-300"
              }`}
            >
              Target Yield
            </button>
          </div>
        </div>

        {/* BASE INFO */}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-slate-50 rounded-2xl p-4">
            <p className="text-xs text-slate-400">
              สูตรต้นฉบับผลิตได้
            </p>

            <p className="font-bold text-slate-800 mt-1">
              {canUseServings
                ? `${formatNumber(
                    Number(baseServings)
                  )} ชิ้น / เสิร์ฟ`
                : "ไม่ได้ระบุ"}
            </p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4">
            <p className="text-xs text-slate-400">
              Yield สูตรต้นฉบับ
            </p>

            <p className="font-bold text-slate-800 mt-1">
              {canUseYield
                ? `${formatNumber(
                    Number(baseYield)
                  )} ${yieldUnit || ""}`
                : "ไม่ได้ระบุ"}
            </p>
          </div>
        </div>

        {/* TARGET */}

        <div className="max-w-xl">
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            {mode === "servings"
              ? "ต้องการผลิตกี่ชิ้น / เสิร์ฟ"
              : `ต้องการผลิต Yield เท่าไร ${
                  yieldUnit
                    ? `(${yieldUnit})`
                    : ""
                }`}
          </label>

          <div className="flex gap-2">
            <input
              type="number"
              min="0"
              step="any"
              value={targetValue}
              onChange={(e) =>
                setTargetValue(e.target.value)
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  calculateProduction();
                }
              }}
              placeholder={
                mode === "servings"
                  ? canUseServings
                    ? `สูตรเดิมได้ ${baseServings}`
                    : "ยังไม่ได้ระบุจำนวนชิ้น"
                  : canUseYield
                  ? `สูตรเดิมได้ ${baseYield} ${
                      yieldUnit || ""
                    }`
                  : "ยังไม่ได้ระบุ Yield"
              }
              className="flex-1 min-w-0 px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-amber-500"
            />

            <button
              type="button"
              onClick={calculateProduction}
              className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-5 rounded-xl text-sm transition"
            >
              คำนวณ
            </button>
          </div>

          {error && (
            <div className="mt-3 bg-red-50 border border-red-100 text-red-600 rounded-xl px-4 py-3 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* RESULT */}

        {factor !== null && factor > 0 && (
          <>
            {/* SUMMARY */}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-slate-50 rounded-2xl p-4">
                <p className="text-xs text-slate-400">
                  จำนวน Batch
                </p>

                <p className="font-extrabold text-slate-800 mt-1 text-lg">
                  {formatNumber(factor)}
                </p>

                <p className="text-xs text-slate-400 mt-1">
                  เท่าของสูตรต้นฉบับ
                </p>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4">
                <p className="text-xs text-slate-400">
                  จำนวนผลิต
                </p>

                <p className="font-bold text-slate-800 mt-1">
                  {productionServings !== null
                    ? `${formatNumber(
                        productionServings
                      )} ชิ้น / เสิร์ฟ`
                    : "-"}
                </p>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4">
                <p className="text-xs text-slate-400">
                  Yield รวม
                </p>

                <p className="font-bold text-slate-800 mt-1">
                  {productionYield !== null
                    ? `${formatNumber(
                        productionYield
                      )} ${yieldUnit || ""}`
                    : "-"}
                </p>
              </div>

              <div className="bg-amber-50 rounded-2xl p-4">
                <p className="text-xs text-amber-600">
                  ต้นทุนที่ใช้จริง
                </p>

                <p className="font-extrabold text-amber-700 mt-1">
                  {productionCost !== null
                    ? `${productionCost.toFixed(
                        2
                      )} บาท`
                    : "-"}
                </p>
              </div>

              <div className="bg-slate-800 text-white rounded-2xl p-4">
                <p className="text-xs text-slate-300">
                  งบซื้อวัตถุดิบ
                </p>

                <p className="font-extrabold mt-1">
                  {totalPurchaseCost.toFixed(2)} บาท
                </p>
              </div>
            </div>

            {/* PRODUCTION INGREDIENTS */}

            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 bg-slate-50 border-b border-slate-200">
                <h3 className="font-bold text-slate-800">
                  วัตถุดิบสำหรับรอบผลิต
                </h3>

                <p className="text-xs text-slate-500 mt-1">
                  ปริมาณที่ต้องใช้จริงตามเป้าหมายการผลิต
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[650px] text-sm">
                  <thead>
                    <tr className="text-slate-500 border-b border-slate-100">
                      <th className="text-left px-5 py-3">
                        วัตถุดิบ
                      </th>

                      <th className="text-right px-5 py-3">
                        สูตรต้นฉบับ
                      </th>

                      <th className="text-right px-5 py-3">
                        ต้องใช้
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {productionIngredients.map(
                      (item) => (
                        <tr key={item.id}>
                          <td className="px-5 py-4 font-semibold text-slate-700">
                            {item.ingredient_name}
                          </td>

                          <td className="px-5 py-4 text-right text-slate-500">
                            {formatNumber(
                              Number(
                                item.quantity || 0
                              )
                            )}{" "}
                            {item.unit}
                          </td>

                          <td className="px-5 py-4 text-right font-bold text-amber-600">
                            {formatNumber(
                              item.productionQuantity
                            )}{" "}
                            {item.unit}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SHOPPING LIST */}

            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 bg-slate-800 text-white">
                <h3 className="font-bold">
                  รายการซื้อวัตถุดิบ
                </h3>

                <p className="text-xs text-slate-300 mt-1">
                  คำนวณจำนวนแพ็กขั้นต่ำจากขนาดแพ็กที่บันทึกในคลังวัตถุดิบ
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[950px] text-sm">
                  <thead className="bg-slate-50">
                    <tr className="text-slate-500 border-b border-slate-100">
                      <th className="text-left px-5 py-3">
                        วัตถุดิบ
                      </th>

                      <th className="text-right px-5 py-3">
                        ต้องใช้
                      </th>

                      <th className="text-right px-5 py-3">
                        ขนาดแพ็ก
                      </th>

                      <th className="text-right px-5 py-3">
                        ต้องซื้อ
                      </th>

                      <th className="text-right px-5 py-3">
                        ซื้อรวม
                      </th>

                      <th className="text-right px-5 py-3">
                        คงเหลือ
                      </th>

                      <th className="text-right px-5 py-3">
                        เงินที่ต้องซื้อ
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {productionIngredients.map(
                      (item) => (
                        <tr key={item.id}>
                          <td className="px-5 py-4 font-semibold text-slate-700">
                            {item.ingredient_name}

                            {item.requiredInPackUnit ===
                              null && (
                              <div className="text-xs text-red-500 mt-1 font-normal">
                                หน่วยของสูตรและหน่วยซื้อไม่สามารถแปลงกันได้
                              </div>
                            )}
                          </td>

                          <td className="px-5 py-4 text-right">
                            {formatNumber(
                              item.productionQuantity
                            )}{" "}
                            {item.unit}
                          </td>

                          <td className="px-5 py-4 text-right text-slate-500">
                            {item.pack_quantity
                              ? `${formatNumber(
                                  Number(
                                    item.pack_quantity
                                  )
                                )} ${item.packUnit}`
                              : "-"}
                          </td>

                          <td className="px-5 py-4 text-right font-bold text-slate-800">
                            {item.packsNeeded !== null
                              ? `${formatNumber(
                                  item.packsNeeded
                                )} แพ็ก`
                              : "-"}
                          </td>

                          <td className="px-5 py-4 text-right text-slate-600">
                            {item.purchaseQuantity !==
                            null
                              ? `${formatNumber(
                                  item.purchaseQuantity
                                )} ${item.packUnit}`
                              : "-"}
                          </td>

                          <td className="px-5 py-4 text-right text-slate-600">
                            {item.leftoverInPackUnit !==
                            null
                              ? `${formatNumber(
                                  item.leftoverInPackUnit
                                )} ${item.packUnit}`
                              : "-"}
                          </td>

                          <td className="px-5 py-4 text-right font-bold text-amber-600">
                            {item.purchaseCost !== null
                              ? `${item.purchaseCost.toFixed(
                                  2
                                )} บาท`
                              : "-"}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>

                  <tfoot className="bg-amber-50">
                    <tr>
                      <td
                        colSpan={6}
                        className="px-5 py-4 text-right font-bold text-slate-700"
                      >
                        งบซื้อวัตถุดิบขั้นต่ำ
                      </td>

                      <td className="px-5 py-4 text-right font-extrabold text-amber-600">
                        {totalPurchaseCost.toFixed(2)}{" "}
                        บาท
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* COST COMPARISON */}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-5">
                <p className="text-xs text-slate-400">
                  ต้นทุนวัตถุดิบที่ใช้จริง
                </p>

                <p className="text-xl font-extrabold text-slate-800 mt-1">
                  {productionCost !== null
                    ? productionCost.toFixed(2)
                    : "0.00"}{" "}
                  บาท
                </p>

                <p className="text-xs text-slate-400 mt-2">
                  คิดเฉพาะปริมาณวัตถุดิบที่ถูกใช้ในรอบผลิต
                </p>
              </div>

              <div className="bg-slate-800 text-white rounded-2xl p-5">
                <p className="text-xs text-slate-300">
                  เงินที่ต้องเตรียมซื้อวัตถุดิบ
                </p>

                <p className="text-xl font-extrabold mt-1">
                  {totalPurchaseCost.toFixed(2)} บาท
                </p>

                <p className="text-xs text-slate-300 mt-2">
                  คิดจากจำนวนแพ็กเต็มขั้นต่ำที่ต้องซื้อ
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}