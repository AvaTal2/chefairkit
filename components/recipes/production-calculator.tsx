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

export default function ProductionCalculator({
  ingredients,
  baseYield,
  yieldUnit,
  baseServings,
  totalCost,
}: ProductionCalculatorProps) {
  const [targetServings, setTargetServings] = useState("");
  const [factor, setFactor] = useState<number | null>(null);

  const calculateProduction = () => {
    const target = Number(targetServings);

    if (!baseServings || baseServings <= 0) return;
    if (!target || target <= 0) return;

    setFactor(target / baseServings);
  };

  const productionIngredients = useMemo(() => {
    if (!factor) return [];

    return ingredients.map((item) => {
      const productionQuantity =
        Number(item.quantity || 0) * factor;

      const packQuantity = Number(item.pack_quantity || 0);
      const packPrice = Number(item.pack_price || 0);

      const canCalculatePurchase =
        packQuantity > 0 &&
        packPrice > 0 &&
        item.unit === (item.pack_unit || item.unit);

      const packsNeeded = canCalculatePurchase
        ? Math.ceil(productionQuantity / packQuantity)
        : null;

      const purchaseQuantity =
        packsNeeded !== null
          ? packsNeeded * packQuantity
          : null;

      const purchaseCost =
        packsNeeded !== null
          ? packsNeeded * packPrice
          : null;

      const leftover =
        purchaseQuantity !== null
          ? Math.max(
              purchaseQuantity - productionQuantity,
              0
            )
          : null;

      return {
        ...item,
        productionQuantity,
        packsNeeded,
        purchaseQuantity,
        purchaseCost,
        leftover,
      };
    });
  }, [ingredients, factor]);

  const productionYield =
    factor && baseYield && baseYield > 0
      ? baseYield * factor
      : null;

  const productionCost =
    factor !== null ? totalCost * factor : null;

  const totalPurchaseCost = useMemo(() => {
    return productionIngredients.reduce(
      (sum, item) =>
        sum + Number(item.purchaseCost || 0),
      0
    );
  }, [productionIngredients]);

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
          Production Calculator
        </h2>

        <p className="text-sm text-slate-500 mt-1">
          คำนวณวัตถุดิบ ต้นทุน และจำนวนสินค้าที่ต้องซื้อสำหรับรอบการผลิต
        </p>
      </div>

      <div className="p-6 space-y-6">
        {!baseServings ? (
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-sm text-amber-700">
            สูตรนี้ยังไม่ได้ระบุจำนวนเสิร์ฟ / จำนวนชิ้น
            กรุณาแก้ไขสูตรและระบุจำนวนที่สูตรต้นฉบับผลิตได้ก่อน
          </div>
        ) : (
          <>
            {/* TARGET PRODUCTION */}
            <div className="max-w-xl">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                ต้องการผลิตกี่เสิร์ฟ / ชิ้น
              </label>

              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  value={targetServings}
                  onChange={(e) =>
                    setTargetServings(e.target.value)
                  }
                  placeholder={`สูตรเดิมได้ ${baseServings}`}
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-amber-500"
                />

                <button
                  type="button"
                  onClick={calculateProduction}
                  className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-5 rounded-xl text-sm transition"
                >
                  คำนวณ
                </button>
              </div>
            </div>

            {factor !== null && (
              <>
                {/* PRODUCTION SUMMARY */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-slate-50 rounded-2xl p-4">
                    <p className="text-xs text-slate-400">
                      สูตรต้นฉบับ
                    </p>

                    <p className="font-bold text-slate-800 mt-1">
                      {baseServings} ชิ้น
                    </p>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-4">
                    <p className="text-xs text-slate-400">
                      ต้องใช้
                    </p>

                    <p className="font-bold text-slate-800 mt-1">
                      {formatNumber(factor)} สูตร
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

                  <div className="bg-amber-500 text-white rounded-2xl p-4">
                    <p className="text-xs text-amber-100">
                      ต้นทุนที่ใช้จริง
                    </p>

                    <p className="font-extrabold mt-1">
                      {productionCost !== null
                        ? `${productionCost.toFixed(
                            2
                          )} บาท`
                        : "-"}
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
                      ปริมาณที่ต้องใช้จริงตามจำนวนที่ต้องการผลิต
                    </p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[600px] text-sm">
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
                                {
                                  item.ingredient_name
                                }
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
                      ระบบคำนวณจำนวนแพ็กขั้นต่ำที่ต้องซื้อจากขนาดแพ็กที่บันทึกไว้
                    </p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px] text-sm">
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
                                {
                                  item.ingredient_name
                                }
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
                                    )} ${
                                      item.pack_unit ||
                                      item.unit
                                    }`
                                  : "-"}
                              </td>

                              <td className="px-5 py-4 text-right font-bold text-slate-800">
                                {item.packsNeeded !== null
                                  ? `${item.packsNeeded} แพ็ก`
                                  : "-"}
                              </td>

                              <td className="px-5 py-4 text-right text-slate-600">
                                {item.purchaseQuantity !==
                                null
                                  ? `${formatNumber(
                                      item.purchaseQuantity
                                    )} ${
                                      item.pack_unit ||
                                      item.unit
                                    }`
                                  : "-"}
                              </td>

                              <td className="px-5 py-4 text-right text-slate-600">
                                {item.leftover !== null
                                  ? `${formatNumber(
                                      item.leftover
                                    )} ${
                                      item.pack_unit ||
                                      item.unit
                                    }`
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
                            {totalPurchaseCost.toFixed(
                              2
                            )}{" "}
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
                      ต้นทุนวัตถุดิบที่ใช้ในสูตร
                    </p>

                    <p className="text-xl font-extrabold text-slate-800 mt-1">
                      {productionCost !== null
                        ? productionCost.toFixed(2)
                        : "0.00"}{" "}
                      บาท
                    </p>

                    <p className="text-xs text-slate-400 mt-2">
                      คิดเฉพาะปริมาณวัตถุดิบที่ใช้จริง
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
                      คิดจากจำนวนแพ็กเต็มที่ต้องซื้อ
                    </p>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </section>
  );
}