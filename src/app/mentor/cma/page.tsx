"use client";

import { useEffect, useMemo, useState } from "react";
import "@fortawesome/fontawesome-free/css/all.min.css";
import headerBg from "@/app/Assets/jumpstart-hero.png";

/* ----------------------- Survey Model ----------------------- */
type Section = {
  title: string;
  groups: { title: string; options: string[] }[];
};

const SECTIONS: Section[] = [
  {
    title:
      "Congregational Well being (biopsychosocial(BPS)/financial/spiritual filter)",
    groups: [
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
          "The majority of the church members live within 10 miles of the church.",
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
    groups: [
      {
        title: "CB focus and ministry orientation",
        options: [
          "The CB spends most of its time and energy focusing on operations instead of ministries or evangelism.",
          "The CB spends the most of its time and energy focusing on operations instead of ministries or evangelism.",
          "The CB dedicates at least ½ its time and energy discussing ways to demonstrate Christ to neighboring communities.",
          "The CB dedicates most of its time and efforts to transformative methods of evangelism (CMA).",
        ],
      },
      {
        title: "CB meeting climate",
        options: [
          "The CB meetings are tense, reflecting divisions in the church.",
          "The CB meetings feel formal and uninspiring, lack a genuine sense of enjoyment from doing God’s work together.",
          "The CB meetings always keep in mind the church’s vision and mission and CB leaders seek ways to implement them in the life of the church.",
          "The CB meetings are full of energy and grace—the board members look forward to spending time with one another.",
        ],
      },
      {
        title: "CB unity and representation",
        options: [
          "The CB is not representative of all of the church’s constituencies, and its members don’t share the same vision & mission for the church.",
          "Not all CB members subscribed to the church’s vision and mission.",
          "The CB is united regarding the church’s vision and mission.",
          "All board members are on the same page regarding the vision and mission of the church, and they have developed a consistent CB playbook (i.e., practical implementation of the church’s vision, mission, and guiding values).",
        ],
      },
      {
        title: "Leadership representation & focus",
        options: [
          "The elders spend the most of their time “putting out fires”.",
          "The CB is not representative of younger members of the congregation.",
          "At least a half of the church’s life is oriented toward serving the surrounding communities.",
          "The overall focus of the leadership is directed toward transformative presence in the community.",
        ],
      },
    ],
  },
  {
    title: "Community Engagement History",
    groups: [
      {
        title: "CMA partnerships & understanding",
        options: [
          "The church has no consistent partnerships with non-Adventist organizations.",
          "Church does not fully understand the CMA approach in relationship to evangelism.",
          "The congregation fully embraces the CMA approach in ministry and evangelism.",
          "The church fully implements the CMA approach in all areas of its life— inwardly and outwardly in community.",
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
    groups: [
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
    groups: [
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

/* ----------------------- Page ----------------------- */
export default function CMA() {
  const [active, setActive] = useState(0);
  // answers: key = `${sectionIdx}-${groupIdx}-${optionIdx}` => boolean
  const [answers, setAnswers] = useState<Record<string, boolean>>({});

  // Load / save draft
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem("cma_draft");
    if (saved) setAnswers(JSON.parse(saved));
  }, []);
  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("cma_draft", JSON.stringify(answers));
  }, [answers]);

  const toggle = (k: string) =>
    setAnswers((p) => ({ ...p, [k]: !p[k] }));

  // completion status per section (at least one tick per group)
  const sectionDone = useMemo(() => {
    return SECTIONS.map((sec, si) =>
      sec.groups.every((g, gi) =>
        g.options.some((_, oi) => answers[`${si}-${gi}-${oi}`])
      )
    );
  }, [answers]);

  const allDone = sectionDone.every(Boolean);

  const next = () => setActive((i) => Math.min(i + 1, SECTIONS.length - 1));
  const prev = () => setActive((i) => Math.max(i - 1, 0));

  return (
    <div className="min-h-screen flex flex-col bg-[#0E3B75]">
      {/* HERO */}
      <header
        className="relative h-[220px] flex items-end px-10 md:px-16 pb-8 text-white bg-cover bg-center"
        style={{ backgroundImage: `url(${headerBg.src})` }}
      >
        <div className="absolute inset-0 bg-black/35" />
        <div className="relative z-10">
          <h1 className="text-3xl md:text-[32px] font-bold">
            Church Assessment Evaluation (CMA)
          </h1>
          <p className="text-white/85 text-sm mt-1">
            This Survey is about Lorem ipsum dolor sit amet, consectetur
          </p>
        </div>
      </header>

      {/* BODY */}
      <main className="flex px-10 md:px-16 py-8 bg-gradient-to-b from-[#1B5F9E] to-[#0D3971]">
        <div className="flex gap-8">
          {/* LEFT – Section rail */}
          <aside className="w-[320px] shrink-0">
            <div className="sticky top-24 rounded-xl bg-white shadow-[0_8px_24px_rgba(16,60,140,.18)] p-4">
              <h3 className="text-[#0F1E44] text-[14px] font-semibold px-1 mb-3">
                My Responses
              </h3>

              <ul className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
                {SECTIONS.map((sec, i) => {
                  const isActive = active === i;
                  return (
                    <li key={i}>
                      <button
                        type="button"
                        onClick={() => setActive(i)}
                        className={[
                          "w-full text-left rounded-xl border px-3.5 py-3 transition",
                          isActive
                            ? "bg-[#103C8C] border-[#103C8C] text-white"
                            : "bg-[#F7F9FC] border-[#E0E7F1] text-[#0F1E44] hover:border-[#CAD6F2]",
                        ].join(" ")}
                      >
                        <span
                          className={[
                            "inline-flex items-center text-[10px] font-semibold rounded-full px-2 py-[3px]",
                            isActive
                              ? "bg-white/15 text-white"
                              : "bg-[#ECF1FF] text-[#103C8C]",
                          ].join(" ")}
                        >
                          Section {i + 1}
                        </span>

                        <div
                          className={[
                            "mt-1.5 text-[12.5px] leading-snug",
                            isActive ? "text-white/90" : "text-[#0F1E44]/80",
                          ].join(" ")}
                          style={{
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {sec.title}
                        </div>
                      </button>

                      {/* tiny status dot on the right (optional) */}
                      {/* <div className="h-2 w-2 rounded-full ml-2 mt-2"
                           style={{ background: sectionDone[i] ? '#27AE60' : '#C7D2FE' }} /> */}
                    </li>
                  );
                })}
              </ul>
            </div>
          </aside>

          {/* RIGHT – Questions */}
          <section className="text-white">
            <p className="text-sm text-white/90 mb-6 max-w-2xl">
              Choose the option in each box that best matches how you feel and
              who you are. Your accuracy allows us to provide the best support
              and guidance.
            </p>

            <div className="space-y-6">
              {SECTIONS[active].groups.map((g, gi) => (
                <div
                  key={gi}
                  className="rounded-xl border border-white/25 bg-white/5 p-4 backdrop-blur-[1px]"
                >
                  <h4 className="font-semibold mb-3">
                    {gi + 1}. {g.title}
                  </h4>

                  <ol className="space-y-2">
                    {g.options.map((opt, oi) => {
                      const key = `${active}-${gi}-${oi}`;
                      return (
                        <li key={oi}>
                          <label className="flex items-start gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              className="accent-[#FFD84E] w-[18px] h-[18px] mt-[2px]"
                              checked={!!answers[key]}
                              onChange={() => toggle(key)}
                            />
                            <span className="leading-snug text-[14px]">
                              {opt}
                            </span>
                          </label>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              ))}
            </div>

            {/* Nav bar */}
            <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 sm:justify-between">
              <button
                onClick={prev}
                disabled={active === 0}
                className="border border-[#A6B8E8] text-[#E8ECFF] rounded-md px-5 py-2 text-sm hover:bg-white/10 disabled:opacity-50 disabled:pointer-events-none"
              >
                <i className="fa-solid fa-angle-left mr-2" />
                View Previous Section
              </button>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => alert("Draft saved")}
                  className="bg-white/15 border border-white/30 text-white rounded-md px-4 py-2 text-sm hover:bg-white/20"
                >
                  <i className="fa-regular fa-floppy-disk mr-2" />
                  Save Draft
                </button>
                <button
                  onClick={next}
                  disabled={active === SECTIONS.length - 1}
                  className="bg-[#103C8C] text-white rounded-md px-5 py-2 text-sm hover:bg-[#0B2E72] disabled:opacity-50 disabled:pointer-events-none"
                >
                  View Next Section <i className="fa-solid fa-angle-right ml-2" />
                </button>
              </div>
            </div>

            {/* Submit */}
            <div className="mt-6 flex justify-end">
              <button
                disabled={!allDone}
                onClick={() => alert("Submitted!")}
                className="bg-[#FFD84E] text-[#0B1C58] rounded-md px-6 py-2 text-sm font-semibold hover:brightness-95 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Submit Assessment
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
