"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import "@fortawesome/fontawesome-free/css/all.min.css";
import MentorHeader from "@/app/Components/MentorHeader";
import PastorFooter from "@/app/Components/PastorFooter";
import HeroBg from "@/app/Assets/assignments-bg.png";
import { apiCreateAssessment } from "@/app/Services/assessment.service";

const glassPanel =
  "rounded-2xl border border-white/15 bg-[linear-gradient(180deg,rgba(15,74,118,0.5)_0%,rgba(9,49,80,0.65)_100%)] backdrop-blur-md";

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

  const buildCreateAssessmentPayload = () => {
    return {
      name: assessmentName,
      description,
      instructions: instructions.filter(i => i.trim() !== ""),
      type: "CMA", // or "PMP" – must come from UI later
      sections: sections.map((section, sectionIdx) => ({
        title: section.name,
        description: section.guidelines,
        layers: section.layers.map((layer, layerIdx) => ({
          title: `Layer ${layerIdx + 1}`,
          choices: layer.choices
            .filter(c => c.trim() !== "")
            .map(choice => ({ text: choice })),
        })),
      })),
    };
  };

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

  const handleCreateSurvey = async () => {
    try {
      const payload = buildCreateAssessmentPayload();

      await apiCreateAssessment(payload);

      showToast("Survey Created Successfully");

      setTimeout(() => {
        router.push("/mentor/MentorAssessments");
      }, 2000);
    } catch (err: any) {
      console.error(err);
      showToast(
        err?.response?.data?.message || "Failed to create assessment"
      );
    }
  };

  const handleCancel = () => {
    router.push("/mentor/MentorAssessments");
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#062946] font-[Albert_Sans] text-white">
      <MentorHeader showFullHeader={true} />

      <section
        className="relative overflow-hidden bg-cover bg-center px-4 pb-8 pt-4 sm:px-8 lg:px-20"
        style={{ backgroundImage: `url(${HeroBg.src})` }}
      >
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,31,53,0.68)_0%,rgba(6,41,70,0.6)_50%,rgba(6,41,70,1)_100%)]" />
        <div className="relative z-10 mx-auto w-full max-w-4xl">
          <h1 className="text-2xl font-semibold sm:text-3xl">Create assessment</h1>
          <p className="mt-2 text-sm text-[#cde2f2]">Build a new survey for your mentees.</p>
        </div>
      </section>

      <section className="relative flex-1 px-4 pb-16 sm:px-8 lg:px-20">
        <div className="mx-auto max-w-[900px]">
          <div className={`mb-8 p-6 sm:p-8 ${glassPanel}`}>
            <h2 className="text-xl font-semibold text-white sm:text-2xl">Create – Assessment</h2>
          </div>

          <div className={`space-y-6 p-6 sm:p-8 ${glassPanel}`}>
            {/* Name of Assessment */}
            <div>
              <label className="mb-2 block font-semibold text-[#cde2f2]">Name of Assessment</label>
              <input
                type="text"
                value={assessmentName}
                onChange={(e) => setAssessmentName(e.target.value)}
                placeholder="Enter Name of Survey"
                className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 font-medium text-white placeholder:text-white/45 focus:outline-none focus:ring-2 focus:ring-[#8ec5eb]/50"
              />
            </div>

            {/* Description */}
            <div>
              <label className="mb-2 block font-semibold text-[#cde2f2]">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief Description for Thumbnail"
                rows={3}
                className="w-full resize-none rounded-xl border border-white/20 bg-white/10 px-4 py-3 font-medium text-white placeholder:text-white/45 focus:outline-none focus:ring-2 focus:ring-[#8ec5eb]/50"
              />
            </div>

            {/* General Instructions */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <label className="font-semibold text-[#cde2f2]">
                  General Instructions for the Assessment
                </label>
                <button
                  type="button"
                  onClick={handleAddInstruction}
                  className="flex items-center gap-2 rounded-xl border border-white/20 bg-[#8ec5eb]/90 px-4 py-2 text-sm font-semibold text-[#062946] shadow-md hover:bg-[#8ec5eb]"
                >
                  <i className="fa-solid fa-plus" />
                  Instruction
                </button>
              </div>
              <div className="space-y-3">
                {instructions.map((instruction, idx) => (
                  <div key={idx}>
                    <label className="mb-1 block text-sm text-white/70">Instruction {idx + 1}</label>
                    <input
                      type="text"
                      value={instruction}
                      onChange={(e) =>
                        handleUpdateInstruction(idx, e.target.value)
                      }
                      placeholder="Enter Instruction"
                      className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 font-medium text-white placeholder:text-white/45 focus:outline-none focus:ring-2 focus:ring-[#8ec5eb]/50"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Sections */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <label className="font-semibold text-[#cde2f2]">Sections</label>
                <button
                  type="button"
                  onClick={handleAddSection}
                  className="flex items-center gap-2 rounded-xl border border-white/20 bg-[#8ec5eb]/90 px-4 py-2 text-sm font-semibold text-[#062946] shadow-md hover:bg-[#8ec5eb]"
                >
                  <i className="fa-solid fa-plus" />
                  Add
                </button>
              </div>

              {sections.map((section, sectionIdx) => (
                <div
                  key={section.id}
                  className="mb-4 space-y-4 rounded-xl border border-white/15 bg-white/5 p-6"
                >
                  <h3 className="text-lg font-semibold text-white">Section {sectionIdx + 1}</h3>

                  {/* Name of Section */}
                  <div>
                    <label className="mb-2 block text-sm text-white/70">Name of Section</label>
                    <input
                      type="text"
                      value={section.name}
                      onChange={(e) =>
                        handleUpdateSection(sectionIdx, "name", e.target.value)
                      }
                      placeholder="Enter Name of Survey"
                      className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 font-medium text-white placeholder:text-white/45 focus:outline-none focus:ring-2 focus:ring-[#8ec5eb]/50"
                    />
                  </div>

                  {/* Guidelines */}
                  <div>
                    <label className="mb-2 block text-sm text-white/70">Guidelines</label>
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
                      className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 font-medium text-white placeholder:text-white/45 focus:outline-none focus:ring-2 focus:ring-[#8ec5eb]/50"
                    />
                  </div>

                  {/* Number of Layers */}
                  <div>
                    <label className="mb-2 block text-sm text-white/70">Number of Layers</label>
                    <select
                      value={section.numLayers}
                      onChange={(e) =>
                        handleUpdateSection(
                          sectionIdx,
                          "numLayers",
                          Number(e.target.value)
                        )
                      }
                      className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 font-medium text-white focus:outline-none focus:ring-2 focus:ring-[#8ec5eb]/50 [&>option]:text-gray-900"
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
                      <div className="mb-2 flex items-center justify-between">
                        <label className="text-sm font-semibold text-[#cde2f2]">
                          Layer {layerIdx + 1}
                        </label>
                        <button
                          type="button"
                          onClick={() =>
                            handleAddLayerChoice(sectionIdx, layerIdx)
                          }
                          className="flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white hover:bg-white/15"
                        >
                          <i className="fa-solid fa-plus" />
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
                          className="mb-2 w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 font-medium text-white placeholder:text-white/45 focus:outline-none focus:ring-2 focus:ring-[#8ec5eb]/50"
                        />
                      ))}
                    </div>
                  ))}

                  {/* Customized Development Plans */}
                  {section.plans.map((plan, planIdx) => (
                    <div key={plan.id}>
                      <div className="mb-2 flex items-center justify-between">
                        <label className="text-sm font-semibold text-[#cde2f2]">{plan.name}</label>
                        <button
                          type="button"
                          onClick={() => handleAddPlanItem(sectionIdx, planIdx)}
                          className="flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white hover:bg-white/15"
                        >
                          <i className="fa-solid fa-plus" />
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
                          className="mb-2 w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 font-medium text-white placeholder:text-white/45 focus:outline-none focus:ring-2 focus:ring-[#8ec5eb]/50"
                        />
                      ))}
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Upload Banner Image */}
            <div>
              <label className="mb-3 flex items-center gap-2 font-semibold text-[#cde2f2]">
                <i className="fa-solid fa-cloud-arrow-up" />
                Upload Banner Image
              </label>
              <div className="cursor-pointer rounded-xl border-2 border-dashed border-white/25 p-12 text-center transition hover:border-[#8ec5eb]/50">
                <div className="flex flex-col items-center gap-3">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
                    <i className="fa-solid fa-plus text-2xl text-[#8ec5eb]" />
                  </div>
                  <div className="text-white">
                    <p className="mb-1 font-semibold">Drag & Drop or Click here to choose file</p>
                    <p className="flex items-center justify-center gap-1 text-sm text-white/55">
                      <i className="fa-solid fa-circle-info" />
                      Max file size: 10 MB
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4 pb-2 pt-8">
              <button
                type="button"
                onClick={handleCancel}
                className="rounded-xl border border-white/25 bg-white/10 px-10 py-3 font-semibold text-[#cde2f2] transition hover:bg-white/15"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateSurvey}
                className="rounded-xl bg-[#8ec5eb]/90 px-10 py-3 font-semibold text-[#062946] shadow-md transition hover:bg-[#8ec5eb]"
              >
                Create Survey
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Toast Notification */}
      {toast && (
        <div className="animate-fade-in fixed left-1/2 top-8 z-[70] -translate-x-1/2">
          <div className="flex items-center gap-3 rounded-xl border border-white/20 bg-[#0a3558] px-6 py-4 shadow-2xl">
            <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#8ec5eb]">
              <i className="fa-solid fa-check text-xs text-[#062946]" />
            </div>
            <span className="font-semibold text-white">{toast}</span>
          </div>
        </div>
      )}

      <PastorFooter />
    </div>
  );
}
