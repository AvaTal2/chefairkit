"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Calculator, ShoppingBag, Search, Package, Users, Flame, Building2, BadgeDollarSign, TrendingUp, Percent, Truck, ReceiptText, BarChart3, Crown } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";

interface Ingredient {
  id: string;
  name: string;
  packPrice: number | "";
  packWeight: number | "";
  usedWeight: number | "";
}

export default function CostPage() {
  const router = useRouter();

  const {
    loading: subscriptionLoading,
    permissions,
  } = useSubscription();

  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { id: "1", name: "", packPrice: "", packWeight: "", usedWeight: "" },
    { id: "2", name: "", packPrice: "", packWeight: "", usedWeight: "" },
  ]);
  const [actualYield, setActualYield] = useState<number | "">("");
  const [portionSize, setPortionSize] = useState<number | "">("");
  const [packagingCost, setPackagingCost] = useState<number | "">("");
  const [laborCost, setLaborCost] = useState<number | "">("");
  const [utilityCost, setUtilityCost] = useState<number | "">("");
  const [overheadCost, setOverheadCost] = useState<number | "">("");
  const [sellingPrice, setSellingPrice] = useState<number | "">("");
  const [targetMargin, setTargetMargin] = useState<number | "">("");
  const [deliveryPrice, setDeliveryPrice] = useState<number | "">("");
  const [gpPercent, setGpPercent] = useState<number | "">("");
  const [vatPercent, setVatPercent] = useState<number | "">(7);

  const MY_AFFILIATE_LINK = "Https://s.shopee.co.th/70JW1RXcMF";

  const searchShopee = (ingredientName: string) => {
    if (!ingredientName.trim()) return;
    const encodedName = encodeURIComponent(ingredientName.trim());
    const finalUrl = `https://shopee.co.th/search?keyword=${encodedName}&url=${encodeURIComponent(MY_AFFILIATE_LINK)}`;
    window.open(finalUrl, "_blank");
  };

  const addIngredient = () => {
    setIngredients([
      ...ingredients,
      { id: Date.now().toString(), name: "", packPrice: "", packWeight: "", usedWeight: "" },
    ]);
  };

  const removeIngredient = (id: string) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter((item) => item.id !== id));
    }
  };

  const updateIngredient = (id: string, field: keyof Ingredient, value: string) => {
    setIngredients(
      ingredients.map((item) => {
        if (item.id === id) {
          if (field === "name") return { ...item, name: value };
          const numValue = value === "" ? "" : parseFloat(value) || 0;
          return { ...item, [field]: numValue };
        }
        return item;
      })
    );
  };

  const calculateCostPerUnit = (item: Ingredient) => {
    if (typeof item.packPrice === "number" && typeof item.packWeight === "number" && item.packWeight > 0) {
      return item.packPrice / item.packWeight;
    }
    return 0;
  };

  const calculateUsedCost = (item: Ingredient) => {
    const costPerUnit = calculateCostPerUnit(item);
    if (typeof item.usedWeight === "number") {
      return costPerUnit * item.usedWeight;
    }
    return 0;
  };

  const totalIngredientCost = ingredients.reduce(
    (sum, item) => sum + calculateUsedCost(item),
    0
  );

  const extraCost =
    (typeof packagingCost === "number" ? packagingCost : 0) +
    (typeof laborCost === "number" ? laborCost : 0) +
    (typeof utilityCost === "number" ? utilityCost : 0) +
    (typeof overheadCost === "number" ? overheadCost : 0);

  const totalCost = totalIngredientCost + extraCost;

  const costPerGramActual =
    typeof actualYield === "number" && actualYield > 0
      ? totalCost / actualYield
      : 0;

  const costPerPortion =
    typeof portionSize === "number"
      ? costPerGramActual * portionSize
      : 0;

  const ingredientCostPerGram =
    typeof actualYield === "number" && actualYield > 0
      ? totalIngredientCost / actualYield
      : 0;

  const ingredientCostPerPortion =
    typeof portionSize === "number"
      ? ingredientCostPerGram * portionSize
      : 0;

  const sellingPriceValue =
    typeof sellingPrice === "number"
      ? sellingPrice
      : 0;

  const profitPerPortion =
    sellingPriceValue > 0
      ? sellingPriceValue - costPerPortion
      : 0;

  const profitMargin =
    sellingPriceValue > 0
      ? (profitPerPortion / sellingPriceValue) * 100
      : 0;

  const foodCostPercent =
    sellingPriceValue > 0
      ? (ingredientCostPerPortion / sellingPriceValue) * 100
      : 0;

  const targetMarginValue =
    typeof targetMargin === "number"
      ? Math.min(Math.max(targetMargin, 0), 99.99)
      : 0;

  const suggestedSellingPrice =
    costPerPortion > 0 && targetMarginValue > 0
      ? costPerPortion / (1 - targetMarginValue / 100)
      : 0;

  const deliveryPriceValue =
    typeof deliveryPrice === "number"
      ? deliveryPrice
      : 0;

  const gpPercentValue =
    typeof gpPercent === "number"
      ? Math.min(Math.max(gpPercent, 0), 100)
      : 0;

  const vatPercentValue =
    typeof vatPercent === "number"
      ? Math.max(vatPercent, 0)
      : 0;

  const gpFee =
    deliveryPriceValue > 0
      ? deliveryPriceValue * (gpPercentValue / 100)
      : 0;

  // สมมติว่าราคาขายที่กรอกเป็นราคาที่ลูกค้าจ่ายและ "รวม VAT แล้ว"
  const vatIncludedAmount =
    deliveryPriceValue > 0 && vatPercentValue > 0
      ? deliveryPriceValue -
        deliveryPriceValue / (1 + vatPercentValue / 100)
      : 0;

  const deliveryNetRevenue =
    deliveryPriceValue - gpFee - vatIncludedAmount;

  const deliveryProfit =
    deliveryPriceValue > 0
      ? deliveryNetRevenue - costPerPortion
      : 0;

  const deliveryMargin =
    deliveryPriceValue > 0
      ? (deliveryProfit / deliveryPriceValue) * 100
      : 0;

  const combinedFeeRate =
    gpPercentValue / 100 +
    (vatPercentValue > 0
      ? vatPercentValue / (100 + vatPercentValue)
      : 0);

  const targetMarginRate =
    targetMarginValue / 100;

  const recommendedDeliveryPrice =
    costPerPortion > 0 &&
    1 - combinedFeeRate - targetMarginRate > 0
      ? costPerPortion /
        (1 - combinedFeeRate - targetMarginRate)
      : 0;

  const scenarioPrices = [69, 79, 89, 99];

  const calculateStoreScenario = (price: number) => {
    const profit = price - costPerPortion;
    const margin = price > 0 ? (profit / price) * 100 : 0;

    return {
      profit,
      margin,
    };
  };

  const calculateDeliveryScenario = (price: number) => {
    const gp = price * (gpPercentValue / 100);
    const vat =
      vatPercentValue > 0
        ? price - price / (1 + vatPercentValue / 100)
        : 0;

    const net = price - gp - vat;
    const profit = net - costPerPortion;
    const margin = price > 0 ? (profit / price) * 100 : 0;

    return {
      gp,
      vat,
      net,
      profit,
      margin,
    };
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">

      <main className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-amber-50 p-3 rounded-xl text-amber-600">
                <Calculator className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">ตารางคำนวณต้นทุนอาหาร & ขนม</h1>
                <p className="text-sm text-slate-500">คำนวณต้นทุนวัตถุดิบและค้นหาพิกัดซื้อราคาถูก</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6 overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-100 text-sm font-semibold text-slate-600">
                  <th className="pb-3 w-10">#</th>
                  {/* ขยายความกว้างช่องชื่อวัตถุดิบให้กว้างขึ้นอย่างเหมาะสม */}
                  <th className="pb-3 w-[30%]">รายการวัตถุดิบ</th>
                  <th className="pb-3 w-24 text-right">ราคาซื้อ</th>
                  <th className="pb-3 w-24 text-right">ปริมาณซื้อ</th>
                  <th className="pb-3 w-20 text-right">ทุน/หน่วย</th>
                  <th className="pb-3 w-24 text-right">ใช้ (กรัม)</th>
                  <th className="pb-3 w-24 text-right">ทุนที่ใช้</th>
                  <th className="pb-3 w-16 text-center">ซื้อ</th>
                  <th className="pb-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm">
                {ingredients.map((item, index) => {
                  const costPerUnit = calculateCostPerUnit(item);
                  const usedCost = calculateUsedCost(item);
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3 text-slate-400">{index + 1}</td>
                      <td className="py-3 pr-2">
                        <input
                          type="text"
                          placeholder="ชื่อวัตถุดิบ (เช่น แป้งสาลี)"
                          value={item.name}
                          onChange={(e) => updateIngredient(item.id, "name", e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-700"
                        />
                      </td>
                      <td className="py-3 pr-2">
                        <input
                          type="number"
                          placeholder="0"
                          value={item.packPrice}
                          onChange={(e) => updateIngredient(item.id, "packPrice", e.target.value)}
                          className="w-full text-right px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-700"
                        />
                      </td>
                      <td className="py-3 pr-2">
                        <input
                          type="number"
                          placeholder="0"
                          value={item.packWeight}
                          onChange={(e) => updateIngredient(item.id, "packWeight", e.target.value)}
                          className="w-full text-right px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-700"
                        />
                      </td>
                      <td className="py-3 text-right text-slate-500 font-mono text-xs">
                        {costPerUnit.toFixed(3)}
                      </td>
                      <td className="py-3 pr-2">
                        <input
                          type="number"
                          placeholder="0"
                          value={item.usedWeight}
                          onChange={(e) => updateIngredient(item.id, "usedWeight", e.target.value)}
                          className="w-full text-right px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-700 font-medium text-amber-600"
                        />
                      </td>
                      <td className="py-3 text-right font-semibold text-slate-800 font-mono">
                        {usedCost.toFixed(2)}
                      </td>
                      <td className="py-3 text-center">
                        <button
                          onClick={() => searchShopee(item.name)}
                          disabled={!item.name.trim()}
                          title="ค้นหาพิกัดซื้อวัตถุดิบบบน Shopee"
                          className="p-1.5 text-orange-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition disabled:opacity-30 disabled:hover:bg-transparent"
                        >
                          <Search className="w-4 h-4" />
                        </button>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => removeIngredient(item.id)}
                          className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <button
              onClick={addIngredient}
              className="mt-4 flex items-center gap-2 text-sm font-semibold text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100/70 px-4 py-2 rounded-xl transition"
            >
              <Plus className="w-4 h-4" /> เพิ่มรายการวัตถุดิบ
            </button>
          </div>

          {subscriptionLoading ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6 text-center text-slate-500">
              กำลังตรวจสอบแพ็กเกจ...
            </div>
          ) : permissions.canUseAdvancedCost ? (
            <>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="bg-slate-100 p-2.5 rounded-xl text-slate-700">
                <Calculator className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-slate-800">ต้นทุนเพิ่มเติม</h2>
                <p className="text-sm text-slate-500">
                  เพิ่มต้นทุนที่ไม่ใช่วัตถุดิบ เพื่อให้เห็นต้นทุนจริงของสินค้า
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <AdvancedCostInput
                icon={<Package className="w-4 h-4" />}
                label="Packaging / บรรจุภัณฑ์"
                description="กล่อง ถ้วย ฝา ถุง สติ๊กเกอร์ ช้อนส้อม ฯลฯ"
                value={packagingCost}
                onChange={setPackagingCost}
              />

              <AdvancedCostInput
                icon={<Users className="w-4 h-4" />}
                label="Labor / ค่าแรง"
                description="ค่าแรงที่ต้องการคิดรวมในสูตรหรือ Batch นี้"
                value={laborCost}
                onChange={setLaborCost}
              />

              <AdvancedCostInput
                icon={<Flame className="w-4 h-4" />}
                label="Utility / แก๊ส-ไฟ-น้ำ"
                description="ค่าแก๊ส ค่าไฟ ค่าน้ำ หรือค่าใช้จ่ายในการผลิต"
                value={utilityCost}
                onChange={setUtilityCost}
              />

              <AdvancedCostInput
                icon={<Building2 className="w-4 h-4" />}
                label="Overhead / ค่าใช้จ่ายอื่น"
                description="ค่าเช่า ค่าเสื่อม ค่าใช้จ่ายแฝง หรือค่าใช้จ่ายอื่น"
                value={overheadCost}
                onChange={setOverheadCost}
              />
            </div>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <CostSummaryMini
                label="ต้นทุนวัตถุดิบ"
                value={totalIngredientCost}
              />

              <CostSummaryMini
                label="ต้นทุนเพิ่มเติม"
                value={extraCost}
              />

              <CostSummaryMini
                label="ต้นทุนรวมจริง"
                value={totalCost}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
              <h2 className="font-bold text-slate-800 border-b pb-2">สรุปผลลัพธ์ (ได้จริง)</h2>
              
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">ปริมาณที่ได้จริงหลังผสม (กรัม)</label>
                <input
                  type="number"
                  placeholder="เช่น 1000"
                  value={actualYield}
                  onChange={(e) => setActualYield(e.target.value === "" ? "" : parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">ปริมาณนำไปใช้ต่อชิ้น/ชุด (กรัม)</label>
                <input
                  type="number"
                  placeholder="เช่น 50"
                  value={portionSize}
                  onChange={(e) => setPortionSize(e.target.value === "" ? "" : parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-700"
                />
              </div>
            </div>

            <div className="bg-amber-500 text-white p-6 rounded-2xl shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-amber-100 text-xs font-semibold uppercase tracking-wider">รวมต้นทุนทั้งหมด</span>
                <div className="text-3xl font-extrabold font-mono mt-1">{totalCost.toFixed(2)} <span className="text-lg font-normal">บาท</span></div>
              </div>

              <div className="border-t border-amber-400/50 pt-4 mt-4 grid grid-cols-2 gap-4">
                <div>
                  <span className="text-amber-100 text-xs">ต้นทุนต่อกรัม</span>
                  <p className="text-lg font-bold font-mono">{costPerGramActual.toFixed(3)} ฿</p>
                </div>
                <div>
                  <span className="text-amber-100 text-xs">ต้นทุนต่อชิ้น/ชุด</span>
                  <p className="text-lg font-bold font-mono">{costPerPortion.toFixed(2)} ฿</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="bg-emerald-50 p-2.5 rounded-xl text-emerald-600">
                <BadgeDollarSign className="w-5 h-5" />
              </div>

              <div>
                <h2 className="font-bold text-slate-800">ราคาขายและกำไร</h2>
                <p className="text-sm text-slate-500">
                  ทดลองราคาขายจริง และดูว่ากำไรกับ Food Cost อยู่ที่เท่าไร
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
              <div className="border border-slate-200 rounded-2xl p-4">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                  <BadgeDollarSign className="w-4 h-4" />
                  ราคาขายต่อชิ้น / ชุด
                </label>

                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="เช่น 89"
                    value={sellingPrice}
                    onChange={(e) =>
                      setSellingPrice(
                        e.target.value === ""
                          ? ""
                          : parseFloat(e.target.value) || 0
                      )
                    }
                    className="w-full px-3 py-2 pr-12 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-700"
                  />

                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                    บาท
                  </span>
                </div>
              </div>

              <div className="border border-slate-200 rounded-2xl p-4">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                  <Percent className="w-4 h-4" />
                  กำไรเป้าหมาย (Profit Margin)
                </label>

                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="99.99"
                    step="0.1"
                    placeholder="เช่น 30"
                    value={targetMargin}
                    onChange={(e) =>
                      setTargetMargin(
                        e.target.value === ""
                          ? ""
                          : parseFloat(e.target.value) || 0
                      )
                    }
                    className="w-full px-3 py-2 pr-10 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-700"
                  />

                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                    %
                  </span>
                </div>

                <p className="text-xs text-slate-400 mt-2">
                  ระบบจะคำนวณราคาขายขั้นต่ำที่ทำให้ได้ Margin ตามเป้าหมาย
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
              <ProfitSummaryCard
                icon={<BadgeDollarSign className="w-4 h-4" />}
                label="กำไรต่อชิ้น / ชุด"
                value={
                  sellingPriceValue > 0
                    ? `${profitPerPortion.toFixed(2)} บาท`
                    : "-"
                }
                tone={
                  sellingPriceValue > 0 && profitPerPortion < 0
                    ? "danger"
                    : "default"
                }
              />

              <ProfitSummaryCard
                icon={<TrendingUp className="w-4 h-4" />}
                label="Profit Margin"
                value={
                  sellingPriceValue > 0
                    ? `${profitMargin.toFixed(1)}%`
                    : "-"
                }
                tone={
                  sellingPriceValue > 0 && profitMargin < 0
                    ? "danger"
                    : "default"
                }
              />

              <ProfitSummaryCard
                icon={<Percent className="w-4 h-4" />}
                label="Food Cost %"
                value={
                  sellingPriceValue > 0
                    ? `${foodCostPercent.toFixed(1)}%`
                    : "-"
                }
              />

              <ProfitSummaryCard
                icon={<Calculator className="w-4 h-4" />}
                label="ราคาขายแนะนำ"
                value={
                  suggestedSellingPrice > 0
                    ? `${suggestedSellingPrice.toFixed(2)} บาท`
                    : "-"
                }
              />
            </div>

            {sellingPriceValue > 0 && (
              <div
                className={`mt-4 rounded-xl px-4 py-3 text-sm ${
                  profitPerPortion >= 0
                    ? "bg-emerald-50 border border-emerald-100 text-emerald-700"
                    : "bg-red-50 border border-red-100 text-red-600"
                }`}
              >
                {profitPerPortion >= 0
                  ? `ขาย ${sellingPriceValue.toFixed(2)} บาท เหลือกำไรประมาณ ${profitPerPortion.toFixed(2)} บาทต่อชิ้น/ชุด ก่อนค่าธรรมเนียม Delivery และ VAT`
                  : `ราคาขาย ${sellingPriceValue.toFixed(2)} บาท ต่ำกว่าต้นทุนรวมจริงอยู่ ${Math.abs(profitPerPortion).toFixed(2)} บาทต่อชิ้น/ชุด`}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="bg-blue-50 p-2.5 rounded-xl text-blue-600">
                <Truck className="w-5 h-5" />
              </div>

              <div>
                <h2 className="font-bold text-slate-800">
                  Delivery / GP / VAT
                </h2>

                <p className="text-sm text-slate-500">
                  คำนวณกำไรหลังหักค่าธรรมเนียมแพลตฟอร์มและ VAT
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
              <div className="border border-slate-200 rounded-2xl p-4">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                  <BadgeDollarSign className="w-4 h-4" />
                  ราคาขาย Delivery
                </label>

                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="เช่น 109"
                    value={deliveryPrice}
                    onChange={(e) =>
                      setDeliveryPrice(
                        e.target.value === ""
                          ? ""
                          : parseFloat(e.target.value) || 0
                      )
                    }
                    className="w-full px-3 py-2 pr-12 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700"
                  />

                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                    บาท
                  </span>
                </div>
              </div>

              <div className="border border-slate-200 rounded-2xl p-4">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                  <Percent className="w-4 h-4" />
                  GP Platform
                </label>

                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    placeholder="เช่น 30"
                    value={gpPercent}
                    onChange={(e) =>
                      setGpPercent(
                        e.target.value === ""
                          ? ""
                          : parseFloat(e.target.value) || 0
                      )
                    }
                    className="w-full px-3 py-2 pr-10 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700"
                  />

                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                    %
                  </span>
                </div>
              </div>

              <div className="border border-slate-200 rounded-2xl p-4">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                  <ReceiptText className="w-4 h-4" />
                  VAT
                </label>

                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="7"
                    value={vatPercent}
                    onChange={(e) =>
                      setVatPercent(
                        e.target.value === ""
                          ? ""
                          : parseFloat(e.target.value) || 0
                      )
                    }
                    className="w-full px-3 py-2 pr-10 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700"
                  />

                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                    %
                  </span>
                </div>

                <p className="text-xs text-slate-400 mt-2">
                  คิดจากราคาที่ลูกค้าจ่ายแบบรวม VAT แล้ว
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
              <ProfitSummaryCard
                icon={<Percent className="w-4 h-4" />}
                label="ค่า GP"
                value={
                  deliveryPriceValue > 0
                    ? `${gpFee.toFixed(2)} บาท`
                    : "-"
                }
              />

              <ProfitSummaryCard
                icon={<ReceiptText className="w-4 h-4" />}
                label="VAT ในราคาขาย"
                value={
                  deliveryPriceValue > 0
                    ? `${vatIncludedAmount.toFixed(2)} บาท`
                    : "-"
                }
              />

              <ProfitSummaryCard
                icon={<BadgeDollarSign className="w-4 h-4" />}
                label="รายรับสุทธิหลัง GP/VAT"
                value={
                  deliveryPriceValue > 0
                    ? `${deliveryNetRevenue.toFixed(2)} บาท`
                    : "-"
                }
              />

              <ProfitSummaryCard
                icon={<TrendingUp className="w-4 h-4" />}
                label="กำไร Delivery"
                value={
                  deliveryPriceValue > 0
                    ? `${deliveryProfit.toFixed(2)} บาท`
                    : "-"
                }
                tone={
                  deliveryPriceValue > 0 && deliveryProfit < 0
                    ? "danger"
                    : "default"
                }
              />

              <ProfitSummaryCard
                icon={<Calculator className="w-4 h-4" />}
                label="ราคา Delivery แนะนำ"
                value={
                  recommendedDeliveryPrice > 0
                    ? `${recommendedDeliveryPrice.toFixed(2)} บาท`
                    : "-"
                }
              />
            </div>

            {deliveryPriceValue > 0 && (
              <div
                className={`mt-4 rounded-xl px-4 py-3 text-sm ${
                  deliveryProfit >= 0
                    ? "bg-blue-50 border border-blue-100 text-blue-700"
                    : "bg-red-50 border border-red-100 text-red-600"
                }`}
              >
                {deliveryProfit >= 0
                  ? `ขาย Delivery ${deliveryPriceValue.toFixed(2)} บาท หลังหัก GP ${gpPercentValue.toFixed(1)}% และ VAT ${vatPercentValue.toFixed(1)}% เหลือกำไรประมาณ ${deliveryProfit.toFixed(2)} บาทต่อชิ้น/ชุด (Margin ${deliveryMargin.toFixed(1)}%)`
                  : `ราคาขาย Delivery ${deliveryPriceValue.toFixed(2)} บาท ขาดทุนประมาณ ${Math.abs(deliveryProfit).toFixed(2)} บาทต่อชิ้น/ชุด หลังหัก GP และ VAT`}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6 overflow-x-auto">
            <div className="flex items-center gap-3 mb-5">
              <div className="bg-violet-50 p-2.5 rounded-xl text-violet-600">
                <BarChart3 className="w-5 h-5" />
              </div>

              <div>
                <h2 className="font-bold text-slate-800">
                  Profit Scenario
                </h2>

                <p className="text-sm text-slate-500">
                  เปรียบเทียบกำไรจากราคาขายหลายระดับ ทั้งหน้าร้านและ Delivery
                </p>
              </div>
            </div>

            <table className="w-full min-w-[850px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="text-left py-3 pr-4">ราคาขาย</th>
                  <th className="text-right py-3 px-3">กำไรหน้าร้าน</th>
                  <th className="text-right py-3 px-3">Margin หน้าร้าน</th>
                  <th className="text-right py-3 px-3">GP</th>
                  <th className="text-right py-3 px-3">VAT</th>
                  <th className="text-right py-3 px-3">กำไร Delivery</th>
                  <th className="text-right py-3 pl-3">Margin Delivery</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {scenarioPrices.map((price) => {
                  const store = calculateStoreScenario(price);
                  const delivery = calculateDeliveryScenario(price);

                  return (
                    <tr key={price}>
                      <td className="py-3 pr-4 font-bold text-slate-800">
                        {price.toFixed(2)} บาท
                      </td>

                      <td
                        className={`py-3 px-3 text-right font-semibold ${
                          store.profit < 0
                            ? "text-red-500"
                            : "text-emerald-600"
                        }`}
                      >
                        {store.profit.toFixed(2)}
                      </td>

                      <td className="py-3 px-3 text-right text-slate-600">
                        {store.margin.toFixed(1)}%
                      </td>

                      <td className="py-3 px-3 text-right text-slate-600">
                        {delivery.gp.toFixed(2)}
                      </td>

                      <td className="py-3 px-3 text-right text-slate-600">
                        {delivery.vat.toFixed(2)}
                      </td>

                      <td
                        className={`py-3 px-3 text-right font-semibold ${
                          delivery.profit < 0
                            ? "text-red-500"
                            : "text-emerald-600"
                        }`}
                      >
                        {delivery.profit.toFixed(2)}
                      </td>

                      <td className="py-3 pl-3 text-right text-slate-600">
                        {delivery.margin.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <p className="text-xs text-slate-400 mt-4">
              ตาราง Scenario ใช้ GP และ VAT ที่กรอกด้านบน และใช้ต้นทุนรวมจริงต่อชิ้น/ชุดเป็นฐานคำนวณ
            </p>
          </div>
            </>
          ) : (
            <section className="bg-white border border-amber-200 rounded-3xl p-6 sm:p-8 mb-6 text-center shadow-sm">
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
                <Crown className="w-6 h-6" />
              </div>

              <h2 className="text-xl font-extrabold text-slate-800 mt-4">
                Advanced Cost
              </h2>

              <p className="text-sm text-slate-500 mt-2 max-w-xl mx-auto">
                คำนวณต้นทุนเพิ่มเติม ราคาขาย กำไร GP / VAT และ Profit Scenario ได้ในแพ็กเกจ Pro หรือ Business
              </p>

              <button
                type="button"
                onClick={() =>
                  router.push(
                    "/pricing"
                  )
                }
                className="mt-5 bg-amber-500 hover:bg-amber-600 text-white font-bold px-5 py-3 rounded-xl text-sm"
              >
                ดูแพ็กเกจ Pro
              </button>
            </section>
          )}


          <div className="bg-orange-50 border border-orange-100 p-4 rounded-2xl flex items-center justify-between text-slate-700 text-sm">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-orange-500" />
              <span>ค้นหาวัตถุดิบและอุปกรณ์ทำขนมราคาถูกบน Shopee</span>
            </div>
            <button
              onClick={() => window.open(MY_AFFILIATE_LINK, "_blank")}
              className="bg-orange-500 hover:bg-orange-600 text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-sm transition"
            >
              ไปที่ Shopee
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

function AdvancedCostInput({
  icon,
  label,
  description,
  value,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  value: number | "";
  onChange: (value: number | "") => void;
}) {
  return (
    <div className="border border-slate-200 rounded-2xl p-4">
      <div className="flex items-center gap-2 text-slate-700">
        {icon}
        <span className="font-semibold text-sm">{label}</span>
      </div>

      <p className="text-xs text-slate-400 mt-1 min-h-[32px]">
        {description}
      </p>

      <div className="relative mt-3">
        <input
          type="number"
          min="0"
          step="0.01"
          placeholder="0.00"
          value={value}
          onChange={(e) =>
            onChange(
              e.target.value === ""
                ? ""
                : parseFloat(e.target.value) || 0
            )
          }
          className="w-full px-3 py-2 pr-12 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-700"
        />

        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
          บาท
        </span>
      </div>
    </div>
  );
}

function CostSummaryMini({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="font-bold text-slate-800 mt-1">
        {value.toFixed(2)} บาท
      </p>
    </div>
  );
}

function ProfitSummaryCard({
  icon,
  label,
  value,
  tone = "default",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: "default" | "danger";
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        tone === "danger"
          ? "bg-red-50 border-red-100"
          : "bg-slate-50 border-slate-100"
      }`}
    >
      <div
        className={`flex items-center gap-2 text-xs ${
          tone === "danger"
            ? "text-red-500"
            : "text-slate-500"
        }`}
      >
        {icon}
        <span>{label}</span>
      </div>

      <p
        className={`font-bold mt-2 ${
          tone === "danger"
            ? "text-red-600"
            : "text-slate-800"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

