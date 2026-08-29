"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  ArrowLeft,
  History,
  Search,
  CalendarDays,
  Factory,
  Trash2,
  BookOpenCheck,
  PlayCircle,
  ShoppingCart,
  BadgeDollarSign,
  CheckCircle2,
  Clock3,
  CircleDot,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

import {
  supabase,
} from "@/lib/supabase/client";

type RunStatus =
  | "planned"
  | "in_progress"
  | "done"
  | "cancelled";

type ProductionRunItem = {
  id: string;
  run_id: string;
  recipe_id: string | null;
  recipe_name: string;
  mode: "yield" | "servings";
  target_amount: number;
  target_unit: string | null;
  factor: number;
  full_batches: number;
  partial_batch_percent: number;
  production_yield: number | null;
  production_servings: number | null;
  status:
    | "planned"
    | "in_progress"
    | "done";
  ingredients: unknown[];
};

type ProductionRun = {
  id: string;
  user_id: string;
  title: string;
  production_date: string | null;
  status: RunStatus;
  total_used_cost: number;
  total_purchase_cost: number;
  shopping_list: unknown[];
  notes: string | null;
  created_at: string;
  updated_at: string;

  items: ProductionRunItem[];
};

const formatNumber = (
  value: number
) => {
  return new Intl.NumberFormat(
    "th-TH",
    {
      maximumFractionDigits: 3,
    }
  ).format(
    Number(value || 0)
  );
};

const formatDate = (
  value: string | null
) => {
  if (!value) {
    return "-";
  }

  const date =
    value.includes("T")
      ? new Date(value)
      : new Date(
          `${value}T00:00:00`
        );

  return new Intl.DateTimeFormat(
    "th-TH",
    {
      dateStyle:
        "medium",
    }
  ).format(date);
};

