import axios, { AxiosError, AxiosInstance, AxiosResponse } from 'axios'

import { env } from '@/constants/env'

let getAccessToken: (() => Promise<string | null>) | null = null

export const setAccessTokenGetter = (
  getter: () => Promise<string | null>
): void => {
  getAccessToken = getter
}

const api: AxiosInstance = axios.create({
  baseURL: env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true'
  },
  timeout: 15_000
})

api.interceptors.request.use(
  async (config) => {
    config.headers = config.headers || {}

    const token = getAccessToken ? await getAccessToken() : null

    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error: AxiosError) => {
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  (response: AxiosResponse) => response.data,
  (error: AxiosError<{ message?: string }>) => {
    const data = error?.response?.data ?? error
    const status = error?.response?.status
    return Promise.reject(status != null ? { ...data, status } : data)
  }
)

export { api }
export const apiClient = api
