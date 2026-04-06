"use client";
import { useState } from "react";
import PastorHeader from "@/app/Components/PastorHeader";
import HeroBg from "../../Assets/jumpstart-hero.png";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { useRouter } from "next/navigation";

interface FollowUp {
  name: string;
  date: string;
}

export default function CommunityEngagementEventsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [isCompleted, setIsCompleted] = useState(false);
  const [showPopup, setShowPopup] = useState<string | null>(null);

  // Event 1 state
  const [event1Desc, setEvent1Desc] = useState("");
  const [event1Date, setEvent1Date] = useState("");
  const [followUps1, setFollowUps1] = useState<FollowUp[]>([]);
  const [newFollowUp1, setNewFollowUp1] = useState<FollowUp>({
    name: "",
    date: "",
  });
  const [event1File, setEvent1File] = useState<File | null>(null);

  // Event 2 state
  const [event2Desc, setEvent2Desc] = useState("");
  const [event2Date, setEvent2Date] = useState("");
  const [followUps2, setFollowUps2] = useState<FollowUp[]>([]);
  const [newFollowUp2, setNewFollowUp2] = useState<FollowUp>({
    name: "",
    date: "",
  });
  const [event2File, setEvent2File] = useState<File | null>(null);

  const handleAddFollowUp = (index: number) => {
    if (index === 1 && newFollowUp1.name && newFollowUp1.date) {
      setFollowUps1([...followUps1, newFollowUp1]);
      setNewFollowUp1({ name: "", date: "" });
    } else if (index === 2 && newFollowUp2.name && newFollowUp2.date) {
      setFollowUps2([...followUps2, newFollowUp2]);
      setNewFollowUp2({ name: "", date: "" });
    }
  };

  const handleFileUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      if (index === 1) setEvent1File(file);
      else setEvent2File(file);
    }
  };

  // ✅ Show popup for event 1 or 2
  const handleSubmitEvent = (index: number) => {
    setShowPopup(`Submitted Community Engagement Event ${index}`);
    setTimeout(() => {
      setShowPopup(null);
      setIsCompleted(true);
    }, 2000);
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-[#062946] text-white font-[Albert_Sans]">
      <PastorHeader showFullHeader={true} />

      {/* HERO */}
      <section
        className="relative flex h-[320px] flex-col justify-end bg-cover bg-center px-6 pb-10 md:px-12 lg:px-20"
        style={{ backgroundImage: `url(${HeroBg.src})` }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_10%,rgba(141,211,243,0.22),transparent_36%),linear-gradient(180deg,rgba(4,31,53,0.82)_0%,rgba(6,41,70,0.9)_100%)]"></div>
        <div className="relative z-10">
          <p className="text-xs text-white/80 mb-40">
            Revitalization Roadmap &gt;{" "}
            <span className="text-white font-medium">
              Church Empowerment Phase
            </span>{" "}
            &gt; Community Engagement Events
          </p>

          {isCompleted && (
            <div className="flex items-center gap-3 mb-2">
              <span className="bg-[#3DBE72] text-white text-xs font-semibold px-3 py-[3px] rounded-md">
                Completed
              </span>
              <span className="bg-white/20 text-white text-xs px-3 py-[3px] rounded-md">
                Completed on {new Date().toLocaleDateString("en-GB")}
              </span>
            </div>
          )}

          <h1 className="text-3xl font-semibold leading-snug mb-1">
            Community Engagement Events
          </h1>
          <p className="text-white/70 text-sm">Completion Time Months 5 – 6</p>
        </div>
      </section>

      {/* MAIN */}
      <main className="flex-1 bg-[radial-gradient(circle_at_18%_8%,rgba(141,211,243,0.24),transparent_34%),radial-gradient(circle_at_82%_22%,rgba(245,204,118,0.18),transparent_35%),linear-gradient(180deg,#041f35_0%,#062946_100%)] px-4 py-12 pb-24 md:px-10 lg:px-16">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[250px_1fr] gap-10">
          {/* LEFT PANEL */}
          <div className="h-fit w-full rounded-xl border border-white/20 bg-white/10 p-4 shadow-md backdrop-blur flex flex-col gap-2">
            {[
              { key: "overview", label: "Over View" },
              { key: "comments", label: "Comments", count: 2 },
              { key: "queries", label: "Queries", count: 3 },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                className={`flex justify-between items-center px-4 py-3 rounded-md text-sm font-medium transition-all ${
                  activeTab === item.key
                    ? "bg-[#103C8C] text-white shadow-sm"
                    : "bg-[#F8FAFF] text-gray-600 hover:bg-[#E9EEFF]"
                }`}
              >
                {item.label}
                {item.count && (
                  <span
                    className={`text-xs font-semibold rounded-full px-2 py-[1px] ${
                      activeTab === item.key
                        ? "bg-white/20 text-white"
                        : "bg-white border border-[#D0DAF9] text-[#103C8C]"
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* RIGHT CONTENT */}
          <div>
            {activeTab === "overview" && (
              <>
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-xl font-semibold">Over View</h2>
                  <button className="bg-white rounded-md w-8 h-8 flex items-center justify-center text-[#103C8C] hover:bg-gray-100">
                    <i className="fa-solid fa-ellipsis-vertical"></i>
                  </button>
                </div>
                <hr className="border-t border-white/40 mb-8" />

                {/* Pastoral Roadmap */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold mb-2">
                    Pastoral Roadmap
                  </h3>
                  <div className="border border-[#5A8DCB] rounded-md p-3 text-sm bg-transparent text-white/90">
                    Plan two community engagement events
                  </div>
                </div>

                {/* Description */}
                <div className="mb-10">
                  <h3 className="text-sm font-semibold mb-2">Description</h3>
                  <div className="border border-[#5A8DCB] rounded-md p-3 text-sm text-white/90 bg-transparent">
                    Plan two community engagement events with at least one
                    follow-up bridge event that addresses felt needs in the
                    community.
                  </div>
                </div>

                {/* --- Event 1 --- */}
                <EventBlock
                  index={1}
                  title="Community Engagement Event 1"
                  desc={event1Desc}
                  setDesc={setEvent1Desc}
                  eventDate={event1Date}
                  setEventDate={setEvent1Date}
                  followUps={followUps1}
                  newFollowUp={newFollowUp1}
                  setNewFollowUp={setNewFollowUp1}
                  handleAddFollowUp={handleAddFollowUp}
                  file={event1File}
                  handleFileUpload={handleFileUpload}
                  isCompleted={isCompleted}
                  handleSubmitEvent={handleSubmitEvent}
                />

                {/* --- Event 2 --- */}
                <EventBlock
                  index={2}
                  title="Community Engagement Event 2"
                  desc={event2Desc}
                  setDesc={setEvent2Desc}
                  eventDate={event2Date}
                  setEventDate={setEvent2Date}
                  followUps={followUps2}
                  newFollowUp={newFollowUp2}
                  setNewFollowUp={setNewFollowUp2}
                  handleAddFollowUp={handleAddFollowUp}
                  file={event2File}
                  handleFileUpload={handleFileUpload}
                  isCompleted={isCompleted}
                  handleSubmitEvent={handleSubmitEvent}
                />

                {/* Submit All */}
                <div className="flex justify-end mt-10">
                  <button
                    onClick={() =>
                      isCompleted
                        ? router.push(`/pastor/EmpowerMinistryLeaders`)
                        : setIsCompleted(true)
                    }
                    className="bg-transparent border border-[#A6B8E8] hover:bg-[#103C8C] hover:text-white transition text-[#E8ECFF] text-sm font-medium px-6 py-2 rounded-md shadow-sm"
                  >
                    {isCompleted ? "Re-Submit" : "Submit All"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      {/* SUCCESS POPUP */}
      {showPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <div className="bg-white text-[#0F4A85] px-8 py-5 rounded-xl shadow-lg flex items-center gap-3 fade-in">
            <div className="bg-[#3DBE72] text-white w-6 h-6 flex items-center justify-center rounded-full">
              <i className="fa-solid fa-check text-xs"></i>
            </div>
            <p className="font-medium text-[15px]">{showPopup}</p>
          </div>
        </div>
      )}

    
    </div>
  );
}

/* ---------- Reusable Event Block ---------- */
function EventBlock({
  index,
  title,
  desc,
  setDesc,
  eventDate,
  setEventDate,
  followUps,
  newFollowUp,
  setNewFollowUp,
  handleAddFollowUp,
  file,
  handleFileUpload,
  isCompleted,
  handleSubmitEvent,
}: any) {
  return (
    <div className="mb-10 border border-[#5A8DCB] rounded-xl p-6 bg-[#103C8C]/10">
      <h3 className="text-sm font-semibold mb-3">{title}</h3>

      <textarea
        disabled={isCompleted}
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        placeholder={`Enter details for ${title}`}
        className="w-full bg-transparent border border-[#5A8DCB] rounded-md px-3 py-2 text-sm text-white h-[100px] resize-none mb-4 focus:outline-none"
      ></textarea>

      <h4 className="text-sm font-semibold mb-2">
        Community Engagement Event Date
      </h4>
      <input
        type="date"
        disabled={isCompleted}
        value={eventDate}
        onChange={(e) => setEventDate(e.target.value)}
        className="w-[250px] bg-transparent border border-[#5A8DCB] rounded-md px-3 py-2 text-sm text-white focus:outline-none mb-4"
      />

      {/* Follow-ups */}
      <div className="mb-4">
        <h4 className="text-sm font-semibold mb-2 flex justify-between items-center">
          Follow-up Events
          {!isCompleted && (
            <button
              onClick={() => handleAddFollowUp(index)}
              className="bg-[#103C8C] text-white text-xs px-3 py-1 rounded-md"
            >
              + Add
            </button>
          )}
        </h4>

        {!isCompleted && (
          <>
            <input
              type="text"
              placeholder={`Follow-up event ${index}`}
              value={newFollowUp.name}
              onChange={(e) =>
                setNewFollowUp({ ...newFollowUp, name: e.target.value })
              }
              className="w-full bg-transparent border border-[#5A8DCB] rounded-md px-3 py-2 text-sm text-white mb-2 focus:outline-none"
            />
            <input
              type="date"
              value={newFollowUp.date}
              onChange={(e) =>
                setNewFollowUp({ ...newFollowUp, date: e.target.value })
              }
              className="w-[250px] bg-transparent border border-[#5A8DCB] rounded-md px-3 py-2 text-sm text-white focus:outline-none mb-4"
            />
          </>
        )}

        {followUps.map((f: FollowUp, i: number) => (
          <div
            key={i}
            className="border border-[#5A8DCB] rounded-md p-3 text-sm text-white/90 mb-2 bg-transparent"
          >
            <p>{f.name}</p>
            <p className="text-xs text-white/70 mt-1">
              Date: {new Date(f.date).toLocaleDateString("en-GB")}
            </p>
          </div>
        ))}
      </div>

      {/* Upload Section */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <i className="fa-regular fa-file-arrow-up text-white/80 text-[14px]"></i>
          Upload Videos / Pictures
        </h4>
        {file ? (
          <div className="flex items-center justify-between bg-white text-gray-800 rounded-lg shadow-sm p-4 w-full max-w-md">
            <div className="flex items-center gap-3">
              <div className="bg-[#E8EDFF] text-[#103C8C] rounded-md p-2">
                <i className="fa-solid fa-file text-lg"></i>
              </div>
              <div>
                <h4 className="text-sm font-medium">{file.name}</h4>
                <p className="text-xs text-gray-500">
                  Uploaded on {new Date().toLocaleDateString("en-GB")}
                </p>
              </div>
            </div>
            <i className="fa-solid fa-check text-green-500"></i>
          </div>
        ) : (
          !isCompleted && (
            <label
              htmlFor={`upload-${index}`}
              className="border-2 border-dashed border-[#5A8DCB] rounded-md bg-transparent text-center flex flex-col items-center justify-center h-[140px] cursor-pointer hover:bg-[#174F8A]/20 transition"
            >
              <input
                type="file"
                id={`upload-${index}`}
                className="hidden"
                onChange={(e) => handleFileUpload(e, index)}
              />
              <i className="fa-solid fa-plus text-white text-xl mb-2"></i>
              <p className="text-sm text-white/80">
                Drag & Drop or Click here to choose file
              </p>
              <p className="text-xs text-white/50 mt-1">Max file size : 10 MB</p>
            </label>
          )
        )}
      </div>

      {/* Submit Button per Event */}
      <div className="flex justify-end">
        {!isCompleted && (
          <button
            onClick={() => handleSubmitEvent(index)}
            className="bg-transparent border border-[#A6B8E8] hover:bg-[#103C8C] hover:text-white transition text-[#E8ECFF] text-sm font-medium px-6 py-2 rounded-md shadow-sm"
          >
            Submit
          </button>
        )}
      </div>
    </div>
  );
}
