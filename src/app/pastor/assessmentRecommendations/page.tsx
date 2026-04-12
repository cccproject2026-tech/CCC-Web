"use client";

import { useState } from "react";
import HeroBg from "../../Assets/progress-bg.png";

export default function PastorAssessmentRecommendationsPage() {
    const [selected, setSelected] = useState<any>(null);

    // 🔴 Replace with API
    const assessments = [
        {
            id: "1",
            name: "Mental Health Check",
            sections: [
                {
                    title: "Emotional Health",
                    recommendations: ["Improve communication", "Attend counseling"],
                },
            ],
        },
    ];

    return (
        <div className="flex min-h-screen flex-col bg-[#062946] text-white">

            {/* HERO */}
            <section
                className="relative bg-cover px-4 pb-10 pt-4 md:px-20"
                style={{ backgroundImage: `url(${HeroBg.src})` }}
            >
                <div className="absolute inset-0 bg-black/60" />
                <div className="relative z-10 max-w-6xl mx-auto">
                    <h1 className="text-2xl font-semibold">My Recommendations</h1>
                </div>
            </section>

            {/* MAIN */}
            <main className="flex-1 px-4 md:px-20 py-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* LEFT */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                        <h2 className="text-[#8ec5eb] mb-4">Assessments</h2>

                        {assessments.map((a) => (
                            <button
                                key={a.id}
                                onClick={() => setSelected(a)}
                                className="block w-full text-left px-4 py-3 rounded-lg hover:bg-white/10"
                            >
                                {a.name}
                            </button>
                        ))}
                    </div>

                    {/* RIGHT */}
                    <div className="lg:col-span-2">
                        {!selected ? (
                            <Empty text="Select an assessment" />
                        ) : (
                            <div>
                                <div className="flex justify-between mb-6">
                                    <h2 className="text-xl font-semibold">{selected.name}</h2>

                                    <button className="px-4 py-2 bg-[#8ec5eb]/25 rounded-lg text-sm">
                                        Download
                                    </button>
                                </div>

                                {selected.sections.map((s: any, i: number) => (
                                    <div
                                        key={i}
                                        className="mb-4 p-5 rounded-2xl border border-white/10 bg-white/5"
                                    >
                                        <h3 className="text-[#8ec5eb] font-semibold mb-2">
                                            {s.title}
                                        </h3>

                                        {s.recommendations?.length > 0 ? (
                                            <ul className="list-disc list-inside text-sm text-white/70 space-y-1">
                                                {s.recommendations.map((r: string, i: number) => (
                                                    <li key={i}>{r}</li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="text-white/50 text-sm">
                                                No recommendations yet
                                            </p>
                                        )}
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

function Empty({ text }: any) {
    return (
        <div className="p-10 text-center border border-white/10 bg-white/5 rounded-2xl">
            <p className="text-white/50">{text}</p>
        </div>
    );
}