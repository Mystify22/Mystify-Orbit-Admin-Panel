import axios from 'axios';
import type { AxiosInstance } from 'axios';

/**
 * Axios HTTP Client Instance
 * Configured with default timeouts and interceptors for multipart upload requests.
 */
export const createApiClient = (baseURL: string, authToken?: string): AxiosInstance => {
  const instance = axios.create({
    baseURL: baseURL || '',
    timeout: 120000, // 2 minutes for larger audio/image files
  });

  instance.interceptors.request.use(
    (config) => {
      if (authToken) {
        config.headers.Authorization = authToken.startsWith('Bearer ')
          ? authToken
          : `Bearer ${authToken}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        'Upload failed. Please check backend connection.';
      return Promise.reject(new Error(message));
    }
  );

  return instance;
};
