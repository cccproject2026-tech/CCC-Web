"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { uploadDocument } from "@/app/Services/pastor.service";
import "@fortawesome/fontawesome-free/css/all.min.css";
import AppHeader from "@/app/Components/Header/AppHeader";
import { apiDeleteDocument, apiGetAllUsers, apiGetDocuments } from "@/app/Services/api";
import {
  directorGlassCard,
  directorPageContainer,
  directorPageRoot,
  directorSpinner,
} from "../directorUi";

type DocumentTab = "my" | "mentees" | "mentors";
function unwrapUsers(res: any): any[] {
  const data = res?.data?.data;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.users)) return data.users;
  if (Array.isArray(data?.data?.users)) return data.data.users;
  if (Array.isArray(data?.rows)) return data.rows;

  return [];
}
export default function DirectorDocumentsPage() {
  const [activeTab, setActiveTab] = useState<DocumentTab>("my");
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<any[]>([]);
  const [menteeDocuments, setMenteeDocuments] = useState<any[]>([]);
  const [mentorDocuments, setMentorDocuments] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [selectMode, setSelectMode] = useState(false);
  const [selectedUrls, setSelectedUrls] = useState<string[]>([]);
  const [openMenuKey, setOpenMenuKey] = useState<string | null>(null);

  const [uploading, setUploading] = useState(false);
const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setLoading(true);
        setError(null);

        const userId =
          document.cookie
            .split("; ")
            .find((row) => row.startsWith("userId="))
            ?.split("=")[1] || "";

        if (userId) {
          const ownRes = await apiGetDocuments(userId);
          setDocuments(Array.isArray(ownRes.data?.data) ? ownRes.data.data : []);
        }

        // const [pastorsRes, mentorsRes] = await Promise.all([
        //   apiGetAllUsers({ role: "pastor", roleMatch: "mixed", limit: 9999 }),
        //   apiGetAllUsers({ role: "mentor", roleMatch: "mixed", limit: 9999 }),
        // ]);
        const [pastorsRes, mentorsRes, fieldMentorsRes] = await Promise.all([
  apiGetAllUsers({ role: "pastor", roleMatch: "mixed", page: 1, limit: 9999 }),
  apiGetAllUsers({ role: "mentor", roleMatch: "mixed", page: 1, limit: 9999 }),
  apiGetAllUsers({ role: "field-mentor", roleMatch: "mixed", page: 1, limit: 9999 }),
]);

        // const pastors = Array.isArray(pastorsRes.data?.data?.users)
        //   ? pastorsRes.data.data.users
        //   : [];

        // const mentors = Array.isArray(mentorsRes.data?.data?.users)
        //   ? mentorsRes.data.data.users
        //   : [];
     const pastors = unwrapUsers(pastorsRes);
const mentors = [...unwrapUsers(mentorsRes), ...unwrapUsers(fieldMentorsRes)];

        const pastorDocs = await Promise.all(
          pastors.map(async (pastor: any) => {
            const id = String(pastor?._id ?? pastor?.id ?? "");
            if (!id) return [];

            try {
              const res = await apiGetDocuments(id);
              const list = Array.isArray(res.data?.data) ? res.data.data : [];
              const uploadedBy =
                `${pastor?.firstName ?? ""} ${pastor?.lastName ?? ""}`.trim() ||
                pastor?.email ||
                "Mentee";

              return list.map((doc: any) => ({
                ...doc,
                uploadedBy,
                ownerId: id,
              }));
            } catch {
              return [];
            }
          }),
        );

        const mentorDocs = await Promise.all(
          mentors.map(async (mentor: any) => {
            const id = String(mentor?._id ?? mentor?.id ?? "");
            if (!id) return [];

            try {
              const res = await apiGetDocuments(id);
              const list = Array.isArray(res.data?.data) ? res.data.data : [];
              const uploadedBy =
                `${mentor?.firstName ?? ""} ${mentor?.lastName ?? ""}`.trim() ||
                mentor?.email ||
                "Mentor";

              return list.map((doc: any) => ({
                ...doc,
                uploadedBy,
                ownerId: id,
              }));
            } catch {
              return [];
            }
          }),
        );

        setMenteeDocuments(pastorDocs.flat());
        setMentorDocuments(mentorDocs.flat());
      } catch (err) {
        console.error("Failed to fetch director documents:", err);
        setError("Unable to load documents.");
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, []);

  const currentDocuments = useMemo(() => {
    if (activeTab === "mentees") return menteeDocuments;
    if (activeTab === "mentors") return mentorDocuments;
    return documents;
  }, [activeTab, documents, menteeDocuments, mentorDocuments]);

  const filteredDocuments = useMemo(() => {
    const q = searchText.trim().toLowerCase();

    return [...currentDocuments]
      .filter((doc) => {
        if (!q) return true;

        const fileName = String(doc.fileName || "").toLowerCase();
        const uploadedBy = String(doc.uploadedBy || "").toLowerCase();

        return fileName.includes(q) || uploadedBy.includes(q);
      })
      .sort((a, b) => {
        const aTime = a.uploadedAt ? new Date(a.uploadedAt).getTime() : 0;
        const bTime = b.uploadedAt ? new Date(b.uploadedAt).getTime() : 0;

        return sortOrder === "newest" ? bTime - aTime : aTime - bTime;
      });
  }, [currentDocuments, searchText, sortOrder]);

  const selectedDocs = currentDocuments.filter((doc) =>
    selectedUrls.includes(doc.fileUrl),
  );

  const toggleSelected = (fileUrl: string) => {
    setSelectedUrls((prev) =>
      prev.includes(fileUrl)
        ? prev.filter((url) => url !== fileUrl)
        : [...prev, fileUrl],
    );
  };
const handleUploadDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  e.target.value = "";

  const userId =
    document.cookie
      .split("; ")
      .find((row) => row.startsWith("userId="))
      ?.split("=")[1] || "";

  if (!file || !userId) return;

  try {
    setUploading(true);

    const res = await uploadDocument(userId, file);
    const uploaded = res.data?.data;

    if (uploaded) {
      setDocuments((prev) => [uploaded, ...prev]);
      setActiveTab("my");
    }
  } catch (err) {
    console.error("Document upload failed:", err);
    setError("Document upload failed.");
  } finally {
    setUploading(false);
  }
};
  const handleViewDocument = (doc: any) => {
    if (!doc?.fileUrl) return;
    window.open(doc.fileUrl, "_blank", "noopener,noreferrer");
  };

  const handleDownloadDocument = async (doc: any) => {
    if (!doc?.fileUrl) return;

    const response = await fetch(doc.fileUrl);
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = doc.fileName || "document";
    document.body.appendChild(link);
    link.click();

    link.remove();
    window.URL.revokeObjectURL(blobUrl);
  };

  const handleDeleteDocument = async (doc: any) => {
    try {
      if (!doc?.ownerId || !doc?.fileUrl) return;

      await apiDeleteDocument(doc.ownerId, doc.fileUrl);

      if (activeTab === "mentees") {
        setMenteeDocuments((prev) => prev.filter((item) => item.fileUrl !== doc.fileUrl));
      } else if (activeTab === "mentors") {
        setMentorDocuments((prev) => prev.filter((item) => item.fileUrl !== doc.fileUrl));
      } else {
        setDocuments((prev) => prev.filter((item) => item.fileUrl !== doc.fileUrl));
      }

      setSelectedUrls((prev) => prev.filter((url) => url !== doc.fileUrl));
      setOpenMenuKey(null);
    } catch (error) {
      console.error("Failed to delete document:", error);
      alert("Failed to delete document.");
    }
  };

  const handleShareDocument = async (doc: any) => {
    if (!doc?.fileUrl) return;

    const shareText = `${doc.fileName || "Document"}\n${doc.fileUrl}`;

    if (navigator.share) {
      await navigator.share({
        title: doc.fileName || "Document",
        text: shareText,
        url: doc.fileUrl,
      });
      return;
    }

    await navigator.clipboard.writeText(shareText);
    alert("Document link copied.");
  };

  const handleBulkDelete = async () => {
    for (const doc of selectedDocs) {
      await handleDeleteDocument(doc);
    }

    setSelectMode(false);
    setSelectedUrls([]);
  };

  const handleBulkShare = async () => {
    const text = selectedDocs
      .map((doc) => `${doc.fileName || "Document"} - ${doc.fileUrl}`)
      .join("\n");

    await navigator.clipboard.writeText(text);
    alert("Selected document links copied.");
  };

  const showUploadedBy = activeTab !== "my";

  return (
    <div className={directorPageRoot}>
      {/* <AppHeader showFullHeader={true} /> */}

      <main className="flex-1 px-4 py-10 md:px-8 lg:px-16">
        <div className={`mx-auto max-w-6xl p-6 md:p-8 ${directorGlassCard}`}>
          {/* <div>
            <h1 className="text-3xl font-semibold text-white md:text-4xl">Documents</h1>
            <p className="mt-2 text-sm text-[#cde2f2]">
              Manage and review uploaded ministry documents.
            </p>
          </div> */}
          <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
  <div>
    <h1 className="text-3xl font-semibold text-white md:text-4xl">Documents</h1>
    <p className="mt-2 text-sm text-[#cde2f2]">
      Manage and review uploaded ministry documents.
    </p>
  </div>

  <input
    ref={fileInputRef}
    type="file"
    accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx"
    className="hidden"
    onChange={handleUploadDocument}
  />

  <button
    type="button"
    onClick={() => fileInputRef.current?.click()}
    disabled={uploading}
    className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-[#062946] transition hover:bg-[#d9ebf8] disabled:cursor-not-allowed disabled:opacity-60"
  >
    <i className="fa-solid fa-upload" />
    {uploading ? "Uploading..." : "Upload Document"}
  </button>
</div>

          <div className="mt-8 grid grid-cols-3 overflow-hidden rounded-xl border border-white/15 bg-white/5">
            {[
              { id: "my", label: "My Documents" },
              { id: "mentees", label: "Mentee Documents" },
              { id: "mentors", label: "Mentor Documents" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id as DocumentTab);
                  setSelectedUrls([]);
                  setSelectMode(false);
                }}
                className={`px-4 py-3 text-sm font-semibold transition ${
                  activeTab === tab.id
                    ? "bg-[#0b63ce] text-white"
                    : "text-[#cde2f2] hover:bg-white/10"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex w-full max-w-xl items-center rounded-xl border border-white/15 bg-white/5 px-4 py-3">
              <i className="fa-solid fa-magnifying-glass mr-3 text-[#8ec5eb]" />
              <input
                type="search"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder={
                  showUploadedBy
                    ? "Search documents or uploaded by..."
                    : "Search documents..."
                }
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-[#cde2f2]"
              />
            </div>

            <div className="flex items-center gap-3">
              {selectMode && selectedUrls.length > 0 && (
                <>
                  <button
                    type="button"
                    onClick={handleBulkShare}
                    className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10"
                  >
                    Share
                  </button>

                  <button
                    type="button"
                    onClick={handleBulkDelete}
                    className="rounded-xl border border-red-300/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-100 hover:bg-red-500/20"
                  >
                    Delete
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={() => {
                  setSelectMode((prev) => !prev);
                  setSelectedUrls([]);
                }}
                className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10"
              >
                {selectMode ? "Cancel" : "Select"}
              </button>

              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as "newest" | "oldest")}
                className="rounded-xl border border-white/15 bg-[#103c60] px-4 py-3 text-sm font-semibold text-white outline-none"
              >
                <option value="newest">Sort: Newest</option>
                <option value="oldest">Sort: Oldest</option>
              </select>
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl border border-white/15">
            {loading && (
              <div className="flex flex-col items-center gap-3 py-10">
                <div className={directorSpinner} />
                <p className="text-sm text-[#cde2f2]">Loading documents…</p>
              </div>
            )}

            {!loading && error && (
              <p className="p-5 text-sm text-[#ffb2b2]">{error}</p>
            )}

            {!loading && !error && filteredDocuments.length === 0 && (
              <p className="p-5 text-sm text-[#cde2f2]">No documents uploaded yet.</p>
            )}

            {!loading && !error && filteredDocuments.length > 0 && (
              <div>
                <div
                  className={`grid ${
                    showUploadedBy
                      // ? "grid-cols-[2fr_0.6fr_0.9fr_1fr_0.5fr]"
                      // : "grid-cols-[2fr_0.7fr_1fr_0.5fr]"
                      ? "grid-cols-[minmax(0,2fr)_0.6fr_0.9fr_1fr_0.5fr]"
: "grid-cols-[minmax(0,2fr)_0.7fr_1fr_0.5fr]"
                  } items-center gap-4 border-b border-white/15 px-5 py-4 text-xs font-bold uppercase tracking-wide text-[#cde2f2]`}
                >
                  <p>Document Name</p>
                  <p>Type</p>
                  <p>Date Uploaded</p>
                  {showUploadedBy && <p>Uploaded By</p>}
                  <p className="text-right">Actions</p>
                </div>

                {filteredDocuments.map((doc: any, index: number) => {
                  const key = doc.fileUrl || String(index);
                  const type =
                    String(doc.fileName || "")
                      .split(".")
                      .pop()
                      ?.toUpperCase() || "FILE";

                  return (
                    <div
                      key={key}
                      className={`grid ${
                        showUploadedBy
                          // ? "grid-cols-[2fr_0.6fr_0.9fr_1fr_0.5fr]"
                          // : "grid-cols-[2fr_0.7fr_1fr_0.5fr]"
                          ? "grid-cols-[minmax(0,2fr)_0.6fr_0.9fr_1fr_0.5fr]"
: "grid-cols-[minmax(0,2fr)_0.7fr_1fr_0.5fr]"
                      } items-center gap-4 border-b border-white/10 px-5 py-5 last:border-b-0`}
                    >
                      <div className="flex min-w-0 items-center gap-4">
                        {selectMode && (
                          <input
                            type="checkbox"
                            checked={selectedUrls.includes(doc.fileUrl)}
                            onChange={() => toggleSelected(doc.fileUrl)}
                            className="h-4 w-4 accent-[#8ec5eb]"
                          />
                        )}

                        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-[#8ec5eb]">
                          <i className="fa-regular fa-image" />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleViewDocument(doc)}
                          className="min-w-0 max-w-full whitespace-normal break-words text-left text-sm font-semibold text-white hover:text-[#8ec5eb]"
                        >
                          {doc.fileName || "Document"}
                        </button>
                      </div>

                      <p className="text-sm text-[#cde2f2]">{type}</p>

                      <p className="text-sm text-[#cde2f2]">
                        {doc.uploadedAt
                          ? new Date(doc.uploadedAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "Uploaded"}
                      </p>

                      {showUploadedBy && (
                        <p className="text-sm font-semibold text-[#cde2f2]">
                          {doc.uploadedBy || "User"}
                        </p>
                      )}

                      <div className="relative flex items-center justify-end gap-4 text-[#8ec5eb]">
                        <button
                          type="button"
                          onClick={() => setOpenMenuKey(openMenuKey === key ? null : key)}
                          className="hover:text-white"
                          aria-label="Document options"
                        >
                          <i className="fa-solid fa-ellipsis-vertical" />
                        </button>

                        {openMenuKey === key && (
                          <div className="absolute right-8 top-6 z-20 w-36 rounded-xl border border-white/15 bg-[#082f4d] p-2 shadow-xl">
                            <button
                              type="button"
                              onClick={() => handleShareDocument(doc)}
                              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-white hover:bg-white/10"
                            >
                              <i className="fa-solid fa-share-nodes text-[#8ec5eb]" />
                              Share
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteDocument(doc)}
                              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-100 hover:bg-red-500/20"
                            >
                              <i className="fa-solid fa-trash text-red-200" />
                              Delete
                            </button>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDownloadDocument(doc)}
                          className="hover:text-white"
                          aria-label="Download document"
                        >
                          <i className="fa-solid fa-download" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}