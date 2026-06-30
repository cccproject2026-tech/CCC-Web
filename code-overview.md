# CCC-Web Code Overview and Explanation Document

This document explains the CCC-Web frontend repository in beginner-friendly language. It is based on the files currently present in this web application repository.

Backend and database implementation details are not available in this frontend repository. Backend and database sections are explained based on frontend code usage and inferred request/response behavior only.

## 1. Project Overview

CCC-Web is a role-based web application for a church/community revitalization workflow. The frontend provides separate experiences for Directors, Mentors, Pastors, and related pastor-side roles such as lay leaders or seminarians where supported by the auth utilities.

Main features found in the codebase:

- Login, password setup, password reset, logout, and token refresh.
- Role-based dashboards for Director, Mentor, and Pastor users.
- Roadmap creation, assignment, phase navigation, task progress, comments, queries, submissions, and shared media.
- Assessments, pre-surveys, recommendations, CDP result flows, and assessment review pages.
- Mentoring sessions, schedules, availability, rescheduling, transcript summaries, and Google Calendar integration.
- Micro-grant form setup, application, review, and status updates.
- Certificates, documents, notes, notifications, profile management, media, courses, videos, and voice notes.

Technology stack detected:

- Next.js 15 App Router
- React 19
- TypeScript with some JavaScript files allowed
- Tailwind CSS 4 through PostCSS
- Axios for REST API calls
- TanStack React Query for selected async data flows
- Cookies, localStorage, and sessionStorage for browser-side session/UI data

Simple application flow:

```text
User opens website
↓
Website loads initial route
↓
Authentication status is checked
↓
User is sent to login or dashboard
↓
User uses role-based modules
↓
Frontend calls backend APIs
↓
UI updates based on response
```

## 2. Technology Stack

| Technology / Library | Purpose | Where It Is Used |
|---|---|---|
| Next.js | React framework for routing, pages, layouts, builds, rewrites, and redirects. | `src/app`, `next.config.ts` |
| React | UI component library. | Pages and components across `src/app` |
| TypeScript | Adds types to JavaScript. | Most `.ts` and `.tsx` files |
| JavaScript | Some legacy page files still use JavaScript. | Several `page.js` files under `src/app/director` |
| Tailwind CSS 4 | Utility CSS styling. | `src/app/globals.css`, component class names, `postcss.config.mjs` |
| Axios | HTTP client for REST API calls. | `src/app/Services/config/axios-instance.ts`, service files |
| TanStack React Query | Query caching, mutations, refetching, and async state. | `src/app/providers.tsx`, voice notes, mentoring session detail, Google Calendar button |
| js-cookie | Cookie helper used in some older modules. | Voice notes, mentor review/schedule pages, service helpers |
| Custom cookie utility | Main cookie read/write/clear helper. | `src/app/utils/cookies.ts` |
| Font Awesome | Icon CSS. | Imported globally in `src/app/layout.tsx` |
| lucide-react | React icon library. | Installed dependency; used where imported by UI files |
| Chart.js / react-chartjs-2 | Chart rendering. | Dashboard/progress chart features where imported |
| Recharts | Chart rendering. | Dashboard/progress UI where imported |
| html2canvas, html2pdf.js, jsPDF | Export/download PDF or image-like documents. | Certificate/report/download flows where imported |
| country-state-city | Country/state/city data. | Profile/contact/location forms where imported |
| react-international-phone | Phone number input UI. | Contact/profile forms where imported |
| Swiper | Carousel/slider UI. | Pages/components where imported |
| Next Image | Image rendering/optimization API. | Many pages and components using `next/image` |
| Google fonts via `next/font` | Loads Geist, Geist Mono, and Albert Sans. | `src/app/layout.tsx` |
| Docker | Container build support. | `Dockerfile`, `.dockerignore` |

No test library was found in `package.json`.

## 3. Project Structure

| Folder / File | Purpose | Important Notes |
|---|---|---|
| `src/app/` | Main Next.js App Router application. | Contains layouts, pages, components, services, utilities, and assets. |
| `src/app/page.tsx` | Root route `/`. | Public entry page. |
| `src/app/layout.tsx` | Root layout. | Loads fonts, global CSS, Font Awesome, React Query provider, and toast provider. |
| `src/app/global-error.tsx`, `src/app/error.tsx`, `src/app/not-found.tsx` | Global and route error handling. | Next.js App Router error boundaries. |
| `src/app/director/` | Director role routes and UI. | Protected by `DirectorAuthGate` through `director/layout.tsx`. |
| `src/app/mentor/` | Mentor role routes and UI. | Protected by `MentorAuthGate` through `mentor/layout.tsx`. |
| `src/app/pastor/` | Pastor role routes and UI. | Protected by `PastorAuthGate` through `pastor/layout.tsx`. |
| `src/app/login/` | Common login route. | Shared login for pastor/mentor style portal users. |
| `src/app/choose-role/` | Role selection route. | Public role-selection flow. |
| `src/app/voice-notes/` | Shared voice note routes. | Redirects or renders role-specific voice note views. |
| `src/app/Components/` | Reusable UI components. | Includes auth gates, headers, cards, modals, notes, voice notes, hero components, and role-themed UI. |
| `src/app/Services/` | API services and service helpers. | Main REST API layer. |
| `src/app/Services/config/axios-instance.ts` | Main Axios client. | Handles base URL, auth headers, token refresh, CORS proxy path, and 401 redirects. |
| `src/app/Services/types/` | TypeScript API/domain types. | Defines shapes used by service functions. |
| `src/app/Services/utils/` | Service-specific helpers. | Assessment mapping, query builder, time-slot helpers. |
| `src/app/utils/` | App utility functions. | Auth helpers, cookies, roadmap helpers, progress helpers, login navigation, display helpers. |
| `src/app/hooks/` | Custom app hooks. | Currently includes `useDirectorHome`. |
| `src/app/Assets/` | Images and media imported by the app. | Contains logos, backgrounds, roadmap images, videos, and role assets. |
| `public/` | Static public files. | Includes favicon, SVGs, and public images. |
| `src/types/` | Extra global type declarations. | Font Awesome CSS and Axios augmentation types. |
| `package.json` | Dependencies and scripts. | Defines `dev`, `dev:3000`, `build`, and `start`. |
| `next.config.ts` | Next.js configuration. | Standalone output, API proxy rewrite, route redirects, image domains, ignored build errors. |
| `tsconfig.json` | TypeScript configuration. | `strict: true`, `allowJs: true`, path alias `@/* -> ./src/*`. |
| `postcss.config.mjs` | PostCSS configuration. | Enables Tailwind CSS PostCSS plugin. |
| `Dockerfile` | Container deployment file. | Builds/runs the app in Docker. |
| `.github/` | GitHub configuration. | CI or repo automation may live here. |
| `docs/` | Extra project documentation. | Existing documentation folder. |

No `.env`, `.env.local`, `.env.example`, ESLint config, or Tailwind config file was found in the project root during this review.

## 4. Configuration and Environment Files

