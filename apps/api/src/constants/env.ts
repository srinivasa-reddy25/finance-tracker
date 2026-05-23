type TEnv = {
  API_PORT: number
  node_env: 'dev' | 'prod'
  firebase_config_path: string
}

export const env: TEnv = {
  API_PORT: Number(process.env.API_PORT ?? 8000),
  node_env: process.env.NODE_ENV === 'prod' ? 'prod' : 'dev',
  firebase_config_path: process.env.FIREBASE_CONFIG_PATH ?? 'NA'
}
