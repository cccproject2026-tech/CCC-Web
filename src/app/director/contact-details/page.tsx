"use client";
import { useEffect, useState } from "react";
import DirectorHero from "../DirectorHero";
import { directorGlassCard, directorInputClass, directorPageRoot } from "../directorUi";
import ContactDetailHeader from "../../Assets/contactdetailheader.jpg";

const CONTACT_DETAILS_STORAGE_KEY = "director_contact_details";

export default function ContactDetailsPage() {
  const [formData, setFormData] = useState({
    phoneNumber1: "",
    phoneNumber2: "",
    address: "",
    socialMedia: {
      facebook: {
        enabled: true,
        url: "https://www.facebook.com/in/ccc-854808275/",
      },
      twitter: {
        enabled: true,
        url: "https://www.twitter.com/in/ccc-854808275/",
      },
      linkedin: {
        enabled: true,
        url: "https://www.linkedin.com/in/ccc-854808275/",
      },
      whatsapp: {
        enabled: true,
        url: "https://www.linkedin.com/in/ccc-854808275/",
      },
    },
  });
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(CONTACT_DETAILS_STORAGE_KEY);
      if (!saved) return;

      const parsed = JSON.parse(saved);
      setFormData((prev) => ({
        ...prev,
        ...parsed,
        socialMedia: {
          ...prev.socialMedia,
          ...(parsed.socialMedia ?? {}),
        },
      }));
    } catch (error) {
      console.error("Failed to load saved contact details", error);
    }
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSocialMediaToggle = (platform: string) => {
    setFormData((prev) => ({
      ...prev,
      socialMedia: {
        ...prev.socialMedia,
        [platform]: {
          ...prev.socialMedia[platform as keyof typeof prev.socialMedia],
          enabled: !prev.socialMedia[platform as keyof typeof prev.socialMedia].enabled,
        },
      },
    }));
  };

  const handleSocialMediaUrlChange = (
    platform: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      socialMedia: {
        ...prev.socialMedia,
        [platform]: {
          ...prev.socialMedia[platform as keyof typeof prev.socialMedia],
          url: e.target.value,
        },
      },
    }));
  };

  const handleSave = () => {
    try {
      window.localStorage.setItem(
        CONTACT_DETAILS_STORAGE_KEY,
        JSON.stringify(formData),
      );

      setToast("Contact details saved.");
      window.setTimeout(() => setToast(null), 2500);
    } catch (error) {
      console.error("Failed to save contact details", error);
      setToast("Could not save contact details.");
      window.setTimeout(() => setToast(null), 2500);
    }
  };

  const copyText = async (value: string, label: string) => {
    if (!value.trim()) return;

    try {
      await navigator.clipboard.writeText(value);
      setToast(`${label} copied.`);
    } catch (error) {
      console.error("Copy failed", error);
      setToast("Copy failed.");
    }

    window.setTimeout(() => setToast(null), 2500);
  };

  const shareText = async (value: string, label: string) => {
    if (!value.trim()) return;

    try {
      if (navigator.share) {
        await navigator.share({
          title: label,
          text: value,
          url: value.startsWith("http") ? value : undefined,
        });
        return;
      }

      await navigator.clipboard.writeText(value);
      setToast(`${label} copied for sharing.`);
    } catch (error) {
      console.error("Share failed", error);
      setToast("Share failed.");
    }

    window.setTimeout(() => setToast(null), 2500);
  };

  return (
    <div className={directorPageRoot}>
      <DirectorHero
        title="Contact Details"
        subtitle="Organization phone, address, and social links."
        image={ContactDetailHeader}
        breadcrumbItems={[
          { label: "Home", href: "/director/home" },
          { label: "Contact Details" },
        ]}
      />

      <section className="relative py-10">
        <div className="mx-auto max-w-[1000px]">
          <div className={`overflow-hidden rounded-xl ${directorGlassCard}`}>
            <div className="border-b border-white/10 px-8 py-6">
              <h2 className="text-3xl font-bold text-white">Contact Details</h2>
            </div>

            <div className="p-8">
              {/* Phone Numbers - Side by Side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="mb-2 block font-semibold text-white/85">
                    Phone Number 1
                  </label>
                  <input
                    type="tel"
                    name="phoneNumber1"
                    value={formData.phoneNumber1}
                    onChange={handleInputChange}
                    placeholder="Enter Phone number"
                    className={directorInputClass}
                  />
                </div>
                <div>
                  <label className="mb-2 block font-semibold text-white/85">
                    Phone Number 2
                  </label>
                  <input
                    type="tel"
                    name="phoneNumber2"
                    value={formData.phoneNumber2}
                    onChange={handleInputChange}
                    placeholder="Enter Phone number"
                    className={directorInputClass}
                  />
                </div>
              </div>

              {/* Address */}
              <div className="mb-6">
                <label className="mb-2 block font-semibold text-white/85">
                  Address
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Enter Address"
                  rows={4}
                  className={`${directorInputClass} resize-none`}
                />
              </div>

              {/* Social Media Links */}
              <div className="mb-6">
                <label className="mb-4 block font-semibold text-white/85">
                  Social Media Links
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Facebook */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="checkbox"
                        id="facebook"
                        checked={formData.socialMedia.facebook.enabled}
                        onChange={() => handleSocialMediaToggle("facebook")}
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="facebook" className="font-semibold text-white/85">
                        Facebook
                      </label>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={formData.socialMedia.facebook.url}
                        onChange={(e) => handleSocialMediaUrlChange("facebook", e)}
                        disabled={!formData.socialMedia.facebook.enabled}
                        className={`${directorInputClass} text-white disabled:cursor-not-allowed disabled:opacity-50`}
                      />
                      <button
                        type="button"
                        onClick={() => copyText(formData.socialMedia.facebook.url, "Facebook link")}
                        className="rounded-lg border border-white/15 bg-white/10 px-3 text-white hover:bg-white/15"
                        title="Copy"
                      >
                        <i className="fa-regular fa-copy" />
                      </button>
                      <button
                        type="button"
                        onClick={() => shareText(formData.socialMedia.facebook.url, "Facebook link")}
                        className="rounded-lg border border-white/15 bg-white/10 px-3 text-white hover:bg-white/15"
                        title="Share"
                      >
                        <i className="fa-solid fa-share-nodes" />
                      </button>
                    </div>
                  </div>

                  {/* Twitter */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="checkbox"
                        id="twitter"
                        checked={formData.socialMedia.twitter.enabled}
                        onChange={() => handleSocialMediaToggle("twitter")}
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="twitter" className="font-semibold text-white/85">
                        Twitter
                      </label>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={formData.socialMedia.twitter.url}
                        onChange={(e) => handleSocialMediaUrlChange("twitter", e)}
                        disabled={!formData.socialMedia.twitter.enabled}
                        className={`${directorInputClass} text-white disabled:cursor-not-allowed disabled:opacity-50`}
                      />
                      <button
                        type="button"
                        onClick={() => copyText(formData.socialMedia.twitter.url, "Twitter link")}
                        className="rounded-lg border border-white/15 bg-white/10 px-3 text-white hover:bg-white/15"
                        title="Copy"
                      >
                        <i className="fa-regular fa-copy" />
                      </button>
                      <button
                        type="button"
                        onClick={() => shareText(formData.socialMedia.twitter.url, "Twitter link")}
                        className="rounded-lg border border-white/15 bg-white/10 px-3 text-white hover:bg-white/15"
                        title="Share"
                      >
                        <i className="fa-solid fa-share-nodes" />
                      </button>
                    </div>
                  </div>

                  {/* LinkedIn */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="checkbox"
                        id="linkedin"
                        checked={formData.socialMedia.linkedin.enabled}
                        onChange={() => handleSocialMediaToggle("linkedin")}
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="linkedin" className="font-semibold text-white/85">
                        Linkedin
                      </label>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={formData.socialMedia.linkedin.url}
                        onChange={(e) => handleSocialMediaUrlChange("linkedin", e)}
                        disabled={!formData.socialMedia.linkedin.enabled}
                        className={`${directorInputClass} text-white disabled:cursor-not-allowed disabled:opacity-50`}
                      />
                      <button
                        type="button"
                        onClick={() => copyText(formData.socialMedia.linkedin.url, "LinkedIn link")}
                        className="rounded-lg border border-white/15 bg-white/10 px-3 text-white hover:bg-white/15"
                        title="Copy"
                      >
                        <i className="fa-regular fa-copy" />
                      </button>
                      <button
                        type="button"
                        onClick={() => shareText(formData.socialMedia.linkedin.url, "LinkedIn link")}
                        className="rounded-lg border border-white/15 bg-white/10 px-3 text-white hover:bg-white/15"
                        title="Share"
                      >
                        <i className="fa-solid fa-share-nodes" />
                      </button>
                    </div>
                  </div>

                  {/* WhatsApp */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="checkbox"
                        id="whatsapp"
                        checked={formData.socialMedia.whatsapp.enabled}
                        onChange={() => handleSocialMediaToggle("whatsapp")}
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="whatsapp" className="font-semibold text-white/85">
                        Whatsapp
                      </label>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={formData.socialMedia.whatsapp.url}
                        onChange={(e) => handleSocialMediaUrlChange("whatsapp", e)}
                        disabled={!formData.socialMedia.whatsapp.enabled}
                        className={`${directorInputClass} text-white disabled:cursor-not-allowed disabled:opacity-50`}
                      />
                      <button
                        type="button"
                        onClick={() => copyText(formData.socialMedia.whatsapp.url, "WhatsApp link")}
                        className="rounded-lg border border-white/15 bg-white/10 px-3 text-white hover:bg-white/15"
                        title="Copy"
                      >
                        <i className="fa-regular fa-copy" />
                      </button>
                      <button
                        type="button"
                        onClick={() => shareText(formData.socialMedia.whatsapp.url, "WhatsApp link")}
                        className="rounded-lg border border-white/15 bg-white/10 px-3 text-white hover:bg-white/15"
                        title="Share"
                      >
                        <i className="fa-solid fa-share-nodes" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end mt-8">
                <button
                  onClick={handleSave}
                  className="bg-[#1E366F] text-white text-sm font-semibold px-6 py-3 rounded-lg hover:bg-[#1a2f5a] transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
      {toast && (
        <div className="fixed right-6 top-20 z-[100] rounded-xl border border-white/15 bg-[#041f35]/95 px-5 py-3 text-sm font-semibold text-white shadow-2xl">
          {toast}
        </div>
      )}
    </div>
  );
}

