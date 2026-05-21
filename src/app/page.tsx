"use client";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import PastorHeader from "@/app/Components/PastorHeader";
import ContinueApplicationModal from "@/app/Components/ContinueApplicationModal";
import Book from "@/app/Assets/book.png";

type ModalMode = "login" | "interest" | "continue" | null;

export default function LandingPage() {
  const router = useRouter();
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // const isChooseModalOpen = modalMode !== null;
  const isChooseModalOpen = modalMode === "login" || modalMode === "interest";

  const roles = [
    {
      id: "pastor",
      title: "Pastor",
      subtitle: "Church Leadership",
      description: "Guide your church in meaningful community impact through proven ministry methods.",
      loginPath: "/pastor/login",
      interestPath: "/pastor/InterestForm?role=pastor",
    },
    {
      id: "mentor",
      title: "Mentor",
      subtitle: "Leader Development",
      description: "Coach and support leaders as they grow in their community ministry journey.",
      loginPath: "/mentor/login",
      interestPath: "/pastor/InterestForm?role=mentor",
    },
  ];

  const videos = [
    {
      title: "Center for Community Change",
      description: "Discover how CCC supports leaders in practical ministry impact.",
      duration: "18:00 min",
    },
    {
      title: "Center for Community Change",
      description: "See how mentorship and guidance drive lasting community transformation.",
      duration: "15:30 min",
    },
    {
      title: "Center for Community Change",
      description: "Explore the journey from calling to measurable local impact.",
      duration: "12:40 min",
    },
  ];

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 1800);
  };

  const handleNavigate = (path: string, message: string) => {
    showToast(message);
    setTimeout(() => {
      router.push(path);
    }, 350);
  };
  return (
    <div className="min-h-screen bg-[#062946] text-white font-[Albert_Sans]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_8%,rgba(141,211,243,0.24),transparent_34%),radial-gradient(circle_at_82%_22%,rgba(245,204,118,0.18),transparent_35%),radial-gradient(circle_at_48%_56%,rgba(111,178,246,0.12),transparent_42%),radial-gradient(circle_at_90%_80%,rgba(8,52,85,0.4),transparent_40%),linear-gradient(180deg,#041f35_0%,#062946_100%)]" />
      <div className="pointer-events-none absolute left-[12%] top-[14%] h-24 w-24 rounded-full bg-[#8fd3ff33] blur-2xl animate-floatSlow" />
      <div className="pointer-events-none absolute right-[14%] top-[28%] h-20 w-20 rounded-full bg-[#f5cc7640] blur-2xl animate-floatFast" />
      <div className="pointer-events-none absolute bottom-[18%] left-[42%] h-20 w-20 rounded-full bg-[#72b7ff2e] blur-2xl animate-floatSlow" />
      <div className="pointer-events-none absolute right-[30%] top-[12%] h-56 w-56 rounded-full bg-[#8fd3ff1f] blur-[90px]" />
      <div className="pointer-events-none absolute left-[30%] bottom-[20%] h-64 w-64 rounded-full bg-[#174d7f45] blur-[110px]" />

      <PastorHeader />

      <main id="home" className="relative z-10">
        <section className="mx-auto w-full max-w-7xl px-6 pb-20 pt-16 lg:px-8 lg:pt-24">
          <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="animate-fadeInUp">
              <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-[#cde2f2] shadow-[0_6px_16px_rgba(2,20,38,0.25)]">
                <span className="h-2 w-2 rounded-full bg-[#f5cc76]" />
                Community. Revitalization. Change.
              </p>
              <h1 className="mt-6 max-w-3xl text-5xl font-semibold leading-tight lg:text-6xl">
                <span className="text-white">Grow your community impact with </span>
                <span className="text-[#8ec5eb]">guided mentorship.</span>
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-[#d2e6f5]">
                The Center for Community Change provides individualized support for pastors and
                leaders through practical frameworks, roadmap guidance, and community engagement.
              </p>

              <div className="mt-9 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => setModalMode("interest")}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-10 py-4 text-base font-semibold text-[#1f4f7d] shadow-[0_14px_30px_rgba(0,0,0,0.28)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#e7f1fa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#062946]"
                >
                  Get Started
                  <i className="fa-solid fa-arrow-right text-sm" />
                </button>
                <button
                  type="button"
                  onClick={() => setModalMode("login")}
                  className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-8 py-4 text-base font-semibold text-white shadow-[0_10px_24px_rgba(0,0,0,0.2)] backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8ec5eb] focus-visible:ring-offset-2 focus-visible:ring-offset-[#062946]"
                >
                  Login
                  <i className="fa-solid fa-right-to-bracket text-sm" />
                </button>
                <button
                  type="button"
                  onClick={() => setModalMode("continue")}
                  className="inline-flex items-center gap-2 rounded-full border border-[#8ec5eb]/40 bg-[#8ec5eb]/10 px-8 py-4 text-base font-semibold text-[#d7efff] shadow-[0_10px_24px_rgba(0,0,0,0.2)] backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#8ec5eb]/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8ec5eb] focus-visible:ring-offset-2 focus-visible:ring-offset-[#062946]"
                >
                  Continue Application
                  <i className="fa-solid fa-clipboard-check text-sm" />
                </button>
              </div>
              <p className="mt-3 text-sm text-[#cde2f2]">
                New here? Use <span className="font-semibold text-white">Get Started</span> to submit interest. Returning? Use{" "}
                <span className="font-semibold text-white">Login</span>.
              </p>
            </div>

            <div className="animate-fadeInUpDelay relative overflow-hidden rounded-3xl border border-white/20 bg-[linear-gradient(180deg,rgba(255,255,255,0.16)_0%,rgba(255,255,255,0.08)_100%)] p-7 shadow-[0_24px_56px_rgba(3,24,43,0.38)] backdrop-blur">
              <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-white/10 blur-3xl" />
              <div className="pointer-events-none absolute -left-10 bottom-6 h-24 w-24 rounded-full bg-[#8fd3ff1f] blur-2xl" />
              <p className="text-sm font-semibold text-[#d7e9f8]">At a glance</p>
              <div className="mt-4 space-y-3">
                <div className="rounded-xl border border-white/10 bg-[#0a3558] p-4 transition-transform duration-300 hover:-translate-y-0.5">
                  <p className="text-2xl font-semibold text-white">500+</p>
                  <p className="mt-1 text-sm text-[#cde2f2]">Pastors and leaders engaging in transformation</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-[#0a3558] p-4 transition-transform duration-300 hover:-translate-y-0.5">
                  <p className="text-2xl font-semibold text-white">Mentorship</p>
                  <p className="mt-1 text-sm text-[#cde2f2]">Contextual guidance for church and community revitalization</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="videos-section" className="mx-auto w-full max-w-7xl px-6 pb-20 lg:px-8">
          <div className="grid gap-10 border-t border-white/10 pt-14 lg:grid-cols-2 lg:gap-14">
            <div className="lg:border-r lg:border-white/10 lg:pr-10">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-white/20 bg-white/10">
                <i className="fa-solid fa-magnifying-glass text-xl text-[#92cdf5]" />
              </div>
              <p className="text-xl text-[#cde2f2]">We will guide you</p>
              <h3 className="mt-2 text-5xl font-semibold leading-tight">
                to lead with <span className="text-[#f5cc76]">purpose</span>
              </h3>
              <p className="mt-2 text-lg text-[#d2e6f5]">to grow your impact.</p>
              <div className="mt-8 space-y-3">
                <div className="rounded-2xl border border-white/15 bg-[#0a3558] p-4">
                  <p className="text-[#f5cc76] font-semibold">01</p>
                  <p className="font-semibold">Understand your community</p>
                  <p className="text-sm text-[#cde2f2]">Discover the needs and strengths of those around you.</p>
                </div>
                <div className="rounded-2xl border border-white/15 bg-[#0a3558] p-4">
                  <p className="text-[#f5cc76] font-semibold">02</p>
                  <p className="font-semibold">Build relationships</p>
                  <p className="text-sm text-[#cde2f2]">Foster meaningful connections rooted in Christ&apos;s love.</p>
                </div>
                <div className="rounded-2xl border border-white/15 bg-[#0a3558] p-4">
                  <p className="text-[#f5cc76] font-semibold">03</p>
                  <p className="font-semibold">Serve with purpose</p>
                  <p className="text-sm text-[#cde2f2]">Lead impactful outreach that transforms lives.</p>
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold tracking-[0.24em] text-[#f5cc76]">HOW IT WORKS</p>
              <h3 className="mt-3 text-5xl font-semibold leading-tight">
                Your journey is <span className="text-[#6dbbff]">simple.</span>
              </h3>
              <p className="mt-3 text-lg text-[#cde2f2]">
                Three practices that will shape your impact as a leader.
              </p>
              <div className="mt-8 space-y-3">
                <div className="rounded-2xl border border-white/15 bg-[#0a3558] p-4">
                  <p className="text-[#f5cc76] font-semibold">01</p>
                  <p className="font-semibold">Follow small steps</p>
                  <p className="text-sm text-[#cde2f2]">Complete bite-sized tasks assigned to you for your growth.</p>
                </div>
                <div className="rounded-2xl border border-white/15 bg-[#0a3558] p-4">
                  <p className="text-[#f5cc76] font-semibold">02</p>
                  <p className="font-semibold">Talk to your mentor</p>
                  <p className="text-sm text-[#cde2f2]">Connect regularly for guidance and support.</p>
                </div>
                <div className="rounded-2xl border border-white/15 bg-[#0a3558] p-4">
                  <p className="text-[#f5cc76] font-semibold">03</p>
                  <p className="font-semibold">Take action in your community</p>
                  <p className="text-sm text-[#cde2f2]">Put to action what you learned as the Holy Spirit guides you.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 pt-14">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-xs font-semibold tracking-[0.24em] text-[#f5cc76]">WHAT WE DO</p>
              <h3 className="mt-3 text-4xl font-semibold leading-tight text-white lg:text-5xl">
                Learn more about <span className="text-[#6dbbff]">CCC</span>
              </h3>
              <p className="mt-3 text-base text-[#cde2f2] lg:text-lg">
                Three quick videos to understand the mission, method, and journey.
              </p>
            </div>

            <div className="mx-auto mt-10 grid max-w-6xl gap-6 md:grid-cols-3">
              {videos.map((video, index) => (
                <article
                  key={`${video.title}-${index}`}
                  className="overflow-hidden rounded-2xl border border-white/15 bg-[#0a3558] shadow-[0_14px_32px_rgba(3,24,43,0.36)]"
                >
                  <div className="relative">
                    <Image src={Book} alt={video.title} className="h-[180px] w-full object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Link
                        href="/pastor/VideoPage"
                        className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-[#0f4a76] transition hover:scale-105"
                        aria-label={`Play ${video.title}`}
                      >
                        <i className="fa-solid fa-play text-sm" />
                      </Link>
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-xs font-semibold text-[#8ec5eb]">Introduction</p>
                    <h4 className="mt-1 text-base font-semibold text-white">{video.title}</h4>
                    <p className="mt-1 text-sm text-[#cde2f2]">{video.description}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs text-[#b7d2e6]">{video.duration}</span>
                      <Link
                        href="/pastor/VideoPage"
                        className="inline-flex items-center justify-center rounded-md border border-white/30 p-2 text-white transition hover:bg-white/10"
                        aria-label={`Open ${video.title}`}
                      >
                        <i className="fa-solid fa-arrow-up-right-from-square text-[10px]" />
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
      <ContinueApplicationModal
        isOpen={modalMode === "continue"}
        onClose={() => setModalMode(null)}
      />
      {isChooseModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[radial-gradient(circle_at_20%_15%,rgba(120,186,232,0.2),transparent_40%),rgba(2,16,30,0.72)] px-4 backdrop-blur-md"
          onClick={() => setModalMode(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-5xl rounded-3xl border border-white/20 bg-[linear-gradient(180deg,rgba(12,58,95,0.96)_0%,rgba(8,46,78,0.96)_100%)] p-6 text-white shadow-[0_30px_80px_rgba(2,20,38,0.56)] sm:p-8"
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-3xl font-semibold tracking-tight text-white">
                  {modalMode === "interest" ? "Submit your interest" : "Sign in"}
                </h2>
                <p className="mt-2 text-sm text-[#d4e8f6]">
                  {modalMode === "interest"
                    ? "Choose Pastor or Mentor to open the interest form for that path."
                    : "Choose Pastor or Mentor to open the matching login page."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalMode(null)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white/80 transition hover:bg-white/20 hover:text-white"
                aria-label="Close role selection"
              >
                <i className="fa-solid fa-xmark text-xl" />
              </button>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              {roles.map((role) => {
                const isInterest = modalMode === "interest";
                const targetPath = isInterest ? role.interestPath : role.loginPath;
                const toast = isInterest
                  ? `Opening ${role.title} interest form...`
                  : `Opening ${role.title} sign-in...`;
                const cta = isInterest ? "Continue to submit interest" : "Continue to sign in";

                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => handleNavigate(targetPath, toast)}
                    className="group w-full rounded-2xl border border-white/15 bg-[linear-gradient(180deg,rgba(15,67,107,0.72)_0%,rgba(10,53,88,0.72)_100%)] p-6 text-left shadow-[0_14px_32px_rgba(2,20,38,0.38)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#8ec5eb66] hover:shadow-[0_20px_40px_rgba(2,20,38,0.5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8ec5eb] focus-visible:ring-offset-2 focus-visible:ring-offset-[#082a47]"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9bd2f5]">{role.subtitle}</p>
                    <h3 className="mt-2 text-3xl font-semibold text-white">{role.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-[#d4e8f6]">{role.description}</p>
                    <p className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#8ec5eb] transition group-hover:text-white">
                      {cta}
                      <i className="fa-solid fa-arrow-right text-xs transition group-hover:translate-x-0.5" />
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {toastMessage && (
        <div className="fixed left-1/2 top-20 z-[70] -translate-x-1/2 rounded-lg border border-white/20 bg-[#0a3558] px-4 py-3 text-sm text-white shadow-[0_12px_28px_rgba(2,20,38,0.45)]">
          {toastMessage}
        </div>
      )}

      <style jsx>{`
        .animate-fadeInUp {
          animation: fadeInUp 850ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .animate-fadeInUpDelay {
          animation: fadeInUp 1150ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .animate-floatSlow {
          animation: floatSlow 6s ease-in-out infinite;
        }
        .animate-floatFast {
          animation: floatFast 4.2s ease-in-out infinite;
        }
        @keyframes fadeInUp {
          0% {
            opacity: 0;
            transform: translateY(26px) scale(0.98);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes floatSlow {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-14px);
          }
        }
        @keyframes floatFast {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-11px);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-fadeInUp,
          .animate-fadeInUpDelay,
          .animate-floatSlow,
          .animate-floatFast {
            animation: none !important;
            transform: none !important;
          }
        }
      `}</style>
    </div>
  );
}
