"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import ProfilePic from "@/app/Assets/user-profile.png";
import "@fortawesome/fontawesome-free/css/all.min.css";
import MentorHeader from "@/app/Components/MentorHeader";
import DocumentsModal from "@/app/Components/DocumentsModal";
import { apiGetUserById, apiUpdateUserById } from "@/app/Services/users.service";
import { getGreeting, getMentorFromCookie } from "@/app/Services/utils/helpers";
import PastorFooter from "@/app/Components/PastorFooter";

const storedUser =
  typeof window !== "undefined"
    ? JSON.parse(localStorage.getItem("mentor") || "null")
    : null;

const userId = storedUser?.id;

export default function MentorProfile() {
  const [isEditing, setIsEditing] = useState(false);
  const [showDocuments, setShowDocuments] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState("");
  const [form, setForm] = useState<any>(null);

  useEffect(() => {
    setGreeting(getGreeting());
  }, []);

  const handleAddChurch = () => {
    setForm((prev: any) => ({
      ...prev,
      interest: {
        ...prev.interest,
        churchDetails: [
          ...(prev.interest?.churchDetails || []),
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
    }));
  };

  const fetchProfile = async () => {
    try {
      const mentor = getMentorFromCookie();
      if (!mentor?.id) return;

      const res = await apiGetUserById(mentor.id);

      setProfile(res.data.data);
      setForm(res.data.data);
    } catch (e) {
      console.error("Failed to fetch profile", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (!profile?.id) return;

      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,

        phoneNumber: form?.interest?.phoneNumber,
        title: form?.interest?.title,
        yearsInMinistry: form?.interest?.yearsInMinistry,
        conference: form?.interest?.conference,
        bio: form?.interest?.profileInfo,

        churchDetails: form?.interest?.churchDetails || [],
      };

      const res = await apiUpdateUserById(profile.id, payload);
      // setProfile(res.data.data);
      // setForm(res.data.data);

      fetchProfile()
      setIsEditing(false);

      console.log("Profile updated successfully");
    } catch (err) {
      console.error("Update failed", err);
    }
  };


  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const mentor = getMentorFromCookie();

        if (!mentor?.id) return;

        const res = await apiGetUserById(mentor.id);

        setProfile(res.data.data);
        setForm(res.data.data);
      } catch (e) {
        console.error("Failed to fetch profile", e);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (key: string, value: string) => {
    setForm((prev: any) => ({
      ...prev,
      [key]: value,
    }));
  };

  const updateChurchField = (
    index: number,
    field: string,
    value: string
  ) => {
    setForm((prev: any) => {
      const updatedChurches = [...(prev.interest?.churchDetails || [])];

      updatedChurches[index] = {
        ...updatedChurches[index],
        [field]: value,
      };

      return {
        ...prev,
        interest: {
          ...prev.interest,
          churchDetails: updatedChurches,
        },
      };
    });
  };

  if (loading) return <div className="text-white p-10">Loading...</div>;
  if (!profile) return <div className="text-white p-10">No profile found</div>;

  return (
    <div className="min-h-screen flex flex-col bg-[#062946] text-white font-[Albert_Sans] relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_8%,rgba(141,211,243,0.24),transparent_34%),radial-gradient(circle_at_82%_22%,rgba(245,204,118,0.18),transparent_35%),radial-gradient(circle_at_48%_56%,rgba(111,178,246,0.12),transparent_42%),radial-gradient(circle_at_90%_80%,rgba(8,52,85,0.4),transparent_40%),linear-gradient(180deg,#041f35_0%,#062946_100%)]" />
      {/* HEADER */}
      <MentorHeader showFullHeader={true} />

      {/* MAIN CONTENT */}
      <main className="relative z-10 px-4 md:px-10 py-8 flex justify-center">
        <div className="flex flex-col md:flex-row gap-8 w-full max-w-7xl">
          {/* 🟦 LEFT PROFILE CARD */}
          <div className="rounded-3xl border border-white/20 bg-[linear-gradient(180deg,rgba(10,53,88,0.28)_0%,rgba(8,43,71,0.35)_100%)] backdrop-blur-sm p-5 text-center w-full h-[400px] md:w-[280px] flex-shrink-0 shadow-[0_24px_56px_rgba(2,20,38,0.28)]">
            <Image
              src={profile?.profilePicture || ProfilePic}
              alt="Profile"
              width={100}
              height={100}
              className="rounded-full mx-auto mb-3 border border-white/20"
            />
            <p className="text-[#cde2f2]/80 text-xs mb-1">{greeting}</p>
            <h3 className="text-white font-semibold text-base">
              {profile.firstName} {profile.lastName}
            </h3>
            <p className="text-[#cde2f2]/70 text-xs mb-3 capitalize">
              {profile.role}
            </p>

            <div className="border-t border-white/10 my-3"></div>

            {/* Profile Info */}
            <p className="text-left text-[#cde2f2]/80 text-xs font-medium mb-1">
              Profile Information
            </p>
            <textarea
              readOnly
              value={
                profile?.interest?.profileInfo ||
                "No profile information added by the user."
              }
              className="w-full text-xs text-white/80 border border-white/15 bg-white/5 rounded-md p-2 resize-none mb-4"
              rows={3}
            />
            <button
              onClick={() => setShowDocuments(true)}
              className="text-xs font-semibold text-[#cde2f2] border border-white/20 rounded-md px-3 py-2 flex items-center justify-center gap-2 w-full hover:bg-white/10 transition"
            >
              <i className="fa-solid fa-paperclip text-[#8ec5eb]"></i> Upload
              documents
            </button>
          </div>

          {/* 🟩 RIGHT SIDE FORM */}
          <div className="rounded-3xl border border-white/20 bg-[linear-gradient(180deg,rgba(15,74,118,0.20)_0%,rgba(9,49,80,0.28)_100%)] backdrop-blur-sm p-8 text-white flex-1 shadow-[0_24px_56px_rgba(2,20,38,0.20)]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-semibold text-lg">Personal Information</h2>

              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-sm border border-white/20 bg-white/10 text-white px-4 py-1 rounded-md hover:bg-white/15 transition"
                >
                  Edit Profile
                </button>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="text-sm bg-white/10 text-[#cde2f2] px-5 py-1 rounded-md hover:bg-white/15 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="text-sm bg-[#8ec5eb]/90 text-[#062946] px-5 py-1 rounded-md hover:bg-[#8ec5eb] transition"
                  >
                    Save
                  </button>
                </div>
              )}
            </div>

            <form className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {/* 🟢 Personal Info */}
              <input
                className="form-input"
                value={form?.firstName || ""}
                readOnly={!isEditing}
                onChange={(e) => handleChange("firstName", e.target.value)}
              />

              <input
                className="form-input"
                value={form?.lastName || ""}
                readOnly={!isEditing}
                onChange={(e) => handleChange("lastName", e.target.value)}
              />

              <input
                className="form-input"
                value={form?.interest?.phoneNumber || ""}
                readOnly={!isEditing}
                onChange={(e) =>
                  setForm((prev: any) => ({
                    ...prev,
                    interest: { ...prev.interest, phoneNumber: e.target.value },
                  }))
                }
              />

              <input
                className="form-input"
                value={form?.email || ""}
                readOnly
              />

              {/* 🟣 Dynamic Church Information */}
              {form?.interest?.churchDetails?.map((church: any, index: number) => (
                <div key={church._id || index} className="col-span-2 border-t border-white/20 pt-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-white font-semibold">
                      Current Church – {index + 1} Information
                    </h3>

                    {isEditing && (
                      <button
                        type="button"
                        onClick={() => {
                          setForm((prev: any) => ({
                            ...prev,
                            interest: {
                              ...prev.interest,
                              churchDetails: prev.interest.churchDetails.filter(
                                (_: any, i: number) => i !== index
                              ),
                            },
                          }));
                        }}
                        className="text-xs bg-red-500/20 hover:bg-red-500/30 text-white px-3 py-[4px] rounded-md border border-red-500/30"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      className="form-input"
                      placeholder="Church Name"
                      value={church.churchName || ""}
                      readOnly={!isEditing}
                      onChange={(e) => updateChurchField(index, "churchName", e.target.value)}
                    />

                    <input
                      className="form-input"
                      placeholder="Church Phone"
                      value={church.churchPhone || ""}
                      readOnly={!isEditing}
                      onChange={(e) => updateChurchField(index, "churchPhone", e.target.value)}
                    />

                    <input
                      className="form-input"
                      placeholder="Church Website"
                      value={church.churchWebsite || ""}
                      readOnly={!isEditing}
                      onChange={(e) => updateChurchField(index, "churchWebsite", e.target.value)}
                    />

                    <input
                      className="form-input"
                      placeholder="Church Address"
                      value={church.churchAddress || ""}
                      readOnly={!isEditing}
                      onChange={(e) => updateChurchField(index, "churchAddress", e.target.value)}
                    />

                    <input
                      className="form-input"
                      placeholder="City"
                      value={church.city || ""}
                      readOnly={!isEditing}
                      onChange={(e) => updateChurchField(index, "city", e.target.value)}
                    />

                    <input
                      className="form-input"
                      placeholder="State"
                      value={church.state || ""}
                      readOnly={!isEditing}
                      onChange={(e) => updateChurchField(index, "state", e.target.value)}
                    />

                    <input
                      className="form-input"
                      placeholder="Zip Code"
                      value={church.zipCode || ""}
                      readOnly={!isEditing}
                      onChange={(e) => updateChurchField(index, "zipCode", e.target.value)}
                    />

                    <input
                      className="form-input"
                      placeholder="Country"
                      value={church.country || ""}
                      readOnly={!isEditing}
                      onChange={(e) => updateChurchField(index, "country", e.target.value)}
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
              <input className="form-input" value={form?.interest?.title || ""} readOnly={!isEditing} />
              <input className="form-input" value={form?.interest?.yearsInMinistry || ""} readOnly={!isEditing} />
              <input className="form-input" value={form?.interest?.conference || ""} readOnly={!isEditing} />
              <input className="form-input" value={form?.interest?.currentCommunityProjects || ""} readOnly={!isEditing} />
            </form>
          </div>
        </div>
      </main>

      {/* Documents Modal */}
      {profile?._id && (
        <DocumentsModal
          isOpen={showDocuments}
          onClose={() => setShowDocuments(false)}
          userId={profile._id}
        />
      )}

      {/* FORM INPUT STYLE */}
      <style jsx>{`
        .form-input {
          @apply w-full px-4 py-2 rounded-md border border-[#8ec5eb]/35 bg-white/5 text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-[#8ec5eb]/40 disabled:opacity-80;
        }
      `}</style>

      <PastorFooter />
    </div>
  );
}
