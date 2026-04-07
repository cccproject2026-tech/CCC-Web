"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import PastorHeader from "@/app/Components/PastorHeader";
import HeroBg from "@/app/Assets/jumpstart-hero.png";

export default function MentoringRoadmapPage() {
  const router = useRouter();

  useEffect(() => {
    // Keep this route functional by forwarding to the primary roadmap flow.
    router.replace("/pastor/revitalization-roadmap");
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col bg-[#062946] text-white font-[Albert_Sans]">
      <PastorHeader showFullHeader={true} />

      <section
        className="relative flex h-[320px] flex-col justify-end bg-cover bg-center px-6 pb-10 text-white md:px-12 lg:px-20"
        style={{ backgroundImage: `url(${HeroBg.src})` }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_10%,rgba(141,211,243,0.22),transparent_36%),linear-gradient(180deg,rgba(4,31,53,0.82)_0%,rgba(6,41,70,0.9)_100%)]"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-semibold mb-1">Mentoring Roadmap</h1>
          <p className="text-white/70 text-sm">Redirecting to roadmap...</p>
        </div>
      </section>

      <main className="flex-1 bg-[radial-gradient(circle_at_18%_8%,rgba(141,211,243,0.24),transparent_34%),radial-gradient(circle_at_82%_22%,rgba(245,204,118,0.18),transparent_35%),linear-gradient(180deg,#041f35_0%,#062946_100%)] px-4 py-12 pb-24 md:px-10 lg:px-16 flex items-center justify-center">
        <div className="rounded-2xl border border-white/15 bg-white/5 px-6 py-5 text-sm text-[#cde2f2]">
          If you are not redirected automatically,{" "}
          <button
            type="button"
            onClick={() => router.push("/pastor/revitalization-roadmap")}
            className="text-white underline underline-offset-2"
          >
            open Revitalization Roadmap
          </button>
          .
        </div>
      </main>

    </div>
  );
}
