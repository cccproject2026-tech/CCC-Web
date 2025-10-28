"use client";

import { useState } from "react";
import Image from "next/image";
import Gears from "@/app/Assets/gear-form.png"; // ⚙️ your left-side image
import PastorHeader from "@/app/Components/PastorHeader";
import { useRouter } from "next/navigation";

export default function InterestForm() {
     const router = useRouter();
  const [showInterests, setShowInterests] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  const interests = [
    "I would like to find out more about the Center for Community Change",
    "I am interested in receiving mentoring in community engagement",
    "I would like to talk to one of the mentors",
    "I am a conference administrator and would like to find out more about partnering with the center",
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowInterests(true); // ✅ show checkboxes below form
  };

  // ✅ when first checkbox is clicked, show popup
  const handleFirstCheckbox = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setShowPopup(true);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#224b8a] to-[#224b8a] text-white flex flex-col relative">
      <PastorHeader />

      <section className="flex flex-col lg:flex-row w-full flex-1">
        {/* LEFT IMAGE SECTION */}
        <div className="lg:w-1/2">
          <Image
            src={Gears}
            alt="Gears"
            className="w-[600px] h-auto object-contain"
          />
        </div>

        {/* RIGHT FORM SECTION */}
        <div className="w-full lg:w-1/2 bg-gradient-to-b from-[#224b8a] to-[#224b8a] px-10 py-10">
          <div className="text-center mb-8">
            <h2 className="inline-block text-white font-semibold px-10">
              Interest Form
            </h2>
          </div>

          {/* ✅ FORM START */}
          <form className="space-y-8" onSubmit={handleSubmit}>
            {/* --- PERSONAL INFORMATION --- */}
            <div>
              <h3 className="text-sm font-semibold mb-4">
                Personal Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="First Name"
                  className="form-input"
                />
                <input
                  type="text"
                  placeholder="Last Name"
                  className="form-input"
                />
                <input
                  type="text"
                  placeholder="Phone Number"
                  className="form-input"
                />
                <input
                  type="email"
                  placeholder="Email"
                  className="form-input"
                />
              </div>
            </div>

            {/* --- CURRENT CHURCH INFORMATION --- */}
            <div>
              <h3 className="text-sm font-semibold mb-4">
                Current Church Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Church Name"
                  className="form-input"
                />
                <input
                  type="text"
                  placeholder="Church Phone"
                  className="form-input"
                />
                <input
                  type="text"
                  placeholder="Church Website"
                  className="form-input"
                />
                <input
                  type="text"
                  placeholder="Church Address"
                  className="form-input"
                />
                <input type="text" placeholder="City" className="form-input" />
                <input type="text" placeholder="State" className="form-input" />
                <input
                  type="text"
                  placeholder="Zip Code"
                  className="form-input"
                />
                <select className="form-input text-gray-500">
                  <option>Country</option>
                </select>
                <input
                  type="text"
                  placeholder="Years in Ministry"
                  className="form-input"
                />
                <input
                  type="text"
                  placeholder="Conference"
                  className="form-input"
                />
              </div>

              <div className="flex justify-end mt-3">
                <button
                  type="button"
                  className="bg-white/10 hover:bg-white/20 text-white text-sm px-4 py-2 rounded-md border border-white/30 transition"
                >
                  + Add More Church
                </button>
              </div>
            </div>

            {/* --- OTHER INFORMATION --- */}
            <div>
              <h3 className="text-sm font-semibold mb-4">Other Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <select className="form-input text-gray-500">
                  <option>Title</option>
                </select>
                <input
                  type="text"
                  placeholder="Years in Ministry"
                  className="form-input"
                />
                <input
                  type="text"
                  placeholder="Conference"
                  className="form-input"
                />
                <input
                  type="text"
                  placeholder="Current Community Service Projects"
                  className="form-input"
                />
                <select className="form-input text-gray-500">
                  <option>Interests</option>
                </select>
                <textarea
                  placeholder="Comments"
                  rows={2}
                  className="form-input sm:col-span-2 resize-none"
                ></textarea>
              </div>
            </div>

            {/* --- SUBMIT BUTTON --- */}
            <div className="text-center">
              <button
                type="submit"
                className="bg-white text-[#0E59A6] font-semibold px-10 py-2 rounded-md hover:bg-[#DCEBFF] transition"
              >
                Submit
              </button>
            </div>
          </form>

          {/* ✅ CHECKBOXES APPEAR BELOW FORM AFTER SUBMIT */}
          {showInterests && (
            <div className="mt-8 bg-white text-[#0E59A6] rounded-lg p-6 shadow-md">
              <h3 className="text-sm font-semibold mb-4">Interests</h3>
              <div className="flex flex-col gap-3">
                {interests.map((item, i) => (
                  <label key={i} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="accent-[#0E59A6] w-4 h-4"
                      onChange={i === 0 ? handleFirstCheckbox : undefined}
                    />
                    <span>{item}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ✅ POPUP MODAL */}
      {showPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <div className="bg-white text-center rounded-xl p-8 w-[320px] shadow-lg">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-white"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 00-1.414 0L9 11.586 6.707 9.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l7-7a1 1 0 000-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
            <h2 className="text-[#0E59A6] text-lg font-semibold">
              Interest Submitted !
            </h2>
            <p className="text-[#0E59A6] text-sm mt-1 mb-5">
              Please wait for approval
            </p>
            <button
               onClick={() => router.push("/pastor/Thankyou")}
              className="border border-[#0E59A6] text-[#0E59A6] px-6 py-1.5 rounded-md hover:bg-[#E6F0FF] font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
