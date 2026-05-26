import { Resend } from 'resend'

let _resend: Resend | null = null

function get_resend(api_key: string): Resend {
  if (!_resend) _resend = new Resend(api_key)
  return _resend
}

export async function send_email(
  api_key: string,
  from: string,
  to: string,
  subject: string,
  html: string
): Promise<void> {
  await get_resend(api_key).emails.send({ from, to, subject, html })
}
