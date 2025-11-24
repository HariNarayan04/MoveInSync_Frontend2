import { create } from 'zustand';
import type { AvailableRoom, AvailabilitySearchParams, Room } from '@/types';

interface BookingState {
  // Search results
  searchResults: AvailableRoom[];

  // Search parameters
  searchParams: AvailabilitySearchParams | null;

  // Selected room for booking
  selectedRoom: Room | null;

  // Actions
  setSearchResults: (results: AvailableRoom[]) => void;
  setSearchParams: (params: AvailabilitySearchParams) => void;
  setSelectedRoom: (room: Room | null) => void;
  clearSearch: () => void;
}

export const useBookingStore = create<BookingState>((set) => ({
  searchResults: [],
  searchParams: null,
  selectedRoom: null,

  setSearchResults: (results) => set({ searchResults: results }),

  setSearchParams: (params) => set({ searchParams: params }),

  setSelectedRoom: (room) => set({ selectedRoom: room }),

  clearSearch: () => set({
    searchResults: [],
    searchParams: null,
    selectedRoom: null,
  }),
}));
