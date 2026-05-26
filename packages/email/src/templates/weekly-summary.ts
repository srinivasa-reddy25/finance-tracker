type DayStat = { day: string; amount: number }

export type WeeklySummaryData = {
  name: string
  week_label: string
  total_spent: number
  total_income: number
  top_category: { name: string; amount: number; color: string } | null
  daily_breakdown: DayStat[]
  prev_week_spent: number
  transaction_count: number
}

export function weekly_summary_template(data: WeeklySummaryData): {
  subject: string
  html: string
} {
  const firstName = data.name.split(' ')[0] || data.name
  const vsLastWeek =
    data.prev_week_spent > 0
      ? Math.round(
          ((data.total_spent - data.prev_week_spent) / data.prev_week_spent) *
            100
        )
      : null
  const vsColor =
    vsLastWeek === null ? '#6B7280' : vsLastWeek > 0 ? '#EF4444' : '#059669'
  const vsText =
    vsLastWeek === null
      ? 'First week tracked'
      : vsLastWeek > 0
        ? `↑ ${vsLastWeek}% more than last week`
        : `↓ ${Math.abs(vsLastWeek)}% less than last week`

  const maxDay = Math.max(...data.daily_breakdown.map((d) => d.amount), 1)

  return {
    subject: `Your week in a glance — ${data.week_label} 📋`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:#2563EB;padding:36px 40px;">
            <p style="margin:0 0 4px;color:rgba(255,255,255,0.7);font-size:13px;text-transform:uppercase;letter-spacing:1px;">${data.week_label}</p>
            <h1 style="margin:0;color:#FFFFFF;font-size:24px;font-weight:800;">Weekly Summary</h1>
            <p style="margin:8px 0 0;color:rgba(255,255,255,0.75);font-size:14px;">Hey ${firstName}, here's your spending recap for the week.</p>
          </td>
        </tr>

        <!-- Top stats -->
        <tr>
          <td style="padding:32px 40px 0;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#F9FAFB;border-radius:12px;overflow:hidden;">
              <tr>
                <td style="padding:20px;text-align:center;border-right:1px solid #E5E7EB;">
                  <div style="color:#2563EB;font-size:22px;font-weight:800;">${fmt(data.total_spent)}</div>
                  <div style="color:#9CA3AF;font-size:12px;margin-top:4px;">Total Spent</div>
                </td>
                <td style="padding:20px;text-align:center;border-right:1px solid #E5E7EB;">
                  <div style="color:#059669;font-size:22px;font-weight:800;">${fmt(data.total_income)}</div>
                  <div style="color:#9CA3AF;font-size:12px;margin-top:4px;">Income</div>
                </td>
                <td style="padding:20px;text-align:center;">
                  <div style="color:#374151;font-size:22px;font-weight:800;">${data.transaction_count}</div>
                  <div style="color:#9CA3AF;font-size:12px;margin-top:4px;">Transactions</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- vs last week -->
        <tr>
          <td style="padding:16px 40px 0;">
            <p style="margin:0;color:${vsColor};font-size:14px;font-weight:600;">${vsText}</p>
          </td>
        </tr>

        <!-- Daily bar chart -->
        ${
          data.daily_breakdown.length > 0
            ? `
        <tr>
          <td style="padding:24px 40px 0;">
            <p style="margin:0 0 14px;color:#111827;font-size:15px;font-weight:700;">Daily Breakdown</p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                ${data.daily_breakdown
                  .map(
                    (d) => `
                <td style="text-align:center;padding:0 4px;">
                  <div style="background:#EFF6FF;border-radius:4px;height:60px;display:flex;align-items:flex-end;overflow:hidden;margin-bottom:6px;">
                    <div style="background:#2563EB;width:100%;height:${Math.round((d.amount / maxDay) * 100)}%;border-radius:4px 4px 0 0;min-height:${d.amount > 0 ? '4' : '0'}px;"></div>
                  </div>
                  <div style="color:#6B7280;font-size:11px;">${d.day}</div>
                  <div style="color:#111827;font-size:12px;font-weight:600;margin-top:2px;">${d.amount > 0 ? fmt(d.amount) : '—'}</div>
                </td>`
                  )
                  .join('')}
              </tr>
            </table>
          </td>
        </tr>`
            : ''
        }

        <!-- Top category -->
        ${
          data.top_category
            ? `
        <tr>
          <td style="padding:24px 40px 0;">
            <p style="margin:0 0 10px;color:#111827;font-size:15px;font-weight:700;">Biggest Category</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#F9FAFB;border-radius:10px;">
              <tr>
                <td style="padding:14px 16px;">
                  <div style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${data.top_category.color};margin-right:8px;vertical-align:middle;"></div>
                  <span style="color:#111827;font-size:14px;font-weight:600;">${data.top_category.name}</span>
                </td>
                <td style="padding:14px 16px;text-align:right;">
                  <div style="color:#2563EB;font-size:16px;font-weight:700;">${fmt(data.top_category.amount)}</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>`
            : ''
        }

        <!-- Footer -->
        <tr>
          <td style="padding:32px 40px 24px;border-top:1px solid #F3F4F6;margin-top:32px;">
            <p style="margin:0 0 4px;color:#9CA3AF;font-size:13px;text-align:center;">Finance Tracker · ${data.week_label}</p>
            <p style="margin:0;color:#D1D5DB;font-size:12px;text-align:center;">Every rupee tracked is a step toward your goals 🎯</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
  }
}

function fmt(n: number): string {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}k`
  return `₹${Math.round(n)}`
}
