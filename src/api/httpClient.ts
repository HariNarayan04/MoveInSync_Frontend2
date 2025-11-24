import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { config } from '@/config';
import { handleApiError } from '@/errors/errorHandler';
import { ERROR_CODES } from '@/errors/errorCodes';

class HttpClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.apiBaseUrl,
      timeout: config.apiTimeout,
      withCredentials: true, // IMPORTANT: for httpOnly cookie authentication
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        // You can add any request modifications here
        // For example, add a loading state or request ID
        return config;
      },
      (error: AxiosError) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      (error: AxiosError) => {
        // Handle session expiration
        if (error.response?.status === 401) {
          // Clear auth state and redirect to login
          const event = new CustomEvent('auth:unauthorized');
          window.dispatchEvent(event);
        }

        // Transform error using our error handler
        const appError = handleApiError(error);
        return Promise.reject(appError);
      }
    );
  }

  public getClient(): AxiosInstance {
    return this.client;
  }
}

export const httpClient = new HttpClient().getClient();
