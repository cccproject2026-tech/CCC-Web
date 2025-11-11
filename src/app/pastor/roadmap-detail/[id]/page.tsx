"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import PastorHeader from "@/app/Components/PastorHeader";
import {
  apiGetRoadmapById,
  apiUpdateRoadmapData,
  apiUploadRoadmapFile,
} from "@/app/Services/api";
import HeroBg from "@/app/Assets/jumpstart-hero.png";
import PhaseImg from "@/app/Assets/phase-img.png";

interface RoadmapData {
  _id: string;
  type: "single" | "phase";
  name: string;
  roadMapDetails: string;
  description: string;
  status: string;
  duration: string;
  phase: string;
  imageUrl: string;
  haveNextedRoadMaps: boolean;
  totalSteps: number;
  roadmaps: SubRoadmap[];
  extras: ExtraComponent[];
}

interface SubRoadmap {
  _id: string;
  name: string;
  roadMapDetails: string;
  description: string;
  status: string;
  duration: string;
  phase: string;
  imageUrl?: string;
  totalSteps: number;
  extras: ExtraComponent[];
}

interface ExtraComponent {
  type:
    | "TEXT_DISPLAY"
    | "TEXT_AREA"
    | "TEXT_FIELD"
    | "DATE_PICKER"
    | "UPLOAD"
    | "CHECKBOX"
    | "ASSESSMENT"
    | "SECTION";
  name: string;
  placeHolder?: string;
  buttonName?: string;
  date?: string;
  haveButton?: boolean;
  checkboxes?: ExtraComponent[];
  sections?: ExtraComponent[];
}

