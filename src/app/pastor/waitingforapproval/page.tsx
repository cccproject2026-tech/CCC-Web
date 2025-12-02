"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import HeroSection from "../../Components/HeroSection";
import WhatWeDoSection from "../../Components/WhatWeDoSection";

type ModuleType = "pastor" | "mentor";
type AuthMode = "signup" | "login";

const PASTOR_USER_TYPES = [
  {
    key: "pastor",
    label: "Pastor",
    description: "Lead a congregation and shepherd your community.",
  },
  {
    key: "lay-leader",
    label: "Lay Leader",
    description: "Support your church through leadership and service.",
  },
  {
    key: "seminarian",
    label: "Seminarian",
    description: "Preparing for ministry through theological training.",
  },
];

const MENTOR_USER_TYPES = [
  {
    key: "mentor",
    label: "Mentor",
    description: "Guide pastors and leaders through mentoring.",
  },
  {
    key: "field-mentor",
    label: "Field Mentor",
    description: "Support ministry on the ground in local contexts.",
  },
];

export default function WaitingForApproval() {
  const router = useRouter();

  // Step 1: Full-screen modal (Pastor vs Mentor)
  const [isMainModalOpen, setIsMainModalOpen] = useState(false);
  const [animateMainModal, setAnimateMainModal] = useState(false);

  // Step 2: Role selection modal
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [animateRoleModal, setAnimateRoleModal] = useState(false);

  const [activeModule, setActiveModule] = useState<ModuleType | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode | null>(null);

  // Animation for main modal
  useEffect(() => {
    if (isMainModalOpen) {
      const t = setTimeout(() => setAnimateMainModal(true), 10);
      return () => clearTimeout(t);
    } else {
      setAnimateMainModal(false);
    }
  }, [isMainModalOpen]);

  // Animation for role modal
  useEffect(() => {
    if (isRoleModalOpen) {
      const t = setTimeout(() => setAnimateRoleModal(true), 10);
      return () => clearTimeout(t);
    } else {
      setAnimateRoleModal(false);
    }
  }, [isRoleModalOpen]);

  // Open main modal with selected auth mode (from main page buttons)
  const openMainModal = (mode: AuthMode) => {
    setAuthMode(mode);
    setActiveModule(null);
    setIsMainModalOpen(true);
  };

  const closeMainModal = () => {
    setIsMainModalOpen(false);
  };

  const closeRoleModal = () => {
    setIsRoleModalOpen(false);
    setActiveModule(null);
    // keep authMode so user can go back and re-open if needed
  };

  // Now cards only choose the module; authMode comes from main page ("New User" / "Log In")
  const handleModuleClick = (module: ModuleType) => {
    if (!authMode) return; // safety guard
    setActiveModule(module);
    setIsMainModalOpen(false);
    setIsRoleModalOpen(true);
  };

  const handleSelectUserType = (userTypeKey: string) => {
    if (!activeModule || !authMode) return;

    setIsRoleModalOpen(false);

    // Build route based on module + authMode
    if (activeModule === "pastor") {
      if (authMode === "signup") {
        router.push(
          `/pastor/InterestForm?userType=${encodeURIComponent(userTypeKey)}`
        );
      } else {
        router.push(
          `/pastor/login?userType=${encodeURIComponent(userTypeKey)}`
        );
      }
    } else {
      // mentor module
      if (authMode === "signup") {
        router.push(
          `/mentor/InterestForm?userType=${encodeURIComponent(userTypeKey)}`
        );
      } else {
        router.push(
          `/mentor/login?userType=${encodeURIComponent(userTypeKey)}`
        );
      }
    }
  };

  const getUserTypesForModule = () => {
    if (activeModule === "pastor") return PASTOR_USER_TYPES;
    if (activeModule === "mentor") return MENTOR_USER_TYPES;
    return [];
  };

  const getModuleTitle = () => {
    if (activeModule === "pastor") return "Pastor Flow";
    if (activeModule === "mentor") return "Mentor Flow";
    return "";
  };

  const getAuthLabel = () => {
    if (authMode === "signup") return "Sign Up";
    if (authMode === "login") return "Log In";
    return "";
  };

  return (
    <div className="relative">
      <HeroSection
        title="Center for Community Change"
        subtitle="Guiding pastors toward growth, connection, and impactful ministry with personalized mentoring and community support."
        primaryBtn={{
          label: "New User",
          onClick: () => openMainModal("signup"),
        }}
        secondaryBtn={{
          label: "Log In",
          // open full-screen popup in login mode
          onClick: () => openMainModal("login"),
        }}
        showContactBox={true}
      />

      <WhatWeDoSection />

      {/* STEP 1: Full-screen popup - Pastor vs Mentor */}
      {isMainModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={closeMainModal}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`relative w-full h-full flex items-center justify-center px-4 sm:px-8 transform transition-all duration-300 ease-out
              ${animateMainModal ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            <div className="max-w-5xl w-full bg-white rounded-3xl shadow-2xl p-6 sm:p-10">
              {/* Close button */}
              <button
                onClick={closeMainModal}
                className="absolute right-6 top-6 text-gray-400 hover:text-gray-600 transition"
                aria-label="Close"
              >
                ✕
              </button>

              <div className="text-center mb-8">
                <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900">
                  How would you like to continue?
                </h2>
                <p className="mt-2 text-sm sm:text-base text-gray-500">
                  Choose whether you’re using the platform as a Pastor or as a
                  Mentor. We’ll continue with{" "}
                  <span className="font-semibold text-indigo-600">
                    {getAuthLabel() || "your selected option"}
                  </span>{" "}
                  on the next step.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Pastor card */}
                <button
                  type="button"
                  onClick={() => handleModuleClick("pastor")}
                  className="text-left rounded-2xl border border-gray-200 bg-gradient-to-b from-white to-indigo-50/40 p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Pastor
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      For pastors and church leaders seeking mentoring, support,
                      and community.
                    </p>
                    <div className="text-xs text-gray-500 mb-4">
                      <span className="font-semibold text-gray-700">
                        Available users:
                      </span>{" "}
                      Pastor, Lay Leader, Seminarian
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-xs text-indigo-700">
                    <span>Continue as Pastor flow</span>
                    <span className="inline-flex items-center gap-1 text-[11px] bg-white/70 px-2 py-1 rounded-full">
                      {getAuthLabel()} &rarr;
                    </span>
                  </div>
                </button>

                {/* Mentor card */}
                <button
                  type="button"
                  onClick={() => handleModuleClick("mentor")}
                  className="text-left rounded-2xl border border-gray-200 bg-gradient-to-b from-white to-emerald-50/40 p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                >
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Mentor
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      For mentors and field mentors supporting pastors and
                      leaders.
                    </p>
                    <div className="text-xs text-gray-500 mb-4">
                      <span className="font-semibold text-gray-700">
                        Available users:
                      </span>{" "}
                      Mentor, Field Mentor
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-xs text-emerald-700">
                    <span>Continue as Mentor flow</span>
                    <span className="inline-flex items-center gap-1 text-[11px] bg-white/70 px-2 py-1 rounded-full">
                      {getAuthLabel()} &rarr;
                    </span>
                  </div>
                </button>
              </div>

              <p className="mt-6 text-[11px] text-center text-gray-400">
                You can switch between Pastor and Mentor flows later if your
                responsibilities change.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: Role selection popup based on module + authMode */}
      {isRoleModalOpen && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={closeRoleModal}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`relative w-full max-w-md mx-4 rounded-2xl bg-white shadow-2xl p-6 sm:p-8 transform transition-all duration-300 ease-out
              ${animateRoleModal ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
          >
            {/* Close button */}
            <button
              onClick={closeRoleModal}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition"
              aria-label="Close"
            >
              ✕
            </button>

            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-1 text-center">
              Who are you?
            </h2>
            <p className="text-xs text-indigo-600 font-medium text-center mb-1">
              {getModuleTitle()} &middot; {getAuthLabel()}
            </p>
            <p className="text-sm text-gray-500 mb-6 text-center">
              Choose the option that best describes your role. We’ll personalize
              the next page for you.
            </p>

            <div className="space-y-3">
              {getUserTypesForModule().map((type) => (
                <button
                  key={type.key}
                  onClick={() => handleSelectUserType(type.key)}
                  className="w-full text-left rounded-xl border border-gray-200 px-4 py-3 sm:px-5 sm:py-4 bg-white hover:bg-indigo-50 hover:border-indigo-300 transition flex items-start gap-3 group"
                >
                  <div className="mt-1 h-2 w-2 rounded-full bg-indigo-500 group-hover:scale-125 transition-transform" />
                  <div>
                    <div className="font-semibold text-gray-900 flex items-center gap-2">
                      {type.label}
                      <span className="text-xs text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full group-hover:bg-indigo-100">
                        Select
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">
                      {type.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>

            <p className="mt-5 text-[11px] text-center text-gray-400">
              You can always update your role later in your profile settings.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
