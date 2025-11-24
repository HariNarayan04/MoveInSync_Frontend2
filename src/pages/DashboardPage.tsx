import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AvailabilitySearchForm } from '@/components/availability/AvailabilitySearchForm';
import { AvailableRoomsList } from '@/components/availability/AvailableRoomsList';
import { BookingModal } from '@/components/bookings/BookingModal';
import { FloorsPage } from './FloorsPage';

export const DashboardPage: React.FC = () => {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Room Availability
          </h1>
          <p className="text-gray-600">
            Search for available rooms and make your booking
          </p>
        </div>

        <AvailabilitySearchForm />
        <AvailableRoomsList />
      </div>
      {/* Booking Modal */}
      <BookingModal />
    </DashboardLayout>
  );
};
