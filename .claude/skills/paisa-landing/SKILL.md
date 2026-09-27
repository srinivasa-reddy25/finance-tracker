---
name: paisa-landing
description: Paisa's marketing landing page - its facts, audience, founder's taste, visual system and current page. Use with landing-craft for any Paisa (finance-tracker) landing page, hero, marketing section, copy, animation, palette or imagery work, the published preview page, or implementing it in apps/web.
---

# Paisa landing page

Paisa is an Android expense tracker for people in India. You log each spend in rupees (amount, what it was, a category), set a monthly budget per category, and Paisa shows where the month went, warns you at 80% and 100% of budget, logs recurring bills at midnight, and sends a recap on the 1st.

This skill is Paisa's instance of **landing-craft** (`~/.claude/skills/landing-craft`, or copy it into `.claude/skills/`). Read landing-craft's SKILL.md for the process and toolkit; this skill holds the project's facts and taste, and it wins on taste.

## Load first

| Task                                      | Read                             |
| ----------------------------------------- | -------------------------------- |
| Anything                                  | `references/taste.md`            |
| Copy, features, pricing, audience, claims | `references/business-context.md` |
| Changing a section                        | `references/page-anatomy.md`     |
| Colour, type, layout, logo                | `references/visual-system.md`    |
| Past rounds, research, open decisions     | `references/history.md`          |

## Non-negotiables for this project

1. India only: rupees (₹), Indian digit grouping (₹1,00,000), en-IN dates. No other currency.
2. No product-code changes in the repo until the founder says "go"; this folder is the exception (it is kept on the working branch so the next session starts here). No PRs unless asked.
3. Only claims backed by business-context.md. Voice input and receipt scanning are stubs: never shown as live.
4. Use only the brand colours (mobile `src/theme/index.ts`), but do not copy the app's components: the founder thinks the app UI is weak and wants the landing page's UI to be better.
5. Feel: loud, playful, physical.
6. Main button: "Get it on Google Play" (link is a placeholder until the founder sends it).

## Build

Target: a responsive single HTML page published as a claude.ai Artifact (preview first), ported to `apps/web` after "go".

- Published preview (round 1): https://claude.ai/artifact/T6A9zpKrFZbgUACgGFTy2D — republish with the Artifact tool's `url` from a new conversation.
- Source: `scripts/landing/` (index.html + app.js + img/). Copy the latest back here after each publish.
- Libraries from cdnjs/jsdelivr (pinned): GSAP 3.13.0 + ScrollTrigger, Lenis 1.3.26, Matter.js 0.20.0, qrcode-generator 1.4.4. Fonts from Google Fonts: Anek Latin (+ Anek script families for the wordmark), IBM Plex Mono.
- Checks: `scripts/check_page.js` (Playwright; `NODE_PATH=/opt/node22/lib/node_modules node check_page.js <url> <w> <h> <prefix> "<script>"`). Headless Chromium needs the agent-proxy CA in `~/.pki/nssdb` (certutil) to reach outside sites.
- Images: generated with Gemini in a separate session (env var `GEMINI_API_KEY` is only visible to sessions started after it was added). Prompts and notes: `assets/objects/manifest.json`.
