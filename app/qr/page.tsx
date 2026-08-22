"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/navbar";
import { 
  Link as LinkIcon, QrCode, Wifi, UserCheck, MessageSquare, 
  Phone, Mail, MessageCircle, CreditCard, Download, Upload, Wallet,
  Store, ShoppingBag, Users, Calendar, Sparkles, Info
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
// @ts-ignore
import generatePayload from "promptpay-qr";

type QRType = "url" | "promptpay" | "wifi" | "contact" | "text" | "phone" | "sms" | "whatsapp" | "email";

export default function QrPage() {
  const [selectedType, setSelectedType] = useState<QRType>("url");

  // State ทั่วไป
  const [qrTitle, setQrTitle] = useState<string>("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  // 1. URL / ลิงก์
  const [urlInput, setUrlInput] = useState<string>("https://shopee.co.th");

  // 2. PromptPay
  const [accountType, setAccountType] = useState<"phone" | "idCard">("phone");
  const [accountNo, setAccountNo] = useState<string>("0812345678");
  const [amount, setAmount] = useState<string>("99");
  const [receiverName, setReceiverName] = useState<string>("ร้านเชฟแอร์ เบเกอรี่");
  const [promptpayPayload, setPromptpayPayload] = useState<string>("");

  // 3. WiFi
  const [wifiSsid, setWifiSsid] = useState<string>("");
  const [wifiPassword, setWifiPassword] = useState<string>("");
  const [wifiEncryption, setWifiEncryption] = useState<"WPA" | "WEP" | "nopass">("WPA");

  // 4. Contact
  const [contactName, setContactName] = useState<string>("");
  const [contactPhone, setContactPhone] = useState<string>("");
  const [contactEmail, setContactEmail] = useState<string>("");

  // 5. Text / Phone / SMS / WhatsApp / Email
  const [textInput, setTextInput] = useState<string>("");
  const [phoneInput, setPhoneInput] = useState<string>("");
  const [smsPhone, setSmsPhone] = useState<string>("");
  const [smsMessage, setSmsMessage] = useState<string>("");
  const [waPhone, setWaPhone] = useState<string>("");
  const [emailTo, setEmailTo] = useState<string>("");
  const [emailSubject, setEmailSubject] = useState<string>("");

  // คำนวณ Payload PromptPay
  useEffect(() => {
    try {
      const cleanAccount = accountNo.replace(/[^0-9]/g, "");
      if (cleanAccount.length >= 10) {
        const parsedAmount = amount ? parseFloat(amount) : undefined;
        const payload = generatePayload(cleanAccount, { amount: parsedAmount });
        setPromptpayPayload(payload);
      } else {
        setPromptpayPayload(accountNo);
      }
    } catch {
      setPromptpayPayload(accountNo);
    }
  }, [accountNo, amount]);

  // คำนวณค่าที่จะเอาไปสร้าง QR ตามประเภทที่เลือก
  const getQRValue = (): string => {
    switch (selectedType) {
      case "url":
        return urlInput || "https://shopee.co.th";
      case "promptpay":
        return promptpayPayload || "0812345678";
      case "wifi":
        return `WIFI:T:${wifiEncryption};S:${wifiSsid};P:${wifiPassword};;`;
      case "contact":
        return `BEGIN:VCARD\nVERSION:3.0\nN:${contactName}\nTEL:${contactPhone}\nEMAIL:${contactEmail}\nEND:VCARD`;
      case "text":
        return textInput || "ข้อความของคุณ";
      case "phone":
        return `tel:${phoneInput}`;
      case "sms":
        return `smsto:${smsPhone}:${smsMessage}`;
      case "whatsapp":
        return `https://wa.me/${waPhone.replace(/[^0-9]/g, "")}`;
      case "email":
        return `mailto:${emailTo}?subject=${encodeURIComponent(emailSubject)}`;
      default:
        return "https://shopee.co.th";
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setLogoUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const downloadQRCode = () => {
    const svgElement = document.getElementById("main-qr-svg") as SVGElement | null;
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = 400;
      canvas.height = selectedType === "promptpay" ? 500 : 440;
      if (ctx) {
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (selectedType === "promptpay") {
          ctx.fillStyle = "#0F3866";
          ctx.fillRect(20, 20, 360, 45);
          ctx.fillStyle = "#FFFFFF";
          ctx.font = "bold 16px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("สแกนจ่ายด้วยพร้อมเพย์", 200, 48);

          ctx.drawImage(img, 60, 80, 280, 280);

          ctx.fillStyle = "#1E293B";
          ctx.font = "bold 18px sans-serif";
          ctx.fillText(receiverName || "พร้อมเพย์", 200, 390);

          if (amount) {
            ctx.fillStyle = "#F97316";
            ctx.font = "bold 22px sans-serif";
            ctx.fillText(`${parseFloat(amount).toFixed(2)} บาท`, 200, 425);
          } else {
            ctx.fillStyle = "#64748B";
            ctx.font = "14px sans-serif";
            ctx.fillText("ลูกค้ากรอกยอดเงินเอง", 200, 425);
          }
        } else {
          ctx.drawImage(img, 60, 40, 280, 280);
          if (qrTitle) {
            ctx.fillStyle = "#1E293B";
            ctx.font = "bold 16px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(qrTitle, 200, 350);
          }
        }

        ctx.fillStyle = "#94A3B8";
        ctx.font = "12px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("สร้างฟรีที่ ChefAir Kit", 200, canvas.height - 20);

        const pngFile = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.download = `QR-${selectedType}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      }
    };

    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  const qrCategories = [
    { id: "url", label: "URL / ลิงก์", desc: "ส่งคนไปหน้าเว็บ LINE OA Shopee", icon: LinkIcon },
    { id: "promptpay", label: "QR พร้อมเพย์", desc: "รับเงินเข้าบัญชี ใส่โลโก้ร้านได้", icon: Wallet },
    { id: "wifi", label: "WiFi", desc: "แสดงข้อมูล WiFi และ QR เชื่อมต่อ", icon: Wifi },
    { id: "contact", label: "Contact", desc: "นามบัตร / ข้อมูลติดต่อ", icon: UserCheck },
    { id: "text", label: "ข้อความ", desc: "แสดงข้อความหลังสแกน", icon: MessageSquare },
    { id: "phone", label: "โทร", desc: "แตะเพื่อโทรออก", icon: Phone },
    { id: "sms", label: "SMS", desc: "ส่ง SMS พร้อมข้อความ", icon: MessageCircle },
    { id: "whatsapp", label: "WhatsApp", desc: "เปิดแชต WhatsApp", icon: MessageCircle },
    { id: "email", label: "Email", desc: "เปิดแอปอีเมลพร้อมหัวข้อ", icon: Mail },
  ];

  return (
    <div className="min-h-screen bg-slate-100/70 font-sans pb-16">
      <Navbar />

      <main className="py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
            สร้าง qrcode ฟรี
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            เลือกประเภท ใส่ข้อมูล แล้วดาวน์โหลด QR ไปใช้ได้ทันที
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* เมนูเลือกประเภท (Sidebar ฝั่งซ้าย) */}
          <div className="lg:col-span-4 bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm space-y-2">
            <h2 className="text-sm font-bold text-slate-800 px-3 py-1">เลือกประเภท QR</h2>
            <div className="space-y-1">
              {qrCategories.map((cat) => {
                const Icon = cat.icon;
                const isSelected = selectedType === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedType(cat.id as QRType)}
                    className={`w-full text-left p-3 rounded-2xl border transition flex items-center gap-3 ${
                      isSelected
                        ? "border-amber-500 bg-amber-50/50 text-amber-600 shadow-sm"
                        : "border-transparent hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <div className={`p-2 rounded-xl ${isSelected ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-500"}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-xs sm:text-sm">{cat.label}</div>
                      <div className="text-[11px] text-slate-400 font-normal">{cat.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ฟอร์มกรอกข้อมูล (ตรงกลาง) */}
          <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600">ขั้นตอนที่ 1</span>
              <span className="text-xs font-bold text-slate-700">
                {qrCategories.find((c) => c.id === selectedType)?.label}
              </span>
            </div>

            {/* 1. URL / ลิงก์ */}
            {selectedType === "url" && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ชื่อ QR (ไม่บังคับ)</label>
                  <input
                    type="text"
                    value={qrTitle}
                    onChange={(e) => setQrTitle(e.target.value)}
                    placeholder="เช่น เมนูกาแฟ / โปรโมชั่นร้าน"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">URL / ลิงก์</label>
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>
              </div>
            )}

            {/* 2. QR พร้อมเพย์ */}
            {selectedType === "promptpay" && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setAccountType("phone")}
                    className={`py-2 text-xs font-semibold rounded-xl border ${accountType === "phone" ? "border-amber-500 bg-amber-50 text-amber-600" : "border-slate-200 text-slate-600"}`}
                  >
                    เบอร์มือถือ
                  </button>
                  <button
                    onClick={() => setAccountType("idCard")}
                    className={`py-2 text-xs font-semibold rounded-xl border ${accountType === "idCard" ? "border-amber-500 bg-amber-50 text-amber-600" : "border-slate-200 text-slate-600"}`}
                  >
                    บัตรประชาชน
                  </button>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">หมายเลขพร้อมเพย์</label>
                  <input
                    type="text"
                    value={accountNo}
                    onChange={(e) => setAccountNo(e.target.value)}
                    placeholder="0812345678"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">จำนวนเงิน (ปล่อยว่างได้)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="ปล่อยว่างให้ลูกค้ากรอกเอง"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ชื่อร้าน / ผู้รับเงิน</label>
                  <input
                    type="text"
                    value={receiverName}
                    onChange={(e) => setReceiverName(e.target.value)}
                    placeholder="เช่น ร้านเชฟแอร์"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>
              </div>
            )}

            {/* 3. WiFi */}
            {selectedType === "wifi" && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ชื่อ WiFi (SSID)</label>
                  <input
                    type="text"
                    value={wifiSsid}
                    onChange={(e) => setWifiSsid(e.target.value)}
                    placeholder="เช่น ChefAir_Guest_WiFi"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">รหัสผ่าน WiFi</label>
                  <input
                    type="text"
                    value={wifiPassword}
                    onChange={(e) => setWifiPassword(e.target.value)}
                    placeholder="ใส่รหัสผ่าน"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>
              </div>
            )}

            {/* 4. Contact */}
            {selectedType === "contact" && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ชื่อ - นามสกุล</label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="เชฟแอร์"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">เบอร์โทรศัพท์</label>
                  <input
                    type="text"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="0812345678"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>
              </div>
            )}

            {/* 5. ข้อความทั่วไป */}
            {selectedType === "text" && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ข้อความที่ต้องการให้สแกนแล้วเจอ</label>
                <textarea
                  rows={4}
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="พิมพ์ข้อความที่นี่..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>
            )}

            {/* 6. โทร */}
            {selectedType === "phone" && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">เบอร์โทรศัพท์</label>
                <input
                  type="text"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="0812345678"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>
            )}

            {/* 7. SMS */}
            {selectedType === "sms" && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">เบอร์ปลายทาง</label>
                  <input
                    type="text"
                    value={smsPhone}
                    onChange={(e) => setSmsPhone(e.target.value)}
                    placeholder="0812345678"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ข้อความ SMS</label>
                  <input
                    type="text"
                    value={smsMessage}
                    onChange={(e) => setSmsMessage(e.target.value)}
                    placeholder="ข้อความสำเร็จรูป"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>
              </div>
            )}

            {/* 8. WhatsApp */}
            {selectedType === "whatsapp" && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">เบอร์ WhatsApp (พร้อมรหัสประเทศ เช่น 66812345678)</label>
                <input
                  type="text"
                  value={waPhone}
                  onChange={(e) => setWaPhone(e.target.value)}
                  placeholder="66812345678"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>
            )}

            {/* 9. Email */}
            {selectedType === "email" && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">อีเมลปลายทาง</label>
                  <input
                    type="email"
                    value={emailTo}
                    onChange={(e) => setEmailTo(e.target.value)}
                    placeholder="contact@example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">หัวข้ออีเมล</label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="สอบถามข้อมูลเพิ่มเติม"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>
              </div>
            )}

            {/* อัปโหลดโลโก้ */}
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-xs font-semibold text-slate-700 mb-1">โลโก้กลาง QR (ไม่บังคับ)</label>
              <div className="flex items-center gap-2">
                <label className="flex-1 border border-slate-200 hover:bg-slate-50 px-3 py-2 rounded-xl text-xs font-medium text-slate-600 cursor-pointer flex items-center justify-between transition">
                  <span className="flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5 text-slate-400" />
                    {logoUrl ? "เปลี่ยนโลโก้" : "เลือกไฟล์รูปภาพ"}
                  </span>
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                </label>
                {logoUrl && (
                  <button onClick={() => setLogoUrl(null)} className="text-xs text-amber-600 font-semibold hover:underline">
                    ลบ
                  </button>
                )}
              </div>
            </div>

          </div>

          {/* พรีวิว QR Code (ฝั่งขวา) */}
          <div className="lg:col-span-3 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col items-center">
            <h2 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3 w-full text-center mb-4">
              ตัวอย่าง QR ของคุณ
            </h2>

            <div className="w-full bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm mb-4">
              {selectedType === "promptpay" && (
                <div className="bg-[#0F3866] text-white py-2 text-center text-xs font-bold tracking-wide">
                  สแกนจ่ายด้วยพร้อมเพย์
                </div>
              )}

              <div className="p-4 flex flex-col items-center justify-center bg-white">
                <QRCodeSVG
                  id="main-qr-svg"
                  value={getQRValue()}
                  size={170}
                  level="H"
                  imageSettings={
                    logoUrl
                      ? {
                          src: logoUrl,
                          x: undefined,
                          y: undefined,
                          height: 36,
                          width: 36,
                          excavate: true,
                        }
                      : undefined
                  }
                />

                {selectedType === "promptpay" ? (
                  <>
                    <p className="font-bold text-slate-800 text-sm mt-3">{receiverName || "ชื่อผู้รับเงิน"}</p>
                    {amount ? (
                      <p className="font-extrabold text-amber-600 text-lg">{parseFloat(amount).toFixed(2)} บาท</p>
                    ) : (
                      <p className="text-[11px] text-slate-400 mt-0.5">ลูกค้ากรอกยอดเอง</p>
                    )}
                  </>
                ) : (
                  qrTitle && <p className="font-bold text-slate-800 text-xs mt-3 text-center">{qrTitle}</p>
                )}
              </div>
            </div>

            <button
              onClick={downloadQRCode}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 px-4 rounded-xl transition flex items-center justify-center gap-2 shadow-sm text-xs"
            >
              <Download className="w-4 h-4" /> ดาวน์โหลด PNG
            </button>
          </div>

        </div>

        {/* ----------------- ส่วนแนะนำการใช้งานด้านล่าง (ธีม ขาว-ส้ม) ----------------- */}
        <div className="mt-16 space-y-12 pb-12 border-t border-slate-200 pt-12">
          
          {/* สเตปวิธีใช้งาน */}
          <div className="space-y-6">
            <div className="text-center max-w-xl mx-auto space-y-2">
              <span className="bg-amber-50 text-amber-600 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
                Easy Steps
              </span>
              <h2 className="text-2xl font-bold text-slate-800">
                สร้าง QR Code ใช้งานได้ทันทีใน 3 ขั้นตอน
              </h2>
              <p className="text-sm text-slate-500">
                ไม่ต้องลงโปรแกรม ไม่ต้องมีความรู้เชิงเทคนิค รองรับทั้งมือถือ แท็บเล็ต และคอมพิวเตอร์
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative space-y-3 hover:border-amber-200 transition">
                <div className="w-10 h-10 bg-amber-500 text-white font-bold rounded-xl flex items-center justify-center text-base shadow-sm shadow-amber-500/30">
                  1
                </div>
                <h3 className="text-lg font-bold text-slate-800">เลือกประเภทที่ต้องการ</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  เลือกรูปแบบข้อมูล เช่น ลิงก์เว็บไซต์ (URL), ข้อความ, พร้อมเพย์, WiFi หรือช่องทางโซเชียลมีเดีย
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative space-y-3 hover:border-amber-200 transition">
                <div className="w-10 h-10 bg-amber-500 text-white font-bold rounded-xl flex items-center justify-center text-base shadow-sm shadow-amber-500/30">
                  2
                </div>
                <h3 className="text-lg font-bold text-slate-800">ใส่ข้อมูลให้ครบถ้วน</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  กรอกรายละเอียดปลายทางที่ต้องการให้ลูกค้าหรือผู้สแกนเข้าถึงหลังจากส่องคิวอาร์โค้ด
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative space-y-3 hover:border-amber-200 transition">
                <div className="w-10 h-10 bg-amber-500 text-white font-bold rounded-xl flex items-center justify-center text-base shadow-sm shadow-amber-500/30">
                  3
                </div>
                <h3 className="text-lg font-bold text-slate-800">กดสร้างและดาวน์โหลด</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  ระบบประมวลผลและสร้าง QR Code คมชัดสูง พร้อมให้คุณดาวน์โหลดเป็นไฟล์ PNG ไปใช้งานได้ทันที
                </p>
              </div>
            </div>
          </div>

          {/* ธุรกิจที่นำไปใช้ได้ */}
          <div className="space-y-6">
            <div className="text-center max-w-xl mx-auto space-y-2">
              <span className="bg-orange-50 text-orange-600 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
                Use Cases
              </span>
              <h2 className="text-2xl font-bold text-slate-800">
                ยกระดับธุรกิจและไลฟ์สไตล์ด้วย QR Code
              </h2>
              <p className="text-sm text-slate-500">
                เชื่อมต่อโลกออฟไลน์สู่ออนไลน์ ช่วยให้ลูกค้าเข้าถึงร้านค้าของคุณได้ในเสี้ยววินาที
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-2">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-3">
                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
                  <Store className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-800">ร้านอาหาร & คาเฟ่</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  ทำเมนูอาหารออนไลน์ ป้ายสแกนโต๊ะ พร้อมเพย์รับเงิน รีวิวร้าน หรือโปรโมชันพิเศษหน้าร้าน
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-3">
                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-800">พ่อค้าแม่ค้าออนไลน์</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  แปะบนกล่องพัสดุ พาลูกค้าไปหน้าเพจ Shopee, Lazada หรือทักแชท LINE OA สะดวกสุดๆ
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-3">
                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-800">นามบัตรดิจิทัล</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  รวมช่องทางติดต่อ เบอร์โทร เว็บไซต์ และโซเชียลทั้งหมดไว้ในคิวอาร์โค้ดเดียวจบ
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-3">
                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
                  <Calendar className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-800">อีเวนต์ & เวิร์กช็อป</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  ใช้ลงทะเบียนหน้างาน เช็กอิน หรือทำแบบประเมินความพึงพอใจสะดวกรวดเร็ว
                </p>
              </div>
            </div>
          </div>

          {/* กล่องสรุปไฮไลต์ */}
          <div className="bg-gradient-to-br from-amber-500 to-orange-500 text-white p-8 rounded-2xl shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-amber-100 text-sm font-semibold uppercase tracking-wider">
              <Sparkles className="w-4 h-4" /> ทำไมต้องใช้เครื่องมือนี้
            </div>
            <h2 className="text-xl sm:text-2xl font-bold">
              เครื่องมือสร้าง QR Code ฟรี สะดวก ปลอดภัย และใช้งานได้ตลอดชีพ
            </h2>
            <p className="text-amber-50 text-sm sm:text-base leading-relaxed max-w-3xl">
              ChefAir Kit ออกแบบระบบสร้าง QR Code มาเพื่อให้ผู้ประกอบการและนักธุรกิจยุคใหม่ใช้งานได้ฟรี ไม่มีค่าใช้จ่าย ช่วยตัดขั้นตอนที่ยุ่งยาก เปลี่ยนลิงก์ยาวๆ ให้เป็นคิวอาร์โค้ดสวยๆ พร้อมนำไปปริ้นหรือแชร์ใช้งานได้ทันที
            </p>
          </div>

        </div>

      </main>
    </div>
  );
}