

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import PastorHeader from "@/app/Components/PastorHeader";
import { getCookie } from "@/app/utils/cookies";
import { apiDeleteDocument, apiGetDocuments } from "@/app/Services/api";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { uploadDocument } from "@/app/Services/pastor.service";

export default function PastorDocumentsPage() {
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [uploading, setUploading] = useState(false);
const fileInputRef = useRef<HTMLInputElement>(null);
const [userId, setUserId] = useState<string>("");
const [selectMode, setSelectMode] = useState(false);
const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
const [openMenuKey, setOpenMenuKey] = useState<string | null>(null);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setLoading(true);
        setError(null);

        const user = JSON.parse(getCookie("user") || "{}");
        const userId = user?.id || user?._id;

        if (!userId) {
          setError("User session not found.");
          return;
        }
        setUserId(userId);

        const res = await apiGetDocuments(userId);
        setDocuments(Array.isArray(res.data?.data) ? res.data.data : []);
      } catch (err) {
        console.error("Failed to fetch documents:", err);
        setError("Unable to load documents from API.");
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, []);

  const filteredDocuments = useMemo(() => {
    const q = search.trim().toLowerCase();

    return [...documents]
      .filter((doc) => String(doc.fileName || "Document").toLowerCase().includes(q))
      .sort((a, b) => {
        const aTime = new Date(a.uploadedAt || 0).getTime();
        const bTime = new Date(b.uploadedAt || 0).getTime();

        return sortOrder === "newest" ? bTime - aTime : aTime - bTime;
      });
  }, [documents, search, sortOrder]);

  const getFileType = (fileName?: string) => {
    const ext = String(fileName || "").split(".").pop()?.toUpperCase();
    return ext && ext !== fileName ? ext : "FILE";
  };

  const getFileIcon = (fileName?: string) => {
    const type = getFileType(fileName).toLowerCase();

    if (type === "pdf") return "fa-regular fa-file-pdf";
    if (["jpg", "jpeg", "png", "webp"].includes(type)) return "fa-regular fa-image";
    if (["doc", "docx"].includes(type)) return "fa-regular fa-file-word";
    if (["xls", "xlsx"].includes(type)) return "fa-regular fa-file-excel";

    return "fa-regular fa-file-lines";
  };
const handleUploadDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  e.target.value = "";

  if (!file || !userId) return;

  try {
    setUploading(true);

    const res = await uploadDocument(userId, file);
    const uploaded = res.data?.data;

    if (uploaded) {
      setDocuments((prev) => [uploaded, ...prev]);
    }
  } catch (err) {
    console.error("Document upload failed:", err);
    setError("Document upload failed.");
  } finally {
    setUploading(false);
  }
};

const getDocKey = (doc: any, index: number) => String(doc._id || doc.id || doc.fileUrl || index);

const openDocument = (fileUrl?: string) => {
  if (!fileUrl) return;
  window.open(fileUrl, "_blank", "noopener,noreferrer");
};

const toggleSelectedDoc = (key: string) => {
  setSelectedDocs((prev) =>
    prev.includes(key) ? prev.filter((id) => id !== key) : [...prev, key],
  );
};

const handleDeleteDocument = async (doc: any) => {
  try {
    // if (!userId || !doc?.fileUrl) return;

    // await apiDeleteDocument(userId, doc.fileUrl);
    const docId = doc?._id || doc?.id || doc?.docId || doc?.documentId || doc?.fileId;

if (!userId || !docId) return;

await apiDeleteDocument(userId, docId);

    setDocuments((prev) =>
      prev.filter((item) => item.fileUrl !== doc.fileUrl),
    );

    setOpenMenuKey(null);
  } catch (error) {
    console.error("Failed to delete document:", error);
    alert("Failed to delete document.");
  }
};

const handleShareDocument = async (doc: any) => {
  const shareUrl = doc.fileUrl || "";

  if (navigator.share && shareUrl) {
    await navigator.share({
      title: doc.fileName || "Document",
      url: shareUrl,
    });
  } else if (shareUrl) {
    await navigator.clipboard.writeText(shareUrl);
    alert("Document link copied.");
  }

  setOpenMenuKey(null);
};

