"use client";

import React, { useState } from "react";
import Navbar from "@/components/navbar";
import { Plus, Trash2, Calculator, ShoppingBag, Search } from "lucide-react";

interface Ingredient {
  id: string;
  name: string;
  packPrice: number | "";
  packWeight: number | "";
  usedWeight: number | "";
}

export default function CostPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { id: "1", name: "", packPrice: "", packWeight: "", usedWeight: "" },
    { id: "2", name: "", packPrice: "", packWeight: "", usedWeight: "" },
  ]);
  const [actualYield, setActualYield] = useState<number | "">("");
  const [portionSize, setPortionSize] = useState<number | "">("");

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

  const totalCost = ingredients.reduce((sum, item) => sum + calculateUsedCost(item), 0);
  const costPerGramActual = typeof actualYield === "number" && actualYield > 0 ? totalCost / actualYield : 0;
  const costPerPortion = typeof portionSize === "number" ? costPerGramActual * portionSize : 0;

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <Navbar />

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
            <table className="w-full text-left border-collapse min-w-[650px]">
              <thead>
                <tr className="border-b border-slate-100 text-sm font-semibold text-slate-600">
                  <th className="pb-3 w-10">#</th>
                  <th className="pb-3">รายการวัตถุดิบ</th>
                  <th className="pb-3 w-28 text-right">ราคาซื้อ (บาท)</th>
                  <th className="pb-3 w-28 text-right">ปริมาณซื้อ (กรัม)</th>
                  <th className="pb-3 w-24 text-right">ต้นทุน/หน่วย</th>
                  <th className="pb-3 w-28 text-right">ปริมาณใช้ (กรัม)</th>
                  <th className="pb-3 w-28 text-right">ต้นทุนที่ใช้ (บาท)</th>
                  <th className="pb-3 w-20 text-center">ซื้อของ</th>
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
                          placeholder="ชื่อวัตถุดิบ"
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
                      <td className="py-3 text-right text-slate-500 font-mono">
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
                          title="ค้นหาพิกัดซื้อวัตถุดิบบน Shopee"
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