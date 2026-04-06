"use client";

import { useState } from "react";
import PastorHeader from "@/app/Components/PastorHeader";import HeroBg from "@/app/Assets/assignments-bg.png";
import "@fortawesome/fontawesome-free/css/all.min.css";
import MentorHeader from "@/app/Components/MentorHeader";

type Layer = { id: number; type: "choice" | "plan"; label: string };

export default function CreateAndAssignPage() {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [instructions, setInstructions] = useState<string[]>([]);
  const [instructionInput, setInstructionInput] = useState("");

  const [sectionName, setSectionName] = useState("Section 1");
  const [guidelines, setGuidelines] = useState("");
  const [levels, setLevels] = useState<number>(2);
  const [layers, setLayers] = useState<Layer[]>([
    { id: 1, type: "choice", label: "Layer 1" },
    { id: 2, type: "choice", label: "Layer 2" },
    { id: 3, type: "plan", label: "Layer 1 – Customized Development Plans" },
    { id: 4, type: "plan", label: "Layer 2 – Customized Development Plans" },
  ]);

  const [banner, setBanner] = useState<File | null>(null);

  const addInstruction = () => {
    const v = instructionInput.trim();
    if (!v) return;
    setInstructions((p) => [...p, v]);
    setInstructionInput("");
  };

  const removeInstruction = (i: number) =>
    setInstructions((p) => p.filter((_, idx) => idx !== i));

  return (
    <div className="min-h-screen flex flex-col bg-[#0A3C8C] text-[#0B1C58]">
      <MentorHeader showFullHeader />

      {/* HERO */}
      <section
        className="relative h-[250px] flex items-end px-16 pb-10 bg-cover bg-center text-white"
        style={{ backgroundImage: `url(${HeroBg.src})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#09256F]/70 via-[#0E2F8A]/40 to-[#133A9E]/90" />
        <h1 className="relative z-10 text-4xl font-semibold">Assessments</h1>
      </section>

      <main className="flex-1 bg-[#254487] px-10 md:px-20 pb-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-white text-[20px] font-semibold mt-8 mb-6">
            Create – Assessments
          </h2>

          {/* Form */}
          <div className="space-y-6">
            {/* Name */}
            <div>
              <label className="text-white text-sm mb-2 block">Name of Survey</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter Name of Survey"
                className="w-full bg-transparent border border-[#5A8DCB] rounded-md px-4 py-2 text-white placeholder-white/70 outline-none focus:ring-2 focus:ring-[#FFD84E]"
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-white text-sm mb-2 block">Description</label>
              <input
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Brief Description for Thumbnail"
                className="w-full bg-transparent border border-[#5A8DCB] rounded-md px-4 py-2 text-white placeholder-white/70 outline-none focus:ring-2 focus:ring-[#FFD84E]"
              />
            </div>

            {/* General Instructions */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-white text-sm">General Instructions for the Survey</label>
                <button className="bg-white/90 text-[#103C8C] text-sm px-3 py-1.5 rounded-md border">
                  <i className="fa-regular fa-circle-info mr-2" />
                  Instruction
                </button>
              </div>
              {/* Pills */}
              <div className="flex flex-wrap gap-2 mb-3">
                {instructions.map((ins, i) => (
                  <span
                    key={i}
                    className="bg-white/15 text-white border border-[#5A8DCB] rounded-md px-3 py-1 text-xs flex items-center gap-2"
                  >
                    {ins}
                    <button onClick={() => removeInstruction(i)}>
                      <i className="fa-solid fa-xmark" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={instructionInput}
                  onChange={(e) => setInstructionInput(e.target.value)}
                  placeholder="Enter Instruction"
                  className="flex-1 bg-transparent border border-[#5A8DCB] rounded-md px-4 py-2 text-white placeholder-white/70 outline-none"
                />
                <button
                  onClick={addInstruction}
                  className="bg-white text-[#103C8C] px-4 py-2 rounded-md border"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Sections Card */}
            <div className="border border-[#5A8DCB] rounded-md p-5">
              <div className="flex items-center justify-between mb-4">
                <label className="text-white text-sm">Sections</label>
                <button className="bg-white text-[#103C8C] px-4 py-2 rounded-md border text-sm">
                  <i className="fa-solid fa-plus mr-2" />
                  Add
                </button>
              </div>

              <div className="space-y-4">
                {/* Section name */}
                <div>
                  <label className="text-white text-sm mb-2 block">Section</label>
                  <input
                    value={sectionName}
                    onChange={(e) => setSectionName(e.target.value)}
                    placeholder="Enter Name of Section"
                    className="w-full bg-transparent border border-[#5A8DCB] rounded-md px-4 py-2 text-white"
                  />
                </div>

                {/* Guidelines */}
                <div>
                  <label className="text-white text-sm mb-2 block">Enter Guidelines</label>
                  <input
                    value={guidelines}
                    onChange={(e) => setGuidelines(e.target.value)}
                    placeholder="Enter Guidelines"
                    className="w-full bg-transparent border border-[#5A8DCB] rounded-md px-4 py-2 text-white"
                  />
                </div>

                {/* Levels */}
                <div>
                  <label className="text-white text-sm mb-2 block">Number of Levels</label>
                  <select
                    value={levels}
                    onChange={(e) => setLevels(Number(e.target.value))}
                    className="w-full bg-transparent border border-[#5A8DCB] rounded-md px-4 py-2 text-white"
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option className="text-[#0B1C58]" value={n} key={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Layers list */}
                {layers.map((l) => (
                  <div key={l.id}>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-white text-sm">{l.label}</label>
                      <button className="bg-white text-[#103C8C] text-xs px-3 py-1.5 rounded-md border">
                        <i className={`fa-regular ${l.type === "choice" ? "fa-square" : "fa-file" } mr-2`} />
                        {l.type === "choice" ? "Choice" : "Plan"}
                      </button>
                    </div>
                    <input
                      placeholder={l.type === "choice" ? "Choice 1" : "Plan"}
                      className="w-full bg-transparent border border-[#5A8DCB] rounded-md px-4 py-2 text-white"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Upload Image */}
            <div>
              <label className="text-white text-sm mb-3 block">
                <i className="fa-regular fa-image mr-2" />
                Upload Image
              </label>
              <label className="block h-[170px] border-2 border-dashed border-[#5A8DCB] rounded-md text-white/85 bg-transparent flex flex-col items-center justify-center cursor-pointer">
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => setBanner(e.target.files?.[0] ?? null)}
                />
                <i className="fa-solid fa-plus text-white text-lg mb-2" />
                Drag & Drop or Click here to choose file
                <div className="text-xs text-white/60 mt-1">Max file size : 10 MB</div>
              </label>
              {banner && (
                <div className="text-white text-sm mt-2">{banner.name}</div>
              )}
            </div>

            {/* Footer buttons */}
            <div className="flex justify-center gap-4 pt-2">
              <a
                href="/pastor/assessments"
                className="bg-white text-[#103C8C] px-6 py-2 rounded-md text-sm font-medium"
              >
                Cancel
              </a>
              <button
                className="bg-[#FFD84E] text-[#0B1C58] px-6 py-2 rounded-md text-sm font-medium"
                onClick={(e) => {
                  e.preventDefault();
                  // wire API here if needed
                  alert("Created & Assigned (hook your API).");
                }}
              >
                Create & Assign
              </button>
            </div>
          </div>
        </div>
      </main>

      
    </div>
  );
}
