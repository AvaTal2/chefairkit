"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  useParams,
  useRouter,
} from "next/navigation";

import {
  ArrowLeft,
  Printer,
  ChefHat,
  Clock3,
  Thermometer,
  BadgeCheck,
  AlertTriangle,
} from "lucide-react";

import { supabase } from "@/lib/supabase/client";

type Recipe = {
  id: string;
  name: string;
  category: string | null;
  yield_amount: number | null;
  yield_unit: string | null;
  servings: number | null;
};

type RecipeIngredient = {
  id: string;
  ingredient_name: string;
  quantity: number;
  unit: string;
};

type RecipeSop = {
  id: string;
  title: string;

  product_description: string | null;
  equipment: string | null;
  preparation: string | null;

  critical_points: string | null;
  quality_control: string | null;
  packing_storage: string | null;
  sanitation: string | null;
  responsibilities: string | null;
  notes: string | null;

  version: string | null;
  approved_by: string | null;
  approved_at: string | null;

  created_at: string;
  updated_at: string;
};

type SopStep = {
  id: string;
  step_order: number;

  title: string;
  instruction: string | null;

  duration_minutes: number | null;
  temperature_c: number | null;

  qc_target: string | null;
  qc_warning: string | null;

  image_path: string | null;

  signedImageUrl?: string | null;
};

const formatNumber = (
  value: number
) => {
  if (
    !Number.isFinite(value)
  ) {
    return "-";
  }

  return new Intl.NumberFormat(
    "th-TH",
    {
      maximumFractionDigits: 3,
    }
  ).format(value);
};

const formatDate = (
  value: string | null
) => {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat(
    "th-TH",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  ).format(
    new Date(value)
  );
};

