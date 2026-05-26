import path from 'path'
import { fileURLToPath } from 'url'

import PDFDocument from 'pdfkit'

type Row = {
  date: Date
  description: string
  category_name: string
  category_color: string
  amount: number
  is_income: boolean
}

type BuildArgs = {
  user_name: string
  range_label: string
  total_spent: number
  total_income: number
  rows: Row[]
}

// Colors
const BRAND = '#2563EB'
const BRAND_DARK = '#1E40AF'
const EXPENSE = '#DC2626'
const INCOME = '#059669'
const TEXT = '#0F172A'
const TEXT_MUTED = '#64748B'
const TEXT_LIGHT = '#94A3B8'
const BORDER = '#E2E8F0'
const ROW_ALT = '#F8FAFC'
const CARD_BG = '#F9FAFB'

// Font paths — resolved relative to this file
const FONT_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../assets/fonts'
)
const FONTS = {
  regular: path.join(FONT_DIR, 'Roboto-Regular.ttf'),
  semibold: path.join(FONT_DIR, 'Roboto-SemiBold.ttf'),
  bold: path.join(FONT_DIR, 'Roboto-Bold.ttf')
}

export function build_pdf(args: BuildArgs): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 0,
        info: {
          Title: `Finance Tracker — ${args.range_label}`,
          Author: 'Finance Tracker',
          Creator: 'Finance Tracker'
        }
      })

      // Register Unicode-capable fonts (Roboto supports ₹ and dashes)
      doc.registerFont('Body', FONTS.regular)
      doc.registerFont('Med', FONTS.semibold)
      doc.registerFont('Bold', FONTS.bold)

      const buffers: Buffer[] = []
      doc.on('data', (b) => buffers.push(b))
      doc.on('end', () => resolve(Buffer.concat(buffers)))
      doc.on('error', reject)

      const W = doc.page.width
      const H = doc.page.height
      const PAD = 48
      const net = args.total_income - args.total_spent

      // ─── Header band ──────────────────────────────────────────────
      doc.rect(0, 0, W, 140).fill(BRAND)

      // Subtle accent strip
      doc.rect(0, 140, W, 4).fill(BRAND_DARK)

      doc
        .font('Bold')
        .fontSize(26)
        .fillColor('#FFFFFF')
        .text('Finance Tracker', PAD, 38)

      doc
        .font('Body')
        .fontSize(11)
        .fillColor('#DBEAFE')
        .text(args.range_label.toUpperCase(), PAD, 72, {
          characterSpacing: 1.2
        })

      // Right-side meta
      doc
        .font('Body')
        .fontSize(10)
        .fillColor('#DBEAFE')
        .text('REPORT FOR', W - PAD - 200, 38, {
          width: 200,
          align: 'right',
          characterSpacing: 1
        })
      doc
        .font('Med')
        .fontSize(13)
        .fillColor('#FFFFFF')
        .text(args.user_name, W - PAD - 200, 54, { width: 200, align: 'right' })
      doc
        .font('Body')
        .fontSize(9)
        .fillColor('#BFDBFE')
        .text(
          `Generated ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`,
          W - PAD - 200,
          76,
          { width: 200, align: 'right' }
        )

      // ─── Summary cards ────────────────────────────────────────────
      const cards_y = 180
      const card_h = 90
      const gap = 14
      const card_w = (W - PAD * 2 - gap * 2) / 3

      draw_card(
        doc,
        PAD,
        cards_y,
        card_w,
        card_h,
        'TOTAL SPENT',
        format_inr(args.total_spent),
        EXPENSE
      )
      draw_card(
        doc,
        PAD + card_w + gap,
        cards_y,
        card_w,
        card_h,
        'TOTAL INCOME',
        format_inr(args.total_income),
        INCOME
      )
      draw_card(
        doc,
        PAD + (card_w + gap) * 2,
        cards_y,
        card_w,
        card_h,
        net >= 0 ? 'NET SAVINGS' : 'NET DEFICIT',
        format_inr(Math.abs(net)),
        net >= 0 ? INCOME : EXPENSE
      )

      // ─── Transactions header ──────────────────────────────────────
      let y = cards_y + card_h + 36

      doc.font('Bold').fontSize(15).fillColor(TEXT).text('Transactions', PAD, y)
      doc
        .font('Body')
        .fontSize(10)
        .fillColor(TEXT_MUTED)
        .text(
          `${args.rows.length} ${args.rows.length === 1 ? 'entry' : 'entries'}`,
          PAD,
          y + 22
        )

      y += 50

      // Column layout
      const COL = {
        date: PAD,
        desc: PAD + 75,
        cat: PAD + 290,
        amount: W - PAD
      }

      // Table header
      doc.rect(PAD, y - 4, W - PAD * 2, 26).fill(CARD_BG)
      doc.font('Med').fontSize(9).fillColor(TEXT_MUTED)
      const header_y = y + 4
      doc.text('DATE', COL.date + 8, header_y, { characterSpacing: 0.8 })
      doc.text('DESCRIPTION', COL.desc, header_y, { characterSpacing: 0.8 })
      doc.text('CATEGORY', COL.cat, header_y, { characterSpacing: 0.8 })
      doc.text('AMOUNT', COL.amount - 95, header_y, {
        width: 90,
        align: 'right',
        characterSpacing: 0.8
      })

      y += 30
      const row_h = 28

      // Rows
      let alt = false
      for (const r of args.rows) {
        if (y > H - 80) {
          // page break
          draw_footer(doc, args.rows.length)
          doc.addPage({ size: 'A4', margin: 0 })
          y = 60
          // re-draw column header on new page
          doc.rect(PAD, y - 4, W - PAD * 2, 26).fill(CARD_BG)
          doc.font('Med').fontSize(9).fillColor(TEXT_MUTED)
          doc.text('DATE', COL.date + 8, y + 4, { characterSpacing: 0.8 })
          doc.text('DESCRIPTION', COL.desc, y + 4, { characterSpacing: 0.8 })
          doc.text('CATEGORY', COL.cat, y + 4, { characterSpacing: 0.8 })
          doc.text('AMOUNT', COL.amount - 95, y + 4, {
            width: 90,
            align: 'right',
            characterSpacing: 0.8
          })
          y += 30
          alt = false
        }

        if (alt) {
          doc.rect(PAD, y - 4, W - PAD * 2, row_h).fill(ROW_ALT)
        }
        alt = !alt

        const date_str = new Date(r.date).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short'
        })
        doc
          .font('Body')
          .fontSize(10)
          .fillColor(TEXT_MUTED)
          .text(date_str, COL.date + 8, y + 4, { width: 65 })

        doc
          .font('Med')
          .fontSize(10)
          .fillColor(TEXT)
          .text(truncate(r.description, 38), COL.desc, y + 4, { width: 205 })

        // Category pill: small dot + name
        doc
          .circle(COL.cat + 5, y + 11, 3.5)
          .fill(r.category_color || TEXT_LIGHT)
        doc
          .font('Body')
          .fontSize(10)
          .fillColor(TEXT_MUTED)
          .text(truncate(r.category_name, 18), COL.cat + 16, y + 4, {
            width: 130
          })

        const sign = r.is_income ? '+' : '-'
        doc
          .font('Bold')
          .fontSize(11)
          .fillColor(r.is_income ? INCOME : EXPENSE)
          .text(`${sign} ${format_inr(r.amount)}`, COL.amount - 130, y + 4, {
            width: 125,
            align: 'right'
          })

        y += row_h

        // Separator line
        doc
          .moveTo(PAD, y - 4)
          .lineTo(W - PAD, y - 4)
          .lineWidth(0.5)
          .strokeColor(BORDER)
          .stroke()
      }

      // Totals row
      y += 8
      doc.rect(PAD, y, W - PAD * 2, 36).fill(BRAND)
      doc
        .font('Med')
        .fontSize(11)
        .fillColor('#FFFFFF')
        .text('Net total', PAD + 8, y + 12)
      doc
        .font('Bold')
        .fontSize(13)
        .fillColor('#FFFFFF')
        .text(
          `${net >= 0 ? '+' : '-'} ${format_inr(Math.abs(net))}`,
          COL.amount - 200,
          y + 11,
          { width: 195, align: 'right' }
        )

      draw_footer(doc, args.rows.length)

      doc.end()
    } catch (err) {
      reject(err)
    }
  })
}

