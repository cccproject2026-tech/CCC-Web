"use client";

import { useEffect, useState } from "react";
import PastorHeader from "@/app/Components/PastorHeader";
import { getCookie } from "@/app/utils/cookies";
import { apiGetUserById } from "@/app/Services/api";
import { useRouter } from "next/navigation";

export default function PastorCertificatesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [certificates, setCertificates] = useState<any[]>([]);
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
        const certList = Array.isArray(userData?.certificates)
          ? userData.certificates
          : userData?.hasIssuedCertificate
            ? [{ title: "CCC Completion Certificate", status: "Issued" }]
            : [];
        setCertificates(certList);

        if ((userData.role || "").toLowerCase().includes("field")) {
          setFieldMentorState("field_mentor");
        } else if (userData.fieldMentorInvitation) {
          setFieldMentorState("invited");
        } else if (userData.hasIssuedCertificate || certList.length > 0) {
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
            {!loading && !error && certificates.length === 0 && (
              <p className="text-sm text-[#cde2f2]">No certificates issued yet.</p>
            )}
            {!loading && !error && certificates.length > 0 && (
              <div className="space-y-2">
                {certificates.map((cert: any, index) => (
                  <div key={cert._id || cert.id || index} className="flex items-center justify-between rounded-lg border border-white/15 bg-white/5 px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{cert.title || cert.name || "Certificate"}</p>
                      <p className="text-xs text-[#cde2f2]">{cert.issuedAt ? new Date(cert.issuedAt).toLocaleDateString() : cert.status || "Issued"}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
