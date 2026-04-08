"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { isAxiosError } from "axios";
import CCCLogo from "../../Assets/CCCLogo.png";
import AndrewsLogo from "../../Assets/andrews-logo.png";
import PastorHeader from "@/app/Components/PastorHeader";
import HeroBg from "../../Assets/hero-bg.png";
import { useRouter } from "next/navigation";
import { apiSendOtp, apiSetPassword, apiVerifyOtp } from "@/app/Services/api";
import { getCookie } from "@/app/utils/cookies";

function apiErrorMessage(err: unknown, fallback: string): string {
  if (!isAxiosError(err)) return fallback;
  const data = err.response?.data;
  if (data && typeof data === "object" && "message" in data) {
    const m = (data as { message?: string | string[] }).message;
    if (Array.isArray(m) && m[0]) return String(m[0]);
    if (typeof m === "string" && m.trim()) return m;
  }
  return fallback;
}

type Step = 1 | 2 | 3;

const inputClass =
  "w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/45 shadow-inner focus:border-[#8ec5eb]/80 focus:outline-none focus:ring-1 focus:ring-[#8ec5eb]/40";

export default function SetPasswordPage() {
  const router = useRouter();

  const [showPopup, setShowPopup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<Step>(1);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [otp, setOtp] = useState("");
  const [emailFromCookie, setEmailFromCookie] = useState(false);

  useEffect(() => {
    const email = getCookie("interestEmail");
    if (email) {
      setFormData((prev) => ({ ...prev, email }));
      setEmailFromCookie(true);
    }
  }, []);

  const userEmail = formData.email.trim();

  const handleSendOtp = useCallback(async () => {
    setError(null);
    if (!userEmail) {
      setError("No email found. Submit an interest form first or enter your email.");
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
      setError("Enter the verification code from your email (4–8 characters).");
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

      setShowPopup(true);
    } catch (err) {
      console.error(err);
      setError(apiErrorMessage(err, "Something went wrong. Please try again later."));
    } finally {
      setLoading(false);
    }
  };

  const steps: { n: Step; label: string }[] = [
    { n: 1, label: "Send code" },
    { n: 2, label: "Verify email" },
    { n: 3, label: "Set password" },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-transparent text-white font-[Albert_Sans]">
      <PastorHeader showFullHeader={true} />

      <section
        className="relative flex-1 overflow-hidden bg-cover bg-top px-4 pb-20 pt-6 sm:px-8 lg:px-20"
        style={{ backgroundImage: `url(${HeroBg.src})` }}
      >
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,31,53,0.72)_0%,rgba(6,41,70,0.78)_45%,rgba(6,41,70,0.96)_100%)]" />

        <div className="relative z-10 mx-auto w-full max-w-6xl">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-white/75">Account setup</p>
              <h1 className="mt-2 text-3xl font-semibold text-white md:text-4xl">Set your password</h1>
              <p className="mt-2 max-w-xl text-sm text-[#cde2f2] md:text-base">
                Verify your email with a one-time code, then create a password to sign in — same steps as the mobile app.
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-white/15 bg-white/5 px-4 py-3 backdrop-blur-sm">
              <Image src={CCCLogo} alt="Center for Community Change" className="h-10 w-auto object-contain opacity-95" width={120} height={40} />
            </div>
          </div>

          {/* Step indicator */}
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <ol className="flex flex-wrap items-center gap-2 sm:gap-0">
              {steps.map((s, idx) => (
                <li key={s.n} className="flex items-center">
                  <div
                    className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold sm:px-4 sm:text-sm ${
                      step === s.n
                        ? "bg-[#8ec5eb]/25 text-white ring-1 ring-[#8ec5eb]/50"
                        : step > s.n
                          ? "bg-emerald-500/20 text-emerald-100 ring-1 ring-emerald-400/30"
                          : "bg-white/5 text-white/50 ring-1 ring-white/10"
                    }`}
                  >
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] sm:h-7 sm:w-7 sm:text-xs ${
                        step > s.n ? "bg-emerald-500/80 text-white" : step === s.n ? "bg-[#8ec5eb] text-[#0f4a76]" : "bg-white/15"
                      }`}
                    >
                      {step > s.n ? <i className="fa-solid fa-check text-[10px]" aria-hidden /> : s.n}
                    </span>
                    {s.label}
                  </div>
                  {idx < steps.length - 1 && (
                    <span className="mx-1 hidden text-white/25 sm:mx-2 sm:inline" aria-hidden>
                      <i className="fa-solid fa-chevron-right text-[10px]" />
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </div>

          <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
            <div className="lg:col-span-7 xl:col-span-8">
              <div className="rounded-2xl border border-white/15 bg-[linear-gradient(180deg,rgba(15,74,118,0.55)_0%,rgba(9,49,80,0.72)_100%)] p-6 shadow-[0_20px_50px_rgba(2,20,38,0.4)] backdrop-blur-md md:p-10">
                <h2 className="text-lg font-semibold text-white md:text-xl">
                  {step === 1 && "Step 1 — Send verification code"}
                  {step === 2 && "Step 2 — Enter code from email"}
                  {step === 3 && "Step 3 — Create your password"}
                </h2>
                <p className="mt-1 text-sm text-[#cde2f2]/90">
                  {step === 1 && "We’ll email you a code to confirm this address."}
                  {step === 2 && "Check your inbox (and spam) for the code."}
                  {step === 3 && "Use at least 6 characters. You’ll use this to log in."}
                </p>

                <div className="mt-8 space-y-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-[#cde2f2]">Email</label>
                    <input
                      type="email"
                      placeholder="Email address"
                      className={`${inputClass} read-only:cursor-not-allowed read-only:bg-white/[0.07]`}
                      value={formData.email}
                      readOnly={emailFromCookie}
                      onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                      autoComplete="email"
                    />
                  </div>

                  {step === 1 && (
                    <div className="space-y-4 pt-2">
                      {error && <p className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-100">{error}</p>}
                      <button
                        type="button"
                        disabled={loading || !userEmail}
                        onClick={handleSendOtp}
                        className="w-full rounded-xl bg-white px-6 py-3 text-sm font-semibold text-[#0f4a76] shadow-[0_8px_24px_rgba(0,0,0,0.2)] transition hover:bg-[#e7f1fa] disabled:cursor-not-allowed disabled:opacity-60 md:text-base"
                      >
                        {loading ? "Sending…" : "Send verification code"}
                      </button>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="space-y-4 pt-2">
                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-[#cde2f2]">Verification code</label>
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
                      {error && <p className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-100">{error}</p>}
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
                          {loading ? "Verifying…" : "Verify"}
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
                    <form className="space-y-4 pt-2" onSubmit={handleSubmitPassword}>
                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-[#cde2f2]">New password</label>
                        <input
                          type="password"
                          placeholder="Create password"
                          className={inputClass}
                          value={formData.password}
                          onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                          autoComplete="new-password"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-[#cde2f2]">Confirm password</label>
                        <input
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
                        />
                      </div>
                      {error && <p className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-100">{error}</p>}
                      <button
                        type="submit"
                        disabled={loading}
                        className="mt-2 w-full rounded-xl bg-white py-3 text-sm font-semibold text-[#0f4a76] shadow-[0_8px_24px_rgba(0,0,0,0.2)] transition hover:bg-[#e7f1fa] disabled:cursor-not-allowed disabled:opacity-60 md:text-base"
                      >
                        {loading ? "Saving…" : "Save password"}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-6 lg:col-span-5 xl:col-span-4">
              <div className="rounded-2xl border border-white/15 bg-[linear-gradient(180deg,rgba(15,74,118,0.5)_0%,rgba(9,49,80,0.65)_100%)] p-6 backdrop-blur-md">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
                    <i className="fa-solid fa-shield-halved text-[#8ec5eb]" aria-hidden />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Why we verify</h3>
                </div>
                <p className="text-sm leading-relaxed text-[#cde2f2]">
                  Your email must match your interest form so only you can set the password for that account.
                </p>
              </div>

              <div className="rounded-2xl border border-white/15 bg-[linear-gradient(180deg,rgba(15,74,118,0.5)_0%,rgba(9,49,80,0.65)_100%)] p-6 backdrop-blur-md">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
                    <i className="fa-solid fa-address-card text-[#8ec5eb]" aria-hidden />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Need help?</h3>
                </div>
                <ul className="space-y-2 text-sm text-[#cde2f2]">
                  <li className="flex gap-2">
                    <i className="fa-solid fa-phone mt-0.5 text-[#8ec5eb]" aria-hidden />
                    269-471-6159
                  </li>
                  <li className="flex gap-2 break-all">
                    <i className="fa-solid fa-envelope mt-0.5 text-[#8ec5eb]" aria-hidden />
                    communitychange@andrews.edu
                  </li>
                </ul>
                <p className="mt-4 text-xs text-[#cde2f2]/75">
                  Already set a password?{" "}
                  <Link href="/pastor/login" className="font-semibold text-[#8ec5eb] underline-offset-2 hover:underline">
                    Log in
                  </Link>
                </p>
              </div>

              <div className="flex justify-center rounded-xl border border-white/10 bg-white/5 py-6">
                <Image
                  src={AndrewsLogo}
                  alt="Andrews University"
                  className="h-auto w-[200px] object-contain opacity-90 md:w-[220px]"
                  width={220}
                  height={80}
                />
              </div>
            </div>
          </div>

          <p className="mt-10 text-center text-xs text-[#cde2f2]/60">
            <Link href="/" className="hover:text-[#8ec5eb]">
              ← Back to home
            </Link>
          </p>
        </div>
      </section>

      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
          <div
            className="w-full max-w-md rounded-2xl border border-white/20 p-8 text-center shadow-[0_24px_80px_rgba(0,0,0,0.45)]"
            style={{
              background: "linear-gradient(180deg, rgba(15,74,118,0.95) 0%, rgba(9,49,80,0.98) 100%)",
            }}
          >
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/25 ring-2 ring-emerald-400/40">
              <i className="fa-solid fa-check text-2xl text-emerald-300" aria-hidden />
            </div>
            <h2 className="text-xl font-semibold text-white">Password created</h2>
            <p className="mt-2 text-sm text-[#cde2f2]">You can sign in with your email and new password.</p>
            <button
              type="button"
              onClick={() => router.push("/pastor/login")}
              className="mt-8 w-full rounded-xl bg-white py-3 text-sm font-semibold text-[#0f4a76] transition hover:bg-[#e7f1fa]"
            >
              Continue to log in
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
