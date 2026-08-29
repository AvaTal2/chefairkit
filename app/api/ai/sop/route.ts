import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import {
  getPermissionsForUser,
} from "@/lib/subscription/server";

function getSupabaseAdmin() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (
    !supabaseUrl ||
    !serviceRoleKey
  ) {
    throw new Error(
      "Missing Supabase server environment variables"
    );
  }

  return createClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}

function getBangkokMonthRange() {
  const now = new Date();

  const bangkokNow =
    new Date(
      now.getTime() +
        7 * 60 * 60 * 1000
    );

  const year =
    bangkokNow.getUTCFullYear();

  const month =
    bangkokNow.getUTCMonth();

  const start =
    new Date(
      Date.UTC(
        year,
        month,
        1,
        -7,
        0,
        0,
        0
      )
    );

  const end =
    new Date(
      Date.UTC(
        year,
        month + 1,
        1,
        -7,
        0,
        0,
        0
      )
    );

  return {
    start:
      start.toISOString(),

    end:
      end.toISOString(),
  };
}

type IngredientInput = {
  name: string;
  quantity: number;
  unit: string;
};

type ExistingStepInput = {
  title?: string;
  instruction?: string | null;
  duration_minutes?: number | null;
  temperature_c?: number | null;
  qc_target?: string | null;
  qc_warning?: string | null;
};

type SopRequestBody = {
  recipe: {
    name: string;
    category?: string | null;
    yield_amount?: number | null;
    yield_unit?: string | null;
    servings?: number | null;
    notes?: string | null;
  };

  ingredients: IngredientInput[];

  existing?: {
    product_description?: string | null;
    equipment?: string | null;
    preparation?: string | null;
    critical_points?: string | null;
    quality_control?: string | null;
    packing_storage?: string | null;
    sanitation?: string | null;
    responsibilities?: string | null;
    notes?: string | null;
    steps?: ExistingStepInput[];
  };
};

const sopSchema = {
  type: "object",
  additionalProperties: false,

  properties: {
    product_description: {
      type: "string",
    },

    equipment: {
      type: "string",
    },

    preparation: {
      type: "string",
    },

    critical_points: {
      type: "string",
    },

    quality_control: {
      type: "string",
    },

    packing_storage: {
      type: "string",
    },

    sanitation: {
      type: "string",
    },

    responsibilities: {
      type: "string",
    },

    notes: {
      type: "string",
    },

    steps: {
      type: "array",

      items: {
        type: "object",
        additionalProperties: false,

        properties: {
          title: {
            type: "string",
          },

          instruction: {
            type: "string",
          },

          duration_minutes: {
            type: ["number", "null"],
          },

          temperature_c: {
            type: ["number", "null"],
          },

          qc_target: {
            type: "string",
          },

          qc_warning: {
            type: "string",
          },
        },

        required: [
          "title",
          "instruction",
          "duration_minutes",
          "temperature_c",
          "qc_target",
          "qc_warning",
        ],
      },
    },
  },

  required: [
    "product_description",
    "equipment",
    "preparation",
    "critical_points",
    "quality_control",
    "packing_storage",
    "sanitation",
    "responsibilities",
    "notes",
    "steps",
  ],
};

