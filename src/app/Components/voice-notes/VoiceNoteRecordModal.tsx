"use client";

import { useCallback, useEffect, useState } from "react";
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
import { useVoiceRecorder } from "./hooks/useVoiceRecorder";
import {
  defaultRecordingTitle,
  formatRecordingTimer,
  validateVoiceNoteFile,
  voiceNotesBasePath,
  type VoiceNotesVariant,
} from "./voiceNotesUtils";

type VoiceNoteRecordModalProps = {
  isOpen: boolean;
  onClose: () => void;
  variant: VoiceNotesVariant;
};

export default function VoiceNoteRecordModal({
  isOpen,
  onClose,
  variant,
}: VoiceNoteRecordModalProps) {
  const toast = useToast();
  const router = useRouter();
  const uploadMutation = useUploadVoiceNoteMutation();
  const basePath = voiceNotesBasePath(variant);

  const {
    status,
    elapsedSeconds,
    durationSeconds,
    errorMessage,
    previewUrl,
    startRecording,
    stopRecording,
    cancelRecording,
    discardPreview,
    reset: resetRecorder,
    getRecordedFile,
  } = useVoiceRecorder();
  const [title, setTitle] = useState("");
  const [uploadPercent, setUploadPercent] = useState(0);
  const [uploadFailed, setUploadFailed] = useState(false);

  const resetModal = useCallback(() => {
    resetRecorder();
    setTitle("");
    setUploadPercent(0);
    setUploadFailed(false);
  }, [resetRecorder]);

  useEffect(() => {
    if (isOpen) {
      resetModal();
    } else {
      resetRecorder();
    }
  }, [isOpen, resetModal, resetRecorder]);

  const handleClose = () => {
    if (uploadMutation.isPending) return;
    resetModal();
    onClose();
  };

  const handleUpload = async () => {
    const file = getRecordedFile();
    if (!file) {
      discardPreview();
      return;
    }

    const validationErr = validateVoiceNoteFile(file);
    if (validationErr) {
      toast.show({ kind: "error", title: "Invalid recording", subtitle: validationErr });
      return;
    }

    setUploadFailed(false);
    setUploadPercent(0);

    try {
      const result = await uploadMutation.mutateAsync({
        file,
        title: title.trim() || defaultRecordingTitle(),
        onUploadProgress: setUploadPercent,
        recording: {
          durationSeconds,
        },
      });
      toast.show({ kind: "success", title: "Recording uploaded", subtitle: "Processing has started." });
      resetModal();
      onClose();
      if (result?.id) {
        router.push(`${basePath}/${encodeURIComponent(result.id)}`);
      }
    } catch (e) {
      setUploadFailed(true);
      toast.show({
        kind: "error",
        title: "Upload failed",
        subtitle: extractApiErrorMessage(e),
      });
    }
  };

  if (!isOpen) return null;

  const busy = uploadMutation.isPending;

  return (
    <div
      className={mentorModalOverlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="voice-record-title"
    >
      <div className={`${mentorModalPanel} max-h-[90vh] max-w-lg overflow-y-auto`}>
        <div className={mentorModalHeader}>
          <h2 id="voice-record-title" className={mentorModalTitle}>
            Record Voice
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className={mentorModalCloseBtn}
            disabled={busy || status === "recording"}
            aria-label="Close recording dialog"
          >
            <i className="fa-solid fa-xmark text-lg" aria-hidden />
          </button>
        </div>

        {status === "unsupported" ? (
          <div className="py-4 text-sm text-gray-600">
            <p>Voice recording is not supported in this browser.</p>
            <p className="mt-2">Please use Upload Audio instead, or try Chrome, Edge, Firefox, or Safari.</p>
          </div>
        ) : null}

        {status === "idle" || status === "error" ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Record directly in your browser. After you stop, you can preview and upload for transcript and
              AI summary.
            </p>
            {errorMessage ? (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                {errorMessage}
              </p>
            ) : (
              <p className="text-xs text-gray-500">
                Microphone access is required. You will be prompted to allow access when you start recording.
              </p>
            )}
            <button
              type="button"
              onClick={() => void startRecording()}
              disabled={busy}
              className={`${mentorModalBtnPrimary} w-full sm:w-auto`}
            >
              <i className="fa-solid fa-microphone mr-2" aria-hidden />
              Start recording
            </button>
          </div>
        ) : null}

        {status === "recording" ? (
          <div className="flex flex-col items-center py-6 text-center" role="status" aria-live="polite">
            <div className="mb-4 flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
              </span>
              <span className="text-sm font-semibold text-red-600">Recording…</span>
            </div>
            <p className="font-mono text-4xl font-bold tracking-tight text-[#0B1C58]">
              {formatRecordingTimer(elapsedSeconds)}
            </p>
            <div className="mt-8 flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={stopRecording}
                className={`${mentorModalBtnPrimary} w-full sm:w-auto`}
              >
                Stop
              </button>
              <button
                type="button"
                onClick={cancelRecording}
                className={`${mentorModalBtnSecondary} w-full sm:w-auto`}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : null}

        {status === "preview" ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Preview your recording ({formatRecordingTimer(durationSeconds)}), then upload to
              continue.
            </p>
            {previewUrl ? (
              <audio
                controls
                src={previewUrl}
                className="h-12 w-full"
                preload="metadata"
                aria-label="Recording preview"
              />
            ) : null}
            <label className="block text-sm font-medium text-gray-700">
              Title
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={busy}
                placeholder={defaultRecordingTitle()}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-[#3498DB] focus:ring-2 focus:ring-[#3498DB]/30"
              />
            </label>
            {busy ? (
              <div>
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
            {uploadFailed ? (
              <p className="text-sm text-red-600">Upload failed. You can retry or re-record.</p>
            ) : null}
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                onClick={() => void handleUpload()}
                disabled={busy}
                className={`${mentorModalBtnPrimary} w-full sm:flex-1`}
              >
                {busy ? "Uploading…" : "Upload Recording"}
              </button>
              <button
                type="button"
                onClick={discardPreview}
                disabled={busy}
                className={`${mentorModalBtnSecondary} w-full sm:flex-1`}
              >
                Re-record
              </button>
            </div>
          </div>
        ) : null}

        {status !== "recording" && status !== "preview" ? (
          <div className={mentorModalFooter}>
            <button type="button" onClick={handleClose} className={mentorModalBtnSecondary} disabled={busy}>
              {status === "unsupported" ? "Close" : "Cancel"}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
