const { chromium } = require('playwright')
const [, , url, w, h, out, script] = process.argv
;(async () => {
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
  })
  const ctx = await browser.newContext({
    viewport: { width: +w, height: +h },
    deviceScaleFactor: 1,
    reducedMotion: process.env.RM ? 'reduce' : 'no-preference',
    hasTouch: !!process.env.TOUCH,
    isMobile: !!process.env.TOUCH
  })
  const page = await ctx.newPage()
  const errs = []
  page.on('console', (m) => {
    if (
      (m.type() === 'error' || m.type() === 'warning') &&
      !/404/.test(m.text())
    )
      errs.push(m.type() + ': ' + m.text())
  })
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message))
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 })
  await page.waitForTimeout(3000)
  let n = 0
  const shot = async () => {
    await page.screenshot({ path: `${out}_${n++}.png` })
  }
  const wait = (ms) => page.waitForTimeout(ms)
  const scrollToSel = async (sel, off = 0) => {
    await page.evaluate(
      ([s, o]) => {
        const el = document.querySelector(s)
        window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY + o)
      },
      [sel, off]
    )
    await wait(1500)
  }
  const scrollBy = async (dy) => {
    await page.evaluate((d) => window.scrollBy(0, d), dy)
    await wait(1200)
  }
  await eval('(async () => {' + script + '})()')
  console.log(errs.slice(0, 15).join('\n') || 'no errors')
  await browser.close()
})()
