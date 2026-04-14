# Project Guidelines

## Build And Run
- Use `npm install` for dependencies.
- Use `npm run dev` for local development and `npm run dev:3000` when the port must be explicit.
- Use `npm run build` to validate a production build and `npm run start` to serve it.
- There are no repository test or lint scripts today. Do not claim test coverage unless you ran a concrete check yourself.
- `next.config.ts` ignores TypeScript and ESLint build failures, so do not treat a successful production build as proof that type or lint issues are absent.

## Architecture
- This is a Next.js 15 App Router application with React 19, TypeScript, Tailwind CSS 4, and a centralized Axios service layer.
- Primary route areas are role-based: `src/app/director`, `src/app/mentor`, `src/app/pastor`, plus `src/app/choose-role`.
- Shared UI lives under `src/app/Components`; prefer matching existing component patterns before introducing new folders or abstractions.
- API access is centralized under `src/app/Services`. Extend existing `*.service.ts` files and shared types before adding ad hoc fetch logic inside pages.
- Role layouts enforce access through auth gates such as `src/app/director/layout.tsx` and `src/app/Components/DirectorAuthGate.tsx`.

## Conventions
- Preserve existing route casing. Several mentor and pastor routes use PascalCase folder names such as `Appointments`, `Assessments`, and `RevitalizationRoadmap`; update links and rewrites carefully when adding or renaming routes.
- In browser code, API traffic should go through `/api-proxy`, which is rewritten in `next.config.ts`. Do not switch client-side calls to direct `wisdomtooth.tech` URLs.
- Use the shared Axios instance in `src/app/Services/config/axios-instance.ts` so cookie auth, `skipAuth`, and 401 redirect behavior stay consistent.
- Public endpoints that must not send a bearer token should use the existing `skipAuth` request option instead of bypassing the shared client.
- Keep auth and session behavior aligned with the existing cookie utilities in `src/app/utils` rather than adding localStorage-based auth flows.
- Follow the existing modal, dashboard, and card patterns in `src/app/Components` before introducing a new UI pattern.

## Reference Files
- `next.config.ts` for rewrites, redirects, image behavior, and build-time exceptions.
- `src/app/Services/config/axios-instance.ts` for API base URL resolution, auth headers, and unauthorized redirects.
- `src/app/Services/appointments.service.ts` for the service-layer pattern.
- `src/app/director/layout.tsx` for role layout structure.