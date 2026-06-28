"use client";
import { useEffect, useState } from "react";
import DirectorHero from "../DirectorHero";
import { directorGlassCard, directorIconButton, directorPageRoot } from "../directorUi";
import ContactDetailHeader from "../../Assets/contactdetailheader.jpg";

const CONTACT_DETAILS_STORAGE_KEY = "director_contact_details";

export default function ContactDetailsPage() {
  const [formData, setFormData] = useState({
    phoneNumber1: "",
    phoneNumber2: "",
    address: "",
    socialMedia: {
      facebook: {
        enabled: true,
        url: "https://www.facebook.com/in/ccc-854808275/",
      },
      twitter: {
        enabled: true,
        url: "https://www.twitter.com/in/ccc-854808275/",
      },
      linkedin: {
        enabled: true,
        url: "https://www.linkedin.com/in/ccc-854808275/",
      },
      whatsapp: {
        enabled: true,
        url: "https://www.linkedin.com/in/ccc-854808275/",
      },
    },
  });
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(CONTACT_DETAILS_STORAGE_KEY);
      if (!saved) return;

      const parsed = JSON.parse(saved);
      setFormData((prev) => ({
        ...prev,
        ...parsed,
        socialMedia: {
          ...prev.socialMedia,
          ...(parsed.socialMedia ?? {}),
        },
      }));
    } catch (error) {
      console.error("Failed to load saved contact details", error);
    }
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSocialMediaToggle = (platform: string) => {
    setFormData((prev) => ({
      ...prev,
      socialMedia: {
        ...prev.socialMedia,
        [platform]: {
          ...prev.socialMedia[platform as keyof typeof prev.socialMedia],
          enabled: !prev.socialMedia[platform as keyof typeof prev.socialMedia].enabled,
        },
      },
    }));
  };

  const handleSocialMediaUrlChange = (
    platform: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      socialMedia: {
        ...prev.socialMedia,
        [platform]: {
          ...prev.socialMedia[platform as keyof typeof prev.socialMedia],
          url: e.target.value,
        },
      },
    }));
  };

  const handleSave = () => {
    try {
      window.localStorage.setItem(
        CONTACT_DETAILS_STORAGE_KEY,
        JSON.stringify(formData),
      );

      setToast("Contact details saved.");
      window.setTimeout(() => setToast(null), 2500);
    } catch (error) {
      console.error("Failed to save contact details", error);
      setToast("Could not save contact details.");
      window.setTimeout(() => setToast(null), 2500);
    }
  };

  const copyText = async (value: string, label: string) => {
    if (!value.trim()) return;

    try {
      await navigator.clipboard.writeText(value);
      setToast(`${label} copied.`);
    } catch (error) {
      console.error("Copy failed", error);
      setToast("Copy failed.");
    }

    window.setTimeout(() => setToast(null), 2500);
  };

  const shareText = async (value: string, label: string) => {
    if (!value.trim()) return;

    try {
      if (navigator.share) {
        await navigator.share({
          title: label,
          text: value,
          url: value.startsWith("http") ? value : undefined,
        });
        return;
      }

      await navigator.clipboard.writeText(value);
      setToast(`${label} copied for sharing.`);
    } catch (error) {
      console.error("Share failed", error);
      setToast("Share failed.");
    }

    window.setTimeout(() => setToast(null), 2500);
  };

  return (
    <div className={directorPageRoot}>
      <DirectorHero
        title="Contact Details"
        subtitle="Organization phone, address, and social links."
        image={ContactDetailHeader}
        breadcrumbItems={[
          { label: "Home", href: "/director/home" },
          { label: "Contact Details" },
        ]}
      />

      <section className="relative py-10">
        <div className="mx-auto max-w-[1000px]">
          <div className={`mx-auto flex min-h-[420px] max-w-3xl items-center justify-center rounded-xl px-4 py-8 ${directorGlassCard}`}>
            <div className="max-w-xl text-center">
              <div className={`${directorIconButton} mx-auto mb-5 h-14 w-14 border-white/15 bg-white/10 text-[#8ec5eb]`}>
                <i className="fa-solid fa-phone text-xl" />
              </div>
              <h2 className="text-2xl font-bold text-white sm:text-3xl">Contact Details</h2>
              <p className="mt-3 text-sm leading-6 text-white/70 sm:text-[15px]">
                CCC contact details are shown in the drawer footer. A dedicated screen is not available yet.
              </p>
            </div>
          </div>
          {/*
            Legacy contact details form preserved for restore.
            <div className={`overflow-hidden rounded-xl ${directorGlassCard}`}>
              <div className="border-b border-white/10 px-8 py-6">
                <h2 className="text-3xl font-bold text-white">Contact Details</h2>
              </div>
              <div className="p-8"> ... phone inputs, address, social links, copy/share buttons, and Save button ... </div>
            </div>
          */}
        </div>
      </section>
      {toast && (
        <div className="fixed right-6 top-20 z-[100] rounded-xl border border-white/15 bg-[#041f35]/95 px-5 py-3 text-sm font-semibold text-white shadow-2xl">
          {toast}
        </div>
      )}
    </div>
  );
}

