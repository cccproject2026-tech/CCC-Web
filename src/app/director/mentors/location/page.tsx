"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import SearchBar from "@/app/Components/SearchBar";
import DirectorHero from "../../DirectorHero";
import { directorPageRoot } from "../../directorUi";
import MapCard, { MapMarker } from "@/app/Components/MapCard";
import FeaturedAvatars, {
  FeaturedAvatarItem,
} from "@/app/Components/FeaturedAvatars";
import MentorBg from "@/app/Assets/mentor-bg.png";
import Mentor1 from "@/app/Assets/mentor1.png";
import Mentor2 from "@/app/Assets/mentor2.png";
import Mentor3 from "@/app/Assets/mentor3.png";
import { apiGetAllUsers } from "@/app/Services/users.service";
import { resolveApiMediaUrl } from "@/app/utils/image";
import { parseMentorUsersListResponse } from "../parseMentorUsersResponse";

const IMAGE_POOL = [Mentor1, Mentor2, Mentor3];

const MARKER_SLOTS: { top: string; left: string }[] = [
  { top: "38%", left: "30%" },
  { top: "30%", left: "50%" },
  { top: "52%", left: "63%" },
  { top: "70%", left: "40%" },
  { top: "58%", left: "78%" },
  { top: "44%", left: "22%" },
];

type MentorMapRow = {
  id: string;
  name: string;
  img: string | typeof Mentor1;
};

export default function MentorsLocationPage() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [rows, setRows] = useState<MentorMapRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const search =
          debouncedQuery.length > 0 ? debouncedQuery : undefined;
        const res = await apiGetAllUsers({
          role: "mentor",
          roleMatch: "mixed",
          search,
          page: 1,
          limit: 48,
          t: Date.now(),
        });
        if (cancelled) return;
        const { users } = parseMentorUsersListResponse(res);
        const mapped: MentorMapRow[] = users.map((u, i) => {
          const raw = u.profilePicture;
          const img =
            typeof raw === "string" && raw.trim()
              ? resolveApiMediaUrl(raw) ?? raw
              : IMAGE_POOL[i % IMAGE_POOL.length];
          return {
            id: String(u.id ?? u._id),
            name:
              `${String(u.firstName ?? "")} ${String(u.lastName ?? "")}`.trim() ||
              "Mentor",
            img: img as string | typeof Mentor1,
          };
        });
        setRows(mapped);
      } catch (e) {
        console.error(e);
        if (!cancelled) setRows([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  const featuredItems: FeaturedAvatarItem[] = useMemo(
    () =>
      rows.slice(0, 6).map((m) => ({
        id: m.id,
        name: m.name,
        img: m.img,
      })),
    [rows],
  );

  const mapMarkers: MapMarker[] = useMemo(
    () =>
      rows.slice(0, MARKER_SLOTS.length).map((m, i) => ({
        id: m.id,
        name: m.name,
        img: m.img,
        top: MARKER_SLOTS[i].top,
        left: MARKER_SLOTS[i].left,
      })),
    [rows],
  );

  return (
    <div className={directorPageRoot}>
      <DirectorHero
        title="Mentors map"
        subtitle="Mentor locations on the network map (placeholder positions until coordinates are available)."
        image={MentorBg}
        breadcrumbItems={[
          { label: "Home", href: "/director/home" },
          { label: "Mentors", href: "/director/mentors" },
          { label: "Location" },
        ]}
      />

      <section className="relative py-4 md:py-6">
        <div className="mx-auto max-w-[1400px]">
          <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 w-full sm:max-w-[min(520px,100%)]">
              <SearchBar
                value={query}
                onChange={setQuery}
                placeholder="Search mentors by name or email…"
                className="w-full"
                variant="dark"
              />
            </div>
            <Link
              href="/director/mentors"
              className="flex shrink-0 items-center justify-center gap-2 self-end rounded-lg border border-white/20 bg-white/10 px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-white/15 sm:self-auto"
            >
              <i className="fa-solid fa-xmark text-[#8ec5eb]" />
              <span>Close</span>
            </Link>
          </div>

          {loading ? (
            <p className="mb-4 text-sm text-white/55">Loading mentors…</p>
          ) : featuredItems.length > 0 ? (
            <FeaturedAvatars
              items={featuredItems}
              gapClass="gap-6"
              nameClass="text-[12px] text-white/90"
              showDivider
              className="mb-2"
            />
          ) : (
            <p className="mb-4 text-sm text-white/55">
              No mentors match this search.
            </p>
          )}
        </div>
      </section>

      <section className="relative px-0 pb-10 md:pb-12">
        <div className="mx-auto max-w-[1400px]">
          <MapCard
            title="In progress"
            iframeSrc="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d31568.68148787118!2d-122.356!3d37.7799!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x808f7fd1d5f8d9f1%3A0x3e1f9a5c95f9a!2sSan%20Francisco%20Bay%20Area!5e0!3m2!1sen!2sus!4v1710000000000&zoom=10"
            markers={mapMarkers}
          />
          <p className="mt-4 text-center text-xs text-white/50">
            Avatars are placed for illustration. Connect real lat/lng from your
            backend to pin exact locations.
          </p>
        </div>
      </section>
    </div>
  );
}
