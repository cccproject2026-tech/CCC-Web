"use client";
import { useState } from "react";
import HeroSection from "../../Components/HeroSection";
import WhatWeDoSection from "../../Components/WhatWeDoSection";
import { useRouter } from "next/navigation";

export default function Processing() {
  const router = useRouter();
  const [showPopup, setShowPopup] = useState(true); // show popup on page load

  return (
    <div className="relative">
      {/* ✅ Hero Section */}
      <HeroSection
        title="Processing"
        subtitle="Your form submitted successfully please wait for approval"
        primaryBtn={{
          label: "Check Status",
          onClick: () => router.push("/pastor/setpassword"),
        }}
        showContactBox={true}
      />

      {/* ✅ Waiting for Approval Popup */}
      {showPopup && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50">
          <div className="flex items-center justify-between bg-[#1A2E7A] text-white px-6 py-3 rounded-lg shadow-lg min-w-[320px] gap-4">
            {/* Loader Icon */}
            <div className="flex items-center gap-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="animate-spin h-5 w-5 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v2a6 6 0 00-6 6H4z"
                ></path>
              </svg>
              <span className="font-medium text-sm tracking-wide">
                Waiting for Approval
              </span>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setShowPopup(false)}
              className="text-white hover:text-gray-300 transition"
              aria-label="Close"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* ✅ Below Section */}
      <WhatWeDoSection />
    </div>
  );
}
