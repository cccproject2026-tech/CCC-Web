"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense } from "react";

import HeroBg from "../../Assets/hero-bg.png";
import { useSearchParams } from "next/navigation";

/**
 * Immediate confirmation after submitting the interest form — gratitude + clear next step.
 * For live approval status, polling, and outcomes use `/pastor/Processing` (different copy).
 */
function ThankyouContent() {

  const router = useRouter();
  const searchParams = useSearchParams();
  const emailFromUrl = searchParams.get("email") ?? "";

  return (
    <div className="flex min-h-screen flex-col bg-transparent text-white font-[Albert_Sans]">
      {/* <PastorHeader showFullHeader={true} /> */}

      <section
        className="relative flex-1 overflow-hidden bg-cover bg-top px-4 pb-16 pt-6 sm:px-8 lg:px-20"
        style={{ backgroundImage: `url(${HeroBg.src})` }}
      >
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,31,53,0.72)_0%,rgba(6,41,70,0.78)_45%,rgba(6,41,70,0.96)_100%)]" />

        <div className="relative z-10 mx-auto w-full max-w-6xl">
          <div className="mb-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-between sm:items-start">
            {/* Success tone — distinct from Processing “waiting” gradient */}
            <div className="inline-flex items-center gap-3 rounded-full bg-emerald-500/25 px-5 py-2.5 text-sm font-semibold text-emerald-100 ring-1 ring-emerald-400/40 shadow-[0_8px_30px_rgba(16,185,129,0.25)] sm:order-2">
              <i className="fa-solid fa-circle-check text-emerald-300" aria-hidden />
              Submission received
            </div>
            {/* <p className="text-center text-xs uppercase tracking-[0.2em] text-white/75 sm:order-1 sm:text-left">
              Step complete
            </p> */}
          </div>


          <div className="grid items-center gap-8 lg:grid-cols-12 lg:gap-10">
            <div className="lg:col-span-7 xl:col-span-8">
              <div className="rounded-2xl border border-white/15 bg-[linear-gradient(180deg,rgba(15,74,118,0.55)_0%,rgba(9,49,80,0.72)_100%)] p-8 shadow-[0_20px_50px_rgba(2,20,38,0.4)] backdrop-blur-md md:p-10 lg:p-12">
                <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-400/30 bg-emerald-500/15 md:h-20 md:w-20">
                  <i className="fa-solid fa-paper-plane text-3xl text-emerald-300 md:text-4xl" aria-hidden />
                </div>

                <h1 className="text-3xl font-semibold leading-tight text-white md:text-4xl lg:text-[2.5rem] lg:leading-snug">
                  Thank you !
                </h1>

                <p className="mt-6 max-w-2xl text-base leading-relaxed text-[#cde2f2] md:text-lg">
                  Your interest form was submitted successfully. We’re glad you’re here our team will review your
                  application and follow up as soon as we can.
                </p>

              

                <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                  <button
                    type="button"
                    // onClick={() => router.push("/pastor/Processing")}
                    onClick={() => {
                      const email =
                        typeof window !== "undefined"
                          ? document.cookie
                            .split("; ")
                            .find((row) => row.startsWith("interestEmail="))
                            ?.split("=")[1]
                          : "";

                      if (email) {
                        router.push(`/pastor/Processing?email=${encodeURIComponent(decodeURIComponent(email))}`);
                        return;
                      }

                      router.push("/pastor/Processing");
                    }}
                    className="rounded-xl bg-white px-8 py-3 text-sm font-semibold text-[#0f4a76] shadow-[0_8px_24px_rgba(0,0,0,0.2)] transition hover:bg-[#e7f1fa] md:px-10 md:text-base"
                  >
                    Track application status
                  </button>
                
                </div>
              </div>
            </div>

            {/* <div className="flex flex-col gap-6 lg:col-span-5 xl:col-span-4"> */}
            <div className="flex h-full flex-col justify-center gap-6 lg:col-span-5 xl:col-span-4">
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
              {/* 
              <div className="rounded-2xl border border-white/15 bg-[linear-gradient(180deg,rgba(15,74,118,0.5)_0%,rgba(9,49,80,0.65)_100%)] p-6 backdrop-blur-md">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
                    <i className="fa-solid fa-route text-[#8ec5eb]" aria-hidden />
                  </div>
                  <h2 className="text-xl font-semibold text-white">Your journey</h2>
                </div>
                <ol className="list-decimal space-y-3 pl-5 text-sm leading-relaxed text-[#cde2f2]">
                  <li>
                    <strong className="text-white/95">Submit</strong> — you just completed this step.
                  </li>
                  <li>
                    <strong className="text-white/95">Track</strong> — open{" "}
                    <span className="text-[#8ec5eb]">Processing</span> to watch for approval.
                  </li>
                  <li>
                    <strong className="text-white/95">Next</strong> — after approval, you’ll set a password and sign in.
                  </li>
                </ol>
                <p className="mt-4 text-xs text-[#cde2f2]/80">
                  Already have an account?{" "}
                  <Link href="/pastor/login" className="font-semibold text-[#8ec5eb] underline-offset-2 hover:underline">
                    Log in
                  </Link>
                </p>
              </div> */}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function ThankyouPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-white">Loading...</div>}>
      <ThankyouContent />
    </Suspense>
  );
}