| File | What It Does | Important Values |
|---|---|---|
| `package.json` | Lists dependencies and scripts. | `next`, `react`, `typescript`, `tailwindcss`, `axios`, `@tanstack/react-query`. |
| `next.config.ts` | Controls Next.js build/runtime behavior. | `output: "standalone"`, API proxy rewrite, route redirects, image remote patterns. |
| `tsconfig.json` | Controls TypeScript. | `strict: true`, `allowJs: true`, `noEmit: true`, alias `@/*`. |
| `postcss.config.mjs` | Configures PostCSS. | Uses `@tailwindcss/postcss`. |
| `Dockerfile` | Defines container build/deployment. | Used when running the app in Docker. |
| `.dockerignore` | Excludes files from Docker build context. | Helps keep Docker builds smaller. |
| `.gitignore` | Excludes generated/local files from Git. | Includes common Node/Next ignored paths. |

Environment variables referenced in code:

```env
NEXT_PUBLIC_API_BASE_URL=https://example.com/api
NEXT_PUBLIC_BACKEND_URL=https://example.com
API_PROXY_TARGET=https://example.com/api/v1
NEXT_PUBLIC_API_PUBLIC_ORIGIN=https://example.com
SKIP_IMAGE_OPTIMIZATION=1
NODE_ENV=development
```

Important notes:

- The browser API base is `/api-proxy`.
- `next.config.ts` rewrites `/api-proxy/:path*` to the backend API.
- If no API environment variable is set, the code falls back to `https://app.wisdomtooth.tech/api/v1`.
- Secret values should not be committed to the repository.

## 5. Application Architecture

This project mainly follows a component-based frontend architecture with pages, reusable components, service files, and utility helpers.

Detected architecture patterns:

- Next.js App Router page-based routing.
- Role-based route groups through `director`, `mentor`, and `pastor` folders.
- Reusable component layer in `src/app/Components`.
- Service-layer architecture in `src/app/Services`.
- Browser storage helpers in `src/app/utils`.
- Client-side route protection through auth gate components.
- TanStack React Query for selected query/mutation-heavy features.

Data flow:

```text
User Action
↓
Page Component
↓
State / Hook
↓
Service or API Function
↓
Backend API
↓
Response
↓
State Update
↓
UI Re-render
```

Typical example:

1. A user clicks a button on a dashboard page.
2. The page sets loading state.
3. The page calls a service function such as `apiGetRoadmaps`.
4. The service uses `axiosInstance`.
5. `axiosInstance` adds the auth token from cookies.
6. Backend returns a response.
7. The page updates local state or React Query cache.
8. React re-renders the UI.

## 6. State Management Approach

The project uses several state techniques:

- `useState` for local UI state such as form values, modals, loading flags, and selected items.
- `useEffect` for loading data, reading storage, redirects, and side effects.
- `useMemo` and `useCallback` in larger components for derived data and stable handlers.
- TanStack React Query for selected server-state features such as voice notes, Google Calendar status, and mentoring session detail/transcript flows.
- Cookie utilities for auth/session state.
- `localStorage` for selected UI preferences or legacy user/session reads.
- `sessionStorage` for temporary cache such as notes lists and selected appointment data.

No Redux, Zustand, MobX, or separate global store library was found.

This project mainly uses local React component state and hooks instead of a separate global state management library.

Auth state is stored mostly in cookies:

- `accessToken`
- `refreshToken`
- `user`
- `mentor`
- `userId`
- `interestEmail`

## 7. Routing and Navigation Flow

The app uses the Next.js App Router. Routes are created by folders under `src/app` that contain `page.tsx` or `page.js`.

Protected layout structure:

| Route Area | Layout File | Guard | Purpose |
|---|---|---|---|
| `/director/*` | `src/app/director/layout.tsx` | `DirectorAuthGate` | Director portal routes |
| `/mentor/*` | `src/app/mentor/layout.tsx` | `MentorAuthGate` | Mentor portal routes |
| `/pastor/*` | `src/app/pastor/layout.tsx` | `PastorAuthGate` | Pastor portal routes |
| `/login` | `src/app/login/page.tsx` | Public | Common login |
| `/director/login` | `src/app/director/login/page.tsx` | Public director route | Director login |

Simple navigation flow:

```text
Initial Route
↓
Login Screen
↓
Role Check / Auth Check
↓
Role-Based Dashboard
↓
Feature Pages
```

Important route redirects/rewrites in `next.config.ts`:

| Source | Destination | Purpose |
|---|---|---|
| `/director/revitalization-roadmap/home` | `/director/revitalization-roadmap` | Normalize old director roadmap links. |
| `/mentor/revitalization-roadmap` | `/mentor/RevitalizationRoadmap` | Normalize mentor route casing. |
| `/pastor/appointments` | `/pastor/appt_route_lower` | Public appointment route mapped to current folder. |
| `/pastor/assessments` | `/pastor/Assessments` | Normalize pastor assessment casing. |
| `/api-proxy/:path*` | Backend API | Avoid browser CORS issues by calling same-origin path. |

Important route groups:

| Route | File Path | Role | Purpose |
|---|---|---|---|
| `/` | `src/app/page.tsx` | Public | Root page |
| `/login` | `src/app/login/page.tsx` | Public | Common login |
| `/choose-role` | `src/app/choose-role/page.tsx` | Public | Choose portal role |
| `/director/home` | `src/app/director/home/page.tsx` | Director | Director dashboard |
| `/mentor/home` | `src/app/mentor/home/page.tsx` | Mentor | Mentor dashboard |
| `/pastor/home` | `src/app/pastor/home/page.tsx` | Pastor | Pastor dashboard |
| `/director/assessments` | `src/app/director/assessments/page.tsx` | Director | Manage assessments |
| `/mentor/MentorAssessments` | `src/app/mentor/MentorAssessments/page.tsx` | Mentor | Mentor assessment area |
| `/pastor/Assessments` | `src/app/pastor/Assessments/page.tsx` | Pastor | Pastor assessment area |
| `/director/revitalization-roadmap` | `src/app/director/revitalization-roadmap/page.js` | Director | Director roadmap area |
| `/mentor/RevitalizationRoadmap` | `src/app/mentor/RevitalizationRoadmap/page.tsx` | Mentor | Mentor roadmap area |
| `/pastor/revitalization-roadmap` | `src/app/pastor/revitalization-roadmap/page.tsx` | Pastor | Pastor roadmap area |
| `/director/mentoring-session` | `src/app/director/mentoring-session/page.tsx` | Director | Mentoring sessions |
| `/mentor/mentoring-session` | `src/app/mentor/mentoring-session/page.tsx` | Mentor | Mentoring sessions |
| `/pastor/mentoring-session` | `src/app/pastor/mentoring-session/page.tsx` | Pastor | Mentoring sessions |
| `/director/micro-grant` | `src/app/director/micro-grant/page.tsx` | Director | Micro-grant management |
| `/mentor/micro-grant` | `src/app/mentor/micro-grant/page.tsx` | Mentor | Micro-grant review/view |
| `/pastor/MicroGrantApplication` | `src/app/pastor/MicroGrantApplication/page.tsx` | Pastor | Micro-grant application |
| `/director/notifications` | `src/app/director/notifications/page.tsx` | Director | Notifications |
| `/mentor/Notifications` | `src/app/mentor/Notifications/page.tsx` | Mentor | Notifications |
| `/pastor/notifications` | `src/app/pastor/notifications/page.tsx` | Pastor | Notifications |

