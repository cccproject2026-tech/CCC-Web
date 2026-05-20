"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { recordingBlobToFile } from "../voiceNotesUtils";

export type VoiceRecorderStatus =
  | "unsupported"
  | "idle"
  | "recording"
  | "preview"
  | "error";

const MIME_CANDIDATES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/mpeg",
];

export function isVoiceRecordingSupported(): boolean {
  if (typeof window === "undefined") return false;
  return (
    typeof MediaRecorder !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia
  );
}

function pickRecordingMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "";
  for (const mime of MIME_CANDIDATES) {
    if (MediaRecorder.isTypeSupported(mime)) return mime;
  }
  return "";
}

function stopStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((t) => t.stop());
}

export function useVoiceRecorder() {
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const previewUrlRef = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef<number>(0);

  const [status, setStatus] = useState<VoiceRecorderStatus>(() =>
    isVoiceRecordingSupported() ? "idle" : "unsupported",
  );
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [mimeType, setMimeType] = useState("");
  const [durationSeconds, setDurationSeconds] = useState(0);

  const revokePreview = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setPreviewUrl(null);
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const releaseHardware = useCallback(() => {
    clearTimer();
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      try {
        recorderRef.current.stop();
      } catch {
        /* already stopped */
      }
    }
    recorderRef.current = null;
    stopStream(streamRef.current);
    streamRef.current = null;
    chunksRef.current = [];
  }, [clearTimer]);

  const reset = useCallback(() => {
    releaseHardware();
    revokePreview();
    setRecordedBlob(null);
    setMimeType("");
    setDurationSeconds(0);
    setElapsedSeconds(0);
    setErrorMessage(null);
    setStatus(isVoiceRecordingSupported() ? "idle" : "unsupported");
  }, [releaseHardware, revokePreview]);

  useEffect(() => () => {
    releaseHardware();
    revokePreview();
  }, [releaseHardware, revokePreview]);

  const startRecording = useCallback(async () => {
    if (!isVoiceRecordingSupported()) {
      setStatus("unsupported");
      setErrorMessage("Voice recording is not supported in this browser.");
      return;
    }

    reset();
    setErrorMessage(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mime = pickRecordingMimeType();
      setMimeType(mime);
      const recorder = mime
        ? new MediaRecorder(stream, { mimeType: mime })
        : new MediaRecorder(stream);
      recorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onerror = () => {
        setErrorMessage("Recording failed. Please try again.");
        setStatus("error");
        releaseHardware();
      };

      recorder.onstop = () => {
        clearTimer();
        const blobType = mime || recorder.mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: blobType });
        const duration = Math.max(
          0,
          Math.round((Date.now() - startedAtRef.current) / 1000),
        );

        stopStream(streamRef.current);
        streamRef.current = null;
        recorderRef.current = null;
        chunksRef.current = [];

        if (blob.size < 1 || duration < 1) {
          setErrorMessage("Recording was too short. Please record at least one second.");
          setStatus("error");
          setRecordedBlob(null);
          setDurationSeconds(0);
          setElapsedSeconds(0);
          return;
        }

        revokePreview();
        const url = URL.createObjectURL(blob);
        previewUrlRef.current = url;
        setPreviewUrl(url);
        setRecordedBlob(blob);
        setDurationSeconds(duration);
        setElapsedSeconds(duration);
        setStatus("preview");
      };

      recorder.start(1000);
      startedAtRef.current = Date.now();
      setElapsedSeconds(0);
      setStatus("recording");

      timerRef.current = setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - startedAtRef.current) / 1000));
      }, 250);
    } catch (e) {
      releaseHardware();
      const err = e as { name?: string };
      if (err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError") {
        setErrorMessage("Microphone access is required to record audio.");
      } else if (err?.name === "NotFoundError") {
        setErrorMessage("No microphone was found on this device.");
      } else {
        setErrorMessage("Could not start recording. Please check your microphone and try again.");
      }
      setStatus("error");
    }
  }, [clearTimer, releaseHardware, reset, revokePreview]);

  const stopRecording = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") return;
    clearTimer();
    recorder.stop();
  }, [clearTimer]);

  const cancelRecording = useCallback(() => {
    reset();
  }, [reset]);

  const discardPreview = useCallback(() => {
    revokePreview();
    setRecordedBlob(null);
    setDurationSeconds(0);
    setElapsedSeconds(0);
    setErrorMessage(null);
    setStatus("idle");
  }, [revokePreview]);

  const getRecordedFile = useCallback((): File | null => {
    if (!recordedBlob) return null;
    return recordingBlobToFile(recordedBlob, mimeType);
  }, [recordedBlob, mimeType]);

  return {
    status,
    elapsedSeconds,
    durationSeconds,
    errorMessage,
    previewUrl,
    recordedBlob,
    startRecording,
    stopRecording,
    cancelRecording,
    discardPreview,
    reset,
    getRecordedFile,
    isSupported: isVoiceRecordingSupported(),
  };
}
