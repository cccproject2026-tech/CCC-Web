"use client";

import { useState } from "react";
import MentorHeader from "@/app/Components/MentorHeader";
import HeroBg from "../../Assets/progress-bg.png";

export default function MentorAssessmentRecommendationsPage() {
    const [selectedPastor, setSelectedPastor] = useState<any>(null);
    const [selectedAssessment, setSelectedAssessment] = useState<any>(null);

    // 🔴 Replace with API later
    const pastors = [
        {
            id: "1",
            name: "John Mathew",
            assessments: [
                {
                    id: "a1",
                    name: "Mental Health Check",
                    sections: [
                        {
                            sectionId: "s1",
                            sectionTitle: "Emotional Health",
                            score: 2,
                            recommendations: ["Practice reflection"],
                            sent: false,
                        },
                    ],
                },
            ],
        },
    ];

    return (
        <div className="flex min-h-screen flex-col bg-[#062946] text-white">
            <MentorHeader showFullHeader />

            {/* HERO */}
            <section
                className="relative bg-cover px-4 pb-10 pt-4 md:px-20"
                style={{ backgroundImage: `url(${HeroBg.src})` }}
            >
                <div className="absolute inset-0 bg-black/60" />
                <div className="relative z-10 max-w-6xl mx-auto">
                    <h1 className="text-2xl font-semibold">Assessment Recommendations</h1>
                    <p className="text-sm text-white/60 mt-1">
                        Review and send recommendations to pastors
                    </p>
                </div>
            </section>

            {/* MAIN */}
            <main className="flex-1 px-4 md:px-20 py-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* LEFT PANEL */}
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                        <h2 className="text-[#8ec5eb] font-semibold mb-4">Pastors</h2>

                        {pastors.map((p) => (
                            <button
                                key={p.id}
                                onClick={() => {
                                    setSelectedPastor(p);
                                    setSelectedAssessment(null);
                                }}
                                className="w-full text-left px-4 py-3 rounded-lg bg-white/5 hover:bg-white/10 mb-2"
                            >
                                {p.name}
                            </button>
                        ))}
                    </div>

                    {/* RIGHT PANEL */}
                    <div className="lg:col-span-2">
                        {!selectedPastor ? (
                            <Empty text="Select a pastor" />
                        ) : !selectedAssessment ? (
                            <AssessmentList
                                pastor={selectedPastor}
                                onSelect={setSelectedAssessment}
                            />
                        ) : (
                            <RecommendationEditor
                                pastor={selectedPastor}
                                assessment={selectedAssessment}
                            />
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

/* ---------------- COMPONENTS ---------------- */

function AssessmentList({ pastor, onSelect }: any) {
    return (
        <div className="space-y-4">
            {pastor.assessments.map((a: any) => (
                <div
                    key={a.id}
                    className="p-5 rounded-2xl border border-white/10 bg-white/5"
                >
                    <h3 className="text-lg font-semibold">{a.name}</h3>
                    <button
                        onClick={() => onSelect(a)}
                        className="mt-3 px-4 py-2 bg-[#8ec5eb]/20 rounded-lg text-sm"
                    >
                        View Recommendations
                    </button>
                </div>
            ))}
        </div>
    );
}

function RecommendationEditor({ pastor, assessment }: any) {
    const [localData, setLocalData] = useState(assessment.sections);

    const updateText = (id: string, value: string) => {
        setLocalData((prev: any) =>
            prev.map((s: any) =>
                s.sectionId === id
                    ? { ...s, recommendations: value.split("\n") }
                    : s
            )
        );
    };

    return (
        <div>
            <h2 className="text-xl font-semibold mb-4">
                {pastor.name} → {assessment.name}
            </h2>

            {localData.map((section: any) => (
                <div
                    key={section.sectionId}
                    className="mb-5 p-5 rounded-2xl border border-white/10 bg-white/5"
                >
                    <h3 className="text-[#8ec5eb] font-semibold">
                        {section.sectionTitle}
                    </h3>

                    <p className="text-sm text-white/50 mb-2">
                        Score: {section.score}
                    </p>

                    {section.sent ? (
                        <p className="text-green-400 text-sm">Recommendation Sent</p>
                    ) : (
                        <>
                            <textarea
                                defaultValue={section.recommendations.join("\n")}
                                onChange={(e) =>
                                    updateText(section.sectionId, e.target.value)
                                }
                                className="w-full mt-3 bg-white/5 border border-white/10 rounded-lg p-3 text-sm"
                            />

                            <button className="mt-3 px-4 py-2 bg-[#8ec5eb]/25 rounded-lg text-sm">
                                Send Recommendation
                            </button>
                        </>
                    )}
                </div>
            ))}
        </div>
    );
}

function Empty({ text }: any) {
    return (
        <div className="p-10 text-center border border-white/10 bg-white/5 rounded-2xl">
            <p className="text-white/50">{text}</p>
        </div>
    );
}