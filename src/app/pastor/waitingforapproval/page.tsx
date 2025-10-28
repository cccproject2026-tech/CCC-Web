"use client";
import HeroSection from "../../Components/HeroSection";
import WhatWeDoSection from "../../Components/WhatWeDoSection";
import { useRouter } from "next/navigation";

export default function waitingforapproval() {

   const router = useRouter();
  return (
    <div>
     <HeroSection
      title="Center for Community Change"
      subtitle="Guiding pastors toward growth, connection, and impactful ministry with personalized mentoring and community support."
      primaryBtn={{
        label: "New User",
        onClick: () => router.push("/pastor/InterestForm"),
      }}
      secondaryBtn={{
        label: "Log In",
        onClick: () => router.push("/pastor/login"),
      }}
      showContactBox={true}
    />
      <WhatWeDoSection />
    </div>
  );
}
