"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
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
import AssessmentBg from "../../../Assets/assessment-bg.png";
import {
  apiGetAssessmentById,
  apiPatchAssessment,
  apiUpdateInstructions,
  apiUpdateSections,
  apiUploadAssessmentBanner,
  formatAssessmentApiErrorMessage,
  parseAssessmentDetailPayload,
} from "@/app/Services/assessment.service";
import { isRemoteImageSrc, resolveApiMediaUrl } from "@/app/utils/image";
import {
  buildPreSurveyPayloadForDirectorCreate,
  buildSectionsPayload,
  directorEditWizardToSection,
  mapAssessmentFromApi,
  newDirectorEditSection,
  sectionToDirectorEditWizard,
  WIZARD_LAYER_COUNT,
} from "@/app/Services/utils/assessment-mapper";

type PreSurveyRow = {
  id: number;
  text: string;
  type: "text" | "number";
  placeholder: string;
};

const defaultPreSurveyRow = (): PreSurveyRow => ({
  id: Date.now(),
  text: "",
  type: "number",
  placeholder: "Enter number",
});

function preSurveyFromApiDetail(raw: unknown): PreSurveyRow[] {
  const d = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : null;
  const arr = d?.preSurvey;
  if (!Array.isArray(arr) || arr.length === 0) {
    return [{ id: 1, text: "", type: "number", placeholder: "Enter number" }];
  }
  return arr.map((q: unknown, i: number) => {
    const qo = q && typeof q === "object" ? (q as Record<string, unknown>) : {};
    const t = String(qo.text ?? (qo as { question?: string }).question ?? "");
    const typ = qo.type === "text" ? "text" : "number";
    return {
      id: i + 1,
      text: t,
      type: typ,
      placeholder: String(qo.placeholder ?? " "),
    };
  });
}

