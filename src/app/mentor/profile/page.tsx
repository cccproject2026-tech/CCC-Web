"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { updateInterestByEmail } from "@/app/Services/pastor.service";
import HeroBg from "@/app/Assets/hero-bg.png";
import ProfilePic from "@/app/Assets/user-profile.png";
import "@fortawesome/fontawesome-free/css/all.min.css";
import MentorHeader from "@/app/Components/MentorHeader";
import DocumentsModal from "@/app/Components/DocumentsModal";
import {
  apiGetUserById,
  apiUpdateUserById,
  apiUploadProfilePicture,
} from "@/app/Services/users.service";
import type { ChurchDetails } from "@/app/Services/types/users.types";
import { getGreeting, getMentorFromCookie } from "@/app/Services/utils/helpers";
import {
  mentorBodyText,
  mentorFieldLabel,
  mentorGlassCardFrost,
  mentorHeroOverlay,
  mentorMainGradient,
  mentorPageRoot,
  mentorPrimaryCta,
  mentorSecondaryCta,
  mentorSpinner,
  mentorEmptyPanel,
} from "@/app/Components/mentor/mentor-theme";

const inputClass =
  "w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm text-white outline-none placeholder:text-[#cde2f2]/50 focus:border-[#8ec5eb]/50 focus:ring-2 focus:ring-[#8ec5eb]/30 disabled:cursor-not-allowed disabled:opacity-75";

