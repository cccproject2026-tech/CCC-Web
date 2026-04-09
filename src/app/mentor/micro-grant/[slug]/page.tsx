"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import MentorHeader from "@/app/Components/MentorHeader";
import MicroGrantDetailHero from "@/app/Components/Hero/MicroGrantDetailHero";
import RoadmapJumpStartBg from "@/app/Assets/roadmap-jump-start-bg.jpg";
import Mentor2 from "@/app/Assets/mentor2.png";
import { getMicroGrantByUserId, unwrapMicroGrantWithUser } from "@/app/Services/microGrand.service";
import { extractApiErrorMessage } from "@/app/Services/appointment-utils";
import type { MicroGrantWithUserResponse } from "@/app/Services/types/microgrant.types";
import {
  mentorBodyText,
  mentorMainGradient,
  mentorPageRoot,
  mentorPrimaryCta,
  mentorSecondaryCta,
  mentorSpinner,
} from "@/app/Components/mentor/mentor-theme";

function supportingDocEntry(
  doc: unknown,
  idx: number,
): { name: string; url: string } {
  if (typeof doc === "string") {
    const looksUrl = /^https?:\/\//i.test(doc);
    return { name: looksUrl ? "Document" : doc || `Document ${idx + 1}`, url: looksUrl ? doc : "#" };
  }
  if (doc && typeof doc === "object") {
    const o = doc as { name?: string; url?: string };
    return {
      name: o.name ?? `Document ${idx + 1}`,
      url: o.url && /^https?:\/\//i.test(o.url) ? o.url : "#",
    };
  }
  return { name: `Document ${idx + 1}`, url: "#" };
}

