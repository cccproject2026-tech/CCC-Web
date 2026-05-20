"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { extractApiErrorMessage } from "@/app/Services/appointment-utils";
import { useToast } from "@/app/Components/ui/Toast";
import {
  mentorModalBtnPrimary,
  mentorModalBtnSecondary,
  mentorModalCloseBtn,
  mentorModalFooter,
  mentorModalHeader,
  mentorModalOverlay,
  mentorModalPanel,
  mentorModalTitle,
} from "@/app/Components/mentor/mentor-theme";
import { useUploadVoiceNoteMutation } from "./hooks/useVoiceNotesQueries";
import {
  titleFromFileName,
  validateVoiceNoteFile,
  voiceNotesBasePath,
  type VoiceNotesVariant,
} from "./voiceNotesUtils";

type UploadPhase = "idle" | "uploading" | "success" | "failed";

type VoiceNoteUploadModalProps = {
  isOpen: boolean;
  onClose: () => void;
  variant: VoiceNotesVariant;
};

export default function VoiceNoteUploadModal({
  isOpen,
  onClose,
  variant,
}: VoiceNoteUploadModalProps) {
  const toast = useToast();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [uploadPercent, setUploadPercent] = useState(0);
  const [phase, setPhase] = useState<UploadPhase>("idle");
  const [dragOver, setDragOver] = useState(false);

  const uploadMutation = useUploadVoiceNoteMutation();
  const basePath = voiceNotesBasePath(variant);

  const resetForm = useCallback(() => {
    setFile(null);
    setTitle("");
    setValidationError(null);
    setUploadPercent(0);
    setPhase("idle");
    setDragOver(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const handleClose = () => {
    if (uploadMutation.isPending) return;
    resetForm();
    onClose();
  };

  const applyFile = (next: File | null) => {
    if (!next) {
      setFile(null);
      setValidationError(null);
      return;
    }
    const err = validateVoiceNoteFile(next);
    if (err) {
      setFile(null);
      setValidationError(err);
      return;
    }
    setFile(next);
    setValidationError(null);
    if (!title.trim()) setTitle(titleFromFileName(next.name));
    setPhase("idle");
  };

  const handleUpload = async () => {
    if (!file) {
      setValidationError("Select an audio file to upload.");
      return;
    }
    const err = validateVoiceNoteFile(file);
    if (err) {
      setValidationError(err);
      return;
    }

    setPhase("uploading");
    setUploadPercent(0);

    try {
      const result = await uploadMutation.mutateAsync({
        file,
        title: title.trim() || titleFromFileName(file.name),
        onUploadProgress: setUploadPercent,
      });
      setPhase("success");
      toast.show({ kind: "success", title: "Audio uploaded", subtitle: "Processing has started." });
      resetForm();
      onClose();
      if (result?.id) {
        router.push(`${basePath}/${encodeURIComponent(result.id)}`);
      }
    } catch (e) {
      setPhase("failed");
      toast.show({
        kind: "error",
        title: "Upload failed",
        subtitle: extractApiErrorMessage(e),
      });
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) applyFile(dropped);
  };

  if (!isOpen) return null;

  const busy = uploadMutation.isPending || phase === "uploading";

  return (
    <div className={mentorModalOverlay} role="dialog" aria-modal="true" aria-labelledby="voice-upload-title">
      <div className={`${mentorModalPanel} max-h-[90vh] max-w-lg overflow-y-auto`}>
        <div className={mentorModalHeader}>
          <h2 id="voice-upload-title" className={mentorModalTitle}>
            Upload Audio
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className={mentorModalCloseBtn}
            disabled={busy}
            aria-label="Close upload dialog"
          >
            <i className="fa-solid fa-xmark text-lg" aria-hidden />
          </button>
        </div>

        <p className="mb-4 text-sm text-gray-600">
          MP3, WAV, M4A, or WebM — max 25 MB. Your note will be transcribed and summarized automatically.
        </p>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={`rounded-xl border-2 border-dashed px-4 py-8 text-center transition ${
            dragOver ? "border-[#3498DB] bg-[#3498DB]/5" : "border-gray-200 bg-gray-50"
          }`}
        >
          <i className="fa-solid fa-microphone mb-3 text-2xl text-[#2E3B8E]" aria-hidden />
          <p className="text-sm font-medium text-gray-800">
            {file ? file.name : "Drag and drop an audio file, or browse"}
          </p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={busy}
            className="mt-3 text-sm font-semibold text-[#2E3B8E] hover:underline disabled:opacity-50"
          >
            Choose file
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".mp3,.wav,.m4a,.webm,audio/mpeg,audio/wav,audio/mp4,audio/webm"
            className="hidden"
            onChange={(e) => applyFile(e.target.files?.[0] ?? null)}
          />
        </div>

        {validationError ? (
          <p className="mt-3 text-sm font-medium text-red-600" role="alert">
            {validationError}
          </p>
        ) : null}

        <label className="mt-4 block text-sm font-medium text-gray-700">
          Title
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={busy}
            placeholder="Weekly Reflection"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-[#3498DB] focus:ring-2 focus:ring-[#3498DB]/30"
          />
        </label>

        {busy ? (
          <div className="mt-4">
            <div className="mb-1 flex justify-between text-xs font-medium text-gray-600">
              <span>Uploading…</span>
              <span>{uploadPercent}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-[#3498DB] transition-all duration-300"
                style={{ width: `${Math.max(uploadPercent, 8)}%` }}
              />
            </div>
          </div>
        ) : null}

        {phase === "failed" ? (
          <p className="mt-3 text-sm text-red-600">
            Something went wrong. You can try uploading again.
          </p>
        ) : null}

        <div className={mentorModalFooter}>
          <button type="button" onClick={handleClose} className={mentorModalBtnSecondary} disabled={busy}>
            Cancel
          </button>
          {phase === "failed" ? (
            <button type="button" onClick={() => void handleUpload()} className={mentorModalBtnPrimary}>
              Retry upload
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void handleUpload()}
              disabled={!file || busy}
              className={`${mentorModalBtnPrimary} disabled:opacity-60`}
            >
              {busy ? "Uploading…" : "Upload"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
