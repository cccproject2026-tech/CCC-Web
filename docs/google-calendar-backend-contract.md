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
  "googleCalendarDescription": "Scheduled via CCC",
  "initiatorRole": "director",
  "googleCalendarNonMentorUserId": "..."
}
```

- **`initiatorRole`:** host-initiated flow (`mentor`, `director`, `pastor`, …) per backend DTO.
- **`googleCalendarNonMentorUserId`:** Mongo id whose Google receives `userGoogleCalendarEventId` when `userId` is not that person; omit when `userId` already owns the attendee-side event.

**Response hints** — any of:

- `data.googleCalendarHtmlLink` — HTTPS link participants can open
- `message` mentioning Google / calendar — surfaced in toast

Alternatively return `data.calendarEventId` — the UI treats presence of calendar metadata as success when `googleCalendarSync` was true.

---

## Preferred: `GET /availability/:hostUserId`

**Host (`:hostUserId`):** Mongo id on the **availability document** — for Directors hosting, this is the Director’s user id; for Mentor-hosted grids, the Mentor’s user id.

**Query:** `from`, `to` (ISO datetimes). **`participantUserId` (optional):** second calendar to merge busy intervals into the picker.

- **Director / Mentor-only picker** (Director sees Mentor’s CCC grid, mentor’s Google busy only): call **without** `participantUserId`. Booking `POST /appointments` may still enforce the booker’s (Director’s) Google `free/busy`.
- When both sides should block visible slots (e.g. Director + Pastor with host = Director): pass `participantUserId` for the pastor.

**Conceptual JSON**

```json
{
  "cccAvailability": [{}],
  "google": {
    "mentor": { "googleCalendarLinked": true, "busyIntervals": [{ "start": "...", "end": "..." }] },
    "participant": { "googleCalendarLinked": false, "busyIntervals": [] }
  }
}
```

- Frontend derives bookable slots from CCC, then removes overlaps vs merged `busyIntervals` (titles are never shown — opaque free/busy only).
- `googleCalendarLinked === false`: busy may be empty even if Google has events → UI banner: **“Link Google Calendar to avoid double-booking.”**
- **404**: frontend falls back to `POST /appointments/calendar/external-busy` for busy times only.

---

## Link Calendar (per user): `GET /auth/google`

**Auth:** Always send **`Authorization: Bearer <accessToken>`**. Do **not** call this route anonymously or with a `userId=` query unless it **exactly** matches the JWT subject (prefer omitting the query and letting the backend derive the user).

**Response:** `{ "url": "https://accounts.google.com/..." }` and/or **`{ "data": { "url": "..." } }`** — the SPA reads **`response.data.url`** or **`response.data.data.url`** from the Axios body (avoid bookmarking stale URLs).

Frontend redirects the browser (`window.location.assign(url)`). Callback is backend-only (`/auth/google/callback`). After redirect back to SPA, optionally use **`?googleCalendar=linked`** on success or **`?googleCalendar=error&reason=…`** — UI shows a toast/banner accordingly.

Repeat OAuth for **each** logged-in account that must sync (mentor, pastor, director as applicable).

---

## `POST /appointments` Google outcome fields

Prefer these on `data`:

- `mentorGoogleCalendarEventId`
- `userGoogleCalendarEventId`
- `googleCalendarSyncWarnings: string[]` — non-blocking; show as toast/banner (e.g. mentor not linked, partial failure).

Do not assume events exist if warnings are present or ids are null.

---

## Monthly availability with Google (alternate)

`GET /appointments/availability/:mentorId/month?year=&month=&participantUserId=` — when backend applies Google server-side, pass `participantUserId` for pastor flows.

---

## OAuth / tokens

The browser never calls Google directly. Tokens stay on the backend and are refreshed there.
