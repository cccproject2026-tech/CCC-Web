"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import AppHeader from "@/app/Components/Header/AppHeader";
import AppFooter from "@/app/Components/AppFooter";
import AppHero from "@/app/Components/Hero/AppHero";
import AssessmentBg from "../../../Assets/assessment-bg.png";

export default function CreateAssessmentPage() {
  const router = useRouter();
  const [toast, setToast] = useState<string | null>(null);
  const [assessmentName, setAssessmentName] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState([""]);
  const [sections, setSections] = useState([
    {
      id: 1,
      name: "",
      guidelines: "",
      numLayers: 2,
      layers: [
        { id: 1, choices: [""] },
        { id: 2, choices: [""] },
      ],
      plans: [
        { id: 1, name: "Level 1 - Customized Development Plans", items: [""] },
        { id: 2, name: "Level 2 - Customized Development Plans", items: [""] },
      ],
    },
  ]);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const handleAddInstruction = () => {
    setInstructions([...instructions, ""]);
  };

  const handleUpdateInstruction = (index: number, value: string) => {
    const updated = [...instructions];
    updated[index] = value;
    setInstructions(updated);
  };

  const handleAddSection = () => {
    setSections([
      ...sections,
      {
        id: sections.length + 1,
        name: "",
        guidelines: "",
        numLayers: 2,
        layers: [
          { id: 1, choices: [""] },
          { id: 2, choices: [""] },
        ],
        plans: [
          {
            id: 1,
            name: "Level 1 - Customized Development Plans",
            items: [""],
          },
          {
            id: 2,
            name: "Level 2 - Customized Development Plans",
            items: [""],
          },
        ],
      },
    ]);
  };

  const handleUpdateSection = (
    sectionIdx: number,
    field: string,
    value: any
  ) => {
    const updated = [...sections];
    updated[sectionIdx] = { ...updated[sectionIdx], [field]: value };
    setSections(updated);
  };

  const handleUpdateLayerChoice = (
    sectionIdx: number,
    layerIdx: number,
    choiceIdx: number,
    value: string
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

  const handleUpdatePlanItem = (
    sectionIdx: number,
    planIdx: number,
    itemIdx: number,
    value: string
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

  const handleCreateSurvey = () => {
    showToast("Survey Created Successfully");
    setTimeout(() => {
      router.push("/director/assessments");
    }, 2000);
  };

  const handleCancel = () => {
    router.push("/director/assessments");
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#2876AC]">
      <AppHero
        title="Assessments"
        backgroundImageUrl={AssessmentBg.src}
        heightClasses="h-[200px]"
      />

      <section className="relative px-6 md:px-12 lg:px-20 py-10">
        <div className="max-w-[900px] mx-auto">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white">
              Create - Assessment
            </h2>
          </div>

          <div className="space-y-6">
            {/* Name of Assessment */}
            <div>
              <label className="block text-white font-semibold mb-2">
                Name of Assessment
              </label>
              <input
                type="text"
                value={assessmentName}
                onChange={(e) => setAssessmentName(e.target.value)}
                placeholder="Enter Name of Survey"
                className="w-full px-4 py-3 bg-white/20 border border-white/40 text-white placeholder-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-white font-medium"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-white font-semibold mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief Description for Thumbnail"
                rows={3}
                className="w-full px-4 py-3 bg-white/20 border border-white/40 text-white placeholder-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-white resize-none font-medium"
              />
            </div>

            {/* General Instructions */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-white font-semibold">
                  General Instructions for the Assessment
                </label>
                <button
                  onClick={handleAddInstruction}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-[#2E3B8E] rounded-lg font-semibold hover:bg-gray-100 text-sm shadow-md"
                >
                  <i className="fa-solid fa-plus"></i>
                  Instruction
                </button>
              </div>
              <div className="space-y-3">
                {instructions.map((instruction, idx) => (
                  <div key={idx}>
                    <label className="block text-white/80 text-sm mb-1">
                      Instruction {idx + 1}
                    </label>
                    <input
                      type="text"
                      value={instruction}
                      onChange={(e) =>
                        handleUpdateInstruction(idx, e.target.value)
                      }
                      placeholder="Enter Instruction"
                      className="w-full px-4 py-3 bg-white/20 border border-white/40 text-white placeholder-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-white font-medium"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Sections */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-white font-semibold">Sections</label>
                <button
                  onClick={handleAddSection}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-[#2E3B8E] rounded-lg font-semibold hover:bg-gray-100 text-sm shadow-md"
                >
                  <i className="fa-solid fa-plus"></i>
                  Add
                </button>
              </div>

              {sections.map((section, sectionIdx) => (
                <div
                  key={section.id}
                  className="bg-white/5 border border-white/20 rounded-lg p-6 mb-4 space-y-4"
                >
                  <h3 className="text-white font-semibold text-lg">
                    Section {sectionIdx + 1}
                  </h3>

                  {/* Name of Section */}
                  <div>
                    <label className="block text-white/80 text-sm mb-2">
                      Name of Section
                    </label>
                    <input
                      type="text"
                      value={section.name}
                      onChange={(e) =>
                        handleUpdateSection(sectionIdx, "name", e.target.value)
                      }
                      placeholder="Enter Name of Survey"
                      className="w-full px-4 py-3 bg-white/20 border border-white/40 text-white placeholder-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-white font-medium"
                    />
                  </div>

                  {/* Guidelines */}
                  <div>
                    <label className="block text-white/80 text-sm mb-2">
                      Guidelines
                    </label>
                    <input
                      type="text"
                      value={section.guidelines}
                      onChange={(e) =>
                        handleUpdateSection(
                          sectionIdx,
                          "guidelines",
                          e.target.value
                        )
                      }
                      placeholder="Enter Guidelines"
                      className="w-full px-4 py-3 bg-white/20 border border-white/40 text-white placeholder-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-white font-medium"
                    />
                  </div>

                  {/* Number of Layers */}
                  <div>
                    <label className="block text-white/80 text-sm mb-2">
                      Number of Layers
                    </label>
                    <select
                      value={section.numLayers}
                      onChange={(e) =>
                        handleUpdateSection(
                          sectionIdx,
                          "numLayers",
                          Number(e.target.value)
                        )
                      }
                      className="w-full px-4 py-3 bg-white/20 border border-white/40 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white font-medium [&>option]:text-gray-900"
                    >
                      <option value={2}>2</option>
                      <option value={3}>3</option>
                      <option value={4}>4</option>
                      <option value={5}>5</option>
                    </select>
                  </div>

                  {/* Layers */}
                  {section.layers.map((layer, layerIdx) => (
                    <div key={layer.id}>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-white font-semibold text-sm">
                          Layer {layerIdx + 1}
                        </label>
                        <button
                          onClick={() =>
                            handleAddLayerChoice(sectionIdx, layerIdx)
                          }
                          className="flex items-center gap-2 px-3 py-1 bg-white text-[#2E3B8E] rounded text-xs font-semibold hover:bg-gray-100"
                        >
                          <i className="fa-solid fa-plus"></i>
                          Choice
                        </button>
                      </div>
                      {layer.choices.map((choice, choiceIdx) => (
                        <input
                          key={choiceIdx}
                          type="text"
                          value={choice}
                          onChange={(e) =>
                            handleUpdateLayerChoice(
                              sectionIdx,
                              layerIdx,
                              choiceIdx,
                              e.target.value
                            )
                          }
                          placeholder={`Choice ${choiceIdx + 1}`}
                          className="w-full px-4 py-3 bg-white/20 border border-white/40 text-white placeholder-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-white font-medium mb-2"
                        />
                      ))}
                    </div>
                  ))}

                  {/* Customized Development Plans */}
                  {section.plans.map((plan, planIdx) => (
                    <div key={plan.id}>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-white font-semibold text-sm">
                          {plan.name}
                        </label>
                        <button
                          onClick={() => handleAddPlanItem(sectionIdx, planIdx)}
                          className="flex items-center gap-2 px-3 py-1 bg-white text-[#2E3B8E] rounded text-xs font-semibold hover:bg-gray-100"
                        >
                          <i className="fa-solid fa-plus"></i>
                          Plan
                        </button>
                      </div>
                      {plan.items.map((item, itemIdx) => (
                        <input
                          key={itemIdx}
                          type="text"
                          value={item}
                          onChange={(e) =>
                            handleUpdatePlanItem(
                              sectionIdx,
                              planIdx,
                              itemIdx,
                              e.target.value
                            )
                          }
                          placeholder={`Choice ${itemIdx + 1}`}
                          className="w-full px-4 py-3 bg-white/20 border border-white/40 text-white placeholder-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-white font-medium mb-2"
                        />
                      ))}
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Upload Banner Image */}
            <div>
              <label className="flex items-center gap-2 text-white font-semibold mb-3">
                <i className="fa-solid fa-cloud-arrow-up"></i>
                Upload Banner Image
              </label>
              <div className="border-2 border-dashed border-white/30 rounded-lg p-12 text-center hover:border-white/50 transition cursor-pointer">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center">
                    <i className="fa-solid fa-plus text-white text-2xl"></i>
                  </div>
                  <div className="text-white">
                    <p className="font-semibold mb-1">
                      Drag & Drop or Click here to choose file
                    </p>
                    <p className="text-sm text-white/60 flex items-center justify-center gap-1">
                      <i className="fa-solid fa-circle-info"></i>
                      Max file size: 10 MB
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end gap-4 pt-8 pb-8">
              <button
                onClick={handleCancel}
                className="px-10 py-3 bg-white text-gray-700 rounded-lg font-semibold hover:bg-gray-100 transition shadow-md"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSurvey}
                className="px-10 py-3 bg-[#2E3B8E] text-white rounded-lg font-semibold hover:bg-[#1F2A6E] transition shadow-md"
              >
                Create Survey
              </button>
            </div>
          </div>
        </div>
      </section>

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
