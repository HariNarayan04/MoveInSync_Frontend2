import React from 'react';
import { useBookingStore } from '@/store/bookingStore';
import { RoomCard } from './RoomCard';

export const AvailableRoomsList: React.FC = () => {
  const searchResults = useBookingStore((state) => state.searchResults);

  if (searchResults.length === 0) {
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
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No rooms found
        </h3>
        <p className="text-gray-600">
          Try adjusting your search criteria to find available rooms
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-900">
          Available Rooms ({searchResults.length})
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {searchResults.map((room) => (
          <RoomCard key={room.id} room={room} />
        ))}
      </div>
    </div>
  );
};
