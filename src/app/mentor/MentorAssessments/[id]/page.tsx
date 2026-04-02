"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import "@fortawesome/fontawesome-free/css/all.min.css";
import MentorHeader from "@/app/Components/MentorHeader";
import PastorFooter from "@/app/Components/PastorFooter";
import HeroBg from "@/app/Assets/assignments-bg.png";
import Card1 from "@/app/Assets/card1.png";
import { apiGetAssessmentById, parseAssessmentDetailPayload } from "@/app/Services/assessment.service";
import type { AssessmentResponse } from "@/app/Services/types/assessment.types";

const glassPanel =
  "rounded-2xl border border-white/15 bg-[linear-gradient(180deg,rgba(15,74,118,0.5)_0%,rgba(9,49,80,0.65)_100%)] backdrop-blur-md";

export default function MentorAssessmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : "";

  const [assessment, setAssessment] = useState<AssessmentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setError("Missing assessment id");
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await apiGetAssessmentById(id);
        const data = parseAssessmentDetailPayload(res.data);
        if (!cancelled) {
          setAssessment(data);
          if (!data) setError("Assessment not found");
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const msg =
            err && typeof err === "object" && "response" in err
              ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
              : undefined;
          setError(msg || "Could not load assessment");
          setAssessment(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const bannerSrc = assessment?.bannerImage || Card1;

  return (
    <div className="flex min-h-screen flex-col bg-[#062946] font-[Albert_Sans] text-white">
      <MentorHeader showFullHeader={true} />

      <section
        className="relative overflow-hidden bg-cover bg-center px-4 pb-10 pt-4 sm:px-8 lg:px-20"
        style={{ backgroundImage: `url(${HeroBg.src})` }}
      >
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,31,53,0.68)_0%,rgba(6,41,70,0.6)_50%,rgba(6,41,70,1)_100%)]" />

        <div className="relative z-10 mx-auto w-full max-w-4xl">
          <button
            type="button"
            onClick={() => router.push("/mentor/MentorAssessments")}
            className="mb-4 inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm text-[#cde2f2] transition hover:bg-white/15"
          >
            <i className="fa-solid fa-arrow-left" aria-hidden />
            Back to assessments
          </button>

          <h1 className="text-2xl font-semibold sm:text-3xl">Assessment</h1>
          <p className="mt-2 text-sm text-[#cde2f2]">Review structure and instructions.</p>
        </div>
      </section>

      <main className="flex-1 px-4 pb-16 sm:px-8 lg:px-20">
        <div className="mx-auto w-full max-w-4xl space-y-6">
          {loading && (
            <div className={`p-8 text-center text-[#cde2f2] ${glassPanel}`}>Loading…</div>
          )}

          {!loading && error && (
            <div className={`p-8 text-center text-red-200 ${glassPanel}`}>{error}</div>
          )}

          {!loading && assessment && (
            <>
              <div className={`overflow-hidden p-6 sm:p-8 ${glassPanel}`}>
                <div className="flex flex-col gap-6 sm:flex-row">
                  <div className="relative h-40 w-full shrink-0 overflow-hidden rounded-xl border border-white/20 sm:h-36 sm:w-52">
                    <Image
                      src={bannerSrc}
                      alt={assessment.name || "Assessment"}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, 208px"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-xl font-semibold text-white">{assessment.name}</h2>
                    {assessment.description ? (
                      <p className="mt-2 text-sm leading-relaxed text-[#cde2f2]">{assessment.description}</p>
                    ) : null}
                    {assessment.type ? (
                      <p className="mt-3 text-xs uppercase tracking-wide text-[#8ec5eb]">Type: {assessment.type}</p>
                    ) : null}
                  </div>
                </div>
              </div>

              {assessment.instructions && assessment.instructions.length > 0 ? (
                <div className={`p-6 sm:p-8 ${glassPanel}`}>
                  <h3 className="mb-4 text-lg font-semibold text-white">Instructions</h3>
                  <ul className="list-inside list-disc space-y-2 text-sm text-[#cde2f2]">
                    {assessment.instructions.map((line, i) => (
                      <li key={i}>{line}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {assessment.preSurveyQuestions && assessment.preSurveyQuestions.length > 0 ? (
                <div className={`p-6 sm:p-8 ${glassPanel}`}>
                  <h3 className="mb-4 text-lg font-semibold text-white">Pre-survey</h3>
                  <ul className="space-y-4">
                    {assessment.preSurveyQuestions.map((q, i) => (
                      <li key={q._id ?? i} className="text-sm text-[#cde2f2]">
                        <span className="font-medium text-white">{q.question}</span>
                        {q.choices?.length ? (
                          <ul className="mt-2 ml-4 list-disc text-white/80">
                            {q.choices.map((c, j) => (
                              <li key={j}>{c.label ?? (c as { text?: string }).text}</li>
                            ))}
                          </ul>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className={`p-6 sm:p-8 ${glassPanel}`}>
                <h3 className="mb-4 text-lg font-semibold text-white">Sections</h3>
                {assessment.sections?.length ? (
                  <ol className="space-y-6">
                    {assessment.sections.map((sec, si) => (
                      <li
                        key={sec._id ?? si}
                        className="rounded-xl border border-white/10 bg-white/5 p-4"
                      >
                        <p className="font-semibold text-white">
                          {si + 1}. {(sec as { name?: string; title?: string }).name ?? (sec as { title?: string }).title ?? "Section"}
                        </p>
                        {sec.description ? (
                          <p className="mt-2 text-sm text-[#cde2f2]">{sec.description}</p>
                        ) : null}
                        {sec.layers?.length ? (
                          <ul className="mt-3 space-y-2 text-sm text-[#8ec5eb]">
                            {sec.layers.map((layer, li) => (
                              <li key={layer._id ?? li}>
                                <span className="text-white/90">
                                  {(layer as { question?: string; title?: string }).question ??
                                    (layer as { title?: string }).title ??
                                    ""}
                                </span>
                                {layer.choices?.length ? (
                                  <span className="text-[#cde2f2]">
                                    {" "}
                                    ({layer.choices.length} choice{layer.choices.length === 1 ? "" : "s"})
                                  </span>
                                ) : null}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="mt-2 text-sm text-white/50">No layers</p>
                        )}
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-sm text-[#cde2f2]">No sections defined.</p>
                )}
              </div>
            </>
          )}
        </div>
      </main>

      <PastorFooter />
    </div>
  );
}
