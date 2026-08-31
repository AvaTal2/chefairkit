"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";
import {
  useRouter,
} from "next/navigation";

import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  BookOpenCheck,
  ChefHat,
  Clock3,
  FilePenLine,
  History,
  Loader2,
  MonitorPlay,
  Plus,
  Search,
  Sparkles,
} from "lucide-react";

import { supabase } from "@/lib/supabase/client";

type Recipe = {
  id: string;
  user_id: string;
  name: string;
  category: string | null;
  yield_amount: number | null;
  yield_unit: string | null;
  servings: number | null;
  created_at: string;
};

type RecipeSop = {
  id: string;
  user_id: string;
  recipe_id: string;
  title: string;
  version: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
};

type SopStatusFilter =
  | "all"
  | "draft"
  | "approved"
  | "not_started";

type SopRow = {
  recipe: Recipe;
  sop: RecipeSop | null;
};

const formatDate = (
  value: string | null
) => {
  if (!value) {
    return "-";
  }

  try {
    return new Intl.DateTimeFormat(
      "th-TH",
      {
        dateStyle: "medium",
      }
    ).format(
      new Date(value)
    );
  } catch {
    return "-";
  }
};

const formatYield = (
  recipe: Recipe
) => {
  if (
    !recipe.yield_amount ||
    recipe.yield_amount <= 0
  ) {
    return "-";
  }

  return `${new Intl.NumberFormat(
    "th-TH",
    {
      maximumFractionDigits: 3,
    }
  ).format(
    recipe.yield_amount
  )} ${recipe.yield_unit || ""}`;
};

