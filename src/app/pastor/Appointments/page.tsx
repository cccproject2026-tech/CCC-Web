"use client";
import Image from "next/image";
import PastorHeader from "@/app/Components/PastorHeader";
import PastorFooter from "@/app/Components/PastorFooter";
import HeroBg from "../../Assets/appointment-bg.png"; // 🖼 Replace with wave background
import DuoIcon from "../../Assets/duo.png";
import MeetIcon from "../../Assets/meet.png";
import UserProfile from "../../Assets/user-profile.png";
import "@fortawesome/fontawesome-free/css/all.min.css";

export default function PastorAppointmentsPage() {
  const appointmentsToday = [
    {
      mode: "Duo",
      date: "04 Aug 24",
      time: "11:30 hrs EST",
      mentor: "John Ross",
      role: "Mentor",
      icon: DuoIcon,
    },
    {
      mode: "Google Meet",
      date: "04 Aug 24",
      time: "11:30 hrs EST",
      mentor: "John Ross",
      role: "Mentor",
      icon: MeetIcon,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F7FB] text-[#0B1C58]">
      <PastorHeader showFullHeader={true} />

      {/* HERO SECTION */}
      <section
        className="relative bg-cover bg-center h-[200px] md:h-[260px] flex flex-col justify-center px-4 md:px-8 lg:px-20 text-white"
        style={{ backgroundImage: `url(${HeroBg.src})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-[#0A3C8C]/90 to-[#052860]/70"></div>
        <div className="relative z-10">
          <h1 className="text-2xl md:text-4xl font-semibold tracking-wide">Appointments</h1>
        </div>
      </section>

      {/* MAIN SECTION */}
      <main className="px-4 md:px-8 lg:px-20 py-8 md:py-12 bg-[#176192]">
        {/* SEARCH + BUTTON */}
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 mb-8 md:mb-10">
          <input
            type="text"
            placeholder="Enter a date (dd-mm-yyyy)"
            className="w-full md:w-[320px] border bg-[white] border-[#DDE2EB] rounded-md px-4 py-2 text-sm text-gray-600 shadow-sm focus:outline-none focus:border-[#103C8C]"
            suppressHydrationWarning
          />
          <button className="bg-[#103C8C] hover:bg-[#0B2E72] transition text-white text-sm font-medium px-4 py-2 rounded-md shadow-sm flex items-center justify-center gap-2 whitespace-nowrap" suppressHydrationWarning>
            <i className="fa-solid fa-plus text-xs"></i> New Meeting
          </button>
        </div>

        {/* CALENDAR + TODAY APPOINTMENTS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Calendar */}
          <div className="bg-[#0C4A85] rounded-2xl p-4 md:p-6 text-white shadow-md">
            <h3 className="text-sm md:text-[15px] font-medium mb-4 flex items-center gap-2">
              <i className="fa-regular fa-calendar"></i> Monthly Meeting Calendar
            </h3>
            <div className="bg-[#103C8C] rounded-xl p-3 md:p-5 text-center">
              <p className="text-sm text-white/70 mb-2">August 2024</p>
              <div className="grid grid-cols-7 gap-1 md:gap-2 text-xs md:text-[13px]">
                {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                  <div key={i} className="font-medium text-white/70 py-1">
                    {d}
                  </div>
                ))}
                {Array.from({ length: 31 }).map((_, i) => (
                  <div
                    key={i}
                    className={`py-1 rounded-md ${
                      i + 1 === 4
                        ? "bg-[#00B3FF] text-white font-bold"
                        : "text-white/80 hover:bg-[#00B3FF]/40 cursor-pointer"
                    }`}
                  >
                    {i + 1}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Today Appointments */}
          <div>
            <h3 className="text-sm md:text-[15px] font-semibold mb-4 text-[white]">
              You have {appointmentsToday.length} Appointments Today
            </h3>

            <div className="flex flex-col gap-4 md:gap-6">
              {appointmentsToday.map((appt, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl p-4 md:p-5 shadow-sm border border-[#E5E7EB] flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-5 hover:shadow-md transition-all"
                >
                  <div className="bg-[#F3F6FB] w-[80px] md:w-[100px] h-[80px] md:h-[100px] rounded-xl flex items-center justify-center shrink-0">
                    <Image
                      src={appt.icon}
                      alt={appt.mode}
                      className="w-[45px] md:w-[55px] h-[45px] md:h-[55px]"
                    />
                  </div>

                  <div className="flex-1 w-full">
                    <div className="flex items-center gap-3 mb-2">
                      <Image
                        src={UserProfile}
                        alt="Mentor"
                        width={32}
                        height={32}
                        className="rounded-full md:w-9 md:h-9"
                      />
                      <div>
                        <h4 className="font-semibold text-[#0B1C58] text-sm">
                          {appt.mentor}
                        </h4>
                        <p className="text-[11px] md:text-[12px] text-gray-500">{appt.role}</p>
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row flex-wrap gap-2 md:gap-3 mb-2">
                      <div className="flex items-center gap-2 bg-[#E8EFFB] px-2 md:px-3 py-[4px] rounded-md text-[11px] md:text-[12px] text-[#103C8C] font-medium">
                        <i className="fa-regular fa-calendar text-[#103C8C]"></i>
                        Date: {appt.date}
                      </div>
                      <div className="flex items-center gap-2 bg-[#E8EFFB] px-2 md:px-3 py-[4px] rounded-md text-[11px] md:text-[12px] text-[#103C8C] font-medium">
                        <i className="fa-regular fa-clock text-[#103C8C]"></i>
                        Time: {appt.time}
                      </div>
                    </div>

                    <p className="text-[11px] md:text-[12px] text-[#6B7280] mb-3">
                      Mode:{" "}
                      <span className="text-[#103C8C] font-semibold">
                        {appt.mode}
                      </span>
                    </p>

                    <div className="flex justify-between items-center">
                      <div className="flex gap-3 text-[#103C8C] text-sm">
                        <i className="fa-solid fa-phone cursor-pointer hover:text-[#0B1C58]"></i>
                        <i className="fa-regular fa-comment cursor-pointer hover:text-[#0B1C58]"></i>
                        <i className="fa-brands fa-whatsapp cursor-pointer hover:text-[#0B1C58]"></i>
                      </div>

                      <button className="bg-[#103C8C] hover:bg-[#0B2E72] text-white text-[11px] md:text-[12px] px-4 md:px-5 py-[6px] rounded-md font-medium" suppressHydrationWarning>
                        Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

       
      </main>
 {/* NEXT APPOINTMENT SECTION */}
        <div className="mt-12 md:mt-16 px-4 md:px-8 lg:px-20 py-8 md:py-12">
          <h2 className="text-base md:text-[18px] font-semibold mb-4 md:mb-6">Next Appointment</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10">
            {appointmentsToday.map((appt, index) => (
              <div
                key={index}
                className="bg-[#0C4A85] rounded-2xl p-4 md:p-6 flex flex-col md:flex-row gap-4 md:gap-5 items-start md:items-center shadow-md"
              >
                <div className="bg-white rounded-xl flex items-center justify-center w-[100px] md:w-[140px] h-[100px] md:h-[140px] shrink-0">
                  <Image
                    src={appt.icon}
                    alt={appt.mode}
                    className="w-[50px] md:w-[60px] h-[50px] md:h-[60px]"
                  />
                </div>

                <div className="flex flex-col text-white w-full">
                  <div className="flex items-center gap-3 mb-3">
                    <Image
                      src={UserProfile}
                      alt="User"
                      width={32}
                      height={32}
                      className="rounded-full border border-white/30 md:w-9 md:h-9"
                    />
                    <div>
                      <h4 className="font-semibold text-sm">{appt.mentor}</h4>
                      <p className="text-xs text-white/70">{appt.role}</p>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row flex-wrap gap-2 mb-3">
                    <div className="bg-[#FFFFFF1A] border border-[#FFFFFF33] rounded-md px-2 md:px-3 py-[3px] text-xs flex items-center gap-2">
                      <i className="fa-regular fa-calendar text-[#E3D247]"></i>
                      <span>Date: {appt.date}</span>
                    </div>
                    <div className="bg-[#FFFFFF1A] border border-[#FFFFFF33] rounded-md px-2 md:px-3 py-[3px] text-xs flex items-center gap-2">
                      <i className="fa-regular fa-clock text-[#24E0C2]"></i>
                      <span>Time: {appt.time}</span>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-3">
                    <div>
                      <p className="text-xs text-white/90 mb-2">
                        Mode:{" "}
                        <span className="text-[#B8D4FF] underline underline-offset-2">
                          {appt.mode}
                        </span>
                      </p>
                      <div className="flex gap-4 text-white text-sm">
                        <i className="fa-solid fa-phone opacity-80 hover:opacity-100 cursor-pointer"></i>
                        <i className="fa-regular fa-comment opacity-80 hover:opacity-100 cursor-pointer"></i>
                        <i className="fa-brands fa-whatsapp opacity-80 hover:opacity-100 cursor-pointer"></i>
                      </div>
                    </div>
                    <button className="bg-[#0B1C58] hover:bg-[#122D80] transition px-4 md:px-6 py-[6px] rounded-md text-xs md:text-sm font-medium" suppressHydrationWarning>
                      Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
    </div>
  );
}
