"use client";
import Image from "next/image";
import { usePathname } from "next/navigation";
import Framelogo1 from "../Assets/Frame-logo-1.png";
import Connecticon from "../Assets/Connect-icon.png";
import NotificationIcon from "../Assets/notification.png";
import SearchIcon from "../Assets/search.png";
import UserProfile from "../Assets/user-profile.png"; 

export default function PastorHeader({ showFullHeader = false }) {
  const pathname = usePathname();

  const navLinks = [
    { name: "Home", path: "/pastor/dashboard" },
    { name: "My Mentors", path: "/pastor/mentors" },
    { name: "Revitalization Roadmap", path: "/pastor/roadmap" },
    { name: "Assessments", path: "/pastor/assessments" },
    { name: "Progress", path: "/pastor/progress" },
    { name: "Appointments", path: "/pastor/appointments" },
  ];

  return (
    <header className="flex items-center justify-between px-10 py-3 bg-[#1A2E7A] text-white shadow-md relative z-50">
    
      <div className="flex items-center gap-3">
        <Image src={Framelogo1} alt="Logo" width={26} height={26} />
      </div>

     
      {showFullHeader && (
        <nav className="hidden lg:flex items-center gap-6">
          {navLinks.map((link, index) => (
            <a
              key={index}
              href={link.path}
              className={`text-sm transition ${
                pathname === link.path
                  ? "font-semibold text-white border-b-2 border-[#FFD700]"
                  : "text-white/80 hover:text-white"
              }`}
            >
              {link.name}
            </a>
          ))}
        </nav>
      )}

   
      <div className="flex items-center gap-5">
        {showFullHeader && (
          <>
          
            <button className="hover:opacity-80 transition">
              <Image src={SearchIcon} alt="Search" width={18} height={18} />
            </button>

          
            <div className="relative">
              <Image
                src={NotificationIcon}
                alt="Notification"
                width={20}
                height={20}
                className="hover:opacity-80 cursor-pointer"
              />
              <span className="absolute -top-1 -right-1 bg-[#FFD700] text-[#1A2E7A] text-[10px] font-bold rounded-full w-[14px] h-[14px] flex items-center justify-center">
                1
              </span>
            </div>

     
            <button className="hover:opacity-80 transition">
              <Image src={Connecticon} alt="Connect" width={22} height={22} />
            </button>

          
            <div className="flex items-center gap-2 bg-[#223C8C] px-3 py-1 rounded-full">
              <div className="text-right text-[11px] leading-tight">
                <p className="text-white/80">Good Morning</p>
                <p className="text-white font-medium">John Ross</p>
              </div>
              <Image
                src={UserProfile}
                alt="User"
                width={30}
                height={30}
                className="rounded-full border border-white/40"
              />
            </div>
          </>
        )}

      
        {!showFullHeader && (
          <button className="p-2 hover:opacity-80">
            <Image src={Connecticon} alt="Connect" width={24} height={24} />
          </button>
        )}
      </div>
    </header>
  );
}
