"use client";
import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { isAxiosError } from "axios";
import CCCLogo from "../../Assets/CCCLogo.png";
import PastorHeader from "@/app/Components/PastorHeader";
import AndrewsLogo from "../../Assets/andrews-logo.png";
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

  return (
    <div>
      <PastorHeader />

      <section className="flex min-h-screen">
        {/* LEFT SIDE */}
        <div className="w-full md:w-1/2 bg-white flex flex-col items-center justify-center p-8">
          <Image
            src={CCCLogo}
            alt="CCC Logo"
            className="w-full object-contain mb-4"
          />
        </div>

        {/* RIGHT SIDE */}
        <div className="w-full md:w-1/2 bg-gradient-to-b from-[#103C8C] to-[#1B4C9E] flex flex-col items-center justify-center px-8 relative">
          <div className="text-center mb-5">
            <h1 className="text-white text-2xl font-semibold tracking-wide">
              WELCOME !
            </h1>
            <p className="text-[#E9C700] text-sm mt-1">
              Welcome to your revitalization roadmap
            </p>
          </div>

          <div className="w-full max-w-[380px] bg-transparent">
            <h2 className="text-white text-left text-sm mb-1 font-medium">
              Set Password
            </h2>
            <p className="text-white/70 text-xs mb-3 text-left">
              Step {step} of 3 — verify your email, then choose a password (same flow as the mobile app).
            </p>

            {/* Email (all steps) */}
            <input
              type="email"
              placeholder="Username (Auto generated) Email ID"
              className="w-full rounded-md px-4 py-2 text-sm bg-transparent border border-white/50 text-white placeholder:text-white/70 focus:outline-none focus:border-white read-only:opacity-70 read-only:cursor-not-allowed mb-4"
              value={formData.email}
              readOnly={emailFromCookie}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, email: e.target.value }))
              }
            />

            {step === 1 && (
              <div className="flex flex-col gap-4">
                <p className="text-white/80 text-xs text-left">
                  We&apos;ll send a verification code to this email. Enter it on the next step, then set your password.
                </p>
                {error && (
                  <p className="text-red-200 text-xs text-left">{error}</p>
                )}
                <button
                  type="button"
                  disabled={loading || !userEmail}
                  onClick={handleSendOtp}
                  className="w-full bg-white text-[#103C8C] font-medium py-2 rounded-md hover:opacity-90 transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? "Sending…" : "Send verification code"}
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="flex flex-col gap-4">
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="Enter verification code from email"
                  className="w-full rounded-md px-4 py-2 text-sm bg-transparent border border-white/50 text-white placeholder:text-white/70 focus:outline-none focus:border-white"
                  value={otp}
                  maxLength={8}
                  onChange={(e) => setOtp(e.target.value.replace(/\s/g, ""))}
                />
                {error && (
                  <p className="text-red-200 text-xs text-left">{error}</p>
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => {
                      setStep(1);
                      setOtp("");
                      setError(null);
                    }}
                    className="flex-1 border border-white/50 text-white py-2 rounded-md text-sm hover:bg-white/10 disabled:opacity-60"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleVerifyOtp}
                    className="flex-1 bg-white text-[#103C8C] font-medium py-2 rounded-md hover:opacity-90 disabled:opacity-60"
                  >
                    {loading ? "Verifying…" : "Verify"}
                  </button>
                </div>
                <button
                  type="button"
                  className="text-[#8ec5eb] text-xs underline text-left"
                  onClick={handleSendOtp}
                  disabled={loading}
                >
                  Resend code
                </button>
              </div>
            )}

            {step === 3 && (
              <form className="flex flex-col gap-4" onSubmit={handleSubmitPassword}>
                <input
                  type="password"
                  placeholder="Create Password"
                  className="w-full rounded-md px-4 py-2 text-sm bg-transparent border border-white/50 text-white placeholder:text-white/70 focus:outline-none focus:border-white"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, password: e.target.value }))
                  }
                />
                <input
                  type="password"
                  placeholder="Confirm Password"
                  className="w-full rounded-md px-4 py-2 text-sm bg-transparent border border-white/50 text-white placeholder:text-white/70 focus:outline-none focus:border-white"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      confirmPassword: e.target.value,
                    }))
                  }
                />

                {error && (
                  <p className="text-red-200 text-xs mt-1 text-left">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-4 bg-white text-[#103C8C] font-medium py-2 rounded-md hover:opacity-90 transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? "Submitting..." : "Submit"}
                </button>
              </form>
            )}
          </div>

          {/* ANDREWS UNIVERSITY LOGO */}
          <div className="absolute bottom-6">
            <div className="flex flex-col items-center">
              <Image
                src={AndrewsLogo}
                alt="Andrews University Logo"
                className="w-[220px] object-contain"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ✅ SUCCESS POPUP */}
      {showPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <div className="bg-white text-center rounded-xl p-8 w-[340px] shadow-lg">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-white"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 00-1.414 0L9 11.586 6.707 9.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l7-7a1 1 0 000-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
            <h2 className="text-[#103C8C] text-lg font-semibold">
              Password Created Successfully
            </h2>

            <button
              onClick={() => router.push("/pastor/login")}
              className="mt-5 border border-[#103C8C] text-[#103C8C] px-5 py-1.5 rounded-md text-sm font-medium hover:bg-[#E6F0FF] transition"
            >
              Click Here to Log in
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
