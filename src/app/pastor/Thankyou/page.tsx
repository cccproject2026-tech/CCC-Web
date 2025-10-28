"use client";
import HeroSection from "../../Components/HeroSection";
import WhatWeDoSection from "../../Components/WhatWeDoSection";
import { useRouter } from "next/navigation";

export default function Thankyou() {

   const router = useRouter();
  return (
    <div>
     <HeroSection
      title="Thank You!"
      subtitle="Your form submitted successfully please wait for approval"
      primaryBtn={{
        label: "Check Status",
        onClick: () => router.push("/pastor/Processing"),
      }}
    
      showContactBox={true}
    />
      <WhatWeDoSection />
    </div>
  );
}