export default function RoadmapDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [roadmap, setRoadmap] = useState<RoadmapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTab, setFilterTab] = useState("All");
  const [selectedSubRoadmap, setSelectedSubRoadmap] = useState<string | null>(
    null
  );

  useEffect(() => {
    fetchRoadmapDetail();
  }, [params.id]);

  // Layout detection based on API response
  const getLayoutType = (roadmap: RoadmapData) => {
    // Jump-start layout (single type with sidebar)
    if (
      roadmap.type === "single" &&
      roadmap.name.toLowerCase().includes("jump")
    ) {
      return "JUMPSTART_LAYOUT";
    }
    // Phase layout with sub-roadmaps (grid view)
    if (roadmap.type === "phase" && roadmap.roadmaps?.length > 0) {
      return "PHASE_GRID_LAYOUT";
    }
    // Simple phase without sub-roadmaps
    return "SIMPLE_PHASE";
  };

  const fetchRoadmapDetail = async () => {
    try {
      setLoading(true);
      const res = await apiGetRoadmapById(params.id as string);
      setRoadmap(res.data.data);
    } catch (error) {
      console.error("Error fetching roadmap:", error);
    } finally {
      setLoading(false);
    }
  };

  // Phase grid card component matching hardcoded design
  const renderPhaseCard = (subRoadmap: SubRoadmap) => {
    const getStatusColor = (status: string) => {
      switch (status.toLowerCase()) {
        case "submitted":
          return "bg-[#E0EDFF] text-[#103C8C] border-[#C3D4FF]";
        case "completed":
          return "bg-green-100 text-green-700 border-green-200";
        case "in progress":
          return "bg-yellow-100 text-yellow-700 border-yellow-200";
        default:
          return "bg-[#EFF6FF] text-[#6B7280] border-[#E5E7EB]";
      }
    };

    return (
      <div
        key={subRoadmap._id}
        className="bg-white rounded-2xl shadow-[0_2px_6px_rgba(0,0,0,0.05)] border border-[#E5EAF1] flex overflow-hidden hover:shadow-md transition-all"
      >
        {/* Left Image - 42% width */}
        <div className="relative w-[42%] h-[200px] shrink-0 m-3">
          <Image
            src={subRoadmap.imageUrl || PhaseImg.src}
            alt={subRoadmap.name}
            fill
            className="object-cover rounded-l-2xl"
          />
        </div>

        {/* Right Content - 58% width */}
        <div className="flex flex-col justify-between w-[58%] px-5 py-4 text-[#0B1C58]">
          <div>
            <h3 className="text-[15px] font-semibold leading-snug mb-[6px]">
              {subRoadmap.name}
            </h3>
            <p className="text-[13px] text-[#6B7280] leading-snug mb-[8px]">
              {subRoadmap.description ||
                subRoadmap.roadMapDetails ||
                "Complete this roadmap component as part of your journey."}
            </p>

            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-[12px] text-[#6B7280] font-medium">
                Status
              </span>
              <span
                className={`text-[11px] px-2 py-[3px] rounded-full font-medium border ${getStatusColor(
                  subRoadmap.status
                )}`}
              >
                {subRoadmap.status}
              </span>
            </div>

            <p className="text-[12px] text-[#6B7280] mt-10">
              Completion Time{" "}
              <span className="font-semibold text-[#0B1C58]">
                {subRoadmap.duration}
              </span>
            </p>
          </div>

          <div className="flex justify-end -mt-6">
            <button
              onClick={() => setSelectedSubRoadmap(subRoadmap._id)}
              className="bg-[#103C8C] hover:bg-[#0B2E72] transition text-white text-[12px] font-medium px-6 py-[6px] rounded-md shadow-sm"
            >
              View
            </button>
          </div>
        </div>
      </div>
    );
  };

  const handleInputChange = (name: string, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = async (name: string, file: File) => {
    try {
      const formDataObj = new FormData();
      formDataObj.append("file", file);
      const res = await apiUploadRoadmapFile(params.id as string, formDataObj);
      setUploadedFiles((prev) => ({ ...prev, [name]: file }));
    } catch (error) {
      console.error("Upload error:", error);
    }
  };

  const handleSubmit = async () => {
    try {
      await apiUpdateRoadmapData(params.id as string, formData);
      alert("Roadmap updated successfully!");
    } catch (error) {
      console.error("Update error:", error);
    }
  };

  const renderExtraComponent = (extra: ExtraComponent, index: number) => {
    switch (extra.type) {
      case "TEXT_DISPLAY":
        return (
          <div key={index} className="mb-4">
            <a
              href="#"
              className="text-white underline text-sm hover:text-blue-200"
            >
              {extra.name}
            </a>
          </div>
        );

      case "TEXT_AREA":
        return (
          <div key={index} className="rounded-lg p-4 mb-4">
            <h3 className="text-sm font-semibold text-white mb-3">
              {extra.name}
            </h3>
            <textarea
              placeholder={extra.placeHolder || "Write Your Notes here..."}
              value={formData[extra.name] || ""}
              onChange={(e) => handleInputChange(extra.name, e.target.value)}
              className="w-full rounded-md bg-transparent border border-[#52A1D1] text-white text-sm p-3 focus:outline-none focus:ring-1 focus:ring-[#00B3FF] resize-none h-20"
            />
          </div>
        );

      case "TEXT_FIELD":
        return (
          <div key={index} className="mb-4">
            <label className="block text-sm font-semibold mb-2">
              {extra.name}
            </label>
            <input
              type="text"
              placeholder={extra.placeHolder}
              value={formData[extra.name] || ""}
              onChange={(e) => handleInputChange(extra.name, e.target.value)}
              className="w-full bg-transparent border border-[#5A8DCB] rounded-md px-3 py-2 text-sm text-white focus:outline-none"
            />
          </div>
        );

      case "DATE_PICKER":
        return (
          <div
            key={index}
            className="flex items-center justify-between gap-4 mt-6"
          >
            <div className="flex items-center gap-3">
              <i className="fa-regular fa-calendar text-white/80 text-sm"></i>
              <input
                type="text"
                readOnly
                value={formData[extra.name] || extra.date || "10 Nov 2024"}
                className="bg-transparent border border-[#52A1D1] text-sm text-white px-3 py-2 rounded-md focus:outline-none w-[180px]"
              />
            </div>
            {extra.buttonName && (
              <button className="bg-[#103C8C] hover:bg-[#0B2E72] transition text-white text-sm font-medium px-6 py-2 rounded-md shadow">
                {extra.buttonName}
              </button>
            )}
          </div>
        );

      case "UPLOAD":
        return (
          <div key={index} className="mb-6">
            <label className="block text-sm font-semibold mb-2">
              {extra.name}
            </label>
            {uploadedFiles[extra.name] ? (
              <div className="bg-white text-gray-800 rounded-lg p-3 flex items-center gap-3">
                <i className="fa-solid fa-file text-blue-600"></i>
                <span className="text-sm">
                  {uploadedFiles[extra.name].name}
                </span>
              </div>
            ) : (
              <div className="border-2 border-dashed border-[#52A1D1] rounded-lg p-4 text-center">
                <input
                  type="file"
                  onChange={(e) =>
                    e.target.files?.[0] &&
                    handleFileUpload(extra.name, e.target.files[0])
                  }
                  className="hidden"
                  id={`upload-${index}`}
                />
                <label htmlFor={`upload-${index}`} className="cursor-pointer">
                  <i className="fa-solid fa-cloud-upload text-white/60 text-2xl mb-2 block"></i>
                  <span className="text-sm text-white/80">
                    Click to upload file
                  </span>
                </label>
              </div>
            )}
          </div>
        );

      case "CHECKBOX":
        return (
          <div key={index} className="flex items-center gap-2 mb-2">
            <input
              type="checkbox"
              id={`checkbox-${index}`}
              checked={formData[extra.name] || false}
              onChange={(e) => handleInputChange(extra.name, e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <label htmlFor={`checkbox-${index}`} className="text-sm text-white">
              {extra.name}
            </label>
          </div>
        );

      case "SECTION":
        return (
          <div key={index} className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              {extra.name}
            </h3>
            {extra.sections?.map((section, sIndex) =>
              renderExtraComponent(section, sIndex)
            )}
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#103C8C] to-[#1E5BB8] flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  if (!roadmap) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#103C8C] to-[#1E5BB8] flex items-center justify-center">
        <div className="text-white text-lg">Roadmap not found</div>
      </div>
    );
  }

  const layoutType = getLayoutType(roadmap);

  // Jump-start layout with sidebar
  if (layoutType === "JUMPSTART_LAYOUT") {
    return (
      <div className="min-h-screen flex flex-col bg-[#0F4A85]">
        <PastorHeader showFullHeader={true} />

        {/* HERO SECTION */}
        <section
          className="relative h-[320px] bg-cover bg-center text-white flex flex-col justify-end px-20 pb-10"
          style={{ backgroundImage: `url(${HeroBg.src})` }}
        >
          <div className="absolute inset-0 bg-black/50"></div>
          <div className="relative z-10">
            <p className="text-sm text-white/80 mb-2">
              Revitalization Roadmap &gt;{" "}
              <span className="text-white">{roadmap.name}</span>
            </p>
            <h1 className="text-3xl font-semibold">{roadmap.name}</h1>
            <p className="text-white/70 text-sm mt-1">
              Completion Time {roadmap.duration}
            </p>
          </div>
        </section>

        {/* MAIN CONTENT */}
        <main className="flex-1 px-16 py-12 bg-gradient-to-b from-[#1B5F9E] to-[#0D3971] text-white">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[250px_1fr] gap-10">
            {/* LEFT PANEL */}
            <div className="bg-white rounded-xl shadow-md p-4 flex flex-col gap-2 w-full h-fit">
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
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold">Over View</h2>
                    <button className="text-white/80 hover:text-white text-sm">
                      <i className="fa-solid fa-ellipsis-vertical"></i>
                    </button>
                  </div>

                  <div className="bg-[#1070A9]/70 rounded-lg p-4 mb-4 border border-[#3B8CC2]">
                    <h3 className="text-sm font-semibold text-white mb-2">
                      Roadmap
                    </h3>
                    <p className="bg-[#22A0CA]/50 text-white text-sm px-4 py-2 rounded-md">
                      {roadmap.roadMapDetails}
                    </p>
                  </div>

                  <div className="bg-[#1070A9]/70 rounded-lg p-4 mb-4 border border-[#3B8CC2]">
                    <h3 className="text-sm font-semibold text-white mb-3">
                      Description
                    </h3>
                    {/* <div className="text-sm text-white/90">
                      {roadmap.description}
                    </div> */}
                    <div className="text-sm text-white/90 space-y-2">
                      {roadmap.description.split("\n").map((item, index) => (
                        <div key={index}>{item}</div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-lg p-4 mb-4">
                    <h3 className="text-sm font-semibold text-white mb-3">
                      Notes
                    </h3>
                    <textarea
                      placeholder="Write Your Notes here..."
                      className="w-full rounded-md bg-transparent border border-[#52A1D1] text-white text-sm p-3 focus:outline-none focus:ring-1 focus:ring-[#00B3FF] resize-none h-20"
                    ></textarea>
                  </div>

                  <div className="flex items-center justify-between gap-4 mt-6">
                    <div className="flex items-center gap-3">
                      <i className="fa-regular fa-calendar text-white/80 text-sm"></i>
                      <input
                        type="text"
                        readOnly
                        value="10 Nov 2024"
                        className="bg-transparent border border-[#52A1D1] text-sm text-white px-3 py-2 rounded-md focus:outline-none w-[180px]"
                      />
                    </div>
                  </div>

                  {/* Render Dynamic Components */}
                  {roadmap.extras?.map((extra, index) =>
                    renderExtraComponent(extra, index)
                  )}

                  <div className="flex justify-end mt-8">
                    <button
                      onClick={handleSubmit}
                      className="bg-[#103C8C] hover:bg-[#0B2E72] text-white text-sm font-medium px-6 py-2 rounded-md"
                    >
                      Save Progress
                    </button>
                  </div>
                </>
              )}

              {activeTab === "comments" && (
                <>
                  <h2 className="text-xl font-semibold mb-6">Comments</h2>
                  <div className="text-white/70 text-sm">
                    Comments section under construction
                  </div>
                </>
              )}

              {activeTab === "queries" && (
                <>
                  <h2 className="text-[20px] font-semibold mb-4 border-b border-white/30 pb-2">
                    Queries
                  </h2>
                  <div className="text-white/70 text-sm">
                    Queries section under construction
                  </div>
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Phase grid layout
  if (layoutType === "PHASE_GRID_LAYOUT") {
    const filteredRoadmaps =
      roadmap.roadmaps?.filter((sub) => {
        const matchesSearch = sub.name
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
        const matchesFilter = filterTab === "All" || sub.status === filterTab;
        return matchesSearch && matchesFilter;
      }) || [];

    return (
      <div className="min-h-screen flex flex-col bg-[#0F4A85]">
        <PastorHeader showFullHeader={true} />

        {/* HERO SECTION */}
        <section
          className="relative h-[320px] bg-cover bg-center text-white flex flex-col justify-end px-20 pb-10"
          style={{ backgroundImage: `url(${HeroBg.src})` }}
        >
          <div className="absolute inset-0 bg-black/50"></div>
          <div className="relative z-10">
            <p className="text-xs text-white/80 mb-2">
              Revitalization Roadmap &gt;{" "}
              <span className="text-white font-medium">{roadmap.name}</span>
            </p>
            <div className="flex items-center gap-2">
              <span className="bg-[#FFD84E] text-[#0B1C58] text-xs font-semibold px-3 py-[3px] rounded-md">
                {roadmap.phase}
              </span>
              <h1 className="text-3xl font-semibold">{roadmap.name}</h1>
            </div>
          </div>
        </section>

        {/* MAIN CONTENT */}
        <main className="flex-1 px-16 py-10 bg-gradient-to-b from-[#1B5F9E] to-[#0D3971] text-white">
          <div className="max-w-7xl mx-auto">
            {/* Search & Filter Row */}
            <div className="flex justify-between items-center mb-8">
              {/* Search Box */}
              <div className="flex items-center w-[40%] bg-white rounded-md overflow-hidden shadow-sm">
                <i className="fa-solid fa-magnifying-glass text-gray-400 px-3"></i>
                <input
                  type="text"
                  placeholder="Search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 text-sm text-gray-600 focus:outline-none"
                />
              </div>

              {/* Filter Tabs + Menu */}
              <div className="flex items-center gap-3">
                <div className="flex bg-white rounded-lg shadow-sm overflow-hidden p-1">
                  {["All", "completed", "in progress", "submitted"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setFilterTab(tab)}
                      className={`relative px-5 py-[7px] text-sm font-medium transition-all duration-200 ${
                        filterTab === tab
                          ? "bg-[#103C8C] text-white"
                          : "text-gray-500 hover:text-[#103C8C]"
                      }`}
                    >
                      {tab === "All" ? "All" : tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>

                {/* Menu Button */}
                <button className="bg-white rounded-lg w-8 h-10 flex items-center justify-center shadow-sm hover:bg-gray-50">
                  <i className="fa-solid fa-ellipsis-vertical text-[#103C8C]"></i>
                </button>
              </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {filteredRoadmaps.map(renderPhaseCard)}
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Simple phase layout
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#103C8C] to-[#1E5BB8]">
      <PastorHeader />
      <div className="px-8 py-6">
        <div className="bg-white rounded-lg p-8">
          <h1 className="text-3xl font-bold text-[#0B1C58] mb-4">
            {roadmap.name}
          </h1>
          <p className="text-gray-700 mb-6">{roadmap.description}</p>
          <div className="prose max-w-none">
            <p>{roadmap.roadMapDetails}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
