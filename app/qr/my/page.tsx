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
  QrCode,
  Search,
  ExternalLink,
  Save,
  Trash2,
  Copy,
  Power,
  PowerOff,
  BarChart3,
  RefreshCw,
  Plus,
  Download,
} from "lucide-react";

import {
  QRCodeSVG,
} from "qrcode.react";

import {
  supabase,
} from "@/lib/supabase/client";

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

  scanCount?: number;
};

export default function MyDynamicQrPage() {
  const router = useRouter();

  const {
    loading: subscriptionLoading,
    permissions,
  } = useSubscription();

  const [
    items,
    setItems,
  ] = useState<DynamicQr[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    savingId,
    setSavingId,
  ] = useState<string | null>(null);

  const [
    deletingId,
    setDeletingId,
  ] = useState<string | null>(null);

  const [
    message,
    setMessage,
  ] = useState("");

  useEffect(() => {
    if (subscriptionLoading) {
      return;
    }

    if (!permissions.canUseDynamicQr) {
      setLoading(false);
      return;
    }

    loadData();
  }, [
    subscriptionLoading,
    permissions.canUseDynamicQr,
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
        "/qr/my"
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
      .eq("user_id", user.id)
      .order("created_at", {
        ascending: false,
      });

    if (qrError) {
      setMessage(
        "โหลด Dynamic QR ไม่สำเร็จ: " +
          qrError.message
      );

      setLoading(false);
      return;
    }

    const baseItems =
      (qrData || []) as DynamicQr[];

    if (baseItems.length === 0) {
      setItems([]);
      setLoading(false);
      return;
    }

    const qrIds =
      baseItems.map(
        (item) => item.id
      );

    const {
      data: scanData,
      error: scanError,
    } = await supabase
      .from("qr_scans")
      .select("qr_id")
      .in("qr_id", qrIds);

    if (scanError) {
      console.error(
        "โหลดจำนวน Scan ไม่สำเร็จ:",
        scanError
      );
    }

    const counts =
      new Map<string, number>();

    for (
      const scan of scanData || []
    ) {
      counts.set(
        scan.qr_id,
        (counts.get(
          scan.qr_id
        ) || 0) + 1
      );
    }

    setItems(
      baseItems.map(
        (item) => ({
          ...item,
          scanCount:
            counts.get(
              item.id
            ) || 0,
        })
      )
    );

    setLoading(false);
  };

  const filteredItems =
    useMemo(() => {
      const keyword =
        search
          .trim()
          .toLowerCase();

      if (!keyword) {
        return items;
      }

      return items.filter(
        (item) =>
          item.title
            .toLowerCase()
            .includes(
              keyword
            ) ||
          item.destination_url
            .toLowerCase()
            .includes(
              keyword
            ) ||
          (
            item.category ||
            ""
          )
            .toLowerCase()
            .includes(
              keyword
            )
      );
    }, [items, search]);

  const updateLocal = (
    id: string,
    field:
      | "title"
      | "destination_url"
      | "category",
    value: string
  ) => {
    setItems(
      (current) =>
        current.map(
          (item) =>
            item.id === id
              ? {
                  ...item,
                  [field]:
                    value,
                }
              : item
        )
    );
  };

  const normalizeUrl = (
    value: string
  ) => {
    try {
      const url =
        new URL(
          value.trim()
        );

      if (
        url.protocol !==
          "http:" &&
        url.protocol !==
          "https:"
      ) {
        return null;
      }

      return url.toString();
    } catch {
      return null;
    }
  };

  const saveItem =
    async (
      item: DynamicQr
    ) => {
      const destination =
        normalizeUrl(
          item.destination_url
        );

      if (!destination) {
        setMessage(
          `URL ของ "${item.title}" ไม่ถูกต้อง`
        );

        return;
      }

      setSavingId(
        item.id
      );

      setMessage("");

      const {
        data: { user },
      } =
        await supabase.auth.getUser();

      if (!user) {
        setSavingId(
          null
        );

        return;
      }

      const {
        error,
      } =
        await supabase
          .from(
            "dynamic_qrs"
          )
          .update({
            title:
              item.title.trim() ||
              "Dynamic QR",

            destination_url:
              destination,

            category:
              item.category?.trim() ||
              null,

            updated_at:
              new Date().toISOString(),
          })
          .eq(
            "id",
            item.id
          )
          .eq(
            "user_id",
            user.id
          );

      if (error) {
        setMessage(
          "บันทึกไม่สำเร็จ: " +
            error.message
        );

        setSavingId(
          null
        );

        return;
      }

      setItems(
        (current) =>
          current.map(
            (currentItem) =>
              currentItem.id ===
              item.id
                ? {
                    ...currentItem,
                    destination_url:
                      destination,
                  }
                : currentItem
          )
      );

      setSavingId(
        null
      );

      setMessage(
        `✓ บันทึก "${item.title}" แล้ว — QR เดิมยังใช้ได้`
      );
    };

  const toggleActive =
    async (
      item: DynamicQr
    ) => {
      const {
        data: { user },
      } =
        await supabase.auth.getUser();

      if (!user) {
        return;
      }

      const nextValue =
        !item.is_active;

      const {
        error,
      } =
        await supabase
          .from(
            "dynamic_qrs"
          )
          .update({
            is_active:
              nextValue,

            updated_at:
              new Date().toISOString(),
          })
          .eq(
            "id",
            item.id
          )
          .eq(
            "user_id",
            user.id
          );

      if (error) {
        setMessage(
          "เปลี่ยนสถานะ QR ไม่สำเร็จ: " +
            error.message
        );

        return;
      }

      setItems(
        (current) =>
          current.map(
            (currentItem) =>
              currentItem.id ===
              item.id
                ? {
                    ...currentItem,
                    is_active:
                      nextValue,
                  }
                : currentItem
          )
      );
    };

  const duplicateItem =
    async (
      item: DynamicQr
    ) => {
      const {
        data: { user },
      } =
        await supabase.auth.getUser();

      if (!user) {
        return;
      }

      const slug =
        crypto
          .randomUUID()
          .replace(
            /-/g,
            ""
          )
          .slice(
            0,
            10
          )
          .toLowerCase();

      const {
        error,
      } =
        await supabase
          .from(
            "dynamic_qrs"
          )
          .insert({
            user_id:
              user.id,

            title:
              `${item.title} Copy`,

            slug,

            destination_url:
              item.destination_url,

            category:
              item.category,

            is_active:
              true,
          });

      if (error) {
        setMessage(
          "Duplicate QR ไม่สำเร็จ: " +
            error.message
        );

        return;
      }

      await loadData();
    };

  const deleteItem =
    async (
      item: DynamicQr
    ) => {
      const confirmed =
        window.confirm(
          `ต้องการลบ "${item.title}" ใช่หรือไม่? QR ที่พิมพ์ไปแล้วจะใช้งานไม่ได้ทันที`
        );

      if (!confirmed) {
        return;
      }

      setDeletingId(
        item.id
      );

      const {
        data: { user },
      } =
        await supabase.auth.getUser();

      if (!user) {
        setDeletingId(
          null
        );

        return;
      }

      const {
        error,
      } =
        await supabase
          .from(
            "dynamic_qrs"
          )
          .delete()
          .eq(
            "id",
            item.id
          )
          .eq(
            "user_id",
            user.id
          );

      if (error) {
        setMessage(
          "ลบ QR ไม่สำเร็จ: " +
            error.message
        );

        setDeletingId(
          null
        );

        return;
      }

      setItems(
        (current) =>
          current.filter(
            (currentItem) =>
              currentItem.id !==
              item.id
          )
      );

      setDeletingId(
        null
      );
    };

  const downloadQr = (
    item: DynamicQr
  ) => {
    const svgElement =
      document.getElementById(
        `dynamic-qr-${item.id}`
      ) as SVGElement | null;

    if (!svgElement) {
      return;
    }

    const svgData =
      new XMLSerializer()
        .serializeToString(
          svgElement
        );

    const canvas =
      document.createElement(
        "canvas"
      );

    const ctx =
      canvas.getContext("2d");

    const img =
      new Image();

    img.onload = () => {
      canvas.width = 500;
      canvas.height = 560;

      if (!ctx) {
        return;
      }

      ctx.fillStyle =
        "#FFFFFF";

      ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
      );

      ctx.drawImage(
        img,
        70,
        50,
        360,
        360
      );

      ctx.fillStyle =
        "#1E293B";

      ctx.font =
        "bold 18px sans-serif";

      ctx.textAlign =
        "center";

      ctx.fillText(
        item.title,
        250,
        445
      );

      ctx.fillStyle =
        "#64748B";

      ctx.font =
        "13px sans-serif";

      ctx.fillText(
        "Dynamic QR • ChefAir Kit",
        250,
        480
      );

      const pngFile =
        canvas.toDataURL(
          "image/png"
        );

      const link =
        document.createElement(
          "a"
        );

      link.download =
        `Dynamic-QR-${item.slug}.png`;

      link.href =
        pngFile;

      link.click();
    };

    img.src =
      "data:image/svg+xml;base64," +
      btoa(
        unescape(
          encodeURIComponent(
            svgData
          )
        )
      );
  };

  const totalScans =
    items.reduce(
      (
        sum,
        item
      ) =>
        sum +
        (
          item.scanCount ||
          0
        ),
      0
    );

  if (
    !subscriptionLoading &&
    !permissions.canUseDynamicQr
  ) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-3xl p-10 text-center">
          <QrCode className="w-12 h-12 text-violet-300 mx-auto" />

          <h1 className="text-2xl font-extrabold text-slate-800 mt-4">
            Dynamic QR Pro
          </h1>

          <p className="text-sm text-slate-500 mt-2">
            ฟังก์ชันจัดการ Dynamic QR และ Analytics ใช้ได้ในแพ็กเกจ Pro หรือ Business
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

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="max-w-7xl mx-auto">

        <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-7">
          <div>
            <button
              type="button"
              onClick={() =>
                router.push(
                  "/qr"
                )
              }
              className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-amber-600"
            >
              <ArrowLeft className="w-4 h-4" />
              กลับหน้าสร้าง QR
            </button>

            <div className="flex items-center gap-3 mt-4">
              <div className="bg-violet-600 text-white p-3 rounded-2xl">
                <QrCode className="w-6 h-6" />
              </div>

              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800">
                  My Dynamic QR
                </h1>

                <p className="text-sm text-slate-500 mt-1">
                  เปลี่ยนปลายทาง จัดการ QR และดูจำนวน Scan
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              router.push(
                "/qr"
              )
            }
            className="inline-flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-bold px-5 py-3 rounded-xl text-sm"
          >
            <Plus className="w-4 h-4" />
            สร้าง Dynamic QR
          </button>
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <SummaryCard
            label="Dynamic QR"
            value={
              String(
                items.length
              )
            }
          />

          <SummaryCard
            label="Active"
            value={
              String(
                items.filter(
                  (item) =>
                    item.is_active
                ).length
              )
            }
          />

          <SummaryCard
            label="Total Scans"
            value={
              totalScans.toLocaleString(
                "th-TH"
              )
            }
          />
        </section>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-5">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />

            <input
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              placeholder="ค้นหาชื่อ QR, URL หรือหมวดหมู่..."
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-500"
            />
          </div>
        </div>

        {message && (
          <div
            className={`mb-5 rounded-xl px-4 py-3 text-sm ${
              message.startsWith(
                "✓"
              )
                ? "bg-emerald-50 border border-emerald-100 text-emerald-700"
                : "bg-red-50 border border-red-100 text-red-600"
            }`}
          >
            {message}
          </div>
        )}

        {loading ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center text-slate-500">
            กำลังโหลด Dynamic QR...
          </div>
        ) : filteredItems.length ===
          0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center">
            <QrCode className="w-12 h-12 text-slate-300 mx-auto" />

            <h2 className="font-extrabold text-slate-800 text-xl mt-4">
              ยังไม่มี Dynamic QR
            </h2>

            <p className="text-sm text-slate-500 mt-2">
              สร้าง QR แรกของคุณ แล้วกลับมาจัดการได้จากหน้านี้
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredItems.map(
              (item) => {
                const dynamicUrl =
                  typeof window !==
                  "undefined"
                    ? `${window.location.origin}/q/${item.slug}`
                    : `/q/${item.slug}`;

                return (
                  <article
                    key={
                      item.id
                    }
                    className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm"
                  >
                    <div className="grid grid-cols-1 xl:grid-cols-[170px_1fr] gap-6">
                      <div className="flex flex-col items-center">
                        <div className="bg-white border border-slate-200 rounded-2xl p-3">
                          <QRCodeSVG
                            id={`dynamic-qr-${item.id}`}
                            value={
                              dynamicUrl
                            }
                            size={
                              135
                            }
                            level="H"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            downloadQr(
                              item
                            )
                          }
                          className="mt-3 w-full inline-flex items-center justify-center gap-2 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold px-3 py-2 rounded-xl text-xs"
                        >
                          <Download className="w-3.5 h-3.5" />
                          PNG
                        </button>
                      </div>

                      <div>
                        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                              <span
                                className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                                  item.is_active
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-slate-100 text-slate-500"
                                }`}
                              >
                                {item.is_active
                                  ? "ACTIVE"
                                  : "INACTIVE"}
                              </span>

                              {item.category && (
                                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-violet-50 text-violet-700">
                                  {item.category}
                                </span>
                              )}

                              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">
                                {(item.scanCount || 0).toLocaleString("th-TH")} SCANS
                              </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <label className="text-xs font-semibold text-slate-500">
                                  ชื่อ QR
                                </label>

                                <input
                                  value={
                                    item.title
                                  }
                                  onChange={(e) =>
                                    updateLocal(
                                      item.id,
                                      "title",
                                      e.target.value
                                    )
                                  }
                                  className="mt-1 w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-500"
                                />
                              </div>

                              <div>
                                <label className="text-xs font-semibold text-slate-500">
                                  หมวดหมู่
                                </label>

                                <input
                                  value={
                                    item.category ||
                                    ""
                                  }
                                  onChange={(e) =>
                                    updateLocal(
                                      item.id,
                                      "category",
                                      e.target.value
                                    )
                                  }
                                  placeholder="ไม่บังคับ"
                                  className="mt-1 w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-500"
                                />
                              </div>
                            </div>

                            <div className="mt-3">
                              <label className="text-xs font-semibold text-slate-500">
                                URL ปลายทาง
                              </label>

                              <input
                                value={
                                  item.destination_url
                                }
                                onChange={(e) =>
                                  updateLocal(
                                    item.id,
                                    "destination_url",
                                    e.target.value
                                  )
                                }
                                className="mt-1 w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-500"
                              />

                              <p className="text-[10px] text-slate-400 mt-1.5 break-all">
                                Dynamic URL:{" "}
                                {dynamicUrl}
                              </p>
                            </div>
                          </div>

                          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 lg:w-[180px]">
                            <p className="text-xs text-slate-400">
                              Total Scans
                            </p>

                            <p className="text-2xl font-extrabold text-slate-800 mt-1">
                              {(item.scanCount || 0).toLocaleString("th-TH")}
                            </p>

                            <button
                              type="button"
                              onClick={() =>
                                router.push(
                                  `/qr/my/${item.id}`
                                )
                              }
                              className="mt-3 w-full inline-flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white font-bold px-3 py-2 rounded-xl text-xs"
                            >
                              <BarChart3 className="w-3.5 h-3.5" />
                              Analytics
                            </button>
                          </div>
                        </div>

                        <div className="mt-5 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              saveItem(
                                item
                              )
                            }
                            disabled={
                              savingId ===
                              item.id
                            }
                            className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white font-bold px-4 py-2.5 rounded-xl text-xs"
                          >
                            {savingId ===
                            item.id ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Save className="w-3.5 h-3.5" />
                            )}

                            บันทึก
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              toggleActive(
                                item
                              )
                            }
                            className={`inline-flex items-center gap-2 border font-bold px-4 py-2.5 rounded-xl text-xs ${
                              item.is_active
                                ? "border-amber-200 bg-amber-50 text-amber-700"
                                : "border-emerald-200 bg-emerald-50 text-emerald-700"
                            }`}
                          >
                            {item.is_active ? (
                              <PowerOff className="w-3.5 h-3.5" />
                            ) : (
                              <Power className="w-3.5 h-3.5" />
                            )}

                            {item.is_active
                              ? "ปิด QR"
                              : "เปิด QR"}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              duplicateItem(
                                item
                              )
                            }
                            className="inline-flex items-center gap-2 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold px-4 py-2.5 rounded-xl text-xs"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            Duplicate
                          </button>

                          <a
                            href={
                              dynamicUrl
                            }
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold px-4 py-2.5 rounded-xl text-xs"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            ทดสอบ QR
                          </a>

                          <button
                            type="button"
                            onClick={() =>
                              deleteItem(
                                item
                              )
                            }
                            disabled={
                              deletingId ===
                              item.id
                            }
                            className="inline-flex items-center gap-2 border border-red-200 bg-red-50 hover:bg-red-100 disabled:opacity-50 text-red-600 font-bold px-4 py-2.5 rounded-xl text-xs"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            ลบ
                          </button>
                        </div>
                      </div>
                    </div>
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
  value: string;
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
