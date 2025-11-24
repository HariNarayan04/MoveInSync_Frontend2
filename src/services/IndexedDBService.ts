import type { Floor, FloorRoom } from '@/types';

const DB_NAME = 'FloorManagementDB';
const DB_VERSION = 1;

const STORES = {
  FLOORS: 'floors',
  ROOMS: 'rooms',
  SYNC_METADATA: 'syncMetadata',
} as const;

interface SyncMetadata {
  key: string;
  lastSyncedAt: string;
  version: number;
}

class IndexedDBService {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<IDBDatabase> | null = null;

  async init(): Promise<void> {
    if (this.db) {
      return;
    }

    if (!this.initPromise) {
      this.initPromise = this.openDB();
    }

    await this.initPromise;
  }

  private openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        this.db = db;

        // Create floors store
        if (!db.objectStoreNames.contains(STORES.FLOORS)) {
          const floorsStore = db.createObjectStore(STORES.FLOORS, { keyPath: 'id' });
          floorsStore.createIndex('name', 'name', { unique: false });
        }

        // Create rooms store
        if (!db.objectStoreNames.contains(STORES.ROOMS)) {
          const roomsStore = db.createObjectStore(STORES.ROOMS, { keyPath: 'id' });
          roomsStore.createIndex('floorId', 'floorId', { unique: false });
          roomsStore.createIndex('name', 'name', { unique: false });
        }

