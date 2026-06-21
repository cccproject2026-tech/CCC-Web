"use client";

import { useMemo, useState } from "react";
import { directorPageRoot } from "@/app/director/directorUi";
import { Mail, Phone } from "lucide-react";

type FaqItem = {
  id: number;
  question: string;
  answer: string;
};

const FAQ_ITEMS: FaqItem[] = [
  {
    id: 1,
    question: "What is the role of a Director in the CCC Program?",
    answer:
      "The Director serves as the program administrator and oversees pastors, mentors, roadmaps, assessments, meetings, progress tracking, and overall program operations.",
  },
  {
    id: 2,
    question: "How can I view pastor and mentor applications?",
    answer:
      "You can view pastor and mentor applications in the Interest Forms section.",
  },
  {
    id: 3,
    question: "How do I approve or reject Interest Form applications?",
    answer:
      "Open the submitted application, review the details, and choose to approve or reject the application.",
  },
  {
    id: 4,
    question: "How can I search for pastors, mentors, roadmaps, and assessments?",
    answer:
      "You can use the Global Search feature to search for pastors, mentors, roadmaps, assessments, and other records.",
  },
  {
    id: 5,
    question: "What is a roadmap?",
    answer:
      "A roadmap is a structured 12-month learning and development program designed to guide pastors through the CCC program.",
  },
  {
    id: 6,
    question: "How do I create a new roadmap?",
    answer:
      "Navigate to the Roadmap Library, select Create Roadmap, enter the required information, and save the roadmap.",
  },
  {
    id: 7,
    question: "How can I create roadmap phases and tasks?",
    answer:
      "While creating or editing a roadmap, you can add phases and create tasks using the available roadmap builder options.",
  },
  {
    id: 8,
    question: "Can I edit an existing roadmap?",
    answer:
      "Yes. Directors can edit roadmap details, phases, and tasks from the Roadmap Library.",
  },
  {
    id: 9,
    question: "Can I delete a roadmap?",
    answer:
      "Yes. Directors can delete roadmaps that are no longer required.",
  },
  {
    id: 10,
    question: "How can I assign a roadmap to pastors?",
    answer:
      "Go to Revitalization Roadmaps from the menu. Open the three-dot menu on the roadmap and select Assign. You can also assign roadmaps directly from the Quick Actions section on the dashboard.",
  },
  {
    id: 11,
    question: "How can I track roadmap completion and progress?",
    answer:
      "You can monitor roadmap completion and progress through the Track Progress section.",
  },
  {
    id: 12,
    question: "What is an assessment?",
    answer:
      "An assessment is a survey used to evaluate a pastor's current development level and generate a Customized Development Plan (CDP).",
  },
  {
    id: 13,
    question: "How do I create a new assessment?",
    answer:
      "Navigate to the Assessments section, select Create Assessment, add sections and questions, and save the assessment.",
  },
  {
    id: 14,
    question: "What are CMA and PMP assessments?",
    answer:
      "CMA and PMP are assessment types used within the CCC program to evaluate pastors and generate development plans.",
  },
  {
    id: 15,
    question: "How can I assign assessments to pastors?",
    answer:
      "Open the assessment, select the pastors you want to assign it to, and complete the assignment process.",
  },
  {
    id: 16,
    question: "Can Directors send Customized Development Plans (CDPs)?",
    answer:
      "No. Directors can create and assign assessments, but only mentors can review assessments and send CDPs to pastors.",
  },
  {
    id: 17,
    question: "How can I monitor pastor assessment results?",
    answer:
      "You can view submitted assessments and monitor assessment completion and results in the Pastor Assessments section under Assessments.",
  },
  {
    id: 18,
    question: "How can I track pastor progress?",
    answer:
      "You can track pastor progress through the Track Progress section.",
  },
  {
    id: 19,
    question: "How is pastor progress calculated?",
    answer:
      "Progress is calculated based on completed roadmap tasks, assessments, and submissions. Only the first submission of a task is considered when calculating progress; resubmissions do not affect the progress calculation.",
  },
  {
    id: 20,
    question: "How can I schedule meetings with pastors and mentors?",
    answer:
      "Navigate to the Appointments section, select New Meeting, choose the participant, select an available date and time, and confirm the meeting.",
  },
  {
    id: 21,
    question: "How do I manage appointments?",
    answer:
      "All scheduled, upcoming, and completed meetings can be managed from the Appointments section.",
  },
  {
    id: 22,
    question: "How do I set availability?",
    answer:
      "Navigate to the Appointments section and open Availability. Select the day and time range you want to make available, then save the availability. The selected time slots will be available for scheduling meetings with pastors and mentors. You can also block specific dates or customize availability for individual days as needed.",
  },
  {
    id: 23,
    question: "Can I view meeting transcripts and AI summaries?",
    answer:
      "Yes. Meeting transcripts and AI-generated summaries are available within the corresponding meeting details.",
  },
  {
    id: 24,
    question: "What are Voice Notes used for?",
    answer:
      "Voice Notes allow users to record audio directly in the application or upload existing recordings. The system automatically generates transcripts and AI summaries from the recordings.",
  },
  {
    id: 25,
    question: "What is a microgrant?",
    answer:
      "A microgrant is financial assistance that pastors can request through the CCC program.",
  },
  {
    id: 26,
    question: "How can I review and approve microgrant requests?",
    answer:
      "Navigate to the Microgrants section, review the submitted application, and choose whether to approve or reject the request.",
  },
  {
    id: 27,
    question: "How can I invite pastors to become Field Mentors?",
    answer:
      "After pastors successfully complete the program, eligible pastors can be sent a Field Mentor Invitation by the Director.",
  },
  {
    id: 28,
    question: "How can I view certificates and program completion information?",
    answer:
      "You can view pastor completion status and certificate information through the program tracking and reporting sections.",
  },
  {
    id: 29,
    question: "Can I use the mobile app and web app interchangeably?",
    answer:
      "Yes. You can access your account through both the mobile and web applications using the same credentials.",
  },
  {
    id: 30,
    question: "How can I monitor overall program performance and participation?",
    answer:
      "You can monitor overall program performance through dashboards, reports, progress tracking, assessment results, roadmap completion data, and participation metrics available within the application.",
  },
];

