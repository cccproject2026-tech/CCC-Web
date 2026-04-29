
// "use client";

// import { useRef, useState } from "react";
// import { useRouter } from "next/navigation";
// import Image from "next/image";
// import "@fortawesome/fontawesome-free/css/all.min.css";
// import MentorHeader from "@/app/Components/MentorHeader";
// import HeroBg from "@/app/Assets/assignments-bg.png";
// import {
//   apiCreateAssessment,
//   apiUploadAssessmentBanner,
//   formatAssessmentApiErrorMessage,
// } from "@/app/Services/assessment.service";
// import {
//   buildCreateAssessmentSectionsFromWizard,
//   buildPreSurveyPayloadForDirectorCreate,
//   defaultWizardPlanName,
// } from "@/app/Services/utils/assessment-mapper";
// import type { CreateAssessmentPayload } from "@/app/Services/types/assessment.types";
// import { isRemoteImageSrc } from "@/app/utils/image";

// const glassPanel =
//   "rounded-2xl border border-white/15 bg-[linear-gradient(180deg,rgba(15,74,118,0.5)_0%,rgba(9,49,80,0.65)_100%)] backdrop-blur-md";
// const DEFAULT_STARTING_LAYERS = 4;
// const MIN_LAYERS = 1;
// const CDP_LEVEL_COUNT = 4;

// type WizardSection = {
//   id: number;
//   name: string;
//   guidelines: string;
//   layers: { id: number; choices: string[] }[];
//   plans: { id: number; name: string; items: string[] }[];
// };

// type PreSurveyRow = {
//   id: number;
//   text: string;
//   type: "text" | "number";
//   placeholder: string;
// };

// const defaultPreSurveyRow = (): PreSurveyRow => ({
//   id: Date.now(),
//   text: "",
//   type: "number",
//   placeholder: "Enter number",
// });

// const defaultSection = (): WizardSection => {
//   const base = Date.now();

//   return {
//     id: base,
//     name: "",
//     guidelines: "",
//     layers: Array.from({ length: DEFAULT_STARTING_LAYERS }, (_, i) => ({
//       id: base + i,
//       choices: [""],
//     })),
//     plans: Array.from({ length: CDP_LEVEL_COUNT }, (_, i) => ({
//       id: base + i + 100,
//       name: defaultWizardPlanName(i),
//       items: [""],
//     })),
//   };
// };

// export default function CreateAssessmentPage() {
//   const router = useRouter();

//   const [toast, setToast] = useState<string | null>(null);
//   const [creating, setCreating] = useState(false);

//   const [assessmentName, setAssessmentName] = useState("");
//   const [description, setDescription] = useState("");

//   // CMA = include pre-survey, PMP = no pre-survey
//   const [hasPreSurvey, setHasPreSurvey] = useState(false);

//   const [instructions, setInstructions] = useState([""]);
//   const [sections, setSections] = useState<WizardSection[]>([defaultSection()]);

//   const [preSurveyRows, setPreSurveyRows] = useState<PreSurveyRow[]>([
//     { id: 1, text: "", type: "number", placeholder: "Enter number" },
//   ]);

//   const [bannerFile, setBannerFile] = useState<File | null>(null);
//   const [bannerPreview, setBannerPreview] = useState<string | null>(null);
//   const bannerInputRef = useRef<HTMLInputElement | null>(null);

//   const showToast = (message: string) => {
//     setToast(message);
//     setTimeout(() => setToast(null), 3000);
//   };


//   const handleAddInstruction = () => setInstructions([...instructions, ""]);

//   const handleRemoveInstruction = (index: number) => {
//     setInstructions((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
//   };

//   const handleUpdateInstruction = (index: number, value: string) => {
//     const updated = [...instructions];
//     updated[index] = value;
//     setInstructions(updated);
//   };

//   const handleAddSection = () => {
//     setSections([...sections, defaultSection()]);
//   };

//   const handleRemoveSection = (sectionIdx: number) => {
//     setSections((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== sectionIdx)));
//   };

//   const handleUpdateSection = (sectionIdx: number, field: string, value: unknown) => {
//     const updated = [...sections];
//     const cur = { ...updated[sectionIdx] };
//     updated[sectionIdx] = { ...cur, [field]: value } as WizardSection;
//     setSections(updated);
//   };

//   const handleUpdateLayerChoice = (
//     sectionIdx: number,
//     layerIdx: number,
//     choiceIdx: number,
//     value: string,
//   ) => {
//     const updated = [...sections];
//     updated[sectionIdx].layers[layerIdx].choices[choiceIdx] = value;
//     setSections(updated);
//   };

//   const handleAddLayerChoice = (sectionIdx: number, layerIdx: number) => {
//     const updated = [...sections];
//     updated[sectionIdx].layers[layerIdx].choices.push("");
//     setSections(updated);
//   };

//   const handleAddLayer = (sectionIdx: number) => {
//     setSections((prev) => {
//       const next = [...prev];
//       const copy = { ...next[sectionIdx] };
//       const idBase = Date.now();
//       copy.layers = [...copy.layers, { id: idBase, choices: [""] }];
//       next[sectionIdx] = copy;
//       return next;
//     });
//   };

//   const handleRemoveLayer = (sectionIdx: number, layerIdx: number) => {
//     setSections((prev) => {
//       if (prev[sectionIdx]?.layers.length <= MIN_LAYERS) return prev;
//       const next = [...prev];
//       const copy = { ...next[sectionIdx] };
//       copy.layers = copy.layers.filter((_, j) => j !== layerIdx);
//       next[sectionIdx] = copy;
//       return next;
//     });
//   };

