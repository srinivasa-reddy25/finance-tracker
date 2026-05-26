export type LowActivityData = {
  name: string
  days_since_last: number
  last_transaction_date: string
  last_amount: number
  last_category: string
}

export function low_activity_template(data: LowActivityData): {
  subject: string
  html: string
} {
  const firstName = data.name.split(' ')[0] || data.name

  return {
    subject: `Hey ${firstName}, haven't seen you in ${data.days_since_last} days 👀`,
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
          <td style="background:#2563EB;padding:36px 40px;text-align:center;">
            <div style="font-size:40px;margin-bottom:8px;">👋</div>
            <h1 style="margin:0;color:#FFFFFF;font-size:22px;font-weight:800;">Still tracking?</h1>
            <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">We miss you, ${firstName}</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <p style="margin:0 0 20px;color:#374151;font-size:15px;line-height:1.7;">
              Your last transaction was logged <strong style="color:#111827;">${data.days_since_last} days ago</strong> on ${data.last_transaction_date}.
              Gaps in tracking make it harder to see the full picture of your spending.
            </p>

            <!-- Last transaction card -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#F9FAFB;border-radius:12px;margin-bottom:24px;">
              <tr>
                <td style="padding:16px 20px;">
                  <div style="color:#9CA3AF;font-size:12px;margin-bottom:4px;">Last logged</div>
                  <div style="color:#111827;font-size:15px;font-weight:600;">${data.last_category}</div>
                  <div style="color:#6B7280;font-size:13px;margin-top:2px;">${data.last_transaction_date}</div>
                </td>
                <td style="padding:16px 20px;text-align:right;">
                  <div style="color:#EF4444;font-size:18px;font-weight:700;">${fmt(data.last_amount)}</div>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 28px;color:#6B7280;font-size:14px;line-height:1.6;">
              Logging even 30 seconds a day keeps your reports accurate and your budget on track.
            </p>

            <div style="text-align:center;">
              <a href="#" style="display:inline-block;background:#2563EB;color:#FFFFFF;text-decoration:none;padding:14px 36px;border-radius:10px;font-weight:600;font-size:15px;">Add a Transaction</a>
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:24px 40px;border-top:1px solid #F3F4F6;text-align:center;">
            <p style="margin:0;color:#9CA3AF;font-size:13px;">Finance Tracker · Keeping you on track 💙</p>
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
