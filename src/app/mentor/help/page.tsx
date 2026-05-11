"use client";

import Link from "next/link";
import MentorHeader from "@/app/Components/MentorHeader";
import "@fortawesome/fontawesome-free/css/all.min.css";

export default function MentorHelpPage() {
  const phone = "269-471-0159";
  const email = "communitychange@andrews.edu";

  return (
    <main className="min-h-screen bg-[#082f49] text-white">
      <MentorHeader showFullHeader={true} />

      <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-8 lg:px-12">
        <Link
          href="/mentor/home"
          className="mb-8 inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white hover:bg-white/15"
        >
          <i className="fa-solid fa-arrow-left text-xs" />
          Back
        </Link>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-stretch">
          <div className="rounded-3xl border border-white/15 bg-white/10 p-8 shadow-lg">
            <h1 className="text-3xl font-bold">Contact Information</h1>
            <p className="mt-3 text-base text-white/75">
              Need help? Reach out through the options below.
            </p>

            <div className="mt-8 grid gap-5">
              <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5">
                <div className="flex items-center gap-3 text-base font-bold">
                  <i className="fa-solid fa-phone text-[#9bd3ff]" />
                  Phone
                </div>
                <p className="mt-2 text-lg text-white/85">{phone}</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5">
                <div className="flex items-center gap-3 text-base font-bold">
                  <i className="fa-regular fa-envelope text-[#9bd3ff]" />
                  Email
                </div>
                <p className="mt-2 text-lg text-white/85">{email}</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/15 bg-white/10 p-8 shadow-lg">
            <h2 className="text-2xl font-bold">Quick Support</h2>
            <p className="mt-3 text-sm text-white/70">
              Choose an option to contact the support team directly.
            </p>

            <div className="mt-8 grid gap-4">
              <a
                href={`tel:${phone}`}
                className="inline-flex items-center justify-center gap-3 rounded-2xl bg-white px-5 py-4 text-base font-bold text-[#0b4163] hover:bg-white/90"
              >
                <i className="fa-solid fa-phone text-sm" />
                Call Support
              </a>

              <a
                href={`mailto:${email}`}
                className="inline-flex items-center justify-center gap-3 rounded-2xl bg-white px-5 py-4 text-base font-bold text-[#0b4163] hover:bg-white/90"
              >
                <i className="fa-regular fa-envelope text-sm" />
                Email Support
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}