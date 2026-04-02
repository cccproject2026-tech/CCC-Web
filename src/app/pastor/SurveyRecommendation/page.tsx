"use client";
import Image from "next/image";
import PastorHeader from "@/app/Components/PastorHeader";
import PastorFooter from "@/app/Components/PastorFooter";
import "@fortawesome/fontawesome-free/css/all.min.css";

export default function SurveyRecommendationPage() {
  const cards = [
    {
      section: "Section 1",
      title: "Personal Well-Being",
      level: "You are at Level I",
      gradient: "from-[#0A4AB8] to-[#143B94]",
    },
    {
      section: "Section 2",
      title: "Professional Development/Leadership style",
      level: "You are at Level I",
      gradient: "from-[#0A4AB8] to-[#143B94]",
    },
    {
      section: "Section 3",
      title: "Community Engagement (CE) Experience",
      level: "You are at Level I",
      gradient: "from-[#0A4AB8] to-[#143B94]",
    },
    {
      section: "Section 4",
      title: "Congregational Health",
      level: "You are at Level II",
      gradient: "from-[#5B3BB6] to-[#2A1F8F]",
    },
    {
      section: "Section 5",
      title: "Continuing Education",
      level: "You are at Level II",
      gradient: "from-[#5B3BB6] to-[#2A1F8F]",
    },
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
    <div className="min-h-screen flex flex-col bg-[radial-gradient(circle_at_20%_18%,rgba(86,162,214,0.22),transparent_42%),linear-gradient(180deg,#0a2f4d_0%,#09233b_100%)] text-white">
      <PastorHeader showFullHeader={true} />

      {/* PAGE HEADER */}
      <div className="flex justify-between items-center px-16 pt-8">
        <button className="text-[#cbe6f9] font-medium text-sm flex items-center gap-2 hover:text-white">
          <i className="fa-solid fa-arrow-left"></i> Back
        </button>
        <button className="rounded-xl bg-[#8ec5eb] px-5 py-2 text-sm font-semibold text-[#062946] shadow-[0_12px_30px_rgba(2,20,38,0.35)] transition hover:bg-[#a9d5f2]">
          <i className="fa-solid fa-download mr-2"></i> Download
        </button>
      </div>

      {/* CONTENT */}
      <main className="flex-1 px-16 py-10">
        <h1 className="mb-10 text-2xl font-semibold text-white">
          Survey Recommendation
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center">
          {cards.map((card, index) => (
            <div
              key={index}
              className={`w-[360px] rounded-2xl text-white shadow-lg hover:shadow-xl transition-all duration-200 bg-gradient-to-b ${card.gradient} p-6 flex flex-col justify-between`}
            >
              <div>
                <h4 className="text-[13px] font-medium opacity-90 mb-1">
                  Pastoral Ministry Profile (PMP)
                </h4>

                <div className="flex items-center justify-between mb-3">
                  <span className="text-[12px] bg-gradient-to-r from-[#A678FF] to-[#6B4EFF] px-3 py-[2px] rounded-md font-medium">
                    {card.section}
                  </span>
                  <span className="text-[11px] font-medium opacity-80">
                    {card.level}
                  </span>
                </div>

                <h3 className="text-lg font-semibold mb-4 leading-snug">
                  {card.title}
                </h3>

                {/* Inner box */}
                <div className="bg-gradient-to-b from-[#0F3A85] to-[#092C6E] rounded-xl p-5">
                  <h5 className="text-[13px] font-semibold mb-3 text-white">
                    Customized Development Plans
                  </h5>

                  <ul className="list-none space-y-2 text-[13px] text-[#E0E7FF]">
                    {plans.map((plan, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <i className="fa-solid fa-star text-[#FFD84E] text-[11px]"></i>
                        {plan}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

     
    </div>
  );
}
