"use client";
import React, { useState } from "react";
import PastorHeader from "@/app/Components/PastorHeader";

const Page = () => {
  const [activeStep, setActiveStep] = useState(1);

  return (
    <div className="min-h-screen flex flex-col bg-[#1d538d]">
      <PastorHeader showFullHeader={true} />
      <div className="w-full h-80 bg-amber-800"></div>

      {/* Main Content */}
      <div className="bg-[#1d538d] py-10 px-6 md:px-16 lg:px-24 flex flex-col md:flex-row gap-10">
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
              <h3 className="text-xl font-semibold">Reporting Procedures</h3>
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
                <label className="block text-sm font-semibold mb-2">
                  Please upload supporting documents or media (photos, videos,
                  publications, etc.)
                </label>
                <div className="flex items-center justify-between bg-gray-100 border border-gray-300 rounded-lg p-3">
                  <div className="flex items-center space-x-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-6 h-6 text-red-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    <span className="text-black">supporting_documents.pdf</span>
                  </div>
                  <span className="text-sm text-gray-500">21 Oct 2024</span>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end mt-8">
                <button
                  type="submit"
                  className="bg-[#1d538d] text-white px-6 py-2 rounded-lg hover:bg-[#16406e]"
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
