"use client";

import React, { useEffect, useState } from "react";
import Navbar from "@/components/navbar";
import Link from "next/link";
import { BookOpen, Calendar, ArrowRight, Sparkles } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

// เชื่อมต่อ Supabase (แนะนำให้ย้ายไปเก็บใน .env.local ทีหลัง)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "YOUR_SUPABASE_URL";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "YOUR_SUPABASE_ANON_KEY";
const supabase = createClient(supabaseUrl, supabaseKey);

interface Blog {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  created_at: string;
}

export default function BlogPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchBlogs() {
      try {
        const { data, error } = await supabase
          .from("blogs")
          .select("id, title, slug, excerpt, created_at")
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching blogs:", error);
        } else if (data) {
          setBlogs(data);
        }
      } catch (err) {
        console.error("Unexpected error:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchBlogs();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-16">
      <Navbar />

      <main className="py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-800 text-xs font-semibold px-3 py-1 rounded-full mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" /> บทความ & เทคนิคธุรกิจ
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-800 tracking-tight mb-3">
            บทความ & คู่มือทำธุรกิจเบเกอรี่
          </h1>
          <p className="text-slate-500 text-sm max-w-lg mx-auto">
            รวมทริคคำนวณต้นทุน เทคนิคการตั้งราคา และวิธีโปรโมทร้านค้าสำหรับพ่อค้าแม่ค้าออนไลน์
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400 text-sm">กำลังโหลดบทความ...</div>
        ) : blogs.length === 0 ? (
          <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-3">
            <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
            <h2 className="font-bold text-slate-700 text-base">ยังไม่มีบทความในระบบ</h2>
            <p className="text-xs text-slate-400">ระบบสร้างบทความอัตโนมัติ (SEO Auto-Blog) จะปรากฏที่นี่เร็วๆ นี้</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {blogs.map((blog) => (
              <Link
                key={blog.id}
                href={`/blog/${blog.slug}`}
                className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm hover:border-amber-400 hover:shadow-md transition group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(blog.created_at).toLocaleDateString("th-TH", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                  <h2 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-amber-600 transition">
                    {blog.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 line-clamp-2 leading-relaxed mb-4">
                    {blog.excerpt}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-amber-600">
                  อ่านบทความ <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}