//   const handleRemoveLayerChoice = (sectionIdx: number, layerIdx: number, choiceIdx: number) => {
//     setSections((prev) => {
//       if (prev[sectionIdx]?.layers[layerIdx]?.choices.length <= 1) return prev;
//       const next = [...prev];
//       const copy = { ...next[sectionIdx] };
//       const layers = [...copy.layers];
//       const layer = { ...layers[layerIdx] };
//       layer.choices = layer.choices.filter((_, j) => j !== choiceIdx);
//       layers[layerIdx] = layer;
//       copy.layers = layers;
//       next[sectionIdx] = copy;
//       return next;
//     });
//   };

//   const handleUpdatePlanItem = (
//     sectionIdx: number,
//     planIdx: number,
//     itemIdx: number,
//     value: string,
//   ) => {
//     const updated = [...sections];
//     updated[sectionIdx].plans[planIdx].items[itemIdx] = value;
//     setSections(updated);
//   };

//   const handleAddPlanItem = (sectionIdx: number, planIdx: number) => {
//     const updated = [...sections];
//     updated[sectionIdx].plans[planIdx].items.push("");
//     setSections(updated);
//   };

//   const handleRemovePlanItem = (sectionIdx: number, planIdx: number, itemIdx: number) => {
//     setSections((prev) => {
//       if (prev[sectionIdx]?.plans[planIdx]?.items.length <= 1) return prev;
//       const next = [...prev];
//       const copy = { ...next[sectionIdx] };
//       const plans = [...copy.plans];
//       const plan = { ...plans[planIdx] };
//       plan.items = plan.items.filter((_, j) => j !== itemIdx);
//       plans[planIdx] = plan;
//       copy.plans = plans;
//       next[sectionIdx] = copy;
//       return next;
//     });
//   };

//   const handleUpdatePreSurvey = (
//     idx: number,
//     field: keyof Pick<PreSurveyRow, "text" | "type" | "placeholder">,
//     value: string,
//   ) => {
//     setPreSurveyRows((prev) => {
//       const next = [...prev];
//       if (field === "type" && (value === "text" || value === "number")) {
//         next[idx] = { ...next[idx], type: value };
//       } else if (field === "text" || field === "placeholder") {
//         next[idx] = { ...next[idx], [field]: value };
//       }
//       return next;
//     });
//   };

//   const handleAddPreSurveyQuestion = () => {
//     setPreSurveyRows((prev) => [...prev, defaultPreSurveyRow()]);
//   };

//   const handleRemovePreSurveyQuestion = (idx: number) => {
//     setPreSurveyRows((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx)));
//   };


//   const handleCreateSurvey = async () => {
//     const name = assessmentName.trim();

//     if (!name) {
//       showToast("Enter an assessment name.");
//       return;
//     }

//     if (!description.trim()) {
//       showToast("Please enter a short description.");
//       return;
//     }

//     const instructionLines = instructions.map((i) => i.trim()).filter(Boolean);

//     if (instructionLines.length === 0) {
//       showToast("Add at least one general instruction.");
//       return;
//     }

//     const invalidSection = sections.some(
//       (s) =>
//         s.layers.length < MIN_LAYERS ||
//         s.plans.length !== CDP_LEVEL_COUNT ||
//         s.layers.some((l) => !l.choices.some((c) => c.trim())),
//     );

//     if (invalidSection) {
//       showToast(
//         `Each section needs at least one choice layer with text, and exactly ${CDP_LEVEL_COUNT} CDP level blocks.`,
//       );
//       return;
//     }

//     const apiSections = buildCreateAssessmentSectionsFromWizard(sections);
//     const typeForApi: "CMA" | "PMP" = hasPreSurvey ? "CMA" : "PMP";
//     const preSurveyPayload = buildPreSurveyPayloadForDirectorCreate(preSurveyRows);

//     if (hasPreSurvey && preSurveyPayload.length === 0) {
//       showToast("Include pre-survey is on — add at least one pre-survey question with text.");
//       return;
//     }

//     const payload: CreateAssessmentPayload = {
//       name,
//       description: description.trim(),
//       instructions: instructionLines,
//       type: typeForApi,
//       sections: apiSections,
//       ...(hasPreSurvey && preSurveyPayload.length > 0
//         ? { preSurvey: preSurveyPayload }
//         : {}),
//     };

//     setCreating(true);

//     try {
//       const res = await apiCreateAssessment(payload);

//       const body = res?.data as Record<string, unknown> | undefined;

//       const nested =
//         body?.data != null && typeof body.data === "object" && !Array.isArray(body.data)
//           ? (body.data as { _id?: string; id?: string })
//           : null;

//       const root =
//         body && "_id" in body && typeof body === "object"
//           ? (body as { _id?: string; id?: string })
//           : null;

//       const created = nested ?? root;

//       const newId =
//         created?._id != null
//           ? String(created._id)
//           : created?.id != null
//             ? String(created.id)
//             : null;

//       if (bannerFile && newId) {
//         try {
//           await apiUploadAssessmentBanner(newId, bannerFile);
//         } catch (e) {
//           console.error(e);
//           showToast("Assessment created; banner upload failed.");
//           setTimeout(() => router.push("/mentor/MentorAssessments"), 1800);
//           return;
//         }
//       }

//       showToast("Assessment created successfully");

//       setTimeout(() => {
//         router.push("/mentor/MentorAssessments");
//       }, 800);
//     } catch (err: unknown) {
//       console.error(err);
//       showToast(formatAssessmentApiErrorMessage(err));
//     } finally {
//       setCreating(false);
//     }
//   };

//   const handleCancel = () => {
//     router.push("/mentor/MentorAssessments");
//   };

//   return (
//     <div className="flex min-h-screen flex-col bg-[#062946] font-[Albert_Sans] text-white">
//       <MentorHeader showFullHeader={true} />

