"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import MentorHeader from "@/app/Components/MentorHeader";import { getCookie } from "@/app/utils/cookies";
import { apiSetPassword } from "@/app/Services/auth.service";
import { apiGetUserById } from "@/app/Services/users.service";

import UserProfile from "../../Assets/user-profile.png";
import Image from "next/image";

const glassPanel =
  "rounded-2xl border border-white/15 bg-white/5 backdrop-blur-md shadow-[0_24px_56px_rgba(2,20,38,0.20)]";

export default function MentorChangePasswordPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string>("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const mentorData = getCookie("mentor");
        if (!mentorData) return;
        const mentor = JSON.parse(mentorData);
        const mentorId = mentor?.id || mentor?._id;
        if (!mentorId) return;

        const res = await apiGetUserById(mentorId);
        const userEmail = res?.data?.data?.email;
        if (mounted && typeof userEmail === "string") setEmail(userEmail);
      } catch {
        // If we can't resolve the email, still allow the user to see a styled page.
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const canSubmit =
    !submitting &&
    email &&
    newPassword.length > 0 &&
    newPassword === confirmPassword &&
    currentPassword.length > 0;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email) {
      setErrorMsg("Unable to determine your email. Please try again.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg("New password and confirmation do not match.");
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      return;
    }

    setSubmitting(true);
    try {
      // Backend does not require current password here; we validate match only.
      const res = await apiSetPassword(email, newPassword, confirmPassword);
      const ok = res?.data?.success;

      if (!ok) {
        setErrorMsg("Password update failed. Please try again.");
        setSubmitting(false);
        return;
      }

      setSuccessMsg("Password updated successfully. Redirecting…");
      setTimeout(() => {
        router.push("/mentor/profile");
      }, 1200);
    } catch {
      setErrorMsg("Something went wrong while updating your password.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#062946] font-[Albert_Sans] text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_8%,rgba(141,211,243,0.24),transparent_34%),radial-gradient(circle_at_82%_22%,rgba(245,204,118,0.18),transparent_35%),radial-gradient(circle_at_48%_56%,rgba(111,178,246,0.12),transparent_42%),radial-gradient(circle_at_90%_80%,rgba(8,52,85,0.4),transparent_40%),linear-gradient(180deg,#041f35_0%,#062946_100%)]" />

      <div className="relative z-10">
        <MentorHeader showFullHeader={true} />

        <section className="relative px-4 py-10 sm:px-8 lg:px-20">
          <div className="mx-auto w-full max-w-4xl">
            <button
              type="button"
              onClick={() => router.push("/mentor/profile")}
              className="mb-4 inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm text-[#cde2f2] transition hover:bg-white/15"
            >
              <i className="fa-solid fa-arrow-left" aria-hidden />
              Back to profile
            </button>

            <div className={`p-6 sm:p-8 ${glassPanel}`}>
              <div className="flex items-center gap-4 mb-6">
                <div className="relative h-12 w-12 rounded-xl overflow-hidden border border-white/15 bg-white/5">
                  <Image src={UserProfile} alt="User" fill className="object-cover" />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold sm:text-3xl">Change Password</h1>
                  <p className="mt-1 text-sm text-[#cde2f2]">
                    Update your login credentials.
                    {loading ? " " : email ? ` (${email})` : ""}
                  </p>
                </div>
              </div>

              {errorMsg && (
                <div className="mb-4 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {errorMsg}
                </div>
              )}
              {successMsg && (
                <div className="mb-4 rounded-xl border border-green-400/30 bg-green-500/10 px-4 py-3 text-sm text-green-200">
                  {successMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full rounded-md border border-white/20 bg-white/5 px-4 py-2.5 text-white placeholder:text-white/40 outline-none focus:ring-1 focus:ring-[#8ec5eb]/40"
                    placeholder="Enter current password"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full rounded-md border border-white/20 bg-white/5 px-4 py-2.5 text-white placeholder:text-white/40 outline-none focus:ring-1 focus:ring-[#8ec5eb]/40"
                      placeholder="Enter new password"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full rounded-md border border-white/20 bg-white/5 px-4 py-2.5 text-white placeholder:text-white/40 outline-none focus:ring-1 focus:ring-[#8ec5eb]/40"
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
                  <button
                    type="button"
                    onClick={() => router.push("/mentor/profile")}
                    className="rounded-xl border border-white/20 bg-white/5 px-6 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!canSubmit}
                    className="rounded-xl bg-[#8ec5eb]/90 px-8 py-2.5 text-sm font-semibold text-[#062946] shadow-md hover:bg-[#8ec5eb] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {submitting ? "Updating…" : "Update Password"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </section>      </div>
    </div>
  );
}

