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
  ClipboardPaste,
  FileText,
  CircleAlert,
  CheckCircle2,
} from "lucide-react";

import { supabase } from "@/lib/supabase/client";

type Ingredient = {
  id: number;
  name: string;
  quantity: string;
  unit: string;
};

type ParsedIngredient = {
  name: string;
  amount: number;
  unit: string;
  warning?: string;
};

type Mode = "multiplier" | "yield" | "servings";

const makeIngredient = (id: number): Ingredient => ({
  id,
  name: "",
  quantity: "",
  unit: "g",
});

/* =========================================================
   วางสูตรทั้งชุด / แยกวัตถุดิบ
   ========================================================= */

const STOP_SECTION_PATTERNS = [
  /^วิธีทำ\b/i,
  /^ขั้นตอน\b/i,
  /^วิธีปรุง\b/i,
  /^วิธีเก็บ\b/i,
  /^การเก็บรักษา\b/i,
  /^หมายเหตุ\b/i,
  /^เทคนิค\b/i,
  /^คำแนะนำ\b/i,
  /^วิธีใช้\b/i,
  /^procedure\b/i,
  /^method\b/i,
  /^directions?\b/i,
  /^instructions?\b/i,
];

const INGREDIENT_SECTION_PATTERNS = [
  /^วัตถุดิบ\b/i,
  /^ส่วนผสม\b/i,
  /^ingredients?\b/i,
  /^เครื่องปรุง\b/i,
];

const UNIT_MAP: Array<{
  pattern: string;
  unit: string;
}> = [
  {
    pattern: "กิโลกรัม|กก\\.?|kg",
    unit: "kg",
  },
  {
    pattern: "กรัม|ก\\.?|g",
    unit: "g",
  },
  {
    pattern: "มิลลิลิตร|มล\\.?|ml",
    unit: "ml",
  },
  {
    pattern: "ลิตร|ล\\.?|lit(?:er|re)?s?|l",
    unit: "l",
  },
  {
    pattern: "ช้อนชา|ชช\\.?|tsp",
    unit: "tsp",
  },
  {
    pattern: "ช้อนโต๊ะ|ชต\\.?|tbsp",
    unit: "tbsp",
  },
  {
    pattern: "ถ้วย|cup",
    unit: "cup",
  },
  {
    pattern: "ชิ้น|piece|pcs?",
    unit: "piece",
  },
  {
    pattern: "ฟอง",
    unit: "egg",
  },
  {
    pattern: "ลูก",
    unit: "fruit",
  },
];

const NON_INGREDIENT_UNITS =
  /นาที|ชั่วโมง|วินาที|องศา|°c|°f|เซลเซียส|ฟาเรนไฮต์/i;

const cleanLine = (line: string) =>
  line
    .replace(/^[\s\-–—•*▪︎◦●○]+/, "")
    .replace(/^\d+[\.\)]\s*/, "")
    .replace(/\s+/g, " ")
    .trim();

const parseRecipeText = (rawText: string) => {
  const parsed: ParsedIngredient[] = [];
  const rejected: string[] = [];

  const lines = rawText
    .split(/\r?\n/)
    .map(cleanLine)
    .filter(Boolean);

  let inIngredientSection = false;
  let stoppedBySection = false;

  for (const originalLine of lines) {
    const line = originalLine.trim();

    if (
      INGREDIENT_SECTION_PATTERNS.some((pattern) =>
        pattern.test(line)
      )
    ) {
      inIngredientSection = true;
      stoppedBySection = false;
      continue;
    }

    if (
      STOP_SECTION_PATTERNS.some((pattern) =>
        pattern.test(line)
      )
    ) {
      if (inIngredientSection) {
        stoppedBySection = true;
      }

      inIngredientSection = false;
      continue;
    }

    if (stoppedBySection) {
      continue;
    }

    if (NON_INGREDIENT_UNITS.test(line)) {
      rejected.push(line);
      continue;
    }

    let matched = false;

    for (const unitDef of UNIT_MAP) {
      const regex = new RegExp(
        `^(.*?)\\s+([0-9]+(?:[,.][0-9]+)?)\\s*(${unitDef.pattern})(?:\\s|$|\\(|\\[)`,
        "i"
      );

      const match = line.match(regex);

      if (!match) {
        continue;
      }

      const name = match[1]
        .replace(/[=:：]+$/, "")
        .trim();

      const amount = Number(
        match[2].replace(/,/g, ".")
      );

      if (
        !name ||
        !Number.isFinite(amount) ||
        amount <= 0
      ) {
        rejected.push(line);
        matched = true;
        break;
      }

      parsed.push({
        name,
        amount,
        unit: unitDef.unit,
      });

      matched = true;
      break;
    }

    if (!matched) {
      const looksLikeProcedure =
        /นำ|ผสม|ปั่น|ต้ม|ทอด|อบ|ย่าง|พัก|คน|เคี่ยว|ตั้งไฟ|เท|หั่น|ล้าง|แช่|เก็บ|เสิร์ฟ/i.test(
          line
        );

      if (looksLikeProcedure || /\d/.test(line)) {
        rejected.push(line);
      }
    }
  }

  return {
    parsed,
    rejected,
  };
};

