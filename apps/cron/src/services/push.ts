import { log } from 'logging'

import { get_messaging } from './firebase.ts'

export async function send_push(
  token: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<void> {
  const messaging = get_messaging()
  if (!messaging) return

  await messaging.send({ token, notification: { title, body }, data })
  log.info({ app: 'cron', message: `Push sent: "${title}"` })
}
