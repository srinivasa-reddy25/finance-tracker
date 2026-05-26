type Row = {
  date: Date
  description: string
  category: string
  amount: number
  note: string
  source: string
}

function escape(v: string | number): string {
  const s = String(v)
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

export function build_csv(rows: Row[]): Buffer {
  const header = [
    'Date',
    'Description',
    'Category',
    'Amount (INR)',
    'Note',
    'Source'
  ]
  const lines = [header.join(',')]

  for (const r of rows) {
    const date = new Date(r.date).toISOString().split('T')[0]
    lines.push(
      [
        date,
        escape(r.description),
        escape(r.category),
        r.amount,
        escape(r.note ?? ''),
        escape(r.source)
      ].join(',')
    )
  }

  return Buffer.from(lines.join('\n'), 'utf-8')
}
