"use client";

import { useEffect, useState } from "react";
import "@fortawesome/fontawesome-free/css/all.min.css";
import MentorHeader from "@/app/Components/MentorHeader";
import { getCookie } from "@/app/utils/cookies";
import { apiGetUserById } from "@/app/Services/api";
import {
  mentorBodyText,
  mentorGlassCardFrost,
  mentorMainGradient,
  mentorPageRoot,
  mentorSpinner,
} from "@/app/Components/mentor/mentor-theme";

export default function MentorCertificatesPage() {
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

        const stored = getCookie("mentor");
        const user = stored ? JSON.parse(stored) : null;
        const userId = user?.id || user?._id;
        if (!userId) {
          setError("Mentor session not found. Please login again.");
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
    <div className={mentorPageRoot}>
      <MentorHeader showFullHeader={true} />

      <main className={`${mentorMainGradient} flex-1 px-4 py-10 md:px-8 lg:px-16`}>
        <div className={`mx-auto max-w-6xl p-6 md:p-8 ${mentorGlassCardFrost}`}>
          <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-[#d9ebf8]">
            <span className="h-2 w-2 rounded-full bg-[#8ec5eb]" />
            Leadership Support Network
          </p>

          <h1 className="mt-3 text-2xl font-semibold md:text-3xl">Certificates</h1>
          <p className={`mt-2 ${mentorBodyText}`}>
            Track and view your awarded certificates here.
          </p>

          <div className="mt-6 rounded-xl border border-[#8ec5eb]/25 bg-[#8ec5eb]/10 p-4">
            <h2 className="text-lg font-semibold text-white">Field Mentor Status</h2>
            <p className="mt-1 text-sm text-[#d9ebf8]">
              {fieldMentorState === "field_mentor" && "You are currently a Field Mentor."}
              {fieldMentorState === "invited" && "Field Mentor invitation has been sent/received."}
              {fieldMentorState === "eligible" &&
                "You are eligible to move as Field Mentor after course completion."}
              {fieldMentorState === "not_eligible" &&
                "Complete required courses to become eligible for Field Mentor."}
            </p>
          </div>

          <div className="mt-6 rounded-xl border border-white/15 bg-white/5 p-4">
            {loading && (
              <div className="flex flex-col items-center gap-3 py-4">
                <div className={mentorSpinner} />
                <p className={`text-sm ${mentorBodyText}`}>Loading certificates…</p>
              </div>
            )}
            {!loading && error && (
              <p className="text-sm text-[#ffb2b2]">{error}</p>
            )}
            {!loading && !error && certificates.length === 0 && (
              <p className={`text-sm ${mentorBodyText}`}>No certificates issued yet.</p>
            )}

            {!loading && !error && certificates.length > 0 && (
              <div className="space-y-2">
                {certificates.map((cert: any, index: number) => (
                  <div
                    key={cert._id || cert.id || index}
                    className="flex items-center justify-between rounded-lg border border-white/15 bg-white/5 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {cert.title || cert.name || "Certificate"}
                      </p>
                      <p className="text-xs text-[#cde2f2]">
                        {cert.issuedAt
                          ? new Date(cert.issuedAt).toLocaleDateString()
                          : cert.status || "Issued"}
                      </p>
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
