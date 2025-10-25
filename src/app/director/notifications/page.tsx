"use client";
import AppHeader from "@/app/Components/AppHeader";
import AppFooter from "@/app/Components/AppFooter";

export default function NotificationsPage() {
  const notifications = [
    {
      id: "1",
      icon: "fa-solid fa-exclamation-circle",
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      title: "5 NEW INTERESTS RECEIVED TODAY !",
      link: "Click here to View",
      time: "9:43 am",
      isStarred: true,
    },
    {
      id: "2",
      icon: "fa-solid fa-user-check",
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      title: "JOHN ACCEPTED TO BE A FIELD MENTOR",
      subtitle: "Interested in receiving mentoring in community engagement",
      link: "View Profile",
      time: "9:43 am",
    },
    {
      id: "3",
      icon: "fa-solid fa-user-times",
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
      title: "JOHN IS NOT INTERESTED IN BEING A FIELD MENTOR.",
      subtitle: "Interested in receiving mentoring in community engagement",
      link: "View Profile",
      time: "9:43 am",
    },
    {
      id: "4",
      icon: "fa-solid fa-trophy",
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      title: "JOHN AND 2 OTHERS SUBMITTED APPLICATION FOR GRAND",
      avatarGroup: true,
      count: "3+ Mentees",
      link: "Click here to Review",
      time: "9:43 am",
    },
    {
      id: "5",
      icon: "fa-solid fa-link",
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
      title: "YOUR PROFILE IS INCOMPLETE",
      subtitle: "Interested in receiving mentoring in community engagement",
      time: "9:43 am",
    },
    {
      id: "6",
      icon: "fa-regular fa-clipboard",
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      title: "ROADMAP COMPLETED BY JOHN AND 2 OTHERS",
      avatarGroup: true,
      count: "3+ Mentees",
      link: "Click here to Review",
      time: "9:43 am",
      isStarred: true,
    },
    {
      id: "7",
      icon: "fa-regular fa-clipboard",
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
      title: "ROADMAP DUE",
      avatarGroup: true,
      count: "3+ Mentees",
      link: "Click here to View",
      time: "9:43 am",
    },
    {
      id: "8",
      icon: "fa-regular fa-clipboard",
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      title: "ROBERT SUBMITTED ROADMAP (GOD'S VISION FOR YOUR CHURCH)",
      subtitle: "Interested in receiving mentoring in community engagement",
      link: "Click here to Review",
      time: "9:43 am",
    },
    {
      id: "9",
      icon: "fa-regular fa-comment",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      title: "JOHN COMMENTED ON TOMAS ROADMAP",
      subtitle: "Interested in receiving mentoring in community engagement",
      link: "Click here to View",
      time: "9:43 am",
      isStarred: true,
    },
    {
      id: "10",
      icon: "fa-regular fa-comment-dots",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      title: "ROBERT FOX HAVE A NEW QUERY",
      subtitle: "Interested in receiving mentoring in community engagement",
      time: "9:43 am",
    },
    {
      id: "11",
      icon: "fa-regular fa-smile",
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      title: "ASSIGNMENT SUBMITTED BY JOHN AND 2 OTHERS",
      avatarGroup: true,
      count: "3+ Mentees",
      link: "Click here to Review",
      time: "9:43 am",
    },
    {
      id: "12",
      icon: "fa-regular fa-frown",
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
      title: "ASSIGNMENT DUE",
      avatarGroup: true,
      count: "3+ Mentees",
      link: "Click here to View",
      time: "9:43 am",
    },
    {
      id: "13",
      icon: "fa-regular fa-smile",
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      title: "ROBERT SUBMITTED ASSIGNMENT (MENTORING CONVERSATIONS)",
      subtitle: "Interested in receiving mentoring in community engagement",
      link: "Click here to View",
      time: "9:43 am",
    },
    {
      id: "14",
      icon: "fa-regular fa-file-alt",
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      title: "ASSESSMENT SUBMITTED BY JOHN AND 2 OTHERS",
      avatarGroup: true,
      count: "3+ Mentees",
      link: "Click here to View",
      time: "9:43 am",
    },
    {
      id: "15",
      icon: "fa-regular fa-check-square",
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      title: "JOHN AND 2 OTHERS COMPLETED COURSE",
      avatarGroup: true,
      count: "3+ Mentees",
      link: "Click here to View",
      time: "9:43 am",
    },
    {
      id: "16",
      icon: "fa-regular fa-file-alt",
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
      title: "ASSESSMENT DUE",
      avatarGroup: true,
      count: "3+ Mentees",
      link: "Click here to View",
      time: "9:43 am",
    },
    {
      id: "17",
      icon: "fa-regular fa-file",
      iconBg: "bg-yellow-100",
      iconColor: "text-yellow-600",
      title: "ROBERT SUBMITTED ASSESSMENTS (PMP)",
      subtitle: "Interested in receiving mentoring in community engagement",
      link: "Click here to View",
      time: "9:43 am",
    },
    {
      id: "18",
      icon: "fa-regular fa-calendar",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      title: "APPOINTMENT WITH JOHN SCHEDULED ON 20 NOV 2024",
      subtitle: "Interested in receiving mentoring in community engagement",
      time: "9:43 am",
    },
    {
      id: "19",
      icon: "fa-regular fa-calendar-alt",
      iconBg: "bg-yellow-100",
      iconColor: "text-yellow-600",
      title: "APPOINTMENT WITH JOHN HAS BEEN RESCHEDULED ON 22 NOV 2024",
      subtitle: "Interested in receiving mentoring in community engagement",
      time: "9:43 am",
    },
    {
      id: "20",
      icon: "fa-regular fa-calendar-times",
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
      title: "APPOINTMENT CANCELED",
      subtitle: "Interested in receiving mentoring in community engagement",
      time: "9:43 am",
    },
    {
      id: "21",
      icon: "fa-regular fa-clock",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      title: "YOU HAVE AN APPOINTMENT WITH ROBERT FOX TOMMORROW",
      subtitle: "Interested in receiving mentoring in community engagement",
      time: "9:43 am",
    },
    {
      id: "22",
      icon: "fa-solid fa-lock",
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      title: "PASSWORD HAS BEEN CHANGED",
      subtitle: "Interested in receiving mentoring in community engagement",
      time: "9:43 am",
    },
    {
      id: "23",
      icon: "fa-regular fa-comment",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      title: "PETER ADDED FINAL COMMENT ON JOHN'S COURSE",
      subtitle: "Interested in receiving mentoring in community engagement",
      time: "9:43 am",
    },
    {
      id: "24",
      icon: "fa-solid fa-users",
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      title: "2 NEW MENTEES HAVE BEEN ASSIGNED",
      subtitle: "Interested in receiving mentoring in community engagement",
      link: "Click here to View",
      time: "9:43 am",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader showFullHeader={true} />

      {/* Main Content */}
      <section className="flex-1 bg-gradient-to-b from-[#2876AC] to-[#3A8EC4] py-12 px-20">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-white text-[36px] font-semibold mb-2">
              Notifications
            </h1>
            <div className="w-full h-[1px] bg-white/30"></div>
          </div>

          {/* Notifications List */}
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className="bg-white rounded-lg px-6 py-5 shadow-md hover:shadow-lg transition relative"
              >
                <div className="flex gap-4 items-start">
                  {/* Icon */}
                  <div className="flex-shrink-0">
                    <div
                      className={`w-11 h-11 rounded-lg ${notification.iconBg} flex items-center justify-center`}
                    >
                      <i
                        className={`${notification.icon} ${notification.iconColor} text-lg`}
                      ></i>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <h3 className="text-[13px] font-bold text-gray-900 mb-1">
                      {notification.title}
                    </h3>

                    {notification.avatarGroup && (
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex -space-x-2">
                          <div className="w-6 h-6 rounded-full bg-gray-300 border-2 border-white"></div>
                          <div className="w-6 h-6 rounded-full bg-gray-400 border-2 border-white"></div>
                          <div className="w-6 h-6 rounded-full bg-gray-500 border-2 border-white"></div>
                        </div>
                        <span className="text-[12px] text-gray-600">
                          {notification.count}
                        </span>
                      </div>
                    )}

                    {notification.subtitle && (
                      <p className="text-[12px] text-gray-500 mb-2">
                        {notification.subtitle}
                      </p>
                    )}

                    {notification.link && (
                      <a
                        href="#"
                        className="text-[12px] text-[#2E3B8E] font-semibold hover:underline"
                      >
                        {notification.link}
                      </a>
                    )}
                  </div>

                  {/* Right side - Time and Star */}
                  <div className="flex flex-col items-end gap-3">
                    {notification.isStarred && (
                      <i className="fa-solid fa-star text-[#FFD700] text-base"></i>
                    )}
                    <span className="text-[11px] text-gray-400">
                      {notification.time}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Loading Spinner */}
          <div className="flex justify-center mt-12">
            <div className="flex gap-2">
              <div className="w-3 h-3 bg-white rounded-full animate-bounce"></div>
              <div className="w-3 h-3 bg-white rounded-full animate-bounce [animation-delay:0.2s]"></div>
              <div className="w-3 h-3 bg-white rounded-full animate-bounce [animation-delay:0.4s]"></div>
            </div>
          </div>
        </div>
      </section>

      <AppFooter />
    </div>
  );
}
