import axios, { AxiosError } from 'axios';
import { ENV } from '../constants/env';
import { getIdToken } from './firebase';

export const api = axios.create({
  baseURL: ENV.API_URL,
  timeout: 10000,
});

// Attach Firebase auth token to every request
api.interceptors.request.use(async config => {
  try {
    const token = await getIdToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // Token fetch failed — request proceeds without auth header
    // The server will return 401 and the response interceptor will handle it
  }
  return config;
});

// Normalize API errors into consistent Error objects
api.interceptors.response.use(
  response => response,
  (error: AxiosError<{ message?: string }>) => {
    if (error.code === 'ECONNABORTED') {
      return Promise.reject(new Error('Request timed out. Please try again.'));
    }

    if (!error.response) {
      return Promise.reject(
        new Error('Network error. Check your connection and try again.'),
      );
    }

    const status = error.response.status;
    const serverMessage = error.response.data?.message;

    if (status === 401) {
      return Promise.reject(
        new Error(serverMessage ?? 'Session expired. Please sign in again.'),
      );
    }

    if (status === 403) {
      return Promise.reject(
        new Error(serverMessage ?? 'You do not have permission to do that.'),
      );
    }

    if (status === 404) {
      return Promise.reject(new Error(serverMessage ?? 'Resource not found.'));
    }

    if (status >= 500) {
      return Promise.reject(
        new Error(serverMessage ?? 'Server error. Please try again later.'),
      );
    }

    return Promise.reject(
      new Error(serverMessage ?? `Request failed (${status})`),
    );
  },
);
