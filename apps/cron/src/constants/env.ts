type TEnv = {
  db_url: string
  resend_api_key: string
  email_from: string
  node_env: 'dev' | 'prod'
}

export const env: TEnv = {
  db_url: process.env.DB_URL ?? '',
  resend_api_key: process.env.RESEND_API_KEY ?? '',
  email_from:
    process.env.EMAIL_FROM ?? 'Finance Tracker <noreply@yourdomain.com>',
  node_env: process.env.NODE_ENV === 'prod' ? 'prod' : 'dev'
}
