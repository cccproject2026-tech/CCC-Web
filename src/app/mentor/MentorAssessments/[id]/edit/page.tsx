"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import "@fortawesome/fontawesome-free/css/all.min.css";
import MentorHeader from "@/app/Components/MentorHeader";
import {
  apiPatchAssessmentMain,
  apiGetAssessmentById,
  apiUploadAssessmentBanner,
  apiUpdateInstructions,
  formatAssessmentApiErrorMessage,
  parseAssessmentDetailPayload,
} from "@/app/Services/assessment.service";
import {
  buildPreSurveyPayloadForDirectorCreate,
  mapAssessmentFromApi,
  buildSectionsPayload,
  type Section,
  type LevelPlanBlock,
} from "@/app/Services/utils/assessment-mapper";
import { isRemoteImageSrc, resolveApiMediaUrl } from "@/app/utils/image";

type InstructionItem = {
  id: string;
  text: string;
  checked: boolean;
};

type PreSurveyRow = {
  id: number;
  text: string;
  type: "text" | "number";
  placeholder: string;
};

const MAX_BANNER_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_BANNER_TYPES = new Set(["image/png", "image/jpeg", "image/jpg", "image/webp"]);
const MIN_LAYERS = 1;

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

export default function MentorEditAssessmentPage() {
  const router = useRouter();
  const params = useParams();
  const [toast, setToast] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState<string>("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [assessment, setAssessment] = useState<any>(null);
  const [assessmentName, setAssessmentName] = useState("");
  const [description, setDescription] = useState("");
  const [hasPreSurvey, setHasPreSurvey] = useState(false);

  // Modals
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);

  // Instructions state
  const [instructions, setInstructions] = useState<InstructionItem[]>([]);
  const [preSurveyRows, setPreSurveyRows] = useState<PreSurveyRow[]>([defaultPreSurveyRow()]);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const bannerInputRef = useRef<HTMLInputElement | null>(null);

  const [sections, setSections] = useState<Section[]>([]);

  const createId = (prefix: string) =>
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  const createBlankLayer = (sectionId: string, layerIndex: number) => {
    const layerId = createId(`${sectionId}-layer-${layerIndex + 1}`);
    return {
      id: layerId,
      name: `Layer ${layerIndex + 1}`,
      choices: [{ id: createId(`${layerId}-choice-1`), text: "" }],
      recommendations: [],
    };
  };

  const createBlankSection = (sectionIndex: number): Section => {
    const sectionId = createId(`section-${sectionIndex + 1}`);
    return {
      id: sectionId,
      name: "",
      description: "",
      layers: [createBlankLayer(sectionId, 0)],
      levelPlans: ([1, 2, 3, 4] as const).map((level) => ({
        id: `${sectionId}-level-${level}`,
        level,
        items: [{ id: createId(`${sectionId}-level-${level}-item-1`), text: "" }],
      })),
    };
  };

  useEffect(() => {
    if (!params?.id) return;

    const fetchAssessment = async () => {
      try {
        const res = await apiGetAssessmentById(params.id as string);
        const raw = parseAssessmentDetailPayload(res.data);
        if (!raw) {
          console.error("Invalid assessment payload");
          return;
        }
        const mapped = mapAssessmentFromApi(raw);

        setAssessment(mapped);
        setAssessmentName(mapped.name || "");
        setDescription(mapped.description || "");
        setBannerPreview(resolveApiMediaUrl(mapped.bannerImage));
        // Layer-level recommendations are intentionally removed for mentor edit flow.
        setSections(
          mapped.sections.map((section: Section) => ({
            ...section,
            layers: section.layers.map((layer) => ({ ...layer, recommendations: [] })),
          })),
        );
        setInstructions(mapped.instructions);
        setHasPreSurvey(
          (mapped.type as string) === "CMA" || preSurveyFromApiDetail(raw).some((r) => r.text.trim().length > 0),
        );
        setPreSurveyRows(preSurveyFromApiDetail(raw));

        if (mapped.sections.length > 0) {
          setSelectedSection(mapped.sections[0].id);
        }
      } catch (error) {
        console.error("Failed to fetch assessment", error);
      }
    };

    fetchAssessment();
  }, [params?.id]);

  const handleUpdateChoiceText = (
    sectionId: string,
    layerId: string,
    choiceId: string,
    text: string,
  ) => {
    setSections((prev) =>
      prev.map((section) => {
        if (section.id !== sectionId) return section;
        return {
          ...section,
          layers: section.layers.map((layer) => {
            if (layer.id !== layerId) return layer;
            return {
              ...layer,
              choices: layer.choices.map((choice) =>
                choice.id === choiceId ? { ...choice, text } : choice,
              ),
            };
          }),
        };
      }),
    );
  };

  const handleAddChoice = (sectionId: string, layerId: string) => {
    const id =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `choice-${Date.now()}`;

    setSections((prev) =>
      prev.map((section) => {
        if (section.id !== sectionId) return section;
        return {
          ...section,
          layers: section.layers.map((layer) => {
            if (layer.id !== layerId) return layer;
            return {
              ...layer,
              choices: [...layer.choices, { id, text: "" }],
            };
          }),
        };
      }),
    );
  };

  const handleRemoveChoice = (sectionId: string, layerId: string, choiceId: string) => {
    setSections((prev) =>
      prev.map((section) => {
        if (section.id !== sectionId) return section;
        return {
          ...section,
          layers: section.layers.map((layer) => {
            if (layer.id !== layerId) return layer;
            if (layer.choices.length <= 1) return layer;
            return {
              ...layer,
              choices: layer.choices.filter((choice) => choice.id !== choiceId),
            };
          }),
        };
      }),
    );
  };

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const focusField = (id: string) => {
    if (typeof document === "undefined") return;
    const el = document.getElementById(id) as HTMLElement | null;
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.focus();
  };

  const handleUpdateSectionField = (
    sectionId: string,
    field: "name" | "description",
    value: string,
  ) => {
    setSections((prev) =>
      prev.map((section) => (section.id === sectionId ? { ...section, [field]: value } : section)),
    );
  };

  const handleAddSection = () => {
    const nextSection = createBlankSection(sections.length);
    setSections((prev) => [...prev, nextSection]);
    setSelectedSection(nextSection.id);
    setIsEditMode(true);
    showToast("Section Added Successfully");
  };

  const handleDeleteSelectedSection = () => {
    if (!selectedSectionData || sections.length <= 1) return;

    setSections((prev) => {
      const currentIndex = prev.findIndex((section) => section.id === selectedSectionData.id);
      const next = prev.filter((section) => section.id !== selectedSectionData.id);
      const fallback = next[Math.min(Math.max(currentIndex, 0), Math.max(next.length - 1, 0))];
      setSelectedSection(fallback?.id ?? "");
      return next;
    });
  };

  const handleAddLayer = () => {
    if (!selectedSectionData) return;

    setSections((prev) =>
      prev.map((section) => {
        if (section.id !== selectedSectionData.id) return section;
        return {
          ...section,
          layers: [...section.layers, createBlankLayer(section.id, section.layers.length)],
        };
      }),
    );
    setIsEditMode(true);
    showToast("Layer added successfully");
  };

  const handleRemoveLayer = (sectionId: string, layerId: string) => {
    setSections((prev) =>
      prev.map((section) => {
        if (section.id !== sectionId || section.layers.length <= MIN_LAYERS) return section;
        return {
          ...section,
          layers: section.layers.filter((layer) => layer.id !== layerId),
        };
      }),
    );
  };

  const handleDeleteInstructions = () => {
    showToast("Deleted Survey Instructions");
    setShowInstructionsModal(false);
  };

  const handleUpdateInstructionText = (id: string, text: string) => {
    setInstructions((prev) => prev.map((inst) => (inst.id === id ? { ...inst, text } : inst)));
  };

  const handleAddInstruction = () => {
    const id =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `inst-${Date.now()}`;
    setInstructions((prev) => [...prev, { id, text: "", checked: true }]);
  };

  const handleRemoveInstruction = (id: string) => {
    setInstructions((prev) => (prev.length <= 1 ? prev : prev.filter((inst) => inst.id !== id)));
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

  const handleUpdateLevelPlanItem = (
    sectionId: string,
    level: 1 | 2 | 3 | 4,
    itemId: string,
    text: string,
  ) => {
    setSections((prev) =>
      prev.map((section) => {
        if (section.id !== sectionId) return section;
        const current = section.levelPlans ?? [];
        const hasLevel = current.some((b) => b.level === level);
        const withLevel = hasLevel
          ? current
          : [
              ...current,
              {
                id: `${section.id}-level-${level}`,
                level,
                items: [{ id: `${section.id}-level-${level}-item-0`, text: "" }],
              },
            ];

        const nextBlocks = withLevel.map((block) => {
          if (block.level !== level) return block;
          return {
            ...block,
            items: block.items.map((it) => (it.id === itemId ? { ...it, text } : it)),
          };
        });

        return { ...section, levelPlans: nextBlocks };
      }),
    );
  };

  const handleAddLevelPlanItem = (sectionId: string, level: 1 | 2 | 3 | 4) => {
    setSections((prev) =>
      prev.map((section) => {
        if (section.id !== sectionId) return section;
        const current = section.levelPlans ?? [];
        const hasLevel = current.some((b) => b.level === level);
        const withLevel = hasLevel
          ? current
          : [
              ...current,
              {
                id: `${section.id}-level-${level}`,
                level,
                items: [],
              },
            ];

        const nextBlocks = withLevel.map((block) => {
          if (block.level !== level) return block;
          const id = `${section.id}-level-${level}-item-${Date.now()}`;
          return {
            ...block,
            items: [...block.items, { id, text: "" }],
          };
        });

        return { ...section, levelPlans: nextBlocks };
      }),
    );
  };

  const handleRemoveLevelPlanItem = (
    sectionId: string,
    level: 1 | 2 | 3 | 4,
    itemId: string,
  ) => {
    setSections((prev) =>
      prev.map((section) => {
        if (section.id !== sectionId) return section;
        const current = section.levelPlans ?? [];
        const nextBlocks = current.map((block) => {
          if (block.level !== level) return block;
          if (block.items.length <= 1) return block;
          return {
            ...block,
            items: block.items.filter((it) => it.id !== itemId),
          };
        });
        return { ...section, levelPlans: nextBlocks };
      }),
    );
  };

  const handleSaveInstructions = async () => {
    try {
      await apiUpdateInstructions(
        assessment.id,
        instructions.filter(i => i.checked).map(i => i.text)
      );

      showToast("Survey Edited Successfully");
      setShowInstructionsModal(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveChanges = async () => {
    try {
      if (!assessment?.id) {
        showToast("Could not save: assessment id is missing.");
        return;
      }

      if (!assessmentName.trim()) {
        showToast("Please enter an assessment name.");
        focusField("mentor-assessment-name");
        return;
      }

      if (!description.trim()) {
        showToast("Please enter a short description.");
        focusField("mentor-assessment-description");
        return;
      }

      const instructionLines = instructions
        .map((instruction) => instruction.text.trim())
        .filter(Boolean);
      if (instructionLines.length === 0) {
        showToast("Please add at least one instruction.");
        focusField("mentor-instruction-0");
        return;
      }

      const invalidSectionName = sections.find((section) => !section.name.trim());
      if (invalidSectionName) {
        showToast("Each section must have a section name.");
        setSelectedSection(invalidSectionName.id);
        setTimeout(() => focusField(`mentor-section-card-${invalidSectionName.id}`), 0);
        return;
      }

      const invalidChoice = sections
        .flatMap((section) =>
          section.layers.flatMap((layer) =>
            layer.choices.map((choice) => ({
              sectionId: section.id,
              layerId: layer.id,
              choiceId: choice.id,
              text: choice.text.trim(),
            })),
          ),
        )
        .find((item) => item.text.length === 0);
      if (invalidChoice) {
        showToast("Every choice field in each layer must be filled.");
        setSelectedSection(invalidChoice.sectionId);
        setIsEditMode(true);
        setTimeout(() => {
          focusField(`mentor-choice-${invalidChoice.sectionId}-${invalidChoice.layerId}-${invalidChoice.choiceId}`);
        }, 0);
        return;
      }

      const existingType = String(assessment.type || "").toUpperCase();
      const isCmaAssessment = existingType === "CMA";
      const preSurveyPayload = buildPreSurveyPayloadForDirectorCreate(preSurveyRows);
      if (isCmaAssessment && hasPreSurvey && preSurveyPayload.length === 0) {
        showToast("Include pre-survey is on — add at least one pre-survey question with text.");
        focusField("mentor-presurvey-question-0");
        return;
      }
      const firstEmptyPreSurveyIdx = isCmaAssessment && hasPreSurvey
        ? preSurveyRows.findIndex((row) => row.text.trim().length === 0)
        : -1;
      if (firstEmptyPreSurveyIdx !== -1) {
        showToast("Fill all pre-survey question fields or remove empty rows.");
        focusField(`mentor-presurvey-question-${firstEmptyPreSurveyIdx}`);
        return;
      }

      const typeForApi: "CMA" | "PMP" = isCmaAssessment ? "CMA" : "PMP";
      const patchBody = {
        name: assessmentName.trim(),
        description: description.trim(),
        type: typeForApi,
        sections: buildSectionsPayload(sections),
        instructions: instructionLines,
        ...(isCmaAssessment
          ? { preSurvey: hasPreSurvey ? preSurveyPayload : [] }
          : {}),
      };

      console.log("MENTOR PATCH BODY", patchBody);
      await apiPatchAssessmentMain(assessment.id, patchBody);

      if (bannerFile) {
        await apiUploadAssessmentBanner(assessment.id, bannerFile);
      }

      showToast("Survey Edited Successfully");
      router.push("/mentor/MentorAssessments");
    } catch (e: unknown) {
      console.error(e);
      showToast(formatAssessmentApiErrorMessage(e));
    }
  };

  const selectedSectionData = sections.find((s) => s.id === selectedSection);
  const levelPlanFor = (section: Section, level: 1 | 2 | 3 | 4): LevelPlanBlock => {
    const found = (section.levelPlans ?? []).find((b) => b.level === level);
    if (found) return found;
    return {
      id: `${section.id}-level-${level}`,
      level,
      items: [{ id: `${section.id}-level-${level}-item-0`, text: "" }],
    };
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#062946] font-[Albert_Sans] text-white">
      <MentorHeader showFullHeader={true} />
      <section className="relative flex-1 px-4 py-6 sm:px-6 md:px-0">
        <div className="mx-auto flex h-full max-w-[1600px] flex-col gap-6 md:flex-row">
          {/* Left Sidebar - Sections */}
          <div className="w-full flex-shrink-0 space-y-3 md:w-80">
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={handleAddSection}
                className="flex items-center gap-2 rounded-lg bg-[#8ec5eb]/90 px-4 py-2 text-sm font-semibold text-[#062946] shadow-md hover:bg-[#8ec5eb]"
              >
                <i className="fa-solid fa-plus"></i>
                Section
              </button>
              {/* <button
                onClick={() => setShowInstructionsModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-transparent text-white rounded-lg font-semibold border-2 border-white/40 hover:border-white/60 hover:bg-white/10 text-sm"
              >
                <i className="fa-solid fa-pen-to-square"></i>
                Edit Instructions
              </button> */}
            </div>

            {sections.map((section, index) => (
              <div
                key={section.id}
                id={`mentor-section-card-${section.id}`}
                onClick={() => setSelectedSection(section.id)}
                tabIndex={-1}
                className={`cursor-pointer rounded-xl border-2 p-4 transition-all ${selectedSection === section.id
                  ? "border-[#8ec5eb]/60 bg-[#8ec5eb]/20 text-white"
                  : "border-white/15 bg-white/5 text-[#cde2f2] hover:border-white/25 hover:bg-white/10"
                  }`}
              >
                <div className="mb-2">
                  <span
                    className={`rounded px-2 py-1 text-xs font-bold ${selectedSection === section.id
                      ? "bg-[#8ec5eb]/30 text-white"
                      : "bg-white/10 text-[#cde2f2]"
                      }`}
                  >
                    Section {index + 1}
                  </span>
                </div>
                <h3 className="font-semibold text-sm leading-tight">
                  {section.name}
                </h3>
                {section.description && (
                  <p className="text-xs mt-1 opacity-70">
                    {section.description}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Main Content Area */}
          <div className="min-w-0 flex-1">
            {selectedSectionData ? (
              <>
                {/* Help Text */}
                <div className="border border-white/20 bg-white/8 rounded-lg p-4 mb-6">
                  <p className="text-white text-sm">
                    Choose the option that best matches how you feel and who you
                    are, as this self-assessment helps you understand yourself
                    better. Your accuracy allows us to provide the best support
                    and guidance.
                  </p>
                </div>

                <div className="rounded-xl border border-white/20 bg-white/5 p-5 mb-6">
                  <div className="mb-4">
                    {/* <h3 className="text-white font-semibold">Basics</h3>
                    <p className="mt-1 text-sm text-white/60">
                      Update the assessment name and description shown in the list and detail views.
                    </p> */}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-[#cde2f2]">
                        Assessment Name
                      </label>
                      <input
                        id="mentor-assessment-name"
                        type="text"
                        value={assessmentName}
                        onChange={(e) => setAssessmentName(e.target.value)}
                        placeholder="e.g. Ministry readiness survey"
                        className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder-white/40"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-[#cde2f2]">
                        Description
                      </label>
                      <textarea
                        id="mentor-assessment-description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        placeholder="Brief description for thumbnail / cards"
                        className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder-white/40"
                      />
                    </div>

                    <div>
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <label className="block text-sm font-semibold text-[#cde2f2]">
                          Banner image (optional)
                        </label>
                        {bannerFile || bannerPreview ? (
                          <button
                            type="button"
                            onClick={() => {
                              if (bannerPreview?.startsWith("blob:")) URL.revokeObjectURL(bannerPreview);
                              setBannerFile(null);
                              setBannerPreview(null);
                            }}
                            className="text-xs font-semibold text-red-300/90 hover:underline"
                          >
                            Remove image
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

                          if (f && !ALLOWED_BANNER_TYPES.has(f.type)) {
                            showToast("Use a PNG, JPG, or WEBP image.");
                            return;
                          }

                          if (f && f.size > MAX_BANNER_SIZE_BYTES) {
                            showToast("File size must be less than 10 MB.");
                            return;
                          }

                          if (bannerPreview?.startsWith("blob:")) {
                            URL.revokeObjectURL(bannerPreview);
                          }

                          setBannerFile(f);
                          setBannerPreview(f ? URL.createObjectURL(f) : null);
                        }}
                      />

                      <div className="space-y-3 rounded-2xl border border-dashed border-white/25 bg-white/[0.04] px-4 py-4">
                        <button
                          type="button"
                          onClick={() => bannerInputRef.current?.click()}
                          className="rounded-lg border border-[#8ec5eb]/50 bg-[#8ec5eb]/20 px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#8ec5eb]/30"
                        >
                          {bannerPreview ? "Replace banner" : "Upload banner"}
                        </button>

                        {bannerPreview ? (
                          <div
                            className="relative h-40 w-full max-w-md cursor-pointer overflow-hidden rounded-xl border border-white/20"
                            onClick={() => bannerInputRef.current?.click()}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                bannerInputRef.current?.click();
                              }
                            }}
                            role="button"
                            tabIndex={0}
                            aria-label="Change banner image"
                          >
                            {bannerPreview.startsWith("blob:") || bannerPreview.startsWith("data:") ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={bannerPreview} alt="Assessment banner preview" className="h-40 w-full object-cover" />
                            ) : (
                              <Image
                                src={bannerPreview}
                                alt="Assessment banner preview"
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 100vw, 520px"
                                unoptimized={isRemoteImageSrc(bannerPreview)}
                              />
                            )}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mb-6 rounded-xl border border-white/20 bg-white/5 p-5">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-white font-semibold">Section Details</h3>
                      <p className="mt-1 text-sm text-white/60">Edit the selected section name and guidelines.</p>
                    </div>
                    {sections.length > 1 ? (
                      <button
                        type="button"
                        onClick={handleDeleteSelectedSection}
                        className="rounded-lg border border-red-300/40 bg-red-500/15 px-3 py-2 text-sm font-semibold text-red-200 hover:bg-red-500/25"
                      >
                        <i className="fa-solid fa-trash mr-2"></i>
                        Delete section
                      </button>
                    ) : null}
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-[#cde2f2]">
                        Name of Section
                      </label>
                      <input
                        type="text"
                        value={selectedSectionData.name}
                        onChange={(e) =>
                          handleUpdateSectionField(selectedSectionData.id, "name", e.target.value)
                        }
                        placeholder="Enter Name of Section"
                        className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder-white/40"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-[#cde2f2]">
                        Guidelines
                      </label>
                      <input
                        type="text"
                        value={selectedSectionData.description}
                        onChange={(e) =>
                          handleUpdateSectionField(selectedSectionData.id, "description", e.target.value)
                        }
                        placeholder="Enter Guidelines"
                        className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder-white/40"
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-white/20 bg-white/5 p-5 mb-6">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-white font-semibold">Edit Instructions</h3>
                    <button
                      onClick={handleAddInstruction}
                      className="rounded-lg bg-[#8ec5eb]/90 px-3 py-2 text-xs font-semibold text-[#062946] hover:bg-[#8ec5eb]"
                    >
                      <i className="fa-solid fa-plus mr-1"></i>
                      Instruction
                    </button>
                  </div>
                  <div className="space-y-2">
                    {instructions.map((instruction, idx) => (
                      <div key={instruction.id} className="flex items-center gap-2">
                        <input
                          id={`mentor-instruction-${idx}`}
                          type="text"
                          value={instruction.text}
                          onChange={(e) => handleUpdateInstructionText(instruction.id, e.target.value)}
                          placeholder={`Instruction ${idx + 1}`}
                          className="min-w-0 flex-1 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder-white/40"
                        />
                        {instructions.length > 1 ? (
                          <button
                            onClick={() => handleRemoveInstruction(instruction.id)}
                            className="rounded-lg border border-red-300/40 bg-red-500/15 px-3 py-2 text-red-200"
                            aria-label={`Remove instruction ${idx + 1}`}
                          >
                            <i className="fa-solid fa-trash"></i>
                          </button>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-white/20 bg-white/5 p-5 mb-6">
                  <div className="mb-4">
                    <span className="mb-2 block text-sm font-semibold text-[#cde2f2]">Include Pre-Survey Questions?</span>
                    <p className="mb-3 text-sm text-white/60">
                      Select Yes to add pre-survey questions before the main assessment.
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
                        No
                      </label>
                      <label className="flex cursor-pointer items-center gap-2 text-sm text-white/90">
                        <input
                          type="radio"
                          name="hasPreSurvey"
                          checked={hasPreSurvey}
                          onChange={() => setHasPreSurvey(true)}
                          className="h-4 w-4"
                        />
                        Yes
                      </label>
                    </div>
                  </div>

                  {hasPreSurvey ? (
                    <div className="rounded-2xl border border-white/15 bg-white/[0.04] p-5 sm:p-6">
                      <h2 className="mb-1 text-lg font-bold text-white">Pre-Survey Question</h2>
                      <p className="mb-4 text-sm text-white/70">
                        These questions will be shown before the main assessment.
                      </p>
                      <div className="space-y-5">
                        {preSurveyRows.map((row, qIdx) => (
                          <div
                            key={row.id}
                            className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-4"
                          >
                            <div className="flex flex-wrap items-end gap-3">
                              <div className="min-w-0 flex-1 sm:min-w-[220px]">
                                <label className="mb-2 block text-sm font-semibold text-[#cde2f2]">Question {qIdx + 1}</label>
                                <input
                                  id={`mentor-presurvey-question-${qIdx}`}
                                  type="text"
                                  value={row.text}
                                  onChange={(e) => handleUpdatePreSurvey(qIdx, "text", e.target.value)}
                                  placeholder="e.g. What is your current church?"
                                  className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder-white/40"
                                />
                              </div>
                              {preSurveyRows.length > 1 ? (
                                <button
                                  type="button"
                                  onClick={() => handleRemovePreSurveyQuestion(qIdx)}
                                  className="rounded-lg border border-red-300/40 bg-red-500/15 px-3 py-2 text-sm text-red-200"
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
                          className="rounded-lg bg-[#8ec5eb]/90 px-3 py-2 text-xs font-semibold text-[#062946] hover:bg-[#8ec5eb]"
                        >
                          <i className="fa-solid fa-plus mr-1"></i>
                          Add pre-survey question
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>

                {/* Divider and Action Buttons */}
                <div className="border-t border-white/20 mb-6"></div>

                <div className="mb-6 flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditMode((prev) => !prev)}
                    className="px-5 py-2 bg-white text-[#2E3B8E] rounded-lg font-semibold hover:bg-gray-100 text-sm flex items-center gap-2 shadow-md"
                  >
                    <i className="fa-solid fa-pen-to-square"></i>
                    {isEditMode ? "Done" : "Edit"}
                  </button>
                  <button
                    onClick={handleAddLayer}
                    className="px-5 py-2 bg-white text-[#2E3B8E] rounded-lg font-semibold hover:bg-gray-100 text-sm flex items-center gap-2 shadow-md"
                  >
                    <i className="fa-solid fa-layer-group"></i>
                    Layer
                  </button>
                </div>

                {/* Layers - Each in its own bordered container */}
                <div className="space-y-6">
                  {selectedSectionData.layers.map((layer, layerIdx) => (
                    <div
                      key={layer.id}
                      className="rounded-xl border-2 border-white/20 bg-white/5 p-5"
                    >
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <h3 className="text-white font-semibold">Layer {layerIdx + 1}</h3>
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <span className="text-xs text-white/60">Choices</span>
                          {selectedSectionData.layers.length > MIN_LAYERS ? (
                            <button
                              type="button"
                              onClick={() => handleRemoveLayer(selectedSectionData.id, layer.id)}
                              className="rounded-lg border border-red-300/40 bg-red-500/15 px-2.5 py-1.5 text-xs font-semibold text-red-200 hover:bg-red-500/25"
                            >
                              <i className="fa-solid fa-trash mr-1"></i>
                              Delete Layer
                            </button>
                          ) : null}
                        </div>
                      </div>

                      <div className="space-y-2 mb-4">
                        {layer.choices.map((choice, choiceIdx) => (
                          <div
                            key={choice.id}
                            className="bg-white/10 border border-white/25 rounded-lg p-3 text-white flex items-center gap-3 transition-all"
                          >
                            <span className="text-sm font-semibold">
                              {choiceIdx + 1}.
                            </span>
                            <input
                              id={`mentor-choice-${selectedSectionData.id}-${layer.id}-${choice.id}`}
                              value={choice.text}
                              onChange={(e) =>
                                handleUpdateChoiceText(
                                  selectedSectionData.id,
                                  layer.id,
                                  choice.id,
                                  e.target.value,
                                )
                              }
                              className="min-w-0 flex-1 rounded border border-white/20 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/40"
                              placeholder={`Choice ${choiceIdx + 1}`}
                              readOnly={!isEditMode}
                            />
                            {isEditMode && layer.choices.length > 1 ? (
                              <button
                                type="button"
                                onClick={() =>
                                  handleRemoveChoice(selectedSectionData.id, layer.id, choice.id)
                                }
                                className="rounded-lg border border-red-300/40 bg-red-500/15 px-2.5 py-2 text-red-200"
                                aria-label={`Remove choice ${choiceIdx + 1}`}
                              >
                                <i className="fa-solid fa-trash"></i>
                              </button>
                            ) : null}
                          </div>
                        ))}
                      </div>

                      {isEditMode ? (
                        <div className="mb-4 flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleAddChoice(selectedSectionData.id, layer.id)}
                            className="px-4 py-2 bg-white text-[#2E3B8E] rounded-lg font-semibold hover:bg-gray-100 text-sm flex items-center gap-2 shadow-md"
                          >
                            <i className="fa-solid fa-plus"></i>
                            Choice
                          </button>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>

                <div className="rounded-xl border-2 border-white/20 bg-white/5 p-5 mt-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-white font-semibold">Customized Development Plans</h3>
                    <span className="text-xs text-white/70">Edit Level 1-4 items</span>
                  </div>

                  <div className="space-y-4">
                    {[1, 2, 3, 4].map((levelNum) => {
                      const level = levelNum as 1 | 2 | 3 | 4;
                      const block = levelPlanFor(selectedSectionData, level);
                      return (
                        <div key={levelNum} className="rounded-lg border border-white/15 bg-white/[0.03] p-4">
                          <div className="mb-3 flex items-center justify-between">
                            <h4 className="text-sm font-semibold text-[#cde2f2]">
                              Level {levelNum} - Customized Development Plans
                            </h4>
                            <button
                              type="button"
                              onClick={() => handleAddLevelPlanItem(selectedSectionData.id, level)}
                              className="rounded-lg border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white hover:bg-white/15"
                            >
                              <i className="fa-solid fa-plus mr-1"></i>
                              Plan
                            </button>
                          </div>

                          <div className="space-y-2">
                            {block.items.map((item, itemIdx) => (
                              <div key={item.id} className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={item.text}
                                  onChange={(e) =>
                                    handleUpdateLevelPlanItem(
                                      selectedSectionData.id,
                                      level,
                                      item.id,
                                      e.target.value,
                                    )
                                  }
                                  placeholder={`Plan item ${itemIdx + 1}`}
                                  className="flex-1 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder-white/40"
                                />
                                {block.items.length > 1 ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleRemoveLevelPlanItem(
                                        selectedSectionData.id,
                                        level,
                                        item.id,
                                      )
                                    }
                                    className="rounded-lg border border-red-300/40 bg-red-500/15 px-3 py-2 text-red-200"
                                    aria-label={`Remove level ${levelNum} plan item ${itemIdx + 1}`}
                                  >
                                    <i className="fa-solid fa-trash"></i>
                                  </button>
                                ) : null}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-white">
                  <i className="fa-solid fa-list-check text-6xl mb-4 opacity-50"></i>
                  <p className="text-xl font-semibold">
                    Select a section to view
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Action Buttons */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end sm:gap-4">
          <button
            onClick={() => router.push("/mentor/MentorAssessments")}
            className="rounded-lg bg-white px-10 py-3 font-semibold text-gray-700 shadow-md hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveChanges}
            className="rounded-lg bg-[#8ec5eb]/90 px-10 py-3 font-semibold text-[#062946] shadow-md hover:bg-[#8ec5eb]"
          >
            Save Changes
          </button>
        </div>
      </section>

      {/* Instructions Modal */}
      {showInstructionsModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a3558] rounded-2xl border border-white/15 w-full max-w-2xl shadow-2xl">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-2xl font-bold text-white">
                Comprehensive Self Assessment Survey
              </h3>
              <button
                onClick={() => setShowInstructionsModal(false)}
                className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-lg"
              >
                <i className="fa-solid fa-xmark text-white/80"></i>
              </button>
            </div>

            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-bold text-white">
                  Survey Guidelines
                </h4>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowInstructionsModal(false)}
                    className="px-4 py-2 bg-white border-2 border-[#2E3B8E] text-[#2E3B8E] rounded-lg font-semibold hover:bg-blue-50 text-sm flex items-center gap-2"
                  >
                    <i className="fa-solid fa-pen-to-square"></i>
                    Edit Next Section
                  </button>
                  <button
                    onClick={handleDeleteInstructions}
                    className="px-4 py-2 bg-white border-2 border-red-600 text-red-600 rounded-lg font-semibold hover:bg-red-50 text-sm flex items-center gap-2"
                  >
                    <i className="fa-solid fa-trash"></i>
                    Delete
                  </button>
                  <button className="px-4 py-2 bg-white border-2 border-[#2E3B8E] text-[#2E3B8E] rounded-lg font-semibold hover:bg-blue-50 text-sm flex items-center gap-2">
                    <i className="fa-solid fa-file-lines"></i>
                    Instruction
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  {instructions.filter((i) => i.checked).length} Selected
                </label>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {instructions.map((instruction) => (
                  <label
                    key={instruction.id}
                    className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={instruction.checked}
                      onChange={() => {
                        setInstructions(
                          instructions.map((inst) =>
                            inst.id === instruction.id
                              ? { ...inst, checked: !inst.checked }
                              : inst
                          )
                        );
                      }}
                      className="w-5 h-5 text-[#2E3B8E] rounded mt-0.5"
                    />
                    <span className="text-gray-700 text-sm">
                      {instruction.text}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="p-6 border-t flex justify-between gap-4">
              <button
                onClick={() => setShowInstructionsModal(false)}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveInstructions}
                className="flex-1 px-6 py-3 bg-[#2E3B8E] text-white rounded-lg font-semibold hover:bg-[#1F2A6E]"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[70] animate-fade-in">
          <div className="bg-white rounded-xl px-6 py-4 shadow-2xl flex items-center gap-3 border-2 border-green-500">
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
              <i className="fa-solid fa-check text-white text-xs"></i>
            </div>
            <span className="text-[#2E3B8E] font-semibold">{toast}</span>
          </div>
        </div>
      )}
    </div>
  );
}
