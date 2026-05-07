// "use client";

// import { useEffect, useState } from "react";
// import "@fortawesome/fontawesome-free/css/all.min.css";
// import MentorHeader from "@/app/Components/MentorHeader";
// import { getCookie } from "@/app/utils/cookies";
// import { apiGetDocuments } from "@/app/Services/api";
// import {
//   mentorBodyText,
//   mentorGlassCardFrost,
//   mentorMainGradient,
//   mentorPageRoot,
//   mentorSpinner,
// } from "@/app/Components/mentor/mentor-theme";

// export default function MentorDocumentsPage() {
//   const [loading, setLoading] = useState(true);
//   const [documents, setDocuments] = useState<any[]>([]);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     const fetchDocuments = async () => {
//       try {
//         setLoading(true);
//         setError(null);

//         const stored = getCookie("mentor");
//         const user = stored ? JSON.parse(stored) : null;
//         const userId = user?.id || user?._id;
//         if (!userId) {
//           setError("Mentor session not found. Please login again.");
//           return;
//         }

//         const res = await apiGetDocuments(userId);
//         setDocuments(Array.isArray(res.data?.data) ? res.data.data : []);
//       } catch (err) {
//         console.error("Failed to fetch documents:", err);
//         setError("Unable to load documents from API.");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchDocuments();
//   }, []);

//   return (
//     <div className={mentorPageRoot}>
//       <MentorHeader showFullHeader={true} />

//       <main className={`${mentorMainGradient} flex-1 px-4 py-10 md:px-8 lg:px-16`}>
//         <div className={`mx-auto max-w-6xl p-6 md:p-8 ${mentorGlassCardFrost}`}>
//           <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-[#d9ebf8]">
//             <span className="h-2 w-2 rounded-full bg-[#8ec5eb]" />
//             Leadership Support Network
//           </p>

//           <h1 className="mt-3 text-2xl font-semibold md:text-3xl">Documents</h1>
//           <p className={`mt-2 ${mentorBodyText}`}>
//             Manage and review your uploaded ministry documents.
//           </p>

//           <div className="mt-6 rounded-xl border border-white/15 bg-white/5 p-4">
//             {loading && (
//               <div className="flex flex-col items-center gap-3 py-6">
//                 <div className={mentorSpinner} />
//                 <p className={`text-sm ${mentorBodyText}`}>Loading documents…</p>
//               </div>
//             )}
//             {!loading && error && (
//               <p className="text-sm text-[#ffb2b2]">{error}</p>
//             )}
//             {!loading && !error && documents.length === 0 && (
//               <p className={`text-sm ${mentorBodyText}`}>No documents uploaded yet.</p>
//             )}

//             {!loading && !error && documents.length > 0 && (
//               <div className="space-y-2">
//                 {documents.map((doc: any, index: number) => (
//                   <a
//                     key={doc.fileUrl || index}
//                     href={doc.fileUrl}
//                     target="_blank"
//                     rel="noopener noreferrer"
//                     className="flex items-center justify-between rounded-lg border border-white/15 bg-white/5 px-4 py-3 transition hover:bg-white/10"
//                   >
//                     <div>
//                       <p className="text-sm font-semibold text-white">
//                         {doc.fileName || "Document"}
//                       </p>
//                       <p className="text-xs text-[#cde2f2]">
//                         {doc.uploadedAt
//                           ? new Date(doc.uploadedAt).toLocaleDateString()
//                           : "Uploaded"}
//                       </p>
//                     </div>
//                     <i className="fa-solid fa-arrow-up-right-from-square text-[#8ec5eb]" />
//                   </a>
//                 ))}
//               </div>
//             )}
//           </div>
//         </div>
//       </main>
//     </div>
//   );
// }


"use client";

