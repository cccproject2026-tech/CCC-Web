// "use client";
// import { useState } from "react";
// // import { apiSetPassword } from "@/app/Services/api";
// import { isAxiosError } from "axios";
// import { apiSendOtp, apiResetPassword } from "@/app/Services/api";
// import Image from "next/image";
// import CCCLogo from "../../Assets/CCCLogo.png";
// import PastorHeader from "@/app/Components/PastorHeader";
// import AndrewsLogo from "../../Assets/andrews-logo.png";
// import LoginPasswordField from "@/app/Components/LoginPasswordField";
// // type ResetStep = "email" | "otp" | "password";
// type ResetStep = "email" | "reset";
// export default function ResetPasswordPage() {
  
//   // const [email, setEmail] = useState("");
//   // const [password, setPassword] = useState("");
//   // const [confirmPassword, setConfirmPassword] = useState("");
//   // const [isSubmitting, setIsSubmitting] = useState(false);
//   // const [errorMsg, setErrorMsg] = useState<string | null>(null);
//   // const [successMsg, setSuccessMsg] = useState<string | null>(null);
//   const [step, setStep] = useState<ResetStep>("email");
// const [email, setEmail] = useState("");
// const [otp, setOtp] = useState("");
// const [password, setPassword] = useState("");
// const [confirmPassword, setConfirmPassword] = useState("");
// const [isSubmitting, setIsSubmitting] = useState(false);
// const [errorMsg, setErrorMsg] = useState<string | null>(null);
// const [successMsg, setSuccessMsg] = useState<string | null>(null);

//   // const handleSubmit = async (e: React.FormEvent) => {
//   //   e.preventDefault();
//   //   setErrorMsg(null);
//   //   setSuccessMsg(null);

//   //   if (!email || !password || !confirmPassword) {
//   //     setErrorMsg("Please fill all fields.");
//   //     return;
//   //   }

//   //   if (password.length < 6) {
//   //     setErrorMsg("Password must be at least 6 characters.");
//   //     return;
//   //   }

//   //   if (password !== confirmPassword) {
//   //     setErrorMsg("Password and Confirm Password must match.");
//   //     return;
//   //   }

//   //   try {
//   //     setIsSubmitting(true);

//   //     const response = await apiSetPassword(email, password, confirmPassword);
//   //     const json = response.data;

//   //     if (!json.success) {
//   //       setErrorMsg(json.message || "Failed to reset password.");
//   //       return;
//   //     }

//   //     setSuccessMsg(json.message || "Password set successfully.");
//   //     // optional: clear fields
//   //     setPassword("");
//   //     setConfirmPassword("");
//   //     // optional: redirect to login page here if you want
//   //     // router.push("/pastor/login");
//   //   } catch (err) {
//   //     console.error("Set password error:", err);
//   //     setErrorMsg("Something went wrong. Please try again.");
//   //   } finally {
//   //     setIsSubmitting(false);
//   //   }
//   // };
//   const getApiErrorMessage = (err: unknown, fallback: string) => {
//   if (isAxiosError(err)) {
//     const message = err.response?.data?.message;
//     if (typeof message === "string" && message.trim()) return message;
//   }

//   return fallback;
// };

// const handleSendOtp = async (e: React.FormEvent) => {
//   e.preventDefault();
//   setErrorMsg(null);
//   setSuccessMsg(null);

//   if (!email.trim()) {
//     setErrorMsg("Please enter your registered email.");
//     return;
//   }

//   try {
//     setIsSubmitting(true);

//     const response = await apiSendOtp({
//       email: email.trim(),
//       purpose: "password_reset",
//     });

//     if (!response.data.success) {
//       setErrorMsg(response.data.message || "Failed to send verification code.");
//       return;
//     }

//     setSuccessMsg(response.data.message || "Verification code sent to your email.");
//     setStep("reset");
//   } catch (err) {
//     setErrorMsg(getApiErrorMessage(err, "Failed to send verification code."));
//   } finally {
//     setIsSubmitting(false);
//   }
// };



// const handleResetPassword = async (e: React.FormEvent) => {
//   e.preventDefault();
//   setErrorMsg(null);
//   setSuccessMsg(null);

