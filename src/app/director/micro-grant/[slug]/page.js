"use client";
import React, { useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import MicroGrantDetailHero from "@/app/Components/Hero/MicroGrantDetailHero";
import RoadmapJumpStartBg from "@/app/Assets/roadmap-jump-start-bg.jpg";
import Mentor2 from "@/app/Assets/mentor2.png";

const Page = () => {
  const [activeStep, setActiveStep] = useState(1);
  const params = useParams();
  const slug = params?.slug || "0";

  // Right card content for the hero - matching exact design
  const rightCard = (
    <div className="bg-white rounded-lg shadow-lg p-4 h-[160px] w-full md:w-[340px] relative">
      {/* Application received date - top right */}
      <div className="absolute top-4 right-4 text-right">
        <p className="text-xs text-gray-500 mb-1">Application received on:</p>
        <p className="text-sm font-semibold text-gray-900">15 Nov 2024</p>
      </div>

      {/* Profile section */}
      <div className="flex items-start gap-3 mt-10">
        {/* Profile Picture - Circular with light gray background */}
        <div className="relative w-16 h-16 flex-shrink-0">
          <div className="absolute inset-0 rounded-full bg-gray-200"></div>
          <div className="relative w-full h-full rounded-full overflow-hidden">
            <Image
              src={Mentor2}
              alt="Robert Fox"
              fill
              className="object-cover"
            />
          </div>
        </div>

        {/* Name, Role, and Contact Icons */}
        <div className="flex-1 min-w-0">
          <div className="mb-2">
            <h3 className="text-base font-bold text-gray-900 mb-0.5">
              Robert Fox
            </h3>
            <p className="text-xs text-gray-600">Pastor</p>
          </div>

          <div className="flex justify-between items-center">
            {/* Contact Icons */}
            <div className="flex items-center gap-2 mt-1.5">
              <button
                className="text-gray-600 hover:opacity-70 transition"
                aria-label="Send email"
              >
                <i className="fa-regular fa-envelope text-sm"></i>
              </button>
              <button
                className="text-gray-600 hover:opacity-70 transition"
                aria-label="Send message"
              >
                <i className="fa-regular fa-comment-dots text-sm"></i>
              </button>
              <button
                className="text-gray-600 hover:opacity-70 transition"
                aria-label="Call"
              >
                <i className="fa-solid fa-phone text-sm"></i>
              </button>
            </div>
            <button className="bg-[#1E366F] text-white text-xs font-semibold px-5 py-2 rounded-lg hover:bg-[#1a2f5a] transition-colors">
              View Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#1d538d] to-[#1d538d]">
      {/* Hero Section */}
      <MicroGrantDetailHero
        title="The Center for Community Change Micro-Grant Application"
        subtitle="Please keep in mind that the church applying for a grant must become a partner with the CCC by signing a MOU."
        backgroundImageUrl={RoadmapJumpStartBg.src}
        breadcrumbItems={[
          { label: "Micro Grant", href: "/director/micro-grant" },
          { label: "Robert Fox" },
        ]}
        rightCard={rightCard}
      />

      {/* Main Content */}
      <div className="bg-transparent py-10 px-6 md:px-16 lg:px-24 flex flex-col md:flex-row gap-10">
        {/* Sidebar */}
        <div className="flex items-start space-x-4 flex-shrink-0 md:w-1/3 lg:w-1/4">
          {/* Step Indicators */}
          <div className="flex flex-col items-center mt-2">
            {/* Step 1 */}
            <div
              className={`w-10 h-10 flex items-center justify-center rounded-full border-4 ${
                activeStep === 1
                  ? "border-green-500 bg-green-100 text-green-700"
                  : "border-gray-400 bg-gray-200 text-gray-600"
              } font-semibold`}
            >
              1
            </div>
            {/* Line */}
            <div className="w-1 h-12 bg-blue-600"></div>
            {/* Step 2 */}
            <div
              className={`w-10 h-10 flex items-center justify-center rounded-full border-4 ${
                activeStep === 2
                  ? "border-green-500 bg-green-100 text-green-700"
                  : "border-gray-400 bg-gray-200 text-gray-600"
              } font-semibold`}
            >
              2
            </div>
          </div>

          {/* Steps Content */}
          <div className="space-y-4">
            {/* Step 1 Card */}
            <div
              onClick={() => setActiveStep(1)}
              className={`cursor-pointer rounded-xl px-6 py-5 shadow-lg border transition-all duration-200 ${
                activeStep === 1
                  ? "bg-[#194674] text-white border-[#2b5a8c]"
                  : "bg-gray-100 text-black border-gray-200"
              }`}
            >
              <h3 className="text-xl font-semibold">Cover Sheet</h3>
              <p
                className={`text-sm mt-1 ${
                  activeStep === 1 ? "text-gray-200" : "text-gray-600"
                }`}
              >
                Please answer the questions succinctly following prompts
              </p>
            </div>

            {/* Step 2 Card */}
            <div
              onClick={() => setActiveStep(2)}
              className={`cursor-pointer rounded-xl px-6 py-5 shadow-md border transition-all duration-200 ${
                activeStep === 2
                  ? "bg-[#194674] text-white border-[#2b5a8c]"
                  : "bg-gray-100 text-black border-gray-200"
              }`}
            >
              <h3 className="text-nowrap font-semibold">
                Reporting Procedures
              </h3>
            </div>
          </div>
        </div>

        {/* Right Section - Dynamic Form */}
        <div className="flex-1">
          {activeStep === 1 ? (
            // ------------------ COVER SHEET FORM ------------------
            <form className="bg-transparent text-white  p-8 flex-1 space-y-6">
              <p className="text-sm text-amber-200 text-right mb-6 w-full">
                * Indicates required question
              </p>

              {/* Input Fields */}
              {[
                {
                  label: "Name of the church",
                  placeholder: "Your Answer",
                },
                {
                  label: "Name of the project/program",
                  placeholder:
                    "Provide a name for the project/program you are seeking the grant for",
                },
                {
                  label:
                    "Who does the project/program serve and why it is important?",
                  placeholder:
                    "Describe the target audience or beneficiaries of your project/program and explain why it is important for them",
                },
                {
                  label: "Amount requested",
                  placeholder:
                    "Specify the amount of grant funds you are requesting",
                },
                {
                  label:
                    "Project amount of denominational support (Local Conference, Union, NAD, GC, etc.)",
                  placeholder:
                    "Provide the projected (if any) cost-sharing contribution from the larger body of the SDA church",
                },
                {
                  label:
                    "What action steps will you take to achieve your goals?",
                  placeholder:
                    "Outline the specific activities or steps you will undertake to achieve the stated goals",
                },
                {
                  label: "What resources do you already have?",
                  placeholder:
                    "Describe the existing resources or assets that your church or project team possesses",
                },
                {
                  label:
                    "Who will be leading and overseeing the project/program, and what are their qualifications?",
                  placeholder:
                    "Provide information about the individuals responsible for leading and managing the project/program, including their qualifications and relevant experience",
                },
                {
                  label: "What are the measurable markers of your success?",
                  placeholder:
                    "Define specific indicators or metrics that will be used to measure the success or progress of your project/program",
                },
              ].map((field, idx) => (
                <div key={idx}>
                  <label className="block text-sm font-semibold mb-2">
                    {field.label} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder={field.placeholder}
                    className="w-full border border-gray-300 rounded-md p-3 text-gray-300 focus:ring-2 focus:ring-[#1d538d] focus:outline-none"
                  />
                </div>
              ))}

              {/* File Upload Section */}
              <div className="mt-6">
                <label className="flex items-center gap-3 text-sm font-semibold mb-4 text-white">
                  <i className="fa-solid fa-cloud-arrow-up text-white text-xl"></i>
                  Please upload here any supporting documents or media (photos,
                  videos, publications, etc.)
                </label>
                {/* Supporting Document Card - Half Width */}
                <div className="w-full max-w-md">
                  <div className="bg-white rounded-lg p-4 flex items-center justify-between gap-4 shadow-md">
                    <div className="flex items-center gap-4 flex-1">
                      {/* PDF Icon */}
                      <div className="w-10 h-10 flex-shrink-0 bg-orange-100 rounded flex items-center justify-center">
                        <i className="fa-solid fa-file-pdf text-orange-500 text-xl"></i>
                      </div>
                      {/* File Info */}
                      <div className="flex flex-col">
                        <span className="text-black font-semibold text-sm">
                          supporting documents.pdf
                        </span>
                        <span className="text-gray-500 text-xs">
                          20 Oct 2024
                        </span>
                      </div>
                    </div>
                    {/* Download Icon */}
                    <button
                      type="button"
                      className="text-[#1d538d] hover:opacity-70 transition p-2"
                      aria-label="Download"
                    >
                      <i className="fa-solid fa-download text-xl"></i>
                    </button>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end mt-8">
                <button
                  type="submit"
                  className="bg-[#1d538d] text-white px-6 py-2 rounded-lg border-2 border-white font-semibold hover:bg-[#16406e] transition-colors"
                >
                  Next
                </button>
              </div>
            </form>
          ) : (
            // ------------------ REPORTING PROCEDURES FORM ------------------
            <div className="bg-transparent text-white p-8 space-y-6">
              <div className="space-y-4">
                <div className="border border-gray-300 rounded-lg p-5 space-y-3">
                  <p className="flex items-start space-x-2">
                    <span className="text-yellow-400 text-lg">⭐</span>
                    <span>
                      If approved, you will sign a grant agreement based on the
                      submitted Action Steps—the CCC may modify, suspend, or
                      stop payment of grant funds if the terms of the agreement
                      are changed or not followed.
                    </span>
                  </p>

                  <p className="flex items-start space-x-2">
                    <span className="text-yellow-400 text-lg">⭐</span>
                    <span>
                      Upon completion of the project, the grantee must submit a
                      grant report regarding the use of funds consisting of a
                      narrative report and financial accounting—the report ought
                      to include copies of relevant receipts and records of
                      expenditures.
                    </span>
                  </p>

                  <p className="flex items-start space-x-2">
                    <span className="text-yellow-400 text-lg">⭐</span>
                    <span>
                      Any grant funds that have not been used for, or committed
                      to, the project upon expiration or termination of the
                      grant agreement must be returned to the CCC.
                    </span>
                  </p>
                </div>

                <div className="border border-gray-300 rounded-lg p-5">
                  <p className="mb-3 text-sm">
                    Please review the grant application thoroughly before
                    submission and ensure that all required sections are
                    completed accurately
                  </p>

                  <div className="space-y-3">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        defaultChecked
                        className="w-4 h-4 accent-blue-500"
                      />
                      <span>
                        I have reviewed the application and filled out each
                        section to the best of my knowledge
                      </span>
                    </label>

                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        defaultChecked
                        className="w-4 h-4 accent-blue-500"
                      />
                      <span>
                        I have filled out the application, and I would like to
                        discuss it with a center's director
                      </span>
                    </label>

                    <div>
                      <label className="flex items-center space-x-2 mb-2">
                        <input
                          type="checkbox"
                          defaultChecked
                          className="w-4 h-4 accent-blue-500"
                        />
                        <span>Other</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Type here..."
                        className="w-full border border-gray-300 rounded-md p-2 text-gray-300 focus:ring-2 focus:ring-[#1d538d] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-between mt-8 space-x-3">
                <button className="bg-gray-400 text-white px-6 py-2 rounded-lg hover:bg-gray-500">
                  Add to Pending
                </button>
                <div>
                  <button className="bg-white text-[#1d538d] px-6 py-2 rounded-lg font-semibold hover:bg-gray-100">
                    REJECT
                  </button>
                  <button className="bg-[#1d538d] text-white px-6 py-2 rounded-lg hover:bg-[#16406e]">
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
