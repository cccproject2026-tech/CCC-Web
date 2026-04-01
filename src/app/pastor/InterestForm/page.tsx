"use client";

import { useState } from "react";
import PastorHeader from "@/app/Components/PastorHeader";
import { useRouter } from "next/navigation";
import { apiCreateInterest } from "@/app/Services/api";
import { setCookie } from "@/app/utils/cookies";

export default function InterestForm() {
  const router = useRouter();
  const [showInterests, setShowInterests] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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

      const response = await apiCreateInterest(payload);
      const json = response.data;

      if (!json.success) {
        setErrorMsg(json.message || "Failed to submit interest form.");
        return;
      }

      setSuccessMsg(json.message || "Interest form submitted successfully.");
      setToastMessage("Interest submitted successfully.");
      setTimeout(() => setToastMessage(null), 2000);
      setShowInterests(true); // ✅ show checkboxes only after successful API
      setCookie("interestEmail", email);
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
    <main className="min-h-screen bg-[#062946] text-white flex flex-col relative font-[Albert_Sans]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_8%,rgba(141,211,243,0.24),transparent_34%),radial-gradient(circle_at_82%_22%,rgba(245,204,118,0.18),transparent_35%),radial-gradient(circle_at_48%_56%,rgba(111,178,246,0.12),transparent_42%),radial-gradient(circle_at_90%_80%,rgba(8,52,85,0.4),transparent_40%),linear-gradient(180deg,#041f35_0%,#062946_100%)]" />
      <PastorHeader />

      <section className="relative z-10 flex flex-col lg:flex-row w-full flex-1 lg:items-center">
        {/* LEFT INFO SECTION */}
        <div className="lg:w-1/2 flex flex-col items-center justify-center px-6 pb-4 pt-8 lg:px-8 lg:py-10">
          <div className="w-full max-w-[760px] rounded-3xl border border-white/15 bg-[linear-gradient(180deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.03)_100%)] p-6 shadow-[0_24px_55px_rgba(3,24,43,0.38)]">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-[#8ec5eb]">
              <i className="fa-solid fa-compass text-xl" />
            </div>
            <h3 className="text-3xl font-semibold text-white">Your Ministry Story Matters</h3>
            <p className="mt-3 text-sm leading-7 text-[#cde2f2]">
              Share your ministry context so we can connect you with the right support, mentoring, and resources.
            </p>
            <div className="mt-6 space-y-3">
              <div className="rounded-xl border border-white/15 bg-[#0a3558] p-4">
                <p className="text-[#8ec5eb] font-semibold">Step 1</p>
                <p className="text-[#d9ebf8]">Add your personal and church information</p>
              </div>
              <div className="rounded-xl border border-white/15 bg-[#0a3558] p-4">
                <p className="text-[#8ec5eb] font-semibold">Step 2</p>
                <p className="text-[#d9ebf8]">Submit your interest and wait for follow-up</p>
              </div>
            </div>
          </div>
          <p className="mt-3 text-sm text-[#cde2f2]">Community transformation starts with your story.</p>
        </div>

        {/* RIGHT FORM SECTION */}
        <div className="w-full lg:w-1/2 px-6 py-8 sm:px-10 sm:py-10">
          <div className="rounded-2xl border border-white/20 bg-[rgba(10,53,88,0.5)] p-6 shadow-[0_20px_50px_rgba(2,20,38,0.42)] backdrop-blur">
          <div className="text-center mb-8">
            <h2 className="inline-block text-white text-2xl font-semibold px-10">
              Interest Form
            </h2>
            <p className="mt-1 text-sm text-[#cde2f2]">Tell us a little about you and your ministry.</p>
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
                  <option value="Pastor">Pastor</option>
                  <option value="Lay Leader">Lay Leader</option>
                  <option value="Seminarian">Seminarian</option>
                  <option value="Mentor">Mentor</option>
                  <option value="Field Mentor">Field Mentor</option>
                  <option value="Director">Director</option>
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
                className="bg-white text-[#0f4a76] font-semibold px-10 py-2.5 rounded-lg hover:bg-[#e7f1fa] transition disabled:opacity-60"
              >
                {isSubmitting ? "Submitting..." : "Submit Interest"}
              </button>
            </div>
          </form>

          {/* ✅ CHECKBOXES APPEAR BELOW FORM AFTER SUCCESSFUL SUBMIT */}
          {showInterests && (
            <div className="mt-8 rounded-lg border border-white/20 bg-[#0a3558] text-white p-6 shadow-md">
              <h3 className="text-sm font-semibold mb-4">Interests</h3>
              <div className="flex flex-col gap-3">
                {interests.map((item, i) => (
                  <label key={i} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="accent-[#47c0ff] w-4 h-4"
                      onChange={i === 0 ? handleFirstCheckbox : undefined}
                    />
                    <span>{item}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
          </div>
        </div>
      </section>

      {/* ✅ POPUP MODAL */}
      {showPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/55 z-50">
          <div className="bg-[#0a3558] border border-white/15 text-center rounded-xl p-8 w-[320px] shadow-[0_20px_50px_rgba(3,24,43,0.5)]">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-[#24b47e] rounded-full flex items-center justify-center">
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
            <h2 className="text-white text-lg font-semibold">
              Interest Submitted !
            </h2>
            <p className="text-[#cde2f2] text-sm mt-1 mb-5">
              Please wait for approval
            </p>
            <button
              onClick={() => router.push("/pastor/Thankyou")}
              className="border border-white/40 text-white px-6 py-1.5 rounded-md hover:bg-white/10 font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      )}
      {toastMessage && (
        <div className="fixed left-1/2 top-20 z-[70] -translate-x-1/2 rounded-lg border border-white/20 bg-[#0a3558] px-4 py-3 text-sm text-white shadow-[0_12px_28px_rgba(2,20,38,0.45)]">
          {toastMessage}
        </div>
      )}
    </main>
  );
}