//   if (!password || !confirmPassword) {
//     setErrorMsg("Please fill all password fields.");
//     return;
//   }

//   if (password.length < 6) {
//     setErrorMsg("Password must be at least 6 characters.");
//     return;
//   }

//   if (password !== confirmPassword) {
//     setErrorMsg("Password and Confirm Password must match.");
//     return;
//   }

//   try {
//     setIsSubmitting(true);

//     const response = await apiResetPassword({
//       email: email.trim(),
//       otp: otp.trim(),
//       password,
//       confirmPassword,
//     });

//     if (!response.data.success) {
//       setErrorMsg(response.data.message || "Failed to reset password.");
//       return;
//     }

//     setSuccessMsg(response.data.message || "Password reset successfully.");
//     setPassword("");
//     setConfirmPassword("");
//     setOtp("");
//   } catch (err) {
//     setErrorMsg(getApiErrorMessage(err, "Something went wrong. Please try again."));
//   } finally {
//     setIsSubmitting(false);
//   }
// };

//   // return (
//   //   <div>
//   //     <PastorHeader />

//   //     <section className="flex min-h-screen">
//   //       {/* LEFT LOGO SECTION */}
//   //       <div className="w-full md:w-1/2 bg-white flex flex-col items-center justify-center p-8">
//   //         <Image
//   //           src={CCCLogo}
//   //           alt="CCC Logo"
//   //           className="w-full object-contain mb-4"
//   //         />
//   //       </div>

//   //       {/* RIGHT RESET SECTION */}
//   //       <div className="w-full md:w-1/2 bg-gradient-to-b from-[#103C8C] to-[#1B4C9E] flex flex-col items-center justify-center px-8 py-12 relative">
//   //         <div className="text-left w-full max-w-[380px] mb-6">
//   //           <h1 className="text-white text-xl font-semibold">
//   //             Reset Password
//   //           </h1>
//   //         </div>

//   //         <div className="w-full max-w-[380px] bg-transparent">
//   //           {/* messages */}
//   //           {errorMsg && (
//   //             <p className="mb-3 text-sm text-red-200">{errorMsg}</p>
//   //           )}
//   //           {successMsg && (
//   //             <p className="mb-3 text-sm text-emerald-200">{successMsg}</p>
//   //           )}

//   //           <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
//   //             <input
//   //               type="email"
//   //               placeholder="Enter your registered email"
//   //               className="w-full rounded-md px-4 py-2 text-sm bg-transparent border border-white/50 text-white placeholder:text-white/70 focus:outline-none focus:border-white"
//   //               value={email}
//   //               onChange={(e) => setEmail(e.target.value)}
//   //             />
//   //             <input
//   //               type="password"
//   //               placeholder="Enter New Password"
//   //               className="w-full rounded-md px-4 py-2 text-sm bg-transparent border border-white/50 text-white placeholder:text-white/70 focus:outline-none focus:border-white"
//   //               value={password}
//   //               onChange={(e) => setPassword(e.target.value)}
//   //             />
//   //             <input
//   //               type="password"
//   //               placeholder="Confirm New Password"
//   //               className="w-full rounded-md px-4 py-2 text-sm bg-transparent border border-white/50 text-white placeholder:text-white/70 focus:outline-none focus:border-white"
//   //               value={confirmPassword}
//   //               onChange={(e) => setConfirmPassword(e.target.value)}
//   //             />

//   //             <button
//   //               type="submit"
//   //               disabled={isSubmitting}
//   //               className="w-full mt-4 bg-white text-[#103C8C] font-medium py-2 rounded-md hover:opacity-90 transition disabled:opacity-60"
//   //             >
//   //               {isSubmitting ? "Resetting..." : "Reset Password"}
//   //             </button>
//   //           </form>
//   //         </div>

//   //         <div className="absolute bottom-20">
//   //           <div className="flex flex-col items-center">
//   //             <Image
//   //               src={AndrewsLogo}
//   //               alt="Andrews University Logo"
//   //               className="w-[220px] object-contain"
//   //             />
//   //           </div>
//   //         </div>
//   //       </div>
//   //     </section>
//   //   </div>
//   // );
// return (
//   <div className="relative min-h-screen bg-transparent text-white font-[Albert_Sans]">
//     <PastorHeader />

