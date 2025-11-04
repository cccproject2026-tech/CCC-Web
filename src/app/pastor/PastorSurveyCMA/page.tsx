"use client";
import { useState } from "react";
import "@fortawesome/fontawesome-free/css/all.min.css";
import headerBg from "../../Assets/CMA-hero-bg.png";
import { useRouter } from "next/navigation"; // ✅ Added for navigation

export default function PastorSurveyCMA() {
  const [activeSection, setActiveSection] = useState(0);
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const router = useRouter(); // ✅ Router instance

  // ✅ Added new state for submit & schedule popup flow
  const [showSubmitPopup, setShowSubmitPopup] = useState(false);
  const [showSchedulePrompt, setShowSchedulePrompt] = useState(false);
  const [showMentorSidebar, setShowMentorSidebar] = useState(false);
  const [mentorStep, setMentorStep] = useState(1);
  const [showFinalPopup, setShowFinalPopup] = useState(false);

  const handleCheck = (key: string) =>
    setAnswers((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleNext = () => {
    if (activeSection < sections.length - 1)
      setActiveSection((prev) => prev + 1);
  };
  const handlePrev = () => {
    if (activeSection > 0) setActiveSection((prev) => prev - 1);
  };

  // ✅ New Submit Flow
  const handleSubmitSurvey = () => {
    setShowSubmitPopup(true);
    setTimeout(() => {
      setShowSubmitPopup(false);
      setShowSchedulePrompt(true);
    }, 2500);
  };
  const handleScheduleMeeting = () => {
    setShowSchedulePrompt(false);
    setShowMentorSidebar(true);
  };
  const handleFinalSchedule = () => {
    setShowFinalPopup(true);
    setTimeout(() => {
      setShowFinalPopup(false);
      router.push("/pastor/AssessmentEvaluation");
    }, 2500);
  };

  // ✅ Sections 1–5 (kept 100% original)
  const sections = [
    {
      title:
        "Congregational Well being (biopsychosocial(BPS)/financial/spiritual filter)",
      questions: [
        {
          title: "Congregational age trend",
          options: [
            "The church has been aging for the last twenty years.",
            "The average age of church members is significantly higher than the surrounding community.",
            "The average age of the church has been declining for the last 3–5 years but membership has been on the rise.",
            "The church exhibits diversity of generations in attendance and community engagement (CE).",
          ],
        },
        {
          title: "Attendance and membership health",
          options: [
            "Many members are home bound due to illness.",
            "Church attendance has been dwindling, especially younger people.",
            "The church’s attendance has been increasing for the last three years.",
            "The congregation has grown significantly younger in the last few years.",
          ],
        },
        {
          title: "Geographic spread of members",
          options: [
            "Most of the members commute to the church 10+ miles.",
            "At least ½ of the church commutes 10+ miles.",
            "At least one half of the church members live within 10 miles of the church.",
            "The majority of church members live within 10 miles of the church.",
          ],
        },
        {
          title: "Weddings vs funerals balance",
          options: [
            "There are more funerals than weddings and child dedications.",
            "There has been about the same number of weddings and child dedications as funerals.",
            "In the last few years, there have been more weddings and child dedications than funerals.",
            "There are child dedications and weddings taking place almost every month.",
          ],
        },
        {
          title: "Volunteer participation (10/90 rule)",
          options: [
            "Many members feel burnt out (10/90 rule).",
            "The 10/90 rule of volunteer participation is very evident.",
            "The congregational volunteer participation ratio is about 20/80.",
            "The congregational volunteer participation is about 50%—at least half of members volunteer somewhere.",
          ],
        },
        {
          title: "Leadership feedback climate",
          options: [
            "Leaders hear a lot of complaints about the church and its leadership.",
            "Members are concerned about the future of the church.",
            "Members and attendees feel hopeful about the future of the church.",
            "Members and attendees are excited inviting friends to church services or events.",
          ],
        },
      ],
    },
    {
      title: "Leadership (Elders, CB, etc.) Style",
      questions: [
        {
          title: "CB focus and ministry orientation",
          options: [
            "The CB spends most of its time and energy focusing on operations instead of ministries or evangelism.",
            "The CB dedicates at least ½ its time and energy discussing ways to demonstrate Christ to neighboring communities.",
            "The CB dedicates most of its time and efforts to transformative methods of evangelism (CMA).",
          ],
        },
        {
          title: "CB meeting climate",
          options: [
            "The CB meetings are tense, reflecting divisions in the church.",
            "The CB meetings feel formal and uninspiring.",
            "The CB meetings always keep in mind the church’s vision and mission.",
            "The CB meetings are full of energy and grace—the board members look forward to spending time with one another.",
          ],
        },
        {
          title: "CB unity and representation",
          options: [
            "The CB is not representative of all of the church’s constituencies, and its members don’t share the same vision & mission.",
            "Not all CB members are subscribed to the church’s vision and mission.",
            "The CB is united regarding the church’s vision and mission.",
            "All board members are on the same page regarding the church’s vision and mission and have developed a CB playbook (practical implementation).",
          ],
        },
        {
          title: "Leadership representation & focus",
          options: [
            "The elders spend most of their time 'putting out fires'.",
            "The CB is not representative of younger members of the congregation.",
            "At least half of the church’s life is oriented toward serving the community.",
            "The overall focus of the leadership is directed toward transformative presence in the community.",
          ],
        },
      ],
    },
    {
      title: "Community Engagement History",
      questions: [
        {
          title: "CMA partnerships & understanding",
          options: [
            "The church has no consistent partnerships with non-Adventist organizations.",
            "Church does not fully understand the CMA approach in relationship to evangelism.",
            "The congregation fully embraces the CMA approach in ministry and evangelism.",
            "The church fully implements the CMA approach in all areas of its life— inwardly and outwardly.",
          ],
        },
        {
          title: "Community collaboration & outreach",
          options: [
            "The church solely focuses on addressing the needs of its members.",
            "Some sporadic relationships with local community influencers and players.",
            "The church conspicuously participates in the community life outside of the church.",
            "The church has a designated leadership role for organizing community life outside of the church—this leader conducts formal training classes/workshops on CE for other churches.",
          ],
        },
        {
          title: "Focus of community service",
          options: [
            "The church is too focused on addressing the needs of its members & does not participate in community engagement.",
            "The community services feel more like proselytizing through distribution of goods than fostering relationships.",
            "The community services provide ample volunteer opportunities for people outside of the church.",
            "Many unchurched community-service volunteers become interested in the life of the church.",
          ],
        },
        {
          title: "Church–community awareness",
          options: [
            "Church members can’t accurately name the most pressing community issues in the surrounding area.",
            "Only very few of the church’s members participate in the life of the community outside of the church.",
            "The church has good relationships with local businesses; a few church members hold prominent leadership roles in community service organizations outside the church.",
            "Engaged in joint ventures with local businesses, government entities, and other non-profits.",
          ],
        },
        {
          title: "Education partnerships",
          options: [
            "No active partnerships exist with neighboring educational institutions.",
            "Only a few students and faculty members from neighboring higher education institutions participate in the life of church.",
            "The church actively engages students and faculty from local higher education institutions.",
            "The church has formal partnerships/joint projects with neighboring higher education institutions.",
          ],
        },
        {
          title: "Community perception of the church",
          options: [
            "Neighbors have no knowledge or hold a negative view of the church.",
            "Neighbors barely recognize/are only vaguely aware of the church.",
            "Many neighbors are aware and hold a positive view of the church.",
            "The church does not see itself existing without being actively present in the lives of its neighbors.",
          ],
        },
      ],
    },
    {
      title: "Pastoral Leadership",
      questions: [
        {
          title: "Pastor–church relationship",
          options: [
            "The pastor feels they have to speak at (confronting) the congregation rather than for (inspiring) the congregation.",
            "The pastor feels they have to constantly mediate between factions at the church.",
            "The pastor spends most of their time empowering church leaders.",
            "The pastor spends most of their time mentoring and being mentored.",
          ],
        },
        {
          title: "Pastor support and team dynamics",
          options: [
            "The pastor doesn’t feel supported by the majority of the church leaders.",
            "Church members feel like the pastor is apathetic—it feels like the pastor does only what is required to tick off church metrics but their heart and soul do pastoral ministry.",
            "The church members feel the positive energy and passion exhibited by the pastor.",
            "The pastor inspires and leads other pastors and partners in community-transformation initiatives and projects.",
          ],
        },
        {
          title: "Pastor engagement and time usage",
          options: [
            "The pastor does not spend personal time with all of the church’s leaders, only engages those with whom they feel safe.",
            "The pastor interacts with a limited number of people.",
            "The pastor consistently seeks new ways to integrate CMA approach in their ministry; however, they do most of the work by themselves.",
            "The pastor is an exemplar of the CMA approach—they cultivate open, trusting, and nurturing social environments—always acknowledging opportunities for growth and celebrating achievements.",
          ],
        },
        {
          title: "Pastor’s focus and priorities",
          options: [
            "The most of the pastor’s time is spent on dealing with internal issues and conflicts.",
            "The pastor spends at least 75% of their time dealing with the internal church issues and conflicts.",
            "The pastor is intentional (dedicating at least 25% of their time) about fostering relationships within the church’s formal and informal leaders—they live very little socially in the church.",
            "The pastor is deeply involved in the life of the surrounding community, developing pastoral accountability circles inside and outside of church—they are accountable to lay members and denominational leadership while advising them on the issues of leadership and spiritual personal growth.",
          ],
        },
        {
          title: "Pastor’s community engagement",
          options: [
            "The pastor doesn’t have any formal community engagement/services training/certification.",
            "Very limited community engagement/services training/certification.",
            "The pastor is enrolled to obtain formal training in the area of CE.",
            "The pastor trains other pastors and leaders in the area of CE through the CMA.",
          ],
        },
        {
          title: "Pastor’s church growth vision",
          options: [
            "The pastor doesn’t have a clear church growth strategy.",
            "The pastor has a vision for the church but doesn’t have energy or support to adequately enact it.",
            "The pastor consistently makes efforts to communicate the church’s vision and mission in the light of the CMA.",
            "The pastor is committed to encompassing CMA and the Cycle of Evangelism.",
          ],
        },
        {
          title: "Preaching and motivation style",
          options: [
            "Preaching can be described as uninspiring and mostly moralistic (propositional and patronizing).",
            "Preaching can be described as 'speaking at (confronting)' people rather than 'for (inspiring)' the people.",
            "Preaching is Christ-centered, inspiring, and transformational rather than moralistic and prescriptive; the pastor speaks for the people, expressing a deep understanding of the needs of the community.",
            "Preaching intentionally incorporates the CMA and CE principles; the pastor raises and equips other pastors in the Christ-centered manner.",
          ],
        },
        {
          title: "Pastor’s calling and motivation",
          options: [
            "If called somewhere else the pastor would leave the church without hesitation.",
            "If called somewhere else the pastor would give it serious consideration.",
            "The pastor shows deep care for church leaders and community stakeholders.",
            "The pastor can’t see themselves being anywhere else but with the church and the community in which they currently serve.",
          ],
        },
      ],
    },
    {
      title: "Christ’s Method Alone (CMA) and Cycle of Evangelism",
      questions: [
        {
          title: "Understanding and practice of CMA",
          options: [
            "CMA is not embodied in the life of the church",
            "Church does not fully understanding the CMA approach in relationship to evangelism",
            "Congregation has a good grasp but has not fully implemented practices of CMA",
            "The church is fully committed to and practices the CMA approach",
          ],
        },
        {
          title: "Evangelism and community integration",
          options: [
            "Little variety in methods of evangelism over the last twenty years",
            "There is no connection between evangelism efforts and the community engagement",
            "The church sees CE as a transformative form of evangelism rather than a transactional activity",
            "The church has a clear plan for further growth and transformative development",
          ],
        },
        {
          title: "Service and mission alignment",
          options: [
            "Serving the community is not considered to be the focus of the church’s life and ministries",
            "Only a few members see the vitality of the service to the community as an integral part of evangelistic foci",
            "The church members share a vision of embodying CMA as the future of church",
            "The church is networked with other congregations, which embody the CMA as its primary guiding principle",
          ],
        },
        {
          title: "Community awareness and CE plan",
          options: [
            "The church has no functional awareness of the surrounding community’s needs",
            "The church has only observed some of the community’s needs",
            "The church has surveyed the community, assessing its needs and aspirations",
            "The church has a practical CE plan for serving its community",
          ],
        },
      ],
    },
  ];

  // ✅ Original return kept intact
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#1B5F9E] to-[#0D3971] text-white relative">
      {/* HEADER */}
      <header
        className="relative flex items-center px-16 py-10 bg-cover bg-no-repeat text-white h-[200px]"
        style={{
          backgroundImage: `url(${headerBg.src})`,
          backgroundPosition: "120% center",
          backgroundSize: "cover",
        }}
      >
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10 mt-7">
          <h2 className="text-3xl font-bold">
            Church Assessment Evaluation (CMA)
          </h2>
          <p className="text-sm mt-2 text-white/85 max-w-md">
            This Survey is about Lorem ipsum dolor sit amet, consectetur
          </p>
        </div>
      </header>

      {/* MAIN BODY */}
      <main className="flex flex-1 px-16 py-10 gap-10">
        {/* LEFT PANEL */}
        <aside className="w-[340px] bg-white rounded-xl p-6 shadow-lg h-[550px]">
          <h2 className="text-[#0F1E44] text-lg font-semibold mb-6">
            My Responses
          </h2>
          <div className="flex flex-col gap-4">
            {sections.map((sec, i) => (
              <div
                key={i}
                onClick={() => setActiveSection(i)}
                className={`rounded-xl border transition-all cursor-pointer ${
                  activeSection === i
                    ? "bg-[#103C8C] text-white border-[#103C8C]"
                    : "bg-[#F7F9FC] text-[#0F1E44] border-[#E0E7F1]"
                }`}
              >
                <div className="px-4 py-3">
                  <p
                    className={`text-sm font-semibold mb-1 ${
                      activeSection === i ? "text-white" : "text-[#103C8C]"
                    }`}
                  >
                    Section {i + 1}
                  </p>
                  <p
                    className={`text-xs leading-snug ${
                      activeSection === i
                        ? "text-white/90"
                        : "text-[#0F1E44]/80"
                    }`}
                  >
                    {sec.title}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* RIGHT PANEL */}
        <section className="flex-1">
          <p className="text-sm leading-relaxed mb-6 max-w-2xl">
            Choose the option in each box that best matches how you feel and who
            you are. Your accuracy allows us to provide the best support and
            guidance.
          </p>

          <div className="space-y-6 text-[14px]">
            {sections[activeSection].questions.map((q, qi) => (
              <div
                key={qi}
                className="border border-[#5A8DCB] rounded-md p-4 space-y-2"
              >
                <h4 className="font-semibold mb-2">{q.title}</h4>
                {q.options.map((opt, oi) => {
                  const key = `${activeSection}-${qi}-${oi}`;
                  return (
                    <label
                      key={oi}
                      className="flex items-start gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={!!answers[key]}
                        onChange={() => handleCheck(key)}
                        className="accent-[#FFD84E] w-4 h-4 mt-[2px]"
                      />
                      <span className="leading-snug">{opt}</span>
                    </label>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center mt-10">
            <button
              onClick={handlePrev}
              disabled={activeSection === 0}
              className={`border border-[#A6B8E8] text-[#E8ECFF] text-sm font-medium px-6 py-2 rounded-md ${
                activeSection === 0
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-[#103C8C]"
              }`}
            >
              <i className="fa-solid fa-angle-left mr-2"></i> View Previous
              Section
            </button>

            {activeSection === sections.length - 1 ? (
              <button
                onClick={handleSubmitSurvey}
                className="bg-[#103C8C] hover:bg-[#0B2E72] text-white text-sm font-medium px-6 py-2 rounded-md"
              >
                Submit Survey
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="bg-[#103C8C] text-white text-sm font-medium px-6 py-2 rounded-md"
              >
                View Next Section{" "}
                <i className="fa-solid fa-angle-right ml-2"></i>
              </button>
            )}
          </div>
        </section>
      </main>

      {/* ✅ New Popups & Side Drawer */}
      {showSubmitPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <div className="bg-white text-[#0F1E44] px-10 py-6 rounded-xl shadow-lg flex items-center gap-3">
            <i className="fa-solid fa-circle-check text-green-500 text-2xl"></i>
            <p className="font-medium">Survey Submitted Successfully</p>
          </div>
        </div>
      )}

      {showSchedulePrompt && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <div className="bg-white text-[#0F1E44] px-10 py-8 rounded-xl text-center w-[480px] shadow-lg">
            <p className="font-semibold text-lg mb-4">
              On completion of the PMP and CMA assessment tools please schedule
              a meeting with your mentor.
            </p>
            <button
              onClick={handleScheduleMeeting}
              className="bg-[#103C8C] text-white text-sm font-medium px-8 py-2 rounded-md hover:bg-[#0B2E72]"
            >
              Schedule Meeting
            </button>
          </div>
        </div>
      )}

      {showMentorSidebar && (
        <div className="fixed inset-0 flex justify-end bg-black/40 z-50">
          <div className="bg-white text-[#0F1E44] w-[480px] h-full p-8 overflow-y-auto">
            {mentorStep === 1 ? (
              <>
                <h2 className="text-xl font-semibold mb-6">
                  Choose Mentor for the Meeting
                </h2>
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between border border-gray-200 rounded-md p-3 mb-3 cursor-pointer hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src="/user-avatar.png"
                        alt="mentor"
                        className="w-8 h-8 rounded-full"
                      />
                      <div>
                        <p className="font-medium text-sm">John Ross</p>
                        <p className="text-xs text-gray-500">Mentor</p>
                      </div>
                    </div>
                    <input type="radio" name="mentor" defaultChecked={i === 0} />
                  </div>
                ))}
                <div className="flex justify-end">
                  <button
                    onClick={() => setMentorStep(2)}
                    className="bg-[#103C8C] text-white px-6 py-2 rounded-md"
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
                <div className="mb-6">
                  <label className="block text-sm mb-2">
                    Select Available Date
                  </label>
                  <input
                    type="date"
                    className="border border-gray-300 rounded-md p-2 w-full"
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-sm mb-2">Select Time</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      "09:00 am – 10:00 am",
                      "11:00 am – 12:00 pm",
                      "01:00 pm – 02:00 pm",
                      "03:00 pm – 04:00 pm",
                    ].map((t, i) => (
                      <button
                        key={i}
                        className="border border-gray-300 rounded-md py-2 text-sm hover:bg-gray-100"
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex justify-between">
                  <button
                    onClick={() => setMentorStep(1)}
                    className="border border-gray-300 px-5 py-2 rounded-md"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleFinalSchedule}
                    className="bg-[#103C8C] text-white px-6 py-2 rounded-md"
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
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-[60]">
          <div className="bg-white text-[#0F1E44] px-10 py-6 rounded-xl shadow-lg flex items-center gap-3">
            <i className="fa-solid fa-circle-check text-green-500 text-2xl"></i>
            <p className="font-medium">New Appointment has been Scheduled</p>
          </div>
        </div>
      )}
    </div>
  );
}
