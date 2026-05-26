import { Resend } from 'resend'

import { env } from '../constants/env.ts'

let _resend: Resend | null = null

function get_resend(): Resend {
  if (!_resend) _resend = new Resend(env.resend_api_key)
  return _resend
}

export async function send_email(
  to: string,
  subject: string,
  html: string
): Promise<void> {
  await get_resend().emails.send({
    from: env.email_from,
    to,
    subject,
    html
  })
}
