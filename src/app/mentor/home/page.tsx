"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import PastorHeader from "@/app/Components/PastorHeader";
import PastorFooter from "@/app/Components/PastorFooter";
import HeroBg from "../../Assets/hero-bg.png";
import Book from "../../Assets/book.png";
import DuoIcon from "../../Assets/duo.png";
import MeetIcon from "../../Assets/meet.png";
import Mentor1 from "../../Assets/mentor1.png";
import Mentor2 from "../../Assets/mentor2.png";
import Mentor3 from "../../Assets/mentor3.png";
import UserProfile from "../../Assets/user-profile.png";
import MapImg from "../../Assets/map-placeholder.png";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { useRouter } from "next/navigation";
import { apiGetMentorAppointments, apiGetMentors } from "@/app/Services/api";
import MentorHeader from "@/app/Components/MentorHeader";
import { getPastorMedia } from "@/app/Services/pastor.service";
import { getGreeting } from "@/app/Services/utils/helpers";

const storedUser =
  typeof window !== "undefined"
    ? JSON.parse(localStorage.getItem("mentor") || "null")
    : null;

const userId = storedUser?.id;

const getMediaThumbnail = (item: any) => {
  console.log(item)
  const url = item?.mediaFiles?.[0]?.thumbnail;

  if (url && url.trim() !== "") {
    return url;
  }

  return Book;
};

