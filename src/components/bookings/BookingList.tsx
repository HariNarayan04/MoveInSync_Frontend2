import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { bookingService } from '@/api/BookingService';
import { ButtonFactory } from '@/factory/ButtonFactory';
import { LoaderFactory } from '@/factory/LoaderFactory';
import { toast } from '@/factory/ToastFactory';
import { formatErrorForDisplay } from '@/errors/errorHandler';
import type { Booking } from '@/types';

export const BookingList: React.FC = () => {
  const userId = useAuthStore((state) => state.userId);
  const openModal = useUIStore((state) => state.openModal);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBookings = async () => {
    if (!userId) return;

    try {
      const data = await bookingService.getBookingsByUser(userId);
      setBookings(data);
    } catch (error) {
      toast.error(formatErrorForDisplay(error));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [userId]);

  const handleEdit = (booking: Booking) => {
    openModal('edit-booking', { booking, onSuccess: fetchBookings });
  };

  const handleCancel = async (bookingId: string) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    try {
      await bookingService.cancelBooking(bookingId);
      toast.success('Booking cancelled successfully');
      fetchBookings();
    } catch (error) {
      toast.error(formatErrorForDisplay(error));
    }
  };

  const formatDateTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy - h:mm a');
    } catch {
      return dateString;
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoaderFactory type="inline" size="lg" message="Loading bookings..." />
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="bg-white rounded-card-lg shadow-soft p-12 text-center">
        <svg
          className="mx-auto h-12 w-12 text-gray-400 mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No bookings yet
        </h3>
        <p className="text-gray-600">
          You haven't made any bookings. Start by searching for available rooms.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {bookings.map((booking) => (
        <div
          key={booking.id}
          className="bg-white rounded-card shadow-soft hover:shadow-card transition-shadow duration-200 p-6"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  {booking.title}
                </h3>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(
                    booking.status
                  )}`}
                >
                  {booking.status}
                </span>
              </div>
              {booking.description && (
                <p className="text-sm text-gray-600 mb-3">
                  {booking.description}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm">
            {/* Room Name */}
            <div className="flex items-center gap-2 text-gray-600">
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              <span>Room: {booking.room?.name || 'N/A'}</span>
            </div>
            {/* Capacity */}
            <div className="flex items-center gap-2 text-gray-600">
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <span>Capacity: {booking.capacity}</span>
            </div>
            {/* Start Time */}
            <div className="flex items-center gap-2 text-gray-600">
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span>Start: {formatDateTime(booking.startTime)}</span>
            </div>
            {/* End Time */}
            <div className="flex items-center gap-2 text-gray-600">
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span>End: {formatDateTime(booking.endTime)}</span>
            </div>
          </div>

          {booking.status !== 'cancelled' && (
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <ButtonFactory
                variant="secondary"
                size="sm"
                onClick={() => handleEdit(booking)}
              >
                Edit
              </ButtonFactory>
              <ButtonFactory
                variant="danger"
                size="sm"
                onClick={() => handleCancel(booking.id)}
              >
                Cancel Booking
              </ButtonFactory>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
