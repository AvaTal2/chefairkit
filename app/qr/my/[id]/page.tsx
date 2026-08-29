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
  BarChart3,
  QrCode,
  Users,
  CalendarDays,
  Smartphone,
  Monitor,
  Tablet,
  Globe2,
  ExternalLink,
  RefreshCw,
  Clock3,
  Activity,
} from "lucide-react";

import { supabase } from "@/lib/supabase/client";
import { useSubscription } from "@/hooks/useSubscription";

type DynamicQr = {
  id: string;
  user_id: string;
  title: string;
  slug: string;
  destination_url: string;
  category: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type QrScan = {
  id: number;
  qr_id: string;
  scanned_at: string;
  user_agent: string | null;
  referrer: string | null;
  ip_hash: string | null;
  device_type: string | null;
  browser: string | null;
  os: string | null;
};

type BreakdownItem = {
  label: string;
  count: number;
  percent: number;
};

type DailyPoint = {
  key: string;
  label: string;
  count: number;
};

const startOfDay = (date: Date) => {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const daysAgo = (days: number) => {
  const date = startOfDay(new Date());
  date.setDate(date.getDate() - days);
  return date;
};

const formatDateTime = (value: string) => {
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

const formatDateShort = (date: Date) => {
  return new Intl.DateTimeFormat("th-TH", {
    day: "2-digit",
    month: "short",
  }).format(date);
};

export default function DynamicQrAnalyticsPage() {
  const params = useParams();
  const router = useRouter();

  const {
    loading: subscriptionLoading,
    permissions,
  } = useSubscription();

  const qrId = params.id as string;

  const [qr, setQr] = useState<DynamicQr | null>(null);
  const [scans, setScans] = useState<QrScan[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (subscriptionLoading) {
      return;
    }

    if (!permissions.canUseQrAnalytics) {
      setLoading(false);
      return;
    }

    if (qrId) {
      loadData();
    }
  }, [
    qrId,
    subscriptionLoading,
    permissions.canUseQrAnalytics,
  ]);

  const loadData = async () => {
    setLoading(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      sessionStorage.setItem(
        "chefair_after_login_redirect",
        `/qr/my/${qrId}`
      );

      router.push("/login");
      return;
    }

    const {
      data: qrData,
      error: qrError,
    } = await supabase
      .from("dynamic_qrs")
      .select("*")
      .eq("id", qrId)
      .eq("user_id", user.id)
      .single();

    if (qrError || !qrData) {
      setMessage(
        "ไม่พบ Dynamic QR นี้ หรือคุณไม่มีสิทธิ์เข้าถึง"
      );

      setLoading(false);
      return;
    }

    const {
      data: scanData,
      error: scanError,
    } = await supabase
      .from("qr_scans")
      .select("*")
      .eq("qr_id", qrId)
      .order("scanned_at", {
        ascending: false,
      });

    if (scanError) {
      setMessage(
        "โหลดข้อมูล Scan ไม่สำเร็จ: " +
          scanError.message
      );

      setLoading(false);
      return;
    }

    setQr(qrData as DynamicQr);
    setScans((scanData || []) as QrScan[]);
    setLoading(false);
  };

  const totalScans = scans.length;

  const uniqueScans = useMemo(() => {
    const hashes = new Set(
      scans
        .map((item) => item.ip_hash)
        .filter(Boolean)
    );

    return hashes.size;
  }, [scans]);

  const todayScans = useMemo(() => {
    const start = startOfDay(new Date()).getTime();

    return scans.filter(
      (item) =>
        new Date(item.scanned_at).getTime() >= start
    ).length;
  }, [scans]);

  const last7DaysScans = useMemo(() => {
    const start = daysAgo(6).getTime();

    return scans.filter(
      (item) =>
        new Date(item.scanned_at).getTime() >= start
    ).length;
  }, [scans]);

  const last30DaysScans = useMemo(() => {
    const start = daysAgo(29).getTime();

    return scans.filter(
      (item) =>
        new Date(item.scanned_at).getTime() >= start
    ).length;
  }, [scans]);

  const dailyTrend = useMemo<DailyPoint[]>(() => {
    const points: DailyPoint[] = [];

    for (let i = 13; i >= 0; i -= 1) {
      const date = daysAgo(i);

      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");

      const key = `${year}-${month}-${day}`;

      points.push({
        key,
        label: formatDateShort(date),
        count: 0,
      });
    }

    const map = new Map(
      points.map((item) => [item.key, item])
    );

    for (const scan of scans) {
      const date = new Date(scan.scanned_at);

      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");

      const key = `${year}-${month}-${day}`;

      const point = map.get(key);

      if (point) {
        point.count += 1;
      }
    }

    return points;
  }, [scans]);

  const buildBreakdown = (
    field: "device_type" | "browser" | "os"
  ): BreakdownItem[] => {
    const counts = new Map<string, number>();

    for (const scan of scans) {
      const label =
        (scan[field] || "Unknown").trim() || "Unknown";

      counts.set(
        label,
        (counts.get(label) || 0) + 1
      );
    }

    return Array.from(counts.entries())
      .map(([label, count]) => ({
        label,
        count,
        percent:
          totalScans > 0
            ? (count / totalScans) * 100
            : 0,
      }))
      .sort((a, b) => b.count - a.count);
  };

  const deviceBreakdown = useMemo(
    () => buildBreakdown("device_type"),
    [scans, totalScans]
  );

  const browserBreakdown = useMemo(
    () => buildBreakdown("browser"),
    [scans, totalScans]
  );

  const osBreakdown = useMemo(
    () => buildBreakdown("os"),
    [scans, totalScans]
  );

  const maxDailyCount = Math.max(
    ...dailyTrend.map((item) => item.count),
    1
  );

  const dynamicUrl =
    typeof window !== "undefined" && qr
      ? `${window.location.origin}/q/${qr.slug}`
      : qr
      ? `/q/${qr.slug}`
      : "";

  if (
    !subscriptionLoading &&
    !permissions.canUseQrAnalytics
  ) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-3xl p-10 text-center">
          <BarChart3 className="w-12 h-12 text-violet-300 mx-auto" />

          <h1 className="text-2xl font-extrabold text-slate-800 mt-4">
            QR Analytics
          </h1>

          <p className="text-sm text-slate-500 mt-2">
            รายงาน Dynamic QR ใช้ได้ในแพ็กเกจ Pro หรือ Business
          </p>

          <button
            type="button"
            onClick={() =>
              router.push(
                "/qr"
              )
            }
            className="mt-6 bg-violet-600 hover:bg-violet-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm"
          >
            กลับหน้าสร้าง QR
          </button>
        </div>
      </main>
    );
  }

  if (loading || subscriptionLoading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="max-w-7xl mx-auto bg-white border border-slate-200 rounded-3xl p-10 text-center text-slate-500">
          <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-3" />
          กำลังโหลด Analytics...
        </div>
      </main>
    );
  }

  if (!qr) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-3xl p-10 text-center">
          <h1 className="font-extrabold text-slate-800 text-xl">
            ไม่สามารถเปิด Analytics
          </h1>

          <p className="text-sm text-slate-500 mt-2">
            {message || "ไม่พบข้อมูล"}
          </p>

          <button
            type="button"
            onClick={() => router.push("/qr/my")}
            className="mt-5 bg-violet-600 hover:bg-violet-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm"
          >
            กลับ My Dynamic QR
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="max-w-7xl mx-auto">

        {/* HEADER */}

        <header className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5 mb-7">
          <div>
            <button
              type="button"
              onClick={() => router.push("/qr/my")}
              className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-violet-600"
            >
              <ArrowLeft className="w-4 h-4" />
              กลับ My Dynamic QR
            </button>

            <div className="flex items-center gap-3 mt-4">
              <div className="bg-violet-600 text-white p-3 rounded-2xl">
                <BarChart3 className="w-6 h-6" />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800">
                    QR Analytics
                  </h1>

                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                      qr.is_active
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {qr.is_active ? "ACTIVE" : "INACTIVE"}
                  </span>
                </div>

                <p className="text-sm text-slate-500 mt-1">
                  {qr.title}
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={loadData}
            className="inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-xl text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </header>

        {/* QR INFO */}

        <section className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-5">
            <div>
              <p className="text-xs font-bold text-slate-400">
                Dynamic URL
              </p>

              <div className="flex items-center gap-2 mt-1">
                <code className="text-sm text-slate-700 break-all">
                  {dynamicUrl}
                </code>

                <a
                  href={dynamicUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-violet-600 hover:text-violet-700 shrink-0"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>

              <p className="text-xs font-bold text-slate-400 mt-4">
                URL ปลายทางปัจจุบัน
              </p>

              <p className="text-sm text-slate-700 break-all mt-1">
                {qr.destination_url}
              </p>

              {qr.category && (
                <span className="inline-flex mt-4 bg-violet-50 text-violet-700 text-xs font-bold px-3 py-1.5 rounded-full">
                  {qr.category}
                </span>
              )}
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 min-w-[180px]">
              <p className="text-xs text-slate-400">
                สร้างเมื่อ
              </p>

              <p className="text-sm font-bold text-slate-700 mt-1">
                {formatDateTime(qr.created_at)}
              </p>
            </div>
          </div>
        </section>

        {/* KPI */}

        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 mb-6">
          <MetricCard
            icon={<Activity className="w-5 h-5" />}
            label="Total Scans"
            value={totalScans.toLocaleString("th-TH")}
          />

          <MetricCard
            icon={<Users className="w-5 h-5" />}
            label="Estimated Unique"
            value={uniqueScans.toLocaleString("th-TH")}
            hint="ประมาณจาก IP Hash"
          />

          <MetricCard
            icon={<Clock3 className="w-5 h-5" />}
            label="Today"
            value={todayScans.toLocaleString("th-TH")}
          />

          <MetricCard
            icon={<CalendarDays className="w-5 h-5" />}
            label="Last 7 Days"
            value={last7DaysScans.toLocaleString("th-TH")}
          />

          <MetricCard
            icon={<CalendarDays className="w-5 h-5" />}
            label="Last 30 Days"
            value={last30DaysScans.toLocaleString("th-TH")}
          />
        </section>

        {/* TREND */}

        <section className="bg-white border border-slate-200 rounded-3xl p-6 mb-6">
          <div className="mb-6">
            <h2 className="font-extrabold text-slate-800 text-lg">
              Scan Trend — 14 วันล่าสุด
            </h2>

            <p className="text-xs text-slate-400 mt-1">
              จำนวนครั้งที่ QR ถูกสแกนในแต่ละวัน
            </p>
          </div>

          <div className="grid grid-cols-14 gap-2 items-end min-h-[240px]">
            {dailyTrend.map((item) => {
              const height =
                item.count > 0
                  ? Math.max(
                      (item.count / maxDailyCount) * 170,
                      8
                    )
                  : 3;

              return (
                <div
                  key={item.key}
                  className="flex flex-col items-center justify-end h-[220px]"
                >
                  <div className="text-[10px] font-bold text-slate-500 mb-1">
                    {item.count}
                  </div>

                  <div
                    className="w-full max-w-[30px] bg-violet-500 rounded-t-lg"
                    style={{
                      height: `${height}px`,
                    }}
                  />

                  <div className="text-[9px] text-slate-400 mt-2 whitespace-nowrap -rotate-45 origin-top-left translate-x-2">
                    {item.label}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* BREAKDOWNS */}

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <BreakdownCard
            title="Device"
            items={deviceBreakdown}
            icon={<Smartphone className="w-5 h-5" />}
          />

          <BreakdownCard
            title="Browser"
            items={browserBreakdown}
            icon={<Globe2 className="w-5 h-5" />}
          />

          <BreakdownCard
            title="Operating System"
            items={osBreakdown}
            icon={<Monitor className="w-5 h-5" />}
          />
        </section>

        {/* RECENT SCANS */}

        <section className="bg-white border border-slate-200 rounded-3xl overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h2 className="font-extrabold text-slate-800 text-lg">
              Recent Scans
            </h2>

            <p className="text-xs text-slate-400 mt-1">
              แสดงรายการล่าสุดสูงสุด 100 ครั้ง
            </p>
          </div>

          {scans.length === 0 ? (
            <div className="p-10 text-center">
              <QrCode className="w-10 h-10 text-slate-300 mx-auto" />

              <h3 className="font-bold text-slate-700 mt-3">
                ยังไม่มี Scan
              </h3>

              <p className="text-sm text-slate-400 mt-1">
                ลองสแกน Dynamic QR แล้ว Refresh หน้านี้
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-sm">
                <thead className="bg-slate-50">
                  <tr className="text-slate-500">
                    <th className="text-left px-5 py-3">
                      เวลา
                    </th>

                    <th className="text-left px-5 py-3">
                      Device
                    </th>

                    <th className="text-left px-5 py-3">
                      Browser
                    </th>

                    <th className="text-left px-5 py-3">
                      OS
                    </th>

                    <th className="text-left px-5 py-3">
                      Referrer
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {scans
                    .slice(0, 100)
                    .map((scan) => (
                      <tr key={scan.id}>
                        <td className="px-5 py-4 text-slate-700 whitespace-nowrap">
                          {formatDateTime(scan.scanned_at)}
                        </td>

                        <td className="px-5 py-4">
                          <DeviceLabel value={scan.device_type} />
                        </td>

                        <td className="px-5 py-4 text-slate-600">
                          {scan.browser || "Unknown"}
                        </td>

                        <td className="px-5 py-4 text-slate-600">
                          {scan.os || "Unknown"}
                        </td>

                        <td className="px-5 py-4 text-slate-500 max-w-[300px] truncate">
                          {scan.referrer || "Direct / QR Scan"}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className="mt-6 bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3 text-xs text-amber-800 leading-relaxed">
          <strong>Estimated Unique Scans</strong>{" "}
          เป็นค่าประมาณจาก IP Hash ไม่ใช่จำนวนบุคคลแบบ 100%
          เพราะผู้ใช้หลายคนอาจใช้เครือข่ายเดียวกัน หรือ IP อาจเปลี่ยนได้
        </div>
      </div>
    </main>
  );
}

function MetricCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5">
      <div className="flex items-center gap-2 text-violet-600">
        {icon}
        <span className="text-xs font-bold">
          {label}
        </span>
      </div>

      <p className="text-2xl font-extrabold text-slate-800 mt-3">
        {value}
      </p>

      {hint && (
        <p className="text-[10px] text-slate-400 mt-1">
          {hint}
        </p>
      )}
    </div>
  );
}

function BreakdownCard({
  title,
  items,
  icon,
}: {
  title: string;
  items: BreakdownItem[];
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6">
      <div className="flex items-center gap-2 mb-5 text-slate-700">
        {icon}

        <h2 className="font-extrabold">
          {title}
        </h2>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-slate-400">
          ยังไม่มีข้อมูล
        </p>
      ) : (
        <div className="space-y-4">
          {items.slice(0, 8).map((item) => (
            <div key={item.label}>
              <div className="flex items-center justify-between gap-3 text-xs mb-1.5">
                <span className="font-semibold text-slate-600">
                  {item.label}
                </span>

                <span className="text-slate-400">
                  {item.count.toLocaleString("th-TH")} •{" "}
                  {item.percent.toFixed(1)}%
                </span>
              </div>

              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-violet-500 rounded-full"
                  style={{
                    width: `${Math.min(item.percent, 100)}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DeviceLabel({
  value,
}: {
  value: string | null;
}) {
  const normalized = (value || "").toLowerCase();

  if (normalized === "mobile") {
    return (
      <span className="inline-flex items-center gap-1.5 text-slate-600">
        <Smartphone className="w-4 h-4" />
        Mobile
      </span>
    );
  }

  if (normalized === "tablet") {
    return (
      <span className="inline-flex items-center gap-1.5 text-slate-600">
        <Tablet className="w-4 h-4" />
        Tablet
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-slate-600">
      <Monitor className="w-4 h-4" />
      {value || "Desktop"}
    </span>
  );
}
