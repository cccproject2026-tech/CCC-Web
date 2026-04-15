"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DirectorHero from "../../DirectorHero";
import {
  directorGlassCard,
  directorInputClass,
  directorPageContainer,
  directorPageRoot,
  directorSpinner,
} from "../../directorUi";
import {
  apiAddNestedRoadmapItem,
  apiGetRoadmapById,
  apiGetAssessments,
  apiUpdateNestedRoadmapItem,
  apiUpdateRoadmap,
} from "@/app/Services/api";
import type { ExtraItem, NestedRoadMapItem, RoadMapResponse } from "@/app/Services/types/roadmaps.types";
import { parseAssessmentsListPayload } from "@/app/Services/assessment.service";

type RoadmapDoc = Partial<RoadMapResponse> & {
  roadmaps?: NestedRoadMapItem[];
};

function unwrapRoadmap(res: unknown): RoadmapDoc | null {
  if (!res || typeof res !== "object") return null;
  const r = res as Record<string, unknown>;
  const data = (r as any).data;
  if (data && typeof data === "object" && !Array.isArray(data)) {
    const inner = data as Record<string, unknown>;
    if (inner.data && typeof inner.data === "object") return inner.data as RoadmapDoc;
    return data as RoadmapDoc;
  }
  return r as RoadmapDoc;
}

