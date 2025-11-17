"use client";
import Image from "next/image";
import PastorHeader from "@/app/Components/PastorHeader";
import MentorCard from "@/app/Components/Card/MentorCard";
import ExploreCCCCard from "@/app/Components/ExploreCCCCard";
import HeroBg from "../../Assets/hero-bg.png";
import Book from "../../Assets/book.png";
import DuoIcon from "../../Assets/duo.png";
import MeetIcon from "../../Assets/meet.png";
import Mentor1 from "../../Assets/mentor1.png";
import Mentor2 from "../../Assets/mentor2.png";
import Mentor3 from "../../Assets/mentor3.png";
import UserProfile from "../../Assets/user-profile.png";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import PastorFooter from "@/app/Components/PastorFooter";
import { useRouter } from "next/navigation";

export default function PastorDashboard() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <PastorHeader showFullHeader={true} />

      {/* HERO SECTION */}
      <section
        className="relative bg-cover bg-top text-white h-[380px] sm:h-[420px] md:h-[450px] flex flex-col justify-between px-4 sm:px-8 lg:px-20 pt-6 pb-10"
        style={{ backgroundImage: `url(${HeroBg.src})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-transparent"></div>

        {/* Time */}
        <div className="relative z-10 flex justify-end">
          <div className="text-right">
            <div className="text-2xl sm:text-3xl lg:text-3xl font-bold tracking-wide">
              11 : 59 AM
            </div>
            <p className="text-xs sm:text-sm text-white/80">Tuesday, Sep 23</p>
          </div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 md:gap-0">
          {/* Left - Heading */}
          <div className="max-w-2xl">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold leading-snug">
              Cultivate Spiritual, Professional, Social, And Community–
              <br className="hidden sm:block" />
              Engagement Developments
            </h1>
          </div>

          {/* Right - Profile Card */}
          <div className="flex flex-col items-start md:items-end">
            <p className="text-white/90 text-sm mb-2">Good Morning</p>

            <div
              className="bg-white/15 backdrop-blur-md border border-white/30 rounded-md p-4 w-full max-w-[280px] shadow-lg cursor-pointer"
              onClick={() => router.push(`/pastor/profile`)}
            >
              <div className="flex items-center gap-3">
                <Image
                  src={UserProfile}
                  alt="User"
                  width={42}
                  height={42}
                  className="rounded-full border border-white/40"
                />
                <div className="flex flex-col items-start">
                  <p className="text-xs text-white font-semibold">
                    John Ross, Welcome Aboard!
                  </p>
                  <div className="w-[120px] h-2 bg-white/30 rounded-full mt-1">
                    <div className="h-2 bg-[#00B3FF] rounded-full w-[70%]" />
                  </div>
                  <p className="text-[10px] mt-1 text-white/70">Progress 70%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CONTINUE WATCHING */}
      <section className="py-12 sm:py-16 bg-[#F8FAFF] px-4 sm:px-8 lg:px-16 flex flex-col lg:flex-row items-start justify-between gap-8 lg:gap-10">
        <div className="lg:w-1/4 w-full flex flex-col justify-center mb-4 lg:mb-0">
          <h2 className="text-2xl sm:text-3xl font-semibold text-[#000] leading-tight mb-2 sm:mb-4">
            Continue <br /> Watching{" "}
            <span className="text-[#103C8C] underline decoration-[#103C8C]/40 decoration-2 underline-offset-4">
              Course
            </span>
          </h2>
        </div>

        <div className="lg:w-3/4 w-full relative">
          <Swiper
            modules={[Navigation, Pagination]}
            spaceBetween={16}
            slidesPerView={3}
            pagination={{
              clickable: true,
              el: ".swiper-pagination-custom",
            }}
            navigation={{
              nextEl: ".next-btn",
              prevEl: ".prev-btn",
            }}
            loop={true}
            className="pb-12"
            breakpoints={{
              0: { slidesPerView: 1 },
              640: { slidesPerView: 1.3 },
              768: { slidesPerView: 2 },
              1024: { slidesPerView: 3 },
            }}
          >
            {[1, 2, 3, 4, 5].map((i) => (
              <SwiperSlide key={i}>
                <div className="bg-white text-black rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300">
                  <div className="relative">
                    <Image
                      src={Book}
                      alt="Course Thumbnail"
                      className="w-full h-[160px] sm:h-[180px] object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <button className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center hover:scale-110 transition">
                        <i className="fa-solid fa-play text-[#103C8C] text-sm"></i>
                      </button>
                    </div>
                  </div>

                  <div className="p-4">
                    <p className="text-xs text-[#103C8C] font-semibold mb-1">
                      Introduction
                    </p>
                    <h4 className="text-sm font-semibold mb-1">
                      Center for Community Change
                    </h4>
                    <p className="text-xs text-gray-600 mb-3 leading-snug">
                      Interested in receiving mentoring in community engagement
                    </p>
                    <div className="flex justify-between items-center text-xs text-gray-400">
                      <span>18:00 Min</span>
                      <button className="border border-[#103C8C] text-[#103C8C] p-[6px] rounded-md hover:bg-[#103C8C] hover:text-white transition">
                        <i className="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>

          <div className="swiper-pagination-custom flex justify-center gap-2 absolute -bottom-2 left-1/2 transform -translate-x-1/2 z-10"></div>

          {/* Keep original behavior, just make navigation usable on small screens */}
          <div className="absolute top-1/2 -translate-y-1/2 right-2 sm:right-0 flex gap-3 z-10 mt-48">
            <button className="prev-btn w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-md border border-gray-300 bg-white hover:bg-[#103C8C] hover:text-white transition">
              <i className="fa-solid fa-angle-left text-sm"></i>
            </button>
            <button className="next-btn w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-md border border-gray-300 bg-white hover:bg-[#103C8C] hover:text-white transition">
              <i className="fa-solid fa-angle-right text-sm"></i>
            </button>
          </div>
        </div>
      </section>

      {/* UPCOMING APPOINTMENTS */}
      <section className="relative bg-white py-12 sm:py-16 px-4 sm:px-8 lg:px-20 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-8">
          <h2 className="text-xl sm:text-[22px] font-semibold text-[#000]">
            Upcoming Appointments
          </h2>
          <a
            href="#"
            className="text-[#103C8C] text-sm font-medium hover:underline hover:text-[#0D2E6E]"
          >
            See all
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
          <div className="bg-[#14517d] rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row gap-5 items-center sm:items-stretch shadow-lg border border-[#0B1C58]/40">
            {/* Left Icon + Play */}
            <div className="bg-white rounded-xl flex items-center justify-center w-[140px] h-[140px] sm:w-[150px] sm:h-[150px] shrink-0 relative">
              <Image
                src={DuoIcon}
                alt="Duo Icon"
                className="w-[60px] h-[60px] sm:w-[65px] sm:h-[65px]"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <button
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/90 flex items-center justify-center hover:scale-110 transition"
                  onClick={() => router.push(`/pastor/VideoPage`)}
                >
                  <i className="fa-solid fa-play text-[#103C8C] text-sm"></i>
                </button>
              </div>
            </div>

            {/* Right Content - stacked for mobile */}
            <div className="flex flex-col gap-4 w-full">
              <div className="bg-[#F8FBFF] border border-[#E3E8F0] rounded-lg px-4 sm:px-5 py-3 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 hover:shadow-sm transition">
                <div className="flex items-center gap-3">
                  <i className="fa-regular fa-file-lines text-[#103C8C] text-lg"></i>
                  <span className="text-sm text-gray-800">
                    Phase 2 – Revitalization Roadmap
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[11px] bg-[#D8FFF2] text-[#00A878] px-3 py-[2px] rounded-full font-medium">
                    In Progress
                  </span>
                  <button className="w-8 h-8 flex items-center justify-center border border-[#103C8C]/30 text-[#103C8C] rounded-md hover:bg-[#103C8C] hover:text-white transition">
                    <i className="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
                  </button>
                </div>
              </div>

              <div className="bg-[#F8FBFF] border border-[#E3E8F0] rounded-lg px-4 sm:px-5 py-3 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 hover:shadow-sm transition">
                <div className="flex items-center gap-3">
                  <i className="fa-regular fa-file-lines text-[#103C8C] text-lg"></i>
                  <span className="text-sm text-gray-800">
                    Questionnaires – Survey
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[11px] bg-[#F3F3FF] text-[#5A5ADA] px-3 py-[2px] rounded-full font-medium">
                    Remaining
                  </span>
                  <button className="w-8 h-8 flex items-center justify-center border border-[#103C8C]/30 text-[#103C8C] rounded-md hover:bg-[#103C8C] hover:text-white transition">
                    <i className="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* EXPLORE CCC */}
      <section className="py-14 sm:py-20 px-4 sm:px-8 lg:px-20 bg-gradient-to-b from-[#E8F1FA] to-[#F7FAFF]">
        <h2 className="text-2xl sm:text-[32px] font-bold text-[#000] mb-8 sm:mb-10">
          Explore CCC
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          <ExploreCCCCard
            title="Appointments"
            description="Schedule and manage appointments with ease for personalized guidance."
            icon="fa-regular fa-calendar-check"
            onMoreClick={() => console.log("Navigate to Appointments")}
          />
          <ExploreCCCCard
            title="Progress"
            description="Track your growth and celebrate milestones in your journey."
            icon="fa-solid fa-chart-simple"
            onMoreClick={() => console.log("Navigate to Progress")}
          />
          <ExploreCCCCard
            title="Surveys"
            description="Share feedback and insights through quick, easy surveys."
            icon="fa-regular fa-clipboard"
            onMoreClick={() => console.log("Navigate to Surveys")}
          />
          <ExploreCCCCard
            title="Revitalization Roadmap"
            description="Share feedback and insights through quick, easy surveys."
            icon="fa-solid fa-pen-clip"
            onMoreClick={() =>
              console.log("Navigate to Revitalization Roadmap")
            }
          />
        </div>
      </section>

      {/* MY MENTORS */}
      <section className="py-12 sm:py-16 px-4 sm:px-8 lg:px-20 bg-[#F2F6FC]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-8">
          <h2 className="text-xl sm:text-[22px] font-semibold text-[#000]">
            My Mentors
          </h2>
          <a
            href="#"
            className="text-[#103C8C] text-sm font-medium hover:underline hover:text-[#0D2E6E]"
          >
            See all
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {[
            { img: Mentor1, name: "John Doe", role: "Mentor" },
            { img: Mentor2, name: "Jacob Jones", role: "Field Mentor" },
            { img: Mentor3, name: "Robert Fox", role: "Field Mentor" },
            { img: Mentor1, name: "John Doe", role: "Mentor" },
          ].map((mentor, i) => (
            <div
              key={i}
              className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 p-3"
            >
              <div
                className="relative cursor-pointer"
                onClick={() => router.push(`/pastor/Mymentors`)}
              >
                <img
                  src={mentor.img.src}
                  alt={mentor.name}
                  className="w-full h-[180px] object-cover"
                />
                <button className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center bg-white/80 rounded-full text-[#0B1C58] hover:bg-white shadow">
                  <i className="fa-solid fa-ellipsis-vertical text-sm"></i>
                </button>
              </div>

              <div className="p-3 sm:p-4">
                <h4 className="font-semibold text-gray-900 text-[15px] sm:text-[16px] leading-tight mb-1">
                  {mentor.name}
                </h4>
                <p className="text-sm text-gray-500">{mentor.role}</p>
                <p className="text-[13px] text-gray-400 mt-2">
                  Sub text area write something here.
                  <br />
                  That you can read more
                </p>

                <div className="flex justify-between items-center mt-4 sm:mt-5">
                  <div className="flex gap-3 sm:gap-4 text-[#103C8C] text-[14px]">
                    <i className="fa-regular fa-envelope cursor-pointer hover:text-[#0B1C58]"></i>
                    <i className="fa-regular fa-comment cursor-pointer hover:text-[#0B1C58]"></i>
                    <i className="fa-solid fa-phone cursor-pointer hover:text-[#0B1C58]"></i>
                    <i className="fa-brands fa-whatsapp cursor-pointer hover:text-[#0B1C58]"></i>
                  </div>

                  <button className="w-8 h-8 flex items-center justify-center rounded-md border border-[#103C8C]/30 text-[#103C8C] hover:bg-[#103C8C] hover:text-white transition">
                    <i className="fa-solid fa-arrow-up-right-from-square text-[11px]"></i>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <PastorFooter />
    </div>
  );
}
