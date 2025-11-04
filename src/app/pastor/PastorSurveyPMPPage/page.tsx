"use client";
import { useState } from "react";
import "@fortawesome/fontawesome-free/css/all.min.css";

export default function PastorSurveyPMPPage() {
  const [activeSection, setActiveSection] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showMeeting, setShowMeeting] = useState(false);
  const [showMentorSidebar, setShowMentorSidebar] = useState(false);
  const [showScheduleSidebar, setShowScheduleSidebar] = useState(false);
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState("");

  const sections = [
    "Personal Well-Being",
    "Professional Development / Leadership Style",
    "Community Engagement (CE) Experience",
    "Congregational Health",
    "Continuing Education",
  ];

  const handleClear = () => {
    document
      .querySelectorAll<HTMLInputElement>('input[type="checkbox"]')
      .forEach((cb) => (cb.checked = false));
  };

  const handleNext = () => {
    if (activeSection < sections.length) setActiveSection(activeSection + 1);
    else {
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setShowMeeting(true);
      }, 4000);
    }
  };

  const handleScheduleClick = () => {
    setShowMeeting(false);
    setShowMentorSidebar(true);
  };

  const handleMentorNext = () => {
    if (selectedMentor) {
      setShowMentorSidebar(false);
      setShowScheduleSidebar(true);
    }
  };

  const handleFinalSchedule = () => {
    setShowScheduleSidebar(false);
    setShowConfirmPopup(true);
    setTimeout(() => setShowConfirmPopup(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1B5F9E] to-[#0D3971] flex flex-col text-white relative transition-all duration-300">
      {/* MAIN CONTENT */}
      <main className="flex flex-1 px-12 py-10 gap-10">
        {/* LEFT TIMELINE */}
        <aside className="relative w-[300px] flex flex-col gap-5 h-[400px]">
          <div className="absolute left-[10px] top-6 bottom-6 w-[2px] bg-gradient-to-b from-[#B3D3F8] to-[#2C6DCC]" />
          {sections.map((title, index) => (
            <div
              key={index}
              onClick={() => setActiveSection(index + 1)}
              className="relative flex items-start gap-3 cursor-pointer transition-all"
            >
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-4 ${
                  activeSection === index + 1
                    ? "border-[#FFD84E] bg-[#FFD84E]"
                    : activeSection > index + 1
                    ? "border-[#65D26E] bg-[#65D26E]"
                    : "border-[#6FA8F6] bg-[#103C8C]/30"
                }`}
              >
                {activeSection === index + 1 || activeSection > index + 1 ? (
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                ) : null}
              </div>

              <div
                className={`flex-1 border rounded-lg px-4 py-3 transition-all ${
                  activeSection === index + 1
                    ? "bg-[#103C8C] border-[#103C8C]"
                    : "bg-[#FFFFFF]/10 border-[#3C75C0]/40 hover:bg-[#123E88]/40"
                }`}
              >
                <p className="text-sm font-semibold">{`Section ${index + 1}`}</p>
                <p className="text-xs text-white/80">{title}</p>
              </div>
            </div>
          ))}
        </aside>

        {/* RIGHT CONTENT */}
        <section
          key={activeSection}
          className="flex-1 bg-transparent rounded-lg p-2 overflow-y-auto transition-all duration-500"
        >
          <p className="text-sm text-white/90 mb-6 leading-relaxed">
            Choose the option in each box that best matches how you feel and who
            you are, as this self-assessment helps you understand yourself
            better. Your accuracy allows us to provide the best support and
            guidance.
          </p>
          <hr className="border-t border-white/40 mb-8" />

          {/* SECTION 1 */}
          {activeSection === 1 && (
            <div className="space-y-6 text-[14px]">
              <QuestionBlock
                title="Feeling physically drained most of the time."
                options={[
                  "Often feeling drained",
                  "Feeling motivated and enjoying life",
                ]}
              />
              <QuestionBlock
                title="Physical activity"
                options={[
                  "Not physically active",
                  "Occasional exercise",
                  "Committed to an exercise plan",
                ]}
              />
              <QuestionBlock
                title="Perception of mental well-being"
                options={[
                  "Constant experiences of exhaustion/anxiety",
                  "Thinking about getting professional help to deal with stress",
                  "Working with a mental health professional",
                  "Demonstrating high EI – consistent routine for maintaining strong mental health",
                ]}
              />
              <QuestionBlock
                title="Handling personal & relational challenges"
                options={[
                  "Significant marital/parental challenges",
                  "Experiencing relational challenges",
                  "Actively engaged in family life, prioritizing responsibility",
                ]}
              />
            </div>
          )}

          {/* SECTION 2 */}
          {activeSection === 2 && (
            <div className="space-y-6 text-[14px]">
              <QuestionBlock
                title="Sense of pastoral ministry and leadership"
                options={[
                  "Lost a sense of call to pastoral ministry—considering other careers",
                  "Not sure if serving at faith community that fits",
                  "Mostly feeling connected with assigned congregation",
                  "Finds joy in working with church and community leaders",
                ]}
              />
              <QuestionBlock
                title="Emotional well-being in ministry"
                options={[
                  "Feeling burned out—resentment toward ministry work",
                  "Performing only required tasks without enthusiasm",
                  "Excited to offer skills and expertise in ministry",
                  "Provides CE guidance inside and outside the congregation",
                ]}
              />
              <QuestionBlock
                title="Trust and collaboration in leadership"
                options={[
                  "Feeling cynical, distrusting self or others",
                  "Not trusting local church leaders",
                  "Working confidently with local leaders, finding it rewarding",
                  "Raising the next generation of church leaders",
                ]}
              />
              <QuestionBlock
                title="Mentorship and growth"
                options={[
                  "Not sure of personal strengths and growth areas",
                  "Seeking mentorship to address growth areas",
                  "Having accountability for leadership skills",
                  "Reflecting regularly on personal & professional skills",
                ]}
              />
            </div>
          )}

          {/* SECTION 3 */}
          {activeSection === 3 && (
            <div className="space-y-6 text-[14px]">
              <QuestionBlock
                title="CMA Ministry Approach"
                options={[
                  "Unfamiliar with the CMA ministry concept",
                  "Not fully understanding but approaching the CMA method in evangelism",
                  "Fully embraces the CMA approach to ministry and evangelism",
                  "Fully implements the CMA approach in all areas of life—inside and outside the church",
                ]}
              />
              <QuestionBlock
                title="Community Collaborations"
                options={[
                  "No collaborations with outside community players",
                  "Some relationships with local community influencers and players",
                  "Actively participating in the community life outside of the church",
                  "Holds a leadership role in the community life outside of the church",
                ]}
              />
              <QuestionBlock
                title="CE Leadership"
                options={[
                  "Occasional participation but no strategic leadership in CE initiatives",
                  "Formal support but not active strategic leadership in the church’s CE efforts",
                  "Prominent leadership role in CE ministries at home congregation",
                  "Conducts formal training classes/workshops in the area of CE for other ministry leaders",
                ]}
              />
            </div>
          )}

          {/* SECTION 4 */}
          {activeSection === 4 && (
            <div className="space-y-6 text-[14px]">
              <QuestionBlock
                title="Vision & Mission"
                options={[
                  "Membership/attendance is in decline",
                  "Vision unclear—no written statements",
                  "Has clear vision and mission statements",
                  "Consistently embodies the church’s mission and vision statements",
                ]}
              />
              <QuestionBlock
                title="Congregational Health"
                options={[
                  "The average age of the church is above 60",
                  "Experiencing congregational grief",
                  "Has shown signs of steady growth and sustainability",
                  "Growing younger as a congregation",
                ]}
              />
              <QuestionBlock
                title="Church Culture"
                options={[
                  "Many inactive members",
                  "Strong unity—promotes spiritual growth and empathy",
                  "Recognized for holistic communal transformation",
                ]}
              />
              <QuestionBlock
                title="Leadership Presence"
                options={[
                  "Absence of CE leaders/educators",
                  "Actively engages with CE ministry leaders",
                  "Shows strong care for leaders and members",
                ]}
              />
            </div>
          )}

          {/* SECTION 5 */}
          {activeSection === 5 && (
            <div className="space-y-6 text-[14px]">
              <QuestionBlock
                title="Community Engagement / Certification"
                options={[
                  "No formal community engagement/training certification",
                  "Some community engagement/services training – no certification",
                  "Completed formal training/certification in the area of CE",
                  "Teaches and supports others in the area of CE",
                ]}
              />
              <QuestionBlock
                title="Educational Achievement"
                options={[
                  "Master’s degree in a ministry-related field",
                  "Has fulfilled all requirements for pastoral ordination",
                  "Holding/finishing an advanced graduate degree relevant to ministry",
                  "Has a learning plan for post-graduate educational development",
                ]}
              />
              <QuestionBlock
                title="Continuing Education"
                options={[
                  "No current continuing education enrollment",
                  "Additional education relevant to community engagement",
                  "Continuing formal/self-education in the field of CE",
                  "Diverse cultural awareness and language skills",
                ]}
              />
              <QuestionBlock
                title="Cultural Awareness"
                options={[
                  "Limited cultural/language proficiency",
                  "Thinking about pursuing another educational goal",
                  "Developing cultural awareness via self-organized plans",
                  "Teaches and mentors others in cultural awareness and change",
                ]}
              />
            </div>
          )}

          {/* BUTTONS */}
          <div className="flex justify-end gap-4 mt-10">
            <button
              onClick={handleClear}
              className="bg-transparent border border-[#A6B8E8] hover:bg-[#103C8C] text-[#E8ECFF] text-sm px-5 py-2 rounded-md"
            >
              Clear Responses
            </button>
            <button
              onClick={handleNext}
              className="bg-[#103C8C] hover:bg-[#0B2E72] text-white text-sm px-6 py-2 rounded-md"
            >
              {activeSection === 5 ? "Submit Survey" : "Next Section"}
            </button>
          </div>
        </section>
      </main>

      {/* ✅ SUCCESS POPUP */}
      {showSuccess && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <div className="bg-white rounded-xl shadow-lg px-8 py-6 flex items-center gap-3 animate-fadeIn">
            <div className="bg-[#4ADE80] rounded-full p-2 flex items-center justify-center">
              <i className="fa-solid fa-check text-white text-lg"></i>
            </div>
            <h3 className="text-[#165A92] font-semibold text-lg">
              Survey Uploaded Successfully
            </h3>
          </div>
        </div>
      )}

      {/* ✅ MEETING POPUP */}
      {showMeeting && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <div className="bg-white rounded-xl shadow-lg w-[90%] max-w-[500px] text-center p-8 animate-fadeIn">
            <p className="text-[#0B1C58] text-[15px] font-medium leading-relaxed mb-6">
              On completion of the PMP and CMA assessment tools please schedule
              a meeting with your mentor.
            </p>
            <button
              onClick={handleScheduleClick}
              className="bg-[#103C8C] hover:bg-[#0B2E72] text-white text-sm font-medium px-6 py-2 rounded-md shadow-sm"
            >
              Schedule Meeting
            </button>
          </div>
        </div>
      )}

      {/* ✅ MENTOR SIDEBAR */}
      {showMentorSidebar && (
        <MentorSidebar
          selectedMentor={selectedMentor}
          setSelectedMentor={setSelectedMentor}
          handleMentorNext={handleMentorNext}
        />
      )}

      {/* ✅ SCHEDULE SIDEBAR */}
      {showScheduleSidebar && (
        <ScheduleSidebar
          handleFinalSchedule={handleFinalSchedule}
          setShowScheduleSidebar={setShowScheduleSidebar}
          setShowMentorSidebar={setShowMentorSidebar}
        />
      )}

      {/* ✅ CONFIRM POPUP */}
      {showConfirmPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-lg px-10 py-6 flex items-center gap-3">
            <div className="bg-[#4ADE80] rounded-full p-2 flex items-center justify-center">
              <i className="fa-solid fa-check text-white text-lg"></i>
            </div>
            <h3 className="text-[#165A92] font-semibold text-lg">
              New Appointment has been Scheduled
            </h3>
          </div>
        </div>
      )}
    </div>
  );
}

/* 🔹 Reusable Question Block Component */
function QuestionBlock({ title, options }: { title: string; options: string[] }) {
  return (
    <div className="border border-[#5A8DCB] rounded-md p-4 mb-4">
      <h4 className="font-semibold mb-2">{title}</h4>
      {options.map((opt, i) => (
        <label key={i} className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" className="accent-[#FFD84E] w-4 h-4" />
          <span>{opt}</span>
        </label>
      ))}
    </div>
  );
}

/* 🔹 Mentor Sidebar Component */
function MentorSidebar({ selectedMentor, setSelectedMentor, handleMentorNext }: { selectedMentor: string | null; setSelectedMentor: (value: string) => void; handleMentorNext: () => void }) {
  return (
    <div className="fixed right-0 top-0 w-[400px] h-full bg-white shadow-2xl z-50 animate-slideIn flex flex-col">
      <div className="p-6 border-b">
        <h2 className="text-[#0B1C58] text-xl font-semibold">
          Choose Mentor for the Meeting
        </h2>
        <input
          type="text"
          placeholder="Search"
          className="w-full mt-4 p-2 border border-gray-300 rounded-md focus:outline-none"
        />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <label
            key={i}
            className={`flex items-center gap-3 p-3 border rounded-md cursor-pointer transition-all ${
              selectedMentor === `Mentor ${i}`
                ? "border-[#103C8C] bg-[#F5F8FF]"
                : "border-gray-200 hover:bg-gray-50"
            }`}
          >
            <input
              type="radio"
              name="mentor"
              checked={selectedMentor === `Mentor ${i}`}
              onChange={() => setSelectedMentor(`Mentor ${i}`)}
            />
            <img
              src="https://i.pravatar.cc/40?img=8"
              className="w-10 h-10 rounded-full"
            />
            <div>
              <p className="text-[#0B1C58] font-medium">John Ross</p>
              <p className="text-gray-500 text-sm">
                {i % 2 === 0 ? "Mentor" : "Field Mentor"}
              </p>
            </div>
          </label>
        ))}
      </div>

      <div className="p-4 border-t">
        <button
          onClick={handleMentorNext}
          disabled={!selectedMentor}
          className={`w-full py-2 rounded-md text-white font-medium ${
            selectedMentor
              ? "bg-[#103C8C] hover:bg-[#0B2E72]"
              : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          Next
        </button>
      </div>
    </div>
  );
}

/* 🔹 Schedule Sidebar Component */
function ScheduleSidebar({
  handleFinalSchedule,
  setShowScheduleSidebar,
  setShowMentorSidebar,
}: { handleFinalSchedule: () => void; setShowScheduleSidebar: (value: boolean) => void; setShowMentorSidebar: (value: boolean) => void }) {
  return (
    <div className="fixed right-0 top-0 w-[400px] h-full bg-white shadow-2xl z-50 animate-slideIn flex flex-col">
      <div className="p-6 border-b flex items-center gap-3">
        <i className="fa-regular fa-calendar text-[#103C8C] text-lg"></i>
        <h2 className="text-[#0B1C58] text-xl font-semibold">
          Schedule a Meeting
        </h2>
      </div>

      <div className="p-5 overflow-y-auto flex-1">
        <p className="text-[#0B1C58] text-sm font-medium mb-2">
          Select Available Date
        </p>
        <div className="bg-[#0D3971]/10 rounded-lg p-4 text-center text-[#0B1C58] font-semibold mb-6">
                   August 2024 (Static Calendar Placeholder)
        </div>

        <p className="text-[#0B1C58] text-sm font-medium mb-2">
          Select a Time
        </p>
        <div className="grid grid-cols-2 gap-3 mb-6">
          {[
            "09:00 am - 10:00 am",
            "11:00 am - 12:00 pm",
            "01:00 pm - 02:00 pm",
            "03:00 pm - 04:00 pm",
            "05:00 pm - 06:00 pm",
          ].map((t, i) => (
            <button
              key={i}
              className="border border-gray-300 rounded-md py-2 hover:bg-[#103C8C] hover:text-white transition-all text-sm"
            >
              {t}
            </button>
          ))}
        </div>

        <select className="w-full border border-gray-300 rounded-md p-2 text-gray-600">
          <option>Preferred meeting option</option>
          <option>Online</option>
          <option>Offline</option>
        </select>
      </div>

      <div className="p-4 border-t flex justify-between gap-3">
        <button
          onClick={() => {
            setShowScheduleSidebar(false);
            setShowMentorSidebar(true);
          }}
          className="flex-1 border border-gray-400 text-[#0B1C58] py-2 rounded-md hover:bg-gray-50"
        >
          Back
        </button>
        <button
          onClick={handleFinalSchedule}
          className="flex-1 bg-[#103C8C] hover:bg-[#0B2E72] text-white py-2 rounded-md"
        >
          Schedule
        </button>
      </div>
    </div>
  );
}

