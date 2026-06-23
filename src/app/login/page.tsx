import type { Metadata } from "next";
import CommonLoginClient from "./CommonLoginClient";

export const metadata: Metadata = {
  title: "Login",
  description: "Login to your CCC Pastor or Mentor account.",
};

export default function LoginPage() {
  return <CommonLoginClient />;
}
