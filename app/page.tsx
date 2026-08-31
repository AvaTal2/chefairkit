"use client";

import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  BookOpen,
  BookOpenCheck,
  Calculator,
  CheckCircle2,
  ChefHat,
  CircleAlert,
  ClipboardCheck,
  Factory,
  Gauge,
  History,
  PlayCircle,
  QrCode,
  Scale,
  ShieldCheck,
  Sparkles,
  WandSparkles,
} from "lucide-react";


const supportTools = [
  {
    title: "สูตร & คลังวัตถุดิบ",
    description:
      "จัดเก็บสูตร วัตถุดิบ ราคา Yield และข้อมูลโภชนาการไว้ใช้ต่อยอดกับทุกระบบ",
    href: "/recipes",
    icon: BookOpen,
    badge: "Recipe System",
  },
  {
    title: "ต้นทุน & ราคาขาย",
    description:
      "คำนวณต้นทุนพื้นฐาน ไปจนถึง Advanced Cost, GP, VAT และ Profit Scenario",
    href: "/cost",
    icon: Calculator,
    badge: "Cost Control",
  },
  {
    title: "Production Center",
    description:
      "วางแผน Batch, Yield/Loss, Shopping List และเปิด Production Sheet จากประวัติการผลิต",
    href: "/production",
    icon: Factory,
    badge: "Production",
  },
  {
    title: "Dynamic QR & Analytics",
    description:
      "สร้าง QR แบบแก้ปลายทางได้ พร้อมดูจำนวนการใช้งานและรายงานการสแกน",
    href: "/qr",
    icon: QrCode,
    badge: "QR Tools",
  },
];