//       <section
//         className="relative overflow-hidden bg-cover bg-center px-4 pb-8 pt-4 sm:px-8 lg:px-20"
//         style={{ backgroundImage: `url(${HeroBg.src})` }}
//       >
//         <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,31,53,0.68)_0%,rgba(6,41,70,0.6)_50%,rgba(6,41,70,1)_100%)]" />
//         <div className="relative z-10 mx-auto w-full max-w-4xl">
//           <h1 className="text-2xl font-semibold sm:text-3xl">Create assessment</h1>
//           <p className="mt-2 text-sm text-[#cde2f2]">Build a new survey for your mentees.</p>
//         </div>
//       </section>

//       <section className="relative flex-1 px-4 pb-16 sm:px-8 lg:px-20">
//         <div className="mx-auto max-w-[900px]">
//           <div className={`mb-8 p-6 sm:p-8 ${glassPanel}`}>
//             <h2 className="text-xl font-semibold text-white sm:text-2xl">Create – Assessment</h2>
//           </div>

//           <div className={`space-y-6 p-6 sm:p-8 ${glassPanel}`}>
//             {/* Name of Assessment */}
//             <div>
//               <label className="mb-2 block font-semibold text-[#cde2f2]">Name of Assessment</label>
//               <input
//                 type="text"
//                 value={assessmentName}
//                 onChange={(e) => setAssessmentName(e.target.value)}
//                 placeholder="Enter Name of Survey"
//                 className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 font-medium text-white placeholder:text-white/45 focus:outline-none focus:ring-2 focus:ring-[#8ec5eb]/50"
//               />
//             </div>

//             {/* Description */}
//             <div>
//               <label className="mb-2 block font-semibold text-[#cde2f2]">Description</label>
//               <textarea
//                 value={description}
//                 onChange={(e) => setDescription(e.target.value)}
//                 placeholder="Brief Description for Thumbnail"
//                 rows={3}
//                 className="w-full resize-none rounded-xl border border-white/20 bg-white/10 px-4 py-3 font-medium text-white placeholder:text-white/45 focus:outline-none focus:ring-2 focus:ring-[#8ec5eb]/50"
//               />
//             </div>

//             <div>
//               <span className="mb-2 block font-semibold text-[#cde2f2]">
//                 Include pre-survey questions?
//               </span>

//               <p className="mb-3 text-sm text-white/60">
//                 Yes → CMA. No → PMP.
//               </p>

//               <div className="flex flex-wrap gap-6">
//                 <label className="flex cursor-pointer items-center gap-2 text-sm text-white/90">
//                   <input
//                     type="radio"
//                     name="hasPreSurvey"
//                     checked={!hasPreSurvey}
//                     onChange={() => setHasPreSurvey(false)}
//                     className="h-4 w-4"
//                   />
//                   No (PMP)
//                 </label>

//                 <label className="flex cursor-pointer items-center gap-2 text-sm text-white/90">
//                   <input
//                     type="radio"
//                     name="hasPreSurvey"
//                     checked={hasPreSurvey}
//                     onChange={() => setHasPreSurvey(true)}
//                     className="h-4 w-4"
//                   />
//                   Yes (CMA)
//                 </label>
//               </div>
//             </div>
//             {hasPreSurvey ? (
//               <div>
//                 <h2 className="mb-1 text-lg font-bold text-white">Pre-survey questions</h2>

//                 <p className="mb-4 text-sm text-white/70">
//                   Shown before the main survey. Use text or number fields.
//                 </p>

//                 <div className="space-y-5">
//                   {preSurveyRows.map((row, qIdx) => (
//                     <div
//                       key={row.id}
//                       className="space-y-3 rounded-2xl border border-white/15 bg-white/[0.04] p-5 sm:p-6"
//                     >
//                       <div className="flex flex-wrap items-end gap-3">
//                         <div className="min-w-[200px] flex-1">
//                           <label className="mb-2 block text-sm font-semibold text-[#cde2f2]">
//                             Question {qIdx + 1}
//                           </label>

//                           <input
//                             type="text"
//                             value={row.text}
//                             onChange={(e) => handleUpdatePreSurvey(qIdx, "text", e.target.value)}
//                             placeholder="e.g. What is your current church membership?"
//                             className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 font-medium text-white placeholder:text-white/45 focus:outline-none focus:ring-2 focus:ring-[#8ec5eb]/50"
//                           />
//                         </div>

//                         <div className="w-full sm:w-40">
//                           <label className="mb-2 block text-sm font-semibold text-[#cde2f2]">
//                             Type
//                           </label>

//                           <select
//                             value={row.type}
//                             onChange={(e) => handleUpdatePreSurvey(qIdx, "type", e.target.value)}
//                             className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 font-medium text-white focus:outline-none focus:ring-2 focus:ring-[#8ec5eb]/50"
//                           >
//                             <option value="number">Number</option>
//                             <option value="text">Text</option>
//                           </select>
//                         </div>

//                         <div className="min-w-[160px] flex-1">
//                           <label className="mb-2 block text-sm font-semibold text-[#cde2f2]">
//                             Placeholder
//                           </label>

//                           <input
//                             type="text"
//                             value={row.placeholder}
//                             onChange={(e) => handleUpdatePreSurvey(qIdx, "placeholder", e.target.value)}
//                             placeholder="Enter number"
//                             className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 font-medium text-white placeholder:text-white/45 focus:outline-none focus:ring-2 focus:ring-[#8ec5eb]/50"
//                           />
//                         </div>

//                         {preSurveyRows.length > 1 ? (
//                           <button
//                             type="button"
//                             onClick={() => handleRemovePreSurveyQuestion(qIdx)}
//                             className="rounded-lg border border-red-400/40 bg-red-500/15 px-3 py-3 text-sm font-semibold text-red-300 hover:bg-red-500/25"
//                           >
//                             Remove
//                           </button>
//                         ) : null}
//                       </div>
//                     </div>
//                   ))}

