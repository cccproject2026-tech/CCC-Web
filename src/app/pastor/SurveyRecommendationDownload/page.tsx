"use client";
import Image from "next/image";
import PastorHeader from "@/app/Components/PastorHeader";
import PastorFooter from "@/app/Components/PastorFooter";
import Logo from "../../Assets/CCCLogo.png"; // 🖼 replace with your actual logo image
import "@fortawesome/fontawesome-free/css/all.min.css";

export default function SurveyRecommendationDownload() {
  const userName = "John Ross";
  const dateCompleted = "20 Nov 2024";

  const sections = [
    { id: 1, title: "Personal Well-Being" },
    { id: 2, title: "Professional Development/ Leadership style" },
    { id: 3, title: "Community Engagement (CE) Experience" },
    { id: 4, title: "Congregational Health" },
    { id: 5, title: "Continuing Education" },
  ];

  const plans = [
    "Schedule 1-on-1 with a mentor",
    "Take trauma survey (via Claritysoft)",
    "Identify areas of stress/anxiety",
    "Family Wellbeing survey",
    "Collaborate on a healing plan",
    "Collaborate on a physical Exercise plan",
    "Establish a prayer",
    "Covenant/partnership",
    "Finalize a growth plan",
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F7FB] text-[#0B1C58]">
      <PastorHeader showFullHeader={true} />

      {/* PAGE HEADER ACTIONS */}
      <div className="flex justify-between items-center px-16 pt-8">
        <button className="text-[#103C8C] font-medium text-sm flex items-center gap-2 hover:underline">
          <i className="fa-solid fa-arrow-left"></i> Back
        </button>
        <button className="bg-[#103C8C] text-white text-sm font-medium px-5 py-2 rounded-md shadow hover:bg-[#0B2E72]">
          <i className="fa-solid fa-download mr-2"></i> Download
        </button>
      </div>

      {/* MAIN WHITE DOCUMENT */}
      <main className="flex-1 flex justify-center py-10">
        <div className="bg-white w-[800px] rounded-lg shadow-md border border-[#E5E7EB] px-10 py-10 text-[#0B1C58]">
          {/* HEADER */}
          <div className="flex justify-between items-start mb-8">
            <div className="flex gap-3 -ml-10">
              <Image
                src={Logo}
                alt="CCC Logo"
                width={250}
                height={60}
                className="object-contain"
              />
            </div>
            <h3 className="text-[#103C8C] font-semibold text-[16px]">
              {userName}
            </h3>
          </div>

          {/* ASSESSMENT INFO */}
          <div className="mb-6">
            <h2 className="text-[15px] font-semibold mb-1">
              Assessment Name :{" "}
              <span className="text-[#103C8C] font-semibold">
                Pastoral Ministry Profile (PMP)
              </span>
            </h2>
            <p className="text-[13px] text-[#6B7280]">
              Completed On: <span className="font-medium">{dateCompleted}</span>
            </p>
          </div>

          {/* SECTION CARDS */}
          <div className="flex flex-col gap-6">
            {sections.map((section) => (
              <div
                key={section.id}
                className="border border-[#E5EAF1] rounded-md p-6 bg-[#FAFBFF]"
              >
                <h4 className="text-[15px] font-semibold mb-3 text-[#0B1C58]">
                  Section {section.id} - {section.title}
                </h4>

                <h5 className="text-[13px] font-medium mb-2 text-[#0B1C58]">
                  Customized Development Plans:
                </h5>

                <ul className="list-none space-y-2 text-[13px] text-[#374151]">
                  {plans.map((plan, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <i className="fa-solid fa-star text-[#FFD84E] text-[11px]"></i>
                      {plan}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </main>

      <PastorFooter />
    </div>
  );
}
