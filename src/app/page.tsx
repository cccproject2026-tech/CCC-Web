"use client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import "@fortawesome/fontawesome-free/css/all.min.css";


export default function LandingPage() {
  const router = useRouter();

  const roles = [
    {
      name: "Pastor",
      desc: "Access the full Pastor module with assessments, appointments, and reports.",
      color: "from-[#103C8C] to-[#0B2E72]",
      path: "/pastor/splash",
    },
    {
      name: "Mentor",
      desc: "View the Mentor tools including mentee tracking, meetings, and analytics.",
      color: "from-[#007B8C] to-[#005A70]",
      path: "/mentor/home",
    },
    {
      name: "Director",
      desc: "Explore the Director dashboard with organization insights and reports.",
      color: "from-[#7340C4] to-[#4B1E8E]",
      path: "/director/home",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#EAF1FB] to-[#C9E0F9] text-[#0B1C58] px-6 py-12">
      {/* HEADER */}
      <header className="text-center mb-12">
        <h1 className="text-4xl font-semibold mb-3 text-[#0B1C58] tracking-wide">
          Welcome to the CCC Demo Portal
        </h1>
        <p className="text-gray-600 text-sm">
          Select a module below to explore its complete workflow and features.
        </p>
      </header>

      {/* ROLE CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full">
        {roles.map((role, index) => (
          <div
            key={index}
            onClick={() => router.push(role.path)}
            className={`bg-gradient-to-br ${role.color} rounded-2xl shadow-lg cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-2xl flex flex-col items-center justify-center text-white text-center p-10`}
          >
          
            <h2 className="text-2xl font-semibold mb-3">{role.name}</h2>
            <p className="text-sm text-white/90 leading-relaxed max-w-[240px]">
              {role.desc}
            </p>
            <div className="mt-6 flex items-center gap-2 text-white/90 text-sm font-medium">
              <span>View {role.name} Module</span>
              <i className="fa-solid fa-arrow-right"></i>
            </div>
          </div>
        ))}
      </div>

      {/* FOOTER */}
      <footer className="mt-16 text-center text-xs text-gray-600">
        ©️ {new Date().getFullYear()} CCC Demo Portal — Built for presentation
      </footer>
    </div>
  );
}