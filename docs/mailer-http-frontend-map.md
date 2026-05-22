# MailerService → Frontend HTTP (`CCC-Web`)

All paths below are appended to **`/api/v1`** at runtime via the Next.js rewrite (`/api-proxy/:path*` → backend `…/api/v1/:path*`). Axios uses relative URLs like `/auth/send-otp`.

## Quick index

| # | Mailer (reference) | HTTP (browser client) | Service helper (`src/app/Services/`) |
|---|---------------------|----------------------|---------------------------------------|
| 1 | sendOtpEmail | `POST /auth/send-otp`, `POST /auth/forgot-password` | `apiSendOtp`, `apiForgotPassword` → `auth.service.ts` |
| 2 | sendAppointmentConfirmation | `POST /appointments` | `apiCreateAppointment` → `appointments.service.ts` |
| 3 | sendAppointmentCancellation | `PATCH /appointments/:id/cancel` | `apiCancelAppointment` → `appointments.service.ts` |
| 4 | sendAppointmentRescheduled | `PATCH /appointments/:id/reschedule` | `apiRescheduleAppointment` → `appointments.service.ts` |
| 5 | sendInterestSubmissionConfirmation | `POST /interests` | `apiCreateInterest` → `interests.service.ts` |
| 6 | sendDirectorNewInterestSubmission | Same | Same |
| 7–9 | sendInterestApprovedNextSteps · sendCourseOverview · sendInterestRejected | `PATCH /interests/request/:userId` (`{ status }`) | `apiUpdateInterestStatus` → `interests.service.ts` |
| 10–12 | sendPartnerAssigned… · sendYouHaveBeenAssigned… | `POST /users/:userId/assign` | `apiAssignUsers` (`{ assignedId: string[] }`) → `users.service.ts` |
| 13–14 | sendMenteeRemoved… · sendMentorMenteeRemovedEmail | `PATCH /users/:userId/remove` | `apiRemoveAssignedUsers` → `users.service.ts` |
| 15 | sendPasswordChangedConfirmation | `PATCH /users/:id` (password fields) · **`POST /auth/reset-password`** | `apiUpdateUserById` → `users.service.ts`; **`apiResetPassword`** → `auth.service.ts` |

**Related (password / OTP flows not identical to row 15 text):**

- First-time password: **`POST /auth/set-password`** — `apiSetPassword` (`pastor/setpassword`, `SetPasswordInlinePanel`, `mentor/change-password`).
- Forgot / reset OTP: **`POST /auth/forgot-password`** then **`POST /auth/reset-password`** — `pastor/resetpassword`, `pastor/Settings`.

| # | Mailer (reference) | HTTP | Service helper |
|---|------------------|------|----------------|
| 16 | sendFieldMentorInvitation | `POST /users/invite-field-mentor` | `apiInviteFieldMentor` → `users.service.ts` |
| 17–18 | sendFieldMentorRoleActivated · sendFieldMentorAcceptedDirector | `POST /users/accept-invitation` | `apiAcceptInvitation` → `users.service.ts` |
| 19–20 | sendCourseCompleted · sendMentorMenteeCompletedProgram | **`PATCH /users/:id/mark-completed`** | **`apiMarkUserCompleted`** (`users.service.ts`) · **`apiMarkProgramComplete`** (`progress.service.ts`; same URL) |
| 21–22 | sendCertificateIssued · sendDirectorCertificateIssued | `POST /users/:id/issue-certificate` | `apiIssueCertificate` → `users.service.ts` |
| 23 | sendAccountDeletedFarewell / … | `DELETE /users/:id` | `apiDeleteUser` → `users.service.ts` (e.g. director mentor/mentee profile flows) |
| 24 | sendRoadmapsAssigned | **`POST /progress/assign-roadmap`** | **`apiAssignRoadmap`** (`AssignRoadmapModal`, etc.) → `progress.service.ts` |
| 25 | sendAssessmentAssigned | **`POST /assessment/:assessmentId/assign`** · **`POST /progress/assign-assessment`** | **`apiAssignAssessmentViaModule`** → `assessment.service.ts`; **`apiAssignAssessment`** → `progress.service.ts` |

| # | Mailer (reference) | HTTP | Service helper |
|---|------------------|------|----------------|
| 26 | sendMentorNewPastorQuery | `POST /roadmaps/:roadMapId/queries` · **`POST /roadmaps/pastor/:roadMapId/queries`** | `apiAddQuery(..., scope)` — **`scope: "pastor"`** for pastor jumpstart flows → `roadmaps.service.ts` |
| 27 | sendPastorQueryAnswered | `PATCH …/queries/:queryItemId/reply` (pastor prefix or standard) | `apiReplyToQuery(..., scope)` — mentor/director pastor-roadmap threads use **`"pastor"`** |
| 28 | sendPastorRoadmapComment | `POST /roadmaps/:roadMapId/comments` | `apiAddComment` → `roadmaps.service.ts` |
| 29–30 | sendMicroGrantApplicantReceived · sendMicroGrantDirectorNew | `POST /microgrant/apply` | `applyMicroGrant` → `microGrand.service.ts` |
| 31 | sendMicroGrantRejected · sendMicroGrantPending | **`PATCH /microgrant/application/:id/status`** (`{ status }`) | **`updateMicroGrantStatus`** → `microGrand.service.ts` |

## Implementation notes

- **Assessment list ordering:** `GET /assessment/assigned/:userId` vs `GET /assessment/:id` is resolved in Nest route registration; clients use literal paths `assessment/assigned/${userId}` and `assessment/${id}` (`assessment.service.ts`).
- **`apiGetAssessmentById`:** Do not reuse `assigned/` as `:id`; keep separate URL strings.
- **Query scope:** Prefer **`RoadmapQueriesScope`** `"pastor"` end-to-end for pastor queries + mentor/director replies so threads match backend mail logic (`roadmaps.service.ts`; see `pastor/jumpstart`, mentor roadmap task/home, director roadmap task).

This file mirrors backend **MailerService** triggers from the SPA’s perspective; actual mail copy and conditions live in the API service layer.
