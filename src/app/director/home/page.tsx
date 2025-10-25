"use client";
import { useState } from "react";
import Image from "next/image";
import DirectorHeader from "@/app/Components/DirectorHeader";
import DirectorFooter from "@/app/Components/DirectorFooter";
import MentorCard from "@/app/Components/MentorCard";
import ExploreCCCCard from "@/app/Components/ExploreCCCCard";
import HeroBg from "../../Assets/hero-bg.png";
import DuoIcon from "../../Assets/duo.png";
import MeetIcon from "../../Assets/meet.png";
import UserProfile from "../../Assets/user-profile.png";
import Mentor1 from "../../Assets/mentor1.png";
import Mentor2 from "../../Assets/mentor2.png";
import Mentor3 from "../../Assets/mentor3.png";

export default function DirectorHome() {
  const [activeTab, setActiveTab] = useState<"mentors" | "pastors">("mentors");

  // Dynamic mentor data array
  const mentorsData = [
    { id: 1, image: Mentor1, name: "John Doe", role: "Mentor", menteeCount: 5 },
    { id: 2, image: Mentor2, name: "John Doe", role: "Mentor", menteeCount: 5 },
    {
      id: 3,
      image: Mentor3,
      name: "John Doe",
      role: "Field Mentor",
      menteeCount: 5,
    },
    { id: 4, image: Mentor1, name: "John Doe", role: "Mentor", menteeCount: 5 },
  ];

  // Dynamic pastors data array
  const pastorsData = [
    {
      id: 1,
      image: Mentor1,
      name: "Robert Fox",
      role: "Pastor",
      menteeCount: 3,
    },
    {
      id: 2,
      image: Mentor2,
      name: "Jacob Jones",
      role: "Pastor",
      menteeCount: 4,
    },
    {
      id: 3,
      image: Mentor3,
      name: "John Ross",
      role: "Pastor",
      menteeCount: 2,
    },
    {
      id: 4,
      image: Mentor1,
      name: "Peter Smith",
      role: "Pastor",
      menteeCount: 6,
    },
  ];

  // Get current data based on active tab
  const currentData = activeTab === "mentors" ? mentorsData : pastorsData;
  return (
    <div className="min-h-screen flex flex-col">
      <DirectorHeader showFullHeader={true} />

      {/* Hero Section */}
      <section
        className="relative bg-cover bg-center text-white h-[500px] flex flex-col justify-between px-20 pt-6 pb-10"
        style={{ backgroundImage: `url(${HeroBg.src})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-transparent"></div>

        {/* Top Right - Time and Date */}
        <div className="relative z-10 flex justify-end">
          <div className="text-right">
            <div className="text-5xl font-bold tracking-wide">11 : 59 AM</div>
            <p className="text-lg text-white/90 mt-1">Tuesday, Sep 23</p>
            <p className="text-xl text-white/90 mt-2">Good Morning</p>
          </div>
        </div>

        {/* Bottom - Hero Text */}
        <div className="relative z-10">
          <h1 className="text-5xl font-semibold leading-snug max-w-4xl">
            Cultivate Spiritual, Professional,
            <br />
            Social, And Community–
            <br />
            Engagement Developments
          </h1>
        </div>
      </section>

      {/* Today's Appointments */}
      <section className="py-16 px-20 bg-white">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-[28px] font-semibold text-[#000]">
            Today&apos;s Appointments
          </h2>
          <a
            href="#"
            className="text-[#2E3B8E] text-sm font-medium hover:underline"
          >
            See all
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Duo Appointment */}
          <div className="bg-[#1B5A8E] rounded-2xl p-6 flex gap-5 items-center shadow-lg">
            <div className="bg-white rounded-xl flex items-center justify-center w-[180px] h-[180px] shrink-0">
              <Image
                src={DuoIcon}
                alt="Duo Icon"
                className="w-[80px] h-[80px]"
              />
            </div>

            <div className="flex flex-col w-full text-white">
              <div className="flex items-center gap-3 mb-3">
                <Image
                  src={UserProfile}
                  alt="User"
                  width={40}
                  height={40}
                  className="rounded-full border border-white/40"
                />
                <div>
                  <h4 className="text-white font-semibold text-base">
                    John Ross
                  </h4>
                  <p className="text-white/70 text-sm">Mentor</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                <div className="bg-[#FFFFFF1A] border border-[#FFFFFF33] rounded-md px-3 py-1 text-xs flex items-center gap-2">
                  <i className="fa-regular fa-calendar text-[#FFD700]"></i>
                  <span>Date : 04 Aug 24</span>
                </div>
                <div className="bg-[#FFFFFF1A] border border-[#FFFFFF33] rounded-md px-3 py-1 text-xs flex items-center gap-2">
                  <i className="fa-regular fa-clock text-[#24E0C2]"></i>
                  <span>Time : 11:30 hrs EST</span>
                </div>
              </div>

              <div className="flex justify-between items-end">
                <div>
                  <p className="text-sm text-white/90 mb-2">
                    Mode : <span className="underline">Duo</span>
                  </p>
                  <div className="flex gap-4 text-white text-base">
                    <i className="fa-solid fa-phone cursor-pointer hover:opacity-80"></i>
                    <i className="fa-regular fa-comment cursor-pointer hover:opacity-80"></i>
                    <i className="fa-solid fa-envelope cursor-pointer hover:opacity-80"></i>
                    <i className="fa-brands fa-whatsapp cursor-pointer hover:opacity-80"></i>
                  </div>
                </div>

                <button className="bg-[#0B1C58] hover:bg-[#122D80] transition px-6 py-2 rounded-md text-sm font-medium">
                  Details
                </button>
              </div>
            </div>
          </div>

          {/* Google Meet Appointment */}
          <div className="bg-[#1B5A8E] rounded-2xl p-6 flex gap-5 items-center shadow-lg">
            <div className="bg-white rounded-xl flex items-center justify-center w-[180px] h-[180px] shrink-0">
              <Image
                src={MeetIcon}
                alt="Meet Icon"
                className="w-[80px] h-[80px]"
              />
            </div>

            <div className="flex flex-col w-full text-white">
              <div className="flex items-center gap-3 mb-3">
                <Image
                  src={UserProfile}
                  alt="User"
                  width={40}
                  height={40}
                  className="rounded-full border border-white/40"
                />
                <div>
                  <h4 className="text-white font-semibold text-base">
                    John Ross
                  </h4>
                  <p className="text-white/70 text-sm">Field Mentor</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                <div className="bg-[#FFFFFF1A] border border-[#FFFFFF33] rounded-md px-3 py-1 text-xs flex items-center gap-2">
                  <i className="fa-regular fa-calendar text-[#FFD700]"></i>
                  <span>Date : 04 Aug 24</span>
                </div>
                <div className="bg-[#FFFFFF1A] border border-[#FFFFFF33] rounded-md px-3 py-1 text-xs flex items-center gap-2">
                  <i className="fa-regular fa-clock text-[#24E0C2]"></i>
                  <span>Time : 11:30 hrs EST</span>
                </div>
              </div>

              <div className="flex justify-between items-end">
                <div>
                  <p className="text-sm text-white/90 mb-2">
                    Mode : <span className="underline">Google Meet</span>
                  </p>
                  <div className="flex gap-4 text-white text-base">
                    <i className="fa-solid fa-phone cursor-pointer hover:opacity-80"></i>
                    <i className="fa-regular fa-comment cursor-pointer hover:opacity-80"></i>
                    <i className="fa-solid fa-envelope cursor-pointer hover:opacity-80"></i>
                    <i className="fa-brands fa-whatsapp cursor-pointer hover:opacity-80"></i>
                  </div>
                </div>

                <button className="bg-[#0B1C58] hover:bg-[#122D80] transition px-6 py-2 rounded-md text-sm font-medium">
                  Details
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* New Interests Section */}
      <section className="py-16 px-20 bg-[#2876AC]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Left side - Description */}
          <div className="text-white">
            <h2 className="text-[32px] font-semibold mb-4">New Interests</h2>
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
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-white rounded-xl p-5 flex justify-between items-center shadow-md"
              >
                <div className="flex items-center gap-4">
                  <div className="w-[50px] h-[50px] bg-[#2E3B8E] rounded-full flex items-center justify-center">
                    <i className="fa-solid fa-user text-white text-xl"></i>
                  </div>
                  <div>
                    <h4 className="text-[#000] font-semibold text-base">
                      Robert Fox
                    </h4>
                    <p className="text-gray-500 text-sm">Pastor</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button className="hover:opacity-80">
                    <i className="fa-solid fa-envelope text-[#2E3B8E] text-lg"></i>
                  </button>
                  <button className="hover:opacity-80">
                    <i className="fa-regular fa-comment text-[#2E3B8E] text-lg"></i>
                  </button>
                  <button className="hover:opacity-80">
                    <i className="fa-solid fa-phone text-[#2E3B8E] text-lg"></i>
                  </button>
                  <button className="bg-[#2E3B8E] text-white px-6 py-2 rounded-md font-medium hover:bg-[#1F2A6E] transition">
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Add User Section */}
      <section className="py-16 px-20 bg-[#F0F4F8]">
        <div className="bg-gradient-to-br from-[#2876AC] to-[#2E3B8E] rounded-3xl p-12 max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Left side */}
            <div className="text-white">
              <h2 className="text-[32px] font-bold mb-3">Add User</h2>
              <p className="text-white/90">
                Add new pastors and mentors to the platform
              </p>
            </div>

            {/* Right side - Form */}
            <div className="space-y-4">
              <div>
                <label className="text-white text-sm mb-2 block">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="Enter Name"
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
                  className="w-full px-4 py-3 rounded-md bg-white/10 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
                />
              </div>

              <div>
                <label className="text-white text-sm mb-2 block">Title</label>
                <select className="w-full px-4 py-3 rounded-md bg-white/10 border border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-white/50">
                  <option>Select Title</option>
                  <option>Pastor</option>
                  <option>Mentor</option>
                  <option>Field Mentor</option>
                </select>
              </div>

              <div className="flex justify-end">
                <button className="bg-white text-[#2E3B8E] px-10 py-3 rounded-md font-semibold hover:bg-gray-100 transition mt-2">
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mentors/Pastors Section */}
        <div className="mt-16">
          <div className="flex justify-between items-center mb-8">
            <div className="flex gap-4 bg-[#E8F0F8] p-2 rounded-[20px]">
              <button
                onClick={() => setActiveTab("mentors")}
                className={`px-10 py-3 rounded-[16px] font-semibold text-[16px] transition-all duration-300 ${
                  activeTab === "mentors"
                    ? "bg-[#2E3B8E] text-white shadow-lg"
                    : "bg-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Mentors
              </button>
              <button
                onClick={() => setActiveTab("pastors")}
                className={`px-10 py-3 rounded-[16px] font-semibold text-[16px] transition-all duration-300 ${
                  activeTab === "pastors"
                    ? "bg-[#2E3B8E] text-white shadow-lg"
                    : "bg-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Pastors
              </button>
            </div>
            <a
              href="#"
              className="text-[#2E3B8E] text-[15px] font-semibold hover:underline"
            >
              See all
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
            {currentData.map((person) => (
              <MentorCard
                key={person.id}
                image={person.image}
                name={person.name}
                role={person.role}
                menteeCount={person.menteeCount}
                onViewDetails={() =>
                  console.log(`View details for ${person.name}`)
                }
              />
            ))}
          </div>
        </div>
      </section>

      {/* Explore CCC */}
      <section className="py-16 px-20 bg-white">
        <h2 className="text-[32px] font-bold text-[#000] mb-10">Explore CCC</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
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
      <section className="py-16 px-20 bg-[#D8E8F5]">
        <h2 className="text-[28px] font-semibold text-[#000] mb-8">
          Over View
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
          {[
            { label: "Total Mentors", value: "501" },
            { label: "Total Pastors", value: "501" },
            { label: "Pastors Completed", value: "501" },
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-xl p-8 shadow-sm">
              <p className="text-gray-600 text-sm mb-2">{stat.label}</p>
              <h3 className="text-4xl font-bold text-[#2E3B8E]">
                {stat.value}
              </h3>
            </div>
          ))}
        </div>

        {/* Overall Progress */}
        <h2 className="text-[28px] font-semibold text-[#000] mb-8">
          Overall Progress
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
              <div className="relative">
                {/* Placeholder for donut chart */}
                <div className="w-[240px] h-[240px] rounded-full border-[40px] border-[#2E3B8E] border-r-[#F9C74F] border-b-[#F9C74F]"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-[#2E3B8E]">
                      100%
                    </div>
                  </div>
                </div>
                <div className="absolute -left-20 top-1/2 transform -translate-y-1/2 bg-[#2E3B8E] text-white px-4 py-2 rounded-md font-semibold">
                  37.5%
                </div>
                <div className="absolute -right-20 top-1/2 transform -translate-y-1/2 bg-[#2E3B8E] text-white px-4 py-2 rounded-md font-semibold">
                  62.5%
                </div>
              </div>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="bg-white rounded-xl p-8 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-[#000]">
                Roadmap & Assessments
              </h3>
              <div className="flex items-center gap-4">
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

            <div className="h-[280px] flex items-end justify-between gap-4">
              {["Jan", "Feb", "Mar", "Apr", "May", "Jun"].map((month, i) => (
                <div
                  key={i}
                  className="flex-1 flex flex-col items-center gap-2"
                >
                  <div className="w-full flex gap-1 items-end h-[220px]">
                    <div
                      className="flex-1 bg-[#5B7FDB] rounded-t-md"
                      style={{ height: `${Math.random() * 80 + 20}%` }}
                    ></div>
                    <div
                      className="flex-1 bg-[#4AC5D9] rounded-t-md"
                      style={{ height: `${Math.random() * 80 + 20}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-600">{month}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Course Completed & Invite */}
      <section className="py-16 px-20 bg-white">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-r from-[#2E3B8E] to-[#4A5FB8] rounded-xl p-8 flex justify-between items-center text-white">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <i className="fa-solid fa-award text-2xl"></i>
              </div>
              <h3 className="text-xl font-semibold">Course Completed</h3>
              <div className="w-7 h-7 bg-[#FFD700] text-[#2E3B8E] rounded-full flex items-center justify-center text-sm font-bold">
                3
              </div>
            </div>
            <button className="hover:opacity-80">
              <i className="fa-solid fa-arrow-up-right-from-square text-xl"></i>
            </button>
          </div>

          <div className="bg-gradient-to-r from-[#2876AC] to-[#3A8EC4] rounded-xl p-8 flex justify-between items-center text-white">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <i className="fa-solid fa-user-plus text-2xl"></i>
              </div>
              <h3 className="text-xl font-semibold">
                Invite to be a Field Mentor
              </h3>
            </div>
            <button className="hover:opacity-80">
              <i className="fa-solid fa-arrow-up-right-from-square text-xl"></i>
            </button>
          </div>
        </div>
      </section>

      <DirectorFooter />
    </div>
  );
}
