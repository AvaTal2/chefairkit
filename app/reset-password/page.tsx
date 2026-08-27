"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChefHat,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import { supabase } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [checkingSession, setCheckingSession] =
    useState(true);

  const [hasSession, setHasSession] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [success, setSuccess] =
    useState(false);

  const [message, setMessage] =
    useState("");

  useEffect(() => {
    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session) {
          setHasSession(true);
          setCheckingSession(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkSession = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    setHasSession(!!session);
    setCheckingSession(false);
  };

  const handleResetPassword = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setMessage("");

    if (password.length < 8) {
      setMessage(
        "รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร"
      );
      return;
    }

    if (password !== confirmPassword) {
      setMessage(
        "รหัสผ่านทั้งสองช่องไม่ตรงกัน"
      );
      return;
    }

    setSaving(true);

    const { error } =
      await supabase.auth.updateUser({
        password,
      });

    if (error) {
      setMessage(
        "เปลี่ยนรหัสผ่านไม่สำเร็จ: " +
          error.message
      );

      setSaving(false);
      return;
    }

    setSuccess(true);
    setSaving(false);
  };

  if (checkingSession) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="text-sm text-slate-500">
          กำลังตรวจสอบลิงก์...
        </div>
      </main>
    );
  }

  if (success) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-sm p-8 text-center">
          <div className="w-16 h-16 mx-auto bg-emerald-50 rounded-2xl flex items-center justify-center mb-5">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>

          <h1 className="text-2xl font-extrabold text-slate-800">
            เปลี่ยนรหัสผ่านเรียบร้อย
          </h1>

          <p className="text-sm text-slate-500 mt-2">
            สามารถใช้รหัสผ่านใหม่กับบัญชี
            ChefAir Kit ได้แล้ว
          </p>

          <button
            type="button"
            onClick={() =>
              router.push("/account")
            }
            className="mt-6 w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl transition"
          >
            กลับไปบัญชีของฉัน
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        {/* Logo */}

        <div className="flex items-center justify-center gap-2.5 mb-6">
          <div className="bg-amber-500 p-2 rounded-xl text-white">
            <ChefHat className="w-5 h-5" />
          </div>

          <span className="font-bold text-slate-800 text-lg">
            ChefAir{" "}
            <span className="text-amber-500">
              Kit
            </span>
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-7 sm:p-8">
          <div className="bg-amber-50 text-amber-600 w-12 h-12 rounded-xl flex items-center justify-center mb-5">
            <KeyRound className="w-6 h-6" />
          </div>

          <h1 className="text-2xl font-extrabold text-slate-800">
            ตั้งรหัสผ่านใหม่
          </h1>

          <p className="text-sm text-slate-500 mt-2 mb-6">
            กำหนดรหัสผ่านใหม่สำหรับบัญชีของคุณ
          </p>

          {!hasSession ? (
            <div className="bg-red-50 border border-red-100 rounded-xl p-4">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />

                <div>
                  <p className="text-sm font-bold text-red-600">
                    ลิงก์ไม่ถูกต้องหรือหมดอายุ
                  </p>

                  <p className="text-xs text-red-500 mt-1 leading-relaxed">
                    กรุณากลับไปขอลิงก์เปลี่ยนรหัสผ่านใหม่จากหน้าบัญชี
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleResetPassword}
              className="space-y-5"
            >
              {/* Password */}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  รหัสผ่านใหม่
                </label>

                <div className="relative">
                  <input
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    value={password}
                    onChange={(e) =>
                      setPassword(
                        e.target.value
                      )
                    }
                    placeholder="อย่างน้อย 8 ตัวอักษร"
                    className="w-full px-4 pr-11 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-amber-400"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        !showPassword
                      )
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm */}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  ยืนยันรหัสผ่านใหม่
                </label>

                <div className="relative">
                  <input
                    type={
                      showConfirmPassword
                        ? "text"
                        : "password"
                    }
                    value={
                      confirmPassword
                    }
                    onChange={(e) =>
                      setConfirmPassword(
                        e.target.value
                      )
                    }
                    placeholder="กรอกรหัสผ่านอีกครั้ง"
                    className="w-full px-4 pr-11 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-amber-400"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(
                        !showConfirmPassword
                      )
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {message && (
                <div className="bg-red-50 border border-red-100 text-red-600 rounded-xl px-4 py-3 text-xs">
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition"
              >
                {saving
                  ? "กำลังเปลี่ยนรหัสผ่าน..."
                  : "ตั้งรหัสผ่านใหม่"}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}