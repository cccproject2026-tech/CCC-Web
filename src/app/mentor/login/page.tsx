"use client";
import Image from "next/image";
import { isAxiosError } from "axios";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiLogin } from "@/app/Services/api";
import { setCookie } from "@/app/utils/cookies";

import MentorHeader from "@/app/Components/MentorHeader";
import AndrewsLogo from "../../Assets/andrews-logo.png";

const ENABLE_TEMP_LOGIN_BYPASS = false;

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 1800);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (ENABLE_TEMP_LOGIN_BYPASS) {
      const mockMentorUser = {
        id: "temp-mentor-user",
        firstName: "Mentor",
        lastName: "Demo",
        email: email || "mentor.demo@ccc.local",
        role: "mentor",
      };
      setCookie("accessToken", "temp-access-token");
      setCookie("refreshToken", "temp-refresh-token");
      setCookie("mentor", JSON.stringify(mockMentorUser));
      showToast("Login successful. Redirecting...");
      setTimeout(() => router.push("/mentor/profile-incomplete"), 350);
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

      // save tokens / user – you can later move this to a context or Zustand store
      if (accessToken) setCookie("accessToken", accessToken);
      if (refreshToken) setCookie("refreshToken", refreshToken);
      if (user) setCookie("mentor", JSON.stringify(user));
      {
        const u = user as { _id?: string; id?: string } | undefined;
        const uid = u?._id ?? u?.id;
        if (uid) setCookie("userId", String(uid));
      }

      // redirect – adjust based on role/status if needed
      showToast("Login successful. Redirecting...");
      setTimeout(() => router.push("/mentor/profile-incomplete"), 350);
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
    <div className="relative min-h-screen bg-transparent text-white font-[Albert_Sans]">
      <MentorHeader />

      <section className="relative z-10 flex flex-col md:flex-row min-h-[calc(100vh-64px)]">
        {/* LEFT INFO SECTION */}
        <div className="w-full md:w-1/2 flex flex-col items-center justify-center p-6 sm:p-8">
          <div className="w-full max-w-[500px] rounded-3xl border border-white/20 bg-[linear-gradient(180deg,rgba(255,255,255,0.12)_0%,rgba(255,255,255,0.05)_100%)] p-7 shadow-[0_24px_52px_rgba(3,24,43,0.35)] backdrop-blur">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-[#8ec5eb]">
              <i className="fa-solid fa-users text-xl" />
            </div>
            <h3 className="text-3xl font-semibold text-white">Welcome Back</h3>
            <p className="mt-3 text-sm leading-7 text-[#cde2f2]">
              Support leaders with clarity and consistency through mentoring tools built for meaningful ministry outcomes.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl border border-white/15 bg-[#0a3558] p-3">
                <p className="text-[#8ec5eb] font-semibold">Connect</p>
                <p className="text-[#d9ebf8]">Guide mentees easily</p>
              </div>
              <div className="rounded-xl border border-white/15 bg-[#0a3558] p-3">
                <p className="text-[#8ec5eb] font-semibold">Impact</p>
                <p className="text-[#d9ebf8]">Measure growth</p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT LOGIN SECTION */}
        <div className="w-full md:w-1/2 bg-[linear-gradient(180deg,rgba(10,53,88,0.8)_0%,rgba(8,43,71,0.85)_100%)] border-l border-white/10 flex flex-col items-center justify-center px-6 sm:px-8 py-10 md:py-12 relative min-h-[540px]">
          {/* HEADER */}
          <div className="text-left w-full max-w-[420px] mb-4 sm:mb-6">
            <h1 className="text-white text-2xl sm:text-3xl font-semibold tracking-tight">
              Login
            </h1>
            <p className="mt-1 text-sm text-[#cde2f2]">Welcome back. Continue your journey.</p>
          </div>

          {/* FORM */}
          <div className="w-full max-w-[420px] rounded-2xl border border-white/20 bg-white/5 p-5 backdrop-blur">
            <form className="flex flex-col gap-3 sm:gap-4" onSubmit={handleLogin}>
              <input
                type="email"
                placeholder="Email"
                className="w-full rounded-lg px-4 py-2.5 text-sm sm:text-base bg-white/10 border border-white/35 text-white placeholder:text-white/65 focus:outline-none focus:border-[#8ec5eb]"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <input
                type="password"
                placeholder="Password"
                className="w-full rounded-lg px-4 py-2.5 text-sm sm:text-base bg-white/10 border border-white/35 text-white placeholder:text-white/65 focus:outline-none focus:border-[#8ec5eb]"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              {errorMsg && (
                <p className="text-red-200 text-xs sm:text-sm mt-1">
                  {errorMsg}
                </p>
              )}

              <button
                type="submit"
                className="w-full mt-3 sm:mt-4 bg-white text-[#0f4a76] font-semibold py-2.5 rounded-lg text-sm sm:text-base hover:bg-[#e7f1fa] transition disabled:opacity-60"
                disabled={isLoading}
              >
                {isLoading ? "Logging in..." : "Login"}
              </button>
            </form>

            <div className="text-right mt-2">
              <a
                href="resetpassword"
                className="text-[12px] sm:text-[13px] text-[#cde2f2] hover:text-white transition"
              >
                Forgot Password ?
              </a>
            </div>

            {/* NEW USER BUTTON */}
            <div className="flex mt-5 sm:mt-6">
              <button
                className="w-full bg-[#0f4a76] text-white py-2 px-6 sm:px-12 rounded-lg text-xs sm:text-sm font-medium flex items-center justify-between hover:bg-[#0c3f66] transition cursor-pointer"
                onClick={() => router.push(`/pastor/InterestForm`)}
              >
                <span className="flex items-center gap-1">
                  New User <span>»</span>
                </span>
                <span className="hidden sm:flex">Submit Interest</span>
                <span className="sm:hidden">Submit Interest</span>
              </button>
            </div>
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
