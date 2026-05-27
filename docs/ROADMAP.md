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

## V2 — Complete Finance Tracker ✅ Done

Make it a proper finance app. Everything a good tracker should have.

**Budget Management** ✅

- Set an overall monthly spending limit
- Set limits per category (food, transport, entertainment, etc.)
- Visual indicator showing how close you are to each limit
- Budget alert emails at 80% and 100% threshold (fire-and-forget, once per month per threshold)

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

**Recurring Transactions** ✅

- Full CRUD — create, edit, delete, toggle active/inactive
- 4 frequencies: daily, weekly, monthly, yearly
- `apps/cron` job fires at midnight, creates transactions automatically with `source: recurring`
- Fire-and-forget email to user after each auto-transaction
- Edge cases handled: short months (Feb 30 → Feb 28), same-day creation fires tonight

---

## V3 — Stand Out Features ✅ Done

The things that make this app feel premium and different.

**Home Screen Widget** ✅ Done (Android)

- 4 widget types: Glance (2×1), Overview (4×2), Budget Ring (2×2), Quick Add (4×2)
- All transparent/glass design — wallpaper shows through
- Real-time data sync from app via SharedPreferences bridge
- Quick Add: tap Food / Transport / Shopping / Bills → opens app with category pre-filled
- iOS widget: deferred to later

**Monthly Report** ✅ Done

- Cron job sends email on 1st of every month with previous month summary
- In-app recap card on dashboard, visible 1st–3rd of month, dismissable
- Shows: total spent, tx count, % change vs previous month, top 3 categories, biggest single spend

**CSV / PDF Export** ✅ Done

- Export transactions from Profile screen
- Format: CSV or PDF, range: this month / last month / last 3 months / all time
- Emailed directly to user's registered email
- PDF: professional layout with Roboto font, ₹ symbol, summary cards, transaction table

**Recurring Run History** ✅ Done

- Every cron run logged to a separate collection, linked to the recurring transaction
- Stores status (success / failed), fired_at, transaction_id, error message
- Viewable in-app via history icon on each recurring card

---

## V3.5 — Core Polish ✅ Done

The things that should have always been there. Stability before AI.

**Edit Transaction** ✅

- Tap any transaction row (dashboard or history) → pre-filled modal
- Budget alert re-checked after edit — crossing 80%/100% on an edit fires the email
- Same modal as add, no duplicate UI

**Budget Color Feedback** ✅

- Hero amount on dashboard changes color: primary → amber at 80% → red at 100%
- Budget badge next to name shows exact overage ("Budget exceeded by ₹24") or percentage
- Badge only visible at 80%+, no noise below that

**Push Notifications (FCM)** ✅

- Production Firebase Cloud Messaging — free, no limits
- In-app permission sheet on first login (pre-prompt before system dialog)
- Amber banner on dashboard if notifications are disabled, taps to Settings
- Budget alerts at 80% and 100% — push fires alongside email (same month-key guard)
- Recurring transaction fired at midnight — push to device
- Monthly report ready — push notification
- Token refresh handled automatically, token cleared on logout

---

## V4 — AI Layer

Add intelligence on top of the solid foundation.

**Smart Spending Insights**

- Surface patterns: "You spend most on Fridays", "Food is up 40% vs last month"
- Show on dashboard — data must be meaningful, not noisy
- Plan TBD

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
  - Activity logs required here — track who added/edited/deleted what, so shared users have full visibility into changes
- Production deployment & hosting
- Anything else that comes up

---

## Guiding Principles

- **Build clean before building smart** — no AI features until the core UX is solid
- **No specifics locked in advance** — implementation details decided while building each feature
- **Design first** — every feature needs to look and feel great, not just work
- **One version at a time** — finish and polish before moving to next
