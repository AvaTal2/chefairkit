"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import {
  ChefHat,
  Calculator,
  QrCode,
  ShoppingBag,
  BookOpen,
  PackageSearch,
  LogIn,
  UserPlus,
  LogOut,
  User,
  Settings,
  Scale,
  Factory,
} from "lucide-react";

import { supabase } from "@/lib/supabase/client";

type Profile = {
  id: string;
  display_name: string | null;
  plan: "free" | "pro" | "business";
};

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const MY_AFFILIATE_LINK =
    "https://s.shopee.co.th/70JW1RXcMF";

  const [profile, setProfile] =
    useState<Profile | null>(null);

  const [loadingUser, setLoadingUser] =
    useState(true);

  useEffect(() => {
    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadUser();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadUser = async () => {
    setLoadingUser(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setProfile(null);
      setLoadingUser(false);
      return;
    }

    const { data } = await supabase
      .from("profiles")
      .select("id, display_name, plan")
      .eq("id", user.id)
      .maybeSingle();

    if (data) {
      setProfile({
        id: data.id,
        display_name: data.display_name,
        plan: data.plan || "free",
      });
    } else {
      setProfile({
        id: user.id,
        display_name:
          user.email?.split("@")[0] || "สมาชิก",
        plan: "free",
      });
    }

    setLoadingUser(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();

    setProfile(null);

    router.push("/");
    router.refresh();
  };

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }

    return pathname.startsWith(href);
  };

  const navClass = (href: string) =>
    `flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
      isActive(href)
        ? "bg-white text-slate-800 shadow-sm"
        : "text-slate-500 hover:text-slate-700 hover:bg-white/60"
    }`;

  return (
    <nav className="bg-white border-b border-slate-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-16 flex items-center gap-4">

        {/* Logo */}

        <Link
          href="/"
          className="flex items-center gap-2.5 shrink-0"
        >
          <div className="bg-amber-500 p-2 rounded-xl text-white shadow-sm shadow-amber-200">
            <ChefHat className="w-5 h-5" />
          </div>

          <span className="font-bold text-slate-800 text-lg tracking-tight whitespace-nowrap">
            ChefAir{" "}
            <span className="text-amber-500">
              Kit
            </span>
          </span>
        </Link>

        {/* Main navigation */}

        <div className="flex-1 overflow-x-auto">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-max">

            <Link
              href="/recipe-calculator"
              className={navClass(
                "/recipe-calculator"
              )}
            >
              <Scale className="w-4 h-4 text-amber-500" />
              คำนวณสูตร
            </Link>

            <Link
              href="/cost"
              className={navClass("/cost")}
            >
              <Calculator className="w-4 h-4 text-amber-500" />
              คำนวณต้นทุน
            </Link>

            <Link
              href="/qr"
              className={navClass("/qr")}
            >
              <QrCode className="w-4 h-4 text-amber-500" />
              QR Code
            </Link>

            <Link
              href="/recipes"
              className={navClass("/recipes")}
            >
              <BookOpen className="w-4 h-4 text-amber-500" />
              สูตรของฉัน
            </Link>

            <Link
              href="/ingredients"
              className={navClass(
                "/ingredients"
              )}
            >
              <PackageSearch className="w-4 h-4 text-amber-500" />
              คลังวัตถุดิบ
            </Link>

            <Link
              href="/production"
              className={navClass(
                "/production"
              )}
            >
              <Factory className="w-4 h-4 text-amber-500" />
              Production
            </Link>

          </div>
        </div>

        {/* Desktop account */}

        <div className="hidden md:flex items-center gap-2 shrink-0">

          <button
            type="button"
            onClick={() =>
              window.open(
                MY_AFFILIATE_LINK,
                "_blank"
              )
            }
            className="flex items-center gap-1.5 text-xs font-semibold text-white bg-amber-500 hover:bg-amber-600 px-3.5 py-2 rounded-xl transition shadow-sm shadow-amber-200"
          >
            <ShoppingBag className="w-4 h-4" />
            Shopee
          </button>

          {!loadingUser && !profile && (
            <>
              <Link
                href="/login"
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 border border-slate-200 hover:border-amber-300 hover:text-amber-600 px-3.5 py-2 rounded-xl transition"
              >
                <LogIn className="w-4 h-4" />
                เข้าสู่ระบบ
              </Link>

              <Link
                href="/register"
                className="flex items-center gap-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 px-3.5 py-2 rounded-xl transition"
              >
                <UserPlus className="w-4 h-4" />
                สมัครสมาชิก
              </Link>
            </>
          )}

          {!loadingUser && profile && (
            <>
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-100">
                <User className="w-4 h-4 text-amber-500 shrink-0" />

                <div className="leading-tight">
                  <div className="text-xs font-bold text-slate-700 max-w-[100px] truncate">
                    {profile.display_name ||
                      "สมาชิก"}
                  </div>

                  <div className="text-[10px] uppercase font-bold text-slate-400">
                    {profile.plan}
                  </div>
                </div>
              </div>

              <Link
                href="/account"
                className={`flex items-center gap-1.5 text-xs font-semibold border px-3 py-2 rounded-xl transition ${
                  isActive("/account")
                    ? "border-amber-300 bg-amber-50 text-amber-600"
                    : "border-slate-200 text-slate-600 hover:border-amber-300 hover:text-amber-600"
                }`}
              >
                <Settings className="w-4 h-4" />
                บัญชี
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-xs font-semibold text-red-500 border border-red-100 hover:bg-red-50 px-3 py-2 rounded-xl transition"
              >
                <LogOut className="w-4 h-4" />
                ออกจากระบบ
              </button>
            </>
          )}

        </div>
      </div>

      {/* Mobile account */}

      {!loadingUser && (
        <div className="md:hidden border-t border-slate-100 px-4 py-2 bg-white">
          <div className="flex items-center gap-2 overflow-x-auto">

            {profile ? (
              <>
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-amber-50 px-3 py-2 rounded-lg whitespace-nowrap">
                  <User className="w-3.5 h-3.5 text-amber-500" />

                  {profile.display_name ||
                    "สมาชิก"}

                  <span className="text-[9px] uppercase text-amber-600">
                    {profile.plan}
                  </span>
                </div>

                <Link
                  href="/account"
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-2 rounded-lg whitespace-nowrap"
                >
                  <Settings className="w-3.5 h-3.5" />
                  บัญชี
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 text-xs font-semibold text-red-500 bg-red-50 px-3 py-2 rounded-lg whitespace-nowrap"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  ออกจากระบบ
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-2 rounded-lg whitespace-nowrap"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  เข้าสู่ระบบ
                </Link>

                <Link
                  href="/register"
                  className="flex items-center gap-1.5 text-xs font-semibold text-white bg-slate-800 px-3 py-2 rounded-lg whitespace-nowrap"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  สมัครสมาชิก
                </Link>
              </>
            )}

          </div>
        </div>
      )}

    </nav>
  );
}