"use client";
import Image from "next/image";
import CCCLogo from "../../Assets/CCCLogo.png"; 
import PastorHeader from "@/app/Components/PastorHeader";
import AndrewsLogo from "../../Assets/andrews-logo.png"; 

export default function ResetPasswordPage() {
  return (
    <div>
      <PastorHeader />

      <section className="flex min-h-screen">
     
        <div className="w-full md:w-1/2 bg-white flex flex-col items-center justify-center p-8">
           <Image
            src={CCCLogo}
            alt="CCC Logo"
            className="w-full object-contain mb-4"
          />
        </div>

      
        <div className="w-full md:w-1/2 bg-gradient-to-b from-[#103C8C] to-[#1B4C9E] flex flex-col items-center justify-center px-8 py-12 relative">
          

       
          <div className="text-left w-full max-w-[380px] mb-6">
            <h1 className="text-white text-xl font-semibold">
              Reset Password
            </h1>
          </div>

      
          <div className="w-full max-w-[380px] bg-transparent">
            <form className="flex flex-col gap-4">
              <input
                type="email"
                placeholder="Enter your registered email"
                className="w-full rounded-md px-4 py-2 text-sm bg-transparent border border-white/50 text-white placeholder:text-white/70 focus:outline-none focus:border-white"
              />
              <input
                type="password"
                placeholder="Enter New Password"
                className="w-full rounded-md px-4 py-2 text-sm bg-transparent border border-white/50 text-white placeholder:text-white/70 focus:outline-none focus:border-white"
              />
              <input
                type="password"
                placeholder="Confirm New Password"
                className="w-full rounded-md px-4 py-2 text-sm bg-transparent border border-white/50 text-white placeholder:text-white/70 focus:outline-none focus:border-white"
              />

              <button
                type="submit"
                className="w-full mt-4 bg-white text-[#103C8C] font-medium py-2 rounded-md hover:opacity-90 transition"
              >
                Reset Password
              </button>
            </form>
          </div>

       
          <div className="absolute bottom-20">
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
