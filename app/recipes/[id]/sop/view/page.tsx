"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useParams,
  useRouter,
} from "next/navigation";

import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ChefHat,
  Clock3,
  Thermometer,
  BadgeCheck,
  AlertTriangle,
  ClipboardCheck,
  Maximize2,
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

type RecipeSop = {
  id: string;
  recipe_id: string;
  title: string;
  version: string | null;
  approved_by: string | null;
  approved_at: string | null;
  product_description: string | null;
  preparation: string | null;
  critical_points: string | null;
  quality_control: string | null;
  packing_storage: string | null;
  sanitation: string | null;
  responsibilities: string | null;
  notes: string | null;
};

type SopStep = {
  id: string;
  sop_id: string;
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

const formatNumber = (value: number) => {
  if (!Number.isFinite(value)) {
    return "-";
  }

  return new Intl.NumberFormat("th-TH", {
    maximumFractionDigits: 3,
  }).format(value);
};

const formatDate = (
  value: string | null
) => {
  if (!value) return "-";

  return new Intl.DateTimeFormat(
    "th-TH",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  ).format(new Date(value));
};

export default function SopViewPage() {
  const params = useParams();
  const router = useRouter();

  const recipeId =
    params.id as string;

  const [recipe, setRecipe] =
    useState<Recipe | null>(null);

  const [sop, setSop] =
    useState<RecipeSop | null>(null);

  const [steps, setSteps] =
    useState<SopStep[]>([]);

  const [
    currentStepIndex,
    setCurrentStepIndex,
  ] = useState(0);

  const [
    showOverview,
    setShowOverview,
  ] = useState(false);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    message,
    setMessage,
  ] = useState("");

  useEffect(() => {
    if (recipeId) {
      loadData();
    }
  }, [recipeId]);

  const loadData = async () => {
    setLoading(true);
    setMessage("");

    const {
      data: { user },
    } =
      await supabase.auth.getUser();

    if (!user) {
      sessionStorage.setItem(
        "chefair_after_login_redirect",
        `/recipes/${recipeId}/sop/view`
      );

      router.push("/login");
      return;
    }

    const {
      data: recipeData,
      error: recipeError,
    } = await supabase
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
      .eq("id", recipeId)
      .single();

    if (
      recipeError ||
      !recipeData
    ) {
      setMessage(
        "ไม่พบสูตรนี้"
      );

      setLoading(false);
      return;
    }

    const {
      data: sopData,
      error: sopError,
    } = await supabase
      .from("recipe_sops")
      .select(
        `
        id,
        recipe_id,
        title,
        version,
        approved_by,
        approved_at,
        product_description,
        preparation,
        critical_points,
        quality_control,
        packing_storage,
        sanitation,
        responsibilities,
        notes
        `
      )
      .eq("recipe_id", recipeId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (
      sopError ||
      !sopData
    ) {
      setRecipe(
        recipeData as Recipe
      );

      setMessage(
        "สูตรนี้ยังไม่มี SOP"
      );

      setLoading(false);
      return;
    }

    const {
      data: stepData,
      error: stepError,
    } = await supabase
      .from("recipe_sop_steps")
      .select(
        `
        id,
        sop_id,
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
      .eq("sop_id", sopData.id)
      .order("step_order", {
        ascending: true,
      });

    if (stepError) {
      setMessage(
        "โหลดขั้นตอน SOP ไม่สำเร็จ: " +
          stepError.message
      );

      setLoading(false);
      return;
    }

    const rawSteps =
      (stepData || []) as SopStep[];

    const withSignedUrls =
      await Promise.all(
        rawSteps.map(
          async (step) => {
            if (
              !step.image_path
            ) {
              return {
                ...step,
                signedImageUrl: null,
              };
            }

            const {
              data:
                signedData,
            } =
              await supabase.storage
                .from("sop-images")
                .createSignedUrl(
                  step.image_path,
                  60 * 60 * 6
                );

            return {
              ...step,
              signedImageUrl:
                signedData?.signedUrl ||
                null,
            };
          }
        )
      );

    setRecipe(
      recipeData as Recipe
    );

    setSop(
      sopData as RecipeSop
    );

    setSteps(
      withSignedUrls
    );

    setLoading(false);
  };

  const currentStep =
    useMemo(() => {
      if (
        steps.length === 0
      ) {
        return null;
      }

      return (
        steps[
          currentStepIndex
        ] || steps[0]
      );
    }, [
      steps,
      currentStepIndex,
    ]);

  const progress =
    steps.length > 0
      ? ((currentStepIndex +
          1) /
          steps.length) *
        100
      : 0;

  const goPrevious =
    () => {
      setCurrentStepIndex(
        (current) =>
          Math.max(
            current - 1,
            0
          )
      );
    };

  const goNext =
    () => {
      setCurrentStepIndex(
        (current) =>
          Math.min(
            current + 1,
            steps.length - 1
          )
      );
    };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 px-4 py-10 text-white">
        <div className="max-w-5xl mx-auto">
          <div className="border border-white/10 bg-white/5 rounded-3xl p-10 text-center text-slate-300">
            กำลังโหลด Kitchen SOP...
          </div>
        </div>
      </main>
    );
  }

  if (!recipe) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center">
            <h1 className="font-bold text-slate-800 text-xl">
              ไม่พบสูตร
            </h1>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/recipes"
                )
              }
              className="mt-5 bg-amber-500 text-white font-bold px-5 py-2.5 rounded-xl"
            >
              กลับสูตรของฉัน
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!sop) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center">
            <ClipboardCheck className="w-10 h-10 text-slate-300 mx-auto" />

            <h1 className="font-bold text-slate-800 text-xl mt-4">
              สูตรนี้ยังไม่มี SOP
            </h1>

            <p className="text-sm text-slate-500 mt-2">
              สร้าง SOP ก่อนเปิด Kitchen Mode
            </p>

            <button
              type="button"
              onClick={() =>
                router.push(
                  `/recipes/${recipe.id}/sop`
                )
              }
              className="mt-5 bg-amber-500 text-white font-bold px-5 py-2.5 rounded-xl"
            >
              ไปสร้าง SOP
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-6xl mx-auto min-h-screen flex flex-col">

        {/* TOP BAR */}

        <header className="px-4 sm:px-6 py-4 border-b border-white/10 sticky top-0 z-40 bg-slate-950/95 backdrop-blur">
          <div className="flex items-center justify-between gap-4">

            <button
              type="button"
              onClick={() =>
                router.push(
                  `/recipes/${recipe.id}/sop`
                )
              }
              className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4" />
              แก้ไข SOP
            </button>

            <div className="text-center min-w-0">
              <p className="text-[11px] text-amber-400 font-bold">
                KITCHEN MODE
              </p>

              <p className="font-bold truncate">
                {recipe.name}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setShowOverview(
                  !showOverview
                )
              }
              className="inline-flex items-center gap-2 text-sm bg-white/10 hover:bg-white/15 px-3 py-2 rounded-xl"
            >
              <Maximize2 className="w-4 h-4" />
              ภาพรวม
            </button>
          </div>
        </header>

        {/* OVERVIEW */}

        {showOverview && (
          <section className="mx-4 sm:mx-6 mt-5 bg-white/5 border border-white/10 rounded-3xl p-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <OverviewBox
                title="SOP"
                value={
                  sop.title
                }
              />

              <OverviewBox
                title="Version"
                value={
                  sop.version ||
                  "-"
                }
              />

              <OverviewBox
                title="Yield"
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

              <OverviewBox
                title="จำนวนผลิต"
                value={
                  recipe.servings
                    ? String(
                        recipe.servings
                      )
                    : "-"
                }
              />
            </div>

            {(sop.approved_by ||
              sop.approved_at) && (
              <p className="text-xs text-slate-400 mt-4">
                อนุมัติโดย{" "}
                <span className="text-white">
                  {sop.approved_by ||
                    "-"}
                </span>
                {" · "}
                {formatDate(
                  sop.approved_at
                )}
              </p>
            )}

            {sop.preparation && (
              <div className="mt-5">
                <p className="text-xs font-bold text-amber-400">
                  เตรียมก่อนเริ่มงาน
                </p>

                <p className="text-sm text-slate-200 mt-2 whitespace-pre-line leading-relaxed">
                  {sop.preparation}
                </p>
              </div>
            )}
          </section>
        )}

        {/* PROGRESS */}

        <div className="px-4 sm:px-6 mt-5">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>
              ขั้นตอน{" "}
              {steps.length > 0
                ? currentStepIndex +
                  1
                : 0}{" "}
              / {steps.length}
            </span>

            <span>
              {Math.round(
                progress
              )}
              %
            </span>
          </div>

          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 transition-all duration-300"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>
        </div>

        {/* NO STEPS */}

        {steps.length === 0 && (
          <div className="flex-1 flex items-center justify-center px-4 py-10">
            <div className="max-w-md text-center">
              <ChefHat className="w-12 h-12 text-slate-600 mx-auto" />

              <h2 className="font-bold text-xl mt-4">
                SOP นี้ยังไม่มีขั้นตอน
              </h2>

              <p className="text-sm text-slate-400 mt-2">
                กลับไปหน้า Edit แล้วเพิ่ม Step ก่อนใช้งาน Kitchen Mode
              </p>
            </div>
          </div>
        )}

        {/* CURRENT STEP */}

        {currentStep && (
          <section className="flex-1 px-4 sm:px-6 py-6">
            <div className="bg-white text-slate-900 rounded-[32px] overflow-hidden shadow-2xl">

              {/* STEP HEADER */}

              <div className="p-5 sm:p-7 border-b border-slate-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

                  <div>
                    <span className="inline-flex bg-amber-500 text-white font-extrabold text-sm px-3 py-1.5 rounded-lg">
                      STEP{" "}
                      {String(
                        currentStepIndex +
                          1
                      ).padStart(
                        2,
                        "0"
                      )}
                    </span>

                    <h1 className="text-2xl sm:text-3xl font-extrabold mt-3">
                      {currentStep.title}
                    </h1>
                  </div>

                  <div className="flex gap-2">
                    {currentStep.duration_minutes !==
                      null && (
                      <div className="bg-slate-100 rounded-xl px-4 py-3">
                        <p className="text-[11px] text-slate-400">
                          เวลา
                        </p>

                        <p className="font-bold flex items-center gap-1.5 mt-0.5">
                          <Clock3 className="w-4 h-4 text-amber-500" />
                          {formatNumber(
                            currentStep.duration_minutes
                          )}{" "}
                          นาที
                        </p>
                      </div>
                    )}

                    {currentStep.temperature_c !==
                      null && (
                      <div className="bg-slate-100 rounded-xl px-4 py-3">
                        <p className="text-[11px] text-slate-400">
                          อุณหภูมิ
                        </p>

                        <p className="font-bold flex items-center gap-1.5 mt-0.5">
                          <Thermometer className="w-4 h-4 text-red-500" />
                          {formatNumber(
                            currentStep.temperature_c
                          )}
                          °C
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* MAIN */}

              <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px]">

                {/* TEXT */}

                <div className="p-5 sm:p-7 space-y-6">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase">
                      วิธีทำ
                    </p>

                    <p className="text-lg sm:text-xl leading-relaxed whitespace-pre-line mt-2">
                      {currentStep.instruction ||
                        "ยังไม่ได้ระบุวิธีทำ"}
                    </p>
                  </div>

                  {currentStep.qc_target && (
                    <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5">
                      <div className="flex items-center gap-2 text-emerald-700">
                        <BadgeCheck className="w-5 h-5" />

                        <p className="font-extrabold">
                          จุดที่ต้องได้
                        </p>
                      </div>

                      <p className="text-base leading-relaxed text-emerald-900 mt-2 whitespace-pre-line">
                        {currentStep.qc_target}
                      </p>
                    </div>
                  )}

                  {currentStep.qc_warning && (
                    <div className="bg-red-50 border border-red-100 rounded-2xl p-5">
                      <div className="flex items-center gap-2 text-red-600">
                        <AlertTriangle className="w-5 h-5" />

                        <p className="font-extrabold">
                          สิ่งที่ไม่ควรเกิด
                        </p>
                      </div>

                      <p className="text-base leading-relaxed text-red-900 mt-2 whitespace-pre-line">
                        {currentStep.qc_warning}
                      </p>
                    </div>
                  )}
                </div>

                {/* IMAGE */}

                <div className="bg-slate-100 min-h-[320px] lg:min-h-[520px] flex items-center justify-center">
                  {currentStep.signedImageUrl ? (
                    <img
                      src={
                        currentStep.signedImageUrl
                      }
                      alt={
                        currentStep.title
                      }
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center text-slate-400 p-8">
                      <ChefHat className="w-12 h-12 mx-auto opacity-40" />

                      <p className="text-sm mt-3">
                        ขั้นตอนนี้ยังไม่มีภาพอ้างอิง
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* NAVIGATION */}

        {steps.length > 0 && (
          <footer className="sticky bottom-0 bg-slate-950/95 backdrop-blur border-t border-white/10 p-4 sm:px-6">
            <div className="max-w-6xl mx-auto grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={goPrevious}
                disabled={
                  currentStepIndex ===
                  0
                }
                className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 disabled:opacity-30 text-white font-bold py-4 rounded-2xl"
              >
                <ChevronLeft className="w-5 h-5" />
                ขั้นก่อนหน้า
              </button>

              <button
                type="button"
                onClick={goNext}
                disabled={
                  currentStepIndex ===
                  steps.length - 1
                }
                className="flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-30 text-white font-bold py-4 rounded-2xl"
              >
                ขั้นตอนถัดไป
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </footer>
        )}
      </div>
    </main>
  );
}

function OverviewBox({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-3">
      <p className="text-[11px] text-slate-400">
        {title}
      </p>

      <p className="font-bold text-sm mt-1">
        {value}
      </p>
    </div>
  );
}