"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { getCookie } from "@/app/utils/cookies";
import PastorHeader from "@/app/Components/PastorHeader";
import ExploreCCCCard from "@/app/Components/ExploreCCCCard";
import HeroBg from "../../Assets/hero-bg.png";
import Book from "../../Assets/book.png";
import DuoIcon from "../../Assets/duo.png";
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
import { getPastorMedia, getUserAppointments } from "@/app/Services/pastor.service";
import { apiGetAssignedUsers, apiGetRoadmapsByUser } from "@/app/Services/api";

type Mentor = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  role: string;
};

const mentorImages = [Mentor1, Mentor2, Mentor3];

export default function PastorDashboard() {
  const router = useRouter();

  const [mediaList, setMediaList] = useState([]);

useEffect(() => {
  async function fetchMedia() {
    try {
      const res = await getPastorMedia();
      setMediaList(res.data?.data || []);  // Adjust based on API response structure
    } catch (err) {
      console.error("Error fetching media:", err);
    }
  }

  fetchMedia();
}, []);


  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loadingMentors, setLoadingMentors] = useState(false);
  const [mentorsError, setMentorsError] = useState<string | null>(null);
 const [appointments, setAppointments] = useState([]);
  useEffect(() => {
    const fetchMentors = async () => {
      try {
        setLoadingMentors(true);
        setMentorsError(null);

        const user = JSON.parse(getCookie("user") || "{}");
        const userId = user?.id || user?._id;
        if (!userId) return;

        const response = await apiGetAssignedUsers(userId);
        setMentors((response.data?.data || []) as unknown as Mentor[]);
      } catch (err: any) {
        console.error("Error fetching mentors", err);
        setMentorsError(err?.message || "Unable to fetch mentors");
      } finally {
        setLoadingMentors(false);
      }
    };

    fetchMentors();
  }, []);

const storedUser = JSON.parse(getCookie("user") || "{}");

