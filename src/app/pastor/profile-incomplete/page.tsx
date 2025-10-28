"use client";
import Image from "next/image";
import PastorHeader from "@/app/Components/PastorHeader";
import ProfileLogo from "../../Assets/profile.png";
import EditLogo from "../../Assets/Edit.png";
import { useRouter } from "next/navigation"; 

export default function ProfileIncomplete() {
  const router = useRouter();
  return (
    <div className="min-h-screen flex flex-col">
    
      <PastorHeader />

 
      <div className="flex-grow bg-gradient-to-b from-[#103C8C] to-[#1B4C9E] flex items-center justify-center px-4">
      
        <div className="bg-white rounded-xl shadow-lg px-10 py-8 text-center relative w-full max-w-sm">
 
          <div className="absolute top-3 left-4 bg-[#FFFBEA] text-[#9A8700] text-xs px-3 py-1 rounded-full border border-[#E9C700]/30">
            Your profile is incomplete.
          </div>

       
          <button className="absolute top-3 right-4 text-xs text-gray-600 bg-gray-100 px-3 py-[2px] rounded-full hover:bg-gray-200 transition"
           onClick={() =>router.push(`/pastor/home`)}
          >
            Skip <span className="ml-1">{">"}</span>
          </button>

        
          <div className="flex justify-center mt-8 mb-4 relative">
          
            <div className="relative">
              <Image
                src={ProfileLogo}
                alt="Profile Avatar"
                className="w-[100px] h-[100px] object-contain rounded-full border border-[#E5E7EB]"
              />

       
              <button
                className="absolute bottom-2 right-2 w-6 h-6 rounded-full bg-[#103C8C] text-white flex items-center justify-center text-[10px] border-2 border-white shadow-md hover:bg-[#1B4C9E] transition"
                title="Edit Profile"
              >
                   <Image
                src={EditLogo}
                alt="Profile Avatar"
                className="w-[15px] h-[15px]"
              />
              </button>
            </div>
          </div>

   
          <h2 className="text-lg font-semibold text-gray-800 mb-6">
            John Ross
          </h2>

        
          <button className="flex items-center justify-center gap-2 mx-auto border border-[#103C8C] text-[#103C8C] text-sm font-medium px-4 py-[6px] rounded-md hover:bg-[#103C8C] hover:text-white transition">
            <i className="fa-solid fa-paperclip text-xs"></i>
            Upload documents
          </button>
        </div>
      </div>
    </div>
  );
}
