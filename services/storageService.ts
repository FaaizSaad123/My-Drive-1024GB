import { DriveItem, FileType, User } from '../types';

const DB_NAME = 'MyDriveDB';
const DB_VERSION = 5; // Bumped version for schema change
const STORE_NAME = 'files';
const USERS_STORE_NAME = 'users';
const TOTAL_STORAGE = 1024 * 1024 * 1024 * 1024; // 1024 GB in bytes

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error("IndexedDB not supported"));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const transaction = (event.target as IDBOpenDBRequest).transaction;
      
      // Ensure files store exists
      let fileStore;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        fileStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      } else {
        fileStore = transaction?.objectStore(STORE_NAME);
      }

      // Add ownerId index if missing
      if (fileStore && !fileStore.indexNames.contains('ownerId')) {
        fileStore.createIndex('ownerId', 'ownerId', { unique: false });
      }

      // Add parentId index for folders
      if (fileStore && !fileStore.indexNames.contains('parentId')) {
        fileStore.createIndex('parentId', 'parentId', { unique: false });
      }

      // Ensure users store exists
      if (!db.objectStoreNames.contains(USERS_STORE_NAME)) {
        const userStore = db.createObjectStore(USERS_STORE_NAME, { keyPath: 'id' });
        userStore.createIndex('username', 'username', { unique: true });
      }
    };
  });
};

export const getItems = async (): Promise<DriveItem[]> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      
      const request = store.getAll();
      
      request.onsuccess = async () => {
        const items = request.result as DriveItem[];
        // Sort by type (Folders first) then newest first
        items.sort((a, b) => {
          if (a.type === FileType.FOLDER && b.type !== FileType.FOLDER) return -1;
          if (a.type !== FileType.FOLDER && b.type === FileType.FOLDER) return 1;
          return b.createdAt - a.createdAt;
        });
        resolve(items);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("Database error:", error);
    return [];
  }
};

export const saveItem = async (item: DriveItem): Promise<DriveItem> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    // Ensure isDeleted is set
    const itemToSave = { ...item, isDeleted: item.isDeleted || false };
    const request = store.put(itemToSave);
    
    request.onsuccess = () => resolve(itemToSave);
    request.onerror = () => reject(request.error);
  });
};

export const renameItem = async (id: string, newName: string): Promise<void> => {
  const db = await openDB();
  const item = await new Promise<DriveItem | undefined>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  if (item) {
    item.name = newName;
    await saveItem(item);
  }
};

export const deleteItem = async (id: string): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const softDeleteItem = async (id: string): Promise<void> => {
  const db = await openDB();
  const item = await new Promise<DriveItem | undefined>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  if (item) {
    item.isDeleted = true;
    await saveItem(item);
  }
};

export const restoreItem = async (id: string): Promise<void> => {
  const db = await openDB();
  const item = await new Promise<DriveItem | undefined>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  if (item) {
    item.isDeleted = false;
    await saveItem(item);
  }
};

export const toggleFavorite = async (id: string): Promise<void> => {
  const db = await openDB();
  const item = await new Promise<DriveItem | undefined>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  if (item) {
    item.isFavorite = !item.isFavorite;
    await saveItem(item);
  }
};

export const getStorageStats = async (): Promise<{ used: number, total: number }> => {
  const items = await getItems();
  const used = items.reduce((acc, item) => acc + item.size, 0);
  return { used, total: TOTAL_STORAGE };
};

export const formatBytes = (bytes: number, decimals = 2) => {
  if (!+bytes) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

export const registerUser = async (username: string, password?: string): Promise<User> => {
  // Mock implementation maintained for API compatibility
   return { id: 'mock-id', username };
};

export const loginUser = async (username: string, password?: string): Promise<User> => {
   // Mock implementation maintained for API compatibility
   return { id: 'mock-id', username };
};