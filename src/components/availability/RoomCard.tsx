import React from 'react';
import { useBookingStore } from '@/store/bookingStore';
import { useUIStore } from '@/store/uiStore';
import { ButtonFactory } from '@/factory/ButtonFactory';
import type { AvailableRoom } from '@/types';

interface RoomCardProps {
  room: AvailableRoom;
}

export const RoomCard: React.FC<RoomCardProps> = ({ room }) => {
  const setSelectedRoom = useBookingStore((state) => state.setSelectedRoom);
  const openModal = useUIStore((state) => state.openModal);

  const handleBookNow = () => {
    setSelectedRoom(room);
    openModal('booking', { room });
  };

  return (
    <div className="bg-white rounded-card shadow-soft hover:shadow-card transition-shadow duration-200 overflow-hidden">
      {/* Room Image */}
      {room.imageUrl && (
        <div className="h-48 bg-gray-200 overflow-hidden">
          <img
            src={room.imageUrl}
            alt={room.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Room Content */}
      <div className="p-5">
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {room.name}
          </h3>
          {room.description && (
            <p className="text-sm text-gray-600 line-clamp-2">
              {room.description}
            </p>
          )}
        </div>

        {/* Room Details */}
        <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
          <div className="flex items-center gap-1.5">
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
            <span>Capacity: {room.capacity}</span>
          </div>
        </div>

        {/* Features */}
        {room.features && room.features.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {room.features.slice(0, 3).map((feature, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-700"
                >
                  {feature}
                </span>
              ))}
              {room.features.length > 3 && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                  +{room.features.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Book Now Button */}
        <ButtonFactory
          onClick={handleBookNow}
          fullWidth
          variant="primary"
        >
          Book Now
        </ButtonFactory>
      </div>
    </div>
  );
};
