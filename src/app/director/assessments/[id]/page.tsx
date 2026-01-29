"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import AppHeader from "@/app/Components/Header/AppHeader";
import AppFooter from "@/app/Components/AppFooter";
import { apiGetAssessmentById } from "@/app/Services/assessment.service";

interface Recommendation {
  id: number;
  text: string;
  selected: boolean;
}

interface Choice {
  id: string;
  text: string;
}

interface Layer {
  id: string;
  name: string;
  choices: Choice[];
  recommendations: Recommendation[];
}

interface Section {
  id: number;
  name: string;
  description: string;
  layers: Layer[];
}

export const mapAssessmentFromApi = (data: any) => ({
  id: data._id,
  name: data.name,
  description: data.description,
  bannerImage: data.bannerImage,
  type: data.type,

  instructions: (data.instructions ?? []).map((text: string, idx: number) => ({
    id: `inst-${idx}`,
    text,
    checked: true,
  })),

  sections: (data.sections ?? []).map((section: any) => ({
    id: section._id,
    name: section.title,
    description: section.description,

    layers: (section.layers ?? []).map((layer: any) => ({
      id: layer._id,
      name: layer.title,

      // 🔑 CRITICAL FIX
      choices: (layer.choices ?? []).map((c: any) => ({
        id: c._id,
        text: c.text,
      })),

      // 🔑 recommendations are STRINGS in DTO
      recommendations: (layer.recommendations ?? []).map(
        (text: string, idx: number) => ({
          id: `${layer._id}-rec-${idx}`,
          text,
          selected: false,
        })
      ),
    })),
  })),
});

