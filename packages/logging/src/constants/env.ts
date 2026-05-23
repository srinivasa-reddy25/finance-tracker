type TEnv = {
  axiom_dataset: string
  axiom_token: string
  node_env: 'dev' | 'prod'
}

export const env: TEnv = {
  axiom_dataset: process.env.AXIOM_DATASET ?? '',
  axiom_token: process.env.AXIOM_TOKEN ?? '',
  node_env: process.env.NODE_ENV === 'prod' ? 'prod' : 'dev'
}
