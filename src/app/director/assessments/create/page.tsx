"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
} from "../../directorUi";
import AssessmentBg from "../../../Assets/assessment-bg.png";
import {
  apiCreateAssessment,
  apiUploadAssessmentBanner,
  formatAssessmentApiErrorMessage,
} from "@/app/Services/assessment.service";
import {
  buildCreateAssessmentSectionsFromWizard,
  buildPreSurveyPayloadForDirectorCreate,
} from "@/app/Services/utils/assessment-mapper";
import type { CreateAssessmentPayload } from "@/app/Services/types/assessment.types";
import { isRemoteImageSrc } from "@/app/utils/image";

/** Every section is created with exactly four layers (levels). */
const SECTION_LAYER_COUNT = 4;

type WizardSection = {
  id: number;
  name: string;
  guidelines: string;
  layers: { id: number; choices: string[] }[];
  plans: { id: number; name: string; items: string[] }[];
};

/** Matches CCC-Director-Mobile pre-survey rows (`text` + `type` + `placeholder`). */
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

const defaultSection = (): WizardSection => ({
  id: Date.now(),
  name: "",
  guidelines: "",
  layers: Array.from({ length: SECTION_LAYER_COUNT }, (_, i) => ({
    id: i + 1,
    choices: [""],
  })),
  plans: Array.from({ length: SECTION_LAYER_COUNT }, (_, i) => ({
    id: i + 1,
    name: `Level ${i + 1} - Customized Development Plans`,
    items: [""],
  })),
});

