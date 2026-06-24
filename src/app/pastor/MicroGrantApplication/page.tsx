

"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import "@fortawesome/fontawesome-free/css/all.min.css";
import HeroBg from "@/app/Assets/jumpstart-hero.png";
import PastorHeader from "@/app/Components/PastorHeader";
import { getCookie } from "@/app/utils/cookies";
import { getPastorUserId } from "@/app/utils/pastor-auth";
import { addNotification } from "@/app/Services/api";
import {
  applyMicroGrant,
  getMicroGrantForm,
  getMicroGrantByUserId,
  unwrapMicroGrantWithUser,
  normalizeMicroGrantSupportingDocs,
} from "@/app/Services/microGrand.service";
import type { MicroGrantWithUserResponse } from "@/app/Services/types/microgrant.types";

const QUESTION_LABELS = [
  "Name of the church",
  "Name of the project/program",
  "Who does the project/program serve and why is it important?",
  "Amount requested",
  "Project amount of denominational support (Local Conference, Union, NAD, GC, etc.)",
  "What action steps will you take to achieve your goals?",
  "What resources do you already have?",
  "Who will be leading and overseeing the project/program, and what are their qualifications?",
  "What are the measurable markers of your success?",
] as const;



type QuestionKey = (typeof QUESTION_LABELS)[number];
const TEXTAREA_QUESTION_LABELS = new Set<QuestionKey>([
  "Who does the project/program serve and why is it important?",
  "What action steps will you take to achieve your goals?",
  "What resources do you already have?",

  "What are the measurable markers of your success?",
]);
const REPORTING_CONFIRMATION_KEYS = {
  reviewed: "Reporting Procedures - Reviewed",
  uploadsIncluded: "Reporting Procedures - Uploads Included",
  other: "Other",
} as const;
const REPORTING_SECOND_LABEL =
  "I have filled out the application, and I would like to discuss it with a center's director";
type AnswersState = Record<QuestionKey, string>;

const initialAnswers: AnswersState = {
  "Name of the church": "",
  "Name of the project/program": "",
  "Who does the project/program serve and why is it important?": "",
  "Amount requested": "",
  "Project amount of denominational support (Local Conference, Union, NAD, GC, etc.)": "",
  "What action steps will you take to achieve your goals?": "",
  "What resources do you already have?": "",
  "Who will be leading and overseeing the project/program, and what are their qualifications?": "",
  "What are the measurable markers of your success?": "",
};