function safeString(v: unknown): string {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

export default function DirectorRoadmapFormPage() {
  const router = useRouter();
  const sp = useSearchParams();

  const roadmapId = sp.get("roadmapId")?.trim() || "";
  const nestedRoadmapId = sp.get("nestedRoadmapId")?.trim() || "";
  const roadmapType = (sp.get("type") as "single" | "phase" | null) || "single";
  const isEditMode = sp.get("isEditMode") === "true";

  const roadmapData = useMemo(
    () => ({
      name: safeString(sp.get("name") || ""),
      subheading: safeString(sp.get("subheading") || ""),
      completionTime: safeString(sp.get("completionTime") || ""),
      selectedDivision: safeString(sp.get("selectedDivision") || "All") || "All",
      bannerImage: safeString(sp.get("bannerImage") || ""),
    }),
    [sp],
  );

  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);

  const [parent, setParent] = useState<RoadmapDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [churchVerbiage, setChurchVerbiage] = useState("");
  const [descriptionVerbiage, setDescriptionVerbiage] = useState("");
  const [customFields, setCustomFields] = useState<any[]>([]);
  const [assessments, setAssessments] = useState<Array<{ id: string; name: string }>>([]);

  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [fieldModalOpen, setFieldModalOpen] = useState(false);
  const [fieldParentSectionId, setFieldParentSectionId] = useState<string | null>(null);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [fieldType, setFieldType] = useState<
    | "text"
    | "textarea"
    | "upload"
    | "datepicker"
    | "assessment"
    | "section"
    | "checkbox_item"
    | "text_display"
    | "digital_signature"
  >("text");
  const [fieldDraft, setFieldDraft] = useState<Record<string, any>>({});

  // Mobile parity: transform extras <-> fields (subset of mobile renderers)
  const transformExtrasToFields = (extras: any[]): any[] => {
    const fields: any[] = [];
    let fieldIndex = 0;
    (extras || []).forEach((extra) => {
      const fieldId = `field_${Date.now()}_${fieldIndex++}`;
      switch (extra.type) {
        case "TEXT_AREA":
          fields.push({ id: fieldId, type: "textarea", label: extra.name, placeholder: extra.placeHolder || "" });
          break;
        case "TEXT_FIELD":
          fields.push({ id: fieldId, type: "text", label: extra.name, placeholder: extra.placeHolder || "" });
          break;
        case "UPLOAD":
          fields.push({ id: fieldId, type: "upload", buttonLabel: extra.name });
          break;
        case "DATE_PICKER":
          fields.push({
            id: fieldId,
            type: "datepicker",
            label: extra.name,
            date: extra.date || "",
            buttonName: extra.buttonName || "",
            allowPastorSelect: Array.isArray(extra.checkboxes) && extra.checkboxes.some((cb: any) => cb.name === "Allow pastor to select Date"),
            showOnCard: Array.isArray(extra.checkboxes) && extra.checkboxes.some((cb: any) => cb.name === "Show date on info card"),
          });
          break;
        case "ASSESSMENT":
          fields.push({
            id: fieldId,
            type: "assessment",
            selectedAssessment: extra.name,
            assessmentId: extra.assessmentId,
            buttonName: extra.buttonName || "",
            scheduleMeeting: Array.isArray(extra.checkboxes) && extra.checkboxes.some((cb: any) => cb.name === "Schedule Meeting after the Assessment"),
          });
          break;
        case "CHECKBOX":
          fields.push({
            id: fieldId,
            type: "checkbox_item",
            name: extra.name,
            haveButton: !!extra.haveButton,
            buttonName: extra.buttonName || "",
          });
          break;
        case "TEXT_DISPLAY":
          fields.push({ id: fieldId, type: "text_display", name: extra.name });
          break;
        case "SIGNATURE":
          fields.push({
            id: fieldId,
            type: "digital_signature",
            fieldName: extra.name,
            placeholderText: extra.placeHolder || "Sign here",
            clearButtonLabel: extra.buttonName || "Clear",
            required: !!extra.required,
            showOnInfoCard: !!extra.showOnCard,
          });
          break;
        case "SECTION":
          fields.push({
            id: fieldId,
            type: "section",
            name: extra.name,
            buttonName: extra.buttonName || "",
            showDuplicateButton: Array.isArray(extra.checkboxes) && extra.checkboxes.some((cb: any) => cb.haveButton),
          });
          if (Array.isArray(extra.sections)) {
            extra.sections.forEach((sectionExtra: any) => {
              const nestedId = `field_${Date.now()}_${fieldIndex++}`;
              const base = { id: nestedId, parentSectionId: fieldId };
              if (sectionExtra.type === "TEXT_FIELD") fields.push({ ...base, type: "text", label: sectionExtra.name, placeholder: sectionExtra.placeHolder || "" });
              else if (sectionExtra.type === "TEXT_AREA") fields.push({ ...base, type: "textarea", label: sectionExtra.name, placeholder: sectionExtra.placeHolder || "" });
              else if (sectionExtra.type === "UPLOAD") fields.push({ ...base, type: "upload", buttonLabel: sectionExtra.name });
              else if (sectionExtra.type === "TEXT_DISPLAY") fields.push({ ...base, type: "text_display", name: sectionExtra.name });
              else if (sectionExtra.type === "CHECKBOX") fields.push({ ...base, type: "checkbox_item", name: sectionExtra.name, haveButton: !!sectionExtra.haveButton, buttonName: sectionExtra.buttonName || "" });
              else if (sectionExtra.type === "DATE_PICKER") {
                fields.push({
                  ...base,
                  type: "datepicker",
                  label: sectionExtra.name,
                  date: sectionExtra.date || "",
                  buttonName: sectionExtra.buttonName || "",
                  allowPastorSelect: Array.isArray(sectionExtra.checkboxes) && sectionExtra.checkboxes.some((cb: any) => cb.name === "Allow pastor to select Date"),
                  showOnCard: Array.isArray(sectionExtra.checkboxes) && sectionExtra.checkboxes.some((cb: any) => cb.name === "Show date on info card"),
                });
              } else if (sectionExtra.type === "ASSESSMENT") {
                fields.push({
                  ...base,
                  type: "assessment",
                  selectedAssessment: sectionExtra.name,
                  assessmentId: sectionExtra.assessmentId,
                  buttonName: sectionExtra.buttonName || "",
                  scheduleMeeting: Array.isArray(sectionExtra.checkboxes) && sectionExtra.checkboxes.some((cb: any) => cb.name === "Schedule Meeting after the Assessment"),
                });
              }
            });
          }
          break;
      }
    });
    return fields;
  };

  const transformFieldsToExtras = (fields: any[]): any[] => {
    return (fields || [])
      .filter((f) => !f.parentSectionId)
      .map((field) => {
        const nestedFields = (fields || []).filter((x) => x.parentSectionId === field.id);
        switch (field.type) {
          case "textarea":
            return { type: "TEXT_AREA", name: field.label || field.name || "Text Area", ...(field.placeholder ? { placeHolder: field.placeholder } : {}) };
          case "text":
            return { type: "TEXT_FIELD", name: field.label || field.name || "Text Field", ...(field.placeholder ? { placeHolder: field.placeholder } : {}) };
          case "upload":
            return { type: "UPLOAD", name: field.buttonLabel || "Upload" };
          case "datepicker": {
            const checkboxes = [
              field.allowPastorSelect ? { type: "CHECKBOX", name: "Allow pastor to select Date", haveButton: false } : null,
              field.showOnCard ? { type: "CHECKBOX", name: "Show date on info card", haveButton: false } : null,
            ].filter(Boolean);
            return {
              type: "DATE_PICKER",
              name: field.label || "Date",
              ...(field.date ? { date: String(field.date).slice(0, 10) } : {}),
              ...(field.buttonName ? { buttonName: field.buttonName } : {}),
              ...(checkboxes.length ? { checkboxes } : {}),
            };
          }
          case "assessment": {
            const checkboxes = [
              field.scheduleMeeting ? { type: "CHECKBOX", name: "Schedule Meeting after the Assessment", haveButton: false } : null,
            ].filter(Boolean);
            const nm = typeof field.selectedAssessment === "object" ? field.selectedAssessment?.name : field.selectedAssessment;
            return {
              type: "ASSESSMENT",
              name: nm || "Assessment",
              assessmentId: field.assessmentId || (typeof field.selectedAssessment === "object" ? field.selectedAssessment?.id : undefined),
              ...(field.buttonName ? { buttonName: field.buttonName } : {}),
              ...(checkboxes.length ? { checkboxes } : {}),
            };
          }
          case "checkbox_item":
            return { type: "CHECKBOX", name: field.name || field.label || "Check Box", haveButton: !!field.haveButton, ...(field.buttonName ? { buttonName: field.buttonName } : {}) };
          case "text_display":
            return { type: "TEXT_DISPLAY", name: field.name || field.label || "" };
          case "digital_signature":
            return {
              type: "SIGNATURE",
              name: field.fieldName || "Digital Signature",
              placeHolder: field.placeholderText || "Sign here",
              buttonName: field.clearButtonLabel || "Clear",
              required: !!field.required,
              showOnCard: !!field.showOnInfoCard,
            };
          case "section": {
            const checkboxes = [
              field.showDuplicateButton ? { type: "CHECKBOX", name: field.name || "Section", haveButton: true, buttonName: field.buttonName || "Add section steps" } : null,
            ].filter(Boolean);
            const sections = nestedFields
              .map((nf) => {
                if (nf.type === "text") return { type: "TEXT_FIELD", name: nf.label || "Text Field", ...(nf.placeholder ? { placeHolder: nf.placeholder } : {}) };
                if (nf.type === "textarea") return { type: "TEXT_AREA", name: nf.label || "Text Area", ...(nf.placeholder ? { placeHolder: nf.placeholder } : {}) };
                if (nf.type === "upload") return { type: "UPLOAD", name: nf.buttonLabel || "Upload" };
                if (nf.type === "text_display") return { type: "TEXT_DISPLAY", name: nf.name || nf.label || "" };
                if (nf.type === "checkbox_item") return { type: "CHECKBOX", name: nf.name || nf.label || "Check Box", haveButton: !!nf.haveButton, ...(nf.buttonName ? { buttonName: nf.buttonName } : {}) };
                if (nf.type === "datepicker") {
                  const cbs = [
                    nf.allowPastorSelect ? { type: "CHECKBOX", name: "Allow pastor to select Date", haveButton: false } : null,
                    nf.showOnCard ? { type: "CHECKBOX", name: "Show date on info card", haveButton: false } : null,
                  ].filter(Boolean);
                  return { type: "DATE_PICKER", name: nf.label || "Date", ...(nf.date ? { date: String(nf.date).slice(0, 10) } : {}), ...(nf.buttonName ? { buttonName: nf.buttonName } : {}), ...(cbs.length ? { checkboxes: cbs } : {}) };
                }
                if (nf.type === "assessment") {
                  const cbs = [
                    nf.scheduleMeeting ? { type: "CHECKBOX", name: "Schedule Meeting after the Assessment", haveButton: false } : null,
                  ].filter(Boolean);
                  const nm = typeof nf.selectedAssessment === "object" ? nf.selectedAssessment?.name : nf.selectedAssessment;
                  return { type: "ASSESSMENT", name: nm || "Assessment", assessmentId: nf.assessmentId || (typeof nf.selectedAssessment === "object" ? nf.selectedAssessment?.id : undefined), ...(nf.buttonName ? { buttonName: nf.buttonName } : {}), ...(cbs.length ? { checkboxes: cbs } : {}) };
                }
                return null;
              })
              .filter(Boolean);
            return {
              type: "SECTION",
              name: field.name || "Section",
              ...(field.buttonName ? { buttonName: field.buttonName } : {}),
              ...(checkboxes.length ? { checkboxes } : {}),
              ...(sections.length ? { sections } : {}),
            };
          }
          default:
            return null;
        }
      })
      .filter(Boolean);
  };

  const openFieldModal = (type: any, opts?: { parentSectionId?: string | null; fieldId?: string | null }) => {
    setFieldType(type);
    setFieldParentSectionId(opts?.parentSectionId ?? null);
    setEditingFieldId(opts?.fieldId ?? null);
    if (opts?.fieldId) {
      const existing = customFields.find((f) => f.id === opts.fieldId);
      setFieldDraft(existing ? { ...existing } : {});
    } else {
      setFieldDraft({ type });
    }
    setFieldModalOpen(true);
  };

  const closeFieldModal = () => {
    setFieldModalOpen(false);
    setFieldParentSectionId(null);
    setEditingFieldId(null);
    setFieldDraft({});
  };

  const saveFieldDraft = () => {
    const id = editingFieldId || `field_${Date.now()}`;
    const next = { id, ...fieldDraft, type: fieldType, ...(fieldParentSectionId ? { parentSectionId: fieldParentSectionId } : {}) };
    setCustomFields((prev) => {
      if (editingFieldId) return prev.map((f) => (f.id === editingFieldId ? next : f));
      return [...prev, next];
    });
    closeFieldModal();
  };

  const deleteField = (id: string) => {
    setCustomFields((prev) => prev.filter((f) => f.id !== id && f.parentSectionId !== id));
  };

  useEffect(() => {
    // Fetch assessments list once for Assessment field picker
    let cancelled = false;
    (async () => {
      try {
        const res = await apiGetAssessments();
        const list = parseAssessmentsListPayload(res.data);
        const mapped = list
          .map((a: any) => ({
            id: String(a._id ?? a.id ?? "").trim(),
            name: String(a.name ?? a.title ?? "Assessment").trim(),
          }))
          .filter((x) => x.id);
        if (!cancelled) setAssessments(mapped);
      } catch {
        if (!cancelled) setAssessments([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!roadmapId) {
      setError("Missing roadmapId.");
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiGetRoadmapById(roadmapId);
        const doc = unwrapRoadmap(res.data);
        if (cancelled) return;
        setParent(doc);

        // Mobile parity: editing uses extras from selected nested roadmap (phase uses nestedRoadmapId, single uses [0])
        const selectedNested =
          roadmapType === "phase" && nestedRoadmapId
            ? doc?.roadmaps?.find((r) => String(r._id) === nestedRoadmapId)
            : doc?.roadmaps?.[0];

        const nested = selectedNested ?? null;
        setChurchVerbiage(safeString(nested?.roadMapDetails || ""));
        setDescriptionVerbiage(safeString((nested as any)?.description || ""));
        setCustomFields(transformExtrasToFields(((nested as any)?.extras || []) as any[]));

        // Mobile parity for banner: mobile passes local uri; web can pass blob: URL.
        // Prefer param bannerImage; fall back to nested.imageUrl.
        const img = roadmapData.bannerImage || safeString((nested as any)?.imageUrl || "");
        if (img) {
          setBannerPreview(img);
          if (img.startsWith("blob:")) {
            try {
              const resp = await fetch(img);
              const blob = await resp.blob();
              const ext = blob.type?.includes("png") ? "png" : "jpg";
              const f = new File([blob], `banner.${ext}`, { type: blob.type || "image/jpeg" });
              setBannerFile(f);
            } catch {
              setBannerFile(null);
            }
          } else {
            setBannerFile(null);
          }
        } else {
          setBannerPreview(null);
          setBannerFile(null);
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) setError("Could not load roadmap.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [roadmapId, roadmapType, nestedRoadmapId, roadmapData.bannerImage]);

  const handleSubmit = async () => {
    setFeedback(null);
    setError(null);

    if (!churchVerbiage.trim() || !descriptionVerbiage.trim()) {
      setError("Please fill in Church Roadmap Verbiage and Description Verbiage.");
      return;
    }

    const extras = transformFieldsToExtras(customFields) as any[];

    if (!roadmapId) return;
    if (!parent) return;

    setSubmitting(true);
    try {
      const hasNested = Array.isArray(parent.roadmaps) && parent.roadmaps.length > 0;
      const safeDuration =
        roadmapData.completionTime ||
        safeString(
          (roadmapType === "phase" && nestedRoadmapId
            ? parent.roadmaps?.find((r) => String(r._id) === nestedRoadmapId)?.duration
            : parent.roadmaps?.[0]?.duration) ||
            parent.duration ||
            "1 month",
        );

      // Payload common to nested template item
      const nestedPayloadBase: Partial<NestedRoadMapItem> & { description?: string } = {
        name: roadmapData.name || safeString(parent.name) || "Roadmap",
        roadMapDetails: roadmapData.subheading || "",
        description: descriptionVerbiage,
        duration: safeDuration,
        ...(bannerPreview && !bannerFile && bannerPreview.startsWith("http") ? { imageUrl: bannerPreview } : {}),
        phase: roadmapData.selectedDivision || "All",
        status: "not started" as any,
        extras: extras as any,
      };

      // CASE 1: Single roadmap (mobile: nested template under parent)
      if (roadmapType === "single") {
        if (!hasNested && !isEditMode) {
          await apiAddNestedRoadmapItem(roadmapId, nestedPayloadBase as any, bannerFile ?? undefined);
          setFeedback("Roadmap created successfully.");
          router.push("/director/revitalization-roadmap");
          return;
        }
        const existing = parent.roadmaps?.[0];
        const updatedNested: any = {
          _id: existing?._id,
          ...nestedPayloadBase,
          meetings: (existing as any)?.meetings || [],
          status: (existing as any)?.status || "not started",
        };
        if (bannerFile && existing?._id) {
          await apiUpdateNestedRoadmapItem(roadmapId, String(existing._id), updatedNested, bannerFile);
        } else {
          await apiUpdateRoadmap(roadmapId, {
            name: safeString(parent.name) || nestedPayloadBase.name,
            roadmaps: [updatedNested],
            ...(Array.isArray(parent.divisions) ? { divisions: parent.divisions } : {}),
          } as any);
        }
        setFeedback("Roadmap updated successfully.");
        router.push("/director/revitalization-roadmap");
        return;
      }

      // CASE 2: Phase roadmap (mobile: nested template is one of parent.roadmaps)
      if (roadmapType === "phase") {
        if (!isEditMode) {
          await apiAddNestedRoadmapItem(roadmapId, nestedPayloadBase as any, bannerFile ?? undefined);
          setFeedback("Phase created successfully.");
          router.push("/director/revitalization-roadmap");
          return;
        }
        const updatedRoadmaps =
          parent.roadmaps?.map((n: any) => {
            if (String(n?._id) !== nestedRoadmapId) return n;
            return {
              _id: n._id,
              ...nestedPayloadBase,
              meetings: n.meetings || [],
              status: n.status || "not started",
            };
          }) || [];
        if (bannerFile && nestedRoadmapId) {
          const updatedOne = updatedRoadmaps.find((x: any) => String(x?._id) === nestedRoadmapId);
          await apiUpdateNestedRoadmapItem(roadmapId, nestedRoadmapId, updatedOne ?? (nestedPayloadBase as any), bannerFile);
        } else {
          await apiUpdateRoadmap(roadmapId, {
            name: safeString(parent.name) || nestedPayloadBase.name,
            roadmaps: updatedRoadmaps,
            ...(Array.isArray(parent.divisions) ? { divisions: parent.divisions } : {}),
          } as any);
        }
        setFeedback("Phase updated successfully.");
        router.push("/director/revitalization-roadmap");
        return;
      }
    } catch (e: any) {
      console.error(e);
      setError(e?.response?.data?.message || e?.message || "Failed to save roadmap.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={directorPageRoot}>
        <DirectorHero
          title={isEditMode ? "Edit roadmap" : "Create roadmap"}
          subtitle="Loading…"
          image={null as any}
          breadcrumbItems={[
            { label: "Home", href: "/director/home" },
            { label: "Revitalization Roadmap", href: "/director/revitalization-roadmap" },
            { label: "Roadmap form" },
          ]}
        />
        <main className="flex flex-1 items-center justify-center px-4 pb-24">
          <div className={directorSpinner} />
        </main>
      </div>
    );
  }

  return (
    <div className={directorPageRoot}>
      <DirectorHero
        title={isEditMode ? "Edit roadmap" : "Create roadmap"}
        subtitle="Mobile parity: verbiage + extras saved onto nested roadmap templates"
        image={null as any}
        breadcrumbItems={[
          { label: "Home", href: "/director/home" },
          { label: "Revitalization Roadmap", href: "/director/revitalization-roadmap" },
          { label: "Roadmap form" },
        ]}
      />

      <main className="flex-1 pb-12">
        <div className={`${directorPageContainer} max-w-4xl`}>
          {error ? (
            <div className={`${directorGlassCard} mb-6 p-4 text-sm text-red-200`}>{error}</div>
          ) : null}
          {feedback ? (
            <div className={`${directorGlassCard} mb-6 p-4 text-sm text-emerald-200`}>{feedback}</div>
          ) : null}

          <div className={`${directorGlassCard} p-6`}>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                <i className="fa-solid fa-arrow-left text-xs" /> Back
              </button>
              <div className="text-xs text-white/60">
                {roadmapType === "phase" ? "Phase task template" : "Single roadmap template"}
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/70">
                  Banner image (optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0] || null;
                    if (!f) return;
                    setBannerFile(f);
                    setBannerPreview(URL.createObjectURL(f));
                  }}
                  className="text-sm text-white/80 file:mr-3 file:rounded-lg file:border-0 file:bg-[#8ec5eb]/20 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white hover:file:bg-[#8ec5eb]/30"
                />
                {bannerPreview ? (
                  <p className="mt-2 text-xs text-white/60">Selected: {bannerFile?.name || "image"}</p>
                ) : null}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/70">
                  Church Roadmap Verbiage <span className="text-red-300">*</span>
                </label>
                <textarea
                  value={churchVerbiage}
                  onChange={(e) => setChurchVerbiage(e.target.value)}
                  rows={4}
                  className={`${directorInputClass} min-h-[120px] resize-y`}
                  placeholder="Enter verbiage"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/70">
                  Description Verbiage <span className="text-red-300">*</span>
                </label>
                <textarea
                  value={descriptionVerbiage}
                  onChange={(e) => setDescriptionVerbiage(e.target.value)}
                  rows={4}
                  className={`${directorInputClass} min-h-[120px] resize-y`}
                  placeholder="Enter description verbiage"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/70">
                  Tasks & Custom Fields
                </label>
                <p className="mb-2 text-xs text-white/50">
                  This saves to the roadmap template’s <span className="text-white/80 font-semibold">extras</span>{" "}
                  array (same API field as mobile).
                </p>
                <div className="rounded-xl border border-white/15 bg-white/5 p-4">
                  <div className="flex flex-wrap gap-2">
                    {[
                      ["text", "Text Field"],
                      ["textarea", "Text Area"],
                      ["upload", "Upload"],
                      ["datepicker", "Date Picker"],
                      ["assessment", "Assessment"],
                      ["checkbox_item", "Check Box"],
                      ["text_display", "Text Display"],
                      ["digital_signature", "Digital Signature"],
                      ["section", "Section"],
                    ].map(([k, label]) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => openFieldModal(k)}
                        className="rounded-full border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/15"
                      >
                        + {label}
                      </button>
                    ))}
                  </div>

                  <div className="mt-4 space-y-3">
                    {customFields.filter((f) => !f.parentSectionId).length === 0 ? (
                      <p className="text-sm text-white/60">No fields yet. Add one above.</p>
                    ) : (
                      customFields
                        .filter((f) => !f.parentSectionId)
                        .map((f) => {
                          const nested = customFields.filter((nf) => nf.parentSectionId === f.id);
                          return (
                            <div key={f.id} className="rounded-lg border border-white/15 bg-white/5 p-4">
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-white">
                                    {f.type === "text" ? "Text Field" :
                                     f.type === "textarea" ? "Text Area" :
                                     f.type === "upload" ? "Upload" :
                                     f.type === "datepicker" ? "Date Picker" :
                                     f.type === "assessment" ? "Assessment" :
                                     f.type === "checkbox_item" ? "Check Box" :
                                     f.type === "text_display" ? "Text Display" :
                                     f.type === "digital_signature" ? "Digital Signature" :
                                     f.type === "section" ? "Section" : f.type}
                                  </p>
                                  <p className="mt-1 text-xs text-white/65 break-words">
                                    {f.type === "text" || f.type === "textarea"
                                      ? (f.label || "—")
                                      : f.type === "upload"
                                        ? (f.buttonLabel || "—")
                                        : f.type === "datepicker"
                                          ? (f.label || "—")
                                          : f.type === "assessment"
                                            ? (f.selectedAssessment || "—")
                                            : f.type === "checkbox_item"
                                              ? (f.name || "—")
                                              : f.type === "text_display"
                                                ? (f.name || "—")
                                                : f.type === "digital_signature"
                                                  ? (f.fieldName || "—")
                                                  : f.type === "section"
                                                    ? (f.name || "—")
                                                    : "—"}
                                  </p>
                                  {f.type === "section" ? (
                                    <p className="mt-2 text-xs text-white/55">
                                      Nested fields: {nested.length}
                                    </p>
                                  ) : null}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {f.type === "section" ? (
                                    <button
                                      type="button"
                                      onClick={() => openFieldModal("text", { parentSectionId: f.id })}
                                      className="rounded-md border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/15"
                                    >
                                      + Nested
                                    </button>
                                  ) : null}
                                  <button
                                    type="button"
                                    onClick={() => openFieldModal(f.type, { fieldId: f.id })}
                                    className="rounded-md border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/15"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => deleteField(f.id)}
                                    className="rounded-md border border-red-400/40 bg-red-500/15 px-3 py-1.5 text-xs font-semibold text-red-200 hover:bg-red-500/25"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>

                              {f.type === "section" && nested.length > 0 ? (
                                <div className="mt-3 space-y-2 border-t border-white/10 pt-3">
                                  {nested.map((nf) => (
                                    <div key={nf.id} className="flex items-center justify-between gap-3 rounded-md border border-white/10 bg-white/5 px-3 py-2">
                                      <div className="min-w-0">
                                        <p className="text-xs font-semibold text-white/90">{nf.type}</p>
                                        <p className="text-xs text-white/60 truncate">
                                          {nf.label || nf.name || nf.buttonLabel || "—"}
                                        </p>
                                      </div>
                                      <div className="flex gap-2">
                                        <button
                                          type="button"
                                          onClick={() => openFieldModal(nf.type, { fieldId: nf.id, parentSectionId: f.id })}
                                          className="rounded-md border border-white/15 bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-white/15"
                                        >
                                          Edit
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => deleteField(nf.id)}
                                          className="rounded-md border border-red-400/40 bg-red-500/15 px-2.5 py-1 text-[11px] font-semibold text-red-200 hover:bg-red-500/25"
                                        >
                                          Delete
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : null}
                            </div>
                          );
                        })
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => router.back()}
                  disabled={submitting}
                  className="rounded-xl border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/15 disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="rounded-xl border border-[#8ec5eb]/50 bg-[#8ec5eb]/20 px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#8ec5eb]/30 disabled:opacity-60"
                >
                  {submitting ? "Saving…" : isEditMode ? "Update roadmap" : "Create roadmap"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {fieldModalOpen ? (
        <>
          <div className="fixed inset-0 z-[90] bg-black/55" onClick={closeFieldModal} />
          <div className="fixed left-1/2 top-1/2 z-[91] w-[92vw] max-w-[720px] -translate-x-1/2 -translate-y-1/2">
            <div className={`${directorGlassCard} p-5 sm:p-6`}>
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {editingFieldId ? "Edit field" : "Add field"}
                  </h3>
                  <p className="mt-1 text-xs text-white/60">
                    Mobile parity field builder (saved into `extras`).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeFieldModal}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-white/80 transition hover:bg-white/10 hover:text-white"
                >
                  <i className="fa-solid fa-xmark text-sm" />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {(fieldType === "text" || fieldType === "textarea") ? (
                  <>
                    <div className="sm:col-span-2">
                      <label className="mb-1.5 block text-xs font-medium text-white/70">Label</label>
                      <input
                        value={fieldDraft.label ?? ""}
                        onChange={(e) => setFieldDraft((p) => ({ ...p, label: e.target.value }))}
                        className={directorInputClass}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1.5 block text-xs font-medium text-white/70">Placeholder (optional)</label>
                      <input
                        value={fieldDraft.placeholder ?? ""}
                        onChange={(e) => setFieldDraft((p) => ({ ...p, placeholder: e.target.value }))}
                        className={directorInputClass}
                      />
                    </div>
                  </>
                ) : null}

                {fieldType === "upload" ? (
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-xs font-medium text-white/70">Button label</label>
                    <input
                      value={fieldDraft.buttonLabel ?? ""}
                      onChange={(e) => setFieldDraft((p) => ({ ...p, buttonLabel: e.target.value }))}
                      className={directorInputClass}
                    />
                  </div>
                ) : null}

                {fieldType === "datepicker" ? (
                  <>
                    <div className="sm:col-span-2">
                      <label className="mb-1.5 block text-xs font-medium text-white/70">Label</label>
                      <input
                        value={fieldDraft.label ?? ""}
                        onChange={(e) => setFieldDraft((p) => ({ ...p, label: e.target.value }))}
                        className={directorInputClass}
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-white/70">Default date (optional)</label>
                      <input
                        type="date"
                        value={fieldDraft.date ?? ""}
                        onChange={(e) => setFieldDraft((p) => ({ ...p, date: e.target.value }))}
                        className={directorInputClass}
                        style={{ colorScheme: "dark" }}
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-white/70">Button name (optional)</label>
                      <input
                        value={fieldDraft.buttonName ?? ""}
                        onChange={(e) => setFieldDraft((p) => ({ ...p, buttonName: e.target.value }))}
                        className={directorInputClass}
                      />
                    </div>
                    <div className="sm:col-span-2 flex flex-wrap gap-4 pt-1">
                      <label className="inline-flex items-center gap-2 text-sm text-white/80">
                        <input
                          type="checkbox"
                          checked={!!fieldDraft.allowPastorSelect}
                          onChange={(e) => setFieldDraft((p) => ({ ...p, allowPastorSelect: e.target.checked }))}
                          className="h-4 w-4 accent-[#8ec5eb]"
                        />
                        Allow pastor to select Date
                      </label>
                      <label className="inline-flex items-center gap-2 text-sm text-white/80">
                        <input
                          type="checkbox"
                          checked={!!fieldDraft.showOnCard}
                          onChange={(e) => setFieldDraft((p) => ({ ...p, showOnCard: e.target.checked }))}
                          className="h-4 w-4 accent-[#8ec5eb]"
                        />
                        Show date on info card
                      </label>
                    </div>
                  </>
                ) : null}

                {fieldType === "assessment" ? (
                  <>
                    <div className="sm:col-span-2">
                      <label className="mb-1.5 block text-xs font-medium text-white/70">Assessment</label>
                      <select
                        value={fieldDraft.assessmentId ?? ""}
                        onChange={(e) => {
                          const id = e.target.value;
                          const hit = assessments.find((a) => a.id === id);
                          setFieldDraft((p) => ({ ...p, assessmentId: id, selectedAssessment: hit?.name || "" }));
                        }}
                        className={directorInputClass}
                      >
                        <option value="">Select assessment</option>
                        {assessments.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-white/70">Button name (optional)</label>
                      <input
                        value={fieldDraft.buttonName ?? ""}
                        onChange={(e) => setFieldDraft((p) => ({ ...p, buttonName: e.target.value }))}
                        className={directorInputClass}
                        placeholder="Take Assessment"
                      />
                    </div>
                    <div className="flex items-end">
                      <label className="inline-flex items-center gap-2 text-sm text-white/80">
                        <input
                          type="checkbox"
                          checked={!!fieldDraft.scheduleMeeting}
                          onChange={(e) => setFieldDraft((p) => ({ ...p, scheduleMeeting: e.target.checked }))}
                          className="h-4 w-4 accent-[#8ec5eb]"
                        />
                        Schedule Meeting after the Assessment
                      </label>
                    </div>
                  </>
                ) : null}

                {fieldType === "checkbox_item" ? (
                  <>
                    <div className="sm:col-span-2">
                      <label className="mb-1.5 block text-xs font-medium text-white/70">Name</label>
                      <input
                        value={fieldDraft.name ?? ""}
                        onChange={(e) => setFieldDraft((p) => ({ ...p, name: e.target.value }))}
                        className={directorInputClass}
                      />
                    </div>
                    <div className="sm:col-span-2 flex flex-wrap items-center justify-between gap-3">
                      <label className="inline-flex items-center gap-2 text-sm text-white/80">
                        <input
                          type="checkbox"
                          checked={!!fieldDraft.haveButton}
                          onChange={(e) => setFieldDraft((p) => ({ ...p, haveButton: e.target.checked }))}
                          className="h-4 w-4 accent-[#8ec5eb]"
                        />
                        Have button
                      </label>
                      {fieldDraft.haveButton ? (
                        <div className="w-full sm:w-auto sm:flex-1">
                          <input
                            value={fieldDraft.buttonName ?? ""}
                            onChange={(e) => setFieldDraft((p) => ({ ...p, buttonName: e.target.value }))}
                            className={directorInputClass}
                            placeholder="Button name"
                          />
                        </div>
                      ) : null}
                    </div>
                  </>
                ) : null}

                {fieldType === "text_display" ? (
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-xs font-medium text-white/70">Text</label>
                    <textarea
                      value={fieldDraft.name ?? ""}
                      onChange={(e) => setFieldDraft((p) => ({ ...p, name: e.target.value }))}
                      rows={4}
                      className={`${directorInputClass} min-h-[110px] resize-y`}
                    />
                  </div>
                ) : null}

                {fieldType === "digital_signature" ? (
                  <>
                    <div className="sm:col-span-2">
                      <label className="mb-1.5 block text-xs font-medium text-white/70">Field name</label>
                      <input
                        value={fieldDraft.fieldName ?? ""}
                        onChange={(e) => setFieldDraft((p) => ({ ...p, fieldName: e.target.value }))}
                        className={directorInputClass}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1.5 block text-xs font-medium text-white/70">Placeholder</label>
                      <input
                        value={fieldDraft.placeholderText ?? ""}
                        onChange={(e) => setFieldDraft((p) => ({ ...p, placeholderText: e.target.value }))}
                        className={directorInputClass}
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-white/70">Clear button label</label>
                      <input
                        value={fieldDraft.clearButtonLabel ?? ""}
                        onChange={(e) => setFieldDraft((p) => ({ ...p, clearButtonLabel: e.target.value }))}
                        className={directorInputClass}
                      />
                    </div>
                    <div className="flex items-end gap-4">
                      <label className="inline-flex items-center gap-2 text-sm text-white/80">
                        <input
                          type="checkbox"
                          checked={!!fieldDraft.required}
                          onChange={(e) => setFieldDraft((p) => ({ ...p, required: e.target.checked }))}
                          className="h-4 w-4 accent-[#8ec5eb]"
                        />
                        Required
                      </label>
                      <label className="inline-flex items-center gap-2 text-sm text-white/80">
                        <input
                          type="checkbox"
                          checked={!!fieldDraft.showOnInfoCard}
                          onChange={(e) => setFieldDraft((p) => ({ ...p, showOnInfoCard: e.target.checked }))}
                          className="h-4 w-4 accent-[#8ec5eb]"
                        />
                        Show on info card
                      </label>
                    </div>
                  </>
                ) : null}

                {fieldType === "section" ? (
                  <>
                    <div className="sm:col-span-2">
                      <label className="mb-1.5 block text-xs font-medium text-white/70">Section name</label>
                      <input
                        value={fieldDraft.name ?? ""}
                        onChange={(e) => setFieldDraft((p) => ({ ...p, name: e.target.value }))}
                        className={directorInputClass}
                      />
                    </div>
                    <div className="sm:col-span-2 flex flex-wrap items-center justify-between gap-3">
                      <label className="inline-flex items-center gap-2 text-sm text-white/80">
                        <input
                          type="checkbox"
                          checked={!!fieldDraft.showDuplicateButton}
                          onChange={(e) => setFieldDraft((p) => ({ ...p, showDuplicateButton: e.target.checked }))}
                          className="h-4 w-4 accent-[#8ec5eb]"
                        />
                        Show “Add section steps” button
                      </label>
                      {fieldDraft.showDuplicateButton ? (
                        <div className="w-full sm:w-auto sm:flex-1">
                          <input
                            value={fieldDraft.buttonName ?? ""}
                            onChange={(e) => setFieldDraft((p) => ({ ...p, buttonName: e.target.value }))}
                            className={directorInputClass}
                            placeholder="Add section steps"
                          />
                        </div>
                      ) : null}
                    </div>
                  </>
                ) : null}
              </div>

              <div className="mt-6 flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={closeFieldModal}
                  className="rounded-xl border border-white/20 bg-white/10 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveFieldDraft}
                  className="rounded-xl border border-[#8ec5eb]/50 bg-[#8ec5eb]/20 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#8ec5eb]/30"
                >
                  {editingFieldId ? "Save" : "Add"}
                </button>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

