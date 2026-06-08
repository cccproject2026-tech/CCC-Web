"use client";

import React, { useEffect, useState, ReactNode } from "react";
import { useParams , useRouter} from "next/navigation";
import Image from "next/image";

import MicroGrantDetailHero from "@/app/Components/Hero/MicroGrantDetailHero";
import RoadmapJumpStartBg from "@/app/Assets/roadmap-jump-start-bg.jpg";
import Mentor2 from "@/app/Assets/mentor2.png";

import {
  getMicroGrantByUserId,
unwrapMicroGrantWithUser,
  // loadMicroGrantDetailBySlug,
  normalizeMicroGrantSupportingDocs,
  updateMicroGrantStatus,
} from "@/app/Services/microGrand.service";
import { MicroGrantResponse } from "@/app/Services/types";

const Page: React.FC = () => {
  const [activeStep, setActiveStep] = useState<number>(1);
  const [data, setData] = useState<MicroGrantResponse | null>(null);
  const [loading, setLoading] = useState(true);

const [statusMessage, setStatusMessage] = useState("");

const router = useRouter();
  const params = useParams();
  const raw = params?.slug;
  const userId =
    typeof raw === "string" ? decodeURIComponent(raw) : Array.isArray(raw) ? decodeURIComponent(raw[0] ?? "") : "";

  /* ---------- fetch data ---------- */
  useEffect(() => {
    if (!userId) return;

    const fetchData = async () => {
      try {

        const res = await getMicroGrantByUserId(userId);
const payload = unwrapMicroGrantWithUser(res);
console.log("DIRECTOR MICRO RAW:", res.data);
console.log("DIRECTOR MICRO PAYLOAD:", payload);
console.log("DIRECTOR MICRO ANSWERS:", payload?.application?.answers);
setData(payload);
      } catch (err) {
        console.error("Failed to load application", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);



 const handleStatusChange = async (
  applicationId: string,
  status: "new" | "pending" | "accepted" | "rejected"
) => {
  try {
    const res = await updateMicroGrantStatus(applicationId, status);

    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        application: {
          ...prev.application,
          status: res?.data?.data?.status ?? status,
        },
      };
    });

    setStatusMessage(`Application ${status} successfully`);

    setTimeout(() => {
      router.push("/director/micro-grant");
    }, 1200);
  } catch (error) {
    console.log("Failed to update status");
    console.error(error);
    setStatusMessage(`Failed to update application status to ${status}`);
  }
};


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Loading application…
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-300">
        Application not found
      </div>
    );
  }

  const answers = data.application.answers ?? {};
  console.log("MICRO GRANT DETAIL:", data);
