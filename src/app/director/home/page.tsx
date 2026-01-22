"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import Image from "next/image";
import AppHeader from "@/app/Components/Header/AppHeader";
import DirectorFooter from "@/app/Components/AppFooter";
import MentorCard from "@/app/Components/Card/MentorCard";
import ExploreCCCCard from "@/app/Components/ExploreCCCCard";
import HeroBg from "../../Assets/hero-bg.png";
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

export default function DirectorHome() {
  // Test userId for fetching user details (will come from login response)
  const TEST_USER_ID = "6955249e3ee2d415cd24373b";

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

  const fetchMentors = useCallback(async () => {
    try {
      setMentorsLoading(true);
      const response = await apiGetMentors({ limit: 4 });
      setMentors(response.data.mentors || []);
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
      const response = await apiGetPastors({ limit: 4 });
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
      const results = await Promise.allSettled([
        apiGetTodaysAppointments(),
        apiGetAllInterests({ status: 'new' }),
        apiGetMentors({ limit: 4, roleMatch: "mixed" }),
        apiGetPastors({ limit: 4, roleMatch: "mixed" }),
        apiGetDirectorOverview({
          period: 'yearly',
          year: new Date().getFullYear(),
          includeUsers: false,
        }),
        TEST_USER_ID ? apiGetUserById(TEST_USER_ID) : Promise.resolve(null),
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
        setMentors(results[2].value.data.mentors || []);
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
        // Store userId in localStorage
        if (typeof window !== 'undefined' && TEST_USER_ID) {
          localStorage.setItem('userId', TEST_USER_ID);
        }
      } else if (results[5].status === 'rejected') {
        console.error('Error fetching user details:', results[5].reason);
        setUser(null);
      }
    };

    fetchAllData();
  }, [TEST_USER_ID]);

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

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section
        className="relative bg-cover bg-center text-white h-[300px] sm:h-[400px] md:h-[500px] flex flex-col justify-between px-4 sm:px-8 md:px-16 lg:px-20 pt-4 pb-6 sm:pt-6 sm:pb-10"
        style={{ backgroundImage: `url(${HeroBg.src})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-transparent"></div>

        {/* Top Right - Time and Date */}
        <div className="relative z-10 flex justify-end">
          <div className="text-right">
            <div className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-wide">
              11 : 59 AM
            </div>
            <p className="text-base sm:text-lg text-white/90 mt-1">
              Tuesday, Sep 23
            </p>
            <p className="text-lg sm:text-xl text-white/90 mt-2">
              Good Morning
            </p>
          </div>
        </div>

        {/* Bottom - Hero Text */}
        <div className="relative z-10">
          <h1 className="text-3xl sm:text-4xl max-sm:text-xl  md:text-5xl font-semibold leading-snug max-w-4xl">
            Cultivate Spiritual, Professional,
            <br />
            Social, And Community–
            <br />
            Engagement Developments
          </h1>
        </div>
      </section>

      {/* Today's Appointments */}
      <section className="py-8 px-4 sm:py-12 sm:px-8 md:py-16 md:px-16 lg:px-20 bg-white">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-2">
          <h2 className="text-xl sm:text-2xl md:text-[28px] font-semibold text-[#000]">
            Today&apos;s Appointments
          </h2>
          <a
            href="#"
            className="text-[#2E3B8E] text-sm font-medium hover:underline"
          >
            See all
          </a>
        </div>

        {appointmentsLoading ? (
          <div className="text-center py-8 text-gray-500">Loading appointments...</div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No appointments for today</div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
            {appointments.slice(0, 2).map((appointment) => {
              const { platformIcon, mentorName, mentorRole, meetingDate, meetingTime } = formatAppointment(appointment);

              return (
                <div key={appointment.id} className="bg-[#1B5A8E] rounded-2xl p-4 sm:p-5 lg:p-6 flex flex-col lg:flex-row gap-4 lg:gap-5 items-start lg:items-center shadow-lg">
                  <div className="bg-white rounded-xl flex items-center justify-center w-[80px] h-[80px] sm:w-[100px] sm:h-[100px] lg:w-[140px] lg:h-[140px] xl:w-[160px] xl:h-[160px] shrink-0 mx-auto lg:mx-0">
                    <Image
                      src={platformIcon}
                      alt={appointment.platform}
                      className="w-[40px] h-[40px] sm:w-[50px] sm:h-[50px] lg:w-[70px] lg:h-[70px] xl:w-[80px] xl:h-[80px]"
                    />
                  </div>

                  <div className="flex flex-col w-full text-white">
                    <div className="flex items-center gap-2 sm:gap-3 mb-3">
                      {appointment.mentor?.profilePicture ? (
                        <Image
                          src={appointment.mentor.profilePicture}
                          alt={mentorName}
                          width={48}
                          height={48}
                          className="w-[48px] h-[48px] sm:w-[52px] sm:h-[52px] rounded-full border-2 border-white/40"
                        />
                      ) : (
                        <div className="w-[48px] h-[48px] sm:w-[52px] sm:h-[52px] bg-white/20 rounded-full flex items-center justify-center border-2 border-white/40">
                          <i className="fa-solid fa-user text-white text-xl sm:text-2xl"></i>
                        </div>
                      )}
                      <div>
                        <h4 className="text-white font-semibold text-sm lg:text-base">
                          {mentorName}
                        </h4>
                        <p className="text-white/70 text-xs lg:text-sm capitalize">{mentorRole}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1 sm:gap-2 mb-3">
                      <div className="bg-[#FFFFFF1A] border border-[#FFFFFF33] rounded-md px-2 sm:px-3 py-1 text-xs flex items-center gap-1 sm:gap-2">
                        <i className="fa-regular fa-calendar text-[#FFD700]"></i>
                        <span className="text-xs">Date : {meetingDate.toLocaleDateString()}</span>
                      </div>
                      <div className="bg-[#FFFFFF1A] border border-[#FFFFFF33] rounded-md px-2 sm:px-3 py-1 text-xs flex items-center gap-1 sm:gap-2">
                        <i className="fa-regular fa-clock text-[#24E0C2]"></i>
                        <span className="text-xs">Time : {meetingTime}</span>
                      </div>
                    </div>

                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-3 lg:gap-4">
                      <div className="flex-1">
                        <p className="text-xs lg:text-sm text-white/90 mb-2">
                          Mode : <span className="underline capitalize">{appointment.platform}</span>
                        </p>
                        <div className="flex gap-3 lg:gap-4 text-white text-sm lg:text-base">
                          <i className="fa-solid fa-phone cursor-pointer hover:opacity-80"></i>
                          <i className="fa-regular fa-comment cursor-pointer hover:opacity-80"></i>
                          <i className="fa-solid fa-envelope cursor-pointer hover:opacity-80"></i>
                          <i className="fa-brands fa-whatsapp cursor-pointer hover:opacity-80"></i>
                        </div>
                      </div>

                      <button className="bg-[#0B1C58] hover:bg-[#122D80] transition px-4 lg:px-6 py-2 rounded-md text-xs lg:text-sm font-medium w-full sm:w-auto lg:w-auto shrink-0">
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

      {/* New Interests Section */}
      <section className="py-8 px-4 sm:py-12 sm:px-8 md:py-16 md:px-16 lg:px-20 bg-[#2876AC]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* Left side - Description */}
          <div className="text-white">
            <h2 className="text-2xl sm:text-3xl md:text-[32px] font-semibold mb-4">
              New Interests
            </h2>
            <p className="text-white/90 text-base mb-6 leading-relaxed">
              Review the details of the newly submitted interest and take the
              next steps to guide and support the process effectively.
            </p>
            <button className="bg-white text-[#2876AC] px-8 py-3 rounded-md font-semibold hover:bg-gray-100 transition">
              See All
            </button>
          </div>

          {/* Right side - Interest Cards */}
          <div className="space-y-4">
            {interestsLoading ? (
              <div className="text-white text-center py-8">Loading interests...</div>
            ) : interests.length === 0 ? (
              <div className="text-white text-center py-8">No new interests</div>
            ) : (
              interests.slice(0, 4).map((interest) => (
                <div
                  key={interest._id}
                  className="bg-white rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 shadow-md"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-[50px] h-[50px] bg-[#2E3B8E] rounded-full flex items-center justify-center">
                      <i className="fa-solid fa-user text-white text-xl"></i>
                    </div>
                    <div>
                      <h4 className="text-[#000] font-semibold text-base">
                        {interest.firstName} {interest.lastName}
                      </h4>
                      <p className="text-gray-500 text-sm">{interest.title || 'No title'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                    <button className="hover:opacity-80">
                      <i className="fa-solid fa-envelope text-[#2E3B8E] text-lg"></i>
                    </button>
                    <button className="hover:opacity-80">
                      <i className="fa-regular fa-comment text-[#2E3B8E] text-lg"></i>
                    </button>
                    <button className="hover:opacity-80">
                      <i className="fa-solid fa-phone text-[#2E3B8E] text-lg"></i>
                    </button>
                    <button className="bg-[#2E3B8E] text-white px-4 sm:px-6 py-2 rounded-md font-medium hover:bg-[#1F2A6E] transition w-full sm:w-auto">
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
      <section className="py-8 px-4 sm:py-12 sm:px-8 md:py-16 md:px-16 lg:px-20 bg-[#F0F4F8]">
        <div className="bg-gradient-to-br from-[#2876AC] to-[#2E3B8E] rounded-3xl p-8 sm:p-12 max-w-6xl mx-auto">
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
                  className="bg-white text-[#2E3B8E] px-10 py-3 rounded-md font-semibold hover:bg-gray-100 transition mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
                onClick={() => setActiveTab("mentors")}
                className={`px-6 sm:px-8 md:px-10 py-3 rounded-[16px] font-semibold text-sm sm:text-[16px] transition-all duration-300 flex-1 sm:flex-none ${activeTab === "mentors"
                    ? "bg-[#2E3B8E] text-white shadow-lg"
                    : "bg-transparent text-gray-500 hover:text-gray-700"
                  }`}
              >
                Mentors
              </button>
              <button
                onClick={() => setActiveTab("pastors")}
                className={`px-6 sm:px-8 md:px-10 py-3 rounded-[16px] font-semibold text-sm sm:text-[16px] transition-all duration-300 flex-1 sm:flex-none ${activeTab === "pastors"
                    ? "bg-[#2E3B8E] text-white shadow-lg"
                    : "bg-transparent text-gray-500 hover:text-gray-700"
                  }`}
              >
                Pastors
              </button>
            </div>
            <a
              href="#"
              className="text-[#2E3B8E] text-sm sm:text-[15px] font-semibold hover:underline"
            >
              See all
            </a>
          </div>

          {currentLoading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : currentData.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No data available</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
              {currentData.map((person) => {
                const menteeCount = person.assignedId?.length || person.menteeCount || 0;
                return (
                  <MentorCard
                    key={person._id}
                    image={person?.profilePicture ? person.profilePicture : Mentor1}
                    name={`${person.firstName} ${person.lastName}`}
                    role={person.role}
                    menteeCount={menteeCount}
                    onViewDetails={() =>
                      console.log(`View details for ${person.firstName} ${person.lastName}`)
                    }
                  />
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Explore CCC */}
      <section className="py-8 px-4 sm:py-12 sm:px-8 md:py-16 md:px-16 lg:px-20 bg-white">
        <h2 className="text-2xl sm:text-3xl md:text-[32px] font-bold text-[#000] mb-8 sm:mb-10">
          Explore CCC
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          <ExploreCCCCard
            title="Mentees"
            description="Schedule and manage appointments with ease for personalized guidance."
            icon="fa-solid fa-users"
            onMoreClick={() => console.log("Navigate to Mentees")}
          />
          <ExploreCCCCard
            title="Track Progress"
            description="Track your growth and celebrate milestones in your journey."
            icon="fa-solid fa-chart-line"
            onMoreClick={() => console.log("Navigate to Track Progress")}
          />
          <ExploreCCCCard
            title="Schedule"
            description="Share feedback and insights through quick, easy surveys."
            icon="fa-regular fa-calendar"
            onMoreClick={() => console.log("Navigate to Schedule")}
          />
          <ExploreCCCCard
            title="Revitalization Roadmap"
            description="Share feedback and insights through quick, easy surveys."
            icon="fa-solid fa-clipboard-check"
            onMoreClick={() =>
              console.log("Navigate to Revitalization Roadmap")
            }
          />
        </div>
      </section>

      {/* Over View */}
      <section className="py-8 px-4 sm:py-12 sm:px-8 md:py-16 md:px-16 lg:px-20 bg-[#D8E8F5]">
        <h2 className="text-2xl sm:text-[28px] font-semibold text-[#000] mb-8">
          Over View
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
          {overviewLoading ? (
            <div className="col-span-3 text-center py-8 text-gray-500">Loading overview...</div>
          ) : directorOverview ? (
            <>
              <div className="bg-white rounded-xl p-8 shadow-sm">
                <p className="text-gray-600 text-sm mb-2">Total Mentors</p>
                <h3 className="text-4xl font-bold text-[#2E3B8E]">
                  {directorOverview.totalMentors}
                </h3>
              </div>
              <div className="bg-white rounded-xl p-8 shadow-sm">
                <p className="text-gray-600 text-sm mb-2">Total Pastors</p>
                <h3 className="text-4xl font-bold text-[#2E3B8E]">
                  {directorOverview.totalPastors}
                </h3>
              </div>
              <div className="bg-white rounded-xl p-8 shadow-sm">
                <p className="text-gray-600 text-sm mb-2">Pastors Completed</p>
                <h3 className="text-4xl font-bold text-[#2E3B8E]">
                  {directorOverview.completedPastors}
                </h3>
              </div>
            </>
          ) : (
            <div className="col-span-3 text-center py-8 text-gray-500">No data available</div>
          )}
        </div>

        {/* Overall Progress */}
        <h2 className="text-2xl sm:text-[28px] font-semibold text-[#000] mb-8">
          Overall Progress
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          {/* Donut Chart */}
          <div className="bg-white rounded-xl p-8 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-[#000]">
                Roadmap & Assessments
              </h3>
              <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-[#2E3B8E] rounded-full"></div>
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
                          #2E3B8E 0deg ${donutChartData.completedDegrees}deg,
                          #F9C74F ${donutChartData.completedDegrees}deg 360deg
                        )`
                      }}
                    ></div>
                    {/* Inner white circle to create donut effect */}
                    <div className="w-[160px] h-[160px] rounded-full bg-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-[#2E3B8E]">
                        {donutChartData.completed.toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-500 mt-1">Completed</div>
                    </div>
                  </div>
                  <div className="absolute -left-12 sm:-left-20 top-1/2 transform -translate-y-1/2 bg-[#2E3B8E] text-white px-2 sm:px-4 py-2 rounded-md font-semibold text-sm">
                    {donutChartData.completed.toFixed(1)}%
                  </div>
                  <div className="absolute -right-12 sm:-right-20 top-1/2 transform -translate-y-1/2 bg-[#F9C74F] text-[#2E3B8E] px-2 sm:px-4 py-2 rounded-md font-semibold text-sm">
                    {donutChartData.remaining.toFixed(1)}%
                  </div>
                </div>
              ) : (
                <div className="text-gray-500">No data available</div>
              )}
            </div>
          </div>

          {/* Bar Chart */}
          <div className="bg-white rounded-xl p-4 sm:p-8 shadow-sm">
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
      <section className="py-8 px-4 sm:py-12 sm:px-8 md:py-16 md:px-16 lg:px-20 bg-white">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div className="bg-gradient-to-r from-[#2E3B8E] to-[#4A5FB8] rounded-xl p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 text-white">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <i className="fa-solid fa-award text-2xl"></i>
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-semibold">
                  Course Completed
                </h3>
                <div className="w-7 h-7 bg-[#FFD700] text-[#2E3B8E] rounded-full flex items-center justify-center text-sm font-bold mt-1">
                  3
                </div>
              </div>
            </div>
            <button className="hover:opacity-80 self-end sm:self-auto">
              <i className="fa-solid fa-arrow-up-right-from-square text-xl"></i>
            </button>
          </div>

          <div className="bg-gradient-to-r from-[#2876AC] to-[#3A8EC4] rounded-xl p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 text-white">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <i className="fa-solid fa-user-plus text-2xl"></i>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold">
                Invite to be a Field Mentor
              </h3>
            </div>
            <button className="hover:opacity-80 self-end sm:self-auto">
              <i className="fa-solid fa-arrow-up-right-from-square text-xl"></i>
            </button>
          </div>
        </div>
      </section>

      <DirectorFooter />
    </div>
  );
}