//                   <button
//                     type="button"
//                     onClick={handleAddPreSurveyQuestion}
//                     className="flex items-center gap-2 rounded-xl border border-white/20 bg-[#8ec5eb]/90 px-4 py-2 text-sm font-semibold text-[#062946] shadow-md hover:bg-[#8ec5eb]"
//                   >
//                     <i className="fa-solid fa-plus" />
//                     Add pre-survey question
//                   </button>
//                 </div>
//               </div>
//             ) : null}


//             {/* General Instructions */}
//             <div>
//               <div className="mb-3 flex items-center justify-between">
//                 <label className="font-semibold text-[#cde2f2]">
//                   General Instructions for the Assessment
//                 </label>
//                 <button
//                   type="button"
//                   onClick={handleAddInstruction}
//                   className="flex items-center gap-2 rounded-xl border border-white/20 bg-[#8ec5eb]/90 px-4 py-2 text-sm font-semibold text-[#062946] shadow-md hover:bg-[#8ec5eb]"
//                 >
//                   <i className="fa-solid fa-plus" />
//                   Instruction
//                 </button>
//               </div>
//               <div className="space-y-3">
//                 {instructions.map((instruction, idx) => (
//                   <div key={idx} className="flex gap-2">
//                     <div className="flex-1">
//                       <label className="mb-1 block text-sm text-white/70">Instruction {idx + 1}</label>
//                       <input
//                         type="text"
//                         value={instruction}
//                         onChange={(e) =>
//                           handleUpdateInstruction(idx, e.target.value)
//                         }
//                         placeholder="Enter Instruction"
//                         className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 font-medium text-white placeholder:text-white/45 focus:outline-none focus:ring-2 focus:ring-[#8ec5eb]/50"
//                       />
//                     </div>
//                     <div className="flex items-end">
//                       <button
//                         type="button"
//                         onClick={() => handleRemoveInstruction(idx)}
//                         className="rounded-lg border border-red-400/40 bg-red-500/15 px-3 py-3 text-red-300 hover:bg-red-500/25"
//                       >
//                         <i className="fa-solid fa-trash text-sm" />
//                       </button>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>

//             {/* Sections */}
//             <div>
//               <div className="mb-3 flex items-center justify-between">
//                 <label className="font-semibold text-[#cde2f2]">Sections</label>
//                 <button
//                   type="button"
//                   onClick={handleAddSection}
//                   className="flex items-center gap-2 rounded-xl border border-white/20 bg-[#8ec5eb]/90 px-4 py-2 text-sm font-semibold text-[#062946] shadow-md hover:bg-[#8ec5eb]"
//                 >
//                   <i className="fa-solid fa-plus" />
//                   Add
//                 </button>
//               </div>

//               {sections.map((section, sectionIdx) => (
//                 <div
//                   key={section.id}
//                   className="mb-4 space-y-4 rounded-xl border border-white/15 bg-white/5 p-6"
//                 >
//                   <div className="flex items-center justify-between">
//                     <h3 className="text-lg font-semibold text-white">Section {sectionIdx + 1}</h3>
//                     <button
//                       type="button"
//                       onClick={() => handleRemoveSection(sectionIdx)}
//                       className="rounded-lg border border-red-400/40 bg-red-500/15 px-3 py-2 text-sm font-semibold text-red-300 hover:bg-red-500/25"
//                     >
//                       <i className="fa-solid fa-xmark" />
//                     </button>
//                   </div>

//                   {/* Name of Section */}
//                   <div>
//                     <label className="mb-2 block text-sm text-white/70">Name of Section</label>
//                     <input
//                       type="text"
//                       value={section.name}
//                       onChange={(e) =>
//                         handleUpdateSection(sectionIdx, "name", e.target.value)
//                       }
//                       placeholder="Enter Name of Survey"
//                       className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 font-medium text-white placeholder:text-white/45 focus:outline-none focus:ring-2 focus:ring-[#8ec5eb]/50"
//                     />
//                   </div>

//                   {/* Guidelines */}
//                   <div>
//                     <label className="mb-2 block text-sm text-white/70">Guidelines</label>
//                     <input
//                       type="text"
//                       value={section.guidelines}
//                       onChange={(e) =>
//                         handleUpdateSection(
//                           sectionIdx,
//                           "guidelines",
//                           e.target.value
//                         )
//                       }
//                       placeholder="Enter Guidelines"
//                       className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 font-medium text-white placeholder:text-white/45 focus:outline-none focus:ring-2 focus:ring-[#8ec5eb]/50"
//                     />
//                   </div>

//                   {/* Choice layer controls */}
//                   <div className="flex flex-wrap items-end justify-between gap-3">
//                     <div>
//                       <h4 className="text-sm font-semibold text-white/90">Choice layers</h4>
//                       <p className="mt-1 text-sm text-white/70">
//                         {section.layers.length} layer{section.layers.length === 1 ? "" : "s"} added.
//                       </p>
//                     </div>

//                     <button
//                       type="button"
//                       onClick={() => handleAddLayer(sectionIdx)}
//                       className="flex items-center gap-2 rounded-xl border border-white/20 bg-[#8ec5eb]/90 px-4 py-2 text-sm font-semibold text-[#062946] shadow-md hover:bg-[#8ec5eb]"
//                     >
//                       <i className="fa-solid fa-plus" />
//                       Add layer
//                     </button>
//                   </div>

//                   {/* Layers */}
//                   {section.layers.map((layer, layerIdx) => (
//                     <div key={layer.id}>
//                       <div className="mb-2 flex items-center justify-between">
//                         <label className="text-sm font-semibold text-[#cde2f2]">
//                           Layer {layerIdx + 1}
//                         </label>

