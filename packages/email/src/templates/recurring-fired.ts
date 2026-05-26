export type RecurringFiredData = {
  name: string
  transaction_name: string
  amount: number
  category: string
  next_run_label: string
}

export function recurring_fired_template(data: RecurringFiredData): {
  subject: string
  html: string
} {
  const firstName = data.name.split(' ')[0] || data.name

  return {
    subject: `✅ ${data.transaction_name} — ₹${fmt(data.amount)} logged automatically`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;padding:40px 0;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:#2563EB;padding:28px 36px;">
            <p style="margin:0;color:rgba(255,255,255,0.75);font-size:13px;">Recurring transaction</p>
            <h1 style="margin:6px 0 0;color:#FFFFFF;font-size:22px;font-weight:800;">Auto-logged ✓</h1>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px 36px;">
            <p style="margin:0 0 20px;color:#374151;font-size:15px;line-height:1.6;">
              Hey <strong>${firstName}</strong>, your recurring transaction was just logged automatically.
            </p>

            <table width="100%" cellpadding="0" cellspacing="0" style="background:#F9FAFB;border-radius:12px;margin-bottom:24px;">
              <tr>
                <td style="padding:20px 24px;">
                  <div style="color:#111827;font-size:17px;font-weight:700;">${data.transaction_name}</div>
                  <div style="color:#6B7280;font-size:13px;margin-top:4px;">${data.category}</div>
                </td>
                <td style="padding:20px 24px;text-align:right;">
                  <div style="color:#DC2626;font-size:22px;font-weight:800;">₹${fmt(data.amount)}</div>
                </td>
              </tr>
            </table>

            <p style="margin:0;color:#9CA3AF;font-size:13px;">
              Next run: <strong style="color:#374151;">${data.next_run_label}</strong>
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 36px;border-top:1px solid #F3F4F6;text-align:center;">
            <p style="margin:0;color:#9CA3AF;font-size:12px;">Finance Tracker · Recurring transaction notification</p>
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
  if (n >= 100000) return `${(n / 100000).toFixed(1)}L`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(Math.round(n))
}
