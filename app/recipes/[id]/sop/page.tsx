"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useParams,
  useRouter,
} from "next/navigation";

import {
  ArrowLeft,
  BookOpenCheck,
  Save,
  ChefHat,
  Wrench,
  AlertTriangle,
  BadgeCheck,
  Package,
  ShieldCheck,
  Users,
  StickyNote,
  Plus,
  Trash2,
  ImagePlus,
  Clock3,
  Thermometer,
  GripVertical,
  Loader2,
  X,
  MonitorPlay,
  Printer,
  FileCheck2,
  FilePenLine,
  History,
  CircleHelp,
} from "lucide-react";

import { supabase } from "@/lib/supabase/client";

type Recipe = {
  id: string;
  user_id: string;
  name: string;
  category: string | null;
  yield_amount: number | null;
  yield_unit: string | null;
  servings: number | null;
  notes: string | null;
};

type RecipeIngredient = {
  id: string;
  ingredient_name: string;
  quantity: number;
  unit: string;
};

type RecipeSop = {
  id: string;
  user_id: string;
  recipe_id: string;

  title: string;

  product_description: string | null;
  equipment: string | null;
  preparation: string | null;

  critical_points: string | null;
  quality_control: string | null;
  packing_storage: string | null;
  sanitation: string | null;
  responsibilities: string | null;
  notes: string | null;

  version: string | null;
  approved_by: string | null;
  approved_at: string | null;

  created_at: string;
  updated_at: string;
};

type SopStep = {
  id: string;
  user_id: string;
  sop_id: string;

  step_order: number;

  title: string;
  instruction: string | null;

  duration_minutes: number | null;
  temperature_c: number | null;

  qc_target: string | null;
  qc_warning: string | null;

  image_url: string | null;
  image_path: string | null;

  created_at: string;
  updated_at: string;

  signedImageUrl?: string | null;
};

const formatNumber = (value: number) => {
  if (!Number.isFinite(value)) {
    return "-";
  }

  return new Intl.NumberFormat("th-TH", {
    maximumFractionDigits: 3,
  }).format(value);
};

const toInputDate = (
  value: string | null
) => {
  if (!value) {
    return "";
  }

  return value.slice(0, 10);
};

