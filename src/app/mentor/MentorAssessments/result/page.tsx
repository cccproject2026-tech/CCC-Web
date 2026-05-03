"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import "@fortawesome/fontawesome-free/css/all.min.css";
import headerBg from "@/app/Assets/CMA-hero-bg.png";
import MentorHeader from "@/app/Components/MentorHeader";
import {
  apiGetAssessmentById,
  apiGetUserAnswers,
  apiGetSectionRecommendations,
  parseAssessmentDetailPayload,
  extractSurveySectionsForCma,
} from "@/app/Services/assessment.service";

type CdpMap = Record<string, string>;
type AnswersMap = Record<string, string>;

function normalizeSectionsForCmaUi(raw: unknown[]): any[] {
  return raw.map((sec: any) => ({
    ...sec,
    name: sec?.name ?? sec?.title ?? "Section",
    layers: (Array.isArray(sec?.layers) ? sec.layers : []).map((layer: any) => ({
      ...layer,
      question: layer?.question ?? layer?.title ?? layer?.name ?? "",
      choices: Array.isArray(layer?.choices)
        ? layer.choices.map((c: any, ci: number) =>
            typeof c === "string"
              ? { _id: `opt_${ci}`, label: c, value: c }
              : {
                  ...c,
                  _id: c?._id ?? c?.id ?? c?.value ?? `opt_${ci}`,
                  label: c?.label ?? c?.text ?? String(c?.value ?? ""),
                },
          )
        : [],
    })),
  }));
}

function resolveLayerKey(layer: any, sectionIndex: number, layerIndex: number): string {
  return String(layer?.layerId ?? layer?._id ?? `layer_${sectionIndex}_${layerIndex}`);
}

function choiceMatchesSelection(c: Record<string, unknown> | undefined, sel: string): boolean {
  if (!c) return false;
  const id = c._id != null ? String(c._id) : "";
  const cid = c.id != null ? String(c.id) : "";
  const val = c.value != null ? String(c.value) : "";
  const lab = c.label != null ? String(c.label) : "";
  const text = c.text != null ? String(c.text) : "";
  return sel === id || sel === cid || sel === val || sel === lab || sel === text;
}

function extractMentorCdpText(layer: Record<string, unknown> | null | undefined): string {
  if (!layer || typeof layer !== "object") return "";
  const keys = [
    "mentorCdp",
    "cdp",
    "customizedDevelopmentPlan",
    "customDevelopmentPlan",
    "mentorDevelopmentPlan",
    "developmentPlan",
    "mentorFeedback",
    "mentorMessage",
    "cdpText",
    "developmentPlanText",
    "recommendation",
    "recommendationMessage",
    "recommendationText",
    "matchedRecommendation",
    "appliedRecommendation",
    "selectedRecommendation",
    "personalizedPlan",
    "mentorNotes",
    "notes",
  ];

  for (const k of keys) {
    const v = layer[k];
    if (v != null && String(v).trim()) return String(v).trim();
  }

  const rec = layer.recommendation;
  if (rec && typeof rec === "object" && !Array.isArray(rec)) {
    const o = rec as Record<string, unknown>;
    const m = o.message ?? o.text ?? o.label;
    if (m != null && String(m).trim()) return String(m).trim();
  }

  return "";
}

function parseRecommendationsCdpPayload(data: unknown): CdpMap {
  const out: CdpMap = {};

  if (Array.isArray(data)) {
    data.forEach((r: Record<string, unknown>) => {
      const msg = r?.message ?? r?.text ?? r?.cdp ?? r?.mentorCdp;
      const lid = r?.layerId ?? r?.layer_id ?? r?._id;
      if (lid != null && msg != null && String(msg).trim()) {
        out[String(lid)] = String(msg).trim();
      }
    });
    return out;
  }

  if (!data || typeof data !== "object") return out;

  let body = data as Record<string, unknown>;
  if (body.data && typeof body.data === "object" && !Array.isArray(body.data)) {
    body = body.data as Record<string, unknown>;
  } else if (Array.isArray(body.data)) {
    return parseRecommendationsCdpPayload(body.data);
  }

  const sections = Array.isArray(body.sections) ? body.sections : [];
  sections.forEach((section: any, si: number) => {
    const layers = Array.isArray(section?.layers) ? section.layers : [];
    layers.forEach((layer: any, li: number) => {
      const text = extractMentorCdpText(layer);
      if (!text) return;
      const layerId = resolveLayerKey(layer, si, li);
      out[layerId] = text;
      const rawId = layer?.layerId ?? layer?._id ?? layer?.id;
      if (rawId != null) out[String(rawId)] = text;
    });
  });

  const recs = Array.isArray(body.recommendations) ? body.recommendations : [];
  recs.forEach((r: Record<string, unknown>) => {
    const msg = r?.message ?? r?.text ?? r?.cdp ?? r?.mentorCdp ?? r?.mentorMessage ?? r?.description;
    const lid = r?.layerId ?? r?.layer_id ?? r?.layerID ?? r?._id;
    if (lid != null && msg != null && String(msg).trim()) {
      out[String(lid)] = String(msg).trim();
    }
  });

  return out;
}