export default function ViewEditAssessmentPage() {
  const router = useRouter();
  const params = useParams();
  const [toast, setToast] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [assessment, setAssessment] = useState<{
    id: string;
    name?: string;
    description?: string;
    type?: string;
    bannerImage?: string;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [assessmentName, setAssessmentName] = useState("");
  const [description, setDescription] = useState("");
  const [hasPreSurvey, setHasPreSurvey] = useState(false);
  const [instructions, setInstructions] = useState([""]);
  const [preSurveyRows, setPreSurveyRows] = useState<PreSurveyRow[]>([defaultPreSurveyRow()]);
  const [wizardSections, setWizardSections] = useState(
    [newDirectorEditSection()],
  );
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const bannerInputRef = useRef<HTMLInputElement | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const scrollToId = useCallback((id: string) => {
    if (typeof document === "undefined") return;
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  useEffect(() => {
    if (!params?.id) return;

    const fetchAssessment = async () => {
      setLoadError(false);
      try {
        const res = await apiGetAssessmentById(params.id as string);
        const rawBody = (res.data as { data?: unknown })?.data ?? res.data;
        const raw = parseAssessmentDetailPayload(rawBody);
        if (!raw) {
          console.error("Invalid assessment payload");
          setLoadError(true);
          return;
        }
        const mapped = mapAssessmentFromApi(raw);
        setAssessment({
          id: String(mapped.id ?? (raw as { _id?: string })._id ?? params.id),
          name: mapped.name,
          description: mapped.description,
          type: mapped.type,
          bannerImage: mapped.bannerImage,
        });
        setAssessmentName(mapped.name || "");
        setDescription(mapped.description || "");
        setHasPreSurvey(
          (mapped.type as string) === "CMA" || preSurveyFromApiDetail(raw).some((r) => r.text.trim().length > 0),
        );
        setInstructions(
          mapped.instructions.length > 0 ? mapped.instructions.map((i) => i.text) : [""],
        );
        setWizardSections(
          mapped.sections.length > 0
            ? mapped.sections.map(sectionToDirectorEditWizard)
            : [newDirectorEditSection()],
        );
        setPreSurveyRows(preSurveyFromApiDetail(raw));
        const mUrl = resolveApiMediaUrl(mapped.bannerImage) || "";
        if (mUrl) setBannerPreview(mUrl);
      } catch (error) {
        console.error("Failed to fetch assessment", error);
        setLoadError(true);
      }
    };

    void fetchAssessment();
  }, [params?.id]);

  useEffect(() => {
    return () => {
      if (bannerPreview?.startsWith("blob:")) URL.revokeObjectURL(bannerPreview);
    };
  }, [bannerPreview]);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 4000);
  };

  const handleAddInstruction = () => setInstructions([...instructions, ""]);
  const handleRemoveInstruction = (index: number) => {
    setInstructions((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  };
  const handleUpdateInstruction = (index: number, value: string) => {
    const u = [...instructions];
    u[index] = value;
    setInstructions(u);
  };

  const handleAddSection = () => setWizardSections((prev) => [...prev, newDirectorEditSection()]);

  const handleRemoveSection = (sectionIdx: number) => {
    setWizardSections((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== sectionIdx)));
  };

  const handleUpdateSection = (sectionIdx: number, field: string, value: unknown) => {
    setWizardSections((prev) => {
      const n = [...prev];
      n[sectionIdx] = { ...n[sectionIdx], [field]: value } as (typeof n)[0];
      return n;
    });
  };

  const handleUpdateLayerChoice = (
    sectionIdx: number,
    layerIdx: number,
    choiceIdx: number,
    value: string,
  ) => {
    setWizardSections((prev) => {
      const next = [...prev];
      const copy = { ...next[sectionIdx] };
      const layers = copy.layers.map((L, i) => {
        if (i !== layerIdx) return L;
        return {
          ...L,
          choices: L.choices.map((c, j) => (j === choiceIdx ? value : c)),
        };
      });
      copy.layers = layers;
      next[sectionIdx] = copy;
      return next;
    });
  };

  const handleAddLayerChoice = (sectionIdx: number, layerIdx: number) => {
    setWizardSections((prev) => {
      const n = [...prev];
      const copy = { ...n[sectionIdx] };
      const layers = [...copy.layers];
      const layer = { ...layers[layerIdx] };
      layer.choices = [...layer.choices, ""];
      layers[layerIdx] = layer;
      copy.layers = layers;
      n[sectionIdx] = copy;
      return n;
    });
  };

  const handleRemoveLayerChoice = (sectionIdx: number, layerIdx: number, choiceIdx: number) => {
    setWizardSections((prev) => {
      if (prev[sectionIdx]?.layers[layerIdx]?.choices.length <= 1) return prev;
      const next = [...prev];
      const copy = { ...next[sectionIdx] };
      const layers = [...copy.layers];
      const layer = { ...layers[layerIdx] };
      layer.choices = layer.choices.filter((_, j) => j !== choiceIdx);
      layers[layerIdx] = layer;
      copy.layers = layers;
      next[sectionIdx] = copy;
      return next;
    });
  };

  const handleUpdateLayerNotes = (sectionIdx: number, layerIdx: number, value: string) => {
    setWizardSections((prev) => {
      const next = [...prev];
      const copy = { ...next[sectionIdx] };
      const layers = copy.layers.map((L, i) => (i === layerIdx ? { ...L, notes: value } : L));
      copy.layers = layers;
      next[sectionIdx] = copy;
      return next;
    });
  };

  const handleUpdatePlanItem = (
    sectionIdx: number,
    planIdx: number,
    itemIdx: number,
    value: string,
  ) => {
    setWizardSections((prev) => {
      const next = [...prev];
      const copy = { ...next[sectionIdx] };
      const plans = [...copy.plans];
      const p = { ...plans[planIdx] };
      p.items = p.items.map((x, j) => (j === itemIdx ? value : x));
      plans[planIdx] = p;
      copy.plans = plans;
      next[sectionIdx] = copy;
      return next;
    });
  };

  const handleAddPlanItem = (sectionIdx: number, planIdx: number) => {
    setWizardSections((prev) => {
      const next = [...prev];
      const copy = { ...next[sectionIdx] };
      const plans = [...copy.plans];
      const p = { ...plans[planIdx], items: [...plans[planIdx].items, ""] };
      plans[planIdx] = p;
      copy.plans = plans;
      next[sectionIdx] = copy;
      return next;
    });
  };

  const handleRemovePlanItem = (sectionIdx: number, planIdx: number, itemIdx: number) => {
    setWizardSections((prev) => {
      if (prev[sectionIdx]?.plans[planIdx]?.items.length <= 1) return prev;
      const next = [...prev];
      const copy = { ...next[sectionIdx] };
      const plans = copy.plans.map((pl, i) => {
        if (i !== planIdx) return pl;
        return { ...pl, items: pl.items.filter((_, j) => j !== itemIdx) };
      });
      copy.plans = plans;
      next[sectionIdx] = copy;
      return next;
    });
  };

  const handleUpdatePreSurvey = (
    idx: number,
    field: keyof Pick<PreSurveyRow, "text" | "type" | "placeholder">,
    value: string,
  ) => {
    setPreSurveyRows((prev) => {
      const n = [...prev];
      if (field === "type" && (value === "text" || value === "number")) {
        n[idx] = { ...n[idx], type: value };
      } else if (field === "text" || field === "placeholder") {
        n[idx] = { ...n[idx], [field]: value };
      }
      return n;
    });
  };

  const handleAddPreSurveyQuestion = () => {
    setPreSurveyRows((prev) => [...prev, defaultPreSurveyRow()]);
  };
  const handleRemovePreSurveyQuestion = (idx: number) => {
    setPreSurveyRows((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx)));
  };

  const handleSaveChanges = async () => {
    if (!assessment?.id) return;
    setSaveSuccess(false);
    const name = assessmentName.trim();
    if (!name) {
      showToast("Please enter a name for this assessment.");
      scrollToId("edit-basics");
      return;
    }
    if (!description.trim()) {
      showToast("Add a short description (it appears on cards and the list).");
      scrollToId("edit-basics");
      return;
    }
    const instructionLines = instructions.map((i) => i.trim()).filter(Boolean);
    if (instructionLines.length === 0) {
      showToast("Add at least one line of instructions for people taking the survey.");
      scrollToId("edit-instructions");
      return;
    }
    const invalidSection = wizardSections.some(
      (s) =>
        s.layers.length !== WIZARD_LAYER_COUNT ||
        s.layers.some((l) => !l.choices.some((c) => c.trim())),
    );
    if (invalidSection) {
      showToast(
        `Each section needs ${WIZARD_LAYER_COUNT} steps (layers) and at least one filled-in answer choice on every step. Scroll to “Survey content” to fix it.`,
      );
      scrollToId("edit-content");
      return;
    }
    const preSurveyPayload = buildPreSurveyPayloadForDirectorCreate(preSurveyRows);
    if (hasPreSurvey && preSurveyPayload.length === 0) {
      showToast("Pre-survey is on — add at least one question with some text, or turn pre-survey off.");
      scrollToId("edit-pre");
      return;
    }

    const modelSections = wizardSections.map(directorEditWizardToSection);
    setSaving(true);
    try {
      if (bannerFile) {
        const res = await apiUploadAssessmentBanner(assessment.id, bannerFile);
        const body = res.data as Record<string, unknown> | undefined;
        let newUrl: string | undefined;
        if (body?.data != null && typeof body.data === "object" && body.data !== null) {
          const d = body.data as Record<string, unknown>;
          if (typeof d.bannerImage === "string") newUrl = d.bannerImage;
          else if (d.data != null && typeof d.data === "object" && d.data !== null) {
            const d2 = d.data as { bannerImage?: string };
            if (typeof d2.bannerImage === "string") newUrl = d2.bannerImage;
          }
        }
        if (!newUrl && typeof body?.bannerImage === "string") newUrl = body.bannerImage;
        if (typeof newUrl === "string" && newUrl.trim()) {
          setAssessment((a) => (a ? { ...a, bannerImage: newUrl } : a));
        }
        if (bannerPreview?.startsWith("blob:")) URL.revokeObjectURL(bannerPreview);
        setBannerFile(null);
        setBannerPreview(newUrl ? resolveApiMediaUrl(newUrl) || newUrl : null);
      }

      const typeForApi: "CMA" | "PMP" = hasPreSurvey ? "CMA" : "PMP";
      const patchBody = {
        name: name,
        description: description.trim(),
        type: typeForApi,
        ...(hasPreSurvey && preSurveyPayload.length > 0 ? { preSurvey: preSurveyPayload } : {}),
      };
      try {
        await apiPatchAssessment(assessment.id, patchBody);
      } catch (e) {
        console.warn("PATCH /assessment (metadata) not applied:", e);
      }

      await apiUpdateSections(assessment.id, buildSectionsPayload(modelSections));
      await apiUpdateInstructions(assessment.id, instructionLines);

      router.refresh();
      setSaveSuccess(true);
      showToast("Saved. You can keep editing or go back to the list.");
    } catch (e) {
      console.error(e);
      showToast(formatAssessmentApiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const displayBanner = bannerFile
    ? bannerPreview
    : bannerPreview || (assessment ? resolveApiMediaUrl(assessment.bannerImage) || "" : "") || null;

  if (!assessment && !loadError) {
    return (
      <div className={directorPageRoot}>
        <div className={`${directorPageContainer} px-4 sm:px-6 lg:px-10`}>
          <DirectorHero
            title="Edit assessment"
            subtitle="Loading this assessment. One moment…"
            image={AssessmentBg}
            breadcrumbItems={[
              { label: "Home", href: "/director/home" },
              { label: "Assessments", href: "/director/assessments" },
              { label: "…" },
            ]}
          />
        </div>
        <section className="flex flex-1 items-center justify-center py-20">
          <div className={directorSpinner} />
        </section>
      </div>
    );
  }

  if (loadError || !assessment) {
    return (
      <div className={directorPageRoot}>
        <DirectorHero
          title="Assessment"
          subtitle="Could not load this assessment."
          image={AssessmentBg}
          breadcrumbItems={[
            { label: "Home", href: "/director/home" },
            { label: "Assessments", href: "/director/assessments" },
            { label: "Error" },
          ]}
        />
        <section className="flex flex-1 flex-col items-center justify-center gap-6 px-4 pb-16">
          <p className="text-center text-white/80">Check the link or try again from the list.</p>
          <button
            type="button"
            onClick={() => router.push("/director/assessments")}
            className="rounded-xl border border-[#8ec5eb]/40 bg-[#8ec5eb]/15 px-6 py-3 text-sm font-semibold text-white"
          >
            Back to assessments
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className={directorPageRoot}>
      <div className={`${directorPageContainer} px-4 pt-3 sm:px-6 lg:px-10 sm:pt-5`}>
        <DirectorHero
          title="Edit assessment"
          subtitle="Update the title, questions, and plans in one place. Your work is not saved until you use Save at the bottom."
          image={AssessmentBg}
          breadcrumbItems={[
            { label: "Home", href: "/director/home" },
            { label: "Assessments", href: "/director/assessments" },
            { label: assessmentName || "Edit" },
          ]}
        />
      </div>

      <section className="relative flex-1 pb-28 pt-2 sm:pb-32">
        <div className={`${directorPageContainer} px-4 sm:px-6 lg:px-10`}>
          <div className={`${directorGlassCard} mx-auto max-w-3xl p-5 sm:p-8`}>
            {saveSuccess ? (
              <div
                className="mb-6 flex flex-col gap-3 rounded-2xl border border-emerald-500/40 bg-emerald-500/15 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                role="status"
              >
                <p className="text-sm font-medium text-emerald-100">
                  <i className="fa-solid fa-circle-check mr-2" aria-hidden />
                  All changes were saved. You can keep making edits, or return to the list.
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSaveSuccess(false);
                    }}
                    className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm font-semibold text-white hover:bg-white/15"
                  >
                    Dismiss
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      void router.push("/director/assessments");
                    }}
                    className="rounded-lg border border-emerald-400/50 bg-emerald-500/25 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-500/35"
                  >
                    Back to assessments
                  </button>
                </div>
              </div>
            ) : null}

            <div className="mb-6 flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-white/50">On this page</p>
              <p className="text-sm text-white/75">
                <strong>Basics</strong> — what people see in the list. <strong>Instructions</strong> — what they
                read before they start. <strong>Content</strong> — each section has 4 quick steps and 4
                follow-up plan levels. <strong>Banner</strong> is optional.
              </p>
              <nav
                className="flex flex-wrap gap-2 pt-1 text-sm"
                aria-label="Section shortcuts"
              >
                {(
                  [
                    ["edit-basics", "Basics"] as [string, string],
                    ["edit-instructions", "Instructions"],
                    ...(hasPreSurvey ? (["edit-pre", "Pre-survey"] as [string, string][]) : []),
                    ["edit-content", "Survey content"],
                    ["edit-banner", "Banner"],
                  ] as [string, string][]
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => scrollToId(id)}
                    className="rounded-full border border-white/20 bg-white/5 px-3 py-1.5 font-medium text-white/90 transition hover:border-[#8ec5eb]/40 hover:bg-white/10"
                  >
                    {label}
                  </button>
                ))}
              </nav>
            </div>

            <div className="mb-8 scroll-mt-20 space-y-5" id="edit-basics">
              <h2 className="text-lg font-bold text-white">Basics</h2>
              <p className="text-sm text-white/60">
                Name and short description are shown on assessment cards. Survey type sets whether
                a short pre-question list appears first.
              </p>
              <div>
                <label className={directorLabelClass} htmlFor="field-assessment-name">
                  Assessment name (required)
                </label>
                <input
                  id="field-assessment-name"
                  type="text"
                  value={assessmentName}
                  onChange={(e) => setAssessmentName(e.target.value)}
                  className={directorInputClass}
                  placeholder="e.g. Church readiness self-assessment"
                  autoComplete="off"
                />
              </div>
              <div>
                <label className={directorLabelClass} htmlFor="field-assessment-desc">
                  Short description (required)
                </label>
                <textarea
                  id="field-assessment-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className={`${directorInputClass} min-h-[100px] resize-y`}
                  placeholder="A single sentence is enough. This appears on thumbnails and the assessment list."
                />
              </div>
              <div>
                <span className={directorLabelClass}>Survey type</span>
                <p className="mb-3 text-sm text-white/60">
                  Choose whether people answer a few warm-up questions before the main survey.
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setHasPreSurvey(false)}
                    aria-pressed={!hasPreSurvey}
                    className={`rounded-2xl border-2 p-4 text-left transition ${
                      !hasPreSurvey
                        ? "border-[#8ec5eb] bg-[#8ec5eb]/10 ring-2 ring-[#8ec5eb]/30"
                        : "border-white/15 bg-white/[0.03] hover:border-white/30"
                    }`}
                  >
                    <span className="block text-sm font-bold text-white">Main survey only (PMP)</span>
                    <span className="mt-1 block text-xs text-white/65">No pre-survey step. Simpler path.</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setHasPreSurvey(true)}
                    aria-pressed={hasPreSurvey}
                    className={`rounded-2xl border-2 p-4 text-left transition ${
                      hasPreSurvey
                        ? "border-[#8ec5eb] bg-[#8ec5eb]/10 ring-2 ring-[#8ec5eb]/30"
                        : "border-white/15 bg-white/[0.03] hover:border-white/30"
                    }`}
                  >
                    <span className="block text-sm font-bold text-white">Pre-survey + main (CMA)</span>
                    <span className="mt-1 block text-xs text-white/65">Add a few text or number questions first, then the main flow.</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="mb-8 scroll-mt-20" id="edit-instructions">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg font-bold text-white">Instructions for participants</h2>
                  <p className="mt-1 text-sm text-white/60">At least one line. These are shown with the survey.</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddInstruction}
                  className={directorBtnSecondary + " !py-2 !text-sm"}
                >
                  <i className="fa-solid fa-plus" />
                  Add line
                </button>
              </div>
              <div className="space-y-3">
                {instructions.map((instruction, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={instruction}
                      onChange={(e) => handleUpdateInstruction(idx, e.target.value)}
                      className={directorInputClass + " min-w-0 flex-1"}
                      placeholder={
                        idx === 0
                          ? "e.g. Take your time and answer based on your real experience."
                          : "Another instruction line (optional)"
                      }
                    />
                    {instructions.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => handleRemoveInstruction(idx)}
                        className="shrink-0 rounded-lg border border-red-400/30 bg-red-500/15 px-3 py-2 text-sm font-semibold text-red-200"
                        aria-label={`Remove instruction ${idx + 1}`}
                      >
                        <i className="fa-solid fa-trash" />
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>

            {hasPreSurvey ? (
              <div className="mb-8 scroll-mt-20" id="edit-pre">
                <h2 className="mb-1 text-lg font-bold text-white">Pre-survey questions</h2>
                <p className="mb-4 text-sm text-white/70">
                  Short fields people complete before the main flow. They are not multiple choice.
                </p>
                <div className="space-y-5">
                  {preSurveyRows.map((row, qIdx) => (
                    <div
                      key={row.id}
                      className="space-y-3 rounded-2xl border border-white/15 bg-white/[0.04] p-5 sm:p-6"
                    >
                      <div className="flex flex-wrap items-end gap-3">
                        <div className="min-w-[200px] flex-1">
                          <label className={directorLabelClass}>Question {qIdx + 1}</label>
                          <input
                            type="text"
                            value={row.text}
                            onChange={(e) => handleUpdatePreSurvey(qIdx, "text", e.target.value)}
                            className={directorInputClass}
                          />
                        </div>
                        <div className="w-full sm:w-40">
                          <label className={directorLabelClass}>Type</label>
                          <select
                            value={row.type}
                            onChange={(e) => handleUpdatePreSurvey(qIdx, "type", e.target.value)}
                            className={`${directorInputClass} cursor-pointer`}
                          >
                            <option value="number">Number</option>
                            <option value="text">Text</option>
                          </select>
                        </div>
                        <div className="min-w-[160px] flex-1">
                          <label className={directorLabelClass}>Placeholder</label>
                          <input
                            type="text"
                            value={row.placeholder}
                            onChange={(e) => handleUpdatePreSurvey(qIdx, "placeholder", e.target.value)}
                            className={directorInputClass}
                          />
                        </div>
                        {preSurveyRows.length > 1 ? (
                          <button
                            type="button"
                            onClick={() => handleRemovePreSurveyQuestion(qIdx)}
                            className="rounded-lg border border-white/20 px-3 py-2 text-sm text-white/80"
                          >
                            Remove
                          </button>
                        ) : null}
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={handleAddPreSurveyQuestion}
                    className={directorBtnSecondary + " !py-2 !text-sm"}
                  >
                    <i className="fa-solid fa-plus" />
                    Add pre-survey question
                  </button>
                </div>
              </div>
            ) : null}

            <div className="mb-4 scroll-mt-20" id="edit-content">
              <h2 className="text-lg font-bold text-white">Survey content</h2>
              <p className="mb-2 text-sm text-white/65">
                Add one or more <strong>sections</strong>. Each has four <strong>steps</strong> (what people
                choose from) and four <strong>plan levels</strong> (suggested follow-up). Every step needs at
                least one non-empty choice.
              </p>
            </div>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-white/50">
                {wizardSections.length} section{wizardSections.length === 1 ? "" : "s"}
              </p>
              <button type="button" onClick={handleAddSection} className={directorBtnSecondary + " !py-2 !text-sm"}>
                <i className="fa-solid fa-plus" />
                Add section
              </button>
            </div>

            <div className="space-y-5">
              {wizardSections.map((section, sectionIdx) => (
                <div
                  key={section.id}
                  className="space-y-4 rounded-2xl border border-white/15 bg-white/[0.04] p-5 sm:p-6"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-base font-semibold text-[#8ec5eb]">Section {sectionIdx + 1}</h3>
                    {wizardSections.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => handleRemoveSection(sectionIdx)}
                        className="rounded-lg border border-red-400/30 bg-red-500/15 px-3 py-1.5 text-sm font-semibold text-red-200"
                      >
                        <i className="fa-solid fa-trash mr-1" />
                        Remove section
                      </button>
                    ) : null}
                  </div>
                  <div>
                    <label className={directorLabelClass}>Section name</label>
                    <input
                      type="text"
                      value={section.name}
                      onChange={(e) => handleUpdateSection(sectionIdx, "name", e.target.value)}
                      className={directorInputClass}
                      placeholder="e.g. How you work with others"
                    />
                  </div>
                  <div>
                    <label className={directorLabelClass}>Guidelines (shown to participants)</label>
                    <textarea
                      value={section.guidelines}
                      onChange={(e) => handleUpdateSection(sectionIdx, "guidelines", e.target.value)}
                      className={`${directorInputClass} min-h-[72px] resize-y text-sm`}
                      rows={2}
                      placeholder="What this part of the survey is about"
                    />
                  </div>
                  <p className="text-sm text-white/70">
                    Below: <strong>Steps 1–{WIZARD_LAYER_COUNT}</strong> are the answer choices. Then add
                    <strong> plan lines</strong> for each of the four levels.
                  </p>

                  {section.layers.map((layer, layerIdx) => (
                    <div key={layer.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-white/90">Step {layerIdx + 1} — choices</span>
                        <button
                          type="button"
                          onClick={() => handleAddLayerChoice(sectionIdx, layerIdx)}
                          className="text-xs font-semibold text-[#8ec5eb] hover:underline"
                        >
                          + Choice
                        </button>
                      </div>
                      {layer.choices.map((choice, choiceIdx) => (
                        <div key={choiceIdx} className="mb-2 flex items-center gap-2">
                          <input
                            type="text"
                            value={choice}
                            onChange={(e) =>
                              handleUpdateLayerChoice(sectionIdx, layerIdx, choiceIdx, e.target.value)
                            }
                            className={directorInputClass + " min-w-0 flex-1"}
                            placeholder={`Option ${choiceIdx + 1}`}
                          />
                          {layer.choices.length > 1 ? (
                            <button
                              type="button"
                              onClick={() => handleRemoveLayerChoice(sectionIdx, layerIdx, choiceIdx)}
                              className="shrink-0 rounded-lg border border-red-400/30 bg-red-500/15 px-2.5 py-2 text-sm text-red-200"
                            >
                              <i className="fa-solid fa-trash" />
                            </button>
                          ) : null}
                        </div>
                      ))}
                      <div className="mt-3">
                        <label className="mb-1 block text-xs font-medium text-white/60">
                          Optional: extra notes (one per line) linked to this step
                        </label>
                        <textarea
                          value={layer.notes}
                          onChange={(e) => handleUpdateLayerNotes(sectionIdx, layerIdx, e.target.value)}
                          rows={2}
                          className={`${directorInputClass} min-h-[56px] resize-y text-sm`}
                        />
                      </div>
                    </div>
                  ))}

                  {section.plans.map((plan, planIdx) => (
                    <div key={plan.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-white/85" title="Development plan for this level">
                          {plan.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleAddPlanItem(sectionIdx, planIdx)}
                          className="text-xs font-semibold text-[#8ec5eb] hover:underline"
                        >
                          + Item
                        </button>
                      </div>
                      {plan.items.map((item, itemIdx) => (
                        <div key={itemIdx} className="mb-2 flex items-center gap-2">
                          <input
                            type="text"
                            value={item}
                            onChange={(e) =>
                              handleUpdatePlanItem(sectionIdx, planIdx, itemIdx, e.target.value)
                            }
                            className={directorInputClass + " min-w-0 flex-1"}
                            placeholder={`Plan line ${itemIdx + 1}`}
                          />
                          {plan.items.length > 1 ? (
                            <button
                              type="button"
                              onClick={() => handleRemovePlanItem(sectionIdx, planIdx, itemIdx)}
                              className="shrink-0 rounded-lg border border-red-400/30 bg-red-500/15 px-2.5 py-2 text-sm text-red-200"
                            >
                              <i className="fa-solid fa-trash" />
                            </button>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <div className="mt-8 scroll-mt-20" id="edit-banner">
              <h2 className="mb-1 text-lg font-bold text-white">Banner</h2>
              <p className="mb-3 text-sm text-white/60">Optional. Appears on cards and the top of the survey.</p>
              <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                <span className={`${directorLabelClass} mb-0 flex items-center gap-2`}>
                  <i className="fa-solid fa-image text-[#8ec5eb]" />
                  Image file
                </span>
                {bannerFile ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (bannerPreview?.startsWith("blob:")) URL.revokeObjectURL(bannerPreview);
                      setBannerFile(null);
                      setBannerPreview(assessment?.bannerImage ? resolveApiMediaUrl(assessment.bannerImage) : null);
                    }}
                    className="text-sm font-semibold text-red-300/90 hover:underline"
                  >
                    Discard new image
                  </button>
                ) : null}
              </div>
              <input
                ref={bannerInputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                id="assessment-banner-edit"
                onChange={(e) => {
                  const f = e.target.files?.[0] || null;
                  e.target.value = "";
                  if (bannerPreview?.startsWith("blob:")) URL.revokeObjectURL(bannerPreview);
                  setBannerFile(f);
                  setBannerPreview(f ? URL.createObjectURL(f) : resolveApiMediaUrl(assessment.bannerImage) || null);
                }}
              />
              <div className="mt-2 space-y-3 rounded-2xl border-2 border-dashed border-white/25 bg-white/[0.04] px-4 py-6">
                <div className="flex flex-wrap justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => bannerInputRef.current?.click()}
                    className="rounded-lg border border-[#8ec5eb]/50 bg-[#8ec5eb]/20 px-4 py-2 text-sm font-semibold text-white"
                  >
                    {displayBanner ? "Replace banner" : "Upload banner"}
                  </button>
                </div>
                {displayBanner ? (
                  <div
                    className="relative mx-auto h-40 w-full max-w-md cursor-pointer overflow-hidden rounded-xl"
                    onClick={() => bannerInputRef.current?.click()}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        bannerInputRef.current?.click();
                      }
                    }}
                  >
                    {displayBanner.startsWith("blob:") || displayBanner.startsWith("data:") ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={displayBanner} alt="" className="h-40 w-full object-cover" />
                    ) : (
                      <Image
                        src={displayBanner}
                        alt=""
                        width={800}
                        height={320}
                        className="h-40 w-full object-cover"
                        unoptimized={isRemoteImageSrc(displayBanner)}
                      />
                    )}
                    <p className="absolute bottom-2 left-1/2 w-[90%] -translate-x-1/2 rounded bg-black/55 px-2 py-1 text-center text-xs text-white/90">
                      Click to replace
                    </p>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => bannerInputRef.current?.click()}
                    className="flex w-full flex-col items-center justify-center gap-2 py-6"
                  >
                    <i className="fa-solid fa-cloud-arrow-up text-2xl text-[#8ec5eb]" />
                    <span className="text-sm font-semibold text-white">Or click to choose a file</span>
                  </button>
                )}
              </div>
            </div>

            <p className="mt-6 text-center text-sm text-white/40">
              Use the bar at the bottom of the screen to save or go back.
            </p>
          </div>
        </div>
      </section>

      <div
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-[#041f35]/95 px-4 py-3 shadow-[0_-8px_32px_rgba(0,0,0,0.35)] backdrop-blur-md sm:px-6"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        <div
          className={`${directorPageContainer} flex w-full max-w-3xl flex-col items-stretch gap-3 sm:mx-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end`}
        >
          <p className="order-2 text-center text-xs text-white/50 sm:order-1 sm:mr-auto sm:text-left sm:text-sm">
            Nothing is stored until you press Save
          </p>
          <div className="order-1 flex w-full flex-wrap justify-end gap-2 sm:order-2 sm:w-auto">
            <button
              type="button"
              onClick={() => {
                if (saving) return;
                void router.push("/director/assessments");
              }}
              className={directorBtnSecondary}
              disabled={saving}
            >
              Back without saving
            </button>
            <button
              type="button"
              onClick={() => void handleSaveChanges()}
              disabled={saving}
              className={directorBtnPrimary}
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>
      </div>

      {toast ? (
        <div className="fixed bottom-24 left-1/2 z-[100] max-w-md -translate-x-1/2 px-4 sm:bottom-28">
          <div className="rounded-xl border border-white/15 bg-[#041f35]/95 px-5 py-3 text-center text-sm font-semibold text-white shadow-xl backdrop-blur-md">
            {toast}
          </div>
        </div>
      ) : null}
    </div>
  );
}