console.log("MICRO GRANT ANSWERS:", data.application.answers);
console.log("MICRO GRANT FORM:", data.application.formId);
  const supportingDocs = normalizeMicroGrantSupportingDocs(data.application.supportingDocs);

  /* ---------- right card (same design, dynamic) ---------- */
  const rightCard: ReactNode = (
    <div className="bg-white rounded-lg shadow-lg p-4 h-[160px] w-full md:w-[340px] relative">
      <div className="absolute top-4 right-4 text-right">
        <p className="text-xs text-gray-500 mb-1">Application received on:</p>
        <p className="text-sm font-semibold text-gray-900">
          {new Date(data.application.createdAt).toLocaleDateString()}
        </p>
      </div>

      <div className="flex items-start gap-3 mt-10">
        <div className="relative w-16 h-16 flex-shrink-0 rounded-full overflow-hidden">
          <Image src={Mentor2} alt="Applicant" fill className="object-cover" />
        </div>

        <div className="flex-1 min-w-0">
          {/* <h3 className="text-base font-bold text-gray-900 mb-0.5">
            {data.user.email}
          </h3>
          <p className="text-xs text-gray-600 capitalize">
            {data.user.role}
          </p> */}

        <h3 className="text-base font-bold text-gray-900 mb-0.5">
    {data.user.email || "Unknown"}
  </h3>

  <p className="text-xs text-gray-600">
    {data.user.role
      ? data.user.role.charAt(0).toUpperCase() + data.user.role.slice(1)
      : "No role"}
  </p>
  

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 mt-1.5">
              <a href={`mailto:${data.user.email}`}>
                <i className="fa-regular fa-envelope text-sm text-gray-600" />
              </a>
            </div>
            <button className="bg-[#1E366F] text-white text-xs font-semibold px-5 py-2 rounded-lg">
              View Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (

     <div className="min-h-screen bg-[#061a2f] text-white">
    
      <section className="border-b border-white/10 bg-[linear-gradient(135deg,#08233d_0%,#0b3153_55%,#123d66_100%)] px-6 py-8 md:px-12 lg:px-20">
  <div className="mx-auto flex max-w-7xl flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
    <div>
      <p className="mb-2 text-sm text-[#8ec5eb]">
        Micro Grant / {data.user.email}
      </p>

      <h1 className="text-3xl font-bold">
  Micro Grant Application
</h1>

      <p className="mt-3 max-w-2xl text-sm text-white/70">
        Please keep in mind that the church applying for a grant must become a
        partner with the CCC by signing a MOU.
      </p>
    </div>

    <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur-xl">
      <div className="flex items-start gap-4">
        <img
          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
            data.user.email || "User"
          )}&background=173653&color=ffffff`}
          alt="Applicant"
          className="h-16 w-16 rounded-full object-cover"
        />

        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-semibold">{data.user.email}</p>

          <p className="mt-1 text-sm capitalize text-white/60">
            {data.user.role || "Applicant"}
          </p>

          <p className="mt-3 text-xs text-white/50">
            Submitted on{" "}
            {new Date(data.application.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  </div>
</section>

      <div className="mx-auto flex max-w-7xl flex-col gap-10 px-6 py-10 md:flex-row md:px-12 lg:px-20">
        {/* ---------- LEFT STEPS (unchanged) ---------- */}
        <div className="relative flex shrink-0 flex-col gap-4 md:w-1/3 lg:w-1/4">
          <div className="absolute left-5 top-14 h-12 w-1 -translate-x-1/2 rounded-full bg-blue-600" />
          <div className="flex items-start gap-4">
            <div
              className={`relative z-10 mt-4 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-4 font-semibold ${
                activeStep === 1
                  ? "border-green-500 bg-green-100 text-green-700"
                  : "border-gray-400 bg-gray-200 text-gray-600"
              }`}
            >
              1
            </div>
            {/* <div
              onClick={() => setActiveStep(1)}
              className={`cursor-pointer rounded-xl px-6 py-5 shadow-lg border ${activeStep === 1
                ? "bg-[#194674] text-white border-[#2b5a8c]"
                : "bg-gray-100 text-black border-gray-200"
                }`}
            > */}
            <div
  onClick={() => setActiveStep(1)}
  className={`min-h-[72px] flex-1 cursor-pointer rounded-2xl border px-6 py-5 shadow-lg transition ${
    activeStep === 1
      ? "border-[#8ec5eb]/40 bg-white/[0.08] text-white"
      : "border-white/10 bg-white/[0.04] text-white/70 hover:bg-white/[0.07]"
  }`}
>
              <h3 className="text-xl font-semibold">Cover Sheet</h3>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div
              className={`relative z-10 mt-4 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-4 font-semibold ${
                activeStep === 2
                  ? "border-green-500 bg-green-100 text-green-700"
                  : "border-gray-400 bg-gray-200 text-gray-600"
              }`}
            >
              2
            </div>
{/* 
            <div
              onClick={() => setActiveStep(2)}
              className={`cursor-pointer rounded-xl px-6 py-5 shadow-md border ${activeStep === 2
                ? "bg-[#194674] text-white border-[#2b5a8c]"
                : "bg-gray-100 text-black border-gray-200"
                }`}
            > */}
            <div
  onClick={() => setActiveStep(2)}
  className={`min-h-[72px] flex-1 cursor-pointer rounded-2xl border px-6 py-5 shadow-lg transition ${
    activeStep === 2
      ? "border-[#8ec5eb]/40 bg-white/[0.08] text-white"
      : "border-white/10 bg-white/[0.04] text-white/70 hover:bg-white/[0.07]"
  }`}
>
              <h3 className="font-semibold">Reporting Procedures</h3>
            </div>
          </div>
        </div>

        {/* ---------- RIGHT CONTENT (dynamic) ---------- */}
        <div className="flex-1">
          {activeStep === 1 ? (
            <form className="space-y-5 rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-white shadow-xl sm:p-8">
              <p className="text-sm text-amber-200 text-right">
                * Indicates required question
              </p>

              {Object.entries(answers).map(
                ([label, value]) => (

                  <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                    <label className="block text-sm font-semibold mb-2">
                      {label} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={value}
                      readOnly
                      className="mt-3 w-full rounded-xl border border-white/10 bg-[#102b43] p-4 text-white outline-none"
                    />
                  </div>
                )
              )}

              {/* documents */}
              <div className="mt-6">
                <label className="flex items-center gap-3 text-sm font-semibold mb-4">
                  <i className="fa-solid fa-cloud-arrow-up text-xl" />
                  Supporting Documents
                </label>

                {supportingDocs.length === 0 ? (
                  <p className="text-sm text-gray-300">
                    No documents uploaded
                  </p>
                ) : (
                  supportingDocs.map((doc, idx) => (
                    <div
                      key={idx}
                      className="mb-3 flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.06] p-4 shadow-md"
                    >
                      <span className="text-sm font-semibold text-white">
                        {doc.name}
                      </span>
                      <a href={doc.url} target="_blank">
                        <i className="fa-solid fa-download text-[#1d538d]" />
                      </a>
                    </div>
                  ))
                )}
              </div>

              <div className="flex justify-end mt-8">
                <button
                  type="button"
                  onClick={() => setActiveStep(2)}
                  className="bg-[#1d538d] text-white px-6 py-2 rounded-lg border-2 border-white font-semibold"
                >
                  Next
                </button>
              </div>
            </form>
          ) : (
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-white shadow-xl sm:p-8">
              <p>⭐ Grant report required upon completion</p>
              <p>⭐ Unused funds must be returned</p>


{statusMessage ? (
  <div className="rounded-lg bg-white/10 px-4 py-3 text-sm font-medium text-white">
    {statusMessage}
  </div>
) : null}



              {/* <div className="flex justify-between mt-8">
                <button
                  onClick={() => setActiveStep(1)}
                  className="bg-gray-400 px-6 py-2 rounded-lg"
                >
                  Back
                </button>
                <div>
                  <button onClick={() =>
                    handleStatusChange(data.application._id, 'rejected')
                  } className="bg-white text-[#1d538d] px-6 py-2 rounded-lg font-semibold mr-2">
                    REJECT
                  </button>
                  <button onClick={() =>
                    handleStatusChange(data.application._id, 'accepted')
                  } className="bg-[#1d538d] text-white px-6 py-2 rounded-lg">
                    ACCEPT
                  </button>
                </div>
              </div> */}

{/* <div className="flex justify-between mt-8">
  <button
    type="button"
    onClick={() => setActiveStep(1)}
    className="bg-gray-400 px-6 py-2 rounded-lg"
  >
    Back
  </button>

  <div>
    <button
      type="button"
      onClick={() => handleStatusChange(data.application._id, "rejected")}
      className="bg-white text-[#1d538d] px-6 py-2 rounded-lg font-semibold mr-2"
    >
      REJECT
    </button>

    <button
      type="button"
      onClick={() => handleStatusChange(data.application._id, "accepted")}
      className="bg-[#1d538d] text-white px-6 py-2 rounded-lg"
    >
      ACCEPT
    </button>
  </div>
</div> */}
<div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
  <button
    type="button"
    onClick={() => setActiveStep(1)}
    className="rounded-xl border border-white/15 bg-white/10 px-6 py-2 text-sm font-semibold text-white hover:bg-white/15"
  >
    Back
  </button>
  <div className="flex flex-wrap gap-3 sm:justify-end">
    <button
      type="button"
      onClick={() => handleStatusChange(data.application._id, "pending")}
      className="rounded-xl border border-amber-300/30 bg-amber-500/15 px-6 py-2 text-sm font-semibold text-amber-100 hover:bg-amber-500/25"
    >
      Move to Pending
    </button>

    <button
      type="button"
      onClick={() => handleStatusChange(data.application._id, "rejected")}
      className="rounded-xl border border-red-300/30 bg-red-500/15 px-6 py-2 text-sm font-semibold text-red-100 hover:bg-red-500/25"
    >
      Reject
    </button>

    <button
      type="button"
      onClick={() => handleStatusChange(data.application._id, "accepted")}
      className="rounded-xl bg-[#8ec5eb] px-6 py-2 text-sm font-bold text-[#062946] hover:bg-[#b8def6]"
    >
      Accept
    </button>
  </div>
</div>


            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Page;