import { useEffect, useMemo, useState } from "react";
import "@fortawesome/fontawesome-free/css/all.min.css";
import MentorHeader from "@/app/Components/MentorHeader";
import { getCookie } from "@/app/utils/cookies";
import { apiDeleteDocument, apiGetDocuments } from "@/app/Services/api";
import {
  mentorBodyText,
  mentorGlassCardFrost,
  mentorMainGradient,
  mentorPageRoot,
  mentorSpinner,
} from "@/app/Components/mentor/mentor-theme";

export default function MentorDocumentsPage() {
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState("");
  const [searchText, setSearchText] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [selectMode, setSelectMode] = useState(false);
  const [selectedUrls, setSelectedUrls] = useState<string[]>([]);
  const [openMenuKey, setOpenMenuKey] = useState<string | null>(null);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setLoading(true);
        setError(null);

        const stored = getCookie("mentor");
        const user = stored ? JSON.parse(stored) : null;
        const uid = user?.id || user?._id;

        if (!uid) {
          setError("Mentor session not found. Please login again.");
          return;
        }

        setUserId(uid);

        const res = await apiGetDocuments(uid);
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
    const q = searchText.trim().toLowerCase();

    return [...documents]
      .filter((doc) =>
        q ? String(doc.fileName || "").toLowerCase().includes(q) : true,
      )
      .sort((a, b) => {
        const aTime = a.uploadedAt ? new Date(a.uploadedAt).getTime() : 0;
        const bTime = b.uploadedAt ? new Date(b.uploadedAt).getTime() : 0;

        return sortOrder === "newest" ? bTime - aTime : aTime - bTime;
      });
  }, [documents, searchText, sortOrder]);

  const selectedDocs = documents.filter((doc) =>
    selectedUrls.includes(doc.fileUrl),
  );

  const toggleSelected = (fileUrl: string) => {
    setSelectedUrls((prev) =>
      prev.includes(fileUrl)
        ? prev.filter((url) => url !== fileUrl)
        : [...prev, fileUrl],
    );
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
      if (!userId || !doc?.fileUrl) return;

      await apiDeleteDocument(userId, doc.fileUrl);

      setDocuments((prev) =>
        prev.filter((item) => item.fileUrl !== doc.fileUrl),
      );

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

  return (
    <div className={mentorPageRoot}>
      <MentorHeader showFullHeader={true} />

      <main className={`${mentorMainGradient} flex-1 px-4 py-10 md:px-8 lg:px-16`}>
        <div className={`mx-auto max-w-6xl p-6 md:p-8 ${mentorGlassCardFrost}`}>
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="text-3xl font-semibold md:text-4xl">Documents</h1>
              <p className={`mt-2 ${mentorBodyText}`}>
                Manage and review your uploaded ministry documents.
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex w-full max-w-xl items-center rounded-xl border border-white/15 bg-white/5 px-4 py-3">
              <i className="fa-solid fa-magnifying-glass mr-3 text-[#8ec5eb]" />
              <input
                type="search"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search documents..."
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
                <div className={mentorSpinner} />
                <p className={`text-sm ${mentorBodyText}`}>Loading documents…</p>
              </div>
            )}

            {!loading && error && (
              <p className="p-5 text-sm text-[#ffb2b2]">{error}</p>
            )}

            {!loading && !error && filteredDocuments.length === 0 && (
              <p className={`p-5 text-sm ${mentorBodyText}`}>No documents uploaded yet.</p>
            )}

            {!loading && !error && filteredDocuments.length > 0 && (
              <div>
                <div className="grid grid-cols-[1.5fr_0.6fr_0.8fr_0.4fr] border-b border-white/15 px-5 py-4 text-xs font-bold uppercase tracking-wide text-[#cde2f2]">
                  <p>Document Name</p>
                  <p>Type</p>
                  <p>Date Uploaded</p>
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
                      className="grid grid-cols-[1.5fr_0.6fr_0.8fr_0.4fr] items-center border-b border-white/10 px-5 py-5 last:border-b-0"
                    >
                      <div className="flex items-center gap-4">
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
                          className="max-w-[360px] whitespace-normal break-words text-left text-sm font-semibold text-white hover:text-[#8ec5eb]"
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