"use client";
import { useState } from "react";
import Image from "next/image";
import CCCLogo from "../../Assets/CCCLogo.png";
import PastorHeader from "@/app/Components/PastorHeader";
import AndrewsLogo from "../../Assets/andrews-logo.png";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email || !password || !confirmPassword) {
      setErrorMsg("Please fill all fields.");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Password and Confirm Password must match.");
      return;
    }

    try {
      setIsSubmitting(true);

      const res = await fetch(
        "http://13.221.25.133/api/v1/auth/set-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
            confirmPassword,
          }),
        }
      );

      const json = await res.json();

      if (!res.ok || !json.success) {
        setErrorMsg(json.message || "Failed to reset password.");
        return;
      }

      setSuccessMsg(json.message || "Password set successfully.");
      // optional: clear fields
      setPassword("");
      setConfirmPassword("");
      // optional: redirect to login page here if you want
      // router.push("/pastor/login");
    } catch (err) {
      console.error("Set password error:", err);
      setErrorMsg("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <PastorHeader />

      <section className="flex min-h-screen">
        {/* LEFT LOGO SECTION */}
        <div className="w-full md:w-1/2 bg-white flex flex-col items-center justify-center p-8">
          <Image
            src={CCCLogo}
            alt="CCC Logo"
            className="w-full object-contain mb-4"
          />
        </div>

        {/* RIGHT RESET SECTION */}
        <div className="w-full md:w-1/2 bg-gradient-to-b from-[#103C8C] to-[#1B4C9E] flex flex-col items-center justify-center px-8 py-12 relative">
          <div className="text-left w-full max-w-[380px] mb-6">
            <h1 className="text-white text-xl font-semibold">
              Reset Password
            </h1>
          </div>

          <div className="w-full max-w-[380px] bg-transparent">
            {/* messages */}
            {errorMsg && (
              <p className="mb-3 text-sm text-red-200">{errorMsg}</p>
            )}
            {successMsg && (
              <p className="mb-3 text-sm text-emerald-200">{successMsg}</p>
            )}

            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
              <input
                type="email"
                placeholder="Enter your registered email"
                className="w-full rounded-md px-4 py-2 text-sm bg-transparent border border-white/50 text-white placeholder:text-white/70 focus:outline-none focus:border-white"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <input
                type="password"
                placeholder="Enter New Password"
                className="w-full rounded-md px-4 py-2 text-sm bg-transparent border border-white/50 text-white placeholder:text-white/70 focus:outline-none focus:border-white"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <input
                type="password"
                placeholder="Confirm New Password"
                className="w-full rounded-md px-4 py-2 text-sm bg-transparent border border-white/50 text-white placeholder:text-white/70 focus:outline-none focus:border-white"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-4 bg-white text-[#103C8C] font-medium py-2 rounded-md hover:opacity-90 transition disabled:opacity-60"
              >
                {isSubmitting ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          </div>

          <div className="absolute bottom-20">
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
    </div>
  );
}
