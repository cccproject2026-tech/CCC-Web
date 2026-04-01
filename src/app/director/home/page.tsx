"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { setCookie, getCookie } from "@/app/utils/cookies";
import Image from "next/image";
import PastorFooter from "@/app/Components/PastorFooter";
import MentorCard from "@/app/Components/Card/MentorCard";
import HeroBg from "../../Assets/hero-bg.png";
import Book from "../../Assets/book.png";
import MapImg from "../../Assets/map-placeholder.png";
import DuoIcon from "../../Assets/duo.png";
import MeetIcon from "../../Assets/meet.png";
import UserProfile from "../../Assets/user-profile.png";
import Mentor1 from "../../Assets/mentor1.png";
import Mentor2 from "../../Assets/mentor2.png";
import Mentor3 from "../../Assets/mentor3.png";
import {
  CreateUserDto,
  apiGetDirectorOverview,
  DirectorOverviewDto,
  apiGetTodaysAppointments,
  apiGetAllInterests,
  apiGetMentors,
  apiGetPastors,
  apiCreateUser,
  apiGetUserById,
  Appointment,
  Interest,
  MentorPastor,
  User,
} from "@/app/Services/api";
import { getPastorMedia } from "@/app/Services/pastor.service";
import { getGreeting } from "@/app/Services/utils/helpers";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

const FALLBACK_USER_ID = "699feb343ef7ed6efc40a945";

function parseUserCookie(): { firstName?: string; lastName?: string } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = getCookie("user");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

const getMediaThumbnail = (item: { mediaFiles?: { thumbnail?: string }[]; heading?: string }) => {
  const url = item?.mediaFiles?.[0]?.thumbnail;
  if (url && url.trim() !== "") return url;
  return Book;
};

const directorExploreCards = [
  {
    title: "Mentees",
    desc: "Schedule and manage appointments with ease for personalized guidance.",
    icon: "fa-regular fa-calendar-check",
    route: "/director/mentees",
  },
  {
    title: "Track Progress",
    desc: "Track growth and celebrate milestones across your network.",
    icon: "fa-solid fa-chart-simple",
    route: "/director/track-progress",
  },
  {
    title: "Schedule",
    desc: "View and coordinate schedules across mentors and mentees.",
    icon: "fa-regular fa-clipboard",
    route: "/director/schedule",
  },
  {
    title: "Revitalization Roadmap",
    desc: "Plan and execute regional development roadmaps efficiently.",
    icon: "fa-solid fa-pen-clip",
    route: "/director/revitalization-roadmap",
  },
];

