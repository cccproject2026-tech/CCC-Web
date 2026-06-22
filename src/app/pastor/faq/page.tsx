"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { pastorMainGradient, pastorPageRoot } from "@/app/Components/pastor/pastor-theme";
import { Mail, Phone } from "lucide-react";
import PastorHeader from "@/app/Components/PastorHeader";

type FaqItem = {
  id: number;
  question: string;
  answer: string;
};

const FAQ_ITEMS: FaqItem[] = [
  {
    id: 1,
    question: "What is the first step a pastor or mentor should take to join the Center for Community Change (CCC) Program through the application?",
    answer:
      "The first step is to submit an Interest Form through the application. This allows the CCC team to review your information and determine your eligibility for the program.",
  },
  {
    id: 2,
    question: "Where can I submit the Interest Form as a pastor?",
    answer:
      "You can submit the Interest Form by tapping Get Started on the landing page and selecting the Pastor application option.",
  },
  {
    id: 3,
    question: "How can I track my Interest Form application?",
    answer:
      "To track your Interest Form application, tap Track Your Application on the welcome screen. Enter the email address you used when submitting your Interest Form and tap Continue. The system will take you to the appropriate step in your application and display the current status of your submission.",
  },
  {
    id: 4,
    question: "How will I be notified if my interest is accepted or rejected?",
    answer:
      "You will receive an email notification informing you whether your application has been accepted or rejected.",
  },
  {
    id: 5,
    question: "What happens after my Interest Form is accepted?",
    answer:
      "Once your Interest Form is accepted, you will receive an email notification stating that your application has been accepted. Go to Track Your Application, enter your email address, tap Verify Email, enter the OTP sent to your email, create a password, and then log in using your credentials.",
  },
  {
    id: 6,
    question: "What is a roadmap, and where can I find it in the app?",
    answer:
      "A roadmap is a structured 12-month learning and development program designed to guide you through the CCC program. You can find your assigned roadmap in the Revitalization Roadmaps section from the application menu.",
  },
  {
    id: 7,
    question: "Where should I accept the program terms and conditions, and how can I sign digitally?",
    answer:
      "You can review and accept the program terms and conditions in the Self Revitalization Phase under the 12-Month Mentoring Revitalization Roadmap Approval task. A digital signature option is provided within the task to complete the approval process.",
  },
  {
    id: 8,
    question: "Where can I resume my Roadmap work from my previous session in the app?",
    answer:
      "You can continue your work from the Continue Journey or roadmap section, which displays your current progress and next available tasks.",
  },
  {
    id: 9,
    question: "Can I get an overview of my roadmap progress so far?",
    answer:
      "Yes. You can track your roadmap progress in the Progress section from the menu and view your completed tasks in the Revitalization Journey section. These sections display your completed, in-progress, and remaining roadmap tasks, along with your overall progress in the program.",
  },
  {
    id: 10,
    question: "Can I resubmit a task on my roadmap? Where can I find my submission history?",
    answer:
      "Yes, task resubmissions are allowed. You can resubmit a task from the task details page and view your previous submissions in the task's submission history.",
  },
  {
    id: 11,
    question: "How can I schedule a meeting with my mentor?",
    answer:
      "You can schedule a meeting by navigating to the Appointments section from the sidebar. Tap New Meeting, select your mentor, choose an available date and time slot, and confirm the meeting.",
  },
  {
    id: 12,
    question: "What is a mentorship session, and where can I find my upcoming session details?",
    answer:
      "A mentorship session is a scheduled meeting between you and your mentor for guidance, feedback, and support. Mentorship sessions begin after the pastor completes the Jumpstart phase. You can find your upcoming session details in the Mentoring Sessions section from the menu after completing the previous session.",
  },
  {
    id: 13,
    question: "Can I reschedule a mentorship session?",
    answer:
      "Yes. If your mentor reschedules a mentorship session, you will be notified of the updated date and time for the session.",
  },
  {
    id: 14,
    question: "Can I repeat a mentorship session?",
    answer:
      "Yes. A mentorship session can be repeated if your mentor determines that the session needs to be redone and schedules it again.",
  },
  {
    id: 15,
    question: "Can I request an in-person session?",
    answer:
      "The meeting type is determined by the mentor. If the mentor schedules the session as an in-person meeting, you will receive the meeting details accordingly.",
  },
  {
    id: 16,
    question: "How is a mentorship session different from my other interactions with my mentor?",
    answer:
      "Mentorship sessions are scheduled meetings focused on coaching, development, and program progress. They are mandatory and take place every month throughout the program. Other interactions, such as messages and comments, are typically used for day-to-day communication.",
  },
  {
    id: 17,
    question: "Can I view a history of my previous meetings in mentorship?",
    answer:
      "Yes. You can view your previous mentorship meetings within each mentoring session. Meeting records, transcripts, and AI-generated summaries are available for reference.",
  },
  {
    id: 18,
    question: "How can I message my mentor?",
    answer:
      "You can communicate with your mentor through email or by contacting them on their mobile number if it has been provided.",
  },
  {
    id: 19,
    question: "What is the difference between mentor comments and queries?",
    answer:
      "Mentor comments are feedback provided on your tasks or submissions. Queries are questions or discussions exchanged between you and your mentor.",
  },
  {
    id: 20,
    question: "How can I track my progress?",
    answer:
      "You can track your progress through the Progress section from the menu, which displays your completion status across assigned assessments and roadmap tasks.",
  },
  {
    id: 21,
    question: "How is my progress calculated?",
    answer:
      "Progress is calculated based on completed roadmap tasks, assessments, and submissions. Only the first submission of a task is considered when calculating progress; resubmissions do not affect the progress calculation.",
  },
  {
    id: 22,
    question: "What are Voice Notes used for?",
    answer:
      "Voice Notes allow you to record audio directly within the application or upload a previously recorded audio file, especially during in-person meetings. Once the voice note is submitted, the system automatically generates an AI summary and transcript, which can be reviewed later for reference.",
  },
  {
    id: 23,
    question: "Can I use the mobile app and web app interchangeably?",
    answer:
      "Yes. You can access your account through both the mobile and web applications using the same credentials.",
  },
  {
    id: 24,
    question: "What is a microgrant, and how can I receive it?",
    answer:
      "A microgrant is financial assistance provided through the CCC program for eligible participants. To request a microgrant, the pastor must submit a microgrant application. The director will review the application and decide whether to approve or reject the request.",
  },
  {
    id: 25,
    question: "Can I become a mentor at CCC?",
    answer:
      "Yes. After completing the CCC program, eligible pastors may receive a Field Mentor Invitation from the Director. Only pastors who meet the program requirements and are selected by the Director will be invited to become mentors.",
  },
  {
    id: 26,
    question: "Where can I see my course completion certificate?",
    answer:
      "Once you complete the required program or course requirements, your certificate will be available in the Certificates section.",
  },
];