function formatStatus(status?: string) {
  if (!status) return "Unknown";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function getStatusClasses(status?: string) {
  const s = (status || "").toLowerCase();

  if (s === "accepted") {
    return "bg-green-100 text-green-700 border border-green-200";
  }
  if (s === "rejected") {
    return "bg-red-100 text-red-700 border border-red-200";
  }
  if (s === "pending") {
    return "bg-yellow-100 text-yellow-700 border border-yellow-200";
  }
  return "bg-blue-100 text-blue-700 border border-blue-200";
}

function getPastorDisplayName(): string {
  try {
    const raw = getCookie("user");
    if (!raw) return "Pastor";
    const user = JSON.parse(raw) as {
      firstName?: string;
      lastName?: string;
      name?: string;
      username?: string;
      email?: string;
    };
    return (
      `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
      user.name ||
      user.username ||
      user.email ||
      "Pastor"
    );
  } catch {
    return "Pastor";
  }
}

export default function MicroGrantApplicationPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"Cover Sheet" | "Reporting Procedures">("Cover Sheet");
  const [answers, setAnswers] = useState<AnswersState>(initialAnswers);
  const [supportingDocs, setSupportingDocs] = useState<File[]>([]);
  const [confirmations, setConfirmations] = useState({
    reviewed: false,
    uploadsIncluded: false,
  });
  const [otherNote, setOtherNote] = useState("");
  const [formId, setFormId] = useState("");
  const [loadingForm, setLoadingForm] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [hasApplied, setHasApplied] = useState(false);
  const [applicationData, setApplicationData] = useState<MicroGrantWithUserResponse | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadPage() {
      try {
        setLoadingForm(true);
        setErrorMsg("");
        setSuccessMsg("");

        const userId = getPastorUserId();

        if (!userId) {
          throw new Error("Pastor user id not found");
        }

        try {
          const appRes = await getMicroGrantByUserId(userId);
          const appPayload = unwrapMicroGrantWithUser(appRes);

          if (!cancelled && appPayload && appPayload.application) {
            setApplicationData(appPayload);
            setHasApplied(true);
            setLoadingForm(false);
            return;
          }
        } catch (appError: unknown) {
          const status =
            typeof appError === "object" &&
            appError !== null &&
            "response" in appError &&
            typeof (appError as { response?: { status?: number } }).response?.status === "number"
              ? (appError as { response?: { status?: number } }).response?.status
              : undefined;

          if (status !== 404) {
            console.log("Application lookup fallback to form load", appError);
          }
        }

        const formRes = await getMicroGrantForm();
        const id = formRes?.data?.data?._id;

        if (!cancelled) {
          if (id) {
            setFormId(id);
            setHasApplied(false);
          } else {
            setErrorMsg("Micro Grant form id was not returned by the server.");
          }
        }
      } catch (error) {
        console.error("Failed to load micro grant page", error);
        if (!cancelled) {
          setErrorMsg("Could not load micro grant. Please try again.");
        }
      } finally {
        if (!cancelled) {
          setLoadingForm(false);
        }
      }
    }

    loadPage();

    return () => {
      cancelled = true;
    };
  }, []);

  const isCoverSheetValid = useMemo(() => {
    return QUESTION_LABELS.every((label) => answers[label].trim() !== "");
  }, [answers]);

  const canSubmit =
    !loadingForm &&
    !!formId &&
    isCoverSheetValid &&
    confirmations.reviewed &&
    !submitting;

  const handleAnswerChange = (label: QuestionKey, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [label]: value,
    }));
  };

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSupportingDocs(files);
  };

  const handleClear = () => {
    setAnswers(initialAnswers);
    setSupportingDocs([]);
    setConfirmations({
      reviewed: false,
      uploadsIncluded: false,
    });
    setOtherNote("");
    setErrorMsg("");
    setSuccessMsg("");
  };

  const goNext = () => {
    setErrorMsg("");
    setSuccessMsg("");

    if (!isCoverSheetValid) {
      setErrorMsg("Please fill all required fields before continuing.");
      return;
    }

    setActiveTab("Reporting Procedures");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setErrorMsg("");
    setSuccessMsg("");

    const userId = getPastorUserId();

    if (!userId) {
      setErrorMsg("Pastor user id not found. Please log in again.");
      return;
    }

    if (!formId) {
      setErrorMsg("Form id is missing. Please refresh and try again.");
      return;
    }

    if (!isCoverSheetValid) {
      setErrorMsg("Please complete all required cover sheet fields.");
      setActiveTab("Cover Sheet");
      return;
    }

    if (!confirmations.reviewed) {
      setErrorMsg("Please complete the required confirmation before submitting.");
      return;
    }

    try {
      setSubmitting(true);

      const payloadAnswers: Record<string, string> = {
        ...answers,
      };

      payloadAnswers[REPORTING_CONFIRMATION_KEYS.reviewed] = confirmations.reviewed ? "Checked" : "Not checked";
      payloadAnswers[REPORTING_CONFIRMATION_KEYS.uploadsIncluded] = confirmations.uploadsIncluded ? "Checked" : "Not checked";

      if (otherNote.trim()) {
        payloadAnswers[REPORTING_CONFIRMATION_KEYS.other] = otherNote.trim();
      }

      await applyMicroGrant(
        userId,
        formId,
        payloadAnswers,
        supportingDocs.length > 0 ? supportingDocs : undefined
      );

      setSuccessMsg("Micro Grant application submitted successfully.");

      const pastorName = getPastorDisplayName();
      const notificationJobs = [
        addNotification({
          name: "Micro Grant Application Received",
          details: `Micro grant application received from ${pastorName}.`,
          module: "microgrant",
          role: "director",
        }),
      ];

      const notificationResults = await Promise.allSettled(notificationJobs);
      notificationResults.forEach((result, index) => {
        if (result.status === "rejected") {
          console.warn("Micro Grant notification director failed", result.reason);
        }
      });

      const appRes = await getMicroGrantByUserId(userId);
      const appPayload = unwrapMicroGrantWithUser(appRes);

      if (appPayload && appPayload.application) {
        setApplicationData(appPayload);
        setHasApplied(true);
      }

      handleClear();
      setActiveTab("Cover Sheet");
    } catch (error: unknown) {
      console.error("Micro Grant submit failed", error);

      const message =
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof (error as { response?: { data?: { message?: string } } }).response?.data?.message === "string"
          ? (error as { response?: { data?: { message?: string } } }).response!.data!.message!
          : "Failed to submit Micro Grant application.";

      setErrorMsg(message);
    } finally {
      setSubmitting(false);
    }
  };

  const submittedAnswers = applicationData?.application?.answers || {};
  const submittedDocs = normalizeMicroGrantSupportingDocs(
    applicationData?.application?.supportingDocs
  );

  return (
    <div className="min-h-screen flex flex-col bg-[radial-gradient(circle_at_20%_10%,rgba(141,211,243,0.18),transparent_35%),linear-gradient(180deg,#041f35_0%,#062946_100%)] text-white">
      <PastorHeader showFullHeader={true} />

      <section
        className="relative h-[300px] bg-cover bg-center flex flex-col justify-end"
        style={{ backgroundImage: `url(${HeroBg.src})` }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_12%,rgba(141,211,243,0.2),transparent_35%),linear-gradient(180deg,rgba(4,31,53,0.74)_0%,rgba(6,41,70,0.9)_100%)]" />
        <div className="relative z-10 px-16 pb-10">
          <h1 className="text-3xl font-semibold mb-3">
            The Center for Community Change Micro-Grant Application
          </h1>
          <p className="text-sm text-white/80 max-w-3xl">
            Please keep in mind that the church applying for a grant must become
            a partner with the CCC by signing a MOU.
          </p>
        </div>
      </section>

      <main className="flex-1 bg-transparent px-4 py-12 md:px-8 lg:px-16">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-10">
          {!hasApplied ? (
            <>
              <aside className="relative w-full rounded-2xl border border-white/15 bg-[linear-gradient(180deg,rgba(12,58,95,0.9)_0%,rgba(10,53,88,0.95)_100%)] p-4 lg:w-[300px]">
                <div className="absolute left-[22px] top-[45px] bottom-[45px] w-[3px] h-[40px] bg-[#41B36E]" />
                <div className="flex flex-col gap-3 relative z-10">
                  {["Cover Sheet", "Reporting Procedures"].map((tab, index) => (
                    <div
                      key={tab}
                      onClick={() =>
                        setActiveTab(tab as "Cover Sheet" | "Reporting Procedures")
                      }
                      className={`flex items-center gap-4 cursor-pointer rounded-lg px-4 py-3 transition-all ${
                        activeTab === tab
                          ? "bg-[#8ec5eb]/20 text-white border border-[#8ec5eb]/40"
                          : "bg-white/5 text-[#d9ebf8] border border-white/10 hover:bg-white/10"
                      }`}
                    >
                      <div
                        className={`w-7 h-7 flex items-center justify-center rounded-full border-2 ${
                          activeTab === tab
                            ? "bg-[#41B36E] border-[#3A9F62] text-white"
                            : "bg-transparent border-[#8ec5eb]/70 text-[#8ec5eb]"
                        } text-sm font-semibold`}
                      >
                        {index + 1}
                      </div>

                      <div className="flex flex-col">
                        <span className="text-sm font-semibold">{tab}</span>
                        {tab === "Cover Sheet" && (
                          <p
                            className={`text-xs ${
                              activeTab === tab ? "text-white/80" : "text-[#cde2f2]"
                            }`}
                          >
                            Please answer the questions succinctly following prompts
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </aside>

              <section className="flex-1 rounded-2xl border border-white/15 bg-[linear-gradient(180deg,rgba(12,58,95,0.9)_0%,rgba(10,53,88,0.95)_100%)] p-6 text-white md:p-8">
                {errorMsg ? (
                  <div className="mb-5 rounded-xl border border-red-300/25 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                    {errorMsg}
                  </div>
                ) : null}

                {successMsg ? (
                  <div className="mb-5 rounded-xl border border-emerald-300/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                    {successMsg}
                  </div>
                ) : null}

                {loadingForm ? (
                  <div className="py-16 text-center text-white/80">Loading form...</div>
                ) : null}

                {!loadingForm && activeTab === "Cover Sheet" && (
                  <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                    {QUESTION_LABELS.map((label) => (
                      <div key={label} className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-white/90">
                          {label} *
                        </label>
                        {/* <input
                          type="text"
                          value={answers[label]}
                          onChange={(e) => handleAnswerChange(label, e.target.value)}
                          placeholder="Your Answer"
                          className="rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-[#cde2f2] outline-none focus:ring-2 focus:ring-[#8ec5eb]"
                        /> */}
                        {TEXTAREA_QUESTION_LABELS.has(label) ? (
  <textarea
    value={answers[label]}
    onChange={(e) => handleAnswerChange(label, e.target.value)}
    placeholder="Your Answer"
    rows={4}
    className="min-h-[120px] rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-[#cde2f2] outline-none resize-y focus:ring-2 focus:ring-[#8ec5eb]"
  />
) : (
  <input
    type="text"
    value={answers[label]}
    onChange={(e) => handleAnswerChange(label, e.target.value)}
    placeholder="Your Answer"
    className="rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-[#cde2f2] outline-none focus:ring-2 focus:ring-[#8ec5eb]"
  />
)}
                      </div>
                    ))}

                    <div className="flex flex-col gap-3 mt-8">
                      <label className="text-sm font-medium text-white/90">
                        Please upload here any supporting documents or media (photos,
                        videos, publications, etc.)
                      </label>

                      <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/20 bg-white/5 p-6 text-sm text-[#d9ebf8] transition hover:bg-white/10">
                        <i className="fa-solid fa-cloud-arrow-up mb-3 text-2xl text-[#8ec5eb]" />
                        <p className="mb-1">
                          Drag & Drop or <span className="underline">Click here</span>{" "}
                          to choose file
                        </p>
                        <p className="text-xs text-[#cde2f2]">
                          Upload up to 5 supported files. Max 10 MB per file.
                        </p>
                        <input
                          type="file"
                          multiple
                          className="hidden"
                          onChange={handleFilesChange}
                        />
                      </label>

                      {supportingDocs.length > 0 ? (
                        <div className="rounded-xl bg-white/5 p-3 text-sm text-white/90">
                          {supportingDocs.map((file, index) => (
                            <p key={`${file.name}-${index}`}>{file.name}</p>
                          ))}
                        </div>
                      ) : null}
                    </div>

                    <div className="flex justify-between items-center pt-8">
                      <button
                        type="button"
                        onClick={handleClear}
                        className="rounded-xl border border-white/30 px-6 py-2 text-sm font-medium text-[#d9ebf8] transition hover:bg-white/10"
                      >
                        Clear Form
                      </button>

                      <button
                        type="button"
                        onClick={goNext}
                        className="rounded-xl bg-[#8ec5eb] px-8 py-2 text-sm font-semibold text-[#062946] transition hover:bg-[#a9d5f2]"
                      >
                        Next
                      </button>
                    </div>
                  </form>
                )}

                {!loadingForm && activeTab === "Reporting Procedures" && (
                  <form className="space-y-8" onSubmit={handleSubmit}>
                    <div className="space-y-4 text-[14px] leading-relaxed">
                      <p>
                        <i className="fa-solid fa-circle-exclamation text-[#FFD84E] mr-2"></i>
                        If approved, you will sign a grant agreement that lays out action
                        steps. CCC may request mid-year updates and a final report upon
                        completion.
                      </p>
                      <p>
                        <i className="fa-solid fa-circle-exclamation text-[#FFD84E] mr-2"></i>
                        Upon completion of this project, the grantee church agrees to
                        submit a general reporting form in light of the goals listed in
                        the application.
                      </p>
                      <p>
                        <i className="fa-solid fa-circle-exclamation text-[#FFD84E] mr-2"></i>
                        Our hope is that you will form valuable stories of connection
                        that can be replicated and shared.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <label className="text-sm font-medium text-white/90">
                        Please review the grant application thoroughly before submission
                        to ensure that all sections have accurate information.
                      </label>

                      <label className="flex items-start gap-2">
                        <input
                          type="checkbox"
                          checked={confirmations.reviewed}
                          onChange={(e) =>
                            setConfirmations((prev) => ({
                              ...prev,
                              reviewed: e.target.checked,
                            }))
                          }
                          className="accent-[#FFD84E] w-4 h-4 mt-[2px]"
                        />
                        <span className="text-sm">
                          I have reviewed the application and filled out each section to
                          the best of my knowledge.
                        </span>
                      </label>

                      <label className="flex items-start gap-2">
                        <input
                          type="checkbox"
                          checked={confirmations.uploadsIncluded}
                          onChange={(e) =>
                            setConfirmations((prev) => ({
                              ...prev,
                              uploadsIncluded: e.target.checked,
                            }))
                          }
                          className="accent-[#FFD84E] w-4 h-4 mt-[2px]"
                        />
                        <span className="text-sm">{REPORTING_SECOND_LABEL}</span>
                      </label>

                      <div className="flex flex-col gap-2 mt-4">
                        <label className="text-sm font-medium">Other</label>
                        <input
                          type="text"
                          value={otherNote}
                          onChange={(e) => setOtherNote(e.target.value)}
                          placeholder="Type here..."
                          className="rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-[#cde2f2] outline-none focus:ring-2 focus:ring-[#8ec5eb]"
                        />
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-8">
                      <button
                        type="button"
                        onClick={() => setActiveTab("Cover Sheet")}
                        className="rounded-xl border border-white/30 px-6 py-2 text-sm font-medium text-white/90 transition hover:bg-white/10"
                      >
                        Back
                      </button>

                      <button
                        type="submit"
                        disabled={!canSubmit}
                        className="rounded-xl bg-[#8ec5eb] px-8 py-2 text-sm font-semibold text-[#062946] transition hover:bg-[#a9d5f2] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {submitting ? "Submitting..." : "Submit"}
                      </button>
                    </div>
                  </form>
                )}
              </section>
            </>
          ) : (


<section className="w-full rounded-2xl border border-white/15 bg-[linear-gradient(180deg,rgba(12,58,95,0.9)_0%,rgba(10,53,88,0.95)_100%)] p-6 text-white md:p-8">
  {errorMsg ? (
    <div className="mb-5 rounded-xl border border-red-300/25 bg-red-500/10 px-4 py-3 text-sm text-red-100">
      {errorMsg}
    </div>
  ) : null}

  {successMsg ? (
    <div className="mb-5 rounded-xl border border-emerald-300/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
      {successMsg}
    </div>
  ) : null}

  <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div>
        <h2 className="text-3xl font-semibold text-white">
          My Micro Grant Application
        </h2>
        <p className="mt-2 text-base text-[#d9ebf8]">
          {applicationData?.user?.email || "No email"}
        </p>
      </div>

      <div
        className={`inline-flex rounded-full px-5 py-2 text-sm font-semibold ${
          applicationData?.application?.status?.toLowerCase() === "accepted"
            ? "bg-emerald-400/15 text-emerald-200 border border-emerald-300/25"
            : applicationData?.application?.status?.toLowerCase() === "rejected"
            ? "bg-red-400/15 text-red-200 border border-red-300/25"
            : applicationData?.application?.status?.toLowerCase() === "pending"
            ? "bg-yellow-400/15 text-yellow-100 border border-yellow-300/25"
            : "bg-[#8ec5eb]/15 text-[#dff3ff] border border-[#8ec5eb]/25"
        }`}
      >
        Status: {formatStatus(applicationData?.application?.status)}
      </div>
    </div>

    <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <p className="text-sm text-[#cde2f2]">Submitted on</p>
        <p className="mt-2 text-2xl font-semibold text-white">
          {applicationData?.application?.createdAt
            ? new Date(applicationData.application.createdAt).toLocaleDateString()
            : "—"}
        </p>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <p className="text-sm text-[#cde2f2]">Last updated</p>
        <p className="mt-2 text-2xl font-semibold text-white">
          {applicationData?.application?.updatedAt
            ? new Date(applicationData.application.updatedAt).toLocaleDateString()
            : "—"}
        </p>
      </div>
    </div>
  </div>

  <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6">
    <h3 className="mb-5 text-2xl font-semibold text-white">
      Submitted Answers
    </h3>

    <div className="space-y-4">
      {Object.entries(submittedAnswers).map(([label, value]) => (
        <div
          key={label}
          className="rounded-xl border border-white/10 bg-[#0b3557]/40 p-4"
        >
          <p className="text-sm font-semibold text-white">{label}</p>
          {/* <p className="mt-2 text-sm text-[#d9ebf8]">
            {String(value || "—")}
          </p> */}
          {TEXTAREA_QUESTION_LABELS.has(label as QuestionKey) ? (
  <p className="mt-2 whitespace-pre-line rounded-lg border border-white/10 bg-white/5 p-3 text-sm leading-relaxed text-[#d9ebf8]">
    {String(value || "—")}
  </p>
) : (
  <p className="mt-2 text-sm text-[#d9ebf8]">
    {String(value || "—")}
  </p>
)}
        </div>
      ))}
    </div>
  </div>

  <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6">
    <h3 className="mb-5 text-2xl font-semibold text-white">
      Supporting Documents
    </h3>

    {submittedDocs.length === 0 ? (
      <p className="text-sm text-[#cde2f2]">
        No supporting documents uploaded.
      </p>
    ) : (
      <div className="space-y-3">
        {submittedDocs.map((doc, index) => (
          <div
            key={index}
            className="flex items-center justify-between rounded-xl border border-white/10 bg-[#0b3557]/40 p-4"
          >
            <span className="text-sm font-medium text-white">{doc.name}</span>
            <a
              href={doc.url}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-[#8ec5eb]/30 bg-[#8ec5eb]/10 px-4 py-2 text-sm font-semibold text-[#dff3ff] transition hover:bg-[#8ec5eb]/20"
            >
              Open
            </a>
          </div>
        ))}
      </div>
    )}
  </div>

  <div className="mt-6 flex justify-end">
    <button
      type="button"
      onClick={() => router.push("/pastor/home")}
      className="rounded-xl bg-[#8ec5eb] px-8 py-2 text-sm font-semibold text-[#062946] transition hover:bg-[#a9d5f2]"
    >
      Back to Home
    </button>
  </div>
</section>


          )}
        </div>
      </main>
    </div>
  );
}
