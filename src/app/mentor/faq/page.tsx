"use client";

import { useMemo, useState } from "react";
import { mentorMainGradient, mentorPageRoot } from "@/app/Components/mentor/mentor-theme";
import { Mail, Phone } from "lucide-react";

type FaqItem = {
  id: number;
  question: string;
  answer: string;
};

const FAQ_ITEMS: FaqItem[] = [
  {
    id: 1,
    question: "What is the first step to join the Center for Community Change (CCC) Program as a mentor?",
    answer:
      "The first step is to submit a Mentor Interest Form through the application. The CCC team will review your application and determine your eligibility.",
  },
  {
    id: 2,
    question: "Where can I submit the Mentor Interest Form?",
    answer:
      "You can submit the Mentor Interest Form by tapping Get Started on the landing page and selecting the Mentor application option.",
  },
  {
    id: 3,
    question: "How can I track my Mentor Interest Form application?",
    answer:
      "Tap Track Your Application on the welcome screen, enter the email address used for your application, and continue to view your application status.",
  },
  {
    id: 4,
    question: "How will I be notified if my application is accepted or rejected?",
    answer:
      "You will receive an email notification informing you whether your application has been accepted or rejected.",
  },
  {
    id: 5,
    question: "What happens after my Mentor Interest Form is accepted?",
    answer:
      "Once your application is accepted, you will receive an email notification. Go to Track Your Application, enter your email address, verify your email using the OTP sent to you, create a password, and log in using your credentials.",
  },
  {
    id: 6,
    question: "What is a roadmap, and where can I find it in the app?",
    answer:
      "A roadmap is a structured 12-month learning and development program designed to guide pastors through the CCC program. You can find assigned roadmaps in the Revitalization Roadmaps section.",
  },
  {
    id: 7,
    question: "How can I set my availability for meetings?",
    answer:
      "Navigate to the Availability section, select the days and time slots you are available, and save your availability schedule.",
  },
  {
    id: 8,
    question: "How does recurring availability work?",
    answer:
      "When you set availability for a specific day and time range, the availability is automatically repeated for up to 60 days. The same time slots will be available on recurring days unless modified.",
  },
  {
    id: 9,
    question: "Can I block or customize my availability on specific days?",
    answer:
      "Yes. You can block specific dates or customize availability for individual days as needed.",
  },
  {
    id: 10,
    question: "How can I schedule a meeting with a pastor?",
    answer:
      "Navigate to the Appointments section, tap New Meeting, select the pastor, choose an available date and time slot, and confirm the meeting.",
  },
  {
    id: 11,
    question: "Can I schedule meetings with directors?",
    answer:
      "Yes. Directors and mentors can schedule meetings with each other using available time slots.",
  },
  {
    id: 12,
    question: "Where can I find my scheduled appointments?",
    answer:
      "All scheduled meetings can be viewed in the Appointments section.",
  },
  {
    id: 13,
    question: "What is a mentorship session?",
    answer:
      "A mentorship session is a scheduled meeting between a mentor and pastor for coaching, guidance, feedback, and progress review throughout the program.",
  },
  {
    id: 14,
    question: "Can I reschedule a mentorship session?",
    answer:
      "Yes. Mentors can reschedule mentorship sessions by selecting a new available date and time.",
  },
  {
    id: 15,
    question: "Can a mentorship session be repeated?",
    answer:
      "Yes. If additional guidance is needed, the mentor can schedule the session again.",
  },
  {
    id: 16,
    question: "Can I conduct in-person mentorship sessions?",
    answer:
      "Yes. Mentors determine the meeting type and may schedule sessions as virtual or in-person meetings.",
  },
  {
    id: 17,
    question: "How can I review a pastor's assessment?",
    answer:
      "Navigate to the pastor's assessment, review the submitted responses, and evaluate the results before sending the Customized Development Plan (CDP).",
  },
  {
    id: 18,
    question: "What is a Customized Development Plan (CDP)?",
    answer:
      "A CDP is an automatically generated development plan that identifies the pastor's level in each assessment section and provides guidance for growth.",
  },
  {
    id: 19,
    question: "How do I send a CDP to a pastor?",
    answer:
      "After reviewing the assessment, send the automatically generated CDP to the pastor through the assessment review process.",
  },
  {
    id: 20,
    question: "How can I track a pastor's progress?",
    answer:
      "You can track pastor progress through the Track Progress section, which displays completion status for roadmap tasks, assessments, and submissions.",
  },
  {
    id: 21,
    question: "How is pastor progress calculated?",
    answer:
      "Progress is calculated based on completed roadmap tasks, assessments, and submissions. Only the first submission is considered for progress calculations.",
  },
  {
    id: 22,
    question: "What is the difference between mentor comments and queries?",
    answer:
      "Mentor comments provide feedback on submissions and tasks. Queries are discussions or questions exchanged between mentors and pastors.",
  },
  {
    id: 23,
    question: "What are Voice Notes used for?",
    answer:
      "Voice Notes allow mentors to record audio directly within the application or upload previously recorded audio, especially during in-person meetings. The system automatically generates AI summaries and transcripts from submitted recordings.",
  },
  {
    id: 24,
    question: "Where can I view transcripts and AI summaries?",
    answer:
      "Transcripts and AI-generated summaries can be viewed within the corresponding mentorship session or meeting record.",
  },
  {
    id: 25,
    question: "Can I communicate with pastors outside of mentorship sessions?",
    answer:
      "Yes. You can communicate with pastors through email or by contacting them on their mobile number if it has been provided.",
  },
  {
    id: 26,
    question: "Can I use the mobile app and web app interchangeably?",
    answer:
      "Yes. You can access your account through both the mobile and web applications using the same credentials.",
  },
  {
    id: 27,
    question: "What are my responsibilities as a mentor in the CCC Program?",
    answer:
      "Mentors guide pastors throughout the program by conducting mentorship sessions, reviewing assessments, providing feedback, sending CDPs, monitoring progress, and supporting pastors in their development journey.",
  },
];

export default function MentorFaqPage() {
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
    <main className={`${mentorPageRoot} ${mentorMainGradient}`}>
      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-3xl border border-white/15 bg-[linear-gradient(180deg,rgba(255,255,255,0.09)_0%,rgba(255,255,255,0.04)_100%)] px-5 py-5 shadow-[0_20px_45px_rgba(3,24,43,0.35)] sm:px-6">
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

        <section className="mt-6 rounded-3xl border border-white/15 bg-[linear-gradient(180deg,rgba(255,255,255,0.09)_0%,rgba(255,255,255,0.04)_100%)] px-5 py-6 shadow-[0_20px_45px_rgba(3,24,43,0.35)] sm:px-6 sm:py-8">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-[#d9ebf8]">
              Mentor FAQ
            </p>
            <h1 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">
              Frequently Asked Questions
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#cde2f2] sm:text-[15px]">
              Find quick answers about mentor applications, availability, appointments, mentorship sessions, assessments, and more.
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
                className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 pr-12 text-sm text-white outline-none placeholder:text-white/45 focus:border-[#3498DB]/50 focus:ring-2 focus:ring-[#3498DB]/20"
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
