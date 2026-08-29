"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Crown,
  Save,
  KeyRound,
  LogOut,
  CreditCard,
  CheckCircle2,
} from "lucide-react";

import { supabase } from "@/lib/supabase/client";

type Profile = {
  id: string;
  display_name: string | null;
  plan: string | null;
};

export default function AccountPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [plan, setPlan] = useState("free");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<
    "success" | "error" | ""
  >("");

  useEffect(() => {
    loadAccount();
  }, []);

  const loadAccount = async () => {
    setLoading(true);
    setMessage("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      router.push("/login");
      return;
    }

    setEmail(user.email || "");

    const { data, error } = await supabase
      .from("profiles")
      .select("id, display_name, plan")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      setMessage(
        "โหลดข้อมูลสมาชิกไม่สำเร็จ: " + error.message
      );
      setMessageType("error");
      setLoading(false);
      return;
    }

    if (data) {
      const profile = data as Profile;

      setDisplayName(profile.display_name || "");
      setPlan(profile.plan || "free");
    } else {
      setDisplayName(
        user.email?.split("@")[0] || ""
      );

      setPlan("free");
    }

    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    setMessageType("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const cleanName = displayName.trim();

    if (!cleanName) {
      setMessage("กรุณากรอกชื่อที่ต้องการแสดง");
      setMessageType("error");
      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .upsert(
        {
          id: user.id,
          display_name: cleanName,
          plan: plan || "free",
        },
        {
          onConflict: "id",
        }
      );

    if (error) {
      setMessage(
        "บันทึกข้อมูลไม่สำเร็จ: " + error.message
      );
      setMessageType("error");
      setSaving(false);
      return;
    }

    setMessage("บันทึกข้อมูลเรียบร้อยแล้ว");
    setMessageType("success");
    setSaving(false);
  };

  const handlePasswordReset = async () => {
    if (!email) return;

    setMessage("");
    setMessageType("");

    const redirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/reset-password`
        : undefined;

    const { error } =
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

    if (error) {
      setMessage(
        "ส่งอีเมลเปลี่ยนรหัสผ่านไม่สำเร็จ: " +
          error.message
      );

      setMessageType("error");
      return;
    }

    setMessage(
      `ส่งลิงก์เปลี่ยนรหัสผ่านไปที่ ${email} แล้ว`
    );

    setMessageType("success");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();

    router.push("/");
    router.refresh();
  };

  const planLabel = () => {
    switch (plan) {
      case "pro":
        return "PRO";

      case "business":
        return "BUSINESS";

      default:
        return "FREE";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">

        <main className="max-w-4xl mx-auto px-4 py-10">
          <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center text-slate-500">
            กำลังโหลดข้อมูลสมาชิก...
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">

      <main className="max-w-4xl mx-auto px-4 py-10">
        {/* Header */}

        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800">
            บัญชีของฉัน
          </h1>

          <p className="text-sm text-slate-500 mt-1">
            จัดการข้อมูลสมาชิกและแพ็กเกจ ChefAir Kit
          </p>
        </div>

        {message && (
          <div
            className={`mb-5 rounded-xl px-4 py-3 text-sm border ${
              messageType === "success"
                ? "bg-green-50 border-green-100 text-green-700"
                : "bg-red-50 border-red-100 text-red-600"
            }`}
          >
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Account */}

          <section className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="bg-amber-50 text-amber-600 p-3 rounded-xl">
                  <User className="w-5 h-5" />
                </div>

                <div>
                  <h2 className="font-bold text-slate-800">
                    ข้อมูลบัญชี
                  </h2>

                  <p className="text-xs text-slate-400 mt-0.5">
                    ข้อมูลที่ใช้กับบัญชี ChefAir Kit
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Name */}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  ชื่อที่แสดง
                </label>

                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

                  <input
                    value={displayName}
                    onChange={(e) =>
                      setDisplayName(e.target.value)
                    }
                    placeholder="ชื่อของคุณ"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Email */}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Email
                </label>

                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

                  <input
                    value={email}
                    disabled
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm bg-slate-50 text-slate-500"
                  />
                </div>

                <p className="text-xs text-slate-400 mt-1.5">
                  Email ใช้สำหรับเข้าสู่ระบบและกู้คืนรหัสผ่าน
                </p>
              </div>

              {/* Save */}

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex items-center justify-center gap-2 w-full sm:w-auto bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white font-bold px-5 py-3 rounded-xl transition text-sm"
              >
                <Save className="w-4 h-4" />

                {saving
                  ? "กำลังบันทึก..."
                  : "บันทึกข้อมูล"}
              </button>
            </div>
          </section>

          {/* Plan */}

          <section className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between gap-3">
                <div className="bg-amber-50 text-amber-600 p-3 rounded-xl">
                  <Crown className="w-5 h-5" />
                </div>

                <span
                  className={`text-xs font-extrabold px-3 py-1.5 rounded-full ${
                    plan === "pro" ||
                    plan === "business"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {planLabel()}
                </span>
              </div>

              <h2 className="font-bold text-slate-800 mt-5">
                แพ็กเกจปัจจุบัน
              </h2>

              <p className="text-2xl font-extrabold text-slate-800 mt-1">
                {planLabel()}
              </p>

              {plan === "free" ? (
                <>
                  <p className="text-xs text-slate-500 mt-3 leading-relaxed">
                    ขณะนี้คุณใช้งานแพ็กเกจฟรี
                    ฟีเจอร์ Pro และ AI จะเปิดให้เลือกเพิ่มเติมในอนาคต
                  </p>

                  <button
                    type="button"
                    disabled
                    className="mt-5 w-full flex items-center justify-center gap-2 bg-slate-100 text-slate-400 font-bold py-3 rounded-xl text-sm cursor-not-allowed"
                  >
                    <CreditCard className="w-4 h-4" />
                    อัปเกรดเร็ว ๆ นี้
                  </button>
                </>
              ) : (
                <div className="mt-4 flex items-start gap-2 text-xs text-green-700 bg-green-50 rounded-xl p-3">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  บัญชีนี้เปิดใช้งานแพ็กเกจ {planLabel()}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Security */}

        <section className="bg-white border border-slate-200 rounded-3xl shadow-sm mt-6 overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h2 className="font-bold text-slate-800">
              ความปลอดภัย
            </h2>

            <p className="text-xs text-slate-400 mt-1">
              จัดการรหัสผ่านและการเข้าสู่ระบบ
            </p>
          </div>

          <div className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="bg-slate-100 text-slate-600 p-2.5 rounded-xl">
                <KeyRound className="w-5 h-5" />
              </div>

              <div>
                <p className="text-sm font-bold text-slate-700">
                  เปลี่ยนรหัสผ่าน
                </p>

                <p className="text-xs text-slate-400 mt-1">
                  ระบบจะส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปยัง Email
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handlePasswordReset}
              className="border border-slate-200 hover:border-amber-300 text-slate-600 hover:text-amber-600 font-bold px-4 py-2.5 rounded-xl text-sm transition"
            >
              ส่งลิงก์เปลี่ยนรหัสผ่าน
            </button>
          </div>
        </section>

        {/* Logout */}

        <section className="bg-white border border-red-100 rounded-3xl shadow-sm mt-6 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="font-bold text-slate-800">
                ออกจากระบบ
              </p>

              <p className="text-xs text-slate-400 mt-1">
                สูตรและข้อมูลของคุณจะยังถูกเก็บไว้ในบัญชี
              </p>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 border border-red-100 text-red-500 hover:bg-red-50 font-bold px-4 py-2.5 rounded-xl text-sm transition"
            >
              <LogOut className="w-4 h-4" />
              ออกจากระบบ
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}