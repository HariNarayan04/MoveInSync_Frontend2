import { AxiosError } from 'axios';
import { getErrorMessage } from './errorMessages';
import { ERROR_CODES } from './errorCodes';
import type { ApiError } from '@/types';

export class AppError extends Error {
  code: string;
  details?: any;

  constructor(code: string, message?: string, details?: any) {
    super(message || getErrorMessage(code));
    this.code = code;
    this.details = details;
    this.name = 'AppError';
  }
}

export const handleApiError = (error: unknown): AppError => {
  // Handle Axios errors
  if (error instanceof AxiosError) {
    const apiError = error.response?.data as ApiError | undefined;

    if (apiError?.code) {
      return new AppError(
        apiError.code,
        apiError.message,
        apiError.details
      );
    }

    // Handle HTTP status codes
    if (error.response?.status === 401) {
      return new AppError(ERROR_CODES.AUTH_UNAUTHORIZED);
    }

    if (error.response?.status === 404) {
      return new AppError(ERROR_CODES.UNKNOWN_ERROR, 'Resource not found');
    }

    // if (error.response?.status >= 500) {
    //   return new AppError(ERROR_CODES.SERVER_ERROR);
    // }

    if (error.code === 'ECONNABORTED') {
      return new AppError(ERROR_CODES.TIMEOUT_ERROR);
    }

    if (!error.response) {
      return new AppError(ERROR_CODES.NETWORK_ERROR);
    }
  }

  // Handle AppError
  if (error instanceof AppError) {
    return error;
  }

  // Handle generic errors
  if (error instanceof Error) {
    return new AppError(ERROR_CODES.UNKNOWN_ERROR, error.message);
  }

  // Unknown error type
  return new AppError(ERROR_CODES.UNKNOWN_ERROR);
};

export const formatErrorForDisplay = (error: unknown): string => {
  const appError = handleApiError(error);
  return appError.message;
};
