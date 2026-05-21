"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { isAxiosError } from "axios";
import { apiSendOtp, apiSetPassword, apiVerifyOtp } from "@/app/Services/api";
import { getCookie } from "@/app/utils/cookies";

type Step = 1 | 2 | 3;

const inputClass =
  "w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/45 shadow-inner focus:border-[#8ec5eb]/80 focus:outline-none focus:ring-1 focus:ring-[#8ec5eb]/40";

function apiErrorMessage(err: unknown, fallback: string): string {
  if (!isAxiosError(err)) return fallback;

  const data = err.response?.data;

  if (data && typeof data === "object" && "message" in data) {
    const message = (data as { message?: string | string[] }).message;

    if (Array.isArray(message) && message[0]) return String(message[0]);
    if (typeof message === "string" && message.trim()) return message;
  }

  return fallback;
}

export default function SetPasswordInlinePanel({
  onSuccess,
  email: emailProp,
  initialStep,
  loginPath = "/pastor/login",
}: {
  onSuccess?: () => void;
  /** Primary email source (URL / onboarding API); overrides cookie. */
  email?: string;
  /** Open directly on OTP (1), verify (2), or password (3) — e.g. after mobile verify. */
  initialStep?: Step;
  loginPath?: string;
}) {
  const router = useRouter();

  const [step, setStep] = useState<Step>(initialStep ?? 1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [otp, setOtp] = useState("");
  const [emailLocked, setEmailLocked] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const resolved =
      (emailProp?.trim() || "") || (getCookie("interestEmail")?.trim() || "");

    if (resolved) {
      setFormData((prev) => ({ ...prev, email: resolved }));
      setEmailLocked(Boolean(emailProp?.trim() || getCookie("interestEmail")));
    }
  }, [emailProp]);

  useEffect(() => {
    if (initialStep != null) {
      setStep(initialStep);
    }
  }, [initialStep]);

  const userEmail = formData.email.trim();

  const handleSendOtp = useCallback(async () => {
    setError(null);

    if (!userEmail) {
      setError("No email found. Enter your email to continue.");
      return;
    }

    try {
      setLoading(true);
      await apiSendOtp({ email: userEmail, purpose: "email_verification" });
      setStep(2);
    } catch (err) {
      console.error(err);
      setError(apiErrorMessage(err, "Could not send verification code."));
    } finally {
      setLoading(false);
    }
  }, [userEmail]);

  const handleVerifyOtp = useCallback(async () => {
    setError(null);

    const code = otp.trim();

    if (code.length < 4 || code.length > 8) {
      setError("Enter the verification code from your email.");
      return;
    }

    try {
      setLoading(true);

      const res = await apiVerifyOtp({ email: userEmail, otp: code });

      if (res.data?.success) {
        setStep(3);
      } else {
        setError("Verification failed. Check the code and try again.");
      }
    } catch (err) {
      console.error(err);
      setError(apiErrorMessage(err, "Invalid or expired code."));
    } finally {
      setLoading(false);
    }
  }, [userEmail, otp]);

  const handleSubmitPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const { email, password, confirmPassword } = formData;

    if (!email || !password || !confirmPassword) {
      setError("All fields are required.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Password and Confirm Password must match.");
      return;
    }

    if (password.length < 6) {
      setError("Password should be at least 6 characters.");
      return;
    }

    try {
      setLoading(true);

      const response = await apiSetPassword(email.trim(), password, confirmPassword);
      const data = response.data;

      if (!data?.success) {
        setError(data?.message || "Failed to set password. Please try again.");
        return;
      }

      setShowSuccess(true);
      onSuccess?.();
    } catch (err) {
      console.error(err);
      setError(apiErrorMessage(err, "Something went wrong. Please try again later."));
    } finally {
      setLoading(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="rounded-2xl border border-emerald-300/30 bg-emerald-400/10 p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-400/20 text-emerald-200">
            <i className="fa-solid fa-check text-base" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-base font-semibold text-white">Password created</p>
            <p className="mt-1 text-sm leading-6 text-[#cde2f2]">
              You can now sign in with your email and new password.
            </p>

            <button
              type="button"
              onClick={() => router.push(loginPath)}
              className="mt-4 rounded-xl bg-white px-6 py-2.5 text-sm font-semibold text-[#0f4a76] transition hover:bg-[#e7f1fa]"
            >
              Continue to login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-emerald-300/30 bg-emerald-400/10 p-5">
      <div className="mb-5 flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-400/20 text-emerald-200">
          <i className="fa-solid fa-lock text-base" />
        </div>

        <div>
          <p className="text-base font-semibold text-white">Set your password</p>
          <p className="mt-1 text-sm leading-6 text-[#cde2f2]">
            Verify your email, then create your password to activate your account.
          </p>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        {[1, 2, 3].map((stepNumber) => (
          <div
            key={stepNumber}
            className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
              step === stepNumber
                ? "bg-white/20 text-white ring-1 ring-white/25"
                : step > stepNumber
                  ? "bg-emerald-500/20 text-emerald-100 ring-1 ring-emerald-400/30"
                  : "bg-white/5 text-white/45 ring-1 ring-white/10"
            }`}
          >
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                step > stepNumber
                  ? "bg-emerald-500/80 text-white"
                  : step === stepNumber
                    ? "bg-[#8ec5eb] text-[#0f4a76]"
                    : "bg-white/15"
              }`}
            >
              {step > stepNumber ? <i className="fa-solid fa-check text-[9px]" /> : stepNumber}
            </span>
            {stepNumber === 1 && "Send code"}
            {stepNumber === 2 && "Verify"}
            {stepNumber === 3 && "Password"}
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-[#cde2f2]">Email</label>
          <input
            type="email"
            placeholder="Email address"
            className={`${inputClass} read-only:cursor-not-allowed read-only:bg-white/[0.07]`}
            value={formData.email}
            readOnly={emailLocked}
            onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
            autoComplete="email"
          />
        </div>

        {step === 1 && (
          <div className="space-y-4 pt-1">
            {error && (
              <p className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-100">
                {error}
              </p>
            )}

            <button
              type="button"
              disabled={loading || !userEmail}
              onClick={handleSendOtp}
              className="w-full rounded-xl bg-white px-6 py-3 text-sm font-semibold text-[#0f4a76] shadow-[0_8px_24px_rgba(0,0,0,0.2)] transition hover:bg-[#e7f1fa] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Sending..." : "Send verification code"}
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 pt-1">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#cde2f2]">
                Verification code
              </label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="Enter code"
                className={inputClass}
                value={otp}
                maxLength={8}
                onChange={(e) => setOtp(e.target.value.replace(/\s/g, ""))}
              />
            </div>

            {error && (
              <p className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-100">
                {error}
              </p>
            )}

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                disabled={loading}
                onClick={() => {
                  setStep(1);
                  setOtp("");
                  setError(null);
                }}
                className="flex-1 rounded-xl border border-white/25 bg-white/5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-60"
              >
                Back
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={handleVerifyOtp}
                className="flex-1 rounded-xl bg-white py-3 text-sm font-semibold text-[#0f4a76] shadow-[0_8px_24px_rgba(0,0,0,0.15)] transition hover:bg-[#e7f1fa] disabled:opacity-60"
              >
                {loading ? "Verifying..." : "Verify"}
              </button>
            </div>

            <button
              type="button"
              className="text-sm font-medium text-[#8ec5eb] underline-offset-2 hover:underline"
              onClick={handleSendOtp}
              disabled={loading}
            >
              Resend code
            </button>
          </div>
        )}

        {step === 3 && (
          <form className="space-y-4 pt-1" onSubmit={handleSubmitPassword}>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#cde2f2]">
                New password
              </label>
              {/* <input
                type="password"
                placeholder="Create password"
                className={inputClass}
                value={formData.password}
                onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                autoComplete="new-password"
              /> */}
              <div className="relative">
  <input
    type={showPassword ? "text" : "password"}
    placeholder="Create password"
    className={`${inputClass} pr-12`}
    value={formData.password}
    onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
    autoComplete="new-password"
  />

  <button
    type="button"
    onClick={() => setShowPassword((prev) => !prev)}
    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
  >
    <i className={`fa-regular ${showPassword ? "fa-eye-slash" : "fa-eye"}`} />
  </button>
</div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#cde2f2]">
                Confirm password
              </label>
              {/* <input
                type="password"
                placeholder="Confirm password"
                className={inputClass}
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    confirmPassword: e.target.value,
                  }))
                }
                autoComplete="new-password"
              /> */}
              <div className="relative">
  <input
    type={showConfirmPassword ? "text" : "password"}
    placeholder="Confirm password"
    className={`${inputClass} pr-12`}
    value={formData.confirmPassword}
    onChange={(e) =>
      setFormData((prev) => ({
        ...prev,
        confirmPassword: e.target.value,
      }))
    }
    autoComplete="new-password"
  />

  <button
    type="button"
    onClick={() => setShowConfirmPassword((prev) => !prev)}
    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
  >
    <i className={`fa-regular ${showConfirmPassword ? "fa-eye-slash" : "fa-eye"}`} />
  </button>
</div>
            </div>

            {error && (
              <p className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-100">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-xl bg-white py-3 text-sm font-semibold text-[#0f4a76] shadow-[0_8px_24px_rgba(0,0,0,0.2)] transition hover:bg-[#e7f1fa] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Saving..." : "Save password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}