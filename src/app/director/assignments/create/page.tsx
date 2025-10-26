"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import AppHeader from "@/app/Components/AppHeader";
import AppFooter from "@/app/Components/AppFooter";
import AppHero from "@/app/Components/AppHero";
import RoadmapBg from "../../../Assets/roadmap-bg.png";

interface CustomField {
  id: string;
  type: "text" | "textarea" | "upload" | "date";
  heading: string;
  placeholder?: string;
  allowPastorSelect?: boolean;
}

export default function CreateAssignmentPage() {
  const router = useRouter();
  const [toast, setToast] = useState<string | null>(null);
  const [showInsertFieldMenu, setShowInsertFieldMenu] = useState(false);
  const [showFieldModal, setShowFieldModal] = useState(false);
  const [fieldModalType, setFieldModalType] = useState<string>("");
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);

  // Form for field modal
  const [fieldHeading, setFieldHeading] = useState("");
  const [fieldPlaceholder, setFieldPlaceholder] = useState("");
  const [allowPastorSelect, setAllowPastorSelect] = useState(false);

  const handleCreateAssignment = () => {
    setToast("Assignment Created Successfully");
    setTimeout(() => {
      setToast(null);
      router.push("/director/assignments");
    }, 2000);
  };

  const handleCancel = () => {
    router.push("/director/assignments");
  };

  const handleInsertField = (type: string) => {
    setFieldModalType(type);
    setShowInsertFieldMenu(false);
    setShowFieldModal(true);
    setFieldHeading("");
    setFieldPlaceholder("");
    setAllowPastorSelect(false);
    setEditingFieldId(null);
  };

  const handleSaveField = () => {
    const newField: CustomField = {
      id: editingFieldId || Date.now().toString(),
      type: fieldModalType as "text" | "textarea" | "upload" | "date",
      heading: fieldHeading,
      placeholder: fieldPlaceholder,
      allowPastorSelect: allowPastorSelect,
    };

    if (editingFieldId) {
      setCustomFields(
        customFields.map((field) =>
          field.id === editingFieldId ? newField : field
        )
      );
    } else {
      setCustomFields([...customFields, newField]);
    }

    setShowFieldModal(false);
    setFieldHeading("");
    setFieldPlaceholder("");
    setAllowPastorSelect(false);
    setEditingFieldId(null);
  };

  const handleEditField = (fieldId: string) => {
    const field = customFields.find((f) => f.id === fieldId);
    if (field) {
      setEditingFieldId(fieldId);
      setFieldModalType(field.type);
      setFieldHeading(field.heading);
      setFieldPlaceholder(field.placeholder || "");
      setAllowPastorSelect(field.allowPastorSelect || false);
      setShowFieldModal(true);
    }
  };

  const handleRemoveField = (fieldId: string) => {
    setCustomFields(customFields.filter((field) => field.id !== fieldId));
  };

  const renderCustomField = (field: CustomField) => {
    switch (field.type) {
      case "text":
        return (
          <div key={field.id} className="relative">
            <label className="block text-white font-semibold mb-2">
              {field.heading}
            </label>
            <input
              type="text"
              placeholder={field.placeholder || "Enter value"}
              className="w-full px-4 py-3 bg-white/20 border border-white/40 text-white placeholder-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-white font-medium"
            />
            <div className="absolute top-0 right-0 flex gap-2">
              <button
                onClick={() => handleEditField(field.id)}
                className="px-3 py-1 bg-white text-[#2E3B8E] rounded text-xs font-semibold hover:bg-gray-100 flex items-center gap-1"
              >
                <i className="fa-solid fa-pen"></i>
                Edit
              </button>
              <button
                onClick={() => handleRemoveField(field.id)}
                className="px-3 py-1 bg-white text-[#2E3B8E] rounded text-xs font-semibold hover:bg-gray-100"
              >
                Remove Field
              </button>
            </div>
          </div>
        );
      case "textarea":
        return (
          <div key={field.id} className="relative">
            <label className="block text-white font-semibold mb-2">
              {field.heading}
            </label>
            <textarea
              placeholder={field.placeholder || "Enter value"}
              rows={3}
              className="w-full px-4 py-3 bg-white/20 border border-white/40 text-white placeholder-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-white resize-none font-medium"
            />
            <div className="absolute top-0 right-0 flex gap-2">
              <button
                onClick={() => handleEditField(field.id)}
                className="px-3 py-1 bg-white text-[#2E3B8E] rounded text-xs font-semibold hover:bg-gray-100 flex items-center gap-1"
              >
                <i className="fa-solid fa-pen"></i>
                Edit
              </button>
              <button
                onClick={() => handleRemoveField(field.id)}
                className="px-3 py-1 bg-white text-[#2E3B8E] rounded text-xs font-semibold hover:bg-gray-100"
              >
                Remove Field
              </button>
            </div>
          </div>
        );
      case "upload":
        return (
          <div key={field.id}>
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center gap-2 text-white font-semibold">
                <i className="fa-solid fa-cloud-arrow-up"></i>
                {field.heading}
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEditField(field.id)}
                  className="px-3 py-1 bg-white text-[#2E3B8E] rounded text-xs font-semibold hover:bg-gray-100 flex items-center gap-1"
                >
                  <i className="fa-solid fa-pen"></i>
                  Edit
                </button>
                <button
                  onClick={() => handleRemoveField(field.id)}
                  className="px-3 py-1 bg-white text-[#2E3B8E] rounded text-xs font-semibold hover:bg-gray-100"
                >
                  Remove Field
                </button>
              </div>
            </div>
            <div className="border-2 border-dashed border-white/30 rounded-lg p-12 text-center hover:border-white/50 transition cursor-pointer">
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center">
                  <i className="fa-solid fa-plus text-white text-2xl"></i>
                </div>
                <div className="text-white">
                  <p className="font-semibold mb-1">
                    Drag & Drop or Click here to choose file
                  </p>
                  <p className="text-sm text-white/60 flex items-center justify-center gap-1">
                    <i className="fa-solid fa-circle-info"></i>
                    Max file size: 10 MB
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      case "date":
        return (
          <div key={field.id}>
            <div className="flex items-center justify-between mb-2">
              <label className="text-white font-semibold">
                {field.heading}
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEditField(field.id)}
                  className="px-3 py-1 bg-white text-[#2E3B8E] rounded text-xs font-semibold hover:bg-gray-100 flex items-center gap-1"
                >
                  <i className="fa-solid fa-pen"></i>
                  Edit
                </button>
                <button
                  onClick={() => handleRemoveField(field.id)}
                  className="px-3 py-1 bg-white text-[#2E3B8E] rounded text-xs font-semibold hover:bg-gray-100"
                >
                  Remove Field
                </button>
              </div>
            </div>
            <div className="relative">
              <i className="fa-regular fa-calendar absolute left-4 top-1/2 -translate-y-1/2 text-white z-10 pointer-events-none"></i>
              <input
                type="date"
                defaultValue="2024-11-11"
                className="w-full pl-12 pr-4 py-3 bg-white/20 border border-white/40 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white font-medium [color-scheme:dark]"
              />
            </div>
            {field.allowPastorSelect && (
              <label className="flex items-center gap-2 mt-2 text-white text-sm">
                <input
                  type="checkbox"
                  checked
                  readOnly
                  className="w-4 h-4 text-[#2E3B8E] rounded"
                />
                Allow Pastor to Select Date
              </label>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  const getFieldModalTitle = () => {
    switch (fieldModalType) {
      case "text":
        return "Text Field";
      case "textarea":
        return "Text Area";
      case "upload":
        return "Upload Field";
      case "date":
        return "Date Picker";
      default:
        return "Add Field";
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#2876AC]">
      <AppHeader showFullHeader={true} />

      {/* Hero Section */}
      <AppHero
        title="Assignments"
        backgroundImageUrl={RoadmapBg.src}
        heightClasses="h-[200px]"
      />

      {/* Main Content */}
      <section className="relative px-6 md:px-12 lg:px-20 py-10">
        <div className="max-w-[900px] mx-auto">
          {/* Form Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white">
              Create - Assignment
            </h2>
          </div>

          {/* Form Content */}
          <div className="space-y-6">
            {/* Name of Assignment */}
            <div>
              <label className="block text-white font-semibold mb-2">
                Name of Assignment
              </label>
              <input
                type="text"
                placeholder="Enter Name of Assignment"
                className="w-full px-4 py-3 bg-white/20 border border-white/40 text-white placeholder-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-white font-medium"
              />
            </div>

            {/* General Instructions */}
            <div>
              <label className="block text-white font-semibold mb-2">
                General Instructions
              </label>
              <textarea
                placeholder="Brief Description for Instructions"
                rows={3}
                className="w-full px-4 py-3 bg-white/20 border border-white/40 text-white placeholder-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-white resize-none font-medium"
              />
            </div>

            {/* Completion Time */}
            <div>
              <label className="block text-white font-semibold mb-2">
                Completion Time
              </label>
              <input
                type="text"
                placeholder="Months :"
                className="w-full px-4 py-3 bg-white/20 border border-white/40 text-white placeholder-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-white font-medium"
              />
            </div>

            {/* Name of Task */}
            <div>
              <label className="block text-white font-semibold mb-2">
                Name of Task
              </label>
              <input
                type="text"
                placeholder="Enter Name of Task"
                className="w-full px-4 py-3 bg-white/20 border border-white/40 text-white placeholder-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-white font-medium"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-white font-semibold mb-2">
                Description
              </label>
              <textarea
                placeholder="Brief Description for Thumbnail"
                rows={3}
                className="w-full px-4 py-3 bg-white/20 border border-white/40 text-white placeholder-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-white resize-none font-medium"
              />
            </div>

            {/* Upload Banner Image */}
            <div>
              <label className="flex items-center gap-2 text-white font-semibold mb-3">
                <i className="fa-solid fa-cloud-arrow-up"></i>
                Upload Banner Image
              </label>
              <div className="border-2 border-dashed border-white/30 rounded-lg p-12 text-center hover:border-white/50 transition cursor-pointer">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center">
                    <i className="fa-solid fa-plus text-white text-2xl"></i>
                  </div>
                  <div className="text-white">
                    <p className="font-semibold mb-1">
                      Drag & Drop or Click here to choose file
                    </p>
                    <p className="text-sm text-white/60 flex items-center justify-center gap-1">
                      <i className="fa-solid fa-circle-info"></i>
                      Max file size: 10 MB
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Custom Fields */}
            {customFields.map((field) => renderCustomField(field))}

            {/* Insert Field */}
            <div className="relative flex justify-end items-center pt-4">
              <button
                onClick={() => setShowInsertFieldMenu(!showInsertFieldMenu)}
                className="px-6 py-3 bg-white text-[#2E3B8E] rounded-lg font-semibold hover:bg-gray-100 flex items-center gap-2 shadow-md"
              >
                <i className="fa-solid fa-plus"></i>
                Add Field
              </button>

              {/* Insert Field Dropdown Menu */}
              {showInsertFieldMenu && (
                <div className="absolute top-14 right-0 w-64 bg-white rounded-xl shadow-2xl overflow-hidden z-10 animate-slide-down">
                  <button
                    onClick={() => handleInsertField("text")}
                    className="w-full text-left flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 transition"
                  >
                    <i className="fa-solid fa-font text-[#2E3B8E]"></i>
                    <span>Text Field</span>
                  </button>
                  <button
                    onClick={() => handleInsertField("textarea")}
                    className="w-full text-left flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 transition"
                  >
                    <i className="fa-solid fa-align-left text-blue-600"></i>
                    <span>Text Area</span>
                  </button>
                  <button
                    onClick={() => handleInsertField("upload")}
                    className="w-full text-left flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 transition"
                  >
                    <i className="fa-solid fa-cloud-arrow-up text-green-600"></i>
                    <span>Upload Field</span>
                  </button>
                  <button
                    onClick={() => handleInsertField("date")}
                    className="w-full text-left flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 transition"
                  >
                    <i className="fa-regular fa-calendar text-purple-600"></i>
                    <span>Date Picker</span>
                  </button>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end gap-4 pt-8 pb-8">
              <button
                onClick={handleCancel}
                className="px-10 py-3 bg-white text-gray-700 rounded-lg font-semibold hover:bg-gray-100 transition shadow-md"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateAssignment}
                className="px-10 py-3 bg-[#2E3B8E] text-white rounded-lg font-semibold hover:bg-[#1F2A6E] transition shadow-md"
              >
                Create Assignment
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Field Configuration Modal */}
      {showFieldModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-lg w-full mx-4 shadow-2xl">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              {getFieldModalTitle()}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Heading
                </label>
                <input
                  type="text"
                  value={fieldHeading}
                  onChange={(e) => setFieldHeading(e.target.value)}
                  placeholder={
                    fieldModalType === "upload"
                      ? "Upload Strategy"
                      : "Enter Heading of the field"
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E3B8E] placeholder-gray-400 text-gray-900"
                />
              </div>
              {(fieldModalType === "text" || fieldModalType === "textarea") && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Place Holder
                  </label>
                  <input
                    type="text"
                    value={fieldPlaceholder}
                    onChange={(e) => setFieldPlaceholder(e.target.value)}
                    placeholder="Enter Place Holder"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E3B8E] placeholder-gray-400 text-gray-900"
                  />
                </div>
              )}
              {fieldModalType === "date" && (
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={allowPastorSelect}
                    onChange={(e) => setAllowPastorSelect(e.target.checked)}
                    className="w-4 h-4 text-[#2E3B8E] rounded focus:ring-[#2E3B8E]"
                  />
                  <span className="text-sm text-gray-700">
                    Allow Pastor to Select Date
                  </span>
                </label>
              )}
            </div>
            <div className="flex gap-4 mt-8">
              <button
                onClick={() => {
                  setShowFieldModal(false);
                  setFieldHeading("");
                  setFieldPlaceholder("");
                  setAllowPastorSelect(false);
                  setEditingFieldId(null);
                }}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
              >
                Clear
              </button>
              <button
                onClick={handleSaveField}
                disabled={!fieldHeading}
                className={`flex-1 px-6 py-3 rounded-lg font-semibold transition ${
                  fieldHeading
                    ? "bg-[#2E3B8E] text-white hover:bg-[#1F2A6E]"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                Insert Field
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-6 right-6 z-[70] animate-fade-in">
          <div className="bg-white rounded-xl px-6 py-4 shadow-2xl flex items-center gap-3">
            <i className="fa-solid fa-circle-check text-green-500 text-xl"></i>
            <span className="text-gray-800 font-semibold">{toast}</span>
          </div>
        </div>
      )}

      <AppFooter />
    </div>
  );
}
