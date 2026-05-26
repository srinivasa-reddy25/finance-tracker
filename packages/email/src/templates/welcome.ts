export function welcome_template(name: string): {
  subject: string
  html: string
} {
  const firstName = name.split(' ')[0] || name

  return {
    subject: 'Welcome to Finance Tracker 🎉',
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
            <div style="font-size:32px;margin-bottom:8px;">💰</div>
            <h1 style="margin:0;color:#FFFFFF;font-size:24px;font-weight:700;letter-spacing:-0.3px;">Finance Tracker</h1>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <h2 style="margin:0 0 12px;color:#111827;font-size:20px;font-weight:700;">Hey ${firstName}, welcome! 👋</h2>
            <p style="margin:0 0 24px;color:#6B7280;font-size:15px;line-height:1.6;">
              You're all set to start tracking your finances. Here's what you can do right now:
            </p>

            <table width="100%" cellpadding="0" cellspacing="0">
              ${feature_row('📊', 'Track daily expenses', 'Add transactions in seconds — by category, with descriptions.')}
              ${feature_row('🎯', 'Set budgets', "Set monthly limits per category and see how you're tracking.")}
              ${feature_row('📈', 'Analyse patterns', 'Charts, daily spending trends, and month-over-month comparisons.')}
              ${feature_row('📱', 'Home screen widgets', 'Add a widget for quick glances without opening the app.')}
            </table>

            <div style="margin-top:32px;text-align:center;">
              <a href="#" style="display:inline-block;background:#2563EB;color:#FFFFFF;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:600;font-size:15px;">Open the App</a>
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:24px 40px;border-top:1px solid #F3F4F6;text-align:center;">
            <p style="margin:0;color:#9CA3AF;font-size:13px;">You're receiving this because you just signed up for Finance Tracker.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
  }
}

function feature_row(icon: string, title: string, desc: string): string {
  return `
  <tr>
    <td style="padding:10px 0;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td width="40" style="vertical-align:top;padding-top:2px;">
            <span style="font-size:20px;">${icon}</span>
          </td>
          <td style="vertical-align:top;">
            <div style="color:#111827;font-weight:600;font-size:14px;margin-bottom:2px;">${title}</div>
            <div style="color:#6B7280;font-size:13px;line-height:1.5;">${desc}</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>`
}
