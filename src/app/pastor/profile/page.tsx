"use client";
import Image from "next/image";
import { useState, useEffect } from "react";
import PastorHeader from "@/app/Components/PastorHeader";
import ProfilePic from "@/app/Assets/user-profile.png";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { getSingleUser, updateUser } from "@/app/Services/pastor.service";

export default function PastorProfile() {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [form, setForm] = useState<any>({});

  // -------------------------
  // FETCH USER + INITIALIZE FORM
  // -------------------------
  useEffect(() => {
    const storedUser =
      typeof window !== "undefined"
        ? JSON.parse(localStorage.getItem("user") || "{}")
        : {};

    const userId = storedUser?.id;
    if (!userId) return;

    async function fetchUser() {
      try {
        const res = await getSingleUser(userId);
        const data = res.data?.data;

        setProfile(data);

        setForm({
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          email: data.email || "",
          username: data.username || "",
          password: "",
          role: data.role || "",
          status: data.status || "",
          profilePicture: data.profilePicture || "",

          // Interest
          phoneNumber: data.interest?.phoneNumber || "",
          title: data.interest?.title || "",
          yearsInMinistry: data.interest?.yearsInMinistry || "",
          conference: data.interest?.conference || "",
          currentCommunityProjects:
            data.interest?.currentCommunityProjects || "",
          interests: data.interest?.interests?.join(", ") || "",
          comments: data.interest?.comments || "",

          // Church details
          churchName: data.interest?.churchDetails?.[0]?.churchName || "",
          churchPhone: data.interest?.churchDetails?.[0]?.churchPhone || "",
          churchWebsite: data.interest?.churchDetails?.[0]?.churchWebsite || "",
          churchAddress: data.interest?.churchDetails?.[0]?.churchAddress || "",
          city: data.interest?.churchDetails?.[0]?.city || "",
          state: data.interest?.churchDetails?.[0]?.state || "",
          zipCode: data.interest?.churchDetails?.[0]?.zipCode || "",
          country: data.interest?.churchDetails?.[0]?.country || "",
        });
      } catch (err) {
        console.error("Error fetching profile:", err);
      }
    }

    fetchUser();
  }, []);

  // -------------------------
  // HANDLE INPUT CHANGE
  // -------------------------
  const handleChange = (field: string, value: string) => {
    setForm((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

  // -------------------------
  // SAVE (PATCH API)
  // -------------------------
  const handleSave = async () => {
    try {
      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        username: form.username,
        password: form.password || undefined,
        role: form.role,
        status: form.status,
        profilePicture: form.profilePicture,
      };

      await updateUser(profile.id, payload);

      alert("Profile updated successfully!");

      setProfile((prev: any) => ({
        ...prev,
        ...payload,
      }));

      setIsEditing(false);
    } catch (err) {
      console.error("Error saving profile:", err);
      alert("Failed to update profile");
    }
  };

  if (!profile) {
    return (
      <div className="text-center text-white p-10">
        <PastorHeader showFullHeader={true} />
        Loading...
      </div>
    );
  }

  const interest = profile.interest || {};
  const church1 = interest.churchDetails?.[0] || {};

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#103C8C] to-[#1A4B9A] text-white">
      <PastorHeader showFullHeader={true} />

      <main className="px-10 py-8 flex justify-center">
        <div className="flex flex-col md:flex-row gap-8 w-full max-w-7xl">

          {/* LEFT PROFILE CARD */}
          <div className="bg-white rounded-xl shadow-md p-5 text-center w-full md:w-[280px] h-[420px] flex-shrink-0">
            <Image
              src={profile.profilePicture || ProfilePic}
              alt="Profile"
              width={85}
              height={85}
              className="rounded-full mx-auto mb-3"
            />

            <p className="text-gray-400 text-xs mb-1">Good Morning</p>

            <h3 className="text-gray-900 font-semibold text-base">
              {profile.firstName} {profile.lastName}
            </h3>

            <p className="text-gray-500 text-xs mb-3 capitalize">
              {profile.role}
            </p>

            <div className="border-t border-gray-200 my-3"></div>

            <p className="text-left text-gray-400 text-xs font-medium mb-1">
              Profile Information
            </p>

            <textarea
              readOnly
              value={form.comments || "No profile information added by the user."}
              className="w-full text-xs text-gray-700 border border-gray-300 rounded-md p-2 resize-none mb-4"
              rows={3}
            />

            <button className="text-xs font-medium text-[#103C8C] border border-[#DADADA] rounded-md px-3 py-2 w-full hover:bg-[#F5F7FB] transition">
              <i className="fa-solid fa-paperclip text-[#103C8C]"></i> Upload documents
            </button>
          </div>

          {/* RIGHT FORM */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl shadow-md p-8 flex-1 border border-white/20">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-semibold text-lg">Personal Information</h2>

              <button
                onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
                className="text-sm border border-white px-4 py-1 rounded-md hover:bg-white hover:text-[#103C8C] transition"
              >
                {isEditing ? "Save Changes" : "Edit Profile"}
              </button>
            </div>

            {/* FORM */}
            <form className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">

              <input
                type="text"
                className="form-input"
                placeholder="First Name"
                readOnly={!isEditing}
                value={form.firstName}
                onChange={(e) => handleChange("firstName", e.target.value)}
              />

              <input
                type="text"
                className="form-input"
                placeholder="Last Name"
                readOnly={!isEditing}
                value={form.lastName}
                onChange={(e) => handleChange("lastName", e.target.value)}
              />

              <input
                type="email"
                className="form-input"
                placeholder="Email"
                readOnly={!isEditing}
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
              />

              <input
                type="text"
                className="form-input"
                placeholder="Phone Number"
                readOnly={!isEditing}
                value={form.phoneNumber}
                onChange={(e) => handleChange("phoneNumber", e.target.value)}
              />

              {/* CHURCH DETAILS */}
              <h3 className="col-span-2 text-white font-semibold mt-6">
                Current Church – Information
              </h3>

              {[
                "churchName",
                "churchPhone",
                "churchWebsite",
                "churchAddress",
                "city",
                "state",
                "zipCode",
                "country",
              ].map((field) => (
                <input
                  key={field}
                  type="text"
                  className="form-input"
                  placeholder={field}
                  readOnly={!isEditing}
                  value={form[field]}
                  onChange={(e) => handleChange(field, e.target.value)}
                />
              ))}

              {/* OTHER DETAILS */}
              <h3 className="col-span-2 text-white font-semibold mt-6">
                Other Information
              </h3>

              <input
                type="text"
                className="form-input"
                placeholder="Title"
                readOnly={!isEditing}
                value={form.title}
                onChange={(e) => handleChange("title", e.target.value)}
              />

              <input
                type="text"
                className="form-input"
                placeholder="Years in Ministry"
                readOnly={!isEditing}
                value={form.yearsInMinistry}
                onChange={(e) => handleChange("yearsInMinistry", e.target.value)}
              />

              <input
                type="text"
                className="form-input"
                placeholder="Conference"
                readOnly={!isEditing}
                value={form.conference}
                onChange={(e) => handleChange("conference", e.target.value)}
              />

              <input
                type="text"
                className="form-input"
                placeholder="Current Community Projects"
                readOnly={!isEditing}
                value={form.currentCommunityProjects}
                onChange={(e) =>
                  handleChange("currentCommunityProjects", e.target.value)
                }
              />

              <textarea
                className="form-input col-span-2 h-16 resize-none"
                placeholder="Interests"
                readOnly={!isEditing}
                value={form.interests}
                onChange={(e) => handleChange("interests", e.target.value)}
              />

              <textarea
                className="form-input col-span-2 h-16 resize-none"
                placeholder="Concerns"
                readOnly={!isEditing}
                value={form.comments}
                onChange={(e) => handleChange("comments", e.target.value)}
              />
            </form>
          </div>
        </div>
      </main>

      <style jsx>{`
        .form-input {
          @apply border border-gray-300 bg-white/20 text-white rounded-md px-3 py-2 text-sm placeholder-gray-200 focus:outline-none focus:ring-2 focus:ring-[#00D1B2];
        }
      `}</style>
    </div>
  );
}