export default function RecipeSopPage() {
  const params = useParams();
  const router = useRouter();

  const recipeId = params.id as string;

  const [
    recipe,
    setRecipe,
  ] = useState<Recipe | null>(null);

  const [
    ingredients,
    setIngredients,
  ] = useState<RecipeIngredient[]>([]);

  const [
    sopId,
    setSopId,
  ] = useState<string | null>(null);

  const [
    steps,
    setSteps,
  ] = useState<SopStep[]>([]);

  const [
    title,
    setTitle,
  ] = useState("");

  const [
    productDescription,
    setProductDescription,
  ] = useState("");

  const [
    equipment,
    setEquipment,
  ] = useState("");

  const [
    preparation,
    setPreparation,
  ] = useState("");

  const [
    criticalPoints,
    setCriticalPoints,
  ] = useState("");

  const [
    qualityControl,
    setQualityControl,
  ] = useState("");

  const [
    packingStorage,
    setPackingStorage,
  ] = useState("");

  const [
    sanitation,
    setSanitation,
  ] = useState("");

  const [
    responsibilities,
    setResponsibilities,
  ] = useState("");

  const [
    notes,
    setNotes,
  ] = useState("");

  const [
    version,
    setVersion,
  ] = useState("1.0");

  const [
    approvedBy,
    setApprovedBy,
  ] = useState("");

  const [
    approvedAt,
    setApprovedAt,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    addingStep,
    setAddingStep,
  ] = useState(false);

  const [
    savingStepId,
    setSavingStepId,
  ] = useState<string | null>(null);

  const [
    uploadingStepId,
    setUploadingStepId,
  ] = useState<string | null>(null);

  const [
    deletingStepId,
    setDeletingStepId,
  ] = useState<string | null>(null);

  const [
    message,
    setMessage,
  ] = useState("");

  /*
   * SUCCESS STATES
   */

  const [
    sopSaved,
    setSopSaved,
  ] = useState(false);

  const [
    savedStepId,
    setSavedStepId,
  ] = useState<string | null>(null);

  const [
    imageSavedStepId,
    setImageSavedStepId,
  ] = useState<string | null>(null);

  /*
   * APPROVAL STATES
   */

  const [
    approving,
    setApproving,
  ] = useState(false);

  const [
    approvalMessage,
    setApprovalMessage,
  ] = useState("");

  useEffect(() => {
    if (recipeId) {
      loadData();
    }
  }, [recipeId]);

  const showSopSaved = () => {
    setSopSaved(true);

    window.setTimeout(() => {
      setSopSaved(false);
    }, 3000);
  };

  const showStepSaved = (
    stepId: string
  ) => {
    setSavedStepId(stepId);

    window.setTimeout(() => {
      setSavedStepId(
        (current) =>
          current === stepId
            ? null
            : current
      );
    }, 3000);
  };

  const showImageSaved = (
    stepId: string
  ) => {
    setImageSavedStepId(
      stepId
    );

    window.setTimeout(() => {
      setImageSavedStepId(
        (current) =>
          current === stepId
            ? null
            : current
      );
    }, 3000);
  };

  const isApproved =
    Boolean(approvedAt);

  const showApprovalMessage = (
    value: string
  ) => {
    setApprovalMessage(
      value
    );

    window.setTimeout(() => {
      setApprovalMessage("");
    }, 4000);
  };

  const markSopAsDraft =
    async (
      currentSopId?: string | null
    ) => {
      const targetSopId =
        currentSopId ||
        sopId;

      if (
        !targetSopId ||
        !approvedAt
      ) {
        return;
      }

      const {
        data: { user },
      } =
        await supabase.auth.getUser();

      if (!user) {
        return;
      }

      const {
        error,
      } =
        await supabase
          .from(
            "recipe_sops"
          )
          .update({
            approved_at:
              null,

            updated_at:
              new Date().toISOString(),
          })
          .eq(
            "id",
            targetSopId
          )
          .eq(
            "user_id",
            user.id
          );

      if (error) {
        console.error(
          "ยกเลิกสถานะอนุมัติไม่สำเร็จ:",
          error
        );

        return;
      }

      setApprovedAt("");

      showApprovalMessage(
        "มีการแก้ไข SOP หลังอนุมัติ สถานะถูกเปลี่ยนกลับเป็น Draft แล้ว"
      );
    };

  const handleApproveSop =
    async () => {
      if (!recipe) {
        return;
      }

      if (
        !approvedBy.trim()
      ) {
        setMessage(
          "กรุณากรอกชื่อผู้อนุมัติก่อน"
        );

        return;
      }

      const cleanVersion =
        version.trim() ||
        "1.0";

      setApproving(true);
      setMessage("");
      setApprovalMessage("");

      const {
        data: { user },
      } =
        await supabase.auth.getUser();

      if (!user) {
        setApproving(false);
        router.push("/login");
        return;
      }

      const currentSopId =
        await ensureSopExists();

      if (!currentSopId) {
        setApproving(false);
        return;
      }

      /*
       * Version ที่เคย Approved แล้วห้ามใช้ซ้ำ
       * เพื่อให้ประวัติเอกสารชัดเจน
       */
      const {
        data:
          existingVersion,
        error:
          existingVersionError,
      } =
        await supabase
          .from(
            "recipe_sop_versions"
          )
          .select("id")
          .eq(
            "sop_id",
            currentSopId
          )
          .eq(
            "user_id",
            user.id
          )
          .eq(
            "version",
            cleanVersion
          )
          .limit(1)
          .maybeSingle();

      if (
        existingVersionError
      ) {
        setMessage(
          "ตรวจสอบ Version ไม่สำเร็จ: " +
            existingVersionError.message
        );

        setApproving(false);
        return;
      }

      if (
        existingVersion
      ) {
        setMessage(
          `Version ${cleanVersion} เคยอนุมัติแล้ว กรุณาเปลี่ยน Version ก่อนอนุมัติใหม่`
        );

        setApproving(false);
        return;
      }

      const payload =
        buildSopPayload(
          user.id
        );

      if (!payload) {
        setMessage(
          "กรุณากรอกชื่อ SOP"
        );

        setApproving(false);
        return;
      }

      /*
       * บันทึก Step ตามข้อมูลที่อยู่บนหน้าจอก่อน Approve
       * เพื่อให้ Snapshot ตรงกับสิ่งที่ผู้ใช้กำลังเห็น
       */
      for (
        const step of steps
      ) {
        const {
          error:
            stepSaveError,
        } =
          await supabase
            .from(
              "recipe_sop_steps"
            )
            .update({
              title:
                step.title.trim(),

              instruction:
                step.instruction?.trim() ||
                null,

              duration_minutes:
                step.duration_minutes ??
                null,

              temperature_c:
                step.temperature_c ??
                null,

              qc_target:
                step.qc_target?.trim() ||
                null,

              qc_warning:
                step.qc_warning?.trim() ||
                null,

              updated_at:
                new Date().toISOString(),
            })
            .eq(
              "id",
              step.id
            )
            .eq(
              "user_id",
              user.id
            );

        if (
          stepSaveError
        ) {
          setMessage(
            `บันทึก "${step.title}" ก่อนอนุมัติไม่สำเร็จ: ` +
              stepSaveError.message
          );

          setApproving(false);
          return;
        }
      }

      const approvedDate =
        new Date().toISOString();

      /*
       * สร้าง ID ของ Version ล่วงหน้า
       * เพื่อใช้เป็นโฟลเดอร์เก็บสำเนารูปของ Snapshot
       */
      const versionSnapshotId =
        crypto.randomUUID();

      const copiedImagePaths:
        string[] = [];

      const snapshotSteps:
        Array<{
          step_order: number;
          title: string;
          instruction: string | null;
          duration_minutes: number | null;
          temperature_c: number | null;
          qc_target: string | null;
          qc_warning: string | null;
          image_path: string | null;
        }> = [];

      for (
        const step of steps
      ) {
        let snapshotImagePath:
          string | null =
          null;

        if (
          step.image_path
        ) {
          const extension =
            step.image_path
              .split(".")
              .pop() ||
            "jpg";

          snapshotImagePath =
            `${user.id}/${currentSopId}/versions/${versionSnapshotId}/${step.id}.${extension}`;

          const {
            error:
              copyImageError,
          } =
            await supabase.storage
              .from(
                "sop-images"
              )
              .copy(
                step.image_path,
                snapshotImagePath
              );

          if (
            copyImageError
          ) {
            if (
              copiedImagePaths.length >
              0
            ) {
              await supabase.storage
                .from(
                  "sop-images"
                )
                .remove(
                  copiedImagePaths
                );
            }

            setMessage(
              `สำรองรูปของ "${step.title}" สำหรับ Version History ไม่สำเร็จ: ` +
                copyImageError.message
            );

            setApproving(false);
            return;
          }

          copiedImagePaths.push(
            snapshotImagePath
          );
        }

        snapshotSteps.push({
          step_order:
            step.step_order,

          title:
            step.title.trim(),

          instruction:
            step.instruction?.trim() ||
            null,

          duration_minutes:
            step.duration_minutes ??
            null,

          temperature_c:
            step.temperature_c ??
            null,

          qc_target:
            step.qc_target?.trim() ||
            null,

          qc_warning:
            step.qc_warning?.trim() ||
            null,

          image_path:
            snapshotImagePath,
        });
      }

      /*
       * สร้าง Snapshot ก่อน
       * ถ้าสร้างไม่สำเร็จ จะยังไม่ Approved เอกสารปัจจุบัน
       */
      const {
        error:
          versionInsertError,
      } =
        await supabase
          .from(
            "recipe_sop_versions"
          )
          .insert({
            id:
              versionSnapshotId,

            user_id:
              user.id,

            recipe_id:
              recipe.id,

            sop_id:
              currentSopId,

            version:
              cleanVersion,

            title:
              title.trim(),

            product_description:
              productDescription.trim() ||
              null,

            equipment:
              equipment.trim() ||
              null,

            preparation:
              preparation.trim() ||
              null,

            critical_points:
              criticalPoints.trim() ||
              null,

            quality_control:
              qualityControl.trim() ||
              null,

            packing_storage:
              packingStorage.trim() ||
              null,

            sanitation:
              sanitation.trim() ||
              null,

            responsibilities:
              responsibilities.trim() ||
              null,

            notes:
              notes.trim() ||
              null,

            approved_by:
              approvedBy.trim(),

            approved_at:
              approvedDate,

            steps:
              snapshotSteps,
          });

      if (
        versionInsertError
      ) {
        if (
          copiedImagePaths.length >
          0
        ) {
          await supabase.storage
            .from(
              "sop-images"
            )
            .remove(
              copiedImagePaths
            );
        }

        setMessage(
          "สร้าง Version History ไม่สำเร็จ: " +
            versionInsertError.message
        );

        setApproving(false);
        return;
      }

      const {
        error:
          approveError,
      } =
        await supabase
          .from(
            "recipe_sops"
          )
          .update({
            ...payload,

            version:
              cleanVersion,

            approved_by:
              approvedBy.trim(),

            approved_at:
              approvedDate,

            updated_at:
              approvedDate,
          })
          .eq(
            "id",
            currentSopId
          )
          .eq(
            "user_id",
            user.id
          );

      if (
        approveError
      ) {
        await supabase
          .from(
            "recipe_sop_versions"
          )
          .delete()
          .eq(
            "id",
            versionSnapshotId
          )
          .eq(
            "user_id",
            user.id
          );

        if (
          copiedImagePaths.length >
          0
        ) {
          await supabase.storage
            .from(
              "sop-images"
            )
            .remove(
              copiedImagePaths
            );
        }

        setMessage(
          "อนุมัติ SOP ไม่สำเร็จ: " +
            approveError.message
        );

        setApproving(false);
        return;
      }

      setApprovedAt(
        toInputDate(
          approvedDate
        )
      );

      setVersion(
        cleanVersion
      );

      setApproving(false);

      showApprovalMessage(
        `✓ SOP Version ${cleanVersion} ได้รับการอนุมัติและบันทึกในประวัติแล้ว`
      );
    };

  const loadData = async () => {
    setLoading(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      sessionStorage.setItem(
        "chefair_after_login_redirect",
        `/recipes/${recipeId}/sop`
      );

      router.push("/login");
      return;
    }

    const {
      data: recipeData,
      error: recipeError,
    } = await supabase
      .from("recipes")
      .select(
        `
        id,
        user_id,
        name,
        category,
        yield_amount,
        yield_unit,
        servings,
        notes
        `
      )
      .eq("id", recipeId)
      .eq("user_id", user.id)
      .single();

    if (
      recipeError ||
      !recipeData
    ) {
      setMessage(
        "ไม่พบสูตร หรือคุณไม่มีสิทธิ์เข้าถึงสูตรนี้"
      );

      setLoading(false);
      return;
    }

    const {
      data: ingredientData,
      error: ingredientError,
    } = await supabase
      .from("recipe_ingredients")
      .select(
        `
        id,
        ingredient_name,
        quantity,
        unit
        `
      )
      .eq("recipe_id", recipeId)
      .order("created_at", {
        ascending: true,
      });

    if (ingredientError) {
      setMessage(
        "โหลดวัตถุดิบไม่สำเร็จ: " +
          ingredientError.message
      );

      setLoading(false);
      return;
    }

    const {
      data: sopData,
      error: sopError,
    } = await supabase
      .from("recipe_sops")
      .select("*")
      .eq("recipe_id", recipeId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (sopError) {
      setMessage(
        "โหลด SOP ไม่สำเร็จ: " +
          sopError.message
      );

      setLoading(false);
      return;
    }

    setRecipe(
      recipeData as Recipe
    );

    setIngredients(
      (ingredientData ||
        []) as RecipeIngredient[]
    );

    if (sopData) {
      const sop =
        sopData as RecipeSop;

      setSopId(sop.id);

      setTitle(
        sop.title || ""
      );

      setProductDescription(
        sop.product_description || ""
      );

      setEquipment(
        sop.equipment || ""
      );

      setPreparation(
        sop.preparation || ""
      );

      setCriticalPoints(
        sop.critical_points || ""
      );

      setQualityControl(
        sop.quality_control || ""
      );

      setPackingStorage(
        sop.packing_storage || ""
      );

      setSanitation(
        sop.sanitation || ""
      );

      setResponsibilities(
        sop.responsibilities || ""
      );

      setNotes(
        sop.notes || ""
      );

      setVersion(
        sop.version || "1.0"
      );

      setApprovedBy(
        sop.approved_by || ""
      );

      setApprovedAt(
        toInputDate(
          sop.approved_at
        )
      );

      await loadSteps(
        sop.id
      );
    } else {
      setTitle(
        `SOP - ${recipeData.name}`
      );

      setSteps([]);
    }

    setLoading(false);
  };

  const loadSteps = async (
    currentSopId: string
  ) => {
    const {
      data,
      error,
    } = await supabase
      .from("recipe_sop_steps")
      .select("*")
      .eq("sop_id", currentSopId)
      .order("step_order", {
        ascending: true,
      });

    if (error) {
      setMessage(
        "โหลดขั้นตอน SOP ไม่สำเร็จ: " +
          error.message
      );

      return;
    }

    const rawSteps =
      (data || []) as SopStep[];

    const withSignedUrls =
      await Promise.all(
        rawSteps.map(
          async (step) => {
            if (
              !step.image_path
            ) {
              return {
                ...step,
                signedImageUrl:
                  null,
              };
            }

            const {
              data:
                signedData,
            } =
              await supabase.storage
                .from(
                  "sop-images"
                )
                .createSignedUrl(
                  step.image_path,
                  60 * 60 * 6
                );

            return {
              ...step,

              signedImageUrl:
                signedData
                  ?.signedUrl ||
                null,
            };
          }
        )
      );

    setSteps(
      withSignedUrls
    );
  };

  const yieldSummary =
    useMemo(() => {
      if (!recipe) {
        return "-";
      }

      if (
        recipe.yield_amount &&
        recipe.yield_amount > 0
      ) {
        return `${formatNumber(
          Number(
            recipe.yield_amount
          )
        )} ${
          recipe.yield_unit || ""
        }`;
      }

      return "-";
    }, [recipe]);

  const buildSopPayload = (
    userId: string
  ) => {
    if (!recipe) {
      return null;
    }

    const cleanTitle =
      title.trim();

    if (!cleanTitle) {
      return null;
    }

    return {
      user_id: userId,
      recipe_id: recipe.id,

      title: cleanTitle,

      product_description:
        productDescription.trim() ||
        null,

      equipment:
        equipment.trim() ||
        null,

      preparation:
        preparation.trim() ||
        null,

      critical_points:
        criticalPoints.trim() ||
        null,

      quality_control:
        qualityControl.trim() ||
        null,

      packing_storage:
        packingStorage.trim() ||
        null,

      sanitation:
        sanitation.trim() ||
        null,

      responsibilities:
        responsibilities.trim() ||
        null,

      notes:
        notes.trim() ||
        null,

      version:
        version.trim() ||
        "1.0",

      approved_by:
        approvedBy.trim() ||
        null,

      approved_at:
        approvedAt
          ? new Date(
              `${approvedAt}T00:00:00`
            ).toISOString()
          : null,

      updated_at:
        new Date().toISOString(),
    };
  };

  const ensureSopExists =
    async () => {
      const {
        data: { user },
      } =
        await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return null;
      }

      if (sopId) {
        return sopId;
      }

      const payload =
        buildSopPayload(
          user.id
        );

      if (!payload) {
        setMessage(
          "กรุณากรอกชื่อ SOP ก่อน"
        );

        return null;
      }

      const {
        data,
        error,
      } = await supabase
        .from("recipe_sops")
        .insert(payload)
        .select("id")
        .single();

      if (error) {
        setMessage(
          "สร้าง SOP ไม่สำเร็จ: " +
            error.message
        );

        return null;
      }

      setSopId(data.id);

      return data.id;
    };

  const handleSaveSop =
    async () => {
      if (!recipe) {
        return;
      }

      setSaving(true);
      setMessage("");
      setSopSaved(false);

      const {
        data: { user },
      } =
        await supabase.auth.getUser();

      if (!user) {
        setSaving(false);

        router.push("/login");
        return;
      }

      const payload =
        buildSopPayload(
          user.id
        );

      if (!payload) {
        setMessage(
          "กรุณากรอกชื่อ SOP"
        );

        setSaving(false);
        return;
      }

      if (sopId) {
        const { error } =
          await supabase
            .from(
              "recipe_sops"
            )
            .update(payload)
            .eq("id", sopId)
            .eq(
              "user_id",
              user.id
            );

        if (error) {
          setMessage(
            "บันทึก SOP ไม่สำเร็จ: " +
              error.message
          );

          setSaving(false);
          return;
        }

        await markSopAsDraft(
          sopId
        );

        setSaving(false);

        showSopSaved();

        return;
      }

      const {
        data,
        error,
      } = await supabase
        .from("recipe_sops")
        .insert(payload)
        .select("id")
        .single();

      if (error) {
        setMessage(
          "สร้าง SOP ไม่สำเร็จ: " +
            error.message
        );

        setSaving(false);
        return;
      }

      setSopId(data.id);

      setSaving(false);

      showSopSaved();
    };

  const handleAddStep =
    async () => {
      setAddingStep(true);
      setMessage("");

      const currentSopId =
        await ensureSopExists();

      if (!currentSopId) {
        setAddingStep(false);
        return;
      }

      const {
        data: { user },
      } =
        await supabase.auth.getUser();

      if (!user) {
        setAddingStep(false);
        return;
      }

      const nextOrder =
        steps.length + 1;

      const {
        data,
        error,
      } = await supabase
        .from(
          "recipe_sop_steps"
        )
        .insert({
          user_id:
            user.id,

          sop_id:
            currentSopId,

          step_order:
            nextOrder,

          title:
            `ขั้นตอนที่ ${nextOrder}`,

          instruction:
            null,

          duration_minutes:
            null,

          temperature_c:
            null,

          qc_target:
            null,

          qc_warning:
            null,

          image_url:
            null,

          image_path:
            null,
        })
        .select("*")
        .single();

      if (error) {
        setMessage(
          "เพิ่มขั้นตอนไม่สำเร็จ: " +
            error.message
        );

        setAddingStep(false);
        return;
      }

      setSteps(
        (current) => [
          ...current,
          {
            ...(data as SopStep),

            signedImageUrl:
              null,
          },
        ]
      );

      await markSopAsDraft(
        currentSopId
      );

      setAddingStep(false);
    };

  const updateLocalStep = (
    stepId: string,
    field: keyof SopStep,
    value:
      | string
      | number
      | null
  ) => {
    setSteps(
      (current) =>
        current.map(
          (step) =>
            step.id === stepId
              ? {
                  ...step,
                  [field]:
                    value,
                }
              : step
        )
    );
  };

  const handleSaveStep =
    async (
      step: SopStep
    ) => {
      setSavingStepId(
        step.id
      );

      setSavedStepId(
        null
      );

      setMessage("");

      if (
        !step.title.trim()
      ) {
        setMessage(
          "กรุณากรอกชื่อขั้นตอน"
        );

        setSavingStepId(
          null
        );

        return;
      }

      const {
        data: { user },
      } =
        await supabase.auth.getUser();

      if (!user) {
        setSavingStepId(
          null
        );

        return;
      }

      const { error } =
        await supabase
          .from(
            "recipe_sop_steps"
          )
          .update({
            title:
              step.title.trim(),

            instruction:
              step.instruction?.trim() ||
              null,

            duration_minutes:
              step.duration_minutes ??
              null,

            temperature_c:
              step.temperature_c ??
              null,

            qc_target:
              step.qc_target?.trim() ||
              null,

            qc_warning:
              step.qc_warning?.trim() ||
              null,

            updated_at:
              new Date().toISOString(),
          })
          .eq("id", step.id)
          .eq(
            "user_id",
            user.id
          );

      if (error) {
        setMessage(
          "บันทึกขั้นตอนไม่สำเร็จ: " +
            error.message
        );

        setSavingStepId(
          null
        );

        return;
      }

      await markSopAsDraft(
        step.sop_id
      );

      setSavingStepId(
        null
      );

      showStepSaved(
        step.id
      );
    };

  const handleDeleteStep =
    async (
      step: SopStep
    ) => {
      const confirmed =
        window.confirm(
          `ต้องการลบ "${step.title}" ใช่หรือไม่?`
        );

      if (!confirmed) {
        return;
      }

      setDeletingStepId(
        step.id
      );

      setMessage("");

      if (
        step.image_path
      ) {
        await supabase.storage
          .from("sop-images")
          .remove([
            step.image_path,
          ]);
      }

      const { error } =
        await supabase
          .from(
            "recipe_sop_steps"
          )
          .delete()
          .eq("id", step.id);

      if (error) {
        setMessage(
          "ลบขั้นตอนไม่สำเร็จ: " +
            error.message
        );

        setDeletingStepId(
          null
        );

        return;
      }

      const remaining =
        steps.filter(
          (item) =>
            item.id !==
            step.id
        );

      const reordered =
        remaining.map(
          (item, index) => ({
            ...item,
            step_order:
              index + 1,
          })
        );

      setSteps(
        reordered
      );

      await Promise.all(
        reordered.map(
          (item) =>
            supabase
              .from(
                "recipe_sop_steps"
              )
              .update({
                step_order:
                  item.step_order,
              })
              .eq(
                "id",
                item.id
              )
        )
      );

      await markSopAsDraft(
        step.sop_id
      );

      setDeletingStepId(
        null
      );
    };

  const handleUploadImage =
    async (
      step: SopStep,
      file: File
    ) => {
      setUploadingStepId(
        step.id
      );

      setImageSavedStepId(
        null
      );

      setMessage("");

      if (
        !file.type.startsWith(
          "image/"
        )
      ) {
        setMessage(
          "กรุณาเลือกไฟล์รูปภาพ"
        );

        setUploadingStepId(
          null
        );

        return;
      }

      const maxSize =
        5 * 1024 * 1024;

      if (
        file.size > maxSize
      ) {
        setMessage(
          "รูปภาพต้องมีขนาดไม่เกิน 5 MB"
        );

        setUploadingStepId(
          null
        );

        return;
      }

      const {
        data: { user },
      } =
        await supabase.auth.getUser();

      if (!user || !sopId) {
        setMessage(
          "ไม่พบข้อมูล SOP สำหรับอัปโหลดรูป"
        );

        setUploadingStepId(
          null
        );

        return;
      }

      const oldImagePath =
        step.image_path;

      const extension =
        file.name
          .split(".")
          .pop() || "jpg";

      const safeExtension =
        extension
          .toLowerCase()
          .replace(
            /[^a-z0-9]/g,
            ""
          ) || "jpg";

      const filePath =
        `${user.id}/${sopId}/${step.id}/${Date.now()}.${safeExtension}`;

      const {
        error: uploadError,
      } =
        await supabase.storage
          .from("sop-images")
          .upload(
            filePath,
            file,
            {
              upsert: false,
              contentType:
                file.type,
            }
          );

      if (uploadError) {
        setMessage(
          "อัปโหลดรูปไม่สำเร็จ: " +
            uploadError.message
        );

        setUploadingStepId(
          null
        );

        return;
      }

      const {
        error:
          updateError,
      } =
        await supabase
          .from(
            "recipe_sop_steps"
          )
          .update({
            image_path:
              filePath,

            image_url:
              null,

            updated_at:
              new Date().toISOString(),
          })
          .eq(
            "id",
            step.id
          )
          .eq(
            "user_id",
            user.id
          );

      if (updateError) {
        /*
         * ถ้าบันทึก DB ไม่สำเร็จ
         * ลบไฟล์ใหม่ออกเพื่อไม่ทิ้งไฟล์ orphan
         */
        await supabase.storage
          .from("sop-images")
          .remove([
            filePath,
          ]);

        setMessage(
          "บันทึกรูปลงขั้นตอนไม่สำเร็จ: " +
            updateError.message
        );

        setUploadingStepId(
          null
        );

        return;
      }

      /*
       * DB อัปเดตสำเร็จแล้ว
       * ค่อยลบรูปเก่า
       */
      if (
        oldImagePath
      ) {
        await supabase.storage
          .from("sop-images")
          .remove([
            oldImagePath,
          ]);
      }

      const {
        data:
          signedData,
      } =
        await supabase.storage
          .from("sop-images")
          .createSignedUrl(
            filePath,
            60 * 60 * 6
          );

      setSteps(
        (current) =>
          current.map(
            (item) =>
              item.id ===
              step.id
                ? {
                    ...item,

                    image_path:
                      filePath,

                    image_url:
                      null,

                    signedImageUrl:
                      signedData?.signedUrl ||
                      null,
                  }
                : item
          )
      );

      await markSopAsDraft(
        step.sop_id
      );

      setUploadingStepId(
        null
      );

      showImageSaved(
        step.id
      );
    };

  const handleRemoveImage =
    async (
      step: SopStep
    ) => {
      if (
        !step.image_path
      ) {
        return;
      }

      setUploadingStepId(
        step.id
      );

      setImageSavedStepId(
        null
      );

      setMessage("");

      const {
        data: { user },
      } =
        await supabase.auth.getUser();

      if (!user) {
        setUploadingStepId(
          null
        );

        return;
      }

      const {
        error:
          updateError,
      } =
        await supabase
          .from(
            "recipe_sop_steps"
          )
          .update({
            image_path:
              null,

            image_url:
              null,

            updated_at:
              new Date().toISOString(),
          })
          .eq(
            "id",
            step.id
          )
          .eq(
            "user_id",
            user.id
          );

      if (updateError) {
        setMessage(
          "อัปเดตขั้นตอนไม่สำเร็จ: " +
            updateError.message
        );

        setUploadingStepId(
          null
        );

        return;
      }

      const {
        error:
          storageError,
      } =
        await supabase.storage
          .from("sop-images")
          .remove([
            step.image_path,
          ]);

      if (storageError) {
        console.error(
          "ลบไฟล์รูปจาก Storage ไม่สำเร็จ:",
          storageError
        );
      }

      setSteps(
        (current) =>
          current.map(
            (item) =>
              item.id ===
              step.id
                ? {
                    ...item,

                    image_path:
                      null,

                    image_url:
                      null,

                    signedImageUrl:
                      null,
                  }
                : item
          )
      );

      await markSopAsDraft(
        step.sop_id
      );

      setUploadingStepId(
        null
      );
    };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center text-slate-500">
            กำลังโหลด SOP...
          </div>
        </div>
      </main>
    );
  }

  if (!recipe) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center">
            <h1 className="font-bold text-slate-800 text-lg">
              ไม่พบสูตร
            </h1>

            {message && (
              <p className="text-sm text-red-500 mt-2">
                {message}
              </p>
            )}

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/recipes"
                )
              }
              className="mt-5 bg-amber-500 text-white font-bold px-5 py-2.5 rounded-xl"
            >
              กลับไปสูตรของฉัน
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="max-w-6xl mx-auto">

        {/* HEADER */}

        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5 mb-7">
          <div>
            <button
              type="button"
              onClick={() =>
                router.push(
                  `/recipes/${recipe.id}`
                )
              }
              className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-amber-600 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              กลับรายละเอียดสูตร
            </button>

            <div className="flex items-center gap-3 mt-4">
              <div className="bg-amber-500 text-white p-3 rounded-2xl">
                <BookOpenCheck className="w-6 h-6" />
              </div>

              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800">
                  SOP
                </h1>

                <p className="text-sm text-slate-500 mt-1">
                  Standard Operating Procedure
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">

            <button
              type="button"
              onClick={() =>
                router.push(
                  `/recipes/${recipe.id}/sop/view`
                )
              }
              className="inline-flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white font-bold px-5 py-3 rounded-xl text-sm transition"
            >
              <MonitorPlay className="w-4 h-4" />
              เปิด Kitchen Mode
            </button>

            <button
              type="button"
              onClick={() =>
                router.push(
                  `/recipes/${recipe.id}/sop/print`
                )
              }
              className="inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold px-5 py-3 rounded-xl text-sm transition"
            >
              <Printer className="w-4 h-4" />
              พิมพ์ / PDF
            </button>

            <button
              type="button"
              onClick={() =>
                router.push(
                  `/recipes/${recipe.id}/sop/history`
                )
              }
              className="inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold px-5 py-3 rounded-xl text-sm transition"
            >
              <History className="w-4 h-4" />
              ประวัติ Version
            </button>

            <button
              type="button"
              onClick={() =>
                router.push(
                  `/recipes/${recipe.id}/sop/help`
                )
              }
              className="inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold px-5 py-3 rounded-xl text-sm transition"
            >
              <CircleHelp className="w-4 h-4" />
              คู่มือ / ทดสอบระบบ
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={
                  handleSaveSop
                }
                disabled={
                  saving
                }
                className="inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white font-bold px-5 py-3 rounded-xl text-sm transition"
              >
                <Save className="w-4 h-4" />

                {saving
                  ? "กำลังบันทึก..."
                  : "บันทึก SOP"}
              </button>

              {sopSaved && (
                <span className="text-sm font-bold text-emerald-600 whitespace-nowrap">
                  ✓ บันทึกแล้ว
                </span>
              )}
            </div>
          </div>
        </div>

        {/* RECIPE */}

        <section className="bg-slate-800 text-white rounded-3xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-5">
            <ChefHat className="w-5 h-5 text-amber-400" />

            <div>
              <p className="text-xs text-slate-400">
                สูตรที่เชื่อมกับ SOP
              </p>

              <h2 className="font-extrabold text-xl">
                {recipe.name}
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <SummaryBox
              title="หมวดหมู่"
              value={
                recipe.category ||
                "-"
              }
            />

            <SummaryBox
              title="Yield"
              value={
                yieldSummary
              }
            />

            <SummaryBox
              title="จำนวนเสิร์ฟ / ชิ้น"
              value={
                recipe.servings
                  ? String(
                      recipe.servings
                    )
                  : "-"
              }
            />
          </div>
        </section>

        {/* DOCUMENT INFO */}

        <section className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm mb-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-5">
            <div>
              <h2 className="font-bold text-slate-800">
                ข้อมูลเอกสาร SOP
              </h2>

              <p className="text-xs text-slate-400 mt-1">
                Version และสถานะการอนุมัติเอกสาร
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-extrabold border ${
                  isApproved
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : "bg-amber-50 border-amber-200 text-amber-700"
                }`}
              >
                {isApproved ? (
                  <FileCheck2 className="w-4 h-4" />
                ) : (
                  <FilePenLine className="w-4 h-4" />
                )}

                {isApproved
                  ? "APPROVED"
                  : "DRAFT"}
              </div>

              {!isApproved && (
                <button
                  type="button"
                  onClick={
                    handleApproveSop
                  }
                  disabled={
                    approving
                  }
                  className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold px-4 py-2.5 rounded-xl text-sm"
                >
                  {approving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <FileCheck2 className="w-4 h-4" />
                  )}

                  {approving
                    ? "กำลังอนุมัติ..."
                    : "อนุมัติ SOP"}
                </button>
              )}
            </div>
          </div>

          {approvalMessage && (
            <div
              className={`mb-5 rounded-2xl px-4 py-3 text-sm font-semibold border ${
                approvalMessage.startsWith(
                  "✓"
                )
                  ? "bg-emerald-50 border-emerald-100 text-emerald-700"
                  : "bg-amber-50 border-amber-100 text-amber-800"
              }`}
            >
              {approvalMessage}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field
              label="ชื่อ SOP"
              value={title}
              onChange={
                setTitle
              }
              placeholder="เช่น SOP การผลิตน้ำจิ้มซีฟู้ด"
            />

            <Field
              label="Version"
              value={version}
              onChange={
                setVersion
              }
              placeholder="1.0"
            />

            <Field
              label="ผู้อนุมัติ"
              value={
                approvedBy
              }
              onChange={
                setApprovedBy
              }
              placeholder="ชื่อผู้อนุมัติ SOP"
            />

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                วันที่อนุมัติ
              </label>

              <input
                type="date"
                value={
                  approvedAt
                }
                readOnly
                className="w-full px-4 py-3 border border-slate-200 bg-slate-50 rounded-xl text-sm text-slate-600"
              />

              <p className="text-xs text-slate-400 mt-1.5">
                ระบบจะบันทึกวันที่ให้อัตโนมัติเมื่อกด “อนุมัติ SOP”
              </p>
            </div>
          </div>
        </section>

        {/* INGREDIENTS */}

        <section className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm mb-6">
          <div className="p-6 border-b border-slate-100">
            <h2 className="font-bold text-slate-800">
              วัตถุดิบอ้างอิง
            </h2>

            <p className="text-xs text-slate-400 mt-1">
              ดึงจากสูตรโดยอัตโนมัติ
            </p>
          </div>

          {ingredients.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              สูตรนี้ยังไม่มีวัตถุดิบ
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[550px] text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left px-5 py-3">
                      วัตถุดิบ
                    </th>

                    <th className="text-right px-5 py-3">
                      ปริมาณ
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {ingredients.map(
                    (item) => (
                      <tr
                        key={
                          item.id
                        }
                      >
                        <td className="px-5 py-4 font-semibold text-slate-700">
                          {
                            item.ingredient_name
                          }
                        </td>

                        <td className="px-5 py-4 text-right">
                          {formatNumber(
                            Number(
                              item.quantity
                            )
                          )}{" "}
                          {item.unit}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* GENERAL SOP */}

        <div className="space-y-5 mb-6">
          <SopField
            icon={
              <ChefHat className="w-5 h-5" />
            }
            title="ข้อมูลผลิตภัณฑ์"
            description="ลักษณะ จุดประสงค์ และมาตรฐานโดยรวม"
            value={
              productDescription
            }
            onChange={
              setProductDescription
            }
          />

          <SopField
            icon={
              <Wrench className="w-5 h-5" />
            }
            title="อุปกรณ์"
            description="เครื่องมือและเครื่องจักรที่ใช้"
            value={equipment}
            onChange={
              setEquipment
            }
          />

          <SopField
            icon={
              <StickyNote className="w-5 h-5" />
            }
            title="การเตรียมก่อนผลิต"
            description="Mise en place วัตถุดิบ พื้นที่ และอุปกรณ์"
            value={
              preparation
            }
            onChange={
              setPreparation
            }
          />
        </div>

        {/* SOP STEPS */}

        <section className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm mb-6">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="font-extrabold text-slate-800 text-lg">
                ขั้นตอนการผลิต
              </h2>

              <p className="text-xs text-slate-500 mt-1">
                เพิ่มขั้นตอนพร้อมภาพอ้างอิง จุดสังเกต และ QC
              </p>
            </div>

            <button
              type="button"
              onClick={
                handleAddStep
              }
              disabled={
                addingStep
              }
              className="inline-flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 disabled:opacity-60 text-white font-bold px-4 py-2.5 rounded-xl text-sm"
            >
              <Plus className="w-4 h-4" />

              {addingStep
                ? "กำลังเพิ่ม..."
                : "เพิ่มขั้นตอน"}
            </button>
          </div>

          {steps.length === 0 ? (
            <div className="p-10 text-center">
              <div className="text-4xl">
                👨‍🍳
              </div>

              <h3 className="font-bold text-slate-800 mt-3">
                ยังไม่มีขั้นตอน
              </h3>

              <p className="text-sm text-slate-500 mt-1">
                กด “เพิ่มขั้นตอน” เพื่อเริ่มสร้าง SOP
              </p>
            </div>
          ) : (
            <div className="p-5 sm:p-6 space-y-5">
              {steps.map(
                (
                  step,
                  index
                ) => (
                  <StepCard
                    key={
                      step.id
                    }
                    step={
                      step
                    }
                    index={
                      index
                    }
                    saving={
                      savingStepId ===
                      step.id
                    }
                    saved={
                      savedStepId ===
                      step.id
                    }
                    uploading={
                      uploadingStepId ===
                      step.id
                    }
                    imageSaved={
                      imageSavedStepId ===
                      step.id
                    }
                    deleting={
                      deletingStepId ===
                      step.id
                    }
                    onChange={(
                      field,
                      value
                    ) =>
                      updateLocalStep(
                        step.id,
                        field,
                        value
                      )
                    }
                    onSave={() =>
                      handleSaveStep(
                        step
                      )
                    }
                    onDelete={() =>
                      handleDeleteStep(
                        step
                      )
                    }
                    onUpload={(
                      file
                    ) =>
                      handleUploadImage(
                        step,
                        file
                      )
                    }
                    onRemoveImage={() =>
                      handleRemoveImage(
                        step
                      )
                    }
                  />
                )
              )}
            </div>
          )}
        </section>

        {/* CONTROL + QC */}

        <div className="space-y-5">
          <SopField
            icon={
              <AlertTriangle className="w-5 h-5" />
            }
            title="จุดสำคัญ / จุดควบคุมรวม"
            description="ข้อควรระวังที่ใช้กับกระบวนการโดยรวม"
            value={
              criticalPoints
            }
            onChange={
              setCriticalPoints
            }
          />

          <SopField
            icon={
              <BadgeCheck className="w-5 h-5" />
            }
            title="Quality Control รวม"
            description="มาตรฐานตรวจรับผลิตภัณฑ์สำเร็จ"
            value={
              qualityControl
            }
            onChange={
              setQualityControl
            }
          />

          <SopField
            icon={
              <Package className="w-5 h-5" />
            }
            title="การบรรจุและการเก็บรักษา"
            description="รูปแบบบรรจุ ฉลาก และเงื่อนไขการจัดเก็บ"
            value={
              packingStorage
            }
            onChange={
              setPackingStorage
            }
          />

          <SopField
            icon={
              <ShieldCheck className="w-5 h-5" />
            }
            title="สุขลักษณะและความสะอาด"
            description="ข้อกำหนดด้านบุคลากร อุปกรณ์ และพื้นที่"
            value={
              sanitation
            }
            onChange={
              setSanitation
            }
          />

          <SopField
            icon={
              <Users className="w-5 h-5" />
            }
            title="ผู้รับผิดชอบ"
            description="ผู้ผลิต ผู้ตรวจสอบ และผู้อนุมัติ"
            value={
              responsibilities
            }
            onChange={
              setResponsibilities
            }
          />

          <SopField
            icon={
              <StickyNote className="w-5 h-5" />
            }
            title="หมายเหตุเพิ่มเติม"
            description="ข้อมูลอื่นที่เกี่ยวข้องกับ SOP"
            value={notes}
            onChange={
              setNotes
            }
          />
        </div>

        {/* ERROR MESSAGE ONLY */}

        {message && (
          <div className="bg-red-50 border border-red-100 text-red-600 rounded-xl px-4 py-3 text-sm mt-6">
            {message}
          </div>
        )}

        {/* FOOTER SAVE */}

        <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            onClick={
              handleSaveSop
            }
            disabled={
              saving
            }
            className="inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white font-bold px-6 py-3 rounded-xl text-sm"
          >
            <Save className="w-4 h-4" />

            {saving
              ? "กำลังบันทึก..."
              : "บันทึก SOP"}
          </button>

          {sopSaved && (
            <span className="text-sm font-bold text-emerald-600">
              ✓ บันทึกแล้ว
            </span>
          )}
        </div>
      </div>

    </main>
  );
}

type StepCardProps = {
  step: SopStep;
  index: number;

  saving: boolean;
  saved: boolean;

  uploading: boolean;
  imageSaved: boolean;

  deleting: boolean;

  onChange: (
    field: keyof SopStep,
    value:
      | string
      | number
      | null
  ) => void;

  onSave: () => void;
  onDelete: () => void;

  onUpload: (
    file: File
  ) => void;

  onRemoveImage:
    () => void;
};

function StepCard({
  step,
  index,
  saving,
  saved,
  uploading,
  imageSaved,
  deleting,
  onChange,
  onSave,
  onDelete,
  onUpload,
  onRemoveImage,
}: StepCardProps) {
  return (
    <article className="border border-slate-200 rounded-3xl overflow-hidden">
      <div className="bg-slate-50 px-5 py-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <GripVertical className="w-4 h-4 text-slate-300" />

          <div className="bg-amber-500 text-white font-extrabold text-sm px-3 py-1.5 rounded-lg">
            STEP{" "}
            {String(
              index + 1
            ).padStart(
              2,
              "0"
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={
            onDelete
          }
          disabled={
            deleting
          }
          className="inline-flex items-center gap-1 text-xs font-bold text-red-500 disabled:opacity-50"
        >
          {deleting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}

          ลบ
        </button>
      </div>

      <div className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">

        {/* CONTENT */}

        <div className="space-y-4">
          <Field
            label="ชื่อขั้นตอน"
            value={
              step.title
            }
            onChange={(
              value
            ) =>
              onChange(
                "title",
                value
              )
            }
            placeholder="เช่น ปั่นพริกและกระเทียม"
          />

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              วิธีทำ
            </label>

            <textarea
              value={
                step.instruction ||
                ""
              }
              onChange={(e) =>
                onChange(
                  "instruction",
                  e.target.value
                )
              }
              rows={5}
              placeholder="อธิบายวิธีทำของขั้นตอนนี้อย่างละเอียด..."
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm leading-relaxed focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 mb-1.5">
                <Clock3 className="w-4 h-4" />
                เวลา (นาที)
              </label>

              <input
                type="number"
                min="0"
                step="0.1"
                value={
                  step.duration_minutes ??
                  ""
                }
                onChange={(e) =>
                  onChange(
                    "duration_minutes",
                    e.target.value
                      ? Number(
                          e.target.value
                        )
                      : null
                  )
                }
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 mb-1.5">
                <Thermometer className="w-4 h-4" />
                อุณหภูมิ (°C)
              </label>

              <input
                type="number"
                step="0.1"
                value={
                  step.temperature_c ??
                  ""
                }
                onChange={(e) =>
                  onChange(
                    "temperature_c",
                    e.target.value
                      ? Number(
                          e.target.value
                        )
                      : null
                  )
                }
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm"
              />
            </div>
          </div>

          {/* QC TARGET */}

          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
            <label className="block text-sm font-bold text-emerald-800 mb-1.5">
              ✓ จุดที่ต้องได้ / QC Target
            </label>

            <textarea
              value={
                step.qc_target ||
                ""
              }
              onChange={(e) =>
                onChange(
                  "qc_target",
                  e.target.value
                )
              }
              rows={3}
              placeholder="เช่น สีเขียวสด เนื้อซอสละเอียด ไม่แยกชั้น..."
              className="w-full px-4 py-3 border border-emerald-200 bg-white rounded-xl text-sm"
            />
          </div>

          {/* QC WARNING */}

          <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
            <label className="block text-sm font-bold text-red-700 mb-1.5">
              ⚠ สิ่งที่ไม่ควรเกิด / QC Warning
            </label>

            <textarea
              value={
                step.qc_warning ||
                ""
              }
              onChange={(e) =>
                onChange(
                  "qc_warning",
                  e.target.value
                )
              }
              rows={3}
              placeholder="เช่น สีคล้ำ มีกลิ่นไหม้ เนื้อแยกชั้น..."
              className="w-full px-4 py-3 border border-red-200 bg-white rounded-xl text-sm"
            />
          </div>

          {/* STEP SAVE */}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={
                onSave
              }
              disabled={
                saving
              }
              className="inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white font-bold px-5 py-2.5 rounded-xl text-sm"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}

              {saving
                ? "กำลังบันทึก..."
                : "บันทึกขั้นตอน"}
            </button>

            {saved && (
              <span className="text-sm font-bold text-emerald-600">
                ✓ บันทึกแล้ว
              </span>
            )}
          </div>
        </div>

        {/* IMAGE */}

        <div>
          <p className="text-sm font-bold text-slate-700 mb-2">
            ภาพอ้างอิงขั้นตอน
          </p>

          {step.signedImageUrl ? (
            <>
              <div className="relative">
                <img
                  src={
                    step.signedImageUrl
                  }
                  alt={
                    step.title
                  }
                  className="w-full aspect-square object-cover rounded-2xl border border-slate-200"
                />

                <button
                  type="button"
                  onClick={
                    onRemoveImage
                  }
                  disabled={
                    uploading
                  }
                  title="ลบรูป"
                  className="absolute top-2 right-2 bg-white/90 hover:bg-white text-red-500 rounded-full p-2 shadow disabled:opacity-60"
                >
                  {uploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <X className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* CHANGE IMAGE */}

              <label className="mt-3 w-full inline-flex items-center justify-center gap-2 border border-slate-200 hover:border-amber-300 bg-white hover:bg-amber-50 text-slate-700 font-bold px-4 py-2.5 rounded-xl text-sm cursor-pointer transition">
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ImagePlus className="w-4 h-4 text-amber-500" />
                )}

                {uploading
                  ? "กำลังอัปโหลด..."
                  : "เปลี่ยนรูป"}

                <input
                  type="file"
                  accept="image/*"
                  disabled={
                    uploading
                  }
                  className="hidden"
                  onChange={(e) => {
                    const file =
                      e.target
                        .files?.[0];

                    if (file) {
                      onUpload(
                        file
                      );
                    }

                    e.target.value =
                      "";
                  }}
                />
              </label>
            </>
          ) : (
            <label className="aspect-square border-2 border-dashed border-slate-200 hover:border-amber-300 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer p-5 transition">
              {uploading ? (
                <>
                  <Loader2 className="w-7 h-7 text-amber-500 animate-spin" />

                  <p className="text-sm text-slate-500 mt-3">
                    กำลังอัปโหลด...
                  </p>
                </>
              ) : (
                <>
                  <ImagePlus className="w-8 h-8 text-slate-300" />

                  <p className="text-sm font-bold text-slate-600 mt-3">
                    เพิ่มรูปตัวอย่าง
                  </p>

                  <p className="text-xs text-slate-400 mt-1">
                    JPG / PNG / WEBP
                    <br />
                    ไม่เกิน 5 MB
                  </p>
                </>
              )}

              <input
                type="file"
                accept="image/*"
                disabled={
                  uploading
                }
                className="hidden"
                onChange={(e) => {
                  const file =
                    e.target
                      .files?.[0];

                  if (file) {
                    onUpload(
                      file
                    );
                  }

                  e.target.value =
                    "";
                }}
              />
            </label>
          )}

          {imageSaved && (
            <p className="text-sm font-bold text-emerald-600 mt-3">
              ✓ บันทึกรูปแล้ว
            </p>
          )}

          <p className="text-xs text-slate-400 mt-3 leading-relaxed">
            แนะนำให้ใช้ภาพที่พนักงานสามารถดูเทียบกับของจริง เช่น สี ความข้น
            ระดับการสุก หรือรูปลักษณะที่ถือว่าผ่าน QC
          </p>
        </div>
      </div>
    </article>
  );
}

function AiPreviewSection({
  title,
  content,
}: {
  title: string;
  content: string;
}) {
  return (
    <section>
      <h3 className="font-extrabold text-slate-800 mb-2">
        {title}
      </h3>

      <div className="border border-slate-200 rounded-2xl p-4">
        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
          {content || "-"}
        </p>
      </div>
    </section>
  );
}

function SummaryBox({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
      <p className="text-xs text-slate-400">
        {title}
      </p>

      <p className="font-bold mt-1">
        {value}
      </p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder = "",
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-1.5">
        {label}
      </label>

      <input
        value={value}
        onChange={(e) =>
          onChange(
            e.target.value
          )
        }
        placeholder={
          placeholder
        }
        className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-amber-500"
      />
    </div>
  );
}

function SopField({
  icon,
  title,
  description,
  value,
  onChange,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  value: string;
  onChange: (
    value: string
  ) => void;
}) {
  return (
    <section className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
      <div className="flex items-start gap-3 mb-4">
        <div className="bg-amber-50 text-amber-600 p-2.5 rounded-xl shrink-0">
          {icon}
        </div>

        <div>
          <h2 className="font-bold text-slate-800">
            {title}
          </h2>

          <p className="text-xs text-slate-400 mt-1">
            {description}
          </p>
        </div>
      </div>

      <textarea
        value={value}
        onChange={(e) =>
          onChange(
            e.target.value
          )
        }
        rows={5}
        className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm leading-relaxed focus:outline-none focus:border-amber-500"
      />
    </section>
  );
}