export async function POST(
  request: Request
) {
  try {
    const apiKey =
      process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "ยังไม่ได้ตั้งค่า OPENAI_API_KEY",
        },
        {
          status: 500,
        }
      );
    }

    const authHeader =
      request.headers.get(
        "authorization"
      );

    const accessToken =
      authHeader?.startsWith(
        "Bearer "
      )
        ? authHeader.slice(7)
        : null;

    if (!accessToken) {
      return NextResponse.json(
        {
          error:
            "กรุณาเข้าสู่ระบบก่อนใช้ AI",
        },
        {
          status: 401,
        }
      );
    }

    const supabaseAdmin =
      getSupabaseAdmin();

    const {
      data: userData,
      error: userError,
    } =
      await supabaseAdmin.auth.getUser(
        accessToken
      );

    if (
      userError ||
      !userData.user
    ) {
      return NextResponse.json(
        {
          error:
            "Session ไม่ถูกต้อง กรุณาเข้าสู่ระบบใหม่",
        },
        {
          status: 401,
        }
      );
    }

    const user =
      userData.user;

    const permissions =
      await getPermissionsForUser(
        user.id
      );

    const monthlyLimit =
      permissions.aiSopMonthlyLimit;

    if (
      monthlyLimit ===
      0
    ) {
      return NextResponse.json(
        {
          error:
            "แพ็กเกจของคุณยังไม่รองรับ AI SOP",
        },
        {
          status: 403,
        }
      );
    }

    const {
      start:
        monthStart,
      end:
        monthEnd,
    } =
      getBangkokMonthRange();

    const {
      data:
        usageRows,
      error:
        usageError,
    } =
      await supabaseAdmin
        .from(
          "ai_usage"
        )
        .select(
          "usage_count"
        )
        .eq(
          "user_id",
          user.id
        )
        .eq(
          "feature",
          "ai_sop"
        )
        .gte(
          "created_at",
          monthStart
        )
        .lt(
          "created_at",
          monthEnd
        );

    if (usageError) {
      console.error(
        "AI SOP Usage Lookup Error:",
        usageError
      );

      return NextResponse.json(
        {
          error:
            "ไม่สามารถตรวจสอบโควตา AI ได้",
        },
        {
          status: 500,
        }
      );
    }

    const usedThisMonth =
      (usageRows || [])
        .reduce(
          (
            total,
            row
          ) =>
            total +
            Number(
              row.usage_count ||
                0
            ),
          0
        );

    if (
      monthlyLimit !==
        null &&
      usedThisMonth >=
        monthlyLimit
    ) {
      return NextResponse.json(
        {
          error:
            `โควตา AI SOP เดือนนี้ครบแล้ว (${usedThisMonth}/${monthlyLimit} ครั้ง)`,
          code:
            "AI_LIMIT_REACHED",
          usage: {
            used:
              usedThisMonth,
            limit:
              monthlyLimit,
          },
        },
        {
          status: 429,
        }
      );
    }

    const body =
      (await request.json()) as SopRequestBody;

    if (!body?.recipe?.name) {
      return NextResponse.json(
        {
          error:
            "ไม่พบชื่อสูตร",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !Array.isArray(
        body.ingredients
      )
    ) {
      return NextResponse.json(
        {
          error:
            "ข้อมูลวัตถุดิบไม่ถูกต้อง",
        },
        {
          status: 400,
        }
      );
    }

    const ingredientText =
      body.ingredients.length > 0
        ? body.ingredients
            .map(
              (
                item,
                index
              ) =>
                `${index + 1}. ${item.name} ${item.quantity} ${item.unit}`
            )
            .join("\n")
        : "ไม่มีข้อมูลวัตถุดิบ";

    const existingText =
      body.existing
        ? JSON.stringify(
            body.existing,
            null,
            2
          )
        : "ไม่มี SOP เดิม";

    const prompt = `
คุณคือผู้ช่วยจัดทำ Standard Operating Procedure (SOP)
สำหรับครัว ร้านอาหาร ธุรกิจอาหาร และการผลิตอาหารระดับ SME

หน้าที่ของคุณคือช่วย "ร่าง" SOP จากข้อมูลสูตรที่ผู้ใช้ให้
เพื่อให้เชฟหรือเจ้าของธุรกิจนำไปตรวจ แก้ไข และอนุมัติภายหลัง

ห้ามถือว่าร่างของคุณเป็นการรับรองด้าน food safety
ห้ามสร้างข้อกำหนดทางกฎหมายหรือมาตรฐานรับรองที่ผู้ใช้ไม่ได้ให้มา

==================================================
ข้อมูลสูตร
==================================================

ชื่อสูตร:
${body.recipe.name}

หมวดหมู่:
${body.recipe.category || "-"}

Yield:
${body.recipe.yield_amount ?? "-"} ${body.recipe.yield_unit || ""}

จำนวนเสิร์ฟ / ชิ้น:
${body.recipe.servings ?? "-"}

หมายเหตุสูตร:
${body.recipe.notes || "-"}

วัตถุดิบ:
${ingredientText}

==================================================
ข้อมูล SOP เดิม ถ้ามี
==================================================

${existingText}

==================================================
หลักการสำคัญ
==================================================

1. เขียนภาษาไทยที่อ่านง่าย กระชับ และเหมาะกับพนักงานครัว

2. ขั้นตอนต้องอยู่ในลำดับการทำงานที่สมเหตุสมผล

3. อย่าสร้างวัตถุดิบหลักใหม่ที่ไม่มีในสูตร
   ยกเว้นน้ำ น้ำแข็ง หรืออุปกรณ์ประกอบกระบวนการที่จำเป็นจริง ๆ
   และต้องไม่เปลี่ยนสูตรอาหาร

4. ห้ามเดาตัวเลขด้านความปลอดภัยอาหาร

ตัวอย่างข้อมูลที่ห้ามเดา:
- อุณหภูมิพาสเจอไรซ์
- อุณหภูมิฆ่าเชื้อ
- อุณหภูมิแกนกลาง
- อายุสินค้า
- shelf life
- เวลาปลอดภัยในการเก็บ
- ค่า pH
- Aw
- CCP limit

ถ้าข้อมูลเหล่านี้ไม่ได้ระบุจากผู้ใช้:
ให้ duration_minutes หรือ temperature_c เป็น null

ถ้าจำเป็นต้องพูดถึงในข้อความ ให้ระบุว่า:
"ควรกำหนดตามมาตรฐานของผลิตภัณฑ์และกระบวนการที่ผ่านการตรวจสอบ"

5. เวลาและอุณหภูมิที่เป็นเรื่องคุณภาพการทำอาหารทั่วไป
ก็อย่าคิดขึ้นเองถ้าไม่มีข้อมูลจากผู้ใช้
ให้เป็น null ดีกว่า

6. QC Target ให้เน้นลักษณะที่สังเกตได้จริง เช่น:
- สี
- กลิ่น
- ความข้น
- ความละเอียด
- ความสม่ำเสมอ
- ลักษณะเนื้อสัมผัส
- การแยกชั้น
- สภาพบรรจุภัณฑ์

7. QC Warning ให้ระบุสิ่งผิดปกติที่พนักงานตรวจพบได้

8. packing_storage:
ถ้าไม่มีข้อมูลอายุหรืออุณหภูมิการเก็บ
อย่าสร้างตัวเลขขึ้นเอง

9. sanitation:
ให้เป็นหลักสุขลักษณะทั่วไปเท่านั้น
ห้ามอ้างว่าผ่านมาตรฐาน HACCP/GMP/ISO
ถ้าผู้ใช้ไม่ได้ระบุ

10. responsibilities:
เขียนเป็นหน้าที่ตามบทบาททั่วไป เช่น
ผู้เตรียม ผู้ผลิต ผู้ตรวจ QC ผู้อนุมัติ
ไม่สร้างชื่อบุคคลขึ้นเอง

11. ถ้ามีข้อมูล SOP เดิม:
ใช้เป็นบริบทช่วยปรับปรุง
แต่ไม่ต้องคัดลอกทุกคำ

12. จำนวน Step:
สร้างเท่าที่จำเป็นจริง ๆ
โดยทั่วไปประมาณ 3-10 ขั้นตอน
ไม่ต้องแตกยิบย่อยเกินไป

==================================================
ผลลัพธ์
==================================================

สร้างร่าง SOP ที่สามารถนำไป Preview
ก่อนผู้ใช้เลือกนำไปใส่ในระบบ
`;

    const response =
      await fetch(
        "https://api.openai.com/v1/responses",
        {
          method: "POST",

          headers: {
            Authorization:
              `Bearer ${apiKey}`,

            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            model:
              "gpt-5.6-luna",

            store: false,

            reasoning: {
              effort: "low",
            },

            input: [
              {
                role:
                  "developer",

                content: [
                  {
                    type:
                      "input_text",

                    text:
                      "คุณช่วยสร้างร่าง SOP สำหรับธุรกิจอาหาร โดยต้องรักษาข้อมูลสูตรเดิม ไม่เดาตัวเลขด้าน food safety และคืนผลลัพธ์ตาม JSON schema เท่านั้น",
                  },
                ],
              },

              {
                role:
                  "user",

                content: [
                  {
                    type:
                      "input_text",

                    text:
                      prompt,
                  },
                ],
              },
            ],

            text: {
              format: {
                type:
                  "json_schema",

                name:
                  "sop_draft",

                strict:
                  true,

                schema:
                  sopSchema,
              },
            },
          }),
        }
      );

    let result: any;

    try {
      result =
        await response.json();
    } catch {
      const rawText =
        await response.text();

      console.error(
        "OpenAI SOP Invalid Response:",
        rawText
      );

      return NextResponse.json(
        {
          error:
            "ไม่สามารถอ่านผลตอบกลับจาก AI ได้",
        },
        {
          status: 500,
        }
      );
    }

    if (!response.ok) {
      console.error(
        "OpenAI SOP Error:",
        JSON.stringify(
          result,
          null,
          2
        )
      );

      return NextResponse.json(
        {
          error:
            result?.error?.message ||
            "AI สร้าง SOP ไม่สำเร็จ",
        },
        {
          status:
            response.status,
        }
      );
    }

    /*
     * Responses API แบบ REST
     * ข้อความอาจอยู่ใน:
     *
     * result.output_text
     *
     * หรือ
     *
     * result.output[].content[].text
     */

    let outputText:
      string | null =
      null;

    if (
      typeof result?.output_text ===
        "string" &&
      result.output_text.trim()
    ) {
      outputText =
        result.output_text;
    }

    if (
      !outputText &&
      Array.isArray(
        result?.output
      )
    ) {
      for (
        const outputItem of
        result.output
      ) {
        if (
          !Array.isArray(
            outputItem?.content
          )
        ) {
          continue;
        }

        for (
          const contentItem of
          outputItem.content
        ) {
          if (
            contentItem?.type ===
              "output_text" &&
            typeof contentItem?.text ===
              "string" &&
            contentItem.text.trim()
          ) {
            outputText =
              contentItem.text;

            break;
          }
        }

        if (outputText) {
          break;
        }
      }
    }

    if (!outputText) {
      console.error(
        "OpenAI SOP Empty Output:",
        JSON.stringify(
          result,
          null,
          2
        )
      );

      return NextResponse.json(
        {
          error:
            "AI ไม่ได้ส่งข้อมูล SOP กลับมา",
        },
        {
          status: 500,
        }
      );
    }

    let draft;

    try {
      draft =
        JSON.parse(
          outputText
        );
    } catch {
      console.error(
        "OpenAI SOP JSON Parse Error:",
        outputText
      );

      return NextResponse.json(
        {
          error:
            "ไม่สามารถอ่านผลลัพธ์ SOP จาก AI ได้",
        },
        {
          status: 500,
        }
      );
    }

    const {
      error:
        usageInsertError,
    } =
      await supabaseAdmin
        .from(
          "ai_usage"
        )
        .insert({
          user_id:
            user.id,

          feature:
            "ai_sop",

          usage_count:
            1,
        });

    if (
      usageInsertError
    ) {
      console.error(
        "AI SOP Usage Insert Error:",
        usageInsertError
      );
    }

    const usageAfter =
      usedThisMonth + 1;

    return NextResponse.json({
      draft,

      usage: {
        used:
          usageAfter,

        limit:
          monthlyLimit,

        remaining:
          monthlyLimit ===
          null
            ? null
            : Math.max(
                monthlyLimit -
                  usageAfter,
                0
              ),
      },
    });
  } catch (error) {
    console.error(
      "AI SOP Route Error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "เกิดข้อผิดพลาดระหว่างสร้าง SOP",
      },
      {
        status: 500,
      }
    );
  }
}