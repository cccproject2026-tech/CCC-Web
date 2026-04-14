"use client";

import { useEffect, useMemo, useState } from "react";
import MentorHeader from "@/app/Components/MentorHeader";
import HeroBg from "../../Assets/progress-bg.png";
import {
  apiGetAssessments,
  apiGetAssessmentRecommendationRules,
  parseAssessmentsListPayload,
} from "@/app/Services/assessment.service";

type AssessmentOption = {
  id: string;
  name: string;
};

type RecommendationRule = {
  level?: number | string;
  items?: string[];
};

type RuleLayer = {
  _id?: string;
  title?: string;
  recommendations?: string[];
};

type RuleSection = {
  _id?: string;
  title?: string;
  name?: string;
  description?: string;
  recommendations?: RecommendationRule[];
  layers?: RuleLayer[];
};

function cloneSections(list: RuleSection[]): RuleSection[] {
  return JSON.parse(JSON.stringify(list)) as RuleSection[];
}

function getDraftKey(assessmentId: string): string {
  return `mentor_recommendation_rules_draft_${assessmentId}`;
}

function extractRulesPayload(body: unknown): RuleSection[] {
  if (Array.isArray(body)) return body as RuleSection[];
  if (!body || typeof body !== "object") return [];

  const o = body as Record<string, unknown>;
  if (Array.isArray(o.data)) return o.data as RuleSection[];

  if (o.data && typeof o.data === "object") {
    const d = o.data as Record<string, unknown>;
    if (Array.isArray(d.data)) return d.data as RuleSection[];
    if (Array.isArray(d.sections)) return d.sections as RuleSection[];
    if (Array.isArray(d.items)) return d.items as RuleSection[];
  }

  if (Array.isArray(o.sections)) return o.sections as RuleSection[];
  if (Array.isArray(o.items)) return o.items as RuleSection[];

  return [];
}

function normalizeAssessmentOption(item: unknown): AssessmentOption | null {
  if (!item || typeof item !== "object") return null;
  const row = item as Record<string, unknown>;
  const id = String(row._id ?? row.id ?? "").trim();
  if (!id) return null;
  const name = String(row.name ?? row.title ?? "Untitled Assessment");
  return { id, name };
}

