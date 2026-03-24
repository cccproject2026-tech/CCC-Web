"use client";
import { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import PastorHeader from "@/app/Components/PastorHeader";
import PastorFooter from "@/app/Components/PastorFooter";
import HeroBg from "@/app/Assets/jumpstart-hero.png";
import UserPlaceholder from "@/app/Assets/user-profile.png";
import "@fortawesome/fontawesome-free/css/all.min.css";
import {
  apiGetRoadmapById,
  apiGetNestedRoadmapItem,
  apiGetExtras,
  apiSaveExtras,
  apiUpdateExtras,
  apiUploadExtrasDocuments,
  apiGetComments,
  apiAddQuery,
  apiGetQueries,
} from "@/app/Services/api";
import { getCookie } from "@/app/utils/cookies";
import type {
  CommentItem,
  QueryItem,
} from "@/app/Services/roadmaps.service";

interface ExtraComponent {
  type:
    | "TEXT_DISPLAY"
    | "TEXT_AREA"
    | "TEXT_FIELD"
    | "DATE_PICKER"
    | "UPLOAD"
    | "CHECKBOX"
    | "ASSESSMENT"
    | "SECTION"
    | "SIGNATURE";
  name: string;
  placeHolder?: string;
  buttonName?: string;
  date?: string;
  haveButton?: boolean;
  checkboxes?: ExtraComponent[];
  sections?: ExtraComponent[];
}

function JumpStartContent() {
  const searchParams = useSearchParams();
  const nestedItemId = searchParams.get("id");
  const parentRoadmapId = searchParams.get("parentId");
  // When coming from SelfRevitalizationPhasePage: id=nestedItemId, parentId=parentRoadmapId
  // For extras/comments/queries the roadmapId is always the parent roadmap ID
  const roadmapId = parentRoadmapId || nestedItemId;

  const [activeTab, setActiveTab] = useState("overview");
  const [queryTab, setQueryTab] = useState("New");
  const [roadmap, setRoadmap] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File>>({});
  const [extrasExist, setExtrasExist] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Comments
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);

  // Queries
  const [queries, setQueries] = useState<QueryItem[]>([]);
  const [queriesLoading, setQueriesLoading] = useState(false);
  const [newQueryText, setNewQueryText] = useState("");
  const [querySubmitting, setQuerySubmitting] = useState(false);
  const [querySuccess, setQuerySuccess] = useState(false);

  const userId = (() => {
    try {
      const u = JSON.parse(getCookie("user") || "{}");
      return u?.id || u?._id || "";
    } catch {
      return "";
    }
  })();

  useEffect(() => {
    if (!nestedItemId) return;
    const fetchRoadmap = async () => {
      try {
        setLoading(true);
        let data: any;
        if (parentRoadmapId) {
          // Nested item — use dedicated endpoint
          const res = await apiGetNestedRoadmapItem(parentRoadmapId, nestedItemId);
          data = res.data?.data || res.data;
        } else {
          // Fallback: top-level roadmap
          const res = await apiGetRoadmapById(nestedItemId);
          data = res.data?.data || res.data;
        }
        setRoadmap(data);
      } catch (err) {
        console.error("Failed to fetch roadmap", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRoadmap();
  }, [nestedItemId, parentRoadmapId]);

  // Load saved extras responses for this pastor
  useEffect(() => {
    if (!roadmapId || !userId) return;
    const loadExtras = async () => {
      try {
        const res = await apiGetExtras(roadmapId, userId, parentRoadmapId ? nestedItemId! : undefined);
        const data = res.data?.data || res.data;
        if (data && data.extras && data.extras.length > 0) {
          const saved: Record<string, any> = {};
          data.extras.forEach((item: any) => {
            if (item.key !== undefined) saved[item.key] = item.value;
          });
          setFormData(saved);
          setExtrasExist(true);
        }
      } catch {
        // No saved extras yet
      }
    };
    loadExtras();
  }, [roadmapId, userId, nestedItemId, parentRoadmapId]);

  // Load comments when Comments tab is opened
  useEffect(() => {
    if (activeTab !== "comments" || !roadmapId || !userId) return;
    const fetchComments = async () => {
      setCommentsLoading(true);
      try {
        const res = await apiGetComments(roadmapId, userId);
        const thread = res.data?.data || res.data;
        setComments(thread?.comments || []);
      } catch {
        setComments([]);
      } finally {
        setCommentsLoading(false);
      }
    };
    fetchComments();
  }, [activeTab, roadmapId, userId]);

  // Load queries when Queries tab is opened or subtab changes
  // apiGetQueries returns an array of QueriesThread — flatten all queries from all threads
  useEffect(() => {
    if (activeTab !== "queries" || !roadmapId || !userId) return;
    const statusMap: Record<string, string | undefined> = {
      New: undefined,
      Answered: "answered",
      Pending: "pending",
    };
    const fetchQueries = async () => {
      setQueriesLoading(true);
      try {
        const res = await apiGetQueries(roadmapId, userId, statusMap[queryTab]);
        const threads: any[] = res.data?.data || res.data || [];
        const allQueries = Array.isArray(threads)
          ? threads.flatMap((t: any) => t?.queries || [])
          : (threads as any)?.queries || [];
        setQueries(allQueries);
      } catch {
        setQueries([]);
      } finally {
        setQueriesLoading(false);
      }
    };
    fetchQueries();
  }, [activeTab, queryTab, roadmapId, userId]);

  const handleInputChange = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const scopedNestedId = parentRoadmapId ? nestedItemId! : undefined;

  const handleFileUpload = async (key: string, file: File) => {
    if (!roadmapId || !userId) return;
    try {
      setUploadedFiles((prev) => ({ ...prev, [key]: file }));
      await apiUploadExtrasDocuments(roadmapId, userId, [file], scopedNestedId, key);
    } catch (err) {
      console.error("Upload error:", err);
    }
  };

  const handleSave = async () => {
    if (!roadmapId || !userId) return;
    setSaving(true);
    try {
      const extrasArray = Object.entries(formData).map(([key, value]) => ({ key, value }));
      if (extrasExist) {
        await apiUpdateExtras(roadmapId, userId, { extras: extrasArray }, scopedNestedId);
      } else {
        await apiSaveExtras(roadmapId, { userId, nestedRoadMapItemId: scopedNestedId, extras: extrasArray });
        setExtrasExist(true);
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitQuery = async () => {
    if (!roadmapId || !userId || !newQueryText.trim()) return;
    setQuerySubmitting(true);
    try {
      await apiAddQuery(roadmapId, { actualQueryText: newQueryText.trim(), userId });
      setNewQueryText("");
      setQuerySuccess(true);
      setTimeout(() => setQuerySuccess(false), 3000);
      // Refresh pending queries list
      if (queryTab === "Pending") {
        const res = await apiGetQueries(roadmapId, userId, "pending");
        const threads: any[] = res.data?.data || res.data || [];
        setQueries(Array.isArray(threads) ? threads.flatMap((t: any) => t?.queries || []) : []);
      }
    } catch (err) {
      console.error("Submit query error:", err);
    } finally {
      setQuerySubmitting(false);
    }
  };

  const renderExtraComponent = (
    extra: ExtraComponent,
    index: number,
    parentKey = ""
  ) => {
    const componentKey = `${parentKey}_${extra.name}_${index}`;

    switch (extra.type) {
      case "TEXT_DISPLAY":
        return (
          <div key={componentKey} className="mb-4">
            <p className="text-[13px] text-white/90 leading-relaxed">{extra.name}</p>
          </div>
        );

      case "TEXT_AREA":
        return (
          <div key={componentKey} className="mb-5">
            <h4 className="text-sm font-semibold text-white mb-2">{extra.name}</h4>
            <textarea
              placeholder={extra.placeHolder || "Write here..."}
              value={formData[componentKey] || ""}
              onChange={(e) => handleInputChange(componentKey, e.target.value)}
              className="w-full border border-[#5A8DCB] rounded-md p-3 text-sm text-white bg-transparent focus:outline-none focus:ring-1 focus:ring-[#00B3FF] resize-none h-24"
            />
          </div>
        );

      case "TEXT_FIELD":
        return (
          <div key={componentKey} className="mb-5">
            <h4 className="text-sm font-semibold text-white mb-2">{extra.name}</h4>
            <input
              type="text"
              placeholder={extra.placeHolder || ""}
              value={formData[componentKey] || ""}
              onChange={(e) => handleInputChange(componentKey, e.target.value)}
              className="w-full border border-[#5A8DCB] rounded-md px-3 py-2 text-sm text-white bg-transparent focus:outline-none focus:ring-1 focus:ring-[#00B3FF]"
            />
          </div>
        );

      case "DATE_PICKER":
        return (
          <div key={componentKey} className="mb-5">
            <h4 className="text-sm font-semibold text-white mb-2">{extra.name}</h4>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <i className="fa-regular fa-calendar text-white/70 text-sm"></i>
                <input
                  type="date"
                  value={formData[componentKey] || extra.date || ""}
                  onChange={(e) => handleInputChange(componentKey, e.target.value)}
                  className="bg-transparent border border-[#52A1D1] text-sm text-white px-3 py-2 rounded-md focus:outline-none focus:ring-1 focus:ring-[#00B3FF]"
                />
              </div>
              {extra.buttonName && (
                <button className="bg-[#103C8C] hover:bg-[#0B2E72] transition text-white text-sm font-medium px-5 py-2 rounded-md shadow">
                  {extra.buttonName}
                </button>
              )}
            </div>
            {extra.checkboxes && extra.checkboxes.length > 0 && (
              <div className="mt-3 space-y-2 pl-1">
                {extra.checkboxes.map((cb, i) =>
                  renderExtraComponent(cb, i, `${componentKey}_cb`)
                )}
              </div>
            )}
          </div>
        );

      case "UPLOAD":
        return (
          <div key={componentKey} className="mb-5">
            <h4 className="text-sm font-semibold text-white mb-2">{extra.name}</h4>
            {uploadedFiles[componentKey] ? (
              <div className="bg-white/10 border border-[#5A8DCB] rounded-lg p-3 flex items-center gap-3">
                <i className="fa-solid fa-file text-blue-300"></i>
                <span className="text-sm text-white">{uploadedFiles[componentKey].name}</span>
                <button
                  onClick={() =>
                    setUploadedFiles((prev) => {
                      const n = { ...prev };
                      delete n[componentKey];
                      return n;
                    })
                  }
                  className="ml-auto text-white/50 hover:text-white text-xs"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-[#5A8DCB] rounded-lg p-5 text-center">
                <input
                  type="file"
                  onChange={(e) =>
                    e.target.files?.[0] &&
                    handleFileUpload(componentKey, e.target.files[0])
                  }
                  className="hidden"
                  id={`upload-${componentKey}`}
                />
                <label htmlFor={`upload-${componentKey}`} className="cursor-pointer">
                  <i className="fa-solid fa-cloud-arrow-up text-white/50 text-2xl mb-2 block"></i>
                  <span className="text-sm text-white/70">Click to upload file</span>
                </label>
              </div>
            )}
          </div>
        );

      case "CHECKBOX":
        return (
          <div key={componentKey} className="mb-4 flex items-start justify-between gap-4">
            <label className="flex items-start gap-2 text-sm text-white/90 cursor-pointer">
              <input
                type="checkbox"
                checked={formData[componentKey] || false}
                onChange={(e) => handleInputChange(componentKey, e.target.checked)}
                className="mt-[3px] accent-[#103C8C] w-4 h-4"
              />
              <span>{extra.name}</span>
            </label>
            {extra.haveButton && extra.buttonName && (
              <button className="bg-[#103C8C] hover:bg-[#0B2E72] transition text-white text-sm font-medium px-5 py-2 rounded-md shadow shrink-0">
                {extra.buttonName}
              </button>
            )}
          </div>
        );

      case "SIGNATURE":
        return (
          <div key={componentKey} className="mb-5">
            <h4 className="text-sm font-semibold text-white mb-2">{extra.name}</h4>
            <div className="border border-[#5A8DCB] rounded-lg bg-white/5 p-4">
              <input
                type="text"
                placeholder="Type your full name as signature"
                value={formData[componentKey] || ""}
                onChange={(e) => handleInputChange(componentKey, e.target.value)}
                className="w-full bg-transparent border-b border-[#5A8DCB] text-white text-sm pb-2 focus:outline-none italic"
              />
              <p className="text-white/40 text-xs mt-2">Digital signature</p>
            </div>
            {extra.buttonName && (
              <button className="mt-2 bg-[#103C8C] hover:bg-[#0B2E72] transition text-white text-sm font-medium px-5 py-2 rounded-md shadow">
                {extra.buttonName}
              </button>
            )}
          </div>
        );

      case "ASSESSMENT":
        return (
          <div key={componentKey} className="mb-5">
            <h4 className="text-sm font-semibold text-white mb-2">{extra.name}</h4>
            {extra.buttonName && (
              <button className="mb-3 bg-[#103C8C] hover:bg-[#0B2E72] transition text-white text-sm font-medium px-5 py-2 rounded-md shadow">
                {extra.buttonName}
              </button>
            )}
            {extra.checkboxes && extra.checkboxes.length > 0 && (
              <div className="space-y-2 pl-1">
                {extra.checkboxes.map((cb, i) =>
                  renderExtraComponent(cb, i, `${componentKey}_assessment_cb`)
                )}
              </div>
            )}
          </div>
        );

      case "SECTION":
        return (
          <div key={componentKey} className="mb-5 border border-[#3B6EA0] rounded-lg p-4">
            <h4 className="text-sm font-semibold text-white mb-3">{extra.name}</h4>
            {extra.checkboxes && extra.checkboxes.length > 0 && (
              <div className="space-y-2 mb-3">
                {extra.checkboxes.map((cb, i) =>
                  renderExtraComponent(cb, i, `${componentKey}_section_cb`)
                )}
              </div>
            )}
            {extra.sections && extra.sections.length > 0 && (
              <div className="space-y-3">
                {extra.sections.map((sec, i) =>
                  renderExtraComponent(sec, i, `${componentKey}_section`)
                )}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F4A85]">
        <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const title = roadmap?.name || "Jump Start";
  const duration = roadmap?.duration || "";
  const description = roadmap?.description || roadmap?.roadMapDetails || "";
  const extras: ExtraComponent[] = roadmap?.extras || [];

  return (
    <div className="min-h-screen flex flex-col bg-[#0F4A85]">
      <PastorHeader showFullHeader={true} />

      {/* HERO SECTION */}
      <section
        className="relative h-[320px] bg-cover bg-center text-white flex flex-col justify-end px-20 pb-10"
        style={{ backgroundImage: `url(${HeroBg.src})` }}
      >
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="relative z-10">
          <p className="text-sm text-white/80 mb-2">
            Revitalization Roadmap &gt;{" "}
            <span className="text-white">{title}</span>
          </p>
          <h1 className="text-3xl font-semibold">{title}</h1>
          {duration && (
            <p className="text-white/70 text-sm mt-1">Completion Time {duration}</p>
          )}
        </div>
      </section>

      {/* MAIN CONTENT */}
      <main className="flex-1 px-16 py-12 bg-gradient-to-b from-[#1B5F9E] to-[#0D3971] text-white">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[250px_1fr] gap-10">

          {/* LEFT PANEL */}
          <div className="bg-white rounded-xl shadow-md p-4 flex flex-col gap-2 w-full h-fit">
            {[
              { key: "overview", label: "Over View" },
              { key: "comments", label: "Comments" },
              { key: "queries", label: "Queries" },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                className={`flex justify-between items-center px-4 py-3 rounded-md text-sm font-medium transition-all ${
                  activeTab === item.key
                    ? "bg-[#103C8C] text-white shadow-sm"
                    : "bg-[#F8FAFF] text-gray-600 hover:bg-[#E9EEFF]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* RIGHT CONTENT */}
          <div>
            {/* ── OVERVIEW ── */}
            {activeTab === "overview" && (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">Over View</h2>
                  <button className="text-white/80 hover:text-white text-sm">
                    <i className="fa-solid fa-ellipsis-vertical"></i>
                  </button>
                </div>

                {description && (
                  <div className="bg-[#1070A9]/70 rounded-lg p-4 mb-6 border border-[#3B8CC2]">
                    <h3 className="text-sm font-semibold text-white mb-2">Description</h3>
                    <p className="text-white/90 text-sm leading-relaxed whitespace-pre-line">{description}</p>
                  </div>
                )}

                {extras.length > 0 && (
                  <div className="bg-[#1070A9]/70 rounded-lg p-5 mb-6 border border-[#3B8CC2]">
                    <h3 className="text-sm font-semibold text-white mb-4">Tasks</h3>
                    <div>
                      {extras.map((extra, i) => renderExtraComponent(extra, i, "extra"))}
                    </div>

                    <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-[#3B8CC2]">
                      {saveSuccess && (
                        <span className="text-green-300 text-sm flex items-center gap-1">
                          <i className="fa-solid fa-circle-check"></i> Saved
                        </span>
                      )}
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-[#103C8C] hover:bg-[#0B2E72] disabled:opacity-60 transition text-white text-sm font-medium px-6 py-2 rounded-md shadow"
                      >
                        {saving ? "Saving..." : "Save"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Mark as Completed */}
                <div className="flex items-center justify-between gap-4 mt-4">
                  <div className="flex items-center gap-3">
                    <i className="fa-regular fa-calendar text-white/80 text-sm"></i>
                    <input
                      type="date"
                      className="bg-transparent border border-[#52A1D1] text-sm text-white px-3 py-2 rounded-md focus:outline-none w-[180px]"
                    />
                  </div>
                  <button className="bg-[#103C8C] hover:bg-[#0B2E72] transition text-white text-sm font-medium px-6 py-2 rounded-md shadow">
                    Mark as Completed
                  </button>
                </div>
              </>
            )}

            {/* ── COMMENTS ── */}
            {activeTab === "comments" && (
              <>
                <h2 className="text-xl font-semibold mb-6">Comments</h2>

                {commentsLoading ? (
                  <div className="flex justify-center py-16">
                    <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : comments.length === 0 ? (
                  <div className="text-center py-16 text-white/50">
                    <i className="fa-regular fa-comments text-5xl mb-4 block"></i>
                    <p>No comments yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {comments.map((c) => {
                      const mentor = c.mentorId;
                      const name = mentor
                        ? `${mentor.firstName} ${mentor.lastName}`
                        : "Mentor";
                      const role = mentor?.role || "Mentor";
                      const avatar = mentor?.profilePicture || null;

                      return (
                        <div
                          key={c._id}
                          className="bg-white text-gray-800 rounded-lg shadow-sm p-4 flex justify-between items-start"
                        >
                          <div className="flex gap-3">
                            {avatar ? (
                              <img
                                src={avatar}
                                alt={name}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <Image
                                src={UserPlaceholder}
                                alt={name}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            )}
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-sm">{name}</h4>
                                <span className="text-xs text-gray-400">
                                  {formatDate(c.addedDate)}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 mb-1 capitalize">{role}</p>
                              <p className="text-sm">{c.text}</p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                            <div className="flex gap-4 text-[#103C8C] text-sm">
                              <i className="fa-regular fa-envelope cursor-pointer"></i>
                              <i className="fa-regular fa-comment cursor-pointer"></i>
                              <i className="fa-solid fa-phone cursor-pointer"></i>
                              <i className="fa-brands fa-whatsapp cursor-pointer"></i>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {/* ── QUERIES ── */}
            {activeTab === "queries" && (
              <>
                <h2 className="text-[20px] font-semibold mb-4 border-b border-white/30 pb-2">
                  Queries
                </h2>
                <div className="flex justify-end mb-5">
                  <div className="flex bg-white rounded-lg shadow-sm overflow-hidden">
                    {["New", "Answered", "Pending"].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setQueryTab(tab)}
                        className={`px-6 py-[7px] text-sm font-medium transition-all duration-200 ${
                          queryTab === tab
                            ? "bg-[#103C8C] text-white m-2"
                            : "bg-white text-gray-500 hover:text-[#103C8C]"
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>

                {/* New Query Form */}
                {queryTab === "New" && (
                  <div className="rounded-xl p-6">
                    <p className="text-[15px] font-semibold mb-2">Submit your question here.</p>
                    <div className="relative">
                      <textarea
                        placeholder="Write Your Questions..."
                        value={newQueryText}
                        onChange={(e) => setNewQueryText(e.target.value)}
                        maxLength={1500}
                        className="w-full rounded-md bg-transparent border border-[#7FB6EA] text-white text-sm p-3 focus:outline-none focus:ring-1 focus:ring-[#00B3FF] resize-none h-28 mb-2"
                      />
                      <span className="text-xs text-white/60 absolute bottom-4 right-4">
                        {newQueryText.length}/1500
                      </span>
                    </div>
                    {querySuccess && (
                      <p className="text-green-300 text-sm mb-2 flex items-center gap-1">
                        <i className="fa-solid fa-circle-check"></i> Query submitted successfully!
                      </p>
                    )}
                    <div className="flex justify-end mt-2">
                      <button
                        onClick={handleSubmitQuery}
                        disabled={querySubmitting || !newQueryText.trim()}
                        className="bg-[#103C8C] hover:bg-[#0B2E72] disabled:opacity-60 transition text-white text-sm font-medium px-8 py-[6px] rounded-md border border-[#2C57A6] shadow-sm"
                      >
                        {querySubmitting ? "Submitting..." : "Submit"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Answered / Pending queries list */}
                {(queryTab === "Answered" || queryTab === "Pending") && (
                  <>
                    {queriesLoading ? (
                      <div className="flex justify-center py-16">
                        <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    ) : queries.length === 0 ? (
                      <div className="text-center py-16 text-white/50">
                        <i className="fa-regular fa-circle-question text-5xl mb-4 block"></i>
                        <p>No {queryTab.toLowerCase()} queries.</p>
                      </div>
                    ) : (
                      <div className="space-y-8 mt-4">
                        {queries.map((q) => (
                          <div key={q._id} className="border-b border-white/20 pb-6">
                            {/* Pastor's question */}
                            <div className="flex items-start gap-3 mb-3">
                              <Image
                                src={UserPlaceholder}
                                alt="Me"
                                className="w-8 h-8 rounded-full object-cover"
                              />
                              <div>
                                <h4 className="font-semibold text-sm">Me</h4>
                                <p className="text-xs text-white/70 mb-1">
                                  {formatDate(q.createdDate)}
                                </p>
                                <p className="text-sm text-white/90">{q.actualQueryText}</p>
                              </div>
                            </div>

                            {/* Mentor reply (Answered) */}
                            {q.status === "answered" && q.repliedAnswer ? (
                              <div className="ml-11 bg-[#325C9C]/50 rounded-lg p-4 w-[90%]">
                                <div className="flex items-start gap-3">
                                  {q.repliedMentorId?.profilePicture ? (
                                    <img
                                      src={q.repliedMentorId.profilePicture}
                                      alt="Mentor"
                                      className="w-8 h-8 rounded-full object-cover"
                                    />
                                  ) : (
                                    <Image
                                      src={UserPlaceholder}
                                      alt="Mentor"
                                      className="w-8 h-8 rounded-full object-cover"
                                    />
                                  )}
                                  <div>
                                    <h4 className="font-semibold text-sm">
                                      {q.repliedMentorId
                                        ? `${q.repliedMentorId.firstName} ${q.repliedMentorId.lastName}`
                                        : "Mentor"}
                                    </h4>
                                    {q.repliedDate && (
                                      <p className="text-xs text-white/70 mb-1">
                                        {formatDate(q.repliedDate)}
                                      </p>
                                    )}
                                    {q.repliedMentorId?.role && (
                                      <p className="text-xs text-white/70 mb-2 capitalize">
                                        {q.repliedMentorId.role}
                                      </p>
                                    )}
                                    <p className="text-sm text-white/90">{q.repliedAnswer}</p>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              /* Pending — waiting for response */
                              <div className="ml-11 bg-[#325C9C]/50 rounded-lg p-4 w-[90%] flex items-center gap-2">
                                <i className="fa-solid fa-spinner animate-spin text-white/70 text-sm"></i>
                                <p className="text-sm text-white/80">Waiting for response</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      <PastorFooter />
    </div>
  );
}

export default function JumpStartPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#0F4A85]">
          <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <JumpStartContent />
    </Suspense>
  );
}