const workflow = [
  {
    step: "01",
    title: "สร้างหรือบันทึกสูตร",
    text: "เก็บวัตถุดิบ Yield จำนวนเสิร์ฟ ราคา และข้อมูลสำคัญของสูตร",
    icon: BookOpen,
  },
  {
    step: "02",
    title: "สร้าง SOP",
    text: "กำหนด Step, ภาพอ้างอิง, เวลา, อุณหภูมิ, QC Target และ Warning",
    icon: BookOpenCheck,
  },
  {
    step: "03",
    title: "ใช้ AI ช่วยร่าง",
    text: "ให้ AI ช่วยจัดโครง SOP จากสูตรเดิม แล้วผู้ใช้ตรวจและอนุมัติก่อนใช้งาน",
    icon: WandSparkles,
  },
  {
    step: "04",
    title: "เปิด Kitchen Mode",
    text: "ให้ทีมครัวเปิดดูขั้นตอนที่ต้องทำจริงบนมือถือ แท็บเล็ต หรือหน้าจอในครัว",
    icon: PlayCircle,
  },
  {
    step: "05",
    title: "นำไปใช้ในการผลิต",
    text: "เชื่อม SOP เข้ากับ Production เพื่อให้สูตรและมาตรฐานการทำงานไปด้วยกัน",
    icon: Factory,
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans">
      <section className="relative min-h-[680px] lg:min-h-[760px] overflow-hidden flex items-center">
        <Image
          src="/images/home/hero-chefworkkit.jpeg"
          alt="ทีมเชฟในครัวกำลังใช้งานระบบดิจิทัลบนแท็บเล็ต"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[66%_center]"
        />

        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/92 to-slate-950/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/20" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_28%,rgba(245,158,11,0.16),transparent_34%)]" />

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-slate-950/50 backdrop-blur text-amber-200 px-3.5 py-2 text-xs font-bold mb-5">
              <Sparkles className="w-4 h-4" />
              ChefWorkKit • Food Business Operating Tools
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black tracking-tight leading-[1.02] drop-shadow-2xl">
              จาก “สูตรอาหาร”
              <br />
              สู่{" "}
              <span className="text-amber-400">
                SOP ที่ทีมครัว
                <br className="hidden sm:block" />
                ทำตามได้จริง
              </span>
            </h1>

            <p className="mt-6 text-base sm:text-lg lg:text-xl text-slate-200 leading-relaxed max-w-2xl drop-shadow">
              รวมสูตร ต้นทุน ขั้นตอนการผลิต QC รูปอ้างอิง Kitchen Mode และ Production
              ไว้ในระบบเดียว เพื่อให้มาตรฐานของเชฟส่งต่อไปถึงทีมได้ชัดเจน
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mt-8">
              <Link href="/sop" className="inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold px-6 py-3.5 rounded-2xl transition shadow-xl shadow-amber-950/20">
                <BookOpenCheck className="w-5 h-5" />
                เริ่มสร้าง SOP
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link href="/recipe-calculator" className="inline-flex items-center justify-center gap-2 border border-white/15 bg-white/10 hover:bg-white/15 backdrop-blur text-white font-bold px-6 py-3.5 rounded-2xl transition">
                <Scale className="w-5 h-5 text-amber-300" />
                ทดลองเครื่องมือฟรี
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-8 max-w-2xl">
              {["SOP + QC", "AI ช่วยร่าง", "Production Ready"].map((item) => (
                <div key={item} className="flex items-center gap-2 text-xs text-slate-200 bg-slate-950/35 border border-white/10 backdrop-blur px-3 py-2.5 rounded-xl">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="absolute bottom-5 right-5 sm:bottom-8 sm:right-8 hidden md:block z-10">
          <div className="rounded-2xl border border-white/10 bg-slate-950/65 backdrop-blur-xl px-4 py-3 shadow-xl max-w-xs">
            <div className="flex items-center gap-3">
              <WandSparkles className="w-5 h-5 text-violet-300 shrink-0" />
              <div>
                <p className="text-xs font-extrabold">Recipe → SOP → Kitchen</p>
                <p className="text-[10px] text-slate-300 mt-0.5">เปลี่ยนความรู้ในสูตรให้เป็นขั้นตอนที่ทีมใช้ต่อได้</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 text-slate-900 py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 text-xs font-extrabold text-violet-700 bg-violet-100 px-3 py-1.5 rounded-full">
              <BookOpenCheck className="w-4 h-4" />
              CORE FEATURE
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mt-4">SOP ไม่ควรเป็นแค่ไฟล์เอกสาร</h2>
            <p className="text-slate-500 mt-3 leading-relaxed">ทำให้มาตรฐานของร้านกลายเป็นขั้นตอนที่เปิดดู ทำตาม ตรวจสอบ และนำกลับมาใช้ใน Production ได้จริง</p>
          </div>

          <div className="mt-8 grid grid-cols-1 xl:grid-cols-[1.05fr_0.95fr] gap-6">
            <div className="rounded-[30px] bg-slate-900 text-white p-6 sm:p-8 shadow-xl">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0">
                  <ChefHat className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-2xl sm:text-3xl font-black">SOP & Kitchen Mode</h3>
                  <p className="text-slate-400 text-sm mt-2 max-w-xl">เปลี่ยนความรู้ของเชฟให้เป็นมาตรฐานที่ทีมเปิดดูและทำตามได้</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-7">
                {[
                  "Step-by-step พร้อมรูปอ้างอิง",
                  "เวลาและอุณหภูมิแต่ละขั้น",
                  "QC Target / QC Warning",
                  "AI ช่วยร่าง SOP จากสูตร",
                  "Version History",
                  "Approval & Document Status",
                  "Kitchen Mode",
                  "Print / PDF",
                ].map((item) => (
                  <div key={item} className="rounded-2xl border border-white/10 bg-white/5 p-3.5 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                    <span className="text-sm text-slate-200">{item}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mt-7">
                <Link href="/recipes" className="inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold px-5 py-3 rounded-xl transition">
                  เริ่มจากสูตรของฉัน
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/pricing" className="inline-flex items-center justify-center gap-2 border border-white/10 bg-white/5 hover:bg-white/10 font-bold px-5 py-3 rounded-xl transition">ดูแพ็กเกจ</Link>
              </div>
            </div>

            <div className="rounded-[30px] bg-white border border-slate-200 shadow-sm p-6 sm:p-8">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-extrabold text-violet-600">DOCUMENT CONTROL</p>
                  <h3 className="text-xl font-black mt-1">SOP ที่ตรวจย้อนกลับได้</h3>
                </div>
                <History className="w-6 h-6 text-slate-300" />
              </div>

              <div className="space-y-3 mt-6">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs text-slate-400">Version</p>
                      <p className="font-extrabold mt-1">1.2</p>
                    </div>
                    <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full text-xs font-extrabold">
                      <BadgeCheck className="w-4 h-4" /> APPROVED
                    </div>
                  </div>
                </div>

                {[
                  [ShieldCheck, "แก้ไขหลังอนุมัติ", "ระบบเปลี่ยนกลับเป็น Draft เพื่อให้ตรวจใหม่"],
                  [ClipboardCheck, "เก็บ Snapshot ของ Version", "ตรวจย้อนกลับข้อความ Step และรูปของเวอร์ชันเก่าได้"],
                  [PlayCircle, "Kitchen Mode", "เปลี่ยน SOP ให้เป็นหน้าปฏิบัติงานที่อ่านง่ายในครัว"],
                ].map(([Icon, title, text], index) => {
                  const Cmp = Icon as typeof ShieldCheck;
                  return (
                    <div key={String(title)} className="rounded-2xl border border-slate-200 p-4">
                      <div className="flex items-center gap-3">
                        <Cmp className={`w-5 h-5 ${index === 0 ? "text-amber-500" : index === 1 ? "text-violet-500" : "text-emerald-500"}`} />
                        <div>
                          <p className="font-bold text-sm">{String(title)}</p>
                          <p className="text-xs text-slate-500 mt-1">{String(text)}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white text-slate-900 py-16 sm:py-20 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-800 text-xs font-extrabold px-3 py-1.5 rounded-full">
              <Gauge className="w-4 h-4" /> ONE CONNECTED WORKFLOW
            </div>
            <h2 className="text-3xl sm:text-4xl font-black mt-4">สูตรหนึ่งสูตร ไปต่อได้ทั้งระบบ</h2>
            <p className="text-slate-500 mt-3">ไม่ต้องสร้างข้อมูลซ้ำหลายรอบ ให้ Recipe, SOP และ Production ทำงานต่อกัน</p>
          </div>

          <div className="mt-10 relative overflow-hidden rounded-[30px] border border-slate-200 shadow-sm bg-slate-950 min-h-[320px] sm:min-h-[420px]">
            <Image
              src="/images/home/workflow-production.jpeg"
              alt="พื้นที่ผลิตอาหารที่ใช้ระบบดิจิทัลช่วยวางแผนและควบคุมการผลิต"
              fill
              sizes="(max-width: 1280px) 100vw, 1200px"
              className="object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/88 via-slate-950/48 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/55 via-transparent to-transparent" />
            <div className="relative z-10 max-w-xl p-6 sm:p-8 lg:p-10 text-white">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/10 backdrop-blur px-3 py-1.5 text-xs font-bold text-amber-200">
                <Factory className="w-4 h-4" />
                FROM RECIPE TO PRODUCTION
              </div>
              <h3 className="text-2xl sm:text-3xl font-black mt-4">ข้อมูลเดียวกัน ใช้ต่อจากสูตรไปถึงหน้างาน</h3>
              <p className="text-sm sm:text-base text-slate-200 mt-3 leading-relaxed">
                เมื่อ Recipe, SOP และ Production เชื่อมกัน ทีมไม่ต้องจำจากปากเปล่า และไม่ต้องสร้างข้อมูลชุดเดิมซ้ำหลายรอบ
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-6">
            {workflow.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.step} className="relative rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center"><Icon className="w-5 h-5" /></div>
                    <span className="text-xs font-black text-slate-300">{item.step}</span>
                  </div>
                  <h3 className="font-extrabold mt-5">{item.title}</h3>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">{item.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 text-slate-900 py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
            <div>
              <p className="text-xs font-extrabold tracking-[0.16em] text-amber-600">MORE THAN SOP</p>
              <h2 className="text-3xl sm:text-4xl font-black mt-2">เครื่องมือที่ทำให้ SOP ใช้งานต่อได้จริง</h2>
            </div>
            <Link href="/pricing" className="inline-flex items-center gap-2 text-sm font-extrabold text-amber-600">ดูแพ็กเกจทั้งหมด <ArrowRight className="w-4 h-4" /></Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-8">
            {supportTools.map((tool) => {
              const Icon = tool.icon;
              return (
                <Link key={tool.title} href={tool.href} className="group rounded-[26px] bg-white border border-slate-200 p-6 shadow-sm hover:border-amber-300 hover:-translate-y-0.5 hover:shadow-md transition">
                  <div className="flex items-start justify-between gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center"><Icon className="w-6 h-6" /></div>
                    <span className="text-[10px] font-extrabold bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full">{tool.badge}</span>
                  </div>
                  <h3 className="text-xl font-extrabold mt-5 group-hover:text-amber-600 transition">{tool.title}</h3>
                  <p className="text-sm text-slate-500 mt-2 leading-relaxed">{tool.description}</p>
                  <div className="inline-flex items-center gap-1.5 text-xs font-extrabold text-amber-600 mt-5">เปิดใช้งาน <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" /></div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-white text-slate-900 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-[32px] border border-slate-200 bg-gradient-to-br from-white to-amber-50 p-6 sm:p-8 lg:p-10">
            <div className="grid grid-cols-1 lg:grid-cols-[0.8fr_1.2fr] gap-8 items-center">
              <div>
                <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 text-xs font-extrabold px-3 py-1.5 rounded-full"><Sparkles className="w-4 h-4" /> เริ่มใช้ฟรี</div>
                <h2 className="text-3xl font-black mt-4">ยังไม่พร้อมใช้ระบบเต็ม?<br />เริ่มจากเครื่องมือพื้นฐานก่อน</h2>
                <p className="text-sm text-slate-500 mt-3 leading-relaxed">เครื่องคำนวณสูตรและเครื่องมือพื้นฐานช่วยให้เริ่มใช้งานได้ทันที แล้วค่อยต่อยอดเข้า Recipe, SOP และ Production ภายหลัง</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link href="/recipe-calculator" className="rounded-2xl bg-white border border-slate-200 p-5 hover:border-amber-300 transition">
                  <Scale className="w-6 h-6 text-amber-500" />
                  <h3 className="font-extrabold mt-4">เครื่องคำนวณสูตรอาหาร</h3>
                  <p className="text-xs text-slate-500 mt-2">ย่อ ขยาย คูณสูตร และปรับตาม Yield หรือจำนวนเสิร์ฟ</p>
                </Link>
                <Link href="/qr" className="rounded-2xl bg-white border border-slate-200 p-5 hover:border-amber-300 transition">
                  <QrCode className="w-6 h-6 text-amber-500" />
                  <h3 className="font-extrabold mt-4">Static QR Code</h3>
                  <p className="text-xs text-slate-500 mt-2">สร้าง QR สำหรับ URL, WiFi, PromptPay และข้อมูลติดต่อ</p>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-950 py-16 sm:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center"><ChefHat className="w-7 h-7" /></div>
          <h2 className="text-3xl sm:text-4xl font-black mt-5">ทำให้สูตรของคุณ<span className="text-amber-400"> กลายเป็นระบบที่ทีมใช้ต่อได้</span></h2>
          <p className="text-slate-400 max-w-2xl mx-auto mt-3">เริ่มจากสูตรหนึ่งสูตร แล้วต่อยอดไปสู่ SOP, Kitchen Mode, Production และการควบคุมมาตรฐานในระบบเดียว</p>

          <div className="flex flex-col sm:flex-row justify-center gap-3 mt-7">
            <Link href="/sop" className="inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold px-6 py-3.5 rounded-2xl transition">เริ่มสร้าง SOP <ArrowRight className="w-4 h-4" /></Link>
            <Link href="/pricing" className="inline-flex items-center justify-center gap-2 border border-white/10 bg-white/5 hover:bg-white/10 font-bold px-6 py-3.5 rounded-2xl transition">ดูแพ็กเกจ <BarChart3 className="w-4 h-4" /></Link>
          </div>
        </div>
      </section>
    </div>
  );
}