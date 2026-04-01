"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import PastorHeader from "@/app/Components/PastorHeader";

export default function ChooseRolePage() {
  const router = useRouter();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const roles = [
    {
      id: "pastor",
      name: "Pastor",
      tag: "CHURCH LEADERSHIP",
      badgeColor: "bg-[#27b1ff33] text-[#47c0ff]",
      iconColor: "bg-[#1c8fca33] text-[#56cbff]",
      desc: "Guide your church in meaningful community impact through proven ministry methods.",
      points: [
        "Community assessment tools",
        "Ministry roadmap and guidance",
        "Progress tracking and reports",
      ],
      ctaClass: "bg-[#0f4a76] hover:bg-[#0c3f66]",
      loginPath: "/pastor/login",
      interestPath: "/pastor/InterestForm",
    },
    {
      id: "mentor",
      name: "Mentor",
      tag: "LEADER DEVELOPMENT",
      badgeColor: "bg-[#8e63ff33] text-[#bc9eff]",
      iconColor: "bg-[#7b57ff33] text-[#bfabff]",
      desc: "Coach and support leaders as they grow in their community ministry journey.",
      points: [
        "Mentee management dashboard",
        "Schedule appointments easily",
        "Track leader development",
      ],
      ctaClass: "bg-[#0f4a76] hover:bg-[#0c3f66]",
      loginPath: "/mentor/login",
      interestPath: "/pastor/InterestForm",
    },
  ];

  const handleNavigate = (path: string, message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 1800);
    setTimeout(() => router.push(path), 350);
  };

  return (
    <div className="min-h-screen bg-[#062946] pt-0 text-white font-[Albert_Sans]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_8%,rgba(141,211,243,0.24),transparent_34%),radial-gradient(circle_at_82%_22%,rgba(245,204,118,0.18),transparent_35%),radial-gradient(circle_at_48%_56%,rgba(111,178,246,0.12),transparent_42%),radial-gradient(circle_at_90%_80%,rgba(8,52,85,0.4),transparent_40%),linear-gradient(180deg,#041f35_0%,#062946_100%)]" />
      <div className="relative z-10 left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen">
        <PastorHeader />
      </div>
      <div className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-12 pt-8">
        <section className="mx-auto">
          <header className="text-center">
            <h1 className="text-4xl font-bold leading-tight text-white md:text-5xl">
              Select your <span className="text-[#8a93ff]">role</span>
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-base text-[#b7cde0] md:text-lg">
              Choose how you&apos;d like to engage with the Center for Community Change
            </p>
          </header>

          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {roles.map((role, idx) => (
              <article
                key={role.id}
                className="role-card relative overflow-hidden rounded-3xl border border-[#2a4f77] bg-[linear-gradient(180deg,rgba(19,46,84,0.92)_0%,rgba(17,41,76,0.95)_100%)] shadow-[0_18px_36px_rgba(1,16,34,0.4)]"
                style={{ animationDelay: `${idx * 120}ms` }}
              >
                <div className="p-5 md:p-6">
                  <div className="flex items-center justify-between">
                    <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 ${role.iconColor}`}>
                      <i
                        className={`fa-solid ${
                          role.id === "pastor" ? "fa-book-open" : "fa-user-group"
                        }`}
                      />
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${role.badgeColor}`}>
                      Active
                    </span>
                  </div>

                  <div className="mt-4">
                    <h2 className="text-3xl font-bold text-white">{role.name}</h2>
                    <p className="mt-1 text-base font-semibold tracking-wide text-[#7f9cb5]">
                      {role.tag}
                    </p>
                    <p className="mt-4 text-base leading-7 text-[#b5c8d8]">{role.desc}</p>
                  </div>

                  <ul className="mt-5 space-y-2">
                    {role.points.map((point) => (
                      <li key={point} className="flex items-center gap-2.5 text-base text-[#b5c8d8]">
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#29aefc33] text-[#3bc2ff]">
                          <i className="fa-solid fa-check text-[10px]" />
                        </span>
                        {point}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-6 grid grid-cols-1 gap-2">
                    <button
                      type="button"
                      onClick={() => handleNavigate(role.loginPath, `Opening ${role.name} login...`)}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-base font-semibold text-[#0f4a76] shadow-[0_8px_20px_rgba(0,0,0,0.3)] transition hover:bg-[#e7f1fa]"
                    >
                      Login as {role.name}
                      <i className="fa-solid fa-chevron-right text-sm" />
                    </button>
                    {role.interestPath ? (
                      <button
                        type="button"
                        onClick={() =>
                          handleNavigate(role.interestPath!, `Opening ${role.name} interest form...`)
                        }
                        className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-base font-semibold text-white shadow-[0_8px_20px_rgba(0,0,0,0.3)] transition ${role.ctaClass}`}
                      >
                        Submit Interest
                        <i className="fa-solid fa-chevron-right text-sm" />
                      </button>
                    ) : null}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>

      {toastMessage && (
        <div className="fixed left-1/2 top-20 z-[70] -translate-x-1/2 rounded-lg border border-white/20 bg-[#0a3558] px-4 py-3 text-sm text-white shadow-[0_12px_28px_rgba(2,20,38,0.45)]">
          {toastMessage}
        </div>
      )}

      <style jsx>{`
        .role-card {
          animation: cardFade 550ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        @keyframes cardFade {
          from {
            opacity: 0;
            transform: translateY(18px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .role-card {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