//                         <div className="flex items-center gap-2">
//                           <button
//                             type="button"
//                             onClick={() => handleAddLayerChoice(sectionIdx, layerIdx)}
//                             className="flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white hover:bg-white/15"
//                           >
//                             <i className="fa-solid fa-plus" />
//                             Choice
//                           </button>

//                           {section.layers.length > MIN_LAYERS ? (
//                             <button
//                               type="button"
//                               onClick={() => handleRemoveLayer(sectionIdx, layerIdx)}
//                               className="rounded-lg border border-red-400/40 bg-red-500/15 px-3 py-1 text-xs font-semibold text-red-300 hover:bg-red-500/25"
//                             >
//                               Remove layer
//                             </button>
//                           ) : null}
//                         </div>
//                       </div>
//                       {layer.choices.map((choice, choiceIdx) => (
//                         <div key={choiceIdx} className="mb-2 flex gap-2">
//                           <input
//                             type="text"
//                             value={choice}
//                             onChange={(e) =>
//                               handleUpdateLayerChoice(
//                                 sectionIdx,
//                                 layerIdx,
//                                 choiceIdx,
//                                 e.target.value
//                               )
//                             }
//                             placeholder={`Choice ${choiceIdx + 1}`}
//                             className="flex-1 rounded-xl border border-white/20 bg-white/10 px-4 py-3 font-medium text-white placeholder:text-white/45 focus:outline-none focus:ring-2 focus:ring-[#8ec5eb]/50"
//                           />
//                           <button
//                             type="button"
//                             onClick={() =>
//                               handleRemoveLayerChoice(sectionIdx, layerIdx, choiceIdx)
//                             }
//                             className="rounded-lg border border-red-400/40 bg-red-500/15 px-3 py-3 text-red-300 hover:bg-red-500/25"
//                           >
//                             <i className="fa-solid fa-trash text-sm" />
//                           </button>
//                         </div>
//                       ))}
//                     </div>
//                   ))}

//                   {/* Customized Development Plans - MUST BE 4 LEVELS */}
//                   {section.plans.map((plan, planIdx) => (
//                     <div key={plan.id}>
//                       <div className="mb-2 flex items-center justify-between">
//                         <label className="text-sm font-semibold text-[#cde2f2]">{plan.name}</label>
//                         <button
//                           type="button"
//                           onClick={() => handleAddPlanItem(sectionIdx, planIdx)}
//                           className="flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white hover:bg-white/15"
//                         >
//                           <i className="fa-solid fa-plus" />
//                           Plan
//                         </button>
//                       </div>
//                       {plan.items.map((item, itemIdx) => (
//                         <div key={itemIdx} className="mb-2 flex gap-2">
//                           <input
//                             type="text"
//                             value={item}
//                             onChange={(e) =>
//                               handleUpdatePlanItem(
//                                 sectionIdx,
//                                 planIdx,
//                                 itemIdx,
//                                 e.target.value
//                               )
//                             }
//                             placeholder={`Plan Item ${itemIdx + 1}`}
//                             className="flex-1 rounded-xl border border-white/20 bg-white/10 px-4 py-3 font-medium text-white placeholder:text-white/45 focus:outline-none focus:ring-2 focus:ring-[#8ec5eb]/50"
//                           />
//                           <button
//                             type="button"
//                             onClick={() =>
//                               handleRemovePlanItem(sectionIdx, planIdx, itemIdx)
//                             }
//                             className="rounded-lg border border-red-400/40 bg-red-500/15 px-3 py-3 text-red-300 hover:bg-red-500/25"
//                           >
//                             <i className="fa-solid fa-trash text-sm" />
//                           </button>
//                         </div>
//                       ))}
//                     </div>
//                   ))}
//                 </div>
//               ))}
//             </div>

//             {/* Upload Banner Image */}
//             <div>
//               <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
//                 <span className="mb-3 flex items-center gap-2 font-semibold text-[#cde2f2]">
//                   <i className="fa-solid fa-image text-[#8ec5eb]" />
//                   Banner image optional
//                 </span>

//                 {bannerFile || bannerPreview ? (
//                   <button
//                     type="button"
//                     onClick={() => {
//                       if (bannerPreview?.startsWith("blob:")) URL.revokeObjectURL(bannerPreview);
//                       setBannerFile(null);
//                       setBannerPreview(null);
//                     }}
//                     className="text-sm font-semibold text-red-300/90 hover:underline"
//                   >
//                     Remove image
//                   </button>
//                 ) : null}
//               </div>

//               <input
//                 ref={bannerInputRef}
//                 type="file"
//                 accept="image/*"
//                 className="sr-only"
//                 id="assessment-banner-create"
//                 onChange={(e) => {
//                   const f = e.target.files?.[0] || null;
//                   e.target.value = "";

//                   if (f && f.size > 10 * 1024 * 1024) {
//                     showToast("File size must be less than 10 MB");
//                     return;
//                   }

//                   setBannerFile(f);

//                   if (bannerPreview?.startsWith("blob:")) {
//                     URL.revokeObjectURL(bannerPreview);
//                   }

//                   setBannerPreview(f ? URL.createObjectURL(f) : null);
//                 }}
//               />

//               <div className="mt-2 space-y-3 rounded-2xl border-2 border-dashed border-white/25 bg-white/[0.04] px-4 py-6">
//                 <div className="flex flex-wrap justify-center gap-2">
//                   <button
//                     type="button"
//                     onClick={() => bannerInputRef.current?.click()}
//                     className="rounded-lg border border-[#8ec5eb]/50 bg-[#8ec5eb]/20 px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#8ec5eb]/30"
//                   >
//                     {bannerPreview ? "Replace banner" : "Upload banner"}
//                   </button>
//                 </div>

