// Date and time validation utilities

/**
 * Get minimum datetime for inputs (current time)
 * Format: YYYY-MM-DDTHH:MM (for datetime-local input)
 */
export const getMinDateTime = (): string => {
  const now = new Date();
  // Round up to next 15 minutes
  const minutes = now.getMinutes();
  const roundedMinutes = Math.ceil(minutes / 15) * 15;
  now.setMinutes(roundedMinutes);
  now.setSeconds(0);
  now.setMilliseconds(0);

  return formatDateTimeLocal(now);
};

/**
 * Format Date object to datetime-local input format
 */
export const formatDateTimeLocal = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

/**
 * Parse datetime-local input value to Date object
 */
export const parseDateTimeLocal = (value: string): Date => {
  return new Date(value);
};

/**
 * Calculate duration in minutes between two datetime strings
 */
export const calculateDuration = (startTime: string, endTime: string): number => {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const diffMs = end.getTime() - start.getTime();
  return Math.floor(diffMs / (1000 * 60)); // Convert to minutes
};

/**
 * Validate that end time is after start time
 */
export const validateTimeRange = (startTime: string, endTime: string): boolean => {
  const start = new Date(startTime);
  const end = new Date(endTime);
  return end > start;
};

/**
 * Validate that start time is in the future
 */
export const validateFutureTime = (dateTime: string): boolean => {
  const selected = new Date(dateTime);
  const now = new Date();
  return selected > now;
};

/**
 * Validate that the duration between start and end is at least the required duration
 */
export const validateDuration = (
  startTime: string,
  endTime: string,
  requiredDuration: number
): boolean => {
  const actualDuration = calculateDuration(startTime, endTime);
  return actualDuration >= requiredDuration;
};

/**
 * Calculate end time based on start time and duration
 */
export const calculateEndTime = (startTime: string, durationMinutes: number): string => {
  const start = new Date(startTime);
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
  return formatDateTimeLocal(end);
};

/**
 * Validate booking times with all rules
 */
export interface TimeValidationResult {
  isValid: boolean;
  errors: string[];
}

export const validateBookingTimes = (
  startTime: string,
  endTime: string,
  duration?: number
): TimeValidationResult => {
  const errors: string[] = [];

  // Check if start time is in the future
  if (!validateFutureTime(startTime)) {
    errors.push('Start time must be in the future');
  }

  // Check if end time is after start time
  if (!validateTimeRange(startTime, endTime)) {
    errors.push('End time must be after start time');
  }

  // Check if duration is valid
  if (duration) {
    if (!validateDuration(startTime, endTime, duration)) {
      const actualDuration = calculateDuration(startTime, endTime);
      errors.push(
        `Duration between start and end (${actualDuration} min) must be at least ${duration} minutes`
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate search window times
 */
export const validateSearchWindow = (
  windowStart: string,
  windowEnd: string,
  duration: number
): TimeValidationResult => {
  const errors: string[] = [];

  // Check if window start is in the future
  if (!validateFutureTime(windowStart)) {
    errors.push('Window start must be in the future');
  }

  // Check if window end is after window start
  if (!validateTimeRange(windowStart, windowEnd)) {
    errors.push('Window end must be after window start');
  }

  // Check if window is large enough for the duration
  const windowDuration = calculateDuration(windowStart, windowEnd);
  if (windowDuration < duration) {
    errors.push(
      `Search window (${windowDuration} min) must be at least as long as the required duration (${duration} min)`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
