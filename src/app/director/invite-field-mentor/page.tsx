"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getCookie } from "@/app/utils/cookies";
import { apiInviteFieldMentor } from "@/app/Services/users.service";
import MentorBg from "../../Assets/mentor-bg.png";
import DirectorHero from "../DirectorHero";
import { directorGlassCard, directorInputClass, directorPageRoot } from "../directorUi";

export default function InviteFieldMentorPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const userId = getCookie("userId");
    if (!email.trim()) {
      setMessage("Enter an email address.");
      return;
    }
    if (!userId) {
      setMessage("Sign in as a director to send invitations.");
      return;
    }
    try {
      setLoading(true);
      setMessage(null);
      await apiInviteFieldMentor({ email: email.trim(), invitedBy: userId });
      setMessage("Invitation sent.");
      setEmail("");
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      setMessage(typeof msg === "string" ? msg : "Failed to send invitation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={directorPageRoot}>
      <DirectorHero
        title="Invite field mentor"
        subtitle="Send an invitation to a prospective field mentor."
        image={MentorBg}
        breadcrumbItems={[
          { label: "Home", href: "/director/home" },
          { label: "Invite field mentor" },
        ]}
      />

     <section className="mx-auto max-w-lg pb-16">
  <button
    type="button"
    onClick={() => router.back()}
    className="mb-4 inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
  >
    <i className="fa-solid fa-arrow-left" />
    Back
  </button>

  <form
          onSubmit={handleSubmit}
          className={`space-y-4 rounded-2xl border border-white/15 p-6 sm:p-8 ${directorGlassCard}`}
        >
          <div>
            <label className="mb-1 block text-sm text-white/80">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={directorInputClass}
              required
              autoComplete="email"
            />
          </div>
          {message ? (
            <p className="text-sm text-[#cde2f2]" role="status">
              {message}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg border border-[#8ec5eb]/40 bg-[#8ec5eb]/20 py-3 font-semibold text-white transition hover:bg-[#8ec5eb]/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Sending…" : "Send invitation"}
          </button>
        </form>
      </section>
    </div>
  );
}
