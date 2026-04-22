// "use client";
// import React, { useState } from "react";
// import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
// import AppHero from "@/app/Components/Hero/AppHero";
// import MentorBg from "@/app/Assets/mentor-bg.png";
// import ProfileSidebarCard from "@/app/Components/ProfileSidebarCard";
// import ProfileForm from "@/app/Components/ProfileForm";
// import ProfileDropdown from "@/app/Components/ProfileDropdown";
// import UserProfile from "@/app/Assets/user-profile.png";

// const ProfilePage = () => {
//   const [showDropdown, setShowDropdown] = useState(false);
//   const [showDocuments, setShowDocuments] = useState(false);
//   const [showSettings, setShowSettings] = useState(false);

//   // Form state
//   const [personal, setPersonal] = useState({
//     firstName: "John",
//     lastName: "Ross",
//     phoneNumber: "09878564398",
//     email: "johnross@gmail.com",
//   });

//   const [church1, setChurch1] = useState({
//     name: "Loma Linda University Church, CA",
//     phone: "09878564398",
//     website: "johnross@gmail.com",
//     address: "Loma Linda University Church, CA",
//     city: "Oakland",
//     state: "North American",
//     zipCode: "000000",
//     country: "USA",
//   });

//   const [church2, setChurch2] = useState({
//     name: "Loma Linda University Church, CA",
//     phone: "09878564398",
//     website: "johnross@gmail.com",
//     address: "Loma Linda University Church, CA",
//     city: "Oakland",
//     state: "North American",
//     zipCode: "000000",
//     country: "USA",
//   });

//   const [other, setOther] = useState({
//     title: "Pastor",
//     yearsInMinistry: "11",
//     conference: "Oakland",
//     communityServiceProjects: "11",
//   });

//   const [interests, setInterests] = useState(
//     "I would like to find out more about the Center for Community Change..."
//   );
//   const [comments, setComments] = useState(
//     "I am a conference administrator and would like to find out more about partnering with the center."
//   );

//   // Header actions for ProfileForm
//   const headerActions = (
//     <>
//       <button className="bg-white text-red-500 px-5 py-2 rounded-lg inline-flex items-center gap-2 hover:bg-red-50 transition-colors">
//         <Trash2 className="w-4 h-4" />
//         <span>Delete Profile</span>
//       </button>
//       <button className="bg-white text-blue-600 px-5 py-2 rounded-lg inline-flex items-center gap-2 hover:bg-blue-50 transition-colors">
//         <Pencil className="w-4 h-4" />
//         <span>Edit Profile</span>
//       </button>
//       <div className="relative">
//         <button
//           type="button"
//           onClick={() => setShowDropdown(!showDropdown)}
//           aria-label="More options"
//           className="p-2 bg-white rounded-md text-black hover:bg-gray-100 transition-colors"
//         >
//           <MoreHorizontal className="w-5 h-5" />
//         </button>
//         <ProfileDropdown
//           isOpen={showDropdown}
//           onClose={() => setShowDropdown(false)}
//           onDocumentsClick={() => {
//             setShowDocuments(true);
//             setShowDropdown(false);
//           }}
//           onSettingsClick={() => {
//             setShowSettings(true);
//             setShowDropdown(false);
//           }}
//         />
//       </div>
//     </>
//   );

//   return (
//     <div className="min-h-screen bg-gradient-to-b from-[#1d538d] to-[#1d538d] text-white">
//       {/* Hero Section */}
//       <AppHero
//         title="Edit Micro Grant Form"
//         backgroundImageUrl={MentorBg.src}
//         breadcrumbItems={[
//           { label: "Home", href: "/director/home" },
//           { label: "Micro Grant", href: "/director/micro-grant" },
//           { label: "Edit Form" },
//         ]}
//       />