Dynamic routes are present, including `[id]`, `[slug]`, `[userId]`, `[noteId]`, and `[period]`.

## 8. Page-by-Page Explanation

The repository contains many pages. This section groups the most important pages by feature and role.

### Public and Auth Pages

| Page | Route | File Path | Purpose | Main API Calls |
|---|---|---|---|---|
| Root | `/` | `src/app/page.tsx` | Public landing/entry page. | Media/content calls may be used depending on page implementation. |
| Common Login | `/login` | `src/app/login/page.tsx`, `CommonLoginClient.tsx` | Pastor/Mentor login flow. | `apiLogin`, `apiGetUserById` if role must be resolved. |
| Director Login | `/director/login` | `src/app/director/login/page.tsx` | Director login flow. | `apiLogin`. |
| Pastor Login | `/pastor/login` | `src/app/pastor/login/page.tsx` | Pastor-specific login route. | Auth service calls. |
| Mentor Login | `/mentor/login` | `src/app/mentor/login/page.tsx` | Mentor-specific login route. | Auth service calls. |
| Choose Role | `/choose-role` | `src/app/choose-role/page.tsx` | Lets user choose a portal path. | None required from route name. |
| Set/Reset Password | `/pastor/setpassword`, `/pastor/resetpassword`, `/mentor/change-password` | Role password pages | Password setup/reset/change flows. | `apiSetPassword`, `apiForgotPassword`, `apiResetPassword`. |

### Dashboard/Home Pages

| Page | Route | File Path | Purpose | Main API Calls |
|---|---|---|---|---|
| Director Home | `/director/home` | `src/app/director/home/page.tsx` | Director overview dashboard. | Progress, users, roadmaps, appointments. |
| Mentor Home | `/mentor/home` | `src/app/mentor/home/page.tsx` | Mentor dashboard. | Mentor/pastor data, sessions, progress. |
| Pastor Home | `/pastor/home` | `src/app/pastor/home/page.tsx` | Pastor dashboard. | `GET /users/:id`, media/progress/session APIs. |

### Director Pages

| Page | Route | File Path | Purpose |
|---|---|---|---|
| All Pastors | `/director/all-pastors` | `src/app/director/all-pastors/page.js` | View pastor list. |
| Interest List | `/director/interest-list` | `src/app/director/interest-list/page.tsx` | Review submitted interests. |
| Mentors | `/director/mentors` | `src/app/director/mentors/page.tsx` | Manage mentor users. |
| Mentees | `/director/mentees` | `src/app/director/mentees/page.tsx` | Manage mentees/pastors. |
| Assignments | `/director/assignments` | `src/app/director/assignments/page.tsx` | Assignment management. |
| Pastor Assignments | `/director/pastor-assignments` | `src/app/director/pastor-assignments/page.js` | Assign pastor roadmap/survey work. |
| Courses | `/director/courses` | `src/app/director/courses/page.tsx` | Course management/listing. |
| Track Progress | `/director/track-progress` | `src/app/director/track-progress/page.tsx` | Monitor user progress. |
| Schedule | `/director/schedule` | `src/app/director/schedule/page.tsx` | Appointment/schedule management. |
| Documents | `/director/documents` | `src/app/director/documents/page.tsx` | User document handling. |
| Notes | `/director/notes` | `src/app/director/notes/page.tsx` | Notes list and note detail. |
| Profile | `/director/profile` | `src/app/director/profile/page.tsx` | Director profile. |
| FAQ | `/director/faq` | `src/app/director/faq/page.tsx` | Help/FAQ content. |

### Mentor Pages

| Page | Route | File Path | Purpose |
|---|---|---|---|
| Mentor Home | `/mentor/home` | `src/app/mentor/home/page.tsx` | Mentor dashboard. |
| Mentor Schedule | `/mentor/MentorSchedule` | `src/app/mentor/MentorSchedule/page.tsx` | Availability and schedule management. |
| Mentees Detail | `/mentor/MenteesDetailed` | `src/app/mentor/MenteesDetailed/page.tsx` | View assigned mentees. |
| Mentor Assessments | `/mentor/MentorAssessments` | `src/app/mentor/MentorAssessments/page.tsx` | Assessment management/review. |
| Review Center | `/mentor/review-center` | `src/app/mentor/review-center/page.tsx` | Review submitted work. |
| Mentoring Session | `/mentor/mentoring-session` | `src/app/mentor/mentoring-session/page.tsx` | Mentor session list. |
| Mentoring Session Detail | `/mentor/mentoring-session/[id]` | `src/app/mentor/mentoring-session/[id]/page.tsx` | Session detail and transcript summary. |
| Revitalization Roadmap | `/mentor/RevitalizationRoadmap` | `src/app/mentor/RevitalizationRoadmap/page.tsx` | Mentor roadmap area. |
| Track Progress | `/mentor/TrackProgress` | `src/app/mentor/TrackProgress/page.tsx` | Track mentee progress. |
| Certificates | `/mentor/certificates` | `src/app/mentor/certificates/page.tsx` | Certificate viewing/issuing flow. |
| Voice Notes | `/mentor/voice-notes` | `src/app/mentor/voice-notes/page.tsx` | Voice note list. |
| Documents | `/mentor/documents` | `src/app/mentor/documents/page.tsx` | Documents area. |
| Notes | `/mentor/notes` | `src/app/mentor/notes/page.tsx` | Notes list/detail. |
| Profile | `/mentor/profile` | `src/app/mentor/profile/page.tsx` | Mentor profile. |

### Pastor Pages

