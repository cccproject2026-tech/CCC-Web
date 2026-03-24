"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import JumpStartHero from "@/app/Components/Hero/JumpStartHero";
import RoadmapHomeCard from "@/app/Components/RoadmapHomeCard";
import SelfRevitalizationHeroBg from "@/app/Assets/self-revitalization-hero.png";
import { apiGetRoadmapById } from "@/app/Services/roadmaps.service";
import MentorHeader from "@/app/Components/MentorHeader";

function PhasePageContent() {

    const router = useRouter();
    const searchParams = useSearchParams();

    const userId = searchParams.get("userId");
    const roadmapId = searchParams.get("roadmapId");

    const [phase, setPhase] = useState<any>(null);
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {

        if (!roadmapId) return;

        const fetch = async () => {
            try {

                const res = await apiGetRoadmapById(roadmapId);

                const roadmap = res.data?.data;

                console.log("phase:", roadmap);

                setPhase(roadmap);
                setTasks(roadmap?.roadmaps || []);

            } catch (err) {
                console.error("Failed to fetch roadmap:", err);
            } finally {
                setLoading(false);
            }
        };

        fetch();

    }, [roadmapId]);


    const openTask = (taskId: string) => {

        if (!userId || !roadmapId) return;

        router.push(
            `/mentor/RevitalizationRoadmap/task?userId=${userId}&roadmapId=${roadmapId}&taskId=${taskId}`
        );

    };

    if (loading) {
        return <div className="text-white p-10">Loading...</div>;
    }

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#1b598f] to-[#2876AC]">
            <MentorHeader showFullHeader={true} />
            {/* HERO */}
            <JumpStartHero
                backgroundImageUrl={SelfRevitalizationHeroBg.src}
                title={phase?.name || "Phase"}
                breadcrumbItems={[
                    { label: "Revitalization Roadmap", href: "/mentor/RevitalizationRoadmap" },
                    { label: phase?.name }
                ]}
                heightClasses="h-[240px]"
            />

            {/* MAIN */}
            <main className="flex-1 px-6 md:px-12 lg:px-20 py-10">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                    {tasks.length === 0 && (
                        <p className="text-white text-center col-span-2">
                            No tasks found for this phase
                        </p>
                    )}

                    {tasks.map((task: any) => (
                        <RoadmapHomeCard
                            key={task._id}
                            img={task.imageUrl}
                            title={task.name}
                            description={task.description}
                            status={task.status || "Not Started"}
                            completionTime={`Months ${task.duration}`}
                            showDateSelector={false}
                            onViewClick={() => openTask(task._id)}
                            onCardClick={() => openTask(task._id)}
                        />
                    ))}

                </div>

            </main>

        </div>
    );
}

export default function PhasePage() {
    return (
        <Suspense fallback={<div className="text-white p-10">Loading...</div>}>
            <PhasePageContent />
        </Suspense>
    );
}