export default function DirectorFaqPage() {
  const [search, setSearch] = useState("");
  const [openFaqId, setOpenFaqId] = useState<number | null>(1);

  const filteredFaqs = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return FAQ_ITEMS;

    return FAQ_ITEMS.filter((item) => {
      const haystack = `${item.question} ${item.answer}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [search]);

  const resultCount = filteredFaqs.length;
  const isFiltered = search.trim().length > 0;

  return (
    <main className={directorPageRoot}>
      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-3xl border border-white/15 bg-[linear-gradient(180deg,rgba(255,255,255,0.1)_0%,rgba(255,255,255,0.04)_100%)] px-5 py-5 shadow-[0_20px_45px_rgba(3,24,43,0.35)] sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-2xl">
              <h2 className="text-lg font-semibold text-white sm:text-xl">Need help?</h2>
              <p className="mt-1 text-sm text-[#cde2f2]">
                Reach out through the contact options below.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
              <a
                href="tel:269-471-0159"
                className="inline-flex min-w-0 items-center gap-3 rounded-2xl border border-white/15 bg-white/[0.06] px-4 py-3 text-sm text-white transition hover:bg-white/[0.1]"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#8ec5eb]/35 bg-[#8ec5eb]/10 text-[#8ec5eb]">
                  <Phone size={16} />
                </span>
                <span className="min-w-0">
                  <span className="block text-[11px] uppercase tracking-[0.16em] text-white/55">Phone</span>
                  <span className="block truncate font-medium text-white/95">269-471-0159</span>
                </span>
              </a>

              <a
                href="mailto:communitychange@andrews.edu"
                className="inline-flex min-w-0 items-center gap-3 rounded-2xl border border-white/15 bg-white/[0.06] px-4 py-3 text-sm text-white transition hover:bg-white/[0.1]"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#8ec5eb]/35 bg-[#8ec5eb]/10 text-[#8ec5eb]">
                  <Mail size={16} />
                </span>
                <span className="min-w-0">
                  <span className="block text-[11px] uppercase tracking-[0.16em] text-white/55">Email</span>
                  <span className="block truncate font-medium text-white/95">communitychange@andrews.edu</span>
                </span>
              </a>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-white/15 bg-[linear-gradient(180deg,rgba(255,255,255,0.1)_0%,rgba(255,255,255,0.04)_100%)] px-5 py-6 shadow-[0_20px_45px_rgba(3,24,43,0.35)] sm:px-6 sm:py-8">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-[#d9ebf8]">
              Director FAQ
            </p>
            <h1 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">
              Frequently Asked Questions
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#cde2f2] sm:text-[15px]">
              Find quick answers about applications, roadmaps, assessments, appointments, microgrants, and overall program oversight.
            </p>
          </div>

          <div className="mt-6 rounded-2xl border border-white/15 bg-white/[0.08] p-4 sm:p-5">
            <label htmlFor="faq-search" className="mb-2 block text-sm font-semibold text-white">
              Search FAQs
            </label>
            <div className="relative">
              <input
                id="faq-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by question or answer"
                className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 pr-12 text-sm text-white outline-none placeholder:text-white/45 focus:border-[#8ec5eb]/50 focus:ring-2 focus:ring-[#8ec5eb]/20"
              />
              {search ? (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-3 py-1.5 text-sm font-semibold text-white/75 transition hover:bg-white/10 hover:text-white"
                  aria-label="Clear search"
                >
                  Clear
                </button>
              ) : null}
            </div>

            <div className="mt-3 flex flex-wrap gap-2 text-xs text-[#cde2f2]">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                {resultCount} result{resultCount === 1 ? "" : "s"}
              </span>
              {isFiltered ? (
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                  Filtered from {FAQ_ITEMS.length} questions
                </span>
              ) : null}
            </div>
          </div>
        </section>

        <section className="mt-6 flex-1">
          <div className="space-y-3">
            {filteredFaqs.length === 0 ? (
              <div className="rounded-2xl border border-white/15 bg-white/5 px-5 py-8 text-sm text-[#cde2f2]">
                No FAQ items matched your search.
              </div>
            ) : (
              filteredFaqs.map((item, index) => {
                const isOpen = openFaqId === item.id;
                const panelId = `faq-panel-${item.id}`;
                const buttonId = `faq-button-${item.id}`;

                return (
                  <article
                    key={item.id}
                    className="overflow-hidden rounded-2xl border border-white/15 bg-[linear-gradient(180deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.04)_100%)] shadow-[0_10px_28px_rgba(3,24,43,0.18)]"
                  >
                    <button
                      id={buttonId}
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      onClick={() => setOpenFaqId(isOpen ? null : item.id)}
                      className="flex w-full items-start justify-between gap-4 px-4 py-4 text-left sm:px-5 sm:py-5"
                    >
                      <div className="flex min-w-0 items-start gap-3">
                        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#8ec5eb]/35 bg-[#8ec5eb]/10 text-sm font-semibold text-[#d9ebf8]">
                          {index + 1}
                        </span>
                        <div className="min-w-0">
                          <h2 className="text-sm font-semibold leading-6 text-white sm:text-[15px]">
                            {item.question}
                          </h2>
                          <p className="mt-1 text-xs text-[#cde2f2] sm:text-sm">
                            Tap to {isOpen ? "collapse" : "expand"} the answer
                          </p>
                        </div>
                      </div>

                      <span
                        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 text-lg font-semibold text-white transition-transform duration-[150ms] ${isOpen ? "rotate-180" : ""}`}
                        aria-hidden="true"
                      >
                        {isOpen ? "-" : "+"}
                      </span>
                    </button>

                    <div
                      id={panelId}
                      role="region"
                      aria-labelledby={buttonId}
                      className={`grid transition-[grid-template-rows,opacity] duration-[180ms] ease-out ${
                        isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                      }`}
                    >
                      <div className="overflow-hidden">
                        <div className="border-t border-white/10 px-4 pb-5 pt-0 sm:px-5 sm:pb-6">
                          <p className="max-w-4xl text-sm leading-7 text-[#d9ebf8] sm:text-[15px]">
                            {item.answer}
                          </p>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
