/** Normalize Mongo-style id from appointment objects returned by various endpoints. */
export function appointmentEntityId(appt: { _id?: string; id?: string } | null | undefined): string {
  if (!appt) return "";
  return String(appt._id ?? appt.id ?? "");
}

/** Extract a list of appointments from API response bodies (multiple envelope shapes). */
export function unwrapAppointmentsList(body: unknown): any[] {
  if (body == null) return [];
  if (Array.isArray(body)) return body;
  if (typeof body !== "object") return [];
  const o = body as Record<string, unknown>;
  const data = o.data;
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") {
    const inner = data as Record<string, unknown>;
    if (Array.isArray(inner.appointments)) return inner.appointments as any[];
    if (Array.isArray(inner.upcomingAppointments)) return inner.upcomingAppointments as any[];
    if (Array.isArray(inner.items)) return inner.items as any[];
  }
  if (Array.isArray(o.appointments)) return o.appointments as any[];
  return [];
}

export function unwrapAppointmentsAxiosData(res: { data?: unknown } | null | undefined): any[] {
  return unwrapAppointmentsList(res?.data);
}

/** Map UI meeting labels to API `platform` values. */
export function uiMeetingModeToPlatform(mode: string): string {
  const m = (mode || "").toLowerCase().trim();
  if (m.includes("google") || m === "meet") return "google-meet";
  if (m.includes("zoom")) return "zoom";
  if (m.includes("team")) return "teams";
  if (m.includes("whatsapp") || m.includes("phone") || m.includes("duo")) return "phone";
  if (m.includes("person")) return "in-person";
  return "zoom";
}

/**
 * Build ISO timestamp from calendar date (local) and slot label like "09:00 am – 10:00 am".
 */
/** Convert 12h clock parts to `HH:mm` for availability payloads. */
export function slotToHHmm(time: string, period: string): string {
  let h = 0;
  let m = 0;
  const parts = String(time || "").split(":");
  if (parts.length >= 1) h = parseInt(parts[0], 10) || 0;
  if (parts.length >= 2) m = parseInt(parts[1], 10) || 0;
  const p = String(period || "").toUpperCase();
  if (p === "PM" && h !== 12) h += 12;
  if (p === "AM" && h === 12) h = 0;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Best-effort message from axios/API errors for toasts. */
export function extractApiErrorMessage(err: unknown): string {
  if (err && typeof err === "object") {
    const e = err as { response?: { data?: unknown }; message?: string };
    const d = e.response?.data;
    if (d && typeof d === "object") {
      const o = d as Record<string, unknown>;
      if (typeof o.message === "string") return o.message;
      if (Array.isArray(o.message)) return o.message.map(String).join(", ");
      if (typeof o.error === "string") return o.error;
    }
    if (typeof e.message === "string" && !e.message.startsWith("Request failed with status")) {
      return e.message;
    }
  }
  return "Request failed";
}

export function parseSlotStartToIso(yyyyMmDd: string, slotLabel: string): string {
  const first = slotLabel.replace(/\u2013/g, "-").split("-")[0]?.trim() ?? "";
  const match = first.match(/^(\d{1,2}):(\d{2})\s*(am|pm)/i);
  if (!match) {
    return new Date(`${yyyyMmDd}T12:00:00`).toISOString();
  }
  let h = parseInt(match[1], 10);
  const min = match[2];
  const ap = match[3].toUpperCase();
  if (ap === "PM" && h !== 12) h += 12;
  if (ap === "AM" && h === 12) h = 0;
  const d = new Date(`${yyyyMmDd}T${String(h).padStart(2, "0")}:${min}:00`);
  return d.toISOString();
}
