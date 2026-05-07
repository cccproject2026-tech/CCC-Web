// "use client";

// import { useEffect, useState } from "react";
// import PastorHeader from "@/app/Components/PastorHeader";
// import { getCookie } from "@/app/utils/cookies";
// import { apiGetDocuments } from "@/app/Services/api";

// export default function PastorDocumentsPage() {
//   const [loading, setLoading] = useState(true);
//   const [documents, setDocuments] = useState<any[]>([]);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     const fetchDocuments = async () => {
//       try {
//         setLoading(true);
//         setError(null);
//         const user = JSON.parse(getCookie("user") || "{}");
//         const userId = user?.id || user?._id;
//         if (!userId) {
//           setError("User session not found.");
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
//     <div className="min-h-screen flex flex-col bg-[radial-gradient(circle_at_20%_12%,rgba(141,211,243,0.18),transparent_38%),linear-gradient(180deg,#041f35_0%,#062946_100%)] text-white">
//       <PastorHeader showFullHeader={true} />

//       <main className="flex-1 px-4 py-10 md:px-8 lg:px-16">
//         <div className="mx-auto max-w-6xl rounded-2xl border border-white/15 bg-[linear-gradient(180deg,rgba(12,58,95,0.9)_0%,rgba(10,53,88,0.95)_100%)] p-6 shadow-[0_20px_50px_rgba(2,20,38,0.35)] md:p-8">
//           {/* <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-[#d9ebf8]">
//             <span className="h-2 w-2 rounded-full bg-[#8ec5eb]" />
//             Leadership Support Network
//           </p> */}
//           <h1 className="mt-3 text-2xl font-semibold md:text-3xl">Documents</h1>
//           <p className="mt-2 text-sm text-[#cde2f2]">
//             Manage and review your uploaded ministry documents.
//           </p>

//           <div className="mt-6 rounded-xl border border-white/15 bg-white/5 p-4">
//             {loading && <p className="text-sm text-[#cde2f2]">Loading documents...</p>}
//             {!loading && error && <p className="text-sm text-[#ffb2b2]">{error}</p>}
//             {!loading && !error && documents.length === 0 && (
//               <p className="text-sm text-[#cde2f2]">No documents uploaded yet.</p>
//             )}
//             {!loading && !error && documents.length > 0 && (
//               <div className="space-y-2">
//                 {documents.map((doc: any, index) => (
//                   <a
//                     key={doc.fileUrl || index}
//                     href={doc.fileUrl}
//                     target="_blank"
//                     rel="noopener noreferrer"
//                     className="flex items-center justify-between rounded-lg border border-white/15 bg-white/5 px-4 py-3 transition hover:bg-white/10"
//                   >
//                     <div>
//                       <p className="text-sm font-semibold text-white">{doc.fileName || "Document"}</p>
//                       <p className="text-xs text-[#cde2f2]">
//                         {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : "Uploaded"}
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

import { useEffect, useMemo, useRef, useState } from "react";
import PastorHeader from "@/app/Components/PastorHeader";
import { getCookie } from "@/app/utils/cookies";
import { apiGetDocuments } from "@/app/Services/api";
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

            {!loading &&
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
              ))}
          </div>
        </div>
      </main>
    </div>
  );
}
