"use client";
import Image from "next/image";
import Link from "next/link";
import { isAxiosError } from "axios";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiLogin } from "@/app/Services/api";
import { setCookie } from "@/app/utils/cookies";
import {
  hasDirectorSession,
  normalizeUserCookieForClient,
} from "@/app/utils/director-auth";

import Framelogo1 from "@/app/Assets/Frame-logo-1.png";
import LoginPasswordField from "@/app/Components/LoginPasswordField";
import AndrewsLogo from "../../Assets/andrews-logo.png";

const ENABLE_TEMP_LOGIN_BYPASS = false;

function isSafeDirectorReturnUrl(url: string | null): url is string {
  if (!url || !url.startsWith("/")) return false;
  if (!url.startsWith("/director/")) return false;
  if (url.startsWith("/director/login")) return false;
  return true;
}

function DirectorLoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (hasDirectorSession()) {
      router.replace("/director/home");
    }
  }, [router]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 1800);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (ENABLE_TEMP_LOGIN_BYPASS) {
      const mockDirectorUser = {
        _id: "temp-director-user",
        id: "temp-director-user",
        firstName: "Director",
        lastName: "Demo",
        email: email || "director.demo@ccc.local",
        role: "director",
      };
      setCookie("accessToken", "temp-access-token");
      setCookie("refreshToken", "temp-refresh-token");
      setCookie("user", JSON.stringify(mockDirectorUser));
      setCookie("userId", mockDirectorUser._id);
      showToast("Login successful. Redirecting...");
      const next = searchParams.get("returnUrl");
      setTimeout(
        () => router.push(isSafeDirectorReturnUrl(next) ? next : "/director/home"),
        350,
      );
      return;
    }

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

      if (user) {
        const roleRaw = (user as { role?: string }).role;
        if (roleRaw != null && String(roleRaw).trim() !== "") {
          const role = String(roleRaw).toLowerCase();
          if (role !== "director") {
            setErrorMsg(
              "This account is not a director account. Use the pastor or mentor sign-in page instead.",
            );
            return;
          }
        }
      }

      if (accessToken) setCookie("accessToken", accessToken);
      if (refreshToken) setCookie("refreshToken", refreshToken);
      if (user) {
        const normalized = normalizeUserCookieForClient(user as Record<string, unknown>);
        setCookie("user", JSON.stringify(normalized));
        const uid = (normalized.id ?? normalized._id) as string | undefined;
        if (uid) setCookie("userId", String(uid));
      }

      const next = searchParams.get("returnUrl");
      const destination = isSafeDirectorReturnUrl(next) ? next : "/director/home";

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
    <div className="min-h-screen bg-[#062946] text-white font-[Albert_Sans]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_8%,rgba(141,211,243,0.22),transparent_34%),radial-gradient(circle_at_82%_22%,rgba(245,204,118,0.12),transparent_35%),linear-gradient(180deg,#041f35_0%,#062946_100%)]" />
      <header className="relative z-10 flex items-center justify-between border-b border-white/10 bg-[#0b3558]/95 px-4 py-3 sm:px-6 lg:px-10 backdrop-blur-sm">
        <Link href="/" className="flex items-center gap-2.5 text-white/95 transition hover:text-white">
          <Image src={Framelogo1} alt="CCC" width={26} height={26} />
          <span className="hidden text-sm font-medium sm:inline">Center for Community Change</span>
        </Link>
        {/* <Link href="/" className="text-sm text-[#cde2f2] transition hover:text-white">
          Back to home
        </Link> */}
      </header>

      <section className="relative z-10 flex flex-col md:flex-row min-h-[calc(100vh-64px)]">
        <div className="w-full md:w-1/2 flex flex-col items-center justify-center p-6 sm:p-8">
          <div className="w-full max-w-[500px] rounded-3xl border border-white/20 bg-[linear-gradient(180deg,rgba(255,255,255,0.12)_0%,rgba(255,255,255,0.05)_100%)] p-7 shadow-[0_24px_52px_rgba(3,24,43,0.35)] backdrop-blur">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-[#8ec5eb]">
              <i className="fa-solid fa-chart-line text-xl" />
            </div>
            <h3 className="text-3xl font-semibold text-white">Director Portal</h3>
            <p className="mt-3 text-sm leading-7 text-[#cde2f2]">
              Sign in to oversee mentors and mentees, track progress, and manage programs from one place.
            </p>
            {/* <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl border border-white/15 bg-[#0a3558] p-3">
                <p className="text-[#8ec5eb] font-semibold">Oversight</p>
                <p className="text-[#d9ebf8]">Network-wide view</p>
              </div>
              <div className="rounded-xl border border-white/15 bg-[#0a3558] p-3">
                <p className="text-[#8ec5eb] font-semibold">Programs</p>
                <p className="text-[#d9ebf8]">Courses & interests</p>
              </div>
            </div> */}
          </div>
        </div>

        <div className="w-full md:w-1/2 bg-[linear-gradient(180deg,rgba(10,53,88,0.8)_0%,rgba(8,43,71,0.85)_100%)] border-l border-white/10 flex flex-col items-center justify-center px-6 sm:px-8 py-10 md:py-12 relative min-h-[540px]">
          <div className="text-left w-full max-w-[420px] mb-4 sm:mb-6">
            <h1 className="text-white text-2xl sm:text-3xl font-semibold tracking-tight">Director login</h1>
            <p className="mt-1 text-sm text-[#cde2f2]">Use your director credentials to continue.</p>
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
                {isLoading ? "Logging in…" : "Log in"}
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

      {toastMessage && (
        <div className="fixed left-1/2 top-20 z-[70] -translate-x-1/2 rounded-lg border border-white/20 bg-[#0a3558] px-4 py-3 text-sm text-white shadow-[0_12px_28px_rgba(2,20,38,0.45)]">
          {toastMessage}
        </div>
      )}
    </div>
  );
}

export default function DirectorLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#062946] flex items-center justify-center text-white">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#8ec5eb] border-t-transparent" />
        </div>
      }
    >
      <DirectorLoginInner />
    </Suspense>
  );
}
