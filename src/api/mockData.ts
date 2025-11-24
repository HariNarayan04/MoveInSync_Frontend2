// Mock data for testing frontend without backend
import type { User, AvailableRoom, Booking, Floor, FloorRoom } from '@/types';

// Mock user data
export const mockUser: User = {
  id: 'mock-user-123',
  email: 'test@example.com',
  name: 'Test User',
  role: 'Client',
};

// Mock Admin user
export const mockAdminUser: User = {
  id: 'mock-Admin-456',
  email: 'Admin@example.com',
  name: 'Admin User',
  role: 'Admin',
};

// Mock available rooms
export const mockRooms: AvailableRoom[] = [
  {
    id: 'room-1',
    name: 'Conference Room A',
    description: 'Large conference room with video conferencing capabilities and Whiteboard',
    capacity: 12,
    features: ['Projector', 'Whiteboard', 'Video Conference', 'Microphone'],
    imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80',
    availableSlots: [
      {
        start: '2025-11-24T09:00:00Z',
        end: '2025-11-24T10:00:00Z',
      },
      {
        start: '2025-11-24T14:00:00Z',
        end: '2025-11-24T15:00:00Z',
      },
    ],
  },
  {
    id: 'room-2',
    name: 'Meeting Room B',
    description: 'Medium-sized meeting room perfect for team discussions',
    capacity: 8,
    features: ['Whiteboard', 'TV Screen', 'Conference Phone'],
    imageUrl: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&q=80',
  },
  {
    id: 'room-3',
    name: 'Executive Boardroom',
    description: 'Premium boardroom with high-end amenities for executive meetings',
    capacity: 16,
    features: ['Projector', 'Whiteboard', 'Video Conference', 'Microphone', 'Catering Setup'],
    imageUrl: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800&q=80',
  },
  {
    id: 'room-4',
    name: 'Creative Space',
    description: 'Collaborative workspace with flexible seating and creative tools',
    capacity: 10,
    features: ['Whiteboard', 'TV Screen', 'Bean Bags', 'Standing Desks'],
    imageUrl: 'https://images.unsplash.com/photo-1497366412874-3415097a27e7?w=800&q=80',
  },
  {
    id: 'room-5',
    name: 'Small Huddle Room',
    description: 'Intimate space for quick team huddles and 1-on-1 meetings',
    capacity: 4,
    features: ['TV Screen', 'Whiteboard'],
    imageUrl: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=800&q=80',
  },
  {
    id: 'room-6',
    name: 'Training Room',
    description: 'Large training facility with tiered seating and presentation equipment',
    capacity: 30,
    features: ['Projector', 'Microphone', 'Whiteboard', 'PA System', 'Video Conference'],
    imageUrl: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&q=80',
  },
];

// Mock bookings
export const mockBookings: Booking[] = [
  {
    id: 'booking-1',
    roomId: 'room-1',
    userId: 'mock-user-123',
    title: 'Weekly Team Standup',
    description: 'Regular team sync meeting',
    startTime: '2025-11-25T09:00:00Z',
    endTime: '2025-11-25T09:30:00Z',
    bufferBefore: 5,
    bufferAfter: 5,
    capacity: 8,
    participants: ['john@example.com', 'jane@example.com'],
    status: 'confirmed',
    createdAt: '2025-11-23T10:00:00Z',
    updatedAt: '2025-11-23T10:00:00Z',
    room: {
      id: 'room-1',
      name: 'Conference Room A',
      description: 'Large conference room',
      capacity: 12,
      features: ['Projector', 'Whiteboard'],
    },
  },
  {
    id: 'booking-2',
    roomId: 'room-3',
    userId: 'mock-user-123',
    title: 'Client Presentation',
    description: 'Q4 results presentation for key clients',
    startTime: '2025-11-26T14:00:00Z',
    endTime: '2025-11-26T16:00:00Z',
    bufferBefore: 15,
    bufferAfter: 15,
    capacity: 12,
    participants: ['client1@example.com', 'client2@example.com', 'sales@example.com'],
    status: 'confirmed',
    createdAt: '2025-11-22T15:30:00Z',
    updatedAt: '2025-11-22T15:30:00Z',
    room: {
      id: 'room-3',
      name: 'Executive Boardroom',
      description: 'Premium boardroom',
      capacity: 16,
      features: ['Projector', 'Video Conference'],
    },
  },
  {
    id: 'booking-3',
    roomId: 'room-4',
    userId: 'mock-user-123',
    title: 'Brainstorming Session',
    description: 'Product ideation and planning',
    startTime: '2025-11-27T10:00:00Z',
    endTime: '2025-11-27T12:00:00Z',
    capacity: 6,
    status: 'pending',
    createdAt: '2025-11-23T08:00:00Z',
    updatedAt: '2025-11-23T08:00:00Z',
    room: {
      id: 'room-4',
      name: 'Creative Space',
      description: 'Collaborative workspace',
      capacity: 10,
      features: ['Whiteboard', 'TV Screen'],
    },
  },
];

// Mock floors
export const mockFloors: Floor[] = [
  {
    id: 'floor-1',
    name: 'Ground Floor',
    description: 'Main floor with reception and common areas',
  },
  {
    id: 'floor-2',
    name: 'First Floor',
    description: 'Meeting rooms and collaborative spaces',
  },
  {
    id: 'floor-3',
    name: 'Second Floor',
    description: 'Executive offices and boardrooms',
  },
];

// Mock floor rooms
export const mockFloorRooms: FloorRoom[] = [
  {
    id: 'room-1',
    floorId: 'floor-1',
    name: 'Conference Room A',
    capacity: 12,
    features: ['Wifi', 'Whiteboard', 'Projector'],
    createdBy: 'mock-Admin-456',
    updatedBy: 'mock-Admin-456',
    createdAt: '2025-11-20T10:00:00Z',
    updatedAt: '2025-11-20T10:00:00Z',
  },
  {
    id: 'room-2',
    floorId: 'floor-2',
    name: 'Meeting Room B',
    capacity: 8,
    features: ['Wifi', 'Whiteboard'],
    createdBy: 'mock-Admin-456',
    updatedBy: 'mock-Admin-456',
    createdAt: '2025-11-20T10:00:00Z',
    updatedAt: '2025-11-20T10:00:00Z',
  },
  {
    id: 'room-3',
    floorId: 'floor-3',
    name: 'Executive Boardroom',
    capacity: 16,
    features: ['Wifi', 'Whiteboard', 'Projector'],
    createdBy: 'mock-Admin-456',
    updatedBy: 'mock-Admin-456',
    createdAt: '2025-11-20T10:00:00Z',
    updatedAt: '2025-11-20T10:00:00Z',
  },
  {
    id: 'room-4',
    floorId: 'floor-2',
    name: 'Creative Space',
    capacity: 10,
    features: ['Wifi', 'Whiteboard'],
    createdBy: 'mock-Admin-456',
    updatedBy: 'mock-Admin-456',
    createdAt: '2025-11-20T10:00:00Z',
    updatedAt: '2025-11-20T10:00:00Z',
  },
];

// Helper to simulate API delay
export const simulateDelay = (ms: number = 800): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
