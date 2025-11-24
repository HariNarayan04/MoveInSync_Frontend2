import React, { useState } from 'react';
import { AxiosError } from 'axios';
import { useUIStore } from '@/store/uiStore';
import { useBookingStore } from '@/store/bookingStore';
import { bookingService } from '@/api/BookingService';
import { ModalFactory } from '@/factory/ModalFactory';
import { ButtonFactory } from '@/factory/ButtonFactory';
import { toast } from '@/factory/ToastFactory';
import { formatErrorForDisplay } from '@/errors/errorHandler';

export const BookingModal: React.FC = () => {
  const { modal, closeModal } = useUIStore();
  const selectedRoom = useBookingStore((state) => state.selectedRoom);
  const searchParams = useBookingStore((state) => state.searchParams);
  const [isLoading, setIsLoading] = useState(false);
  const [purpose, setPurpose] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handlePurposeChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setPurpose(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedRoom) {
      toast.error('No room selected');
      return;
    }

    if (!searchParams) {
      toast.error('No search parameters found');
      return;
    }

    if (!purpose.trim()) {
      toast.error('Booking purpose is required');
      return;
    }

    setIsLoading(true);
    setError(null); // Clear any previous errors

    try {
      await bookingService.createBooking(
        selectedRoom.id,
        {
          startTime: searchParams.startTime,
          endTime: searchParams.endTime,
          capacity: searchParams.capacity,
          purpose: purpose.trim(),
        }
      );
      toast.success('Booking created successfully!');
      setPurpose('');
      setError(null);
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

  const isOpen = modal.isOpen && modal.type === 'booking';

  return (
    <>
      {/* Booking Modal */}
      <ModalFactory
        isOpen={isOpen}
        onClose={closeModal}
        title={`Book ${selectedRoom?.name || 'Room'}`}
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
            value={selectedRoom?.name || ''}
            disabled
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
          />
        </div>

        {/* Room Capacity - Auto-filled, non-changeable */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Room Capacity
          </label>
          <input
            type="number"
            value={selectedRoom?.capacity || ''}
            disabled
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
          />
        </div>

        {/* Start Time - Auto-filled, non-changeable */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Start Time
          </label>
          <input
            type="datetime-local"
            value={searchParams?.startTime || ''}
            disabled
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
          />
        </div>

        {/* End Time - Auto-filled, non-changeable */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            End Time
          </label>
          <input
            type="datetime-local"
            value={searchParams?.endTime || ''}
            disabled
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
          />
        </div>

        {/* Room Features - Auto-filled, non-changeable */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Room Features
          </label>
          <div className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 min-h-[2.5rem] flex items-center">
            {selectedRoom?.features && selectedRoom.features.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {selectedRoom.features.map((feature, index) => (
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
            Create Booking
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
                Failed to Create Booking
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
