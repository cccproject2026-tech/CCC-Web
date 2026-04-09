"use client";

import { useEffect, useState } from "react";
import "@fortawesome/fontawesome-free/css/all.min.css";
import MentorHeader from "@/app/Components/MentorHeader";
import { getCookie } from "@/app/utils/cookies";
import { apiGetDocuments } from "@/app/Services/api";
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

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setLoading(true);
        setError(null);

        const stored = getCookie("mentor");
        const user = stored ? JSON.parse(stored) : null;
        const userId = user?.id || user?._id;
        if (!userId) {
          setError("Mentor session not found. Please login again.");
          return;
        }

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

  return (
    <div className={mentorPageRoot}>
      <MentorHeader showFullHeader={true} />

      <main className={`${mentorMainGradient} flex-1 px-4 py-10 md:px-8 lg:px-16`}>
        <div className={`mx-auto max-w-6xl p-6 md:p-8 ${mentorGlassCardFrost}`}>
          <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-[#d9ebf8]">
            <span className="h-2 w-2 rounded-full bg-[#8ec5eb]" />
            Leadership Support Network
          </p>

          <h1 className="mt-3 text-2xl font-semibold md:text-3xl">Documents</h1>
          <p className={`mt-2 ${mentorBodyText}`}>
            Manage and review your uploaded ministry documents.
          </p>

          <div className="mt-6 rounded-xl border border-white/15 bg-white/5 p-4">
            {loading && (
              <div className="flex flex-col items-center gap-3 py-6">
                <div className={mentorSpinner} />
                <p className={`text-sm ${mentorBodyText}`}>Loading documents…</p>
              </div>
            )}
            {!loading && error && (
              <p className="text-sm text-[#ffb2b2]">{error}</p>
            )}
            {!loading && !error && documents.length === 0 && (
              <p className={`text-sm ${mentorBodyText}`}>No documents uploaded yet.</p>
            )}

            {!loading && !error && documents.length > 0 && (
              <div className="space-y-2">
                {documents.map((doc: any, index: number) => (
                  <a
                    key={doc.fileUrl || index}
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-lg border border-white/15 bg-white/5 px-4 py-3 transition hover:bg-white/10"
                  >
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {doc.fileName || "Document"}
                      </p>
                      <p className="text-xs text-[#cde2f2]">
                        {doc.uploadedAt
                          ? new Date(doc.uploadedAt).toLocaleDateString()
                          : "Uploaded"}
                      </p>
                    </div>
                    <i className="fa-solid fa-arrow-up-right-from-square text-[#8ec5eb]" />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
