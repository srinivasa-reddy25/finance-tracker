type TEnv = {
  db_url: string
}

export const env: TEnv = {
  db_url: process.env.DB_URL ?? 'NA'
}