export default function ProductionHistoryPage() {
  const router =
    useRouter();

  const [
    runs,
    setRuns,
  ] =
    useState<
      ProductionRun[]
    >([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState<
      "all" | RunStatus
    >("all");

  const [
    expandedRunId,
    setExpandedRunId,
  ] =
    useState<
      string | null
    >(null);

  const [
    message,
    setMessage,
  ] = useState("");

  useEffect(() => {
    loadRuns();
  }, []);

  const loadRuns =
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
          "/production/history"
        );

        router.push(
          "/login"
        );

        return;
      }

      const {
        data:
          runData,
        error:
          runError,
      } =
        await supabase
          .from(
            "production_runs"
          )
          .select("*")
          .eq(
            "user_id",
            user.id
          )
          .order(
            "production_date",
            {
              ascending:
                false,
              nullsFirst:
                false,
            }
          )
          .order(
            "created_at",
            {
              ascending:
                false,
            }
          );

      if (runError) {
        setMessage(
          "โหลด Production History ไม่สำเร็จ: " +
            runError.message
        );

        setLoading(false);
        return;
      }

      const baseRuns =
        (runData ||
          []) as Omit<
          ProductionRun,
          "items"
        >[];

      if (
        baseRuns.length ===
        0
      ) {
        setRuns([]);
        setLoading(false);
        return;
      }

      const runIds =
        baseRuns.map(
          (run) =>
            run.id
        );

      const {
        data:
          itemData,
        error:
          itemError,
      } =
        await supabase
          .from(
            "production_run_items"
          )
          .select("*")
          .in(
            "run_id",
            runIds
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
        setMessage(
          "โหลดรายการสูตรใน Production History ไม่สำเร็จ: " +
            itemError.message
        );

        setLoading(false);
        return;
      }

      const grouped =
        new Map<
          string,
          ProductionRunItem[]
        >();

      for (
        const item of
        (
          itemData ||
          []
        ) as ProductionRunItem[]
      ) {
        const current =
          grouped.get(
            item.run_id
          ) || [];

        current.push(
          item
        );

        grouped.set(
          item.run_id,
          current
        );
      }

      setRuns(
        baseRuns.map(
          (run) => ({
            ...run,
            items:
              grouped.get(
                run.id
              ) || [],
          })
        )
      );

      setLoading(false);
    };

  const filteredRuns =
    useMemo(() => {
      const keyword =
        search
          .trim()
          .toLowerCase();

      return runs.filter(
        (run) => {
          const matchesStatus =
            statusFilter ===
              "all" ||
            run.status ===
              statusFilter;

          if (
            !matchesStatus
          ) {
            return false;
          }

          if (!keyword) {
            return true;
          }

          return (
            run.title
              .toLowerCase()
              .includes(
                keyword
              ) ||
            (
              run.notes ||
              ""
            )
              .toLowerCase()
              .includes(
                keyword
              ) ||
            run.items.some(
              (item) =>
                item.recipe_name
                  .toLowerCase()
                  .includes(
                    keyword
                  )
            )
          );
        }
      );
    }, [
      runs,
      search,
      statusFilter,
    ]);

  const updateRunStatus =
    async (
      run: ProductionRun,
      status: RunStatus
    ) => {
      const {
        data: { user },
      } =
        await supabase.auth.getUser();

      if (!user) {
        return;
      }

      const {
        error,
      } =
        await supabase
          .from(
            "production_runs"
          )
          .update({
            status,
            updated_at:
              new Date().toISOString(),
          })
          .eq(
            "id",
            run.id
          )
          .eq(
            "user_id",
            user.id
          );

      if (error) {
        setMessage(
          "เปลี่ยนสถานะไม่สำเร็จ: " +
            error.message
        );

        return;
      }

      setRuns(
        (current) =>
          current.map(
            (item) =>
              item.id ===
              run.id
                ? {
                    ...item,
                    status,
                  }
                : item
          )
      );
    };

  const deleteRun =
    async (
      run: ProductionRun
    ) => {
      const confirmed =
        window.confirm(
          `ต้องการลบ "${run.title}" ใช่หรือไม่? ประวัติงานผลิตชุดนี้จะถูกลบ`
        );

      if (!confirmed) {
        return;
      }

      const {
        data: { user },
      } =
        await supabase.auth.getUser();

      if (!user) {
        return;
      }

      const {
        error,
      } =
        await supabase
          .from(
            "production_runs"
          )
          .delete()
          .eq(
            "id",
            run.id
          )
          .eq(
            "user_id",
            user.id
          );

      if (error) {
        setMessage(
          "ลบ Production Run ไม่สำเร็จ: " +
            error.message
        );

        return;
      }

      setRuns(
        (current) =>
          current.filter(
            (item) =>
              item.id !==
              run.id
          )
      );
    };

  const totalRuns =
    runs.length;

  const plannedRuns =
    runs.filter(
      (run) =>
        run.status ===
        "planned"
    ).length;

  const activeRuns =
    runs.filter(
      (run) =>
        run.status ===
        "in_progress"
    ).length;

  const doneRuns =
    runs.filter(
      (run) =>
        run.status ===
        "done"
    ).length;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="max-w-7xl mx-auto">

        <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-7">
          <div>
            <button
              type="button"
              onClick={() =>
                router.push(
                  "/production"
                )
              }
              className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-amber-600"
            >
              <ArrowLeft className="w-4 h-4" />
              กลับ Production Center
            </button>

            <div className="flex items-center gap-3 mt-4">
              <div className="bg-slate-800 text-white p-3 rounded-2xl">
                <History className="w-6 h-6" />
              </div>

              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800">
                  Production History
                </h1>

                <p className="text-sm text-slate-500 mt-1">
                  งานผลิตที่บันทึกไว้และสถานะการผลิต
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              router.push(
                "/production"
              )
            }
            className="inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold px-5 py-3 rounded-xl text-sm"
          >
            <Factory className="w-4 h-4" />
            สร้างแผนการผลิต
          </button>
        </header>

        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <SummaryCard
            label="ทั้งหมด"
            value={
              totalRuns
            }
          />

          <SummaryCard
            label="รอผลิต"
            value={
              plannedRuns
            }
          />

          <SummaryCard
            label="กำลังผลิต"
            value={
              activeRuns
            }
          />

          <SummaryCard
            label="เสร็จแล้ว"
            value={
              doneRuns
            }
          />
        </section>

        <section className="bg-white border border-slate-200 rounded-2xl p-4 mb-5">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />

              <input
                value={
                  search
                }
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
                placeholder="ค้นหาชื่องาน สูตร หรือหมายเหตุ..."
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            <select
              value={
                statusFilter
              }
              onChange={(e) =>
                setStatusFilter(
                  e.target
                    .value as
                    | "all"
                    | RunStatus
                )
              }
              className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white"
            >
              <option value="all">
                ทุกสถานะ
              </option>
              <option value="planned">
                รอผลิต
              </option>
              <option value="in_progress">
                กำลังผลิต
              </option>
              <option value="done">
                เสร็จแล้ว
              </option>
              <option value="cancelled">
                ยกเลิก
              </option>
            </select>
          </div>
        </section>

        {message && (
          <div className="mb-5 bg-red-50 border border-red-100 text-red-600 rounded-xl px-4 py-3 text-sm">
            {message}
          </div>
        )}

        {loading ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center text-slate-500">
            กำลังโหลด Production History...
          </div>
        ) : filteredRuns.length ===
          0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center">
            <History className="w-12 h-12 text-slate-300 mx-auto" />

            <h2 className="font-extrabold text-slate-800 text-xl mt-4">
              ยังไม่มี Production Run
            </h2>

            <p className="text-sm text-slate-500 mt-2">
              บันทึกแผนจาก Production Center แล้วประวัติจะมาแสดงที่นี่
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRuns.map(
              (run) => {
                const expanded =
                  expandedRunId ===
                  run.id;

                return (
                  <article
                    key={
                      run.id
                    }
                    className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm"
                  >
                    <div className="p-5 sm:p-6">
                      <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="font-extrabold text-slate-800 text-lg">
                              {
                                run.title
                              }
                            </h2>

                            <RunStatusBadge
                              status={
                                run.status
                              }
                            />
                          </div>

                          <div className="flex flex-wrap gap-x-5 gap-y-2 mt-2 text-xs text-slate-500">
                            <span className="inline-flex items-center gap-1.5">
                              <CalendarDays className="w-3.5 h-3.5" />
                              {formatDate(
                                run.production_date
                              )}
                            </span>

                            <span>
                              {
                                run.items.length
                              }{" "}
                              สูตร
                            </span>

                            <span>
                              ต้นทุนใช้จริง{" "}
                              {Number(
                                run.total_used_cost ||
                                  0
                              ).toFixed(
                                2
                              )}{" "}
                              บาท
                            </span>

                            <span>
                              งบซื้อ{" "}
                              {Number(
                                run.total_purchase_cost ||
                                  0
                              ).toFixed(
                                2
                              )}{" "}
                              บาท
                            </span>
                          </div>

                          {run.notes && (
                            <p className="text-sm text-slate-500 mt-3">
                              {
                                run.notes
                              }
                            </p>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <select
                            value={
                              run.status
                            }
                            onChange={(e) =>
                              updateRunStatus(
                                run,
                                e.target
                                  .value as RunStatus
                              )
                            }
                            className="border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white"
                          >
                            <option value="planned">
                              รอผลิต
                            </option>
                            <option value="in_progress">
                              กำลังผลิต
                            </option>
                            <option value="done">
                              เสร็จแล้ว
                            </option>
                            <option value="cancelled">
                              ยกเลิก
                            </option>
                          </select>

                          <button
                            type="button"
                            onClick={() =>
                              setExpandedRunId(
                                expanded
                                  ? null
                                  : run.id
                              )
                            }
                            className="inline-flex items-center gap-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold px-3 py-2 rounded-xl text-xs"
                          >
                            {expanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}

                            รายละเอียด
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              deleteRun(
                                run
                              )
                            }
                            className="inline-flex items-center gap-2 border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 font-bold px-3 py-2 rounded-xl text-xs"
                          >
                            <Trash2 className="w-4 h-4" />
                            ลบ
                          </button>
                        </div>
                      </div>
                    </div>

                    {expanded && (
                      <div className="border-t border-slate-100">
                        <div className="p-5 sm:p-6">
                          <h3 className="font-extrabold text-slate-800 mb-4">
                            รายการผลิต
                          </h3>

                          <div className="space-y-3">
                            {run.items.map(
                              (item) => (
                                <div
                                  key={
                                    item.id
                                  }
                                  className="border border-slate-200 rounded-2xl p-4"
                                >
                                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                    <div>
                                      <p className="font-bold text-slate-800">
                                        {
                                          item.recipe_name
                                        }
                                      </p>

                                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-slate-500">
                                        <span>
                                          เป้าหมาย{" "}
                                          {formatNumber(
                                            item.target_amount
                                          )}{" "}
                                          {
                                            item.target_unit ||
                                            ""
                                          }
                                        </span>

                                        <span>
                                          {formatNumber(
                                            item.factor
                                          )}{" "}
                                          สูตร
                                        </span>

                                        <span>
                                          {
                                            item.full_batches
                                          }{" "}
                                          Batch เต็ม
                                          {Number(
                                            item.partial_batch_percent ||
                                              0
                                          ) >
                                          0
                                            ? ` + ${formatNumber(
                                                Number(
                                                  item.partial_batch_percent
                                                )
                                              )}%`
                                            : ""}
                                        </span>
                                      </div>
                                    </div>

                                    {item.recipe_id && (
                                      <div className="flex flex-wrap gap-2">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            router.push(
                                              `/recipes/${item.recipe_id}/sop`
                                            )
                                          }
                                          className="inline-flex items-center gap-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold px-3 py-2 rounded-xl text-xs"
                                        >
                                          <BookOpenCheck className="w-4 h-4" />
                                          SOP
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() =>
                                            router.push(
                                              `/recipes/${item.recipe_id}/sop/view`
                                            )
                                          }
                                          className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold px-3 py-2 rounded-xl text-xs"
                                        >
                                          <PlayCircle className="w-4 h-4" />
                                          Kitchen Mode
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )
                            )}
                          </div>

                          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                              <div className="flex items-center gap-2 text-slate-500">
                                <BadgeDollarSign className="w-4 h-4" />

                                <p className="text-xs font-bold">
                                  ต้นทุนวัตถุดิบใช้จริง
                                </p>
                              </div>

                              <p className="text-xl font-extrabold text-slate-800 mt-2">
                                {Number(
                                  run.total_used_cost ||
                                    0
                                ).toFixed(
                                  2
                                )}{" "}
                                บาท
                              </p>
                            </div>

                            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
                              <div className="flex items-center gap-2 text-amber-600">
                                <ShoppingCart className="w-4 h-4" />

                                <p className="text-xs font-bold">
                                  งบซื้อวัตถุดิบ
                                </p>
                              </div>

                              <p className="text-xl font-extrabold text-amber-700 mt-2">
                                {Number(
                                  run.total_purchase_cost ||
                                    0
                                ).toFixed(
                                  2
                                )}{" "}
                                บาท
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </article>
                );
              }
            )}
          </div>
        )}
      </div>
    </main>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5">
      <p className="text-xs text-slate-400">
        {label}
      </p>

      <p className="text-2xl font-extrabold text-slate-800 mt-1">
        {value}
      </p>
    </div>
  );
}

function RunStatusBadge({
  status,
}: {
  status: RunStatus;
}) {
  const content =
    status === "done"
      ? {
          label:
            "เสร็จแล้ว",
          className:
            "bg-emerald-50 text-emerald-700",
          icon:
            <CheckCircle2 className="w-3 h-3" />,
        }
      : status ===
        "in_progress"
      ? {
          label:
            "กำลังผลิต",
          className:
            "bg-blue-50 text-blue-700",
          icon:
            <CircleDot className="w-3 h-3" />,
        }
      : status ===
        "cancelled"
      ? {
          label:
            "ยกเลิก",
          className:
            "bg-red-50 text-red-600",
          icon:
            <CircleDot className="w-3 h-3" />,
        }
      : {
          label:
            "รอผลิต",
          className:
            "bg-amber-50 text-amber-700",
          icon:
            <Clock3 className="w-3 h-3" />,
        };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold ${content.className}`}
    >
      {content.icon}
      {content.label}
    </span>
  );
}
