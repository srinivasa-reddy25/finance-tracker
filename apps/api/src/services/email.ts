import { Resend } from 'resend'

import { env } from '../constants/env.ts'

const resend = new Resend(env.resend_api_key)

export async function send_email(
  to: string,
  subject: string,
  html: string
): Promise<void> {
  await resend.emails.send({
    from: env.email_from,
    to,
    subject,
    html
  })
}
