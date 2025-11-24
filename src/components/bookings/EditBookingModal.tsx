import React, { useState, useEffect } from 'react';
import { AxiosError } from 'axios';
import { useUIStore } from '@/store/uiStore';
import { bookingService } from '@/api/BookingService';
import { ModalFactory } from '@/factory/ModalFactory';
import { ButtonFactory } from '@/factory/ButtonFactory';
import { toast } from '@/factory/ToastFactory';
import { formatErrorForDisplay } from '@/errors/errorHandler';
import { getMinDateTime, validateTimeRange, validateFutureTime } from '@/utils/dateValidation';
import type { Booking } from '@/types';

export const EditBookingModal: React.FC = () => {
  const { modal, closeModal } = useUIStore();
  const booking = modal.data?.booking as Booking | undefined;
  const onSuccess = modal.data?.onSuccess as (() => void) | undefined;

  const [isLoading, setIsLoading] = useState(false);
  const [minDateTime, setMinDateTime] = useState('');
  const [purpose, setPurpose] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [capacity, setCapacity] = useState(1);
  const [startTimeError, setStartTimeError] = useState<string | null>(null);
  const [endTimeError, setEndTimeError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMinDateTime(getMinDateTime());
  }, []);

  useEffect(() => {
    if (booking) {
      setPurpose(booking.title || booking.description || '');
      setCapacity(booking.capacity || 1);
      // Format dates for datetime-local input (YYYY-MM-DDTHH:mm)
      // datetime-local expects local time, so we format the date in local timezone
      if (booking.startTime) {
        const startDate = new Date(booking.startTime);
        // Format as YYYY-MM-DDTHH:mm in local time
        const year = startDate.getFullYear();
        const month = String(startDate.getMonth() + 1).padStart(2, '0');
        const day = String(startDate.getDate()).padStart(2, '0');
        const hours = String(startDate.getHours()).padStart(2, '0');
        const minutes = String(startDate.getMinutes()).padStart(2, '0');
        setStartTime(`${year}-${month}-${day}T${hours}:${minutes}`);
      } else {
        setStartTime('');
      }
      if (booking.endTime) {
        const endDate = new Date(booking.endTime);
        // Format as YYYY-MM-DDTHH:mm in local time
        const year = endDate.getFullYear();
        const month = String(endDate.getMonth() + 1).padStart(2, '0');
        const day = String(endDate.getDate()).padStart(2, '0');
        const hours = String(endDate.getHours()).padStart(2, '0');
        const minutes = String(endDate.getMinutes()).padStart(2, '0');
        setEndTime(`${year}-${month}-${day}T${hours}:${minutes}`);
      } else {
        setEndTime('');
      }
      // Clear validation errors when booking changes
      setStartTimeError(null);
      setEndTimeError(null);
    }
  }, [booking]);

  const handlePurposeChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setPurpose(e.target.value);
  };

  const handleStartTimeChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    setStartTime(value);
    
    // Real-time validation
    if (value) {
      if (!validateFutureTime(value)) {
        setStartTimeError('Start time must be in the future');
      } else {
        setStartTimeError(null);
      }
      
      // If end time is set, re-validate it
      if (endTime) {
        if (!validateTimeRange(value, endTime)) {
          setEndTimeError('End time must be after start time');
        } else {
          setEndTimeError(null);
        }
      }
    } else {
      setStartTimeError(null);
    }
  };

  const handleEndTimeChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    setEndTime(value);
    
    // Real-time validation
    if (value && startTime) {
      if (!validateTimeRange(startTime, value)) {
        setEndTimeError('End time must be after start time');
      } else {
        setEndTimeError(null);
      }
    } else if (value && !startTime) {
      setEndTimeError('Please select start time first');
    } else {
      setEndTimeError(null);
    }
  };

  const handleCapacityChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    // Allow free typing - accept any numeric input
    if (value === '') {
      setCapacity(0); // Allow empty for typing
      return;
    }
    
    const numValue = Number(value);
    // Only update if it's a valid number (allows typing negative temporarily, validated on blur)
    if (!isNaN(numValue)) {
      setCapacity(numValue);
    }
  };

  const handleCapacityBlur = () => {
    // Validate on blur (when user finishes typing)
    const maxCapacity = booking?.room?.capacity || 100;
    
    if (capacity <= 0 || isNaN(capacity)) {
      toast.error('Capacity must be at least 1');
      setCapacity(booking?.capacity || 1);
      return;
    }
    
    if (capacity > maxCapacity) {
      toast.error(`Capacity cannot exceed room capacity (${maxCapacity})`);
      setCapacity(maxCapacity);
      return;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!booking) {
      toast.error('No booking selected');
      return;
    }

    if (!purpose.trim()) {
      toast.error('Booking purpose is required');
      return;
    }

    if (!startTime || !endTime) {
      toast.error('Start time and end time are required');
      return;
    }

    // Check for real-time validation errors
    if (startTimeError || endTimeError) {
      toast.error('Please fix the time validation errors before submitting');
      return;
    }

    // Validate start time is in the future
    if (!validateFutureTime(startTime)) {
      setStartTimeError('Start time must be in the future');
      toast.error('Start time must be in the future');
      return;
    }

    // Validate end time is after start time
    if (!validateTimeRange(startTime, endTime)) {
      setEndTimeError('End time must be after start time');
      toast.error('End time must be after start time');
      return;
    }

    // Validate capacity
    const maxCapacity = booking?.room?.capacity || 100;
    if (capacity > maxCapacity) {
      toast.error(`Capacity cannot exceed room capacity (${maxCapacity})`);
      return;
    }

    if (capacity < 1) {
      toast.error('Capacity must be at least 1');
      return;
    }

    setIsLoading(true);
    setError(null); // Clear any previous errors

    try {
      // Convert datetime-local format to ISO string for API
      const startTimeISO = new Date(startTime).toISOString();
      const endTimeISO = new Date(endTime).toISOString();

      await bookingService.updateBooking(booking.id, {
        startTime: startTimeISO,
        endTime: endTimeISO,
        capacity: capacity,
        purpose: purpose.trim(),
      });
      toast.success('Booking updated successfully!');
      setError(null);
      if (onSuccess) onSuccess();
      closeModal();
    } catch (err) {
      // Extract exact error message from backend response
      let errorMessage = 'An unknown error occurred';
      
      if (err instanceof AxiosError) {
        // Backend returns { message: "..." } in response.data
        const backendMessage = err.response?.data?.message;
        if (backendMessage) {
          errorMessage = backendMessage;
        } else if (err.message) {
          errorMessage = err.message;
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      } else {
        // Fallback to formatted error display
        errorMessage = formatErrorForDisplay(err);
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseError = () => {
    setError(null);
  };

  const isOpen = modal.isOpen && modal.type === 'edit-booking';

  return (
    <>
      {/* Edit Booking Modal */}
      <ModalFactory
        isOpen={isOpen}
        onClose={closeModal}
        title="Edit Booking"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Room Name - Auto-filled, non-changeable */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Room Name
            </label>
            <input
              type="text"
              value={booking?.room?.name || ''}
              disabled
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
            />
          </div>

          {/* Max Capacity - Auto-filled, non-changeable */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Max Capacity
            </label>
            <input
              type="number"
              value={booking?.room?.capacity || ''}
              disabled
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
            />
          </div>

          {/* Start Time - Editable */}
          <div>
            <label
              htmlFor="startTime"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Start Time *
            </label>
            <input
              id="startTime"
              name="startTime"
              type="datetime-local"
              required
              min={minDateTime}
              value={startTime}
              onChange={handleStartTimeChange}
              className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${
                startTimeError
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300'
              }`}
            />
            {startTimeError ? (
              <p className="text-xs text-red-600 mt-1">{startTimeError}</p>
            ) : (
              <p className="text-xs text-gray-500 mt-1">
                Must be in the future
              </p>
            )}
          </div>

          {/* End Time - Editable */}
          <div>
            <label
              htmlFor="endTime"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              End Time *
            </label>
            <input
              id="endTime"
              name="endTime"
              type="datetime-local"
              required
              min={startTime || minDateTime}
              value={endTime}
              onChange={handleEndTimeChange}
              className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${
                endTimeError
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300'
              }`}
            />
            {endTimeError ? (
              <p className="text-xs text-red-600 mt-1">{endTimeError}</p>
            ) : (
              <p className="text-xs text-gray-500 mt-1">
                Must be after start time
              </p>
            )}
          </div>

          {/* Capacity - Editable */}
          <div>
            <label
              htmlFor="capacity"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Capacity *
            </label>
            <input
              id="capacity"
              name="capacity"
              type="number"
              required
              min="1"
              max={booking?.room?.capacity || 100}
              value={capacity > 0 ? capacity : ''}
              onChange={handleCapacityChange}
              onBlur={handleCapacityBlur}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            />
            {booking?.room?.capacity && (
              <p className="text-xs text-gray-500 mt-1">
                Maximum: {booking.room.capacity}
              </p>
            )}
          </div>

          {/* Room Features - Auto-filled, non-changeable */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Room Features
            </label>
            <div className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 min-h-[2.5rem] flex items-center">
              {booking?.room?.features && booking.room.features.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {booking.room.features.map((feature, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 capitalize"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-gray-400">No features available</span>
              )}
            </div>
          </div>

          {/* Booking Purpose - User input, compulsory */}
          <div>
            <label
              htmlFor="purpose"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Booking Purpose *
            </label>
            <textarea
              id="purpose"
              name="purpose"
              rows={3}
              required
              value={purpose}
              onChange={handlePurposeChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
              placeholder="Enter the purpose of this booking..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <ButtonFactory
              type="button"
              variant="secondary"
              onClick={closeModal}
              fullWidth
            >
              Cancel
            </ButtonFactory>
            <ButtonFactory type="submit" loading={isLoading} fullWidth>
              Update Booking
            </ButtonFactory>
          </div>
        </form>
      </ModalFactory>

      {/* Error Modal */}
      <ModalFactory
        isOpen={!!error}
        onClose={handleCloseError}
        title="Booking Error"
        size="md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Failed to Update Booking
              </h3>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">
                {error}
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <ButtonFactory
              type="button"
              variant="primary"
              onClick={handleCloseError}
              fullWidth
            >
              Close
            </ButtonFactory>
          </div>
        </div>
      </ModalFactory>
    </>
  );
};
