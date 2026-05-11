"use client";

import { useEffect, useState, type FormEvent } from "react";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { useRouter } from "next/navigation";
import MentorHeader from "@/app/Components/MentorHeader";
import { getCookie } from "@/app/utils/cookies";
import { apiSetPassword } from "@/app/Services/auth.service";
import { apiGetUserById } from "@/app/Services/users.service";

import UserProfile from "../../Assets/user-profile.png";
import Image from "next/image";
import {
  mentorFieldLabel,
  mentorGlassCardFrost,
  mentorMainGradient,
  mentorPageRoot,
  mentorPrimaryCta,
  mentorSecondaryCta,
} from "@/app/Components/mentor/mentor-theme";

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
    <div className={mentorPageRoot}>
      <MentorHeader showFullHeader={true} />

      <section className={`relative px-0 py-10 ${mentorMainGradient} flex-1`}>
        <div className="mx-auto w-full max-w-4xl">
          <button
            type="button"
            onClick={() => router.push("/mentor/profile")}
            className={`mb-4 inline-flex items-center gap-2 ${mentorSecondaryCta}`}
          >
            <i className="fa-solid fa-arrow-left" aria-hidden />
            Back to profile
          </button>

          <div className={`p-6 sm:p-8 ${mentorGlassCardFrost}`}>
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
                  <label className={mentorFieldLabel}>Current Password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm text-white placeholder:text-[#cde2f2] outline-none focus:border-[#8ec5eb]/50 focus:ring-2 focus:ring-[#8ec5eb]/30"
                    placeholder="Enter current password"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className={mentorFieldLabel}>New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm text-white placeholder:text-[#cde2f2] outline-none focus:border-[#8ec5eb]/50 focus:ring-2 focus:ring-[#8ec5eb]/30"
                      placeholder="Enter new password"
                    />
                  </div>

                  <div>
                    <label className={mentorFieldLabel}>Confirm New Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm text-white placeholder:text-[#cde2f2] outline-none focus:border-[#8ec5eb]/50 focus:ring-2 focus:ring-[#8ec5eb]/30"
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => router.push("/mentor/profile")}
                    className={mentorSecondaryCta}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!canSubmit}
                    className={`${mentorPrimaryCta} disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    {submitting ? "Updating…" : "Update Password"}
                  </button>
                </div>
              </form>
            </div>
        </div>
      </section>
    </div>
  );
}