//     <section className="relative z-10 flex flex-col md:flex-row min-h-[calc(100vh-64px)]">
//       {/* LEFT INFO SECTION */}
//       <div className="w-full md:w-1/2 flex flex-col items-center justify-center p-6 sm:p-8">
//         <div className="w-full max-w-[500px] rounded-3xl border border-white/20 bg-[linear-gradient(180deg,rgba(255,255,255,0.12)_0%,rgba(255,255,255,0.05)_100%)] p-7 shadow-[0_24px_52px_rgba(3,24,43,0.35)] backdrop-blur">
//           <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-[#8ec5eb]">
//             <i className="fa-solid fa-key text-xl" />
//           </div>

//           <h3 className="text-3xl font-semibold text-white">
//             Reset Password
//           </h3>

//           <p className="mt-3 text-sm leading-7 text-[#cde2f2]">
//            Verify your email with a security code before creating a new password.
//           </p>

//           <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
//             <div className="rounded-xl border border-white/15 bg-[#0a3558] p-3">
//               <p className="text-[#8ec5eb] font-semibold">Secure</p>
//               <p className="text-[#d9ebf8]">Update access</p>
//             </div>

//             <div className="rounded-xl border border-white/15 bg-[#0a3558] p-3">
//               <p className="text-[#8ec5eb] font-semibold">Account</p>
//               <p className="text-[#d9ebf8]">Continue safely</p>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* RIGHT RESET SECTION */}
//       <div className="w-full md:w-1/2 bg-[linear-gradient(180deg,rgba(10,53,88,0.8)_0%,rgba(8,43,71,0.85)_100%)] border-l border-white/10 flex flex-col items-center justify-center px-6 sm:px-8 py-10 md:py-12 relative min-h-[540px]">
//         <div className="text-left w-full max-w-[420px] mb-4 sm:mb-6">
//           <h1 className="text-white text-2xl sm:text-3xl font-semibold tracking-tight">
//             Reset Password
//           </h1>
//           <p className="mt-1 text-sm text-[#cde2f2]">
//            {step === "email" && "Enter your registered email to receive a verification code."}
// {step === "reset" && (
//   <form className="flex flex-col gap-4" onSubmit={handleResetPassword}>
//     <input
//       type="text"
//       placeholder="Enter verification code"
//       className="w-full rounded-lg px-4 py-3 text-sm sm:text-base bg-white/10 border border-white/35 text-white placeholder:text-white/65 focus:outline-none focus:border-[#8ec5eb] focus:ring-1 focus:ring-[#8ec5eb]/40"
//       value={otp}
//       onChange={(e) => setOtp(e.target.value)}
//     />

//     <LoginPasswordField
//       value={password}
//       onChange={setPassword}
//       disabled={isSubmitting}
//       placeholder="Enter New Password"
//       autoComplete="new-password"
//     />

//     <LoginPasswordField
//       value={confirmPassword}
//       onChange={setConfirmPassword}
//       disabled={isSubmitting}
//       placeholder="Confirm New Password"
//       autoComplete="new-password"
//     />

//     <button
//       type="submit"
//       disabled={isSubmitting}
//       className="w-full bg-white text-[#0f4a76] font-semibold py-3 rounded-lg text-sm sm:text-base hover:bg-[#e7f1fa] transition disabled:opacity-60"
//     >
//       {isSubmitting ? "Resetting..." : "Reset Password"}
//     </button>

//     <button
//       type="button"
//       disabled={isSubmitting}
//       onClick={() => {
//         setStep("email");
//         setOtp("");
//         setPassword("");
//         setConfirmPassword("");
//       }}
//       className="text-sm text-[#cde2f2] hover:text-white underline-offset-2 hover:underline disabled:opacity-60"
//     >
//       Change email
//     </button>
//   </form>
// )}
//         </div>

