# JP Rent A Car Kandy — website (frontend)

React + Vite. Public website, customer dashboard and admin dashboard.
All data is currently stored in the visitor's browser (localStorage) so the
client can try every feature before the backend is built.

## Run locally (pnpm)
    corepack enable      # once per computer (comes with Node 18+), or: npm i -g pnpm
    pnpm install
    pnpm dev             # http://localhost:5173
    pnpm build           # production build in /dist

## Deploy to Vercel
1. Push this folder to a GitHub repo (or run `npx vercel` in this folder).
2. In Vercel: New Project → import the repo. Framework preset: **Vite**.
   Vercel sees `pnpm-lock.yaml` and uses pnpm automatically.
   Build command `pnpm build`, output directory `dist` (auto-detected).
3. `vercel.json` already rewrites every route to index.html, so links like
   /fleet/veh-prius and /admin work when opened directly.

## Demo logins
- Admin:    admin@jprentacar.lk / admin123
- Staff:    staff@jprentacar.lk / staff123
- Customer: user@demo.com / user123

Admin → Settings → "Reset demo data" restores the sample content.

## Features
Website: search by dates and location, fleet filters and sorting, compare up to 3 cars,
car pages with photo gallery and availability calendar, 4-step online booking (extras,
licence upload, promo codes, pay on pickup / bank / card), WhatsApp booking, routes &
transfers, services, about, contact, FAQ, legal pages, LKR/USD/EUR price display,
"Manage a booking" for guests.

Customer dashboard: bookings (cancel, change request, extension request, invoice, review),
pre-pickup checklist, saved cars, documents, notifications, profile and password.

Admin: dashboard, bookings (confirm, handover check-out, return check-in with automatic
extra-km / late / fuel / cleaning / damage charges, deposits, payments, refunds, driver
assignment, extensions, rental agreement, invoice), availability calendar, payments
ledger, reports, vehicles with photo galleries, categories, maintenance (can block
bookings), extras, locations & fees, seasonal prices, promo codes, customers & staff
(roles, document verification), drivers, messages, reviews, and every website section.

## Look & feel
- Fonts: **Outfit** (headings, buttons, labels) and **Plus Jakarta Sans** (body), as on the demo site.
- Logo: JP's shop photo (`src/assets/jp-logo.jpg`). Replace it in Admin → Settings → Logo, or swap that file.
- Home page: full-width slideshow of real Sri Lanka photos (cross-fade with a slow zoom), editable in
  Admin → Home page → Slideshow photos, plus the "Plan your island journey" box that sends a
  ready-made WhatsApp message (pickup, drop-off, dates, vehicle, passengers, driver) or searches free cars.
- Locations are free text everywhere: customers can type any place in Sri Lanka (hotel, address,
  town, station, airport) with suggestions from ~170 places (`src/data/places.js`). Places that match
  Admin → Locations & fees get that delivery fee; anything else is confirmed by the team.

## Photos
Sample vehicle photos are real photos of each model from Wikimedia Commons (free licences;
the credit is shown on each car page). Replace them with JP's own fleet photos in
Admin → Vehicles and clear the "Photo credit" field. Place photos (Kandy, Ella, Sigiriya, Nuwara Eliya,
Galle, Mirissa, the airport) are also real Wikimedia Commons photos; all are credited on /credits.

## Where things are
- `src/data/seed.js`      sample data (vehicles, prices, routes, FAQ, pages…)
- `src/lib/db.js`         data layer — the ONLY file that talks to storage.
                          Replace its functions with API calls for the backend.
- `src/lib/utils.js`      `quote()` = price calculation (copy this logic to the backend)
- `src/lib/auth.jsx`      login / register (mock — passwords are plain text in the demo)
- `src/pages/site`        public pages
- `src/pages/account`     customer dashboard
- `src/pages/admin`       admin dashboard (`ResourceManager.jsx` = generic add/edit/delete table)
- `src/styles`            all CSS (colours are variables at the top of base.css)

## Backend checklist (next phase)
Tables: users, vehicles (+ images), categories, bookings, extras, locations,
promos, drivers, maintenance, reviews, messages, notifications, tours,
services, why_us, steps, destinations, faqs, pages, settings, content.
Also needed: password hashing + reset emails, image storage (e.g. Cloudinary/S3),
booking confirmation emails, server-side price check and availability check,
optional card payments (e.g. PayHere / Stripe).
