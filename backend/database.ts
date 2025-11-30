import { DBSchema, openDB, IDBPDatabase } from 'idb';
import { AppSettings, MovieSession, ContentStatus } from '../types';

const DB_NAME = 'CineSchedule_Core_v4';
const DB_VERSION = 1;

interface CineScheduleDB extends DBSchema {
  sessions: {
    key: string;
    value: MovieSession;
    indexes: { 'date': string; 'hall_date': [string, string] };
  };
}

class IndexedDBService {
  private dbPromise: Promise<IDBPDatabase<CineScheduleDB>>;

  constructor() {
    this.dbPromise = openDB<CineScheduleDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('sessions')) {
          const sessionStore = db.createObjectStore('sessions', { keyPath: 'id' });
          sessionStore.createIndex('date', 'date');
          sessionStore.createIndex('hall_date', ['hall_name', 'date']);
        }
      },
    });
  }

  // --- Sessions ---
  public async clearAndBulkAddSessions(sessions: MovieSession[]): Promise<void> {
    if (!sessions || sessions.length === 0) return;

    const db = await this.dbPromise;
    const tx = db.transaction('sessions', 'readwrite');
    
    // Determine which records to clear
    const dates = new Set(sessions.map(s => s.date));
    const halls = new Set(sessions.map(s => s.hall_name));
    
    const cursor = await tx.store.index('date').openCursor();
    const toDelete: string[] = [];
    if (cursor) {
        for await (const c of cursor) {
            if (dates.has(c.value.date) && halls.has(c.value.hall_name)) {
                toDelete.push(c.primaryKey);
            }
        }
    }
    
    await Promise.all(toDelete.map(key => tx.store.delete(key)));
    
    await Promise.all([...sessions.map(s => tx.store.put(s)), tx.done]);
  }

  public async getSessionsByDate(date: string): Promise<MovieSession[]> {
    const db = await this.dbPromise;
    return db.getAllFromIndex('sessions', 'date', date);
  }

  public async getSessionsByHallForPeriod(hallName: string, startDate: string, endDate: string): Promise<MovieSession[]> {
    const db = await this.dbPromise;
    const range = IDBKeyRange.bound([hallName, startDate], [hallName, endDate]);
    return db.getAllFromIndex('sessions', 'hall_date', range);
  }

  public async updateSessionStatus(sessionId: string, newStatus: ContentStatus): Promise<void> {
    const db = await this.dbPromise;
    const tx = db.transaction('sessions', 'readwrite');
    const session = await tx.store.get(sessionId);
    if (session) {
      session.content_status = newStatus;
      await tx.store.put(session);
    }
    await tx.done;
  }
}

export const LocalDB = new IndexedDBService();