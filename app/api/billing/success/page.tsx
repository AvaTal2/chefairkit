import { redirect } from "next/navigation";

export default function BillingSuccessPage() {
  // ChefWorkKit Free Edition
  // ไม่มีระบบชำระเงินหรืออัปเกรดสมาชิกแล้ว
  // หากเปิดลิงก์เก่า ให้กลับไปหน้าหลัก

  redirect("/");
}