//       {/* Main Content */}
//       <div className="flex flex-col lg:flex-row gap-0 px-6 lg:px-16 py-10">
//         {/* Left Profile Card */}
//         <ProfileSidebarCard
//           name="John Ross"
//           role="Pastor"
//           image={UserProfile}
//           infoLines={[
//             { label: "Total Mentees", value: "5", color: "text-blue-800" },
//             {
//               label: "Last Contacted",
//               value: "3 Days Ago",
//               color: "text-blue-800",
//             },
//           ]}
//           showContactIcons={true}
//           onEmailClick={() => window.open("mailto:johnross@gmail.com")}
//           onMessageClick={() => console.log("Message clicked")}
//           onWhatsAppClick={() => window.open("https://wa.me/1234567890")}
//           onPhoneClick={() => console.log("Phone clicked")}
//           progress={{ value: 70, label: "Progress" }}
//           profileInfo="Lorem ipsum dolor sit amet, consectetur adipisicing elit. Duis aute irure dolor in reprehenderit."
//           documents={{
//             count: 3,
//             onClick: () => console.log("Documents clicked"),
//           }}
//           variant="edit"
//         />

//         {/* Vertical Divider */}
//         <div className="hidden lg:block w-px bg-gray-500 mx-10 self-stretch"></div>

//         {/* Right Form Section */}
//         <div className="flex-1">
//           <ProfileForm
//             title="Personal Information"
//             headerActions={headerActions}
//             personal={personal}
//             church1={church1}
//             church2={church2}
//             other={other}
//             interests={interests}
//             comments={comments}
//             showInterests={true}
//             showComments={true}
//             editable={true}
//             onPersonalChange={setPersonal}
//             onChurch1Change={setChurch1}
//             onChurch2Change={setChurch2}
//             onOtherChange={setOther}
//             onInterestsChange={setInterests}
//             onCommentsChange={setComments}
//           />
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ProfilePage;


"use client";

import React, { useEffect, useState } from "react";
import AppHero from "@/app/Components/Hero/AppHero";
import MentorBg from "@/app/Assets/mentor-bg.png";
import {
  getMicroGrantForm,
  createOrUpdateMicroGrantForm,
} from "@/app/Services/microGrand.service";

const emptyForm = {
  _id: "",
  title: "",
  description: "",
  reportingProcedure: "",
  sections: [],
};

const fieldTypes = ["text", "textarea", "number", "file", "email", "date"];