export default function CreateAssessmentPage() {
  const router = useRouter();
  const [toast, setToast] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [assessmentName, setAssessmentName] = useState("");
  const [description, setDescription] = useState("");
  /** Mobile: CMA = include pre-survey; PMP = no pre-survey. */
  const [hasPreSurvey, setHasPreSurvey] = useState(false);
  const [instructions, setInstructions] = useState([""]);
  const [sections, setSections] = useState<WizardSection[]>([defaultSection()]);
  const [preSurveyRows, setPreSurveyRows] = useState<PreSurveyRow[]>([
    { id: 1, text: "", type: "number", placeholder: "Enter number" },
  ]);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 4000);
  };

  const handleAddInstruction = () => setInstructions([...instructions, ""]);

  const handleUpdateInstruction = (index: number, value: string) => {
    const updated = [...instructions];
    updated[index] = value;
    setInstructions(updated);
  };

  const handleRemoveInstruction = (index: number) => {
    if (instructions.length <= 1) {
      showToast("At least one instruction is required");
      return;
    }
    const updated = instructions.filter((_, idx) => idx !== index);
    setInstructions(updated);
  };

  const handleAddSection = () => {
    setSections([...sections, defaultSection()]);
  };

  const handleUpdateSection = (sectionIdx: number, field: string, value: unknown) => {
    const updated = [...sections];
    const cur = { ...updated[sectionIdx] };
    updated[sectionIdx] = { ...cur, [field]: value } as WizardSection;
    setSections(updated);
  };

  const handleUpdateLayerChoice = (
    sectionIdx: number,
    layerIdx: number,
    choiceIdx: number,
    value: string,
  ) => {
    const updated = [...sections];
    updated[sectionIdx].layers[layerIdx].choices[choiceIdx] = value;
    setSections(updated);
  };

  const handleAddLayerChoice = (sectionIdx: number, layerIdx: number) => {
    const updated = [...sections];
    updated[sectionIdx].layers[layerIdx].choices.push("");
    setSections(updated);
  };

  const handleRemoveLayerChoice = (sectionIdx: number, layerIdx: number, choiceIdx: number) => {
    const updated = [...sections];
    const choices = updated[sectionIdx].layers[layerIdx].choices;
    if (choices.length <= 1) {
      showToast("At least one choice is required per layer");
      return;
    }
    choices.splice(choiceIdx, 1);
    setSections(updated);
  };

  const handleUpdatePlanItem = (
    sectionIdx: number,
    planIdx: number,
    itemIdx: number,
    value: string,
  ) => {
    const updated = [...sections];
    updated[sectionIdx].plans[planIdx].items[itemIdx] = value;
    setSections(updated);
  };

  const handleAddPlanItem = (sectionIdx: number, planIdx: number) => {
    const updated = [...sections];
    updated[sectionIdx].plans[planIdx].items.push("");
    setSections(updated);
  };

  const handleUpdatePreSurvey = (
    idx: number,
    field: keyof Pick<PreSurveyRow, "text" | "type" | "placeholder">,
    value: string,
  ) => {
    setPreSurveyRows((prev) => {
      const next = [...prev];
      if (field === "type" && (value === "text" || value === "number")) {
        next[idx] = { ...next[idx], type: value };
      } else if (field === "text" || field === "placeholder") {
        next[idx] = { ...next[idx], [field]: value };
      }
      return next;
    });
  };

  const handleAddPreSurveyQuestion = () => {
    setPreSurveyRows((prev) => [...prev, defaultPreSurveyRow()]);
  };

  const handleRemovePreSurveyQuestion = (idx: number) => {
    setPreSurveyRows((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx)));
  };

  const handleCreateSurvey = async () => {
    const name = assessmentName.trim();
    if (!name) {
      showToast("Enter an assessment name.");
      return;
    }
    if (!description.trim()) {
      showToast("Please enter a short description (thumbnail / cards).");
      return;
    }

    const instructionLines = instructions.map((i) => i.trim()).filter(Boolean);
    if (instructionLines.length === 0) {
      showToast("Add at least one general instruction.");
      return;
    }

    const invalidSection = sections.some(
      (s) =>
        s.layers.length !== SECTION_LAYER_COUNT ||
        s.layers.some((l) => !l.choices.some((c) => c.trim())),
    );
    if (invalidSection) {
      showToast(
        `Each section must have ${SECTION_LAYER_COUNT} layers, and each layer needs at least one choice with text.`,
      );
      return;
    }

    const apiSections = buildCreateAssessmentSectionsFromWizard(sections);
    const typeForApi: "CMA" | "PMP" = hasPreSurvey ? "CMA" : "PMP";
    const preSurveyPayload = buildPreSurveyPayloadForDirectorCreate(preSurveyRows);
    if (hasPreSurvey && preSurveyPayload.length === 0) {
      showToast("Include pre-survey is on — add at least one pre-survey question with text.");
      return;
    }

    const payload: CreateAssessmentPayload = {
      name,
      description: description.trim(),
      instructions: instructionLines,
      type: typeForApi,
      sections: apiSections,
      ...(hasPreSurvey && preSurveyPayload.length > 0
        ? { preSurvey: preSurveyPayload }
        : {}),
    };

    setCreating(true);
    try {
      const res = await apiCreateAssessment(payload);
      const body = res?.data as Record<string, unknown> | undefined;
      const nested =
        body?.data != null && typeof body.data === "object" && !Array.isArray(body.data)
          ? (body.data as { _id?: string; id?: string })
          : null;
      const root =
        body && "_id" in body && typeof body === "object"
          ? (body as { _id?: string; id?: string })
          : null;
      const created = nested ?? root;
      const newId =
        created?._id != null ? String(created._id) : created?.id != null ? String(created.id) : null;

      if (bannerFile && newId) {
        try {
          await apiUploadAssessmentBanner(newId, bannerFile);
        } catch (e) {
          console.error(e);
          showToast("Assessment created; banner upload failed — you can add a banner when editing.");
          setTimeout(() => router.push(`/director/assessments/${newId}`), 1800);
          return;
        }
      }

      showToast("Assessment created successfully");
      setTimeout(() => {
        router.push(newId ? `/director/assessments/${newId}` : "/director/assessments");
      }, 800);
    } catch (err: unknown) {
      console.error(err);
      showToast(formatAssessmentApiErrorMessage(err));
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className={directorPageRoot}>
      <div className={`${directorPageContainer} px-4 pt-3 sm:px-6 lg:px-10 sm:pt-5`}>
        <DirectorHero
          title="Create assessment"
          subtitle="Aligned with Director mobile: CMA includes a pre-survey; PMP does not. Four layers per section and optional CDP lines per level."
          image={AssessmentBg}
          breadcrumbItems={[
            { label: "Home", href: "/director/home" },
            { label: "Assessments", href: "/director/assessments" },
            { label: "Create" },
          ]}
        />
      </div>

      <section className="relative flex-1 pb-14 pt-2">
        <div className={`${directorPageContainer} px-4 sm:px-6 lg:px-10`}>
          <div className={`${directorGlassCard} mx-auto max-w-3xl p-5 sm:p-8`}>
            <div className="mb-8 space-y-5">
              <div>
                <label className={directorLabelClass}>Assessment name *</label>
                <input
                  type="text"
                  value={assessmentName}
                  onChange={(e) => setAssessmentName(e.target.value)}
                  placeholder="e.g. Ministry readiness survey"
                  className={directorInputClass}
                />
              </div>

              <div>
                <label className={directorLabelClass}>Description *</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description for thumbnail / cards (required)"
                  rows={3}
                  className={`${directorInputClass} min-h-[100px] resize-y`}
                />
              </div>

              <div>
                <span className={directorLabelClass}>Include pre-survey questions?</span>
                <p className="mb-3 text-sm text-white/60">
                  Yes → CMA (pre-survey before main survey). No → PMP.
                </p>
                <div className="flex flex-wrap gap-6">
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-white/90">
                    <input
                      type="radio"
                      name="hasPreSurvey"
                      checked={!hasPreSurvey}
                      onChange={() => setHasPreSurvey(false)}
                      className="h-4 w-4"
                    />
                    No (PMP)
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-white/90">
                    <input
                      type="radio"
                      name="hasPreSurvey"
                      checked={hasPreSurvey}
                      onChange={() => setHasPreSurvey(true)}
                      className="h-4 w-4"
                    />
                    Yes (CMA)
                  </label>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <span className={directorLabelClass + " mb-0"}>General instructions</span>
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
                  <input
                    key={idx}
                    type="text"
                    value={instruction}
                    onChange={(e) => handleUpdateInstruction(idx, e.target.value)}
                    placeholder={`Instruction ${idx + 1}`}
                    className={directorInputClass}
                  />
                ))}
              </div>
            </div>

            {hasPreSurvey ? (
              <div className="mb-8">
                <h2 className="mb-1 text-lg font-bold text-white">Pre-survey questions</h2>
                <p className="mb-4 text-sm text-white/70">
                  Shown before the main survey (mobile: text or number fields — not multiple-choice lists).
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
                            placeholder="e.g. What is your current church membership?"
                            className={directorInputClass}
                          />
                        </div>
                        <div className="w-full sm:w-40">
                          <label className={directorLabelClass}>Type</label>
                          <select
                            value={row.type}
                            onChange={(e) =>
                              handleUpdatePreSurvey(qIdx, "type", e.target.value)
                            }
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
                            onChange={(e) =>
                              handleUpdatePreSurvey(qIdx, "placeholder", e.target.value)
                            }
                            placeholder="Enter number"
                            className={directorInputClass}
                          />
                        </div>
                        {preSurveyRows.length > 1 ? (
                          <button
                            type="button"
                            onClick={() => handleRemovePreSurveyQuestion(qIdx)}
                            className="rounded-lg border border-white/20 px-3 py-2 text-sm text-white/80 hover:bg-white/10"
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

            <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-bold text-white">Sections</h2>
              <button type="button" onClick={handleAddSection} className={directorBtnSecondary + " !py-2 !text-sm"}>
                <i className="fa-solid fa-plus" />
                Add section
              </button>
            </div>

            <div className="space-y-5">
              {sections.map((section, sectionIdx) => (
                <div
                  key={section.id}
                  className="space-y-4 rounded-2xl border border-white/15 bg-white/[0.04] p-5 sm:p-6"
                >
                  <h3 className="text-base font-semibold text-[#8ec5eb]">Section {sectionIdx + 1}</h3>

                  <div>
                    <label className={directorLabelClass}>Section name</label>
                    <input
                      type="text"
                      value={section.name}
                      onChange={(e) => handleUpdateSection(sectionIdx, "name", e.target.value)}
                      className={directorInputClass}
                    />
                  </div>

                  <div>
                    <label className={directorLabelClass}>Guidelines</label>
                    <input
                      type="text"
                      value={section.guidelines}
                      onChange={(e) => handleUpdateSection(sectionIdx, "guidelines", e.target.value)}
                      className={directorInputClass}
                    />
                  </div>

                  <p className="text-sm text-white/70">
                    This section has {SECTION_LAYER_COUNT} layers. Add at least one choice per layer.
                  </p>

                  {section.layers.map((layer, layerIdx) => (
                    <div key={layer.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-white/90">Layer {layerIdx + 1}</span>
                        <button
                          type="button"
                          onClick={() => handleAddLayerChoice(sectionIdx, layerIdx)}
                          className="text-xs font-semibold text-[#8ec5eb] hover:underline"
                        >
                          + Choice
                        </button>
                      </div>
                      {layer.choices.map((choice, choiceIdx) => (
                        <input
                          type="text"
                          value={choice}
                          onChange={(e) =>
                            handleUpdateLayerChoice(sectionIdx, layerIdx, choiceIdx, e.target.value)
                          }
                          placeholder={`Choice ${choiceIdx + 1}`}
                          className={`${directorInputClass} mb-2`}
                        />
                      ))}
                    </div>
                  ))}

                  {/* Customized Development Plans - MUST BE 4 LEVELS */}
                {section.plans.map((plan, planIdx) => (
                  <div key={plan.id}>
                    <div className="mb-2 flex items-center justify-between">
                      <label className="text-sm font-semibold text-[#cde2f2]">{plan.name}</label>
                      <button
                        type="button"
                        onClick={() => handleAddPlanItem(sectionIdx, planIdx)}
                        className={directorBtnSecondary}
                      >
                        <i className="fa-solid fa-plus" />
                        Plan
                      </button>
                    </div>
                    {plan.items.map((item, itemIdx) => (
                      <div key={itemIdx} className="mb-2 flex gap-2">
                        <input
                          type="text"
                          value={item}
                          onChange={(e) =>
                            handleUpdatePlanItem(sectionIdx, planIdx, itemIdx, e.target.value)
                          }
                          placeholder={`Plan item ${itemIdx + 1}`}
                          className={`${directorInputClass} mb-2`}
                        />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ))}
            </div>

            <div className="mt-8">
              <label className={`${directorLabelClass} flex items-center gap-2`}>
                <i className="fa-solid fa-image text-[#8ec5eb]" />
                Banner image (optional)
              </label>
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                id="assessment-banner-create"
                onChange={(e) => {
                  const f = e.target.files?.[0] || null;
                  e.target.value = "";
                  setBannerFile(f);
                  if (bannerPreview?.startsWith("blob:")) URL.revokeObjectURL(bannerPreview);
                  setBannerPreview(f ? URL.createObjectURL(f) : null);
                }}
              />
              <label
                htmlFor="assessment-banner-create"
                className="mt-2 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-white/25 bg-white/[0.04] px-4 py-10 transition hover:border-[#8ec5eb]/40"
              >
                {bannerPreview ? (
                  <div className="relative h-40 w-full max-w-md overflow-hidden rounded-xl">
                    <Image
                      src={bannerPreview}
                      alt=""
                      fill
                      className="object-cover"
                      unoptimized={
                        bannerPreview.startsWith("blob:") || isRemoteImageSrc(bannerPreview)
                      }
                    />
                  </div>
                ) : (
                  <>
                    <i className="fa-solid fa-cloud-arrow-up text-2xl text-[#8ec5eb]" />
                    <span className="text-sm font-semibold text-white">Click to upload banner</span>
                    <span className="text-xs text-white/50">PNG or JPG — max 10 MB</span>
                  </>
                )}
              </label>
            </div>

            <div className="mt-10 flex flex-wrap justify-end gap-3 border-t border-white/10 pt-8">
              <button type="button" onClick={() => router.push("/director/assessments")} className={directorBtnSecondary}>
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleCreateSurvey()}
                disabled={creating}
                className={directorBtnPrimary}
              >
                {creating ? "Creating…" : "Create assessment"}
              </button>
            </div>
          </div>
        </div>
      </section>

      {toast ? (
        <div className="fixed bottom-6 left-1/2 z-[100] max-w-md -translate-x-1/2 px-4">
          <div className="rounded-xl border border-white/15 bg-[#041f35]/95 px-5 py-3 text-center text-sm font-semibold text-white shadow-xl backdrop-blur-md">
            {toast}
          </div>
        </div>
      ) : null}
    </div>
  );
}
