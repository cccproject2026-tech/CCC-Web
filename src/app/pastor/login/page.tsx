"use client";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiLogin } from "@/app/Services/api";
import { setCookie } from "@/app/utils/cookies";

import CCCLogo from "../../Assets/CCCLogo.png";
import PastorHeader from "@/app/Components/PastorHeader";
import AndrewsLogo from "../../Assets/andrews-logo.png";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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

      // save tokens / user – you can later move this to a context or Zustand store
      if (accessToken) setCookie("accessToken", accessToken);
      if (refreshToken) setCookie("refreshToken", refreshToken);
      if (user) setCookie("user", JSON.stringify(user));

      // redirect – adjust based on role/status if needed
      router.push("/pastor/profile-incomplete");
    } catch (err) {
      console.error("Login error:", err);
      setErrorMsg("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <PastorHeader />

      <section className="flex flex-col md:flex-row min-h-screen">
        {/* LEFT LOGO SECTION */}
        <div className="w-full md:w-1/2 bg-white flex flex-col items-center justify-center p-6 sm:p-8">
          <Image
            src={CCCLogo}
            alt="CCC Logo"
            className="w-[70%] sm:w-[55%] md:w-full max-w-[400px] object-contain mb-4"
            priority
          />
        </div>

        {/* RIGHT LOGIN SECTION */}
        <div className="w-full md:w-1/2 bg-gradient-to-b from-[#103C8C] to-[#1B4C9E] flex flex-col items-center justify-center px-6 sm:px-8 py-10 md:py-12 relative min-h-[600px]">
          {/* HEADER */}
          <div className="text-left w-full max-w-[380px] mb-4 sm:mb-6">
            <h1 className="text-white text-lg sm:text-xl font-semibold">
              Login
            </h1>
          </div>

          {/* FORM */}
          <div className="w-full max-w-[380px] bg-transparent">
            <form className="flex flex-col gap-3 sm:gap-4" onSubmit={handleLogin}>
              <input
                type="email"
                placeholder="Email"
                className="w-full rounded-md px-4 py-2 text-sm sm:text-base bg-transparent border border-white/50 text-white placeholder:text-white/70 focus:outline-none focus:border-white"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <input
                type="password"
                placeholder="Password"
                className="w-full rounded-md px-4 py-2 text-sm sm:text-base bg-transparent border border-white/50 text-white placeholder:text-white/70 focus:outline-none focus:border-white"
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
                className="w-full mt-3 sm:mt-4 bg-white text-[#103C8C] font-medium py-2 rounded-md text-sm sm:text-base hover:opacity-90 transition disabled:opacity-60"
                disabled={isLoading}
              >
                {isLoading ? "Logging in..." : "Login"}
              </button>
            </form>

            <div className="text-right mt-2">
              <a
                href="resetpassword"
                className="text-[12px] sm:text-[13px] text-white/80 hover:text-white transition"
              >
                Forgot Password ?
              </a>
            </div>

            {/* NEW USER BUTTON */}
            <div className="flex mt-5 sm:mt-6">
              <button
                className="w-full bg-gradient-to-r from-[#A150C0] to-[#1158D0] text-white py-2 px-6 sm:px-12 rounded-lg text-xs sm:text-sm font-medium flex items-center justify-between hover:opacity-90 transition cursor-pointer"
                onClick={() => router.push(`/pastor/InterestForm`)}
              >
                <span className="flex items-center gap-1">
                  New User <span>»</span>
                </span>
                <span className="hidden sm:flex">Submit Interest</span>
                <span className="sm:hidden">Submit</span>
              </button>
            </div>
          </div>

          {/* ANDREWS LOGO - FIXED FOR LARGE SCREENS */}
          <div className="absolute bottom-4 md:bottom-6 inset-x-0 flex justify-center">
            <Image
              src={AndrewsLogo}
              alt="Andrews University Logo"
              className="w-[150px] sm:w-[200px] md:w-[230px] lg:w-[250px] object-contain"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
