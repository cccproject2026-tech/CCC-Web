"use client";
import Image from "next/image";
import CCCLogo from "../../Assets/CCCLogo.png";
import PastorHeader from "@/app/Components/PastorHeader";
import AndrewsLogo from "../../Assets/andrews-logo.png"; 

export default function LoginPage() {
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
            <h1 className="text-white text-xl font-semibold">Login</h1>
          </div>

        
          <div className="w-full max-w-[380px] bg-transparent">
            <form className="flex flex-col gap-4">
              <input
                type="text"
                placeholder="Email or User Name"
                className="w-full rounded-md px-4 py-2 text-sm bg-transparent border border-white/50 text-white placeholder:text-white/70 focus:outline-none focus:border-white"
              />
              <input
                type="password"
                placeholder="Password"
                className="w-full rounded-md px-4 py-2 text-sm bg-transparent border border-white/50 text-white placeholder:text-white/70 focus:outline-none focus:border-white"
              />

           
              <button
                type="submit"
                className="w-full mt-4 bg-white text-[#103C8C] font-medium py-2 rounded-md hover:opacity-90 transition"
              >
                Login
              </button>
            </form>

        
            <div className="text-right mt-2">
              <a
                href="#"
                className="text-[13px] text-white/80 hover:text-white transition"
              >
                Forgot Password ?
              </a>
            </div>

          
            <div className="flex gap-2 mt-6">
              <button
                className="flex-1 bg-gradient-to-r from-[#C850C0] to-[#4158D0] text-white py-2 rounded-md text-sm font-medium hover:opacity-90 transition"
              >
                New User <span className="ml-2">»</span>
              </button>
              <button
                className="flex-1 bg-transparent border border-white/60 text-white py-2 rounded-md text-sm font-medium hover:bg-white hover:text-[#103C8C] transition"
              >
                Submit Interest
              </button>
            </div>
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
