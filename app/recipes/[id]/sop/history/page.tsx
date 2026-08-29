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
  History,
  FileCheck2,
  ChefHat,
  Clock3,
  Thermometer,
  BadgeCheck,
  AlertTriangle,
  ImageIcon,
} from "lucide-react";

import { supabase } from "@/lib/supabase/client";

type Recipe = {
  id: string;
  name: string;
};

type SnapshotStep = {
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

type SopVersion = {
  id: string;
  user_id: string;
  recipe_id: string;
  sop_id: string;

  version: string;
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

  approved_by: string | null;
  approved_at: string | null;

  steps: SnapshotStep[];

  created_at: string;
};

const formatNumber = (
  value: number
) => {
  if (!Number.isFinite(value)) {
    return "-";
  }

  return new Intl.NumberFormat(
    "th-TH",
    {
      maximumFractionDigits: 3,
    }
  ).format(value);
};

const formatDateTime = (
  value: string | null
) => {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat(
    "th-TH",
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  ).format(
    new Date(value)
  );
};

export default function SopHistoryPage() {
  const params = useParams();
  const router = useRouter();

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
    versions,
    setVersions,
  ] =
    useState<SopVersion[]>([]);

  const [
    selectedVersionId,
    setSelectedVersionId,
  ] =
    useState<string | null>(
      null
    );

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
          `/recipes/${recipeId}/sop/history`
        );

        router.push("/login");
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
            name
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

        setLoading(false);
        return;
      }

      const {
        data:
          versionData,
        error:
          versionError,
      } =
        await supabase
          .from(
            "recipe_sop_versions"
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
          .order(
            "created_at",
            {
              ascending:
                false,
            }
          );

      if (
        versionError
      ) {
        setMessage(
          "โหลดประวัติ Version ไม่สำเร็จ: " +
            versionError.message
        );

        setLoading(false);
        return;
      }

      const rawVersions =
        (versionData ||
          []) as SopVersion[];

      const versionsWithImages =
        await Promise.all(
          rawVersions.map(
            async (
              item
            ) => {
              const rawSteps =
                Array.isArray(
                  item.steps
                )
                  ? item.steps
                  : [];

              const stepsWithImages =
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
                            60 *
                              60 *
                              6
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

              return {
                ...item,
                steps:
                  stepsWithImages,
              };
            }
          )
        );

      setRecipe(
        recipeData as Recipe
      );

      setVersions(
        versionsWithImages
      );

      if (
        versionsWithImages.length >
        0
      ) {
        setSelectedVersionId(
          versionsWithImages[0]
            .id
        );
      }

      setLoading(false);
    };

  const selectedVersion =
    useMemo(() => {
      if (
        versions.length === 0
      ) {
        return null;
      }

      return (
        versions.find(
          (item) =>
            item.id ===
            selectedVersionId
        ) || versions[0]
      );
    }, [
      versions,
      selectedVersionId,
    ]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="max-w-7xl mx-auto bg-white border border-slate-200 rounded-3xl p-10 text-center text-slate-500">
          กำลังโหลดประวัติ SOP...
        </div>
      </main>
    );
  }

  if (!recipe) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-3xl p-10 text-center">
          <h1 className="font-bold text-xl text-slate-800">
            ไม่สามารถเปิดประวัติ SOP
          </h1>

          <p className="text-sm text-slate-500 mt-2">
            {message ||
              "ไม่พบข้อมูล"}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="max-w-7xl mx-auto">

        <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-7">
          <div>
            <button
              type="button"
              onClick={() =>
                router.push(
                  `/recipes/${recipe.id}/sop`
                )
              }
              className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-amber-600"
            >
              <ArrowLeft className="w-4 h-4" />
              กลับหน้า SOP
            </button>

            <div className="flex items-center gap-3 mt-4">
              <div className="bg-slate-800 text-white p-3 rounded-2xl">
                <History className="w-6 h-6" />
              </div>

              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800">
                  SOP Version History
                </h1>

                <p className="text-sm text-slate-500 mt-1">
                  {recipe.name}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3">
            <p className="text-xs text-slate-400">
              Approved Versions
            </p>

            <p className="font-extrabold text-slate-800 text-xl">
              {versions.length}
            </p>
          </div>
        </header>

        {message && (
          <div className="mb-6 bg-red-50 border border-red-100 text-red-600 rounded-2xl px-4 py-3 text-sm">
            {message}
          </div>
        )}

        {versions.length ===
        0 ? (
          <section className="bg-white border border-slate-200 rounded-3xl p-12 text-center">
            <FileCheck2 className="w-12 h-12 text-slate-300 mx-auto" />

            <h2 className="font-extrabold text-slate-800 text-xl mt-4">
              ยังไม่มี Version ที่อนุมัติ
            </h2>

            <p className="text-sm text-slate-500 mt-2">
              เมื่อกด “อนุมัติ SOP” ระบบจะเก็บ Snapshot ไว้ที่หน้านี้อัตโนมัติ
            </p>
          </section>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">

            {/* VERSION LIST */}

            <aside className="space-y-3">
              {versions.map(
                (item) => {
                  const active =
                    item.id ===
                    selectedVersion?.id;

                  return (
                    <button
                      key={
                        item.id
                      }
                      type="button"
                      onClick={() =>
                        setSelectedVersionId(
                          item.id
                        )
                      }
                      className={`w-full text-left rounded-2xl border p-4 transition ${
                        active
                          ? "bg-slate-800 border-slate-800 text-white"
                          : "bg-white border-slate-200 hover:border-amber-300 text-slate-800"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-extrabold">
                          Version{" "}
                          {
                            item.version
                          }
                        </p>

                        <FileCheck2
                          className={`w-4 h-4 ${
                            active
                              ? "text-emerald-300"
                              : "text-emerald-600"
                          }`}
                        />
                      </div>

                      <p
                        className={`text-xs mt-2 ${
                          active
                            ? "text-slate-300"
                            : "text-slate-500"
                        }`}
                      >
                        {formatDateTime(
                          item.approved_at
                        )}
                      </p>

                      <p
                        className={`text-xs mt-1 ${
                          active
                            ? "text-slate-400"
                            : "text-slate-400"
                        }`}
                      >
                        โดย{" "}
                        {item.approved_by ||
                          "-"}
                      </p>
                    </button>
                  );
                }
              )}
            </aside>

            {/* SNAPSHOT DETAIL */}

            {selectedVersion && (
              <article className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">

                <div className="bg-slate-800 text-white p-6">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5">
                    <div>
                      <p className="text-xs font-bold text-emerald-300">
                        APPROVED SNAPSHOT
                      </p>

                      <h2 className="text-2xl font-extrabold mt-1">
                        {
                          selectedVersion.title
                        }
                      </h2>

                      <p className="text-sm text-slate-300 mt-2">
                        Version{" "}
                        {
                          selectedVersion.version
                        }
                      </p>
                    </div>

                    <div className="text-sm md:text-right">
                      <p>
                        ผู้อนุมัติ:{" "}
                        <strong>
                          {selectedVersion.approved_by ||
                            "-"}
                        </strong>
                      </p>

                      <p className="text-slate-300 mt-1">
                        {formatDateTime(
                          selectedVersion.approved_at
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6 sm:p-8 space-y-8">

                  <SnapshotSection
                    title="ข้อมูลผลิตภัณฑ์"
                    content={
                      selectedVersion.product_description
                    }
                  />

                  <SnapshotSection
                    title="อุปกรณ์"
                    content={
                      selectedVersion.equipment
                    }
                  />

                  <SnapshotSection
                    title="การเตรียมก่อนผลิต"
                    content={
                      selectedVersion.preparation
                    }
                  />

                  <section>
                    <h3 className="font-extrabold text-slate-800 text-lg mb-4">
                      ขั้นตอนการผลิต
                    </h3>

                    {selectedVersion.steps.length ===
                    0 ? (
                      <div className="border border-dashed border-slate-300 rounded-2xl p-6 text-sm text-slate-500">
                        Version นี้ไม่มี Step
                      </div>
                    ) : (
                      <div className="space-y-5">
                        {selectedVersion.steps
                          .slice()
                          .sort(
                            (
                              a,
                              b
                            ) =>
                              a.step_order -
                              b.step_order
                          )
                          .map(
                            (
                              step,
                              index
                            ) => (
                              <div
                                key={`${selectedVersion.id}-${step.step_order}-${index}`}
                                className="border border-slate-200 rounded-2xl overflow-hidden"
                              >
                                <div className="bg-slate-50 px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                  <div>
                                    <p className="text-[10px] font-bold text-amber-600">
                                      STEP{" "}
                                      {String(
                                        index +
                                          1
                                      ).padStart(
                                        2,
                                        "0"
                                      )}
                                    </p>

                                    <p className="font-extrabold text-slate-800">
                                      {
                                        step.title
                                      }
                                    </p>
                                  </div>

                                  <div className="flex gap-2 text-xs">
                                    {step.duration_minutes !==
                                      null && (
                                      <span className="inline-flex items-center gap-1 bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg">
                                        <Clock3 className="w-3.5 h-3.5" />

                                        {formatNumber(
                                          step.duration_minutes
                                        )}{" "}
                                        นาที
                                      </span>
                                    )}

                                    {step.temperature_c !==
                                      null && (
                                      <span className="inline-flex items-center gap-1 bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg">
                                        <Thermometer className="w-3.5 h-3.5" />

                                        {formatNumber(
                                          step.temperature_c
                                        )}
                                        °C
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px]">
                                  <div className="p-5 space-y-4">
                                    <div>
                                      <p className="text-xs font-bold text-slate-400">
                                        วิธีทำ
                                      </p>

                                      <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-line mt-1">
                                        {step.instruction ||
                                          "-"}
                                      </p>
                                    </div>

                                    {step.qc_target && (
                                      <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                                        <p className="font-bold text-emerald-700 text-sm flex items-center gap-2">
                                          <BadgeCheck className="w-4 h-4" />
                                          QC Target
                                        </p>

                                        <p className="text-sm text-emerald-900 mt-2 whitespace-pre-line">
                                          {
                                            step.qc_target
                                          }
                                        </p>
                                      </div>
                                    )}

                                    {step.qc_warning && (
                                      <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                                        <p className="font-bold text-red-600 text-sm flex items-center gap-2">
                                          <AlertTriangle className="w-4 h-4" />
                                          QC Warning
                                        </p>

                                        <p className="text-sm text-red-900 mt-2 whitespace-pre-line">
                                          {
                                            step.qc_warning
                                          }
                                        </p>
                                      </div>
                                    )}
                                  </div>

                                  <div className="bg-slate-100 min-h-[220px] flex items-center justify-center">
                                    {step.signedImageUrl ? (
                                      <img
                                        src={
                                          step.signedImageUrl
                                        }
                                        alt={
                                          step.title
                                        }
                                        className="w-full h-full min-h-[220px] object-cover"
                                      />
                                    ) : (
                                      <div className="text-center text-slate-400 p-6">
                                        <ImageIcon className="w-8 h-8 mx-auto opacity-50" />

                                        <p className="text-xs mt-2">
                                          ไม่มีภาพ Snapshot
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )
                          )}
                      </div>
                    )}
                  </section>

                  <SnapshotSection
                    title="จุดสำคัญ / จุดควบคุมรวม"
                    content={
                      selectedVersion.critical_points
                    }
                  />

                  <SnapshotSection
                    title="Quality Control รวม"
                    content={
                      selectedVersion.quality_control
                    }
                  />

                  <SnapshotSection
                    title="การบรรจุและการเก็บรักษา"
                    content={
                      selectedVersion.packing_storage
                    }
                  />

                  <SnapshotSection
                    title="สุขลักษณะและความสะอาด"
                    content={
                      selectedVersion.sanitation
                    }
                  />

                  <SnapshotSection
                    title="ผู้รับผิดชอบ"
                    content={
                      selectedVersion.responsibilities
                    }
                  />

                  {selectedVersion.notes && (
                    <SnapshotSection
                      title="หมายเหตุ"
                      content={
                        selectedVersion.notes
                      }
                    />
                  )}
                </div>
              </article>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

function SnapshotSection({
  title,
  content,
}: {
  title: string;
  content:
    | string
    | null;
}) {
  if (!content) {
    return null;
  }

  return (
    <section>
      <h3 className="font-extrabold text-slate-800 text-lg mb-3">
        {title}
      </h3>

      <div className="border border-slate-200 rounded-2xl p-5">
        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
          {content}
        </p>
      </div>
    </section>
  );
}
