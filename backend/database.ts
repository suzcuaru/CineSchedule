
import { DBSchema, openDB, IDBPDatabase } from 'idb';
import { MovieSession, ContentStatus, HallCategory, CinemaFormat, Advertisement, GoogleSheetData } from '../types';

const DB_NAME = 'CineSchedule_CinemaBox_v6';
const DB_VERSION = 1;

export interface DbMovie {
  id: number;
  name: string; // Changed from title to name based on API response
  duration: number;
  format_id?: number;
  distributor?: string;
  dcp_name?: string;
  age_limit?: number;
  poster_path?: string;
  genres?: any[];
  countries?: any[];
  description?: string;
  // Added releases property to fix type errors in aggregator.ts when accessing movie.releases
  releases?: { duration: number }[];
}

export interface DbHall {
  id: number;
  name: string;
  category_id: number;
  hall_category?: HallCategory;
}

export interface DbShow {
  id: number;
  movie_id: number;
  hall_id: number;
  start_time: string;
  end_time: string;
  format_id: number;
}

export interface DbTicket {
  show_id: number;
  occupied_count: number;
}

interface CineScheduleDB extends DBSchema {
  movies: { key: number; value: DbMovie };
  formats: { key: number; value: CinemaFormat };
  halls: { key: number; value: DbHall };
  hall_categories: { key: number; value: HallCategory };
  shows: { key: number; value: DbShow; indexes: { 'hall_id': number } };
  tickets: { key: number; value: DbTicket };
  advertisements: { key: number; value: Advertisement };
  google_sheets: { key: string; value: GoogleSheetData };
  sync_meta: { key: string; value: { id: string, last_updated: number } };
}

class IndexedDBService {
  private dbPromise: Promise<IDBPDatabase<CineScheduleDB>>;

  constructor() {
    this.dbPromise = openDB<CineScheduleDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Completely new table structure as per requirements
        db.createObjectStore('movies', { keyPath: 'id' });
        db.createObjectStore('formats', { keyPath: 'id' });
        db.createObjectStore('halls', { keyPath: 'id' });
        db.createObjectStore('hall_categories', { keyPath: 'id' });
        const showStore = db.createObjectStore('shows', { keyPath: 'id' });
        showStore.createIndex('hall_id', 'hall_id');
        db.createObjectStore('tickets', { keyPath: 'show_id' });
        db.createObjectStore('advertisements', { keyPath: 'id' });
        db.createObjectStore('google_sheets', { keyPath: 'id' });
        db.createObjectStore('sync_meta', { keyPath: 'id' });
      },
    });
  }

  public async clearAndSave<T extends keyof CineScheduleDB>(storeName: T, data: any[]) {
    const db = await this.dbPromise;
    // Fix: Cast storeName to any to resolve TS overload issues with idb generics for single store transactions
    const tx = db.transaction(storeName as any, 'readwrite');
    const store = tx.objectStore(storeName as any) as any;
    
    await store.clear();
    
    // Using sequential put to ensure stability within transaction.
    // Parallel writes (Promise.all) can sometimes cause transaction to commit prematurely or fail in some browsers/configurations.
    for (const item of data) {
      if (item) {
        await store.put(item);
      }
    }
    
    await tx.done;
  }

  public async saveSyncMeta(type: string) {
    const db = await this.dbPromise;
    await db.put('sync_meta', { id: type, last_updated: Date.now() });
  }

  public async getAllMetadata() {
    const db = await this.dbPromise;
    const movies = await db.getAll('movies');
    const halls = await db.getAll('halls');
    const shows = await db.getAll('shows');
    const tickets = await db.getAll('tickets');
    const formats = await db.getAll('formats');
    const hall_categories = await db.getAll('hall_categories');
    const advertisements = await db.getAll('advertisements');
    const google_sheets = await db.getAll('google_sheets');
    
    return { 
      movies, 
      halls, 
      shows, 
      tickets, 
      formats, 
      hall_categories,
      advertisements,
      google_sheets
    };
  }

  public async isDatabaseEmpty(): Promise<boolean> {
    const db = await this.dbPromise;
    const moviesCount = await db.count('movies');
    return moviesCount === 0;
  }

  public async getSyncTime(type: string) {
    const db = await this.dbPromise;
    const meta = await db.get('sync_meta', type);
    return meta?.last_updated || 0;
  }
}

export const LocalDB = new IndexedDBService();
