# Paisa — launch film plan

## What it is
Paisa is a mobile expense tracker (iOS + Android) that shows Indian users where every rupee of their month went.

- **Who it's for:** anyone whose salary disappears by the 23rd and who has no idea where it went.
- **What sets it apart:** warm paper + ink design with one deep money green. Logging a spend is quick: tap +, type the amount, pick a category. Paisa then sends a push alert at 80% and 100% of the budget, auto-logs recurring bills and sends a monthly recap.
- **Most relatable claim:** its own tagline, *"Know where every rupee goes."*
- **Visual hook:** a salary number draining in real time while expense chips fly off it.
- **Share caption:** see `share-copy.txt`.

## Angle
Start with the pain everyone knows: payday on the 1st and ₹312 by the 23rd. Paisa then answers the question the hook asks. The hook asks *"Where did it all go?"* and the product scenes answer *"See where it went."*

## Tone
Cinematic and polished, like a premium product film. There is one hero object (the phone), with slow camera moves, eased motion and big confident type. Serif italics are kept for accent words. The film starts in the dark (the problem) and moves into warm paper light (clarity). It ends in the app's dark mode.

## Visual identity (all from `apps/mobile/src/theme`)
- Paper `#F4F2EC`, surface `#FFFFFF`, ink `#1A1714`, ink2 `#6B655C`, ink3 `#9C968C`
- Accent money green `#0E7B53` (light) and `#2ED68A` (dark)
- Category palette: food `#DA8400`, transport `#2F6BE2`, entertainment `#7C5CFF`, health `#E0484D`, shopping `#D6308C`, bills `#0E9F8E`
- Dark canvas `#0E0E0F`, dark surface `#1A1A1B`
- Type: Hanken Grotesk (the app's own font, ExtraBold for display), with Instrument Serif italic for accent words
- Icons: Material Community Icons, the same set the app uses
- Grade: warm highlights, green-leaning shadows, soft vignette and fine film grain

## Sound
The track is original, synthesized at 120 BPM. The hook is in D minor and resolves to F major on the brand reveal. Chords run Fmaj9, C/E, Dm9, B♭maj9, then resolve to F. Every effect is pitched into the key and sent to the same reverb as the music: the plucks for the draining money step down the scale, the taps and dings land on chord tones, and whooshes carry each transition.

## Storyboard — 24.0 s, 1920×1080, 60 fps (12 bars at 120 BPM)

| # | Time | Scene | On screen | Sound |
|---|------|-------|-----------|-------|
| 1 | 0.0–4.0 | **Hook** (dark) | A huge `₹40,000` with the label `DAY 1`. Expense chips (Biryani ₹480, Cab home ₹212, Rent ₹18,000…) burst toward the camera, faster and faster, while the number drains and the day ticks up. It lands on `₹312 · DAY 23`. Then **"Where did it all *go?*"**, and everything is pulled into a point of light. | D-minor drone, descending plucks (one per chip), a low thud on the landing, a riser, silence for one beat |
| 2 | 4.0–8.0 | **Reveal** (paper) | A flash into warm paper. **Paisa** rises letter by letter and the green dot drops in and bounces. Tagline: **"Know where every rupee goes."** Category coins float at different depths with depth of field. | Drop: impact plus the full groove, a bell "plink" on the dot |
| 3 | 8.0–12.0 | **Tap. Type. Tracked.** | Phone on the right, tilted. The + button is tapped, the add-expense sheet rises, `₹480` is typed, then "Biryani with the team" and the Food chip. "Add expense" drops the new card into Recent and the total counts up to **₹24,860**. The words **Tap. / Type. / Tracked.** land on the downbeats. | Four-on-the-floor, arp enters, soft pitched taps, a success chime |
| 4 | 12.0–16.0 | **See where it went** | A whip pan. The phone is now on the left, on Insights, with daily spending bars rising. The "Where it went" card lifts out of the screen in 3D and its category bars fill one by one. Headline: **"See where it *went.*"** | Ascending plucks under each bar |
| 5 | 16.0–19.6 | **A heads-up before it's gone** | A whip pan to the lock screen at 9:41. The app's real push notifications drop in: *Approaching budget limit* (80%), *Rent: ₹18,000 auto-debited*, *Your September report is ready*. | Three dings on Dm9 chord tones |
| 6 | 19.6–24.0 | **Flip + end card** (dark) | Unlock swipe to the dashboard. A diagonal light-sweep flips the whole world to dark mode. Three dark phones fan out, with **Paisa.** / *Know where every rupee goes.* / `iOS · Android` above them. | Final F-major impact, the pad rings out, a last bell |

Numbers on screen are illustrative UI values; ₹24,860 and the ₹40,000 budget come from the app's own login-screen demo card.
