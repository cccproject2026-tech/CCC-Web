"use client";
import { useEffect, useState, Suspense } from "react";
import "@fortawesome/fontawesome-free/css/all.min.css";
import headerBg from "../../Assets/CMA-hero-bg.png";
import { useRouter, useSearchParams } from "next/navigation";
import {
  apiGetAssessmentById,
  apiGetUserAnswers,
  parseAssessmentDetailPayload,
  apiSubmitSectionAnswers,
} from "@/app/Services/assessment.service";
import { getCookie } from "@/app/utils/cookies";
import { apiGetAssignedUsers } from "@/app/Services/users.service";
import { apiCreateAppointment } from "@/app/Services/appointments.service";
import axiosInstance from "@/app/Services/config/axios-instance";

function PastorSurveyCMAContent() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const searchParams = useSearchParams();
  const assessmentId = searchParams.get("assessmentId");
  const reviewUserId = (searchParams.get("userId") || "").trim();
  const viewOnly =
    searchParams.get("viewOnly") === "1" ||
    searchParams.get("viewOnly") === "true" ||
    searchParams.get("mode") === "review";
  const [sections, setSections] = useState<any[]>([]);
  const [assessmentTitle, setAssessmentTitle] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [mentors, setMentors] = useState<any[]>([]);
  const [selectedMentor, setSelectedMentor] = useState<string>("");
  const [availability, setAvailability] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);

  // ✅ Added new state for submit & schedule popup flow
  const [showSubmitPopup, setShowSubmitPopup] = useState(false);
  const [showSchedulePrompt, setShowSchedulePrompt] = useState(false);
  const [showMentorSidebar, setShowMentorSidebar] = useState(false);
  const [mentorStep, setMentorStep] = useState(1);
  const [showFinalPopup, setShowFinalPopup] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!assessmentId) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);

        const res = await apiGetAssessmentById(assessmentId);
        const detail = parseAssessmentDetailPayload(res.data);
        setSections(detail?.sections || []);
        setAssessmentTitle((detail?.name as string) || "");

        let answersUserId = "";
        if (viewOnly) {
          if (!reviewUserId) {
            setSections([]);
            setMentors([]);
            setLoading(false);
            return;
          }
          answersUserId = reviewUserId;
        } else {
          const userCookie = getCookie("user");
          if (userCookie) {
            const user = JSON.parse(userCookie) as { id?: string; _id?: string };
            answersUserId = String(user.id || user._id || "");
            if (answersUserId) {
              const mentorsRes = await apiGetAssignedUsers(answersUserId);
              setMentors(mentorsRes.data?.data || []);
            }
          }
        }

        if (answersUserId) {
          try {
            const answersRes = await apiGetUserAnswers(assessmentId, answersUserId);
            const body = answersRes.data as Record<string, unknown>;
            const inner = (body?.data as Record<string, unknown>) || body;
            const sectionsData = inner?.sections as unknown;
            if (Array.isArray(sectionsData)) {
              const userAnswers: Record<string, string> = {};
              sectionsData.forEach((section: any, sectionIndex: number) => {
                section.layers?.forEach((layer: any, layerIndex: number) => {
                  const sel =
                    layer.selectedChoice ??
                    (Array.isArray(layer.selectedValues) ? layer.selectedValues[0] : undefined);
                  if (sel != null && String(sel) !== "") {
                    const layerId = String(
                      layer.layerId || layer._id || `layer_${sectionIndex}_${layerIndex}`,
                    );
                    userAnswers[layerId] = String(sel);
                  }
                });
              });
              setAnswers(userAnswers);
            }
          } catch (err) {
            console.error("Failed to fetch user answers", err);
          }
        } else if (!viewOnly) {
          setMentors([]);
        }
      } catch (err) {
        console.error(err);
        setSections([]);
        setMentors([]);
        setAssessmentTitle("");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [assessmentId, viewOnly, reviewUserId]);

  useEffect(() => {
    if (selectedMentor) {
      const fetchAvailability = async () => {
        try {
          const availRes = await axiosInstance.get(`/appointments/availability/${selectedMentor}/month`, {
            params: { year: currentYear, month: currentMonth }
          });
          const slots = availRes.data.data || availRes.data.data || [];
          setAvailability(slots);
        } catch (err) {
          console.error("Failed to fetch availability", err);
          setAvailability([]);
        }
      };
      fetchAvailability();
    } else {
      setAvailability([]);
    }
  }, [selectedMentor, currentYear, currentMonth]);

  useEffect(() => {
    if (selectedDate && availability.length > 0) {
      const dateSlot = availability.find((slot: any) => {
        const slotDate = new Date(slot.date).toLocaleDateString('en-CA'); // YYYY-MM-DD format
        return slotDate === selectedDate;
      });
      if (dateSlot && dateSlot.slots) {
        const times = dateSlot.slots.map((raw: any) => {
          const start = `${raw.startTime} ${raw.startPeriod.toLowerCase()}`;
          const end = `${raw.endTime} ${raw.endPeriod.toLowerCase()}`;
          return `${start} – ${end}`;
        });
        setAvailableTimes(times);
      } else {
        setAvailableTimes([]);
      }
    } else {
      setAvailableTimes([]);
    }
  }, [selectedDate, availability]);

  const handleCheck = (layerId: string, choiceId: string) => {
    if (viewOnly) return;
    setAnswers((prev) => ({ ...prev, [layerId]: choiceId }));
  };

  const isSectionComplete = (sectionIndex: number) => {
    if (viewOnly) return true;
    const section = sections[sectionIndex];
    if (!section?.layers?.length) return true;

    return section.layers.every((layer: any, layerIndex: number) => {
      const layerId = layer._id || `layer_${sectionIndex}_${layerIndex}`;
      return !!answers[layerId];
    });
  };

  const handleNext = () => {
    if (!isSectionComplete(activeSection)) {
      setToast("Please answer all questions in this section before proceeding.");
      setTimeout(() => setToast(null), 3000);
      return;
    }

    if (activeSection < sections.length - 1) {
      setActiveSection((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (activeSection > 0) setActiveSection((prev) => prev - 1);
  };

  // New Submit Flow
  const handleSubmitSurvey = async () => {
    if (viewOnly) return;
    const allComplete = sections.every((_, idx) => isSectionComplete(idx));
    if (!allComplete) {
      setToast("Please complete all questions in every section before submitting.");
      setTimeout(() => setToast(null), 3000);
      return;
    }

    try {
      await submitAllSectionAnswers();
    } catch (error) {
      console.error("Failed to submit survey answers", error);
      setToast("Failed to submit survey answers");
      setTimeout(() => setToast(null), 3000);
      return;
    }

    setShowSubmitPopup(true);
    setTimeout(() => {
      setShowSubmitPopup(false);
      setShowSchedulePrompt(true);
    }, 2500);
  };

  const submitAllSectionAnswers = async () => {
    if (viewOnly) return;
    const userCookie = getCookie("user");
    if (!userCookie || !assessmentId) return;

    const user = JSON.parse(userCookie) as { id?: string; _id?: string };
    const uid = String(user.id || user._id || "");
    if (!uid) return;

    const formattedAnswers = sections.map((section, sectionIndex) => {
      const sectionId = section._id || section.id;
      const layers = (section.layers || [])
        .map((layer: any, layerIndex: number) => {
          const layerId = layer._id || `layer_${sectionIndex}_${layerIndex}`;
          const selectedValue = answers[layerId];
          return {
            layerId,
            selectedValues: selectedValue ? [selectedValue] : [],
          };
        })
        .filter((layer: any) => layer.selectedValues.length > 0);

      return { sectionId, layers };
    }).filter((sectionAnswer) => sectionAnswer.layers.length > 0);

    if (!formattedAnswers.length) {
      return;
    }

    await apiSubmitSectionAnswers(assessmentId, {
      userId: uid,
      answers: formattedAnswers,
    });
  };

  const handleScheduleMeeting = () => {
    setShowSchedulePrompt(false);
    setShowMentorSidebar(true);
    setSelectedDate("");
    setSelectedTime("");
    setAvailableTimes([]);
  };
  const handleFinalSchedule = async () => {
    if (!selectedDate || !selectedTime || !selectedMentor) {
      setToast("Please select date, time, and mentor");
      setTimeout(() => setToast(null), 3000);
      return;
    }

    const userCookie = getCookie("user");
    if (!userCookie) return;

    const user = JSON.parse(userCookie);

    try {
      // Parse the selected time (format: "10:00 AM – 11:00 AM")
      const timeMatch = selectedTime.match(/^(\d{1,2}):(\d{2})\s+(AM|PM)/);
      if (!timeMatch) {
        setToast("Invalid time format");
        setTimeout(() => setToast(null), 3000);
        return;
      }

      const [, hours, minutes, period] = timeMatch;
      let hour24 = parseInt(hours);
      if (period === 'PM' && hour24 !== 12) hour24 += 12;
      if (period === 'AM' && hour24 === 12) hour24 = 0;

      // Create ISO date string
      const meetingDate = new Date(`${selectedDate}T${hour24.toString().padStart(2, '0')}:${minutes}:00.000Z`);

      const uid = String(user.id || user._id || "");
      if (!uid) return;

      const payload = {
        userId: uid,
        mentorId: selectedMentor,
        meetingDate: meetingDate.toISOString(),
        platform: "zoom",
        notes: "Assessment follow-up meeting",
      };

      await apiCreateAppointment(payload);
      setShowFinalPopup(true);
      setTimeout(() => {
        setShowFinalPopup(false);
        // router.push("/pastor/AssessmentEvaluation");
      }, 2500);
    } catch (err) {
      console.error("Failed to schedule appointment", err);
      setToast("Failed to schedule appointment");
      setTimeout(() => setToast(null), 3000);
    }
  };

  // ✅ Sections 1–5 (kept 100% original)
  // const sections = [
  //   {
  //     title:
  //       "Congregational Well being (biopsychosocial(BPS)/financial/spiritual filter)",
  //     questions: [
  //       {
  //         title: "Congregational age trend",
  //         options: [
  //           "The church has been aging for the last twenty years.",
  //           "The average age of church members is significantly higher than the surrounding community.",
  //           "The average age of the church has been declining for the last 3–5 years but membership has been on the rise.",
  //           "The church exhibits diversity of generations in attendance and community engagement (CE).",
  //         ],
  //       },
  //       {
  //         title: "Attendance and membership health",
  //         options: [
  //           "Many members are home bound due to illness.",
  //           "Church attendance has been dwindling, especially younger people.",
  //           "The church’s attendance has been increasing for the last three years.",
  //           "The congregation has grown significantly younger in the last few years.",
  //         ],
  //       },
  //       {
  //         title: "Geographic spread of members",
  //         options: [
  //           "Most of the members commute to the church 10+ miles.",
  //           "At least ½ of the church commutes 10+ miles.",
  //           "At least one half of the church members live within 10 miles of the church.",
  //           "The majority of church members live within 10 miles of the church.",
  //         ],
  //       },
  //       {
  //         title: "Weddings vs funerals balance",
  //         options: [
  //           "There are more funerals than weddings and child dedications.",
  //           "There has been about the same number of weddings and child dedications as funerals.",
  //           "In the last few years, there have been more weddings and child dedications than funerals.",
  //           "There are child dedications and weddings taking place almost every month.",
  //         ],
  //       },
  //       {
  //         title: "Volunteer participation (10/90 rule)",
  //         options: [
  //           "Many members feel burnt out (10/90 rule).",
  //           "The 10/90 rule of volunteer participation is very evident.",
  //           "The congregational volunteer participation ratio is about 20/80.",
  //           "The congregational volunteer participation is about 50%—at least half of members volunteer somewhere.",
  //         ],
  //       },
  //       {
  //         title: "Leadership feedback climate",
  //         options: [
  //           "Leaders hear a lot of complaints about the church and its leadership.",
  //           "Members are concerned about the future of the church.",
  //           "Members and attendees feel hopeful about the future of the church.",
  //           "Members and attendees are excited inviting friends to church services or events.",
  //         ],
  //       },
  //     ],
  //   },
  //   {
  //     title: "Leadership (Elders, CB, etc.) Style",
  //     questions: [
  //       {
  //         title: "CB focus and ministry orientation",
  //         options: [
  //           "The CB spends most of its time and energy focusing on operations instead of ministries or evangelism.",
  //           "The CB dedicates at least ½ its time and energy discussing ways to demonstrate Christ to neighboring communities.",
  //           "The CB dedicates most of its time and efforts to transformative methods of evangelism (CMA).",
  //         ],
  //       },
  //       {
  //         title: "CB meeting climate",
  //         options: [
  //           "The CB meetings are tense, reflecting divisions in the church.",
  //           "The CB meetings feel formal and uninspiring.",
  //           "The CB meetings always keep in mind the church’s vision and mission.",
  //           "The CB meetings are full of energy and grace—the board members look forward to spending time with one another.",
  //         ],
  //       },
  //       {
  //         title: "CB unity and representation",
  //         options: [
  //           "The CB is not representative of all of the church’s constituencies, and its members don’t share the same vision & mission.",
  //           "Not all CB members are subscribed to the church’s vision and mission.",
  //           "The CB is united regarding the church’s vision and mission.",
  //           "All board members are on the same page regarding the church’s vision and mission and have developed a CB playbook (practical implementation).",
  //         ],
  //       },
  //       {
  //         title: "Leadership representation & focus",
  //         options: [
  //           "The elders spend most of their time 'putting out fires'.",
  //           "The CB is not representative of younger members of the congregation.",
  //           "At least half of the church’s life is oriented toward serving the community.",
  //           "The overall focus of the leadership is directed toward transformative presence in the community.",
  //         ],
  //       },
  //     ],
  //   },
  //   {
  //     title: "Community Engagement History",
  //     questions: [
  //       {
  //         title: "CMA partnerships & understanding",
  //         options: [
  //           "The church has no consistent partnerships with non-Adventist organizations.",
  //           "Church does not fully understand the CMA approach in relationship to evangelism.",
  //           "The congregation fully embraces the CMA approach in ministry and evangelism.",
  //           "The church fully implements the CMA approach in all areas of its life— inwardly and outwardly.",
  //         ],
  //       },
  //       {
  //         title: "Community collaboration & outreach",
  //         options: [
  //           "The church solely focuses on addressing the needs of its members.",
  //           "Some sporadic relationships with local community influencers and players.",
  //           "The church conspicuously participates in the community life outside of the church.",
  //           "The church has a designated leadership role for organizing community life outside of the church—this leader conducts formal training classes/workshops on CE for other churches.",
  //         ],
  //       },
  //       {
  //         title: "Focus of community service",
  //         options: [
  //           "The church is too focused on addressing the needs of its members & does not participate in community engagement.",
  //           "The community services feel more like proselytizing through distribution of goods than fostering relationships.",
  //           "The community services provide ample volunteer opportunities for people outside of the church.",
  //           "Many unchurched community-service volunteers become interested in the life of the church.",
  //         ],
  //       },
  //       {
  //         title: "Church–community awareness",
  //         options: [
  //           "Church members can’t accurately name the most pressing community issues in the surrounding area.",
  //           "Only very few of the church’s members participate in the life of the community outside of the church.",
  //           "The church has good relationships with local businesses; a few church members hold prominent leadership roles in community service organizations outside the church.",
  //           "Engaged in joint ventures with local businesses, government entities, and other non-profits.",
  //         ],
  //       },
  //       {
  //         title: "Education partnerships",
  //         options: [
  //           "No active partnerships exist with neighboring educational institutions.",
  //           "Only a few students and faculty members from neighboring higher education institutions participate in the life of church.",
  //           "The church actively engages students and faculty from local higher education institutions.",
  //           "The church has formal partnerships/joint projects with neighboring higher education institutions.",
  //         ],
  //       },
  //       {
  //         title: "Community perception of the church",
  //         options: [
  //           "Neighbors have no knowledge or hold a negative view of the church.",
  //           "Neighbors barely recognize/are only vaguely aware of the church.",
  //           "Many neighbors are aware and hold a positive view of the church.",
  //           "The church does not see itself existing without being actively present in the lives of its neighbors.",
  //         ],
  //       },
  //     ],
  //   },
  //   {
  //     title: "Pastoral Leadership",
  //     questions: [
  //       {
  //         title: "Pastor–church relationship",
  //         options: [
  //           "The pastor feels they have to speak at (confronting) the congregation rather than for (inspiring) the congregation.",
  //           "The pastor feels they have to constantly mediate between factions at the church.",
  //           "The pastor spends most of their time empowering church leaders.",
  //           "The pastor spends most of their time mentoring and being mentored.",
  //         ],
  //       },
  //       {
  //         title: "Pastor support and team dynamics",
  //         options: [
  //           "The pastor doesn’t feel supported by the majority of the church leaders.",
  //           "Church members feel like the pastor is apathetic—it feels like the pastor does only what is required to tick off church metrics but their heart and soul do pastoral ministry.",
  //           "The church members feel the positive energy and passion exhibited by the pastor.",
  //           "The pastor inspires and leads other pastors and partners in community-transformation initiatives and projects.",
  //         ],
  //       },
  //       {
  //         title: "Pastor engagement and time usage",
  //         options: [
  //           "The pastor does not spend personal time with all of the church’s leaders, only engages those with whom they feel safe.",
  //           "The pastor interacts with a limited number of people.",
  //           "The pastor consistently seeks new ways to integrate CMA approach in their ministry; however, they do most of the work by themselves.",
  //           "The pastor is an exemplar of the CMA approach—they cultivate open, trusting, and nurturing social environments—always acknowledging opportunities for growth and celebrating achievements.",
  //         ],
  //       },
  //       {
  //         title: "Pastor’s focus and priorities",
  //         options: [
  //           "The most of the pastor’s time is spent on dealing with internal issues and conflicts.",
  //           "The pastor spends at least 75% of their time dealing with the internal church issues and conflicts.",
  //           "The pastor is intentional (dedicating at least 25% of their time) about fostering relationships within the church’s formal and informal leaders—they live very little socially in the church.",
  //           "The pastor is deeply involved in the life of the surrounding community, developing pastoral accountability circles inside and outside of church—they are accountable to lay members and denominational leadership while advising them on the issues of leadership and spiritual personal growth.",
  //         ],
  //       },
  //       {
  //         title: "Pastor’s community engagement",
  //         options: [
  //           "The pastor doesn’t have any formal community engagement/services training/certification.",
  //           "Very limited community engagement/services training/certification.",
  //           "The pastor is enrolled to obtain formal training in the area of CE.",
  //           "The pastor trains other pastors and leaders in the area of CE through the CMA.",
  //         ],
  //       },
  //       {
  //         title: "Pastor’s church growth vision",
  //         options: [
  //           "The pastor doesn’t have a clear church growth strategy.",
  //           "The pastor has a vision for the church but doesn’t have energy or support to adequately enact it.",
  //           "The pastor consistently makes efforts to communicate the church’s vision and mission in the light of the CMA.",
  //           "The pastor is committed to encompassing CMA and the Cycle of Evangelism.",
  //         ],
  //       },
  //       {
  //         title: "Preaching and motivation style",
  //         options: [
  //           "Preaching can be described as uninspiring and mostly moralistic (propositional and patronizing).",
  //           "Preaching can be described as 'speaking at (confronting)' people rather than 'for (inspiring)' the people.",
  //           "Preaching is Christ-centered, inspiring, and transformational rather than moralistic and prescriptive; the pastor speaks for the people, expressing a deep understanding of the needs of the community.",
  //           "Preaching intentionally incorporates the CMA and CE principles; the pastor raises and equips other pastors in the Christ-centered manner.",
  //         ],
  //       },
  //       {
  //         title: "Pastor’s calling and motivation",
  //         options: [
  //           "If called somewhere else the pastor would leave the church without hesitation.",
  //           "If called somewhere else the pastor would give it serious consideration.",
  //           "The pastor shows deep care for church leaders and community stakeholders.",
  //           "The pastor can’t see themselves being anywhere else but with the church and the community in which they currently serve.",
  //         ],
  //       },
  //     ],
  //   },
  //   {
  //     title: "Christ’s Method Alone (CMA) and Cycle of Evangelism",
  //     questions: [
  //       {
  //         title: "Understanding and practice of CMA",
  //         options: [
  //           "CMA is not embodied in the life of the church",
  //           "Church does not fully understanding the CMA approach in relationship to evangelism",
  //           "Congregation has a good grasp but has not fully implemented practices of CMA",
  //           "The church is fully committed to and practices the CMA approach",
  //         ],
  //       },
  //       {
  //         title: "Evangelism and community integration",
  //         options: [
  //           "Little variety in methods of evangelism over the last twenty years",
  //           "There is no connection between evangelism efforts and the community engagement",
  //           "The church sees CE as a transformative form of evangelism rather than a transactional activity",
  //           "The church has a clear plan for further growth and transformative development",
  //         ],
  //       },
  //       {
  //         title: "Service and mission alignment",
  //         options: [
  //           "Serving the community is not considered to be the focus of the church’s life and ministries",
  //           "Only a few members see the vitality of the service to the community as an integral part of evangelistic foci",
  //           "The church members share a vision of embodying CMA as the future of church",
  //           "The church is networked with other congregations, which embody the CMA as its primary guiding principle",
  //         ],
  //       },
  //       {
  //         title: "Community awareness and CE plan",
  //         options: [
  //           "The church has no functional awareness of the surrounding community’s needs",
  //           "The church has only observed some of the community’s needs",
  //           "The church has surveyed the community, assessing its needs and aspirations",
  //           "The church has a practical CE plan for serving its community",
  //         ],
  //       },
  //     ],
  //   },
  // ];

  // ✅ Original return kept intact
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#1B5F9E] to-[#0D3971] text-white">
      {/* HEADER */}
      <header
        className="relative flex items-center px-4 sm:px-8 md:px-16 py-5 sm:py-8 md:py-10 bg-cover bg-no-repeat text-white h-[150px] sm:h-[200px]"
        style={{
          backgroundImage: `url(${headerBg.src})`,
          backgroundPosition: "center", // Adjusted for mobile
          backgroundSize: "cover",
        }}
      >
        {/* Optional transparent overlay for better text contrast */}
        <div className="absolute inset-0 bg-black/20"></div>

        {/* Left text content */}
        <div className="relative z-10 mt-4 sm:mt-7">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold">
            {assessmentTitle || "Church Assessment Evaluation (CMA)"}
          </h2>
          <p className="text-xs sm:text-sm mt-2 text-white/85 max-w-full sm:max-w-md">
            {viewOnly
              ? "Read-only review of this pastor’s saved responses."
              : "Complete each section using the options that best reflect your church."}
          </p>
        </div>
      </header>

      {/* MAIN BODY */}
      <main className="flex flex-1 flex-col sm:flex-row px-4 sm:px-8 md:px-16 py-5 sm:py-8 md:py-10 gap-5 sm:gap-8 md:gap-10">
        {loading ? (
          <div className="flex justify-center items-center flex-1 text-white">
            Loading assessment...
          </div>
        ) : sections.length === 0 ? (
          <div className="flex justify-center items-center flex-1 text-white text-center px-4">
            {viewOnly && !reviewUserId
              ? "This review link is missing a pastor user id."
              : "No sections available for this assessment."}
          </div>
        ) : (
          <>
            {/* LEFT PANEL */}
            <aside className="w-full sm:w-[300px] md:w-[340px] bg-white rounded-xl p-4 sm:p-6 shadow-lg h-auto sm:h-[500px] md:h-[550px]">
              <h2 className="text-[#0F1E44] text-base sm:text-lg font-semibold mb-4 sm:mb-6">
                {viewOnly ? "Sections" : "My Responses"}
              </h2>
              <div className="flex flex-col gap-3 sm:gap-4">
                {sections.map((sec, i) => (
                  <div
                    key={sec._id || sec.id || i}
                    onClick={() => setActiveSection(i)}
                    className={`rounded-xl border transition-all cursor-pointer ${activeSection === i
                      ? "bg-[#103C8C] text-white border-[#103C8C]"
                      : "bg-[#F7F9FC] text-[#0F1E44] border-[#E0E7F1]"
                      }`}
                  >
                    <div className="px-3 sm:px-4 py-2 sm:py-3">
                      <p
                        className={`text-xs sm:text-sm font-semibold mb-1 ${activeSection === i ? "text-white" : "text-[#103C8C]"
                          }`}
                      >
                        Section {i + 1}
                      </p>
                      <p
                        className={`text-xs leading-snug ${activeSection === i
                          ? "text-white/90"
                          : "text-[#0F1E44]/80"
                          }`}
                      >
                        {sec.name || sec.title || `Section ${i + 1}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </aside>

            {/* RIGHT PANEL */}
            <section className="flex-1">
              <p className="text-xs sm:text-sm leading-relaxed mb-4 sm:mb-6 max-w-full sm:max-w-2xl">
                Choose the option in each box that best matches how you feel and who
                you are. Your accuracy allows us to provide the best support and
                guidance.
              </p>

              <div className="space-y-4 sm:space-y-6 text-[13px] sm:text-[14px]">
                {sections[activeSection]?.layers?.map((layer: any, layerIndex: number) => {
                  const layerId = layer._id || `layer_${activeSection}_${layerIndex}`;
                  return (
                    <div
                      key={layerId}
                      className="border border-[#5A8DCB] rounded-md p-3 sm:p-4 space-y-2"
                    >
                      <h4 className="font-semibold mb-2 text-sm sm:text-base">
                        {layer.question || layer.title || sections[activeSection].name || sections[activeSection].title || "Question"}
                      </h4>

                      {layer.choices?.map((choice: any, ci: number) => {
                        const choiceKey = String(choice._id ?? choice.value ?? choice.label ?? `c_${ci}`);
                        const choiceLabel = choice.label ?? choice.text ?? String(choice.value ?? "");
                        const isChecked =
                          answers[layerId] === choiceKey ||
                          (choice.value != null && answers[layerId] === String(choice.value)) ||
                          (choice.label != null && answers[layerId] === String(choice.label));
                        return (
                          <label
                            key={`${layerId}-${choiceKey}-${ci}`}
                            className={`flex items-start gap-2 ${viewOnly ? "cursor-default" : "cursor-pointer"}`}
                          >
                            <input
                              type="radio"
                              name={layerId}
                              readOnly={viewOnly}
                              disabled={viewOnly}
                              checked={isChecked}
                              onChange={() => handleCheck(layerId, choiceKey)}
                              className="accent-[#FFD84E] w-3 h-3 sm:w-4 sm:h-4 mt-[2px]"
                            />

                            <span className="text-sm sm:text-base">{choiceLabel}</span>
                          </label>
                        );
                      })}
                    </div>
                  );
                })}
              </div>

              {/* Navigation */}
              <div className="flex flex-col sm:flex-row justify-between items-center mt-6 sm:mt-10 gap-4 sm:gap-0">
                <button
                  onClick={handlePrev}
                  disabled={activeSection === 0}
                  className={`border border-[#A6B8E8] text-[#E8ECFF] text-xs sm:text-sm font-medium px-4 sm:px-6 py-2 rounded-md ${activeSection === 0
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-[#103C8C]"
                    }`}
                >
                  <i className="fa-solid fa-angle-left mr-2"></i> View Previous
                  Section
                </button>

                {activeSection === sections.length - 1 ? (
                  viewOnly ? (
                    <button
                      type="button"
                      onClick={() => router.back()}
                      className="bg-[#103C8C] text-white text-xs sm:text-sm font-medium px-4 sm:px-6 py-2 rounded-md hover:bg-[#0B2E72]"
                    >
                      Done
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSubmitSurvey}
                      className="bg-[#103C8C] text-white text-xs sm:text-sm font-medium px-4 sm:px-6 py-2 rounded-md hover:bg-[#0B2E72]"
                    >
                      Submit Survey
                    </button>
                  )
                ) : (
                  <button
                    onClick={handleNext}
                    className="bg-[#103C8C] text-white text-xs sm:text-sm font-medium px-4 sm:px-6 py-2 rounded-md hover:bg-[#0B2E72]"
                  >
                    View Next Section <i className="fa-solid fa-angle-right ml-2"></i>
                  </button>
                )}
              </div>
            </section>
          </>
        )}
      </main>

      {/* ✅ New Popups & Side Drawer */}
      {showSubmitPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(2,16,30,0.72)] backdrop-blur-sm">
          <div className="flex items-center gap-3 rounded-2xl border border-[#8ec5eb]/30 bg-[linear-gradient(180deg,#0f4a76_0%,#0c3f66_100%)] px-10 py-6 text-white shadow-[0_20px_60px_rgba(2,20,38,0.55)]">
            <i className="fa-solid fa-circle-check text-[#7be495] text-2xl"></i>
            <p className="font-medium">Survey Submitted Successfully</p>
          </div>
        </div>
      )}

      {showSchedulePrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(2,16,30,0.72)] backdrop-blur-sm">
          <div className="w-[480px] rounded-2xl border border-[#8ec5eb]/30 bg-[linear-gradient(180deg,#0f4a76_0%,#0c3f66_100%)] px-10 py-8 text-center text-white shadow-[0_20px_60px_rgba(2,20,38,0.55)]">
            <p className="font-semibold text-lg mb-4">
              On completion of the PMP and CMA assessment tools please schedule
              a meeting with your mentor.
            </p>
            <button
              onClick={handleScheduleMeeting}
              className="rounded-xl bg-[#8ec5eb] px-8 py-2 text-sm font-semibold text-[#062946] transition hover:bg-[#a9d5f2]"
            >
              Schedule Meeting
            </button>
          </div>
        </div>
      )}

      {showMentorSidebar && (
        <div className="fixed inset-0 z-50 flex justify-end bg-[rgba(2,16,30,0.72)] backdrop-blur-sm">
          <div className="h-full w-[480px] overflow-y-auto border-l border-white/15 bg-[linear-gradient(180deg,#0d3e66_0%,#0a3457_100%)] p-8 text-white shadow-[-20px_0_50px_rgba(2,20,38,0.55)]">
            {mentorStep === 1 ? (
              <>
                <h2 className="text-xl font-semibold mb-6">
                  Choose Mentor for the Meeting
                </h2>
                {mentors.length === 0 ? (
                  <p className="text-[#cbe6f9]">No mentors assigned.</p>
                ) : (
                  mentors.map((mentor) => (
                    <div
                      key={mentor._id || mentor.id}
                      className="mb-3 flex cursor-pointer items-center justify-between rounded-xl border border-white/15 bg-white/5 p-3 transition hover:bg-white/10"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={mentor.profilePicture || "/user-avatar.png"}
                          alt="mentor"
                          className="w-8 h-8 rounded-full"
                        />
                        <div>
                          <p className="font-medium text-sm">{mentor.name || `${mentor.firstName || ''} ${mentor.lastName || ''}`.trim()}</p>
                          <p className="text-xs text-[#cbe6f9]">Mentor</p>
                        </div>
                      </div>
                      <input
                        type="radio"
                        name="mentor"
                        checked={selectedMentor === (mentor._id || mentor.id)}
                        onChange={() => setSelectedMentor(mentor._id || mentor.id)}
                      />
                    </div>
                  ))
                )}
                <div className="flex justify-end">
                  <button
                    onClick={() => setMentorStep(2)}
                    disabled={!selectedMentor || mentors.length === 0}
                    className={`rounded-xl px-6 py-2 text-sm font-semibold ${selectedMentor && mentors.length > 0 ? "bg-[#8ec5eb] text-[#062946] hover:bg-[#a9d5f2]" : "cursor-not-allowed bg-white/20 text-white/60"}`}
                  >
                    Next
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-xl font-semibold mb-6">
                  Schedule a Meeting
                </h2>
                {selectedMentor && (
                  <p className="mb-4 text-sm text-[#cbe6f9]">
                    Scheduling meeting with {mentors.find(m => (m._id || m.id) === selectedMentor)?.name || mentors.find(m => (m._id || m.id) === selectedMentor)?.firstName + " " + mentors.find(m => (m._id || m.id) === selectedMentor)?.lastName || "Selected Mentor"}
                  </p>
                )}
                <div className="mb-6">
                  <label className="block text-sm mb-2">
                    Select Available Date
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => {
                      const newDate = e.target.value;
                      setSelectedDate(newDate);
                      setSelectedTime(""); // Reset time when date changes
                      if (newDate) {
                        const dateObj = new Date(newDate);
                        const newYear = dateObj.getFullYear();
                        const newMonth = dateObj.getMonth() + 1;
                        if (newYear !== currentYear || newMonth !== currentMonth) {
                          setCurrentYear(newYear);
                          setCurrentMonth(newMonth);
                        }
                      }
                    }}
                    className="w-full rounded-xl border border-white/20 bg-white/5 p-2 text-white outline-none focus:border-[#8ec5eb]"
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-sm mb-2">Select Time</label>
                  <div className="grid grid-cols-2 gap-2">
                    {availableTimes.map((t, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedTime(t)}
                        className={`rounded-xl border py-2 text-sm transition ${selectedTime === t ? "border-[#8ec5eb] bg-[#8ec5eb]/20 text-white" : "border-white/20 bg-white/5 text-[#d8ecfa] hover:bg-white/10"}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                  {selectedDate && availableTimes.length === 0 && (
                    <p className="mt-2 text-sm text-[#cbe6f9]">No available times for this date.</p>
                  )}
                </div>
                <div className="flex justify-between">
                  <button
                    onClick={() => {
                      setMentorStep(1);
                      setSelectedDate("");
                      setSelectedTime("");
                      setAvailableTimes([]);
                    }}
                    className="rounded-xl border border-white/30 px-5 py-2 text-[#d8ecfa] transition hover:bg-white/10"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleFinalSchedule}
                    disabled={!selectedDate || !selectedTime}
                    className={`rounded-xl px-6 py-2 text-sm font-semibold ${selectedDate && selectedTime ? "bg-[#8ec5eb] text-[#062946] hover:bg-[#a9d5f2]" : "cursor-not-allowed bg-white/20 text-white/60"}`}
                  >
                    Schedule
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {showFinalPopup && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[rgba(2,16,30,0.72)] backdrop-blur-sm">
          <div className="flex items-center gap-3 rounded-2xl border border-[#8ec5eb]/30 bg-[linear-gradient(180deg,#0f4a76_0%,#0c3f66_100%)] px-10 py-6 text-white shadow-[0_20px_60px_rgba(2,20,38,0.55)]">
            <i className="fa-solid fa-circle-check text-[#7be495] text-2xl"></i>
            <p className="font-medium">New Appointment has been Scheduled</p>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-8 right-8 z-[70] animate-fade-in">
          <div className="flex items-center gap-3 rounded-xl border border-[#8ec5eb]/30 bg-[linear-gradient(180deg,#0f4a76_0%,#0c3f66_100%)] px-6 py-4 shadow-2xl">
            <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#d95d5d]">
              <i className="fa-solid fa-exclamation-triangle text-white text-xs"></i>
            </div>
            <span className="font-semibold text-white">{toast}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PastorSurveyCMA() {
  return (
    <Suspense fallback={<div className="text-white p-10">Loading...</div>}>
      <PastorSurveyCMAContent />
    </Suspense>
  );
}
