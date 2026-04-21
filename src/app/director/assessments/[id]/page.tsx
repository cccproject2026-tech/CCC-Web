"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import DirectorHero from "../../DirectorHero";
import AssessmentBg from "../../../Assets/assessment-bg.png";
import { directorGlassCard, directorPageRoot, directorSpinner } from "../../directorUi";
import {
  apiGetAssessmentById,
  apiUpdateInstructions,
  apiUpdateSections,
  parseAssessmentDetailPayload,
} from "@/app/Services/assessment.service";
import {
  mapAssessmentFromApi,
  buildSectionsPayload,
  type Section,
  type Layer as MapperLayer,
} from "@/app/Services/utils/assessment-mapper";

/** New section for the editor — matches `mapAssessmentFromApi` / `buildSectionsPayload` shape. */
function createSectionFromModal(
  name: string,
  guidelines: string,
  layerChoices: string[][],
): Section {
  const layers: MapperLayer[] = layerChoices.map((choiceTexts, i) => {
    const cleaned = choiceTexts.map((t) => t.trim()).filter(Boolean);
    const texts = cleaned.length > 0 ? cleaned : ["Option 1"];
    return {
      id: crypto.randomUUID(),
      name: `Layer ${i + 1}`,
      choices: texts.map((text, j) => ({
        id: crypto.randomUUID(),
        text: text || `Option ${j + 1}`,
      })),
      recommendations: [],
    };
  });
  return {
    id: crypto.randomUUID(),
    name: name.trim(),
    description: (guidelines || "").trim(),
    layers,
  };
}

