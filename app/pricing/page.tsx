"use client";

import {
  useState,
} from "react";

import Link from "next/link";

import {
  Check,
  X,
  Sparkles,
  Crown,
  Building2,
  ArrowRight,
  CreditCard,
  QrCode,
  Loader2,
  Settings,
  CalendarDays,
  BadgeCheck,
} from "lucide-react";

import { supabase } from "@/lib/supabase/client";
import { useSubscription } from "@/hooks/useSubscription";

type FeatureRow = {
  label: string;
  free: string | boolean;
  pro: string | boolean;
  business: string | boolean;
};

type BillingChoice =
  | "auto_renew"
  | "promptpay_monthly";

const features: FeatureRow[] = [
  {
    label: "คำนวณต้นทุนอาหาร",
    free: true,
    pro: true,
    business: true,
  },
  {
    label: "สร้าง Static QR Code",
    free: true,
    pro: true,
    business: true,
  },
  {
    label: "Dynamic QR + Analytics",
    free: false,
    pro: true,
    business: true,
  },
  {
    label: "บันทึกสูตร",
    free: "สูงสุด 5 สูตร",
    pro: "ไม่จำกัด",
    business: "ไม่จำกัด",
  },
  {
    label: "คลังวัตถุดิบ",
    free: "สูงสุด 30 รายการ",
    pro: "ไม่จำกัด",
    business: "ไม่จำกัด",
  },
  {
    label: "ย่อ / ขยายสูตร",
    free: true,
    pro: true,
    business: true,
  },
  {
    label: "คำนวณโภชนาการ",
    free: true,
    pro: true,
    business: true,
  },
  {
    label: "วางแผนการผลิต",
    free: false,
    pro: true,
    business: true,
  },
  {
    label: "Shopping List",
    free: false,
    pro: true,
    business: true,
  },
  {
    label: "SOP + Kitchen Mode",
    free: false,
    pro: true,
    business: true,
  },
  {
    label: "Export PDF",
    free: false,
    pro: true,
    business: true,
  },
  {
    label: "Export Excel",
    free: false,
    pro: true,
    business: true,
  },
  {
    label: "AI Tools",
    free: "3 ครั้ง / เดือน",
    pro: "100 ครั้ง / เดือน",
    business: "500 ครั้ง / เดือน",
  },
];

function FeatureValue({
  value,
}: {
  value: string | boolean;
}) {
  if (value === true) {
    return (
      <Check className="w-5 h-5 text-emerald-500 mx-auto" />
    );
  }

  if (value === false) {
    return (
      <X className="w-5 h-5 text-slate-300 mx-auto" />
    );
  }

  return (
    <span className="text-xs font-semibold text-slate-700">
      {value}
    </span>
  );
}

const formatDate = (
  value: string | null
) => {
  if (!value) return "-";

  return new Intl.DateTimeFormat(
    "th-TH",
    {
      dateStyle: "medium",
    }
  ).format(
    new Date(value)
  );
};

