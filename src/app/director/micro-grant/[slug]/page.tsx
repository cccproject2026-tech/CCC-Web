"use client";

import React, { useEffect, useState, ReactNode } from "react";
import { useParams , useRouter} from "next/navigation";
import Image from "next/image";

import MicroGrantDetailHero from "@/app/Components/Hero/MicroGrantDetailHero";
import RoadmapJumpStartBg from "@/app/Assets/roadmap-jump-start-bg.jpg";
import Mentor2 from "@/app/Assets/mentor2.png";

import {
  loadMicroGrantDetailBySlug,
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
        const payload = await loadMicroGrantDetailBySlug(userId);
        setData(payload);
      } catch (err) {
        console.error("Failed to load application", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  // const handleStatusChange = async (
  //   applicationId: string,
  //   status: 'new' | 'pending' | 'accepted' | 'rejected'
  // ) => {
  //   try {
  //     await updateMicroGrantStatus(applicationId, status);

  //     // update UI optimistically or refetch
  //     console.log('Status updated successfully');
  //   } catch (error) {
  //     console.log('Failed to update status');
  //     console.error(error);
  //   }
  // };

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
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#1d538d] to-[#1d538d]">
      <MicroGrantDetailHero
        title={
          typeof data.application.formId === "object" && data.application.formId?.title
            ? data.application.formId.title
            : "Micro Grant Application"
        }
        subtitle="Please keep in mind that the church applying for a grant must become a partner with the CCC by signing a MOU."
        backgroundImageUrl={RoadmapJumpStartBg.src}
        breadcrumbItems={[
          { label: "Micro Grant", href: "/director/micro-grant" },
          { label: data.user.email },
        ]}
        rightCard={rightCard}
      />

      <div className="bg-transparent py-10 px-6 md:px-16 lg:px-24 flex flex-col md:flex-row gap-10">
        {/* ---------- LEFT STEPS (unchanged) ---------- */}
        <div className="flex items-start space-x-4 flex-shrink-0 md:w-1/3 lg:w-1/4">
          <div className="flex flex-col items-center mt-2">
            {[1, 2].map((step, i) => (
              <React.Fragment key={step}>
                <div
                  className={`w-10 h-10 flex items-center justify-center rounded-full border-4 ${activeStep === step
                    ? "border-green-500 bg-green-100 text-green-700"
                    : "border-gray-400 bg-gray-200 text-gray-600"
                    } font-semibold`}
                >
                  {step}
                </div>
                {i === 0 && <div className="w-1 h-12 bg-blue-600" />}
              </React.Fragment>
            ))}
          </div>

          <div className="space-y-4">
            <div
              onClick={() => setActiveStep(1)}
              className={`cursor-pointer rounded-xl px-6 py-5 shadow-lg border ${activeStep === 1
                ? "bg-[#194674] text-white border-[#2b5a8c]"
                : "bg-gray-100 text-black border-gray-200"
                }`}
            >
              <h3 className="text-xl font-semibold">Cover Sheet</h3>
              <p className="text-sm mt-1 opacity-80">
                Please answer the questions succinctly following prompts
              </p>
            </div>

            <div
              onClick={() => setActiveStep(2)}
              className={`cursor-pointer rounded-xl px-6 py-5 shadow-md border ${activeStep === 2
                ? "bg-[#194674] text-white border-[#2b5a8c]"
                : "bg-gray-100 text-black border-gray-200"
                }`}
            >
              <h3 className="font-semibold">Reporting Procedures</h3>
            </div>
          </div>
        </div>

        {/* ---------- RIGHT CONTENT (dynamic) ---------- */}
        <div className="flex-1">
          {activeStep === 1 ? (
            <form className="bg-transparent text-white p-8 space-y-6">
              <p className="text-sm text-amber-200 text-right">
                * Indicates required question
              </p>

              {Object.entries(answers).map(
                ([label, value]) => (
                  <div key={label}>
                    <label className="block text-sm font-semibold mb-2">
                      {label} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={value}
                      readOnly
                      className="w-full border border-gray-300 rounded-md p-3 bg-gray-100 text-gray-800"
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
                      className="bg-white rounded-lg p-4 flex justify-between items-center shadow-md mb-3"
                    >
                      <span className="text-black font-semibold text-sm">
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
            <div className="bg-transparent text-white p-8 space-y-6">
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

<div className="flex justify-between mt-8">
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
</div>


            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Page;
