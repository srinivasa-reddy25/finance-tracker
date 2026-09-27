# Paisa: business context, audience, facts

Every claim on the page must trace back to this file or the repo. Flag what's unverified.

## What it is

Paisa (repo: finance-tracker) is an Android expense tracker for people who spend in rupees. Brand line in the app: "Know where every rupee goes" (`apps/mobile/src/screens/LoginScreen.tsx`).

Core loop:

1. Sign in with Google.
2. Log a spend: amount (₹), description, optional note, category (`DashboardScreen.tsx` add modal).
3. Set an optional monthly budget per category (`CategoriesScreen.tsx`); the total budget is the sum.
4. See the month: total spent (count-up), "Where it went" top categories, recent spends; Insights tab for the rest.
5. Get told when it matters: 80% / 100% budget alerts, recurring bills logged at midnight, monthly recap on the 1st.

## Real features (source file for each)

- Google sign-in (mobile `services/firebase.ts`, `LoginScreen.tsx`).
- Add / edit / delete a spend: amount, description (max 100 chars), note (max 200), category; max ₹1,00,00,000 per spend (`constants/config.ts`).
- 7 default categories with fixed colours: Food & Dining, Transport, Entertainment, Health, Shopping, Bills & Utilities, Others (`apps/api/src/constants/default-categories.ts`). "Others" cannot be deleted.
- Custom categories: name (max 30), icon, colour, optional monthly budget (`CategoriesScreen.tsx`). Income categories exist (`is_income`).
- Budget colour feedback: hero amount goes primary → amber at 80% → red at 100%; badge reads "NN% of budget used" or "Budget exceeded by ₹24" (`components/BudgetWarning.tsx`, ROADMAP V3.5).
- Budget alerts, email + push, at 80% and 100% of the total monthly budget, once per month per threshold (`apps/api/src/services/budget-alert.ts`). Push copy, verbatim:
  - "Approaching budget limit" / "You've used 82% of your monthly budget. Spent ₹32,800."
  - "Budget limit reached!" / "You've spent ₹40,120 — 100% of your monthly budget."
- Dashboard: month picker (from join month), total spent with count-up, "Where it went" top 4 categories, recent 3, pull to refresh.
- Insights tab: monthly snapshot ring (spent / budget / left), daily spending chart, by-category donut (tap a slice), "vs Last Month" per category with up/down.
- History: grouped by day ("Today", "Yesterday", dates), search, filter by category, date range, infinite scroll, edit, swipe to delete.
- Recurring spends: daily / weekly / monthly / yearly; logged automatically at 12:00 am by the cron service with source "recurring"; email + push after each. Push: title = the item's name, body "₹649 auto-debited · Next: 7 Nov". Short months handled (a 31st bill logs on Feb 28). Run history per item: success / failed, time, linked entry (`apps/cron/src/jobs/recurring.ts`, `RecurringScreen.tsx`). NOTE: Paisa doesn't move money; it writes the entry.
- Android home-screen widgets (4): Glance 2×1 ("TODAY ₹"), Overview 4×2 ("TODAY'S SPEND"), Budget Ring 2×2, Quick Add 4×2 (Food / Transport / Shopping / Bills: tap opens the app with that category picked) (`android/.../FinanceWidget*.kt`, `res/layout/widget_*.xml`). iOS widget deferred.
- Monthly report: email on the 1st at 9:00 am + push "Your September report is ready" / "You spent ₹31,240 last month. Tap to see the full breakdown."; in-app recap card on the 1st–3rd: total spent, number of spends, % vs previous month, top 3 categories, biggest single spend (`apps/cron/src/jobs/monthly-report.ts`, `components/MonthlyReportCard.tsx`).
- Weekly summary email, Mondays 9:00 am: "Your week in a glance" with a daily breakdown, top category, vs last week (`packages/email/src/templates/weekly-summary.ts`).
- Low-activity nudge email after 5 days without logging, 10:00 am: "Hey <name>, haven't seen you in 5 days 👀" (`apps/cron/src/jobs/low-activity.ts`).
- Export: CSV or PDF; this month / last month / last 3 months / all time; sent to your email ("Send to email") (`ProfileScreen.tsx`, `apps/api/src/services/export/`).
- Dark appearance toggle (Profile).
- Permissions: only INTERNET and POST_NOTIFICATIONS (`AndroidManifest.xml`). No SMS reading, no bank login.

Not built yet (never shown as live): voice input ("Spent 200 on lunch" → form) and receipt scanning (`apps/api/src/controllers/ai/*` return stubs), smart insights, shared/family tracking, iOS widget.

Claims to confirm with the founder before launch:

- Play Store link (placeholder now). Is the app public?
- Price: nothing in the repo. Don't say "free" until confirmed.
- iPhone: not stated anywhere; the page says Android only.
- "No SMS, no bank login" is true of today's manifest; confirm it's a promise they want to make.

## Pricing

None in the repo. No billing code.

## Audience

1. Salaried people and students in Indian cities who pay by UPI all day. Many small payments (₹20 chai, ₹140 auto) that never feel like spending.

Their pain as a chain (sample, written for the page):

- Mon 9:12 am, ₹20 chai → Mon 6:40 pm, ₹140 auto because the metro was packed → Wed 11:48 pm, ₹389 biryani → Sat, a ₹649 subscription renews itself → the 25th: ₹3,212 left and no idea where the rest went.

What they want: to know where every rupee goes before the month ends, without a spreadsheet.

## Real material

- Brand tokens: `apps/mobile/src/theme/index.ts` (paper, ink, money green, 7 category colours, dark overrides).
- Wordmark as typeset in the app: "Paisa." with the dot in green (`LoginScreen.tsx`).
- No screenshots, recordings, photos or customer quotes exist in the repo. App icons in `android/app/src/main/res/mipmap-*`.

## Repo facts for implementation

- `apps/web`: Next.js 16, React 19, Tailwind 3 with HSL tokens in `src/app/globals.css`, shadcn/ui via `@tejadev/ui`. The root route redirects to /login; web app still carries TejaDev template pages (notes). Landing would replace `src/app/page.tsx`.
- Web rules (`docs/CODING_RULES.md`, `CLAUDE.md`): no hardcoded hex in app styling (use tokens), camelCase, `@/` imports, env via `src/constants/env.ts`.
- Package manager: Bun. Commit convention: conventional commits, lower-case.
- Metadata in `apps/web/src/app/layout.tsx` still says TejaDev; would need updating.
