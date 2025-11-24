import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { BookingList } from '@/components/bookings/BookingList';
import { EditBookingModal } from '@/components/bookings/EditBookingModal';

export const MyBookingsPage: React.FC = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            My Bookings
          </h1>
          <p className="text-gray-600">
            View and manage your room bookings
          </p>
        </div>

        <BookingList />
      </div>

      {/* Edit Booking Modal */}
      <EditBookingModal />
    </DashboardLayout>
  );
};