const handleBulkDelete = () => {
  setDocuments((prev) =>
    prev.filter((doc, index) => !selectedDocs.includes(getDocKey(doc, index))),
  );
  setSelectedDocs([]);
};

const handleBulkShare = async () => {
  const links = filteredDocuments
    .filter((doc, index) => selectedDocs.includes(getDocKey(doc, index)))
    .map((doc) => doc.fileUrl)
    .filter(Boolean)
    .join("\n");

  if (!links) return;

  await navigator.clipboard.writeText(links);
  alert("Selected document links copied.");
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
  return (
    <div className="min-h-screen flex flex-col bg-[radial-gradient(circle_at_20%_12%,rgba(141,211,243,0.18),transparent_38%),linear-gradient(180deg,#041f35_0%,#062946_100%)] text-white">
      <PastorHeader showFullHeader={true} />

      <main className="flex-1 px-4 py-10 md:px-8 lg:px-16">
        <div className="mx-auto max-w-7xl rounded-3xl border border-white/15 bg-[linear-gradient(180deg,rgba(12,58,95,0.82)_0%,rgba(6,36,62,0.94)_100%)] p-6 shadow-[0_20px_50px_rgba(2,20,38,0.35)] md:p-8">
          <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="text-3xl font-semibold md:text-4xl">Documents</h1>
              <p className="mt-3 text-sm text-[#cde2f2] md:text-base">
                Manage and review your uploaded ministry documents.
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

          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex w-full max-w-xl items-center rounded-xl border border-white/15 bg-white/5 px-4 py-3">
              <i className="fa-solid fa-magnifying-glass mr-3 text-[#8ec5eb]" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search documents..."
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-[#cde2f2]/70"
              />
            </div>

            {/* <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as "newest" | "oldest")}
              className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white outline-none"
            >
              <option className="bg-[#062946]" value="newest">
                Sort: Newest
              </option>
              <option className="bg-[#062946]" value="oldest">
                Sort: Oldest
              </option>
            </select> */}
            <div className="flex items-center gap-3">
  {selectMode && selectedDocs.length > 0 ? (
    <>
      <button
        type="button"
        onClick={handleBulkShare}
        className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
      >
        Share
      </button>

      <button
        type="button"
        onClick={handleBulkDelete}
        className="rounded-xl border border-red-300/30 bg-red-500/15 px-4 py-3 text-sm font-semibold text-red-100 transition hover:bg-red-500/25"
      >
        Delete
      </button>
    </>
  ) : null}

  <button
    type="button"
    onClick={() => {
      setSelectMode((prev) => !prev);
      setSelectedDocs([]);
    }}
    className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
  >
    {selectMode ? "Cancel" : "Select"}
  </button>

  <select
    value={sortOrder}
    onChange={(e) => setSortOrder(e.target.value as "newest" | "oldest")}
    className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white outline-none"
  >
    <option className="bg-[#062946]" value="newest">
      Sort: Newest
    </option>
    <option className="bg-[#062946]" value="oldest">
      Sort: Oldest
    </option>
  </select>
</div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/15 bg-white/[0.03]">
            <div className="grid grid-cols-[1.8fr_0.7fr_0.9fr_0.5fr] border-b border-white/10 px-6 py-4 text-xs font-semibold uppercase tracking-wide text-[#cde2f2]">
              <span>Document Name</span>
              <span>Type</span>
              <span>Date Uploaded</span>
              <span className="text-right">Actions</span>
            </div>

            {loading && <p className="px-6 py-8 text-sm text-[#cde2f2]">Loading documents...</p>}

            {!loading && error && <p className="px-6 py-8 text-sm text-[#ffb2b2]">{error}</p>}

            {!loading && !error && filteredDocuments.length === 0 && (
              <p className="px-6 py-8 text-sm text-[#cde2f2]">No documents uploaded yet.</p>
            )}

            {/* {!loading &&
              !error &&
              filteredDocuments.map((doc: any, index) => (
                <div
                  key={doc.fileUrl || index}
                  className="grid grid-cols-[1.8fr_0.7fr_0.9fr_0.5fr] items-center border-b border-white/10 px-6 py-5 last:border-b-0"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/5">
                      <i className={`${getFileIcon(doc.fileName)} text-lg text-[#8ec5eb]`} />
                    </div>

                    <p className="truncate text-sm font-semibold text-white">
                      {doc.fileName || "Document"}
                    </p>
                  </div>

                  <p className="text-sm text-[#d9ebf8]">{getFileType(doc.fileName)}</p>

                  <p className="text-sm text-[#d9ebf8]">
                    {doc.uploadedAt
                      ? new Date(doc.uploadedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "2-digit",
                          year: "numeric",
                        })
                      : "Uploaded"}
                  </p>

                  <div className="flex justify-end gap-4 text-[#8ec5eb]">
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="transition hover:text-white"
                      aria-label="View document"
                    >
                      <i className="fa-regular fa-eye" />
                    </a>

                    <a
                      href={doc.fileUrl}
                      download
                      className="transition hover:text-white"
                      aria-label="Download document"
                    >
                      <i className="fa-solid fa-download" />
                    </a>
                  </div>
                </div>
              ))} */}
              {!loading &&
  !error &&
  filteredDocuments.map((doc: any, index) => {
    const docKey = getDocKey(doc, index);
    const isSelected = selectedDocs.includes(docKey);

    return (
      <div
        key={docKey}
        className="grid grid-cols-[1.8fr_0.7fr_0.9fr_0.5fr] items-center border-b border-white/10 px-6 py-5 last:border-b-0"
      >
        <div className="flex min-w-0 items-center gap-4">
          {selectMode && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => toggleSelectedDoc(docKey)}
              className="h-4 w-4 accent-[#8ec5eb]"
            />
          )}

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/5">
            <i className={`${getFileIcon(doc.fileName)} text-lg text-[#8ec5eb]`} />
          </div>

          <button
            type="button"
            onClick={() => openDocument(doc.fileUrl)}
            className="truncate text-left text-sm font-semibold text-white transition hover:text-[#8ec5eb] hover:underline"
          >
            {doc.fileName || "Document"}
          </button>
        </div>

        <p className="text-sm text-[#d9ebf8]">{getFileType(doc.fileName)}</p>

        <p className="text-sm text-[#d9ebf8]">
          {doc.uploadedAt
            ? new Date(doc.uploadedAt).toLocaleDateString("en-US", {
                month: "short",
                day: "2-digit",
                year: "numeric",
              })
            : "Uploaded"}
        </p>

        <div className="relative flex justify-end gap-4 text-[#8ec5eb]">
          <button
            type="button"
            onClick={() => setOpenMenuKey(openMenuKey === docKey ? null : docKey)}
            className="transition hover:text-white"
            aria-label="Document menu"
          >
            <i className="fa-solid fa-ellipsis-vertical" />
          </button>

          {openMenuKey === docKey && (
            <div
  className={`absolute right-8 z-20 w-32 overflow-hidden rounded-xl border border-white/15 bg-[#082f49] shadow-xl ${
    index >= filteredDocuments.length - 2 ? "bottom-6" : "top-6"
  }`}
>
              <button
                type="button"
                onClick={() => handleShareDocument(doc)}
                className="block w-full px-4 py-2 text-left text-sm text-white hover:bg-white/10"
              >
                Share
              </button>
              <button
                type="button"
                onClick={() => handleDeleteDocument(doc)}
                className="block w-full px-4 py-2 text-left text-sm text-red-200 hover:bg-red-500/20"
              >
                Delete
              </button>
            </div>
          )}
<button
  type="button"
  onClick={() => handleDownloadDocument(doc)}
  className="transition hover:text-white"
  aria-label="Download document"
>
  <i className="fa-solid fa-download" />
</button>
        </div>
      </div>
    );
  })}
          </div>
        </div>
      </main>
    </div>
  );
}
