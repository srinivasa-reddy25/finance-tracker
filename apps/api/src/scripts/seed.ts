import { connect_db, disconnect_db, mg } from 'db'
import { log } from 'logging'

const APP = 'seed'

const SEED_USERS = [
  {
    email: 'admin@tejadev.com',
    name: 'Admin User',
    firebase_uid: 'seed_firebase_uid_admin',
    provider: 'password' as const,
    profile_image: null,
    is_active: true
  },
  {
    email: 'google@tejadev.com',
    name: 'Google User',
    firebase_uid: 'seed_firebase_uid_google',
    provider: 'google' as const,
    profile_image: 'https://lh3.googleusercontent.com/a/default',
    is_active: true
  }
]

const seed = async (): Promise<void> => {
  await connect_db()

  log.info({ app: APP, message: 'Starting seed...' })

  for (const user of SEED_USERS) {
    const result = await mg.User.findOneAndUpdate(
      { email: user.email, provider: user.provider },
      { $setOnInsert: user },
      { upsert: true, new: true }
    )
    log.info({
      app: APP,
      message: `Upserted user: ${result.email} (${result.provider})`
    })
  }

  log.info({
    app: APP,
    message: `Seed complete. ${SEED_USERS.length} users upserted.`
  })

  await disconnect_db()
}

seed().catch((error) => {
  log.error({ app: APP, message: 'Seed failed', meta: { error } })
  process.exit(1)
})
