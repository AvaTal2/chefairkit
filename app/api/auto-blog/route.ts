import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenAI } from "@google/genai";

export async function GET(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase Environment Variables");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

    // 1. ดึงคีย์เวิร์ดที่ยังไม่ได้ใช้งาน (is_used = false) มา 1 คำ
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

    // 2. ปรับแต่ง Prompt ให้ AI เขียนบทความยาว เจาะลึก และทำ SEO ได้ดีเยี่ยม
    const prompt = `
      คุณเป็นผู้เชี่ยวชาญระดับโปรเฟสชันแนลด้านการตลาดดิจิทัล SEO และการทำธุรกิจยุคใหม่
      จงเขียนบทความ SEO คุณภาพสูงระดับพรีเมียม ความยาวประมาณ 1,000-1,500 คำ จากคีย์เวิร์ดหลักคือ: "${targetKeyword}"
      
      แนวทางการเขียนเพื่อให้ติด SEO และมีประโยชน์สูงสุดต่อผู้อ่าน:
      - มีการเกริ่นนำที่ดึงดูดใจ อธิบายภาพรวม และบอกเหตุผลว่าทำไมผู้อ่านต้องรู้เรื่องนี้
      - จัดโครงสร้างเนื้อหาด้วยหัวข้อย่อย (H2, H3) ที่ครอบคลุมคำถามที่คนมักค้นหา (FAQ/Intent)
      - เนื้อหาต้องมีความละเอียด เจาะลึก ให้ขั้นตอน วิธีการปฏิบัติจริง หรือข้อควรระวังอย่างครบถ้วน
      - หากเหมาะสม ให้จัดรูปแบบข้อมูลเปรียบเทียบด้วยตาราง HTML (<table>, <tr>, <th>, <td>) เพื่อให้อ่านง่าย
      - ใช้ภาษาที่เป็นธรรมชาติ น่าอ่าน เข้าใจง่าย เหมาะกับผู้ประกอบการและบุคคลทั่วไป
      
      ขอรูปแบบผลลัพธ์เป็น JSON ล้วนๆ ห้ามมีคำอธิบายอื่นหรือเครื่องหมายบล็อกโค้ดใดๆ ครอบนอกเหนือจาก JSON โครงสร้างดังนี้:
      {
        "title": "หัวข้อบทความที่ดึงดูด น่าสนใจ และมีคีย์เวิร์ดหลักรวมอยู่",
        "excerpt": "คำโปรยสรุปใจความสำคัญของบทความความยาวประมาณ 2-3 ประโยคเพื่อดึงดูดคนคลิกอ่าน",
        "content": "เนื้อหาบทความทั้งหมด จัดรูปแบบด้วยแท็ก HTML เช่น <h2>, <h3>, <p>, <ul>, <li>, <table> ให้เรียบร้อยสวยงามสมบูรณ์"
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

    // ทำความสะอาดข้อความ JSON
    const cleanJsonText = textResponse.replace(/```json/g, "").replace(/```/g, "").trim();
    const articleData = JSON.parse(cleanJsonText);

    const generatedSlug = `article-${Date.now()}`;

    // 3. บันทึกลงตาราง blogs ใน Supabase
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

    // 4. อัปเดตสถานะคีย์เวิร์ดว่าถูกใช้งานแล้ว (is_used = true)
    await supabase
      .from("keywords")
      .update({ is_used: true })
      .eq("id", keywordData.id);

    return NextResponse.json({
      success: true,
      message: `เจนบทความยาวเชิงลึกด้วย Gemini สำเร็จจากคีย์เวิร์ด: "${targetKeyword}"`,
      slug: generatedSlug,
      title: articleData.title,
    });
  } catch (error: any) {
    console.error("Auto-Blog Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}