export default function SopCenterPage() {
  const router = useRouter();

  const [
    rows,
    setRows,
  ] =
    useState<SopRow[]>([]);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState<SopStatusFilter>(
      "all"
    );

  const [
    message,
    setMessage,
  ] =
    useState("");

  useEffect(() => {
    loadSopCenter();
  }, []);

  const loadSopCenter =
    async () => {
      setLoading(true);
      setMessage("");

      const {
        data: {
          user,
        },
      } =
        await supabase.auth.getUser();

      if (!user) {
        sessionStorage.setItem(
          "chefair_after_login_redirect",
          "/sop"
        );

        router.push(
          "/login"
        );

        return;
      }

      const {
        data:
          recipeData,
        error:
          recipeError,
      } =
        await supabase
          .from(
            "recipes"
          )
          .select(
            `
            id,
            user_id,
            name,
            category,
            yield_amount,
            yield_unit,
            servings,
            created_at
            `
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
        recipeError
      ) {
        setMessage(
          "โหลดรายการสูตรไม่สำเร็จ: " +
            recipeError.message
        );

        setLoading(false);
        return;
      }

      const {
        data:
          sopData,
        error:
          sopError,
      } =
        await supabase
          .from(
            "recipe_sops"
          )
          .select(
            `
            id,
            user_id,
            recipe_id,
            title,
            version,
            approved_by,
            approved_at,
            created_at,
            updated_at
            `
          )
          .eq(
            "user_id",
            user.id
          )
          .order(
            "updated_at",
            {
              ascending:
                false,
            }
          );

      if (
        sopError
      ) {
        setMessage(
          "โหลดรายการ SOP ไม่สำเร็จ: " +
            sopError.message
        );

        setLoading(false);
        return;
      }

      const sopByRecipe =
        new Map<
          string,
          RecipeSop
        >();

      (
        (sopData ||
          []) as RecipeSop[]
      ).forEach(
        (sop) => {
          /*
           * ปัจจุบันโครงระบบใช้ 1 SOP ต่อ 1 สูตร
           * ถ้าพบมากกว่า 1 รายการ จะเลือกตัวที่ query ได้ล่าสุดก่อน
           */
          if (
            !sopByRecipe.has(
              sop.recipe_id
            )
          ) {
            sopByRecipe.set(
              sop.recipe_id,
              sop
            );
          }
        }
      );

      const combinedRows =
        (
          (recipeData ||
            []) as Recipe[]
        ).map(
          (recipe) => ({
            recipe,
            sop:
              sopByRecipe.get(
                recipe.id
              ) ||
              null,
          })
        );

      setRows(
        combinedRows
      );

      setLoading(false);
    };

  const summary =
    useMemo(() => {
      const totalRecipes =
        rows.length;

      const totalSops =
        rows.filter(
          (row) =>
            Boolean(
              row.sop
            )
        ).length;

      const approved =
        rows.filter(
          (row) =>
            Boolean(
              row.sop
                ?.approved_at
            )
        ).length;

      const draft =
        rows.filter(
          (row) =>
            Boolean(
              row.sop
            ) &&
            !row.sop
              ?.approved_at
        ).length;

      const notStarted =
        totalRecipes -
        totalSops;

      return {
        totalRecipes,
        totalSops,
        approved,
        draft,
        notStarted,
      };
    }, [rows]);

  const filteredRows =
    useMemo(() => {
      const keyword =
        search
          .trim()
          .toLocaleLowerCase(
            "th"
          );

      return rows.filter(
        (row) => {
          const recipeName =
            row.recipe.name
              .toLocaleLowerCase(
                "th"
              );

          const category =
            (
              row.recipe
                .category ||
              ""
            ).toLocaleLowerCase(
              "th"
            );

          const sopTitle =
            (
              row.sop
                ?.title ||
              ""
            ).toLocaleLowerCase(
              "th"
            );

          const matchesSearch =
            !keyword ||
            recipeName.includes(
              keyword
            ) ||
            category.includes(
              keyword
            ) ||
            sopTitle.includes(
              keyword
            );

          if (
            !matchesSearch
          ) {
            return false;
          }

          if (
            statusFilter ===
            "approved"
          ) {
            return Boolean(
              row.sop
                ?.approved_at
            );
          }

          if (
            statusFilter ===
            "draft"
          ) {
            return (
              Boolean(
                row.sop
              ) &&
              !row.sop
                ?.approved_at
            );
          }

          if (
            statusFilter ===
            "not_started"
          ) {
            return !row.sop;
          }

          return true;
        }
      );
    }, [
      rows,
      search,
      statusFilter,
    ]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center">
            <Loader2 className="w-7 h-7 text-amber-500 animate-spin mx-auto" />

            <p className="text-sm text-slate-500 mt-3">
              กำลังโหลด SOP Center...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="max-w-6xl mx-auto">

        {/* HERO */}

        <section className="relative overflow-hidden bg-slate-950 text-white rounded-[32px] p-6 sm:p-8 lg:p-10 shadow-xl mb-7">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.2),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(245,158,11,0.22),transparent_40%)]" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/10 text-amber-200 rounded-full px-3 py-1.5 text-xs font-bold">
                <Sparkles className="w-4 h-4" />
                SOP CENTER
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black mt-4 tracking-tight">
                ศูนย์กลาง SOP
                <span className="text-amber-400">
                  {" "}
                  ของทีมครัว
                </span>
              </h1>

              <p className="text-sm sm:text-base text-slate-300 mt-3 leading-relaxed max-w-2xl">
                ดูสถานะ SOP ทุกสูตรจากหน้าเดียว
                เริ่มสร้าง SOP ใหม่ เปิด Kitchen Mode
                และกลับมาแก้ไขเอกสารเดิมได้โดยไม่ต้องค้นผ่านหน้าสูตรก่อน
              </p>
            </div>

            <Link
              href="/recipes/new"
              className="inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold px-5 py-3 rounded-2xl transition shrink-0"
            >
              <Plus className="w-4 h-4" />
              สร้างสูตรใหม่
            </Link>
          </div>
        </section>

        {/* ERROR */}

        {message && (
          <div className="mb-6 bg-red-50 border border-red-100 text-red-600 rounded-2xl px-4 py-3 text-sm">
            {message}
          </div>
        )}

        {/* NO RECIPE */}

        {rows.length ===
        0 ? (
          <section className="bg-white border border-slate-200 rounded-[30px] p-8 sm:p-12 text-center shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <BookOpen className="w-8 h-8" />
            </div>

            <h2 className="text-2xl font-extrabold text-slate-800 mt-5">
              เริ่มต้น SOP ด้วยสูตรอาหาร
            </h2>

            <p className="text-sm text-slate-500 mt-3 max-w-xl mx-auto leading-relaxed">
              SOP ของ ChefWorkKit เชื่อมกับสูตรอาหาร
              เพื่อดึงชื่อสูตร วัตถุดิบ Yield และข้อมูลการผลิตมาใช้อ้างอิง
              สร้างสูตรแรกก่อน แล้วระบบจะพากลับมาสร้าง SOP ต่อได้
            </p>

            <Link
              href="/recipes/new"
              className="mt-6 inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold px-6 py-3 rounded-xl transition"
            >
              <Plus className="w-4 h-4" />
              สร้างสูตรแรก
            </Link>
          </section>
        ) : (
          <>
            {/* SUMMARY */}

            <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
              <SummaryCard
                label="SOP ทั้งหมด"
                value={
                  summary.totalSops
                }
                icon={
                  <BookOpenCheck className="w-5 h-5" />
                }
              />

              <SummaryCard
                label="Approved"
                value={
                  summary.approved
                }
                icon={
                  <BadgeCheck className="w-5 h-5" />
                }
                tone="success"
              />

              <SummaryCard
                label="Draft"
                value={
                  summary.draft
                }
                icon={
                  <FilePenLine className="w-5 h-5" />
                }
                tone="warning"
              />

              <SummaryCard
                label="ยังไม่ได้เริ่ม"
                value={
                  summary.notStarted
                }
                icon={
                  <ChefHat className="w-5 h-5" />
                }
              />
            </section>

            {/* SEARCH / FILTER */}

            <section className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm mb-6">
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-3">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

                  <input
                    value={
                      search
                    }
                    onChange={(
                      e
                    ) =>
                      setSearch(
                        e.target.value
                      )
                    }
                    placeholder="ค้นหาชื่อสูตร หรือชื่อ SOP..."
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <FilterButton
                    active={
                      statusFilter ===
                      "all"
                    }
                    onClick={() =>
                      setStatusFilter(
                        "all"
                      )
                    }
                  >
                    ทั้งหมด
                  </FilterButton>

                  <FilterButton
                    active={
                      statusFilter ===
                      "approved"
                    }
                    onClick={() =>
                      setStatusFilter(
                        "approved"
                      )
                    }
                  >
                    Approved
                  </FilterButton>

                  <FilterButton
                    active={
                      statusFilter ===
                      "draft"
                    }
                    onClick={() =>
                      setStatusFilter(
                        "draft"
                      )
                    }
                  >
                    Draft
                  </FilterButton>

                  <FilterButton
                    active={
                      statusFilter ===
                      "not_started"
                    }
                    onClick={() =>
                      setStatusFilter(
                        "not_started"
                      )
                    }
                  >
                    ยังไม่ได้เริ่ม
                  </FilterButton>
                </div>
              </div>
            </section>

            {/* SOP LIST */}

            {filteredRows.length ===
            0 ? (
              <section className="bg-white border border-slate-200 rounded-3xl p-10 text-center">
                <Search className="w-8 h-8 text-slate-300 mx-auto" />

                <h2 className="font-bold text-slate-800 mt-3">
                  ไม่พบรายการที่ค้นหา
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  ลองเปลี่ยนคำค้นหรือเลือกสถานะอื่น
                </p>
              </section>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {filteredRows.map(
                  ({
                    recipe,
                    sop,
                  }) => (
                    <article
                      key={
                        recipe.id
                      }
                      className="bg-white border border-slate-200 rounded-[26px] p-5 sm:p-6 shadow-sm hover:border-amber-300 transition"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            {sop ? (
                              sop.approved_at ? (
                                <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-1 rounded-full text-[10px] font-extrabold">
                                  <BadgeCheck className="w-3.5 h-3.5" />
                                  APPROVED
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-100 px-2.5 py-1 rounded-full text-[10px] font-extrabold">
                                  <FilePenLine className="w-3.5 h-3.5" />
                                  DRAFT
                                </span>
                              )
                            ) : (
                              <span className="bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full text-[10px] font-extrabold">
                                NOT STARTED
                              </span>
                            )}

                            {sop?.version && (
                              <span className="text-[10px] font-bold text-slate-400">
                                Version{" "}
                                {
                                  sop.version
                                }
                              </span>
                            )}
                          </div>

                          <h2 className="text-xl font-extrabold text-slate-800 truncate">
                            {sop?.title ||
                              `SOP - ${recipe.name}`}
                          </h2>

                          <p className="text-sm font-semibold text-amber-600 mt-1">
                            {recipe.name}
                          </p>

                          <p className="text-xs text-slate-400 mt-1">
                            {recipe.category ||
                              "ไม่ระบุหมวดหมู่"}
                          </p>
                        </div>

                        <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center shrink-0">
                          <BookOpenCheck className="w-6 h-6" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mt-5">
                        <InfoBox
                          label="Yield"
                          value={
                            formatYield(
                              recipe
                            )
                          }
                        />

                        <InfoBox
                          label="เสิร์ฟ / ชิ้น"
                          value={
                            recipe.servings
                              ? String(
                                  recipe.servings
                                )
                              : "-"
                          }
                        />
                      </div>

                      {sop ? (
                        <div className="mt-4 text-xs text-slate-400 flex items-center gap-1.5">
                          <Clock3 className="w-3.5 h-3.5" />
                          อัปเดต{" "}
                          {formatDate(
                            sop.updated_at
                          )}
                        </div>
                      ) : (
                        <div className="mt-4 bg-violet-50 border border-violet-100 text-violet-700 rounded-xl px-3 py-2.5 text-xs">
                          สูตรนี้พร้อมสำหรับเริ่มสร้าง SOP
                        </div>
                      )}

                      <div className="border-t border-slate-100 mt-5 pt-4 flex flex-wrap gap-2">
                        <Link
                          href={`/recipes/${recipe.id}/sop`}
                          className={`inline-flex items-center justify-center gap-2 font-bold px-4 py-2.5 rounded-xl text-xs transition ${
                            sop
                              ? "bg-amber-500 hover:bg-amber-600 text-white"
                              : "bg-violet-600 hover:bg-violet-700 text-white"
                          }`}
                        >
                          {sop ? (
                            <BookOpenCheck className="w-4 h-4" />
                          ) : (
                            <Plus className="w-4 h-4" />
                          )}

                          {sop
                            ? "เปิด / แก้ไข SOP"
                            : "สร้าง SOP"}
                        </Link>

                        {sop && (
                          <>
                            <Link
                              href={`/recipes/${recipe.id}/sop/view`}
                              className="inline-flex items-center justify-center gap-2 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold px-4 py-2.5 rounded-xl text-xs transition"
                            >
                              <MonitorPlay className="w-4 h-4" />
                              Kitchen Mode
                            </Link>

                            <Link
                              href={`/recipes/${recipe.id}/sop/history`}
                              className="inline-flex items-center justify-center gap-2 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold px-4 py-2.5 rounded-xl text-xs transition"
                            >
                              <History className="w-4 h-4" />
                              Version
                            </Link>
                          </>
                        )}

                        <Link
                          href={`/recipes/${recipe.id}`}
                          className="ml-auto inline-flex items-center justify-center gap-1.5 text-slate-500 hover:text-amber-600 font-bold px-2 py-2.5 text-xs transition"
                        >
                          ดูสูตร
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </article>
                  )
                )}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  tone = "default",
}: {
  label: string;
  value: number;
  icon:
    React.ReactNode;
  tone?:
    | "default"
    | "success"
    | "warning";
}) {
  const toneClass =
    tone === "success"
      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
      : tone ===
        "warning"
      ? "bg-amber-50 text-amber-700 border-amber-100"
      : "bg-white text-slate-700 border-slate-200";

  return (
    <div
      className={`rounded-2xl border p-4 sm:p-5 ${toneClass}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs opacity-70">
            {label}
          </p>

          <p className="text-2xl font-extrabold mt-1">
            {value}
          </p>
        </div>

        <div className="opacity-70">
          {icon}
        </div>
      </div>
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active:
    boolean;
  onClick:
    () => void;
  children:
    React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className={`px-3.5 py-2.5 rounded-xl text-xs font-bold border transition ${
        active
          ? "bg-slate-900 border-slate-900 text-white"
          : "bg-white border-slate-200 text-slate-600 hover:border-amber-300"
      }`}
    >
      {children}
    </button>
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
    <div className="bg-slate-50 rounded-xl p-3">
      <p className="text-[10px] text-slate-400">
        {label}
      </p>

      <p className="text-sm font-bold text-slate-700 mt-1">
        {value}
      </p>
    </div>
  );
}
