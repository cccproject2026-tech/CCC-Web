"use client";

import { useEffect, useState } from "react";
import PastorHeader from "@/app/Components/PastorHeader";
import { getCookie } from "@/app/utils/cookies";
import { apiGetUserById } from "@/app/Services/api";
import {
  apiGetUserCertificate,
  hasRealCertificate,
  unwrapCertificate,
  type CertificateRecord,
} from "@/app/Services/certificates.service";
import { useRouter } from "next/navigation";

export default function PastorCertificatesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [certificate, setCertificate] = useState<CertificateRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldMentorState, setFieldMentorState] = useState<
    "not_eligible" | "eligible" | "invited" | "field_mentor"
  >("not_eligible");

  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        setLoading(true);
        setError(null);
        const user = JSON.parse(getCookie("user") || "{}");
        const userId = user?.id || user?._id;
        if (!userId) {
          setError("User session not found.");
          return;
        }

        const res = await apiGetUserById(userId);
        const userData = res.data?.data || {};
        const certificateRes = await apiGetUserCertificate(userId).catch((error) => {
          if (error?.response?.status === 404) return null;
          throw error;
        });
        const loadedCertificate = unwrapCertificate(certificateRes);
        setCertificate(loadedCertificate);

        if ((userData.role || "").toLowerCase().includes("field")) {
          setFieldMentorState("field_mentor");
        } else if (userData.fieldMentorInvitation) {
          setFieldMentorState("invited");
        } else if (hasRealCertificate(loadedCertificate)) {
          setFieldMentorState("eligible");
        } else {
          setFieldMentorState("not_eligible");
        }
      } catch (err) {
        console.error("Failed to fetch certificates:", err);
        setError("Unable to load certificates from API.");
      } finally {
        setLoading(false);
      }
    };

    fetchCertificates();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[radial-gradient(circle_at_20%_12%,rgba(141,211,243,0.18),transparent_38%),linear-gradient(180deg,#041f35_0%,#062946_100%)] text-white">
      <PastorHeader showFullHeader={true} />

      <main className="flex-1 px-4 py-10 md:px-8 lg:px-16">
        <div className="mx-auto max-w-6xl rounded-2xl border border-white/15 bg-[linear-gradient(180deg,rgba(12,58,95,0.9)_0%,rgba(10,53,88,0.95)_100%)] p-6 shadow-[0_20px_50px_rgba(2,20,38,0.35)] md:p-8">
          {/* <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-[#d9ebf8]">
            <span className="h-2 w-2 rounded-full bg-[#8ec5eb]" />
            Leadership Support Network
          </p> */}
          <h1 className="mt-3 text-2xl font-semibold md:text-3xl">Certificates</h1>
          <p className="mt-2 text-sm text-[#cde2f2]">
            Track and download your awarded certificates here.
          </p>

          {/* <div className="mt-5 rounded-xl border border-[#8ec5eb]/25 bg-[#8ec5eb]/10 p-4">
            <h2 className="text-lg font-semibold text-white">Field Mentor Status</h2>
            <p className="mt-1 text-sm text-[#d9ebf8]">
              {fieldMentorState === "field_mentor" && "You are currently a Field Mentor."}
              {fieldMentorState === "invited" && "Field Mentor invitation has been sent/received."}
              {fieldMentorState === "eligible" && "You are eligible to move as Field Mentor after course completion."}
              {fieldMentorState === "not_eligible" && "Complete required courses to become eligible for Field Mentor."}
            </p>
            {fieldMentorState === "eligible" && (
              <button
                onClick={() => router.push("/pastor/InterestForm")}
                className="mt-3 rounded-xl bg-[#8ec5eb] px-4 py-2 text-sm font-semibold text-[#062946] hover:bg-[#a9d5f2]"
              >
                Continue as Field Mentor
              </button>
            )}
          </div> */}

          <div className="mt-6 rounded-xl border border-white/15 bg-white/5 p-4">
            {loading && <p className="text-sm text-[#cde2f2]">Loading certificates...</p>}
            {!loading && error && <p className="text-sm text-[#ffb2b2]">{error}</p>}
            {!loading && !error && !hasRealCertificate(certificate) && (
              <p className="text-sm text-[#cde2f2]">No certificates issued yet.</p>
            )}
            {!loading && !error && hasRealCertificate(certificate) && certificate && (
              <div className="rounded-xl border border-[#8ec5eb]/25 bg-[#8ec5eb]/10 p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-lg font-semibold text-white">
                      {String(certificate.programName || "CCC Completion Certificate")}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-emerald-300">Issued</p>
                  </div>
                  <i className="fa-solid fa-certificate text-3xl text-[#8ec5eb]" aria-hidden />
                </div>

                <div className="mt-5 grid gap-3 text-sm text-[#d9ebf8] sm:grid-cols-2">
                  <p><span className="font-semibold text-white">Certificate ID:</span> {certificate.certificateId}</p>
                  <p><span className="font-semibold text-white">Date Received:</span> {certificate.issuedAt ? new Date(certificate.issuedAt).toLocaleDateString() : "N/A"}</p>
                  <p><span className="font-semibold text-white">Completed On:</span> {certificate.completionDate ? new Date(String(certificate.completionDate)).toLocaleDateString() : "N/A"}</p>
                  <p><span className="font-semibold text-white">Assigned Mentor:</span> {String(certificate.mentorName || "N/A")}</p>
                  <p><span className="font-semibold text-white">Issued By:</span> {String(certificate.issuedByName || certificate.directorName || "Director")}</p>
                </div>

                <p className="mt-5 text-sm leading-relaxed text-[#cde2f2]">
                  Congratulations on completing the 12-Month Mentoring Revitalization Program. You can view or download your certificate anytime.
                </p>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => window.open(String(certificate.certificateUrl || certificate.pdfUrl), "_blank", "noopener,noreferrer")}
                    disabled={!certificate.certificateUrl && !certificate.pdfUrl}
                    className="rounded-lg bg-[#8ec5eb] px-4 py-2.5 text-sm font-semibold text-[#062946] transition hover:bg-[#a9d5f2] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    View Certificate
                  </button>
                  <button
                    type="button"
                    onClick={() => window.open(String(certificate.pdfUrl || certificate.certificateUrl), "_blank", "noopener,noreferrer")}
                    disabled={!certificate.pdfUrl && !certificate.certificateUrl}
                    className="rounded-lg border border-white/25 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Download PDF
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
