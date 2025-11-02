"use client";
import React from "react";
import Image from "next/image";
import {
  Phone,
  MessageSquare,
  Mail,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";

const ProfilePage = () => {
  return (
    <div className="min-h-screen bg-[#1f518c] text-white">
      <div className="w-full h-80 bg-amber-800"></div>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row gap-10 px-6 lg:px-16 py-10">
        {/* Left Profile Card */}
        <div className="bg-white h-[700px] text-black rounded-2xl shadow-lg p-6 w-full lg:w-1/3 flex flex-col items-center">
          {/* Profile Image */}
          <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-[#204d84]">
            <Image
              src="/profile.jpg"
              alt="Profile"
              fill
              className="object-cover"
            />
          </div>

          {/* Basic Info */}
          <h2 className="text-2xl font-semibold mt-4">John Ross</h2>
          <p className="text-gray-300 text-sm mt-1">Pastor</p>
          <p className="text-gray-400 text-xs mt-1">
            Total Mentees: <span className="text-blue-800">5</span>{" "}
          </p>
          <p className="text-gray-400 text-xs">
            Last Contacted: <span className="text-blue-800">3 Days Ago</span>{" "}
          </p>

          <div className="flex items-center space-x-3 mt-4">
            {/* WhatsApp / Phone contact (opens wa.me - replace number) */}
            <a
              href="https://wa.me/1234567890"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp contact"
              className="p-2 rounded-lg text-black"
            >
              <Phone className="w-5 h-5" />
            </a>

            {/* Message (in-app) */}
            <button
              type="button"
              aria-label="Message"
              className="p-2 rounded-lg text-black"
            >
              <MessageSquare className="w-5 h-5" />
            </button>

            {/* Email */}
            <a
              href="mailto:johnross@gmail.com"
              aria-label="Email"
              className="p-2 rounded-lg text-black"
            >
              <Mail className="w-5 h-5" />
            </a>
          </div>

          <hr className="w-full h-px bg-black my-4 border-0" />

          {/* Progress Bar */}
          <div className="w-full mt-6">
            <p className="text-xl  text-black mb-1">Progress</p>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full w-[70%]" />
            </div>
          </div>

          {/* Profile Info */}
          <div className="mt-6 bg-[#173a6b]/50 p-4 rounded-xl text-gray-200 text-sm">
            <p className="text-xl  text-black mb-1">Profile Information</p>

            <p>
              Lorem ipsum dolor sit amet, consectetur adipisicing elit. Duis
              aute irure dolor in reprehenderit.
            </p>
          </div>

          {/* Documents */}
          <button className="mt-4 bg-blue-200 border border-blue-400 text-black w-full py-2 rounded-lg transition flex items-center justify-between px-4">
            <span className="font-medium">Documents</span>
            <span className="ml-2 inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-300 text-sm font-semibold">
              3
            </span>
          </button>
        </div>

        {/* Right Form Section */}
        <div className=" border-l border-gray-500 p-8 flex-1">
          {/* Top Buttons */}
          <div className="flex justify-between items-center space-x-3 mb-10">
            <h3 className="text-xl font-semibold pb-2 mb-4">
              Personal Information
            </h3>
            <div className="flex gap-5">
              <button className="bg-white text-red-500 px-5 py-2 rounded-lg inline-flex items-center gap-2">
                <Trash2 className="w-4 h-4" />
                <span>Delete Profile</span>
              </button>
              <button className="bg-white text-blue-600 px-5 py-2 rounded-lg inline-flex items-center gap-2">
                <Pencil className="w-4 h-4" />
                <span>Edit Profile</span>
              </button>
              <button
                type="button"
                aria-label="More options"
                className="p-2 bg-white rounded-md text-black hover:bg-gray-700"
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Personal Information */}

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm text-gray-300 mb-2">
                First Name
              </label>
              <input
                type="text"
                defaultValue="John"
                className="w-full p-3 rounded-md  border border-white text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-2">
                Last Name
              </label>
              <input
                type="text"
                defaultValue="Ross"
                className="w-full p-3 rounded-md border border-white text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-2">
                Phone Number
              </label>
              <input
                type="text"
                defaultValue="09878564398"
                className="w-full p-3 rounded-md  border border-white text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-2">Email</label>
              <input
                type="email"
                defaultValue="johnross@gmail.com"
                className="w-full p-3 rounded-md  border border-white text-white"
              />
            </div>
          </div>

          {/* Church 1 Info */}
          <h3 className="text-xl font-semibold border-b border-white pb-2 mt-10 mb-4">
            Current Church – 1 Information
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              "Church Name",
              "Church Phone",
              "Church Website",
              "Church Address",
              "City",
              "State",
              "Zip Code",
              "Country",
            ].map((label, i) => (
              <div key={i}>
                <label className="block text-sm text-gray-300 mb-2">
                  {label}
                </label>
                <input
                  type="text"
                  defaultValue={
                    label === "Church Name"
                      ? "Loma Linda University Church, CA"
                      : label === "State"
                      ? "North American"
                      : label === "Country"
                      ? "USA"
                      : label === "Church Phone"
                      ? "09878564398"
                      : label === "Church Website"
                      ? "johnross@gmail.com"
                      : label === "City"
                      ? "Oakland"
                      : label === "Zip Code"
                      ? "000000"
                      : "Loma Linda University Church, CA"
                  }
                  className="w-full p-3 rounded-md  border border-white text-white"
                />
              </div>
            ))}
          </div>

          {/* Church 2 Info */}
          <h3 className="text-xl font-semibold border-b border-white pb-2 mt-10 mb-4">
            Current Church – 2 Information
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              "Church Name",
              "Church Phone",
              "Church Website",
              "Church Address",
              "City",
              "State",
              "Zip Code",
              "Country",
            ].map((label, i) => (
              <div key={i}>
                <label className="block text-sm text-gray-300 mb-2">
                  {label}
                </label>
                <input
                  type="text"
                  defaultValue={
                    label === "Church Name"
                      ? "Loma Linda University Church, CA"
                      : label === "State"
                      ? "North American"
                      : label === "Country"
                      ? "USA"
                      : label === "Church Phone"
                      ? "09878564398"
                      : label === "Church Website"
                      ? "johnross@gmail.com"
                      : label === "City"
                      ? "Oakland"
                      : label === "Zip Code"
                      ? "000000"
                      : "Loma Linda University Church, CA"
                  }
                  className="w-full p-3 rounded-md  border border-white text-white"
                />
              </div>
            ))}
          </div>

          {/* Other Information */}
          <h3 className="text-xl font-semibold border-b border-white pb-2 mt-10 mb-4">
            Other Information
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm text-gray-300 mb-2">Title</label>
              <input
                type="text"
                defaultValue="Pastor"
                className="w-full p-3 rounded-md  border border-white text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-2">
                Years in Ministry
              </label>
              <input
                type="text"
                defaultValue="11"
                className="w-full p-3 rounded-md  border border-white text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-2">
                Conference
              </label>
              <input
                type="text"
                defaultValue="Oakland"
                className="w-full p-3 rounded-md  border border-white text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-2">
                Current Community Service Projects
              </label>
              <input
                type="text"
                defaultValue="11"
                className="w-full p-3 rounded-md  border border-white text-white"
              />
            </div>
          </div>

          {/* Interests */}
          <div className="mt-10">
            <label className="block text-sm text-gray-300 mb-2">
              Interests
            </label>
            <textarea
              rows={2}
              defaultValue="I would like to find out more about the Center for Community Change..."
              className="w-full p-3 rounded-md  border border-white text-white"
            ></textarea>
          </div>

          {/* Comments */}
          <div className="mt-6">
            <label className="block text-sm text-gray-300 mb-2">Comments</label>
            <textarea
              rows={2}
              defaultValue="I am a conference administrator and would like to find out more about partnering with the center."
              className="w-full p-3 rounded-md  border border-white text-white"
            ></textarea>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
