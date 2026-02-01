"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import AppHeader from "@/app/Components/Header/AppHeader";
import AppFooter from "@/app/Components/AppFooter";
import DocumentsModal from "@/app/Components/DocumentsModal";
import UserProfile from "../../Assets/user-profile.png";
import { apiGetUserById, apiUpdateUserById } from "@/app/Services/users.service";
import { apiGetInterestByEmail, apiUpdateInterestById } from "@/app/Services/interests.service";

interface Church {
  id: string;
  name: string;
  phone: string;
  website: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface Document {
  id: string;
  name: string;
  date: string;
  time: string;
}

export default function DirectorProfilePage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showDocuments, setShowDocuments] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [interestId, setInterestId] = useState<string | null>(null);

  // Profile Data
  const [profile, setProfile] = useState({

  });

  const [churches, setChurches] = useState<Church[]>([
  ]);

  const [documents, setDocuments] = useState<Document[]>([
  ]);
  const MIN_CHURCHES = 1;

  useEffect(() => {
    const id = localStorage.getItem("userId");

    if (!id) {
      console.error("User not logged in");
      return;
    }

    setUserId(id);
  }, []);

  useEffect(() => {
    if (!userId) return;

    const fetchUserAndInterest = async () => {
      try {
        // 1️⃣ Fetch user
        const userRes = await apiGetUserById(userId);
        const user = userRes.data.data;

        setProfile({
          firstName: user.firstName ?? "",
          lastName: user.lastName ?? "",
          phone: user.phoneNumber ?? "",
          email: user.email ?? "",
          profileInfo: user.bio ?? "",
          title: user.title ?? "",
          yearsInMinistry: user.yearsInMinistry ?? "",
          conference: user.conference ?? "",
        });

        // 2️⃣ Fetch interest using email
        if (!user.email) {
          setChurches([]);
          return;
        }

        const interestRes = await apiGetInterestByEmail(user.email);
        const interest = interestRes.data.data;
        setInterestId(interest.id);
        const churchDetails = interest?.churchDetails ?? [];

        // 3️⃣ Map church details
        const normalizedChurches: Church[] = churchDetails.map(
          (c: any, index: number) => ({
            id: `${index}`,
            name: c.churchName ?? "",
            phone: c.churchPhone ?? "",
            website: c.churchWebsite ?? "",
            address: c.churchAddress ?? "",
            city: c.city ?? "",
            state: c.state ?? "",
            zipCode: c.zipCode ?? "",
            country: c.country ?? "",
          })
        );

        // ⛔️ DO NOT REMOVE INPUTS — ensure minimum blocks
        while (normalizedChurches.length < MIN_CHURCHES) {
          normalizedChurches.push({
            id: `empty-${normalizedChurches.length}`,
            name: "",
            phone: "",
            website: "",
            address: "",
            city: "",
            state: "",
            zipCode: "",
            country: "",
          });
        }

        setChurches(normalizedChurches);
      } catch (err) {
        console.error("Failed to fetch user or interest", err);
        setChurches([]);
      }
    };

    fetchUserAndInterest();
  }, [userId]);

  const handleAddChurch = () => {
    const newChurch: Church = {
      id: Date.now().toString(),
      name: "",
      phone: "",
      website: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      country: "",
    };
    setChurches([...churches, newChurch]);
  };

  const handleRemoveChurch = (id: string) => {
    setChurches(churches.filter((church) => church.id !== id));
  };

  const handleSave = async () => {
    if (!userId) return;

    try {
      // 1️⃣ Update USER (personal info only)
      await apiUpdateUserById(userId, {
        firstName: profile.firstName,
        lastName: profile.lastName,
        phoneNumber: profile.phone,
        title: profile.title,
        yearsInMinistry: profile.yearsInMinistry,
        conference: profile.conference,
        bio: profile.profileInfo,
      });

      // 2️⃣ Update INTEREST (church details)
      if (interestId) {
        await apiUpdateInterestById(interestId, {
          churchDetails: churches.map((c) => ({
            churchName: c.name,
            churchPhone: c.phone,
            churchWebsite: c.website,
            churchAddress: c.address,
            city: c.city,
            state: c.state,
            zipCode: c.zipCode,
            country: c.country,
          })),
        });
      }

      setShowSaveConfirm(false);
      setShowSuccessMessage(true);
      setIsEditing(false);
      setTimeout(() => setShowSuccessMessage(false), 3000);

    } catch (err) {
      console.error("Update failed", err);
    }
  };

  const handleDeleteDocument = (id: string) => {
    setDocuments(documents.filter((doc) => doc.id !== id));
  };

  const handleUploadDocument = () => {
    console.log("Upload document");
    // Implement file upload logic
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#2876AC] via-[#3A8EC4] to-[#4A9FD4]">
      {/* Main Content */}
      <div className="flex-1 py-12 px-20">
        {/* Title */}
        <h1 className="text-white text-[32px] font-bold mb-8">Profile</h1>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              {/* Profile Photo */}
              <div className="flex flex-col items-center mb-6">
                <div className="relative">
                  <Image
                    src={UserProfile}
                    alt="Profile"
                    width={120}
                    height={120}
                    className="rounded-full border-4 border-gray-100"
                  />
                  <button className="absolute bottom-0 right-0 w-8 h-8 bg-[#2E3B8E] rounded-full flex items-center justify-center border-2 border-white">
                    <i className="fa-solid fa-camera text-white text-xs"></i>
                  </button>
                </div>
                <p className="text-gray-500 text-sm mt-3">Good Morning</p>
                <h3 className="text-xl font-bold text-gray-900">David Roe</h3>
                <p className="text-[#2E3B8E] text-sm">Director</p>
              </div>

              {/* Profile Information */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">
                  Profile Information
                </h4>
                {isEditing ? (
                  <textarea
                    value={profile.profileInfo}
                    onChange={(e) =>
                      setProfile({ ...profile, profileInfo: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
                    rows={4}
                  />
                ) : (
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {profile.profileInfo}
                  </p>
                )}
              </div>

              {/* Documents Button */}
              <button
                onClick={() => setShowDocuments(true)}
                className="w-full flex items-center justify-between px-4 py-3 border-2 border-[#2E3B8E] text-[#2E3B8E] rounded-lg font-semibold hover:bg-[#2E3B8E] hover:text-white transition"
              >
                <div className="flex items-center gap-2">
                  <i className="fa-regular fa-file-lines"></i>
                  <span>Documents</span>
                </div>
                <span className="w-6 h-6 bg-[#2E3B8E] text-white rounded-full flex items-center justify-center text-xs">
                  {documents.length}
                </span>
              </button>
            </div>
          </div>

          {/* Main Form */}
          <div className="lg:col-span-3">
            <div className="bg-gradient-to-br from-[#2876AC] to-[#3A8EC4] rounded-2xl p-8 shadow-lg">
              {/* Personal Information */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">
                  Personal information
                </h2>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-white text-[#2E3B8E] rounded-lg font-semibold hover:bg-gray-100 transition"
                  >
                    <i className="fa-solid fa-pen text-sm"></i>
                    Edit Profile
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-6 mb-8">
                <div>
                  <label className="block text-sm text-gray-300 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={profile.firstName}
                    onChange={(e) =>
                      setProfile({ ...profile, firstName: e.target.value })
                    }
                    disabled={!isEditing}
                    className="w-full px-4 py-3 bg-transparent border border-white/30 text-white rounded-lg focus:outline-none focus:border-white/60 disabled:opacity-70"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={profile.lastName}
                    onChange={(e) =>
                      setProfile({ ...profile, lastName: e.target.value })
                    }
                    disabled={!isEditing}
                    className="w-full px-4 py-3 bg-transparent border border-white/30 text-white rounded-lg focus:outline-none focus:border-white/60 disabled:opacity-70"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={profile.phone}
                    onChange={(e) =>
                      setProfile({ ...profile, phone: e.target.value })
                    }
                    disabled={!isEditing}
                    className="w-full px-4 py-3 bg-transparent border border-white/30 text-white rounded-lg focus:outline-none focus:border-white/60 disabled:opacity-70"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) =>
                      setProfile({ ...profile, email: e.target.value })
                    }
                    disabled={!isEditing}
                    className="w-full px-4 py-3 bg-transparent border border-white/30 text-white rounded-lg focus:outline-none focus:border-white/60 disabled:opacity-70"
                  />
                </div>
              </div>

              {/* Current Churches */}
              {churches.map((church, index) => (
                <div key={church.id} className="mb-8">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white">
                      Current Church -{index + 1} Information
                    </h2>
                    {isEditing && churches.length > 1 && (
                      <button
                        onClick={() => handleRemoveChurch(church.id)}
                        className="px-4 py-2 bg-white border border-white text-red-500 rounded-lg font-semibold hover:bg-red-50 transition"
                      >
                        Remove
                      </button>
                    )}
                    {isEditing && index === churches.length - 1 && (
                      <button
                        onClick={handleAddChurch}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-white text-[#2E3B8E] rounded-lg font-semibold hover:bg-gray-100 transition"
                      >
                        <i className="fa-solid fa-plus text-sm"></i>
                        Add
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm text-gray-300 mb-2">
                        Church Name
                      </label>
                      <input
                        type="text"
                        value={church.name}
                        onChange={(e) => {
                          const updated = churches.map((c) =>
                            c.id === church.id
                              ? { ...c, name: e.target.value }
                              : c
                          );
                          setChurches(updated);
                        }}
                        disabled={!isEditing}
                        className="w-full px-4 py-3 bg-transparent border border-white/30 text-white rounded-lg focus:outline-none focus:border-white/60 disabled:opacity-70"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-300 mb-2">
                        Church Phone
                      </label>
                      <input
                        type="text"
                        value={church.phone}
                        onChange={(e) => {
                          const updated = churches.map((c) =>
                            c.id === church.id
                              ? { ...c, phone: e.target.value }
                              : c
                          );
                          setChurches(updated);
                        }}
                        disabled={!isEditing}
                        className="w-full px-4 py-3 bg-transparent border border-white/30 text-white rounded-lg focus:outline-none focus:border-white/60 disabled:opacity-70"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-300 mb-2">
                        Church Website
                      </label>
                      <input
                        type="text"
                        value={church.website}
                        onChange={(e) => {
                          const updated = churches.map((c) =>
                            c.id === church.id
                              ? { ...c, website: e.target.value }
                              : c
                          );
                          setChurches(updated);
                        }}
                        disabled={!isEditing}
                        className="w-full px-4 py-3 bg-transparent border border-white/30 text-white rounded-lg focus:outline-none focus:border-white/60 disabled:opacity-70"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-300 mb-2">
                        Church Address
                      </label>
                      <input
                        type="text"
                        value={church.address}
                        onChange={(e) => {
                          const updated = churches.map((c) =>
                            c.id === church.id
                              ? { ...c, address: e.target.value }
                              : c
                          );
                          setChurches(updated);
                        }}
                        disabled={!isEditing}
                        className="w-full px-4 py-3 bg-transparent border border-white/30 text-white rounded-lg focus:outline-none focus:border-white/60 disabled:opacity-70"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-300 mb-2">
                        City
                      </label>
                      <input
                        type="text"
                        value={church.city}
                        onChange={(e) => {
                          const updated = churches.map((c) =>
                            c.id === church.id
                              ? { ...c, city: e.target.value }
                              : c
                          );
                          setChurches(updated);
                        }}
                        disabled={!isEditing}
                        className="w-full px-4 py-3 bg-transparent border border-white/30 text-white rounded-lg focus:outline-none focus:border-white/60 disabled:opacity-70"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-300 mb-2">
                        State
                      </label>
                      <input
                        type="text"
                        value={church.state}
                        onChange={(e) => {
                          const updated = churches.map((c) =>
                            c.id === church.id
                              ? { ...c, state: e.target.value }
                              : c
                          );
                          setChurches(updated);
                        }}
                        disabled={!isEditing}
                        className="w-full px-4 py-3 bg-transparent border border-white/30 text-white rounded-lg focus:outline-none focus:border-white/60 disabled:opacity-70"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-300 mb-2">
                        Zip Code
                      </label>
                      <input
                        type="text"
                        value={church.zipCode}
                        onChange={(e) => {
                          const updated = churches.map((c) =>
                            c.id === church.id
                              ? { ...c, zipCode: e.target.value }
                              : c
                          );
                          setChurches(updated);
                        }}
                        disabled={!isEditing}
                        className="w-full px-4 py-3 bg-transparent border border-white/30 text-white rounded-lg focus:outline-none focus:border-white/60 disabled:opacity-70"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-300 mb-2">
                        Country
                      </label>
                      <input
                        type="text"
                        value={church.country}
                        onChange={(e) => {
                          const updated = churches.map((c) =>
                            c.id === church.id
                              ? { ...c, country: e.target.value }
                              : c
                          );
                          setChurches(updated);
                        }}
                        disabled={!isEditing}
                        className="w-full px-4 py-3 bg-transparent border border-white/30 text-white rounded-lg focus:outline-none focus:border-white/60 disabled:opacity-70"
                      />
                    </div>
                  </div>
                </div>
              ))}

              {/* Other Information */}
              <div className="mb-8">
                <h2 className="text-xl font-bold text-white mb-6">
                  Other Information
                </h2>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">
                      Title
                    </label>
                    <input
                      type="text"
                      value={profile.title}
                      onChange={(e) =>
                        setProfile({ ...profile, title: e.target.value })
                      }
                      disabled={!isEditing}
                      className="w-full px-4 py-3 bg-transparent border border-white/30 text-white rounded-lg focus:outline-none focus:border-white/60 disabled:opacity-70"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">
                      Years in Ministry
                    </label>
                    <input
                      type="text"
                      value={profile.yearsInMinistry}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          yearsInMinistry: e.target.value,
                        })
                      }
                      disabled={!isEditing}
                      className="w-full px-4 py-3 bg-transparent border border-white/30 text-white rounded-lg focus:outline-none focus:border-white/60 disabled:opacity-70"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm text-gray-300 mb-2">
                      Conference
                    </label>
                    <input
                      type="text"
                      value={profile.conference}
                      onChange={(e) =>
                        setProfile({ ...profile, conference: e.target.value })
                      }
                      disabled={!isEditing}
                      className="w-full px-4 py-3 bg-transparent border border-white/30 text-white rounded-lg focus:outline-none focus:border-white/60 disabled:opacity-70"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {isEditing && (
                <div className="flex justify-end gap-4">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-8 py-3 border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-[#2E3B8E] transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setShowSaveConfirm(true)}
                    className="px-8 py-3 bg-white text-[#2E3B8E] rounded-lg font-semibold hover:bg-gray-100 transition"
                  >
                    Save
                  </button>
                </div>
              )}

              {!isEditing && (
                <div className="flex justify-center">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-12 py-3 bg-[#1F2A6E] text-white rounded-lg font-semibold hover:bg-[#0F1A5E] transition shadow-lg"
                  >
                    Submit
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Documents Modal */}
      <DocumentsModal
        isOpen={showDocuments}
        onClose={() => setShowDocuments(false)}
        documents={documents}
        onDelete={handleDeleteDocument}
        onUpload={handleUploadDocument}
      />

      {/* Save Confirmation Modal */}
      {showSaveConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-xl font-bold text-center text-[#2E3B8E] mb-6">
              Are you sure want to save changes ?
            </h3>
            <div className="flex gap-4">
              <button
                onClick={() => setShowSaveConfirm(false)}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 px-6 py-3 bg-[#2E3B8E] text-white rounded-lg font-semibold hover:bg-[#1F2A6E] transition"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {showSuccessMessage && (
        <div className="fixed top-8 left-1/2 transform -translate-x-1/2 z-[70] animate-slide-down">
          <div className="bg-white rounded-xl px-6 py-4 shadow-2xl border-2 border-green-500 flex items-center gap-3">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <i className="fa-solid fa-check text-white text-sm"></i>
            </div>
            <span className="text-[#2E3B8E] font-semibold">
              Changes Saved Successfully
            </span>
          </div>
        </div>
      )}

      <AppFooter />
    </div>
  );
}
