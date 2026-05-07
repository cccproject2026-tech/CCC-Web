"use client";

import Link from "next/link";
import PastorHeader from "@/app/Components/PastorHeader";
import "@fortawesome/fontawesome-free/css/all.min.css";

export default function PastorHelpPage() {
  const phone = "269-471-0159";
  const email = "communitychange@andrews.edu";

  return (
    <main className="min-h-screen bg-[#082f49] text-white">
      <PastorHeader />

      <section className="mx-auto w-full max-w-md px-4 py-8">
        <Link
          href="/pastor/home"
          className="mb-5 inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/15"
        >
          <i className="fa-solid fa-arrow-left text-xs" />
          Back
        </Link>

        <h1 className="text-2xl font-bold">Contact Information</h1>
        <p className="mt-2 text-sm text-white/75">
          Need help? Reach out through the options below.
        </p>

        <div className="mt-6 rounded-2xl border border-white/15 bg-white/10 p-5 shadow-lg">
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 text-sm font-bold">
                <i className="fa-solid fa-phone text-[#9bd3ff]" />
                Phone
              </div>
              <p className="mt-1 text-sm text-white/80">: {phone}</p>
            </div>

            <div>
              <div className="flex items-center gap-2 text-sm font-bold">
                <i className="fa-regular fa-envelope text-[#9bd3ff]" />
                Email
              </div>
              <p className="mt-1 text-sm text-white/80">: {email}</p>
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <a
            href={`tel:${phone}`}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-3 text-sm font-bold text-[#0b4163] hover:bg-white/90"
          >
            <i className="fa-solid fa-phone text-xs" />
            Call
          </a>

          <a
            href={`mailto:${email}`}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-3 text-sm font-bold text-[#0b4163] hover:bg-white/90"
          >
            <i className="fa-regular fa-envelope text-xs" />
            Email
          </a>
        </div>
      </section>
    </main>
  );
}