        // Create sync metadata store
        if (!db.objectStoreNames.contains(STORES.SYNC_METADATA)) {
          db.createObjectStore(STORES.SYNC_METADATA, { keyPath: 'key' });
        }
      };
    });
  }

  private async ensureInitialized(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.init();
    }

    if (!this.db) {
      throw new Error('IndexedDB initialization failed.');
    }

    return this.db;
  }

  // Floors operations
  async getAllFloors(): Promise<Floor[]> {
    const db = await this.ensureInitialized();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.FLOORS], 'readonly');
      const store = transaction.objectStore(STORES.FLOORS);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        reject(new Error('Failed to get floors from IndexedDB'));
      };
    });
  }

  async saveFloors(floors: Floor[]): Promise<void> {
    const db = await this.ensureInitialized();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.FLOORS], 'readwrite');
      const store = transaction.objectStore(STORES.FLOORS);

      // Clear existing floors
      store.clear();

      // Add all floors
      floors.forEach((floor) => {
        store.add(floor);
      });

      transaction.oncomplete = () => {
        resolve();
      };

      transaction.onerror = () => {
        reject(new Error('Failed to save floors to IndexedDB'));
      };
    });
  }

  async saveFloor(floor: Floor): Promise<void> {
    const db = await this.ensureInitialized();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.FLOORS], 'readwrite');
      const store = transaction.objectStore(STORES.FLOORS);
      const request = store.put(floor);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error('Failed to save floor to IndexedDB'));
      };
    });
  }

  async deleteFloor(floorId: string): Promise<void> {
    const db = await this.ensureInitialized();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.FLOORS], 'readwrite');
      const store = transaction.objectStore(STORES.FLOORS);
      const request = store.delete(floorId);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error('Failed to delete floor from IndexedDB'));
      };
    });
  }

  async replaceFloorId(tempFloorId: string, floor: Floor): Promise<void> {
    const db = await this.ensureInitialized();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.FLOORS, STORES.ROOMS], 'readwrite');
      const floorsStore = transaction.objectStore(STORES.FLOORS);
      const roomsStore = transaction.objectStore(STORES.ROOMS);
      const floorDeleteRequest = floorsStore.delete(tempFloorId);

      floorDeleteRequest.onsuccess = () => {
        floorsStore.put(floor);
      };

      floorDeleteRequest.onerror = () => {
        reject(new Error('Failed to replace floor in IndexedDB'));
      };

      const index = roomsStore.index('floorId');
      const roomsRequest = index.getAll(tempFloorId);

      roomsRequest.onsuccess = () => {
        const rooms = roomsRequest.result || [];
        rooms.forEach((room) => {
          roomsStore.put({
            ...room,
            floorId: floor.id,
          });
        });
      };

      roomsRequest.onerror = () => {
        reject(new Error('Failed to update rooms with new floor ID'));
      };

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(new Error('Failed to replace floor in IndexedDB'));
    });
  }

  // Rooms operations
  async getRoomsByFloorId(floorId: string): Promise<FloorRoom[]> {
    const db = await this.ensureInitialized();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.ROOMS], 'readonly');
      const store = transaction.objectStore(STORES.ROOMS);
      const index = store.index('floorId');
      const request = index.getAll(floorId);

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        reject(new Error('Failed to get rooms from IndexedDB'));
      };
    });
  }

  async getRoomById(roomId: string): Promise<FloorRoom | null> {
    const db = await this.ensureInitialized();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.ROOMS], 'readonly');
      const store = transaction.objectStore(STORES.ROOMS);
      const request = store.get(roomId);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        reject(new Error('Failed to get room from IndexedDB'));
      };
    });
  }

  async saveRoomsForFloor(floorId: string, rooms: FloorRoom[]): Promise<void> {
    const db = await this.ensureInitialized();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.ROOMS], 'readwrite');
      const store = transaction.objectStore(STORES.ROOMS);
      const floorIndex = store.index('floorId');

      const request = floorIndex.getAllKeys(IDBKeyRange.only(floorId));

      request.onsuccess = () => {
        const keys = request.result || [];
        keys.forEach((key) => {
          store.delete(key as IDBValidKey);
        });

        rooms.forEach((room) => {
          store.put(room);
        });
      };

      request.onerror = () => {
        reject(new Error('Failed to read existing rooms for floor'));
      };

      transaction.oncomplete = () => {
        resolve();
      };

      transaction.onerror = () => {
        reject(new Error('Failed to save rooms to IndexedDB'));
      };
    });
  }

  async saveRoom(room: FloorRoom): Promise<void> {
    const db = await this.ensureInitialized();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.ROOMS], 'readwrite');
      const store = transaction.objectStore(STORES.ROOMS);
      const request = store.put(room);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error('Failed to save room to IndexedDB'));
      };
    });
  }

  async deleteRoom(roomId: string): Promise<void> {
    const db = await this.ensureInitialized();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.ROOMS], 'readwrite');
      const store = transaction.objectStore(STORES.ROOMS);
      const request = store.delete(roomId);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error('Failed to delete room from IndexedDB'));
      };
    });
  }

  // Sync metadata operations
  async getSyncMetadata(key: string): Promise<SyncMetadata | null> {
    const db = await this.ensureInitialized();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.SYNC_METADATA], 'readonly');
      const store = transaction.objectStore(STORES.SYNC_METADATA);
      const request = store.get(key);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        reject(new Error('Failed to get sync metadata from IndexedDB'));
      };
    });
  }

  async saveSyncMetadata(key: string, metadata: Omit<SyncMetadata, 'key'>): Promise<void> {
    const db = await this.ensureInitialized();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.SYNC_METADATA], 'readwrite');
      const store = transaction.objectStore(STORES.SYNC_METADATA);
      const request = store.put({ key, ...metadata });

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error('Failed to save sync metadata to IndexedDB'));
      };
    });
  }

  async replaceFloorWithRealId(tempFloorId: string, floor: Floor): Promise<void> {
    const db = await this.ensureInitialized();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.FLOORS], 'readwrite');
      const store = transaction.objectStore(STORES.FLOORS);

      store.delete(tempFloorId);
      store.put(floor);

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(new Error('Failed to replace floor ID in IndexedDB'));
    });
  }

  async updateRoomsFloorId(oldFloorId: string, newFloorId: string): Promise<void> {
    const db = await this.ensureInitialized();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.ROOMS], 'readwrite');
      const store = transaction.objectStore(STORES.ROOMS);
      const index = store.index('floorId');
      const request = index.getAll(oldFloorId);

      request.onsuccess = () => {
        const rooms = request.result || [];
        rooms.forEach((room) => {
          store.put({
            ...room,
            floorId: newFloorId,
          });
        });
      };

      request.onerror = () => {
        reject(new Error('Failed to read rooms for floor update'));
      };

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(new Error('Failed to update rooms with new floor ID'));
    });
  }

  async replaceRoomWithRealId(tempRoomId: string, room: FloorRoom): Promise<void> {
    const db = await this.ensureInitialized();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.ROOMS], 'readwrite');
      const store = transaction.objectStore(STORES.ROOMS);

      store.delete(tempRoomId);
      store.put(room);

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(new Error('Failed to replace room ID in IndexedDB'));
    });
  }
}

export const indexedDBService = new IndexedDBService();

