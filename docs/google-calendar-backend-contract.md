# Google Calendar × scheduling (frontend contract)

The frontend hides time options that collide with participants’ busy periods and optionally asks the backend to create a native Google Calendar event when a meeting is saved.

Backend must expose the following unless the frontend falls back to “availability-only” scheduling.

---

## `POST /appointments/calendar/external-busy`

**Body**

```json
{
  "userIds": ["<mongo-id>", "..."],
  "timeMin": "2026-05-21T05:00:00.000Z",
  "timeMax": "2026-05-22T06:59:59.999Z"
}
```

Returns busy **intervals each user exposes** ([Google Calendar `freebusy`]) merged server-side — or the frontend concatenates intervals per user itself if you expose a per-user route instead.

## Response shapes (accepted)

Either:

```json
{ "success": true, "data": { "periods": [{ "start": "...Z", "end": "...Z" }] } }
```

```json
{ "data": [{ "start": "...", "end": "..." }] }
```

Nested `busy`, `busyPeriods`, or `items` arrays are supported by the unwrap helper.

- **404** — integration not deployed: frontend skips filtering (shows all availability slots).
- **4xx / 5xx** — frontend shows an error banner; slots are not filtered against Google Calendar.

---

## Optional: create Google event on booking

Extend `POST /appointments` body with optional keys (ignored if unsupported):

```json
{
  "userId": "...",
  "mentorId": "...",
  "meetingDate": "2026-05-21T15:30:00.000Z",
  "platform": "google-meet",
  "notes": "…",
  "googleCalendarSync": true,
  "googleCalendarTitle": "Mentorship — Casey & Avery",
  "googleCalendarDescription": "Scheduled via CCC"
}
```

**Response hints** — any of:

- `data.googleCalendarHtmlLink` — HTTPS link participants can open
- `message` mentioning Google / calendar — surfaced in toast

Alternatively return `data.calendarEventId` — the UI treats presence of calendar metadata as success when `googleCalendarSync` was true.

---

## OAuth / tokens

The browser never calls Google directly. Tokens stay on the backend and are refreshed there.