export default function ViewEditAssessmentPage() {
  const router = useRouter();
  const params = useParams();
  const [toast, setToast] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState<number>(1);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedChoices, setSelectedChoices] = useState<number[]>([]);
  const [assessment, setAssessment] = useState<any>(null);

  // Modals
  const [showAddSectionModal, setShowAddSectionModal] = useState(false);
  const [showAddLayerModal, setShowAddLayerModal] = useState(false);
  const [showRecommendationsModal, setShowRecommendationsModal] =
    useState(false);
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);
  const [currentLayerId, setCurrentLayerId] = useState<number | null>(null);
  const [recSelectionMode, setRecSelectionMode] = useState(false);
  const [selectedRecs, setSelectedRecs] = useState<number[]>([]);

  // Form state for Add Section
  const [newSectionName, setNewSectionName] = useState("");
  const [newSectionGuidelines, setNewSectionGuidelines] = useState("");
  const [newSectionLayers, setNewSectionLayers] = useState(2);

  // Instructions state
  const [instructions, setInstructions] = useState([]);

  const [sections, setSections] = useState<Section[]>([]);

  useEffect(() => {
    if (!params?.id) return;

    const fetchAssessment = async () => {
      try {
        const res = await apiGetAssessmentById(params.id as string);

        console.log("ASSESSMENT API RESPONSE 👉", res.data);

        const mapped = mapAssessmentFromApi(res.data);

        setAssessment(mapped);
        setSections(mapped.sections);
        setInstructions(mapped.instructions);

        if (mapped.sections.length > 0) {
          setSelectedSection(mapped.sections[0].id);
        }
      } catch (error) {
        console.error("Failed to fetch assessment", error);
      }
    };

    fetchAssessment();
  }, [params?.id]);

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

  const handleSelectRec = (recId: number) => {
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

  const handleAddSection = () => {
    if (!newSectionName) return;

    showToast("Section Added Successfully");
    setShowAddSectionModal(false);
    setNewSectionName("");
    setNewSectionGuidelines("");
    setNewSectionLayers(2);
  };

  const handleAddLayer = () => {
    showToast("Layer Added Successfully");
    setShowAddLayerModal(false);
  };

  const handleDeleteInstructions = () => {
    showToast("Deleted Survey Instructions");
    setShowInstructionsModal(false);
  };

  const handleSaveInstructions = () => {
    showToast("Survey Edited Successfully");
    setShowInstructionsModal(false);
  };

  const handleSaveChanges = () => {
    showToast("Survey Edited Successfully");
    setTimeout(() => {
      router.push("/director/assessments");
    }, 2000);
  };

  const selectedSectionData = sections.find((s) => s.id === selectedSection);
  const currentLayer = selectedSectionData?.layers.find(
    (l) => l.id === currentLayerId
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#2876AC]">
      <section className="relative py-10 px-4 sm:px-6 md:px-12 lg:px-20 flex-1">
        <div className="max-w-[1600px] mx-auto flex gap-6 h-full">
          {/* Left Sidebar - Sections */}
          <div className="w-80 flex-shrink-0 space-y-3">
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={() => setShowAddSectionModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white text-[#2E3B8E] rounded-lg font-semibold hover:bg-gray-100 shadow-md text-sm"
              >
                <i className="fa-solid fa-plus"></i>
                Section
              </button>
              <button
                onClick={() => setShowInstructionsModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-transparent text-white rounded-lg font-semibold border-2 border-white/40 hover:border-white/60 hover:bg-white/10 text-sm"
              >
                <i className="fa-solid fa-pen-to-square"></i>
                Edit Next Section
              </button>
            </div>

            {sections.map((section, index) => (
              <div
                key={section.id}
                onClick={() => setSelectedSection(section.id)}
                className={`p-4 rounded-xl cursor-pointer transition-all border-2 ${selectedSection === section.id
                  ? "bg-[#1F2A6E] text-white border-[#1F2A6E]"
                  : "bg-white text-gray-900 border-white hover:border-gray-200"
                  }`}
              >
                <div className="mb-2">
                  <span
                    className={`text-xs font-bold px-2 py-1 rounded ${selectedSection === section.id
                      ? "bg-[#2876AC] text-white"
                      : "bg-[#2876AC] text-white"
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
          <div className="flex-1">
            {selectedSectionData ? (
              <>
                {/* Help Text */}
                <div className="bg-[#2E5A8E] border border-white/30 rounded-lg p-4 mb-6">
                  <p className="text-white text-sm">
                    Choose the option that best matches how you feel and who you
                    are, as this self-assessment helps you understand yourself
                    better. Your accuracy allows us to provide the best support
                    and guidance.
                  </p>
                </div>

                {/* Divider and Action Buttons */}
                <div className="border-t border-white/20 mb-6"></div>

                <div className="flex justify-end gap-2 mb-6">
                  {!isSelectionMode ? (
                    <>
                      <button
                        onClick={() => setIsSelectionMode(true)}
                        className="px-5 py-2 bg-white text-[#2E3B8E] rounded-lg font-semibold hover:bg-gray-100 text-sm flex items-center gap-2 shadow-md"
                      >
                        <i className="fa-solid fa-check-square"></i>
                        Select
                      </button>
                      <button
                        onClick={() => setShowAddLayerModal(true)}
                        className="px-5 py-2 bg-white text-[#2E3B8E] rounded-lg font-semibold hover:bg-gray-100 text-sm flex items-center gap-2 shadow-md"
                      >
                        <i className="fa-solid fa-layer-group"></i>
                        Layer
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="text-white font-semibold flex items-center">
                        {selectedChoices.length} Selected
                      </span>
                      <button
                        onClick={handleDeleteSelected}
                        disabled={selectedChoices.length === 0}
                        className={`px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 ${selectedChoices.length > 0
                          ? "bg-white text-red-600 hover:bg-red-50"
                          : "bg-white/20 text-white/50 cursor-not-allowed"
                          }`}
                      >
                        <i className="fa-solid fa-trash"></i>
                        Delete
                      </button>
                      <button
                        onClick={() => {
                          setIsSelectionMode(false);
                          setSelectedChoices([]);
                        }}
                        className="px-4 py-2 bg-white/20 text-white rounded-lg font-semibold hover:bg-white/30 text-sm border border-white/30"
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
                      className="bg-[#2E5A8E]/50 border-2 border-[#4A6FA5] rounded-xl p-5"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-white font-semibold">
                          {/* Layer name is not displayed as per Figma */}
                        </h3>
                        <button
                          onClick={() => {
                            setCurrentLayerId(layer.id);
                            setShowRecommendationsModal(true);
                          }}
                          className="px-4 py-2 bg-[#5C7CFA] text-white rounded-lg font-semibold hover:bg-[#4C6CDF] text-sm flex items-center gap-2 shadow-md"
                        >
                          <i className="fa-solid fa-pen-to-square"></i>
                          Edit Recommendations
                        </button>
                      </div>

                      <div className="space-y-2 mb-4">
                        {layer.choices.map((choice, choiceIdx) => (
                          <div
                            key={choiceIdx}
                            className={`bg-[#4A6FA5] border rounded-lg p-3 text-white flex items-center gap-3 transition-all ${selectedChoices.includes(
                              layerIdx * 10 + choiceIdx
                            )
                              ? "border-white ring-2 ring-white"
                              : "border-[#5A7FB5]"
                              } ${isSelectionMode
                                ? "cursor-pointer hover:border-white"
                                : ""
                              }`}
                            onClick={() =>
                              isSelectionMode &&
                              handleSelectChoice(layerIdx * 10 + choiceIdx)
                            }
                          >
                            {isSelectionMode && (
                              <input
                                type="checkbox"
                                checked={selectedChoices.includes(
                                  layerIdx * 10 + choiceIdx
                                )}
                                onChange={() =>
                                  handleSelectChoice(layerIdx * 10 + choiceIdx)
                                }
                                className="w-5 h-5 text-[#2E3B8E] rounded focus:ring-[#2E3B8E]"
                              />
                            )}
                            <span className="text-sm font-semibold">
                              {choiceIdx + 1}.
                            </span>
                            <span className="text-sm flex-1">{choice.text}</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-end">
                        <button className="px-4 py-2 bg-white text-[#2E3B8E] rounded-lg font-semibold hover:bg-gray-100 text-sm flex items-center gap-2 shadow-md">
                          <i className="fa-solid fa-plus"></i>
                          Choice
                        </button>
                      </div>
                    </div>
                  ))}
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
        <div className="flex justify-end gap-4 mt-6">
          <button
            onClick={() => router.push("/director/assessments")}
            className="px-10 py-3 bg-white text-gray-700 rounded-lg font-semibold hover:bg-gray-100 shadow-md"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveChanges}
            className="px-10 py-3 bg-[#2E3B8E] text-white rounded-lg font-semibold hover:bg-[#1F2A6E] shadow-md"
          >
            Save Changes
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
                onClick={() => setShowAddSectionModal(false)}
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
              ))}

              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-base font-bold text-gray-900">
                    Layer 1 - Customized Development Plans
                  </label>
                  <button className="px-3 py-1 bg-white border-2 border-[#2E3B8E] text-[#2E3B8E] rounded-lg text-sm font-semibold hover:bg-blue-50 flex items-center gap-1">
                    <i className="fa-solid fa-plus"></i>
                    Plan
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
                    Layer 2 - Customized Development Plans
                  </label>
                  <button className="px-3 py-1 bg-white border-2 border-[#2E3B8E] text-[#2E3B8E] rounded-lg text-sm font-semibold hover:bg-blue-50 flex items-center gap-1">
                    <i className="fa-solid fa-plus"></i>
                    Plan
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Choice 1"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E3B8E] text-gray-900 placeholder-gray-400"
                />
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t p-6 flex justify-between gap-4">
              <button
                onClick={() => setShowAddSectionModal(false)}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddSection}
                disabled={!newSectionName}
                className={`flex-1 px-6 py-3 rounded-lg font-semibold ${newSectionName
                  ? "bg-[#2E3B8E] text-white hover:bg-[#1F2A6E]"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
              >
                Create Section
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

      <AppFooter />
    </div>
  );
}
