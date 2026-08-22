import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenAI } from "@google/genai";

export async function GET(request: Request) {
  try {
    // 1. ดึง Environment Variables ข้างในฟังก์ชันเพื่อป้องกัน Error ตอน Build
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase Environment Variables");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

    // 2. ดึงคีย์เวิร์ดที่ยังไม่ได้ใช้งาน (is_used = false) มา 1 คำ
    const { data: keywordData, error: keywordError } = await supabase
      .from("keywords")
      .select("*")
      .eq("is_used", false)
      .limit(1)
      .single();

    if (keywordError || !keywordData) {
      return NextResponse.json({ message: "หมดคีย์เวิร์ดสำหรับสร้างบทความแล้ว" }, { status: 404 });
    }

    const targetKeyword = keywordData.keyword;

    // 3. สั่ง Gemini API ให้เขียนบทความ
    const prompt = `
      คุณเป็นนักเขียนโปรเฟสชันแนลด้านการตลาดออนไลน์และธุรกิจอาหาร/เบเกอรี่
      จงเขียนบทความ SEO คุณภาพสูง ความยาวประมาณ 600-800 คำ จากคีย์เวิร์ดหลักคือ: "${targetKeyword}"
      
      ขอรูปแบบผลลัพธ์เป็น JSON ล้วนๆ ห้ามมีคำอธิบายอื่นนอกเหนือจาก JSON โครงสร้างดังนี้:
      {
        "title": "หัวข้อบทความที่น่าดึงดูดและมีคีย์เวิร์ด",
        "excerpt": "คำโปรยสั้นๆ สรุปใจความสำคัญของบทความ",
        "content": "เนื้อหาบทความทั้งหมด จัดรูปแบบด้วยแท็ก HTML เช่น <h2>, <h3>, <p>, <ul>, <li> ให้เรียบร้อย"
      }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
    });

    const textResponse = response.text;
    if (!textResponse) {
      throw new Error("ไม่สามารถสร้างเนื้อหาจาก Gemini AI ได้");
    }

    // แปลงผลลัพธ์ที่ได้จาก AI ให้เป็น JSON
    const cleanJsonText = textResponse.replace(/```json/g, "").replace(/```/g, "").trim();
    const articleData = JSON.parse(cleanJsonText);

    // สร้าง Slug เป็นภาษาอังกฤษและตัวเลขปลอดภัย 100%
    const generatedSlug = `article-${Date.now()}`;

    // 4. บันทึกลงตาราง blogs ใน Supabase
    const { error: insertError } = await supabase.from("blogs").insert([
      {
        title: articleData.title,
        slug: generatedSlug,
        excerpt: articleData.excerpt,
        content: articleData.content,
      },
    ]);

    if (insertError) {
      throw insertError;
    }

    // 5. อัปเดตสถานะคีย์เวิร์ดว่าถูกใช้งานแล้ว (is_used = true)
    await supabase
      .from("keywords")
      .update({ is_used: true })
      .eq("id", keywordData.id);

    return NextResponse.json({
      success: true,
      message: `เจนบทความด้วย Gemini สำเร็จจากคีย์เวิร์ด: "${targetKeyword}"`,
      slug: generatedSlug,
      title: articleData.title,
    });
  } catch (error: any) {
    console.error("Auto-Blog Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}