"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppHero from "@/app/Components/Hero/AppHero";import ConfirmModal from "@/app/Components/ConfirmModal";
import ProfileForm, { ChurchInfo, OtherInfo, PersonalInfo } from "@/app/Components/ProfileForm";
import ProfileSidebarCard from "@/app/Components/ProfileSidebarCard";
import MentorBg from "@/app/Assets/mentor-bg.png";
import Mentor1 from "@/app/Assets/mentor1.png";
import { getUserById } from "@/app/Services/mentors.service";

function MentorProfileContent() {
  const searchParams = useSearchParams();
  const mentorId = searchParams.get("id");

  const router = useRouter();
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  // const [mentor, setMentor] = useState<any>(null);

  // const mentorData = {
  //   firstName: "Robert",
  //   lastName: "Fox",
  //   role: "Senior Field Mentor",
  //   phoneNumber: "09878564398",
  //   email: "johnross@gmail.com",
  //   progress: 100,
  //   specialization: "Church Revitalization",
  //   experience: 15,
  //   totalMentees: 5,
  //   activeMentees: 3,
  //   completedMentees: 2,
  //   church1: {
  //     name: "Loma Linda University Church, CA",
  //     phone: "09878564398",
  //     website: "johnross@gmail.com",
  //     address: "Loma Linda University Church,CA",
  //     city: "Oakland",
  //     state: "North American",
  //     zipCode: "000000",
  //     country: "USA",
  //   },
  //   church2: {
  //     name: "Loma Linda University Church, CA",
  //     phone: "09878564398",
  //     website: "johnross@gmail.com",
  //     address: "Loma Linda University Church,CA",
  //     city: "Oakland",
  //     state: "North American",
  //     zipCode: "000000",
  //     country: "USA",
  //   },
  //   otherInfo: {
  //     title: "Field Mentor",
  //     yearsInMinistry: "11",
  //     conference: "Oakland",
  //     communityServiceProjects: "11",
  //     bio: "Dedicated mentor with 15 years of experience in pastoral ministry and church leadership. Passionate about helping pastors grow and develop their ministries through strategic guidance and support.",
  //   },
  // };

  // const assignedMentees = [
  //   { id: 1, name: "John Ross", church: "Loma Linda Church", progress: 65 },
  //   { id: 2, name: "Robert Smith", church: "Grace Community", progress: 80 },
  //   { id: 3, name: "Michael Brown", church: "Hope Church", progress: 45 },
  // ];

  const [personal, setPersonal] = useState<PersonalInfo>({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    email: "",
  });

  const [church1, setChurch1] = useState<ChurchInfo>({
    churchName: "",
    churchPhone: "",
    churchWebsite: "",
    churchAddress: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
  });

  const [church2, setChurch2] = useState<ChurchInfo>({
    churchName: "",
    churchPhone: "",
    churchWebsite: "",
    churchAddress: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
  });

  const [other, setOther] = useState<OtherInfo>({
    title: "",
    yearsInMinistry: "",
    conference: "",
    communityServiceProjects: "",
  });


  useEffect(() => {
    if (!mentorId) return;

    const fetchMentor = async () => {
      try {
        setLoading(true);

        const res = await getUserById(mentorId);
        const user = res.data.data;
        setPersonal({
          firstName: user.firstName ?? "",
          lastName: user.lastName ?? "",
          phoneNumber: user.phoneNumber ?? "",
          email: user.email ?? "",
        });

        const churchOne = user.interest?.churchDetails?.[0] ?? {};
        const churchTwo = user.interest?.churchDetails?.[1] ?? {};

        setChurch1({
          churchName: churchOne.churchName ?? "",
          churchPhone: churchOne.churchPhone ?? "",
          churchWebsite: churchOne.churchWebsite ?? "",
          churchAddress: churchOne.churchAddress ?? "",
          city: churchOne.city ?? "",
          state: churchOne.state ?? "",
          zipCode: churchOne.zipCode ?? "",
          country: churchOne.country ?? "",
        });

        setChurch2({
          churchName: churchTwo.churchName ?? "",
          churchPhone: churchTwo.churchPhone ?? "",
          churchWebsite: churchTwo.churchWebsite ?? "",
          churchAddress: churchTwo.churchAddress ?? "",
          city: churchTwo.city ?? "",
          state: churchTwo.state ?? "",
          zipCode: churchTwo.zipCode ?? "",
          country: churchTwo.country ?? "",
        });

        setOther({
          title: user.title ?? "",
          yearsInMinistry: user.yearsInMinistry ?? "",
          conference: user.conference ?? "",
          communityServiceProjects: user.currentCommunityProjects ?? "",
        });

      } catch (err) {
        console.error("Failed to fetch mentor", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMentor();
  }, [mentorId]);


  const handleDeleteProfile = () => {
    setToast("Mentor Profile Deleted Successfully");
    setTimeout(() => {
      setToast(null);
      router.push("/director/mentors");
    }, 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-white text-lg">Loading mentor profile...</p>
      </div>
    );
  }


  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#5BA3D0] to-[#6BB5E0]">
      <AppHero
        title={`${personal.firstName} ${personal.lastName}`}
        backgroundImageUrl={MentorBg.src}
        breadcrumbItems={[
          { label: "Mentors", href: "/director/mentors" },
          { label: `${personal.firstName} ${personal.lastName}` },
        ]}
      />


      {/* Profile Content */}
      <section className="px-6 md:px-12 lg:px-20 py-10 bg-gradient-to-b from-[#5BA3D0] to-[#6BB5E0]">
        <div className="max-w-[1400px] mx-auto flex gap-8">
          {/* Left Sidebar - Profile Card */}
          <ProfileSidebarCard
            name={`${personal.firstName} ${personal.lastName}`}
            role={other.title || "Mentor"}
            image={Mentor1}
            badge={{
              text: "Mentor",
              color: "bg-yellow-50 text-yellow-700 border border-yellow-200",
            }}
            showContactIcons={false}
            profileInfo="—"
            documents={{ count: 0, onClick: () => { } }}
            variant="mentor"
          />


          {/* Right Content - Profile Form Only */}
          <div className="flex-1">
            <ProfileForm
              title="Personal Information"
              headerActions={
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="px-4 py-2 bg-white border-2 border-red-500 text-red-500 rounded-lg text-[13px] font-semibold hover:bg-red-50 transition-all flex items-center gap-2"
                  >
                    <i className="fa-regular fa-trash-can"></i>
                    Delete Profile
                  </button>
                  <button
                    onClick={() =>
                      router.push(`/director/mentors/profile/edit?id=${mentorId}`)
                    }
                    className="px-4 py-2 bg-white border-2 border-blue-600 text-blue-600 rounded-lg text-[13px] font-semibold hover:bg-blue-50 transition-all flex items-center gap-2"
                  >
                    <i className="fa-regular fa-pen-to-square"></i>
                    Edit Profile
                  </button>
                </div>
              }
              personal={personal}
              church1={church1}
              church2={church2}
              other={other}
              showInterests={false}
              showComments={false}
            />
          </div>
        </div>
      </section>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] animate-fade-in">
          <div className="bg-white rounded-xl px-6 py-4 shadow-2xl flex items-center gap-3 border border-gray-100">
            <i className="fa-solid fa-circle-check text-green-500 text-xl"></i>
            <span className="text-[#2E3B8E] font-semibold text-[15px]">
              {toast}
            </span>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteProfile}
        title="Are you sure want to Delete this Profile ?"
        message="This will unassign all mentees and cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        confirmColor="bg-red-500 hover:bg-red-600"
        icon="fa-solid fa-trash-can"
        iconColor="text-red-500 bg-red-100"
      />

      {/* Click outside to close options menu */}
      {showOptionsMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowOptionsMenu(false)}
        ></div>
      )}    </div>
  );
}

export default function MentorProfilePage() {
  return (
    <Suspense>
      <MentorProfileContent />
    </Suspense>
  );
}
