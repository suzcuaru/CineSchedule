
import { DBSchema, openDB, IDBPDatabase } from 'idb';
import { MovieSession, ContentStatus, HallCategory, CinemaFormat, Advertisement, GoogleSheetData } from '../types';

const DB_NAME = 'CineSchedule_CinemaBox_v7';
const DB_VERSION = 3; 

export interface ManualStatusEntry {
  movie_name: string;
  global_status: ContentStatus | 'no_status';
  hall_statuses: Record<string, ContentStatus | null>;
}

interface CineScheduleDB extends DBSchema {
  movies: { key: any; value: any };
  formats: { key: any; value: any };
  halls: { key: any; value: any };
  hall_categories: { key: any; value: any };
  shows: { key: any; value: any; indexes: { 'hall_id': any } };
  tickets: { key: any; value: any };
  advertisements: { key: any; value: any };
  google_sheets: { key: any; value: any };
  sync_meta: { key: string; value: { id: string, last_updated: number } };
  manual_statuses: { key: string; value: ManualStatusEntry };
}

class IndexedDBService {
  private dbPromise: Promise<IDBPDatabase<CineScheduleDB>>;

  constructor() {
    this.dbPromise = openDB<CineScheduleDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion) {
        if (!db.objectStoreNames.contains('movies')) db.createObjectStore('movies', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('formats')) db.createObjectStore('formats', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('halls')) db.createObjectStore('halls', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('hall_categories')) db.createObjectStore('hall_categories', { keyPath: 'id' });
        
        if (!db.objectStoreNames.contains('shows')) {
          const showStore = db.createObjectStore('shows', { keyPath: 'id' });
          showStore.createIndex('hall_id', 'hall_id');
        }
        
        if (!db.objectStoreNames.contains('tickets')) db.createObjectStore('tickets', { keyPath: 'show_id' });
        if (!db.objectStoreNames.contains('advertisements')) db.createObjectStore('advertisements', { autoIncrement: true });
        if (!db.objectStoreNames.contains('google_sheets')) db.createObjectStore('google_sheets', { keyPath: '_row_number' });
        if (!db.objectStoreNames.contains('sync_meta')) db.createObjectStore('sync_meta', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('manual_statuses')) db.createObjectStore('manual_statuses', { keyPath: 'movie_name' });
        
      },
    });
  }

  public async wipeAllData() {
      const db = await this.dbPromise;
      const stores: (keyof CineScheduleDB)[] = ['movies', 'formats', 'halls', 'hall_categories', 'shows', 'tickets', 'advertisements', 'google_sheets', 'sync_meta', 'manual_statuses'];
      const tx = db.transaction(stores as any, 'readwrite');
      for (const store of stores) {
          await tx.objectStore(store as any).clear();
      }
      await tx.done;
  }

  public async clearAndSave<T extends keyof CineScheduleDB>(storeName: T, data: any[]) {
    if (!Array.isArray(data)) return;
    try {
        const db = await this.dbPromise;
        const tx = db.transaction(storeName as any, 'readwrite');
        const store = tx.objectStore(storeName as any) as any;
        await store.clear();
        
        let savedCount = 0;
        for (const item of data) {
            if (item && typeof item === 'object') {
                if (store.keyPath) {
                    const kp = store.keyPath as string;
                    // Если ключ уже существует и не undefined, используем его
                    if (item[kp] === undefined && item.id !== undefined) {
                        item[kp] = item.id;
                    }
                    // Проверяем, что ключ существует и имеет значение
                    if (item[kp] !== undefined && item[kp] !== null && item[kp] !== '') {
                        await store.put(item);
                        savedCount++;
                    }
                } else {
                    // Для магазинов с autoIncrement (например, advertisements)
                    await store.put(item);
                    savedCount++;
                }
            }
        }
        await tx.done;
        console.log(`[IndexedDB] Сохранено ${savedCount} записей в ${storeName}`);
    } catch (e) { 
        console.error(`[IndexedDB] Ошибка сохранения в ${storeName}:`, e); 
    }
  }
  
  public async updateShowStatus(id: string, status: ContentStatus, updatedAt: number) {
      try {
          const db = await this.dbPromise;
          const tx = db.transaction('shows', 'readwrite');
          const store = tx.objectStore('shows');
          const show = await store.get(id);
          if (show) {
              show.content_status = status;
              show.status_updated_at = updatedAt;
              await store.put(show);
          }
          await tx.done;
      } catch (e) { console.error(e); }
  }

  // Очистка старых статусов (старше месяца)
  public async cleanupOldStatuses() {
      try {
          const db = await this.dbPromise;
          const tx = db.transaction('manual_statuses', 'readwrite');
          const store = tx.objectStore('manual_statuses');
          
          const entries = await store.getAll();
          const oneMonthAgo = Date.now() - (30 * 24 * 60 * 60 * 1000); // 30 дней в миллисекундах
          
          let deletedCount = 0;
          for (const entry of entries) {
              // Проверяем, используется ли этот статус
              const isUsed = Object.values(entry.hall_statuses).some(status => status !== null && status !== 'no_status');
              
              // Если статус не используется, удаляем
              if (!isUsed) {
                  await store.delete(entry.movie_name);
                  deletedCount++;
              }
          }
          
          await tx.done;
          if (deletedCount > 0) {
              console.log(`[IndexedDB] Удалено ${deletedCount} неиспользуемых статусов`);
          }
      } catch (e) { 
          console.error('[IndexedDB] Ошибка очистки старых статусов:', e); 
      }
  }

  public async saveManualStatus(movieName: string, hallId: string, status: ContentStatus) {
    const db = await this.dbPromise;
    const tx = db.transaction('manual_statuses', 'readwrite');
    const store = tx.objectStore('manual_statuses');
    
    let entry = await store.get(movieName);
    if (!entry) {
        entry = { movie_name: movieName, global_status: 'no_status', hall_statuses: {} };
    }

    // Сохраняем статус для конкретного зала
    entry.hall_statuses[hallId] = status;

    await store.put(entry);
    await tx.done;
  }

  public async getManualStatus(movieName: string, hallId: string): Promise<ContentStatus | null> {
    const db = await this.dbPromise;
    const entry = await db.get('manual_statuses', movieName);
    if (!entry) return null;
    return entry.hall_statuses[hallId] || null;
  }

  public async getAllManualStatuses(): Promise<ManualStatusEntry[]> {
    const db = await this.dbPromise;
    return await db.getAll('manual_statuses');
  }

  public async saveSyncMeta(type: string) {
    const db = await this.dbPromise;
    await db.put('sync_meta', { id: type, last_updated: Date.now() });
  }

  public async getAllMetadata() {
    try {
        const db = await this.dbPromise;
        const [movies, halls, shows, tickets, formats, hall_categories, advertisements, google_sheets] = await Promise.all([
            db.getAll('movies'), db.getAll('halls'), db.getAll('shows'),
            db.getAll('tickets'), db.getAll('formats'), db.getAll('hall_categories'),
            db.getAll('advertisements'), db.getAll('google_sheets')
        ]);
        return { movies, halls, shows, tickets, formats, hall_categories, advertisements, google_sheets };
    } catch (e) {
        return { movies: [], halls: [], shows: [], tickets: [], formats: [], hall_categories: [], advertisements: [], google_sheets: [] };
    }
  }

}

export const LocalDB = new IndexedDBService();
