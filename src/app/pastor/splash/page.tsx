"use client";
import Image from "next/image";
import CCClogo from "../../Assets/splash.svg";
import Framelogo1 from "../../Assets/Frame-logo-1.png"
import Connecticon from "../../Assets/Connect-icon.png"
import { useRouter } from "next/navigation";

export default function SplashScreen() {

   const router = useRouter();
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-[#1a5a8f] text-white relative overflow-hidden">
   
      <div className="absolute top-6 right-6 ">
        <button
          className="p-2 cursor-pointer"
          aria-label="Share"
        >
             <Image
        src={Connecticon} 
            alt="Connect Icon"
            width={30}
            height={30}
            onClick={() =>router.push(`/pastor/waitingforapproval`)}
          />
        </button>
      </div>

   
      <div className="flex flex-col items-center">

        <Image
        src={CCClogo} 
          alt="The Center for Community Change"
          width={320}
          height={200}
          className="mb-8"
        />

      </div>

     
      <div className="flex items-center gap-8 mt-16">
      
        <button className="p-3 hover:scale-105 transition cursor-pointer">
             <Image
        src={Framelogo1} 
            alt="Flame Icon"
            width={40}
            height={40}
             onClick={() =>router.push(`/pastor/waitingforapproval`)}
          />
        </button>

      
        <div className="w-px h-10 bg-white/40"></div>

       
        <button className="p-3 bg-white rounded-full shadow-lg hover:scale-105 transition cursor-pointer">
           <Image
        src={Connecticon} 
            alt="Connect Icon"
            width={28}
            height={28}
             onClick={() =>router.push(`/pastor/waitingforapproval`)}
          />
        </button>
      </div>
    </main>
  );
}
