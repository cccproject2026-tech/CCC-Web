"use client";
import Image from "next/image";
import PastorHeader from "@/app/Components/PastorHeader";
import PastorFooter from "@/app/Components/PastorFooter";
import Logo from "@/app/Assets/CCCLogo.png"; // 🖼️ Replace with your logo image
import "@fortawesome/fontawesome-free/css/all.min.css";

export default function ExpectedOutcomePage() {
  const outcomes = [
    "The church is committed to the revitalization process.",
    "The Church is praying consistently and intentionally for revitalization.",
    "The church understands its current health and is committed to making improvements.",
    "The church is beginning to feel like a warm and welcoming place for new attendees.",
    "Church members have begun to build new relationships with people who have attended a community engagement event and its follow-up event.",
    "Church members will begin to feel a sense of hope for the future and begin expecting God to do something exciting in their church.",
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F9FBFF]">
      {/* Header */}
      <PastorHeader showFullHeader={true} />

      {/* Main Content */}
      <main className="flex-1 px-10 py-10">
        <div className="max-w-5xl mx-auto relative">
          {/* Top Buttons */}
          <div className="flex justify-between items-center mb-6">
            {/* Back Button */}
            <button className="flex items-center gap-2 bg-[#F4F6FA] hover:bg-[#E9EDF5] transition px-4 py-2 rounded-full text-sm text-gray-700 font-medium">
              <i className="fa-solid fa-arrow-left text-sm"></i> Back
            </button>

            {/* Save PDF Button */}
            <button className="bg-[#103C8C] hover:bg-[#0B2E72] text-white text-sm font-medium px-4 py-2 rounded-md shadow">
              <i className="fa-solid fa-file-pdf mr-2 text-xs"></i> Save PDF
            </button>
          </div>

          {/* Center Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-10 text-gray-800">
            {/* Logo */}
            <div className="flex justify-start mb-6 -ml-10">
              <Image
                src={Logo}
                alt="The Center for Community Change"
                className="w-[370px] h-auto"
              />
            </div>

            {/* Title */}
            <h2 className="text-lg font-semibold text-[#103C8C] mb-2">
              Expected Outcome – First Four Months
            </h2>
            <hr className="border-gray-300 mb-6" />

            {/* Bullet Points */}
            <ul className="space-y-3 text-[15px] leading-relaxed">
              {outcomes.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <i className="fa-solid fa-star text-[#FFCC33] text-sm mt-[4px]"></i>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>

   
    </div>
  );
}