export default function PricingPage() {
  const {
    loading: subscriptionLoading,
    subscription,
    permissions,
  } = useSubscription();

  const [
    billingChoice,
    setBillingChoice,
  ] =
    useState<BillingChoice>(
      "auto_renew"
    );

  const [
    checkoutLoading,
    setCheckoutLoading,
  ] = useState(false);

  const [
    portalLoading,
    setPortalLoading,
  ] = useState(false);

  const [
    message,
    setMessage,
  ] = useState("");

  const proPriceLabel =
    process.env
      .NEXT_PUBLIC_PRO_MONTHLY_PRICE_LABEL ||
    "ราคาตามแพ็กเกจ";

  const startCheckout =
    async () => {
      setMessage("");
      setCheckoutLoading(true);

      try {
        const {
          data: {
            session,
          },
        } =
          await supabase.auth.getSession();

        if (
          !session
            ?.access_token
        ) {
          window.location.href =
            "/login";

          return;
        }

        const response =
          await fetch(
            "/api/billing/checkout",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",

                Authorization:
                  `Bearer ${session.access_token}`,
              },

              body:
                JSON.stringify({
                  billingType:
                    billingChoice,
                }),
            }
          );

        const result =
          await response.json();

        if (
          !response.ok ||
          !result?.url
        ) {
          setMessage(
            result?.error ||
              "ไม่สามารถเปิดหน้าชำระเงินได้"
          );

          setCheckoutLoading(
            false
          );

          return;
        }

        window.location.href =
          result.url;
      } catch (error) {
        console.error(
          "Checkout error:",
          error
        );

        setMessage(
          "ไม่สามารถเปิดหน้าชำระเงินได้"
        );

        setCheckoutLoading(
          false
        );
      }
    };

  const openBillingPortal =
    async () => {
      setMessage("");
      setPortalLoading(true);

      try {
        const {
          data: {
            session,
          },
        } =
          await supabase.auth.getSession();

        if (
          !session
            ?.access_token
        ) {
          window.location.href =
            "/login";

          return;
        }

        const response =
          await fetch(
            "/api/billing/portal",
            {
              method: "POST",

              headers: {
                Authorization:
                  `Bearer ${session.access_token}`,
              },
            }
          );

        const result =
          await response.json();

        if (
          !response.ok ||
          !result?.url
        ) {
          setMessage(
            result?.error ||
              "ไม่สามารถเปิดหน้าจัดการสมาชิกได้"
          );

          setPortalLoading(
            false
          );

          return;
        }

        window.location.href =
          result.url;
      } catch (error) {
        console.error(
          "Billing portal error:",
          error
        );

        setMessage(
          "ไม่สามารถเปิดหน้าจัดการสมาชิกได้"
        );

        setPortalLoading(false);
      }
    };

  const hasPaidPlan =
    !subscriptionLoading &&
    permissions.plan !==
      "free";

  return (
    <div className="min-h-screen bg-slate-50">

      <main className="max-w-6xl mx-auto px-4 py-12 sm:py-16">
        {/* Header */}

        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-700 text-xs font-bold px-3 py-1.5 rounded-full mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            ChefAir Kit Membership
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-800">
            เลือกแพ็กเกจที่เหมาะกับคุณ
          </h1>

          <p className="text-sm sm:text-base text-slate-500 mt-3">
            เริ่มใช้งานฟรี และเลือกวิธีชำระเงินแบบต่ออายุอัตโนมัติ
            หรือจ่ายทีละเดือนตามที่สะดวก
          </p>
        </div>

        {/* Current membership */}

        {!subscriptionLoading && (
          <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="bg-slate-100 text-slate-700 p-2.5 rounded-xl">
                  <BadgeCheck className="w-5 h-5" />
                </div>

                <div>
                  <p className="text-xs text-slate-400">
                    แพ็กเกจปัจจุบัน
                  </p>

                  <p className="font-extrabold text-slate-800 capitalize mt-0.5">
                    {permissions.plan}
                  </p>

                  {permissions.plan !==
                    "free" &&
                    subscription.expires_at && (
                      <p className="text-xs text-slate-500 mt-1 inline-flex items-center gap-1.5">
                        <CalendarDays className="w-3.5 h-3.5" />
                        ใช้งานได้ถึง{" "}
                        {formatDate(
                          subscription.expires_at
                        )}
                      </p>
                    )}
                </div>
              </div>

              {subscription.billing_type ===
                "stripe_subscription" && (
                <button
                  type="button"
                  onClick={
                    openBillingPortal
                  }
                  disabled={
                    portalLoading
                  }
                  className="inline-flex items-center justify-center gap-2 border border-slate-200 hover:bg-slate-50 disabled:opacity-60 text-slate-700 font-bold px-4 py-2.5 rounded-xl text-sm"
                >
                  {portalLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Settings className="w-4 h-4" />
                  )}

                  จัดการสมาชิก
                </button>
              )}
            </div>
          </section>
        )}

        {message && (
          <div className="mb-6 bg-red-50 border border-red-100 text-red-600 rounded-xl px-4 py-3 text-sm">
            {message}
          </div>
        )}

        {/* Plan Cards */}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
          {/* FREE */}

          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col">
            <div className="w-12 h-12 bg-slate-100 text-slate-600 rounded-2xl flex items-center justify-center mb-5">
              <Sparkles className="w-6 h-6" />
            </div>

            <h2 className="text-xl font-extrabold text-slate-800">
              Free
            </h2>

            <p className="text-xs text-slate-500 mt-1 min-h-[40px]">
              สำหรับทดลองใช้งานและผู้เริ่มต้น
            </p>

            <div className="mt-5">
              <span className="text-4xl font-extrabold text-slate-800">
                ฿0
              </span>

              <span className="text-sm text-slate-400">
                {" "}
                / เดือน
              </span>
            </div>

            <div className="border-t border-slate-100 my-6" />

            <div className="space-y-3 text-sm text-slate-600 flex-1">
              <div className="flex gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                คำนวณต้นทุนพื้นฐาน
              </div>

              <div className="flex gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                Static QR Code
              </div>

              <div className="flex gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                บันทึกสูตรสูงสุด 5 สูตร
              </div>

              <div className="flex gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                วัตถุดิบสูงสุด 30 รายการ
              </div>

              <div className="flex gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                AI 3 ครั้ง / เดือน
              </div>
            </div>

            {permissions.plan ===
            "free" ? (
              <div className="mt-7 w-full flex items-center justify-center border border-slate-200 text-slate-500 font-bold py-3 rounded-xl text-sm">
                แพ็กเกจปัจจุบัน
              </div>
            ) : (
              <Link
                href="/"
                className="mt-7 w-full flex items-center justify-center gap-2 border border-slate-200 hover:border-amber-300 text-slate-700 hover:text-amber-600 font-bold py-3 rounded-xl transition text-sm"
              >
                กลับหน้าหลัก
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>

          {/* PRO */}

          <div className="relative bg-white border-2 border-amber-400 rounded-3xl p-6 shadow-md flex flex-col">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-[10px] font-extrabold px-4 py-1.5 rounded-full whitespace-nowrap">
              แนะนำ
            </div>

            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-5">
              <Crown className="w-6 h-6" />
            </div>

            <h2 className="text-xl font-extrabold text-slate-800">
              Pro
            </h2>

            <p className="text-xs text-slate-500 mt-1 min-h-[40px]">
              สำหรับร้านอาหาร เชฟ และผู้ประกอบการ
            </p>

            <div className="mt-5">
              <span className="text-3xl font-extrabold text-slate-800">
                {proPriceLabel}
              </span>

              <span className="text-sm text-slate-400">
                {" "}
                / เดือน
              </span>
            </div>

            <div className="border-t border-slate-100 my-6" />

            <div className="space-y-3 text-sm text-slate-600">
              <div className="flex gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                สูตรและวัตถุดิบไม่จำกัด
              </div>

              <div className="flex gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                Advanced Cost
              </div>

              <div className="flex gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                Dynamic QR + Analytics
              </div>

              <div className="flex gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                Production + Shopping List
              </div>

              <div className="flex gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                SOP + Kitchen Mode
              </div>

              <div className="flex gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                AI Tools 100 ครั้ง / เดือน
              </div>
            </div>

            <div className="mt-6 border-t border-slate-100 pt-5">
              <p className="text-xs font-bold text-slate-700 mb-3">
                เลือกวิธีชำระเงิน
              </p>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() =>
                    setBillingChoice(
                      "auto_renew"
                    )
                  }
                  className={`w-full text-left border rounded-2xl p-3.5 transition ${
                    billingChoice ===
                    "auto_renew"
                      ? "border-amber-400 bg-amber-50"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <CreditCard className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />

                    <div>
                      <p className="text-sm font-extrabold text-slate-800">
                        ต่ออายุอัตโนมัติ
                      </p>

                      <p className="text-xs text-slate-500 mt-1">
                        ชำระด้วยบัตร ต่ออายุทุกเดือน และยกเลิกได้ภายหลัง
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setBillingChoice(
                      "promptpay_monthly"
                    )
                  }
                  className={`w-full text-left border rounded-2xl p-3.5 transition ${
                    billingChoice ===
                    "promptpay_monthly"
                      ? "border-violet-400 bg-violet-50"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <QrCode className="w-5 h-5 text-violet-600 mt-0.5 shrink-0" />

                    <div>
                      <p className="text-sm font-extrabold text-slate-800">
                        สแกนจ่ายทีละเดือน
                      </p>

                      <p className="text-xs text-slate-500 mt-1">
                        ไม่มีการต่ออายุอัตโนมัติ จ่ายแล้วใช้ Pro 30 วัน
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {permissions.plan ===
            "pro" ? (
              <div className="mt-6 w-full flex items-center justify-center border border-amber-200 bg-amber-50 text-amber-700 font-bold py-3 rounded-xl text-sm">
                แพ็กเกจปัจจุบัน
              </div>
            ) : (
              <button
                type="button"
                onClick={
                  startCheckout
                }
                disabled={
                  checkoutLoading
                }
                className="mt-6 w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white font-bold py-3 rounded-xl text-sm transition inline-flex items-center justify-center gap-2"
              >
                {checkoutLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : billingChoice ===
                  "auto_renew" ? (
                  <CreditCard className="w-4 h-4" />
                ) : (
                  <QrCode className="w-4 h-4" />
                )}

                {billingChoice ===
                "auto_renew"
                  ? "สมัคร Pro แบบต่ออายุอัตโนมัติ"
                  : "สมัคร Pro แบบจ่ายทีละเดือน"}
              </button>
            )}
          </div>

          {/* BUSINESS */}

          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col">
            <div className="w-12 h-12 bg-slate-800 text-white rounded-2xl flex items-center justify-center mb-5">
              <Building2 className="w-6 h-6" />
            </div>

            <h2 className="text-xl font-extrabold text-slate-800">
              Business
            </h2>

            <p className="text-xs text-slate-500 mt-1 min-h-[40px]">
              สำหรับทีมและธุรกิจที่ต้องการใช้งานในระดับสูง
            </p>

            <div className="mt-5">
              <span className="text-3xl font-extrabold text-slate-800">
                เร็ว ๆ นี้
              </span>
            </div>

            <div className="border-t border-slate-100 my-6" />

            <div className="space-y-3 text-sm text-slate-600 flex-1">
              <div className="flex gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                ทุกฟีเจอร์ของ Pro
              </div>

              <div className="flex gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                AI Tools 500 ครั้ง / เดือน
              </div>

              <div className="flex gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                รองรับการใช้งานเป็นทีม
              </div>

              <div className="flex gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                รองรับการขยายระบบในอนาคต
              </div>
            </div>

            <button
              type="button"
              disabled
              className="mt-7 w-full bg-slate-100 text-slate-400 font-bold py-3 rounded-xl text-sm cursor-not-allowed"
            >
              เปิดให้บริการเร็ว ๆ นี้
            </button>
          </div>
        </div>

        {/* Comparison */}

        <section className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-lg font-extrabold text-slate-800">
              เปรียบเทียบแพ็กเกจ
            </h2>

            <p className="text-xs text-slate-500 mt-1">
              เลือกใช้งานตามขนาดและรูปแบบงานของคุณ
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead>
                <tr className="bg-slate-50">
                  <th className="text-left px-6 py-4 font-bold text-slate-700">
                    ฟีเจอร์
                  </th>

                  <th className="px-4 py-4 font-bold text-slate-700">
                    Free
                  </th>

                  <th className="px-4 py-4 font-bold text-amber-600">
                    Pro
                  </th>

                  <th className="px-4 py-4 font-bold text-slate-700">
                    Business
                  </th>
                </tr>
              </thead>

              <tbody>
                {features.map(
                  (feature) => (
                    <tr
                      key={
                        feature.label
                      }
                      className="border-t border-slate-100"
                    >
                      <td className="px-6 py-4 text-xs font-semibold text-slate-600">
                        {
                          feature.label
                        }
                      </td>

                      <td className="px-4 py-4 text-center">
                        <FeatureValue
                          value={
                            feature.free
                          }
                        />
                      </td>

                      <td className="px-4 py-4 text-center bg-amber-50/30">
                        <FeatureValue
                          value={
                            feature.pro
                          }
                        />
                      </td>

                      <td className="px-4 py-4 text-center">
                        <FeatureValue
                          value={
                            feature.business
                          }
                        />
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
