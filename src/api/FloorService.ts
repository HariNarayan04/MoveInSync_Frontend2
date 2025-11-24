import { httpClient } from './httpClient';
import { indexedDBService } from '@/services/IndexedDBService';
import { offlineQueueService } from '@/services/OfflineQueueService';
import { syncService } from '@/services/SyncService';
import type {
  Floor,
  FloorRoom,
  CreateFloorRoomPayload,
  UpdateFloorRoomPayload,
  CreateFloorPayload,
} from '@/types';

class FloorService {
  private isOnline(): boolean {
    return syncService.getIsOnline();
  }

  private generateTempId(prefix: string): string {
    return `temp_${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  private mapFloorResponse(floor: any): Floor {
    return {
      id: floor._id,
      name: floor.floorName || `Floor ${floor.floorNumber}`,
      description: floor.floorDescription,
    };
  }

  private mapRoomResponse(room: any): FloorRoom {
    return {
      id: room._id,
      floorId: room.floorId,
      roomId: room.roomId,
      name: room.roomName,
      capacity: room.capacity,
      features: room.roomFeatures || [],
      createdBy: room.createdBy,
      updatedBy: room.updatedBy,
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
    };
  }

  async createFloorOnline(payload: CreateFloorPayload): Promise<Floor> {
    return this.requestCreateFloor(payload);
  }

  async createFloorRoomOnline(payload: CreateFloorRoomPayload): Promise<FloorRoom> {
    return this.requestCreateRoom(payload);
  }

  async updateFloorRoomOnline(roomId: string, payload: UpdateFloorRoomPayload): Promise<FloorRoom> {
    return this.requestUpdateRoom(roomId, payload);
  }

  async deleteFloorRoomOnline(roomId: string): Promise<void> {
    await httpClient.delete(`/api/v1/rooms/${roomId}`);
  }

  private async requestCreateFloor(payload: CreateFloorPayload): Promise<Floor> {
    const response = await httpClient.post<{ message: string; floor: any }>(
      '/api/v1/floors',
      payload
    );
    return this.mapFloorResponse(response.data.floor);
  }

  private async requestCreateRoom(payload: CreateFloorRoomPayload): Promise<FloorRoom> {
    const response = await httpClient.post<{ message: string; room: any }>(
      `/api/v1/floors/${payload.floor_id}/rooms`,
      {
        roomId: payload.roomId,
        roomName: payload.roomName,
        capacity: payload.capacity,
        roomFeatures: payload.roomFeatures,
        floorId: payload.floor_id,
      }
    );

    return this.mapRoomResponse(response.data.room);
  }

  private buildUpdateRoomPayload(payload: UpdateFloorRoomPayload): Record<string, any> {
    const backendPayload: Record<string, any> = {};
    if (payload.name !== undefined) backendPayload.roomName = payload.name;
    if (payload.capacity !== undefined) backendPayload.capacity = payload.capacity;
    if (payload.features !== undefined) backendPayload.roomFeatures = payload.features;
    return backendPayload;
  }

  private async requestUpdateRoom(
    roomId: string,
    payload: UpdateFloorRoomPayload
  ): Promise<FloorRoom> {
    const response = await httpClient.put<{ message: string; room: any }>(
      `/api/v1/rooms/${roomId}`,
      this.buildUpdateRoomPayload(payload)
    );
    return this.mapRoomResponse(response.data.room);
  }

  private async enqueueFloorCreation(
    payload: CreateFloorPayload,
    tempFloorId?: string
  ): Promise<Floor> {
    const floorId = tempFloorId ?? this.generateTempId('floor');
    offlineQueueService.enqueueCreateFloor(payload, {
      tempFloorId: floorId,
      clientId: floorId,
    });

    const optimisticFloor: Floor = {
      id: floorId,
      name: payload.floorName,
      description: payload.floorDescription,
    };

    await indexedDBService.saveFloor(optimisticFloor);
    return optimisticFloor;
  }

  private async enqueueRoomCreation(payload: CreateFloorRoomPayload): Promise<FloorRoom> {
    const roomId = this.generateTempId('room');
    offlineQueueService.enqueueCreateRoom(payload, {
      clientId: roomId,
      floorId: payload.floor_id,
      tempRoomId: roomId,
    });

    const optimisticRoom: FloorRoom = {
      id: roomId,
      floorId: payload.floor_id,
      roomId: payload.roomId,
      name: payload.roomName,
      capacity: payload.capacity,
      features: payload.roomFeatures || [],
    };

    await indexedDBService.saveRoom(optimisticRoom);
    return optimisticRoom;
  }

  async getAllFloors(): Promise<Floor[]> {
    // GET /api/v1/floors
    // Backend returns: { message, floors: [], count }
    
    if (this.isOnline()) {
      try {
        const response = await httpClient.get<{ message: string; floors: any[]; count: number }>(
          '/api/v1/floors'
        );

        // Handle empty or missing floors array
        if (!response.data.floors || !Array.isArray(response.data.floors)) {
          // Try to get from IndexedDB as fallback
          return await indexedDBService.getAllFloors();
        }

        // Map backend response to frontend Floor type
        const floors = response.data.floors.map((floor: any) => ({
          id: floor._id,
          name: floor.floorName || `Floor ${floor.floorNumber}`,
          description: floor.floorDescription,
        }));

        // Update IndexedDB with fresh data
        await syncService.updateFloorsAfterSync(floors);
        return floors;
      } catch (error) {
        // If API call fails, try IndexedDB
        console.warn('Failed to fetch floors from API, using IndexedDB:', error);
        return await indexedDBService.getAllFloors();
      }
    } else {
      // Offline: return from IndexedDB
      return await indexedDBService.getAllFloors();
    }
  }

  async createFloor(payload: CreateFloorPayload): Promise<Floor> {
    // POST /api/v1/floors
    // SECURITY NOTE: Backend should verify Admin role from httpOnly cookie
    
    if (this.isOnline()) {
      try {
        const floor = await this.requestCreateFloor(payload);
        await syncService.updateFloorAfterCreate(floor);
        return floor;
      } catch (error) {
        // If API call fails, add to queue and create optimistically
        console.warn('Failed to create floor via API, adding to queue:', error);
        return this.enqueueFloorCreation(payload);
      }
    } else {
      // Offline: add to queue and create optimistically
      return this.enqueueFloorCreation(payload);
    }
  }

  async getRoomsByFloorId(floorId: string): Promise<FloorRoom[]> {
    // GET /api/v1/floors/:floorId/rooms
    // Backend returns: { message, rooms: [] }
    
    if (this.isOnline()) {
      try {
        const response = await httpClient.get<{ message: string; rooms: any[] }>(
          `/api/v1/floors/${floorId}/rooms`
        );

        // Handle empty or missing rooms array
        if (!response.data.rooms || !Array.isArray(response.data.rooms)) {
          // Try to get from IndexedDB as fallback
          return await indexedDBService.getRoomsByFloorId(floorId);
        }

        // Map backend response to frontend FloorRoom type
        const rooms = response.data.rooms.map((room: any) => ({
          id: room._id,
          floorId: room.floorId,
          roomId: room.roomId, // Room ID number
          name: room.roomName,
          capacity: room.capacity,
          features: room.roomFeatures || [],
          createdBy: room.createdBy,
          updatedBy: room.updatedBy,
          createdAt: room.createdAt,
          updatedAt: room.updatedAt,
        }));

        // Update IndexedDB with fresh data
        await syncService.updateRoomsAfterSync(floorId, rooms);
        return rooms;
      } catch (error) {
        // If API call fails, try IndexedDB
        console.warn('Failed to fetch rooms from API, using IndexedDB:', error);
        return await indexedDBService.getRoomsByFloorId(floorId);
      }
    } else {
      // Offline: return from IndexedDB
      return await indexedDBService.getRoomsByFloorId(floorId);
    }
  }

  async createFloorRoom(payload: CreateFloorRoomPayload): Promise<FloorRoom> {
    // POST /api/v1/floors/:floorId/rooms
    // Backend returns: { message, room } not wrapped in ApiResponse.data
    // SECURITY NOTE: Backend should extract created_by from httpOnly cookie
    // and verify Admin role before creating room
    
    if (this.isOnline()) {
      try {
        const room = await this.requestCreateRoom(payload);
        await syncService.updateRoomAfterCreate(room);
        return room;
      } catch (error) {
        // If API call fails, add to queue and create optimistically
        console.warn('Failed to create room via API, adding to queue:', error);
        return this.enqueueRoomCreation(payload);
      }
    } else {
      // Offline: add to queue and create optimistically
      return this.enqueueRoomCreation(payload);
    }
  }

  async updateFloorRoom(roomId: string, payload: UpdateFloorRoomPayload): Promise<FloorRoom> {
    // PUT /api/v1/rooms/:id
    // SECURITY NOTE: Backend should extract updated_by from httpOnly cookie
    // and verify Admin role before updating room

    if (this.isOnline()) {
      try {
        const mappedRoom = await this.requestUpdateRoom(roomId, payload);
        await syncService.updateRoomAfterUpdate(mappedRoom);
        return mappedRoom;
      } catch (error) {
        // If API call fails, add to queue and update optimistically
        console.warn('Failed to update room via API, adding to queue:', error);
        offlineQueueService.enqueueUpdateRoom(roomId, payload, { clientId: roomId });
        
        // Get existing room and update optimistically
        const existingRoom = await indexedDBService.getRoomById(roomId);
        if (existingRoom) {
          const optimisticRoom: FloorRoom = {
            ...existingRoom,
            name: payload.name ?? existingRoom.name,
            capacity: payload.capacity ?? existingRoom.capacity,
            features: payload.features ?? existingRoom.features,
            updatedAt: new Date().toISOString(),
          };
          await indexedDBService.saveRoom(optimisticRoom);
          return optimisticRoom;
        }
        throw error;
      }
    } else {
      // Offline: add to queue and update optimistically
      offlineQueueService.enqueueUpdateRoom(roomId, payload, { clientId: roomId });
      
      // Get existing room and update optimistically
      const existingRoom = await indexedDBService.getRoomById(roomId);
      if (existingRoom) {
        const optimisticRoom: FloorRoom = {
          ...existingRoom,
          name: payload.name ?? existingRoom.name,
          capacity: payload.capacity ?? existingRoom.capacity,
          features: payload.features ?? existingRoom.features,
          updatedAt: new Date().toISOString(),
        };
        await indexedDBService.saveRoom(optimisticRoom);
        return optimisticRoom;
      }
      throw new Error('Room not found in IndexedDB');
    }
  }

  async deleteFloorRoom(roomId: string): Promise<void> {
    // DELETE /api/v1/rooms/:id
    // SECURITY NOTE: Backend should verify Admin role from httpOnly cookie
    
    if (this.isOnline()) {
      try {
        await this.deleteFloorRoomOnline(roomId);
        // Remove from IndexedDB after successful deletion
        await syncService.removeRoomAfterDelete(roomId);
      } catch (error) {
        // If API call fails, add to queue and delete optimistically
        console.warn('Failed to delete room via API, adding to queue:', error);
        offlineQueueService.enqueueDeleteRoom(roomId, { clientId: roomId });
        // Remove from IndexedDB optimistically
        await indexedDBService.deleteRoom(roomId);
        throw error;
      }
    } else {
      // Offline: add to queue and delete optimistically
      offlineQueueService.enqueueDeleteRoom(roomId, { clientId: roomId });
      // Remove from IndexedDB optimistically
      await indexedDBService.deleteRoom(roomId);
    }
  }
}

export const floorService = new FloorService();
