"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChefHat, Calculator, QrCode, ShoppingBag } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const MY_AFFILIATE_LINK = "Https://s.shopee.co.th/70JW1RXcMF";

  return (
    <nav className="bg-white border-b border-slate-100 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="bg-amber-500 p-2 rounded-xl text-white shadow-sm shadow-amber-200">
            <ChefHat className="w-5 h-5" />
          </div>
          <span className="font-bold text-slate-800 text-lg tracking-tight">
            ChefAir <span className="text-amber-500">Kit</span>
          </span>
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center gap-1 sm:gap-2 bg-slate-100 p-1 rounded-xl">
          <Link
            href="/cost"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              pathname === "/cost"
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Calculator className="w-4 h-4 text-amber-500" />
            คำนวณต้นทุน
          </Link>
          <Link
            href="/qr"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              pathname === "/qr"
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <QrCode className="w-4 h-4 text-amber-500" />
            สร้าง QR Code
          </Link>
        </div>

        {/* Shopee Link */}
        <div className="hidden sm:flex items-center gap-3">
          <button
            onClick={() => window.open(MY_AFFILIATE_LINK, "_blank")}
            className="flex items-center gap-1.5 text-xs font-semibold text-white bg-amber-500 hover:bg-amber-600 px-3.5 py-2 rounded-xl transition shadow-sm shadow-amber-200"
          >
            <ShoppingBag className="w-4 h-4" />
            ร้านค้า Shopee
          </button>
        </div>
      </div>
    </nav>
  );
}