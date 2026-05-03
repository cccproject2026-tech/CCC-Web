"use client";
import { useEffect, useRef, useState } from "react";
import { apiGetDocuments, apiUploadDocument } from "@/app/Services/users.service";
import { type UploadedDocument } from "@/app/Services/types/users.types";

interface PendingFile {
  file: File;
  status: "pending" | "uploading" | "done" | "failed";
}

interface DocumentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export default function DocumentsModal({ isOpen, onClose, userId }: DocumentsModalProps) {
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDocument[]>([]);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && userId) {
      fetchDocs();
    }
    if (!isOpen) {
      setPendingFiles([]);
    }
  }, [isOpen, userId]);

  const fetchDocs = async () => {
    try {
      const res = await apiGetDocuments(userId);
      setUploadedDocs(res.data.data ?? []);
    } catch (err) {
      console.error("Failed to fetch documents", err);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const newPending: PendingFile[] = files.map((f) => ({ file: f, status: "pending" }));
    setPendingFiles((prev) => [...prev, ...newPending]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUpload = async () => {
    if (pendingFiles.every((f) => f.status === "done")) return;
    setIsUploading(true);

    for (let i = 0; i < pendingFiles.length; i++) {
      if (pendingFiles[i].status !== "pending") continue;

      setPendingFiles((prev) =>
        prev.map((f, idx) => (idx === i ? { ...f, status: "uploading" } : f))
      );

      try {
        const formData = new FormData();
        formData.append("file", pendingFiles[i].file);
        await apiUploadDocument(userId, formData);

        setPendingFiles((prev) =>
          prev.map((f, idx) => (idx === i ? { ...f, status: "done" } : f))
        );
      } catch {
        setPendingFiles((prev) =>
          prev.map((f, idx) => (idx === i ? { ...f, status: "failed" } : f))
        );
      }
    }

    setIsUploading(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2500);
    fetchDocs();
  };

  const getDisplayName = (doc: UploadedDocument) => {
    if (doc.fileName) return doc.fileName;
    try {
      return decodeURIComponent(doc.fileUrl.split("/").pop() ?? doc.fileUrl);
    } catch {
      return doc.fileUrl;
    }
  };

  const statusBadge = (status: PendingFile["status"]) => {
    const map: Record<PendingFile["status"], { label: string; cls: string }> = {
      pending: { label: "Pending", cls: "bg-yellow-100 text-yellow-700" },
      uploading: { label: "Uploading…", cls: "bg-blue-100 text-blue-700" },
      done: { label: "Done", cls: "bg-green-100 text-green-700" },
      failed: { label: "Failed", cls: "bg-red-100 text-red-700" },
    };
    const { label, cls } = map[status];
    return (
      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cls}`}>{label}</span>
    );
  };

  if (!isOpen) return null;

  const hasPending = pendingFiles.some((f) => f.status === "pending");

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b">
            <h2 className="text-2xl font-bold text-gray-900">Documents</h2>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-lg transition"
            >
              <i className="fa-solid fa-xmark text-xl text-gray-600"></i>
            </button>
          </div>

          {/* Action bar */}
          <div className="flex justify-between items-center px-6 py-4 bg-gray-50 border-b">
            <span className="text-sm font-semibold text-gray-600">
              {uploadedDocs.length} uploaded · {pendingFiles.length} queued
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 border-2 border-[#2E3B8E] text-[#2E3B8E] rounded-lg font-semibold text-sm hover:bg-[#2E3B8E] hover:text-white transition"
              >
                <i className="fa-solid fa-plus"></i>
                Add Files
              </button>
              {/* {pendingFiles.length > 0 && (
                <button
                  onClick={handleUpload}
                  disabled={isUploading || !hasPending}
                  className="flex items-center gap-2 px-4 py-2 bg-[#2E3B8E] text-white rounded-lg font-semibold text-sm hover:bg-[#1F2A6E] transition disabled:opacity-60"
                >
                  <i className="fa-solid fa-upload"></i>
                  {isUploading ? "Uploading…" : "Upload"}
                </button>
              )} */}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto flex-1 space-y-3">
            {/* Pending files */}
            {pendingFiles.map((pf, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-xl"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 flex items-center justify-center bg-blue-50 rounded-lg">
                    <i className="fa-regular fa-file text-xl text-blue-500"></i>
                  </div>
                  <span className="text-sm font-medium text-gray-800 max-w-[300px] truncate">
                    {pf.file.name}
                  </span>
                </div>
                {statusBadge(pf.status)}
              </div>
            ))}

            {/* Uploaded docs */}
            {uploadedDocs.map((doc, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:shadow-sm transition"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 flex items-center justify-center bg-red-50 rounded-lg">
                    <i className="fa-regular fa-file-pdf text-xl text-red-500"></i>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800 max-w-[320px] truncate">
                      {getDisplayName(doc)}
                    </p>
                    {doc.uploadedAt && (
                      <p className="text-xs text-gray-400">
                        {new Date(doc.uploadedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
                <a
                  href={doc.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 rounded-lg transition"
                  title="View"
                >
                  <i className="fa-solid fa-arrow-up-right-from-square text-gray-400 text-sm"></i>
                </a>
              </div>
            ))}

            {uploadedDocs.length === 0 && pendingFiles.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <i className="fa-regular fa-folder-open text-6xl mb-4 block"></i>
                <p>No documents yet. Click &quot;Add Files&quot; to get started.</p>
              </div>
            )}
          </div>
          {/* Footer */}
<div className="flex justify-end gap-2 border-t bg-gray-50 px-6 py-4">
  {pendingFiles.length > 0 && (
    <button
      onClick={handleUpload}
      disabled={isUploading || !hasPending}
      className="flex items-center gap-2 rounded-lg bg-[#2E3B8E] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1F2A6E] disabled:opacity-60"
    >
      <i className="fa-solid fa-upload"></i>
      {isUploading ? "Uploading…" : "Upload"}
    </button>
  )}
</div>
        </div>
      </div>

      {showSuccess && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[70]">
          <div className="bg-white rounded-xl px-6 py-4 shadow-2xl border-2 border-green-500 flex items-center gap-3">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <i className="fa-solid fa-check text-white text-sm"></i>
            </div>
            <span className="text-[#2E3B8E] font-semibold">Documents Uploaded</span>
          </div>
        </div>
      )}
    </>
  );
}