//                 {bannerPreview ? (
//                   <div
//                     className="relative mx-auto h-40 w-full max-w-md cursor-pointer overflow-hidden rounded-xl"
//                     onClick={() => bannerInputRef.current?.click()}
//                     onKeyDown={(e) => {
//                       if (e.key === "Enter" || e.key === " ") {
//                         e.preventDefault();
//                         bannerInputRef.current?.click();
//                       }
//                     }}
//                     role="button"
//                     tabIndex={0}
//                     aria-label="Change banner image"
//                   >
//                     {bannerPreview.startsWith("blob:") || bannerPreview.startsWith("data:") ? (
//                       // eslint-disable-next-line @next/next/no-img-element
//                       <img src={bannerPreview} alt="" className="h-40 w-full object-cover" />
//                     ) : (
//                       <Image
//                         src={bannerPreview}
//                         alt=""
//                         width={800}
//                         height={320}
//                         className="h-40 w-full object-cover"
//                         unoptimized={isRemoteImageSrc(bannerPreview)}
//                       />
//                     )}

//                     <p className="absolute bottom-2 left-1/2 w-[90%] -translate-x-1/2 rounded bg-black/55 px-2 py-1 text-center text-xs text-white/90">
//                       Click to replace
//                     </p>
//                   </div>
//                 ) : (
//                   <button
//                     type="button"
//                     onClick={() => bannerInputRef.current?.click()}
//                     className="flex w-full flex-col items-center justify-center gap-2 py-6 text-center transition hover:border-[#8ec5eb]/40"
//                   >
//                     <i className="fa-solid fa-cloud-arrow-up text-2xl text-[#8ec5eb]" />
//                     <span className="text-sm font-semibold text-white">Or click here to choose a file</span>
//                     <span className="text-xs text-white/50">PNG or JPG — max 10 MB</span>
//                   </button>
//                 )}
//               </div>
//             </div>

//             <div className="flex justify-end gap-4 pb-2 pt-8">
//               <button
//                 type="button"
//                 onClick={handleCancel}
//                 className="rounded-xl border border-white/25 bg-white/10 px-10 py-3 font-semibold text-[#cde2f2] transition hover:bg-white/15"
//               >
//                 Cancel
//               </button>

//               <button
//                 type="button"
//                 onClick={() => void handleCreateSurvey()}
//                 disabled={creating}
//                 className="rounded-xl bg-[#8ec5eb]/90 px-10 py-3 font-semibold text-[#062946] shadow-md transition hover:bg-[#8ec5eb] disabled:cursor-not-allowed disabled:opacity-60"
//               >
//                 {creating ? "Creating…" : "Create assessment"}
//               </button>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* Toast Notification */}
//       {toast && (
//         <div className="animate-fade-in fixed left-1/2 top-8 z-[70] -translate-x-1/2">
//           <div className="flex items-center gap-3 rounded-xl border border-white/20 bg-[#0a3558] px-6 py-4 shadow-2xl">
//             <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#8ec5eb]">
//               <i className="fa-solid fa-check text-xs text-[#062946]" />
//             </div>
//             <span className="font-semibold text-white">{toast}</span>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import MentorHeader from "@/app/Components/MentorHeader";
import DirectorHero from "@/app/director/DirectorHero";
import {
  directorBtnPrimary,
  directorBtnSecondary,
  directorGlassCard,
  directorInputClass,
  directorLabelClass,
  directorPageContainer,
  directorPageRoot,
} from "@/app/director/directorUi";
import AssessmentBg from "../../../Assets/assessment-bg.png";
import {
  apiCreateAssessment,
  apiUploadAssessmentBanner,
  formatAssessmentApiErrorMessage,
} from "@/app/Services/assessment.service";
import {
  buildCreateAssessmentSectionsFromWizard,
  buildPreSurveyPayloadForDirectorCreate,
  defaultWizardPlanName,
} from "@/app/Services/utils/assessment-mapper";
import type { CreateAssessmentPayload } from "@/app/Services/types/assessment.types";
import { isRemoteImageSrc } from "@/app/utils/image";

/** Initial count of **choice layers** (survey); add/remove is independent of CDP levels. */
// const DEFAULT_STARTING_LAYERS = 4;
const MIN_LAYERS = 1;
/** CDP is always **four levels** (1–4), separate from choice layers. */
const CDP_LEVEL_COUNT = 4;

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