export default function RecipeCalculatorPage() {
  const router = useRouter();

  const [ingredients, setIngredients] =
    useState<Ingredient[]>([
      makeIngredient(1),
      makeIngredient(2),
      makeIngredient(3),
    ]);

  const [nextId, setNextId] = useState(4);
  const [copied, setCopied] = useState(false);
  const [savingToAccount, setSavingToAccount] =
    useState(false);

  /* =========================================================
     วางสูตรทั้งชุด
     ========================================================= */

  const [recipePasteText, setRecipePasteText] =
    useState("");

  const [
    parsedIngredients,
    setParsedIngredients,
  ] = useState<ParsedIngredient[]>([]);

  const [rejectedLines, setRejectedLines] =
    useState<string[]>([]);

  const [pasteMessage, setPasteMessage] =
    useState("");

  const [mode, setMode] =
    useState<Mode>("multiplier");

  const [multiplier, setMultiplier] = useState("2");

  const [originalYield, setOriginalYield] =
    useState("");

  const [targetYield, setTargetYield] =
    useState("");

  const [yieldUnit, setYieldUnit] =
    useState("g");

  const [originalServings, setOriginalServings] =
    useState("");

  const [targetServings, setTargetServings] =
    useState("");

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

      return current.filter(
        (item) => item.id !== id
      );
    });
  };

  /* =========================================================
     ฟังก์ชันแยกสูตรจากข้อความ
     ========================================================= */

  const handleParseRecipeText = () => {
    setPasteMessage("");

    if (!recipePasteText.trim()) {
      setParsedIngredients([]);
      setRejectedLines([]);
      setPasteMessage("กรุณาวางสูตรก่อน");
      return;
    }

    const result =
      parseRecipeText(recipePasteText);

    setParsedIngredients(result.parsed);
    setRejectedLines(result.rejected);

    if (result.parsed.length === 0) {
      setPasteMessage(
        "ยังไม่พบรายการวัตถุดิบที่มีชื่อ + ปริมาณ + หน่วย กรุณาตรวจข้อความอีกครั้ง"
      );

      return;
    }

    setPasteMessage(
      `ตรวจพบวัตถุดิบ ${result.parsed.length} รายการ`
    );
  };

  const makeImportedRows = () =>
    parsedIngredients.map(
      (item, index): Ingredient => ({
        id: nextId + index,
        name: item.name,
        quantity: String(item.amount),
        unit: item.unit,
      })
    );

  const handleAppendParsedIngredients = () => {
    if (parsedIngredients.length === 0) {
      return;
    }

    const importedRows =
      makeImportedRows();

    const hasOnlyBlankRows =
      ingredients.every(
        (item) =>
          !item.name.trim() &&
          !item.quantity.trim()
      );

    setIngredients(
      hasOnlyBlankRows
        ? importedRows
        : [...ingredients, ...importedRows]
    );

    setNextId(
      (current) =>
        current + importedRows.length
    );

    setPasteMessage(
      `เพิ่มวัตถุดิบ ${importedRows.length} รายการลงตารางแล้ว`
    );
  };

  const handleReplaceWithParsedIngredients =
    () => {
      if (parsedIngredients.length === 0) {
        return;
      }

      const hasExistingData =
        ingredients.some(
          (item) =>
            item.name.trim() ||
            item.quantity.trim()
        );

      if (
        hasExistingData &&
        !window.confirm(
          "ต้องการแทนที่รายการวัตถุดิบทั้งหมดด้วยรายการที่แยกจากข้อความใช่หรือไม่?"
        )
      ) {
        return;
      }

      const importedRows =
        makeImportedRows();

      setIngredients(importedRows);

      setNextId(
        (current) =>
          current + importedRows.length
      );

      setPasteMessage(
        `แทนที่ตารางด้วยวัตถุดิบ ${importedRows.length} รายการแล้ว`
      );
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

    return `ปรับสูตร × ${formatNumber(
      factor
    )}`;
  };

  const handleCopyRecipe = async () => {
    if (
      factor <= 0 ||
      validIngredients.length === 0
    ) {
      return;
    }

    const lines = validIngredients.map(
      (item) => {
        const calculated =
          Number(item.quantity) * factor;

        return `${item.name} ${formatNumber(
          calculated
        )} ${item.unit}`;
      }
    );

    const text = [
      "สูตรที่คำนวณแล้ว",
      getCalculationDescription(),
      "",
      ...lines,
      "",
      "คำนวณด้วย ChefAir Kit",
    ].join("\n");

    try {
      await navigator.clipboard.writeText(
        text
      );

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      alert(
        "ไม่สามารถคัดลอกได้ กรุณาลองใหม่อีกครั้ง"
      );
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSaveToAccount = async () => {
    if (
      factor <= 0 ||
      validIngredients.length === 0
    ) {
      alert(
        "กรุณาใส่วัตถุดิบและคำนวณสูตรก่อน"
      );

      return;
    }

    setSavingToAccount(true);

    try {
      const calculatedIngredients =
        validIngredients.map((item) => ({
          name: item.name.trim(),
          quantity:
            Number(item.quantity) * factor,
          unit: item.unit,
        }));

      let calculatedYieldAmount:
        | number
        | null = null;

      let calculatedYieldUnit =
        yieldUnit;

      if (
        mode === "yield" &&
        Number(targetYield) > 0
      ) {
        calculatedYieldAmount =
          Number(targetYield);

        calculatedYieldUnit =
          yieldUnit;
      }

      let calculatedServings:
        | number
        | null = null;

      if (
        mode === "servings" &&
        Number(targetServings) > 0
      ) {
        calculatedServings =
          Number(targetServings);
      }

      const transferData = {
        source: "recipe-calculator",
        createdAt: Date.now(),
        calculationMode: mode,
        calculationDescription:
          getCalculationDescription(),

        yieldAmount:
          calculatedYieldAmount,

        yieldUnit:
          calculatedYieldUnit,

        servings:
          calculatedServings,

        ingredients:
          calculatedIngredients,
      };

      sessionStorage.setItem(
        "chefair_recipe_transfer",
        JSON.stringify(transferData)
      );

      const {
        data: { user },
      } =
        await supabase.auth.getUser();

      if (!user) {
        sessionStorage.setItem(
          "chefair_after_login_redirect",
          "/recipes/new?from=calculator"
        );

        router.push("/login");
        return;
      }

      router.push(
        "/recipes/new?from=calculator"
      );
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
            ย่อ ขยาย หรือปรับสูตรตาม Yield
            และจำนวนที่ต้องการ
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
              onClick={() =>
                setMode("multiplier")
              }
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
              onClick={() =>
                setMode("yield")
              }
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
                จากน้ำหนักสูตรเดิม →
                น้ำหนักที่ต้องการ
              </p>
            </button>

            <button
              type="button"
              onClick={() =>
                setMode("servings")
              }
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
                ].map(
                  ([label, value]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() =>
                        setMultiplier(
                          value
                        )
                      }
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition ${
                        multiplier ===
                        value
                          ? "bg-amber-500 border-amber-500 text-white"
                          : "bg-white border-slate-200 text-slate-600 hover:border-amber-300"
                      }`}
                    >
                      {label}
                    </button>
                  )
                )}
              </div>

              <div className="max-w-xs">
                <input
                  type="number"
                  min="0.001"
                  step="0.001"
                  value={multiplier}
                  onChange={(e) =>
                    setMultiplier(
                      e.target.value
                    )
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
                    setOriginalYield(
                      e.target.value
                    )
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
                    setTargetYield(
                      e.target.value
                    )
                  }
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm"
                  placeholder="6500"
                />
              </div>

              <select
                value={yieldUnit}
                onChange={(e) =>
                  setYieldUnit(
                    e.target.value
                  )
                }
                className="border border-slate-200 rounded-xl px-3 py-3 text-sm bg-white"
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
              </select>
            </div>
          )}

          {mode === "servings" && (
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-3 items-end max-w-2xl">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2">
                  สูตรเดิมได้กี่เสิร์ฟ /
                  ชิ้น
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.001"
                  value={
                    originalServings
                  }
                  onChange={(e) =>
                    setOriginalServings(
                      e.target.value
                    )
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
                  ต้องการกี่เสิร์ฟ /
                  ชิ้น
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.001"
                  value={targetServings}
                  onChange={(e) =>
                    setTargetServings(
                      e.target.value
                    )
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
                ? `× ${formatNumber(
                    factor
                  )}`
                : "-"}
            </span>
          </div>
        </section>

        {/* =====================================================
            Paste Full Recipe
            ===================================================== */}

        <section className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
            <div className="flex items-start gap-3">
              <div className="bg-violet-50 p-3 rounded-xl text-violet-600">
                <ClipboardPaste className="w-6 h-6" />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-extrabold text-slate-800">
                    วางสูตรทั้งชุด
                  </h2>

                  <span className="text-[10px] font-bold bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full">
                    ไม่ใช้ AI
                  </span>
                </div>

                <p className="text-sm text-slate-500 mt-1">
                  คัดลอกสูตรจากเอกสารหรือคอร์สเรียนมาวาง
                  ระบบจะแยกเฉพาะวัตถุดิบและปริมาณให้ก่อนนำลงตาราง
                </p>
              </div>
            </div>
          </div>

          <textarea
            value={recipePasteText}
            onChange={(e) =>
              setRecipePasteText(
                e.target.value
              )
            }
            rows={8}
            placeholder={`ตัวอย่าง

สูตรน้ำจิ้มซีฟู้ด

วัตถุดิบ
น้ำปลา 90 กรัม
น้ำเชื่อม 90 กรัม
น้ำส้มสายชู 80 กรัม
พริกแดงจินดา 30 กรัม

วิธีทำ
1. นำทุกอย่างไปปั่นรวมกัน
2. ปั่นประมาณ 2 นาที`}
            className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm text-slate-700 leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400"
          />

          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <button
              type="button"
              onClick={
                handleParseRecipeText
              }
              className="inline-flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-bold px-5 py-3 rounded-xl text-sm transition"
            >
              <FileText className="w-4 h-4" />
              แยกสูตรเป็นรายการ
            </button>

            <button
              type="button"
              onClick={() => {
                setRecipePasteText(
                  ""
                );

                setParsedIngredients(
                  []
                );

                setRejectedLines([]);

                setPasteMessage("");
              }}
              className="inline-flex items-center justify-center border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold px-5 py-3 rounded-xl text-sm transition"
            >
              ล้างข้อความ
            </button>
          </div>

          {pasteMessage && (
            <div
              className={`mt-4 rounded-xl px-4 py-3 text-sm border ${
                parsedIngredients.length >
                0
                  ? "bg-emerald-50 border-emerald-100 text-emerald-700"
                  : "bg-amber-50 border-amber-100 text-amber-700"
              }`}
            >
              {pasteMessage}
            </div>
          )}

          {parsedIngredients.length >
            0 && (
            <div className="mt-5 border border-slate-200 rounded-2xl overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    Preview
                    ก่อนเพิ่มลงตาราง
                  </p>

                  <p className="text-xs text-slate-500 mt-1">
                    ตรวจชื่อ ปริมาณ
                    และหน่วยก่อน
                    แล้วค่อยเลือกเพิ่มต่อท้ายหรือแทนที่รายการเดิม
                  </p>
                </div>

                <span className="text-xs font-bold text-violet-600">
                  {
                    parsedIngredients.length
                  }{" "}
                  รายการ
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {parsedIngredients.map(
                  (item, index) => (
                    <div
                      key={`${item.name}-${index}`}
                      className="grid grid-cols-[32px_1fr_auto] gap-3 items-start px-4 py-3"
                    >
                      <div className="w-7 h-7 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          {item.name}
                        </p>

                        {item.warning && (
                          <div className="flex items-start gap-1.5 text-[11px] text-amber-600 mt-1">
                            <CircleAlert className="w-3.5 h-3.5 shrink-0 mt-0.5" />

                            {
                              item.warning
                            }
                          </div>
                        )}
                      </div>

                      <div className="text-right">
                        <p className="text-sm font-bold text-slate-700">
                          {item.amount}{" "}
                          {item.unit}
                        </p>
                      </div>
                    </div>
                  )
                )}
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={
                    handleAppendParsedIngredients
                  }
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold px-4 py-3 rounded-xl text-sm transition"
                >
                  <Plus className="w-4 h-4" />
                  เพิ่มต่อท้ายรายการเดิม
                </button>

                <button
                  type="button"
                  onClick={
                    handleReplaceWithParsedIngredients
                  }
                  className="flex-1 inline-flex items-center justify-center gap-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold px-4 py-3 rounded-xl text-sm transition"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  แทนที่รายการทั้งหมด
                </button>
              </div>
            </div>
          )}

          {rejectedLines.length >
            0 && (
            <details className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <summary className="cursor-pointer text-xs font-bold text-slate-600">
                ข้อความที่ระบบไม่นำเข้าตาราง
                (
                {
                  rejectedLines.length
                }
                )
              </summary>

              <div className="mt-3 space-y-1.5">
                {rejectedLines
                  .slice(0, 12)
                  .map(
                    (
                      line,
                      index
                    ) => (
                      <p
                        key={`${line}-${index}`}
                        className="text-xs text-slate-500"
                      >
                        • {line}
                      </p>
                    )
                  )}

                {rejectedLines.length >
                  12 && (
                  <p className="text-xs text-slate-400">
                    และอีก{" "}
                    {rejectedLines.length -
                      12}{" "}
                    บรรทัด
                  </p>
                )}
              </div>
            </details>
          )}
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
            {ingredients.map(
              (item, index) => {
                const quantity = Number(
                  item.quantity
                );

                const calculated =
                  factor > 0 &&
                  quantity > 0
                    ? quantity *
                      factor
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
                      value={
                        item.quantity
                      }
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

                      <option value="egg">
                        ฟอง
                      </option>

                      <option value="fruit">
                        ลูก
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

                    <div className="bg-amber-50 rounded-xl px-3.5 py-2.5 flex sm:block justify-between">
                      <span className="sm:hidden text-xs text-slate-400">
                        สูตรใหม่
                      </span>

                      <span className="text-sm font-extrabold text-amber-700">
                        {calculated > 0
                          ? `${formatNumber(
                              calculated
                            )} ${
                              item.unit
                            }`
                          : "-"}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        removeIngredient(
                          item.id
                        )
                      }
                      className="h-[42px] rounded-xl text-red-400 hover:bg-red-50 flex items-center justify-center"
                      aria-label="ลบวัตถุดิบ"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              }
            )}
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

        {factor > 0 &&
          validIngredients.length >
            0 && (
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
                    {
                      getCalculationDescription()
                    }
                  </p>
                </div>
              </div>

              <div className="divide-y divide-slate-700">
                {validIngredients.map(
                  (item) => {
                    const calculated =
                      Number(
                        item.quantity
                      ) * factor;

                    return (
                      <div
                        key={
                          item.id
                        }
                        className="py-3 flex items-center justify-between gap-4"
                      >
                        <span className="text-sm text-slate-200">
                          {
                            item.name
                          }
                        </span>

                        <span className="font-extrabold text-amber-400">
                          {formatNumber(
                            calculated
                          )}{" "}
                          {
                            item.unit
                          }
                        </span>
                      </div>
                    );
                  }
                )}
              </div>

              {/* Result Actions */}

              <div className="border-t border-slate-700 mt-5 pt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={
                    handleCopyRecipe
                  }
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
                  onClick={
                    handlePrint
                  }
                  className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 text-white font-bold px-4 py-3 rounded-xl transition text-sm"
                >
                  <Printer className="w-4 h-4" />
                  พิมพ์ / บันทึก PDF
                </button>

                <button
                  type="button"
                  onClick={
                    handleSaveToAccount
                  }
                  disabled={
                    savingToAccount
                  }
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
            คำนวณสูตรด้านบนให้เรียบร้อย
            แล้วกด
            “บันทึกเป็นสูตรของฉัน”
            ระบบจะส่งวัตถุดิบและปริมาณที่คำนวณแล้วไปยังหน้าสร้างสูตร
          </p>
        </section>
      </main>
    </div>
  );
}