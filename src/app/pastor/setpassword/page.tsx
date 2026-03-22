"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import CCCLogo from "../../Assets/CCCLogo.png";
import PastorHeader from "@/app/Components/PastorHeader";
import AndrewsLogo from "../../Assets/andrews-logo.png";
import { useRouter } from "next/navigation";
import { apiSetPassword } from "@/app/Services/api";
import { getCookie } from "@/app/utils/cookies";

export default function SetPasswordPage() {
  const router = useRouter();

  const [showPopup, setShowPopup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    const email = getCookie("interestEmail");
    if (email) {
      setFormData((prev) => ({ ...prev, email }));
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const { email, password, confirmPassword } = formData;

    // 🔹 Basic validation
    if (!email || !password || !confirmPassword) {
      setError("All fields are required.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Password and Confirm Password must match.");
      return;
    }

    if (password.length < 6) {
      setError("Password should be at least 6 characters.");
      return;
    }

    try {
      setLoading(true);

      const response = await apiSetPassword(email, password, confirmPassword);
      const data = response.data;

      if (!data?.success) {
        setError(data?.message || "Failed to set password. Please try again.");
        return;
      }

      // ✅ Success – show popup
      setShowPopup(true);
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PastorHeader />

      <section className="flex min-h-screen">
        {/* LEFT SIDE */}
        <div className="w-full md:w-1/2 bg-white flex flex-col items-center justify-center p-8">
          <Image
            src={CCCLogo}
            alt="CCC Logo"
            className="w-full object-contain mb-4"
          />
        </div>

        {/* RIGHT SIDE */}
        <div className="w-full md:w-1/2 bg-gradient-to-b from-[#103C8C] to-[#1B4C9E] flex flex-col items-center justify-center px-8 relative">
          <div className="text-center mb-5">
            <h1 className="text-white text-2xl font-semibold tracking-wide">
              WELCOME !
            </h1>
            <p className="text-[#E9C700] text-sm mt-1">
              Welcome to your revitalization roadmap
            </p>
          </div>

          {/* FORM */}
          <div className="w-full max-w-[380px] bg-transparent">
            <h2 className="text-white text-left text-sm mb-3 font-medium">
              Set Password
            </h2>

            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
              <input
                type="email"
                placeholder="Username (Auto generated) Email ID"
                className="w-full rounded-md px-4 py-2 text-sm bg-transparent border border-white/50 text-white placeholder:text-white/70 focus:outline-none focus:border-white read-only:opacity-70 read-only:cursor-not-allowed"
                value={formData.email}
                readOnly={!!formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
              />
              <input
                type="password"
                placeholder="Create Password"
                className="w-full rounded-md px-4 py-2 text-sm bg-transparent border border-white/50 text-white placeholder:text-white/70 focus:outline-none focus:border-white"
                value={formData.password}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, password: e.target.value }))
                }
              />
              <input
                type="password"
                placeholder="Confirm Password"
                className="w-full rounded-md px-4 py-2 text-sm bg-transparent border border-white/50 text-white placeholder:text-white/70 focus:outline-none focus:border-white"
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    confirmPassword: e.target.value,
                  }))
                }
              />

              {/* 🔻 Error message */}
              {error && (
                <p className="text-red-200 text-xs mt-1 text-left">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 bg-white text-[#103C8C] font-medium py-2 rounded-md hover:opacity-90 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "Submitting..." : "Submit"}
              </button>
            </form>
          </div>

          {/* ANDREWS UNIVERSITY LOGO */}
          <div className="absolute bottom-6">
            <div className="flex flex-col items-center">
              <Image
                src={AndrewsLogo}
                alt="Andrews University Logo"
                className="w-[220px] object-contain"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ✅ SUCCESS POPUP */}
      {showPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <div className="bg-white text-center rounded-xl p-8 w-[340px] shadow-lg">
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
            <h2 className="text-[#103C8C] text-lg font-semibold">
              Password Created Successfully
            </h2>

            <button
              onClick={() => router.push("/pastor/login")}
              className="mt-5 border border-[#103C8C] text-[#103C8C] px-5 py-1.5 rounded-md text-sm font-medium hover:bg-[#E6F0FF] transition"
            >
              Click Here to Log in
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
