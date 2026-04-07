"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import PastorHeader from "@/app/Components/PastorHeader";
import HeroBg from "../../Assets/hero-bg.png";

/**
 * Post–interest-form thank you / waiting state.
 * Layout aligns with `/pastor/home` (hero + glass cards). Copy mirrors CCC-Mobile
 * unauthenticated pending panel: “Your Application Under Review”, thank-you lines, waiting badge.
 */
export default function ThankyouPage() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col bg-transparent text-white font-[Albert_Sans]">
      <PastorHeader showFullHeader={true} />

      <section
        className="relative flex-1 overflow-hidden bg-cover bg-top px-4 pb-16 pt-6 sm:px-8 lg:px-20"
        style={{ backgroundImage: `url(${HeroBg.src})` }}
      >
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,31,53,0.72)_0%,rgba(6,41,70,0.78)_45%,rgba(6,41,70,0.96)_100%)]" />

        <div className="relative z-10 mx-auto w-full max-w-6xl">
          {/* Status pill — same intent as mobile gradient “Waiting for Approval” */}
          <div className="mb-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-between sm:items-start">
            <div
              className="inline-flex items-center gap-3 rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_30px_rgba(33,182,233,0.35)] sm:order-2"
              style={{
                background: "linear-gradient(90deg, #B83AF3 0%, #21B6E9 100%)",
              }}
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/60 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
              </span>
              Waiting for Approval
              <i className="fa-solid fa-chevron-right text-xs text-white/80" aria-hidden />
            </div>
            <p className="text-center text-xs uppercase tracking-[0.2em] text-white/75 sm:order-1 sm:text-left">
              Application received
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
            {/* Main message — mobile “pending” copy, wide column */}
            <div className="lg:col-span-7 xl:col-span-8">
              <div className="rounded-2xl border border-white/15 bg-[linear-gradient(180deg,rgba(15,74,118,0.55)_0%,rgba(9,49,80,0.72)_100%)] p-8 shadow-[0_20px_50px_rgba(2,20,38,0.4)] backdrop-blur-md md:p-10 lg:p-12">
                <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/15 bg-white/10 md:h-20 md:w-20">
                  <i className="fa-regular fa-clock text-3xl text-[#8ec5eb] md:text-4xl" aria-hidden />
                </div>

                <h1 className="text-3xl font-semibold leading-tight text-white md:text-4xl lg:text-[2.5rem] lg:leading-snug">
                  Your Application Under Review
                </h1>

                <div className="mt-6 max-w-2xl space-y-4 text-base leading-relaxed text-[#cde2f2] md:text-lg">
                  <p>Thank you for your submission.</p>
                  <p>Your application is under review.</p>
                  <p>We will notify you soon. God bless you!</p>
                </div>

                <p className="mt-8 text-sm text-[#8ec5eb]/90">
                  Checking for updates? Use{" "}
                  <strong className="font-semibold text-white">Check Status</strong> to open the
                  processing page — same as the mobile app’s approval check.
                </p>

                <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                  <button
                    type="button"
                    onClick={() => router.push("/pastor/Processing")}
                    className="rounded-xl bg-white px-8 py-3 text-sm font-semibold text-[#0f4a76] shadow-[0_8px_24px_rgba(0,0,0,0.2)] transition hover:bg-[#e7f1fa] md:px-10 md:text-base"
                  >
                    Check Status
                  </button>
                  <Link
                    href="/"
                    className="rounded-xl border border-white/30 bg-white/10 px-8 py-3 text-center text-sm font-semibold text-white transition hover:bg-white/15 md:text-base"
                  >
                    Back to home
                  </Link>
                </div>
              </div>
            </div>

            {/* Sidebar — contact + next steps (large screens) */}
            <div className="flex flex-col gap-6 lg:col-span-5 xl:col-span-4">
              <div className="rounded-2xl border border-white/15 bg-[linear-gradient(180deg,rgba(15,74,118,0.5)_0%,rgba(9,49,80,0.65)_100%)] p-6 backdrop-blur-md">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
                    <i className="fa-solid fa-address-card text-[#8ec5eb]" aria-hidden />
                  </div>
                  <h2 className="text-xl font-semibold text-white">Contact Information</h2>
                </div>
                <ul className="space-y-3 text-sm text-[#cde2f2]">
                  <li className="flex items-start gap-3">
                    <i className="fa-solid fa-phone mt-0.5 text-[#8ec5eb]" aria-hidden />
                    <span>269-471-6159</span>
                  </li>
                  <li className="flex items-start gap-3 break-all">
                    <i className="fa-solid fa-envelope mt-0.5 text-[#8ec5eb]" aria-hidden />
                    <span>communitychange@andrews.edu</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <i className="fa-solid fa-globe mt-0.5 text-[#8ec5eb]" aria-hidden />
                    <span>communitychange.world</span>
                  </li>
                </ul>
              </div>

              <div className="rounded-2xl border border-white/15 bg-[linear-gradient(180deg,rgba(15,74,118,0.5)_0%,rgba(9,49,80,0.65)_100%)] p-6 backdrop-blur-md">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
                    <i className="fa-solid fa-list-check text-[#8ec5eb]" aria-hidden />
                  </div>
                  <h2 className="text-xl font-semibold text-white">What happens next</h2>
                </div>
                <ol className="list-decimal space-y-3 pl-5 text-sm leading-relaxed text-[#cde2f2]">
                  <li>A director reviews your interest form.</li>
                  <li>When your application is approved, you’ll set your password and sign in.</li>
                  <li>
                    Already applied?{" "}
                    <Link href="/pastor/login" className="font-semibold text-[#8ec5eb] underline-offset-2 hover:underline">
                      Log in
                    </Link>
                    .
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
