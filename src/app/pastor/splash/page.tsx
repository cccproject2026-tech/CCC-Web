import Image from "next/image";
import CCClogo from "../../Assets/CCC-logo.png";
import Framelogo1 from "../../Assets/Frame-logo-1.png"
import Connecticon from "../../Assets/Connect-icon.png"

export default function SplashScreen() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-[#1a5a8f] to-[#193E87] text-white relative overflow-hidden">
   
      <div className="absolute top-6 right-6">
        <button
          className="p-2"
          aria-label="Share"
        >
             <Image
        src={Connecticon} 
            alt="Connect Icon"
            width={28}
            height={28}
          />
        </button>
      </div>

   
      <div className="flex flex-col items-center">

        <Image
        src={CCClogo} 
          alt="The Center for Community Change"
          width={280}
          height={150}
          className="mb-8"
        />

      </div>

     
      <div className="flex items-center gap-8 mt-16">
      
        <button className="p-3 hover:scale-105 transition">
             <Image
        src={Framelogo1} 
            alt="Flame Icon"
            width={40}
            height={40}
          />
        </button>

      
        <div className="w-px h-10 bg-white/40"></div>

       
        <button className="p-3 bg-white rounded-full shadow-lg hover:scale-105 transition">
           <Image
        src={Connecticon} 
            alt="Connect Icon"
            width={28}
            height={28}
          />
        </button>
      </div>
    </main>
  );
}
