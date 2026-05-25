# Finance Tracker — Product Roadmap

Personal finance tracking app built with React Native (mobile) + Express API + MongoDB.
Goal: start simple, get smart, then get AI-powered.

---

## V1 — Core Tracker ✅ Done

The foundation. Everything a user needs to track daily expenses.

- Firebase authentication (email + Google)
- Add expense with category, amount, description
- Dashboard — spending hero, recent 3 transactions
- History — full list with search, filter by category, pagination
- Profile — account info, stats
- Pull to refresh, swipe to delete
- Floating tab bar, custom delete dialog

---

## V2 — Complete Finance Tracker ✅ Done (Recurring deferred)

Make it a proper finance app. Everything a good tracker should have.

**Budget Management** ✅
- Set an overall monthly spending limit
- Set limits per category (food, transport, entertainment, etc.)
- Visual indicator showing how close you are to each limit

**Charts & Graphs** ✅
- Analytics tab with 4 sections:
  - Monthly Snapshot — donut ring with budget vs spent
  - Daily Spending — area chart, last 10 days, tap-to-see-amount tooltip, timezone-aware
  - By Category — custom SVG donut with connector labels outside each slice, tap-to-reveal center tooltip
  - VS Last Month — card list with trending up/down badges
- Month picker with left arrow disabled at join month

**Dashboard Upgrades** ✅
- Total spent centered with budget suffix (phantom spacer)
- Animated number counter on load and pull-to-refresh
- Pull-to-refresh fetches transactions + categories in parallel

**History Revamp** ✅
- Google Pay-style grouped-by-date list (SectionList)
- Circle category icons, description + time, amount top-aligned
- Infinite scroll (replaces pagination buttons)
- "Today" / "Yesterday" / full date section headers

**Recurring Transactions** ⏸ Deferred to later
- Mark a transaction as recurring
- Remind or prompt user — not auto-add

---

## V3 — Stand Out Features 🔄 In Progress

The things that make this app feel premium and different.

**Home Screen Widget** ← Current focus
- Quick glance at today's spend / remaining budget
- Native widget (iOS + Android)

**Smart Spending Insights**
- Surface patterns: "You spend most on Fridays", "Food is up 40% vs last month"
- Show this on dashboard — build carefully, data needs to be meaningful not noisy

**Monthly Report**
- Auto-generated end-of-month summary
- Sent to user's email
- Also shown as a card in the app
- Top category, biggest single spend, comparison to previous month

---

## V4 — AI Layer

Add intelligence on top of the solid foundation.

**Voice Input**
- Tap mic, speak a transaction ("Spent 200 on lunch at Swiggy")
- Claude parses and fills the add-expense form

**Receipt / Image Scanning**
- Take a photo of a receipt
- Claude extracts amount, merchant, category automatically

**AI-Powered Insights**
- Deeper Claude-generated spending analysis
- Personalized suggestions based on spending patterns

---

## V5 — Scale & Future

To be planned once V4 is shipped.

- Multi-user support (families, shared tracking — model TBD)
- Production deployment & hosting
- Data export (CSV, PDF reports)
- Anything else that comes up

---

## Guiding Principles

- **Build clean before building smart** — no AI features until the core UX is solid
- **No specifics locked in advance** — implementation details decided while building each feature
- **Design first** — every feature needs to look and feel great, not just work
- **One version at a time** — finish and polish before moving to next