const defaultSection = (): WizardSection => {
  const base = Date.now();
  return {
    id: base,
    name: "",
    guidelines: "",
    // layers: Array.from({ length: DEFAULT_STARTING_LAYERS }, (_, i) => ({
    //   id: base + i,
    //   choices: [""],
    // })),
    layers: Array.from({ length: 2 }, (_, i) => ({
  id: base + i,
  choices: [""],
})),
    plans: Array.from({ length: CDP_LEVEL_COUNT }, (_, i) => ({
      id: base + i + 100,
      name: defaultWizardPlanName(i),
      items: [""],
    })),
  };
};

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
  const bannerInputRef = useRef<HTMLInputElement | null>(null);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 4000);
  };

  const handleAddInstruction = () => setInstructions([...instructions, ""]);

  const handleRemoveInstruction = (index: number) => {
    setInstructions((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  };

  const handleUpdateInstruction = (index: number, value: string) => {
    const updated = [...instructions];
    updated[index] = value;
    setInstructions(updated);
  };

  const handleAddSection = () => {
    setSections([...sections, defaultSection()]);
  };

  const handleRemoveSection = (sectionIdx: number) => {
    setSections((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== sectionIdx)));
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

  const handleAddLayer = (sectionIdx: number) => {
    setSections((prev) => {
      const next = [...prev];
      const copy = { ...next[sectionIdx] };
      const idBase = Date.now();
      copy.layers = [...copy.layers, { id: idBase, choices: [""] }];
      next[sectionIdx] = copy;
      return next;
    });
  };

  const handleRemoveLayer = (sectionIdx: number, layerIdx: number) => {
    setSections((prev) => {
      if (prev[sectionIdx]?.layers.length <= MIN_LAYERS) return prev;
      const next = [...prev];
      const copy = { ...next[sectionIdx] };
      copy.layers = copy.layers.filter((_, j) => j !== layerIdx);
      next[sectionIdx] = copy;
      return next;
    });
  };

  const handleRemoveLayerChoice = (sectionIdx: number, layerIdx: number, choiceIdx: number) => {
    setSections((prev) => {
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

  const handleRemovePlanItem = (sectionIdx: number, planIdx: number, itemIdx: number) => {
    setSections((prev) => {
      if (prev[sectionIdx]?.plans[planIdx]?.items.length <= 1) return prev;
      const next = [...prev];
      const copy = { ...next[sectionIdx] };
      const plans = [...copy.plans];
      const plan = { ...plans[planIdx] };
      plan.items = plan.items.filter((_, j) => j !== itemIdx);
      plans[planIdx] = plan;
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
        s.layers.length < MIN_LAYERS ||
        s.plans.length !== CDP_LEVEL_COUNT ||
        s.layers.some((l) => !l.choices.some((c) => c.trim())),
    );
    if (invalidSection) {
      showToast(
        `Each section needs at least one choice layer with text, and exactly ${CDP_LEVEL_COUNT} CDP level blocks (levels 1–4).`,
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
          setTimeout(() => router.push("/mentor/MentorAssessments"), 1800);
          return;
        }
      }

      showToast("Assessment created successfully");
      setTimeout(() => {
        if (!newId) router.refresh();
        router.push("/mentor/MentorAssessments");
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
      <MentorHeader showFullHeader={true} />
      <div className={`${directorPageContainer} px-4 pt-3 sm:px-6 lg:px-10 sm:pt-5`}>
        <DirectorHero
          title="Create assessment"
          subtitle="CMA includes a pre-survey; PMP does not. Layers are multiple-choice steps (you can add or remove). Levels 1–4 are four CDP plan blocks per section and stay fixed."
          image={AssessmentBg}
          // breadcrumbItems={[
          //   { label: "Home", href: "/director/home" },
          //   { label: "Assessments", href: "/director/assessments" },
          //   { label: "Create" },
          // ]}
          breadcrumbItems={[
            { label: "Home", href: "/mentor/home" },
            { label: "Assessments", href: "/mentor/MentorAssessments" },
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
                <span className={directorLabelClass}>Include Pre-Survey Questions?</span>
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
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={instruction}
                      onChange={(e) => handleUpdateInstruction(idx, e.target.value)}
                      placeholder={`Instruction ${idx + 1}`}
                      className={directorInputClass + " min-w-0 flex-1"}
                    />
                    {instructions.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => handleRemoveInstruction(idx)}
                        className="shrink-0 rounded-lg border border-red-400/30 bg-red-500/15 px-3 py-2 text-sm font-semibold text-red-200 hover:bg-red-500/25"
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
              <div className="mb-8 rounded-2xl border border-white/15 bg-white/[0.04] p-5 sm:p-6">
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
                        <div className="min-w-[220px] flex-1">
                          <label className={directorLabelClass}>Question {qIdx + 1}</label>
                          <input
                            type="text"
                            value={row.text}
                            onChange={(e) => handleUpdatePreSurvey(qIdx, "text", e.target.value)}
                            placeholder="e.g. What is your current church?"
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
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-base font-semibold text-[#8ec5eb]">Section {sectionIdx + 1}</h3>
                    {sections.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => handleRemoveSection(sectionIdx)}
                        className="rounded-lg border border-red-400/30 bg-red-500/15 px-3 py-1.5 text-sm font-semibold text-red-200 hover:bg-red-500/25"
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

                  <h4 className="text-sm font-semibold text-white/90">Choice layers (survey)</h4>
                  {/* <div className="flex flex-wrap items-end justify-between gap-3">
                    <p className="text-sm text-white/70">
                      {section.layers.length} layer{section.layers.length === 1 ? "" : "s"} — not the same
                      as CDP levels 1–4 below. At least one filled option per layer.
                    </p>
                    <button
                      type="button"
                      onClick={() => handleAddLayer(sectionIdx)}
                      className={directorBtnSecondary + " !py-2 !text-sm"}
                    >
                      <i className="fa-solid fa-plus" />
                      Add layer
                    </button>
                  </div> */}
                  <div className="flex flex-wrap items-end justify-between gap-3">
  <p className="text-sm text-white/70">
    {section.layers.length} layer{section.layers.length === 1 ? "" : "s"} — not the same
    as CDP levels 1–4 below. At least one filled option per layer.
  </p>

  <div className="flex items-center gap-2">
    <button
      type="button"
      onClick={() => handleRemoveLayer(sectionIdx, section.layers.length - 1)}
      disabled={section.layers.length <= MIN_LAYERS}
      className="rounded-lg border border-red-400/30 bg-red-500/15 px-2.5 py-1.5 text-xs font-semibold text-red-200 transition enabled:hover:bg-red-500/25 disabled:cursor-not-allowed disabled:opacity-40"
    >
      <i className="fa-solid fa-minus mr-1" />
      Layer
    </button>

    <button
      type="button"
      onClick={() => handleAddLayer(sectionIdx)}
      className="rounded-lg border border-[#8ec5eb]/45 bg-[#8ec5eb]/15 px-2.5 py-1.5 text-xs font-semibold text-[#d6edff] transition hover:bg-[#8ec5eb]/25"
    >
      <i className="fa-solid fa-plus mr-1" />
      Layer
    </button>
  </div>
</div>

                  {section.layers.map((layer, layerIdx) => (
                    <div key={layer.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-white/90">Layer {layerIdx + 1}</span>
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleAddLayerChoice(sectionIdx, layerIdx)}
                            className="text-xs font-semibold text-[#8ec5eb] hover:underline"
                          >
                            + Choice
                          </button>
                          {section.layers.length > MIN_LAYERS ? (
                            <button
                              type="button"
                              onClick={() => handleRemoveLayer(sectionIdx, layerIdx)}
                              className="rounded-lg border border-red-400/30 bg-red-500/15 px-2.5 py-1.5 text-xs font-semibold text-red-200 hover:bg-red-500/25"
                            >
                              <i className="fa-solid fa-trash mr-1" />
                              Remove layer
                            </button>
                          ) : null}
                        </div>
                      </div>
                      {layer.choices.map((choice, choiceIdx) => (
                        <div key={choiceIdx} className="mb-2 flex items-center gap-2">
                          <input
                            type="text"
                            value={choice}
                            onChange={(e) =>
                              handleUpdateLayerChoice(
                                sectionIdx,
                                layerIdx,
                                choiceIdx,
                                e.target.value,
                              )
                            }
                            placeholder={`Choice ${choiceIdx + 1}`}
                            className={directorInputClass + " min-w-0 flex-1"}
                          />
                          {layer.choices.length > 1 ? (
                            <button
                              type="button"
                              onClick={() =>
                                handleRemoveLayerChoice(sectionIdx, layerIdx, choiceIdx)
                              }
                              className="shrink-0 rounded-lg border border-red-400/30 bg-red-500/15 px-2.5 py-2 text-sm text-red-200 hover:bg-red-500/25"
                              aria-label={`Remove choice ${choiceIdx + 1}`}
                            >
                              <i className="fa-solid fa-trash" />
                            </button>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ))}

                  <h4 className="pt-2 text-sm font-semibold text-white/90">Levels 1–4 (CDP)</h4>
                  <p className="text-xs text-white/55">
                    Exactly four development-plan levels per section, independent of how many choice
                    layers you added above.
                  </p>
                  {section.plans.map((plan, planIdx) => (
                    <div key={plan.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-white/85">{plan.name}</span>
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
                            placeholder={`Plan item ${itemIdx + 1}`}
                            className={directorInputClass + " min-w-0 flex-1"}
                          />
                          {plan.items.length > 1 ? (
                            <button
                              type="button"
                              onClick={() => handleRemovePlanItem(sectionIdx, planIdx, itemIdx)}
                              className="shrink-0 rounded-lg border border-red-400/30 bg-red-500/15 px-2.5 py-2 text-sm text-red-200 hover:bg-red-500/25"
                              aria-label={`Remove plan item ${itemIdx + 1}`}
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

            <div className="mt-8">
              <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                <span className={`${directorLabelClass} mb-0 flex items-center gap-2`}>
                  <i className="fa-solid fa-image text-[#8ec5eb]" />
                  Banner image (optional)
                </span>
                {bannerFile || bannerPreview ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (bannerPreview?.startsWith("blob:")) URL.revokeObjectURL(bannerPreview);
                      setBannerFile(null);
                      setBannerPreview(null);
                    }}
                    className="text-sm font-semibold text-red-300/90 hover:underline"
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
                id="assessment-banner-create"
                onChange={(e) => {
                  const f = e.target.files?.[0] || null;
                  e.target.value = "";
                  setBannerFile(f);
                  if (bannerPreview?.startsWith("blob:")) URL.revokeObjectURL(bannerPreview);
                  setBannerPreview(f ? URL.createObjectURL(f) : null);
                }}
              />
              <div className="mt-2 space-y-3 rounded-2xl border-2 border-dashed border-white/25 bg-white/[0.04] px-4 py-6">
                <div className="flex flex-wrap justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => bannerInputRef.current?.click()}
                    className="rounded-lg border border-[#8ec5eb]/50 bg-[#8ec5eb]/20 px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#8ec5eb]/30"
                  >
                    {bannerPreview ? "Replace banner" : "Upload banner"}
                  </button>
                </div>
                {bannerPreview ? (
                  <div
                    className="relative h-40 w-full max-w-md mx-auto cursor-pointer overflow-hidden rounded-xl"
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
                    {/* <img> for blob:/data: — most reliable; Next Image can block some picks */}
                    {bannerPreview.startsWith("blob:") || bannerPreview.startsWith("data:") ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={bannerPreview}
                        alt=""
                        className="h-40 w-full object-cover"
                      />
                    ) : (
                      <Image
                        src={bannerPreview}
                        alt=""
                        width={800}
                        height={320}
                        className="h-40 w-full object-cover"
                        unoptimized={isRemoteImageSrc(bannerPreview)}
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
                    className="flex w-full flex-col items-center justify-center gap-2 py-6 text-center transition hover:border-[#8ec5eb]/40"
                  >
                    <i className="fa-solid fa-cloud-arrow-up text-2xl text-[#8ec5eb]" />
                    <span className="text-sm font-semibold text-white">Or click here to choose a file</span>
                    <span className="text-xs text-white/50">PNG or JPG — max 10 MB</span>
                  </button>
                )}
              </div>
            </div>

            <div className="mt-10 flex flex-wrap justify-end gap-3 border-t border-white/10 pt-8">
              <button type="button" onClick={() => router.push("/mentor/MentorAssessments")} className={directorBtnSecondary}>
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

