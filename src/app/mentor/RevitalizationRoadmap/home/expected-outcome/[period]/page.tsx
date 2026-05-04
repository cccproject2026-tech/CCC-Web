"use client";
import { useRouter, useParams } from "next/navigation";
import { useRef } from "react";
import Image from "next/image";
import CCCLogo from "@/app/Assets/CCCLogo.png";

export default function ExpectedOutcomePage() {
  const router = useRouter();
  const params = useParams();
  const period = (params?.period as string) || "";
  const contentRef = useRef<HTMLDivElement>(null);

  // Map period to title
  const getTitle = (period: string) => {
    switch (period) {
      case "4-months":
        return "Expected Outcome - First Four Months";
      case "6-months":
        return "Expected Outcome - Six Months";
      case "9-months":
        return "Expected Outcome - Nine Months";
      case "end-of-year":
        return "Expected Outcome - End of Year";
      default:
        return "Expected Outcome";
    }
  };

  // Expected outcomes content (same for all periods, but can be customized)
  const expectedOutcomes = [
    "The church is committed to the revitalization process.",
    "The Church is praying consistently and intentionally for revitalization.",
    "The church understands its current health and is committed to making improvements.",
    "The church is beginning to feel like a warm and welcoming place for new attendees.",
    "Church members have begun to build new relationships with people who have attended a community engagement event and its follow-up event.",
    "Church members will begin to feel a sense of hope for the future and begin expecting God to do something exciting in their church.",
  ];

  const handleSavePDF = async () => {
    if (!contentRef.current) return;

    try {
      const html2pdf = (await import("html2pdf.js")).default;
      const title = getTitle(period);

      // Create a simplified HTML structure for PDF (avoids oklch() color issues)
      const element = document.createElement("div");
      element.innerHTML = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <div style="margin-bottom: 20px; text-align: center;">
            <img src="${CCCLogo.src}" alt="CCC Logo" style="width: 250px; height: auto;" />
          </div>
          
          <h1 style="color: #2E3B8E; font-size: 24px; margin-bottom: 20px; text-align: left;">
            ${title}
          </h1>
          
          <hr style="border: none; border-top: 1px solid #ccc; margin-bottom: 20px;" />
          
          <div style="margin-top: 20px;">
            ${expectedOutcomes
          .map(
            (outcome) => `
              <div style="display: flex; gap: 15px; margin-bottom: 15px;">
                <div style="color: #FFB800; font-size: 16px; flex-shrink: 0;">★</div>
                <p style="color: #2E3B8E; font-size: 14px; line-height: 1.6; margin: 0;">
                  ${outcome}
                </p>
              </div>
            `
          )
          .join("")}
          </div>
        </div>
      `;

      const opt = {
        margin: 10,
        filename: `${title.replace(/\s+/g, "-").toLowerCase()}.pdf`,
        image: { type: "jpeg" as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { orientation: "portrait" as const, unit: "mm" as const, format: "a4" as const },
      };

      // html2pdf.js typings are loose; runtime API is `.set().from().save()`.
      (html2pdf() as { set: (o: typeof opt) => { from: (el: HTMLElement) => { save: () => void } } })
        .set(opt)
        .from(element)
        .save();
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Main Content */}
      <main className="flex-1 px-6 md:px-12 lg:px-20 py-10 bg-white">
        <div className="max-w-5xl mx-auto">
          {/* Header Buttons */}
          <div className="flex justify-between items-center mb-8">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-all font-medium"
            >
              <i className="fa-solid fa-arrow-left"></i>
              Back
            </button>
            <button
              onClick={handleSavePDF}
              className="flex items-center gap-2 px-6 py-2 bg-[#2E3B8E] text-white rounded-lg hover:bg-[#1F2A6E] transition-all font-semibold"
            >
              <i className="fa-solid fa-download"></i>
              Save PDF
            </button>
          </div>

          {/* Main Card */}
          <div ref={contentRef} className="bg-white rounded-xl shadow-lg p-8 md:p-12">
            {/* Logo Section - First */}
            <div className="mb-8">
              <Image
                src={CCCLogo}
                alt="The Center for Community Change"
                width={300}
                height={150}
                className="object-contain"
              />
            </div>

            {/* Title Section - Second */}
            <div className="mb-6 text-start">
              <h1 className="text-[#2E3B8E] text-2xl md:text-3xl font-bold mb-4">
                {period ? getTitle(period) : "Expected Outcome"}
              </h1>
            </div>

            {/* Horizontal Line - Third */}
            <div className="mb-8">
              <div className="h-px bg-gray-300"></div>
            </div>

            {/* Expected Outcomes List */}
            <div className="space-y-4 mt-8">
              {expectedOutcomes.map((outcome, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="mt-1">
                    <i className="fa-solid fa-star text-yellow-400 text-xl"></i>
                  </div>
                  <p className="text-[#2E3B8E] text-base leading-relaxed flex-1">
                    {outcome}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
