"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  apiGetAssignedUsers,
  apiGetMentorByEmail,
  apiGetUserById,
  apiCreateAppointment,
} from "@/app/Services/api";
import { getPastorUserId } from "@/app/utils/pastor-auth";
import PastorScheduleDrawer from "@/app/Components/pastor/PastorScheduleDrawer";
import Image from "next/image";
import PastorHeader from "@/app/Components/PastorHeader";
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
   profilePicture?: string;
   phone?: string;
phoneNumber?: string;
city?: string;
state?: string;
country?: string;
churchName?: string;
};

const mentorImages = [Mentor1, Mentor2, Mentor3];
function getMentorImage(mentor: Mentor, fallback: any) {
  return mentor.profilePicture && mentor.profilePicture.trim()
    ? mentor.profilePicture
    : fallback;
}

/** Backend may return a raw array, { data: [] }, { data: { users } }, or rows with nested `mentor`. */
function extractAssignedMentorsPayload(body: unknown): unknown[] {
  if (Array.isArray(body)) return body;
  if (!body || typeof body !== "object") return [];
  const o = body as Record<string, unknown>;
  if (Array.isArray(o.data)) return o.data;
  if (o.data && typeof o.data === "object") {
    const d = o.data as Record<string, unknown>;
    if (Array.isArray(d.users)) return d.users;
    if (Array.isArray(d.mentors)) return d.mentors;
    if (Array.isArray(d.items)) return d.items;
  }
  if (Array.isArray(o.users)) return o.users;
  if (Array.isArray(o.mentors)) return o.mentors;
  return [];
}

function mapRowToMentor(row: unknown): Mentor | null {
  if (!row || typeof row !== "object") return null;
  const r = row as Record<string, unknown>;
  const u =
    r.mentor && typeof r.mentor === "object" && !Array.isArray(r.mentor)
      ? (r.mentor as Record<string, unknown>)
      : r;
  const id = String(u._id ?? u.id ?? "").trim();
  if (!id) return null;
  const interest = u.interest as Record<string, unknown> | undefined;
  const bio =
    (typeof u.bio === "string" && u.bio) ||
    (typeof u.profileInfo === "string" && u.profileInfo) ||
    (interest && typeof interest.comments === "string" ? interest.comments : "") ||
    "";
  return {
    _id: id,
    firstName: String(u.firstName ?? ""),
    lastName: String(u.lastName ?? ""),
    role: String(u.role ?? "Mentor"),
    email: String(u.email ?? "").trim(),
    profileInfo: bio,
    phone: String(u.phone ?? u.mobile ?? u.mobileNumber ?? u.contactNumber ?? ""),
phoneNumber: String(u.phoneNumber ?? ""),
     profilePicture: String(u.profilePicture ?? u.avatar ?? u.image ?? ""),
  };
}



