import { httpClient } from './httpClient';
import type {
  AvailabilitySearchParams,
  AvailableRoom,
  Booking,
  ApiResponse,
} from '@/types';

class BookingService {
  async searchAvailability(params: AvailabilitySearchParams): Promise<AvailableRoom[]> {
    // POST /api/v1/availability/search
    // Map features from lowercase to capitalized format expected by backend
    const apiParams = {
      startTime: params.startTime,
      endTime: params.endTime,
      capacity: params.capacity,
      features: params.features?.map(feature => {
        // Map lowercase frontend features to capitalized backend format
        const featureMap: Record<string, string> = {
          'Wifi': 'Wifi',
          'Whiteboard': 'Whiteboard',
          'Projector': 'Projector'
        };
        return featureMap[feature.toLowerCase()] || feature;
      })
    };
    
    // Backend returns { message, rooms, count } not wrapped in ApiResponse.data
    const response = await httpClient.post<{
      message: string;
      rooms: AvailableRoom[];
      count: number;
    }>(
      '/api/v1/availability/search',
      apiParams
    );
    
    // Map backend room structure to frontend AvailableRoom format
    // Backend returns rooms with _id, roomId, roomName, roomFeatures, etc.
    return response.data.rooms.map((room: any) => ({
      id: room._id || room.id,
      name: room.roomName || room.name,
      description: room.floorDescription || room.description || '',
      capacity: room.capacity,
      features: (room.roomFeatures || room.features || []).map((f: string) => f.toLowerCase()),
      imageUrl: room.imageUrl,
    })) as AvailableRoom[];
  }

  async createBooking(
    roomId: string,
    payload: {
      startTime: string;
      endTime: string;
      capacity: number;
      purpose: string;
    }
  ): Promise<Booking> {
    // POST /api/v1/rooms/:roomId/bookings
    // Backend expects: roomId in params, startTime, endTime, capacity, purpose in body
    // SECURITY NOTE: Backend extracts user_id from httpOnly cookie
    const apiPayload = {
      startTime: payload.startTime,
      endTime: payload.endTime,
      capacity: payload.capacity,
      purpose: payload.purpose,
    };

    await httpClient.post<ApiResponse<{ success: boolean; message: string }>>(
      `/api/v1/bookings/rooms/${roomId}`,
      apiPayload
    );

    // Response only returns success/message, not the booking object
    // Return a minimal booking object for immediate feedback
    return {
      id: '',
      roomId,
      userId: '', // Will be populated when fetching bookings
      title: payload.purpose,
      description: payload.purpose,
      startTime: payload.startTime,
      endTime: payload.endTime,
      capacity: payload.capacity,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as Booking;
  }

  async getBookingsByUser(userId: string): Promise<Booking[]> {
    // GET /api/v1/bookings/:userId
    // Backend returns { message, bookings, count } not wrapped in ApiResponse.data
    const response = await httpClient.get<{
      message: string;
      bookings: Array<{
        _id: string;
        roomId: {
          _id: string;
          roomId: number;
          roomName: string;
          capacity: number;
          roomFeatures: string[];
          floorId: string;
        };
        userId: {
          _id: string;
          name: string;
          email: string;
        };
        startTime: string;
        endTime: string;
        capacity: number;
        purpose: string;
        status: string;
        createdBy: string;
        createdAt: string;
        updatedAt: string;
      }>;
      count: number;
    }>(
      `/api/v1/bookings/${userId}`
    );

    // Map backend booking structure to frontend Booking format
    return response.data.bookings.map((booking) => ({
      id: booking._id,
      roomId: booking.roomId._id,
      userId: booking.userId._id,
      title: booking.purpose,
      description: booking.purpose,
      startTime: booking.startTime,
      endTime: booking.endTime,
      capacity: booking.capacity,
      status: booking.status as 'pending' | 'confirmed' | 'cancelled',
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
      room: {
        id: booking.roomId._id,
        name: booking.roomId.roomName,
        description: '',
        capacity: booking.roomId.capacity,
        features: (booking.roomId.roomFeatures || []).map((f: string) => f.toLowerCase()),
      }
    } as Booking));
  }

  async getBookingById(bookingId: string): Promise<Booking> {
    const response = await httpClient.get<ApiResponse<Booking>>(
      `/api/v1/bookings/${bookingId}`
    );
    return response.data.data;
  }

  async updateBooking(
    bookingId: string,
    payload: {
      startTime: string;
      endTime: string;
      capacity: number;
      purpose: string;
    }
  ): Promise<Booking> {
    // PUT /api/v1/bookings/:id
    // Backend expects: startTime, endTime, capacity, purpose in body
    const apiPayload = {
      startTime: payload.startTime,
      endTime: payload.endTime,
      capacity: payload.capacity,
      purpose: payload.purpose,
    };

    await httpClient.put<ApiResponse<{ success: boolean; message: string }>>(
      `/api/v1/bookings/${bookingId}`,
      apiPayload
    );

    // Response only returns success/message
    // Return updated booking for immediate feedback
    return {
      id: bookingId,
      title: payload.purpose,
      description: payload.purpose,
      startTime: payload.startTime,
      endTime: payload.endTime,
      capacity: payload.capacity,
    } as Booking;
  }

  async cancelBooking(bookingId: string): Promise<void> {
    // DELETE /api/v1/bookings/:id
    await httpClient.delete(`/api/v1/bookings/${bookingId}`);
  }
}

export const bookingService = new BookingService();
