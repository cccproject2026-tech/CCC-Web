"use client";
import { useState } from "react";
import AppHero from "@/app/Components/Hero/AppHero";
import AppFooter from "@/app/Components/AppFooter";
import ContactDetailHeader from "../../Assets/contactdetailheader.jpg";

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
    console.log("Saving contact details:", formData);
    // Add save functionality here
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#1A2E5C] to-[#2E3B8E]">
      {/* Hero Section with Blue Overlay */}
      <div
        className="relative bg-cover bg-center text-white min-h-[300px] sm:min-h-[360px] md:min-h-[400px]"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(30, 54, 111, 0.8), rgba(46, 59, 142, 0.8)), url(${ContactDetailHeader.src})`,
        }}
      >
        <div className="relative h-full flex flex-col justify-between z-10 px-6 md:px-12 lg:px-20 pt-8 pb-10">
          {/* Breadcrumbs */}
          <div className="text-sm text-white/80">
            <span>
              <a href="/director/home" className="hover:text-white cursor-pointer">
                Home
              </a>
              <span className="mx-2">&gt;</span>
              <span className="font-semibold">Contact Details</span>
            </span>
          </div>

          {/* Title */}
          <div className="mt-auto">
            <h1 className="text-[28px] md:text-[36px] lg:text-[44px] font-semibold leading-tight">
              Contact Details
            </h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <section className="relative px-4 sm:px-6 md:px-12 lg:px-20 py-12 bg-[#b0d0e4]">
        <div className="max-w-[1000px] mx-auto">
          {/* Contact Details Form Card */}
          <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
            {/* Header - Blue Background */}
            <div className="bg-gradient-to-r from-[#1E366F] to-[#2E3B8E] px-8 py-6 relative">
              <h2 className="text-white text-3xl font-bold">Contact Details</h2>
            </div>

            {/* Form Content */}
            <div className="p-8">
              {/* Phone Numbers - Side by Side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-gray-900 font-semibold mb-2">
                    Phone Number 1
                  </label>
                  <input
                    type="tel"
                    name="phoneNumber1"
                    value={formData.phoneNumber1}
                    onChange={handleInputChange}
                    placeholder="Enter Phone number"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:border-[#2E3B8E]"
                  />
                </div>
                <div>
                  <label className="block text-gray-900 font-semibold mb-2">
                    Phone Number 2
                  </label>
                  <input
                    type="tel"
                    name="phoneNumber2"
                    value={formData.phoneNumber2}
                    onChange={handleInputChange}
                    placeholder="Enter Phone number"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:border-[#2E3B8E]"
                  />
                </div>
              </div>

              {/* Address */}
              <div className="mb-6">
                <label className="block text-gray-900 font-semibold mb-2">
                  Address
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Enter Address"
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:border-[#2E3B8E] resize-none"
                />
              </div>

              {/* Social Media Links */}
              <div className="mb-6">
                <label className="block text-gray-900 font-semibold mb-4">
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
                      <label htmlFor="facebook" className="text-gray-900 font-semibold">
                        Facebook
                      </label>
                    </div>
                    <input
                      type="url"
                      value={formData.socialMedia.facebook.url}
                      onChange={(e) => handleSocialMediaUrlChange("facebook", e)}
                      disabled={!formData.socialMedia.facebook.enabled}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:border-[#2E3B8E] disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
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
                      <label htmlFor="twitter" className="text-gray-900 font-semibold">
                        Twitter
                      </label>
                    </div>
                    <input
                      type="url"
                      value={formData.socialMedia.twitter.url}
                      onChange={(e) => handleSocialMediaUrlChange("twitter", e)}
                      disabled={!formData.socialMedia.twitter.enabled}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:border-[#2E3B8E] disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
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
                      <label htmlFor="linkedin" className="text-gray-900 font-semibold">
                        Linkedin
                      </label>
                    </div>
                    <input
                      type="url"
                      value={formData.socialMedia.linkedin.url}
                      onChange={(e) => handleSocialMediaUrlChange("linkedin", e)}
                      disabled={!formData.socialMedia.linkedin.enabled}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:border-[#2E3B8E] disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
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
                      <label htmlFor="whatsapp" className="text-gray-900 font-semibold">
                        Whatsapp
                      </label>
                    </div>
                    <input
                      type="url"
                      value={formData.socialMedia.whatsapp.url}
                      onChange={(e) => handleSocialMediaUrlChange("whatsapp", e)}
                      disabled={!formData.socialMedia.whatsapp.enabled}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:border-[#2E3B8E] disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
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

      <AppFooter />
    </div>
  );
}