function normalizeMentorDetail(raw: Record<string, unknown>, fallback: Mentor): Mentor {
  const id = String(raw._id ?? raw.id ?? fallback._id);

  const interest = raw.interest as Record<string, unknown> | undefined;
  const churchDetailsList = Array.isArray(interest?.churchDetails)
  ? (interest.churchDetails as Record<string, unknown>[])
  : [];

const primaryChurch = churchDetailsList[0];
  const contact = raw.contact as Record<string, unknown> | undefined;
  const church = raw.church as Record<string, unknown> | undefined;
  const churchDetails = raw.churchDetails as Record<string, unknown> | undefined;
  const address = raw.address as Record<string, unknown> | undefined;

  const profileInfo =
    (typeof raw.bio === "string" && raw.bio) ||
    (typeof raw.profileInfo === "string" && raw.profileInfo) ||
    (interest && typeof interest.comments === "string" ? interest.comments : "") ||
    fallback.profileInfo ||
    "";

  return {
    _id: id,
    firstName: String(raw.firstName ?? fallback.firstName),
    lastName: String(raw.lastName ?? fallback.lastName),
    role: String(raw.role ?? fallback.role),
    email: String(raw.email ?? contact?.email ?? fallback.email),
    profileInfo,
    profilePicture: String(
      raw.profilePicture ?? raw.avatar ?? raw.image ?? fallback.profilePicture ?? "",
    ),
    phone: String(
      raw.phone ??
        raw.mobile ??
        raw.mobileNumber ??
        raw.contactNumber ??
        contact?.phone ??
        contact?.mobile ??
        fallback.phone ??
        "",
    ),
   phoneNumber: String(
  raw.phoneNumber ??
    interest?.phoneNumber ??
    raw.mobileNumber ??
    raw.contactNumber ??
    contact?.phoneNumber ??
    contact?.mobileNumber ??
    fallback.phoneNumber ??
    "",
),

churchName: String(
  raw.churchName ??
    primaryChurch?.churchName ??
    church?.name ??
    churchDetails?.churchName ??
    churchDetails?.name ??
    fallback.churchName ??
    "",
),

city: String(
  raw.city ??
    primaryChurch?.city ??
    address?.city ??
    churchDetails?.city ??
    fallback.city ??
    "",
),

state: String(
  raw.state ??
    primaryChurch?.state ??
    address?.state ??
    churchDetails?.state ??
    fallback.state ??
    "",
),

country: String(
  raw.country ??
    primaryChurch?.country ??
    address?.country ??
    churchDetails?.country ??
    fallback.country ??
    "",
),
  };
}

/* ----------------------------------------------------
    SCHEDULER COMPONENT
-----------------------------------------------------*/
function Scheduler({
  mentorId,
  pastorUserId,
}: {
  mentorId: string;
  pastorUserId: string;
}) {
  const [selectedDay, setSelectedDay] = useState<number | null>(14);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [platform, setPlatform] = useState("zoom");
  const [notes, setNotes] = useState("");

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
        userId: pastorUserId,
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
function NoImageBox({
  className = "",
  firstName = "",
  lastName = "",
}: {
  className?: string;
  firstName?: string;
  lastName?: string;
}) {
  const firstInitial = firstName.trim().charAt(0);
  const lastInitial = lastName.trim().charAt(0);
  const initials = `${firstInitial}${lastInitial}`.toUpperCase() || "M";

  return (
    <div
      className={`flex items-center justify-center bg-[linear-gradient(145deg,#17496d,#0b2f4d)] text-lg font-bold uppercase text-white ${className}`}
    >
      {initials}
    </div>
  );
}

/* ----------------------------------------------------
    MAIN PAGE COMPONENT
-----------------------------------------------------*/
export default function Mymentors() {
  const [isListView, setIsListView] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [filteredMentors, setFilteredMentors] = useState<Mentor[]>([]);
  const [searchText, setSearchText] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [pastorUserId, setPastorUserId] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
const menuRef = useRef<HTMLDivElement | null>(null);
  const [scheduleDrawerOpen, setScheduleDrawerOpen] = useState(false);
const [mentorToSchedule, setMentorToSchedule] = useState<Mentor | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 1800);
  };

  useEffect(() => {
    setPastorUserId(getPastorUserId() || "");
  }, []);

  const loadAssignedMentors = useCallback(async () => {
    try {
      const uid = getPastorUserId();
      if (!uid) {
        showToast("User session not found. Please log in again.");
        return;
      }

      const response = await apiGetAssignedUsers(uid);
      const list = extractAssignedMentorsPayload(response.data);
      const assigned = list
        .map((row) => mapRowToMentor(row))
        .filter((m): m is Mentor => m != null);

      setMentors(assigned);
      setFilteredMentors(assigned);
    } catch (err) {
      console.error("Error fetching assigned mentors:", err);
      setMentors([]);
      setFilteredMentors([]);
      showToast("Unable to fetch mentors from API.");
    }
  }, []);

  /* FETCH ASSIGNED MENTORS */
  useEffect(() => {
    void loadAssignedMentors();
  }, [loadAssignedMentors]);

  /* Refetch when returning to this tab (e.g. after director assigns a mentor). */
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") void loadAssignedMentors();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [loadAssignedMentors]);

  /** Prefer GET /users/:id (works for newly assigned mentors); fall back to /home/mentor/:email; then list row. */
  const fetchMentorDetail = async (m: Mentor) => {
    try {
    
      const res = await apiGetUserById(m._id);
const raw = res.data?.data;

console.log("MENTOR DETAIL RAW:", raw);

if (raw && typeof raw === "object" && ("_id" in raw || "id" in raw)) {
  setSelectedMentor(normalizeMentorDetail(Object(raw) as Record<string, unknown>, m));
  return;
}
    } catch {
      /* try email route */
    }

    if (m.email) {
      try {
        const response = await apiGetMentorByEmail(m.email);
        const json = response.data;
        if (json.success && json.data) {
          const d = json.data as unknown as Record<string, unknown>;
          setSelectedMentor(normalizeMentorDetail(d, m));
          return;
        }
      } catch (err) {
        console.error("Error fetching mentor by email:", err);
      }
    }

    setSelectedMentor(m);
  };

  /* SEARCH FILTER — single source of truth: searchText */
  useEffect(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) {
      setFilteredMentors(mentors);
      return;
    }
    setFilteredMentors(
      mentors.filter((m) => {
        const first = (m.firstName || "").toLowerCase();
        const last = (m.lastName || "").toLowerCase();
        const role = (m.role || "").toLowerCase();
        const email = (m.email || "").toLowerCase();
        return (
          first.includes(q) ||
          last.includes(q) ||
          `${first} ${last}`.trim().includes(q) ||
          role.includes(q) ||
          email.includes(q)
        );
      }),
    );
  }, [searchText, mentors]);
useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    if (
      menuRef.current &&
      !menuRef.current.contains(event.target as Node)
    ) {
      setOpenMenuId(null);
    }
  };

  document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
}, []);
  return (
    <div className="min-h-screen flex flex-col relative bg-[#062946] text-white font-[Albert_Sans]">
      <PastorHeader showFullHeader={true} />

      {/* HERO */}
      <section
        className="relative bg-cover bg-center text-white h-[260px] md:h-[320px] flex items-end pb-12 px-6 md:px-16"
        style={{ backgroundImage: `url(${MentorBg.src})` }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_10%,rgba(141,211,243,0.22),transparent_36%),radial-gradient(circle_at_82%_22%,rgba(245,204,118,0.12),transparent_38%),linear-gradient(180deg,rgba(4,31,53,0.82)_0%,rgba(6,41,70,0.9)_100%)]"></div>
        <div className="relative z-10 flex h-full max-w-3xl flex-col justify-center text-left">
   
          <h1 className="text-3xl font-semibold md:text-5xl">My Mentors</h1>
          <p className="mt-4 max-w-2xl text-sm text-[#d9ebf8] md:text-lg">
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
                type="search"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search by name, role, or email…"
                className="flex-1 text-sm outline-none bg-transparent text-white placeholder:text-[#cde2f2]"
                autoComplete="off"
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

              const img = getMentorImage(mentor, mentorImages[i % mentorImages.length]);

              return (
                // <div
                //   key={mentor._id}
                //   className="flex flex-col items-center shrink-0"
                // >
                <button
  key={mentor._id}
  type="button"
  onClick={() => void fetchMentorDetail(mentor)}
  className="flex shrink-0 flex-col items-center"
>
             <div className="w-[72px] h-[72px] p-[2px] rounded-full bg-[linear-gradient(145deg,#8ec5eb,#9c7cff)]">
  {mentor.profilePicture?.trim() ? (
    <Image
      src={mentor.profilePicture}
      alt={mentor.firstName}
      unoptimized
      width={72}
      height={72}
      className="h-full w-full rounded-full border border-[#062946] object-cover"
    />
  ) : (
    <NoImageBox
      firstName={mentor.firstName}
      lastName={mentor.lastName}
      className="h-full w-full rounded-full border border-[#062946]"
    />
  )}
</div>

<p className="text-xs text-white mt-2 whitespace-nowrap">
  {mentor.firstName}
</p>
                </button>
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
              
              const img = getMentorImage(mentor, mentorImages[i % mentorImages.length]);
const phone = mentor.phoneNumber || mentor.phone;
const whatsappPhone = phone?.replace(/[^\d+]/g, "");
              return isListView ? (
                /* -----------------------------------------
                    LIST VIEW CARD
                ------------------------------------------- */
                <div
                  key={mentor._id}
                  onClick={() => void fetchMentorDetail(mentor)}
                  className="cursor-pointer bg-[linear-gradient(180deg,rgba(12,58,95,0.9)_0%,rgba(10,53,88,0.95)_100%)] border border-white/15 rounded-xl p-4 shadow flex items-center gap-4 hover:shadow-lg hover:border-[#8ec5eb66] transition"
                >
                 {/* <Image
  src={img}
  alt=""
  unoptimized={typeof img === "string"}
  width={65}
  height={65}
  className="w-[65px] h-[65px] rounded-lg object-cover"
/> */}
{mentor.profilePicture?.trim() ? (
  <Image
    src={mentor.profilePicture}
    alt={`${mentor.firstName} ${mentor.lastName}`}
    unoptimized
    width={65}
    height={65}
    className="w-[65px] h-[65px] rounded-lg object-cover"
  />
) : (
  <NoImageBox
    firstName={mentor.firstName}
    lastName={mentor.lastName}
    className="w-[65px] h-[65px] rounded-lg"
  />
)}
                  <div className="flex-1">
                    <h4 className="font-semibold text-white">
                      {mentor.firstName} {mentor.lastName}
                    </h4>
                    <p className="text-sm text-[#b7d2e6]">{mentor.role}</p>
                    {/* <p className="text-xs text-[#cde2f2] mt-1">
                      Sub text area write something here.
                    </p> */}
                  </div>

                  <div className="flex gap-4 text-[#8ec5eb] text-sm">
                    {/* <i className="fa-regular fa-envelope"></i>
                    <i className="fa-regular fa-comment"></i>
                    <i className="fa-solid fa-phone"></i>
                    <i className="fa-brands fa-whatsapp"></i> */}
                    {mentor.email ? (
  <a href={`mailto:${mentor.email}`} onClick={(e) => e.stopPropagation()}>
    <i className="fa-regular fa-envelope" />
  </a>
) : (
  <i className="fa-regular fa-envelope opacity-40 cursor-not-allowed" />
)}

{phone ? (
  <a href={`sms:${phone}`} onClick={(e) => e.stopPropagation()}>
    <i className="fa-regular fa-comment" />
  </a>
) : (
  <i className="fa-regular fa-comment opacity-40 cursor-not-allowed" />
)}

{phone ? (
  <a href={`tel:${phone}`} onClick={(e) => e.stopPropagation()}>
    <i className="fa-solid fa-phone" />
  </a>
) : (
  <i className="fa-solid fa-phone opacity-40 cursor-not-allowed" />
)}

{whatsappPhone ? (
  <a
    href={`https://wa.me/${whatsappPhone.replace("+", "")}`}
    target="_blank"
    rel="noopener noreferrer"
    onClick={(e) => e.stopPropagation()}
  >
    <i className="fa-brands fa-whatsapp" />
  </a>
) : (
  <i className="fa-brands fa-whatsapp opacity-40 cursor-not-allowed" />
)}

                    {/* <button className="w-7 h-7 border border-white/35 rounded flex items-center justify-center hover:bg-white/15 hover:text-white">
                      <i className="fa-solid fa-arrow-up-right-from-square text-xs"></i>
                    </button> */}
         <button
  type="button"
  onClick={(e) => {
    e.stopPropagation();
    window.location.href = `/pastor/mentor-profile/${encodeURIComponent(mentor._id)}`;
  }}
  className="w-8 h-8 border border-white/35 rounded flex items-center justify-center hover:bg-white/15 hover:text-white transition"
>
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
    onClick={(e) => {
  e.stopPropagation();
  void fetchMentorDetail(mentor);
}}
                  className="relative cursor-pointer bg-[linear-gradient(180deg,rgba(12,58,95,0.9)_0%,rgba(10,53,88,0.95)_100%)] border border-white/15 rounded-xl shadow hover:shadow-lg hover:-translate-y-0.5 hover:border-[#8ec5eb66] transition-all duration-300 flex flex-col"
                >
                 <div ref={menuRef} className="absolute right-3 top-3 z-20">
  <button
    type="button"
    onClick={(e) => {
      e.stopPropagation();
      setOpenMenuId(openMenuId === mentor._id ? null : mentor._id);
    }}
    className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/25 bg-[#062946]/70 text-white transition hover:bg-white/15"
  >
    <i className="fa-solid fa-ellipsis-vertical" />
  </button>

  {openMenuId === mentor._id && (
    <div className="absolute right-0 mt-2 w-44 rounded-xl border border-white/15 bg-[#082f4d] p-2 shadow-xl">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpenMenuId(null);
          setMentorToSchedule(mentor);
setScheduleDrawerOpen(true);
        }}
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-white hover:bg-white/10"
      >
        <i className="fa-regular fa-calendar text-[#8ec5eb]" />
        Schedule Meeting
      </button>
    </div>
  )}
</div>
                <div className="relative w-full h-[170px] overflow-hidden rounded-t-xl">
  {mentor.profilePicture?.trim() ? (
    <Image
      src={mentor.profilePicture}
      alt={`${mentor.firstName} ${mentor.lastName}`}
      unoptimized
      fill
      className="object-cover"
    />
  ) : (
    <NoImageBox
      firstName={mentor.firstName}
      lastName={mentor.lastName}
      className="h-full w-full"
    />
  )}
</div>

                  <div className="p-4 flex flex-col justify-between min-h-[160px]">
                    <h4 className="font-semibold text-white">
                      {mentor.firstName} {mentor.lastName}
                    </h4>

                    <p className="text-sm text-[#b7d2e6]">{mentor.role}</p>

                    {/* <p className="text-xs text-[#cde2f2] mt-2">
                      Sub text area write something here.
                      <br />
                      That you can read more
                    </p> */}

                    <div className="flex justify-between items-center mt-4">
                      {/* <div className="flex gap-4 text-[#8ec5eb] text-sm">
                  
                        <a
  href={mentor.email ? `mailto:${mentor.email}` : undefined}
  onClick={(e) => e.stopPropagation()}
  className="hover:text-white"
>
  <i className="fa-regular fa-envelope"></i>
</a>

<i className="fa-regular fa-comment opacity-40 cursor-not-allowed"></i>
<i className="fa-solid fa-phone opacity-40 cursor-not-allowed"></i>
<i className="fa-brands fa-whatsapp opacity-40 cursor-not-allowed"></i>
                      </div> */}
                      <div className="flex gap-4 text-[#8ec5eb] text-sm">
  {mentor.email ? (
    <a
      href={`mailto:${mentor.email}`}
      onClick={(e) => e.stopPropagation()}
      className="hover:text-white"
      title="Email"
    >
      <i className="fa-regular fa-envelope" />
    </a>
  ) : (
    <i className="fa-regular fa-envelope opacity-40 cursor-not-allowed" />
  )}

  {/* {mentor.email ? (
    <a
      href={`mailto:${mentor.email}?subject=Message to ${mentor.firstName}`}
      onClick={(e) => e.stopPropagation()}
      className="hover:text-white"
      title="Message"
    >
      <i className="fa-regular fa-comment" />
    </a>
  ) : (
    <i className="fa-regular fa-comment opacity-40 cursor-not-allowed" />
  )} */}
  {phone ? (
  <a
    href={`sms:${phone}`}
    onClick={(e) => e.stopPropagation()}
    className="hover:text-white"
    title="Message"
  >
    <i className="fa-regular fa-comment" />
  </a>
) : (
  <i className="fa-regular fa-comment opacity-40 cursor-not-allowed" />
)}

  {phone ? (
    <a
      href={`tel:${phone}`}
      onClick={(e) => e.stopPropagation()}
      className="hover:text-white"
      title="Call"
    >
      <i className="fa-solid fa-phone" />
    </a>
  ) : (
    <i className="fa-solid fa-phone opacity-40 cursor-not-allowed" />
  )}

  {whatsappPhone ? (
    <a
      href={`https://wa.me/${whatsappPhone.replace("+", "")}`}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="hover:text-white"
      title="WhatsApp"
    >
      <i className="fa-brands fa-whatsapp" />
    </a>
  ) : (
    <i className="fa-brands fa-whatsapp opacity-40 cursor-not-allowed" />
  )}
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
          {selectedMentor.profilePicture?.trim() ? (
  <Image
    src={selectedMentor.profilePicture}
    unoptimized
    alt="profile"
    width={120}
    height={120}
    className="h-[120px] w-[120px] rounded-lg object-cover"
  />
) : (
  <NoImageBox
    firstName={selectedMentor.firstName}
    lastName={selectedMentor.lastName}
    className="h-[120px] w-[120px] rounded-lg"
  />
)}

              <div className="text-center">
                <h4 className="text-xl font-semibold text-white">
                  {selectedMentor.firstName} {selectedMentor.lastName}
                </h4>
                <p className="text-[#cde2f2] capitalize">
                  {selectedMentor.role}
                </p>
                <div className="mt-4 w-full space-y-2 rounded-xl border border-white/15 bg-white/5 p-4 text-left text-sm text-[#d9ebf8]">
  <p>
    <span className="font-semibold text-white">Email:</span>{" "}
    {selectedMentor.email || "Not available"}
  </p>

  <p>
    <span className="font-semibold text-white">Phone:</span>{" "}
    {selectedMentor.phoneNumber || selectedMentor.phone || "Not available"}
  </p>

  <p>
    <span className="font-semibold text-white">Church:</span>{" "}
    {selectedMentor.churchName || "Not available"}
  </p>

  <p>
    <span className="font-semibold text-white">Location:</span>{" "}
    {[selectedMentor.city, selectedMentor.state, selectedMentor.country]
      .filter(Boolean)
      .join(", ") || "Not available"}
  </p>
</div>
              </div>
            </div>

            {/* PROFILE INFO */}
            <p className="text-sm font-medium text-[#d9ebf8] mb-2">
              Profile Information
            </p>

            <textarea
              className="w-full border border-white/25 bg-white/10 rounded-md p-3 text-sm text-white"
              rows={3}
              value={selectedMentor.profileInfo || ""}
              readOnly
            />

            {/* SCHEDULER */}
            {/* <Scheduler
              mentorId={selectedMentor._id}
              pastorUserId={pastorUserId}
            /> */}
          </div>
        </div>
      )}
      <PastorScheduleDrawer
  open={scheduleDrawerOpen}
  onClose={() => setScheduleDrawerOpen(false)}
  mentor={mentorToSchedule}
  pastorUserId={pastorUserId}
  onScheduled={() => {
    setScheduleDrawerOpen(false);
    showToast("Appointment scheduled successfully.");
  }}
/>
      {toastMessage && (
        <div className="fixed left-1/2 top-20 z-[70] -translate-x-1/2 rounded-lg border border-white/20 bg-[#0a3558] px-4 py-3 text-sm text-white shadow-[0_12px_28px_rgba(2,20,38,0.45)]">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
