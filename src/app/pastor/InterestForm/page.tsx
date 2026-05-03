"use client";

import { useState, Suspense } from "react";


import { Country, State } from "country-state-city";
import { PhoneInput } from "react-international-phone";
import "react-international-phone/style.css";
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

  // const [showInterests, setShowInterests] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [personalCountry, setPersonalCountry] = useState("");
  const [personalDialCode, setPersonalDialCode] = useState("");
  

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

  // const interests = [
  //   "I would like to find out more about the Center for Community Change",
  //   "I am interested in receiving mentoring in community engagement",
  //   "I would like to talk to one of the mentors",
  //   "I am a conference administrator and would like to find out more about partnering with the center",
  // ];

  const setField = (k: keyof typeof form, v: string) => {
    setForm((prev) => ({ ...prev, [k]: v }));
    setErrors((prev) => { const e = { ...prev }; delete e[k]; return e; });
  };
// Restrict name-like fields to letters, spaces, apostrophes, and hyphens.
const sanitizeName = (value: string) => value.replace(/[^A-Za-z\s'-]/g, "");



  // const setChurchField = (idx: number, k: keyof ChurchRow, v: string) => {
  //   setChurches((prev) => prev.map((c, i) => (i === idx ? { ...c, [k]: v } : c)));
  //   const errKey = idx === 0 ? k : `${k}_${idx}`;
  //   setErrors((prev) => { const e = { ...prev }; delete e[errKey]; return e; });
  // };

// Reset state whenever country changes so state/province always matches the selected country.
  const setChurchField = (idx: number, k: keyof ChurchRow, v: string) => {
  setChurches((prev) =>
    prev.map((c, i) => {
      if (i !== idx) return c;

      // if (k === "country") {
      //   return { ...c, country: v, state: "" };
      // }

    if (k === "country") {
  return {
    ...c,
    country: v,
    state: "",
  };
}
      return { ...c, [k]: v };
    })
  );

  const errKey = idx === 0 ? k : `${k}_${idx}`;
  setErrors((prev) => {
    const e = { ...prev };
    delete e[errKey];

    if (k === "country") {
      const stateKey = idx === 0 ? "state" : `state_${idx}`;
      delete e[stateKey];
    }

    return e;
  });
};

  const addChurch = () => setChurches((prev) => [...prev, emptyChurch()]);
  const removeChurch = (idx: number) => setChurches((prev) => prev.filter((_, i) => i !== idx));

  // const validate = (): boolean => {
  //   const errs: Record<string, string> = {};

  //   if (!form.firstName.trim()) errs.firstName = "First Name is required.";
  //   if (!form.lastName.trim()) errs.lastName = "Last Name is required.";
  //   if (!form.phoneNumber.trim()) {
  //     errs.phoneNumber = "Phone Number is required.";
  //   } else if (!/^\+?[\d\s\-()\u00d7]{7,20}$/.test(form.phoneNumber.trim())) {
  //     errs.phoneNumber = "Enter a valid phone number.";
  //   }
  //   if (!form.email.trim()) {
  //     errs.email = "Email is required.";
  //   } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
  //     errs.email = "Enter a valid email address.";
  //   }

  //   churches.forEach((c, i) => {
  //     const p = i === 0 ? "" : `_${i}`;
  //     if (!c.churchName.trim()) errs[`churchName${p}`] = "Church Name is required.";
  //     if (!c.churchPhone.trim()) errs[`churchPhone${p}`] = "Church Phone is required.";
  //     // churchWebsite is optional
  //     if (!c.churchAddress.trim()) errs[`churchAddress${p}`] = "Church Address is required.";
  //     if (!c.city.trim()) errs[`city${p}`] = "City is required.";
  //     if (!c.state) errs[`state${p}`] = "State is required.";
  //     if (!c.zipCode.trim()) errs[`zipCode${p}`] = "Zip Code is required.";
  //     if (!c.country) errs[`country${p}`] = "Country is required.";
  //   });

  //   if (!form.yearsInMinistry.trim()) errs.yearsInMinistry = "Years in Ministry is required.";
  //   if (!form.conference.trim()) errs.conference = "Conference is required.";
  //   if (!form.currentProjects.trim()) errs.currentProjects = "Current Community Service Projects is required.";
  //   if (!form.interestSelect) errs.interestSelect = "Please select an interest.";
  //   // comments is optional

  //   setErrors(errs);
  //   return Object.keys(errs).length === 0;
  // };
/// Country/state data is powered by country-state-city so the dropdown supports more than US/Canada.
  // const countryOptions = Country.getAllCountries();
  const countryOptions = (() => {
  const allCountries = Country.getAllCountries();

  const topCountries = allCountries.filter((country) =>
    ["US", "CA"].includes(country.isoCode)
  );

  const remainingCountries = allCountries.filter(
    (country) => !["US", "CA"].includes(country.isoCode)
  );

  return [...topCountries, ...remainingCountries];
})();

const getStateOptions = (countryName: string) => {
  const selectedCountry = countryOptions.find((c) => c.name === countryName);
  if (!selectedCountry) return [];
  return State.getStatesOfCountry(selectedCountry.isoCode);
};

// const getPhoneCodeByCountryName = (countryName: string) => {
//   const selectedCountry = countryOptions.find((c) => c.name === countryName);
//   return selectedCountry?.phonecode ? `+${selectedCountry.phonecode}` : "";
// };
const getPhoneCodeByCountryName = (countryName: string) => {
  const selectedCountry = countryOptions.find((c) => c.name === countryName);
  return cleanDialCode(selectedCountry?.phonecode);
};
const cleanDialCode = (phonecode?: string) => {
  if (!phonecode) return "";
  return `+${phonecode.replace(/^\+/, "")}`;
};
const getFlagEmoji = (isoCode: string) =>
  isoCode
    .toUpperCase()
    .replace(/./g, (char) =>
      String.fromCodePoint(127397 + char.charCodeAt(0))
    );

// const formatPersonalPhone = (value: string) => {
//   const digitsOnly = value.replace(/[^\d]/g, "");
//   const selectedCode = getPhoneCodeByCountryName(personalCountry);

//   if (!selectedCode) return digitsOnly;

//   const codeDigits = selectedCode.replace("+", "");
//   const numberWithoutCode = digitsOnly.startsWith(codeDigits)
//     ? digitsOnly.slice(codeDigits.length)
//     : digitsOnly;

//   return `${selectedCode} ${numberWithoutCode}`.trim();
// };

const formatChurchPhone = (value: string, countryName: string) => {
  const digitsOnly = value.replace(/[^\d]/g, "");
  const selectedCode = getPhoneCodeByCountryName(countryName);

  if (!selectedCode) return digitsOnly;

  const codeDigits = selectedCode.replace("+", "");
  const numberWithoutCode = digitsOnly.startsWith(codeDigits)
    ? digitsOnly.slice(codeDigits.length)
    : digitsOnly;

  return `${selectedCode} ${numberWithoutCode}`.trimEnd();
};

const validate = (): boolean => {
  const errs: Record<string, string> = {};
  const nameRegex = /^[A-Za-z\s'-]+$/;

  if (!form.firstName.trim()) {
    errs.firstName = "First Name is required.";
  } else if (!nameRegex.test(form.firstName.trim())) {
    errs.firstName = "First Name should contain only letters.";
  }

  if (!form.lastName.trim()) {
    errs.lastName = "Last Name is required.";
  } else if (!nameRegex.test(form.lastName.trim())) {
    errs.lastName = "Last Name should contain only letters.";
  }
//   if (!personalCountry) {
//   errs.personalCountry = "Country is required.";
// }

//   if (!form.phoneNumber.trim()) {
//     errs.phoneNumber = "Phone Number is required.";
//   } else if (!/^\+?[\d\s\-()\u00d7]{7,20}$/.test(form.phoneNumber.trim())) {
//     errs.phoneNumber = "Enter a valid phone number.";
//   }
if (!form.phoneNumber.trim()) {
  errs.phoneNumber = "Phone Number is required.";
} else if (form.phoneNumber.replace(/[^\d]/g, "").length < 7) {
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
    // churchWebsite is optional, but if entered it must be valid

if (c.churchWebsite.trim()) {
  const websiteValue = c.churchWebsite.trim();
  const websiteRegex = /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/.*)?$/i;

  if (!websiteRegex.test(websiteValue)) {
    errs[`churchWebsite${p}`] = "Enter a valid website URL.";
  }
}
    if (!c.churchAddress.trim()) errs[`churchAddress${p}`] = "Church Address is required.";

    if (!c.city.trim()) {
      errs[`city${p}`] = "City is required.";
    } else if (!nameRegex.test(c.city.trim())) {
      errs[`city${p}`] = "City should contain only letters.";
    }

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
      // phoneNumber: form.phoneNumber.trim(),
      phoneNumber: form.phoneNumber.trim(),
      churchDetails: churchDetailsPayload,
      title: titleForApi,
    };
    if (form.comments.trim()) createPayload.comments = form.comments.trim();
    if (form.interestSelect) createPayload.interests = [form.interestSelect];
    if (form.conference.trim()) createPayload.conference = form.conference.trim();
    if (form.yearsInMinistry.trim()) createPayload.yearsInMinistry = form.yearsInMinistry.trim();
    if (form.currentProjects.trim()) createPayload.currentCommunityProjects = form.currentProjects.trim();

//     try {
//       setIsSubmitting(true);
//       const response = await apiCreateInterest(createPayload);
//       const json = response.data;
//       if (!json.success) {
//         setErrors({ _form: json.message || "Failed to submit interest form." });
//         return;
//       }
//       // setSuccessMsg(json.message || "Interest form submitted successfully.");
//       // setToastMessage("Interest submitted successfully.");
//       // setTimeout(() => setToastMessage(null), 2000);
//       // setShowInterests(true);
//       // setCookie("interestEmail", form.email.trim());
//       setSuccessMsg(json.message || "Interest form submitted successfully.");
// setToastMessage("Interest submitted successfully.");
// setTimeout(() => setToastMessage(null), 2000);
// setCookie("interestEmail", form.email.trim());
// setShowPopup(true);
//     } catch (error) {
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
  setCookie("interestEmail", form.email.trim());
  setShowPopup(true);
} catch (error) {
      console.error("Interest submit error:", error);
      setErrors({ _form: axiosErrorMessage(error) });
    } finally {
      setIsSubmitting(false);
    }
  };

  // const handleFirstCheckbox = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   if (e.target.checked) setShowPopup(true);
  // };

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
                      // onChange={(e) => setField("firstName", e.target.value)}
                      onChange={(e) => setField("firstName", sanitizeName(e.target.value))}
                      className={inputCls("firstName")}
                    />
                    <Err k="firstName" />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Last Name *"
                      value={form.lastName}
                      // onChange={(e) => setField("lastName", e.target.value)}
                      onChange={(e) => setField("lastName", sanitizeName(e.target.value))}
                      className={inputCls("lastName")}
                    />
                    <Err k="lastName" />
                  </div>
                  {/* <div>
                    <input
                      type="tel"
                      placeholder="Phone Number *"
                      value={form.phoneNumber}
                      // onChange={(e) => {
                      //   const v = e.target.value.replace(/[^\d\s+\-()\u00d7]/g, "");
                      //   setField("phoneNumber", v);
                      // }}

                      onChange={(e) => {
  setField("phoneNumber", formatPersonalPhone(e.target.value));
}}
                      className={inputCls("phoneNumber")}
                    />
                    <Err k="phoneNumber" />
                  </div> */}
<div>
  <div
    className={`${inputCls(
      "phoneNumber"
    )} relative z-50 flex !h-[42px] !min-h-[42px] !max-h-[42px] w-full items-center overflow-visible !p-0`}
  >
    <PhoneInput
      defaultCountry="us"
      value={form.phoneNumber}
      onChange={(phone) => {
        setField("phoneNumber", phone || "");
      }}
      placeholder="Phone Number"
      className="flex h-full w-full items-center bg-transparent"
      style={{
        height: "42px",
        minHeight: "42px",
        maxHeight: "42px",
        backgroundColor: "transparent",
      }}
      inputClassName="h-full min-w-0 flex-1 border-0 bg-transparent px-4 text-[18px] text-white placeholder-gray-300 outline-none"
      inputStyle={{
        height: "42px",
        minHeight: "42px",
        maxHeight: "42px",
        backgroundColor: "transparent",
        color: "white",
        border: "none",
        outline: "none",
        fontSize: "18px",
        lineHeight: "42px",
      }}
      countrySelectorStyleProps={{
        buttonClassName:
          "h-full w-[72px] border-0 border-r border-[#47A3FF]/25 bg-transparent px-3 text-white outline-none",
        buttonStyle: {
          height: "42px",
          minHeight: "42px",
          maxHeight: "42px",
          width: "72px",
          backgroundColor: "transparent",
          border: "none",
          borderRight: "1px solid rgba(71, 163, 255, 0.25)",
        },
        dropdownStyleProps: {
          className:
            "z-[9999] max-h-[240px] overflow-y-auto rounded-md border border-[#47A3FF]/40 bg-[#063f5a] text-white shadow-lg",
          listItemClassName:
            "bg-[#063f5a] px-3 py-2 text-white hover:bg-[#0a4d6d]",
        },
      }}
    />
  </div>

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
                     {/* Row 1: Church Name | Church Phone */}
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

{/* <div>
  <input
    type="tel"
    placeholder={church.country ? "Church Phone *" : "Select Country First"}
    value={church.churchPhone}
    disabled={!church.country}
    onChange={(e) => {
      setChurchField(
        idx,
        "churchPhone",
        formatChurchPhone(e.target.value, church.country)
      );
    }}
    className={`${inputCls(`churchPhone${p}`)} ${
      !church.country ? "cursor-not-allowed opacity-60" : ""
    }`}
  />
  <Err k={`churchPhone${p}`} />
</div> */}
<div>
  <div
    className={`${inputCls(
      `churchPhone${p}`
    )} relative z-50 flex !h-[42px] !min-h-[42px] !max-h-[42px] w-full items-center overflow-visible !p-0`}
  >
    <PhoneInput
      defaultCountry="us"
      value={church.churchPhone}
      onChange={(phone) => {
        setChurchField(idx, "churchPhone", phone || "");
      }}
      placeholder="Church Phone"
      className="flex h-full w-full items-center bg-transparent"
      style={{
        height: "42px",
        minHeight: "42px",
        maxHeight: "42px",
        backgroundColor: "transparent",
      }}
      inputClassName="h-full min-w-0 flex-1 border-0 bg-transparent px-4 text-[18px] text-white placeholder-gray-300 outline-none"
      inputStyle={{
        height: "42px",
        minHeight: "42px",
        maxHeight: "42px",
        backgroundColor: "transparent",
        color: "white",
        border: "none",
        outline: "none",
        fontSize: "18px",
        lineHeight: "42px",
      }}
      countrySelectorStyleProps={{
        buttonClassName:
          "h-full w-[72px] border-0 border-r border-[#47A3FF]/25 bg-transparent px-3 text-white outline-none",
        buttonStyle: {
          height: "42px",
          minHeight: "42px",
          maxHeight: "42px",
          width: "72px",
          backgroundColor: "transparent",
          border: "none",
          borderRight: "1px solid rgba(71, 163, 255, 0.25)",
        },
        dropdownStyleProps: {
          className:
            "z-[9999] max-h-[240px] overflow-y-auto rounded-md border border-[#47A3FF]/40 bg-[#063f5a] text-white shadow-lg",
          listItemClassName:
            "bg-[#063f5a] px-3 py-2 text-white hover:bg-[#0a4d6d]",
        },
      }}
    />
  </div>

  <Err k={`churchPhone${p}`} />
</div>

{/* Row 2: Website | Address */}
<div>
  <input
    type="text"
    placeholder="Church Website"
    value={church.churchWebsite}
    onChange={(e) => setChurchField(idx, "churchWebsite", e.target.value)}
    className={inputCls(`churchWebsite${p}`)}
  />
  <Err k={`churchWebsite${p}`} />
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

{/* Row 3: Country | State */}
<div>
  <select
    value={church.country}
    onChange={(e) => setChurchField(idx, "country", e.target.value)}
    className={inputCls(`country${p}`)}
  >
    <option value="" disabled>
      Country *
    </option>
    {/* {countryOptions.map((country) => (
      <option key={country.isoCode} value={country.name}>
        {country.name} {country.phonecode ? `(+${country.phonecode})` : ""}
      </option>
    ))} */}
    {countryOptions.map((country) => (
  <option key={country.isoCode} value={country.name}>
    {country.name}
  </option>
))}
  </select>
  <Err k={`country${p}`} />
</div>

<div>
  <select
    value={church.state}
    onChange={(e) => setChurchField(idx, "state", e.target.value)}
    className={`${inputCls(`state${p}`)} ${
      !church.country ? "cursor-not-allowed opacity-60" : ""
    }`}
    disabled={!church.country}
  >
   <option value="" disabled>
  State / Province *
</option>
    {getStateOptions(church.country).map((state) => (
      <option key={state.isoCode} value={state.name}>
        {state.name}
      </option>
    ))}
  </select>
  <Err k={`state${p}`} />
</div>

{/* Row 4: City | Zip Code */}
<div>
  <input
    type="text"
    placeholder="City *"
    value={church.city}
    disabled={!church.country}
    onChange={(e) => setChurchField(idx, "city", sanitizeName(e.target.value))}
    className={`${inputCls(`city${p}`)} ${
      !church.country ? "cursor-not-allowed opacity-60" : ""
    }`}
  />
  <Err k={`city${p}`} />
</div>

<div>
  <input
    type="text"
    placeholder="Zip Code *"
    value={church.zipCode}
    disabled={!church.country}
    onChange={(e) => setChurchField(idx, "zipCode", e.target.value)}
    className={`${inputCls(`zipCode${p}`)} ${
      !church.country ? "cursor-not-allowed opacity-60" : ""
    }`}
  />
  <Err k={`zipCode${p}`} />
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
            {/* {showInterests && (
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
            )} */}
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
