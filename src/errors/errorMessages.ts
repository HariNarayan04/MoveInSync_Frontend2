import { ERROR_CODES } from './errorCodes';

export const ERROR_MESSAGES: Record<string, string> = {
  // Auth errors
  [ERROR_CODES.AUTH_INVALID_CREDENTIALS]: 'Invalid email or password. Please try again.',
  [ERROR_CODES.AUTH_USER_EXISTS]: 'An account with this email already exists.',
  [ERROR_CODES.AUTH_UNAUTHORIZED]: 'You need to log in to access this resource.',
  [ERROR_CODES.AUTH_SESSION_EXPIRED]: 'Your session has expired. Please log in again.',
  [ERROR_CODES.AUTH_INVALID_TOKEN]: 'Invalid authentication token. Please log in again.',

  // Booking errors
  [ERROR_CODES.BOOKING_NOT_FOUND]: 'Booking not found.',
  [ERROR_CODES.BOOKING_CONFLICT]: 'This time slot conflicts with an existing booking.',
  [ERROR_CODES.BOOKING_INVALID_TIME]: 'Invalid booking time. End time must be after start time.',
  [ERROR_CODES.BOOKING_PAST_TIME]: 'Cannot book in the past.',
  [ERROR_CODES.BOOKING_CAPACITY_EXCEEDED]: 'The number of participants exceeds room capacity.',
  [ERROR_CODES.BOOKING_UNAUTHORIZED]: 'You are not authorized to modify this booking.',

  // Room errors
  [ERROR_CODES.ROOM_NOT_FOUND]: 'Room not found.',
  [ERROR_CODES.ROOM_UNAVAILABLE]: 'This room is not available for the selected time.',

  // Availability errors
  [ERROR_CODES.AVAILABILITY_NO_ROOMS]: 'No rooms available matching your criteria.',
  [ERROR_CODES.AVAILABILITY_INVALID_PARAMS]: 'Invalid search parameters. Please check your input.',

  // Network errors
  [ERROR_CODES.NETWORK_ERROR]: 'Network error. Please check your connection.',
  [ERROR_CODES.SERVER_ERROR]: 'Server error. Please try again later.',
  [ERROR_CODES.TIMEOUT_ERROR]: 'Request timeout. Please try again.',

  // Validation errors
  [ERROR_CODES.VALIDATION_ERROR]: 'Please check your input and try again.',
  [ERROR_CODES.REQUIRED_FIELD]: 'This field is required.',

  // Unknown
  [ERROR_CODES.UNKNOWN_ERROR]: 'An unexpected error occurred. Please try again.',
};

export const getErrorMessage = (code: string, fallback?: string): string => {
  return ERROR_MESSAGES[code] || fallback || ERROR_MESSAGES[ERROR_CODES.UNKNOWN_ERROR];
};
