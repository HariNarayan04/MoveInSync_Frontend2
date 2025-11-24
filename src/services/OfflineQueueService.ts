import type { CreateFloorRoomPayload, UpdateFloorRoomPayload, CreateFloorPayload } from '@/types';

export type QueueOperationType =
  | 'CREATE_FLOOR'
  | 'CREATE_ROOM'
  | 'UPDATE_ROOM'
  | 'DELETE_ROOM';

export interface QueueOperation {
  id: string;
  type: QueueOperationType;
  timestamp: string;
  payload: any;
  meta?: {
    clientId?: string;
    tempFloorId?: string;
    floorId?: string;
    tempRoomId?: string;
  };
}

const QUEUE_STORAGE_KEY = 'offline_queue';

class OfflineQueueService {
  private queue: QueueOperation[] = [];

  constructor() {
    this.loadQueue();
  }

  private loadQueue(): void {
    try {
      const stored = localStorage.getItem(QUEUE_STORAGE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load offline queue:', error);
      this.queue = [];
    }
  }

  private saveQueue(): void {
    try {
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error('Failed to save offline queue:', error);
    }
  }

  // Add operations to queue
  enqueueCreateFloor(
    payload: CreateFloorPayload,
    options?: { tempFloorId?: string; clientId?: string }
  ): string {
    const operation: QueueOperation = {
      id: `floor_${Date.now()}_${Math.random()}`,
      type: 'CREATE_FLOOR',
      timestamp: new Date().toISOString(),
      payload,
      meta: {
        clientId: options?.clientId || options?.tempFloorId,
        tempFloorId: options?.tempFloorId,
      },
    };
    return this.addOperation(operation);
  }

  enqueueCreateRoom(
    payload: CreateFloorRoomPayload,
    options?: { clientId?: string; floorId?: string; tempRoomId?: string }
  ): string {
    const operation: QueueOperation = {
      id: `room_${Date.now()}_${Math.random()}`,
      type: 'CREATE_ROOM',
      timestamp: new Date().toISOString(),
      payload,
      meta: {
        clientId: options?.clientId,
        floorId: options?.floorId ?? payload.floor_id,
        tempRoomId: options?.tempRoomId,
      },
    };
    return this.addOperation(operation);
  }

  enqueueUpdateRoom(
    roomId: string,
    payload: UpdateFloorRoomPayload,
    options?: { clientId?: string }
  ): string {
    const operation: QueueOperation = {
      id: `update_room_${Date.now()}_${Math.random()}`,
      type: 'UPDATE_ROOM',
      timestamp: new Date().toISOString(),
      payload: { roomId, ...payload },
      meta: {
        clientId: options?.clientId ?? roomId,
      },
    };
    return this.addOperation(operation);
  }

  enqueueDeleteRoom(roomId: string, options?: { clientId?: string }): string {
    const operation: QueueOperation = {
      id: `delete_room_${Date.now()}_${Math.random()}`,
      type: 'DELETE_ROOM',
      timestamp: new Date().toISOString(),
      payload: { roomId },
      meta: {
        clientId: options?.clientId ?? roomId,
      },
    };
    return this.addOperation(operation);
  }

  private addOperation(operation: QueueOperation): string {
    if (operation.meta?.clientId) {
      this.queue = this.queue.filter((op) => op.meta?.clientId !== operation.meta?.clientId);
    }
    this.queue.push(operation);
    this.saveQueue();
    return operation.id;
  }

  // Queue management
  getAllOperations(): QueueOperation[] {
    return [...this.queue];
  }

  dequeueOperation(): QueueOperation | null {
    if (this.queue.length === 0) {
      return null;
    }
    const operation = this.queue.shift() || null;
    this.saveQueue();
    return operation;
  }

  getOperationById(id: string): QueueOperation | undefined {
    return this.queue.find((op) => op.id === id);
  }

  removeOperation(id: string): void {
    this.queue = this.queue.filter((op) => op.id !== id);
    this.saveQueue();
  }

  clearQueue(): void {
    this.queue = [];
    this.saveQueue();
  }

  isEmpty(): boolean {
    return this.queue.length === 0;
  }

  getQueueSize(): number {
    return this.queue.length;
  }

  updateFloorIdReferences(oldFloorId: string, newFloorId: string): void {
    let changed = false;
    this.queue = this.queue.map((operation) => {
      if (operation.meta?.floorId === oldFloorId) {
        changed = true;
        const updatedPayload = {
          ...operation.payload,
          floor_id: newFloorId,
        };
        return {
          ...operation,
          payload: updatedPayload,
          meta: {
            ...operation.meta,
            floorId: newFloorId,
          },
        };
      }
      return operation;
    });

    if (changed) {
      this.saveQueue();
    }
  }
}

export const offlineQueueService = new OfflineQueueService();

