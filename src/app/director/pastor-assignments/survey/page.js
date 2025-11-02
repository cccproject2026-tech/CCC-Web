"use client";
import { useState } from "react";
import AppFooter from "@/app/Components/AppFooter";
import MentorBg from "../../../Assets/mentor-bg.png";

export default function SurveyPage() {
  const [activeSection, setActiveSection] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [showAddSectionModal, setShowAddSectionModal] = useState(false);
  const [showRecommendationsModal, setShowRecommendationsModal] =
    useState(false);
  const [showSelectSurveyModal, setShowSelectSurveyModal] = useState(false);
  const [currentLayer, setCurrentLayer] = useState(null);
  const [selectedSurvey, setSelectedSurvey] = useState(null);

  const sections = [
    {
      id: 1,
      name: "Congregational Well being (biopyschosocial (BPS)/financial/spiritual filter)",
      active: true,
    },
    { id: 2, name: "Leadership (Elders, CB, etc.) Style", active: false },
    { id: 3, name: "Community Engagement History", active: false },
    { id: 4, name: "Pastoral Leadership", active: false },
    {
      id: 5,
      name: "Christ's Method Alone (CMA) and Cycle of Evangelism",
      active: false,
    },
  ];

  const recommendations = [
    "Schedule 1-on-1 with a mentor",
    "Take trauma survey (via Claritysoft)",
    "Identify areas of stress/anxiety",
    "Family Wellbeing survey",
    "Collaborate on a healing plan",
    "Collaborate on a physical Exercise plan",
    "Establish a prayer",
    "Covenant/partnership",
    "Finalize a growth plan",
  ];

  const handleDeleteSelected = () => {
    setSelectedOptions([]);
  };

  const handleOptionToggle = (optionIndex) => {
    setSelectedOptions((prev) =>
      prev.includes(optionIndex)
        ? prev.filter((i) => i !== optionIndex)
        : [...prev, optionIndex]
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#1b598f] to-[#2876AC]">
      <div className="flex flex-1">
        {/* Sidebar */}
        <div className="w-80 bg-[#2E3B8E]/20 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800">Section</h2>
            <button
              onClick={() => setShowAddSectionModal(true)}
              className="px-4 py-2 bg-[#2E3B8E] text-white rounded-lg text-sm font-semibold hover:bg-[#1F2A6E]"
            >
              Edit Next Section
            </button>
          </div>
          <div className="space-y-2">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full text-left p-4 rounded-lg transition-all ${
                  activeSection === section.id
                    ? "bg-[#2E3B8E] text-white"
                    : "bg-white text-gray-700 hover:bg-[#2E3B8E]/10"
                }`}
              >
                <div className="font-semibold mb-1">Section {section.id}:</div>
                <div className="text-sm">{section.name}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          {/* Header */}
          <div className="bg-[#2E3B8E] p-8 rounded-xl mb-6">
            <h1 className="text-3xl font-bold text-white mb-2">
              Comprehensive Self Assessment Survey
            </h1>
            <p className="text-white text-lg">
              This survey is about your current personal well being.
            </p>
          </div>

          {/* Survey Guidelines */}
          <div className="bg-white rounded-xl p-6 shadow-lg mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-800">
                Survey Guidelines
              </h2>
              {selectedOptions.length > 0 && (
                <div className="flex items-center gap-3">
                  <span className="text-gray-600">
                    {selectedOptions.length} Selected
                  </span>
                  <button
                    onClick={handleDeleteSelected}
                    className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-all"
                  >
                    <i className="fa-solid fa-trash"></i>
                    Delete
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-3 mb-6">
              {[
                "Please complete the survey in a single session without taking breaks.",
                "If there is a power outage or loss of internet connection, the survey will restart from the beginning.",
                "You will not be able to return to previous sections.",
                "This survey consists of 5 sections to complete.",
                "The survey should take approximately 45 minutes to complete.",
              ].map((guideline, index) => (
                <label
                  key={index}
                  className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={selectedOptions.includes(index)}
                    onChange={() => handleOptionToggle(index)}
                    className="w-5 h-5 rounded text-[#2E3B8E]"
                  />
                  <span className="text-gray-700">{guideline}</span>
                </label>
              ))}
            </div>

            <div className="flex gap-4">
              <button className="px-6 py-2 bg-white border-2 border-[#2E3B8E] text-[#2E3B8E] rounded-lg font-semibold hover:bg-[#2E3B8E]/10">
                Cancel
              </button>
              <button className="px-6 py-2 bg-[#2E3B8E] text-white rounded-lg font-semibold hover:bg-[#1F2A6E]">
                Save Changes
              </button>
            </div>
          </div>

          {/* Survey Questions Section */}
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <p className="text-gray-700">
                Choose the option that best matches how you feel and who you
                are, as this self-assessment helps you understand yourself
                better. Your accuracy allows us to provide the best support and
                guidance.
              </p>
            </div>

            {/* Survey Questions */}
            {[1, 2, 3, 4].map((qIndex) => (
              <div key={qIndex} className="mb-6 p-6 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() => setShowRecommendationsModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-[#2E3B8E] text-white rounded-lg hover:bg-[#1F2A6E]"
                  >
                    <i className="fa-solid fa-pencil"></i>
                    Edit Recommendations
                  </button>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setShowSelectSurveyModal(true);
                        setCurrentLayer(qIndex);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-[#2E3B8E] text-[#2E3B8E] rounded-lg hover:bg-[#2E3B8E]/10"
                    >
                      <i className="fa-solid fa-check"></i>
                      Select
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-[#2E3B8E] text-[#2E3B8E] rounded-lg hover:bg-[#2E3B8E]/10">
                      Layer
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {[
                    "CMA is not embodied in the life of the church",
                    "Church does not fully understanding the CMA approach in relationship to evangelism",
                    "Congregation has a good grasp but has not fully implemented practices of CMA",
                    "The church is fully committed to and practices the CMA approach",
                  ].map((option, optIndex) => (
                    <label
                      key={optIndex}
                      className="flex items-start gap-3 cursor-pointer p-4 bg-white rounded-lg hover:bg-[#2E3B8E]/10 transition-all"
                    >
                      <input
                        type="radio"
                        name={`question-${qIndex}`}
                        className="w-5 h-5 mt-1"
                      />
                      <span className="text-gray-700">{option}</span>
                    </label>
                  ))}
                </div>

                <button className="mt-4 w-full py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300">
                  Choice
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Section Modal */}
      {showAddSectionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gray-50 px-6 py-4 flex items-center justify-between border-b">
              <h2 className="text-2xl font-bold">Add Section</h2>
              <button
                onClick={() => setShowAddSectionModal(false)}
                className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
              >
                <i className="fa-solid fa-times"></i>
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block font-semibold mb-2">Section 6</label>
                <input
                  type="text"
                  placeholder="Enter Name of Section"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#2E3B8E]"
                />
              </div>

              <div>
                <label className="block font-semibold mb-2">Guidelines</label>
                <input
                  type="text"
                  placeholder="Enter Guidelines"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#2E3B8E]"
                />
              </div>

              <div>
                <label className="block font-semibold mb-2">
                  Number of Layers
                </label>
                <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#2E3B8E]">
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                </select>
              </div>

              {/* Layer 1 */}
              <div className="border-t pt-4">
                <label className="block font-semibold mb-2">Layer 1</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Choice 1"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#2E3B8E]"
                  />
                  <button className="px-4 py-2 bg-[#2E3B8E] text-white rounded-lg hover:bg-[#1F2A6E] flex items-center gap-2">
                    <i className="fa-solid fa-plus"></i>
                    Choice
                  </button>
                </div>
              </div>

              {/* Layer 1 - Customized Development Plans */}
              <div>
                <label className="block font-semibold mb-2">
                  Layer 1 - Customized Development Plans
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Choice 1"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#2E3B8E]"
                  />
                  <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2">
                    <i className="fa-solid fa-plus"></i>
                    Plan
                  </button>
                </div>
              </div>

              {/* Layer 2 */}
              <div className="border-t pt-4">
                <label className="block font-semibold mb-2">Layer 2</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Choice 1"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#2E3B8E]"
                  />
                  <button className="px-4 py-2 bg-[#2E3B8E] text-white rounded-lg hover:bg-[#1F2A6E] flex items-center gap-2">
                    <i className="fa-solid fa-plus"></i>
                    Choice
                  </button>
                </div>
              </div>

              {/* Layer 2 - Customized Development Plans */}
              <div>
                <label className="block font-semibold mb-2">
                  Layer 2 - Customized Development Plans
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Choice 1"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#2E3B8E]"
                  />
                  <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2">
                    <i className="fa-solid fa-plus"></i>
                    Plan
                  </button>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex items-center justify-end gap-3 border-t">
              <button
                onClick={() => setShowAddSectionModal(false)}
                className="px-6 py-2 border-2 border-[#2E3B8E] text-[#2E3B8E] rounded-lg font-semibold hover:bg-[#2E3B8E]/10"
              >
                Cancel
              </button>
              <button className="px-6 py-2 bg-[#2E3B8E] text-white rounded-lg font-semibold hover:bg-[#1F2A6E]">
                Create Section
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recommendations Modal */}
      {showRecommendationsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-[#2E3B8E] px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">
                Layer 1 - Recommendations
              </h2>
              <button
                onClick={() => setShowRecommendationsModal(false)}
                className="w-8 h-8 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 flex items-center justify-center text-white"
              >
                <i className="fa-solid fa-times"></i>
              </button>
            </div>

            <div className="flex bg-gray-100 border-b">
              <button className="flex-1 px-6 py-3 bg-[#2E3B8E] text-white font-semibold flex items-center justify-center gap-2">
                <i className="fa-solid fa-pencil"></i>
                Select
              </button>
              <button className="flex-1 px-6 py-3 bg-white text-[#2E3B8E] font-semibold flex items-center justify-center gap-2">
                <i className="fa-solid fa-plus"></i>
                Suggestion
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-3">
                {recommendations.map((rec, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-4 bg-gray-100 rounded-lg"
                  >
                    <i className="fa-solid fa-star text-yellow-500"></i>
                    <span className="text-gray-700">{rec}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 flex items-center justify-end gap-3 border-t">
              <button
                onClick={() => setShowRecommendationsModal(false)}
                className="px-6 py-2 bg-white border-2 border-[#2E3B8E] text-[#2E3B8E] rounded-lg font-semibold hover:bg-[#2E3B8E]/10"
              >
                Cancel
              </button>
              <button className="px-6 py-2 bg-[#2E3B8E] text-white rounded-lg font-semibold hover:bg-[#1F2A6E]">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Select Survey Modal */}
      {showSelectSurveyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-[#2E3B8E] px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">
                Layer 1 - Recommendations
              </h2>
              <button
                onClick={() => setShowSelectSurveyModal(false)}
                className="w-8 h-8 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 flex items-center justify-center text-white"
              >
                <i className="fa-solid fa-times"></i>
              </button>
            </div>

            <div className="px-6 py-4 flex items-center justify-between bg-gray-50 border-b">
              <span className="font-semibold text-gray-700">
                {selectedOptions.length} Selected
              </span>
              <button
                onClick={handleDeleteSelected}
                className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
              >
                <i className="fa-solid fa-trash"></i>
                Delete
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-3">
                {recommendations.map((rec, index) => (
                  <label
                    key={index}
                    className={`flex items-center gap-3 p-4 rounded-lg cursor-pointer transition-all ${
                      selectedOptions.includes(index)
                        ? "bg-[#2E3B8E] text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedOptions.includes(index)}
                      onChange={() => handleOptionToggle(index)}
                      className="w-5 h-5 rounded"
                    />
                    <span>{rec}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 flex items-center justify-end gap-3 border-t">
              <button
                onClick={() => setShowSelectSurveyModal(false)}
                className="px-6 py-2 bg-white border-2 border-[#2E3B8E] text-[#2E3B8E] rounded-lg font-semibold hover:bg-[#2E3B8E]/10"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <AppFooter />
    </div>
  );
}