export default function MentorMicroGrantDetailPage() {
  const [activeStep, setActiveStep] = useState(1);
  const [data, setData] = useState<MicroGrantWithUserResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const params = useParams();
  const slugParam = params?.slug;
  const userId =
    typeof slugParam === "string"
      ? decodeURIComponent(slugParam)
      : Array.isArray(slugParam)
        ? decodeURIComponent(slugParam[0] ?? "")
        : "";

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      setLoadError("Missing application id in URL.");
      return;
    }

    let cancelled = false;
    (async () => {
      setLoadError(null);
      try {
        const res = await getMicroGrantByUserId(userId);
        const payload = unwrapMicroGrantWithUser(res);
        if (!cancelled) {
          setData(payload);
          if (!payload) setLoadError("Could not read application data from the server.");
        }
      } catch (err) {
        console.error("Failed to load micro grant application", err);
        if (!cancelled) {
          setData(null);
          setLoadError(extractApiErrorMessage(err));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (loading) {
    return (
      <div className={mentorPageRoot}>
        <MentorHeader showFullHeader />
        <div className={`flex flex-1 flex-col items-center justify-center gap-4 py-24 ${mentorMainGradient}`}>
          <div className={mentorSpinner} />
          <p className={mentorBodyText}>Loading application…</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={mentorPageRoot}>
        <MentorHeader showFullHeader />
        <div className={`flex flex-1 flex-col items-center justify-center gap-4 px-4 py-24 ${mentorMainGradient}`}>
          <p className="max-w-md text-center text-amber-100">
            {loadError || "Application not found or you may not have access."}
          </p>
          <Link href="/mentor/micro-grant" className={mentorPrimaryCta}>
            Back to list
          </Link>
        </div>
      </div>
    );
  }

  const formTitle =
    typeof data.application.formId === "object" && data.application.formId?.title
      ? data.application.formId.title
      : "Micro Grant Application";

  const answers = data.application.answers ?? {};
  const docsRaw = data.application.supportingDocs;
  const docsList = Array.isArray(docsRaw) ? docsRaw : [];

  const rightCard = (
    <div className="relative w-full rounded-xl border border-white/20 bg-white p-4 shadow-lg md:w-[340px]">
      <div className="absolute right-4 top-4 text-right">
        <p className="mb-1 text-xs text-gray-500">Application received on:</p>
        <p className="text-sm font-semibold text-gray-900">
          {data.application.createdAt ? new Date(data.application.createdAt).toLocaleDateString() : "—"}
        </p>
      </div>

      <div className="mt-10 flex items-start gap-3">
        <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-full">
          <Image src={Mentor2} alt="" fill className="object-cover" />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="mb-0.5 text-base font-bold text-gray-900">{data.user.email}</h3>
          <p className="text-xs capitalize text-gray-600">{data.user.role}</p>
          <div className="mt-2 flex items-center justify-between">
            <a href={`mailto:${data.user.email}`} className="text-gray-600 hover:text-gray-900">
              <i className="fa-regular fa-envelope text-sm" />
            </a>
            <span className="rounded-lg bg-[#062946] px-4 py-1.5 text-xs font-semibold text-white capitalize">
              {data.application.status}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={mentorPageRoot}>
      <MentorHeader showFullHeader />

      <div className="relative">
        <div className="pointer-events-none absolute inset-0 z-[1] bg-[linear-gradient(180deg,rgba(4,31,53,0.55)_0%,rgba(6,41,70,0.75)_100%)]" />
        <div className="relative z-[2]">
          <MicroGrantDetailHero
            title={formTitle}
            subtitle="Please keep in mind that the church applying for a grant must become a partner with the CCC by signing a MOU."
            backgroundImageUrl={RoadmapJumpStartBg.src}
            breadcrumbItems={[
              { label: "Micro Grant", href: "/mentor/micro-grant" },
              { label: data.user.email },
            ]}
            rightCard={rightCard}
          />
        </div>
      </div>

      <div className={`${mentorMainGradient} px-4 py-10 md:px-12 lg:px-20`}>
        <div className="mx-auto flex max-w-6xl flex-col gap-10 md:flex-row">
          <div className="flex flex-shrink-0 items-start space-x-4 md:w-1/3 lg:w-1/4">
            <div className="mt-2 flex flex-col items-center">
              {[1, 2].map((step, i) => (
                <React.Fragment key={step}>
                  <button
                    type="button"
                    onClick={() => setActiveStep(step)}
                    className={`flex h-10 w-10 items-center justify-center rounded-full border-4 font-semibold ${
                      activeStep === step
                        ? "border-[#8ec5eb] bg-[#8ec5eb]/20 text-white"
                        : "border-white/30 bg-white/10 text-[#cde2f2]"
                    }`}
                  >
                    {step}
                  </button>
                  {i === 0 && <div className="h-12 w-1 bg-[#8ec5eb]/50" />}
                </React.Fragment>
              ))}
            </div>

            <div className="space-y-4">
              <button
                type="button"
                onClick={() => setActiveStep(1)}
                className={`w-full cursor-pointer rounded-xl border px-6 py-5 text-left shadow-lg transition ${
                  activeStep === 1
                    ? "border-[#8ec5eb]/40 bg-[#0a3558]/90 text-white"
                    : "border-white/15 bg-white/5 text-[#cde2f2] hover:bg-white/10"
                }`}
              >
                <h3 className="text-xl font-semibold">Cover Sheet</h3>
                <p className="mt-1 text-sm opacity-90">Answers and supporting documents</p>
              </button>

              <button
                type="button"
                onClick={() => setActiveStep(2)}
                className={`w-full cursor-pointer rounded-xl border px-6 py-5 text-left shadow-md transition ${
                  activeStep === 2
                    ? "border-[#8ec5eb]/40 bg-[#0a3558]/90 text-white"
                    : "border-white/15 bg-white/5 text-[#cde2f2] hover:bg-white/10"
                }`}
              >
                <h3 className="font-semibold">Reporting Procedures</h3>
              </button>
            </div>
          </div>

          <div className="min-w-0 flex-1">
            {activeStep === 1 ? (
              <div className="space-y-6 rounded-2xl border border-white/15 bg-white/5 p-6 backdrop-blur-sm md:p-8">
                <p className="text-right text-sm text-amber-200/90">* Indicates required question</p>

                {Object.entries(answers).map(([label, value]) => (
                  <div key={label}>
                    <label className="mb-2 block text-sm font-semibold text-white">
                      {label} <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={String(value ?? "")}
                      readOnly
                      className="w-full rounded-lg border border-white/20 bg-white/10 p-3 text-sm text-white outline-none"
                    />
                  </div>
                ))}

                <div className="mt-6">
                  <label className="mb-4 flex items-center gap-3 text-sm font-semibold text-white">
                    <i className="fa-solid fa-cloud-arrow-up text-xl text-[#8ec5eb]" />
                    Supporting Documents
                  </label>

                  {docsList.length === 0 ? (
                    <p className={`text-sm ${mentorBodyText}`}>No documents uploaded</p>
                  ) : (
                    docsList.map((doc, idx) => {
                      const { name, url } = supportingDocEntry(doc, idx);
                      return (
                        <div
                          key={`${name}-${idx}`}
                          className="mb-3 flex items-center justify-between rounded-lg border border-white/15 bg-white/10 p-4"
                        >
                          <span className="text-sm font-semibold text-white">{name}</span>
                          {url !== "#" ? (
                            <a href={url} target="_blank" rel="noopener noreferrer" className="text-[#8ec5eb] hover:text-white">
                              <i className="fa-solid fa-download" />
                            </a>
                          ) : null}
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="mt-8 flex justify-end">
                  <button type="button" onClick={() => setActiveStep(2)} className={mentorPrimaryCta}>
                    Next
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6 rounded-2xl border border-white/15 bg-white/5 p-6 backdrop-blur-sm md:p-8">
                <ul className={`space-y-2 text-sm ${mentorBodyText}`}>
                  <li>⭐ Grant report required upon completion</li>
                  <li>⭐ Unused funds must be returned</li>
                </ul>

                <div className="mt-8 flex flex-wrap justify-between gap-3">
                  <button type="button" onClick={() => setActiveStep(1)} className={mentorSecondaryCta}>
                    Back
                  </button>
                  <Link href="/mentor/micro-grant" className={mentorSecondaryCta}>
                    Back to list
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
