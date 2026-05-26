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

const BRAND = '#2563EB'
const EXPENSE = '#DC2626'
const INCOME = '#059669'
const MUTED = '#6B7280'
const BORDER = '#E5E7EB'

export function build_pdf(args: BuildArgs): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 40 })
      const buffers: Buffer[] = []
      doc.on('data', (b) => buffers.push(b))
      doc.on('end', () => resolve(Buffer.concat(buffers)))
      doc.on('error', reject)

      // Header
      doc.rect(0, 0, doc.page.width, 80).fill(BRAND)
      doc
        .fillColor('#FFFFFF')
        .fontSize(20)
        .text('Finance Tracker', 40, 28, { align: 'left' })
      doc.fontSize(11).fillColor('#FFFFFF').text(args.range_label, 40, 54)

      // User
      doc.moveDown(3)
      doc
        .fillColor('#111827')
        .fontSize(13)
        .text(`Hello, ${args.user_name}`, 40, 110)
      doc
        .fillColor(MUTED)
        .fontSize(10)
        .text(
          `Report generated ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`,
          40,
          130
        )

      // Summary cards
      const card_y = 160
      const card_w = (doc.page.width - 80 - 16) / 2
      doc
        .roundedRect(40, card_y, card_w, 70, 8)
        .fillAndStroke('#F9FAFB', BORDER)
      doc
        .fillColor(EXPENSE)
        .fontSize(18)
        .text(fmt(args.total_spent), 56, card_y + 14)
      doc
        .fillColor(MUTED)
        .fontSize(10)
        .text('Total Spent', 56, card_y + 44)

      doc
        .roundedRect(40 + card_w + 16, card_y, card_w, 70, 8)
        .fillAndStroke('#F9FAFB', BORDER)
      doc
        .fillColor(INCOME)
        .fontSize(18)
        .text(fmt(args.total_income), 56 + card_w + 16, card_y + 14)
      doc
        .fillColor(MUTED)
        .fontSize(10)
        .text('Total Income', 56 + card_w + 16, card_y + 44)

      // Table
      let y = card_y + 90
      doc.fillColor('#111827').fontSize(13).text('Transactions', 40, y)
      y += 22

      const colX = { date: 40, desc: 110, cat: 290, amt: doc.page.width - 90 }
      doc.fillColor(MUTED).fontSize(9)
      doc.text('DATE', colX.date, y)
      doc.text('DESCRIPTION', colX.desc, y)
      doc.text('CATEGORY', colX.cat, y)
      doc.text('AMOUNT', colX.amt, y, { width: 50, align: 'right' })
      y += 14
      doc
        .moveTo(40, y)
        .lineTo(doc.page.width - 40, y)
        .strokeColor(BORDER)
        .stroke()
      y += 8

      for (const r of args.rows) {
        if (y > doc.page.height - 60) {
          doc.addPage()
          y = 50
        }

        const date = new Date(r.date).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short'
        })
        doc
          .fillColor('#374151')
          .fontSize(10)
          .text(date, colX.date, y, { width: 65 })
        doc
          .fillColor('#111827')
          .fontSize(10)
          .text(trunc(r.description, 32), colX.desc, y, { width: 175 })
        doc
          .fillColor(MUTED)
          .fontSize(9)
          .text(trunc(r.category_name, 18), colX.cat, y, { width: 100 })

        const amt = (r.is_income ? '+' : '−') + fmt(r.amount)
        doc
          .fillColor(r.is_income ? INCOME : EXPENSE)
          .fontSize(10)
          .text(amt, colX.amt - 30, y, {
            width: 80,
            align: 'right'
          })
        y += 18
      }

      // Footer
      doc
        .fillColor(MUTED)
        .fontSize(9)
        .text(
          `Finance Tracker · ${args.rows.length} transactions · Generated ${new Date().toISOString().split('T')[0]}`,
          40,
          doc.page.height - 30,
          { align: 'center', width: doc.page.width - 80 }
        )

      doc.end()
    } catch (err) {
      reject(err)
    }
  })
}

function fmt(n: number): string {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}k`
  return `₹${Math.round(n)}`
}

function trunc(s: string, max: number): string {
  if (s.length <= max) return s
  return s.slice(0, max - 1) + '…'
}
