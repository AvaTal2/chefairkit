"use client";

import {
  useParams,
  useRouter,
} from "next/navigation";

import {
  ArrowLeft,
  BookOpenCheck,
  CircleHelp,
  Sparkles,
  ImagePlus,
  BadgeCheck,
  MonitorPlay,
  Printer,
  FileCheck2,
  History,
  CheckCircle2,
  AlertTriangle,
  Save,
  ChefHat,
} from "lucide-react";

type ChecklistItem = {
  title: string;
  detail: string;
};

const testChecklist: ChecklistItem[] = [
  {
    title: "สร้าง SOP ใหม่จากสูตรที่ยังไม่มี SOP",
    detail:
      "ตรวจว่าหน้า SOP เปิดได้ สร้างข้อมูลเอกสารได้ และบันทึกแล้วข้อมูลยังอยู่หลัง Refresh",
  },
  {
    title: "เพิ่ม / แก้ไข / ลบ Step",
    detail:
      "ตรวจการเพิ่ม Step, เปลี่ยนข้อความ, เวลา, อุณหภูมิ, QC Target, QC Warning และการเรียงหมายเลขหลังลบ Step",
  },
  {
    title: "รูปภาพในแต่ละ Step",
    detail:
      "อัปโหลด เปลี่ยน และลบรูป ตรวจว่ารูปยังอยู่หลัง Refresh และรูปใหม่ไม่ย้อนกลับเป็นรูปเก่า",
  },
  {
    title: "Kitchen Mode",
    detail:
      "ตรวจว่า Step, รูป, วิธีทำ, เวลา, อุณหภูมิ และ QC แสดงตรงกับข้อมูลในหน้า SOP",
  },
  {
    title: "Print / PDF",
    detail:
      "ตรวจว่าเอกสารดึงข้อมูลสูตร วัตถุดิบ Step รูป Version ผู้อนุมัติ และ QC ครบ และ Save เป็น PDF ได้",
  },
  {
    title: "AI Draft — สูตรที่ยังไม่มี SOP / Step",
    detail:
      "กด AI ช่วยร่าง SOP → Preview → นำร่างมาใช้ ตรวจว่าข้อมูลและ Step ถูกสร้างได้",
  },
  {
    title: "AI Draft — เติมเฉพาะข้อมูลที่ว่าง",
    detail:
      "กรณีมี SOP เดิม ตรวจว่าข้อมูลเดิมไม่ถูกเขียนทับ และ Step เดิมไม่ถูกเพิ่มซ้ำ",
  },
  {
    title: "AI Draft — แทนที่ SOP เดิม",
    detail:
      "ตรวจคำเตือนก่อนแทนที่ และตรวจว่าข้อมูล/Step ชุดใหม่เข้ามาแทนของเดิมตามที่ยืนยัน",
  },
  {
    title: "AI Draft — Step เดิมมีรูป",
    detail:
      "ตรวจว่าระบบเตือนชัดเจนว่ารูปจะถูกลบเมื่อเลือกแทนที่ และไม่ลบจนกว่าจะยืนยัน",
  },
  {
    title: "Approval — Draft → Approved",
    detail:
      "กรอกผู้อนุมัติแล้วกดอนุมัติ ตรวจสถานะ APPROVED และวันที่อนุมัติอัตโนมัติ",
  },
  {
    title: "แก้ไขหลังอนุมัติ",
    detail:
      "แก้ SOP / Step / รูปหลัง Approved แล้วตรวจว่าสถานะกลับเป็น DRAFT และต้องอนุมัติใหม่",
  },
  {
    title: "Version History",
    detail:
      "อนุมัติ Version ใหม่ ตรวจ Snapshot ของข้อความ Step และรูป และตรวจว่า Version เดิมไม่เปลี่ยนตาม SOP ปัจจุบัน",
  },
  {
    title: "ห้ามใช้ Version ซ้ำ",
    detail:
      "ลองอนุมัติด้วยหมายเลข Version ที่เคยอนุมัติแล้ว ระบบต้องไม่ยอมบันทึกซ้ำ",
  },
  {
    title: "Flow ต่อเนื่องทั้งระบบ",
    detail:
      "Preview AI → Apply → Save → Approve → History → Kitchen Mode → Print/PDF และตรวจว่าข้อมูลตรงกันทุกหน้า",
  },
];

