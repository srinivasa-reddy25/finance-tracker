import path from 'path'

import { cert, initializeApp } from 'firebase-admin/app'
import { getMessaging, type Messaging } from 'firebase-admin/messaging'
import { log } from 'logging'

import { env } from '../constants/env.ts'

let messaging: Messaging | null = null

export async function init_firebase(): Promise<void> {
  if (!env.firebase_config_path || env.firebase_config_path === 'NA') {
    log.warn({
      app: 'cron',
      message: 'FIREBASE_CONFIG_PATH not set — push disabled'
    })
    return
  }

  const config_path = path.resolve(env.firebase_config_path)
  const { default: service_account } = await import(config_path)

  const firebase_app = initializeApp({ credential: cert(service_account) })
  messaging = getMessaging(firebase_app)
  log.info({ app: 'cron', message: 'Firebase messaging initialized' })
}

export function get_messaging(): Messaging | null {
  return messaging
}
