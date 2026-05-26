export type ExportReadyData = {
  name: string
  format: 'csv' | 'pdf'
  range_label: string
  transaction_count: number
  total_amount: number
}

export function export_ready_template(data: ExportReadyData): {
  subject: string
  html: string
} {
  const firstName = data.name.split(' ')[0] || data.name
  const formatLabel = data.format.toUpperCase()

  return {
    subject: `📎 Your ${formatLabel} export — ${data.range_label}`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;padding:40px 0;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">

        <tr>
          <td style="background:#2563EB;padding:32px 36px;text-align:center;">
            <div style="font-size:36px;margin-bottom:6px;">📎</div>
            <h1 style="margin:0;color:#FFFFFF;font-size:22px;font-weight:800;">Your export is ready</h1>
            <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">${data.range_label}</p>
          </td>
        </tr>

        <tr>
          <td style="padding:32px 36px;">
            <p style="margin:0 0 20px;color:#374151;font-size:15px;line-height:1.6;">
              Hey <strong>${firstName}</strong>, your <strong>${formatLabel}</strong> export is attached to this email.
            </p>

            <table width="100%" cellpadding="0" cellspacing="0" style="background:#F9FAFB;border-radius:12px;margin-bottom:20px;">
              <tr>
                <td style="padding:18px 22px;text-align:center;border-right:1px solid #E5E7EB;">
                  <div style="color:#2563EB;font-size:22px;font-weight:800;">${data.transaction_count}</div>
                  <div style="color:#9CA3AF;font-size:12px;margin-top:4px;">Transactions</div>
                </td>
                <td style="padding:18px 22px;text-align:center;">
                  <div style="color:#111827;font-size:22px;font-weight:800;">${fmt(data.total_amount)}</div>
                  <div style="color:#9CA3AF;font-size:12px;margin-top:4px;">Total amount</div>
                </td>
              </tr>
            </table>

            <p style="margin:0;color:#9CA3AF;font-size:13px;line-height:1.6;">
              Open the attachment to view all transactions. Keep this email for your records.
            </p>
          </td>
        </tr>

        <tr>
          <td style="padding:20px 36px;border-top:1px solid #F3F4F6;text-align:center;">
            <p style="margin:0;color:#9CA3AF;font-size:12px;">Finance Tracker · Export</p>
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
