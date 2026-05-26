import { send_email as _send_email } from '@tejadev/email'

import { env } from './constants/env.ts'

export async function send_email(
  to: string,
  subject: string,
  html: string
): Promise<void> {
  await _send_email(env.resend_api_key, env.email_from, to, subject, html)
}
