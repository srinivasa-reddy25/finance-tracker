import axios from 'axios'

import { env } from '../constants/env'
import { getIdToken } from './firebase'

export const api = axios.create({
  baseURL: `${env.api_url}/api/v1`,
  timeout: 10000
})

api.interceptors.request.use(async (config) => {
  const token = await getIdToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
