"use client";
import Image from "next/image";
import { useState } from "react";
import PastorHeader from "@/app/Components/PastorHeader";
import ProfilePic from "@/app/Assets/user-profile.png";
import "@fortawesome/fontawesome-free/css/all.min.css";

export default function MentorProfile() {
  const [isEditing, setIsEditing] = useState(false);
  const [churchList, setChurchList] = useState([
    { id: 1, title: "Current Church – 1 Information" },
    { id: 2, title: "Current Church – 2 Information" },
  ]);

  const handleAddChurch = () => {
    setChurchList([
      ...churchList,
      {
        id: Date.now(),
        title: `Current Church – ${churchList.length + 1} Information`,
      },
    ]);
  };

  const handleRemoveChurch = (id: number) => {
    setChurchList(churchList.filter((c) => c.id !== id));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#103C8C] to-[#1A4B9A] text-white">
      {/* HEADER */}
      <PastorHeader showFullHeader={true} />

      {/* MAIN CONTENT */}
      <main className="px-4 md:px-10 py-8 flex justify-center">
        <div className="flex flex-col md:flex-row gap-8 w-full max-w-7xl">
          {/* 🟦 LEFT PROFILE CARD */}
          <div className="bg-white rounded-xl shadow-md p-5 text-center w-full h-[400px] md:w-[280px] flex-shrink-0">
            <Image
              src={ProfilePic}
              alt="Profile"
              width={100}
              height={100}
              className="rounded-full mx-auto mb-3"
            />
            <p className="text-gray-400 text-xs mb-1">Good Morning</p>
            <h3 className="text-gray-900 font-semibold text-base">John Doe</h3>
            <p className="text-gray-500 text-xs mb-3">Field Mentor</p>

            <div className="border-t border-gray-200 my-3"></div>

            {/* Profile Info */}
            <p className="text-left text-gray-400 text-xs font-medium mb-1">
              Profile Information
            </p>
            <textarea
              readOnly
              value="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis semper convallis eros commodo consequat."
              className="w-full text-xs text-gray-700 border border-gray-300 rounded-md p-2 resize-none focus:outline-none focus:ring-1 focus:ring-[#103C8C] mb-4"
              rows={3}
            />
            <button className="text-xs font-medium text-[#103C8C] border border-[#DADADA] rounded-md px-3 py-2 flex items-center justify-center gap-2 w-full hover:bg-[#F5F7FB] transition">
              <i className="fa-solid fa-paperclip text-[#103C8C]"></i> Upload
              documents
            </button>
          </div>

          {/* 🟩 RIGHT SIDE FORM */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl shadow-md p-8 text-white flex-1 border border-white/20">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-semibold text-lg">Personal Information</h2>

              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-sm border border-white text-white px-4 py-1 rounded-md hover:bg-white hover:text-[#103C8C] transition"
                >
                  Edit Profile
                </button>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="text-sm bg-[#F0F3FA] text-[#103C8C] px-5 py-1 rounded-md hover:bg-[#d9e3fa] transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="text-sm bg-[#103C8C] text-white px-5 py-1 rounded-md hover:bg-[#0B2F6A] transition"
                  >
                    Save
                  </button>
                </div>
              )}
            </div>

            <form className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {/* 🟢 Personal Info */}
              <input
                type="text"
                placeholder="First Name"
                className="form-input"
                defaultValue="John"
                readOnly={!isEditing}
              />
              <input
                type="text"
                placeholder="Last Name"
                className="form-input"
                defaultValue="Rose"
                readOnly={!isEditing}
              />
              <input
                type="text"
                placeholder="Phone Number"
                className="form-input"
                defaultValue="09878564398"
                readOnly={!isEditing}
              />
              <input
                type="email"
                placeholder="Email"
                className="form-input"
                defaultValue="johnross@gmail.com"
                readOnly={!isEditing}
              />

              {/* 🟣 Dynamic Church Information */}
              {churchList.map((church) => (
                <div
                  key={church.id}
                  className="col-span-2 border-t border-white/20 pt-4"
                >
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-white font-semibold">{church.title}</h3>
                    {isEditing && (
                      <button
                        type="button"
                        onClick={() => handleRemoveChurch(church.id)}
                        className="text-xs bg-[#D9534F] hover:bg-[#b93e3a] text-white px-3 py-[4px] rounded-md"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      defaultValue="09878564398"
                      readOnly={!isEditing}
                    />
                    <input
                      type="text"
                      placeholder="Church Website"
                      className="form-input"
                      defaultValue="johnross@gmail.com"
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
                  </div>
                </div>
              ))}

              {/* ADD CHURCH BUTTON */}
              {isEditing && (
                <div className="col-span-2">
                  <button
                    type="button"
                    onClick={handleAddChurch}
                    className="mt-3 text-sm bg-[#00A99D] hover:bg-[#008f86] text-white px-4 py-2 rounded-md transition flex items-center gap-2"
                  >
                    <i className="fa-solid fa-plus text-xs"></i> Add Church
                  </button>
                </div>
              )}

              {/* 🟡 Other Info */}
              <h3 className="col-span-2 text-white font-semibold mt-6">
                Other Information
              </h3>
              <input
                type="text"
                placeholder="Title"
                className="form-input"
                defaultValue="Field Mentor"
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
            </form>
          </div>
        </div>
      </main>

      {/* FORM INPUT STYLE */}
      <style jsx>{`
        .form-input {
          @apply border border-gray-300 bg-white/20 text-white rounded-md px-3 py-2 text-sm placeholder-gray-200 focus:outline-none focus:ring-2 focus:ring-[#00D1B2] disabled:opacity-80;
        }
      `}</style>
    </div>
  );
}
