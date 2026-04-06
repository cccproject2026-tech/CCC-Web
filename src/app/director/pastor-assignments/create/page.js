"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import AppHero from "@/app/Components/Hero/AppHero";import MentorBg from "../../../Assets/mentor-bg.png";

export default function CreateAssignmentPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    assignmentName: "",
    generalInstructions: "",
    completionTime: "",
    taskName: "",
    description: "",
    bannerImage: null,
  });
  const [showFieldModal, setShowFieldModal] = useState(false);
  const [selectedFieldType, setSelectedFieldType] = useState(null);
  const [fieldConfig, setFieldConfig] = useState({
    heading: "",
    placeholder: "",
    strategy: "",
    allowDateSelect: false,
  });
  const [dynamicFields, setDynamicFields] = useState([]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, bannerImage: file }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission
    console.log("Form submitted:", formData);
  };

  const handleCancel = () => {
    router.push("/director/pastor-assignments");
  };

  const handleFieldOptionClick = (type) => {
    setSelectedFieldType(type);
  };

  const handleFieldConfigChange = (field, value) => {
    setFieldConfig((prev) => ({ ...prev, [field]: value }));
  };

  const handleInsertField = () => {
    // Add field to dynamic fields list
    const newField = {
      id: Date.now(),
      type: selectedFieldType,
      config: { ...fieldConfig },
    };
    setDynamicFields((prev) => [...prev, newField]);

    // Close modal and reset
    handleCloseModal();
  };

  const handleClearField = () => {
    setFieldConfig({
      heading: "",
      placeholder: "",
      strategy: "",
      allowDateSelect: false,
    });
  };

  const handleRemoveField = (id) => {
    setDynamicFields((prev) => prev.filter((field) => field.id !== id));
  };

  const handleCloseModal = () => {
    setShowFieldModal(false);
    setSelectedFieldType(null);
    setFieldConfig({
      heading: "",
      placeholder: "",
      strategy: "",
      allowDateSelect: false,
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#1b598f] to-[#2876AC]">
      <AppHero title="Assignments" backgroundImageUrl={MentorBg.src} />

      {/* Content Section */}
      <section className="relative px-4 sm:px-6 md:px-12 lg:px-20 py-6 md:py-8">
        <div className="max-w-[900px] mx-auto">
          {/* Form Card */}
          <div className="rounded-xl overflow-hidden">
            {/* Form Header */}
            <div className="px-8 py-6 border-b border-white/30">
              <h2 className="text-[24px] font-bold text-white">
                Create - Assignment
              </h2>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              {/* Name of Assignment */}
              <div>
                <label className="block text-[15px] font-semibold text-white mb-2">
                  Name of Assignment
                </label>
                <input
                  type="text"
                  value={formData.assignmentName}
                  onChange={(e) =>
                    handleChange("assignmentName", e.target.value)
                  }
                  placeholder="Enter Name of Assignment"
                  className="w-full px-4 py-3 rounded-lg bg-white/30 border border-white/50 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 text-[15px]"
                />
              </div>

              {/* General Instructions */}
              <div>
                <label className="block text-[15px] font-semibold text-white mb-2">
                  General Instructions
                </label>
                <textarea
                  value={formData.generalInstructions}
                  onChange={(e) =>
                    handleChange("generalInstructions", e.target.value)
                  }
                  placeholder="Brief Description for Instructions"
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg bg-white/30 border border-white/50 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 text-[15px] resize-none"
                />
              </div>

              {/* Completion Time */}
              <div>
                <label className="block text-[15px] font-semibold text-white mb-2">
                  Completion Time
                </label>
                <div className="flex items-center gap-3">
                  <span className="text-[15px] font-medium text-white whitespace-nowrap">
                    Months:
                  </span>
                  <input
                    type="number"
                    value={formData.completionTime}
                    onChange={(e) =>
                      handleChange("completionTime", e.target.value)
                    }
                    placeholder="Enter months"
                    className="w-full px-4 py-3 rounded-lg bg-white/30 border border-white/50 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 text-[15px]"
                  />
                </div>
              </div>

              {/* Name of Task */}
              <div>
                <label className="block text-[15px] font-semibold text-white mb-2">
                  Name of Task
                </label>
                <input
                  type="text"
                  value={formData.taskName}
                  onChange={(e) => handleChange("taskName", e.target.value)}
                  placeholder="Enter Name of Task"
                  className="w-full px-4 py-3 rounded-lg bg-white/30 border border-white/50 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 text-[15px]"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-[15px] font-semibold text-white mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder="Brief Description for Thumbnail"
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg bg-white/30 border border-white/50 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 text-[15px] resize-none"
                />
              </div>

              {/* Upload Banner Image */}
              <div>
                <label className="block text-[15px] font-semibold text-white mb-2">
                  Upload Banner Image
                </label>
                <div className="relative">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                    id="banner-upload"
                  />
                  <label
                    htmlFor="banner-upload"
                    className="flex flex-col items-center justify-center w-full h-[200px] border-2 border-dashed border-white/50 rounded-lg bg-white/10 cursor-pointer hover:border-white/70 hover:bg-white/20 transition-all"
                  >
                    {formData.bannerImage ? (
                      <div className="text-center">
                        <i className="fa-solid fa-check-circle text-green-400 text-4xl mb-2"></i>
                        <p className="text-[14px] text-white">
                          {formData.bannerImage.name}
                        </p>
                      </div>
                    ) : (
                      <>
                        <i className="fa-solid fa-plus text-white/70 text-4xl mb-3"></i>
                        <p className="text-[15px] font-medium text-white mb-1">
                          Drag & Drop or Click here to choose file
                        </p>
                        <p className="text-[13px] text-white/70 flex items-center gap-1">
                          Max file size: 10 MB
                          <i className="fa-solid fa-circle-info text-white/70 text-xs"></i>
                        </p>
                      </>
                    )}
                  </label>
                </div>
              </div>

              {/* Dynamic Fields */}
              {dynamicFields.map((field) => (
                <div key={field.id} className="relative">
                  <label className="block text-[15px] font-semibold text-white mb-2">
                    {field.config.heading ||
                      `${
                        field.type.charAt(0).toUpperCase() + field.type.slice(1)
                      } Field`}
                  </label>
                  {field.type === "text" && (
                    <input
                      type="text"
                      placeholder={field.config.placeholder || "Enter text"}
                      className="w-full px-4 py-3 rounded-lg bg-white/30 border border-white/50 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 text-[15px]"
                    />
                  )}
                  {field.type === "textarea" && (
                    <textarea
                      placeholder={field.config.placeholder || "Enter text"}
                      rows={4}
                      className="w-full px-4 py-3 rounded-lg bg-white/30 border border-white/50 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 text-[15px] resize-none"
                    />
                  )}
                  {field.type === "upload" && (
                    <div className="relative">
                      <input
                        type="file"
                        id={`upload-${field.id}`}
                        className="w-full px-4 py-3 rounded-lg bg-white/30 border border-white/50 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-white/20 file:text-white hover:file:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 text-[15px] cursor-pointer"
                      />
                    </div>
                  )}
                  {field.type === "date" && (
                    <input
                      type="date"
                      className="w-full px-4 py-3 rounded-lg bg-white/30 border border-white/50 text-white focus:outline-none focus:ring-2 focus:ring-white/50 text-[15px]"
                      style={{
                        colorScheme: "dark",
                      }}
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveField(field.id)}
                    className="absolute top-8 right-2 w-8 h-8 flex items-center justify-center text-red-400 hover:text-red-500 transition-colors"
                  >
                    <i className="fa-solid fa-trash text-sm"></i>
                  </button>
                </div>
              ))}

              {/* Dynamic Field Addition */}
              <div>
                <label className="block text-[15px] font-semibold text-white mb-2">
                  Insert Field
                </label>
                <button
                  type="button"
                  onClick={() => setShowFieldModal(true)}
                  className="flex items-center gap-2 px-5 py-3 bg-white/30 hover:bg-white/40 rounded-lg text-[15px] font-semibold text-white transition-all"
                >
                  <i className="fa-solid fa-plus"></i>
                  <span>Add Field</span>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-4 pt-6 border-t border-white/30">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 px-6 py-3 bg-white/30 hover:bg-white/40 border-2 border-white/50 text-white rounded-lg text-[15px] font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-[#2E3B8E] text-white rounded-lg text-[15px] font-semibold hover:bg-[#1F2A6E] transition-all"
                >
                  Create Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Field Configuration Modal */}
      {showFieldModal && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-[100]"
            onClick={handleCloseModal}
          ></div>
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl overflow-hidden w-[400px] relative">
              {/* Close Button */}
              <button
                onClick={handleCloseModal}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-lg transition-all z-10"
              >
                <i className="fa-solid fa-xmark text-gray-600 text-sm"></i>
              </button>

              {!selectedFieldType ? (
                // Field Selection
                <>
                  <div className="px-5 py-4 border-b border-gray-200">
                    <h3 className="text-[18px] font-bold text-gray-900">
                      Select Field Type
                    </h3>
                  </div>
                  <div className="py-3">
                    <button
                      onClick={() => handleFieldOptionClick("text")}
                      className="w-full px-5 py-3 flex items-center gap-3 text-gray-700 hover:bg-gray-50 transition-all"
                    >
                      <div className="w-8 h-8 flex items-center justify-center">
                        <i className="fa-solid fa-text-height text-blue-600 text-lg"></i>
                      </div>
                      <span className="text-[15px] font-medium">
                        Text Field
                      </span>
                    </button>
                    <div className="border-t border-blue-100 border-dashed mx-5"></div>
                    <button
                      onClick={() => handleFieldOptionClick("textarea")}
                      className="w-full px-5 py-3 flex items-center gap-3 text-gray-700 hover:bg-gray-50 transition-all"
                    >
                      <div className="w-8 h-8 flex items-center justify-center">
                        <i className="fa-solid fa-align-left text-blue-600 text-lg"></i>
                      </div>
                      <span className="text-[15px] font-medium">Text Area</span>
                    </button>
                    <div className="border-t border-blue-100 border-dashed mx-5"></div>
                    <button
                      onClick={() => handleFieldOptionClick("upload")}
                      className="w-full px-5 py-3 flex items-center gap-3 text-gray-700 hover:bg-gray-50 transition-all"
                    >
                      <div className="w-8 h-8 flex items-center justify-center">
                        <i className="fa-solid fa-cloud-arrow-up text-blue-600 text-lg"></i>
                      </div>
                      <span className="text-[15px] font-medium">
                        Upload Field
                      </span>
                    </button>
                    <div className="border-t border-blue-100 border-dashed mx-5"></div>
                    <button
                      onClick={() => handleFieldOptionClick("date")}
                      className="w-full px-5 py-3 flex items-center gap-3 text-gray-700 hover:bg-gray-50 transition-all"
                    >
                      <div className="w-8 h-8 flex items-center justify-center">
                        <i className="fa-solid fa-calendar text-blue-600 text-lg"></i>
                      </div>
                      <span className="text-[15px] font-medium">
                        Date Picker
                      </span>
                    </button>
                  </div>
                </>
              ) : (
                // Field Configuration
                <>
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-[18px] font-bold text-gray-900">
                      {selectedFieldType === "text"
                        ? "Text Field"
                        : selectedFieldType === "textarea"
                        ? "Text Area"
                        : selectedFieldType === "upload"
                        ? "Upload Field"
                        : "Date Picker"}
                    </h3>
                  </div>
                  <div className="p-6 space-y-4">
                    {/* Heading Field */}
                    <div>
                      <label className="block text-[14px] font-semibold text-gray-700 mb-2">
                        Heading
                      </label>
                      <input
                        type="text"
                        value={fieldConfig.heading}
                        onChange={(e) =>
                          handleFieldConfigChange("heading", e.target.value)
                        }
                        placeholder={
                          selectedFieldType === "upload"
                            ? "Upload Strategy"
                            : "Enter Heading of the field"
                        }
                        className="w-full px-4 py-2.5 rounded-lg border-2 border-dashed border-blue-300 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 text-[14px]"
                      />
                    </div>

                    {/* Placeholder Field (for text, textarea) */}
                    {(selectedFieldType === "text" ||
                      selectedFieldType === "textarea") && (
                      <div>
                        <label className="block text-[14px] font-semibold text-gray-700 mb-2">
                          Place Holder
                        </label>
                        <input
                          type="text"
                          value={fieldConfig.placeholder}
                          onChange={(e) =>
                            handleFieldConfigChange(
                              "placeholder",
                              e.target.value
                            )
                          }
                          placeholder="Enter Place Holder"
                          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 text-[14px]"
                        />
                      </div>
                    )}

                    {/* Upload Strategy (for upload) */}
                    {selectedFieldType === "upload" && (
                      <div>
                        <label className="block text-[14px] font-semibold text-gray-700 mb-2">
                          Upload Strategy
                        </label>
                        <input
                          type="text"
                          value={fieldConfig.strategy}
                          onChange={(e) =>
                            handleFieldConfigChange("strategy", e.target.value)
                          }
                          placeholder="Upload Strategy"
                          className="w-full px-4 py-2.5 rounded-lg border-2 border-dashed border-blue-300 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 text-[14px]"
                        />
                      </div>
                    )}

                    {/* Date Select Checkbox (for date) */}
                    {selectedFieldType === "date" && (
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={fieldConfig.allowDateSelect}
                            onChange={(e) =>
                              handleFieldConfigChange(
                                "allowDateSelect",
                                e.target.checked
                              )
                            }
                            className="w-5 h-5 appearance-none border-2 border-blue-600 rounded checked:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                          />
                          {fieldConfig.allowDateSelect && (
                            <i className="fa-solid fa-check absolute top-0.5 left-0.5 text-white text-xs pointer-events-none"></i>
                          )}
                        </div>
                        <label className="text-[14px] font-medium text-gray-700">
                          Allow Paster to Select Date
                        </label>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end gap-3 pt-4">
                      <button
                        onClick={handleClearField}
                        className="px-5 py-2.5 bg-white border-2 border-blue-600 text-blue-600 rounded-lg text-[14px] font-semibold hover:bg-gray-50 transition-all"
                      >
                        Clear
                      </button>
                      <button
                        onClick={handleInsertField}
                        className="px-5 py-2.5 bg-[#2E3B8E] text-white rounded-lg text-[14px] font-semibold hover:bg-[#1F2A6E] transition-all"
                      >
                        Insert Field
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}    </div>
  );
}