function Page() {
  const [formData, setFormData] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadForm() {
      try {
        setLoading(true);
        setError("");

        // const res = await fetchMicroGrantApplicationForm();
        const res = await getMicroGrantForm();
        const form = res?.data || res || {};

        if (cancelled) return;

        setFormData({
          _id: form?._id || "",
          title: form?.title || "",
          description: form?.description || "",
          reportingProcedure: form?.reportingProcedure || "",
          sections: Array.isArray(form?.sections) ? form.sections : [],
        });
      } catch (err) {
        console.error("Failed to load form", err);
        if (!cancelled) {
          setError("Failed to load micro grant form");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadForm();

    return () => {
      cancelled = true;
    };
  }, []);

  const updateTopLevel = (key, value) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const updateSection = (sectionIndex, key, value) => {
    setFormData((prev) => {
      const nextSections = [...prev.sections];
      nextSections[sectionIndex] = {
        ...nextSections[sectionIndex],
        [key]: value,
      };
      return {
        ...prev,
        sections: nextSections,
      };
    });
  };

  const updateField = (sectionIndex, fieldIndex, key, value) => {
    setFormData((prev) => {
      const nextSections = [...prev.sections];
      const nextFields = [...nextSections[sectionIndex].fields];

      nextFields[fieldIndex] = {
        ...nextFields[fieldIndex],
        [key]: value,
      };

      nextSections[sectionIndex] = {
        ...nextSections[sectionIndex],
        fields: nextFields,
      };

      return {
        ...prev,
        sections: nextSections,
      };
    });
  };

  const addSection = () => {
    setFormData((prev) => ({
      ...prev,
      sections: [
        ...prev.sections,
        {
          section_title: "New Section",
          section_intro: "",
          reportingProcedure: "",
          fields: [],
        },
      ],
    }));
  };

  const removeSection = (sectionIndex) => {
    setFormData((prev) => ({
      ...prev,
      sections: prev.sections.filter((_, i) => i !== sectionIndex),
    }));
  };

  const addField = (sectionIndex) => {
    setFormData((prev) => {
      const nextSections = [...prev.sections];
      nextSections[sectionIndex] = {
        ...nextSections[sectionIndex],
        fields: [
          ...nextSections[sectionIndex].fields,
          {
            label: "",
            type: "text",
            description: "",
            placeholder: "",
            required: false,
            options: [],
          },
        ],
      };

      return {
        ...prev,
        sections: nextSections,
      };
    });
  };

  const removeField = (sectionIndex, fieldIndex) => {
    setFormData((prev) => {
      const nextSections = [...prev.sections];
      nextSections[sectionIndex] = {
        ...nextSections[sectionIndex],
        fields: nextSections[sectionIndex].fields.filter((_, i) => i !== fieldIndex),
      };

      return {
        ...prev,
        sections: nextSections,
      };
    });
  };

  const handleOptionsChange = (sectionIndex, fieldIndex, raw) => {
    const options = raw
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    updateField(sectionIndex, fieldIndex, "options", options);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload = {
        title: formData.title,
        description: formData.description || "",
        reportingProcedure: formData.reportingProcedure || "",
        sections: (formData.sections || []).map((section) => ({
          _id: section._id,
          section_title: section.section_title,
          section_intro: section.section_intro || "",
          reportingProcedure: section.reportingProcedure || "",
          fields: (section.fields || []).map((field) => ({
            _id: field._id,
            label: field.label,
            type: field.type,
            description: field.description || "",
            placeholder: field.placeholder || "",
            required: !!field.required,
            options: Array.isArray(field.options) ? field.options : [],
          })),
        })),
      };

      // await saveMicroGrantApplicationForm(payload);
      await createOrUpdateMicroGrantForm(payload);
      setSuccess("Form saved successfully");
    } catch (err) {
      console.error("Failed to save form", err);
      setError("Failed to save micro grant form");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1d538d] text-white">
        Loading form...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1d538d] to-[#1d538d] text-white">
      <AppHero
        title="Edit Micro Grant Form"
        backgroundImageUrl={MentorBg.src}
        breadcrumbItems={[
          { label: "Home", href: "/director/home" },
          { label: "Micro Grant", href: "/director/micro-grant" },
          { label: "Edit Form" },
        ]}
      />

      <div className="px-6 py-10 lg:px-16">
        <div className="mx-auto max-w-6xl rounded-2xl bg-white p-6 text-black shadow-xl">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="flex-1">
              <label className="mb-2 block text-sm font-semibold">Form Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => updateTopLevel("title", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#1d538d]"
                placeholder="Enter form title"
              />
            </div>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-[#1d538d] px-6 py-3 font-semibold text-white disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Form"}
            </button>
          </div>

          <div className="mb-6">
            <label className="mb-2 block text-sm font-semibold">Description</label>
            <textarea
              value={formData.description || ""}
              onChange={(e) => updateTopLevel("description", e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#1d538d]"
              placeholder="Enter form description"
            />
          </div>

          <div className="mb-8">
            <label className="mb-2 block text-sm font-semibold">Reporting Procedure</label>
            <textarea
              value={formData.reportingProcedure || ""}
              onChange={(e) => updateTopLevel("reportingProcedure", e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#1d538d]"
              placeholder="Enter reporting procedure"
            />
          </div>

          {error ? (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {success ? (
            <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {success}
            </div>
          ) : null}

          <div className="space-y-8">
            {(formData.sections || []).map((section, sectionIndex) => (
              <div
                key={section._id || sectionIndex}
                className="rounded-2xl border border-gray-200 p-5"
              >
                <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <h2 className="text-xl font-bold text-[#1d538d]">
                    Section {sectionIndex + 1}
                  </h2>

                  <button
                    type="button"
                    onClick={() => removeSection(sectionIndex)}
                    className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600"
                  >
                    Remove Section
                  </button>
                </div>

                <div className="mb-4">
                  <label className="mb-2 block text-sm font-semibold">Section Title</label>
                  <input
                    type="text"
                    value={section.section_title || ""}
                    onChange={(e) =>
                      updateSection(sectionIndex, "section_title", e.target.value)
                    }
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#1d538d]"
                    placeholder="Enter section title"
                  />
                </div>

                <div className="mb-6">
                  <label className="mb-2 block text-sm font-semibold">Section Intro</label>
                  <textarea
                    value={section.section_intro || ""}
                    onChange={(e) =>
                      updateSection(sectionIndex, "section_intro", e.target.value)
                    }
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#1d538d]"
                    placeholder="Enter section intro"
                  />
                </div>

                <div className="space-y-5">
                  {(section.fields || []).map((field, fieldIndex) => (
                    <div
                      key={field._id || fieldIndex}
                      className="rounded-xl border border-gray-200 bg-gray-50 p-4"
                    >
                      <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-base font-semibold">
                          Field {fieldIndex + 1}
                        </h3>

                        <button
                          type="button"
                          onClick={() => removeField(sectionIndex, fieldIndex)}
                          className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-semibold text-red-600"
                        >
                          Remove Field
                        </button>
                      </div>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                          <label className="mb-2 block text-sm font-semibold">Label</label>
                          <input
                            type="text"
                            value={field.label || ""}
                            onChange={(e) =>
                              updateField(sectionIndex, fieldIndex, "label", e.target.value)
                            }
                            className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#1d538d]"
                            placeholder="Enter field label"
                          />
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-semibold">Type</label>
                          <select
                            value={field.type || "text"}
                            onChange={(e) =>
                              updateField(sectionIndex, fieldIndex, "type", e.target.value)
                            }
                            className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#1d538d]"
                          >
                            {fieldTypes.map((type) => (
                              <option key={type} value={type}>
                                {type}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="md:col-span-2">
                          <label className="mb-2 block text-sm font-semibold">Description</label>
                          <textarea
                            value={field.description || ""}
                            onChange={(e) =>
                              updateField(sectionIndex, fieldIndex, "description", e.target.value)
                            }
                            rows={2}
                            className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#1d538d]"
                            placeholder="Enter field description"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="mb-2 block text-sm font-semibold">Placeholder</label>
                          <input
                            type="text"
                            value={field.placeholder || ""}
                            onChange={(e) =>
                              updateField(sectionIndex, fieldIndex, "placeholder", e.target.value)
                            }
                            className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#1d538d]"
                            placeholder="Enter placeholder"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="mb-2 block text-sm font-semibold">Options</label>
                          <input
                            type="text"
                            value={Array.isArray(field.options) ? field.options.join(", ") : ""}
                            onChange={(e) =>
                              handleOptionsChange(sectionIndex, fieldIndex, e.target.value)
                            }
                            className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#1d538d]"
                            placeholder="Comma separated options"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="inline-flex items-center gap-3 text-sm font-semibold">
                            <input
                              type="checkbox"
                              checked={!!field.required}
                              onChange={(e) =>
                                updateField(sectionIndex, fieldIndex, "required", e.target.checked)
                              }
                              className="h-4 w-4"
                            />
                            Required field
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-5">
                  <button
                    type="button"
                    onClick={() => addField(sectionIndex)}
                    className="rounded-lg border border-[#1d538d] px-4 py-2 text-sm font-semibold text-[#1d538d]"
                  >
                    Add Field
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={addSection}
              className="rounded-lg border border-[#1d538d] px-5 py-3 font-semibold text-[#1d538d]"
            >
              Add Section
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-[#1d538d] px-5 py-3 font-semibold text-white disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Form"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Page;