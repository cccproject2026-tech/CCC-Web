"use client";

import Image from "next/image";
import CertificateTemplate from "@/app/Assets/certi.png";

type CertificatePreviewProps = {
  pastorName: unknown;
  completionDate?: unknown;
  certificateId?: unknown;
  duration?: unknown;
  className?: string;
};

function formatDate(raw: unknown): string {
  if (!raw) return "N/A";
  const date = new Date(String(raw));
  return Number.isNaN(date.getTime()) ? "N/A" : date.toLocaleDateString();
}

function text(raw: unknown, fallback = "N/A"): string {
  const value = String(raw ?? "").trim();
  return value || fallback;
}

export async function downloadCertificatePreviewPdf(
  previewElement: HTMLElement | null,
  certificateId: unknown,
  fallbackUrl?: unknown,
) {
  try {
    if (!previewElement) {
      throw new Error("Certificate preview is not ready.");
    }

    const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
      import("html2canvas"),
      import("jspdf"),
    ]);
    // const canvas = await html2canvas(previewElement, {
    //   backgroundColor: "#ffffff",
    //   scale: 2,
    //   useCORS: true,
    // });
    // const imageData = canvas.toDataURL("image/png");
    // const pdf = new jsPDF({
    //   orientation: "landscape",
    //   unit: "px",
    //   format: [canvas.width, canvas.height],
    // });
    // const pageWidth = pdf.internal.pageSize.getWidth();
    // const pageHeight = pdf.internal.pageSize.getHeight();

    // pdf.addImage(imageData, "PNG", 0, 0, pageWidth, pageHeight);
const canvas = await html2canvas(previewElement, {
  backgroundColor: "#ffffff",
  scale: 3,
  useCORS: true,
});

const imageData = canvas.toDataURL("image/png");

const pdf = new jsPDF("l", "mm", [140.2, 112.2]);

pdf.addImage(imageData, "PNG", 0, 0, 140.2, 112.2);
    pdf.save(`${text(certificateId, "certificate")}.pdf`);
  } catch (error) {
    console.error("Failed to generate certificate preview PDF", error);
    const url = String(fallbackUrl ?? "").trim();
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  }
}

export default function CertificatePreview({
  pastorName,
  completionDate,
  certificateId,
  duration,
  className = "",
}: CertificatePreviewProps) {
  return (
    // <div id="certificate-preview" className={`relative mx-auto aspect-[1402/1122] max-h-[78vh] w-full max-w-[97.5vh] overflow-hidden bg-white ${className}`}>
    <div
  id="certificate-preview"
  className={`relative mx-auto aspect-[1402/1122] w-full max-w-[1100px] overflow-hidden bg-white ${className}`}
>
      <Image
        src={CertificateTemplate}
        alt="Completion certificate preview"
        fill
        priority
        sizes="(max-width: 1024px) 95vw, 1100px"
        className="object-contain"
      />

      {/* Pastor name */}
      <p className="absolute left-[23%] right-[18%] top-[42.4%] truncate text-center font-serif text-[clamp(11px,1.8vw,24px)] font-bold text-[#082d72]">
        {text(pastorName, "Pastor")}
      </p>

      {/* Completed date */}
      <p className="absolute left-[18.5%] top-[77.6%] w-[10%] text-center text-[clamp(6px,0.75vw,11px)] font-semibold text-[#082d72]">
        {formatDate(completionDate)}
      </p>

      {/* Duration */}
      <p className="absolute left-[32%] top-[77.6%] w-[10%] text-center text-[clamp(6px,0.75vw,11px)] font-semibold text-[#082d72]">
        {text(duration, "12 Months")}
      </p>

      {/* Certificate ID */}
      <p className="absolute left-[58%] top-[77.6%] w-[15%] truncate text-center text-[clamp(5px,0.65vw,9px)] font-semibold text-[#082d72]">
        {text(certificateId)}
      </p>

      {/* Status */}
      <p className="absolute left-[74%] top-[77.6%] w-[10%] text-center text-[clamp(6px,0.75vw,11px)] font-semibold text-[#082d72]">
        Completed
      </p>
    </div>
  );
}
