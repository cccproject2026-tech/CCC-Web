"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DirectorHero from "../../DirectorHero";
import {
  directorBtnPrimary,
  directorBtnSecondary,
  directorGlassCard,
  directorInputClass,
  directorLabelClass,
  directorPageContainer,
  directorPageRoot,
  directorSpinner,
} from "../../directorUi";
import {
  apiAddNestedRoadmapItem,
  apiGetAssessments,
  apiGetNestedRoadmapItem,
  apiGetRoadmapById,
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

/** Same as creation editor — APIs may return `roadMapDetails` as `string` or `{ en: "..." }`. */
function roadmapDetailText(raw: unknown): string {
  if (raw == null) return "";
  if (typeof raw === "string") return raw.trim();
  if (typeof raw === "object" && raw !== null) {
    const o = raw as Record<string, unknown>;
    if (typeof o.en === "string" && o.en.trim()) return o.en.trim();
    if (typeof o.text === "string" && o.text.trim()) return o.text.trim();
  }
  const s = String(raw).trim();
  return s && s !== "[object Object]" ? s : "";
}

function roadmapChildrenFromDoc(doc: RoadmapDoc | null): any[] {
  if (!doc?.roadmaps) return [];
  const r = doc.roadmaps as unknown;
  if (Array.isArray(r)) return r;
  if (r && typeof r === "object" && Array.isArray((r as { items?: unknown[] }).items)) {
    return (r as { items: any[] }).items;
  }
  return [];
}

/** GET /roadmaps/:id/nested/:nestedId — same unwrap as roadmap-creation (canonical nested fields). */
function unwrapNestedRoadmapItem(res: unknown): any | null {
  if (!res || typeof res !== "object") return null;
  const r = res as Record<string, unknown>;
  const data = (r as { data?: unknown }).data;
  if (data && typeof data === "object" && !Array.isArray(data)) {
    const inner = data as Record<string, unknown>;
    if (inner.data && typeof inner.data === "object") return inner.data;
    return data;
  }
  return (r as { data?: unknown }).data ?? null;
}

function safeDecodeURIComponent(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

function formatRoadmapPreviewDate(iso?: string): string {
  if (!iso?.trim()) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function fieldBlockTitle(f: any): string {
  switch (f.type) {
    case "upload":
      return f.buttonLabel?.trim() ? String(f.buttonLabel) : "Upload Strategy";
    case "datepicker":
      return f.label?.trim() ? String(f.label) : "Follow up Event Date";
    case "text":
      return f.label?.trim() ? String(f.label) : "Text Field";
    case "textarea":
      return f.label?.trim() ? String(f.label) : "Description";
    case "assessment":
      return typeof f.selectedAssessment === "object"
        ? f.selectedAssessment?.name || "Assessment"
        : f.selectedAssessment || "Assessment";
    case "checkbox_item":
      return f.name?.trim() ? String(f.name) : "Check Box";
    case "text_display":
      return "Text Display";
    case "digital_signature":
      return f.fieldName?.trim() ? String(f.fieldName) : "Digital Signature";
    case "section":
      return f.name?.trim() ? String(f.name) : "Section";
    default:
      return "Field";
  }
}

function fieldBlockIcon(type: string): string {
  switch (type) {
    case "upload":
      return "fa-solid fa-cloud-arrow-up";
    case "datepicker":
      return "fa-regular fa-calendar";
    case "assessment":
      return "fa-solid fa-clipboard-check";
    case "section":
      return "fa-solid fa-layer-group";
    default:
      return "fa-solid fa-pen-to-square";
  }
}

const fieldSectionEditBtn =
  "inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-[12px] font-semibold text-[#1F2A6E] shadow-sm transition hover:bg-white/90";
const fieldSectionRemoveBtn =
  "inline-flex items-center gap-1.5 rounded-lg border border-white/40 bg-transparent px-3 py-2 text-[12px] font-semibold text-white transition hover:bg-white/10";

function RoadmapFieldPreview({ f }: { f: Record<string, any> }) {
  switch (f.type) {
    case "upload":
      return (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/35 bg-white/[0.04] px-6 py-12 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-white/25 bg-white/10">
            <span className="text-2xl font-light leading-none text-[#8ec5eb]">+</span>
          </div>
          <p className="text-sm font-medium text-white/90">
            Drag & Drop or Click here to choose file
          </p>
          <p className="mt-1 text-xs text-white/50">Max file size : 10 MB</p>
        </div>
      );
    case "datepicker":
      return (
        <div className="space-y-3">
          <div className="flex items-center gap-3 rounded-lg border border-white/20 bg-white/10 px-4 py-3">
            <i className="fa-regular fa-calendar text-lg text-[#8ec5eb]" />
            <span className="text-[15px] text-white">
              {formatRoadmapPreviewDate(f.date)}
            </span>
          </div>
          <div className="space-y-2 pl-0.5">
            <label className="flex cursor-default items-center gap-2.5 text-sm text-white/90">
              <input
                type="checkbox"
                checked={!!f.allowPastorSelect}
                readOnly
                tabIndex={-1}
                className="h-4 w-4 accent-[#8ec5eb]"
              />
              Allow Pastor to Select Date
            </label>
            <label className="flex cursor-default items-center gap-2.5 text-sm text-white/90">
              <input
                type="checkbox"
                checked={!!f.showOnCard}
                readOnly
                tabIndex={-1}
                className="h-4 w-4 accent-[#8ec5eb]"
              />
              Show on Card
            </label>
          </div>
        </div>
      );
    case "text":
      return (
        <div className="rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-[15px] text-white/90">
          {f.label || "—"}
        </div>
      );
    case "textarea":
      return (
        <div className="min-h-[100px] whitespace-pre-wrap rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-[14px] leading-relaxed text-white/85">
          {f.placeholder || f.label || "—"}
        </div>
      );
    case "assessment": {
      const nm =
        typeof f.selectedAssessment === "object"
          ? f.selectedAssessment?.name
          : f.selectedAssessment;
      return (
        <div className="flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-[15px] text-white/90">
          <i className="fa-solid fa-clipboard-check text-[#8ec5eb]" />
          <span>{nm || "—"}</span>
        </div>
      );
    }
    case "checkbox_item":
      return (
        <label className="flex cursor-default items-center gap-2.5 text-sm text-white/90">
          <input type="checkbox" readOnly className="h-4 w-4 accent-[#8ec5eb]" />
          {f.name || "—"}
        </label>
      );
    case "text_display":
      return (
        <div className="whitespace-pre-wrap rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-sm text-white/80">
          {f.name || "—"}
        </div>
      );
    case "digital_signature":
      return (
        <div className="rounded-lg border border-dashed border-white/30 bg-white/[0.04] px-4 py-8 text-center text-sm text-white/55">
          {f.fieldName || "Signature"} — {f.placeholderText || "Sign here"}
        </div>
      );
    case "section":
      return (
        <p className="text-sm text-white/55">
          Section container — add nested fields with &quot;+ Nested field&quot;.
        </p>
      );
    default:
      return null;
  }
}

export default function DirectorRoadmapFormPage() {
  const router = useRouter();
  const sp = useSearchParams();

  const roadmapId = sp.get("roadmapId")?.trim() || "";
  const nestedRoadmapId = sp.get("nestedRoadmapId")?.trim() || "";
  const roadmapType = (sp.get("type") as "single" | "phase" | null) || "single";
  const isEditMode = sp.get("isEditMode") === "true";
  /** Phase list “View” — read-only task template; requires isEditMode so nested data loads from API. */
  const viewOnly = isEditMode && sp.get("viewOnly") === "true";

  const roadmapData = useMemo(
    () => ({
      name: safeString(sp.get("name") || ""),
      subheading: safeString(sp.get("subheading") || ""),
      longDescription: safeString(sp.get("longDescription") || ""),
      completionTime: safeString(sp.get("completionTime") || ""),
      selectedDivision: safeString(sp.get("selectedDivision") || "All") || "All",
      bannerImage: safeString(sp.get("bannerImage") || ""),
    }),
    [sp],
  );

  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const bannerInputRef = useRef<HTMLInputElement | null>(null);

  const [parent, setParent] = useState<RoadmapDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /** Nested template title (phase / single row) — editable on this page; not the parent library name. */
  const [nestedItemTitle, setNestedItemTitle] = useState("");
  const [churchVerbiage, setChurchVerbiage] = useState("");
  const [descriptionVerbiage, setDescriptionVerbiage] = useState("");
  const [customFields, setCustomFields] = useState<any[]>([]);
  const [assessments, setAssessments] = useState<Array<{ id: string; name: string }>>([]);

  const [submitting, setSubmitting] = useState(false);
  /** Shown as fixed bottom toast; then navigate to library (replacing immediate `router.push` which hid the message). */
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const saveNavTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const goToAfterSavePage = useCallback(() => {
    if (roadmapType === "phase" && roadmapId) {
      router.push(
        `/director/revitalization-roadmap/phase-list?roadmapId=${encodeURIComponent(roadmapId)}`,
      );
      return;
    }
    router.push("/director/revitalization-roadmap");
  }, [router, roadmapId, roadmapType]);

  const dismissSaveToast = useCallback(() => {
    if (saveNavTimerRef.current) {
      clearTimeout(saveNavTimerRef.current);
      saveNavTimerRef.current = null;
    }
    setSaveToast(null);
    goToAfterSavePage();
  }, [goToAfterSavePage]);

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
  const [fieldModalError, setFieldModalError] = useState<string | null>(null);
  const [openNestedPickerSectionId, setOpenNestedPickerSectionId] = useState<string | null>(null);

  const heroTitle = useMemo(() => {
    if (!isEditMode) return "Roadmap";
    if (nestedItemTitle.trim()) return nestedItemTitle.trim();
    return safeDecodeURIComponent(roadmapData.name.trim()) || "Roadmap";
  }, [isEditMode, nestedItemTitle, roadmapData.name]);

  const heroImageSrc = !isEditMode
    ? bannerPreview || null
    : bannerPreview || (roadmapData.bannerImage?.trim() ? roadmapData.bannerImage : null);

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
          });
          break;
        case "SECTION":
          fields.push({
            id: fieldId,
            type: "section",
            name: extra.name,
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
            };
          case "section": {
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
                  return { type: "ASSESSMENT", name: nm || "Assessment", assessmentId: nf.assessmentId || (typeof nf.selectedAssessment === "object" ? nf.selectedAssessment?.id : undefined), ...(cbs.length ? { checkboxes: cbs } : {}) };
                }
                return null;
              })
              .filter(Boolean);
            return {
              type: "SECTION",
              name: field.name || "Section",
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
      setFieldDraft(type === "assessment" ? { type, scheduleMeeting: true } : { type });
    }
    setFieldModalError(null);
    setFieldModalOpen(true);
  };

  const closeFieldModal = () => {
    setFieldModalOpen(false);
    setFieldParentSectionId(null);
    setEditingFieldId(null);
    setFieldDraft({});
    setFieldModalError(null);
    setOpenNestedPickerSectionId(null);
  };

  const validateFieldDraft = (): string | null => {
    switch (fieldType) {
      case "text":
      case "textarea":
        if (!String(fieldDraft.label ?? "").trim()) return "Label is required.";
        return null;
      case "upload":
        if (!String(fieldDraft.buttonLabel ?? "").trim()) return "Button label is required.";
        return null;
      case "datepicker":
        if (!String(fieldDraft.label ?? "").trim()) return "Label is required.";
        return null;
      case "assessment":
        if (!String(fieldDraft.assessmentId ?? "").trim()) return "Please select an assessment.";
        return null;
      case "checkbox_item":
        if (!String(fieldDraft.name ?? "").trim()) return "Name is required.";
        if (fieldDraft.haveButton && !String(fieldDraft.buttonName ?? "").trim()) {
          return "Button name is required when \"Have button\" is enabled.";
        }
        return null;
      case "text_display":
        if (!String(fieldDraft.name ?? "").trim()) return "Text is required.";
        return null;
      case "digital_signature":
        if (!String(fieldDraft.fieldName ?? "").trim()) return "Field name is required.";
        if (!String(fieldDraft.placeholderText ?? "").trim()) return "Placeholder is required.";
        return null;
      case "section":
        if (!String(fieldDraft.name ?? "").trim()) return "Section name is required.";
        return null;
      default:
        return null;
    }
  };

  const saveFieldDraft = () => {
    const validationError = validateFieldDraft();
    if (validationError) {
      setFieldModalError(validationError);
      return;
    }
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

  const onBannerFileChange = (file?: File | null) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setBannerPreview(url);
    setBannerFile(file);
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

        /** New nested template: start with empty verbiage/description so directors fill them here (ignore URL carry-over). */
        if (!isEditMode) {
          const fromUrlTitle = safeDecodeURIComponent(roadmapData.name.trim());
          setNestedItemTitle(fromUrlTitle);
          setChurchVerbiage("");
          setDescriptionVerbiage("");
          setCustomFields([]);
          if (roadmapData.bannerImage?.trim()) {
            setBannerPreview(roadmapData.bannerImage.trim());
            setBannerFile(null);
          } else {
            setBannerPreview(null);
            setBannerFile(null);
          }
          return;
        }

        // Mobile parity: editing uses extras from selected nested roadmap. Prefer GET /nested/:id
        // so name / verbiage / description match the server after edits on the phase list.
        const list = roadmapChildrenFromDoc(doc);
        const fromList =
          nestedRoadmapId
            ? list.find((r) => String((r as { _id?: string })._id) === nestedRoadmapId)
            : list[0];

        let fromNestedGet: any = null;
        if (nestedRoadmapId) {
          try {
            const nRes = await apiGetNestedRoadmapItem(roadmapId, nestedRoadmapId);
            if (!cancelled) {
              fromNestedGet = unwrapNestedRoadmapItem(nRes.data);
            }
          } catch (e) {
            console.error(e);
          }
        }
        if (
          fromNestedGet &&
          String((fromNestedGet as { _id?: string })._id) !== String(nestedRoadmapId)
        ) {
          fromNestedGet = null;
        }
        const nested =
          fromList && fromNestedGet
            ? { ...fromList, ...fromNestedGet }
            : fromNestedGet ?? fromList ?? null;
        const nTitle =
          (nested as { name?: string; title?: string } | null)?.name ||
          (nested as { name?: string; title?: string } | null)?.title;
        setNestedItemTitle(
          safeString(nTitle) || safeDecodeURIComponent(roadmapData.name.trim()),
        );
        const rmd =
          roadmapDetailText((nested as { roadMapDetails?: unknown } | null)?.roadMapDetails) ||
          roadmapDetailText((nested as { road_map_details?: unknown } | null)?.road_map_details);
        const ddesc = roadmapDetailText((nested as { description?: unknown } | null)?.description);
        setChurchVerbiage(rmd || "");
        setDescriptionVerbiage(ddesc || "");
        setCustomFields(transformExtrasToFields(((nested as any)?.extras || []) as any[]));

        // Mobile parity for banner: prefer param bannerImage; fall back to nested.imageUrl.
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
  }, [roadmapId, roadmapType, nestedRoadmapId, roadmapData, isEditMode]);

  useEffect(() => {
    if (!saveToast) return;
    saveNavTimerRef.current = window.setTimeout(() => {
      saveNavTimerRef.current = null;
      setSaveToast(null);
      goToAfterSavePage();
    }, 5000);
    return () => {
      if (saveNavTimerRef.current) {
        clearTimeout(saveNavTimerRef.current);
        saveNavTimerRef.current = null;
      }
    };
  }, [saveToast, goToAfterSavePage]);

  const handleSubmit = async () => {
    if (viewOnly) return;
    setSaveToast(null);
    setError(null);

    if (
      isEditMode &&
      (roadmapType === "phase" || roadmapType === "single") &&
      !nestedItemTitle.trim()
    ) {
      setError(roadmapType === "phase" ? "Please enter a phase name." : "Please enter a roadmap name.");
      return;
    }

    if (!churchVerbiage.trim() || !descriptionVerbiage.trim()) {
      setError("Please fill in Roadmap Verbiage and Description.");
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
        name:
          nestedItemTitle.trim() ||
          (roadmapData.name || "").trim() ||
          churchVerbiage.trim() ||
          safeString(parent.name) ||
          "Roadmap",
        roadMapDetails: churchVerbiage.trim() || roadmapData.subheading || "",
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
          setSaveToast("Roadmap created successfully.");
          return;
        }
        const existing = parent.roadmaps?.[0];
        const updatedNested: any = {
          _id: existing?._id,
          ...nestedPayloadBase,
          meetings: (existing as any)?.meetings || [],
          status: (existing as any)?.status || "not started",
        };
        if (!existing?._id) throw new Error("Missing nested roadmap id for save.");
        await apiUpdateNestedRoadmapItem(roadmapId, String(existing._id), updatedNested, bannerFile ?? undefined);
        setSaveToast("Roadmap updated successfully.");
        return;
      }

      // CASE 2: Phase roadmap (mobile: nested template is one of parent.roadmaps)
      if (roadmapType === "phase") {
        if (!isEditMode) {
          await apiAddNestedRoadmapItem(roadmapId, nestedPayloadBase as any, bannerFile ?? undefined);
          setSaveToast("Phase created successfully.");
          return;
        }
        if (!nestedRoadmapId) throw new Error("Missing nested roadmap id for phase save.");
        const existing = parent.roadmaps?.find((n: any) => String(n?._id) === nestedRoadmapId);
        const updatedOne: any = {
          _id: existing?._id || nestedRoadmapId,
          ...nestedPayloadBase,
          meetings: existing?.meetings || [],
          status: existing?.status || "not started",
        };
        await apiUpdateNestedRoadmapItem(roadmapId, nestedRoadmapId, updatedOne, bannerFile ?? undefined);
        setSaveToast("Phase updated successfully.");
        return;
      }
    } catch (e: any) {
      console.error(e);
      setError(e?.response?.data?.message || e?.message || "Failed to save roadmap.");
    } finally {
      setSubmitting(false);
    }
  };

  const breadcrumbItems = [
    { label: "Home", href: "/director/home" },
    { label: "Revitalization Roadmap", href: "/director/revitalization-roadmap" },
    { label: viewOnly ? "View tasks" : isEditMode ? "Edit roadmap" : "Roadmap form" },
  ];

  if (loading) {
    return (
      <div className={directorPageRoot}>
        <DirectorHero
          title={heroTitle}
          subtitle="Loading…"
          image={heroImageSrc || null}
          breadcrumbItems={breadcrumbItems}
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
        title={heroTitle}
        subtitle={
          isEditMode && roadmapData.completionTime
            ? `${roadmapData.completionTime} · ${roadmapType === "phase" ? "Phase" : "Single roadmap"}${viewOnly ? " · View only" : ""}`
            : viewOnly
              ? "View only"
              : undefined
        }
        image={heroImageSrc || null}
        breadcrumbItems={breadcrumbItems}
      />

      <main className="flex-1 pb-12 pt-2">
        <div className={`${directorPageContainer} px-4`}>
          <div className="mx-auto max-w-3xl">
            {error ? (
              <div className={`${directorGlassCard} mb-6 p-4 text-sm text-red-200`}>{error}</div>
            ) : null}
            <div className={`${directorGlassCard} p-6 sm:p-8`}>
              <div className="mb-8 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
                >
                  <i className="fa-solid fa-arrow-left mr-2 text-xs" /> Back
                </button>
              </div>

              <div className="space-y-8">
                {isEditMode && (roadmapType === "phase" || roadmapType === "single") && !viewOnly ? (
                  <div>
                    <label className={directorLabelClass} htmlFor="nested-item-title">
                      {roadmapType === "phase" ? "Phase name" : "Roadmap name"}{" "}
                      <span className="text-red-300">*</span>
                    </label>
                    <p className="mb-2 text-xs text-white/50">
                      {roadmapType === "phase"
                        ? "Title for this phase in the list and in the header above."
                        : "Title for this roadmap in the list and in the header above."}
                    </p>
                    <input
                      id="nested-item-title"
                      type="text"
                      value={nestedItemTitle}
                      onChange={(e) => setNestedItemTitle(e.target.value)}
                      className={directorInputClass}
                      autoComplete="off"
                      placeholder={roadmapType === "phase" ? "e.g. Self Revitalization Phase" : "Roadmap title"}
                    />
                  </div>
                ) : null}

                <div>
                  <label className={directorLabelClass}>
                    Roadmap Verbiage {!viewOnly ? <span className="text-red-300">*</span> : null}
                  </label>
                  <input
                    type="text"
                    value={churchVerbiage}
                    readOnly={viewOnly}
                    onChange={(e) => setChurchVerbiage(e.target.value)}
                    className={`${directorInputClass} ${viewOnly ? "cursor-default opacity-95" : ""}`}
                    placeholder="e.g. Attend a Jump-start Session in your area"
                  />
                </div>

                <div>
                  <label className={directorLabelClass}>
                    Description {!viewOnly ? <span className="text-red-300">*</span> : null}
                  </label>
                  <textarea
                    value={descriptionVerbiage}
                    readOnly={viewOnly}
                    onChange={(e) => setDescriptionVerbiage(e.target.value)}
                    rows={8}
                    className={`${directorInputClass} min-h-[180px] resize-y ${viewOnly ? "cursor-default opacity-95" : ""}`}
                    placeholder="Numbered or free-form description for this step…"
                  />
                </div>

                <div className="space-y-4">
                  {customFields
                    .filter((f) => !f.parentSectionId)
                    .map((f) => {
                      const nested = customFields.filter((nf) => nf.parentSectionId === f.id);
                      return (
                        <div key={f.id} className={`${directorGlassCard} p-5 sm:p-6`}>
                          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-2.5">
                              <i
                                className={`${fieldBlockIcon(f.type)} shrink-0 text-lg text-[#8ec5eb]`}
                                aria-hidden
                              />
                              <h3 className="truncate text-[15px] font-semibold text-white">
                                {fieldBlockTitle(f)}
                              </h3>
                            </div>
                            {!viewOnly ? (
                              <div className="flex flex-wrap gap-2">
                                {f.type === "section" ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setOpenNestedPickerSectionId((prev) => (prev === f.id ? null : f.id))
                                    }
                                    className={`${fieldSectionEditBtn} border border-[#8ec5eb]/70 bg-[#8ec5eb] text-[#0b2340] shadow-[0_4px_14px_rgba(142,197,235,0.35)] hover:bg-[#9fd0ef]`}
                                  >
                                    <i className="fa-solid fa-plus text-[11px]" /> Nested field
                                  </button>
                                ) : null}
                                <button
                                  type="button"
                                  onClick={() => openFieldModal(f.type, { fieldId: f.id })}
                                  className={fieldSectionEditBtn}
                                >
                                  <i className="fa-regular fa-pen-to-square text-[11px]" /> Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => deleteField(f.id)}
                                  className={fieldSectionRemoveBtn}
                                >
                                  Remove Field
                                </button>
                              </div>
                            ) : null}
                          </div>

                          <RoadmapFieldPreview f={f} />

                          {f.type === "section" && openNestedPickerSectionId === f.id && !viewOnly ? (
                            <div className="mt-4 rounded-xl border border-[#8ec5eb]/30 bg-[#8ec5eb]/10 px-3 py-3">
                              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#cde2f2]">
                                Insert nested field
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {[
                                  ["text", "Text Field"],
                                  ["textarea", "Text Area"],
                                  ["upload", "Upload"],
                                  ["datepicker", "Date Picker"],
                                  ["assessment", "Assessment"],
                                  ["checkbox_item", "Check Box"],
                                  ["text_display", "Text Display"],
                                  ["digital_signature", "Signature"],
                                  ["section", "Section"],
                                ].map(([k, label]) => (
                                  <button
                                    key={`nested-${f.id}-${k}`}
                                    type="button"
                                    onClick={() => {
                                      openFieldModal(k, { parentSectionId: f.id });
                                      setOpenNestedPickerSectionId(null);
                                    }}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/25 bg-white px-3 py-2 text-[11px] font-semibold text-[#1F2A6E] shadow-sm transition hover:bg-white/90 sm:text-[12px]"
                                  >
                                    <i className="fa-solid fa-plus text-[10px]" />
                                    {label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ) : null}

                          {f.type === "section" && nested.length > 0 ? (
                            <div className="mt-5 space-y-3 border-t border-white/10 pt-4">
                              {nested.map((nf) => (
                                <div
                                  key={nf.id}
                                  className="rounded-xl border border-white/10 bg-white/[0.06] p-4"
                                >
                                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                                    <span className="text-[13px] font-semibold text-white/90">
                                      {fieldBlockTitle(nf)}
                                    </span>
                                    {!viewOnly ? (
                                      <div className="flex gap-2">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            openFieldModal(nf.type, {
                                              fieldId: nf.id,
                                              parentSectionId: f.id,
                                            })
                                          }
                                          className={fieldSectionEditBtn}
                                        >
                                          <i className="fa-regular fa-pen-to-square text-[11px]" /> Edit
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => deleteField(nf.id)}
                                          className={fieldSectionRemoveBtn}
                                        >
                                          Remove Field
                                        </button>
                                      </div>
                                    ) : null}
                                  </div>
                                  <RoadmapFieldPreview f={nf} />
                                </div>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      );
                    })}

                  {!viewOnly ? (
                    <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#8ec5eb]/25 bg-[#8ec5eb]/10 px-4 py-3.5 sm:px-5">
                      <span className="text-[14px] font-semibold text-white/90">Insert Field</span>
                      <div className="flex flex-wrap justify-end gap-2">
                        {[
                          ["text", "Text Field"],
                          ["textarea", "Text Area"],
                          ["upload", "Upload"],
                          ["datepicker", "Date Picker"],
                          ["assessment", "Assessment"],
                          ["checkbox_item", "Check Box"],
                          ["text_display", "Text Display"],
                          ["digital_signature", "Signature"],
                          ["section", "Section"],
                        ].map(([k, label]) => (
                          <button
                            key={k}
                            type="button"
                            onClick={() => openFieldModal(k)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-white/25 bg-white px-3 py-2 text-[11px] font-semibold text-[#1F2A6E] shadow-sm transition hover:bg-white/90 sm:text-[12px]"
                          >
                            <i className="fa-solid fa-plus text-[10px]" />
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {!viewOnly ? (
                    <div>
                      <label className={directorLabelClass}>Banner image</label>
                      <div className="space-y-3">
                        <label
                          htmlFor="roadmap-banner-upload"
                          className={`relative block h-36 w-full overflow-hidden rounded-xl border sm:h-44 ${
                            heroImageSrc
                              ? "cursor-pointer border-white/20 bg-white/5"
                              : "cursor-pointer border-dashed border-[#8ec5eb]/45 bg-[#8ec5eb]/8 hover:bg-[#8ec5eb]/14"
                          }`}
                        >
                          {heroImageSrc ? (
                            <>
                              <img
                                src={heroImageSrc}
                                alt="Roadmap banner"
                                className="h-full w-full object-cover"
                              />
                              <div className="absolute inset-0 flex items-end justify-center bg-black/20 pb-3 text-xs font-semibold text-white/90">
                                Click to change image
                              </div>
                            </>
                          ) : (
                            <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-sm text-white/85">
                              <i className="fa-solid fa-cloud-arrow-up text-xl text-[#8ec5eb]" />
                              <span className="font-semibold">Upload image</span>
                              <span className="text-xs text-white/60">Click to choose banner image</span>
                            </div>
                          )}
                        </label>
                        <input
                          id="roadmap-banner-upload"
                          ref={bannerInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => onBannerFileChange(e.target.files?.[0] ?? null)}
                        />
                        <div className="flex flex-wrap gap-3">
                          {heroImageSrc ? (
                            <button
                              type="button"
                              onClick={() => {
                                setBannerPreview(null);
                                setBannerFile(null);
                              }}
                              className="rounded-xl border border-white/20 bg-white/8 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
                            >
                              Remove banner
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>

                {!viewOnly ? (
                  <div className="flex flex-wrap justify-end gap-3 border-t border-white/10 pt-6">
                    <button
                      type="button"
                      onClick={() => router.back()}
                      disabled={submitting}
                      className={`${directorBtnSecondary} px-8 disabled:opacity-60`}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={submitting}
                      className={`${directorBtnPrimary} border border-white/25 px-8 disabled:opacity-60`}
                    >
                      {submitting ? "Creating…" : "Create"}
                    </button>
                  </div>
                ) : null}
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
                </div>
                <span />
              </div>

              {fieldModalError ? (
                <div className="mb-4 rounded-lg border border-red-400/40 bg-red-500/15 px-3 py-2 text-sm text-red-100">
                  {fieldModalError}
                </div>
              ) : null}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {(fieldType === "text" || fieldType === "textarea") ? (
                  <>
                    <div className="sm:col-span-2">
                      <label className="mb-1.5 block text-xs font-medium text-white/70">Label</label>
                      <input
                        value={fieldDraft.label ?? ""}
                        onChange={(e) => {
                          setFieldDraft((p) => ({ ...p, label: e.target.value }));
                          if (fieldModalError) setFieldModalError(null);
                        }}
                        className={directorInputClass}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1.5 block text-xs font-medium text-white/70">Placeholder (optional)</label>
                      <input
                        value={fieldDraft.placeholder ?? ""}
                        onChange={(e) => {
                          setFieldDraft((p) => ({ ...p, placeholder: e.target.value }));
                          if (fieldModalError) setFieldModalError(null);
                        }}
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
                      onChange={(e) => {
                        setFieldDraft((p) => ({ ...p, buttonLabel: e.target.value }));
                        if (fieldModalError) setFieldModalError(null);
                      }}
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
                        onChange={(e) => {
                          setFieldDraft((p) => ({ ...p, label: e.target.value }));
                          if (fieldModalError) setFieldModalError(null);
                        }}
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
                    <div className="sm:col-span-2 flex flex-wrap gap-4 pt-1">
                      <label className="inline-flex items-center gap-2 text-sm text-white/80">
                        <input
                          type="checkbox"
                          checked={!!fieldDraft.allowPastorSelect}
                          onChange={(e) => setFieldDraft((p) => ({ ...p, allowPastorSelect: e.target.checked }))}
                          className="h-4 w-4 accent-[#8ec5eb]"
                        />
                        Allow Pastor to Select Date
                      </label>
                      <label className="inline-flex items-center gap-2 text-sm text-white/80">
                        <input
                          type="checkbox"
                          checked={!!fieldDraft.showOnCard}
                          onChange={(e) => setFieldDraft((p) => ({ ...p, showOnCard: e.target.checked }))}
                          className="h-4 w-4 accent-[#8ec5eb]"
                        />
                        Show on Card
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
                          if (fieldModalError) setFieldModalError(null);
                        }}
                        className={`${directorInputClass} text-white`}
                      >
                        <option value="" style={{ color: "#111", backgroundColor: "#fff" }}>
                          Select assessment
                        </option>
                        {assessments.map((a) => (
                          <option key={a.id} value={a.id} style={{ color: "#111", backgroundColor: "#fff" }}>
                            {a.name}
                          </option>
                        ))}
                      </select>
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
                        onChange={(e) => {
                          setFieldDraft((p) => ({ ...p, name: e.target.value }));
                          if (fieldModalError) setFieldModalError(null);
                        }}
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
                      onChange={(e) => {
                        setFieldDraft((p) => ({ ...p, name: e.target.value }));
                        if (fieldModalError) setFieldModalError(null);
                      }}
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
                        onChange={(e) => {
                          setFieldDraft((p) => ({ ...p, fieldName: e.target.value }));
                          if (fieldModalError) setFieldModalError(null);
                        }}
                        className={directorInputClass}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1.5 block text-xs font-medium text-white/70">Placeholder</label>
                      <input
                        value={fieldDraft.placeholderText ?? ""}
                        onChange={(e) => {
                          setFieldDraft((p) => ({ ...p, placeholderText: e.target.value }));
                          if (fieldModalError) setFieldModalError(null);
                        }}
                        className={directorInputClass}
                      />
                    </div>
                  </>
                ) : null}

                {fieldType === "section" ? (
                  <>
                    <div className="sm:col-span-2">
                      <label className="mb-1.5 block text-xs font-medium text-white/70">Section name</label>
                      <input
                        value={fieldDraft.name ?? ""}
                        onChange={(e) => {
                          setFieldDraft((p) => ({ ...p, name: e.target.value }));
                          if (fieldModalError) setFieldModalError(null);
                        }}
                        className={directorInputClass}
                      />
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

      {saveToast ? (
        <div
          className="pointer-events-none fixed inset-x-0 bottom-0 z-[90] flex justify-center px-4 pb-6 pt-10 sm:pb-8"
          aria-live="polite"
        >
          <div
            role="status"
            className="pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-2xl border border-emerald-400/35 bg-[#041f35]/98 px-4 py-4 shadow-[0_12px_40px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:items-center sm:gap-4 sm:px-5"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300">
              <i className="fa-solid fa-check text-base" aria-hidden />
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="text-[15px] font-semibold text-white">Saved</p>
              <p className="mt-1 text-sm leading-snug text-white/75">{saveToast}</p>
            </div>
            <button
              type="button"
              onClick={dismissSaveToast}
              className="shrink-0 rounded-lg p-2 text-white/50 transition hover:bg-white/10 hover:text-white"
              aria-label="Dismiss"
            >
              <i className="fa-solid fa-xmark text-lg" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

