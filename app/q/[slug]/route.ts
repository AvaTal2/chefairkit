import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHash } from "crypto";

export const dynamic = "force-dynamic";

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function getClientIp(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "";
  }

  return request.headers.get("x-real-ip") || "";
}

function hashIp(ip: string) {
  if (!ip) return null;

  const salt =
    process.env.QR_ANALYTICS_SALT ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "chefair-kit";

  return createHash("sha256")
    .update(`${salt}:${ip}`)
    .digest("hex");
}

function detectDevice(userAgent: string) {
  const ua = userAgent.toLowerCase();

  if (/ipad|tablet|playbook|silk/.test(ua)) {
    return "tablet";
  }

  if (
    /mobile|iphone|ipod|android.*mobile|windows phone/.test(ua)
  ) {
    return "mobile";
  }

  return "desktop";
}

function detectBrowser(userAgent: string) {
  const ua = userAgent.toLowerCase();

  if (ua.includes("edg/")) return "Edge";
  if (ua.includes("opr/") || ua.includes("opera")) return "Opera";
  if (ua.includes("firefox/")) return "Firefox";
  if (ua.includes("chrome/") || ua.includes("crios/")) return "Chrome";
  if (ua.includes("safari/")) return "Safari";

  return "Other";
}

function detectOS(userAgent: string) {
  const ua = userAgent.toLowerCase();

  if (/iphone|ipad|ipod/.test(ua)) return "iOS";
  if (ua.includes("android")) return "Android";
  if (ua.includes("windows")) return "Windows";
  if (ua.includes("mac os") || ua.includes("macintosh")) return "macOS";
  if (ua.includes("linux")) return "Linux";

  return "Other";
}

function normalizeDestinationUrl(destination: string) {
  const trimmed = destination.trim();

  if (!trimmed) {
    return null;
  }

  try {
    const url = new URL(trimmed);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
}

export async function GET(
  request: NextRequest,
  context: {
    params: Promise<{
      slug: string;
    }>;
  }
) {
  try {
    const { slug } = await context.params;

    if (!slug) {
      return new NextResponse("QR not found", {
        status: 404,
      });
    }

    const supabase = getSupabaseAdmin();

    const { data: qr, error: qrError } = await supabase
      .from("dynamic_qrs")
      .select("id, destination_url, is_active")
      .eq("slug", slug)
      .maybeSingle();

    if (qrError) {
      console.error("Dynamic QR lookup error:", qrError);

      return new NextResponse("Unable to open QR", {
        status: 500,
      });
    }

    if (!qr) {
      return new NextResponse("QR not found", {
        status: 404,
      });
    }

    if (!qr.is_active) {
      return new NextResponse("This QR Code is currently inactive.", {
        status: 410,
      });
    }

    const destinationUrl = normalizeDestinationUrl(
      qr.destination_url
    );

    if (!destinationUrl) {
      return new NextResponse("Invalid QR destination.", {
        status: 500,
      });
    }

    const userAgent =
      request.headers.get("user-agent") || "";

    const referrer =
      request.headers.get("referer") || null;

    const clientIp = getClientIp(request);

    const ipHash = hashIp(clientIp);

    /*
      ไม่ให้การบันทึก Analytics ขัดขวางการ Redirect

      ต่อให้ insert scan ไม่สำเร็จ
      ลูกค้าก็ยังต้องเปิดลิงก์ปลายทางได้
    */
    try {
      const { error: scanError } = await supabase
        .from("qr_scans")
        .insert({
          qr_id: qr.id,
          user_agent: userAgent || null,
          referrer,
          ip_hash: ipHash,
          device_type: detectDevice(userAgent),
          browser: detectBrowser(userAgent),
          os: detectOS(userAgent),
        });

      if (scanError) {
        console.error(
          "Dynamic QR analytics insert error:",
          scanError
        );
      }
    } catch (analyticsError) {
      console.error(
        "Dynamic QR analytics unexpected error:",
        analyticsError
      );
    }

    return NextResponse.redirect(destinationUrl, {
      status: 307,
    });
  } catch (error) {
    console.error("Dynamic QR redirect error:", error);

    return new NextResponse("Unable to open QR", {
      status: 500,
    });
  }
}