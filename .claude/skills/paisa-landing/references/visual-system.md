# Visual system

## Palette (brand colours only, from `apps/mobile/src/theme/index.ts`)

| Token            | Hex                                                                                                       | Role on the page                                                               |
| ---------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| paper            | #F4F2EC                                                                                                   | Default ground (daytime sections)                                              |
| white            | #FFFFFF                                                                                                   | Cards, the chain section ground, receipts                                      |
| ink              | #1A1714                                                                                                   | Text, outlines, hard shadows                                                   |
| ink2             | #6B655C                                                                                                   | Small hints only (5.15:1 on paper)                                             |
| green            | #0E7B53                                                                                                   | Hero field, final CTA field, "within budget" state. Paper text on it is 4.72:1 |
| green-soft       | #E4F1EA                                                                                                   | Home-screen section ground                                                     |
| mint             | #2ED68A                                                                                                   | Only on dark: "logged" stamps, widget ring, wordmark dot on green              |
| warn / warn-soft | #B07514 / #F7EFDC                                                                                         | 80% budget state                                                               |
| red / red-soft   | #C5392C / #FAEAE7                                                                                         | Past 100%, "₹3,212 left"                                                       |
| night / night2   | #0E0E0F / #1A1A1B                                                                                         | Midnight section only                                                          |
| Category colours | food #DA8400, transport #2F6BE2, fun #7C5CFF, health #E0484D, shop #D6308C, bills #0E9F8E, others #7A746B | Only on things that belong to a category (slips, bars, chips, widget buttons)  |

Text on category colour: ink on food and bills; white on the rest, and only at bold 18px+ (fun 4.35, health 4.04 are large-text only).

Rule: colour always means something. Green = Paisa / OK. Category colour = that category. Amber/red = budget state. Night = midnight.

## Type

| Role             | Font                                                                                         | Settings                                                                           |
| ---------------- | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Display          | Anek Latin (Ek Type, Indian foundry; Google Fonts)                                           | 800, font-stretch 116–122%, letter-spacing -0.035em, line-height .84–.9            |
| Body             | Anek Latin                                                                                   | 450, stretch 100%, 18px / 1.5 (17px mobile)                                        |
| Numbers          | Anek Latin                                                                                   | 800, stretch 112%, tabular-nums                                                    |
| Mono             | IBM Plex Mono                                                                                | timestamps, receipt, widget sizes. Has ₹ (JetBrains, Martian, Red Hat Mono do not) |
| Wordmark scripts | Anek Devanagari / Telugu / Tamil / Bangla / Kannada / Gujarati / Gurmukhi / Malayalam / Odia | 800, subset with Google Fonts `text=`                                              |

Scale: h1 clamp(58px, 10.6vw, 176px); h2 clamp(42px, 6.6vw, 112px); midnight h2 clamp(36px, 4.3vw, 68px); lede clamp(18px, 1.55vw, 22px).

## Logo

"Paisa." with the dot in green on paper, mint on green (as typeset in the app's login screen). Big CTA wordmark cycles through 10 scripts.

## Layout

Full-bleed colour fields per section, content in `.wrap` (gutter clamp(16px, 4.4vw, 72px), max 1680px). Objects you can grab get 2px ink outlines and hard offset shadows (3–6px, no blur). Panels 22px radius, buttons 14px radius (not pills). Nothing centred by default; big type sits left.

## Motion intensity

Playful (founder: "loud, playful, physical"). Lenis smooth scroll + GSAP ScrollTrigger + Matter.js.

- Hero: Matter.js pile with pointer-spring grab/throw; "Sort my month" flies every object into 7 category bars (spring scale on bars).
- Chain: counter tweens to the running total as lines cross 72% of the viewport.
- Try it: picks fly (power2.in) into the meter; segments spring (cubic-bezier(.34,1.56,.64,1)); notifications drop with a spring.
- Midnight: pinned 150% scrub (desktop ≥1100×700), paper→night, flip clock 11:59→12:00, stamps back.out(3). Toggle-played on smaller screens.
- Receipt: scrubbed print from the slot; stamp thunks in at 90%.
- Pings: kit-style throwable cards (inertia .91, bounce -0.5).
- Reduced motion: no Lenis/physics/pins; static pile, instant chart, final night state.

## Imagery

Photoreal cut-out objects generated with Gemini (`gemini-3-pro-image`, 2K, 1:1, plain #E6E4DE background) and cut out with rembg `birefnet-general`. Prompt formula and per-image notes: `assets/objects/manifest.json`. On the page they get a 2px white die-cut outline and a hard shadow via CSS drop-shadow filters, plus a category-coloured price tag. Set: chai ₹20, auto ₹140, biryani ₹389, LPG cylinder ₹903, medicine strip ₹320, popcorn ₹560, Kolhapuri chappals ₹1,299, LED bulb ₹1,850, marigold ₹101, milk pouch (midnight). Unused: brass key (`assets/objects/key.webp`).
