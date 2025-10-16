"use client";
import Image from "next/image";
import { useState } from "react";
import PastorHeader from "@/app/Components/PastorHeader";
import ProfilePic from "@/app/Assets/user-profile.png";
import "@fortawesome/fontawesome-free/css/all.min.css";

export default function PastorProfile() {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#103C8C] to-[#1A4B9A] text-white">
      {/* HEADER */}
      <PastorHeader showFullHeader={true} />

      {/* MAIN CONTAINER */}
      <main className="px-10 py-8 flex justify-center">
        <div className="flex flex-col md:flex-row gap-8 w-full max-w-7xl">
          {/* LEFT PROFILE CARD */}
          <div className="bg-white rounded-xl shadow-md p-5 text-center w-full md:w-[280px] h-[400px] flex-shrink-0">
            <Image
              src={ProfilePic}
              alt="Profile"
              width={85}
              height={85}
              className="rounded-full mx-auto mb-3"
            />

            <p className="text-gray-400 text-xs mb-1">Good Morning</p>
            <h3 className="text-gray-900 font-semibold text-base">John Rose</h3>
            <p className="text-gray-500 text-xs mb-3">Pastor</p>

            <div className="border-t border-gray-200 my-3"></div>

            {/* Progress Section */}
            <div className="flex justify-between text-xs text-gray-600 mb-1 px-1">
              <span>Progress</span>
              <span className="font-medium">70%</span>
            </div>
            <div className="w-full bg-gray-200 h-[6px] rounded-full mb-3">
              <div
                className="h-[6px] bg-[#00B16A] rounded-full"
                style={{ width: "70%" }}
              ></div>
            </div>

            {/* Profile Info Box */}
            <p className="text-left text-gray-400 text-xs font-medium mb-1">
              Profile Information
            </p>
            <textarea
              readOnly
              value="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis semper convallis eros commodo consequat."
              className="w-full text-xs text-gray-700 border border-gray-300 rounded-md p-2 resize-none focus:outline-none focus:ring-1 focus:ring-[#103C8C] mb-4"
              rows={3}
            />

            {/* Upload Button */}
            <button className="text-xs font-medium text-[#103C8C] border border-[#DADADA] rounded-md px-3 py-2 flex items-center justify-center gap-2 w-full hover:bg-[#F5F7FB] transition">
              <i className="fa-solid fa-paperclip text-[#103C8C]"></i> Upload
              documents
            </button>
          </div>

          {/* RIGHT PROFILE FORM */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl shadow-md p-8 text-white flex-1 border border-white/20">
            {/* Personal Info Header */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-semibold text-lg">Personal Information</h2>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="text-sm border border-white text-white px-4 py-1 rounded-md hover:bg-white hover:text-[#103C8C] transition"
              >
                {isEditing ? "Save Changes" : "Edit Profile"}
              </button>
            </div>

            {/* FORM */}
            <form className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {/* Personal Info */}
              <input
                type="text"
                placeholder="First Name"
                className="form-input"
                readOnly={!isEditing}
                defaultValue="John"
              />
              <input
                type="text"
                placeholder="Last Name"
                className="form-input"
                readOnly={!isEditing}
                defaultValue="Rose"
              />
              <input
                type="text"
                placeholder="Phone Number"
                className="form-input"
                readOnly={!isEditing}
                defaultValue="09876564398"
              />
              <input
                type="email"
                placeholder="Email"
                className="form-input"
                readOnly={!isEditing}
                defaultValue="johnrose@gmail.com"
              />

              {/* Church 1 */}
              <h3 className="col-span-2 text-white font-semibold mt-6">
                Current Church – 1 Information
              </h3>
              <input
                type="text"
                placeholder="Church Name"
                className="form-input"
                defaultValue="Loma Linda University Church, CA"
                readOnly={!isEditing}
              />
              <input
                type="text"
                placeholder="Church Phone"
                className="form-input"
                defaultValue="09876564398"
                readOnly={!isEditing}
              />
              <input
                type="text"
                placeholder="Church Website"
                className="form-input"
                defaultValue="johnrose@gmail.com"
                readOnly={!isEditing}
              />
              <input
                type="text"
                placeholder="Church Address"
                className="form-input"
                defaultValue="Loma Linda University Church, CA"
                readOnly={!isEditing}
              />
              <input
                type="text"
                placeholder="City"
                className="form-input"
                defaultValue="Oakland"
                readOnly={!isEditing}
              />
              <input
                type="text"
                placeholder="Region"
                className="form-input"
                defaultValue="North American"
                readOnly={!isEditing}
              />
              <input
                type="text"
                placeholder="Zip Code"
                className="form-input"
                defaultValue="000000"
                readOnly={!isEditing}
              />
              <input
                type="text"
                placeholder="Country"
                className="form-input"
                defaultValue="USA"
                readOnly={!isEditing}
              />

              {/* Church 2 */}
              <h3 className="col-span-2 text-white font-semibold mt-6">
                Current Church – 2 Information
              </h3>
              <input
                type="text"
                placeholder="Church Name"
                className="form-input"
                defaultValue="Loma Linda University Church, CA"
                readOnly={!isEditing}
              />
              <input
                type="text"
                placeholder="Church Phone"
                className="form-input"
                defaultValue="09876564398"
                readOnly={!isEditing}
              />
              <input
                type="text"
                placeholder="Church Website"
                className="form-input"
                defaultValue="johnrose@gmail.com"
                readOnly={!isEditing}
              />
              <input
                type="text"
                placeholder="Church Address"
                className="form-input"
                defaultValue="Loma Linda University Church, CA"
                readOnly={!isEditing}
              />
              <input
                type="text"
                placeholder="City"
                className="form-input"
                defaultValue="Oakland"
                readOnly={!isEditing}
              />
              <input
                type="text"
                placeholder="State"
                className="form-input"
                defaultValue="North American"
                readOnly={!isEditing}
              />
              <input
                type="text"
                placeholder="Zip Code"
                className="form-input"
                defaultValue="000000"
                readOnly={!isEditing}
              />
              <input
                type="text"
                placeholder="Country"
                className="form-input"
                defaultValue="USA"
                readOnly={!isEditing}
              />

              {/* Other Info */}
              <h3 className="col-span-2 text-white font-semibold mt-6">
                Other Information
              </h3>
              <input
                type="text"
                placeholder="Title"
                className="form-input"
                defaultValue="Pastor"
                readOnly={!isEditing}
              />
              <input
                type="text"
                placeholder="Years in Ministry"
                className="form-input"
                defaultValue="11"
                readOnly={!isEditing}
              />
              <input
                type="text"
                placeholder="Conference"
                className="form-input"
                defaultValue="Oakland"
                readOnly={!isEditing}
              />
              <input
                type="text"
                placeholder="Current Community Service Projects"
                className="form-input"
                defaultValue="11"
                readOnly={!isEditing}
              />

              {/* Interests & Concerns */}
              <textarea
                placeholder="Interests"
                className="form-input col-span-2 h-16 resize-none"
                readOnly={!isEditing}
                defaultValue="I would like to find out more about the Center for Community Change. I am a conference administrator and would like to find out more about partnering with the center."
              />
              <textarea
                placeholder="Concerns"
                className="form-input col-span-2 h-16 resize-none"
                readOnly={!isEditing}
                defaultValue="I am a conference administrator and would like to find out more about partnering with the center."
              />
            </form>
          </div>
        </div>
      </main>

      {/* INPUT STYLE */}
      <style jsx>{`
        .form-input {
          @apply border border-gray-300 bg-white/20 text-white rounded-md px-3 py-2 text-sm placeholder-gray-200 focus:outline-none focus:ring-2 focus:ring-[#00D1B2] disabled:opacity-80;
        }
      `}</style>
    </div>
  );
}
