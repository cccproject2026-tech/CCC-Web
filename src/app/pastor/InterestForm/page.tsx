"use client";

import { useState, Suspense } from "react";
import { isAxiosError } from "axios";
import PastorHeader from "@/app/Components/PastorHeader";
import { useRouter, useSearchParams } from "next/navigation";
import { apiCreateInterest } from "@/app/Services/api";
import type {
  ChurchDetails,
  CreateInterestPayload,
  InterestTitle,
} from "@/app/Services/types/interests.types";
import { setCookie } from "@/app/utils/cookies";

type ChurchRow = {
  churchName: string;
  churchPhone: string;
  churchWebsite: string;
  churchAddress: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
};

const emptyChurch = (): ChurchRow => ({
  churchName: "",
  churchPhone: "",
  churchWebsite: "",
  churchAddress: "",
  city: "",
  state: "",
  zipCode: "",
  country: "",
});

function axiosErrorMessage(err: unknown): string {
  if (isAxiosError(err)) {
    const d = err.response?.data;
    if (d && typeof d === "object") {
      const o = d as Record<string, unknown>;
      const m = o.message;
      if (typeof m === "string" && m.trim()) return m;
      if (Array.isArray(m)) {
        const parts = m.map((x) => (typeof x === "string" ? x : String(x)));
        if (parts.length) return parts.join("; ");
      }
      if (m && typeof m === "object") {
        const nested = Object.values(m as Record<string, unknown>).flatMap((v) =>
          Array.isArray(v) ? v : [v],
        );
        const strs = nested.filter((x): x is string => typeof x === "string");
        if (strs.length) return strs.join("; ");
      }
    }
    return err.message || "Request failed.";
  }
  if (err instanceof Error) return err.message;
  return "Something went wrong. Please try again.";
}

function InterestFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = searchParams.get("role") || "pastor";

  const [showInterests, setShowInterests] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    email: "",
    title: role === "mentor" ? "Mentor" : "Pastor",
    yearsInMinistry: "",
    conference: "",
    currentProjects: "",
    interestSelect: "",
    comments: "",
  });

  const [churches, setChurches] = useState<ChurchRow[]>([emptyChurch()]);

  const interests = [
    "I would like to find out more about the Center for Community Change",
    "I am interested in receiving mentoring in community engagement",
    "I would like to talk to one of the mentors",
    "I am a conference administrator and would like to find out more about partnering with the center",
  ];

  const setField = (k: keyof typeof form, v: string) => {
    setForm((prev) => ({ ...prev, [k]: v }));
    setErrors((prev) => { const e = { ...prev }; delete e[k]; return e; });
  };

  const setChurchField = (idx: number, k: keyof ChurchRow, v: string) => {
    setChurches((prev) => prev.map((c, i) => (i === idx ? { ...c, [k]: v } : c)));
    const errKey = idx === 0 ? k : `${k}_${idx}`;
    setErrors((prev) => { const e = { ...prev }; delete e[errKey]; return e; });
  };

  const addChurch = () => setChurches((prev) => [...prev, emptyChurch()]);
  const removeChurch = (idx: number) => setChurches((prev) => prev.filter((_, i) => i !== idx));

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!form.firstName.trim()) errs.firstName = "First Name is required.";
    if (!form.lastName.trim()) errs.lastName = "Last Name is required.";
    if (!form.phoneNumber.trim()) {
      errs.phoneNumber = "Phone Number is required.";
    } else if (!/^\+?[\d\s\-()\u00d7]{7,20}$/.test(form.phoneNumber.trim())) {
      errs.phoneNumber = "Enter a valid phone number.";
    }
    if (!form.email.trim()) {
      errs.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errs.email = "Enter a valid email address.";
    }

    churches.forEach((c, i) => {
      const p = i === 0 ? "" : `_${i}`;
      if (!c.churchName.trim()) errs[`churchName${p}`] = "Church Name is required.";
      if (!c.churchPhone.trim()) errs[`churchPhone${p}`] = "Church Phone is required.";
      // churchWebsite is optional
      if (!c.churchAddress.trim()) errs[`churchAddress${p}`] = "Church Address is required.";
      if (!c.city.trim()) errs[`city${p}`] = "City is required.";
      if (!c.state) errs[`state${p}`] = "State is required.";
      if (!c.zipCode.trim()) errs[`zipCode${p}`] = "Zip Code is required.";
      if (!c.country) errs[`country${p}`] = "Country is required.";
    });

    if (!form.yearsInMinistry.trim()) errs.yearsInMinistry = "Years in Ministry is required.";
    if (!form.conference.trim()) errs.conference = "Conference is required.";
    if (!form.currentProjects.trim()) errs.currentProjects = "Current Community Service Projects is required.";
    if (!form.interestSelect) errs.interestSelect = "Please select an interest.";
    // comments is optional

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;

    const titleForApi = (form.title || "Pastor") as InterestTitle;

    const churchDetailsPayload: ChurchDetails[] = churches.map((c) => {
      const d: ChurchDetails = { churchName: c.churchName.trim() };
      if (c.churchPhone.trim()) d.churchPhone = c.churchPhone.trim();
      if (c.churchWebsite.trim()) d.churchWebsite = c.churchWebsite.trim();
      if (c.churchAddress.trim()) d.churchAddress = c.churchAddress.trim();
      if (c.city.trim()) d.city = c.city.trim();
      if (c.state.trim()) d.state = c.state.trim();
      if (c.zipCode.trim()) d.zipCode = c.zipCode.trim();
      if (c.country.trim()) d.country = c.country.trim();
      return d;
    });

    const createPayload: CreateInterestPayload = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      phoneNumber: form.phoneNumber.trim(),
      churchDetails: churchDetailsPayload,
      title: titleForApi,
    };
    if (form.comments.trim()) createPayload.comments = form.comments.trim();
    if (form.interestSelect) createPayload.interests = [form.interestSelect];
    if (form.conference.trim()) createPayload.conference = form.conference.trim();
    if (form.yearsInMinistry.trim()) createPayload.yearsInMinistry = form.yearsInMinistry.trim();
    if (form.currentProjects.trim()) createPayload.currentCommunityProjects = form.currentProjects.trim();

    try {
      setIsSubmitting(true);
      const response = await apiCreateInterest(createPayload);
      const json = response.data;
      if (!json.success) {
        setErrors({ _form: json.message || "Failed to submit interest form." });
        return;
      }
      setSuccessMsg(json.message || "Interest form submitted successfully.");
      setToastMessage("Interest submitted successfully.");
      setTimeout(() => setToastMessage(null), 2000);
      setShowInterests(true);
      setCookie("interestEmail", form.email.trim());
    } catch (error) {
      console.error("Interest submit error:", error);
      setErrors({ _form: axiosErrorMessage(error) });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFirstCheckbox = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) setShowPopup(true);
  };

  /** Inline red error under a field */
  const Err = ({ k }: { k: string }) =>
    errors[k] ? <p className="mt-1 text-xs text-red-400">{errors[k]}</p> : null;

  const inputCls = (k: string) =>
    `form-input${errors[k] ? " !border-red-400" : ""}`;

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

            {errors._form && (
              <p className="mb-4 text-sm text-red-400">{errors._form}</p>
            )}
            {successMsg && (
              <p className="mb-4 text-sm text-emerald-200">{successMsg}</p>
            )}

            <form className="space-y-8" onSubmit={handleSubmit} noValidate>
              {/* --- PERSONAL INFORMATION --- */}
              <div>
                <h3 className="text-sm font-semibold mb-4">Personal Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <input
                      type="text"
                      placeholder="First Name *"
                      value={form.firstName}
                      onChange={(e) => setField("firstName", e.target.value)}
                      className={inputCls("firstName")}
                    />
                    <Err k="firstName" />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Last Name *"
                      value={form.lastName}
                      onChange={(e) => setField("lastName", e.target.value)}
                      className={inputCls("lastName")}
                    />
                    <Err k="lastName" />
                  </div>
                  <div>
                    <input
                      type="tel"
                      placeholder="Phone Number *"
                      value={form.phoneNumber}
                      onChange={(e) => {
                        const v = e.target.value.replace(/[^\d\s+\-()\u00d7]/g, "");
                        setField("phoneNumber", v);
                      }}
                      className={inputCls("phoneNumber")}
                    />
                    <Err k="phoneNumber" />
                  </div>
                  <div>
                    <input
                      type="email"
                      placeholder="Email *"
                      value={form.email}
                      onChange={(e) => setField("email", e.target.value)}
                      className={inputCls("email")}
                    />
                    <Err k="email" />
                  </div>
                </div>
              </div>

              {/* --- CHURCH SECTIONS (dynamic) --- */}
              {churches.map((church, idx) => {
                const p = idx === 0 ? "" : `_${idx}`;
                return (
                  <div key={idx}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold">
                        {idx === 0 ? "Current Church Information" : `Church ${idx + 1}`}
                      </h3>
                      {idx > 0 && (
                        <button
                          type="button"
                          onClick={() => removeChurch(idx)}
                          className="text-xs text-red-400 hover:text-red-300 transition"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <input
                          type="text"
                          placeholder="Church Name *"
                          value={church.churchName}
                          onChange={(e) => setChurchField(idx, "churchName", e.target.value)}
                          className={inputCls(`churchName${p}`)}
                        />
                        <Err k={`churchName${p}`} />
                      </div>
                      <div>
                        <input
                          type="tel"
                          placeholder="Church Phone *"
                          value={church.churchPhone}
                          onChange={(e) => {
                            const v = e.target.value.replace(/[^\d\s+\-()\u00d7]/g, "");
                            setChurchField(idx, "churchPhone", v);
                          }}
                          className={inputCls(`churchPhone${p}`)}
                        />
                        <Err k={`churchPhone${p}`} />
                      </div>
                      <div>
                        <input
                          type="text"
                          placeholder="Church Website"
                          value={church.churchWebsite}
                          onChange={(e) => setChurchField(idx, "churchWebsite", e.target.value)}
                          className="form-input"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          placeholder="Church Address *"
                          value={church.churchAddress}
                          onChange={(e) => setChurchField(idx, "churchAddress", e.target.value)}
                          className={inputCls(`churchAddress${p}`)}
                        />
                        <Err k={`churchAddress${p}`} />
                      </div>
                      <div>
                        <input
                          type="text"
                          placeholder="City *"
                          value={church.city}
                          onChange={(e) => setChurchField(idx, "city", e.target.value)}
                          className={inputCls(`city${p}`)}
                        />
                        <Err k={`city${p}`} />
                      </div>
                      <div>
                        <select
                          value={church.state}
                          onChange={(e) => setChurchField(idx, "state", e.target.value)}
                          className={inputCls(`state${p}`)}
                        >
                          <option value="" disabled>State *</option>
                          <option value="Alabama">Alabama</option>
                          <option value="Alaska">Alaska</option>
                          <option value="Arizona">Arizona</option>
                          <option value="Arkansas">Arkansas</option>
                          <option value="California">California</option>
                          <option value="Colorado">Colorado</option>
                          <option value="Connecticut">Connecticut</option>
                          <option value="Delaware">Delaware</option>
                          <option value="Florida">Florida</option>
                          <option value="Georgia">Georgia</option>
                          <option value="Hawaii">Hawaii</option>
                          <option value="Idaho">Idaho</option>
                          <option value="Illinois">Illinois</option>
                          <option value="Indiana">Indiana</option>
                          <option value="Iowa">Iowa</option>
                          <option value="Kansas">Kansas</option>
                          <option value="Kentucky">Kentucky</option>
                          <option value="Louisiana">Louisiana</option>
                          <option value="Maine">Maine</option>
                          <option value="Maryland">Maryland</option>
                          <option value="Massachusetts">Massachusetts</option>
                          <option value="Michigan">Michigan</option>
                          <option value="Minnesota">Minnesota</option>
                          <option value="Mississippi">Mississippi</option>
                          <option value="Missouri">Missouri</option>
                          <option value="Montana">Montana</option>
                          <option value="Nebraska">Nebraska</option>
                          <option value="Nevada">Nevada</option>
                          <option value="New Hampshire">New Hampshire</option>
                          <option value="New Jersey">New Jersey</option>
                          <option value="New Mexico">New Mexico</option>
                          <option value="New York">New York</option>
                          <option value="North Carolina">North Carolina</option>
                          <option value="North Dakota">North Dakota</option>
                          <option value="Ohio">Ohio</option>
                          <option value="Oklahoma">Oklahoma</option>
                          <option value="Oregon">Oregon</option>
                          <option value="Pennsylvania">Pennsylvania</option>
                          <option value="Rhode Island">Rhode Island</option>
                          <option value="South Carolina">South Carolina</option>
                          <option value="South Dakota">South Dakota</option>
                          <option value="Tennessee">Tennessee</option>
                          <option value="Texas">Texas</option>
                          <option value="Utah">Utah</option>
                          <option value="Vermont">Vermont</option>
                          <option value="Virginia">Virginia</option>
                          <option value="Washington">Washington</option>
                          <option value="West Virginia">West Virginia</option>
                          <option value="Wisconsin">Wisconsin</option>
                          <option value="Wyoming">Wyoming</option>
                          <option value="Ontario">Ontario</option>
                          <option value="Quebec">Quebec</option>
                          <option value="British Columbia">British Columbia</option>
                          <option value="Alberta">Alberta</option>
                          <option value="Manitoba">Manitoba</option>
                          <option value="Saskatchewan">Saskatchewan</option>
                          <option value="Nova Scotia">Nova Scotia</option>
                          <option value="New Brunswick">New Brunswick</option>
                          <option value="Prince Edward Island">Prince Edward Island</option>
                          <option value="Newfoundland and Labrador">Newfoundland and Labrador</option>
                        </select>
                        <Err k={`state${p}`} />
                      </div>
                      <div>
                        <input
                          type="text"
                          placeholder="Zip Code *"
                          value={church.zipCode}
                          onChange={(e) => setChurchField(idx, "zipCode", e.target.value)}
                          className={inputCls(`zipCode${p}`)}
                        />
                        <Err k={`zipCode${p}`} />
                      </div>
                      <div>
                        <select
                          value={church.country}
                          onChange={(e) => setChurchField(idx, "country", e.target.value)}
                          className={inputCls(`country${p}`)}
                        >
                          <option value="" disabled>Country *</option>
                          <option value="United States">United States</option>
                          <option value="Canada">Canada</option>
                        </select>
                        <Err k={`country${p}`} />
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className="flex justify-end -mt-4">
                <button
                  type="button"
                  onClick={addChurch}
                  className="bg-white/10 hover:bg-white/20 text-white text-sm px-4 py-2 rounded-md border border-white/30 transition"
                >
                  + Add More Church
                </button>
              </div>

              {/* --- OTHER INFORMATION --- */}
              <div>
                <h3 className="text-sm font-semibold mb-4">Other Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <select
                      value={form.title}
                      onChange={(e) => setField("title", e.target.value)}
                      className="form-input"
                      aria-label="Your role or title"
                    >
                      {role === "mentor" ? (
                        <>
                          <option value="Mentor">Mentor</option>
                          <option value="Field Mentor">Field Mentor</option>
                        </>
                      ) : (
                        <>
                          <option value="Pastor">Pastor</option>
                          <option value="Lay Leader">Lay Leader</option>
                          <option value="Seminarian">Seminarian</option>
                        </>
                      )}
                    </select>
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Years in Ministry *"
                      value={form.yearsInMinistry}
                      onChange={(e) => setField("yearsInMinistry", e.target.value)}
                      className={inputCls("yearsInMinistry")}
                    />
                    <Err k="yearsInMinistry" />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Conference *"
                      value={form.conference}
                      onChange={(e) => setField("conference", e.target.value)}
                      className={inputCls("conference")}
                    />
                    <Err k="conference" />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Current Community Service Projects *"
                      value={form.currentProjects}
                      onChange={(e) => setField("currentProjects", e.target.value)}
                      className={inputCls("currentProjects")}
                    />
                    <Err k="currentProjects" />
                  </div>
                  <div>
                    <select
                      value={form.interestSelect}
                      onChange={(e) => setField("interestSelect", e.target.value)}
                      className={inputCls("interestSelect")}
                    >
                      <option value="" disabled>Interests *</option>
                      <option value="Children/Youth Ministry">Children/Youth Ministry</option>
                      <option value="Community Outreach">Community Outreach</option>
                      <option value="Leadership Development">Leadership Development</option>
                    </select>
                    <Err k="interestSelect" />
                  </div>
                  <div className="sm:col-span-2">
                    <textarea
                      placeholder="Comments"
                      rows={2}
                      value={form.comments}
                      onChange={(e) => setField("comments", e.target.value)}
                      className="form-input w-full resize-none"
                    />
                  </div>
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

            {/* CHECKBOXES APPEAR BELOW FORM AFTER SUCCESSFUL SUBMIT */}
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

      {/* POPUP MODAL */}
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
            <h2 className="text-white text-lg font-semibold">Interest Submitted !</h2>
            <p className="text-[#cde2f2] text-sm mt-1 mb-5">Please wait for approval</p>
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

export default function InterestForm() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#062946] text-white flex items-center justify-center">Loading...</div>}>
      <InterestFormContent />
    </Suspense>
  );
}
