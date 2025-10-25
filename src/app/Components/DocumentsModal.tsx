"use client";
import { useState } from "react";

interface Document {
  id: string;
  name: string;
  date: string;
  time: string;
}

interface DocumentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  documents: Document[];
  onDelete: (id: string) => void;
  onUpload: () => void;
}

export default function DocumentsModal({
  isOpen,
  onClose,
  documents,
  onDelete,
  onUpload,
}: DocumentsModalProps) {
  const [activeTab, setActiveTab] = useState<"my-documents" | "mentees">(
    "my-documents"
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteDocId, setDeleteDocId] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  if (!isOpen) return null;

  const handleDeleteClick = (id: string) => {
    setDeleteDocId(id);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    if (deleteDocId) {
      onDelete(deleteDocId);
      setShowDeleteConfirm(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    }
  };

  return (
    <>
      {/* Main Modal */}
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl">
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

          {/* Tabs and Upload */}
          <div className="flex justify-between items-center px-6 py-4 bg-gray-50">
            <div className="flex gap-2 bg-white p-1 rounded-xl border border-gray-200">
              <button
                onClick={() => setActiveTab("my-documents")}
                className={`px-6 py-2 rounded-lg font-semibold text-sm transition ${
                  activeTab === "my-documents"
                    ? "bg-[#2E3B8E] text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                My Documents
              </button>
              <button
                onClick={() => setActiveTab("mentees")}
                className={`px-6 py-2 rounded-lg font-semibold text-sm transition ${
                  activeTab === "mentees"
                    ? "bg-[#2E3B8E] text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                Mentees
              </button>
            </div>

            <button
              onClick={onUpload}
              className="flex items-center gap-2 px-4 py-2 border-2 border-[#2E3B8E] text-[#2E3B8E] rounded-lg font-semibold hover:bg-[#2E3B8E] hover:text-white transition"
            >
              <i className="fa-solid fa-paperclip"></i>
              Upload
            </button>
          </div>

          {/* Documents List */}
          <div className="p-6 max-h-[500px] overflow-y-auto">
            {activeTab === "my-documents" ? (
              <div className="space-y-4">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:shadow-md transition"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 flex items-center justify-center bg-red-50 rounded-lg">
                        <i className="fa-regular fa-file-pdf text-2xl text-red-500"></i>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {doc.name}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {doc.date} {doc.time}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteClick(doc.id)}
                      className="w-10 h-10 flex items-center justify-center hover:bg-red-50 rounded-lg transition group"
                    >
                      <i className="fa-regular fa-trash-can text-lg text-gray-400 group-hover:text-red-500"></i>
                    </button>
                  </div>
                ))}

                {documents.length === 0 && (
                  <div className="text-center py-12 text-gray-400">
                    <i className="fa-regular fa-folder-open text-6xl mb-4"></i>
                    <p>No documents uploaded yet</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <i className="fa-regular fa-folder-open text-6xl mb-4"></i>
                <p>No mentee documents available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
                <i className="fa-regular fa-trash-can text-3xl text-red-500"></i>
              </div>
            </div>
            <h3 className="text-xl font-bold text-center text-[#2E3B8E] mb-6">
              Are you sure want to delete File ?
            </h3>
            <div className="flex gap-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 px-6 py-3 bg-[#2E3B8E] text-white rounded-lg font-semibold hover:bg-[#1F2A6E] transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {showSuccess && (
        <div className="fixed top-8 left-1/2 transform -translate-x-1/2 z-[70] animate-slide-down">
          <div className="bg-white rounded-xl px-6 py-4 shadow-2xl border-2 border-green-500 flex items-center gap-3">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <i className="fa-solid fa-check text-white text-sm"></i>
            </div>
            <span className="text-[#2E3B8E] font-semibold">
              Documents Deleted
            </span>
          </div>
        </div>
      )}
    </>
  );
}
