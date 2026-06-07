


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
    <div className="min-h-screen bg-[#061a2f] text-white">
      {/* <AppHero
        title="Edit Micro Grant Form"
        backgroundImageUrl={MentorBg.src}
        breadcrumbItems={[
          { label: "Home", href: "/director/home" },
          { label: "Micro Grant", href: "/director/micro-grant" },
          { label: "Edit Form" },
        ]}
      /> */}
      <section className="border-b border-white/10 bg-[linear-gradient(135deg,#08233d_0%,#0b3153_55%,#123d66_100%)] px-6 py-8 md:px-12 lg:px-20">
  <div className="mx-auto max-w-7xl">
    <button
      type="button"
      onClick={() => window.history.back()}
      className="mb-6 inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/15"
    >
      <i className="fa-solid fa-arrow-left text-xs" />
      Back
    </button>

    <p className="mb-2 text-sm text-[#8ec5eb]">
      Micro Grant / Edit Form
    </p>

    <h1 className="text-3xl font-bold text-white">
      Edit Micro Grant Form
    </h1>

    <p className="mt-3 max-w-2xl text-sm text-white/70">
      Update the micro grant form title, description, reporting procedure,
      sections, and fields.
    </p>
  </div>
</section>

      <div className="px-6 py-10 lg:px-16">
        {/* <div className="mx-auto max-w-6xl rounded-2xl bg-white p-6 text-black shadow-xl"> */}
        <div className="mx-auto max-w-7xl rounded-3xl border border-white/10 bg-white/[0.05] p-6 text-white shadow-2xl backdrop-blur-xl">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="flex-1">
              <label className="mb-2 block text-sm font-semibold">Form Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => updateTopLevel("title", e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#102b43] px-4 py-3 text-white outline-none transition focus:border-[#8ec5eb]"
                placeholder="Enter form title"
              />
            </div>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-xl bg-[#8ec5eb] px-6 py-3 font-bold text-[#062946] transition hover:bg-[#b8def6] disabled:opacity-60"
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
              className="w-full rounded-xl border border-white/10 bg-[#102b43] px-4 py-3 text-white outline-none transition focus:border-[#8ec5eb]"
              placeholder="Enter form description"
            />
          </div>

          <div className="mb-8">
            <label className="mb-2 block text-sm font-semibold">Reporting Procedure</label>
            <textarea
              value={formData.reportingProcedure || ""}
              onChange={(e) => updateTopLevel("reportingProcedure", e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-white/10 bg-[#102b43] px-4 py-3 text-white outline-none transition focus:border-[#8ec5eb]"
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
                className="rounded-3xl border border-white/10 bg-white/[0.04] p-6"
              >
                <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <h2 className="text-xl font-bold text-[#8ec5eb]">
                    Section {sectionIndex + 1}
                  </h2>

                  <button
                    type="button"
                    onClick={() => removeSection(sectionIndex)}
                    className="rounded-xl border border-red-400/25 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-100 hover:bg-red-500/20"
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
                    className="w-full rounded-xl border border-white/10 bg-[#102b43] px-4 py-3 text-white outline-none transition focus:border-[#8ec5eb]"
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
                    className="w-full rounded-xl border border-white/10 bg-[#102b43] px-4 py-3 text-white outline-none transition focus:border-[#8ec5eb]"
                    placeholder="Enter section intro"
                  />
                </div>

                <div className="space-y-5">
                  {(section.fields || []).map((field, fieldIndex) => (
                    <div
                      key={field._id || fieldIndex}
                      className="rounded-2xl border border-white/10 bg-[#0f2740] p-5"
                    >
                      <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-base font-semibold">
                          Field {fieldIndex + 1}
                        </h3>

                        <button
                          type="button"
                          onClick={() => removeField(sectionIndex, fieldIndex)}
                          className="rounded-xl border border-red-400/25 bg-red-500/10 px-3 py-1.5 text-sm font-semibold text-red-100 hover:bg-red-500/20"
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
                            className="w-full rounded-xl border border-white/10 bg-[#102b43] px-4 py-3 text-white outline-none transition focus:border-[#8ec5eb]"
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
                            className="w-full rounded-xl border border-white/10 bg-[#102b43] px-4 py-3 text-white outline-none transition focus:border-[#8ec5eb]"
                          >
                            {fieldTypes.map((type) => (
                              <option key={type} value={type} className="bg-[#102b43] text-white">
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
                            className="w-full rounded-xl border border-white/10 bg-[#102b43] px-4 py-3 text-white outline-none transition focus:border-[#8ec5eb]"
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
                            className="w-full rounded-xl border border-white/10 bg-[#102b43] px-4 py-3 text-white outline-none transition focus:border-[#8ec5eb]"
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
                            className="w-full rounded-xl border border-white/10 bg-[#102b43] px-4 py-3 text-white outline-none transition focus:border-[#8ec5eb]"
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
                    className="rounded-xl border border-white/15 bg-white/[0.05] px-4 py-2 text-sm font-semibold text-white hover:bg-white/[0.08]"
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
              className="rounded-xl border border-white/15 bg-white/[0.05] px-5 py-3 font-semibold text-white hover:bg-white/[0.08]"
            >
              Add Section
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-xl bg-[#8ec5eb] px-5 py-3 font-bold text-[#062946] transition hover:bg-[#b8def6] disabled:opacity-60"
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