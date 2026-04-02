"use client";

import { useState, useEffect } from "react";
import { apiGetAssignedUsers, apiGetMentorByEmail, apiCreateAppointment } from "@/app/Services/api";
import { getCookie } from "@/app/utils/cookies";
import Image from "next/image";
import PastorHeader from "@/app/Components/PastorHeader";
import PastorFooter from "@/app/Components/PastorFooter";
import MentorBg from "@/app/Assets/mentor-bg.png";
import Mentor1 from "@/app/Assets/mentor1.png";
import Mentor2 from "@/app/Assets/mentor2.png";
import Mentor3 from "@/app/Assets/mentor3.png";
import "@fortawesome/fontawesome-free/css/all.min.css";

type Mentor = {
  _id: string;
  firstName: string;
  lastName: string;
  role: string;
  email: string;
  profileInfo?: string;
};

const mentorImages = [Mentor1, Mentor2, Mentor3];

/* ----------------------------------------------------
    SCHEDULER COMPONENT
-----------------------------------------------------*/
function Scheduler({ mentorId }: { mentorId: string }) {
  const [selectedDay, setSelectedDay] = useState<number | null>(14);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [platform, setPlatform] = useState("zoom");
  const [notes, setNotes] = useState("");

  const userId = "691da9a53a4a17f447471109";

  const timeSlots = [
    "09:00 am - 10:00 am",
    "11:00 am - 12:00 pm",
    "01:00 pm - 02:00 pm",
    "02:00 pm - 04:00 pm",
    "05:00 pm - 06:00 pm",
  ];

  const buildISODate = () => {
    if (!selectedDay || !selectedSlot) return null;

    const [start] = selectedSlot.split(" - ");
    const [time, period] = start.split(" ");

    let [hours, minutes] = time.split(":");
    let h = parseInt(hours);

    if (period.toLowerCase() === "pm" && h !== 12) h += 12;

    const date = new Date(2024, 7, selectedDay, h, parseInt(minutes));
    return date.toISOString();
  };

  const createAppointment = async () => {
    const meetingDate = buildISODate();
    if (!meetingDate) {
      alert("Please select date and time");
      return;
    }

    try {
      const payload = {
        userId,
        mentorId,
        meetingDate,
        platform,
        meetingLink: platform === "zoom" ? "https://zoom.us/j/123456789" : "",
        notes,
      };

      const response = await apiCreateAppointment(payload);
      const json = response.data;

      if (json.success) {
        alert("Appointment Successfully Scheduled!");
      } else {
        alert(json.message);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to create appointment");
    }
  };

  return (
    <div className="mt-6">
      <p className="text-sm font-medium flex items-center gap-2 text-[#d9ebf8]">
        <i className="fa-regular fa-calendar text-[#8ec5eb]"></i>
        Schedule a Meeting
      </p>

      <div className="border border-white/20 rounded-xl p-5 mt-3 bg-[linear-gradient(180deg,rgba(12,58,95,0.9)_0%,rgba(10,53,88,0.95)_100%)] shadow-sm">
        {/* CALENDAR */}
        <p className="text-xs text-[#cde2f2] mb-2">Select Available Date</p>

        <div className="bg-[#103C8C] text-white rounded-lg overflow-hidden shadow">
          <div className="flex justify-between items-center px-4 py-3 bg-[#0D3170]">
            <i className="fa-solid fa-chevron-left text-sm"></i>
            <p className="text-sm font-medium">August 2024</p>
            <i className="fa-solid fa-chevron-right text-sm"></i>
          </div>

          <div className="grid grid-cols-7 text-center text-xs py-2 font-medium border-b border-white/20">
            {["S", "M", "T", "W", "T", "F", "S"].map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>

          <div className="grid grid-cols-7 p-2 gap-1">
            {[...Array(31)].map((_, i) => {
              const day = i + 1;
              const isSelected = day === selectedDay;

              return (
                <span
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`cursor-pointer w-8 h-8 flex items-center justify-center mx-auto rounded-full transition ${
                    isSelected
                      ? "bg-white text-[#103C8C] font-semibold"
                      : "text-white/90 hover:bg-white/20 hover:scale-110"
                  }`}
                >
                  {day}
                </span>
              );
            })}
          </div>
        </div>

        {/* TIME SLOTS */}
        <p className="text-xs text-[#cde2f2] mt-4 mb-2">Select a Time</p>

        <div className="grid grid-cols-2 gap-3">
          {timeSlots.map((slot) => (
            <button
              key={slot}
              onClick={() => setSelectedSlot(slot)}
              className={`border text-xs py-2 rounded-md transition ${
                selectedSlot === slot
                  ? "bg-[#103C8C] text-white border-[#103C8C]"
                  : "border-white/40 text-white hover:bg-white/15 hover:text-white"
              }`}
            >
              {slot}
            </button>
          ))}
        </div>

        {/* PLATFORM */}
        <p className="text-xs text-[#cde2f2] mt-4 mb-2">
          Preferred Meeting Option
        </p>
        <select
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          className="w-full border border-white/25 rounded-md px-3 py-2 text-sm bg-white/10 text-white"
        >
          <option value="zoom">Zoom Meeting</option>
          <option value="google">Google Meet</option>
          <option value="phone">Phone Call</option>
          <option value="in-person">In-Person Meeting</option>
        </select>

        {/* NOTES */}
        <p className="text-xs text-[#cde2f2] mt-4 mb-1">Notes</p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full border border-white/25 bg-white/10 text-white rounded-md p-2 text-sm"
          rows={3}
          placeholder="Add a note..."
        />

        {/* BUTTONS */}
        <div className="flex justify-between mt-6">
          <button className="px-4 py-2 rounded-md border border-white/35 text-[#cde2f2] hover:bg-white/10 text-sm">
            Cancel
          </button>

          <button
            onClick={createAppointment}
            className="px-5 py-2 rounded-md bg-[#103C8C] text-white text-sm hover:bg-[#0B2E72]"
          >
            Schedule
          </button>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------------------------------
    MAIN PAGE COMPONENT
-----------------------------------------------------*/
export default function Mymentors() {
  const [isListView, setIsListView] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState<any | null>(null);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [filteredMentors, setFilteredMentors] = useState<Mentor[]>([]);
  const [searchText, setSearchText] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 1800);
  };

  /* FETCH ASSIGNED MENTORS */
  useEffect(() => {
    const fetchMentors = async () => {
      try {
        const user = JSON.parse(getCookie("user") || "{}");
        const userId = user?.id || user?._id;
        if (!userId) {
          showToast("User session not found. Please log in again.");
          return;
        }

        const response = await apiGetAssignedUsers(userId);
        const assigned = (response.data?.data || []).map((mentor: any) => ({
          _id: mentor._id || mentor.id || "",
          firstName: mentor.firstName || "",
          lastName: mentor.lastName || "",
          role: mentor.role || "Mentor",
          email: mentor.email || "",
          profileInfo: mentor.profileInfo || "",
        }));
        setMentors(assigned);
        setFilteredMentors(assigned);
      } catch (err) {
        console.error("Error fetching assigned mentors:", err);
        setMentors([]);
        setFilteredMentors([]);
        showToast("Unable to fetch mentors from API.");
      }
    };

    fetchMentors();
  }, []);

  /* FETCH SINGLE MENTOR */
  const fetchSingleMentor = async (email: string) => {
    showToast("Opening mentor details...");
    try {
      const response = await apiGetMentorByEmail(email);
      const json = response.data;

      if (json.success) {
        setSelectedMentor(json.data);
      }
    } catch (err) {
      console.error("Error fetching mentor details:", err);
    }
  };

  /* SEARCH FILTER */
  useEffect(() => {
    if (!searchText) {
      setFilteredMentors(mentors);
    } else {
      const lower = searchText.toLowerCase();
      setFilteredMentors(
        mentors.filter(
          (m) =>
            m.firstName.toLowerCase().includes(lower) ||
            m.lastName.toLowerCase().includes(lower) ||
            m.role.toLowerCase().includes(lower)
        )
      );
    }
  }, [searchText, mentors]);

  return (
    <div className="min-h-screen flex flex-col relative bg-[#062946] text-white font-[Albert_Sans]">
      <PastorHeader showFullHeader={true} />

      {/* HERO */}
      <section
        className="relative bg-cover bg-center text-white h-[260px] md:h-[320px] flex items-end pb-12 px-6 md:px-16"
        style={{ backgroundImage: `url(${MentorBg.src})` }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_10%,rgba(141,211,243,0.22),transparent_36%),radial-gradient(circle_at_82%_22%,rgba(245,204,118,0.12),transparent_38%),linear-gradient(180deg,rgba(4,31,53,0.82)_0%,rgba(6,41,70,0.9)_100%)]"></div>
        <div className="relative z-10">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-[#d9ebf8]">
            <span className="h-2 w-2 rounded-full bg-[#8ec5eb]" />
            Leadership Support Network
          </p>
          <h1 className="mt-3 text-3xl font-semibold md:text-4xl">My Mentors</h1>
          <p className="mt-2 max-w-xl text-sm text-[#d9ebf8] md:text-base">
            Connect, learn, and schedule personalized sessions with your assigned mentors.
          </p>
        </div>
      </section>

      {/* CONTENT */}
      <main className="flex-1 bg-[radial-gradient(circle_at_18%_8%,rgba(141,211,243,0.24),transparent_34%),radial-gradient(circle_at_82%_22%,rgba(245,204,118,0.18),transparent_35%),linear-gradient(180deg,#041f35_0%,#062946_100%)] px-6 md:px-16 py-10 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* SEARCH */}
          <div className="rounded-2xl border border-white/15 bg-white/5 p-4 mb-6 backdrop-blur">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center bg-white/10 border border-white/20 rounded-lg px-4 py-2 shadow w-full max-w-md">
              <i className="fa-solid fa-magnifying-glass text-[#cde2f2] mr-3"></i>
              <input
                value={searchText}
                onChange={(e) =>
                  setFilteredMentors(
                    mentors.filter((x) =>
                      (
                        x.firstName +
                        x.lastName +
                        x.role
                      )
                        .toLowerCase()
                        .includes(e.target.value.toLowerCase())
                    )
                  )
                }
                placeholder="Search"
                className="flex-1 text-sm outline-none bg-transparent text-white placeholder:text-[#cde2f2]"
              />
            </div>

            {/* TOGGLE BUTTON */}
            <button
              onClick={() => setIsListView(!isListView)}
              className="w-10 h-10 bg-white/10 border border-white/20 rounded-lg shadow flex items-center justify-center hover:bg-white/20 transition"
            >
              <i
                className={`${
                  isListView
                    ? "fa-solid fa-border-all text-[#8ec5eb]"
                    : "fa-solid fa-list text-[#8ec5eb]"
                } text-lg`}
              ></i>
            </button>
          </div>
          </div>

          {/* AVATAR ROW */}
          <div className="flex items-center gap-6 overflow-x-auto pb-6">
            {filteredMentors.map((mentor, i) => {
              const img = mentorImages[i % mentorImages.length];

              return (
                <div
                  key={mentor._id}
                  className="flex flex-col items-center shrink-0"
                >
                  <div className="w-[72px] h-[72px] p-[2px] rounded-full bg-[linear-gradient(145deg,#8ec5eb,#9c7cff)]">
                    <Image
                      src={img}
                      alt={mentor.firstName}
                      className="rounded-full w-full h-full object-cover border border-[#062946]"
                    />
                  </div>
                  <p className="text-xs text-white mt-2 whitespace-nowrap">
                    {mentor.firstName}
                  </p>
                </div>
              );
            })}
          </div>

          {/* CURRENT MENTORS */}
          <h2 className="text-xl text-white font-semibold mb-4">
            Current Mentors
          </h2>

          <div
            className={`${
              isListView
                ? "flex flex-col gap-4"
                : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            }`}
          >
            {filteredMentors.map((mentor, i) => {
              const img = mentorImages[i % mentorImages.length];

              return isListView ? (
                /* -----------------------------------------
                    LIST VIEW CARD
                ------------------------------------------- */
                <div
                  key={mentor._id}
                  onClick={() => fetchSingleMentor(mentor.email)}
                  className="cursor-pointer bg-[linear-gradient(180deg,rgba(12,58,95,0.9)_0%,rgba(10,53,88,0.95)_100%)] border border-white/15 rounded-xl p-4 shadow flex items-center gap-4 hover:shadow-lg hover:border-[#8ec5eb66] transition"
                >
                  <Image
                    src={img}
                    alt=""
                    className="w-[65px] h-[65px] rounded-lg object-cover"
                  />

                  <div className="flex-1">
                    <h4 className="font-semibold text-white">
                      {mentor.firstName} {mentor.lastName}
                    </h4>
                    <p className="text-sm text-[#b7d2e6]">{mentor.role}</p>
                    <p className="text-xs text-[#cde2f2] mt-1">
                      Sub text area write something here.
                    </p>
                  </div>

                  <div className="flex gap-4 text-[#8ec5eb] text-sm">
                    <i className="fa-regular fa-envelope"></i>
                    <i className="fa-regular fa-comment"></i>
                    <i className="fa-solid fa-phone"></i>
                    <i className="fa-brands fa-whatsapp"></i>

                    <button className="w-7 h-7 border border-white/35 rounded flex items-center justify-center hover:bg-white/15 hover:text-white">
                      <i className="fa-solid fa-arrow-up-right-from-square text-xs"></i>
                    </button>
                  </div>
                </div>
              ) : (
                /* -----------------------------------------
                    GRID VIEW CARD (YOUR ORIGINAL UI)
                ------------------------------------------- */
                <div
                  key={mentor._id}
                  onClick={() => fetchSingleMentor(mentor.email)}
                  className="cursor-pointer bg-[linear-gradient(180deg,rgba(12,58,95,0.9)_0%,rgba(10,53,88,0.95)_100%)] border border-white/15 rounded-xl shadow hover:shadow-lg hover:-translate-y-0.5 hover:border-[#8ec5eb66] transition-all duration-300 flex flex-col"
                >
                  <div className="w-full h-[170px] overflow-hidden rounded-t-xl">
                    <Image
                      src={img}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="p-4 flex flex-col justify-between min-h-[160px]">
                    <h4 className="font-semibold text-white">
                      {mentor.firstName} {mentor.lastName}
                    </h4>

                    <p className="text-sm text-[#b7d2e6]">{mentor.role}</p>

                    <p className="text-xs text-[#cde2f2] mt-2">
                      Sub text area write something here.
                      <br />
                      That you can read more
                    </p>

                    <div className="flex justify-between items-center mt-4">
                      <div className="flex gap-4 text-[#8ec5eb] text-sm">
                        <i className="fa-regular fa-envelope"></i>
                        <i className="fa-regular fa-comment"></i>
                        <i className="fa-solid fa-phone"></i>
                        <i className="fa-brands fa-whatsapp"></i>
                      </div>

                      <button className="w-8 h-8 border border-white/35 rounded flex items-center justify-center hover:bg-white/15 hover:text-white transition">
                        <i className="fa-solid fa-arrow-up-right-from-square text-xs"></i>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* SIDEBAR */}
      {selectedMentor && (
        <div className="fixed top-0 right-0 w-full md:w-[420px] h-full bg-[linear-gradient(180deg,#0a3558_0%,#0d3d63_100%)] border-l border-white/20 shadow-xl z-50 overflow-y-auto text-white">
          <div className="flex justify-between items-center p-4 border-b border-white/20">
            <h3 className="text-lg font-semibold text-white">
              Mentor Profile
            </h3>
            <button
              onClick={() => setSelectedMentor(null)}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/15"
            >
              <i className="fa-solid fa-xmark text-white/80"></i>
            </button>
          </div>

          <div className="p-5">
            <div className="flex flex-col items-center gap-4 mb-6">
              <Image
                src={Mentor1}
                alt="profile"
                width={120}
                height={120}
                className="rounded-lg"
              />

              <div className="text-center">
                <h4 className="text-xl font-semibold text-white">
                  {selectedMentor.firstName} {selectedMentor.lastName}
                </h4>
                <p className="text-[#cde2f2] capitalize">
                  {selectedMentor.role}
                </p>
              </div>
            </div>

            {/* PROFILE INFO */}
            <p className="text-sm font-medium text-[#d9ebf8] mb-2">
              Profile Information
            </p>

            <textarea
              className="w-full border border-white/25 bg-white/10 rounded-md p-3 text-sm text-white"
              rows={4}
              value={selectedMentor.profileInfo || ""}
              readOnly
            />

            {/* SCHEDULER */}
            <Scheduler mentorId={selectedMentor._id} />
          </div>
        </div>
      )}
      {toastMessage && (
        <div className="fixed left-1/2 top-20 z-[70] -translate-x-1/2 rounded-lg border border-white/20 bg-[#0a3558] px-4 py-3 text-sm text-white shadow-[0_12px_28px_rgba(2,20,38,0.45)]">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
