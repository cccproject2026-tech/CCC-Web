"use client";
import Image from "next/image";
import Link from "next/link";
import "@fortawesome/fontawesome-free/css/all.min.css";
import Logo from "../Assets/Frame-logo-1.png";

export default function AppFooter() {
  return (
    <footer className="relative overflow-hidden bg-[#0b3558] px-4 py-12 text-white sm:px-8 lg:px-20">
      <div className="pointer-events-none absolute -right-24 -top-16 h-72 w-72 rounded-full bg-[#8ec5eb]/10 blur-3xl" />
      <div className="pointer-events-none absolute -left-24 bottom-0 h-64 w-64 rounded-full bg-[#8ec5eb]/10 blur-3xl" />

      {/* Main Footer Content */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
        {/* Logo & Tagline */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Image src={Logo} alt="Logo" width={36} height={36} />
          </div>
          <p className="text-white/80 text-sm leading-relaxed max-w-xs">
            Learn, Grow, and Thrive in Faith and Wisdom
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="font-semibold text-[15px] mb-4">Quick Links</h3>
          <ul className="space-y-2 text-sm text-white/80">
            <li>
              <Link href="/director/home" className="hover:text-white">
                Home
              </Link>
            </li>
            <li>
              <Link href="/director/mentors" className="hover:text-white">
                Mentors
              </Link>
            </li>
            <li>
              <Link href="/director/mentees" className="hover:text-white">
                Pastors
              </Link>
            </li>
            <li>
              <Link href="/director/revitalization-roadmap" className="hover:text-white">
                Revitalization Roadmap
              </Link>
            </li>
            <li>
              <Link href="/director/assessments" className="hover:text-white">
                Assessments
              </Link>
            </li>
            <li>
              <Link href="/director/track-progress" className="hover:text-white">
                Track Progress
              </Link>
            </li>
            <li>
              <Link href="/director/assignments" className="hover:text-white">
                Assignments
              </Link>
            </li>
            <li>
              <Link href="/director/schedule" className="hover:text-white">
                Schedule
              </Link>
            </li>
            <li>
              <Link href="/director/notifications" className="hover:text-white">
                Certificates
              </Link>
            </li>
          </ul>
        </div>

        {/* Address & Contact */}
        <div>
          <h3 className="font-semibold text-[15px] mb-4">Address</h3>
          <p className="text-sm text-white/80 leading-relaxed">
            Third floor, Quintesse 313/1, Patel Rama Reddy Road, K.R.Colony,
            Domlur I Stage, Domlur, Bengaluru, Karnataka 560071
          </p>

          <h3 className="font-semibold text-[15px] mt-6 mb-2">Contact</h3>
          <div className="flex flex-col gap-2 text-white/80 text-sm">
            <p className="flex items-center gap-2">
              <i className="fa-solid fa-phone text-[#9FC9FF]"></i> 098096 19514
            </p>
            <p className="flex items-center gap-2">
              <i className="fa-solid fa-phone text-[#9FC9FF]"></i> 098096 19514
            </p>
          </div>
        </div>

        {/* Social Media */}
        <div>
          <h3 className="font-semibold text-[15px] mb-4">Social Media</h3>
          <div className="flex gap-5 text-lg">
            <a href="#" className="hover:text-[#00FF90]">
              <i className="fa-brands fa-whatsapp"></i>
            </a>
            <a href="#" className="hover:text-[#0A66C2]">
              <i className="fa-brands fa-linkedin-in"></i>
            </a>
            <a href="#" className="hover:text-[#1877F2]">
              <i className="fa-brands fa-facebook-f"></i>
            </a>
            <a href="#" className="hover:text-[#1DA1F2]">
              <i className="fa-brands fa-x-twitter"></i>
            </a>
          </div>
        </div>
      </div>

      {/* Divider */}
      <hr className="border-white/20 my-10" />

      {/* Bottom Footer */}
      <div className="relative z-10 flex flex-col sm:flex-row justify-between items-center text-sm text-white/70">
        <div className="flex gap-6 mb-3 sm:mb-0">
          <Link href="/director/home" className="hover:text-white">
            Terms of Use
          </Link>
          <Link href="/director/home" className="hover:text-white">
            Privacy policy
          </Link>
        </div>
        <p>© 2024 Wisdom Tooth Technologies. All Rights Reserved.</p>
      </div>
    </footer>
  );
}