//         <div className="w-full max-w-[420px] rounded-2xl border border-white/20 bg-white/5 p-5 sm:p-6 backdrop-blur">
//           {errorMsg && (
//             <p className="mb-3 text-red-200 text-xs sm:text-sm" role="alert">
//               {errorMsg}
//             </p>
//           )}

//           {successMsg && (
//             <p className="mb-3 text-emerald-200 text-xs sm:text-sm" role="status">
//               {successMsg}
//             </p>
//           )}

//           {step === "email" && (
//   <form className="flex flex-col gap-4" onSubmit={handleSendOtp}>
//     <input
//       type="email"
//       placeholder="Enter your registered email"
//       className="w-full rounded-lg px-4 py-3 text-sm sm:text-base bg-white/10 border border-white/35 text-white placeholder:text-white/65 focus:outline-none focus:border-[#8ec5eb] focus:ring-1 focus:ring-[#8ec5eb]/40"
//       value={email}
//       onChange={(e) => setEmail(e.target.value)}
//     />

//     <button
//       type="submit"
//       disabled={isSubmitting}
//       className="w-full bg-white text-[#0f4a76] font-semibold py-3 rounded-lg text-sm sm:text-base hover:bg-[#e7f1fa] transition disabled:opacity-60"
//     >
//       {isSubmitting ? "Sending..." : "Send Code"}
//     </button>
//   </form>
// )}

// {step === "otp" && (
//   <form className="flex flex-col gap-4" onSubmit={handleVerifyOtp}>
//     <input
//       type="text"
//       placeholder="Enter verification code"
//       className="w-full rounded-lg px-4 py-3 text-sm sm:text-base bg-white/10 border border-white/35 text-white placeholder:text-white/65 focus:outline-none focus:border-[#8ec5eb] focus:ring-1 focus:ring-[#8ec5eb]/40"
//       value={otp}
//       onChange={(e) => setOtp(e.target.value)}
//     />

//     <button
//       type="submit"
//       disabled={isSubmitting}
//       className="w-full bg-white text-[#0f4a76] font-semibold py-3 rounded-lg text-sm sm:text-base hover:bg-[#e7f1fa] transition disabled:opacity-60"
//     >
//       {isSubmitting ? "Verifying..." : "Verify Code"}
//     </button>

//     <button
//       type="button"
//       disabled={isSubmitting}
//       onClick={() => setStep("email")}
//       className="text-sm text-[#cde2f2] hover:text-white underline-offset-2 hover:underline disabled:opacity-60"
//     >
//       Change email
//     </button>
//   </form>
// )}

// {step === "password" && (
//   <form className="flex flex-col gap-4" onSubmit={handleResetPassword}>
//     <LoginPasswordField
//       value={password}
//       onChange={setPassword}
//       disabled={isSubmitting}
//       placeholder="Enter New Password"
//       autoComplete="new-password"
//     />

//     <LoginPasswordField
//       value={confirmPassword}
//       onChange={setConfirmPassword}
//       disabled={isSubmitting}
//       placeholder="Confirm New Password"
//       autoComplete="new-password"
//     />

//     <button
//       type="submit"
//       disabled={isSubmitting}
//       className="w-full bg-white text-[#0f4a76] font-semibold py-3 rounded-lg text-sm sm:text-base hover:bg-[#e7f1fa] transition disabled:opacity-60"
//     >
//       {isSubmitting ? "Resetting..." : "Reset Password"}
//     </button>

//     <button
//       type="button"
//       disabled={isSubmitting}
//       onClick={() => setStep("otp")}
//       className="text-sm text-[#cde2f2] hover:text-white underline-offset-2 hover:underline disabled:opacity-60"
//     >
//       Back to code
//     </button>
//   </form>
// )}
//         </div>

//         <div className="absolute bottom-4 md:bottom-6 inset-x-0 flex justify-center opacity-95">
//           <Image
//             src={AndrewsLogo}
//             alt="Andrews University Logo"
//             className="w-[150px] sm:w-[200px] md:w-[230px] lg:w-[250px] object-contain"
//           />
//         </div>
//       </div>
//     </section>
//   </div>
// );


// }


"use client";

