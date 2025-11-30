
import { AppSettings, MovieSession, ContentStatus } from '../types';
import { LocalDB } from './database';
import { getWeeklyDates, formatDate } from '../services/dataService';

export type ConnectionStatus = 'connected' | 'error' | 'pending' | 'idle';

const SETTINGS_STORAGE_KEY = 'CineSchedule_Settings_v1';

class AggregationService {
  public config: AppSettings | null = null;
  public connectionStatus: ConnectionStatus = 'idle';
  public lastSyncTime: Date | null = null;
  private listeners: (() => void)[] = [];

  constructor() {
    this.loadInitialSettings();
  }

  private async loadInitialSettings() {
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
    const defaults: AppSettings = { 
        serverUrl: '',
        apiKey: '',
        useMockDataFallback: true,
        highlightCurrent: true,
        enableAnimations: true,
        fontSize: 'medium',
        cardDensity: 'default',
        theme: 'default',
        autoRefreshInterval: 0, // off by default
    };
    this.config = stored ? { ...defaults, ...JSON.parse(stored) } : defaults;
    this.notify();
  }

  public subscribe(fn: () => void) {
    this.listeners.push(fn);
    return () => { this.listeners = this.listeners.filter(l => l !== fn); };
  }

  private notify() {
    this.listeners.forEach(fn => fn());
  }

  public async configure(settings: AppSettings) {
    this.config = settings;
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    this.notify();
  }