| Page | Route | File Path | Purpose |
|---|---|---|---|
| Pastor Home | `/pastor/home` | `src/app/pastor/home/page.tsx` | Pastor dashboard. |
| Interest Form | `/pastor/InterestForm` | `src/app/pastor/InterestForm/page.tsx` | Public/onboarding interest form. |
| Assessments | `/pastor/Assessments` | `src/app/pastor/Assessments/page.tsx` | Pastor assessment list. |
| Assessment Guidelines | `/pastor/Assessments/guidelines` | `src/app/pastor/Assessments/guidelines/page.tsx` | Assessment guidance. |
| PMP/CMA Surveys | `/pastor/PastorSurveyPMP`, `/pastor/PastorSurveyCMA` | Survey page files | Survey submission flows. |
| Revitalization Roadmap | `/pastor/revitalization-roadmap` | `src/app/pastor/revitalization-roadmap/page.tsx` | Pastor roadmap dashboard. |
| Jumpstart | `/pastor/jumpstart` | `src/app/pastor/jumpstart/page.tsx` | Jumpstart roadmap/task flow. |
| Roadmap Detail | `/pastor/roadmap-detail/[id]` | `src/app/pastor/roadmap-detail/[id]/page.tsx` | Roadmap detail. |
| Appointments | `/pastor/appointments` | Rewritten to `src/app/pastor/appt_route_lower/page.tsx` | Appointment scheduling. |
| Mentoring Session | `/pastor/mentoring-session` | `src/app/pastor/mentoring-session/page.tsx` | Session list. |
| Mentoring Session Detail | `/pastor/mentoring-session/[id]` | `src/app/pastor/mentoring-session/[id]/page.tsx` | Session detail/transcript. |
| Micro Grant Application | `/pastor/MicroGrantApplication` | `src/app/pastor/MicroGrantApplication/page.tsx` | Apply for micro-grant. |
| Certificates | `/pastor/Certificates` | `src/app/pastor/Certificates/page.tsx` | Certificate display. |
| Documents | `/pastor/Documents` | `src/app/pastor/Documents/page.tsx` | Documents area. |
| Notes | `/pastor/notes` | `src/app/pastor/notes/page.tsx` | Notes list/detail. |
| Notifications | `/pastor/notifications` | `src/app/pastor/notifications/page.tsx` | Notifications. |
| Profile | `/pastor/profile` | `src/app/pastor/profile/page.tsx` | Pastor profile. |

Most pages follow this pattern:

| Item | Explanation |
|---|---|
| Purpose | Render one feature area for one role. |
| State Used | Local component state, effects, loading flags, form state, sometimes React Query. |
| API Calls | Service functions from `src/app/Services` or direct `axiosInstance` calls. |
| Navigation | `next/navigation` router, links, redirects, dynamic route params. |
| Notes | Loading, empty, and error states are implemented per page rather than through one global pattern. |

## 9. Core Modules

### 9.1 Authentication Module

Important files:

- `src/app/login/CommonLoginClient.tsx`
- `src/app/director/login/page.tsx`
- `src/app/utils/common-login.ts`
- `src/app/utils/cookies.ts`
- `src/app/utils/director-auth.ts`
- `src/app/utils/mentor-auth.ts`
- `src/app/utils/pastor-auth.ts`
- `src/app/Components/DirectorAuthGate.tsx`
- `src/app/Components/MentorAuthGate.tsx`
- `src/app/Components/PastorAuthGate.tsx`
- `src/app/Services/auth.service.ts`
- `src/app/Services/config/axios-instance.ts`

Login calls `/auth/login`. Successful login stores tokens and user data in cookies. The common login flow detects whether the user belongs in the mentor or pastor portal. Director login is kept separate.

Logout cleanup is handled by `clearAllCookies`, which removes app session cookies.

Protected routes are implemented client-side through auth gate components. These gates check for a session and redirect unauthenticated users to login with a `returnUrl`.

### 9.2 User Profile Module

Profile data is loaded through user APIs such as:

- `GET /users/:userId`
- `PATCH /users/:userId`
- `PATCH /users/:userId/profile-picture`
- `POST /users/:userId/documents`

Profile-related components include:

- `ProfileForm`
- `ProfileSidebarCard`
- `ProfileDropdown`
- Role-specific profile pages under `director`, `mentor`, and `pastor`.

### 9.3 Dashboard / Home Module

Dashboard pages show role-specific summaries. Director dashboards use progress and user data. Mentor dashboards focus on mentees, assignments, reviews, sessions, and progress. Pastor dashboards focus on assigned roadmap progress, appointments, assessments, and next actions.

The `src/app/hooks/useDirectorHome.ts` hook supports director home data.

### 9.4 Roadmap Module

Important files:

- `src/app/Services/roadmaps.service.ts`
- `src/app/Services/roadmap-assignments.ts`
- `src/app/Services/progress.service.ts`
- `src/app/Components/RoadmapCard.tsx`
- `src/app/Components/RoadmapHomeCard.tsx`
- Role roadmap pages under `director/revitalization-roadmap`, `mentor/RevitalizationRoadmap`, and `pastor`.

Roadmap features include:

- Roadmap list and detail.
- Create/edit/delete/reorder roadmaps.
- Nested roadmap items.
- Assigned roadmaps.
- Task progress.
- Comments and queries.
- Extras and document uploads.
- Submissions and submission activity.
- Jumpstart completion.

### 9.5 Assessment Module

Important files:

- `src/app/Services/assessment.service.ts`
- `src/app/Services/utils/assessment-mapper.ts`
- `src/app/Components/assessment-guidelines/AssessmentGuidelinesClient.tsx`
- Director, mentor, and pastor assessment pages.

Assessment features include create/edit, list/detail, assignment, answer submission, pre-survey submission, recommendations, and result/CDP pages.

### 9.6 Mentoring Session Module

Important files:

- `src/app/Services/mentoring-sessions.service.ts`
- `src/app/Services/appointments.service.ts`
- `src/app/Components/mentorship-sessions/SessionStatusBadge.tsx`
- `src/app/Components/mentorship-sessions/SessionProgressHeader.tsx`
- Mentor and pastor session detail pages.

Features include session lists, grouped mentor sessions, director journeys, detail pages, reschedule requests, completion/cancel actions, appointment joining, and transcript summaries.

### 9.7 Micro-Grant Module

Important files:

- `src/app/Services/microGrand.service.ts`
- `src/app/Components/Card/MicroGrantCard.tsx`
- `src/app/Components/Hero/MicroGrantDetailHero.tsx`
- Role micro-grant pages.

Features include micro-grant form configuration, pastor applications, director/mentor review pages, status updates, and supporting documents.

### 9.8 Certificate Module

Important files:

- `src/app/Services/certificates.service.ts`
- `src/app/Components/CertificatePreview.tsx`
- `src/app/mentor/certificates/page.tsx`
- `src/app/pastor/Certificates/page.tsx`

Certificate APIs include issuing a certificate and fetching a user certificate.

### 9.9 Notification Module

Important files:

- `src/app/Services/notification.service.ts`
- `src/app/Services/notificationUi.ts`
- `src/app/Components/NotificationPopup.tsx`
- Role notification pages and headers.

Features include fetching notifications, adding notifications, deleting user/role notifications, saving a device token, and mapping notifications to UI links/popups.

### 9.10 API Integration Module

The main API client is `src/app/Services/config/axios-instance.ts`.

It handles:

- Base URL resolution.
- Browser proxy path `/api-proxy`.
- `Authorization: Bearer <token>` headers.
- FormData content-type handling.
- Query parameter cleanup.
- 401 token refresh through `/auth/refresh-token`.
- Redirects to role login routes after unauthorized responses.

### 9.11 Storage Module

