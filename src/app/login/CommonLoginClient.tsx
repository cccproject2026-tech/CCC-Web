"use client";
import Image from "next/image";
import { isAxiosError } from "axios";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiLogin } from "@/app/Services/api";
import { setCookie } from "@/app/utils/cookies";
import {
  clearCommonLoginSession,
  getPostLoginDestination,
  resolvePortalRoleAfterLogin,
  storePortalSession,
} from "@/app/utils/common-login";

import LoginPasswordField from "@/app/Components/LoginPasswordField";
import ContinueApplicationModal from "@/app/Components/ContinueApplicationModal";
import MentorHeader from "@/app/Components/MentorHeader";
import AndrewsLogo from "../Assets/andrews-logo.png";

function isSafeCommonReturnUrl(url: string | null, role: "pastor" | "mentor"): boolean {
  if (!url || !url.startsWith("/")) return false;
  const prefix = role === "mentor" ? "/mentor/" : "/pastor/";
  const loginPath = role === "mentor" ? "/mentor/login" : "/pastor/login";
  return url.startsWith(prefix) && !url.startsWith(loginPath);
}

function LoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [continueModalOpen, setContinueModalOpen] = useState(false);

  useEffect(() => {
    const prefill = searchParams.get("email");
    if (prefill?.trim()) setEmail(prefill.trim());
  }, [searchParams]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 1800);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email || !password) {
      setErrorMsg("Please enter email and password.");
      return;
    }

    try {
      setIsLoading(true);

      const response = await apiLogin(email, password);
      const json = response.data;

      if (!json.success) {
        setErrorMsg(json.message || "Login failed. Please try again.");
        return;
      }

      const { accessToken, refreshToken, user } = json.data || {};
      if (accessToken) setCookie("accessToken", accessToken);
      if (refreshToken) setCookie("refreshToken", refreshToken);

      const role = await resolvePortalRoleAfterLogin(user);

      if (role !== "pastor" && role !== "mentor") {
        clearCommonLoginSession();
        setErrorMsg(
          "We could not determine whether this account is a Pastor or Mentor. Please contact support.",
        );
        return;
      }

      const { normalizedUser } = storePortalSession(role, {
        accessToken,
        refreshToken,
        user,
      });

      const next = searchParams.get("returnUrl");
      const destination = isSafeCommonReturnUrl(next, role)
        ? (next as string)
        : getPostLoginDestination(role, next, normalizedUser);

      showToast("Login successful. Redirecting...");
      setTimeout(() => router.push(destination), 350);
    } catch (err) {
      if (isAxiosError(err)) {
        const status = err.response?.status;
        if (status === 404) {
          const apiMsg = (err.response?.data as { message?: string } | undefined)?.message;
          setErrorMsg(
            typeof apiMsg === "string" && apiMsg
              ? apiMsg
              : "Login service not found (404). Please check API base URL configuration.",
          );
        } else if (status === 401) {
          setErrorMsg("Invalid email or password.");
        } else {
          setErrorMsg(err.response?.data?.message || "Something went wrong. Please try again.");
        }
      } else {
        setErrorMsg("Something went wrong. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="relative min-h-screen bg-transparent text-white font-[Albert_Sans]"
      style={{ backgroundColor: "#062946" }}
    >
      <MentorHeader />

      <section className="relative z-10 flex flex-col md:flex-row min-h-[calc(100vh-64px)]">
        <div className="w-full md:w-1/2 flex flex-col items-center justify-center p-6 sm:p-8">
          <div className="w-full max-w-[500px] rounded-3xl border border-white/20 bg-[linear-gradient(180deg,rgba(255,255,255,0.12)_0%,rgba(255,255,255,0.05)_100%)] p-7 shadow-[0_24px_52px_rgba(3,24,43,0.35)] backdrop-blur">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-[#8ec5eb]">
              <i className="fa-solid fa-users text-xl" />
            </div>
            <h3 className="text-3xl font-semibold text-white">Welcome Back</h3>
            <p className="mt-3 text-sm leading-7 text-[#cde2f2]">
              Access your CCC account and continue your community change journey.
            </p>
          </div>
        </div>

        <div className="w-full md:w-1/2 bg-[linear-gradient(180deg,rgba(10,53,88,0.8)_0%,rgba(8,43,71,0.85)_100%)] border-l border-white/10 flex flex-col items-center justify-center px-6 sm:px-8 py-10 md:py-12 relative min-h-[540px]">
          <div className="text-left w-full max-w-[420px] mb-4 sm:mb-6">
            <h1 className="text-white text-2xl sm:text-3xl font-semibold tracking-tight">
              Login
            </h1>
            <p className="mt-1 text-sm text-[#cde2f2]">Welcome back. Continue your journey.</p>
          </div>

          <div className="w-full max-w-[420px] rounded-2xl border border-white/20 bg-white/5 p-5 sm:p-6 backdrop-blur">
            <form className="flex flex-col gap-4" onSubmit={handleLogin}>
              <input
                type="email"
                placeholder="Email"
                autoComplete="email"
                className="w-full rounded-lg px-4 py-3 text-sm sm:text-base bg-white/10 border border-white/35 text-white placeholder:text-white/65 focus:outline-none focus:border-[#8ec5eb] focus:ring-1 focus:ring-[#8ec5eb]/40"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <div className="flex flex-col gap-2">
                <LoginPasswordField
                  value={password}
                  onChange={setPassword}
                  disabled={isLoading}
                />
                <div className="flex justify-end">
                  <a
                    href="/pastor/resetpassword"
                    className="text-xs sm:text-sm text-[#cde2f2] hover:text-white underline-offset-2 hover:underline"
                  >
                    Forgot password?
                  </a>
                </div>
              </div>

              {errorMsg && (
                <p className="text-red-200 text-xs sm:text-sm" role="alert">
                  {errorMsg}
                </p>
              )}

              <button
                type="submit"
                className="w-full bg-white text-[#0f4a76] font-semibold py-3 rounded-lg text-sm sm:text-base hover:bg-[#e7f1fa] transition disabled:opacity-60"
                disabled={isLoading}
              >
                {isLoading ? "Logging in..." : "Log in"}
              </button>

              <div className="relative flex items-center justify-center py-1">
                <span className="absolute inset-x-0 top-1/2 h-px bg-white/15" aria-hidden />
                <span className="relative bg-white/5 px-3 text-[11px] font-medium uppercase tracking-wide text-[#cde2f2]/90">
                  or
                </span>
              </div>

              <button
                type="button"
                className="w-full rounded-lg border border-white/25 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-[#8ec5eb]/50"
                onClick={() => setContinueModalOpen(true)}
              >
                Continue Application
              </button>
            </form>
          </div>

          <div className="absolute bottom-4 md:bottom-6 inset-x-0 flex justify-center opacity-95">
            <Image
              src={AndrewsLogo}
              alt="Andrews University Logo"
              className="w-[150px] sm:w-[200px] md:w-[230px] lg:w-[250px] object-contain"
            />
          </div>
        </div>
      </section>

      <ContinueApplicationModal
        isOpen={continueModalOpen}
        onClose={() => setContinueModalOpen(false)}
        initialEmail={email}
      />

      {toastMessage && (
        <div className="fixed left-1/2 top-20 z-[70] -translate-x-1/2 rounded-lg border border-white/20 bg-[#0a3558] px-4 py-3 text-sm text-white shadow-[0_12px_28px_rgba(2,20,38,0.45)]">
          {toastMessage}
        </div>
      )}
    </div>
  );
}

export default function CommonLoginClient() {
  return (
    <Suspense
      fallback={
        <div
          className="relative min-h-screen bg-transparent text-white font-[Albert_Sans]"
          style={{ backgroundColor: "#062946" }}
        >
          <MentorHeader />
          <div className="flex min-h-[calc(100vh-64px)] items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#8ec5eb] border-t-transparent" />
          </div>
        </div>
      }
    >
      <LoginInner />
    </Suspense>
  );
}
