# StayPilot — Short-Term Rental Management Dashboard

A portfolio-level SaaS frontend for managing apartments, holiday homes and boutique short-term rental portfolios. Built with React, TypeScript and Tailwind CSS, with realistic demo data and LocalStorage persistence — no backend required.

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?logo=tailwindcss&logoColor=white)

---

## Overview

StayPilot is a complete rental-management interface rather than a static dashboard. You can add and edit listings, create and reschedule bookings, inspect guest history, filter analytics by date range and property, switch themes, and export reports — all in the browser.

It was built to demonstrate:

- Advanced React patterns and typed domain models
- Professional business-interface design
- Complex, interactive data workflows (calendar drag-and-drop, filtering, CRUD, charts)
- Responsive layouts across desktop, tablet and mobile

**Stack:** React 18 · TypeScript · Vite · Tailwind CSS · React Router · Recharts · Lucide React · React Hook Form · Zod · date-fns

---

## Pages

| Page | Highlights |
| --- | --- |
| **Dashboard** | Revenue, bookings, occupancy and ADR KPIs with month-over-month deltas; revenue and occupancy charts; upcoming arrivals; booking-source breakdown; recent bookings; CSV export |
| **Properties** | Searchable property cards with live availability, ratings and amenities; detail view; add, edit and delete with validation and cascade warnings |
| **Reservations** | Search across guests, properties and booking IDs; status tabs with counts; property filter and sorting; pagination; detail modal with status actions and payment breakdown; create, edit and delete; CSV export |
| **Calendar** | Property timeline and month-grid views; month navigation; property filter; monthly occupancy/revenue summary; drag-and-drop rescheduling |
| **Guests** | Guest profiles with derived stay counts, nights, lifetime value and last stay; VIP/repeat filters; booking history; add guest; start a booking from a profile |
| **Analytics** | 30-day, 90-day, 6-month and 12-month ranges; property scoping; revenue + booking volume; occupancy trend; channel mix; per-property leaderboard |
| **Settings** | Validated profile form; light/dark/system theme; currency; week start; compact and reduced-motion preferences; notification toggles; JSON export and demo reset |

Every route is responsive and reachable from the collapsible sidebar on mobile.

---

## Standout Interactions

- **Drag-and-drop rescheduling** on both calendar views — drop a booking on a new day and the checkout shifts while preserving stay length.
- **Live filtering** across reservations, properties and guests, including counts, sorting and pagination.
- **Charts with date-range controls** and per-property filters.
- **Dark/light/system themes** persisted on the device.
- **Notifications dropdown** with unread indicators and mark-all-read.
- **Confirmation dialogs and toast messages** for destructive and successful actions.
- **Loading skeletons and empty states** across data views.
- **Command-K search shortcut** that jumps into reservations.
- **Currency-aware formatting** across KPIs, tables and charts.
- **CSV and JSON exports** for reservations and the full local dataset.

---

## Getting Started

### Prerequisites

- Node.js 18 or newer
- npm 9 or newer

### Run locally

```bash
npm install
npm run dev
```

Open the printed local URL (usually `http://localhost:5173`).

### Production build

```bash
npm run build
npm run preview
```

`npm run build` type-checks the project with `tsc --noEmit` before bundling with Vite.

### Available scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server with hot reload |
| `npm run build` | Type-check and build the production bundle into `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run typecheck` | Run TypeScript checks without emitting files |

---

## Project Structure

```text
src/
├── components/
│   ├── forms/               # Property, reservation and guest modals (RHF + Zod)
│   ├── layout/              # Sidebar, topbar and app shell
│   ├── ChartTooltip.tsx     # Shared Recharts tooltip
│   ├── Modal.tsx            # Modal + confirmation dialog primitives
│   ├── PropertyImage.tsx    # Image with graceful fallback
│   ├── ReservationDetailsModal.tsx
│   ├── StatCard.tsx
│   └── ui.tsx               # Buttons, cards, badges, fields, avatars, etc.
├── lib/
│   ├── analytics.ts         # Occupancy, revenue series and summaries
│   ├── csv.ts               # Reservation CSV export
│   ├── mock.ts              # Seeded portfolio, guests and bookings
│   ├── types.ts             # Domain types
│   └── utils.ts             # Dates, formatting and shared helpers
├── pages/                   # Dashboard, Properties, Reservations, Calendar,
│                            # Guests, Analytics, Settings
├── store/
│   ├── AppStore.tsx         # Data, persistence, theme, CRUD actions
│   └── ToastContext.tsx     # Toast notifications
├── App.tsx                  # Route definitions
├── index.css                # Tailwind layers and design tokens
└── main.tsx                 # App entry point
```

### Architecture notes

- `AppProvider` owns properties, reservations, guests, settings and derived helpers (currency formatting, lookups). It hydrates from LocalStorage and writes changes back automatically.
- Theme resolution supports `light`, `dark` and `system`, tracks the OS preference and applies the `dark` class before paint via an inline script in `index.html`.
- Analytics are computed from raw reservations, so changing a booking status or date immediately updates occupancy, revenue and charts.
- Forms share consistent primitives and use React Hook Form with Zod schemas for validation.
- Seed data is generated deterministically relative to the current date, keeping the dashboard populated whenever the project is opened.

---

## Demo Data & Persistence

- Data lives in LocalStorage under the key **`staypilot.data.v1`**.
- The seed contains 8 international properties, 16 guests and roughly nine months of reservations around today's date.
- **Settings → Data & storage** lets you export a JSON snapshot or restore the original sample portfolio.
- Clearing site data also returns the app to its seeded state.
- No accounts, API keys or external services are required.

> Because this is a local-first demo, there is no authentication or multi-user sync, currency changes reformat values without converting them, images are loaded from Unsplash (with gradient fallbacks), and notifications reset on reload.

---

## Deployment

Build the static bundle and deploy `dist/` to any static host.

**Netlify / Cloudflare Pages**

- Build command: `npm run build`
- Publish directory: `dist`
- Add an SPA fallback so deep links like `/analytics` resolve:

```text
# public/_redirects
/*  /index.html  200
```

**Vercel**

Add a rewrite in `vercel.json`:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

**GitHub Pages**

Copy `dist/index.html` to `dist/404.html` after building, or use a GitHub Actions workflow that does this step for SPA routing.

---

## Publishing to GitHub

```bash
git init
git add .
git commit -m "feat: StayPilot rental management dashboard"
git branch -M main
git remote add origin https://github.com/<your-username>/staypilot.git
git push -u origin main
```

---

## Roadmap

- Backend API and authentication for real multi-user data
- Channel/iCal sync for Airbnb, Booking.com and Vrbo
- Payment and payout tracking
- Automated tests for analytics, filters and rescheduling
- Image uploads for properties instead of URL entry

---

## Notes

- Built from scratch as a portfolio project — no UI kit or dashboard template.
- Typography: [Inter](https://fonts.google.com/specimen/Inter). Photography: [Unsplash](https://unsplash.com).
- Add a `LICENSE` file if you plan to open-source or redistribute the code.
