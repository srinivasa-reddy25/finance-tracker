# The current page, section by section (round 1)

Source of truth: `scripts/landing/index.html` + `scripts/landing/app.js` + `scripts/landing/img/`. Published: https://claude.ai/artifact/T6A9zpKrFZbgUACgGFTy2D (private). Local preview: `python3 mkpreview.py` (wraps index.html in a doctype like the artifact skeleton), serve the folder, open `preview.html`. `scripts/check_page.js` is the Playwright driver used for screenshots and interaction checks.

All numbers are one sample person's September 2026 ("Amounts on this page are examples" in the footer). Budget ₹40,000 = sum of category budgets.

## Global

- Fixed nav: "Paisa." + "Get it on Google Play" (placeholder URL `https://play.google.com/store/apps/details?id=com.tejareddy.financetracker`, the real applicationId). Colour follows the section under it (`data-theme` green/paper/night); hides on scroll down.
- Lenis smooth scroll; toasts top-right (below nav) for alerts.

## 1. Hero (green): "Where did it all go?"

- Purpose: the month-end question, answered physically.
- Copy: lede "Paisa is a spending tracker for Android, built for rupees…"; caption "1–25 Sep · 58 spends · ₹36,788 gone. Grab a slip and throw it."
- Behaviour: 16 paper slips + 9 photo objects fall into a Matter.js pile (9 + 5 on phones); grab and throw. "Sort my month" flies them into 7 bars (heights ∝ spend, dashed line = budget, "₹1,240 over" tags); headline becomes "There. That's where." "Make a mess again" bursts them back out.
- Data (1–25 Sep): food 10,240/9,000; transport 4,380/5,000; fun 2,410/2,500; health 1,470/3,000; shop 7,990/6,500; bills 7,368/9,000; others 2,930/5,000 → ₹36,788.
- Borrowed: Cash App (one loud field), Gumroad/Family (objects), Jeton (Matter.js in fintech).

## 2. Chain (white): "It left ₹20 at a time."

- 10 dated lines + "48 more, just as small" (₹28,198). Sticky counter counts to ₹36,788 with a bar that turns red past 80%.
- End: "25 Sep. ₹3,212 left." / "You'll remember the biryani. You won't remember the other ₹36,399."

## 3. Try it (paper): "Log it while you still remember it."

- State on the 18th: ₹24,860 of ₹40,000 (62%) — same numbers as the app's login card.
- 8 picks (tap or drag onto the month) + a real form (amount, description, category). Meter = stacked category segments; 80% tick; past 100% the scale grows and a hatched red overflow appears.
- Status copy is the app's: "62% used" → "82% of budget used" (amber) → "Budget exceeded by ₹1,037" (red). Push toasts use the API's exact text at 80% and 100%, once each.
- Shared state with the widgets section.

## 4. Home screen (green-soft): "Log a spend from your home screen."

- Phone with the 4 widgets (redesigned, not the app's glass look): Overview 4×2, Budget ring 2×2, Glance 2×1, Quick Add 4×2.
- Tap Quick Add → sheet with that category picked, keypad, description chips, Save → Today/month/ring update + snackbar.

## 5. Midnight (paper→night): "At midnight, the repeats write themselves down."

- Flip clock 11:59 PM Wed 30 Sep → 12:00 AM Thu 1 Oct. Milk (daily, ₹60, milk-pouch photo) and House help (monthly on the 1st, ₹4,000) go from dashed "due" to logged with stamps; push "House help / ₹4,000 auto-debited · Next: 1 Nov" (the cron's exact format). Coming up: Badminton court (Sundays), Broadband (5th), Scooter insurance (yearly).
- Fine print: Paisa doesn't move money; 31st → 28 Feb.

## 6. The 1st (paper): "On the 1st, the month on one receipt."

- Thermal receipt prints as you scroll: ₹38,410, ↑6% vs August, 61 spends, left ₹1,590, top 3 (Food 11,020, Shopping 8,190, Bills 7,368), biggest "Flight home for Diwali ₹5,400"; stamp "Sent 1 Oct · 9:00 am".
- Push "Your September report is ready". Export card: CSV/PDF + 4 ranges; button explains what the app does (no fake send).

## 7. Six pings (paper): "Paisa has exactly six reasons to buzz you."

- Throwable cards: 80%, 100%, midnight repeat, 1st 9:00 am report, Monday 9:00 am weekly email, 5-day nudge email ("Hey Ananya, haven't seen you in 5 days 👀"). "Stack them again".

## 8. Answers (paper): "Before you install"

- SMS/bank login (no: only internet + notifications), iPhone (not yet), rupees only (₹1,00,000), custom categories, export, dark mode.

## 9. CTA (green): "Know where every rupee goes."

- Play button + QR (desktop). Wordmark cycles Paisa / पैसा / పైసా / பைசா / পয়সা / ಪೈಸೆ / પૈસા / ਪੈਸਾ / പൈസ / ପଇସା with the language name.

## Sample content on the page

Names (Ananya, Rahul, Amma), merchants and all amounts are samples. No real customers, logos, stats or reviews.
