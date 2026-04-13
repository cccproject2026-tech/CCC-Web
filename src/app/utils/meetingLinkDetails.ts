import type { AppointmentResponse, AppointmentPlatform } from "@/app/Services/types/appointments.types";

/** Prefer top-level meetingLink, then Zoom-style fields if present. */
export function getAppointmentJoinUrl(appointment?: AppointmentResponse | null): string | null {
  if (!appointment) return null;
  const direct = typeof appointment.meetingLink === "string" ? appointment.meetingLink.trim() : "";
  if (direct) return direct;

  // Some backend variants return zoomJoinUrl or joinUrl fields.
  const anyAppt = appointment as unknown as Record<string, unknown>;
  const candidates = [
    anyAppt.zoomJoinUrl,
    anyAppt.joinUrl,
    anyAppt.join_url,
    anyAppt.joinURL,
  ]
    .map((v) => (typeof v === "string" ? v.trim() : ""))
    .filter(Boolean);

  return candidates[0] ?? null;
}

export function appointmentPlatformLabel(platform: AppointmentPlatform | string): string {
  const p = String(platform ?? "").toLowerCase().trim();
  if (p === "zoom") return "Zoom";
  if (p === "google-meet" || p === "google_meet" || p === "gmeet") return "Google Meet";
  if (p === "teams") return "Microsoft Teams";
  if (p === "phone") return "Phone";
  if (p === "in-person" || p === "in_person") return "In person";
  return String(platform ?? "");
}

function toUrl(raw: string): URL | null {
  const t = raw.trim();
  if (!t) return null;
  try {
    const withProto = /^https?:\/\//i.test(t) ? t : `https://${t}`;
    return new URL(withProto);
  } catch {
    return null;
  }
}

export function parseZoomMeetingIdFromUrl(raw: string): string | undefined {
  const u = toUrl(raw);
  if (!u) return;
  const host = u.hostname.toLowerCase();
  if (!host.includes("zoom.us")) return;
  const fromJ = u.pathname.match(/\/j\/(\d{9,12})\b/i);
  if (fromJ) return fromJ[1];
  const fromJoin = u.pathname.match(/\/join\/(\d{9,12})\b/i);
  if (fromJoin) return fromJoin[1];
  return;
}

export function zoomUrlHasPasscodeQuery(raw: string): boolean {
  const u = toUrl(raw);
  if (!u) return false;
  return u.searchParams.has("pwd");
}

export function parseGoogleMeetCodeFromUrl(raw: string): string | undefined {
  const u = toUrl(raw);
  if (!u) return;
  const host = u.hostname.toLowerCase();
  if (!host.includes("meet.google")) return;
  const m = u.pathname.match(/\/([a-z]{3}-[a-z]{4}-[a-z]{3})\b/i);
  return m?.[1];
}

export function formatMeetingIdForDisplay(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length >= 9 && digits.length <= 11) {
    if (digits.length === 10) return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
    if (digits.length === 11) return `${digits.slice(0, 3)} ${digits.slice(3, 7)} ${digits.slice(7)}`;
    if (digits.length === 9) return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }
  return raw;
}

export function truncateMiddle(text: string, max = 48): string {
  if (text.length <= max) return text;
  const keep = max - 3;
  const head = Math.ceil(keep / 2);
  const tail = Math.floor(keep / 2);
  return `${text.slice(0, head)}...${text.slice(-tail)}`;
}

