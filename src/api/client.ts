import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import CONFIG from '@/configs/config';

let currentAuthToken: string | null = null;

/**
 * Configure the global bearer token used for API requests.
 */
export const setAuthToken = (token: string | null) => {
  currentAuthToken = token;
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }
};

/**
 * Get the current bearer token.
 */
export const getAuthToken = (): string | null => {
  if (currentAuthToken) return currentAuthToken;
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token');
  }
  return null;
};

// Base URL normalization: remove trailing slash if needed
const baseURL = (CONFIG?.api_url || '/v1/wf').replace(/\/+$/, '');

export const apiClient: AxiosInstance = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAuthToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export interface ApiErrorMessage {
  message: string;
  statusCode?: number;
  details?: unknown;
}

export const extractApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const axiosErr = error as AxiosError<{ detail?: string | Array<{ msg?: string; loc?: string[] }> }>;
    const data = axiosErr.response?.data;
    if (data?.detail) {
      if (typeof data.detail === 'string') {
        return data.detail;
      }
      if (Array.isArray(data.detail)) {
        return data.detail.map((d) => d.msg || JSON.stringify(d)).join(', ');
      }
    }
    if (axiosErr.message) {
      return axiosErr.message;
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Wystąpił nieznany błąd podczas komunikacji z serwerem.';
};
