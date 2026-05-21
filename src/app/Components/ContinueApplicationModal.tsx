"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  continueApplicationByEmail,
  getContinueApplicationError,
  isValidContinueEmail,
} from "@/app/utils/continue-application";

type ContinueApplicationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  /** Pre-fill email (e.g. from login form). */
  initialEmail?: string;
};

export default function ContinueApplicationModal({
  isOpen,
  onClose,
  initialEmail = "",
}: ContinueApplicationModalProps) {
  const router = useRouter();
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setEmail(initialEmail);
      setError(null);
    }
  }, [isOpen, initialEmail]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    const trimmed = email.trim();

    if (!trimmed) {
      setError("Please enter your email address.");
      return;
    }

    if (!isValidContinueEmail(trimmed)) {
      setError("Please enter a valid email address.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const { route } = await continueApplicationByEmail(trimmed);
      onClose();
      router.push(route);
    } catch (err) {
      setError(getContinueApplicationError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[radial-gradient(circle_at_20%_15%,rgba(120,186,232,0.2),transparent_40%),rgba(2,16,30,0.72)] px-4 backdrop-blur-md"
      onClick={onClose}
      role="presentation"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-3xl border border-white/20 bg-[linear-gradient(180deg,rgba(12,58,95,0.96)_0%,rgba(8,46,78,0.96)_100%)] p-6 text-white shadow-[0_30px_80px_rgba(2,20,38,0.56)] sm:p-8"
        role="dialog"
        aria-labelledby="continue-application-title"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2
              id="continue-application-title"
              className="text-2xl font-semibold tracking-tight text-white"
            >
              Continue Application
            </h2>
            <p className="mt-2 text-sm text-[#d4e8f6]">
              Enter the email you used on your interest form to pick up where you left off.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white/80 transition hover:bg-white/20 hover:text-white"
            aria-label="Close continue application"
          >
            <i className="fa-solid fa-xmark text-xl" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-[#d4e8f6]">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              autoComplete="email"
              className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/45 focus:border-[#8ec5eb]"
            />
          </div>

          {error ? (
            <p className="rounded-xl border border-red-400/25 bg-red-500/10 px-4 py-2 text-sm text-red-200">
              {error}
            </p>
          ) : null}

          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-[#1f4f7d] transition hover:bg-[#e7f1fa] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Checking..." : "Continue Application"}
            {!loading ? <i className="fa-solid fa-arrow-right text-xs" /> : null}
          </button>
        </div>
      </div>
    </div>
  );
}