| Storage Type | Tool | Data Stored | Purpose |
|---|---|---|---|
| Cookies | `src/app/utils/cookies.ts` and `js-cookie` | Tokens, user/mentor data, user id, interest email | Session and role context |
| localStorage | Browser API | Some legacy user reads, notification preferences, contact detail cache, assessment recommendation overrides | UI preferences and legacy fallback storage |
| sessionStorage | Browser API | Notes cache, deleted note ids, selected appointment | Temporary page/session cache |
| Backend database | External backend | Users, appointments, roadmaps, assessments, documents, certificates, notifications | Not implemented in this frontend repository |

Database implementation is handled by the backend and is not available in this frontend repository.

## 10. API Integration

All backend behavior below is based on frontend service usage. Response shape is based on how the frontend UI consumes the response.

Common request/response flow:

```text
User clicks button
↓
Page calls handler
↓
Handler calls service function
↓
Service sends API request
↓
Backend returns response
↓
Page updates state
↓
UI changes
```

### API Client

| Item | Details |
|---|---|
| Defined In | `src/app/Services/config/axios-instance.ts` |
| Browser Base URL | `/api-proxy` |
| Server Base URL | `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_BACKEND_URL`, or fallback host |
| Authentication | Reads `accessToken` cookie and sends `Bearer` header |
| Refresh | Uses `refreshToken` cookie and `/auth/refresh-token` |
| Error Handling | Rejects Axios errors, redirects on 401, retries original request after refresh |

### Main API Groups

| API Group | Methods / Endpoints | Defined In | Used By |
|---|---|---|---|
| Authentication | `POST /auth/login`, `/auth/send-otp`, `/auth/verify-otp`, `/auth/set-password`, `/auth/forgot-password`, `/auth/reset-password`, `/auth/refresh-token`, `/auth/logout` | `auth.service.ts` | Login and password pages |
| Google Calendar | `GET /google-calendar/auth-url`, `GET /google-calendar/status`, appointment busy checks | `auth.service.ts`, `appointments.service.ts`, `google-calendar-scheduling.ts` | Schedule and calendar connect UI |
| Users | `GET /users`, `GET /users/:id`, `POST /users`, `PATCH /users/:id`, `DELETE /users/:id`, assignment and invitation endpoints | `users.service.ts` | Director, mentor, pastor profile/list pages |
| Documents | `POST /users/:id/documents`, `GET /users/:id/documents`, `DELETE /users/:id/documents/:documentId` | `users.service.ts`, `pastor.service.ts` | Documents/profile pages |
| Notes | `GET/POST/PATCH/PUT/DELETE /users/:userId/notes` | `users.service.ts`, `notes.service.ts` | Notes pages |
| Mentors/Mentees | `/home/mentors`, `/home/pastors`, `/home/field-mentors`, `/home/mentee/:email` | `mentors.service.ts` | Mentor/mentee management pages |
| Roadmaps | `GET/POST/PATCH/DELETE /roadmaps`, `/roadmaps/user/:userId`, nested items, comments, queries, extras, submissions | `roadmaps.service.ts` | Roadmap pages |
| Progress | `/progress/director/overview`, `/progress/overall`, `/progress/:userId`, `/progress/bulk`, roadmap/assessment update endpoints, final comments | `progress.service.ts` | Dashboards and progress pages |
| Assessments | `GET/POST/PATCH/DELETE /assessment`, assignment, answers, sections, recommendations, pre-survey | `assessment.service.ts` | Assessment pages |
| Appointments | `/appointments`, `/appointments/user/:id`, `/appointments/mentor/:id`, availability, reschedule, cancel, join, transcript summary | `appointments.service.ts`, `pastor.service.ts` | Schedule and mentoring pages |
| Mentoring Sessions | `/mentoring-sessions/pastor/:id`, `/mentor/:id/grouped`, `/director/journeys`, detail/reschedule/complete/cancel | `mentoring-sessions.service.ts` | Mentoring session pages |
| Micro-Grant | `/microgrant/form`, `/microgrant`, `/microgrant/user/:id`, status update endpoints | `microGrand.service.ts` | Micro-grant pages |
| Certificates | `POST /certificates/issue`, `GET /certificates/user/:userId` | `certificates.service.ts` | Certificate pages |
| Notifications | `GET /notifications/:userId`, add/delete notification endpoints, `POST /home/device-token` | `notification.service.ts` | Headers and notification pages |
| Media | `GET/POST/PATCH/DELETE /home/media`, bulk delete | `media.service.ts` | Video/course/media pages |
| Voice Notes | Upload/list/detail/delete voice notes | `voice-notes.service.ts` | Voice note pages and components |

Example API description:

| Item | Details |
|---|---|
| API | Login |
| Endpoint | `/auth/login` |
| Method | `POST` |
| Request Body | Email and password |
| Authentication | No existing token required |
| Response | Success flag, tokens, and user object |
| Error Handling | Login page displays invalid credentials or API error message |
| Defined In | `src/app/Services/auth.service.ts` |
| Used In | `src/app/login/CommonLoginClient.tsx`, director/pastor/mentor login pages |

## 11. Database and Storage

Database implementation is handled by the backend and is not available in this frontend repository.

| Storage Type | Tool | Data Stored | Purpose |
|---|---|---|---|
| Remote database | Backend API | Users, roles, roadmaps, progress, assessments, appointments, documents, certificates, notifications | Persistent business data |
| Cookies | Browser cookies | `accessToken`, `refreshToken`, `user`, `mentor`, `userId`, `interestEmail` | Authentication/session state |
| localStorage | Browser localStorage | Notification preferences, contact form data, some legacy user/session fallbacks | Persistent browser-only UI data |
| sessionStorage | Browser sessionStorage | Notes cache, selected appointment, deleted note ids | Temporary browser-session data |
| React Query cache | In-memory | Query results for selected features | Reduces repeated API calls and manages loading/error state |

## 12. Code Walkthrough

| Name | Type | File Path | Purpose |
|---|---|---|---|
| Root Layout | Layout | `src/app/layout.tsx` | Loads fonts, global CSS, providers, and toast provider. |
| App Providers | Provider | `src/app/providers.tsx` | Creates React Query client. |
| Axios Instance | Service client | `src/app/Services/config/axios-instance.ts` | Central API client with auth and refresh handling. |
| API Export Barrel | Service index | `src/app/Services/api.ts` | Re-exports API functions and types. |
| Cookie Utilities | Utility | `src/app/utils/cookies.ts` | Set, read, remove, and clear app cookies. |
| Common Login Utilities | Utility | `src/app/utils/common-login.ts` | Role detection, session storage, post-login destination. |
| Director Auth Gate | Component | `src/app/Components/DirectorAuthGate.tsx` | Protects director routes. |
| Mentor Auth Gate | Component | `src/app/Components/MentorAuthGate.tsx` | Protects mentor routes. |
| Pastor Auth Gate | Component | `src/app/Components/PastorAuthGate.tsx` | Protects pastor routes. |
| Role Shell | Component | `src/app/Components/RoleShell.tsx` | Shared role layout shell. |
| App Header | Component | `src/app/Components/Header/AppHeader.tsx` | Main app header. |
| Auth Service | Service | `src/app/Services/auth.service.ts` | Login, password, token, onboarding, Google auth APIs. |
| Users Service | Service | `src/app/Services/users.service.ts` | User CRUD, documents, notes, assignments, invitations. |
| Roadmaps Service | Service | `src/app/Services/roadmaps.service.ts` | Roadmap CRUD, nested items, extras, submissions, comments, queries. |
| Progress Service | Service | `src/app/Services/progress.service.ts` | Progress and dashboard metrics. |
| Assessment Service | Service | `src/app/Services/assessment.service.ts` | Assessment CRUD, assignment, answers, recommendations. |
| Appointments Service | Service | `src/app/Services/appointments.service.ts` | Appointment and availability APIs. |
| Mentoring Sessions Service | Service | `src/app/Services/mentoring-sessions.service.ts` | Mentoring session APIs. |
| Notification UI Helpers | Utility | `src/app/Services/notificationUi.ts` | Converts notifications into UI-friendly data. |
| Voice Notes Queries | Custom hooks | `src/app/Components/voice-notes/hooks/useVoiceNotesQueries.ts` | React Query hooks for voice notes. |