// ─── Helpers ───────────────────────────────────────────────────────

function draw_card(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  value: string,
  accent: string
) {
  doc.roundedRect(x, y, w, h, 10).fillAndStroke(CARD_BG, BORDER)
  // Left accent bar
  doc.rect(x, y, 3, h).fill(accent)

  doc
    .font('Body')
    .fontSize(9)
    .fillColor(TEXT_MUTED)
    .text(label, x + 16, y + 18, { characterSpacing: 1 })
  doc
    .font('Bold')
    .fontSize(20)
    .fillColor(accent)
    .text(value, x + 16, y + 38, { width: w - 32 })
}

function draw_footer(doc: PDFKit.PDFDocument, count: number) {
  const W = doc.page.width
  const H = doc.page.height
  const y = H - 40
  doc
    .moveTo(48, y)
    .lineTo(W - 48, y)
    .lineWidth(0.5)
    .strokeColor(BORDER)
    .stroke()
  doc
    .font('Body')
    .fontSize(8)
    .fillColor(TEXT_LIGHT)
    .text('Finance Tracker', 48, y + 10)
  doc.text(
    `${count} transactions  ·  Generated ${new Date().toISOString().split('T')[0]}`,
    48,
    y + 10,
    { width: W - 96, align: 'right' }
  )
}

function format_inr(n: number): string {
  // Indian grouping: 1,23,45,678 — use Intl with en-IN
  return (
    '₹' +
    new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(
      Math.round(n)
    )
  )
}

function truncate(s: string, max: number): string {
  if (!s) return ''
  if (s.length <= max) return s
  return s.slice(0, max - 1) + '…'
}
