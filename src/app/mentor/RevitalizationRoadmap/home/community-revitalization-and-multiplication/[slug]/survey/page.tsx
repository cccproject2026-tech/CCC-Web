"use client";
import { useState } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import SurveyHero from "@/app/Components/Hero/SurveyHero";
import CMALogo from "@/app/Assets/CMA logo.png";
import PMPLogo from "@/app/Assets/pastoral-ministry-profile.png";
import "@fortawesome/fontawesome-free/css/all.min.css";

export default function SurveyPage() {
  const params = useParams();
  const slug = (params?.slug as string) || "";

  const [activeSection, setActiveSection] = useState(1);

  const sections = [
    {
      id: 1,
      title: "Congregational Well being",
      subtitle: "(biopyschosocial (BPS)/financial/spiritual filter)",
    },
    {
      id: 2,
      title: "Leadership (Elders, CB, etc.) Style",
    },
    {
      id: 3,
      title: "Community Engagement History",
    },
    {
      id: 4,
      title: "Pastoral Leadership",
    },
    {
      id: 5,
      title: "Christ's Method Alone (CMA) and Cycle of Evangelism",
    },
  ];

  // Complete survey data for all sections
  const surveyData = {
    1: [
      // Children's SS Classes
      [
        "Children's SS classes are very small and inconsistent",
        "Children's SS classes have been conducted by the same people and in the same way for many years -struggling to get parents involved",
        "Children's SS classes are well organized in terms of curriculum and rotating personnel—some parents are contributing either by teaching or organizing social activities",
        "children's SS classes demonstrate the deep commitment to missional approach to Christian education—almost all parents are playing a role, and they are excited to invite their neighbors and friends.",
      ],
      // Church's Social Events
      [
        "The church's social events are scarce and hardly attended by anyone from the surrounding community",
        "The church has a few traditional social events, which are mostly oriented around the needs of the members",
        "The church has been hosting a few community-oriented social events",
        "The church is intentional about regularly hosting community events",
      ],
      // Tithe and Giving
      [
        "Tithe has been declining for the last 5 years and the church has not been able to make its annual budget for the past 2 years",
        "Tithing and giving has been declining—struggling to make the church budget every year",
        "Tithing and giving has been steady—most of the time the basic needs of the congregation are met",
        "Tithing and giving has been steadily going up for the last 3-5 years",
      ],
      // Visitor Retention
      [
        "First-time visitors don't return",
        "First-time visitors rarely return",
        "Many visitors tend to return to the church's worship services or social activities",
        "New people come to check out the church almost every week and many stay around",
      ],
      // Members Introducing Friends
      [
        "Members rarely introduce their friends and neighbors to the church",
        "Members occasionally introduce their friends and neighbors to the church",
        "Members regularly introduce their friends and neighbors to the church, implementing a discipleship-making strategy",
        "Many church members actively participate in the life of the surrounding communities or other community organizing initiatives",
      ],
    ],
    2: [
      [
        "Feeling burned out—not doing much ministry-wise or doing ministry with a sense of resentment (dreading showing up at work, vis-a-vis church)",
        "Performing only required tasks without any enthusiasm",
        "Excited to offer a personal skillset and expertise, serving the church in the area of CE",
        "Regularly provides CE guidance in and outside of the congregation",
      ],
    ],
    3: [
      [
        "Unfamiliar with the CMA ministry concept",
        "Not fully understanding but approaching the CMA method in relationship to evangelism",
        "Fully embraces the CMA approach to ministry and evangelism",
        "Fully implements the CMA approach in all areas of life—inside and outside of the church",
      ],
      [
        "No collaborations with outside community players",
        "Some relationships with local community influencers and players",
        "Actively participating in the community life outside of the church",
        "Holds a leadership role in the community life outside of the church",
      ],
      [
        "Occasional participation but no strategic leadership in CE initiatives",
        "Formal support but not active strategic leadership in the church's CE efforts",
        "Prominent leadership role in CE ministries at home congregation",
        "Conducts formal training classes/workshops in the area of CE for other ministry leaders",
      ],
      [
        "Feeling cynical, distrusting self and others",
        "Not trusting local church leaders",
        "Working confidently with the local church leaders and finding it mutually rewarding",
        "Raising the next generation of church leaders",
      ],
    ],
    4: [
      [
        "Membership/attendance is in decline",
        "Plateauing or declining membership",
        "Church membership and attendance are on the rise",
        "Increasing volunteer participation in CE projects—successfully implements the CMA principle in all aspects of church life",
      ],
      [
        "No clear vision and mission statements",
        "Vague sense of vision and mission",
        "Committed to strong vision and mission statements",
        "Compellingly embodies the church's vision and mission statements",
      ],
      [
        "The average age of the church is above 60",
        "Experiencing congregational aging",
        "Has shown signs of healthy growth and CE ministry sustainability",
        "Growing younger as a congregation",
      ],
      [
        "Many toxic church members",
        "Often dealing with unnecessary judgmental comments and rumors",
        "Fosters open and trusting social atmosphere—always acknowledging areas for growth and celebrating achievements",
        "Actively pursuing inward and outward holistic communal transformation as the primary method of evangelism",
      ],
      [
        "Absence of CE leaders/volunteers",
        "An example of the 10/90 rule of active participation",
        "High level of community engagement among the members",
        "Inspires and leads other congregations and partners in community-transformation initiatives and projects",
      ],
      [
        'Dysfunctional church board; church members/church leaders often talk about about each other as "us" and "them"',
        "Lack of adequate representation in the church leadership",
        "The leadership team is trusted and adequately represents the congregation",
        "Shows deep care for its leaders",
      ],
      [
        "The church presence not impactful in the surrounding area",
        "CE is focused mostly on distribution goods and services and not transformation",
        "Clear signs of positive transformation in the community as a result of CE undertakings",
        "Increasing number of people in the surrounding community whose quality of life has been significantly improved",
      ],
      [
        "The CMA is not embodied in the life of the church",
        "Occasional community-oriented events",
        "Members practice the CMA principle—all CE work is seen as building relationships outside of the church",
        "Recognition among and strong personal relationships with community stakeholders",
      ],
    ],
    5: [
      [
        "No formal community engagement/services training/certification",
        "Some community engagement/services training/ no certification",
        "Completed formal training/certification in the area of CE",
        "Teaches and supports others in the area of CE",
      ],
      [
        "Master's degree in a ministry-related field",
        "Has fulfilled all educational requirements for pastoral ordination",
        "Holding/finishing an advanced graduate degree relevant to ministry",
        "Has a learning plan for post-graduate educational development",
      ],
      [
        "No current continuing education enrollment",
        "Additional formal education in field relevant to community engagement",
        "Continuing formal/self-education in the field of CE",
        "Diverse cultural awareness and language skills",
      ],
      [
        "Limited cultural/language proficiency",
        "Thinking about pursuing another educational goal (another degree or doctorate studies)",
        "Developing personal cultural awareness or expanding linguistic skill through formal/self-organized educational plan",
        "Teaches and mentors others in the areas of anthropology and culture change",
      ],
      [
        "Disconnected from other non-denominational entities",
        "Sporadic relationships with some CE players outside of the church",
        "Has strong personal connections with many CE players in the community",
        "Plays a vital leadership role in the community outside of the church",
      ],
    ],
  };

  const getTitle = () => {
    if (slug === "pastoral-ministry-profile-pmp") {
      return "Pastoral Ministry Profile (PMP)";
    }
    return "Church Assessment Evaluation (CMA)";
  };

  const getSubtitle = () => {
    if (slug === "pastoral-ministry-profile-pmp") {
      return "This Survey is about Lorem ipsum dolor sit amet, consectetur";
    }
    return "This Assessment is about your current personal well being";
  };

  const getQuestions = () => {
    return surveyData[activeSection as keyof typeof surveyData] || [];
  };

  const getRightContent = () => {
    if (slug === "pastoral-ministry-profile-pmp") {
      return (
        <Image
          src={PMPLogo}
          alt="Pastoral Ministry Profile"
          width={200}
          height={120}
          className="object-contain"
        />
      );
    }
    return (
      <Image
        src={CMALogo}
        alt="CMA Logo"
        width={120}
        height={80}
        className="object-contain"
      />
    );
  };

  return (
    <div className="min-h-screen bg-[#1b5a90]">
      <SurveyHero
        title={getTitle()}
        subtitle={getSubtitle()}
        breadcrumbItems={[
          {
            label: "Pastor's Roadmaps",
            href: "/director/revitalization-roadmap",
          },
          { label: "John Ross", href: "#" },
          { label: "Revitalization Roadmap", href: "#" },
          { label: "Self Revitalization Phase", href: "#" },
          { label: getTitle(), href: "#" },
          { label: "Survey", href: "#" },
        ]}
        rightContent={getRightContent()}
      />

      {/* Main Content Area */}
      <main className="px-8 py-8">
        <div className="flex gap-8">
          {/* Left Sidebar - Survey Sections */}
          <aside className="w-[280px] flex-shrink-0">
            <div className="bg-blue-50 rounded-xl rounded-tr-lg p-5 space-y-4">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full text-left p-3 rounded-lg transition-all ${
                    activeSection === section.id
                      ? "bg-[#2E3B8E] text-white"
                      : "bg-white text-[#2E3B8E] border border-gray-200"
                  }`}
                >
                  <div className="text-sm font-semibold">
                    Section {section.id}
                  </div>
                  <div
                    className={`text-xs mt-1 ${
                      activeSection === section.id
                        ? "text-white/90"
                        : "text-gray-600"
                    }`}
                  >
                    {section.title}
                  </div>
                  {section.subtitle && (
                    <div
                      className={`text-xs mt-1 ${
                        activeSection === section.id
                          ? "text-white/80"
                          : "text-gray-500"
                      }`}
                    >
                      {section.subtitle}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </aside>

          {/* Right Panel - Survey Questions */}
          <section className="flex-1">
            <div className="space-y-6">
              {getQuestions().map((questionSet, index) => (
                <div
                  key={index}
                  className="bg-transparent border border-white/20 rounded-xl p-6"
                >
                  <ol className="space-y-3">
                    {questionSet.map((item, itemIndex) => (
                      <li
                        key={itemIndex}
                        className="text-white text-sm leading-relaxed"
                      >
                        {itemIndex + 1}. {item}
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-end gap-4 mt-8">
              <button
                onClick={() => {
                  if (activeSection > 1) {
                    setActiveSection(activeSection - 1);
                  }
                }}
                disabled={activeSection === 1}
                className={`${
                  activeSection === 1
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-gray-100"
                } bg-white text-[#1A2E5C] rounded-lg px-6 py-3 text-sm font-semibold transition-all flex items-center gap-2`}
              >
                <i className="fa-solid fa-chevron-left"></i> View Previous
                Section
              </button>
              <button
                onClick={() => {
                  if (activeSection < sections.length) {
                    setActiveSection(activeSection + 1);
                  } else {
                    // Handle completion or next action
                  }
                }}
                disabled={activeSection === sections.length}
                className={`${
                  activeSection === sections.length
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-[#0F1E44]"
                } bg-[#1A2E5C] text-white border border-white/20 rounded-lg px-6 py-3 text-sm font-semibold transition-all flex items-center gap-2`}
              >
                View Next Section <i className="fa-solid fa-chevron-right"></i>
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