## 13. Reusable Components

| Component | File Path | Purpose | Used In |
|---|---|---|---|
| `DirectorAuthGate` | `src/app/Components/DirectorAuthGate.tsx` | Protects director pages. | Director layout |
| `MentorAuthGate` | `src/app/Components/MentorAuthGate.tsx` | Protects mentor pages. | Mentor layout |
| `PastorAuthGate` | `src/app/Components/PastorAuthGate.tsx` | Protects pastor pages. | Pastor layout |
| `RoleShell` | `src/app/Components/RoleShell.tsx` | Shared visual shell for role portals. | Mentor and pastor layouts, director shell |
| `AppHeader` | `src/app/Components/Header/AppHeader.tsx` | Main header/navigation. | Director layout shell and role pages |
| `MentorHeader` | `src/app/Components/MentorHeader.tsx` | Mentor-style header. | Mentor/common login pages |
| `PastorHeader` | `src/app/Components/PastorHeader.tsx` | Pastor-style header. | Pastor pages |
| `ProfileDropdown` | `src/app/Components/ProfileDropdown.tsx` | Profile menu/logout UI. | Headers |
| `ProfileForm` | `src/app/Components/ProfileForm.tsx` | Profile editing form. | Profile pages |
| `SearchBar` | `src/app/Components/SearchBar.tsx` | Reusable search input. | List pages |
| `SortDropdown` | `src/app/Components/SortDropdown.tsx` | Sort UI. | List pages |
| `TabSwitcher` | `src/app/Components/TabSwitcher.tsx` | Tab navigation. | Feature pages |
| `ConfirmModal` | `src/app/Components/ConfirmModal.tsx` | Confirmation dialog. | Delete/destructive actions |
| `Toast` / `ToastProvider` | `src/app/Components/ui/Toast.tsx` | Toast notifications. | Root layout and UI actions |
| `RoadmapCard` | `src/app/Components/RoadmapCard.tsx` | Roadmap summary card. | Roadmap pages |
| `RoadmapHomeCard` | `src/app/Components/RoadmapHomeCard.tsx` | Roadmap home card. | Roadmap home pages |
| `ProgressDashboardShared` | `src/app/Components/ProgressDashboardShared.tsx` | Shared progress dashboard UI. | Progress pages |
| `ScheduleMeetingModal` | `src/app/Components/ScheduleMeetingModal.tsx` | Meeting scheduling modal. | Schedule/session pages |
| `AvailabilityCalendar` | `src/app/Components/AvailabilityCalendar.tsx` | Calendar availability display. | Schedule pages |
| `CertificatePreview` | `src/app/Components/CertificatePreview.tsx` | Certificate display/preview. | Certificate pages |
| `NotificationPopup` | `src/app/Components/NotificationPopup.tsx` | Popup notification UI. | Headers/pages |
| `VoiceNotesListContent` | `src/app/Components/voice-notes/VoiceNotesListContent.tsx` | Voice note list UI. | Voice note pages |
| `VoiceNoteRecordModal` | `src/app/Components/voice-notes/VoiceNoteRecordModal.tsx` | Record voice note modal. | Voice note pages |
| `NotesPageContent` | `src/app/Components/notes/NotesPageContent.tsx` | Notes list UI. | Role notes pages |
| `NoteDetailContent` | `src/app/Components/notes/NoteDetailContent.tsx` | Note detail UI. | Note detail pages |

Example pattern:

```tsx
<DirectorAuthGate>
  <DirectorLayoutShell>{children}</DirectorLayoutShell>
</DirectorAuthGate>
```

Line-by-line:

- `DirectorAuthGate` checks whether a director session exists.
- If the route is public, it allows the page.
- If no session exists, it redirects to login.
- `DirectorLayoutShell` renders the role shell and header for allowed pages.

## 14. Utility and Helper Functions

| Function / Utility | File Path | Input | Output | Purpose |
|---|---|---|---|---|
| `setCookie` | `src/app/utils/cookies.ts` | Name, value, days | Cookie write | Store session/browser data. |
| `getCookie` | `src/app/utils/cookies.ts` | Cookie name | Cookie value or null | Read session data. |
| `clearAllCookies` | `src/app/utils/cookies.ts` | None | None | Logout cleanup. |
| `detectPortalRole` | `src/app/utils/common-login.ts` | User object | `pastor`, `mentor`, `director`, or null | Decide role after login. |
| `storePortalSession` | `src/app/utils/common-login.ts` | Role and login payload | Normalized user/user id | Store user session cookies. |
| `getPostLoginDestination` | `src/app/utils/common-login.ts` | Role, return URL, user | Route path | Choose dashboard/profile route after login. |
| `hasDirectorSession` | `src/app/utils/director-auth.ts` | None | Boolean | Checks director auth. |
| `hasMentorSession` | `src/app/utils/mentor-auth.ts` | None | Boolean | Checks mentor auth. |
| `hasPastorSession` | `src/app/utils/pastor-auth.ts` | None | Boolean | Checks pastor auth. |
| `buildQueryString` | `src/app/Services/utils/queryBuilder.ts` | Params object | Query string | Creates URL query strings. |
| `mapAssessmentFromApi` | `src/app/Services/utils/assessment-mapper.ts` | API assessment | UI assessment | Normalizes assessment data. |
| `formatAssessmentApiErrorMessage` | `src/app/Services/assessment.service.ts` | Error | Message string | User-friendly assessment errors. |
| `unwrapNotificationsList` | `src/app/Services/notificationUi.ts` | API response | Notification array | Normalize notifications. |
| `getNotificationHref` | `src/app/Services/notificationUi.ts` | Notification | Link path | Routes notifications to pages. |
| `normalizeNotesList` | `src/app/Services/notes.service.ts` | API payload | Notes array | Normalizes note API data. |
| `unwrapRoadmapsList` | `src/app/Services/roadmap-assignments.ts` | API response | Roadmap array | Normalizes roadmap list payload. |
| `mergeProgressOntoRoadmaps` | `src/app/Services/roadmap-assignments.ts` | Roadmaps/progress | Merged roadmap data | Shows assigned roadmap progress. |

