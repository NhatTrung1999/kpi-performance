# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Repo layout: `frontend/` (this app — React 19 + TypeScript + Vite 8 + Tailwind v4) and `docs/design-system.md` (token tables and design rules, in Vietnamese). There is no backend in the repo; the app talks to an API at `VITE_API_URL` (default `/api`). Code comments are Vietnamese. **UI text is English only, served through i18n** (see below) — never hard-code user-visible text in components. There is no test runner configured.

## Commands (run from `frontend/`)

- `npm run dev` — Vite dev server
- `npm run build` — `tsc -b && vite build` (type-check is part of the build)
- `npm run lint` — ESLint
- `npm run build:lib` — builds the design-system library to `dist-lib/` (JS, CSS, and `.d.ts` via `scripts/build-lib-types.mjs`). Required before every `/design-sync` run.
- Mock login without a backend: set `VITE_MOCK_AUTH=true` in `.env.local` (dev only; password `dev12345`, accounts `admin.dev` / `chuquan.dev` / `nhanvien.dev`, see `src/lib/mock-auth.ts`). It only fakes `/auth/login` and `/auth/me`.

## Architecture

- **i18n (react-i18next).** The UI is English-only for now but built to add Vietnamese/Chinese later. All user-visible text (menu, titles, buttons, filter labels, table headers, errors, toasts, empty states, form validation, login) lives in `src/i18n/locales/en/*.json` (namespaces `common`, `nav`, `auth`, `errors`, `roles`, `dashboard`), initialised in `src/i18n/index.ts` and imported in `main.tsx`. Keys are type-checked (`src/i18n/i18next.d.ts`). In components use `useTranslation(ns)`; outside React (toasts, API errors, route meta) use `i18n.t('ns:key')`; zod schemas are factories taking `t` (`createLoginSchema`). Plurals use `_one`/`_other` keys with `{{count}}`. Do not add bilingual labels (no Chinese/Vietnamese captions next to English text); system data (unit names, employee names) is shown as received, except Chinese name lines which are hidden. To add a language: copy `locales/en` to `locales/<code>`, register it in `i18n/index.ts` and add its Intl locale in `lib/format.ts`.
- **Date/number formatting** always goes through `src/lib/format.ts` (`formatDate` → `15 Jan 2015`, `formatNumber`, `formatPercent`, `formatMonthShort`); store dates as ISO `YYYY-MM-DD`. Never build date/number strings by hand.
- **`components/ui/` stays i18n-agnostic** (it ships in the design-system library): any text is a prop with a neutral English default (`Badge` children, `Toaster` `label`/`closeLabel`, `StatCard` `trend.labels`, `PageBanner` `loadingLabel`); pages pass translated strings.

- **Path alias** `@/` → `src/`.
- **Routing is metadata-driven.** `src/routes/config.ts` (`ROUTE_META`) is the single source for page title, top-bar toolbar, allowed roles (`AD` Admin / `CQ` Manager / `NV` Employee) and sidebar entry. `title` is a key in the `nav` namespace, not display text. A new page needs a `ROUTE_META` line plus a `nav` translation key plus a route in `src/routes/index.tsx`; role-restricted pages go under `RequireRole`, authenticated ones under `ProtectedRoute`.
- **Auth/session**: `src/lib/axios.ts` owns the token (localStorage when "remember", else sessionStorage), request/response interceptors (Bearer header, 401 → clear token + redirect to `/login`, normalised `ApiError`) and the `http` helpers. `src/lib/session.ts` derives the current user and role from the server user object, falling back to JWT claims, then to lowest role (NV, `roleKnown=false`). Client-side role checks are navigation/display only; the server must enforce permissions.
- **Design system** lives in `src/components/ui/` and `src/index.css` (tokens in `:root`, `.dark`, `@theme inline`). Use semantic token classes (`bg-brand-gradient`, `text-success-text`, …), never raw hex; dark mode is the `dark` class on `<html>` and token classes flip automatically, so don't add `dark:` variants. Full rules and token tables: `docs/design-system.md`. `GlassCard`/mesh backgrounds are login-screen only; inner pages use flat `Card`.
- **Library entry** `src/design-system.ts` re-exports only shared UI (no router/auth/API). `src/design-system.css` imports `index.css` and lists every token/layout utility in `@source inline(...)` because Tailwind only emits classes found in source. **When adding a token or a utility that library consumers (Claude Design) should use, add it to that list**, or it ships unstyled. A new shared component must also be exported from `design-system.ts`.
- `vite.lib.config.ts` externalises `use-sync-external-store` (pulled in by Base UI Popover); bundling it inline breaks previews with a "Dynamic require" error.

## Claude Design sync (`/design-sync`)

Config and notes live in `.design-sync/` (`config.json`, `NOTES.md`, `conventions.md`, authored `previews/*.tsx` — all committed). Read `.design-sync/NOTES.md` before syncing; it records gotchas and re-sync risks. `.ds-sync/`, `ds-bundle/`, `dist-lib/` and `.design-sync/.cache/` are gitignored build output. If you rename a token/class or a component, re-validate `.design-sync/conventions.md` against `ds-bundle/_ds_bundle.css`.
