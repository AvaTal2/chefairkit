"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useRouter, useSearchParams } from "next/navigation";

import {
  ArrowLeft,
  Printer,
  ClipboardCheck,
  Factory,
  User,
  CalendarDays,
  FileText,
  History,
} from "lucide-react";

import { supabase } from "@/lib/supabase/client";

type ProductionIngredient = {
  id: string;
  ingredient_id: string | null;
  ingredient_name: string;
  quantity: number;
  unit: string;

  productionQuantity: number;

  prepYieldPercent: number;
  cookingYieldPercent: number;
  overallYieldPercent: number;

  beforeCookingQuantity: number;
  rawPurchaseQuantity: number;
};

type ProductionPlanItem = {
  planId: string;
  recipeId: string;
  recipeName: string;

  mode: "yield" | "servings";

  targetAmount: number;
  targetUnit: string;

  factor: number;

  fullBatches?: number;
  partialBatchPercent?: number;
  status?: "planned" | "in_progress" | "done";

  productionYield: number | null;
  productionServings: number | null;

  ingredients: ProductionIngredient[];
};

type CombinedIngredient = {
  key: string;
  ingredient_id: string | null;
  ingredient_name: string;

  recipeQuantity: number;
  rawQuantity: number;

  unit: string;

  pack_quantity: number | null;
  pack_unit: string | null;
  pack_price: number | null;

  packsNeeded: number | null;
  purchaseQuantity: number | null;
  leftover: number | null;
  purchaseCost: number | null;
};

type ProductionSheetData = {
  createdAt: number;

  productionPlan: ProductionPlanItem[];
  combinedIngredients: CombinedIngredient[];

  planUsedCost: number;
  planPurchaseCost: number;

  source?: "current" | "history";
  runId?: string;
  runTitle?: string;
  runNotes?: string | null;
  savedProductionDate?: string | null;
};

type ActualIngredientData = {
  rawIssued: string;
  afterPrep: string;
  afterCook: string;
};

const formatNumber = (value: number) => {
  if (!Number.isFinite(value)) return "-";

  return new Intl.NumberFormat("th-TH", {
    maximumFractionDigits: 3,
  }).format(value);
};

const displayUnit = (
  unit: string | null | undefined
) => {
  const map: Record<string, string> = {
    g: "กรัม",
    kg: "กก.",
    ml: "มล.",
    l: "ลิตร",
    piece: "ชิ้น",
    pack: "แพ็ก",
    bottle: "ขวด",
    bag: "ถุง",
    box: "กล่อง",
    tsp: "ช้อนชา",
    tbsp: "ช้อนโต๊ะ",
    cup: "ถ้วย",
  };

  if (!unit) return "";

  return map[unit] || unit;
};