function extractUserAnswerSectionsPayload(data: unknown): any[] {
  if (Array.isArray(data)) {
    if (data.length === 0) return [];
    const first = data[0] as Record<string, unknown> | undefined;
    if (first && Array.isArray(first.sections)) return first.sections as any[];
    if (first && Array.isArray(first.answers)) return first.answers as any[];
    const looksLikeSectionRows = data.every(
      (row) =>
        row &&
        typeof row === "object" &&
        ("sectionId" in (row as Record<string, unknown>) || "layers" in (row as Record<string, unknown>)),
    );
    if (looksLikeSectionRows) return data as any[];
    return [];
  }

  if (!data || typeof data !== "object") return [];

  const root = data as Record<string, unknown>;
  if (Array.isArray(root.sections)) return root.sections as any[];
  if (Array.isArray(root.answers)) return root.answers as any[];

  const d1 = root.data;
  if (Array.isArray(d1)) {
    const first = d1[0] as Record<string, unknown> | undefined;
    if (first && Array.isArray(first.sections)) return first.sections as any[];
    if (first && Array.isArray(first.answers)) return first.answers as any[];
  }

  if (d1 && typeof d1 === "object") {
    const o1 = d1 as Record<string, unknown>;
    if (Array.isArray(o1.sections)) return o1.sections as any[];
    if (Array.isArray(o1.answers)) return o1.answers as any[];

    const d2 = o1.data;
    if (d2 && typeof d2 === "object") {
      const o2 = d2 as Record<string, unknown>;
      if (Array.isArray(o2.sections)) return o2.sections as any[];
      if (Array.isArray(o2.answers)) return o2.answers as any[];
    }
  }

  return [];
}

function getLayerChoiceSelection(layer: any): string {
  const direct = layer?.selectedChoice;
  if (direct != null && String(direct).trim()) return String(direct).trim();
  if (Array.isArray(layer?.selectedValues) && layer.selectedValues[0] != null) {
    const first = String(layer.selectedValues[0]).trim();
    if (first) return first;
  }
  return "";
}

function findAnswerSection(templateSection: any, answerSections: any[], sectionIndex: number): any | undefined {
  const sid = String(templateSection?._id ?? templateSection?.id ?? "").trim();
  if (sid) {
    const byId = answerSections.find((s) => String(s?.sectionId ?? s?._id ?? s?.id ?? "").trim() === sid);
    if (byId) return byId;
  }
  return answerSections[sectionIndex];
}

function buildAnswerMapFromSections(templateSections: any[], answerSections: any[]): AnswersMap {
  const userAnswers: AnswersMap = {};

  templateSections.forEach((templateSection: any, sectionIndex: number) => {
    const answerSection = findAnswerSection(templateSection, answerSections, sectionIndex);
    const answerLayers = Array.isArray(answerSection?.layers) ? answerSection.layers : [];
    const templateLayers = Array.isArray(templateSection?.layers) ? templateSection.layers : [];

    templateLayers.forEach((templateLayer: any, layerIndex: number) => {
      const uiLayerId = resolveLayerKey(templateLayer, sectionIndex, layerIndex);
      const templateLayerId = String(templateLayer?._id ?? templateLayer?.id ?? "").trim();

      const byId = answerLayers.find(
        (l: any) =>
          String(l?.layerId ?? l?._id ?? l?.id ?? "").trim() !== "" &&
          (String(l?.layerId ?? l?._id ?? l?.id ?? "").trim() === uiLayerId ||
            (templateLayerId && String(l?.layerId ?? l?._id ?? l?.id ?? "").trim() === templateLayerId)),
      );

      const answerLayer = byId ?? answerLayers[layerIndex];
      if (!answerLayer) return;

      const selected = getLayerChoiceSelection(answerLayer);
      if (!selected) return;

      const selectedAsIndex = Number(selected);
      const hasNumericIndex = Number.isInteger(selectedAsIndex);
      const choices = Array.isArray(templateLayer?.choices) ? templateLayer.choices : [];
      const matchingChoice = choices.find((c: any) => choiceMatchesSelection(c as Record<string, unknown>, selected));

      if (matchingChoice) {
        userAnswers[uiLayerId] = String(
          matchingChoice?._id ?? matchingChoice?.id ?? matchingChoice?.value ?? matchingChoice?.label,
        );
      } else if (hasNumericIndex && selectedAsIndex >= 0 && selectedAsIndex < choices.length) {
        const byIndex = choices[selectedAsIndex];
        userAnswers[uiLayerId] = String(byIndex?._id ?? byIndex?.id ?? byIndex?.value ?? byIndex?.label ?? selected);
      } else {
        userAnswers[uiLayerId] = selected;
      }
    });
  });

  return userAnswers;
}

