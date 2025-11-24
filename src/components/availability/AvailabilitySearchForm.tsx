import React, { useState, useEffect } from 'react';
import { useBookingStore } from '@/store/bookingStore';
import { bookingService } from '@/api/BookingService';
import { ButtonFactory } from '@/factory/ButtonFactory';
import { toast } from '@/factory/ToastFactory';
import { formatErrorForDisplay } from '@/errors/errorHandler';
import { getMinDateTime, validateBookingTimes } from '@/utils/dateValidation';
import type { AvailabilitySearchParams } from '@/types';

const AVAILABLE_FEATURES = ['Wifi', 'Whiteboard', 'Projector'];

export const AvailabilitySearchForm: React.FC = () => {
  const { setSearchResults, setSearchParams } = useBookingStore();
  const [isLoading, setIsLoading] = useState(false);
  const [minDateTime, setMinDateTime] = useState('');
  const [formData, setFormData] = useState<AvailabilitySearchParams>({
    startTime: '',
    endTime: '',
    capacity: 1,
    features: [],
  });

  useEffect(() => {
    // Set minimum datetime on component mount
    setMinDateTime(getMinDateTime());
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'capacity' ? Number(value) : value,
    }));
  };

  const handleFeatureToggle = (feature: string) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features?.includes(feature)
        ? prev.features.filter((f) => f !== feature)
        : [...(prev.features || []), feature],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate time range
    const validation = validateBookingTimes(
      formData.startTime,
      formData.endTime
    );

    if (!validation.isValid) {
      validation.errors.forEach((error) => toast.error(error));
      return;
    }

    setIsLoading(true);

    try {
      const results = await bookingService.searchAvailability(formData);
      setSearchResults(results);
      setSearchParams(formData);
      toast.success(`Found ${results.length} available rooms`);
    } catch (error) {
      toast.error(formatErrorForDisplay(error));
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-card-lg shadow-card p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">
        Search Available Rooms
      </h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
              value={formData.startTime}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            />
          </div>

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
              min={formData.startTime || minDateTime}
              value={formData.endTime}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label
              htmlFor="capacity"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Capacity Required *
            </label>
            <input
              id="capacity"
              name="capacity"
              type="number"
              required
              min="1"
              value={formData.capacity}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Feature Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Features (Optional)
          </label>
          <div className="grid grid-cols-3 gap-3">
            {AVAILABLE_FEATURES.map((feature) => (
              <label
                key={feature}
                className="flex items-center space-x-2 cursor-pointer p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={formData.features?.includes(feature) || false}
                  onChange={() => handleFeatureToggle(feature)}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700 capitalize">
                  {feature}
                </span>
              </label>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Select features you need (leave empty for no preference)
          </p>
        </div>

        <ButtonFactory
          type="submit"
          loading={isLoading}
          fullWidth
          size="lg"
        >
          Search Availability
        </ButtonFactory>
      </form>
    </div>
  );
};
