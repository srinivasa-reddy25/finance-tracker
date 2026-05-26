type TEnv = {
  API_PORT: number
  node_env: 'dev' | 'prod'
  firebase_config_path: string
  resend_api_key: string
  email_from: string
}

export const env: TEnv = {
  API_PORT: Number(process.env.API_PORT ?? 8000),
  node_env: process.env.NODE_ENV === 'prod' ? 'prod' : 'dev',
  firebase_config_path: process.env.FIREBASE_CONFIG_PATH ?? 'NA',
  resend_api_key: process.env.RESEND_API_KEY ?? '',
  email_from:
    process.env.EMAIL_FROM ?? 'Finance Tracker <noreply@yourdomain.com>'
}