const isToday = (dateString: string) => {
  const today = new Date();
  const date = new Date(dateString);

  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

export default function home() {
  const router = useRouter();
  const [mentors, setMentors] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [mediaList, setMediaList] = useState([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);


  useEffect(() => {
    async function fetchMedia() {
      try {
        const res = await getPastorMedia();
        setMediaList(res.data?.data || []);
      } catch (err) {
        console.error("Error fetching media:", err);
      }
    }

    fetchMedia();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        try {
          const mentorsRes = await apiGetMentors();
          console.log(mentorsRes.data.mentors)
          setMentors(mentorsRes.data.mentors || []);
          console.log("Mentors loaded:", mentorsRes.data.mentors);
        } catch (error) {
          console.log("Mentors API not available, using fallback");
          setMentors([]);
        }
      } catch (error) {
        console.error("Error fetching mentor home data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        if (!userId) return;

        setAppointmentsLoading(true);

        const res = await apiGetMentorAppointments(userId, true);
        console.log(res.data)
        const allAppointments = res.data?.data || [];
        const todaysAppointments = allAppointments.filter((a: any) =>
          isToday(a.meetingDate)
        );

        setAppointments(todaysAppointments);
      } catch (err) {
        console.error("Failed to load appointments:", err);
        setAppointments([]);
      } finally {
        setAppointmentsLoading(false);
      }
    };

    fetchAppointments();
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#103C8C] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* HEADER */}
      <MentorHeader showFullHeader={true} />

      {/* 🟦 HERO SECTION */}
      <section
        className="relative bg-cover bg-top text-white h-[450px] flex flex-col justify-between px-4 sm:px-8 md:px-16 lg:px-20 pt-6 pb-10"
        style={{ backgroundImage: `url(${HeroBg.src})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-transparent"></div>

        {/* TIME */}
        <div className="relative z-10 flex justify-center sm:justify-end">
          <div className="text-center sm:text-right">
            <div className="text-2xl sm:text-3xl font-bold tracking-wide">
              11 : 59 AM
            </div>
            <p className="text-sm text-white/80">Tuesday, Sep 23</p>
          </div>
        </div>

        {/* GREETING */}
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-center sm:items-end gap-4 sm:gap-0">
          <div className="max-w-full sm:max-w-2xl text-center sm:text-left">
            <h1 className="text-2xl sm:text-4xl font-semibold leading-snug">
              Cultivate Spiritual, Professional, Social, And Community–
              <br className="hidden sm:block" />
              Engagement Developments
            </h1>
          </div>

          {/* USER CARD */}
          <div className="flex flex-col items-center sm:items-end">
            <p className="text-white/90 text-sm mb-2">{getGreeting()}</p>
            <div
              className="bg-white/15 backdrop-blur-md border border-white/30 rounded-md p-4 w-[280px] shadow-lg"
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
                    {storedUser
                      ? `${storedUser.firstName ?? ""} ${storedUser.lastName ?? ""}, Welcome Aboard!`
                      : "Welcome Aboard!"}
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

      {/* 📘 CONTINUE WATCHING SECTION */}
      <section className="py-16 bg-[#F8FAFF] px-4 md:px-16 flex flex-col lg:flex-row items-start justify-between gap-10">
        <div className="lg:w-1/4 flex flex-col justify-center">
          <h2 className="text-3xl font-semibold text-[#000] leading-tight mb-4">
            Continue <br /> Watching{" "}
            <span className="text-[#103C8C] underline decoration-[#103C8C]/40 decoration-2 underline-offset-4">
              Course
            </span>
          </h2>
        </div>

        <div className="lg:w-3/4 w-full relative">
          <Swiper
            modules={[Navigation, Pagination]}
            spaceBetween={24}
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
              768: { slidesPerView: 2 },
              1024: { slidesPerView: 3 },
            }}
          >
            {mediaList.map((item) => (
              <SwiperSlide key={item._id}>
                <div className="bg-white text-black rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300">

                  {/* IMAGE */}
                  <div className="relative">
                    <Image
                      src={getMediaThumbnail(item)}
                      alt={item.heading || "Media thumbnail"}
                      width={400}
                      height={200}
                      className="w-full h-[160px] sm:h-[180px] object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <button className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center hover:scale-110 transition">
                        <i className="fa-solid fa-play text-[#103C8C] text-sm"></i>
                      </button>
                    </div>
                  </div>

                  {/* TEXT CONTENT */}
                  <div className="p-4">
                    <p className="text-xs text-[#103C8C] font-semibold mb-1">
                      {item.subheading || "Introduction"}
                    </p>

                    <h4 className="text-sm font-semibold mb-1">
                      {item.heading}
                    </h4>

                    <p className="text-xs text-gray-600 mb-3 leading-snug">
                      {item.description}
                    </p>

                    {/* You don’t have duration in API, so show created date OR static */}
                    <div className="flex justify-between items-center text-xs text-gray-400">
                      <span>{new Date(item.createdAt).toLocaleDateString()}</span>

                      <button className="border border-[#103C8C] text-[#103C8C] p-[6px] rounded-md hover:bg-[#103C8C] hover:text-white transition">
                        <i className="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </section>

      {/* 📅 TODAY'S APPOINTMENTS */}
      <section className="bg-white py-16 px-4 md:px-20 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-[400px] h-[400px] bg-[radial-gradient(circle_at_70%_30%,#103C8C_10%,transparent_70%)] opacity-5"></div>
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-[22px] font-semibold text-[#000]">
            Today’s Appointments
          </h2>
          <a
            href="#"
            className="text-[#103C8C] text-sm font-medium hover:underline"
          >
            See all
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 relative z-10">
          {appointmentsLoading ? (
            <p className="text-gray-500">Loading appointments...</p>
          ) : appointments.length === 0 ? (
            <p className="text-gray-500">No appointments scheduled for today</p>
          ) : (
            appointments.slice(0, 2).map((appt, i) => {
              const meetingDate = new Date(appt.meetingDate);
              return (
                <div
                  key={appt._id || i}
                  className="bg-[#14517d] rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row gap-4 sm:gap-5 items-center shadow-lg border border-[#0B1C58]/40"
                >
                  {/* ICON SECTION — UNCHANGED */}
                  <div className="bg-white rounded-xl flex items-center justify-center w-[100px] h-[100px] sm:w-[150px] sm:h-[150px] shrink-0">
                    <Image
                      src={i % 2 === 0 ? DuoIcon : MeetIcon}
                      alt="App Icon"
                      className="w-[50px] h-[50px] sm:w-[65px] sm:h-[65px]"
                    />
                  </div>

                  {/* TEXT DATA — NOW DYNAMIC */}
                  <div className="flex flex-col text-white w-full text-center sm:text-left">
                    <div className="flex items-center gap-3 mb-3">
                      <Image
                        src={appt.mentor?.profilePicture || UserProfile}
                        alt="User"
                        width={36}
                        height={36}
                        className="rounded-full border border-white/40"
                      />
                      <div>
                        <h4 className="text-white font-semibold text-sm">
                          {appt.mentor?.firstName} {appt.mentor?.lastName}
                        </h4>
                        <p className="text-white/70 text-xs">
                          {appt.mentor?.role || "Mentor"}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-3 text-xs">
                      <div className="bg-[#FFFFFF1A] border border-[#FFFFFF33] rounded-md px-3 py-[3px] flex items-center gap-2">
                        <i className="fa-regular fa-calendar text-[#E3D247]"></i>
                        <span>Date : {meetingDate.toLocaleDateString()}</span>
                      </div>
                      <div className="bg-[#FFFFFF1A] border border-[#FFFFFF33] rounded-md px-3 py-[3px] flex items-center gap-2">
                        <i className="fa-regular fa-clock text-[#24E0C2]"></i>
                        <span>
                          Time :{" "}
                          {meetingDate.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-xs mb-2">
                          Mode :{" "}
                          <span className="underline underline-offset-2 text-[#B8D4FF]">
                            {appt.platform}
                          </span>
                        </p>
                        <div className="flex gap-4 text-white text-sm">
                          <i className="fa-solid fa-phone"></i>
                          <i className="fa-regular fa-comment"></i>
                          <i className="fa-brands fa-whatsapp"></i>
                        </div>
                      </div>

                      <button className="bg-[#0B1C58] hover:bg-[#122D80] px-6 py-[6px] rounded-md text-sm">
                        Details
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* 🧾 TODAY'S ROADMAP LIST */}
      <section className="py-16 px-4 md:px-20 bg-[#196394]">
        <div className="bg-white rounded-2xl p-8 shadow-md max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h3 className="text-lg font-semibold text-[#0B1C58]">Today’s Roadmap List</h3>
            <div className="flex bg-[#F1F4F9] rounded-md overflow-hidden w-full sm:w-auto">
              {["All", "Roadmap", "Survey"].map((tab, index) => (
                <button
                  key={tab}
                  className={`px-3 sm:px-4 py-[6px] text-sm font-medium flex-1 sm:flex-none ${index === 0
                    ? "bg-[#0B1C58] text-white"
                    : "text-gray-500 hover:text-[#0B1C58]"
                    }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {[
              {
                title: "Submitted Roadmap",
                desc: "Task: Complete a Community Engagement Project",
                user: "John Doe",
              },
              {
                title: "Submitted Survey",
                desc: "Title: Pastoral Ministry Profile (PMP)",
                user: "Richard Roe",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="bg-[#F8FBFF] border border-[#E3E8F0] rounded-lg px-5 py-3 flex justify-between items-center"
              >
                <div>
                  <p className="text-sm font-medium text-[#0B1C58]">
                    {item.title}
                  </p>
                  <p className="text-xs text-gray-600">{item.desc}</p>
                </div>
                <span className="text-sm text-gray-700">{item.user}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-end mt-6">
            <button className="bg-[#103C8C] hover:bg-[#0A2B6B] text-white px-5 py-2 rounded-md text-sm">
              View Roadmap
            </button>
          </div>
        </div>
      </section>

      {/* 🌐 EXPLORE CCC */}
      <section className="py-20 px-4 md:px-20 bg-gradient-to-b from-[#E8F1FA] to-[#F7FAFF]">
        <h2 className="text-[22px] font-semibold text-[#000] mb-10">
          Explore CCC
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            {
              title: "Mentees",
              desc: "Schedule and manage appointments with ease for personalized guidance.",
              icon: "fa-regular fa-calendar-check",
            },
            {
              title: "Track Progress",
              desc: "Track your growth and celebrate milestones in your journey.",
              icon: "fa-solid fa-chart-simple",
            },
            {
              title: "Schedule",
              desc: "Share feedback and insights through quick, easy surveys.",
              icon: "fa-regular fa-clipboard",
            },
            {
              title: "Revitalization Roadmap",
              desc: "Plan and execute your development roadmap efficiently.",
              icon: "fa-solid fa-pen-clip",
            },
          ].map((item, i) => (
            <div
              key={i}
              className="rounded-xl p-6 bg-gradient-to-br from-[#0A3C8C] to-[#052860] text-white flex flex-col justify-between hover:scale-[1.02] transition"
            >
              <i className={`${item.icon} text-2xl mb-4`}></i>
              <div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-white/80">{item.desc}</p>
              </div>
              <div className="flex justify-end mt-4">
                <button className="flex items-center gap-2 text-sm hover:text-[#BFD9FF]">
                  More{" "}
                  <i className="fa-solid fa-arrow-up-right-from-square text-xs"></i>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 👥 MY MENTORS */}
      <section className="py-16 px-4 md:px-20 bg-[#F2F6FC]">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-[22px] font-semibold text-[#000]">My Mentors</h2>
          <a
            href="#"
            className="text-[#103C8C] text-sm font-medium hover:underline hover:text-[#0D2E6E]"
            onClick={() => router.push(`/mentor/MenteesDetailed`)}
          >
            See all
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {(mentors.length > 0
            ? mentors
            : [
              { firstName: "John", lastName: "Doe", role: "Field Mentor" },
              { firstName: "Jane", lastName: "Smith", role: "Senior Mentor" },
              { firstName: "Mike", lastName: "Johnson", role: "Lead Mentor" },
              {
                firstName: "Sarah",
                lastName: "Wilson",
                role: "Field Mentor",
              },
            ]
          )
            .slice(0, 4)
            .map((mentor, i) => (
              <div
                key={i}
                className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 p-3"
              >
                <div
                  className="relative w-full h-[180px]"
                  onClick={() => router.push(`/pastor/Mymentors`)}
                >
                  <Image
                    src={
                      mentor.profilePicture ||
                      [Mentor1, Mentor2, Mentor3][i % 3]
                    }
                    alt="Mentor"
                    fill
                    className="object-cover rounded-lg"
                  />
                </div>

                <div className="p-4">
                  <h4 className="font-semibold text-gray-900 text-[16px] leading-tight mb-1">
                    {mentor.firstName} {mentor.lastName}
                  </h4>
                  <p className="text-sm text-gray-500">{mentor.role}</p>
                  <p className="text-[13px] text-gray-400 mt-2">
                    Sub text area write something here.
                    <br />
                    That you can read more
                  </p>

                  <div className="flex justify-between items-center mt-5">
                    <div className="flex gap-4 text-[#103C8C] text-[14px]">
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

      {/* 🗺️ MENTEES (MAP SECTION) */}
      <section className="py-20 px-4 md:px-20 bg-[#0F4A85] text-white">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-[22px] font-semibold">Mentees</h2>
          <input
            type="text"
            placeholder="Search mentees..."
            className="px-4 py-2 rounded-md text-sm text-gray-800"
          />
        </div>

        <div className="relative rounded-2xl overflow-hidden shadow-lg border border-[#ffffff22]">
          <Image
            src={MapImg}
            alt="Map"
            className="w-full h-[420px] object-cover"
          />
          <div className="absolute bottom-6 left-6 bg-white/20 backdrop-blur-md px-5 py-3 rounded-lg">
            <p className="text-sm font-medium">
              Mentor locations across the region
            </p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <PastorFooter />
    </div>
  );
}