const getToday = () => {
  const now = new Date();

  const year = now.getFullYear();

  const month = String(
    now.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    now.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export default function ProductionSheetPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const runId =
    searchParams.get("run");

  const [data, setData] =
    useState<ProductionSheetData | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [productionDate, setProductionDate] =
    useState(getToday());

  const [batchNumber, setBatchNumber] =
    useState("");

  const [responsiblePerson, setResponsiblePerson] =
    useState("");

  const [notes, setNotes] =
    useState("");

  const [qcStatus, setQcStatus] =
    useState<
      "pending" | "passed" | "failed"
    >("pending");

  const [qcNotes, setQcNotes] =
    useState("");

  const [
    actualIngredients,
    setActualIngredients,
  ] = useState<
    Record<
      string,
      ActualIngredientData
    >
  >({});

  useEffect(() => {
    const loadSheetData =
      async () => {
        setLoading(true);

        try {
          /*
           * ถ้ามี ?run=<id>
           * ให้เปิด Snapshot จาก Production History
           */
          if (runId) {
            const {
              data: { user },
            } =
              await supabase.auth.getUser();

            if (!user) {
              sessionStorage.setItem(
                "chefair_after_login_redirect",
                `/production/sheet?run=${runId}`
              );

              router.push(
                "/login"
              );

              return;
            }

            const {
              data: runData,
              error: runError,
            } =
              await supabase
                .from(
                  "production_runs"
                )
                .select("*")
                .eq(
                  "id",
                  runId
                )
                .eq(
                  "user_id",
                  user.id
                )
                .single();

            if (
              runError ||
              !runData
            ) {
              console.error(
                "Load Production Run Error:",
                runError
              );

              setLoading(false);
              return;
            }

            const {
              data: itemData,
              error: itemError,
            } =
              await supabase
                .from(
                  "production_run_items"
                )
                .select("*")
                .eq(
                  "run_id",
                  runId
                )
                .eq(
                  "user_id",
                  user.id
                )
                .order(
                  "created_at",
                  {
                    ascending:
                      true,
                  }
                );

            if (itemError) {
              console.error(
                "Load Production Run Items Error:",
                itemError
              );

              setLoading(false);
              return;
            }

            const productionPlan =
              (
                itemData ||
                []
              ).map(
                (item) => ({
                  planId:
                    item.id,

                  recipeId:
                    item.recipe_id ||
                    "",

                  recipeName:
                    item.recipe_name,

                  mode:
                    item.mode,

                  targetAmount:
                    Number(
                      item.target_amount ||
                        0
                    ),

                  targetUnit:
                    item.target_unit ||
                    "",

                  factor:
                    Number(
                      item.factor ||
                        0
                    ),

                  fullBatches:
                    Number(
                      item.full_batches ||
                        0
                    ),

                  partialBatchPercent:
                    Number(
                      item.partial_batch_percent ||
                        0
                    ),

                  status:
                    item.status,

                  productionYield:
                    item.production_yield ===
                    null
                      ? null
                      : Number(
                          item.production_yield
                        ),

                  productionServings:
                    item.production_servings ===
                    null
                      ? null
                      : Number(
                          item.production_servings
                        ),

                  ingredients:
                    Array.isArray(
                      item.ingredients
                    )
                      ? item.ingredients
                      : [],
                })
              ) as ProductionPlanItem[];

            const parsed: ProductionSheetData =
              {
                createdAt:
                  new Date(
                    runData.created_at
                  ).getTime(),

                productionPlan,

                combinedIngredients:
                  Array.isArray(
                    runData.shopping_list
                  )
                    ? runData.shopping_list
                    : [],

                planUsedCost:
                  Number(
                    runData.total_used_cost ||
                      0
                  ),

                planPurchaseCost:
                  Number(
                    runData.total_purchase_cost ||
                      0
                  ),

                source:
                  "history",

                runId:
                  runData.id,

                runTitle:
                  runData.title,

                runNotes:
                  runData.notes,

                savedProductionDate:
                  runData.production_date,
              };

            setData(
              parsed
            );

            if (
              runData.production_date
            ) {
              setProductionDate(
                runData.production_date
              );
            }

            if (
              runData.notes
            ) {
              setNotes(
                runData.notes
              );
            }

            const initialActuals: Record<
              string,
              ActualIngredientData
            > = {};

            parsed.combinedIngredients.forEach(
              (item) => {
                initialActuals[
                  item.key
                ] = {
                  rawIssued: "",
                  afterPrep: "",
                  afterCook: "",
                };
              }
            );

            setActualIngredients(
              initialActuals
            );

            setLoading(false);
            return;
          }

          /*
           * ไม่มี runId
           * ใช้ Production Plan ปัจจุบันจาก sessionStorage ตามเดิม
           */
          const raw =
            sessionStorage.getItem(
              "chefair_production_sheet"
            );

          if (!raw) {
            setLoading(false);
            return;
          }

          const parsed =
            JSON.parse(
              raw
            ) as ProductionSheetData;

          setData({
            ...parsed,
            source:
              "current",
          });

          const initialActuals: Record<
            string,
            ActualIngredientData
          > = {};

          parsed.combinedIngredients.forEach(
            (item) => {
              initialActuals[
                item.key
              ] = {
                rawIssued: "",
                afterPrep: "",
                afterCook: "",
              };
            }
          );

          setActualIngredients(
            initialActuals
          );
        } catch (error) {
          console.error(
            "Production Sheet Error:",
            error
          );
        }

        setLoading(false);
      };

    loadSheetData();
  }, [
    runId,
    router,
  ]);

  const updateActual = (
    key: string,
    field: keyof ActualIngredientData,
    value: string
  ) => {
    setActualIngredients(
      (current) => ({
        ...current,

        [key]: {
          ...(current[key] || {
            rawIssued: "",
            afterPrep: "",
            afterCook: "",
          }),

          [field]: value,
        },
      })
    );
  };

  const actualYieldRows =
    useMemo(() => {
      if (!data) return [];

      return data.combinedIngredients.map(
        (item) => {
          const actual =
            actualIngredients[
              item.key
            ];

          const rawIssued =
            Number(
              actual?.rawIssued ||
                0
            );

          const afterPrep =
            Number(
              actual?.afterPrep ||
                0
            );

          const afterCook =
            Number(
              actual?.afterCook ||
                0
            );

          const actualPrepYield =
            rawIssued > 0 &&
            afterPrep > 0
              ? (afterPrep /
                  rawIssued) *
                100
              : null;

          const actualCookingYield =
            afterPrep > 0 &&
            afterCook > 0
              ? (afterCook /
                  afterPrep) *
                100
              : null;

          const actualOverallYield =
            rawIssued > 0 &&
            afterCook > 0
              ? (afterCook /
                  rawIssued) *
                100
              : null;

          return {
            ...item,
            actual,
            actualPrepYield,
            actualCookingYield,
            actualOverallYield,
          };
        }
      );
    }, [
      data,
      actualIngredients,
    ]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center text-slate-500">
            กำลังโหลด Production Sheet...
          </div>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center">
            <Factory className="w-10 h-10 text-slate-300 mx-auto" />

            <h1 className="font-bold text-slate-800 text-xl mt-4">
              ยังไม่มีแผนการผลิต
            </h1>

            <p className="text-sm text-slate-500 mt-2">
              กรุณาสร้างแผนจาก Production Center ก่อน
            </p>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/production"
                )
              }
              className="mt-5 bg-amber-500 hover:bg-amber-600 text-white font-bold px-5 py-2.5 rounded-xl"
            >
              กลับ Production Center
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 print:bg-white print:px-0 print:py-0">
      <div className="max-w-7xl mx-auto">

        {/* ACTIONS */}

        <div className="flex flex-col sm:flex-row justify-between gap-3 mb-6 print:hidden">
          <button
            type="button"
            onClick={() =>
              router.push(
                data.source ===
                  "history"
                  ? "/production/history"
                  : "/production"
              )
            }
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-amber-600"
          >
            <ArrowLeft className="w-4 h-4" />
            {data.source ===
            "history"
              ? "กลับ Production History"
              : "กลับ Production Center"}
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white font-bold px-5 py-2.5 rounded-xl text-sm"
          >
            <Printer className="w-4 h-4" />
            พิมพ์ Production Sheet
          </button>
        </div>

        {/* DOCUMENT */}

        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden print:border-0 print:shadow-none print:rounded-none">

          {/* HEADER */}

          <div className="p-6 sm:p-8 border-b border-slate-200">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-5">
              <div>
                <div className="flex items-center gap-3">
                  <div className="bg-amber-500 text-white p-3 rounded-2xl">
                    <ClipboardCheck className="w-6 h-6" />
                  </div>

                  <div>
                    <p className="text-xs font-bold text-amber-600 uppercase">
                      ChefAir Kit
                    </p>

                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800">
                      Production Sheet
                    </h1>
                  </div>
                </div>

                <p className="text-sm text-slate-500 mt-3">
                  {data.runTitle ||
                    "ใบควบคุมและบันทึกการผลิต"}
                </p>

                {data.source ===
                  "history" && (
                  <div className="mt-3 inline-flex items-center gap-2 bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full text-xs font-bold print:hidden">
                    <History className="w-3.5 h-3.5" />
                    เปิดจาก Production History
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-[320px]">
                <div>
                  <label className="text-xs text-slate-400 font-semibold">
                    วันที่ผลิต
                  </label>

                  <div className="relative mt-1">
                    <CalendarDays className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 print:hidden" />

                    <input
                      type="date"
                      value={productionDate}
                      onChange={(e) =>
                        setProductionDate(
                          e.target.value
                        )
                      }
                      className="w-full border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-sm print:border-0 print:p-0"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-400 font-semibold">
                    Batch / Lot No.
                  </label>

                  <input
                    value={batchNumber}
                    onChange={(e) =>
                      setBatchNumber(
                        e.target.value
                      )
                    }
                    placeholder="เช่น 260829-01"
                    className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm print:border-0 print:p-0"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs text-slate-400 font-semibold">
                    ผู้รับผิดชอบ
                  </label>

                  <div className="relative mt-1">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 print:hidden" />

                    <input
                      value={
                        responsiblePerson
                      }
                      onChange={(e) =>
                        setResponsiblePerson(
                          e.target.value
                        )
                      }
                      placeholder="ชื่อผู้รับผิดชอบการผลิต"
                      className="w-full border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-sm print:border-0 print:p-0"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* PRODUCTION PLAN */}

          <section className="p-6 sm:p-8 border-b border-slate-200">
            <h2 className="font-extrabold text-slate-800 text-lg mb-4">
              1. รายการผลิต
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[750px] text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left px-4 py-3">
                      สูตร
                    </th>

                    <th className="text-right px-4 py-3">
                      จำนวนสูตร
                    </th>

                    <th className="text-right px-4 py-3">
                      เป้าหมาย
                    </th>

                    <th className="text-right px-4 py-3">
                      Yield รวม
                    </th>

                    <th className="text-right px-4 py-3">
                      จำนวนชิ้น/เสิร์ฟ
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {data.productionPlan.map(
                    (item) => (
                      <tr
                        key={
                          item.planId
                        }
                      >
                        <td className="px-4 py-4 font-bold text-slate-700">
                          {
                            item.recipeName
                          }
                        </td>

                        <td className="px-4 py-4 text-right">
                          {formatNumber(
                            item.factor
                          )}
                        </td>

                        <td className="px-4 py-4 text-right">
                          {formatNumber(
                            item.targetAmount
                          )}{" "}
                          {
                            item.targetUnit
                          }
                        </td>

                        <td className="px-4 py-4 text-right">
                          {item.productionYield !==
                          null
                            ? formatNumber(
                                item.productionYield
                              )
                            : "-"}
                        </td>

                        <td className="px-4 py-4 text-right">
                          {item.productionServings !==
                          null
                            ? formatNumber(
                                item.productionServings
                              )
                            : "-"}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* PREP LIST */}

          <section className="p-6 sm:p-8 border-b border-slate-200">
            <h2 className="font-extrabold text-slate-800 text-lg">
              2. ใบเตรียมวัตถุดิบ
            </h2>

            <p className="text-xs text-slate-500 mt-1 mb-4">
              ปริมาณดิบที่ระบบคำนวณหลังชดเชย Yield / Loss
            </p>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[950px] text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left px-4 py-3">
                      วัตถุดิบ
                    </th>

                    <th className="text-right px-4 py-3">
                      สูตรต้องใช้
                    </th>

                    <th className="text-right px-4 py-3">
                      ต้องเตรียมดิบ
                    </th>

                    <th className="text-right px-4 py-3">
                      ขนาดแพ็ก
                    </th>

                    <th className="text-right px-4 py-3">
                      จำนวนแพ็ก
                    </th>

                    <th className="text-right px-4 py-3">
                      งบซื้อ
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {data.combinedIngredients.map(
                    (item) => (
                      <tr key={item.key}>
                        <td className="px-4 py-4 font-semibold text-slate-700">
                          {
                            item.ingredient_name
                          }
                        </td>

                        <td className="px-4 py-4 text-right">
                          {formatNumber(
                            item.recipeQuantity
                          )}{" "}
                          {displayUnit(
                            item.unit
                          )}
                        </td>

                        <td className="px-4 py-4 text-right font-bold text-amber-600">
                          {formatNumber(
                            item.rawQuantity
                          )}{" "}
                          {displayUnit(
                            item.unit
                          )}
                        </td>

                        <td className="px-4 py-4 text-right">
                          {item.pack_quantity
                            ? `${formatNumber(
                                item.pack_quantity
                              )} ${displayUnit(
                                item.pack_unit
                              )}`
                            : "-"}
                        </td>

                        <td className="px-4 py-4 text-right">
                          {item.packsNeeded !==
                          null
                            ? item.packsNeeded
                            : "-"}
                        </td>

                        <td className="px-4 py-4 text-right">
                          {item.purchaseCost !==
                          null
                            ? `${item.purchaseCost.toFixed(
                                2
                              )} บาท`
                            : "-"}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* ACTUAL PRODUCTION */}

          <section className="p-6 sm:p-8 border-b border-slate-200">
            <h2 className="font-extrabold text-slate-800 text-lg">
              3. บันทึกผลผลิตจริง
            </h2>

            <p className="text-xs text-slate-500 mt-1 mb-4">
              ให้พนักงานกรอกน้ำหนักจริงแต่ละขั้นตอน
              ระบบจะคำนวณ Actual Yield ให้
            </p>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left px-4 py-3">
                      วัตถุดิบ
                    </th>

                    <th className="text-right px-4 py-3">
                      ดิบที่ควรใช้
                    </th>

                    <th className="text-right px-4 py-3">
                      เบิกจริง
                    </th>

                    <th className="text-right px-4 py-3">
                      หลังเตรียม
                    </th>

                    <th className="text-right px-4 py-3">
                      หลังปรุง
                    </th>

                    <th className="text-right px-4 py-3">
                      Prep Yield จริง
                    </th>

                    <th className="text-right px-4 py-3">
                      Cooking Yield จริง
                    </th>

                    <th className="text-right px-4 py-3">
                      Overall Yield จริง
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {actualYieldRows.map(
                    (item) => (
                      <tr key={item.key}>
                        <td className="px-4 py-4 font-semibold text-slate-700">
                          {
                            item.ingredient_name
                          }
                        </td>

                        <td className="px-4 py-4 text-right">
                          {formatNumber(
                            item.rawQuantity
                          )}{" "}
                          {displayUnit(
                            item.unit
                          )}
                        </td>

                        <td className="px-2 py-3">
                          <input
                            type="number"
                            min="0"
                            step="0.001"
                            value={
                              item.actual
                                ?.rawIssued ||
                              ""
                            }
                            onChange={(e) =>
                              updateActual(
                                item.key,
                                "rawIssued",
                                e.target
                                  .value
                              )
                            }
                            className="w-full min-w-[100px] border border-slate-200 rounded-lg px-2 py-2 text-right print:border-b print:border-x-0 print:border-t-0 print:rounded-none"
                          />
                        </td>

                        <td className="px-2 py-3">
                          <input
                            type="number"
                            min="0"
                            step="0.001"
                            value={
                              item.actual
                                ?.afterPrep ||
                              ""
                            }
                            onChange={(e) =>
                              updateActual(
                                item.key,
                                "afterPrep",
                                e.target
                                  .value
                              )
                            }
                            className="w-full min-w-[100px] border border-slate-200 rounded-lg px-2 py-2 text-right print:border-b print:border-x-0 print:border-t-0 print:rounded-none"
                          />
                        </td>

                        <td className="px-2 py-3">
                          <input
                            type="number"
                            min="0"
                            step="0.001"
                            value={
                              item.actual
                                ?.afterCook ||
                              ""
                            }
                            onChange={(e) =>
                              updateActual(
                                item.key,
                                "afterCook",
                                e.target
                                  .value
                              )
                            }
                            className="w-full min-w-[100px] border border-slate-200 rounded-lg px-2 py-2 text-right print:border-b print:border-x-0 print:border-t-0 print:rounded-none"
                          />
                        </td>

                        <td className="px-4 py-4 text-right font-bold">
                          {item.actualPrepYield !==
                          null
                            ? `${item.actualPrepYield.toFixed(
                                2
                              )}%`
                            : "-"}
                        </td>

                        <td className="px-4 py-4 text-right font-bold">
                          {item.actualCookingYield !==
                          null
                            ? `${item.actualCookingYield.toFixed(
                                2
                              )}%`
                            : "-"}
                        </td>

                        <td className="px-4 py-4 text-right font-extrabold text-amber-600">
                          {item.actualOverallYield !==
                          null
                            ? `${item.actualOverallYield.toFixed(
                                2
                              )}%`
                            : "-"}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* NOTES */}

          <section className="p-6 sm:p-8 border-b border-slate-200">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-5 h-5 text-slate-500" />

              <h2 className="font-extrabold text-slate-800 text-lg">
                4. หมายเหตุการผลิต
              </h2>
            </div>

            <textarea
              value={notes}
              onChange={(e) =>
                setNotes(
                  e.target.value
                )
              }
              rows={4}
              placeholder="เช่น วัตถุดิบไม่พอ / เครื่องจักรมีปัญหา / ปรับเวลาการผลิต"
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm print:border print:border-slate-300"
            />
          </section>

          {/* QC */}

          <section className="p-6 sm:p-8">
            <h2 className="font-extrabold text-slate-800 text-lg mb-4">
              5. Production QC
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4 print:hidden">
              <button
                type="button"
                onClick={() =>
                  setQcStatus(
                    "pending"
                  )
                }
                className={`p-3 rounded-xl border font-bold text-sm ${
                  qcStatus ===
                  "pending"
                    ? "border-slate-400 bg-slate-100"
                    : "border-slate-200"
                }`}
              >
                รอตรวจ
              </button>

              <button
                type="button"
                onClick={() =>
                  setQcStatus(
                    "passed"
                  )
                }
                className={`p-3 rounded-xl border font-bold text-sm ${
                  qcStatus ===
                  "passed"
                    ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                    : "border-slate-200"
                }`}
              >
                ผ่าน
              </button>

              <button
                type="button"
                onClick={() =>
                  setQcStatus(
                    "failed"
                  )
                }
                className={`p-3 rounded-xl border font-bold text-sm ${
                  qcStatus ===
                  "failed"
                    ? "border-red-400 bg-red-50 text-red-600"
                    : "border-slate-200"
                }`}
              >
                ไม่ผ่าน
              </button>
            </div>

            <div className="hidden print:block mb-4">
              <p className="text-sm font-bold">
                สถานะ QC:{" "}
                {qcStatus === "passed"
                  ? "ผ่าน"
                  : qcStatus ===
                    "failed"
                  ? "ไม่ผ่าน"
                  : "รอตรวจ"}
              </p>
            </div>

            <textarea
              value={qcNotes}
              onChange={(e) =>
                setQcNotes(
                  e.target.value
                )
              }
              rows={3}
              placeholder="หมายเหตุ QC / ปัญหาที่พบ / การแก้ไข"
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mt-10 pt-8">
              <div className="border-t border-slate-400 pt-2 text-center text-xs text-slate-500">
                ผู้ผลิต / ผู้รับผิดชอบ
              </div>

              <div className="border-t border-slate-400 pt-2 text-center text-xs text-slate-500">
                ผู้ตรวจสอบ QC
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}