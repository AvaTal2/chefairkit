"use client";

import React, { useEffect, useState } from "react";
import Navbar from "@/components/navbar";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Calendar, ArrowLeft, BookOpen, Calculator, QrCode } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

interface BlogDetail {
  id: string;
  title: string;
  content: string;
  created_at: string;
  cover_image?: string;
}

export default function BlogDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [blog, setBlog] = useState<BlogDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!slug) return;

    async function fetchBlogDetail() {
      try {
        const { data, error } = await supabase
          .from("blogs")
          .select("*")
          .eq("slug", slug)
          .single();

        if (error) {
          console.error("Error fetching blog detail:", error);
        } else if (data) {
          setBlog(data);
        }
      } catch (err) {
        console.error("Unexpected error:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchBlogDetail();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans">
        <Navbar />
        <div className="text-center py-24 text-slate-400 text-sm">กำลังโหลดเนื้อหาบทความ...</div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans">
        <Navbar />
        <main className="py-20 px-4 text-center max-w-lg mx-auto space-y-4">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
          <h1 className="text-xl font-bold text-slate-800">ไม่พบบทความที่คุณต้องการ</h1>
          <p className="text-xs text-slate-500">บทความนี้อาจถูกลบหรือไม่มีอยู่จริงในระบบ</p>
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 px-4 py-2.5 rounded-xl transition shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" /> กลับสู่หน้าบทความทั้งหมด
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      <Navbar />

      <main className="py-10 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
        {/* ปุ่มย้อนกลับ */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-amber-600 mb-6 transition"
        >
          <ArrowLeft className="w-4 h-4" /> กลับหน้าบทความ
        </Link>

        {/* หัวข้อและวันที่ */}
        <div className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Calendar className="w-3.5 h-3.5" />
            {new Date(blog.created_at).toLocaleDateString("th-TH", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
            {blog.title}
          </h1>

          {/* เนื้อหาบทความ (รองรับ HTML จากระบบออโต้) */}
          <div
            className="prose prose-slate max-w-none text-sm sm:text-base text-slate-700 leading-relaxed space-y-4 pt-4 border-t border-slate-100"
            dangerouslySetInnerHTML={{ __html: blog.content }}
          />

          {/* กล่องโปรโมทเครื่องมือ ChefAir Kit ท้ายบทความ (Conversion Loop) */}
          <div className="bg-amber-50 border border-amber-200/60 p-6 rounded-2xl mt-10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-800 text-sm sm:text-base mb-1">
                กำลังมองหาตัวช่วยคำนวณต้นทุนหรือสร้าง QR ร้านค้าอยู่ใช่ไหม?
              </h3>
              <p className="text-xs text-slate-600">
                ใช้งานเครื่องมือฟรีบน ChefAir Kit ช่วยให้ธุรกิจร้านอาหารและเบเกอรี่ของคุณง่ายขึ้น
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/cost"
                className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl transition shadow-sm"
              >
                <Calculator className="w-3.5 h-3.5" /> คำนวณต้นทุน
              </Link>
              <Link
                href="/qr"
                className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold px-3.5 py-2.5 rounded-xl transition shadow-sm"
              >
                <QrCode className="w-3.5 h-3.5 text-rose-500" /> สร้าง QR
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}