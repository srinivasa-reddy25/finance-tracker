export function budget_alert_template(
  name: string,
  spent: number,
  budget: number,
  threshold: 80 | 100
): { subject: string; html: string } {
  const firstName = name.split(' ')[0] || name
  const pct = Math.round((spent / budget) * 100)
  const remaining = Math.max(budget - spent, 0)
  const isOver = threshold === 100
  const accentColor = isOver ? '#EF4444' : '#F59E0B'
  const emoji = isOver ? '🚨' : '⚠️'

  const subject = isOver
    ? `${emoji} You've exceeded your monthly budget`
    : `${emoji} You've used 80% of your monthly budget`

  return {
    subject,
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
          <td style="background:${accentColor};padding:32px 40px;text-align:center;">
            <div style="font-size:36px;margin-bottom:6px;">${emoji}</div>
            <h1 style="margin:0;color:#FFFFFF;font-size:20px;font-weight:700;">
              ${isOver ? 'Budget Exceeded' : 'Budget Warning'}
            </h1>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <p style="margin:0 0 24px;color:#374151;font-size:16px;line-height:1.6;">
              Hey <strong>${firstName}</strong>, ${
                isOver
                  ? "you've gone over your monthly budget."
                  : "you've used 80% of your monthly budget."
              }
            </p>

            <!-- Stats -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#F9FAFB;border-radius:12px;overflow:hidden;margin-bottom:24px;">
              <tr>
                ${stat_cell('Spent', fmt(spent), accentColor)}
                ${stat_cell('Budget', fmt(budget), '#6B7280')}
                ${stat_cell(isOver ? 'Over by' : 'Remaining', fmt(isOver ? spent - budget : remaining), isOver ? '#EF4444' : '#059669')}
              </tr>
            </table>

            <!-- Progress bar -->
            <div style="background:#E5E7EB;border-radius:6px;height:10px;overflow:hidden;margin-bottom:8px;">
              <div style="background:${accentColor};height:10px;width:${Math.min(pct, 100)}%;border-radius:6px;"></div>
            </div>
            <p style="margin:0 0 24px;color:#9CA3AF;font-size:13px;text-align:right;">${pct}% of budget used</p>

            <p style="margin:0;color:#6B7280;font-size:14px;line-height:1.6;">
              ${
                isOver
                  ? 'Consider reviewing your recent transactions to see where you can cut back next month.'
                  : 'You have <strong style="color:#111827;">' +
                    fmt(remaining) +
                    '</strong> left for this month. Spend wisely!'
              }
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:24px 40px;border-top:1px solid #F3F4F6;text-align:center;">
            <p style="margin:0;color:#9CA3AF;font-size:13px;">Finance Tracker · Budget alert for ${new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' })}</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
  }
}

function stat_cell(label: string, value: string, color: string): string {
  return `
  <td style="padding:20px;text-align:center;border-right:1px solid #E5E7EB;">
    <div style="color:${color};font-size:20px;font-weight:700;">${value}</div>
    <div style="color:#9CA3AF;font-size:12px;margin-top:4px;">${label}</div>
  </td>`
}

function fmt(n: number): string {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}k`
  return `₹${Math.round(n)}`
}
