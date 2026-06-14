"use client";

import { FormEvent, useState } from "react";
import PastorHeader from "@/app/Components/PastorHeader";
import { getCookie } from "@/app/utils/cookies";
import { apiSendOtp, apiResetPassword } from "@/app/Services/api";
import { Eye, EyeOff } from "lucide-react";

export default function PastorSettingsPage() {
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const user = JSON.parse(getCookie("user") || "{}");
  const email = user?.email || "";

  const handleSendOtp = async () => {
    if (!email) {
      setError("User email not available.");
      return;
    }
    try {
      setError(null);
      setMessage(null);
      await apiSendOtp({ email, purpose: "password_reset" });
      setMessage("OTP sent to your registered email.");
    } catch (err) {
      console.error("Failed to send OTP:", err);
      setError("Failed to send OTP.");
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("User email not available.");
      return;
    }
    if (!otp || !password || !confirmPassword) {
      setError("Please fill all fields.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Password and confirm password do not match.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setMessage(null);
      await apiResetPassword({ email, otp, password, confirmPassword });
      setMessage("Password updated successfully.");
      setOtp("");
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error("Failed to update password:", err);
      setError("Failed to update password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[radial-gradient(circle_at_20%_12%,rgba(141,211,243,0.18),transparent_38%),linear-gradient(180deg,#041f35_0%,#062946_100%)] text-white">
      <PastorHeader showFullHeader={true} />

      <main className="flex-1 px-4 py-10 md:px-8 lg:px-16">
        <div className="mx-auto max-w-6xl rounded-2xl border border-white/15 bg-[linear-gradient(180deg,rgba(12,58,95,0.9)_0%,rgba(10,53,88,0.95)_100%)] p-6 shadow-[0_20px_50px_rgba(2,20,38,0.35)] md:p-8">
          {/* <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-[#d9ebf8]">
            <span className="h-2 w-2 rounded-full bg-[#8ec5eb]" />
            Leadership Support Network
          </p> */}
          <h1 className="mt-3 text-2xl font-semibold md:text-3xl">Settings</h1>
          <p className="mt-2 text-sm text-[#cde2f2]">
            Configure account preferences and notification settings.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 max-w-xl space-y-3 rounded-xl border border-white/15 bg-white/5 p-4">
            <p className="text-xs text-[#cde2f2]">Email: {email || "Not found"}</p>
            <div className="flex gap-3">
              <input
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter OTP"
                className="w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-[#cde2f2] outline-none"
              />
              <button
                type="button"
                onClick={handleSendOtp}
                className="rounded-xl bg-[#8ec5eb] px-4 py-2 text-sm font-semibold text-[#062946] hover:bg-[#a9d5f2]"
              >
                Send OTP
              </button>
            </div>
           <div className="relative">
  <input
    type={showPassword ? "text" : "password"}
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    placeholder="New Password"
    className="w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 pr-11 text-sm text-white placeholder:text-[#cde2f2] outline-none"
  />
  <button
    type="button"
    onClick={() => setShowPassword((prev) => !prev)}
    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#cde2f2] transition hover:text-white"
    aria-label={showPassword ? "Hide password" : "Show password"}
  >
    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
  </button>
</div>
          <div className="relative">
  <input
    type={showConfirmPassword ? "text" : "password"}
    value={confirmPassword}
    onChange={(e) => setConfirmPassword(e.target.value)}
    placeholder="Confirm New Password"
    className="w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 pr-11 text-sm text-white placeholder:text-[#cde2f2] outline-none"
  />
  <button
    type="button"
    onClick={() => setShowConfirmPassword((prev) => !prev)}
    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#cde2f2] transition hover:text-white"
    aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
  >
    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
  </button>
</div>
            {message && <p className="text-sm text-[#9ef0be]">{message}</p>}
            {error && <p className="text-sm text-[#ffb2b2]">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-[#8ec5eb] px-4 py-2 text-sm font-semibold text-[#062946] hover:bg-[#a9d5f2] disabled:opacity-60"
            >
              {loading ? "Updating..." : "Update Password"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