export default function MentorProfile() {
  const [isEditing, setIsEditing] = useState(false);
  const [showDocuments, setShowDocuments] = useState(false);
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState("");
  const [form, setForm] = useState<Record<string, unknown> | null>(null);
  const profileImageInputRef = useRef<HTMLInputElement | null>(null);
const [uploadingProfileImage, setUploadingProfileImage] = useState(false);

  useEffect(() => {
    setGreeting(getGreeting());
  }, []);

  const fetchProfile = useCallback(async () => {
    try {
      const mentor = getMentorFromCookie();
      const mid = mentor?.id ?? mentor?._id;
      if (!mid) {
        setProfile(null);
        setForm(null);
        return;
      }

      const res = await apiGetUserById(String(mid));

      const data = res.data?.data as unknown as Record<string, unknown> | undefined;
      if (data) {
        setProfile(data);
        setForm(data);
      }
    } catch (e) {
      console.error("Failed to fetch profile", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchProfile();
  }, [fetchProfile]);


  const handleProfileImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  e.target.value = "";

  if (!file) return;
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

if (!allowedTypes.includes(file.type)) {
  alert("Only JPEG, PNG, and WebP images are allowed.");
  return;
}

  const pid = (profile?.id ?? profile?._id) as string | undefined;
  if (!pid) return;

  try {
    setUploadingProfileImage(true);

    const formData = new FormData();
    // formData.append("image", file);
    formData.append("file", file);
    

    await apiUploadProfilePicture(pid, formData);
    await fetchProfile();
  } catch (err) {
    console.error("Profile image upload failed", err);
  } finally {
    setUploadingProfileImage(false);
  }
};

  const handleAddChurch = () => {
    setForm((prev) => {
      if (!prev) return prev;
      const interest = (prev.interest as Record<string, unknown>) || {};
      const churchDetails = Array.isArray(interest.churchDetails)
        ? [...(interest.churchDetails as unknown[])]
        : [];
      return {
        ...prev,
        interest: {
          ...interest,
          churchDetails: [
            ...churchDetails,
            {
              _id: Date.now().toString(),
              churchName: "",
              churchPhone: "",
              churchWebsite: "",
              churchAddress: "",
              city: "",
              state: "",
              zipCode: "",
              country: "",
            },
          ],
        },
      };
    });
  };

  const handleSave = async () => {
    try {
      const pid = (profile?.id ?? profile?._id) as string | undefined;
      if (!pid || !form) return;

      const interest = (form.interest as Record<string, unknown>) || {};
      const email = form.email as string | undefined;



const profileInfoValue = String(interest.profileInfo ?? form.bio ?? "");

const churchDetailsPayload = (Array.isArray(interest.churchDetails)
  ? interest.churchDetails
  : []) as ChurchDetails[];



const userPayload = {
  firstName: form.firstName as string | undefined,
  lastName: form.lastName as string | undefined,
};
 const interestPayload = {
      phoneNumber: interest.phoneNumber as string | undefined,
      title: interest.title as string | undefined,
      yearsInMinistry: interest.yearsInMinistry as string | undefined,
      conference: interest.conference as string | undefined,
      currentCommunityProjects: interest.currentCommunityProjects as string | undefined,
      profileInfo: profileInfoValue,
      churchDetails: churchDetailsPayload,
    };
      // await apiUpdateUserById(pid, payload);
      // await fetchProfile();
      // setIsEditing(false);
      // await apiUpdateUserById(pid, payload);
      await Promise.all([
  apiUpdateUserById(pid, userPayload),
  email ? updateInterestByEmail(email, interestPayload) : Promise.resolve(),
]);

setForm((prev) => {
  if (!prev) return prev;
  const oldInterest = (prev.interest as Record<string, unknown>) || {};

  return {
    ...prev,
    bio: profileInfoValue,
    // interest: {
    //   ...oldInterest,
    //   profileInfo: profileInfoValue,
    // },
    interest: {
  ...oldInterest,
  profileInfo: profileInfoValue,
  churchDetails: churchDetailsPayload,
},
  };
});

setProfile((prev) => {
  if (!prev) return prev;
  const oldInterest = (prev.interest as Record<string, unknown>) || {};

  return {
    ...prev,
    bio: profileInfoValue,
    // interest: {
    //   ...oldInterest,
    //   profileInfo: profileInfoValue,
    // },
    interest: {
  ...oldInterest,
  profileInfo: profileInfoValue,
  churchDetails: churchDetailsPayload,
},
  };
});

setIsEditing(false);
    } catch (err) {
      console.error("Update failed", err);
    }
  };

  const handleChange = (key: string, value: string) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const updateInterest = (key: string, value: string) => {
    setForm((prev) => {
      if (!prev) return prev;
      const interest = { ...((prev.interest as Record<string, unknown>) || {}) };
      return { ...prev, interest: { ...interest, [key]: value } };
    });
  };

  const updateChurchField = (index: number, field: string, value: string) => {
    setForm((prev) => {
      if (!prev) return prev;
      const interest = (prev.interest as Record<string, unknown>) || {};
      const churches = [...(Array.isArray(interest.churchDetails) ? interest.churchDetails : [])] as Record<
        string,
        unknown
      >[];
      if (!churches[index]) return prev;
      churches[index] = { ...churches[index], [field]: value };
      return {
        ...prev,
        interest: { ...interest, churchDetails: churches },
      };
    });
  };

  if (loading) {
    return (
      <div className={mentorPageRoot}>
        <MentorHeader showFullHeader />
        <div className={`flex flex-1 flex-col items-center justify-center gap-4 py-24 ${mentorMainGradient}`}>
          <div className={mentorSpinner} />
          <p className={mentorBodyText}>Loading profile…</p>
        </div>
      </div>
    );
  }

  if (!profile || !form) {
    return (
      <div className={mentorPageRoot}>
        <MentorHeader showFullHeader />
        <div className={`flex flex-1 flex-col items-center justify-center px-4 py-16 ${mentorMainGradient}`}>
          <div className={`max-w-md ${mentorEmptyPanel}`}>
            <p className={mentorBodyText}>No profile found. Sign in as a mentor to view this page.</p>
          </div>
        </div>
      </div>
    );
  }

  const interest = (form.interest as Record<string, unknown>) || {};
  const churches = (Array.isArray(interest.churchDetails) ? interest.churchDetails : []) as Record<
    string,
    unknown
  >[];
  const profileId = (profile._id ?? profile.id) as string | undefined;

  return (
    <div className={mentorPageRoot}>
      <MentorHeader showFullHeader />

      <section
        className="relative flex min-h-[180px] flex-col justify-center bg-cover bg-center px-0 py-10 text-white"
        style={{ backgroundImage: `url(${HeroBg.src})` }}
      >
        <div className={mentorHeroOverlay} />
        <div className="relative z-10 max-w-3xl">
          <h1 className="text-2xl font-semibold sm:text-3xl md:text-4xl">Your profile</h1>
          <p className={`mt-2 max-w-2xl ${mentorBodyText}`}>
            Update your contact details, ministry context, and church information — styled to match the rest of the
            mentor experience.
          </p>
        </div>
      </section>

      <main className={`${mentorMainGradient} flex-1 px-0 pb-16 pt-8`}>
        <div className="flex w-full flex-col gap-8 md:flex-row">
          <div
            className={`${mentorGlassCardFrost} flex h-auto w-full flex-shrink-0 flex-col p-6 text-center md:sticky md:top-24 md:w-[300px] md:self-start`}
          >
       
            {/* <div className="relative mx-auto mb-3 h-[100px] w-[100px] overflow-hidden rounded-full border border-white/20 bg-white/10">
  <Image
    src={(profile.profilePicture as string) || ProfilePic}
    alt="Mentor profile"
    width={100}
    height={100}
    className="h-full w-full rounded-full object-cover"
    unoptimized={typeof profile.profilePicture === "string" && profile.profilePicture.startsWith("http")}
  />
</div> */}

<div className="relative mx-auto mb-3 h-[100px] w-[100px] overflow-hidden rounded-full border border-white/20 bg-white/10">
  {/* <Image
    src={(profile.profilePicture as string) || ProfilePic}
    alt="Mentor profile"
    width={100}
    height={100}
    className="h-full w-full rounded-full object-cover"
    unoptimized={typeof profile.profilePicture === "string" && profile.profilePicture.startsWith("http")}
  /> */}
  <img
  src={
    (profile.profilePicture as string) ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      `${String(profile.firstName ?? "")} ${String(profile.lastName ?? "")}`.trim() || "Mentor"
    )}&background=173653&color=ffffff`
  }
  alt="Mentor profile"
  className="h-full w-full rounded-full object-cover"
/>

  <button
    type="button"
    onClick={() => profileImageInputRef.current?.click()}
    disabled={uploadingProfileImage}
    className="absolute inset-x-0 bottom-0 bg-black/55 px-2 py-1 text-[10px] font-semibold text-white transition hover:bg-black/70 disabled:cursor-not-allowed disabled:opacity-60"
  >
    {uploadingProfileImage ? "Uploading..." : "Change"}
  </button>

  <input
    ref={profileImageInputRef}
    type="file"
    accept="image/*"
    className="hidden"
    onChange={handleProfileImageChange}
  />
</div>
            <p className="mb-1 text-xs text-[#cde2f2]/80">{greeting}</p>
            <h3 className="text-base font-semibold text-white">
              {String(profile.firstName ?? "")} {String(profile.lastName ?? "")}
            </h3>
            <p className="mb-3 text-xs capitalize text-[#cde2f2]/70">{String(profile.role ?? "mentor")}</p>

            <div className="my-3 border-t border-white/10" />

            <p className="mb-1 text-left text-xs font-medium text-[#cde2f2]/80">Profile information</p>
        
<textarea
  readOnly={!isEditing}
  // value={String(interest.profileInfo ?? profile.bio ?? "")}
  value={String(interest.profileInfo || form.bio || profile.bio || "")}
  onChange={(e) => {
    updateInterest("profileInfo", e.target.value);
    setForm((prev) => (prev ? { ...prev, bio: e.target.value } : prev));
  }}
  placeholder="No profile information added yet."
  className={`${inputClass} mb-4 min-h-[72px] resize-none`}
  rows={3}
/>
            <button
              type="button"
              onClick={() => setShowDocuments(true)}
              className={`${mentorSecondaryCta} flex w-full items-center justify-center gap-2 text-xs`}
            >
              <i className="fa-solid fa-paperclip text-[#8ec5eb]" /> Documents
            </button>

          </div>

          <div className={`${mentorGlassCardFrost} min-w-0 flex-1 p-6 md:p-8`}>
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-semibold text-white">Personal information</h2>

              {!isEditing ? (
                <button type="button" onClick={() => setIsEditing(true)} className={mentorSecondaryCta}>
                  Edit profile
                </button>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => setIsEditing(false)} className={mentorSecondaryCta}>
                    Cancel
                  </button>
                  <button type="button" onClick={() => void handleSave()} className={mentorPrimaryCta}>
                    Save
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
              <div>
                <label className={mentorFieldLabel}>First name</label>
                <input
                  className={inputClass}
                  value={String(form.firstName ?? "")}
                  readOnly={!isEditing}
                  onChange={(e) => handleChange("firstName", e.target.value)}
                />
              </div>
              <div>
                <label className={mentorFieldLabel}>Last name</label>
                <input
                  className={inputClass}
                  value={String(form.lastName ?? "")}
                  readOnly={!isEditing}
                  onChange={(e) => handleChange("lastName", e.target.value)}
                />
              </div>
              <div>
                <label className={mentorFieldLabel}>Phone</label>
                <input
                  className={inputClass}
                  value={String(interest.phoneNumber ?? "")}
                  readOnly={!isEditing}
                  onChange={(e) => updateInterest("phoneNumber", e.target.value)}
                />
              </div>
              <div>
                <label className={mentorFieldLabel}>Email</label>
                <input className={inputClass} value={String(form.email ?? "")} readOnly disabled />
              </div>

              {churches.map((church, index) => (
                <div key={String(church._id ?? index)} className="col-span-1 border-t border-white/15 pt-4 md:col-span-2">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-semibold text-white">Current church – {index + 1}</h3>
                    {isEditing ? (
                      <button
                        type="button"
                        onClick={() => {
                          setForm((prev) => {
                            if (!prev) return prev;
                            const intr = (prev.interest as Record<string, unknown>) || {};
                            const list = [...(Array.isArray(intr.churchDetails) ? intr.churchDetails : [])];
                            list.splice(index, 1);
                            return { ...prev, interest: { ...intr, churchDetails: list } };
                          });
                        }}
                        className="rounded-md border border-red-400/40 bg-red-500/15 px-3 py-1 text-xs text-red-100 hover:bg-red-500/25"
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {(
                      [
                        ["churchName", "Church name"],
                        ["churchPhone", "Church phone"],
                        ["churchWebsite", "Church website"],
                        ["churchAddress", "Church address"],
                        ["city", "City"],
                        ["state", "State"],
                        ["zipCode", "Zip code"],
                        ["country", "Country"],
                      ] as const
                    ).map(([field, label]) => (
                      <div key={field}>
                        <label className={mentorFieldLabel}>{label}</label>
                        <input
                          className={inputClass}
                          placeholder={label}
                          value={String(church[field] ?? "")}
                          readOnly={!isEditing}
                          onChange={(e) => updateChurchField(index, field, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {isEditing ? (
                <div className="col-span-1 md:col-span-2">
                  <button
                    type="button"
                    onClick={handleAddChurch}
                    className={`${mentorSecondaryCta} mt-2 inline-flex items-center gap-2 text-sm`}
                  >
                    <i className="fa-solid fa-plus text-xs" /> Add church
                  </button>
                </div>
              ) : null}

              <h3 className="col-span-1 mt-4 font-semibold text-white md:col-span-2">Other information</h3>
              <div>
                <label className={mentorFieldLabel}>Title</label>
                <input
                  className={inputClass}
                  value={String(interest.title ?? "")}
                  readOnly={!isEditing}
                  onChange={(e) => updateInterest("title", e.target.value)}
                />
              </div>
              <div>
                <label className={mentorFieldLabel}>Years in ministry</label>
                <input
                  className={inputClass}
                  value={String(interest.yearsInMinistry ?? "")}
                  readOnly={!isEditing}
                  onChange={(e) => updateInterest("yearsInMinistry", e.target.value)}
                />
              </div>
              <div>
                <label className={mentorFieldLabel}>Conference</label>
                <input
                  className={inputClass}
                  value={String(interest.conference ?? "")}
                  readOnly={!isEditing}
                  onChange={(e) => updateInterest("conference", e.target.value)}
                />
              </div>
              <div>
                <label className={mentorFieldLabel}>Community projects</label>
                <input
                  className={inputClass}
                  value={String(interest.currentCommunityProjects ?? "")}
                  readOnly={!isEditing}
                  onChange={(e) => updateInterest("currentCommunityProjects", e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      {profileId ? (
        <DocumentsModal isOpen={showDocuments} onClose={() => setShowDocuments(false)} userId={profileId} />
      ) : null}
    </div>
  );
}
