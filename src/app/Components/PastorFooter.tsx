"use client";
import Image from "next/image";
import Link from "next/link";
import "@fortawesome/fontawesome-free/css/all.min.css";
import Logo from "../Assets/Frame-logo-1.png"; 

export default function PastorFooter() {
  return (
    <footer className="relative overflow-hidden bg-[#0b3558] px-4 py-12 text-white sm:px-8 lg:px-20">
      <div className="pointer-events-none absolute -right-24 -top-16 h-72 w-72 rounded-full bg-[#8ec5eb]/10 blur-3xl" />
      <div className="pointer-events-none absolute -left-24 bottom-0 h-64 w-64 rounded-full bg-[#8ec5eb]/10 blur-3xl" />

  
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
     
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Image src={Logo} alt="Logo" width={36} height={36} />
          </div>
          <p className="text-white/80 text-sm leading-relaxed max-w-xs">
            Cultivate spiritual, professional, social, and community–engagement
            developments
          </p>
        </div>

      
        <div>
          <h3 className="font-semibold text-[15px] mb-4">Quick Links</h3>
          <ul className="space-y-2 text-sm text-white/80">
            <li><Link href="/pastor/home" className="hover:text-white">Home</Link></li>
            <li><Link href="/pastor/Mymentors" className="hover:text-white">My Mentors</Link></li>
            <li><Link href="/pastor/revitalization-roadmap" className="hover:text-white">Revitalization Roadmap</Link></li>
            <li><Link href="/pastor/Assessments" className="hover:text-white">Assessments</Link></li>
            <li><Link href="/pastor/Myprogress" className="hover:text-white">Progress</Link></li>
            <li><Link href="/pastor/Appointments" className="hover:text-white">Appointments</Link></li>
          </ul>
        </div>

       
        <div>
          <h3 className="font-semibold text-[15px] mb-4">Address</h3>
          <p className="text-sm text-white/80 leading-relaxed">
            Third floor, Quintesse 313/1, Patel Rama Reddy Road, K.R. Colony,
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

    
      <hr className="border-white/20 my-10" />

    
      <div className="relative z-10 flex flex-col sm:flex-row justify-between items-center text-sm text-white/70">
        <div className="flex gap-6 mb-3 sm:mb-0">
          <Link href="/pastor/home" className="hover:text-white">Terms of Use</Link>
          <Link href="/pastor/home" className="hover:text-white">Privacy Policy</Link>
        </div>
        <p>© 2024 Wisdom Tooth Technologies. All Rights Reserved.</p>
      </div>
    </footer>
  );
}
