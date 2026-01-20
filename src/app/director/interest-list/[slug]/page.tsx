"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import AppFooter from "@/app/Components/AppFooter";
import MentorBg from "../../../Assets/mentor-bg.png";
import Mentor1 from "../../../Assets/mentor1.png";
import Image from "next/image";
import { apiGetInterestById, apiUpdateInterestStatus } from "@/app/Services/interests.service";
import { Interest } from "@/app/Services/types";

export default function InterestDetailPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug;

  const [activeTab, setActiveTab] = useState("details");
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [toast, setToast] = useState(null);

  const [interestData, setInterestData] = useState<Interest | null>(null);
  const [loading, setLoading] = useState(true);

  // Mock data for the specific interest/pastor
  // const interestData = {
  //   id: slug,
  //   name: "Robert Fox",
  //   role: "Pastor",
  //   email: "robert.fox@email.com",
  //   phone: "+1 (555) 123-4567",
  //   church: "Grace Community Church",
  //   location: "New York, NY",
  //   status: "new",
  //   timestamp: "09:43 AM",
  //   date: "15 Nov 2024",
  //   image: Mentor1,
  //   bio: "Experienced pastor with over 15 years of ministry experience. Passionate about community outreach and church growth.",
  //   interests: [
  //     "Community Engagement",
  //     "Church Growth",
  //     "Leadership Development",
  //     "Pastoral Care",
  //   ],
  //   experience: "15+ years",
  //   education: "Master of Divinity, Seminary University",
  //   languages: ["English", "Spanish"],
  //   availability: "Monday - Friday, 9 AM - 5 PM EST",
  // };

  useEffect(() => {
    if (!slug) return;

    const fetchInterest = async () => {
      try {
        setLoading(true);
        const res = await apiGetInterestById(slug as string);
        setInterestData(res.data.data);
      } catch (err) {
        console.error("Failed to fetch interest", err);
      } finally {
        setLoading(false);
      }
    };

    fetchInterest();
  }, [slug]);

  const handleAssign = () => {
    setShowAssignModal(false);
    setToast("Interest assigned to mentor successfully");
    setTimeout(() => setToast(null), 3000);
  };

  const handleReject = async () => {
    if (!interestData) return;

    try {
      await apiUpdateInterestStatus(interestData?.userId, "rejected");

      setInterestData({
        ...interestData,
        status: "rejected",
      });

      setToast("Interest rejected successfully");
      setShowRejectModal(false);

      setTimeout(() => {
        router.back();
      }, 1200);
    } catch (error) {
      console.error("Failed to reject interest", error);
      setToast("Failed to reject interest");
    } finally {
      setTimeout(() => setToast(null), 3000);
    }
  };


  const handleAccept = async () => {
    if (!interestData) return;

    try {
      console.log(interestData)
      await apiUpdateInterestStatus(interestData?.userId, "accepted");

      setInterestData({
        ...interestData,
        status: "accepted",
      });

      setToast("Interest accepted successfully");

      setTimeout(() => {
        router.back(); 
      }, 1200);

    } catch (error) {
      console.error("Failed to accept interest", error);
      setToast("Failed to accept interest");
    } finally {
      setTimeout(() => setToast(null), 3000);
    }
  };

  const church = interestData?.churchDetails?.[0];

  if (loading || !interestData) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Loading interest details...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#1b598f] to-[#2876AC]">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-400 p-12 text-center mb-8">
        <h1 className="text-4xl font-bold text-white">Interest Details</h1>
      </div>

      {/* Main Content */}
      <section className="relative px-4 sm:px-6 md:px-12 lg:px-20 py-8">
        <div className="max-w-[1400px] mx-auto">
          {/* Back Button */}
          <div className="mb-6">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 px-4 py-2 bg-white text-[#2E3B8E] rounded-lg font-semibold hover:bg-gray-50 transition-all"
            >
              <i className="fa-solid fa-arrow-left"></i>
              Back to Interest List
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Profile Card */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-lg p-6 sticky top-6">
                {/* Profile Image */}
                <div className="flex justify-center mb-6">
                  <div className="relative w-32 h-32 rounded-full overflow-hidden">
                    <Image
                      src={interestData.profilePicture || Mentor1}
                      alt={`${interestData.firstName} ${interestData.lastName}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Name and Role */}
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {interestData.firstName} {interestData.lastName}
                  </h2>
                  <p className="text-lg text-gray-600 mb-2">
                    {interestData.title}
                  </p>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${interestData.status === "new"
                      ? "bg-green-100 text-green-700"
                      : interestData.status === "pending"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-blue-100 text-blue-700"
                      }`}
                  >
                    {interestData.status.charAt(0).toUpperCase() +
                      interestData.status.slice(1)}
                  </span>
                </div>

                {/* Contact Information */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3">
                    <i className="fa-solid fa-envelope text-[#2E3B8E]"></i>
                    <span className="text-gray-700">{interestData.email}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <i className="fa-solid fa-phone text-[#2E3B8E]"></i>
                    <span className="text-gray-700">{interestData.phoneNumber}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <i className="fa-solid fa-church text-[#2E3B8E]"></i>
                    <span className="text-gray-700">
                      {church?.churchName ?? "—"}
                    </span>
                    <span className="text-gray-700">
                      {church
                        ? `${church.city ?? ""}${church.city && church.state ? ", " : ""}${church.state ?? ""}${church.country ? `, ${church.country}` : ""}`
                        : "—"}
                    </span>
                  </div>
                  {/* <div className="flex items-center gap-3">
                    <i className="fa-solid fa-location-dot text-[#2E3B8E]"></i>
                    <span className="text-gray-700">
                      {interestData.location}
                    </span>
                  </div> */}
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <button
                    onClick={() => setShowAssignModal(true)}
                    className="w-full px-4 py-3 bg-[#2E3B8E] text-white rounded-lg font-semibold hover:bg-[#1F2A6E] transition-all"
                  >
                    Assign to Mentor
                  </button>
                  <button
                    onClick={handleAccept}
                    className="w-full px-4 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all"
                  >
                    Accept Interest
                  </button>
                  <button
                    onClick={() => setShowRejectModal(true)}
                    className="w-full px-4 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-all"
                  >
                    Reject Interest
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column - Details */}
            <div className="lg:col-span-2">
              {/* Tabs */}
              <div className="bg-white rounded-xl shadow-lg mb-6">
                <div className="flex border-b">
                  <button
                    onClick={() => setActiveTab("details")}
                    className={`px-6 py-4 font-semibold text-sm transition-all ${activeTab === "details"
                      ? "text-[#2E3B8E] border-b-2 border-[#2E3B8E]"
                      : "text-gray-600 hover:text-gray-800"
                      }`}
                  >
                    Details
                  </button>
                  <button
                    onClick={() => setActiveTab("interests")}
                    className={`px-6 py-4 font-semibold text-sm transition-all ${activeTab === "interests"
                      ? "text-[#2E3B8E] border-b-2 border-[#2E3B8E]"
                      : "text-gray-600 hover:text-gray-800"
                      }`}
                  >
                    Interests & Goals
                  </button>
                  <button
                    onClick={() => setActiveTab("history")}
                    className={`px-6 py-4 font-semibold text-sm transition-all ${activeTab === "history"
                      ? "text-[#2E3B8E] border-b-2 border-[#2E3B8E]"
                      : "text-gray-600 hover:text-gray-800"
                      }`}
                  >
                    History
                  </button>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                  {activeTab === "details" && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-3">
                          Personal Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">
                              Experience
                            </label>
                            <p className="text-gray-800">
                              {interestData.experience}
                            </p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">
                              Education
                            </label>
                            <p className="text-gray-800">
                              {interestData.education}
                            </p>
                          </div>
                          {/* <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">
                              Languages
                            </label>
                            <p className="text-gray-800">
                              {interestData.languages.join(", ")}
                            </p>
                          </div> */}
                          <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">
                              Availability
                            </label>
                            <p className="text-gray-800">
                              {interestData.availability}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-3">
                          Bio
                        </h3>
                        <p className="text-gray-700 leading-relaxed">
                          {interestData.bio}
                        </p>
                      </div>
                    </div>
                  )}

                  {activeTab === "interests" && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-3">
                          Areas of Interest
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {interestData.interests.map((interest, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-[#2E3B8E]/10 text-[#2E3B8E] rounded-full text-sm font-medium"
                            >
                              {interest}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-3">
                          Goals & Objectives
                        </h3>
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <i className="fa-solid fa-check-circle text-green-500 mt-1"></i>
                            <p className="text-gray-700">
                              Develop stronger community engagement strategies
                            </p>
                          </div>
                          <div className="flex items-start gap-3">
                            <i className="fa-solid fa-check-circle text-green-500 mt-1"></i>
                            <p className="text-gray-700">
                              Improve church leadership and management skills
                            </p>
                          </div>
                          <div className="flex items-start gap-3">
                            <i className="fa-solid fa-check-circle text-green-500 mt-1"></i>
                            <p className="text-gray-700">
                              Learn effective pastoral care techniques
                            </p>
                          </div>
                          <div className="flex items-start gap-3">
                            <i className="fa-solid fa-check-circle text-green-500 mt-1"></i>
                            <p className="text-gray-700">
                              Build sustainable church growth programs
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "history" && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-3">
                          Application Timeline
                        </h3>
                        <div className="space-y-4">
                          <div className="flex items-center gap-4">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <div>
                              <p className="font-medium text-gray-800">
                                Interest Submitted
                              </p>
                              <p className="text-sm text-gray-600">
                                {new Date(interestData.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                            <div>
                              <p className="font-medium text-gray-800">
                                Under Review
                              </p>
                              <p className="text-sm text-gray-600">Pending</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                            <div>
                              <p className="font-medium text-gray-800">
                                Mentor Assignment
                              </p>
                              <p className="text-sm text-gray-600">Pending</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-3">
                          Previous Interactions
                        </h3>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="text-gray-600 text-sm">
                            No previous interactions recorded.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 animate-fade-in">
          <div className="bg-white rounded-xl px-6 py-4 shadow-2xl flex items-center gap-3">
            <i className="fa-solid fa-circle-check text-green-500 text-xl"></i>
            <span className="text-gray-800 font-semibold">{toast}</span>
          </div>
        </div>
      )}

      {/* Assign Mentor Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-xl font-bold mb-4">Assign to Mentor</h3>
              <p className="text-gray-600 mb-6">
                Select a mentor to assign this interest to.
              </p>
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input type="radio" name="mentor" className="w-4 h-4" />
                  <div>
                    <p className="font-medium">John Doe</p>
                    <p className="text-sm text-gray-600">Mentor</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input type="radio" name="mentor" className="w-4 h-4" />
                  <div>
                    <p className="font-medium">Jacob Jones</p>
                    <p className="text-sm text-gray-600">Field Mentor</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssign}
                  className="flex-1 px-4 py-2 bg-[#2E3B8E] text-white rounded-lg font-semibold hover:bg-[#1F2A6E]"
                >
                  Assign
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-xl font-bold mb-4">Reject Interest</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to reject this interest? This action
                cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700"
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <AppFooter />
    </div>
  );
}
