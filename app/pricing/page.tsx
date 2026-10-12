import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Calculator,
  Check,
  ChefHat,
  ClipboardList,
  FileSpreadsheet,
  FileText,
  LockKeyhole,
  Package,
  QrCode,
  Scale,
  ShoppingCart,
  Sparkles,
} from "lucide-react";

const features = [
  {
    icon: Calculator,
    title: "คำนวณต้นทุนอาหาร",
    description:
      "คำนวณต้นทุนวัตถุดิบ ต้นทุนต่อสูตร และต้นทุนต่อหน่วย เพื่อช่วยกำหนดราคาขาย",
  },
  {
    icon: BookOpen,
    title: "บันทึกสูตรอาหารไม่จำกัด",
    description:
      "สร้าง แก้ไข และจัดเก็บสูตรอาหารไว้ในบัญชีของคุณ โดยไม่มีข้อจำกัดจำนวนสูตร",
  },
  {
    icon: Package,
    title: "คลังวัตถุดิบไม่จำกัด",
    description:
      "จัดเก็บข้อมูลวัตถุดิบ ราคา หน่วย และข้อมูลโภชนาการ เพื่อใช้งานร่วมกับสูตรอาหาร",
  },
  {
    icon: Scale,
    title: "ย่อและขยายสูตร",
    description:
      "ปรับปริมาณวัตถุดิบตามจำนวนที่ต้องการผลิต พร้อมคำนวณปริมาณใหม่",
  },
  {
    icon: ChefHat,
    title: "คำนวณโภชนาการ",
    description:
      "ช่วยคำนวณข้อมูลโภชนาการของสูตรอาหารจากวัตถุดิบที่บันทึกไว้",
  },
  {
    icon: ClipboardList,
    title: "วางแผนการผลิต",
    description:
      "วางแผนปริมาณการผลิตและเตรียมวัตถุดิบสำหรับการทำอาหารแต่ละครั้ง",
  },
  {
    icon: ShoppingCart,
    title: "Shopping List",
    description:
      "จัดรายการวัตถุดิบที่ต้องจัดซื้อจากแผนการผลิต เพื่อเตรียมงานได้สะดวกขึ้น",
  },
  {
    icon: FileText,
    title: "SOP และ Kitchen Mode",
    description:
      "จัดทำขั้นตอนการทำงานและเปิดดูสูตรหรือวิธีทำระหว่างปฏิบัติงานในครัว",
  },
  {
    icon: QrCode,
    title: "QR Code",
    description:
      "สร้างและจัดการ QR Code สำหรับนำไปใช้งานตามความต้องการ",
  },
  {
    icon: FileSpreadsheet,
    title: "ส่งออกข้อมูล",
    description:
      "ใช้ฟังก์ชันส่งออก PDF และ Excel ในส่วนที่ระบบรองรับ",
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <main className="max-w-6xl mx-auto px-4 py-12 sm:py-16">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-bold px-4 py-2 rounded-full mb-5">
            <BadgeCheck className="w-4 h-4" />
            ChefWorkKit Free Edition
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-800 leading-tight">
            เครื่องมือจัดการสูตรอาหาร
            <span className="block text-emerald-600 mt-2">
              ใช้งานฟรี ไม่มีค่าบริการ
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-500 mt-5 leading-relaxed">
            รวมเครื่องมือสำหรับเชฟ ร้านอาหาร
            และผู้ประกอบการอาหาร
            ตั้งแต่การบันทึกสูตร คำนวณต้นทุน
            จัดการวัตถุดิบ ไปจนถึงวางแผนการผลิต
            ในระบบเดียว
          </p>

          <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold px-7 py-3.5 rounded-xl transition text-sm"
            >
              เริ่มใช้งานฟรี
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white border border-slate-200 hover:border-amber-300 text-slate-700 font-bold px-7 py-3.5 rounded-xl transition text-sm"
            >
              <LockKeyhole className="w-4 h-4" />
              เข้าสู่ระบบ
            </Link>
          </div>
        </div>

        {/* Free Access */}
        <section className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-3xl shadow-sm p-6 sm:p-8 mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Sparkles className="w-8 h-8" />
            </div>

            <div className="flex-1">
              <h2 className="text-xl font-extrabold text-slate-800">
                ทุกฟีเจอร์ทั่วไป เปิดให้ใช้ฟรี
              </h2>

              <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                ไม่ต้องสมัครแพ็กเกจ Pro
                ไม่มีค่าบริการรายเดือน
                และไม่มีการเรียกเก็บเงินผ่านระบบ
              </p>
            </div>

            <div className="sm:text-right shrink-0">
              <p className="text-4xl font-extrabold text-emerald-600">
                ฿0
              </p>
              <p className="text-xs text-slate-400 mt-1">
                ไม่มีค่าสมาชิก
              </p>
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-slate-100 flex items-start gap-3">
            <Check className="w-5 h-5 text-emerald-500 shrink-0" />
            <p className="text-sm text-slate-600">
              สมัครบัญชีเพื่อบันทึกและจัดการข้อมูลของคุณผ่านระบบออนไลน์
            </p>
          </div>
        </section>

        {/* Features */}
        <section>
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800">
              เครื่องมือที่เปิดให้ใช้งาน
            </h2>

            <p className="text-sm text-slate-500 mt-2">
              ใช้งานฟีเจอร์ที่ไม่พึ่งพา AI
              โดยไม่มีข้อจำกัดจากแพ็กเกจสมาชิก
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <div
                  key={feature.title}
                  className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm"
                >
                  <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6" />
                  </div>

                  <h3 className="font-extrabold text-slate-800">
                    {feature.title}
                  </h3>

                  <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Footer CTA */}
        <section className="mt-12 bg-slate-900 rounded-3xl p-7 sm:p-10 text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            พร้อมจัดการสูตรอาหารอย่างเป็นระบบแล้วหรือยัง?
          </h2>

          <p className="text-sm text-slate-300 mt-3 max-w-xl mx-auto leading-relaxed">
            เริ่มบันทึกสูตร คำนวณต้นทุน
            และจัดการวัตถุดิบของคุณได้ฟรี
          </p>

          <Link
            href="/register"
            className="mt-6 inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold px-7 py-3.5 rounded-xl transition text-sm"
          >
            เริ่มต้นใช้งาน
            <ArrowRight className="w-4 h-4" />
          </Link>
        </section>
      </main>
    </div>
  );
}