export default function MentorAssessmentResultPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const assessmentId = (searchParams.get("assessmentId") || "").trim();
  const userId = (searchParams.get("userId") || "").trim();

  const [loading, setLoading] = useState(true);
  const [sections, setSections] = useState<any[]>([]);
  const [activeSection, setActiveSection] = useState(0);
  const [assessmentTitle, setAssessmentTitle] = useState("Assessment Result");
  const [answers, setAnswers] = useState<AnswersMap>({});
  const [mentorLayerCdp, setMentorLayerCdp] = useState<CdpMap>({});
  const [hasRecommendations, setHasRecommendations] = useState(false);

  useEffect(() => {
    if (!assessmentId || !userId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        setLoading(true);

        const detailRes = await apiGetAssessmentById(assessmentId);
        const detail = parseAssessmentDetailPayload(detailRes.data);
        const rawSections = extractSurveySectionsForCma(detail ?? undefined);
        const normalizedSections = normalizeSectionsForCmaUi(rawSections);
        if (!cancelled) {
          setSections(normalizedSections);
          setAssessmentTitle(String(detail?.name || "Assessment Result"));
        }

        const cdpMap: CdpMap = {};

        try {
          const answersRes = await apiGetUserAnswers(assessmentId, userId);
          const sectionsData = extractUserAnswerSectionsPayload(answersRes.data);
          if (!cancelled) {
            setAnswers(buildAnswerMapFromSections(normalizedSections, sectionsData));
          }

          // Check if any section has recommendations
          let hasRecs = false;
          if (Array.isArray(sectionsData)) {
            hasRecs = sectionsData.some(
              (section: any) => Array.isArray(section?.recommendations) && section.recommendations.length > 0,
            );
            if (!cancelled) {
              setHasRecommendations(hasRecs);
            }

            sectionsData.forEach((section: any, sectionIndex: number) => {
              section?.layers?.forEach((layer: any, layerIndex: number) => {
                const lid = resolveLayerKey(layer, sectionIndex, layerIndex);
                const cdp = extractMentorCdpText(layer as Record<string, unknown>);
                if (!cdp) return;
                cdpMap[lid] = cdp;
                const rawId = layer?.layerId ?? layer?._id ?? layer?.id;
                if (rawId != null) cdpMap[String(rawId)] = cdp;
              });
            });
          }
        } catch {
          if (!cancelled) setAnswers({});
        }

        try {
          const recRes = await apiGetSectionRecommendations(assessmentId, userId);
          Object.assign(cdpMap, parseRecommendationsCdpPayload(recRes.data));
        } catch {
          /* optional */
        }

        if (!cancelled) setMentorLayerCdp(cdpMap);
      } catch {
        if (!cancelled) {
          setSections([]);
          setAnswers({});
          setMentorLayerCdp({});
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [assessmentId, userId]);

  const selectedCount = useMemo(() => Object.keys(answers).length, [answers]);

  return (
    <div className="min-h-screen bg-[#062946] font-[Albert_Sans] text-white antialiased">
      <MentorHeader showFullHeader={true} />

      <header
        className="relative flex min-h-[160px] items-center bg-cover bg-center bg-no-repeat px-4 py-8 text-white sm:px-8 md:px-16"
        style={{ backgroundImage: `url(${headerBg.src})` }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_10%,rgba(141,211,243,0.22),transparent_36%),linear-gradient(180deg,rgba(4,31,53,0.82)_0%,rgba(6,41,70,0.92)_100%)]" />
        <div className="relative z-10 flex w-full items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold sm:text-2xl md:text-3xl">{assessmentTitle}</h1>
            <p className="mt-2 text-sm text-[#d9ebf8]">Mentor view of mentee submitted answers.</p>
          </div>
          {hasRecommendations && (
            <button
              type="button"
              onClick={() => {
                router.push(`/mentor/MentorAssessments?tab=submitted&menteeId=${userId}`);
              }}
              className="mt-2 shrink-0 rounded-lg border border-[#8ec5eb]/50 bg-[#8ec5eb]/20 px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#8ec5eb]/30 sm:text-sm whitespace-nowrap"
            >
              Send CDP
            </button>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-8 md:px-16">
        {!assessmentId || !userId ? (
          <div className="rounded-2xl border border-white/15 bg-white/5 p-6 text-[#cde2f2]">
            Missing assessment or mentee information.
          </div>
        ) : loading ? (
          <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/5 p-6 text-[#cde2f2]">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#8ec5eb] border-t-transparent" />
            Loading result...
          </div>
        ) : sections.length === 0 ? (
          <div className="rounded-2xl border border-white/15 bg-white/5 p-6 text-[#cde2f2]">
            No sections found for this assessment.
          </div>
        ) : (
          <div className="flex flex-col gap-6 sm:flex-row">
            <aside className="w-full shrink-0 rounded-2xl border border-white/15 bg-white/5 p-4 sm:w-[320px]">
              <h2 className="mb-3 text-sm font-semibold text-[#8ec5eb]">Sections</h2>
              <p className="mb-4 text-xs text-[#cde2f2]">Answered items: {selectedCount}</p>
              <div className="space-y-2">
                {sections.map((sec, i) => (
                  <button
                    key={sec?._id || sec?.id || i}
                    type="button"
                    onClick={() => setActiveSection(i)}
                    className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition ${
                      activeSection === i
                        ? "border-[#8ec5eb]/40 bg-[#8ec5eb]/15 text-white"
                        : "border-white/15 bg-white/5 text-[#cde2f2] hover:bg-white/10"
                    }`}
                  >
                    <div className="text-[11px] text-[#8ec5eb]">Section {i + 1}</div>
                    <div className="line-clamp-2">{sec?.name || sec?.title || `Section ${i + 1}`}</div>
                  </button>
                ))}
              </div>
            </aside>

            <section className="min-w-0 flex-1">
              <div className="space-y-5">
                {(sections[activeSection]?.layers || []).map((layer: any, layerIndex: number) => {
                  const layerId = resolveLayerKey(layer, activeSection, layerIndex);
                  return (
                    <div
                      key={layerId}
                      className="rounded-2xl border border-[#8ec5eb]/25 bg-[linear-gradient(180deg,rgba(12,58,95,0.55)_0%,rgba(9,49,80,0.72)_100%)] p-5"
                    >
                      <h3 className="mb-3 text-base font-semibold text-white">
                        {layer?.question || layer?.title || "Question"}
                      </h3>

                      <div className="space-y-2">
                        {(layer?.choices || []).map((choice: any, ci: number) => {
                          const choiceKey = String(choice?._id ?? choice?.value ?? choice?.label ?? `c_${ci}`);
                          const choiceLabel = choice?.label ?? choice?.text ?? String(choice?.value ?? "");
                          const selected =
                            answers[layerId] === choiceKey ||
                            (choice?.value != null && answers[layerId] === String(choice.value)) ||
                            (choice?.label != null && answers[layerId] === String(choice.label));

                          return (
                            <label
                              key={`${layerId}-${choiceKey}-${ci}`}
                              className={`flex items-start gap-3 rounded-lg border px-2 py-1 ${
                                selected ? "border-[#8ec5eb]/40 bg-[#8ec5eb]/10" : "border-transparent"
                              }`}
                            >
                              <input
                                type="radio"
                                name={layerId}
                                checked={selected}
                                readOnly
                                disabled
                                className="mt-1 h-4 w-4 accent-[#8ec5eb]"
                              />
                              <span className="text-sm leading-relaxed text-[#e8f4fc]">{choiceLabel}</span>
                            </label>
                          );
                        })}
                      </div>

                      {(() => {
                        const fromApi =
                          mentorLayerCdp[layerId] ||
                          (layer?.layerId != null && mentorLayerCdp[String(layer.layerId)]) ||
                          (layer?._id != null && mentorLayerCdp[String(layer._id)]) ||
                          "";
                        const cdp = String(fromApi || "").trim();
                        if (!cdp) return null;
                        return (
                          <div className="mt-4 rounded-xl border border-[#8ec5eb]/35 bg-[#041f35]/80 p-4">
                            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#8ec5eb]">
                              Customized Development Plan (CDP)
                            </p>
                            <p className="whitespace-pre-line text-sm leading-relaxed text-[#d9ebf8]">{cdp}</p>
                          </div>
                        );
                      })()}
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setActiveSection((v) => Math.max(0, v - 1))}
                  disabled={activeSection === 0}
                  className="rounded-lg border border-white/25 bg-white/10 px-4 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>

                {activeSection === sections.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="rounded-lg bg-white px-5 py-2 text-sm font-semibold text-[#0f4a76]"
                  >
                    Back
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setActiveSection((v) => Math.min(sections.length - 1, v + 1))}
                    className="rounded-lg bg-white px-5 py-2 text-sm font-semibold text-[#0f4a76]"
                  >
                    Next
                  </button>
                )}
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