## 15. Custom Hooks / Services / Providers

| Name | Type | File Path | Responsibility |
|---|---|---|---|
| `AppProviders` | Provider | `src/app/providers.tsx` | Wraps app in `QueryClientProvider`. |
| `ToastProvider` | Provider | `src/app/Components/ui/Toast.tsx` | Provides toast UI behavior. |
| `useDirectorHome` | Hook | `src/app/hooks/useDirectorHome.ts` | Supports director dashboard data. |
| `useVoiceNotesQueries` hooks | Hook set | `src/app/Components/voice-notes/hooks/useVoiceNotesQueries.ts` | Lists, fetches, uploads, deletes voice notes with React Query. |
| `useVoiceRecorder` | Hook | `src/app/Components/voice-notes/hooks/useVoiceRecorder.ts` | Manages browser voice recording state. |
| `useNotesSession` | Hook | `src/app/Components/notes/useNotesSession.ts` | Resolves note/session user context. |
| `useMentorshipQueries` | Hook set | `src/app/mentor/mentoring-session/hooks/useMentorshipQueries.ts` | Loads and mutates mentorship session data. |
| API services | Service files | `src/app/Services/*.service.ts` | Grouped REST API wrappers. |

## 16. Security Implementation

What is implemented:

- Auth tokens are stored in cookies and attached to API requests.
- Refresh token flow retries failed 401 requests when possible.
- Role route guards redirect unauthenticated users.
- Logout clears app cookies.
- API base URLs come from environment variables or controlled defaults.
- `skipAuth` support exists for public requests.
- FormData requests remove manual `Content-Type` so browser boundaries are correct.
- Basic user input validation appears in form pages.
- Next Image remote patterns restrict image host usage.

What is missing or can be improved:

- Cookies are client-created, not `HttpOnly`; stronger security would require backend-set `HttpOnly` cookies.
- Route protection is client-side. Sensitive authorization must still be enforced by backend APIs.
- Build config currently ignores TypeScript and ESLint build errors.
- A central role-permission matrix would make authorization easier to audit.
- A shared form validation library is not currently used.
- CORS is controlled by the backend; this frontend only consumes APIs through Axios and proxy rewrites.
- CSRF protection depends on backend/session design and is not fully visible in this frontend repo.

## 17. Error Handling and Logging

| Error Type | How It Is Handled | Files / Pages |
|---|---|---|
| API 401 | Axios refresh flow, then role-based redirect if refresh fails. | `axios-instance.ts` |
| Login errors | Page displays invalid credential/API messages. | `CommonLoginClient.tsx`, role login pages |
| API validation errors | Many pages read Axios error messages and show inline messages or toasts. | Assessment, interest, profile, schedule pages |
| Network errors | Mostly caught with `try/catch` and displayed as generic retry messages. | Service consumers |
| Loading state | Local loading flags, skeletons, spinners, React Query loading state. | Auth gates, voice notes, mentoring pages |
| Empty state | Feature-specific empty components and messages. | Voice notes, lists, dashboards |
| Global route errors | Next.js error boundaries. | `error.tsx`, `global-error.tsx`, `not-found.tsx` |
| Console logging | Some pages log debug info in development. | Large schedule/session/roadmap pages |

Suggested improvements:

- Add a shared API error formatter for all pages.
- Add consistent toast usage for success and failure.
- Add centralized logging only in development.
- Add automated tests for important failure states.

## 18. Third-Party Libraries

| Library | Purpose | Used In |
|---|---|---|
| `next` | Framework and routing. | Whole app |
| `react`, `react-dom` | UI rendering. | Whole app |
| `typescript` | Type checking. | Most source files |
| `tailwindcss`, `@tailwindcss/postcss` | Styling. | Global CSS and class names |
| `axios` | API requests. | Service layer |
| `@tanstack/react-query` | Server state/query management. | App provider, voice notes, mentoring, calendar status |
| `js-cookie` | Cookie helper. | Some legacy modules/hooks |
| `@fortawesome/fontawesome-free` | Icons through CSS classes. | Global layout and components |
| `lucide-react` | React icons. | UI components where imported |
| `chart.js`, `react-chartjs-2`, `recharts` | Charts and dashboards. | Progress/dashboard pages |
| `country-state-city` | Country/state/city lists. | Forms |
| `html2canvas`, `html2pdf.js`, `jspdf` | Export and PDF generation. | Certificate/report/download flows |
| `react-international-phone` | Phone input. | Profile/contact forms |
| `swiper` | Carousel/slider UI. | Pages/components where imported |

## 19. Build and Deployment

Prerequisites:

- Node.js compatible with Next.js 15 and React 19.
- npm, because this repo includes `package-lock.json`.

Scripts from `package.json`:

```bash
npm install
npm run dev
npm run dev:3000
npm run build
npm run start
```

| Command | Purpose |
|---|---|
| `npm install` | Install dependencies. |
| `npm run dev` | Start local development server. |
| `npm run dev:3000` | Start local development server on port 3000. |
| `npm run build` | Build production app. |
| `npm run start` | Start production server after build. |

Deployment notes:

- `next.config.ts` uses `output: "standalone"`, which is useful for container/server deployments.
- `Dockerfile` exists, so Docker-based deployment is supported.
- TypeScript and ESLint errors are ignored during builds in `next.config.ts`; this helps deployment continue but can hide real problems.

## 20. Manual Testing Checklist

- [ ] Website opens successfully.
- [ ] Common login works.
- [ ] Director login works.
- [ ] Mentor login works.
- [ ] Pastor login works.
- [ ] Logout clears session cookies.
- [ ] Auth token/session is saved after login.
- [ ] Role redirect works after login.
- [ ] Protected routes redirect unauthenticated users.
- [ ] Director pages load.
- [ ] Mentor pages load.
- [ ] Pastor pages load.
- [ ] Roadmaps list, detail, and task pages work.
- [ ] Roadmap assignment/progress updates work.
- [ ] Mentoring sessions list and detail pages work.
- [ ] Appointment scheduling/rescheduling works.
- [ ] Assessments load and submit correctly.
- [ ] Micro-grant form/application/review works.
- [ ] Certificates display or issue correctly.
- [ ] Profile actions work.
- [ ] Documents upload/download/delete flows work.
- [ ] Notes create/edit/delete flows work.
- [ ] Notifications load and navigation links work.
- [ ] Voice notes record/upload/list/detail/delete work.
- [ ] Search/filter/sort controls work.
- [ ] Forms show validation errors.
- [ ] API errors show messages.
- [ ] Back navigation works.
- [ ] Production build works with `npm run build`.

## 21. Common Developer Tasks

Add a new page:

1. Create a folder under `src/app`.
2. Add a `page.tsx` file.
3. Export a React component as default.
4. Put it under `director`, `mentor`, or `pastor` if it is role-specific.

