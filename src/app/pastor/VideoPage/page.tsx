"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import sampleThumb from "../../Assets/sampleThumb.png";
import thumb1 from "../../Assets/thumb1.png";
import thumb2 from "../../Assets/thumb2.png";
import PastorHeader from "@/app/Components/PastorHeader";

const glassCard =
  "rounded-2xl border border-white/15 bg-[linear-gradient(180deg,rgba(255,255,255,0.1)_0%,rgba(255,255,255,0.04)_100%)] backdrop-blur-xl shadow-[0_8px_40px_rgba(3,24,43,0.35)]";

export default function VideoPage() {
  const router = useRouter();

  const videos = [
    {
      id: 1,
      title: "Center for Community Change",
      desc: "Interested in receiving mentoring in community engagement",
      duration: "18:00 Min",
      thumb: thumb1,
      date: "20 Oct 2024",
    },
    {
      id: 2,
      title: "Center for Community Change",
      desc: "Interested in receiving mentoring in community engagement",
      duration: "18:00 Min",
      thumb: thumb2,
    },
    {
      id: 3,
      title: "Center for Community Change",
      desc: "Interested in receiving mentoring in community engagement",
      duration: "18:00 Min",
      thumb: thumb2,
    },
  ];

  return (
    <div className="relative min-h-screen bg-transparent font-[Albert_Sans] text-white">
      <PastorHeader />

      <main className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(2,20,38,0.2)] backdrop-blur-sm transition hover:bg-white/20"
          >
            <i className="fa-solid fa-arrow-left text-xs" />
            Back
          </button>
          <p className="hidden text-sm text-[#cde2f2] sm:block">CCC video library</p>
        </div>

        <div className="flex flex-col gap-10 lg:flex-row-reverse lg:gap-8">
          <div className="min-w-0 flex-1">
            <div
              className={`overflow-hidden rounded-3xl border border-white/15 p-1 ${glassCard}`}
            >
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/20">
                <video
                  controls
                  className="aspect-video w-full max-h-[min(70vh,520px)] object-cover"
                  poster={sampleThumb.src}
                >
                  <source src="/videos/sample.mp4" type="video/mp4" />
                </video>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-4 backdrop-blur-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8ec5eb]">
                Featured
              </p>
              <h1 className="mt-2 text-xl font-semibold text-white sm:text-2xl">
                Center for Community Change
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-[#cde2f2]">
                Interested in receiving mentoring in community engagement
              </p>
            </div>
          </div>

          <aside className="flex w-full flex-col gap-4 lg:w-[360px] lg:shrink-0">
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#8ec5eb]">
              More videos
            </h2>
            {videos.map((v, idx) => (
              <button
                key={v.id ?? idx}
                type="button"
                className={`group w-full overflow-hidden text-left text-white transition hover:border-[#8ec5eb]/40 ${glassCard} hover:-translate-y-0.5`}
              >
                <div className="relative">
                  <Image
                    src={v.thumb}
                    alt={v.title}
                    className="h-[132px] w-full object-cover transition group-hover:opacity-95"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-[#041f35]/25 transition group-hover:bg-[#041f35]/15">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-[#0f4a76] shadow-lg transition group-hover:scale-105">
                      <i className="fa-solid fa-play pl-0.5 text-sm" />
                    </span>
                  </div>
                  {v.date ? (
                    <div className="absolute bottom-2 left-2 rounded-md bg-[#062946]/90 px-2 py-0.5 text-[11px] font-medium text-[#cde2f2] backdrop-blur-sm">
                      {v.date}
                    </div>
                  ) : null}
                </div>

                <div className="border-t border-white/10 p-4">
                  <p className="text-xs font-semibold text-[#8ec5eb]">Introduction</p>
                  <h3 className="mt-1 text-sm font-semibold leading-snug text-white">{v.title}</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-[#cde2f2]/90">{v.desc}</p>

                  <div className="mt-3 flex items-center justify-between text-xs text-[#b7d2e6]">
                    <span>{v.duration}</span>
                    <span
                      className="inline-flex rounded-md border border-white/20 p-1.5 text-[#8ec5eb] transition group-hover:border-[#8ec5eb]/50 group-hover:bg-white/10"
                      aria-hidden
                    >
                      <i className="fa-solid fa-arrow-up-right-from-square text-[10px]" />
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </aside>
        </div>
      </main>
    </div>
  );
}
