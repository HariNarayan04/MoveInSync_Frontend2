import { indexedDBService } from './IndexedDBService';
import { offlineQueueService, type QueueOperation } from './OfflineQueueService';
import { floorService } from '@/api/FloorService';
import { useAuthStore } from '@/store/authStore';
import type { Floor, FloorRoom } from '@/types';

class SyncService {
  private isOnline: boolean = navigator.onLine;
  private isInitialized: boolean = false;
  private isSyncing: boolean = false;
  private syncListeners: Set<(isOnline: boolean) => void> = new Set();

  constructor() {
    this.setupOnlineOfflineListeners();
  }

  private setupOnlineOfflineListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.notifyListeners(true);
      this.handleOnline();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notifyListeners(false);
    });
  }

  private notifyListeners(isOnline: boolean): void {
    this.syncListeners.forEach((listener) => listener(isOnline));
  }

  onOnlineStatusChange(listener: (isOnline: boolean) => void): () => void {
    this.syncListeners.add(listener);
    return () => {
      this.syncListeners.delete(listener);
    };
  }

  getIsOnline(): boolean {
    return this.isOnline;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Initialize IndexedDB
      await indexedDBService.init();

      // Check if user is Admin and logged in
      const state = useAuthStore.getState();
      if (state.isLoggedIn && state.role === 'Admin') {
        // If online, perform initial background sync
        if (this.isOnline) {
          await this.performInitialSync();
        }
      }

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize sync service:', error);
      throw error;
    }
  }

  async triggerSyncIfAdmin(): Promise<void> {
    // Check if user is Admin and logged in
    const state = useAuthStore.getState();
    if (state.isLoggedIn && state.role === 'Admin' && this.isOnline) {
      await this.performInitialSync();
    }
  }

  private async performInitialSync(): Promise<void> {
    try {
      // Check if we need to sync (first time or after a long time)
      const metadata = await indexedDBService.getSyncMetadata('last_sync');
      const shouldSync = !metadata || this.shouldPerformFullSync(metadata.lastSyncedAt);

      if (shouldSync) {
        // Fetch all floors and rooms in background
        await this.syncAllFloorsAndRooms();
        await indexedDBService.saveSyncMetadata('last_sync', {
          lastSyncedAt: new Date().toISOString(),
          version: 1,
        });
      }
    } catch (error) {
      console.error('Failed to perform initial sync:', error);
    }
  }

  private shouldPerformFullSync(lastSyncedAt: string): boolean {
    const lastSync = new Date(lastSyncedAt);
    const now = new Date();
    const hoursSinceSync = (now.getTime() - lastSync.getTime()) / (1000 * 60 * 60);
    // Sync if last sync was more than 1 hour ago
    return hoursSinceSync > 1;
  }

  private async syncAllFloorsAndRooms(): Promise<void> {
    try {
      // Check if user is Admin
      const state = useAuthStore.getState();
      if (!state.isLoggedIn || state.role !== 'Admin') {
        return;
      }

      // Fetch all floors
      const floors = await floorService.getAllFloors();
      await indexedDBService.saveFloors(floors);

      // Fetch rooms for each floor
      for (const floor of floors) {
        try {
          const rooms = await floorService.getRoomsByFloorId(floor.id);
          await indexedDBService.saveRoomsForFloor(floor.id, rooms);
        } catch (error) {
          console.error(`Failed to sync rooms for floor ${floor.id}:`, error);
        }
      }
    } catch (error) {
      console.error('Failed to sync floors and rooms:', error);
      throw error;
    }
  }

  private async handleOnline(): Promise<void> {
    if (this.isSyncing) {
      return;
    }

    // Check if user is Admin and logged in
    const state = useAuthStore.getState();
    if (!state.isLoggedIn || state.role !== 'Admin') {
      return;
    }

    // If queue is not empty, sync operations
    if (!offlineQueueService.isEmpty()) {
      await this.syncQueue();
    }

    // Also refresh data from server
    try {
      await this.syncAllFloorsAndRooms();
      await indexedDBService.saveSyncMetadata('last_sync', {
        lastSyncedAt: new Date().toISOString(),
        version: 1,
      });
    } catch (error) {
      console.error('Failed to refresh data after coming online:', error);
    }
  }

  async syncQueue(): Promise<void> {
    if (this.isSyncing || !this.isOnline) {
      return;
    }

    this.isSyncing = true;
    let operation = offlineQueueService.dequeueOperation();

    while (operation) {
      try {
        await this.executeOperation(operation);
      } catch (error) {
        console.error(`Failed to sync operation ${operation.id}:`, error);
      }

      operation = offlineQueueService.dequeueOperation();
    }

    this.isSyncing = false;
  }

  private async executeOperation(operation: QueueOperation): Promise<void> {
    switch (operation.type) {
      case 'CREATE_FLOOR':
        await this.handleCreateFloorOperation(operation);
        break;
      case 'CREATE_ROOM':
        await this.handleCreateRoomOperation(operation);
        break;
      case 'UPDATE_ROOM':
        await this.handleUpdateRoomOperation(operation);
        break;
      case 'DELETE_ROOM':
        await this.handleDeleteRoomOperation(operation);
        break;
      default:
        throw new Error(`Unknown operation type: ${operation.type}`);
    }
  }

  private async handleCreateFloorOperation(operation: QueueOperation): Promise<void> {
    const floor = await floorService.createFloorOnline(operation.payload);
    const tempFloorId = operation.meta?.tempFloorId;

    if (tempFloorId) {
      await indexedDBService.replaceFloorWithRealId(tempFloorId, floor);
      await indexedDBService.updateRoomsFloorId(tempFloorId, floor.id);
      offlineQueueService.updateFloorIdReferences(tempFloorId, floor.id);
    } else {
      await indexedDBService.saveFloor(floor);
    }
  }

  private async handleCreateRoomOperation(operation: QueueOperation): Promise<void> {
    const payload = {
      ...operation.payload,
      floor_id: operation.meta?.floorId ?? operation.payload.floor_id,
    };

    const room = await floorService.createFloorRoomOnline(payload);
    const tempRoomId = operation.meta?.tempRoomId;

    if (tempRoomId) {
      await indexedDBService.replaceRoomWithRealId(tempRoomId, room);
    } else {
      await indexedDBService.saveRoom(room);
    }
  }

  private async handleUpdateRoomOperation(operation: QueueOperation): Promise<void> {
    const updatedRoom = await floorService.updateFloorRoomOnline(
      operation.payload.roomId,
      operation.payload
    );
    await indexedDBService.saveRoom(updatedRoom);
  }

  private async handleDeleteRoomOperation(operation: QueueOperation): Promise<void> {
    await floorService.deleteFloorRoomOnline(operation.payload.roomId);
    await indexedDBService.deleteRoom(operation.payload.roomId);
  }

  // Update IndexedDB after successful API calls
  async updateFloorsAfterSync(floors: Floor[]): Promise<void> {
    await indexedDBService.saveFloors(floors);
  }

  async updateRoomsAfterSync(floorId: string, rooms: FloorRoom[]): Promise<void> {
    await indexedDBService.saveRoomsForFloor(floorId, rooms);
  }

  async updateFloorAfterCreate(floor: Floor): Promise<void> {
    await indexedDBService.saveFloor(floor);
  }

  async updateRoomAfterCreate(room: FloorRoom): Promise<void> {
    await indexedDBService.saveRoom(room);
  }

  async updateRoomAfterUpdate(room: FloorRoom): Promise<void> {
    await indexedDBService.saveRoom(room);
  }

  async removeRoomAfterDelete(roomId: string): Promise<void> {
    await indexedDBService.deleteRoom(roomId);
  }
}

export const syncService = new SyncService();