Add a reusable component:

1. Create a `.tsx` file under `src/app/Components`.
2. Define typed props.
3. Keep the component focused on one UI responsibility.
4. Import it into pages that need it.

Add a new API function:

1. Pick the matching service file in `src/app/Services`.
2. Import or use `axiosInstance`.
3. Add a function with a clear name such as `apiGetSomething`.
4. Add request/response types under `src/app/Services/types` if needed.
5. Re-export it from `src/app/Services/api.ts` if it should be shared.

Add loading and error state:

1. Add `isLoading` and `error` local state or use React Query state.
2. Set loading before the API call.
3. Catch errors and format a user-friendly message.
4. Render spinner/skeleton, empty state, error state, and success state.

Store/read auth data:

1. Use `setCookie`, `getCookie`, and `clearAllCookies` from `src/app/utils/cookies.ts`.
2. Do not manually duplicate auth logic unless necessary.
3. Keep token handling inside the API client when possible.

Debug API issues:

1. Check the service function endpoint.
2. Check `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_BACKEND_URL`, or `API_PROXY_TARGET`.
3. Check browser network tab for `/api-proxy` calls.
4. Check if `Authorization` header is present.
5. Check whether the backend response shape matches UI expectations.

Fix TypeScript errors:

1. Run `npm run build` to expose build problems.
2. Read the file and line reported.
3. Prefer adding accurate types instead of `any`.
4. Avoid changing unrelated files.

## 22. Performance Considerations

Implemented or partly implemented:

- Next.js route-based code splitting through the App Router.
- React Query caching for selected features.
- Memoization in larger components where used.
- Next Image is used in many places.
- Axios GET requests add no-cache headers to avoid stale API data.
- Some list APIs accept query params such as search/status.

Possible improvements:

- Use React Query more consistently for server state.
- Add pagination/infinite loading for large user, roadmap, and notification lists.
- Split very large pages into smaller components.
- Avoid duplicated API calls between pages and headers.
- Add `next/dynamic` for heavy client-only modules.
- Review bundle size for PDF/chart libraries.
- Re-enable TypeScript and ESLint build checks before production releases.

## 23. Future Improvements

Important Improvements:

- Create a stricter role guard/permission system shared by all roles.
- Re-enable TypeScript and ESLint build enforcement.
- Standardize API response unwrapping and error handling.
- Move more server-state flows to React Query.
- Add automated tests for login, route guards, API services, and core workflows.
- Strengthen auth storage with backend-managed `HttpOnly` cookies if possible.
- Normalize route casing to avoid production path confusion.
- Break very large page files into smaller feature components.

Optional Improvements:

- Add `.env.example`.
- Add a clear Tailwind theme/config if custom design tokens are needed.
- Add Storybook or component documentation.
- Add shared loading, empty, and error components.
- Add better bundle analysis.
- Add more explicit TypeScript models for backend responses.
- Add README setup and troubleshooting updates.

## 24. Interview Questions and Answers

1. What framework does CCC-Web use?
   Answer: It uses Next.js with the App Router. Project example: route files live under `src/app`.

2. What is the main UI library?
   Answer: React. Project example: pages and reusable components are React components.

3. How is routing handled?
   Answer: Folders under `src/app` become routes. Project example: `src/app/pastor/home/page.tsx` becomes `/pastor/home`.

4. How are role-based pages organized?
   Answer: By top-level folders: `director`, `mentor`, and `pastor`.

5. How are protected routes implemented?
   Answer: Client auth gate components check session cookies and redirect to login.

6. Where are API calls defined?
   Answer: In service files under `src/app/Services`.

7. What is Axios used for?
   Answer: Sending REST API requests and attaching auth headers.

8. How are auth tokens stored?
   Answer: In browser cookies named `accessToken` and `refreshToken`.

9. What happens on API 401?
   Answer: The Axios interceptor attempts token refresh and redirects to login if needed.

10. Does the frontend access the database directly?
    Answer: No. It talks to backend REST APIs.

11. Is Redux used?
    Answer: No Redux was found. The app uses local state, hooks, cookies, storage, and React Query in selected places.

12. What is React Query used for?
    Answer: Query caching and mutations in features such as voice notes and mentoring sessions.

13. What is Tailwind CSS used for?
    Answer: Styling components with utility classes.

14. How does the app avoid CORS issues in the browser?
    Answer: Browser calls go to `/api-proxy`, which Next.js rewrites to the backend.

15. What does `next.config.ts` control?
    Answer: Rewrites, redirects, image settings, standalone output, and build behavior.

16. Why does `tsconfig.json` have `allowJs: true`?
    Answer: The codebase contains both TypeScript and JavaScript files.

17. Where are reusable UI pieces stored?
    Answer: `src/app/Components`.

18. Where are API/domain types stored?
    Answer: `src/app/Services/types` and `src/types`.

19. How should a developer add a new backend call?
    Answer: Add a function to the matching service file, type it, and export it from `api.ts` if shared.

20. What is one important security improvement?
    Answer: Use backend-set `HttpOnly` cookies for tokens, if supported by the backend.

## 25. Summary

CCC-Web is a Next.js web frontend for a role-based revitalization platform. It uses React components, App Router pages, role layouts, auth gates, and a service layer around REST APIs.

The main modules are authentication, dashboards, users/profiles, roadmaps, assessments, mentoring sessions, appointments, micro-grants, certificates, notifications, notes, documents, media, and voice notes.

The frontend does not contain database code. Persistent data is handled by backend APIs. Browser storage is used mainly for auth cookies and small UI/session caches.

Security is mostly handled through bearer tokens, refresh tokens, client route guards, and backend authorization. The frontend should still rely on backend enforcement for sensitive role permissions.

### Important Files to Review First

| File / Folder | Why It Is Important |
|---|---|
| `package.json` | Shows real dependencies and available commands. |
| `next.config.ts` | Explains API proxy, redirects, image settings, and build behavior. |
| `src/app/layout.tsx` | Root app wrapper, fonts, global CSS, providers. |
| `src/app/providers.tsx` | React Query setup. |
| `src/app/Services/config/axios-instance.ts` | Central API/auth/refresh behavior. |
| `src/app/Services/api.ts` | API export map. |
| `src/app/Services/*.service.ts` | Feature API functions. |
| `src/app/utils/cookies.ts` | Session cookie utilities. |
| `src/app/utils/common-login.ts` | Login role detection and session storage. |
| `src/app/Components/DirectorAuthGate.tsx` | Director route protection. |
| `src/app/Components/MentorAuthGate.tsx` | Mentor route protection. |
| `src/app/Components/PastorAuthGate.tsx` | Pastor route protection. |
| `src/app/director/layout.tsx` | Director portal layout. |
| `src/app/mentor/layout.tsx` | Mentor portal layout. |
| `src/app/pastor/layout.tsx` | Pastor portal layout. |
| `src/app/Components/` | Reusable UI building blocks. |
| `src/app/utils/` | Shared frontend logic. |
