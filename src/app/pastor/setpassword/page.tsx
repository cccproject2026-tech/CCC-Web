"use client";
import Image from "next/image";
import CCCLogo from "../../Assets/CCCLogo.png";
import PastorHeader from "@/app/Components/PastorHeader";
import AndrewsLogo from "../../Assets/andrews-logo.png"; 

export default function SetPasswordPage() {
  return (
    <div>
        <PastorHeader/>
    <section className="flex min-h-screen">
  
      <div className="w-full md:w-1/2 bg-white flex flex-col items-center justify-center p-8">
        
          <Image
            src={CCCLogo}
            alt="CCC Logo"
            className="w-full object-contain mb-4"
          />
       
      
      </div>

  
      <div className="w-full md:w-1/2 bg-gradient-to-b from-[#103C8C] to-[#1B4C9E] flex flex-col items-center justify-center px-8 relative">
    

    
        <div className="text-center mb-5">
          <h1 className="text-white text-2xl font-semibold tracking-wide">
            WELCOME !
          </h1>
          <p className="text-[#E9C700] text-sm mt-1">
            Welcome to your revitalization roadmap
          </p>
        </div>

      
        <div className="w-full max-w-[380px] bg-transparent">
          <h2 className="text-white text-left text-sm mb-3 font-medium">
            Set Password
          </h2>

          <form className="flex flex-col gap-4">
            <input
              type="email"
              placeholder="Username (Auto generated) Email ID"
              className="w-full rounded-md px-4 py-2 text-sm bg-transparent border border-white/50 text-white placeholder:text-white/70 focus:outline-none focus:border-white"
            />
            <input
              type="password"
              placeholder="Create Password"
              className="w-full rounded-md px-4 py-2 text-sm bg-transparent border border-white/50 text-white placeholder:text-white/70 focus:outline-none focus:border-white"
            />
            <input
              type="password"
              placeholder="Confirm Password"
              className="w-full rounded-md px-4 py-2 text-sm bg-transparent border border-white/50 text-white placeholder:text-white/70 focus:outline-none focus:border-white"
            />
            <button
              type="submit"
              className="w-full mt-4 bg-white text-[#103C8C] font-medium py-2 rounded-md hover:opacity-90 transition"
            >
              Submit
            </button>
          </form>
        </div>

       
        <div className="absolute bottom-6">
          <div className="flex flex-col items-center">
            <Image
              src={AndrewsLogo}
              alt="Andrews University Logo"
              className="w-[220px] object-contain"
            />
          </div>
        </div>
      </div>
    </section>
    </div>
  );
}
