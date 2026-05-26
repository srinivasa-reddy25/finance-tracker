type CategoryStat = { name: string; amount: number; color: string }

export type MonthlyReportData = {
  name: string
  month_label: string
  total_spent: number
  total_income: number
  net_savings: number
  budget: number
  top_categories: CategoryStat[]
  biggest_transaction: {
    description: string
    amount: number
    category: string
  } | null
  prev_spent: number
}

export function monthly_report_template(data: MonthlyReportData): {
  subject: string
  html: string
} {
  const firstName = data.name.split(' ')[0] || data.name
  const vsLastMonth =
    data.prev_spent > 0
      ? Math.round(
          ((data.total_spent - data.prev_spent) / data.prev_spent) * 100
        )
      : null
  const vsColor =
    vsLastMonth === null ? '#6B7280' : vsLastMonth > 0 ? '#EF4444' : '#059669'
  const vsText =
    vsLastMonth === null
      ? 'No data for last month'
      : vsLastMonth > 0
        ? `↑ ${vsLastMonth}% more than last month`
        : `↓ ${Math.abs(vsLastMonth)}% less than last month`

  const budgetPct =
    data.budget > 0 ? Math.round((data.total_spent / data.budget) * 100) : null
  const savingsColor = data.net_savings >= 0 ? '#059669' : '#EF4444'

  return {
    subject: `Your ${data.month_label} Finance Report 📊`,
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
          <td style="background:#4F46E5;padding:36px 40px;">
            <p style="margin:0 0 4px;color:rgba(255,255,255,0.7);font-size:13px;text-transform:uppercase;letter-spacing:1px;">${data.month_label}</p>
            <h1 style="margin:0;color:#FFFFFF;font-size:26px;font-weight:800;">Your Monthly Report</h1>
            <p style="margin:8px 0 0;color:rgba(255,255,255,0.75);font-size:14px;">Hey ${firstName}, here's how your finances looked this month.</p>
          </td>
        </tr>

        <!-- Top stats -->
        <tr>
          <td style="padding:32px 40px 0;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#F9FAFB;border-radius:12px;overflow:hidden;">
              <tr>
                ${top_stat('Total Spent', fmt(data.total_spent), '#4F46E5')}
                ${top_stat('Income', fmt(data.total_income), '#059669')}
                ${top_stat('Net Savings', fmt(Math.abs(data.net_savings)), savingsColor)}
              </tr>
            </table>
          </td>
        </tr>

        <!-- vs last month -->
        <tr>
          <td style="padding:16px 40px 0;">
            <p style="margin:0;color:${vsColor};font-size:14px;font-weight:600;">${vsText}</p>
          </td>
        </tr>

        ${
          budgetPct !== null
            ? `
        <!-- Budget usage -->
        <tr>
          <td style="padding:24px 40px 0;">
            <p style="margin:0 0 10px;color:#111827;font-size:15px;font-weight:700;">Budget Usage</p>
            <div style="background:#E5E7EB;border-radius:6px;height:10px;overflow:hidden;margin-bottom:6px;">
              <div style="background:${budgetPct > 100 ? '#EF4444' : '#4F46E5'};height:10px;width:${Math.min(budgetPct, 100)}%;border-radius:6px;"></div>
            </div>
            <p style="margin:0;color:#6B7280;font-size:13px;">${fmt(data.total_spent)} of ${fmt(data.budget)} · <strong style="color:${budgetPct > 100 ? '#EF4444' : '#4F46E5'};">${budgetPct}% used</strong></p>
          </td>
        </tr>`
            : ''
        }

        <!-- Top categories -->
        ${
          data.top_categories.length > 0
            ? `
        <tr>
          <td style="padding:24px 40px 0;">
            <p style="margin:0 0 14px;color:#111827;font-size:15px;font-weight:700;">Top Categories</p>
            <table width="100%" cellpadding="0" cellspacing="0">
              ${data.top_categories.map((c) => category_row(c, data.total_spent)).join('')}
            </table>
          </td>
        </tr>`
            : ''
        }

        <!-- Biggest transaction -->
        ${
          data.biggest_transaction
            ? `
        <tr>
          <td style="padding:24px 40px 0;">
            <p style="margin:0 0 10px;color:#111827;font-size:15px;font-weight:700;">Biggest Transaction</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#F9FAFB;border-radius:10px;">
              <tr>
                <td style="padding:14px 16px;">
                  <div style="color:#111827;font-size:14px;font-weight:600;">${data.biggest_transaction.description}</div>
                  <div style="color:#9CA3AF;font-size:12px;margin-top:2px;">${data.biggest_transaction.category}</div>
                </td>
                <td style="padding:14px 16px;text-align:right;">
                  <div style="color:#EF4444;font-size:16px;font-weight:700;">${fmt(data.biggest_transaction.amount)}</div>
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
            <p style="margin:0 0 4px;color:#9CA3AF;font-size:13px;text-align:center;">Finance Tracker · ${data.month_label} Report</p>
            <p style="margin:0;color:#D1D5DB;font-size:12px;text-align:center;">Keep tracking to build better money habits 💪</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
  }
}

function top_stat(label: string, value: string, color: string): string {
  return `
  <td style="padding:20px;text-align:center;border-right:1px solid #E5E7EB;">
    <div style="color:${color};font-size:20px;font-weight:800;">${value}</div>
    <div style="color:#9CA3AF;font-size:12px;margin-top:4px;">${label}</div>
  </td>`
}

function category_row(c: CategoryStat, total: number): string {
  const pct = total > 0 ? Math.round((c.amount / total) * 100) : 0
  return `
  <tr>
    <td style="padding:8px 0;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td width="130" style="color:#374151;font-size:14px;font-weight:500;">${c.name}</td>
          <td style="padding:0 12px;">
            <div style="background:#F3F4F6;border-radius:4px;height:6px;overflow:hidden;">
              <div style="background:${c.color};height:6px;width:${pct}%;border-radius:4px;"></div>
            </div>
          </td>
          <td width="60" style="text-align:right;color:#111827;font-size:14px;font-weight:600;">${fmt(c.amount)}</td>
        </tr>
      </table>
    </td>
  </tr>`
}

function fmt(n: number): string {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}k`
  return `₹${Math.round(n)}`
}
