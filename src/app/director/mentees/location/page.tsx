"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import AppHeader from "@/app/Components/AppHeader";
import AppFooter from "@/app/Components/AppFooter";
import AppHero from "@/app/Components/AppHero";
import MapCard, { MapMarker } from "@/app/Components/MapCard";
import SearchBar from "@/app/Components/SearchBar";
import FeaturedAvatars, {
  FeaturedAvatarItem,
} from "@/app/Components/FeaturedAvatars";
import MentorBg from "@/app/Assets/mentor-bg.png";
import Mentor1 from "@/app/Assets/mentor1.png";
import Mentor2 from "@/app/Assets/mentor2.png";
import Mentor3 from "@/app/Assets/mentor3.png";

interface MenteeMarker extends MapMarker {
  status?: "inprogress" | "completed" | "pending";
}

const FEATURED = [
  { id: 1, name: "Jacob Jones", img: Mentor1 },
  { id: 2, name: "John Doe", img: Mentor2 },
  { id: 3, name: "Robert Fox", img: Mentor3 },
  { id: 4, name: "Jacob Jones", img: Mentor1 },
  { id: 5, name: "Robert Fox", img: Mentor3 },
  { id: 6, name: "John Doe", img: Mentor2 },
];

const MARKERS: MenteeMarker[] = [
  {
    id: 1,
    name: "Pr. John Ross",
    img: Mentor1,
    top: "38%",
    left: "30%",
    status: "inprogress",
  },
  {
    id: 2,
    name: "Pr. Kevin",
    img: Mentor2,
    top: "30%",
    left: "50%",
    status: "inprogress",
  },
  {
    id: 3,
    name: "Pr. Alex",
    img: Mentor3,
    top: "52%",
    left: "63%",
    status: "inprogress",
  },
  {
    id: 4,
    name: "Pr. Ben",
    img: Mentor2,
    top: "70%",
    left: "40%",
    status: "inprogress",
  },
  {
    id: 5,
    name: "Pr. Adam",
    img: Mentor1,
    top: "58%",
    left: "78%",
    status: "inprogress",
  },
];

export default function MenteesLocationPage() {
  const [query, setQuery] = useState("");

  const featuredItems: FeaturedAvatarItem[] = FEATURED.map((m) => ({
    id: m.id,
    name: m.name,
    img: m.img,
  }));

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#1b598f] to-[#2876AC]">
      <AppHeader showFullHeader={true} />

      <AppHero title="Mentees" backgroundImageUrl={MentorBg.src} />

      {/* Search, Close and Featured Profiles */}
      <section className="relative px-4 sm:px-6 md:px-12 lg:px-20 py-6 md:py-8">
        <div className="max-w-[1400px] mx-auto">
          {/* Row: Search + Close */}
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="w-full max-w-[520px]">
              <SearchBar
                value={query}
                onChange={setQuery}
                placeholder="Search"
                className="w-full"
              />
            </div>
            <Link
              href="/director/mentors"
              className="px-4 py-2 bg-white text-[#2E3B8E] rounded-lg text-[13px] font-semibold shadow-sm hover:bg-gray-50 flex items-center gap-2"
            >
              <i className="fa-solid fa-xmark"></i>
              <span>Close</span>
            </Link>
          </div>

          {/* Featured avatars below search */}
          <FeaturedAvatars
            items={featuredItems}
            gapClass="gap-6"
            nameClass="text-white text-[12px]"
            showDivider
          />
        </div>
      </section>

      {/* Map section */}
      <section className="relative px-4 sm:px-6 md:px-12 lg:px-20 pb-10">
        <div className="max-w-[1400px] mx-auto">
          <MapCard
            title="In-progress"
            iframeSrc="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d31568.68148787118!2d-122.356!3d37.7799!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x808f7fd1d5f8d9f1%3A0x3e1f9a5c95f9a!2sSan%20Francisco%20Bay%20Area!5e0!3m2!1sen!2sus!4v1710000000000&zoom=10"
            markers={MARKERS}
          />
        </div>
      </section>

      <AppFooter />
    </div>
  );
}