export default function SopPrintPage() {
  const params =
    useParams();

  const router =
    useRouter();

  const recipeId =
    params.id as string;

  const [
    recipe,
    setRecipe,
  ] =
    useState<Recipe | null>(
      null
    );

  const [
    ingredients,
    setIngredients,
  ] = useState<
    RecipeIngredient[]
  >([]);

  const [
    sop,
    setSop,
  ] =
    useState<RecipeSop | null>(
      null
    );

  const [
    steps,
    setSteps,
  ] =
    useState<SopStep[]>([]);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    message,
    setMessage,
  ] =
    useState("");

  useEffect(() => {
    if (recipeId) {
      loadData();
    }
  }, [recipeId]);

  const loadData =
    async () => {
      setLoading(true);
      setMessage("");

      const {
        data: { user },
      } =
        await supabase.auth.getUser();

      if (!user) {
        sessionStorage.setItem(
          "chefair_after_login_redirect",
          `/recipes/${recipeId}/sop/print`
        );

        router.push(
          "/login"
        );

        return;
      }

      const {
        data: recipeData,
        error: recipeError,
      } =
        await supabase
          .from("recipes")
          .select(
            `
            id,
            name,
            category,
            yield_amount,
            yield_unit,
            servings
            `
          )
          .eq(
            "id",
            recipeId
          )
          .eq(
            "user_id",
            user.id
          )
          .single();

      if (
        recipeError ||
        !recipeData
      ) {
        setMessage(
          "ไม่พบสูตรนี้"
        );

        setLoading(
          false
        );

        return;
      }

      const {
        data:
          ingredientData,
        error:
          ingredientError,
      } =
        await supabase
          .from(
            "recipe_ingredients"
          )
          .select(
            `
            id,
            ingredient_name,
            quantity,
            unit
            `
          )
          .eq(
            "recipe_id",
            recipeId
          )
          .order(
            "created_at",
            {
              ascending:
                true,
            }
          );

      if (
        ingredientError
      ) {
        setMessage(
          "โหลดวัตถุดิบไม่สำเร็จ: " +
            ingredientError.message
        );

        setLoading(
          false
        );

        return;
      }

      const {
        data: sopData,
        error: sopError,
      } =
        await supabase
          .from(
            "recipe_sops"
          )
          .select("*")
          .eq(
            "recipe_id",
            recipeId
          )
          .eq(
            "user_id",
            user.id
          )
          .maybeSingle();

      if (
        sopError ||
        !sopData
      ) {
        setRecipe(
          recipeData as Recipe
        );

        setIngredients(
          (ingredientData ||
            []) as RecipeIngredient[]
        );

        setMessage(
          "สูตรนี้ยังไม่มี SOP"
        );

        setLoading(
          false
        );

        return;
      }

      const {
        data: stepData,
        error: stepError,
      } =
        await supabase
          .from(
            "recipe_sop_steps"
          )
          .select(
            `
            id,
            step_order,
            title,
            instruction,
            duration_minutes,
            temperature_c,
            qc_target,
            qc_warning,
            image_path
            `
          )
          .eq(
            "sop_id",
            sopData.id
          )
          .order(
            "step_order",
            {
              ascending:
                true,
            }
          );

      if (
        stepError
      ) {
        setMessage(
          "โหลดขั้นตอน SOP ไม่สำเร็จ: " +
            stepError.message
        );

        setLoading(
          false
        );

        return;
      }

      const rawSteps =
        (stepData ||
          []) as SopStep[];

      const withImages =
        await Promise.all(
          rawSteps.map(
            async (
              step
            ) => {
              if (
                !step.image_path
              ) {
                return {
                  ...step,
                  signedImageUrl:
                    null,
                };
              }

              const {
                data:
                  signedData,
              } =
                await supabase.storage
                  .from(
                    "sop-images"
                  )
                  .createSignedUrl(
                    step.image_path,
                    60 * 60
                  );

              return {
                ...step,

                signedImageUrl:
                  signedData
                    ?.signedUrl ||
                  null,
              };
            }
          )
        );

      setRecipe(
        recipeData as Recipe
      );

      setIngredients(
        (ingredientData ||
          []) as RecipeIngredient[]
      );

      setSop(
        sopData as RecipeSop
      );

      setSteps(
        withImages
      );

      setLoading(
        false
      );
    };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-10">
        <div className="max-w-5xl mx-auto bg-white rounded-3xl p-10 text-center text-slate-500">
          กำลังเตรียมเอกสาร SOP...
        </div>
      </main>
    );
  }

  if (
    !recipe ||
    !sop
  ) {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-10">
        <div className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-3xl p-10 text-center">
          <h1 className="font-bold text-xl text-slate-800">
            ไม่สามารถเปิดเอกสาร SOP
          </h1>

          <p className="text-sm text-slate-500 mt-2">
            {message ||
              "ไม่พบข้อมูล SOP"}
          </p>

          <button
            type="button"
            onClick={() =>
              router.push(
                `/recipes/${recipeId}/sop`
              )
            }
            className="mt-5 bg-amber-500 text-white font-bold px-5 py-2.5 rounded-xl"
          >
            กลับหน้า SOP
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 print:bg-white">

      {/* TOOLBAR */}

      <div className="print:hidden sticky top-0 z-50 bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">

          <button
            type="button"
            onClick={() =>
              router.push(
                `/recipes/${recipe.id}/sop`
              )
            }
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-amber-600"
          >
            <ArrowLeft className="w-4 h-4" />
            กลับ SOP
          </button>

          <button
            type="button"
            onClick={() =>
              window.print()
            }
            className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white font-bold px-5 py-2.5 rounded-xl text-sm"
          >
            <Printer className="w-4 h-4" />
            พิมพ์ / บันทึก PDF
          </button>
        </div>
      </div>

      {/* DOCUMENT */}

      <div className="max-w-5xl mx-auto px-4 py-8 print:max-w-none print:p-0">

        <article className="bg-white shadow-sm print:shadow-none">

          {/* DOCUMENT HEADER */}

          <header className="border-b-4 border-slate-800 p-7 sm:p-10 print:p-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">

              <div>
                <div className="flex items-center gap-3">
                  <div className="bg-amber-500 text-white p-3 rounded-2xl print:p-2">
                    <ChefHat className="w-6 h-6" />
                  </div>

                  <div>
                    <p className="text-xs font-bold tracking-widest text-amber-600">
                      CHEFAIR KIT
                    </p>

                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                      STANDARD OPERATING PROCEDURE
                    </h1>
                  </div>
                </div>

                <h2 className="text-xl font-extrabold text-slate-800 mt-6">
                  {sop.title}
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  สูตร:{" "}
                  <span className="font-bold text-slate-700">
                    {recipe.name}
                  </span>
                </p>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden min-w-[250px] text-sm">
                <DocumentRow
                  label="Version"
                  value={
                    sop.version ||
                    "-"
                  }
                />

                <DocumentRow
                  label="วันที่แก้ไข"
                  value={formatDate(
                    sop.updated_at
                  )}
                />

                <DocumentRow
                  label="ผู้อนุมัติ"
                  value={
                    sop.approved_by ||
                    "-"
                  }
                />

                <DocumentRow
                  label="วันที่อนุมัติ"
                  value={formatDate(
                    sop.approved_at
                  )}
                />
              </div>
            </div>
          </header>

          <div className="p-7 sm:p-10 print:p-6">

            {/* RECIPE INFO */}

            <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
              <InfoBox
                label="ชื่อสูตร"
                value={
                  recipe.name
                }
              />

              <InfoBox
                label="หมวดหมู่"
                value={
                  recipe.category ||
                  "-"
                }
              />

              <InfoBox
                label="Yield"
                value={
                  recipe.yield_amount
                    ? `${formatNumber(
                        recipe.yield_amount
                      )} ${
                        recipe.yield_unit ||
                        ""
                      }`
                    : "-"
                }
              />

              <InfoBox
                label="เสิร์ฟ / ชิ้น"
                value={
                  recipe.servings
                    ? formatNumber(
                        recipe.servings
                      )
                    : "-"
                }
              />
            </section>

            {sop.product_description && (
              <DocumentSection
                title="1. ข้อมูลผลิตภัณฑ์"
                content={
                  sop.product_description
                }
              />
            )}

            {/* INGREDIENTS */}

            <section className="mb-8 break-inside-avoid">
              <SectionTitle>
                2. วัตถุดิบ
              </SectionTitle>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="text-left px-4 py-3">
                        ลำดับ
                      </th>

                      <th className="text-left px-4 py-3">
                        วัตถุดิบ
                      </th>

                      <th className="text-right px-4 py-3">
                        ปริมาณ
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-200">
                    {ingredients.map(
                      (
                        item,
                        index
                      ) => (
                        <tr
                          key={
                            item.id
                          }
                        >
                          <td className="px-4 py-3 text-slate-500">
                            {index +
                              1}
                          </td>

                          <td className="px-4 py-3 font-semibold">
                            {
                              item.ingredient_name
                            }
                          </td>

                          <td className="px-4 py-3 text-right">
                            {formatNumber(
                              Number(
                                item.quantity
                              )
                            )}{" "}
                            {
                              item.unit
                            }
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {sop.equipment && (
              <DocumentSection
                title="3. อุปกรณ์"
                content={
                  sop.equipment
                }
              />
            )}

            {sop.preparation && (
              <DocumentSection
                title="4. การเตรียมก่อนผลิต"
                content={
                  sop.preparation
                }
              />
            )}

            {/* STEPS */}

            <section className="mb-8">
              <SectionTitle>
                5. ขั้นตอนการผลิต
              </SectionTitle>

              {steps.length ===
              0 ? (
                <div className="border border-dashed border-slate-300 rounded-xl p-6 text-sm text-slate-500">
                  ยังไม่มีขั้นตอนการผลิต
                </div>
              ) : (
                <div className="space-y-5">
                  {steps.map(
                    (
                      step,
                      index
                    ) => (
                      <article
                        key={
                          step.id
                        }
                        className="border border-slate-200 rounded-2xl overflow-hidden break-inside-avoid"
                      >
                        <div className="bg-slate-800 text-white px-5 py-4 flex items-center justify-between gap-4">
                          <div>
                            <p className="text-[10px] font-bold text-amber-400 tracking-widest">
                              STEP{" "}
                              {String(
                                index +
                                  1
                              ).padStart(
                                2,
                                "0"
                              )}
                            </p>

                            <h3 className="font-extrabold text-lg">
                              {
                                step.title
                              }
                            </h3>
                          </div>

                          <div className="flex gap-2 text-xs">
                            {step.duration_minutes !==
                              null && (
                              <span className="inline-flex items-center gap-1 bg-white/10 px-2.5 py-1.5 rounded-lg">
                                <Clock3 className="w-3.5 h-3.5" />

                                {formatNumber(
                                  step.duration_minutes
                                )}{" "}
                                นาที
                              </span>
                            )}

                            {step.temperature_c !==
                              null && (
                              <span className="inline-flex items-center gap-1 bg-white/10 px-2.5 py-1.5 rounded-lg">
                                <Thermometer className="w-3.5 h-3.5" />

                                {formatNumber(
                                  step.temperature_c
                                )}
                                °C
                              </span>
                            )}
                          </div>
                        </div>

                        <div
                          className={
                            step.signedImageUrl
                              ? "grid grid-cols-1 md:grid-cols-[1fr_260px]"
                              : ""
                          }
                        >
                          <div className="p-5">
                            <p className="text-xs font-bold text-slate-400">
                              วิธีทำ
                            </p>

                            <p className="text-sm leading-relaxed whitespace-pre-line mt-2">
                              {step.instruction ||
                                "-"}
                            </p>

                            {step.qc_target && (
                              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 mt-4">
                                <div className="flex items-center gap-2 font-bold text-emerald-700 text-sm">
                                  <BadgeCheck className="w-4 h-4" />
                                  จุดที่ต้องได้ / QC Target
                                </div>

                                <p className="text-sm text-emerald-900 mt-2 whitespace-pre-line">
                                  {
                                    step.qc_target
                                  }
                                </p>
                              </div>
                            )}

                            {step.qc_warning && (
                              <div className="bg-red-50 border border-red-100 rounded-xl p-4 mt-3">
                                <div className="flex items-center gap-2 font-bold text-red-600 text-sm">
                                  <AlertTriangle className="w-4 h-4" />
                                  สิ่งที่ไม่ควรเกิด
                                </div>

                                <p className="text-sm text-red-900 mt-2 whitespace-pre-line">
                                  {
                                    step.qc_warning
                                  }
                                </p>
                              </div>
                            )}
                          </div>

                          {step.signedImageUrl && (
                            <div className="bg-slate-100">
                              <img
                                src={
                                  step.signedImageUrl
                                }
                                alt={
                                  step.title
                                }
                                className="w-full h-full min-h-[220px] object-cover"
                              />
                            </div>
                          )}
                        </div>
                      </article>
                    )
                  )}
                </div>
              )}
            </section>

            {sop.critical_points && (
              <DocumentSection
                title="6. จุดสำคัญ / จุดควบคุม"
                content={
                  sop.critical_points
                }
              />
            )}

            {sop.quality_control && (
              <DocumentSection
                title="7. Quality Control"
                content={
                  sop.quality_control
                }
              />
            )}

            {sop.packing_storage && (
              <DocumentSection
                title="8. การบรรจุและการเก็บรักษา"
                content={
                  sop.packing_storage
                }
              />
            )}

            {sop.sanitation && (
              <DocumentSection
                title="9. สุขลักษณะและความสะอาด"
                content={
                  sop.sanitation
                }
              />
            )}

            {sop.responsibilities && (
              <DocumentSection
                title="10. ผู้รับผิดชอบ"
                content={
                  sop.responsibilities
                }
              />
            )}

            {sop.notes && (
              <DocumentSection
                title="11. หมายเหตุ"
                content={
                  sop.notes
                }
              />
            )}

            {/* SIGNATURE */}

            <section className="mt-12 pt-8 border-t border-slate-300 break-inside-avoid">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
                <SignatureBox label="ผู้จัดทำ" />

                <SignatureBox label="ผู้ตรวจสอบ" />

                <SignatureBox
                  label="ผู้อนุมัติ"
                  name={
                    sop.approved_by ||
                    ""
                  }
                />
              </div>
            </section>

            {/* FOOTER */}

            <footer className="mt-10 pt-4 border-t border-slate-200 flex justify-between gap-4 text-[10px] text-slate-400">
              <span>
                ChefAir Kit · SOP
              </span>

              <span>
                {sop.title} · Version{" "}
                {sop.version ||
                  "1.0"}
              </span>
            </footer>
          </div>
        </article>
      </div>

      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 12mm;
          }

          body {
            background: white !important;
          }

          .break-inside-avoid {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>
    </main>
  );
}

function DocumentRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="grid grid-cols-[95px_1fr] border-b border-slate-200 last:border-b-0">
      <div className="bg-slate-50 px-3 py-2 font-semibold text-slate-500">
        {label}
      </div>

      <div className="px-3 py-2 font-bold text-slate-800">
        {value}
      </div>
    </div>
  );
}

function InfoBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="border border-slate-200 rounded-xl p-4 break-inside-avoid">
      <p className="text-[11px] text-slate-400">
        {label}
      </p>

      <p className="text-sm font-bold text-slate-800 mt-1">
        {value}
      </p>
    </div>
  );
}

function SectionTitle({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <h2 className="text-lg font-extrabold text-slate-800 border-l-4 border-amber-500 pl-3 mb-4">
      {children}
    </h2>
  );
}

function DocumentSection({
  title,
  content,
}: {
  title: string;
  content: string;
}) {
  return (
    <section className="mb-8 break-inside-avoid">
      <SectionTitle>
        {title}
      </SectionTitle>

      <div className="border border-slate-200 rounded-xl p-5">
        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
          {content}
        </p>
      </div>
    </section>
  );
}

function SignatureBox({
  label,
  name = "",
}: {
  label: string;
  name?: string;
}) {
  return (
    <div>
      <div className="h-12 border-b border-slate-400" />

      <p className="font-bold text-sm mt-2">
        {label}
      </p>

      <p className="text-xs text-slate-500 mt-1 min-h-[18px]">
        {name}
      </p>

      <p className="text-xs text-slate-400 mt-1">
        วันที่ ______ / ______ / ______
      </p>
    </div>
  );
}