export default function DirectorHome() {
  const router = useRouter();
  const [resolvedUserId, setResolvedUserId] = useState<string>(FALLBACK_USER_ID);

  const [activeTab, setActiveTab] = useState<"mentors" | "pastors">("mentors");
  const [fullName, setFullName] = useState("");
  const [userForm, setUserForm] = useState({
    email: "",
    role: "",
  });

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [interests, setInterests] = useState<Interest[]>([]);
  const [mentors, setMentors] = useState<MentorPastor[]>([]);
  const [pastors, setPastors] = useState<MentorPastor[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [directorOverview, setDirectorOverview] = useState<DirectorOverviewDto | null>(null);

  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [interestsLoading, setInterestsLoading] = useState(true);
  const [mentorsLoading, setMentorsLoading] = useState(true);
  const [pastorsLoading, setPastorsLoading] = useState(true);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [addUserLoading, setAddUserLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [mediaList, setMediaList] = useState<
    {
      _id: string;
      heading?: string;
      subheading?: string;
      description?: string;
      createdAt?: string;
      mediaFiles?: { thumbnail?: string }[];
    }[]
  >([]);
  const [cookieUser, setCookieUser] = useState<{ firstName?: string; lastName?: string } | null>(null);

  useEffect(() => {
    const id = getCookie("userId");
    setResolvedUserId(id && id.trim() ? id : FALLBACK_USER_ID);
    setCookieUser(parseUserCookie());
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

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

  const formattedTime = currentTime.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const formattedDate = currentTime.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  const fetchMentors = useCallback(async () => {
    try {
      setMentorsLoading(true);
      const response = await apiGetMentors({ limit: 4, roleMatch: "mixed" });
      setMentors(response.data.data.users || []);
    } catch (error) {
      console.error('Error fetching mentors:', error);
      setMentors([]);
    } finally {
      setMentorsLoading(false);
    }
  }, []);

  const fetchPastors = useCallback(async () => {
    try {
      setPastorsLoading(true);
      const response = await apiGetPastors({ limit: 4, roleMatch: "mixed" });
      setPastors(response.data.data.users || []);
    } catch (error) {
      console.error('Error fetching pastors:', error);
      setPastors([]);
    } finally {
      setPastorsLoading(false);
    }
  }, []);

  useEffect(() => {
    const fetchAllData = async () => {
      const uid = resolvedUserId;
      const results = await Promise.allSettled([
        apiGetTodaysAppointments(uid),
        apiGetAllInterests({ status: 'new' }),
        apiGetMentors({ limit: 4, roleMatch: "mixed" }),
        apiGetPastors({ limit: 4, roleMatch: "mixed" }),
        apiGetDirectorOverview({
          period: 'yearly',
          year: new Date().getFullYear(),
          includeUsers: false,
        }),
        uid ? apiGetUserById(uid) : Promise.resolve(null),
      ]);

      // Handle appointments
      if (results[0].status === 'fulfilled') {
        setAppointments(results[0].value.data.data || []);
      } else {
        console.error('Error fetching appointments:', results[0].reason);
        setAppointments([]);
      }
      setAppointmentsLoading(false);

      // Handle interests
      if (results[1].status === 'fulfilled') {
        setInterests(results[1].value.data.data || []);
      } else {
        console.error('Error fetching interests:', results[1].reason);
        setInterests([]);
      }
      setInterestsLoading(false);

      // Handle mentors
      if (results[2].status === 'fulfilled') {
        setMentors(results[2].value.data.data.users || []);
      } else {
        console.error('Error fetching mentors:', results[2].reason);
        setMentors([]);
      }
      setMentorsLoading(false);

      // Handle pastors
      if (results[3].status === 'fulfilled') {
        setPastors(results[3].value.data.data.users || []);
      } else {
        console.error('Error fetching pastors:', results[3].reason);
        setPastors([]);
      }
      setPastorsLoading(false);

      // Handle director overview
      if (results[4].status === 'fulfilled') {
        setDirectorOverview(results[4].value.data.data);
      } else {
        console.error('Error fetching director overview:', results[4].reason);
      }
      setOverviewLoading(false);

      // Handle user details
      if (results[5].status === 'fulfilled' && results[5].value) {
        setUser(results[5].value.data.data || null);
        if (uid) {
          setCookie("userId", uid);
        }
      } else if (results[5].status === 'rejected') {
        console.error('Error fetching user details:', results[5].reason);
        setUser(null);
      }
    };

    fetchAllData();
  }, [resolvedUserId]);

  const chartData = useMemo(() => {
    return directorOverview?.monthlyData.slice(-6).map(month => ({
      pastor: month.pastorsCompleted,
      mentor: month.mentorsCompleted,
      monthName: month.monthName,
    })) || [];
  }, [directorOverview?.monthlyData]);

  const donutChartData = useMemo(() => {
    if (!directorOverview) return null;

    const completed = directorOverview.overallCombinedProgress;
    const remaining = 100 - completed;
    const completedDegrees = (completed / 100) * 360;

    return { completed, remaining, completedDegrees };
  }, [directorOverview]);

  const handleAddUser = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    const nameParts = fullName.trim().split(/\s+/);
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    if (!firstName) {
      alert("Please enter a full name");
      return;
    }

    const userData: CreateUserDto = {
      firstName,
      lastName,
      email: userForm.email,
      role: userForm.role,
    };

    try {
      setAddUserLoading(true);
      await apiCreateUser(userData);
      setFullName("");
      setUserForm({ email: "", role: "" });

      fetchMentors();
      fetchPastors();

      alert("User added successfully!");
    } catch (error: any) {
      console.error("Failed to add user:", error);
      alert(error.response?.data?.message || "Failed to add user. Please try again.");
    } finally {
      setAddUserLoading(false);
    }
  }, [fullName, userForm, fetchMentors, fetchPastors]);

  // Get current data based on active tab
  const currentData = useMemo(() => activeTab === "mentors" ? mentors : pastors, [activeTab, mentors, pastors]);
  const currentLoading = useMemo(() => activeTab === "mentors" ? mentorsLoading : pastorsLoading, [activeTab, mentorsLoading, pastorsLoading]);

  const formatAppointment = useCallback((appointment: Appointment) => {
    const platformIcon = appointment.platform === 'gmeet' ? MeetIcon : DuoIcon;
    const mentorName = appointment.mentor
      ? `${appointment.mentor.firstName || ''} ${appointment.mentor.lastName || ''}`.trim()
      : 'Mentor';
    const mentorRole = appointment.mentor?.role || 'mentor';
    const meetingDate = new Date(appointment.meetingDate);
    const meetingTime = meetingDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    return { platformIcon, mentorName, mentorRole, meetingDate, meetingTime };
  }, []);

  const displayName =
    user?.firstName || cookieUser?.firstName
      ? `${user?.firstName ?? cookieUser?.firstName ?? ""} ${user?.lastName ?? cookieUser?.lastName ?? ""}, Welcome Aboard!`
      : "Welcome Aboard!";

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFF]">
      {/* Hero — aligned with mentor home */}
      <section
        className="relative bg-cover bg-top text-white h-[450px] flex flex-col justify-between px-4 sm:px-8 md:px-16 lg:px-20 pt-6 pb-10"
        style={{ backgroundImage: `url(${HeroBg.src})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-transparent" />

        <div className="relative z-10 flex justify-center sm:justify-end">
          <div className="text-center sm:text-right">
            <div className="text-2xl sm:text-3xl font-bold tracking-wide">{formattedTime}</div>
            <p className="text-sm text-white/80">{formattedDate}</p>
          </div>
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-center sm:items-end gap-4 sm:gap-0">
          <div className="max-w-full sm:max-w-2xl text-center sm:text-left">
            <h1 className="text-2xl sm:text-4xl font-semibold leading-snug">
              Cultivate Spiritual, Professional, Social, And Community–
              <br className="hidden sm:block" />
              Engagement Developments
            </h1>
          </div>

          <div className="flex flex-col items-center sm:items-end">
            <p className="text-white/90 text-sm mb-2">{getGreeting()}</p>
            <div
              className="bg-white/15 backdrop-blur-md border border-white/30 rounded-md p-4 w-[280px] shadow-lg cursor-pointer"
              onClick={() => router.push("/director/profile")}
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
                  <p className="text-xs text-white font-semibold">{displayName}</p>
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

      {/* Continue watching — mentor styling */}
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
            pagination={{ clickable: true }}
            loop={mediaList.length > 3}
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
                  <div className="relative">
                    <Image
                      src={getMediaThumbnail(item)}
                      alt={item.heading || "Media thumbnail"}
                      width={400}
                      height={200}
                      className="w-full h-[160px] sm:h-[180px] object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <button
                        type="button"
                        className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center hover:scale-110 transition"
                      >
                        <i className="fa-solid fa-play text-[#103C8C] text-sm" />
                      </button>
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-xs text-[#103C8C] font-semibold mb-1">
                      {item.subheading || "Introduction"}
                    </p>
                    <h4 className="text-sm font-semibold mb-1">{item.heading}</h4>
                    <p className="text-xs text-gray-600 mb-3 leading-snug">{item.description}</p>
                    <div className="flex justify-between items-center text-xs text-gray-400">
                      <span>
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ""}
                      </span>
                      <button
                        type="button"
                        className="border border-[#103C8C] text-[#103C8C] p-[6px] rounded-md hover:bg-[#103C8C] hover:text-white transition"
                      >
                        <i className="fa-solid fa-arrow-up-right-from-square text-[10px]" />
                      </button>
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </section>

      {/* Today's Appointments */}
      <section className="bg-white py-16 px-4 md:px-20 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-[400px] h-[400px] bg-[radial-gradient(circle_at_70%_30%,#103C8C_10%,transparent_70%)] opacity-5" />
        <div className="relative z-10 flex justify-between items-center mb-8">
          <h2 className="text-[22px] font-semibold text-[#000]">Today&apos;s Appointments</h2>
          <Link
            href="/director/schedule"
            className="text-[#103C8C] text-sm font-medium hover:underline hover:text-[#0D2E6E]"
          >
            See all
          </Link>
        </div>

        {appointmentsLoading ? (
          <p className="text-gray-500 relative z-10">Loading appointments...</p>
        ) : appointments.length === 0 ? (
          <p className="text-gray-500 relative z-10">No appointments scheduled for today</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 relative z-10">
            {appointments.slice(0, 2).map((appointment) => {
              const { platformIcon, mentorName, mentorRole, meetingDate, meetingTime } =
                formatAppointment(appointment);

              return (
                <div
                  key={appointment.id}
                  className="bg-[#14517d] rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row gap-4 sm:gap-5 items-center shadow-lg border border-[#0B1C58]/40"
                >
                  <div className="bg-white rounded-xl flex items-center justify-center w-[100px] h-[100px] sm:w-[150px] sm:h-[150px] shrink-0">
                    <Image
                      src={platformIcon}
                      alt={appointment.platform}
                      className="w-[50px] h-[50px] sm:w-[65px] sm:h-[65px]"
                    />
                  </div>

                  <div className="flex flex-col text-white w-full text-center sm:text-left">
                    <div className="flex items-center gap-3 mb-3 justify-center sm:justify-start">
                      {appointment.mentor?.profilePicture ? (
                        <Image
                          src={appointment.mentor.profilePicture}
                          alt={mentorName}
                          width={36}
                          height={36}
                          className="rounded-full border border-white/40"
                        />
                      ) : (
                        <Image src={UserProfile} alt="User" width={36} height={36} className="rounded-full border border-white/40" />
                      )}
                      <div>
                        <h4 className="text-white font-semibold text-sm">{mentorName}</h4>
                        <p className="text-white/70 text-xs capitalize">{mentorRole}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-3 text-xs justify-center sm:justify-start">
                      <div className="bg-[#FFFFFF1A] border border-[#FFFFFF33] rounded-md px-3 py-[3px] flex items-center gap-2">
                        <i className="fa-regular fa-calendar text-[#E3D247]" />
                        <span>Date : {meetingDate.toLocaleDateString()}</span>
                      </div>
                      <div className="bg-[#FFFFFF1A] border border-[#FFFFFF33] rounded-md px-3 py-[3px] flex items-center gap-2">
                        <i className="fa-regular fa-clock text-[#24E0C2]" />
                        <span>Time : {meetingTime}</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-xs mb-2">
                          Mode :{" "}
                          <span className="underline underline-offset-2 text-[#B8D4FF] capitalize">
                            {appointment.platform}
                          </span>
                        </p>
                        <div className="flex gap-4 text-white text-sm">
                          <i className="fa-solid fa-phone" />
                          <i className="fa-regular fa-comment" />
                          <i className="fa-brands fa-whatsapp" />
                        </div>
                      </div>

                      <button
                        type="button"
                        className="bg-[#0B1C58] hover:bg-[#122D80] px-6 py-[6px] rounded-md text-sm"
                      >
                        Details
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Today&apos;s roadmap list — mentor styling */}
      <section className="py-16 px-4 md:px-20 bg-[#196394]">
        <div className="bg-white rounded-2xl p-8 shadow-md max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h3 className="text-lg font-semibold text-[#0B1C58]">Today&apos;s Roadmap List</h3>
            <div className="flex bg-[#F1F4F9] rounded-md overflow-hidden w-full sm:w-auto">
              {["All", "Roadmap", "Survey"].map((tab, index) => (
                <button
                  key={tab}
                  type="button"
                  className={`px-3 sm:px-4 py-[6px] text-sm font-medium flex-1 sm:flex-none ${
                    index === 0 ? "bg-[#0B1C58] text-white" : "text-gray-500 hover:text-[#0B1C58]"
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
            ].map((item, idx) => (
              <div
                key={idx}
                className="bg-[#F8FBFF] border border-[#E3E8F0] rounded-lg px-5 py-3 flex justify-between items-center"
              >
                <div>
                  <p className="text-sm font-medium text-[#0B1C58]">{item.title}</p>
                  <p className="text-xs text-gray-600">{item.desc}</p>
                </div>
                <span className="text-sm text-gray-700">{item.user}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-end mt-6">
            <button
              type="button"
              onClick={() => router.push("/director/revitalization-roadmap")}
              className="bg-[#103C8C] hover:bg-[#0A2B6B] text-white px-5 py-2 rounded-md text-sm"
            >
              View Roadmap
            </button>
          </div>
        </div>
      </section>

      {/* New Interests Section */}
      <section className="py-16 px-4 md:px-20 bg-gradient-to-b from-[#E8F1FA] to-[#F7FAFF]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* Left side - Description */}
          <div className="text-[#0B1C58]">
            <h2 className="text-2xl sm:text-3xl md:text-[32px] font-semibold mb-4">
              New Interests
            </h2>
            <p className="text-gray-700 text-base mb-6 leading-relaxed">
              Review the details of the newly submitted interest and take the
              next steps to guide and support the process effectively.
            </p>
            <button
              type="button"
              onClick={() => router.push("/director/interest-list")}
              className="bg-[#103C8C] text-white px-8 py-3 rounded-md font-semibold hover:bg-[#0A2B6B] transition shadow-md"
            >
              See All
            </button>
          </div>

          {/* Right side - Interest Cards */}
          <div className="space-y-4">
            {interestsLoading ? (
              <div className="text-gray-600 text-center py-8">Loading interests...</div>
            ) : interests.length === 0 ? (
              <div className="text-gray-600 text-center py-8">No new interests</div>
            ) : (
              interests.slice(0, 4).map((interest) => (
                <div
                  key={interest._id}
                  className="bg-white rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 shadow-md border border-[#E3E8F0]"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-[50px] h-[50px] bg-[#103C8C] rounded-full flex items-center justify-center">
                      <i className="fa-solid fa-user text-white text-xl"></i>
                    </div>
                    <div>
                      <h4 className="text-[#000] font-semibold text-base">
                        {interest.firstName} {interest.lastName}
                      </h4>
                      <p className="text-gray-500 text-sm">{interest.title || "No title"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                    <button type="button" className="hover:opacity-80">
                      <i className="fa-solid fa-envelope text-[#103C8C] text-lg"></i>
                    </button>
                    <button type="button" className="hover:opacity-80">
                      <i className="fa-regular fa-comment text-[#103C8C] text-lg"></i>
                    </button>
                    <button type="button" className="hover:opacity-80">
                      <i className="fa-solid fa-phone text-[#103C8C] text-lg"></i>
                    </button>
                    <button
                      type="button"
                      onClick={() => router.push(`/director/interest-list/${interest.id || interest._id}`)}
                      className="bg-[#103C8C] text-white px-4 sm:px-6 py-2 rounded-md font-medium hover:bg-[#0A2B6B] transition w-full sm:w-auto"
                    >
                      View
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Add User Section */}
      <section className="py-8 px-4 sm:py-12 sm:px-8 md:py-16 md:px-16 lg:px-20 bg-[#F2F6FC]">
        <div className="bg-gradient-to-br from-[#0A3C8C] to-[#052860] rounded-3xl p-8 sm:p-12 max-w-6xl mx-auto shadow-lg">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
            {/* Left side */}
            <div className="text-white">
              <h2 className="text-2xl sm:text-3xl md:text-[32px] font-bold mb-3">
                Add User
              </h2>
              <p className="text-white/90">
                Add new pastors and mentors to the platform
              </p>
            </div>

            {/* Right side - Form */}
            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="text-white text-sm mb-2 block">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="Enter full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-md bg-white/10 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
                />
              </div>

              <div>
                <label className="text-white text-sm mb-2 block">
                  Email ID
                </label>
                <input
                  type="email"
                  placeholder="Enter e-mail ID"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-md bg-white/10 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
                />
              </div>

              <div>
                <label className="text-white text-sm mb-2 block">Title</label>
                <select
                  value={userForm.role}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-md bg-white/10 border border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                >
                  <option className="text-black" value="">Select Title</option>
                  <option className="text-black" value="pastor">Pastor</option>
                  <option className="text-black" value="lay leader">Lay Leader</option>
                  <option className="text-black" value="seminarian">Seminarian</option>
                  <option className="text-black" value="mentor">Mentor</option>
                  <option className="text-black" value="field-mentor">Field Mentor</option>
                </select>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={addUserLoading}
                  className="bg-white text-[#103C8C] px-10 py-3 rounded-md font-semibold hover:bg-gray-100 transition mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {addUserLoading ? 'Adding...' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Mentors/Pastors Section */}
        <div className="mt-12 sm:mt-16">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <div className="flex gap-2 sm:gap-4 bg-[#E8F0F8] p-2 rounded-[20px] w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setActiveTab("mentors")}
                className={`px-6 sm:px-8 md:px-10 py-3 rounded-[16px] font-semibold text-sm sm:text-[16px] transition-all duration-300 flex-1 sm:flex-none ${
                  activeTab === "mentors"
                    ? "bg-[#103C8C] text-white shadow-lg"
                    : "bg-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Mentors
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("pastors")}
                className={`px-6 sm:px-8 md:px-10 py-3 rounded-[16px] font-semibold text-sm sm:text-[16px] transition-all duration-300 flex-1 sm:flex-none ${
                  activeTab === "pastors"
                    ? "bg-[#103C8C] text-white shadow-lg"
                    : "bg-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Pastors
              </button>
            </div>
            <Link
              href={activeTab === "mentors" ? "/director/mentors" : "/director/mentees"}
              className="text-[#103C8C] text-sm sm:text-[15px] font-semibold hover:underline"
            >
              See all
            </Link>
          </div>

          {currentLoading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : currentData.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No data available</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
              {currentData.map((person) => {
                const personId = (person as any).id || person._id;
                const menteeCount = person.assignedId?.length || person.menteeCount || 0;
                const isMentor = activeTab === "mentors";
                return (
                  <MentorCard
                    key={personId}
                    image={person?.profilePicture ? person.profilePicture : Mentor1}
                    name={`${person.firstName} ${person.lastName}`}
                    role={person.role}
                    menteeCount={menteeCount}
                    onViewDetails={() =>
                      isMentor
                        ? router.push(`/director/mentors/profile/${personId}`)
                        : router.push(`/director/mentees/profile?id=${personId}`)
                    }
                  />
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Explore CCC — mentor home styling */}
      <section className="py-20 px-4 md:px-20 bg-gradient-to-b from-[#E8F1FA] to-[#F7FAFF]">
        <h2 className="text-[22px] font-semibold text-[#000] mb-10">Explore CCC</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {directorExploreCards.map((item) => (
            <div
              key={item.route}
              role="button"
              tabIndex={0}
              onClick={() => router.push(item.route)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") router.push(item.route);
              }}
              className="cursor-pointer rounded-xl p-6 bg-gradient-to-br from-[#0A3C8C] to-[#052860] text-white flex flex-col justify-between hover:scale-[1.02] transition min-h-[200px]"
            >
              <i className={`${item.icon} text-2xl mb-4`} />
              <div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-white/80">{item.desc}</p>
              </div>
              <div className="flex justify-end mt-4">
                <span className="flex items-center gap-2 text-sm hover:text-[#BFD9FF]">
                  More
                  <i className="fa-solid fa-arrow-up-right-from-square text-xs" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Over View */}
      <section className="py-16 px-4 md:px-20 bg-white">
        <h2 className="text-[22px] font-semibold text-[#000] mb-8">Over View</h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
          {overviewLoading ? (
            <div className="col-span-3 text-center py-8 text-gray-500">Loading overview...</div>
          ) : directorOverview ? (
            <>
              <div className="bg-[#F8FBFF] border border-[#E3E8F0] rounded-xl p-8 shadow-sm">
                <p className="text-gray-600 text-sm mb-2">Total Mentors</p>
                <h3 className="text-4xl font-bold text-[#103C8C]">
                  {directorOverview.totalMentors}
                </h3>
              </div>
              <div className="bg-[#F8FBFF] border border-[#E3E8F0] rounded-xl p-8 shadow-sm">
                <p className="text-gray-600 text-sm mb-2">Total Pastors</p>
                <h3 className="text-4xl font-bold text-[#103C8C]">
                  {directorOverview.totalPastors}
                </h3>
              </div>
              <div className="bg-[#F8FBFF] border border-[#E3E8F0] rounded-xl p-8 shadow-sm">
                <p className="text-gray-600 text-sm mb-2">Pastors Completed</p>
                <h3 className="text-4xl font-bold text-[#103C8C]">
                  {directorOverview.completedPastors}
                </h3>
              </div>
            </>
          ) : (
            <div className="col-span-3 text-center py-8 text-gray-500">No data available</div>
          )}
        </div>

        {/* Overall Progress */}
        <h2 className="text-[22px] font-semibold text-[#000] mb-8">Overall Progress</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          {/* Donut Chart */}
          <div className="bg-[#F8FBFF] border border-[#E3E8F0] rounded-xl p-8 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-[#000]">
                Roadmap & Assessments
              </h3>
              <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-[#103C8C] rounded-full"></div>
                  <span className="text-gray-600">Completed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-[#F9C74F] rounded-full"></div>
                  <span className="text-gray-600">Remaining</span>
                </div>
              </div>
            </div>

            <div className="flex justify-center items-center h-[280px]">
              {overviewLoading ? (
                <div className="text-gray-500">Loading...</div>
              ) : donutChartData ? (
                <div className="relative">
                  <div className="w-[240px] h-[240px] rounded-full relative">
                    {/* Outer circle with conic gradient */}
                    <div
                      className="w-full h-full rounded-full absolute inset-0"
                      style={{
                        background: `conic-gradient(
                          #103C8C 0deg ${donutChartData.completedDegrees}deg,
                          #F9C74F ${donutChartData.completedDegrees}deg 360deg
                        )`,
                      }}
                    ></div>
                    {/* Inner white circle to create donut effect */}
                    <div className="w-[160px] h-[160px] rounded-full bg-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-[#103C8C]">
                        {donutChartData.completed.toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-500 mt-1">Completed</div>
                    </div>
                  </div>
                  <div className="absolute -left-12 sm:-left-20 top-1/2 transform -translate-y-1/2 bg-[#103C8C] text-white px-2 sm:px-4 py-2 rounded-md font-semibold text-sm">
                    {donutChartData.completed.toFixed(1)}%
                  </div>
                  <div className="absolute -right-12 sm:-right-20 top-1/2 transform -translate-y-1/2 bg-[#F9C74F] text-[#103C8C] px-2 sm:px-4 py-2 rounded-md font-semibold text-sm">
                    {donutChartData.remaining.toFixed(1)}%
                  </div>
                </div>
              ) : (
                <div className="text-gray-500">No data available</div>
              )}
            </div>
          </div>

          {/* Bar Chart */}
          <div className="bg-[#F8FBFF] border border-[#E3E8F0] rounded-xl p-4 sm:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <h3 className="text-lg font-semibold text-[#000]">
                Roadmap & Assessments
              </h3>
              <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 bg-[#5B7FDB] rounded-full"></div>
                  <span className="text-gray-600">Pastor</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 bg-[#4AC5D9] rounded-full"></div>
                  <span className="text-gray-600">Mentor</span>
                </div>
                <select className="border border-gray-300 rounded-md px-3 py-1 text-sm">
                  <option>Past 6 Months</option>
                </select>
              </div>
            </div>

            <div className="h-[200px] sm:h-[280px] flex items-end justify-between gap-2 sm:gap-4">
              {overviewLoading ? (
                <div className="w-full flex items-center justify-center h-full text-gray-500">
                  Loading chart data...
                </div>
              ) : chartData.length > 0 ? (
                chartData.map((data, i) => {
                  const maxValue = Math.max(
                    ...chartData.map(d => Math.max(d.pastor, d.mentor))
                  );
                  const pastorHeight = maxValue > 0 ? (data.pastor / maxValue) * 100 : 0;
                  const mentorHeight = maxValue > 0 ? (data.mentor / maxValue) * 100 : 0;

                  return (
                    <div
                      key={i}
                      className="flex-1 flex flex-col items-center gap-2"
                    >
                      <div className="w-full flex gap-1 items-end h-[160px] sm:h-[220px]">
                        <div
                          className="flex-1 bg-[#5B7FDB] rounded-t-md"
                          style={{ height: `${pastorHeight}%` }}
                        ></div>
                        <div
                          className="flex-1 bg-[#4AC5D9] rounded-t-md"
                          style={{ height: `${mentorHeight}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-600">{data.monthName}</span>
                    </div>
                  );
                })
              ) : (
                <div className="w-full flex items-center justify-center h-full text-gray-500">
                  No chart data available
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Course Completed & Invite */}
      <section className="py-16 px-4 md:px-20 bg-[#F2F6FC]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <button
            type="button"
            onClick={() => router.push("/director/course-completed")}
            className="text-left bg-gradient-to-r from-[#103C8C] to-[#0B1C58] rounded-xl p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 text-white w-full"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <i className="fa-solid fa-award text-2xl"></i>
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-semibold">Course Completed</h3>
                <div className="w-7 h-7 bg-[#FFD700] text-[#103C8C] rounded-full flex items-center justify-center text-sm font-bold mt-1">
                  3
                </div>
              </div>
            </div>
            <span className="hover:opacity-80 self-end sm:self-auto">
              <i className="fa-solid fa-arrow-up-right-from-square text-xl"></i>
            </span>
          </button>

          <button
            type="button"
            onClick={() => router.push("/director/invite-field-mentor")}
            className="text-left bg-gradient-to-r from-[#0F4A85] to-[#0B1C58] rounded-xl p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 text-white w-full"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <i className="fa-solid fa-user-plus text-2xl"></i>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold">Invite to be a Field Mentor</h3>
            </div>
            <span className="hover:opacity-80 self-end sm:self-auto">
              <i className="fa-solid fa-arrow-up-right-from-square text-xl"></i>
            </span>
          </button>
        </div>
      </section>

      {/* Map — mentor home */}
      <section className="py-20 px-4 md:px-20 bg-[#0F4A85] text-white">
        <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
          <h2 className="text-[22px] font-semibold">Network map</h2>
          <input
            type="text"
            placeholder="Search..."
            className="px-4 py-2 rounded-md text-sm text-gray-800 max-w-xs w-full sm:w-auto"
          />
        </div>

        <div className="relative rounded-2xl overflow-hidden shadow-lg border border-[#ffffff22]">
          <Image
            src={MapImg}
            alt="Map"
            className="w-full h-[420px] object-cover"
          />
          <div className="absolute bottom-6 left-6 bg-white/20 backdrop-blur-md px-5 py-3 rounded-lg">
            <p className="text-sm font-medium">Mentor and mentee locations across the region</p>
          </div>
        </div>
      </section>

      <PastorFooter />
    </div>
  );
}