import { useState } from "react";
import { isAxiosError } from "axios";
import Image from "next/image";
import { apiForgotPassword, apiResetPassword } from "@/app/Services/api";
import PastorHeader from "@/app/Components/PastorHeader";
import AndrewsLogo from "../../Assets/andrews-logo.png";
import LoginPasswordField from "@/app/Components/LoginPasswordField";

type ResetStep = "email" | "reset";

export default function ResetPasswordPage() {
  const [step, setStep] = useState<ResetStep>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const getApiErrorMessage = (err: unknown, fallback: string) => {
    if (isAxiosError(err)) {
      const message = err.response?.data?.message;
      if (typeof message === "string" && message.trim()) return message;
    }

    return fallback;
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email.trim()) {
      setErrorMsg("Please enter your registered email.");
      return;
    }

    try {
      setIsSubmitting(true);

      // const response = await apiSendOtp({
      //   email: email.trim(),
      //   purpose: "password_reset",
      // });
      const response = await apiForgotPassword({
  email: email.trim(),
});

      if (!response.data.success) {
        setErrorMsg(response.data.message || "Failed to send verification code.");
        return;
      }

      setSuccessMsg(response.data.message || "Verification code sent to your email.");
      setStep("reset");
    // } catch (err) {
    //   setErrorMsg(getApiErrorMessage(err, "Failed to send verification code."));
    // } finally {
    } catch (err) {
  console.error("Reset password error:", err);

  if (isAxiosError(err)) {
    console.log("Status:", err.response?.status);
    console.log("Response:", err.response?.data);
    console.log("Payload sent:", {
      email: email.trim(),
      otp: otp.trim(),
      password,
      confirmPassword,
    });
  }

  setErrorMsg(getApiErrorMessage(err, "Something went wrong. Please try again."));
}finally{
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!otp.trim()) {
      setErrorMsg("Please enter the verification code.");
      return;
    }

    if (!password || !confirmPassword) {
      setErrorMsg("Please fill all password fields.");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Password and Confirm Password must match.");
      return;
    }

    try {
      setIsSubmitting(true);

      // const response = await apiResetPassword({
      //   email: email.trim(),
      //   otp: otp.trim(),
      //   password,
      //   confirmPassword,
      // });
      const response = await apiResetPassword({
        email: email.trim(),
        otp: otp.trim(),
        password,
        confirmPassword,
      });

      if (!response.data.success) {
        setErrorMsg(response.data.message || "Failed to reset password.");
        return;
      }

      setSuccessMsg(response.data.message || "Password reset successfully.");
      setPassword("");
      setConfirmPassword("");
      setOtp("");
      setTimeout(() => {
  window.location.href = "/pastor/login";
}, 1200);
    } catch (err) {
  console.error("Reset password error:", err);

  if (isAxiosError(err)) {
    console.log("Status:", err.response?.status);
    console.log("Response:", err.response?.data);
    console.log("Payload sent:", {
      email: email.trim(),
      otp: otp.trim(),
      password,
      confirmPassword,
    });
  }

  setErrorMsg(getApiErrorMessage(err, "Something went wrong. Please try again."));
} finally {
  setIsSubmitting(false);
}
  };

  return (
    <div className="relative min-h-screen bg-transparent text-white font-[Albert_Sans]">
      <PastorHeader />

      <section className="relative z-10 flex flex-col md:flex-row min-h-[calc(100vh-64px)]">
        {/* LEFT INFO SECTION */}
        <div className="w-full md:w-1/2 flex flex-col items-center justify-center p-6 sm:p-8">
          <div className="w-full max-w-[500px] rounded-3xl border border-white/20 bg-[linear-gradient(180deg,rgba(255,255,255,0.12)_0%,rgba(255,255,255,0.05)_100%)] p-7 shadow-[0_24px_52px_rgba(3,24,43,0.35)] backdrop-blur">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-[#8ec5eb]">
              <i className="fa-solid fa-key text-xl" />
            </div>

            <h3 className="text-3xl font-semibold text-white">
              Forgot Password ?
            </h3>

            <p className="mt-3 text-sm leading-7 text-[#cde2f2]">
               Enter your registered email to receive a secure code and create a new password.
            </p>

            {/* <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl border border-white/15 bg-[#0a3558] p-3">
                <p className="text-[#8ec5eb] font-semibold">Secure</p>
                <p className="text-[#d9ebf8]">Email verified</p>
              </div>

              <div className="rounded-xl border border-white/15 bg-[#0a3558] p-3">
                <p className="text-[#8ec5eb] font-semibold">Account</p>
                <p className="text-[#d9ebf8]">Safe reset</p>
              </div>
            </div> */}
          </div>
        </div>

        {/* RIGHT RESET SECTION */}
        <div className="w-full md:w-1/2 bg-[linear-gradient(180deg,rgba(10,53,88,0.8)_0%,rgba(8,43,71,0.85)_100%)] border-l border-white/10 flex flex-col items-center justify-center px-6 sm:px-8 py-10 md:py-12 relative min-h-[540px]">
          <div className="text-left w-full max-w-[420px] mb-4 sm:mb-6">
            <h1 className="text-white text-2xl sm:text-3xl font-semibold tracking-tight">
              Reset Password
            </h1>

            <p className="mt-1 text-sm text-[#cde2f2]">
              {step === "email"
                ? "Enter your registered email to receive a verification code."
                : "Enter the code and create your new password."}
            </p>
          </div>

          <div className="w-full max-w-[420px] rounded-2xl border border-white/20 bg-white/5 p-5 sm:p-6 backdrop-blur">
            {errorMsg && (
              <p className="mb-3 text-red-200 text-xs sm:text-sm" role="alert">
                {errorMsg}
              </p>
            )}

            {successMsg && (
              <p className="mb-3 text-emerald-200 text-xs sm:text-sm" role="status">
                {successMsg}
              </p>
            )}

            {step === "email" && (
              <form className="flex flex-col gap-4" onSubmit={handleSendOtp}>
                <input
                  type="email"
                  placeholder="Enter your registered email"
                  className="w-full rounded-lg px-4 py-3 text-sm sm:text-base bg-white/10 border border-white/35 text-white placeholder:text-white/65 focus:outline-none focus:border-[#8ec5eb] focus:ring-1 focus:ring-[#8ec5eb]/40"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-white text-[#0f4a76] font-semibold py-3 rounded-lg text-sm sm:text-base hover:bg-[#e7f1fa] transition disabled:opacity-60"
                >
                  {isSubmitting ? "Sending..." : "Send Code"}
                </button>
              </form>
            )}

            {step === "reset" && (
              <form className="flex flex-col gap-4" onSubmit={handleResetPassword}>
                <input
                  type="text"
                  placeholder="Enter verification code"
                  className="w-full rounded-lg px-4 py-3 text-sm sm:text-base bg-white/10 border border-white/35 text-white placeholder:text-white/65 focus:outline-none focus:border-[#8ec5eb] focus:ring-1 focus:ring-[#8ec5eb]/40"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />

                <LoginPasswordField
                  value={password}
                  onChange={setPassword}
                  disabled={isSubmitting}
                  placeholder="Enter New Password"
                  autoComplete="new-password"
                />

                <LoginPasswordField
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  disabled={isSubmitting}
                  placeholder="Confirm New Password"
                  autoComplete="new-password"
                />

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-white text-[#0f4a76] font-semibold py-3 rounded-lg text-sm sm:text-base hover:bg-[#e7f1fa] transition disabled:opacity-60"
                >
                  {isSubmitting ? "Resetting..." : "Reset Password"}
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => {
                    setStep("email");
                    setOtp("");
                    setPassword("");
                    setConfirmPassword("");
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className="text-sm text-[#cde2f2] hover:text-white underline-offset-2 hover:underline disabled:opacity-60"
                >
                  Change email
                </button>
              </form>
            )}
          </div>

          <div className="absolute bottom-4 md:bottom-6 inset-x-0 flex justify-center opacity-95">
            <Image
              src={AndrewsLogo}
              alt="Andrews University Logo"
              className="w-[150px] sm:w-[200px] md:w-[230px] lg:w-[250px] object-contain"
            />
          </div>
        </div>
      </section>
    </div>
  );
}