export default function PastorFaqPage() {
  const router = useRouter();
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

  const isSearchActive = search.trim().length > 0;
  const activeCount = filteredFaqs.length;
  const goBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/pastor/home");
  };

  return (
    <div className={pastorPageRoot}>
      <PastorHeader showFullHeader={true} />
      <main className={`${pastorMainGradient} relative z-10 flex-1`}>
      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-center justify-start">
          <button
            type="button"
            onClick={goBack}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/15"
          >
            <i className="fa-solid fa-arrow-left text-xs" />
            Back
          </button>
        </div>

      <section className="rounded-3xl border border-white/15 bg-[linear-gradient(180deg,rgba(12,58,95,0.92)_0%,rgba(10,53,88,0.97)_100%)] px-5 py-5 shadow-[0_20px_45px_rgba(2,20,38,0.35)] sm:px-6">
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

      <section className="mt-6 rounded-3xl border border-white/15 bg-[linear-gradient(180deg,rgba(12,58,95,0.92)_0%,rgba(10,53,88,0.97)_100%)] px-5 py-6 shadow-[0_20px_45px_rgba(2,20,38,0.35)] sm:px-6 sm:py-8">
        <div className="max-w-3xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-[#d9ebf8]">
            Pastor FAQ
          </p>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">
            Frequently Asked Questions
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#cde2f2] sm:text-[15px]">
            Find quick answers about application steps, roadmaps, appointments, progress, mentorship sessions, and more.
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
              {activeCount} result{activeCount === 1 ? "" : "s"}
            </span>
            {isSearchActive ? (
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
                  className="overflow-hidden rounded-2xl border border-white/15 bg-[linear-gradient(180deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.04)_100%)] shadow-[0_10px_28px_rgba(2,20,38,0.18)]"
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
    </div>
  );
}