const userId = storedUser?.id || "";



  useEffect(() => {
  const storedUser = JSON.parse(getCookie("user") || "{}");

  const userId = storedUser?.id || "";

  if (!userId) return;

  async function fetchAppointments() {
    try {
      const res = await getUserAppointments(userId);
      setAppointments(res.data?.data || []);
    } catch (error) {
      console.error("Error fetching appointments:", error);
    }
  }

  fetchAppointments();
}, []);

  const [roadmaps, setRoadmaps] = useState<any[]>([]);
  const [roadmapTab, setRoadmapTab] = useState("All");

  useEffect(() => {
    const fetchRoadmaps = async () => {
      try {
        const user = JSON.parse(getCookie("user") || "{}");
        const uid = user?.id || user?._id;
        if (!uid) return;
        const res = await apiGetRoadmapsByUser(uid);
        const data = res.data?.data || [];
        const mapped = data.map((item: any) => ({
          id: item._id,
          title: item.name,
          status:
            item.status?.toLowerCase() === "in progress"
              ? "In Progress"
              : item.status?.toLowerCase() === "completed"
              ? "Completed"
              : item.status?.toLowerCase() === "due"
              ? "Due"
              : "Remaining",
        }));
        setRoadmaps(mapped);
      } catch (err) {
        console.error("Error fetching roadmaps:", err);
      }
    };
    fetchRoadmaps();
  }, []);

  const filteredRoadmaps =
    roadmapTab === "All"
      ? roadmaps
      : roadmaps.filter((r) => r.status === roadmapTab);

 const [currentTime, setCurrentTime] = useState("");

  const [currentDate, setCurrentDate] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();

      // Format Time → "11 : 59 AM"
      const time = now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }).replace(":", " : ");

      // Format Date → "Tuesday, Sep 23"
      const date = now.toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
      });

      setCurrentTime(time);
      setCurrentDate(date);
    };

    // Initial call
    updateTime();

    // Update every second
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);
  


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
          {currentTime}
        </div>
        <p className="text-xs sm:text-sm text-white/80">
          {currentDate}
        </p>
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
     {mediaList.length > 0 ? (
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
    {mediaList.map((item) => (
      <SwiperSlide key={item._id}>
        <div className="bg-white text-black rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300">

          {/* IMAGE */}
          <div className="relative">
            <Image
              src={item.mediaFiles?.[0]?.url || Book}
              alt={item.heading}
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
) : (
  <p className="text-center text-gray-500">No media found</p>
)}



          <div className="swiper-pagination-custom flex justify-center gap-2 absolute -bottom-2 left-1/2 transform -translate-x-1/2 z-10"></div>

          {/* navigation buttons */}
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

  {/* GRID */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">

    {appointments.length === 0 && (
      <p className="text-gray-500">No upcoming appointments</p>
    )}

    {appointments.map((appt) => {
      const date = new Date(appt.meetingDate);
      const formattedDate = date.toLocaleDateString();
      const formattedTime = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      return (
        <div
          key={appt.id}
          className="bg-[#14517d] rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row gap-5 items-center sm:items-stretch shadow-lg border border-[#0B1C58]/40"
        >
          {/* LEFT — ICON */}
          <div className="bg-white rounded-xl flex items-center justify-center w-[140px] h-[140px] sm:w-[150px] sm:h-[150px] shrink-0 relative">
            <Image
              src={appt.mentor?.profilePicture || DuoIcon}
              alt="Mentor"
              width={120}
              height={120}
              className="rounded-lg object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <button
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/90 flex items-center justify-center hover:scale-110 transition"
                onClick={() => window.open(appt.meetingLink, "_blank")}
              >
                <i className="fa-solid fa-video text-[#103C8C] text-sm"></i>
              </button>
            </div>
          </div>

          {/* RIGHT — CONTENT */}
          <div className="flex flex-col gap-4 w-full">

            {/* Appointment Card */}
            <div className="bg-[#F8FBFF] border border-[#E3E8F0] rounded-lg px-4 sm:px-5 py-3 hover:shadow-sm transition">
              
              <div className="flex justify-between items-start md:items-center gap-3">

                <div className="flex flex-col gap-[2px]">
                  <span className="text-sm text-gray-800 font-medium">
                    Meeting with {appt.mentor?.firstName} {appt.mentor?.lastName}
                  </span>

                  <p className="text-xs text-gray-600">
                    {appt.notes}
                  </p>

                  <p className="text-xs text-gray-600">
                    {formattedDate} • {formattedTime}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`text-[11px] px-3 py-[2px] rounded-full font-medium ${
                      appt.status === "scheduled"
                        ? "bg-[#D8FFF2] text-[#00A878]"
                        : appt.status === "pending"
                        ? "bg-[#FFF6D8] text-[#D38A00]"
                        : "bg-[#F3F3FF] text-[#5A5ADA]"
                    }`}
                  >
                    {appt.status}
                  </span>

                  <button
                    className="w-8 h-8 flex items-center justify-center border border-[#103C8C]/30 text-[#103C8C] rounded-md hover:bg-[#103C8C] hover:text-white transition"
                    onClick={() => window.open(appt.meetingLink, "_blank")}
                  >
                    <i className="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      );
    })}
  </div>
</section>


      {/* TODAY'S ROADMAP LIST */}
      <section className="bg-[#1C578E] py-10 px-4 sm:px-8 lg:px-20">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <h2 className="text-xl sm:text-[22px] font-semibold text-white">
            Today&apos;s Roadmap List
          </h2>
          <button
            className="text-white/70 text-sm font-medium hover:text-white"
            onClick={() => router.push("/pastor/revitalization-roadmap")}
          >
            See all
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          {["All", "Remaining", "In Progress", "Due"].map((tab) => (
            <button
              key={tab}
              onClick={() => setRoadmapTab(tab)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                roadmapTab === tab
                  ? "bg-white text-[#1C578E]"
                  : "bg-white/20 text-white hover:bg-white/30"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="flex flex-col gap-3">
          {filteredRoadmaps.length === 0 && (
            <p className="text-white/60 text-sm">No roadmaps found.</p>
          )}
          {filteredRoadmaps.map((roadmap) => (
            <div
              key={roadmap.id}
              className="flex items-center justify-between bg-white/10 hover:bg-white/15 transition rounded-xl px-5 py-4"
            >
              <div className="flex items-center gap-4">
                <div className="w-9 h-9 flex items-center justify-center bg-white/20 rounded-lg shrink-0">
                  <i className="fa-regular fa-file-lines text-white text-sm"></i>
                </div>
                <span className="text-white text-sm font-medium">
                  {roadmap.title}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`text-xs font-medium px-3 py-[3px] rounded-full ${
                    roadmap.status === "Due"
                      ? "bg-red-100 text-red-600"
                      : roadmap.status === "In Progress"
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {roadmap.status}
                </span>
                <button
                  onClick={() => router.push(`/pastor/roadmap-detail/${roadmap.id}`)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition"
                >
                  <i className="fa-solid fa-arrow-right text-xs"></i>
                </button>
              </div>
            </div>
          ))}
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
          <button
            className="text-[#103C8C] text-sm font-medium hover:underline hover:text-[#0D2E6E]"
            onClick={() => router.push("/pastor/Mymentors")}
          >
            See all
          </button>
        </div>

        {loadingMentors && (
          <p className="text-sm text-gray-500">Loading mentors...</p>
        )}

        {mentorsError && !loadingMentors && (
          <p className="text-sm text-red-500">{mentorsError}</p>
        )}

        {!loadingMentors && !mentorsError && mentors.length === 0 && (
          <p className="text-sm text-gray-500">No mentors assigned yet.</p>
        )}

        {!loadingMentors && !mentorsError && mentors.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {mentors.map((mentor, i) => {
              const img = mentorImages[i % mentorImages.length];

              return (
                <div
                  key={mentor.id}
                  className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 p-3"
                >
                  <div
                    className="relative cursor-pointer"
                    onClick={() => router.push(`/pastor/Mymentors`)}
                  >
                    <Image
                      src={img}
                      alt={`${mentor.firstName} ${mentor.lastName}`}
                      className="w-full h-[180px] object-cover"
                    />
                    <button className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center bg-white/80 rounded-full text-[#0B1C58] hover:bg-white shadow">
                      <i className="fa-solid fa-ellipsis-vertical text-sm"></i>
                    </button>
                  </div>

                  <div className="p-3 sm:p-4">
                    <h4 className="font-semibold text-gray-900 text-[15px] sm:text-[16px] leading-tight mb-1">
                      {mentor.firstName} {mentor.lastName}
                    </h4>
                    <p className="text-sm text-gray-500 capitalize">
                      {mentor.role || "Mentor"}
                    </p>
                    <p className="text-[13px] text-gray-400 mt-2">
                      {mentor.email}
                      <br />
                      Sub text area write something here.
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
              );
            })}
          </div>
        )}
      </section>

      <PastorFooter />
    </div>
  );
}