export default function SopHelpPage() {
  const params = useParams();
  const router = useRouter();

  const recipeId = params.id as string;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <button
            type="button"
            onClick={() =>
              router.push(
                `/recipes/${recipeId}/sop`
              )
            }
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-amber-600"
          >
            <ArrowLeft className="w-4 h-4" />
            กลับหน้า SOP
          </button>

          <div className="flex items-start gap-4 mt-5">
            <div className="bg-slate-800 text-white p-3 rounded-2xl">
              <CircleHelp className="w-6 h-6" />
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800">
                คู่มือ SOP + Test Checklist
              </h1>

              <p className="text-sm text-slate-500 mt-1 max-w-3xl">
                คู่มือใช้งานสำหรับเจ้าของสูตร เชฟ และทีมทดสอบระบบ
              </p>
            </div>
          </div>
        </header>

        <section className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm mb-6">
          <div className="flex items-center gap-3 mb-5">
            <BookOpenCheck className="w-5 h-5 text-amber-500" />

            <div>
              <h2 className="font-extrabold text-slate-800 text-lg">
                SOP Workflow
              </h2>

              <p className="text-xs text-slate-400 mt-1">
                ลำดับการใช้งานหลักของระบบ
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <FlowCard
              number="1"
              title="สร้าง / เปิด SOP"
              detail="เริ่มจากหน้ารายละเอียดสูตร แล้วเข้าเมนู SOP"
              icon={<ChefHat className="w-5 h-5" />}
            />

            <FlowCard
              number="2"
              title="กรอกข้อมูล + Step"
              detail="ใส่รายละเอียด วิธีทำ รูป เวลา อุณหภูมิ และ QC"
              icon={<ImagePlus className="w-5 h-5" />}
            />

            <FlowCard
              number="3"
              title="ตรวจและอนุมัติ"
              detail="ตรวจข้อมูลทั้งหมด กำหนด Version และอนุมัติ SOP"
              icon={<FileCheck2 className="w-5 h-5" />}
            />

            <FlowCard
              number="4"
              title="นำไปใช้งาน"
              detail="เปิด Kitchen Mode, Print/PDF และดู Version History"
              icon={<MonitorPlay className="w-5 h-5" />}
            />
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm mb-6">
          <h2 className="font-extrabold text-slate-800 text-lg mb-5">
            วิธีใช้แต่ละฟังก์ชัน
          </h2>

          <div className="space-y-4">
            <GuideRow
              icon={<Save className="w-5 h-5" />}
              title="บันทึก SOP"
              detail="ใช้บันทึกข้อมูลระดับเอกสาร เช่น ข้อมูลผลิตภัณฑ์ อุปกรณ์ การเตรียม จุดควบคุม QC การบรรจุ สุขลักษณะ ผู้รับผิดชอบ และหมายเหตุ"
            />

            <GuideRow
              icon={<ImagePlus className="w-5 h-5" />}
              title="Step + รูปอ้างอิง"
              detail="แต่ละ Step สามารถใส่วิธีทำ เวลา อุณหภูมิ QC Target, QC Warning และรูปสำหรับเทียบของจริงหน้างานได้"
            />

            <GuideRow
              icon={<Sparkles className="w-5 h-5" />}
              title="AI ช่วยร่าง SOP"
              detail="AI จะสร้าง Draft จากข้อมูลสูตรและวัตถุดิบก่อน ผู้ใช้ต้องตรวจ Preview แล้วจึงเลือกนำร่างมาใช้"
            />

            <GuideRow
              icon={<CheckCircle2 className="w-5 h-5" />}
              title="AI — เติมเฉพาะข้อมูลที่ยังว่าง"
              detail="เหมาะเมื่อมี SOP เดิมอยู่แล้ว ระบบจะเก็บข้อมูลเดิมไว้ และจะไม่เพิ่ม AI Step ซ้ำเมื่อมี Step อยู่แล้ว"
            />

            <GuideRow
              icon={<AlertTriangle className="w-5 h-5" />}
              title="AI — แทนที่ด้วย AI"
              detail="ใช้เมื่ออยากสร้าง SOP ชุดใหม่จาก Draft AI ระบบจะแจ้งเตือนก่อนลบ Step เดิม โดยเฉพาะกรณี Step เดิมมีรูป"
            />

            <GuideRow
              icon={<FileCheck2 className="w-5 h-5" />}
              title="Draft / Approved"
              detail="SOP ที่ยังไม่อนุมัติเป็น DRAFT เมื่อกดอนุมัติ ระบบบันทึกผู้อนุมัติ วันที่ และเปลี่ยนเป็น APPROVED"
            />

            <GuideRow
              icon={<History className="w-5 h-5" />}
              title="Version History"
              detail="เมื่อ Approve ระบบเก็บ Snapshot ของ Version นั้นไว้ เพื่อเปิดดูย้อนหลังโดยไม่เปลี่ยนตาม SOP ปัจจุบัน"
            />

            <GuideRow
              icon={<MonitorPlay className="w-5 h-5" />}
              title="Kitchen Mode"
              detail="หน้าสำหรับพนักงานครัว ใช้ดูทีละ Step พร้อมรูป วิธีทำ เวลา อุณหภูมิ และ QC โดยไม่ต้องเห็นฟอร์มแก้ไข"
            />

            <GuideRow
              icon={<Printer className="w-5 h-5" />}
              title="Print / PDF"
              detail="เปิดเอกสาร SOP แบบอ่านง่ายสำหรับพิมพ์ หรือเลือก Save as PDF จาก Print Dialog ของ Browser"
            />

            <GuideRow
              icon={<BadgeCheck className="w-5 h-5" />}
              title="QC"
              detail="QC Target คือสิ่งที่ต้องได้ ส่วน QC Warning คือสิ่งผิดปกติที่พนักงานต้องสังเกตและไม่ควรปล่อยผ่าน"
            />
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />

              <div>
                <h2 className="font-extrabold text-slate-800 text-lg">
                  Test Checklist — รอทดสอบรวม
                </h2>

                <p className="text-xs text-slate-400 mt-1">
                  รายการนี้ใช้ให้ทีมเช็กระบบทีเดียวภายหลัง ไม่ถือว่าผ่านจนกว่าจะมีการทดสอบจริง
                </p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {testChecklist.map((item, index) => (
              <div
                key={item.title}
                className="p-5 sm:p-6 flex items-start gap-4"
              >
                <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-extrabold shrink-0">
                  {index + 1}
                </div>

                <div>
                  <h3 className="font-bold text-slate-800">
                    {item.title}
                  </h3>

                  <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                    {item.detail}
                  </p>

                  <div className="flex flex-wrap gap-4 mt-3 text-xs text-slate-400">
                    <span>☐ ผ่าน</span>
                    <span>☐ ไม่ผ่าน</span>
                    <span>☐ ต้องแก้</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-6 bg-amber-50 border border-amber-100 rounded-2xl p-4 text-sm text-amber-800 leading-relaxed">
          <strong>หมายเหตุ:</strong>{" "}
          AI เป็นผู้ช่วยร่างเอกสาร ไม่ใช่ผู้อนุมัติมาตรฐานด้าน Food Safety
          เวลา อุณหภูมิ Shelf Life และค่าควบคุมสำคัญควรได้รับการตรวจสอบจากผู้รับผิดชอบก่อนใช้จริง
        </div>
      </div>
    </main>
  );
}

function FlowCard({
  number,
  title,
  detail,
  icon,
}: {
  number: string;
  title: string;
  detail: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="border border-slate-200 rounded-2xl p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="bg-amber-50 text-amber-600 p-2.5 rounded-xl">
          {icon}
        </div>

        <span className="text-xs font-extrabold text-slate-300">
          {number.padStart(2, "0")}
        </span>
      </div>

      <h3 className="font-extrabold text-slate-800 mt-4">
        {title}
      </h3>

      <p className="text-sm text-slate-500 mt-1 leading-relaxed">
        {detail}
      </p>
    </div>
  );
}

function GuideRow({
  icon,
  title,
  detail,
}: {
  icon: React.ReactNode;
  title: string;
  detail: string;
}) {
  return (
    <div className="border border-slate-200 rounded-2xl p-5 flex items-start gap-4">
      <div className="bg-slate-100 text-slate-700 p-2.5 rounded-xl shrink-0">
        {icon}
      </div>

      <div>
        <h3 className="font-bold text-slate-800">
          {title}
        </h3>

        <p className="text-sm text-slate-500 mt-1 leading-relaxed">
          {detail}
        </p>
      </div>
    </div>
  );
}
