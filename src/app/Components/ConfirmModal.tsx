"use client";

import { useState } from "react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: string;
  icon?: string;
  iconColor?: string;
  /** Shown on the confirm button while `onConfirm` is running (async). */
  pendingConfirmText?: string;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmColor = "bg-blue-600 hover:bg-blue-700",
  icon = "fa-solid fa-circle-question",
  iconColor = "text-blue-500 bg-blue-100",
  pendingConfirmText,
}: ConfirmModalProps) {
  const [pending, setPending] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setPending(true);
    try {
      await Promise.resolve(onConfirm());
      onClose();
    } catch {
      // Parent shows errors; keep modal open.
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-xl p-8 max-w-md w-full shadow-2xl">
        <div className="text-center mb-6">
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${iconColor}`}
          >
            <i className={`${icon} text-2xl`}></i>
          </div>
          <h3 className="text-[22px] font-bold text-gray-900 mb-2">{title}</h3>
          <p className="text-[14px] text-gray-600">{message}</p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            disabled={pending}
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg text-[14px] font-semibold hover:bg-gray-200 transition-all disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={handleConfirm}
            className={`flex-1 px-4 py-3 text-white rounded-lg text-[14px] font-semibold transition-all disabled:opacity-70 ${confirmColor}`}
          >
            {pending && pendingConfirmText ? pendingConfirmText : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