export default function ViewEditAssessmentPage() {
  const router = useRouter();
  const params = useParams();
  const [toast, setToast] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState<string>("");
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedChoices, setSelectedChoices] = useState<number[]>([]);
  const [assessment, setAssessment] = useState<any>(null);
  const [loadError, setLoadError] = useState(false);

  // Modals
  const [showAddSectionModal, setShowAddSectionModal] = useState(false);
  const [showAddLayerModal, setShowAddLayerModal] = useState(false);
  const [showRecommendationsModal, setShowRecommendationsModal] =
    useState(false);
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);
  const [currentLayerId, setCurrentLayerId] = useState<string | null>(null);
  const [recSelectionMode, setRecSelectionMode] = useState(false);
  const [selectedRecs, setSelectedRecs] = useState<string[]>([]);

  // Form state for Add Section
  const [newSectionName, setNewSectionName] = useState("");
  const [newSectionGuidelines, setNewSectionGuidelines] = useState("");
  const [newSectionLayers, setNewSectionLayers] = useState(2);
  /** Per-layer choice labels while building a new section in the modal (each layer ≥ 1 row). */
  const [newSectionLayerChoices, setNewSectionLayerChoices] = useState<
    string[][]
  >([[''], ['']]);

  type InstructionRow = { id: string; text: string; checked: boolean };
  const [instructions, setInstructions] = useState<InstructionRow[]>([]);

  const [sections, setSections] = useState<Section[]>([]);
  const [savingSection, setSavingSection] = useState(false);

  useEffect(() => {
    if (!params?.id) return;

    const fetchAssessment = async () => {
      setLoadError(false);
      try {
        const res = await apiGetAssessmentById(params.id as string);
        const raw = parseAssessmentDetailPayload(
          (res.data as { data?: unknown })?.data ?? res.data,
        );
        if (!raw) {
          console.error("Invalid assessment payload");
          setLoadError(true);
          return;
        }
        const mapped = mapAssessmentFromApi(raw);

        setAssessment(mapped);
        setSections(mapped.sections);
        setInstructions(mapped.instructions);

        if (mapped.sections.length > 0) {
          setSelectedSection(mapped.sections[0].id);
        }
      } catch (error) {
        console.error("Failed to fetch assessment", error);
        setLoadError(true);
      }
    };

    fetchAssessment();
  }, [params?.id]);

  useEffect(() => {
    setNewSectionLayerChoices((prev) => {
      const n = newSectionLayers;
      const next: string[][] = [];
      for (let i = 0; i < n; i++) {
        next[i] = prev[i]?.length ? [...prev[i]] : [""];
      }
      return next;
    });
  }, [newSectionLayers]);

  const resetAddSectionForm = () => {
    setNewSectionName("");
    setNewSectionGuidelines("");
    setNewSectionLayers(2);
    setNewSectionLayerChoices([[''], ['']]);
  };

  const openAddSectionModal = () => {
    resetAddSectionForm();
    setShowAddSectionModal(true);
  };

  const closeAddSectionModal = () => {
    setShowAddSectionModal(false);
    resetAddSectionForm();
  };

  const appendModalChoice = (layerIdx: number) => {
    setNewSectionLayerChoices((prev) =>
      prev.map((row, i) => (i === layerIdx ? [...row, ""] : [...row])),
    );
  };

  const updateModalChoice = (
    layerIdx: number,
    choiceIdx: number,
    value: string,
  ) => {
    setNewSectionLayerChoices((prev) =>
      prev.map((row, i) => {
        if (i !== layerIdx) return [...row];
        const r = [...row];
        r[choiceIdx] = value;
        return r;
      }),
    );
  };

  /** Append a new choice to a layer (no modal — edit text in place). */
  const handleAppendChoice = (sectionId: string, layerId: string) => {
    setSections((prev) =>
      prev.map((section) =>
        section.id !== sectionId
          ? section
          : {
              ...section,
              layers: section.layers.map((layer) => {
                if (layer.id !== layerId) return layer;
                const n = layer.choices.length + 1;
                return {
                  ...layer,
                  choices: [
                    ...layer.choices,
                    {
                      id: crypto.randomUUID(),
                      text: `Option ${n}`,
                    },
                  ],
                };
              }),
            },
      ),
    );
  };

  const handleUpdateChoiceText = (
    sectionId: string,
    layerId: string,
    choiceId: string,
    text: string,
  ) => {
    setSections((prev) =>
      prev.map((section) =>
        section.id !== sectionId
          ? section
          : {
              ...section,
              layers: section.layers.map((layer) =>
                layer.id !== layerId
                  ? layer
                  : {
                      ...layer,
                      choices: layer.choices.map((c) =>
                        c.id === choiceId ? { ...c, text } : c,
                      ),
                    },
              ),
            },
      ),
    );
  };

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const handleSelectChoice = (choiceIdx: number) => {
    if (selectedChoices.includes(choiceIdx)) {
      setSelectedChoices(selectedChoices.filter((idx) => idx !== choiceIdx));
    } else {
      setSelectedChoices([...selectedChoices, choiceIdx]);
    }
  };

  const handleDeleteSelected = () => {
    showToast("Choices of Survey has been Deleted");
    setSelectedChoices([]);
    setIsSelectionMode(false);
  };

  const handleSelectRec = (recId: string) => {
    if (selectedRecs.includes(recId)) {
      setSelectedRecs(selectedRecs.filter((id) => id !== recId));
    } else {
      setSelectedRecs([...selectedRecs, recId]);
    }
  };

  const handleDeleteRecs = () => {
    showToast("Deleted Suggestions");
    setSelectedRecs([]);
    setRecSelectionMode(false);
  };

  const handleSaveRecommendations = () => {
    showToast("Suggestions Edited Successfully");
    setShowRecommendationsModal(false);
  };

  const handleAddSection = async () => {
    if (!newSectionName.trim()) return;

    const next = createSectionFromModal(
      newSectionName,
      newSectionGuidelines,
      newSectionLayerChoices,
    );
    const merged = [...sections, next];

    setSections(merged);
    setSelectedSection(next.id);
    setShowAddSectionModal(false);
    resetAddSectionForm();

    setSavingSection(true);
    try {
      await apiUpdateSections(assessment.id, buildSectionsPayload(merged) as any);
      showToast("Section added and saved");
    } catch (e) {
      console.error(e);
      showToast(
        "Section added here — save failed on server. Use “Save changes” to retry.",
      );
    } finally {
      setSavingSection(false);
    }
  };

  const handleAddLayer = () => {
    if (!selectedSection) return;
    setSections((prev) =>
      prev.map((section) => {
        if (section.id !== selectedSection) return section;
        const nextNum = section.layers.length + 1;
        return {
          ...section,
          layers: [
            ...section.layers,
            {
              id: crypto.randomUUID(),
              name: `Layer ${nextNum}`,
              choices: [{ id: crypto.randomUUID(), text: "Option 1" }],
              recommendations: [],
            },
          ],
        };
      }),
    );
    setShowAddLayerModal(false);
    showToast("Layer added — click Save changes to persist.");
  };

  const handleDeleteInstructions = () => {
    showToast("Deleted Survey Instructions");
    setShowInstructionsModal(false);
  };

  const handleSaveInstructions = async () => {
    try {
      await apiUpdateInstructions(
        assessment.id,
        instructions.filter((i) => i.checked).map((i) => i.text),
      );

      showToast("Survey Edited Successfully");
      setShowInstructionsModal(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveChanges = async () => {
    try {
      await apiUpdateSections(
        assessment.id,
        buildSectionsPayload(sections)
      );

      showToast("Survey Edited Successfully");
      router.push("/director/assessments");
    } catch (e) {
      console.error(e);
    }
  };

  const selectedSectionData = sections.find((s) => s.id === selectedSection);
  const currentLayer = selectedSectionData?.layers.find(
    (l) => l.id === currentLayerId
  );

  if (!assessment) {
    return (
      <div className={directorPageRoot}>
        <DirectorHero
          title="Assessment"
          subtitle={loadError ? "Could not load this assessment." : "Loading survey builder…"}
          image={AssessmentBg}
          breadcrumbItems={[
            { label: "Home", href: "/director/home" },
            { label: "Assessments", href: "/director/assessments" },
            { label: loadError ? "Error" : "…" },
          ]}
        />
        <section className="flex flex-1 flex-col items-center justify-center gap-6 px-4 pb-16 pt-4">
          {loadError ? (
            <>
              <p className="text-center text-white/80">Check the link or try again from the list.</p>
              <button
                type="button"
                onClick={() => router.push("/director/assessments")}
                className="rounded-xl border border-[#8ec5eb]/40 bg-[#8ec5eb]/15 px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#8ec5eb]/25"
              >
                Back to assessments
              </button>
            </>
          ) : (
            <div className={directorSpinner} />
          )}
        </section>
      </div>
    );
  }

  return (
    <div className={directorPageRoot}>
      <DirectorHero
        title={assessment.name || "Edit assessment"}
        subtitle="Sections, layers, choices, and instructions — save when done."
        image={AssessmentBg}
        breadcrumbItems={[
          { label: "Home", href: "/director/home" },
          { label: "Assessments", href: "/director/assessments" },
          { label: assessment.name || "Edit" },
        ]}
      />

      <section className="relative flex-1 px-0 pb-10 pt-2 sm:px-2">
        <div className="mx-auto flex h-full max-w-[1600px] flex-col gap-6 lg:flex-row lg:gap-8">
          {/* Left Sidebar - Sections */}
          <div className={`w-full flex-shrink-0 space-y-3 lg:w-80 ${directorGlassCard} p-4`}>
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={openAddSectionModal}
                className="flex items-center gap-2 rounded-lg border border-[#8ec5eb]/40 bg-[#8ec5eb]/15 px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#8ec5eb]/25"
              >
                <i className="fa-solid fa-plus"></i>
                Section
              </button>
              <button
                type="button"
                onClick={() => setShowInstructionsModal(true)}
                className="flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                <i className="fa-solid fa-pen-to-square"></i>
                Instructions
              </button>
            </div>

            {sections.map((section, index) => (
              <div
                key={section.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedSection(section.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedSection(section.id);
                  }
                }}
                className={`cursor-pointer rounded-xl border-2 p-4 transition-all ${
                  selectedSection === section.id
                    ? "border-[#8ec5eb]/50 bg-[#8ec5eb]/15 text-white"
                    : "border-white/10 bg-white/5 text-white/90 hover:border-white/25 hover:bg-white/10"
                }`}
              >
                <div className="mb-2">
                  <span className="rounded bg-[#8ec5eb]/25 px-2 py-1 text-xs font-bold text-[#cde2f2]">
                    Section {index + 1}
                  </span>
                </div>
                <h3 className="text-sm font-semibold leading-tight">{section.name}</h3>
                {section.description ? (
                  <p className="mt-1 text-xs text-white/60">{section.description}</p>
                ) : null}
              </div>
            ))}
          </div>

          {/* Main Content Area */}
          <div className={`min-w-0 flex-1 ${directorGlassCard} p-5 sm:p-6`}>
            {selectedSectionData ? (
              <>
                {/* Help Text */}
                <div className="mb-6 rounded-lg border border-white/15 bg-white/5 p-4">
                  <p className="text-sm text-white/85">
                    Choose the option that best matches how you feel and who you
                    are, as this self-assessment helps you understand yourself
                    better. Your accuracy allows us to provide the best support
                    and guidance.
                  </p>
                </div>

                {/* Divider and Action Buttons */}
                <div className="mb-6 border-t border-white/15" />

                <div className="mb-6 flex justify-end gap-2">
                  {!isSelectionMode ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setIsSelectionMode(true)}
                        className="flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-5 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
                      >
                        <i className="fa-solid fa-check-square"></i>
                        Select
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddLayerModal(true)}
                        className="flex items-center gap-2 rounded-lg border border-[#8ec5eb]/40 bg-[#8ec5eb]/15 px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#8ec5eb]/25"
                      >
                        <i className="fa-solid fa-layer-group"></i>
                        Layer
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="flex items-center font-semibold text-white">
                        {selectedChoices.length} Selected
                      </span>
                      <button
                        type="button"
                        onClick={handleDeleteSelected}
                        disabled={selectedChoices.length === 0}
                        className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold ${
                          selectedChoices.length > 0
                            ? "border border-red-400/40 bg-red-500/20 text-red-100 hover:bg-red-500/30"
                            : "cursor-not-allowed border border-white/10 bg-white/5 text-white/40"
                        }`}
                      >
                        <i className="fa-solid fa-trash"></i>
                        Delete
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsSelectionMode(false);
                          setSelectedChoices([]);
                        }}
                        className="rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>

                {/* Layers - Each in its own bordered container */}
                <div className="space-y-6">
                  {selectedSectionData.layers.map((layer, layerIdx) => (
                    <div
                      key={layer.id}
                      className="rounded-xl border border-white/15 bg-white/5 p-5"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-white">Layer {layerIdx + 1}</h3>
                        <button
                          type="button"
                          onClick={() => {
                            setCurrentLayerId(layer.id);
                            setShowRecommendationsModal(true);
                          }}
                          className="flex items-center gap-2 rounded-lg border border-[#8ec5eb]/40 bg-[#8ec5eb]/15 px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#8ec5eb]/25"
                        >
                          <i className="fa-solid fa-pen-to-square"></i>
                          Edit Recommendations
                        </button>
                      </div>

                      <div className="mb-4 space-y-2">
                        {layer.choices.map((choice, choiceIdx) => (
                          <div
                            key={choice.id}
                            className={`flex items-center gap-3 rounded-lg border p-3 text-white transition-all ${
                              selectedChoices.includes(layerIdx * 10 + choiceIdx)
                                ? "border-[#8ec5eb] ring-2 ring-[#8ec5eb]/40"
                                : "border-white/15 bg-white/5"
                            } ${isSelectionMode ? "cursor-pointer hover:border-[#8ec5eb]/50" : ""}`}
                            onClick={() =>
                              isSelectionMode &&
                              handleSelectChoice(layerIdx * 10 + choiceIdx)
                            }
                          >
                            {isSelectionMode && (
                              <input
                                type="checkbox"
                                checked={selectedChoices.includes(
                                  layerIdx * 10 + choiceIdx,
                                )}
                                onChange={() =>
                                  handleSelectChoice(layerIdx * 10 + choiceIdx)
                                }
                                className="h-5 w-5 rounded text-[#2E3B8E] focus:ring-[#2E3B8E]"
                              />
                            )}
                            <span className="w-7 shrink-0 text-sm font-semibold">
                              {choiceIdx + 1}.
                            </span>
                            {isSelectionMode ? (
                              <span className="flex-1 text-sm">{choice.text}</span>
                            ) : (
                              <input
                                type="text"
                                value={choice.text}
                                onChange={(e) =>
                                  handleUpdateChoiceText(
                                    selectedSectionData.id,
                                    layer.id,
                                    choice.id,
                                    e.target.value,
                                  )
                                }
                                onClick={(e) => e.stopPropagation()}
                                placeholder="Choice text"
                                className="min-w-0 flex-1 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40 outline-none focus:border-[#8ec5eb]/50 focus:ring-1 focus:ring-[#8ec5eb]/30"
                              />
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (selectedSectionData) {
                              handleAppendChoice(selectedSectionData.id, layer.id);
                            }
                          }}
                          className="flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
                        >
                          <i className="fa-solid fa-plus"></i>
                          Choice
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex h-full min-h-[200px] items-center justify-center">
                <div className="text-center text-white/80">
                  <i className="fa-solid fa-list-check mb-4 text-5xl opacity-40"></i>
                  <p className="text-lg font-semibold">Select a section to view</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Action Buttons */}
        <div className="mx-auto mt-8 flex max-w-[1600px] flex-wrap justify-end gap-4 px-0">
          <button
            type="button"
            onClick={() => router.push("/director/assessments")}
            className="rounded-xl border border-white/25 bg-white/10 px-8 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveChanges}
            className="rounded-xl border border-[#8ec5eb]/50 bg-[#8ec5eb]/20 px-8 py-3 text-sm font-semibold text-white shadow-[0_0_0_1px_rgba(142,197,235,0.15)] transition hover:bg-[#8ec5eb]/30"
          >
            Save changes
          </button>
        </div>
      </section>

      {/* Add Section Modal (Offcanvas from right) */}
      {showAddSectionModal && (
        <div className="fixed inset-0 bg-black/60 flex justify-end z-50">
          <div className="bg-white w-full max-w-lg h-full overflow-y-auto shadow-2xl animate-slide-left">
            <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center z-10">
              <h3 className="text-2xl font-bold text-gray-900">Add Section</h3>
              <button
                type="button"
                onClick={closeAddSectionModal}
                className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-lg"
              >
                <i className="fa-solid fa-xmark text-gray-600"></i>
              </button>
            </div>

            <div className="p-6 space-y-6">
              <h4 className="text-xl font-bold text-gray-900">
                Section {sections.length + 1}
              </h4>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name of Section
                </label>
                <input
                  type="text"
                  value={newSectionName}
                  onChange={(e) => setNewSectionName(e.target.value)}
                  placeholder="Enter Name of Section"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E3B8E] text-gray-900 placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Guidelines
                </label>
                <input
                  type="text"
                  value={newSectionGuidelines}
                  onChange={(e) => setNewSectionGuidelines(e.target.value)}
                  placeholder="Enter Guidelines"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E3B8E] text-gray-900 placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Layers
                </label>
                <select
                  value={newSectionLayers}
                  onChange={(e) => setNewSectionLayers(Number(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E3B8E] text-gray-900"
                >
                  {[2, 3, 4, 5].map((num) => (
                    <option key={num} value={num}>
                      {num}
                    </option>
                  ))}
                </select>
              </div>

              {Array.from({ length: newSectionLayers }).map((_, i) => (
                <div key={i} className="border-t pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-base font-bold text-gray-900">
                      Layer {i + 1}
                    </label>
                    <button
                      type="button"
                      onClick={() => appendModalChoice(i)}
                      className="px-3 py-1 bg-white border-2 border-[#2E3B8E] text-[#2E3B8E] rounded-lg text-sm font-semibold hover:bg-blue-50 flex items-center gap-1"
                    >
                      <i className="fa-solid fa-plus"></i>
                      Choice
                    </button>
                  </div>
                  <div className="space-y-2">
                    {(newSectionLayerChoices[i] ?? [""]).map((text, j) => (
                      <input
                        key={`${i}-${j}`}
                        type="text"
                        value={text}
                        onChange={(e) =>
                          updateModalChoice(i, j, e.target.value)
                        }
                        placeholder={`Choice ${j + 1}`}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E3B8E] text-gray-900 placeholder-gray-400"
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="sticky bottom-0 bg-white border-t p-6 flex justify-between gap-4">
              <button
                type="button"
                onClick={closeAddSectionModal}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleAddSection()}
                disabled={!newSectionName.trim() || savingSection}
                className={`flex-1 px-6 py-3 rounded-lg font-semibold ${newSectionName.trim() && !savingSection
                  ? "bg-[#2E3B8E] text-white hover:bg-[#1F2A6E]"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
              >
                {savingSection ? "Saving…" : "Create Section"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Layer Modal */}
      {showAddLayerModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Add Layer</h3>
              <button
                onClick={() => setShowAddLayerModal(false)}
                className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-lg"
              >
                <i className="fa-solid fa-xmark text-gray-600"></i>
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-base font-bold text-gray-900">
                    Layer {selectedSectionData?.layers.length! + 1}
                  </label>
                  <button className="px-3 py-1 bg-white border-2 border-[#2E3B8E] text-[#2E3B8E] rounded-lg text-sm font-semibold hover:bg-blue-50 flex items-center gap-1">
                    <i className="fa-solid fa-plus"></i>
                    Choice
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Choice 1"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E3B8E] text-gray-900 placeholder-gray-400"
                />
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-base font-bold text-gray-900">
                    Layer {selectedSectionData?.layers.length! + 1} -
                    Recommendations
                  </label>
                  <button className="px-3 py-1 bg-white border-2 border-[#2E3B8E] text-[#2E3B8E] rounded-lg text-sm font-semibold hover:bg-blue-50 flex items-center gap-1">
                    <i className="fa-solid fa-plus"></i>
                    Suggestion
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Suggestion 1"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E3B8E] text-gray-900 placeholder-gray-400"
                />
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setShowAddLayerModal(false)}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddLayer}
                className="flex-1 px-6 py-3 bg-[#2E3B8E] text-white rounded-lg font-semibold hover:bg-[#1F2A6E]"
              >
                Create Layer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recommendations Modal */}
      {showRecommendationsModal && currentLayer && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#2E3B8E] rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-6 border-b border-white/20 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">
                Layer {currentLayerId} - Recommendations
              </h3>
              <button
                onClick={() => {
                  setShowRecommendationsModal(false);
                  setRecSelectionMode(false);
                  setSelectedRecs([]);
                }}
                className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-lg text-white"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="p-6">
              <div className="flex gap-2 mb-4">
                {!recSelectionMode ? (
                  <>
                    <button
                      onClick={() => setRecSelectionMode(true)}
                      className="px-4 py-2 bg-white text-[#2E3B8E] rounded-lg font-semibold hover:bg-gray-100 text-sm flex items-center gap-2"
                    >
                      <i className="fa-solid fa-check"></i>
                      Select
                    </button>
                    <button className="px-4 py-2 bg-white text-[#2E3B8E] rounded-lg font-semibold hover:bg-gray-100 text-sm flex items-center gap-2">
                      <i className="fa-solid fa-lightbulb"></i>
                      Suggestion
                    </button>
                  </>
                ) : (
                  <>
                    <span className="text-white font-semibold">
                      {selectedRecs.length} Selected
                    </span>
                    <button
                      onClick={handleDeleteRecs}
                      disabled={selectedRecs.length === 0}
                      className={`px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 ${selectedRecs.length > 0
                        ? "bg-white text-red-600 hover:bg-red-50"
                        : "bg-white/20 text-white/50 cursor-not-allowed"
                        }`}
                    >
                      <i className="fa-solid fa-trash"></i>
                      Delete
                    </button>
                  </>
                )}
              </div>

              <div className="space-y-2 mb-6 max-h-96 overflow-y-auto">
                {currentLayer.recommendations.map((rec) => (
                  <div
                    key={rec.id}
                    className={`bg-[#4A6FA5] border rounded-lg p-3 text-white flex items-center gap-3 transition-all ${selectedRecs.includes(rec.id)
                      ? "border-white ring-2 ring-white"
                      : "border-white/30"
                      } ${recSelectionMode
                        ? "cursor-pointer hover:border-white"
                        : ""
                      }`}
                    onClick={() => recSelectionMode && handleSelectRec(rec.id)}
                  >
                    {recSelectionMode ? (
                      <input
                        type="checkbox"
                        checked={selectedRecs.includes(rec.id)}
                        onChange={() => handleSelectRec(rec.id)}
                        className="w-5 h-5 text-[#2E3B8E] rounded"
                      />
                    ) : (
                      <i className="fa-solid fa-star text-yellow-400"></i>
                    )}
                    <span className="text-sm flex-1">{rec.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 border-t border-white/20 flex justify-between gap-4">
              <button
                onClick={() => {
                  setShowRecommendationsModal(false);
                  setRecSelectionMode(false);
                  setSelectedRecs([]);
                }}
                className="flex-1 px-6 py-3 bg-white text-gray-700 rounded-lg font-semibold hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRecommendations}
                className="flex-1 px-6 py-3 bg-[#1F2A6E] text-white rounded-lg font-semibold hover:bg-[#0F1A5E]"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Instructions Modal */}
      {showInstructionsModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-2xl font-bold text-gray-900">
                Comprehensive Self Assessment Survey
              </h3>
              <button
                onClick={() => setShowInstructionsModal(false)}
                className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-lg"
              >
                <i className="fa-solid fa-xmark text-gray-600"></i>
              </button>
            </div>

            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-bold text-gray-900">
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
