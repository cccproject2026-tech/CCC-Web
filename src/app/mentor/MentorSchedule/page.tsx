"use client";
import { Suspense, useEffect, useLayoutEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import HeroBg from "../../Assets/appointment-bg.png";
import DuoIcon from "../../Assets/duo.png";
import MeetIcon from "../../Assets/meet.png";
import UserProfile from "../../Assets/user-profile.png";
import "@fortawesome/fontawesome-free/css/all.min.css";
import MentorHeader from "@/app/Components/MentorHeader";
import MentorFilterTabGroup from "@/app/Components/mentor/MentorFilterTabGroup";
import {
  mentorBodyText,
  mentorDateInputDark,
  mentorEmptyPanel,
  mentorGlassCardFrost,
  mentorGlassCardRoadmap,
  mentorHeroOverlay,
  mentorMainGradient,
  mentorPageRoot,
  mentorPrimaryCta,
  mentorSecondaryCta,
  mentorFilterPanel,
  mentorSelectDark,
  mentorSpinner,
} from "@/app/Components/mentor/mentor-theme";
import { Appointment } from "@/app/Services/types";
import {
  apiCancelAppointment,
  apiCreateAppointment,
  apiCreateAvailability,
  apiGetMentorAppointments,
  apiGetWeeklyAvailability,
} from "@/app/Services/appointments.service";
import {
  appointmentEntityId,
  extractApiErrorMessage,
  parseSlotStartToIso,
  slotToHHmm,
  uiMeetingModeToPlatform,
  unwrapAppointmentsAxiosData,
} from "@/app/Services/appointment-utils";
import { convertToMinutes, getMentorFromCookie, isOverlapping, timeOptions } from "@/app/Services/utils/helpers";
import { apiGetAssignedUsers } from "@/app/Services/api";

function tabFromQueryParam(raw: string | null): "Appointments" | "Availability" | "Schedule" | null {
  if (!raw) return null;
  const t = raw.trim().toLowerCase();
  if (t === "appointments") return "Appointments";
  if (t === "availability") return "Availability";
  if (t === "schedule") return "Schedule";
  return null;
}

function MentorScheduleContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<
    "Appointments" | "Availability" | "Schedule"
  >(() => tabFromQueryParam(searchParams.get("tab")) ?? "Appointments");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerStep, setDrawerStep] = useState<1 | 2>(1);
  const [showMenu, setShowMenu] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [mentorId, setMentorId] = useState<string | null>(null);
  const [pastors, setPastors] = useState<any[]>([]);
  const [selectedPastor, setSelectedPastor] = useState<any | null>(null);
  const [meetingDate, setMeetingDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState("zoom");
  const [currentDate, setCurrentDate] = useState(new Date());

  const [weekStart, setWeekStart] = useState(new Date());
  const [weeklyAvailability, setWeeklyAvailability] = useState<any>(null);

  const [availability, setAvailability] = useState<any[]>([]);

  const weekDates =
    weeklyAvailability
      ?.slice()
      .sort((a: any, b: any) => a.day - b.day)
      .map((slot: any) => new Date(slot.date)) || [];

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  const daysInMonth = lastDayOfMonth.getDate();
  const startDay = firstDayOfMonth.getDay();

  const calendarDays = [
    ...Array(startDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const appointmentDates = appointments.map((appt) => {
    const d = new Date(appt.meetingDate);

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  });

  useEffect(() => {
    const mentor = getMentorFromCookie();
    const id = mentor?.id ?? mentor?._id;
    if (id) setMentorId(String(id));
  }, []);

  /** Deep-link from mentor home (?tab=appointments|availability|schedule) — sync before paint + on back/forward */
  useLayoutEffect(() => {
    const next = tabFromQueryParam(searchParams.get("tab"));
    if (next) setActiveTab(next);
  }, [searchParams]);

  useEffect(() => {
    if (!mentorId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const fetchAppointments = async () => {
      try {
        const res = await apiGetMentorAppointments(mentorId);
        if (!cancelled) setAppointments(unwrapAppointmentsAxiosData(res));
      } catch (err) {
        console.error("Failed to fetch appointments", err);
        if (!cancelled) setAppointments([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchAppointments();
    return () => {
      cancelled = true;
    };
  }, [mentorId]);

  useEffect(() => {
    if (!mentorId) return;
    const fetchAssignedPastors = async () => {
      try {
        const res = await apiGetAssignedUsers(mentorId);
        const list = Array.isArray(res.data?.data) ? res.data.data : [];
        setPastors(list);
      } catch (err) {
        console.error("Failed to fetch assigned pastors", err);
        setPastors([]);
      }
    };
    fetchAssignedPastors();
  }, [mentorId]);

  useEffect(() => {
    if (!mentorId) return;

    const fetchWeeklyAvailability = async () => {
      try {
        const sunday = new Date(weekStart);
        sunday.setDate(sunday.getDate() - sunday.getDay());

        const date = sunday.toISOString().split("T")[0];

        const res = await apiGetWeeklyAvailability(mentorId, date);
        const raw = res.data?.data ?? res.data;
        const data = Array.isArray(raw) ? raw : [];
        console.log(res)
        setWeeklyAvailability(data);

        if (data.length === 0) {
          setAvailability(
            [0, 1, 2, 3, 4, 5, 6].map((day) => ({
              date: "",
              day,
              enabled: false,
              slots: [
                {
                  startTime: "09:00",
                  startPeriod: "AM",
                  endTime: "05:00",
                  endPeriod: "PM",
                },
              ],
            })),
          );
        } else {
          const formatted = data.map((d: any) => ({
            date: d.date,
            day: typeof d.day === "number" ? d.day : Number(d.day) || 0,
            enabled: Array.isArray(d.slots) && d.slots.length > 0,
            slots:
              Array.isArray(d.slots) && d.slots.length > 0
                ? d.slots.map((s: any) => ({
                  startTime: s.startTime || s.start?.split(":")?.slice(0, 2).join(":") || "09:00",
                  startPeriod: s.startPeriod || "AM",
                  endTime: s.endTime || s.end?.split(":")?.slice(0, 2).join(":") || "05:00",
                  endPeriod: s.endPeriod || "PM",
                }))
                : [
                  {
                    startTime: "09:00",
                    startPeriod: "AM",
                    endTime: "05:00",
                    endPeriod: "PM",
                  },
                ],
          }));

          setAvailability(formatted);
        }
      } catch (err) {
        console.error("Weekly availability error", err);
      }
    };

    fetchWeeklyAvailability();
  }, [mentorId, weekStart]);

  const todayAppointments = appointments.filter((appt) => {
    const today = new Date();
    const meetingDate = new Date(appt.meetingDate);

    return (
      meetingDate.getDate() === today.getDate() &&
      meetingDate.getMonth() === today.getMonth() &&
      meetingDate.getFullYear() === today.getFullYear()
    );
  });

  const DAY_NAMES = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;

  /** YYYY-MM-DD for each row: use API date when present, else derive from weekStart + day index. */
  const resolveAvailabilityRowDate = (d: any): string => {
    const raw = typeof d.date === "string" ? d.date.trim() : "";
    if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
    const anchor = new Date(weekStart);
    anchor.setHours(12, 0, 0, 0);
    const sunday = new Date(anchor);
    sunday.setDate(anchor.getDate() - anchor.getDay());
    const di = Number(d.day ?? 0) % 7;
    const dt = new Date(sunday);
    dt.setDate(sunday.getDate() + di);
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, "0");
    const day = String(dt.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const period = (p: unknown, fallback: "AM" | "PM"): "AM" | "PM" => {
    const s = String(p ?? "").trim().toUpperCase();
    if (s === "PM" || s.startsWith("P")) return "PM";
    if (s === "AM" || s.startsWith("A")) return "AM";
    return fallback;
  };

  /**
   * Backend shapes differ; try several payloads (date-based like GET /week, then HH:mm, then weekday template).
   */
  const buildAvailabilityPayloadVariants = (): Record<string, unknown>[] => {
    const enabled = availability.filter(
      (d) => d.enabled && Array.isArray(d.slots) && d.slots.length > 0,
    );
    if (!mentorId || enabled.length === 0) return [];

    const baseMeta = {
      meetingDuration: 60,
      bufferTime: 15,
      advanceNotice: 2,
      maxBookingsPerDay: 5,
    };

    const dated = enabled.map((d) => ({
      date: resolveAvailabilityRowDate(d),
      uiSlots: d.slots || [],
    }));

    const variants: Record<string, unknown>[] = [];

    // Minimal body (some APIs reject extra fields)
    variants.push({
      mentorId,
      meetingDuration: 60,
      weeklySlots: dated.map(({ date, uiSlots }) => ({
        date,
        slots: uiSlots.map((s: any) => ({
          startTime: String(s.startTime || "09:00").replace(/\s*(AM|PM)\s*/gi, "").trim() || "09:00",
          startPeriod: period(s.startPeriod, "AM"),
          endTime: String(s.endTime || "05:00").replace(/\s*(AM|PM)\s*/gi, "").trim() || "05:00",
          endPeriod: period(s.endPeriod, "PM"),
        })),
      })),
    });

    variants.push({
      mentorId,
      ...baseMeta,
      weeklySlots: dated.map(({ date, uiSlots }) => ({
        date,
        slots: uiSlots.map((s: any) => ({
          startTime: String(s.startTime || "09:00").replace(/\s*(AM|PM)\s*/gi, "").trim() || "09:00",
          startPeriod: period(s.startPeriod, "AM"),
          endTime: String(s.endTime || "05:00").replace(/\s*(AM|PM)\s*/gi, "").trim() || "05:00",
          endPeriod: period(s.endPeriod, "PM"),
        })),
      })),
    });

    variants.push({
      mentorId,
      ...baseMeta,
      weeklySlots: dated.map(({ date, uiSlots }) => ({
        date,
        slots: uiSlots.map((s: any) => ({
          start: slotToHHmm(s.startTime, s.startPeriod),
          end: slotToHHmm(s.endTime, s.endPeriod),
        })),
      })),
    });

    variants.push({
      mentorId,
      ...baseMeta,
      weeklySlots: enabled.map((d) => ({
        day: DAY_NAMES[Number(d.day ?? 0) % 7],
        isAvailable: true,
        slots: (d.slots || []).map((s: any) => ({
          start: slotToHHmm(s.startTime, s.startPeriod),
          end: slotToHHmm(s.endTime, s.endPeriod),
        })),
      })),
    });

    variants.push({
      mentorId,
      meetingDuration: 60,
      availability: dated.map(({ date, uiSlots }) => ({
        date,
        slots: uiSlots.map((s: any) => ({
          startTime: String(s.startTime || "09:00").replace(/\s*(AM|PM)\s*/gi, "").trim() || "09:00",
          startPeriod: period(s.startPeriod, "AM"),
          endTime: String(s.endTime || "05:00").replace(/\s*(AM|PM)\s*/gi, "").trim() || "05:00",
          endPeriod: period(s.endPeriod, "PM"),
        })),
      })),
    });

    const seen = new Set<string>();
    return variants.filter((v) => {
      const k = JSON.stringify(v);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  };

  const handleSaveAvailability = async () => {
    if (!mentorId) return;

    const hasValidSlots = availability.some(
      (day) => day.enabled && day.slots && day.slots.length > 0,
    );

    if (!hasValidSlots) {
      setToastMessage("Please add at least one availability slot");
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    const variants = buildAvailabilityPayloadVariants();
    let lastError: unknown = null;

    try {
      for (const body of variants) {
        try {
          await apiCreateAvailability(body as any);
          setToastMessage("Availability updated successfully");
          lastError = null;
          break;
        } catch (e) {
          lastError = e;
          console.warn("Availability save attempt failed, trying next shape…", e);
        }
      }

      if (lastError) {
        throw lastError;
      }

      const sunday = new Date(weekStart);
      sunday.setDate(sunday.getDate() - sunday.getDay());
      const date = sunday.toISOString().split("T")[0];
      const res = await apiGetWeeklyAvailability(mentorId, date);
      const raw = res.data?.data ?? res.data;
      const data = Array.isArray(raw) ? raw : [];
      setWeeklyAvailability(data);
      if (data.length > 0) {
        const formatted = data.map((d: any) => ({
          date: d.date,
          day: typeof d.day === "number" ? d.day : Number(d.day) || 0,
          enabled: Array.isArray(d.slots) && d.slots.length > 0,
          slots:
            Array.isArray(d.slots) && d.slots.length > 0
              ? d.slots.map((s: any) => ({
                startTime: s.startTime || "09:00",
                startPeriod: s.startPeriod || "AM",
                endTime: s.endTime || "05:00",
                endPeriod: s.endPeriod || "PM",
              }))
              : [
                {
                  startTime: "09:00",
                  startPeriod: "AM",
                  endTime: "05:00",
                  endPeriod: "PM",
                },
              ],
        }));
        setAvailability(formatted);
      }
    } catch (error) {
      console.error(error);
      setToastMessage(extractApiErrorMessage(error));
    }

    setTimeout(() => setToastMessage(null), 4000);
  };

  const toIsoFromDateAndSlot = (dateStr: string, slot: string) => {
    return parseSlotStartToIso(dateStr, slot.replace(/\u2013/g, "-"));
  };

  const handleCreateAppointment = async () => {
    if (!mentorId) return;
    if (!selectedPastor?._id && !selectedPastor?.id) {
      setToastMessage("Please select a pastor");
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }
    if (!meetingDate || !selectedSlot) {
      setToastMessage("Please select date and time");
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    try {
      await apiCreateAppointment({
        userId: selectedPastor._id || selectedPastor.id,
        mentorId,
        meetingDate: toIsoFromDateAndSlot(meetingDate, selectedSlot),
        platform: uiMeetingModeToPlatform(selectedPlatform),
        notes: "Scheduled by mentor",
      });

      const refresh = await apiGetMentorAppointments(mentorId);
      setAppointments(unwrapAppointmentsAxiosData(refresh));
      setIsDrawerOpen(false);
      setDrawerStep(1);
      setSelectedPastor(null);
      setMeetingDate("");
      setSelectedSlot("");
      setToastMessage("Appointment created successfully");
    } catch (error) {
      console.error("Failed to create appointment", error);
      setToastMessage("Failed to create appointment");
    }

    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCancelMentorAppointment = async (appt: Appointment) => {
    const id = appointmentEntityId(appt);
    if (!id || !mentorId) return;
    try {
      await apiCancelAppointment(id);
      const refresh = await apiGetMentorAppointments(mentorId);
      setAppointments(unwrapAppointmentsAxiosData(refresh));
      setShowMenu(null);
      setToastMessage("Appointment cancelled");
    } catch (e) {
      console.error(e);
      setToastMessage("Failed to cancel appointment");
    }
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className={mentorPageRoot}>
      <MentorHeader showFullHeader={true} />

      <section
        className="relative flex min-h-[200px] flex-col justify-center bg-cover bg-center px-4 py-10 text-white sm:min-h-[240px] md:px-20"
        style={{ backgroundImage: `url(${HeroBg.src})` }}
      >
        <div className={mentorHeroOverlay} />
        <div className="relative z-10 max-w-4xl">
          <h1 className="text-2xl font-semibold sm:text-3xl md:text-4xl">Mentor schedule</h1>
          <p className={`mt-2 max-w-2xl ${mentorBodyText}`}>
            View appointments, set weekly availability, or schedule a new meeting with an assigned pastor — same look
            as pastor appointments.
          </p>
        </div>
      </section>

      <main className={`${mentorMainGradient} flex-1 px-4 pb-20 pt-8 md:px-16 lg:px-20`}>
        <div className="mx-auto max-w-7xl">
          <div className={`${mentorFilterPanel} mb-8`}>
            <div className="flex flex-col items-stretch justify-between gap-4 lg:flex-row lg:items-center">
              <input
                type="text"
                placeholder="Jump to date (dd-mm-yyyy)"
                className={`w-full max-w-none rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm text-white placeholder:text-[#cde2f2] outline-none focus:border-[#8ec5eb]/50 focus:ring-2 focus:ring-[#8ec5eb]/30 lg:max-w-sm`}
              />
              <MentorFilterTabGroup
                tabs={["Appointments", "Availability", "Schedule"] as const}
                active={activeTab}
                onChange={(tab) => {
                  setActiveTab(tab);
                  if (tab === "Schedule") {
                    setIsDrawerOpen(true);
                    setDrawerStep(1);
                  } else {
                    setIsDrawerOpen(false);
                  }
                }}
                aria-label="Schedule section"
                className="w-full lg:w-auto"
              />
            </div>
          </div>

          {!mentorId && !loading ? (
            <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-center text-sm text-amber-100">
              Sign in as a mentor to manage your schedule.
            </div>
          ) : null}

          {loading && mentorId ? (
            <div className="flex flex-col items-center justify-center gap-4 py-16">
              <div className={mentorSpinner} />
              <p className={`text-sm ${mentorBodyText}`}>Loading appointments…</p>
            </div>
          ) : null}

          {mentorId && !loading && activeTab === "Appointments" && (
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-12">
              <div className={`${mentorGlassCardFrost} p-5 sm:p-6`}>
                <h3 className="mb-4 flex items-center gap-2 text-[15px] font-medium text-white">
                  <i className="fa-regular fa-calendar text-[#8ec5eb]" /> Monthly meeting calendar
                </h3>

                <div className="rounded-xl border border-white/15 bg-[linear-gradient(180deg,rgba(12,58,95,0.85)_0%,rgba(10,53,88,0.92)_100%)] p-5 text-center shadow-inner">
                  <div className="mb-4 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
                      className="rounded-lg px-2 py-1 text-white/90 transition hover:bg-white/10"
                      aria-label="Previous month"
                    >
                      ◀
                    </button>

                    <p className="text-sm font-medium text-white/90">
                      {currentDate.toLocaleString("default", {
                        month: "long",
                        year: "numeric",
                      })}
                    </p>

                    <button
                      type="button"
                      onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
                      className="rounded-lg px-2 py-1 text-white/90 transition hover:bg-white/10"
                      aria-label="Next month"
                    >
                      ▶
                    </button>
                  </div>

                  <div className="mb-2 grid grid-cols-7 gap-2 text-[13px]">
                    {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                      <div key={`${d}-${i}`} className="font-medium text-[#cde2f2]/80">
                        {d}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-2 text-[13px]">
                    {calendarDays.map((day, index) => {
                      if (!day) return <div key={index} />;

                      const d = new Date(year, month, day);

                      const dateStr = `${d.getFullYear()}-${String(
                        d.getMonth() + 1
                      ).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

                      const hasAppointment = appointmentDates.includes(dateStr);

                      const isToday =
                        day === new Date().getDate() &&
                        month === new Date().getMonth() &&
                        year === new Date().getFullYear();

                      return (
                        <div
                          key={index}
                          className={`cursor-pointer rounded-md py-1 transition ${isToday
                            ? "bg-[#8ec5eb]/35 font-semibold text-white ring-1 ring-[#8ec5eb]/50"
                            : "text-[#d9ebf8] hover:bg-white/10"
                            } ${hasAppointment ? "ring-1 ring-amber-300/60" : ""}`}
                        >
                          {day}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="mb-4 text-[15px] font-semibold text-white">
                  Today — {todayAppointments.length} appointment
                  {todayAppointments.length === 1 ? "" : "s"}
                </h3>

                <div className="flex flex-col gap-5">
                  {todayAppointments.length === 0 ? (
                    <div className={mentorEmptyPanel}>
                      <p className={mentorBodyText}>No meetings scheduled for today.</p>
                    </div>
                  ) : null}
                  {todayAppointments.map((appt, index) => {
                    const meetingDate = new Date(appt.meetingDate);
                    const apptKey = appointmentEntityId(appt) || String(index);

                    return (
                      <div
                        key={apptKey}
                        className={`${mentorGlassCardRoadmap} relative items-stretch gap-0 p-4 sm:items-center sm:p-5`}
                      >
                        <div className="flex w-full shrink-0 items-center justify-center border-b border-white/10 py-4 sm:w-[120px] sm:border-b-0 sm:border-r sm:py-0">
                          <div className="flex h-[100px] w-[100px] items-center justify-center rounded-xl border border-white/15 bg-white/5">
                            <Image
                              src={appt.platform === "zoom" ? MeetIcon : DuoIcon}
                              alt={appt.platform}
                              className="h-[52px] w-[52px]"
                            />
                          </div>
                        </div>

                        <div className="min-w-0 flex-1 px-0 pt-4 sm:px-5 sm:pt-0">
                          <div className="mb-2 flex items-center gap-3">
                            <Image
                              src={appt.user?.profilePicture || UserProfile}
                              alt="User"
                              width={36}
                              height={36}
                              className="rounded-full border border-white/20"
                            />

                            <div>
                              <h4 className="text-sm font-semibold text-white">
                                {appt.user?.firstName} {appt.user?.lastName}
                              </h4>

                              <p className="text-[12px] text-[#cde2f2]/90">Pastor</p>
                            </div>
                          </div>

                          <div className="mb-2 flex flex-wrap gap-2">
                            <div className="flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-1 text-[12px] font-medium text-[#d9ebf8]">
                              <i className="fa-regular fa-calendar text-[#8ec5eb]" />
                              {meetingDate.toLocaleDateString()}
                            </div>

                            <div className="flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-1 text-[12px] font-medium text-[#d9ebf8]">
                              <i className="fa-regular fa-clock text-[#8ec5eb]" />
                              {meetingDate.toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          </div>

                          <p className="mb-2 text-[12px] text-[#cde2f2]">
                            Mode:{" "}
                            <span className="font-semibold text-[#8ec5eb]">{appt.platform}</span>
                          </p>

                          <div className="flex items-center justify-between">
                            <div className="flex gap-3 text-[15px] text-[#8ec5eb]">
                              <i className="fa-solid fa-phone cursor-pointer transition hover:text-white" />
                              <i className="fa-regular fa-comment cursor-pointer transition hover:text-white" />
                              <i className="fa-brands fa-whatsapp cursor-pointer transition hover:text-white" />
                            </div>

                            <div className="relative">
                              <button
                                type="button"
                                onClick={() =>
                                  setShowMenu(showMenu === index ? null : index)
                                }
                                className="rounded-lg px-3 py-1 text-[#8ec5eb] transition hover:bg-white/10 hover:text-white"
                                aria-label="Appointment actions"
                              >
                                <i className="fa-solid fa-ellipsis-vertical" />
                              </button>

                              {showMenu === index && (
                                <div className="absolute right-0 top-9 z-10 w-[220px] overflow-hidden rounded-xl border border-white/20 bg-[#0a3558]/95 py-1 text-sm text-[#d9ebf8] shadow-xl backdrop-blur-md">
                                  <button
                                    type="button"
                                    className="w-full px-4 py-2.5 text-left transition hover:bg-white/10"
                                    onClick={() => {
                                      setShowMenu(null);
                                      setToastMessage(
                                        "Use pastor’s calendar or reschedule from their account when supported."
                                      );
                                      setTimeout(() => setToastMessage(null), 4000);
                                    }}
                                  >
                                    <i className="fa-regular fa-calendar-check mr-2 text-[#8ec5eb]" />
                                    Reschedule meeting
                                  </button>

                                  <button
                                    type="button"
                                    className="w-full px-4 py-2.5 text-left transition hover:bg-white/10"
                                    onClick={() => handleCancelMentorAppointment(appt)}
                                  >
                                    <i className="fa-regular fa-circle-xmark mr-2 text-red-300" />
                                    Cancel meeting
                                  </button>

                                  <button
                                    type="button"
                                    className="w-full px-4 py-2.5 text-left transition hover:bg-white/10"
                                    onClick={() => {
                                      setShowMenu(null);
                                      setToastMessage(
                                        "Open appointment details on web admin or ask pastor to change platform."
                                      );
                                      setTimeout(() => setToastMessage(null), 4000);
                                    }}
                                  >
                                    <i className="fa-regular fa-clock mr-2 text-[#cde2f2]" />
                                    Change meeting mode
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {mentorId && !loading && activeTab === "Availability" && (
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
              <div className={`${mentorGlassCardFrost} p-5 text-white sm:p-6`}>
                <h3 className="mb-5 text-[15px] font-medium">My weekly availability</h3>
                <div className="mb-6 rounded-xl border border-white/15 bg-[linear-gradient(180deg,rgba(12,58,95,0.85)_0%,rgba(10,53,88,0.92)_100%)] p-5 text-center shadow-inner">
                  <p className="mb-2 text-sm text-[#cde2f2]">
                    {weekDates.length
                      ? weekDates[0].toLocaleDateString("default", {
                        month: "long",
                        year: "numeric",
                      })
                      : "—"}
                  </p>
                  <div className="grid grid-cols-7 gap-2 text-[13px]">
                    {weekDates.map((date) => {
                      const day = date.toLocaleDateString("default", { weekday: "short" });

                      return (
                        <div
                          key={date.toISOString()}
                          className="cursor-pointer rounded-md py-2 text-center text-[#d9ebf8] transition hover:bg-white/10"
                        >
                          <div>{day}</div>
                          <div className="text-xs text-white/80">{date.getDate()}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <select className={mentorSelectDark}>
                    <option className="bg-[#062946]">60 Minutes</option>
                    <option className="bg-[#062946]">30 Minutes</option>
                  </select>
                  <select className={mentorSelectDark}>
                    <option className="bg-[#062946]">5</option>
                    <option className="bg-[#062946]">10</option>
                  </select>
                  <select className={mentorSelectDark}>
                    <option className="bg-[#062946]">2 Days</option>
                    <option className="bg-[#062946]">1 Day</option>
                  </select>
                  <select className={mentorSelectDark}>
                    <option className="bg-[#062946]">Zoom</option>
                    <option className="bg-[#062946]">Google Meet</option>
                  </select>
                </div>
              </div>

              <div className="text-white">
                <h3 className="mb-3 text-[15px] font-medium">Available hours</h3>
                {[
                  { label: "Sunday", index: 0 },
                  { label: "Monday", index: 1 },
                  { label: "Tuesday", index: 2 },
                  { label: "Wednesday", index: 3 },
                  { label: "Thursday", index: 4 },
                  { label: "Friday", index: 5 },
                  { label: "Saturday", index: 6 }
                ].map((dayObj) => {

                  const dayData = availability.find((d) => d.day === dayObj.index);
                  const slots = dayData?.slots || [];

                  return (
                    <div
                      key={dayObj.label}
                      className="flex items-center gap-3 mb-3 border-b border-white/20 pb-2"
                    >
                      <input
                        type="checkbox"
                        checked={availability.find(d => d.day === dayObj.index)?.enabled || false}
                        onChange={() => {
                          setAvailability(prev =>
                            prev.map(d =>
                              d.day === dayObj.index
                                ? { ...d, enabled: !d.enabled }
                                : d
                            )
                          );
                        }}
                        className="accent-[#8ec5eb]"
                      />

                      <p className="w-[100px] text-[#d9ebf8]">{dayObj.label}</p>

                      {slots.map((slot, slotIndex) => (
                        <div key={slotIndex} className="flex gap-3">

                          <select
                            className={`${mentorSelectDark} max-w-[140px] px-2 py-1.5 text-xs`}
                            value={`${slot.startTime}-${slot.startPeriod}`}
                            onChange={(e) => {
                              const [time, period] = e.target.value.split("-");

                              setAvailability(prev =>
                                prev.map(d =>
                                  d.day === dayObj.index
                                    ? {
                                      ...d,
                                      slots: d.slots.map((s, i) =>
                                        i === slotIndex
                                          ? { ...s, startTime: time, startPeriod: period }
                                          : s
                                      )
                                    }
                                    : d
                                )
                              );
                            }}
                          >
                            {timeOptions.map(t => (
                              <option key={`${t.time}-${t.period}`} value={`${t.time}-${t.period}`}>
                                {t.label}
                              </option>
                            ))}
                          </select>

                          <span className="text-[#cde2f2]">to</span>

                          <select
                            className={`${mentorSelectDark} max-w-[140px] px-2 py-1.5 text-xs`}
                            value={`${slot.endTime}-${slot.endPeriod}`}
                            onChange={(e) => {
                              const [time, period] = e.target.value.split("-");

                              setAvailability(prev =>
                                prev.map(d =>
                                  d.day === dayObj.index
                                    ? {
                                      ...d,
                                      slots: d.slots.map((s, i) =>
                                        i === slotIndex
                                          ? { ...s, endTime: time, endPeriod: period }
                                          : s
                                      )
                                    }
                                    : d
                                )
                              );
                            }}
                          >
                            {timeOptions.map(t => (
                              <option key={`${t.time}-${t.period}`} value={`${t.time}-${t.period}`}>
                                {t.label}
                              </option>
                            ))}
                          </select>

                        </div>
                      ))}

                      <button
                        type="button"
                        className={`${mentorSecondaryCta} ml-2 px-3 py-1.5 text-xs`}
                        onClick={() => {
                          const lastSlot = slots[slots.length - 1];

                          const start = convertToMinutes(lastSlot.endTime, lastSlot.endPeriod);
                          const end = start + 60;

                          if (end > 24 * 60) {
                            setToastMessage("Cannot add more slots in this day");
                            setTimeout(() => setToastMessage(null), 3000);
                            return;
                          }

                          const newSlot = {
                            startTime: "09:00",
                            startPeriod: "AM",
                            endTime: "10:00",
                            endPeriod: "AM",
                          };

                          setAvailability((prev) =>
                            prev.map((d) =>
                              d.day === dayObj.index
                                ? {
                                  ...d,
                                  slots: [...d.slots, newSlot],
                                }
                                : d
                            )
                          );
                        }}
                      >
                        + Add
                      </button>
                    </div>
                  );
                })}

                <div className="mt-6">
                  <button
                    type="button"
                    onClick={handleSaveAvailability}
                    className={mentorPrimaryCta}
                  >
                    Save availability
                  </button>
                </div>
              </div>
            </div>
          )}

          {mentorId && !loading && activeTab === "Schedule" && !isDrawerOpen && (
            <div className={mentorEmptyPanel}>
              <p className={`${mentorBodyText} mb-4`}>
                Open the panel on the right to pick an assigned pastor and choose a time — or tap{" "}
                <span className="font-semibold text-white">Schedule</span> in the tabs above.
              </p>
              <button
                type="button"
                className={mentorPrimaryCta}
                onClick={() => {
                  setDrawerStep(1);
                  setIsDrawerOpen(true);
                }}
              >
                New meeting
              </button>
            </div>
          )}
        </div>
      </main>

      {activeTab === "Schedule" && isDrawerOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[2px]"
            onClick={() => setIsDrawerOpen(false)}
            aria-hidden
          />
          <div className="fixed right-0 top-0 z-50 h-full w-full border-l border-white/15 bg-[#041f35] text-white shadow-2xl sm:max-w-[480px] sm:w-[480px]">
            {drawerStep === 1 && (
              <div className="flex h-full flex-col p-6">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-lg font-semibold">New meeting</h2>
                  <button
                    type="button"
                    onClick={() => setIsDrawerOpen(false)}
                    className="rounded-lg p-2 text-[#cde2f2] transition hover:bg-white/10 hover:text-white"
                    aria-label="Close"
                  >
                    <i className="fa-solid fa-xmark text-xl" />
                  </button>
                </div>

                <div className="mb-4 flex gap-2">
                  <button
                    type="button"
                    className="rounded-lg bg-white/15 px-4 py-2 text-sm font-medium text-white ring-1 ring-[#8ec5eb]/40"
                  >
                    Pastor
                  </button>
                  <button
                    type="button"
                    className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-[#cde2f2] transition hover:bg-white/10"
                    disabled
                  >
                    Director
                  </button>
                </div>

                <input
                  type="text"
                  placeholder="Search"
                  className="mb-4 w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm text-white placeholder:text-[#cde2f2] outline-none focus:border-[#8ec5eb]/50 focus:ring-2 focus:ring-[#8ec5eb]/30"
                />

                <div className="flex max-h-[min(380px,50vh)] flex-col gap-3 overflow-y-auto pr-1">
                  {pastors.length === 0 && (
                    <p className={`px-2 py-4 text-sm ${mentorBodyText}`}>No assigned pastors found.</p>
                  )}
                  {pastors.map((pastor: any) => {
                    const pastorId = pastor._id || pastor.id;
                    const isSelected = (selectedPastor?._id || selectedPastor?.id) === pastorId;
                    return (
                      <button
                        type="button"
                        key={pastorId}
                        onClick={() => setSelectedPastor(pastor)}
                        className={`flex w-full items-center justify-between gap-4 rounded-xl border px-4 py-3 text-left transition ${isSelected
                          ? "border-[#8ec5eb]/45 bg-[#8ec5eb]/15"
                          : "border-white/15 bg-white/5 hover:border-white/25 hover:bg-white/10"
                          }`}
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <Image
                            src={pastor.profilePicture || UserProfile}
                            alt=""
                            width={36}
                            height={36}
                            className="shrink-0 rounded-full border border-white/20"
                          />
                          <span className="truncate text-sm font-medium text-white">
                            {pastor.firstName} {pastor.lastName}
                          </span>
                        </div>
                        <input
                          type="radio"
                          checked={isSelected}
                          readOnly
                          className="accent-[#8ec5eb]"
                          aria-hidden
                        />
                      </button>
                    );
                  })}
                </div>

                <div className="mt-auto flex justify-end gap-3 border-t border-white/10 pt-6">
                  <button type="button" onClick={() => setIsDrawerOpen(false)} className={mentorSecondaryCta}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!selectedPastor) {
                        setToastMessage("Please select a pastor first");
                        setTimeout(() => setToastMessage(null), 3000);
                        return;
                      }
                      setDrawerStep(2);
                    }}
                    className={mentorPrimaryCta}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {drawerStep === 2 && (
              <div className="flex h-full flex-col p-6">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="flex items-center gap-2 text-lg font-semibold">
                    <i className="fa-regular fa-calendar-days text-[#8ec5eb]" />
                    Schedule a meeting
                  </h2>
                  <button
                    type="button"
                    onClick={() => setIsDrawerOpen(false)}
                    className="rounded-lg p-2 text-[#cde2f2] transition hover:bg-white/10 hover:text-white"
                    aria-label="Close"
                  >
                    <i className="fa-solid fa-xmark text-xl" />
                  </button>
                </div>

                <div className="mb-6 rounded-xl border border-white/15 bg-[linear-gradient(180deg,rgba(12,58,95,0.85)_0%,rgba(10,53,88,0.92)_100%)] p-5 text-center">
                  <p className="mb-2 text-sm text-[#cde2f2]">Select date</p>
                  <input
                    type="date"
                    value={meetingDate}
                    onChange={(e) => setMeetingDate(e.target.value)}
                    className={mentorDateInputDark}
                  />
                </div>

                <div className="mb-6 grid grid-cols-2 gap-3">
                  {(
                    [
                      "09:00 am - 10:00 am",
                      "11:00 am - 12:00 pm",
                      "01:00 pm - 02:00 pm",
                      "03:00 pm - 04:00 pm",
                      "05:00 pm - 06:00 pm",
                    ] as const
                  ).map((label) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setSelectedSlot(label)}
                      className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition ${selectedSlot === label
                        ? "border-[#8ec5eb]/50 bg-[#8ec5eb]/20 text-white ring-1 ring-[#8ec5eb]/40"
                        : "border-white/20 bg-white/5 text-[#cde2f2] hover:border-white/30 hover:bg-white/10"
                        }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <select
                  value={selectedPlatform}
                  onChange={(e) => setSelectedPlatform(e.target.value)}
                  className={`${mentorSelectDark} mb-8`}
                >
                  <option className="bg-[#062946]" value="zoom">
                    Zoom
                  </option>
                  <option className="bg-[#062946]" value="google meet">
                    Google Meet
                  </option>
                  <option className="bg-[#062946]" value="teams">
                    Microsoft Teams
                  </option>
                  <option className="bg-[#062946]" value="phone">
                    Phone
                  </option>
                </select>

                <div className="mt-auto flex justify-end gap-3 border-t border-white/10 pt-6">
                  <button type="button" onClick={() => setIsDrawerOpen(false)} className={mentorSecondaryCta}>
                    Cancel
                  </button>
                  <button type="button" onClick={handleCreateAppointment} className={mentorPrimaryCta}>
                    Schedule
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {toastMessage ? (
        <div
          className="fixed bottom-6 right-4 z-[60] max-w-md rounded-2xl border border-white/20 bg-[#0a3558]/95 px-5 py-4 shadow-2xl backdrop-blur-md sm:right-8"
          role="status"
        >
          <div className="flex items-start gap-3">
            <i className="fa-solid fa-circle-info mt-0.5 text-lg text-[#8ec5eb]" aria-hidden />
            <p className="text-[15px] font-medium leading-snug text-white">{toastMessage}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function MentorSchedule() {
  return (
    <Suspense
      fallback={
        <div className={mentorPageRoot}>
          <MentorHeader showFullHeader />
          <div className={`flex flex-1 flex-col items-center justify-center gap-4 py-24 ${mentorMainGradient}`}>
            <div className={mentorSpinner} />
            <p className={`text-sm ${mentorBodyText}`}>Loading schedule…</p>
          </div>
        </div>
      }
    >
      <MentorScheduleContent />
    </Suspense>
  );
}
