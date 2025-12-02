"use client";

import { useState } from "react";
import Image from "next/image";
import Gears from "@/app/Assets/gear-form.png";
import PastorHeader from "@/app/Components/PastorHeader";
import { useRouter } from "next/navigation";

export default function InterestForm() {
  const router = useRouter();
  const [showInterests, setShowInterests] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const interests = [
    "I would like to find out more about the Center for Community Change",
    "I am interested in receiving mentoring in community engagement",
    "I would like to talk to one of the mentors",
    "I am a conference administrator and would like to find out more about partnering with the center",
  ];

  // ✅ Submit interest form -> call API
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const form = e.currentTarget;
    const fd = new FormData(form);

    const firstName = (fd.get("firstName") || "").toString().trim();
    const lastName = (fd.get("lastName") || "").toString().trim();
    const phoneNumber = (fd.get("phoneNumber") || "").toString().trim();
    const email = (fd.get("email") || "").toString().trim();

    // basic validation – API requires these
    if (!firstName || !lastName || !phoneNumber || !email) {
      setErrorMsg("Please fill First Name, Last Name, Phone Number and Email.");
      return;
    }

    const payload = {
      // you can add profileInfo / profilePicture later if you add fields
      firstName,
      lastName,
      phoneNumber,
      email,
      churchDetails: [
        {
          churchName: (fd.get("churchName") || "").toString().trim(),
          churchPhone: (fd.get("churchPhone") || "").toString().trim(),
          churchWebsite: (fd.get("churchWebsite") || "").toString().trim(),
          churchAddress: (fd.get("churchAddress") || "").toString().trim(),
          city: (fd.get("city") || "").toString().trim(),
          state: (fd.get("state") || "").toString().trim(),
          zipCode: (fd.get("zipCode") || "").toString().trim(),
          country: (fd.get("country") || "").toString().trim(),
        },
      ],
      title: (fd.get("title") || "").toString().trim(),
      conference: (fd.get("conference") || "").toString().trim(),
      yearsInMinistry: (fd.get("yearsInMinistry") || "").toString().trim(),
      currentCommunityProjects: (
        fd.get("currentProjects") || ""
      ).toString().trim(),
      // for now we’re not capturing the checkbox interests – you can wire them
      // into state and send them here if backend needs them
      interests: [] as string[],
      comments: (fd.get("comments") || "").toString().trim(),
    };

    try {
      setIsSubmitting(true);

      const res = await fetch("http://13.221.25.133/api/v1/interests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setErrorMsg(json.message || "Failed to submit interest form.");
        return;
      }

      setSuccessMsg(json.message || "Interest form submitted successfully.");
      setShowInterests(true); // ✅ show checkboxes only after successful API
      // if you want to reset form:
      // form.reset();
    } catch (error) {
      console.error("Interest submit error:", error);
      setErrorMsg("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
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

          {/* messages */}
          {errorMsg && (
            <p className="mb-4 text-sm text-red-200">{errorMsg}</p>
          )}
          {successMsg && (
            <p className="mb-4 text-sm text-emerald-200">{successMsg}</p>
          )}

          {/* ✅ FORM START */}
          <form className="space-y-8" onSubmit={handleSubmit}>
            {/* --- PERSONAL INFORMATION --- */}
            <div>
              <h3 className="text-sm font-semibold mb-4">
                Personal Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  name="firstName"
                  type="text"
                  placeholder="First Name"
                  className="form-input"
                />
                <input
                  name="lastName"
                  type="text"
                  placeholder="Last Name"
                  className="form-input"
                />
                <input
                  name="phoneNumber"
                  type="text"
                  placeholder="Phone Number"
                  className="form-input"
                />
                <input
                  name="email"
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
                  name="churchName"
                  type="text"
                  placeholder="Church Name"
                  className="form-input"
                />
                <input
                  name="churchPhone"
                  type="text"
                  placeholder="Church Phone"
                  className="form-input"
                />
                <input
                  name="churchWebsite"
                  type="text"
                  placeholder="Church Website"
                  className="form-input"
                />
                <input
                  name="churchAddress"
                  type="text"
                  placeholder="Church Address"
                  className="form-input"
                />
                <input
                  name="city"
                  type="text"
                  placeholder="City"
                  className="form-input"
                />
                <input
                  name="state"
                  type="text"
                  placeholder="State"
                  className="form-input"
                />
                <input
                  name="zipCode"
                  type="text"
                  placeholder="Zip Code"
                  className="form-input"
                />
                <select
                  name="country"
                  className="form-input text-gray-500"
                  defaultValue=""
                >
                  <option value="" disabled>
                    Country
                  </option>
                  <option value="India">India</option>
                  {/* add more countries if needed */}
                </select>
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
                <select
                  name="title"
                  className="form-input text-gray-500"
                  defaultValue=""
                >
                  <option value="" disabled>
                    Title
                  </option>
                  <option value="Senior Pastor">Senior Pastor</option>
                  <option value="Associate Pastor">Associate Pastor</option>
                  {/* add more titles if needed */}
                </select>
                <input
                  name="yearsInMinistry"
                  type="text"
                  placeholder="Years in Ministry"
                  className="form-input"
                />
                <input
                  name="conference"
                  type="text"
                  placeholder="Conference"
                  className="form-input"
                />
                <input
                  name="currentProjects"
                  type="text"
                  placeholder="Current Community Service Projects"
                  className="form-input"
                />
                <select
                  name="interestSelect"
                  className="form-input text-gray-500"
                  defaultValue=""
                >
                  <option value="" disabled>
                    Interests
                  </option>
                  <option value="Spiritual Growth">Spiritual Growth</option>
                  <option value="Mentorship">Mentorship</option>
                  <option value="Social Impact">Social Impact</option>
                </select>
                <textarea
                  name="comments"
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
                disabled={isSubmitting}
                className="bg-white text-[#0E59A6] font-semibold px-10 py-2 rounded-md hover:bg-[#DCEBFF] transition disabled:opacity-60"
              >
                {isSubmitting ? "Submitting..." : "Submit"}
              </button>
            </div>
          </form>

          {/* ✅ CHECKBOXES APPEAR BELOW FORM AFTER SUCCESSFUL SUBMIT */}
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
