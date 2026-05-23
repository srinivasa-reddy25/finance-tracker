import axios from 'axios';
import { ENV } from '../constants/env';
import { getIdToken } from './firebase';

export const api = axios.create({
  baseURL: ENV.API_URL,
  timeout: 10000,
});

api.interceptors.request.use(async config => {
  const token = await getIdToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