  private async authorizedFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const headers = new Headers(options.headers);
    if (this.config?.apiKey) {
        headers.set('Authorization', `Bearer ${this.config.apiKey}`);
    }
    return fetch(url, { ...options, headers });
  }
  
  // --- DATA FETCHING ORCHESTRATION ---

  public async getDailySchedule(date: string): Promise<MovieSession[]> {
    if (this.config?.serverUrl) {
        try {
            const res = await this.authorizedFetch(`${this.config.serverUrl}/schedule/day?date=${date}`);
            if (!res.ok) throw new Error(`Server error: ${res.status}`);
            const data = await res.json();
            const sessions = data.sessions || [];
            await LocalDB.clearAndBulkAddSessions(sessions);
            this.updateStatus('connected');
        } catch (error) {
            console.error("[API] Failed to fetch daily schedule:", error);
            this.updateStatus('error');
            if (this.config.useMockDataFallback) {
                const mockSessions = this.generateMockScheduleForDates([date], 8);
                await LocalDB.clearAndBulkAddSessions(mockSessions);
            }
        }
    } else {
        this.updateStatus('idle'); // Mock mode
        const mockSessions = this.generateMockScheduleForDates([date], 8);
        await LocalDB.clearAndBulkAddSessions(mockSessions);
    }
    return LocalDB.getSessionsByDate(date);
  }

  public async getWeeklyHallSchedule(hallName: string, centerDate: string): Promise<MovieSession[]> {
      const dates = getWeeklyDates(centerDate);
      const from = formatDate(dates[0]);
      const to = formatDate(dates[dates.length - 1]);

      if (this.config?.serverUrl) {
          try {
              const res = await this.authorizedFetch(`${this.config.serverUrl}/schedule/week?hall=${hallName}&from=${from}&to=${to}`);
              if (!res.ok) throw new Error(`Server error: ${res.status}`);
              const data = await res.json();
              const sessions = data.sessions || [];
              await LocalDB.clearAndBulkAddSessions(sessions);
              this.updateStatus('connected');
          } catch (error) {
              console.error(`[API] Failed to fetch weekly schedule for hall ${hallName}:`, error);
              this.updateStatus('error');
              if (this.config.useMockDataFallback) {
                  const mockSessions = this.generateMockScheduleForDates(dates.map(formatDate), 8).filter(s => s.hall_name === hallName);
                  await LocalDB.clearAndBulkAddSessions(mockSessions);
              }
          }
      } else {
          this.updateStatus('idle'); // Mock mode
          const mockSessions = this.generateMockScheduleForDates(dates.map(formatDate), 8).filter(s => s.hall_name === hallName);
          await LocalDB.clearAndBulkAddSessions(mockSessions);
      }
      return LocalDB.getSessionsByHallForPeriod(hallName, from, to);
  }


  public async setSessionStatus(session: MovieSession, newStatus: ContentStatus): Promise<void> {
    if (this.config?.serverUrl) {
      try {
        const res = await this.authorizedFetch(`${this.config.serverUrl}/status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: session.id, status: newStatus }),
        });
        if (!res.ok) throw new Error('Failed to update status on server');
        // Refresh data for the day to get confirmation
        await this.getDailySchedule(session.date);
      } catch (e) {
        console.error("[API] Set status failed:", e);
        this.updateStatus('error');
      }
    } else {
      // Mock mode: update directly in DB
      await LocalDB.updateSessionStatus(session.id, newStatus);
      this.notify();
    }
  }

  public async syncData() {
       if (!this.config?.serverUrl) {
          this.updateStatus('idle'); 
      } else {
          try {
              await new Promise(r => setTimeout(r, 1000)); // UX delay
              const res = await this.authorizedFetch(`${this.config.serverUrl}/health`);
              this.updateStatus(res.ok ? 'connected' : 'error');
          } catch {
              this.updateStatus('error');
          }
      }
  }

  private updateStatus(newStatus: ConnectionStatus) {
      if (this.connectionStatus !== newStatus) {
          this.connectionStatus = newStatus;
          this.lastSyncTime = new Date();
          this.notify();
      }
  }

  // --- MOCK DATA GENERATOR ---
  private generateMockScheduleForDates(dates: string[], hallCount: number): MovieSession[] {
      const allSessions: MovieSession[] = [];
      dates.forEach(date => {
        allSessions.push(...this.generateMockSchedule(date, hallCount));
      });
      return allSessions;
  }

  private generateMockSchedule(date: string, hallCount: number): MovieSession[] {
      const movies = [
          { name: "Дюна: Часть вторая", duration: 166, format: "2D", age: 12 },
          { name: "Кунг-фу Панда 4", duration: 94, format: "3D", age: 6 },
          { name: "Онегин", duration: 133, format: "2D", age: 12 },
          { name: "Лёд 3", duration: 134, format: "2D", age: 6 },
          { name: "Мастер и Маргарита", duration: 157, format: "2D", age: 18 },
          { name: "Адам и Ева", duration: 95, format: "2D", age: 16 }
      ];
      const statuses: ContentStatus[] = ['ready_hall', 'on_storage', 'download_hall', 'no_keys', 'missing'];
      const sessions: MovieSession[] = [];
      
      for (let h = 1; h <= hallCount; h++) {
          let currentTime = 10 * 60; 
          const sessionCount = 4 + Math.floor(Math.random() * 3);

          for (let s = 0; s < sessionCount; s++) {
              const movie = movies[Math.floor(Math.random() * movies.length)];
              const startTime = currentTime + Math.floor(Math.random() * 20); 
              const startH = Math.floor(startTime / 60);
              const startM = startTime % 60;
              const endH = Math.floor((startTime + movie.duration) / 60);
              const endM = (startTime + movie.duration) % 60;
              const timeStr = `${startH.toString().padStart(2, '0')}:${startM.toString().padStart(2, '0')}`;
              const endTimeStr = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;
              
              const now = new Date();
              const sessStart = new Date(`${date}T${timeStr}:00`);
              const sessEnd = new Date(`${date}T${endTimeStr}:00`);
              let timeStatus: MovieSession['time_status'] = 'active';
              if (new Date(date).toDateString() === now.toDateString()) {
                  if (now > sessEnd) timeStatus = 'finished';
                  else if (now >= sessStart) timeStatus = 'running';
              } else if (new Date(date) < new Date(now.toDateString())) {
                   timeStatus = 'finished';
              }

              sessions.push({
                  id: `mock_${h}_${s}_${date}`,
                  hall_name: h.toString(),
                  date: date,
                  time: timeStr, end_time: endTimeStr, duration: movie.duration,
                  age_limit: movie.age, name: movie.name,
                  dcp_package_name: `${movie.name.toUpperCase().replace(/ /g, '_')}_FTR`,
                  memorandum_period_end: null, Format: movie.format,
                  Tickets: Math.floor(Math.random() * 200), vertical_poster: '',
                  time_status: timeStatus,
                  content_status: statuses[Math.floor(Math.random() * statuses.length)],
                  distributor: "Mock Distributor", credits_offset_from_end: 0,
                  credits_display_from_start: "00:02:00", credits_display_from_end: "00:05:00",
                  is_new: Math.random() > 0.8, is_subtitled: Math.random() > 0.9,
              });
              currentTime = startTime + movie.duration + 20;
          }
      }
      return sessions.sort((a,b) => a.time.localeCompare(b.time));
  }
}

export const BackendService = new AggregationService();