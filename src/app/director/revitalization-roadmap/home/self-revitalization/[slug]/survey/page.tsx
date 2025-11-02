"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import AppHeader from "@/app/Components/AppHeader";
import SurveyHero from "@/app/Components/Hero/SurveyHero";
import CMALogo from "@/app/Assets/CMA logo.png";
import PMPLogo from "@/app/Assets/pastoral-ministry-profile.png";
import "@fortawesome/fontawesome-free/css/all.min.css";

interface SurveyPageProps {
  params:
    | Promise<{
        slug: string;
      }>
    | {
        slug: string;
      };
}

export default function SurveyPage({ params }: SurveyPageProps) {
  const [slug, setSlug] = useState<string>("");

  useEffect(() => {
    if (params instanceof Promise) {
      params.then((resolvedParams) => {
        setSlug(resolvedParams.slug);
      });
    } else {
      setSlug(params.slug);
    }
  }, [params]);

  const [activeSection, setActiveSection] = useState(1);

  const sections = [
    {
      id: 1,
      title: "Personal Well-Being (biopyschosocial (BPS)/spiritual filter)",
    },
    {
      id: 2,
      title: "Professional Development/ Leadership style",
    },
    {
      id: 3,
      title: "Community Engagement (CE) Experience",
    },
    {
      id: 4,
      title: "Congregational Health",
    },
    {
      id: 5,
      title: "Continuing Education",
    },
  ];

  // Sample questions for Section 1
  const section1Questions = [
    [
      "Feeling physically drained most of the time.",
      "Often feeling drained",
      "Feeling mostly energized and engaged",
      "Feeling fully energized and enjoying life",
    ],
    [
      "Not physically active",
      "Occasional exercise",
      "In the process of adopting an exercise plan",
      "Committed to a exercise plan",
    ],
    [
      "Constant perception of stress/anxiety",
      "Thinking about getting professional help to deal with stress and anxiety (addiction(s))",
      "Working with a mental health professional",
      "Demonstrating high El - have a consistent routine for maintaining strong mental health",
    ],
  ];

  // Sample questions for Section 1 (additional from second image)
  const section1AdditionalQuestions = [
    [
      "Significant marital/parental challenges",
      "Experiencing regular relational challenges",
      "Pays close attention to family relationships",
      "Actively engaged in the family life, prioritizing it as the most important personal and professional responsibility",
    ],
    [
      "Feeling lost",
      "A vague sense of self-identity; relies on others for personal and professional affirmation",
      "Has a plan and an accountability partner(s) for personal spiritual and professional growth",
      "provides spiritual guidance and professional coaching to colleagues",
    ],
    [
      "Struggling with keeping the faith",
      "Not sensing a strong personal connection with God",
      "Lives in a structured spiritual-life rhythm",
      "incorporates faith in all aspects of personal and professional life",
    ],
    [
      "Struggling with addiction(s)",
      "Has identified a number of obstacles detrimental to personal growth and professional success",
      "Regularly receives professional/expert guidance regarding personal well being",
      "Has experienced positive transformation and committed to continued improvement",
    ],
    ["Lack of sleep"],
    ["Limited supporting relationships"],
    ["No plan for self-care"],
  ];

  const getTitle = () => {
    if (slug === "pastoral-ministry-profile-pmp") {
      return "Pastoral Ministry Profile (PMP)";
    }
    return "Church Assessment Evaluation (CMA)";
  };

  const getSubtitle = () => {
    if (slug === "pastoral-ministry-profile-pmp") {
      return "This Survey is about Lorem ipsum dolor sit amet, consectetur";
    }
    return "This Assessment is about your current personal well being";
  };

  const getQuestions = () => {
    if (activeSection === 1) {
      return [...section1Questions, ...section1AdditionalQuestions];
    }
    return [];
  };

  const getRightContent = () => {
    if (slug === "pastoral-ministry-profile-pmp") {
      return (
        <Image
          src={PMPLogo}
          alt="Pastoral Ministry Profile"
          width={200}
          height={120}
          className="object-contain"
        />
      );
    }
    return (
      <Image
        src={CMALogo}
        alt="CMA Logo"
        width={120}
        height={80}
        className="object-contain"
      />
    );
  };

  return (
    <div className="min-h-screen bg-[#1b5a90]">
      <SurveyHero
        title={getTitle()}
        subtitle={getSubtitle()}
        breadcrumbItems={[
          {
            label: "Pastor's Roadmaps",
            href: "/director/revitalization-roadmap",
          },
          { label: "John Ross", href: "#" },
          { label: "Revitalization Roadmap", href: "#" },
          { label: "Self Revitalization Phase", href: "#" },
          { label: getTitle(), href: "#" },
          { label: "Survey", href: "#" },
        ]}
        rightContent={getRightContent()}
      />

      {/* Main Content Area */}
      <main className="px-8 py-8">
        <div className="flex gap-8">
          {/* Left Sidebar - Survey Sections */}
          <aside className="w-[280px] flex-shrink-0">
            <div className="bg-white rounded-xl p-5 space-y-4">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full text-left p-3 rounded-lg transition-all ${
                    activeSection === section.id
                      ? "bg-[#2E3B8E] text-white"
                      : "bg-white text-[#2E3B8E] border border-gray-200"
                  }`}
                >
                  <div className="text-sm font-semibold">
                    Section {section.id}
                  </div>
                  <div
                    className={`text-xs mt-1 ${
                      activeSection === section.id
                        ? "text-white/90"
                        : "text-gray-600"
                    }`}
                  >
                    {section.title}
                  </div>
                </button>
              ))}
            </div>
          </aside>

          {/* Right Panel - Survey Questions */}
          <section className="flex-1">
            <div className="space-y-6">
              {getQuestions().map((questionSet, index) => (
                <div
                  key={index}
                  className="bg-transparent border border-white/20 rounded-xl p-6"
                >
                  <ol className="space-y-3">
                    {questionSet.map((item, itemIndex) => (
                      <li
                        key={itemIndex}
                        className="text-white text-sm leading-relaxed"
                      >
                        {itemIndex + 1}. {item}
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>

            {/* View Next Section Button */}
            <div className="flex justify-end mt-8">
              <button
                onClick={() => {
                  if (activeSection < sections.length) {
                    setActiveSection(activeSection + 1);
                  } else {
                    // Handle completion or next action
                  }
                }}
                className="bg-[#1A2E5C] text-white rounded-lg px-6 py-3 text-sm font-semibold hover:bg-[#0F1E44] transition-all flex items-center gap-2"
              >
                View Next Section <i className="fa-solid fa-chevron-right"></i>
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
