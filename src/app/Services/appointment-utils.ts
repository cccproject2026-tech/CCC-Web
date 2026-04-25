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
  if (o.meetingDate != null && (o._id != null || o.id != null)) {
    return [o];
  }

  const pickArray = (v: unknown): any[] | null => (Array.isArray(v) ? (v as any[]) : null);

  if (pickArray(o.data)) return pickArray(o.data)!;
  if (pickArray(o.appointments)) return pickArray(o.appointments)!;
  if (pickArray(o.items)) return pickArray(o.items)!;
  if (pickArray(o.results)) return pickArray(o.results)!;

  const data = o.data;
  if (data && typeof data === "object" && !Array.isArray(data)) {
    const inner = data as Record<string, unknown>;
    if (inner.meetingDate != null && (inner._id != null || inner.id != null)) {
      return [inner];
    }
    const nestedKeys = [
      "appointments",
      "upcomingAppointments",
      "items",
      "rows",
      "list",
      "results",
      "records",
      "schedule",
      "data",
    ];
    for (const k of nestedKeys) {
      if (Array.isArray(inner[k])) return inner[k] as any[];
    }
  }
  return [];
}

export function unwrapAppointmentsAxiosData(res: { data?: unknown } | null | undefined): any[] {
  return unwrapAppointmentsList(res?.data);
}

/** GET monthly availability — same unwrap as CMA scheduling (multiple API envelope shapes). */
export function unwrapMonthlyAvailabilityPayload(availRes: { data?: unknown }): any[] {
  const body = availRes?.data as Record<string, unknown> | undefined;
  if (!body) return [];
  const inner = body.data;
  if (Array.isArray(inner)) return inner;
  if (inner && typeof inner === "object") {
    const o = inner as Record<string, unknown>;
    const keys = ["days", "slots", "availability", "calendar", "items", "dates"];
    for (const k of keys) {
      if (Array.isArray(o[k])) return o[k] as any[];
    }
  }
  for (const k of ["days", "slots", "availability", "calendar"]) {
    if (Array.isArray((body as Record<string, unknown>)[k])) {
      return (body as Record<string, unknown>)[k] as any[];
    }
  }
  return [];
}

/** Build a display label for one availability slot row (API field names vary). */
export function formatAvailabilitySlotLabel(raw: Record<string, unknown> | string | null | undefined): string {
  if (raw == null) return "";
  if (typeof raw === "string") return raw.trim();
  const r = raw as Record<string, unknown>;
  if (r.startTime != null || r.endTime != null) {
    const sp = String(r.startPeriod ?? "").toLowerCase();
    const ep = String(r.endPeriod ?? "").toLowerCase();
    const start = sp || ep ? `${r.startTime} ${sp}`.trim() : String(r.startTime ?? "");
    const end = sp || ep ? `${r.endTime} ${ep}`.trim() : String(r.endTime ?? "");
    if (start && end) return `${start} – ${end}`;
  }
  if (r.start != null && r.end != null) {
    return `${r.start} – ${r.end}`;
  }
  if (typeof r.label === "string") return r.label;
  return "";
}

/** Local calendar YYYY-MM-DD for a meeting ISO string (avoid UTC day shift). */
export function meetingDateLocalYmd(iso: string | undefined | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    const head = String(iso).match(/^(\d{4}-\d{2}-\d{2})/);
    return head ? head[1] : "";
  }
  return d.toLocaleDateString("en-CA");
}

/** Compare API slot.date to YYYY-MM-DD without UTC shift. */
export function slotDateToYmd(raw: unknown): string | null {
  if (raw == null) return null;
  const s = String(raw).trim();
  const head = s.match(/^(\d{4}-\d{2}-\d{2})/);
  if (head) return head[1];
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-CA");
}

/** Map UI meeting labels to API `platform` values. */
export function uiMeetingModeToPlatform(mode: string): string {
  const m = (mode || "").toLowerCase().trim();
  if (m.includes("google") || m === "meet") return "google-meet";
  if (m.includes("zoom")) return "zoom";
  if (m.includes("team")) return "teams";
  if (m.includes("whatsapp") || m.includes("phone") || m.includes("duo")) return "phone";
  if (m.includes("person")) return "in-person";
  if (m.includes("conference")) return "in-person";
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