export default function MentorAssessmentRecommendationsPage() {
  const [assessments, setAssessments] = useState<AssessmentOption[]>([]);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState("");
  const [sections, setSections] = useState<RuleSection[]>([]);
  const [originalSections, setOriginalSections] = useState<RuleSection[]>([]);
  const [loadingAssessments, setLoadingAssessments] = useState(true);
  const [loadingRules, setLoadingRules] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadAssessments = async () => {
      try {
        setLoadingAssessments(true);
        const res = await apiGetAssessments();
        const rows = parseAssessmentsListPayload(res.data)
          .map(normalizeAssessmentOption)
          .filter((item): item is AssessmentOption => item !== null);

        if (!active) return;

        setAssessments(rows);
        setSelectedAssessmentId((current) => current || rows[0]?.id || "");
      } catch {
        if (!active) return;
        setAssessments([]);
        setError("Unable to load assessments");
      } finally {
        if (!active) return;
        setLoadingAssessments(false);
      }
    };

    void loadAssessments();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    const loadRules = async () => {
      if (!selectedAssessmentId) {
        setSections([]);
        return;
      }

      try {
        setLoadingRules(true);
        setError(null);
        const res = await apiGetAssessmentRecommendationRules(selectedAssessmentId);
        const apiList = extractRulesPayload(res.data);
        let list = cloneSections(apiList);

        if (typeof window !== "undefined") {
          const raw = window.localStorage.getItem(getDraftKey(selectedAssessmentId));
          if (raw) {
            try {
              const parsed = JSON.parse(raw) as unknown;
              if (Array.isArray(parsed)) {
                list = parsed as RuleSection[];
              }
            } catch {
              // ignore invalid local draft
            }
          }
        }

        if (!active) return;
        setSections(list);
        setOriginalSections(cloneSections(apiList));
      } catch {
        if (!active) return;
        setSections([]);
        setOriginalSections([]);
        setError("Unable to load recommendation plans for this assessment");
      } finally {
        if (!active) return;
        setLoadingRules(false);
      }
    };

    void loadRules();
    return () => {
      active = false;
    };
  }, [selectedAssessmentId]);

  const selectedAssessmentName = useMemo(() => {
    return assessments.find((item) => item.id === selectedAssessmentId)?.name || "Assessment";
  }, [assessments, selectedAssessmentId]);

  const updateSectionRuleItem = (
    sectionIdx: number,
    ruleIdx: number,
    itemIdx: number,
    value: string,
  ) => {
    setSections((prev) => {
      const next = cloneSections(prev);
      const items = next[sectionIdx]?.recommendations?.[ruleIdx]?.items;
      if (!Array.isArray(items)) return prev;
      items[itemIdx] = value;
      return next;
    });
  };

  const addSectionRuleItem = (sectionIdx: number, ruleIdx: number) => {
    setSections((prev) => {
      const next = cloneSections(prev);
      const items = next[sectionIdx]?.recommendations?.[ruleIdx]?.items;
      if (!Array.isArray(items)) return prev;
      items.push("");
      return next;
    });
  };

  const removeSectionRuleItem = (sectionIdx: number, ruleIdx: number, itemIdx: number) => {
    setSections((prev) => {
      const next = cloneSections(prev);
      const items = next[sectionIdx]?.recommendations?.[ruleIdx]?.items;
      if (!Array.isArray(items)) return prev;
      items.splice(itemIdx, 1);
      return next;
    });
  };

  const updateLayerRecommendation = (
    sectionIdx: number,
    layerIdx: number,
    itemIdx: number,
    value: string,
  ) => {
    setSections((prev) => {
      const next = cloneSections(prev);
      const recs = next[sectionIdx]?.layers?.[layerIdx]?.recommendations;
      if (!Array.isArray(recs)) return prev;
      recs[itemIdx] = value;
      return next;
    });
  };

  const addLayerRecommendation = (sectionIdx: number, layerIdx: number) => {
    setSections((prev) => {
      const next = cloneSections(prev);
      const recs = next[sectionIdx]?.layers?.[layerIdx]?.recommendations;
      if (!Array.isArray(recs)) return prev;
      recs.push("");
      return next;
    });
  };

  const removeLayerRecommendation = (sectionIdx: number, layerIdx: number, itemIdx: number) => {
    setSections((prev) => {
      const next = cloneSections(prev);
      const recs = next[sectionIdx]?.layers?.[layerIdx]?.recommendations;
      if (!Array.isArray(recs)) return prev;
      recs.splice(itemIdx, 1);
      return next;
    });
  };

  const saveDraft = () => {
    if (!selectedAssessmentId || typeof window === "undefined") return;
    window.localStorage.setItem(getDraftKey(selectedAssessmentId), JSON.stringify(sections));
    setToast("Draft saved");
    window.setTimeout(() => setToast(null), 1800);
  };

  const resetToApiRules = () => {
    if (!selectedAssessmentId || typeof window === "undefined") return;
    window.localStorage.removeItem(getDraftKey(selectedAssessmentId));
    setSections(cloneSections(originalSections));
    setToast("Reset to API rules");
    window.setTimeout(() => setToast(null), 1800);
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#062946] text-white">
      <MentorHeader showFullHeader />

      <section
        className="relative bg-cover px-4 pb-10 pt-4 md:px-20"
        style={{ backgroundImage: `url(${HeroBg.src})` }}
      >
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative z-10 mx-auto max-w-6xl">
          <h1 className="text-2xl font-semibold">Assessment Recommendation Plans</h1>
          <p className="mt-1 text-sm text-white/70">
            View all recommendation plans configured for an assessment.
          </p>
        </div>
      </section>

      <main className="flex-1 px-4 py-10 md:px-20">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <label className="mb-2 block text-sm font-semibold text-[#8ec5eb]">Select Assessment</label>
            <select
              value={selectedAssessmentId}
              onChange={(e) => setSelectedAssessmentId(e.target.value)}
              disabled={loadingAssessments || assessments.length === 0}
              className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#8ec5eb]/50 [&>option]:text-gray-900"
            >
              {assessments.length === 0 ? (
                <option value="">No assessments available</option>
              ) : (
                assessments.map((assessment) => (
                  <option key={assessment.id} value={assessment.id}>
                    {assessment.name}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-white">{selectedAssessmentName}</h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={resetToApiRules}
                  disabled={loadingRules || sections.length === 0}
                  className="rounded-lg border border-white/25 bg-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={saveDraft}
                  disabled={loadingRules || sections.length === 0}
                  className="rounded-lg bg-[#8ec5eb]/30 px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#8ec5eb]/45 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Save Draft
                </button>
              </div>
            </div>

            {loadingRules ? (
              <p className="mt-3 text-sm text-white/60">Loading recommendation plans...</p>
            ) : error ? (
              <p className="mt-3 text-sm text-red-300">{error}</p>
            ) : sections.length === 0 ? (
              <p className="mt-3 text-sm text-white/60">No recommendation plans found for this assessment.</p>
            ) : (
              <div className="mt-5 space-y-4">
                {sections.map((section, sectionIdx) => {
                  const sectionTitle = section.title || section.name || `Section ${sectionIdx + 1}`;
                  const sectionRules = Array.isArray(section.recommendations)
                    ? section.recommendations
                    : [];
                  const layers = Array.isArray(section.layers) ? section.layers : [];

                  return (
                    <div key={section._id || `section_${sectionIdx}`} className="rounded-xl border border-white/15 bg-white/5 p-4">
                      <h3 className="text-base font-semibold text-[#8ec5eb]">{sectionTitle}</h3>
                      {section.description && (
                        <p className="mt-1 text-sm text-white/65">{section.description}</p>
                      )}

                      {sectionRules.length > 0 && (
                        <div className="mt-4 space-y-3">
                          {sectionRules.map((rule, ruleIdx) => (
                            <div
                              key={`rule_${ruleIdx}`}
                              className="rounded-lg border border-white/10 bg-white/5 p-3"
                            >
                              <div className="mb-2 flex items-center justify-between">
                                <p className="text-sm font-semibold text-white">
                                  Level {String(rule.level ?? ruleIdx + 1)}
                                </p>
                                <button
                                  type="button"
                                  onClick={() => addSectionRuleItem(sectionIdx, ruleIdx)}
                                  className="rounded bg-white/15 px-2 py-1 text-[11px] font-semibold hover:bg-white/20"
                                >
                                  Add Item
                                </button>
                              </div>
                              <div className="space-y-2">
                                {(Array.isArray(rule.items) ? rule.items : []).map((item, itemIdx) => (
                                  <div key={`rule_item_${itemIdx}`} className="flex items-center gap-2">
                                    <input
                                      type="text"
                                      value={item}
                                      onChange={(e) =>
                                        updateSectionRuleItem(sectionIdx, ruleIdx, itemIdx, e.target.value)
                                      }
                                      className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#8ec5eb]/50"
                                      placeholder={`Recommendation ${itemIdx + 1}`}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => removeSectionRuleItem(sectionIdx, ruleIdx, itemIdx)}
                                      className="rounded bg-red-500/25 px-2 py-2 text-[11px] font-semibold hover:bg-red-500/35"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {layers.length > 0 && (
                        <div className="mt-4 space-y-3">
                          {layers.map((layer, layerIdx) => {
                            const layerRecs = Array.isArray(layer.recommendations)
                              ? layer.recommendations
                              : [];

                            return (
                              <div
                                key={layer._id || `layer_${layerIdx}`}
                                className="rounded-lg border border-white/10 bg-white/5 p-3"
                              >
                                <div className="mb-2 flex items-center justify-between">
                                  <p className="text-sm font-semibold text-white">
                                    {layer.title || `Layer ${layerIdx + 1}`}
                                  </p>
                                  <button
                                    type="button"
                                    onClick={() => addLayerRecommendation(sectionIdx, layerIdx)}
                                    className="rounded bg-white/15 px-2 py-1 text-[11px] font-semibold hover:bg-white/20"
                                  >
                                    Add Item
                                  </button>
                                </div>
                                <div className="space-y-2">
                                  {layerRecs.map((item, itemIdx) => (
                                    <div key={`layer_item_${itemIdx}`} className="flex items-center gap-2">
                                      <input
                                        type="text"
                                        value={item}
                                        onChange={(e) =>
                                          updateLayerRecommendation(sectionIdx, layerIdx, itemIdx, e.target.value)
                                        }
                                        className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#8ec5eb]/50"
                                        placeholder={`Recommendation ${itemIdx + 1}`}
                                      />
                                      <button
                                        type="button"
                                        onClick={() =>
                                          removeLayerRecommendation(sectionIdx, layerIdx, itemIdx)
                                        }
                                        className="rounded bg-red-500/25 px-2 py-2 text-[11px] font-semibold hover:bg-red-500/35"
                                      >
                                        Remove
                                      </button>
                                    </div>
                                  ))}
                                  {layerRecs.length === 0 && (
                                    <p className="text-xs text-white/60">No recommendations yet. Click Add Item.</p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {sectionRules.length === 0 &&
                        layers.every((layer) => !Array.isArray(layer.recommendations) || layer.recommendations.length === 0) && (
                          <p className="mt-3 text-sm text-white/60">No recommendations configured in this section.</p>
                        )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      {toast && (
        <div className="fixed left-1/2 top-8 z-50 -translate-x-1/2 rounded-lg border border-white/30 bg-[#0c395d] px-5 py-3 text-sm shadow-xl">
          {toast}
        </div>
      )}
    </div>
  );
}
