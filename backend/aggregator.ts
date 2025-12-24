
import { AppSettings, MovieSession, ContentStatus, Hall, RemoteStatusRecord, HALL_SPECIFIC_STATUSES, GLOBAL_STATUSES } from '../types';
import { LocalDB } from './database';
import { formatDate, normalizeMovieTitle, parseDurationString, calculateEndTime, parseDurationToMinutes } from '../services/dataService';

export type ConnectionStatus = 'connected' | 'error' | 'pending' | 'idle';

const SETTINGS_STORAGE_KEY = 'CineSchedule_Settings_v2';
const TABLE_NAME_STATUSES = 'cineschedule_statuses_v3'; 
const TABLE_NAME_SETTINGS = 'cineschedule_settings_v2'; 

// Strictly matching the user's expected JSON response
interface ServerHealthResponse {
    message: string;
    version: string;
    status: string;
    timestamp: string;
}

class AggregationService {
  public config: AppSettings | null = null;
  public connectionStatus: ConnectionStatus = 'idle';
  public serverVersion: string | null = null;
  public lastSyncTime: Date | null = null;
  public lastErrorMessage: string | null = null;
  
  private listeners: (() => void)[] = [];
  
  private isRemoteTableInitialized: boolean = false;
  private isSettingsTableInitialized: boolean = false;
  
  private initTablePromise: Promise<void> | null = null;
  private isRemoteDbAvailable: boolean = true;

  constructor() {
    this.loadInitialSettings();
  }

  private normalizeUrl(url: string): string {
    if (!url) return '';
    let normalized = url.trim();
    // Remove protocol if present to store only IP:PORT as requested
    normalized = normalized.replace(/^https?:\/\//i, '');
    // remove trailing slash
    normalized = normalized.replace(/\/+$/, '');
    return normalized;
  }

  private getBaseUrl(): string {
      if (!this.config?.serverUrl) return '';
      return `http://${this.config.serverUrl}`;
  }

  private async loadInitialSettings() {
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
    const defaults: AppSettings = { 
        serverUrl: '', apiKey: '', useMockDataFallback: false, highlightCurrent: true, 
        enableAnimations: true, fontSize: 'medium', cardDensity: 'default', 
        theme: 'default', autoRefreshInterval: 0,
    };
    this.config = stored ? { ...defaults, ...JSON.parse(stored) } : defaults;
    if (this.config.serverUrl) this.config.serverUrl = this.normalizeUrl(this.config.serverUrl);
    
    // При загрузке приложения, если есть URL, проверяем связь и затем грузим настройки
    if (this.config.serverUrl) {
        this.checkConnection().then(async (isConnected) => {
            if (isConnected) {
                // Ensure tables exist before trying to pull
                await this.ensureSettingsTable().catch(() => {});
                await this.ensureRemoteTables().catch(() => {});
                
                // Pull remote settings ONLY. Do NOT sync heavy data automatically.
                await this.pullRemoteSettings(); 
            }
        }).catch(() => {}); 
    }
    this.notify();
  }

  public subscribe(fn: () => void) {
    this.listeners.push(fn);
    return () => { this.listeners = this.listeners.filter(l => l !== fn); };
  }

  private notify() { this.listeners.forEach(fn => fn()); }

  // 1. Настройка и проверка связи
  public async configure(settings: AppSettings) {
    const normalizedUrl = this.normalizeUrl(settings.serverUrl);
    const prevUrl = this.config?.serverUrl;
    
    // Update State
    this.config = { ...settings, serverUrl: normalizedUrl };
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(this.config));

    // Determine if critical connection params changed
    const urlChanged = normalizedUrl !== prevUrl;

    if (urlChanged) {
        // Reset flags if URL changed
        this.isRemoteTableInitialized = false;
        this.isSettingsTableInitialized = false;
        this.initTablePromise = null;
        this.isRemoteDbAvailable = true; 
        // Immediately set status to pending to show feedback
        this.updateStatus('pending', null);
    }

    if (normalizedUrl) {
        // Trigger connection check if URL changed OR if we are currently not connected
        if (urlChanged || this.connectionStatus !== 'connected') {
             const connected = await this.checkConnection();
             if (connected) {
                 console.log("[Config] Connection established. Syncing settings only.");
                 await this.ensureSettingsTable().catch(e => console.warn("[Config] Settings table init failed", e));
                 await this.ensureRemoteTables().catch(e => console.warn("[Config] Status table init failed", e));
                 
                 // 1. Pull Settings (Lightweight)
                 await this.pullRemoteSettings();
                 
                 // 2. STOP. Do NOT fetch movies/sessions here. 
                 // User must explicitly sync or wait for auto-refresh.
            }
        }
    } else {
        this.updateStatus('idle', null);
    }
    
    this.notify();
  }
  
  // Public method to update a single setting and persist it to DB
  public async saveSetting(key: keyof AppSettings, value: any) {
      if (!this.config) return;
      
      const prevValue = this.config[key];

      // Special handling for connection parameters:
      // We must construct the new config and pass it to configure() 
      // WITHOUT updating this.config first, so configure() can detect the change.
      if (key === 'serverUrl' || key === 'apiKey') {
          if (prevValue !== value) {
              const newConfig = { ...this.config, [key]: value };
              await this.configure(newConfig);
          }
          return;
      }

      // For standard settings, update local state immediately
      this.config = { ...this.config, [key]: value };
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(this.config));
      this.notify();

      // Push to remote DB if connected
      if (this.config.serverUrl && this.isRemoteDbAvailable && this.connectionStatus === 'connected') {
          await this.pushRemoteSetting(key, value);
      }
  }

  public async checkConnection(emitEvents: boolean = true): Promise<boolean> {
      if (!this.config?.serverUrl) return false;
      
      const baseUrl = this.getBaseUrl();

      try {
          const u = new URL(baseUrl);
          if (u.port && (parseInt(u.port) > 65535 || parseInt(u.port) < 1)) {
              throw new Error(`Invalid port: ${u.port}`);
          }
      } catch (e: any) {
          if (emitEvents) {
              this.lastErrorMessage = `Некорректный адрес: ${e.message}`;
              this.updateStatus('error', null);
          }
          return false;
      }

      if (emitEvents) this.updateStatus('pending', this.serverVersion);
      
      try {
          // STRICT REQUEST TO ROOT PATH '/'
          // Retry logic: 3 attempts, 5 seconds timeout each
          const response = await this.authorizedFetch(`${baseUrl}/`, 5000, 'GET', undefined, 3);
          const data: ServerHealthResponse = await response.json();
          
          // STRICT VALIDATION OF RESPONSE
          if (data && data.status === 'running') {
              if (emitEvents) {
                  this.lastErrorMessage = null;
                  this.updateStatus('connected', data.version);
              }
              return true;
          } else {
              throw new Error(`Invalid server status: ${data?.status || 'unknown'}`);
          }
      } catch (e: any) {
          if (emitEvents) {
            let msg = e.message;
            if (msg.includes('Failed to fetch')) msg = 'Сервер недоступен (Connection Refused)';
            if (msg.includes('NetworkError')) msg = 'Ошибка сети (CORS или DNS)';
            if (msg.includes('422')) msg = 'Ошибка валидации (422)';
            if (msg.includes('Тайм-аут')) msg = 'Сервер не отвечает (Timeout)';
            
            this.lastErrorMessage = msg;
            this.updateStatus('error', null);
          }
          return false;
      }
  }

  /**
   * Enhanced fetch with Retry logic.
   * @param url Target URL
   * @param timeout Timeout in ms per attempt (default 120s)
   * @param method HTTP method
   * @param body Payload
   * @param retries Number of retries (default 3)
   */
  private async authorizedFetch(url: string, timeout = 120000, method = 'GET', body?: any, retries = 3): Promise<Response> {
    let lastError: Error | null = null;
    const maxAttempts = retries + 1;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const headers = new Headers();
            headers.set('Content-Type', 'application/json');
            if (this.config?.apiKey) headers.set('Authorization', `Bearer ${this.config.apiKey}`);
            
            const response = await fetch(url, { 
                method, 
                headers, 
                body: body ? JSON.stringify(body) : undefined,
                signal: controller.signal, 
                mode: 'cors', 
                cache: 'no-cache' 
            });
            clearTimeout(timeoutId);
            
            // If server responds with 5xx, we might want to retry. 
            // If 4xx, it's a client error (auth, not found), so we shouldn't retry logic-wise, but return response to handle by caller.
            if (!response.ok) {
                if (response.status >= 500) {
                     throw new Error(`Server returned status ${response.status}`);
                }
                // Return 4xx responses immediately
                return response;
            }
            
            return response;
        } catch (e: any) {
            clearTimeout(timeoutId);
            lastError = e;
            
            const isAbort = e.name === 'AbortError' || e.message?.includes('aborted');
            
            // If it is the last attempt, throw the error
            if (attempt === maxAttempts) break;

            // Wait 1s before next attempt
            console.warn(`[Fetch] Attempt ${attempt} failed (${e.message}). Retrying...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    // Final error handling
    if (lastError?.name === 'AbortError' || lastError?.message?.includes('aborted')) {
          throw new Error(`Тайм-аут соединения (${timeout/1000}с) после ${retries} повторных попыток.`);
    }
    throw lastError;
  }

  // --- REMOTE DATABASE OPERATIONS ---

  private async ensureRemoteTables(): Promise<void> {
    if (!this.config?.serverUrl) return;
    if (this.isRemoteTableInitialized) return;
    if (!this.isRemoteDbAvailable) return;

    const baseUrl = this.getBaseUrl();

    try {
        let existsStatus = false;
        try {
            await this.authorizedFetch(`${baseUrl}/api/database/tables/${TABLE_NAME_STATUSES}`);
            existsStatus = true;
        } catch (e: any) {
            if (!e.message.includes('404')) throw e;
        }

        if (!existsStatus) {
            console.log(`[DB] Creating remote table ${TABLE_NAME_STATUSES}...`);
            let halls = await this.getHalls();
            // Fetch halls dynamically if local DB is empty
            if (halls.length === 0) {
                 try {
                    const hallsRes = await this.authorizedFetch(`${baseUrl}/cinema/halls`);
                    const hallsRaw = await hallsRes.json();
                    halls = this.sanitizeData(this.ensureArray(hallsRaw, 'halls'), 'id');
                 } catch (err) {}
            }
            const columns = [
                { name: "movies_name", data_type: "TEXT", is_required: true, is_primary_key: true },
                { name: "status_global", data_type: "TEXT", is_required: false },
                { name: "updated_at", data_type: "INTEGER", is_required: true }
            ];
            halls.forEach(hall => {
                columns.push({ name: `halls_${hall.id}`, data_type: "TEXT", is_required: false });
            });

            await this.authorizedFetch(`${baseUrl}/api/database/tables`, 20000, 'POST', {
                table_name: TABLE_NAME_STATUSES,
                display_name: "Статусы Фильмов (CineSchedule v3)",
                description: "Синхронизация статусов по фильмам и залам",
                columns: columns,
                is_protected: false
            });
        }
        this.isRemoteTableInitialized = true;
    } catch (e: any) {
        console.warn("[DB] Remote Statuses table init failed:", e.message);
    }
  }
  
  private async ensureSettingsTable() {
      if (this.isSettingsTableInitialized) return;
      if (!this.config?.serverUrl) return;
      
      const baseUrl = this.getBaseUrl();

      try {
          let existsSettings = false;
          try {
              await this.authorizedFetch(`${baseUrl}/api/database/tables/${TABLE_NAME_SETTINGS}`);
              existsSettings = true;
          } catch (e: any) {
              if (!e.message.includes('404')) throw e;
          }

          if (!existsSettings) {
               console.log(`[DB] Creating remote table ${TABLE_NAME_SETTINGS}...`);
               await this.authorizedFetch(`${baseUrl}/api/database/tables`, 20000, 'POST', {
                  table_name: TABLE_NAME_SETTINGS,
                  display_name: "Настройки Приложения",
                  description: "Синхронизация настроек между устройствами",
                  columns: [
                      { name: "setting_key", data_type: "TEXT", is_required: true, is_primary_key: true },
                      { name: "setting_value", data_type: "TEXT", is_required: true },
                      { name: "updated_at", data_type: "INTEGER", is_required: true }
                  ],
                  is_protected: false
               });
          }
          this.isSettingsTableInitialized = true;
      } catch (e: any) {
          console.warn("[DB] Remote Settings table init failed:", e.message);
          // If 400 bad request (e.g. reserved words), we mark as failed but don't crash
          const msg = e.message || '';
          if (msg.includes('422') || msg.includes('403') || msg.includes('405')) {
               this.isRemoteDbAvailable = false;
          }
      }
  }

  // --- SETTINGS SYNC ---

  private async pullRemoteSettings() {
      if (!this.config?.serverUrl || !this.isRemoteDbAvailable) return;
      
      const baseUrl = this.getBaseUrl();

      try {
          await this.ensureSettingsTable();
          const res = await this.authorizedFetch(`${baseUrl}/api/database/tables/${TABLE_NAME_SETTINGS}/data`);
          const json = await res.json();
          let rows: any[] = [];
          if (json.rows) rows = json.rows;
          else if (json.data) rows = json.data;
          else if (Array.isArray(json)) rows = json;

          if (rows.length === 0) return;

          const newConfig = { ...this.config };
          let hasChanges = false;

          rows.forEach((row: any) => {
              const key = row.setting_key as keyof AppSettings;
              // Do NOT overwrite connection params
              if (key === 'serverUrl' || key === 'apiKey') return;
              
              let val = row.setting_value;
              try {
                  // Try to parse boolean/number/json
                  if (val === 'true') val = true;
                  else if (val === 'false') val = false;
                  else if (!isNaN(Number(val)) && val.trim() !== '') val = Number(val);
              } catch {}
              
              if (newConfig[key] !== val) {
                  // @ts-ignore
                  newConfig[key] = val;
                  hasChanges = true;
              }
          });

          if (hasChanges) {
              console.log("[Settings] Synced from remote DB.");
              this.config = newConfig;
              localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(this.config));
              this.notify();
          }
      } catch (e) {
          console.warn("[Settings] Failed to pull settings:", e);
      }
  }

  private async pushRemoteSetting(key: string, value: any) {
      if (!this.config?.serverUrl || !this.isRemoteDbAvailable) return;
      
      const baseUrl = this.getBaseUrl();

      try {
          await this.ensureSettingsTable();
          const ts = Date.now();
          const strValue = String(value);

          const data = {
              setting_key: key,
              setting_value: strValue,
              updated_at: ts
          };

          // Try INSERT first
          const insertRes = await this.authorizedFetch(`${baseUrl}/api/database/data/insert`, 5000, 'POST', {
             table_name: TABLE_NAME_SETTINGS,
             data: data
          });

          // If INSERT fails (likely duplicate key/400 Bad Request), try UPDATE
          if (!insertRes.ok) {
             await this.authorizedFetch(`${baseUrl}/api/database/data/update`, 5000, 'PUT', {
                table_name: TABLE_NAME_SETTINGS,
                data: { setting_value: strValue, updated_at: ts },
                where_condition: `setting_key = '${key}'`
             });
          }
      } catch (e) {
          console.error(`[Settings] Failed to save setting ${key}:`, e);
      }
  }


  // --- STATUS SYNC (Existing methods) ---

  private async pullRemoteStatuses(): Promise<RemoteStatusRecord[]> {
      if (!this.config?.serverUrl || !this.isRemoteDbAvailable) return [];
      
      const baseUrl = this.getBaseUrl();

      try {
          await this.ensureRemoteTables();
          if (!this.isRemoteDbAvailable) return [];

          const res = await this.authorizedFetch(`${baseUrl}/api/database/tables/${TABLE_NAME_STATUSES}/data`);
          const json = await res.json();
          
          let rows: any[] = [];
          if (json.rows && Array.isArray(json.rows)) rows = json.rows;
          else if (json.data && Array.isArray(json.data)) rows = json.data;
          else if (Array.isArray(json)) rows = json;

          return rows.map((r: any) => ({
              ...r,
              updated_at: Number(r.updated_at)
          }));

      } catch (e) {
          console.warn("[DB] Failed to pull statuses:", e);
          return [];
      }
  }

  private async pushRemoteStatus(moviesName: string, hallId: number | null, status: string, updatedAt: number) {
      if (!this.config?.serverUrl || !this.isRemoteDbAvailable) return;
      
      const baseUrl = this.getBaseUrl();

      try {
          await this.ensureRemoteTables();
          if (!this.isRemoteDbAvailable) return;

          const isHallSpecific = HALL_SPECIFIC_STATUSES.includes(status as ContentStatus);
          
          const updateData: any = { updated_at: updatedAt };

          if (isHallSpecific && hallId !== null) {
              updateData[`halls_${hallId}`] = status;
          } else {
              updateData['status_global'] = status;
              if (hallId !== null) {
                  updateData[`halls_${hallId}`] = null;
              }
          }

          const insertData = {
              movies_name: moviesName,
              ...updateData
          };

          // Try INSERT first
          const insertRes = await this.authorizedFetch(`${baseUrl}/api/database/data/insert`, 5000, 'POST', {
             table_name: TABLE_NAME_STATUSES,
             data: insertData
          });

          // If INSERT fails, try UPDATE
          if (!insertRes.ok) {
             await this.authorizedFetch(`${baseUrl}/api/database/data/update`, 5000, 'PUT', {
                table_name: TABLE_NAME_STATUSES,
                data: updateData,
                where_condition: `movies_name = '${moviesName}'`
             });
          }

      } catch (e) {
          console.error("[DB] Failed to push status:", e);
      }
  }

  // --- DATA SYNC ---

  public async syncAllData(silent: boolean = false) {
    if (!this.config?.serverUrl) return;

    if (!silent) this.updateStatus('pending', this.serverVersion);

    const isAlive = await this.checkConnection(!silent);
    if (!isAlive) {
        if (!silent) this.updateStatus('error', null);
        return;
    }

    const baseUrl = this.getBaseUrl();

    try {
      // 0. Sync Settings first (lightweight)
      await this.pullRemoteSettings();

      // 1. Fetch CRITICAL Data
      const endpoints = [
        ['movies', 'cinema/movies'], 
        ['halls', 'cinema/halls'], 
        ['hall_categories', 'cinema/hall_categories'],
        ['formats', 'cinema/formats'], 
        ['shows', 'cinema/shows'], 
        ['tickets', 'cinema/tickets'],
        ['advertisements', 'cinema/advertisements'], 
        ['google_sheets', 'cinema/google-sheets']
      ];
      
      this.ensureRemoteTables().catch(() => {});

      const responses = await Promise.all(endpoints.map(([_, path]) => this.authorizedFetch(`${baseUrl}/${path}`)));
      const rawData = await Promise.all(responses.map(async (r) => r.ok ? await r.json() : null));
      
      const movies = this.sanitizeData(this.ensureArray(rawData[0], 'movies'), 'id');
      const halls = this.sanitizeData(this.ensureArray(rawData[1], 'halls'), 'id');
      const cats = this.sanitizeData(this.ensureArray(rawData[2], 'hall_categories'), 'id');
      const formats = this.sanitizeData(this.ensureArray(rawData[3], 'formats'), 'id');
      let shows = this.sanitizeData(this.ensureArray(rawData[4], 'shows'), 'id');
      const ticketsRaw = this.normalizeTickets(rawData[5]);
      const tickets = this.sanitizeData(ticketsRaw, 'show_id');
      const ads = this.sanitizeData(this.ensureArray(rawData[6], 'advertisements'), 'id', 'advertisements');
      const sheets = this.sanitizeData(this.ensureArray(rawData[7], 'google_sheets'), 'id', 'google_sheets'); 

      // 2. Fetch REMOTE STATUSES
      let remoteStatuses: RemoteStatusRecord[] = [];
      try {
          if (this.isRemoteDbAvailable) {
             remoteStatuses = await this.pullRemoteStatuses();
          }
      } catch (dbError: any) {
          console.warn("[Sync] Remote statuses unavailable.", dbError.message);
      }
      
      // 3. Merge Statuses
      if (remoteStatuses.length > 0) {
          const statusMap = new Map<string, RemoteStatusRecord>();
          remoteStatuses.forEach(r => {
              if(r.movies_name) statusMap.set(r.movies_name, r);
          });

          shows = shows.map((show: any) => {
              const movie = movies.find(m => Number(m.id) === Number(show.movie_id));
              if (!movie) return show;

              const normTitle = normalizeMovieTitle(movie.name || '');
              const statusRecord = statusMap.get(normTitle);

              if (statusRecord) {
                  const hallKey = `halls_${show.hall_id}`;
                  let appliedStatus = 'no_status';
                  
                  if (statusRecord[hallKey]) appliedStatus = statusRecord[hallKey];
                  else if (statusRecord['status_global']) appliedStatus = statusRecord['status_global'];

                  if (appliedStatus !== 'no_status') {
                       return { 
                          ...show, 
                          content_status: appliedStatus, 
                          status_updated_at: statusRecord.updated_at 
                      };
                  }
              }
              return show;
          });
          console.log(`[Sync] Merged statuses for ${remoteStatuses.length} movies.`);
      }

      // 4. Save to Local DB
      await Promise.all([
        LocalDB.clearAndSave('movies', movies), LocalDB.clearAndSave('halls', halls),
        LocalDB.clearAndSave('hall_categories', cats), LocalDB.clearAndSave('formats', formats),
        LocalDB.clearAndSave('shows', shows), LocalDB.clearAndSave('tickets', tickets),
        LocalDB.clearAndSave('advertisements', ads), LocalDB.clearAndSave('google_sheets', sheets),
        LocalDB.saveSyncMeta('global_sync')
      ]);
      
      if (!silent) this.updateStatus('connected', this.serverVersion);
      this.lastErrorMessage = null; 
      
      this.notify();

    } catch (e: any) {
      console.error("[Sync] Critical Error:", e);
      this.lastErrorMessage = e.message;
      if (!silent) this.updateStatus('error', null);
    }
  }

  public async syncScheduleOnly(silent: boolean = false) {
    return this.syncAllData(silent); 
  }

  public async syncStatusesOnly(silent: boolean = false) {
    if (!this.config?.serverUrl || !this.isRemoteDbAvailable) return;

    try {
        const remoteStatuses = await this.pullRemoteStatuses();
        if (remoteStatuses.length === 0) return;

        const localData = await LocalDB.getAllMetadata();
        let shows = localData.shows;
        const movies = localData.movies;

        if (shows.length === 0) return;

        const statusMap = new Map<string, RemoteStatusRecord>();
        remoteStatuses.forEach(r => {
            if(r.movies_name) statusMap.set(r.movies_name, r);
        });

        let updatesCount = 0;

        shows = shows.map((show: any) => {
            const movie = movies.find(m => Number(m.id) === Number(show.movie_id));
            if (!movie) return show;

            const normTitle = normalizeMovieTitle(movie.name || '');
            const statusRecord = statusMap.get(normTitle);

            if (statusRecord) {
                const hallKey = `halls_${show.hall_id}`;
                let appliedStatus = 'no_status';
                
                if (statusRecord[hallKey]) appliedStatus = statusRecord[hallKey];
                else if (statusRecord['status_global']) appliedStatus = statusRecord['status_global'];

                if (appliedStatus !== 'no_status') {
                     if (show.content_status !== appliedStatus || show.status_updated_at !== statusRecord.updated_at) {
                         updatesCount++;
                         return { 
                            ...show, 
                            content_status: appliedStatus, 
                            status_updated_at: statusRecord.updated_at 
                        };
                     }
                }
            }
            return show;
        });

        if (updatesCount > 0) {
            console.log(`[Sync] Updated statuses for ${updatesCount} shows (Light Sync).`);
            await LocalDB.clearAndSave('shows', shows);
            this.notify();
        }

    } catch (e) {
        console.warn("[Sync] Status sync failed:", e);
    }
  }

  // --- HELPERS ---

  private normalizeTickets(data: any): any[] {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.tickets)) return data.tickets;
    let mapData = data;
    if (data.tickets && typeof data.tickets === 'object' && !Array.isArray(data.tickets)) mapData = data.tickets;
    if (typeof mapData === 'object') {
      return Object.entries(mapData).map(([key, value]) => {
        const showId = Number(key);
        if (!isNaN(showId)) return { show_id: showId, occupied_count: Number(value) || 0 };
        return null;
      }).filter(item => item !== null);
    }
    return [];
  }

  private ensureArray<T>(data: any, preferredKey: string): T[] {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (typeof data === 'object') {
        const target = data[preferredKey];
        if (Array.isArray(target)) return target;
        for (const key of ['data', 'items', 'result', 'tickets', 'shows', 'movies']) if (Array.isArray(data[key])) return data[key];
    }
    return [];
  }

  private sanitizeData(items: any[], keyName: string, entityType?: string): any[] {
      return items.filter((item, index) => {
          if (!item || typeof item !== 'object') return false;

          if (entityType === 'advertisements') {
              if (item.show_id === undefined) {
                  const altKeys = ['showId', 'ShowId', 'ShowID'];
                  for (const k of altKeys) {
                      if (item[k] !== undefined) {
                          item.show_id = item[k];
                          break;
                      }
                  }
              }
              if (item.show_id !== undefined) item.id = Number(item.show_id);
              let realAdsArray: any[] = [];
              if (Array.isArray(item.advertisements)) {
                 if (item.advertisements.length > 0 && item.advertisements[0] && Array.isArray(item.advertisements[0].advertisements)) {
                    realAdsArray = item.advertisements[0].advertisements;
                 } else {
                    realAdsArray = item.advertisements;
                 }
              }
              item.total_duration = realAdsArray.reduce((sum: number, ad: any) => sum + (Number(ad.duration) || 0), 0);
          }

          if (keyName === 'show_id') {
              const possibleIdFields = ['show_id', 'showId', 'ShowID', 'id', 'ID'];
              let finalShowId = null;
              for (const f of possibleIdFields) {
                  if (item[f] !== undefined && item[f] !== null) {
                      finalShowId = Number(item[f]);
                      break;
                  }
              }
              if (finalShowId !== null && !isNaN(finalShowId)) item.show_id = finalShowId;
              const possibleTicketFields = ['occupied_count', 'occupiedCount', 'Tickets', 'count', 'seats'];
              let finalCount = 0;
              for (const f of possibleTicketFields) {
                  if (item[f] !== undefined && item[f] !== null) {
                      finalCount = Number(item[f]);
                      break;
                  }
              }
              item.occupied_count = isNaN(finalCount) ? 0 : finalCount;
          }

          if (entityType === 'google_sheets') {
              const titleFields = ['Название кинофильма', 'Наименование фильма', 'Название', 'Фильм'];
              let foundTitle = '';
              for (const f of titleFields) {
                  if (item[f]) {
                      foundTitle = String(item[f]);
                      break;
                  }
              }
              if (foundTitle) {
                  item.id = normalizeMovieTitle(foundTitle);
              } else if (item.key) {
                  item.id = normalizeMovieTitle(String(item.key));
              } else {
                  item.id = `unknown_${index}`;
              }
              return item.id !== undefined && item.id !== '';
          }

          if (item[keyName] === undefined || item[keyName] === null) {
              if (keyName === 'id') {
                  const idVal = item.id ?? item.ID ?? item.pk;
                  item.id = idVal !== undefined ? Number(idVal) : index + 1;
              }
          }

          if (!item.start_time && entityType !== 'google_sheets') {
              item.start_time = item.start_time || item.startTime || item.start || item.datetime;
              if (!item.start_time && item.date && item.time) item.start_time = `${item.date}T${item.time}`;
          }

          const val = item[keyName];
          return val !== undefined && val !== null && !isNaN(Number(val));
      });
  }

  private updateStatus(newStatus: ConnectionStatus, version: string | null) {
      this.connectionStatus = newStatus;
      if (version) this.serverVersion = version;
      this.lastSyncTime = new Date();
      this.notify();
  }

  public async getDbStats() {
      const data = await LocalDB.getAllMetadata();
      return { movies: data.movies.length, halls: data.halls.length, shows: data.shows.length, tickets: data.tickets.length, formats: data.formats.length };
  }
  
  public async getAvailableDates(): Promise<string[]> {
      const data = await LocalDB.getAllMetadata();
      const uniqueDates = new Set<string>();
      
      data.shows.forEach(show => {
          if (show.start_time) {
              const datePart = String(show.start_time).split('T')[0];
              if (datePart) uniqueDates.add(datePart);
          }
      });
      
      return Array.from(uniqueDates).sort();
  }

  public async getHalls(): Promise<Hall[]> {
      const data = await LocalDB.getAllMetadata();
      const visible = data.halls.filter(h => h.name && !h.name.includes('_') && /^\d/.test(h.name));
      return visible.map(hall => {
          const cat = hall.hall_category?.name || data.hall_categories.find(c => c.id === hall.category_id)?.name || '';
          const cleanName = hall.name.match(/^(\d+)/)?.[0] || hall.name;
          return { ...hall, clean_name: cleanName, category_name: cat };
      }).sort((a, b) => parseInt(a.clean_name || '0') - parseInt(b.clean_name || '0'));
  }

  private async mapShowsToSessions(shows: any[]): Promise<MovieSession[]> {
    const data = await LocalDB.getAllMetadata();
    
    return (shows.map(show => {
      const movie = data.movies.find(m => Number(m.id) === Number(show.movie_id));
      const hall = data.halls.find(h => Number(h.id) === Number(show.hall_id));
      const ticket = data.tickets.find(t => Number(t.show_id) === Number(show.id));
      const ad = data.advertisements.find(a => Number(a.id) === Number(show.id));
      
      const rawTitle = movie?.name || 'Без названия';
      const normTitle = normalizeMovieTitle(rawTitle);
      
      let distributor = movie?.distributor || 'Нет данных';
      let dcpName = movie?.dcp_name || 'Нет данных';
      let creditsEnd = '';
      let creditsStart = '';
      let embeddedAds = 0;

      const sheetRow = data.google_sheets.find((row: any) => row.id === normTitle);

      if (sheetRow) {
          dcpName = sheetRow['Наименование DCP-пакета'] || sheetRow['DCP пакет'] || sheetRow['Наименование DCP'] || dcpName;
          distributor = sheetRow['Доставка'] || sheetRow['Дистрибьютор'] || sheetRow['Прокатчик'] || distributor;
          creditsEnd = sheetRow['Свет ON 100% (с конца)'] || sheetRow['Титры конец'] || '';
          creditsStart = sheetRow['Свет ON 100% (с начала)'] || sheetRow['Титры начало'] || '';
          const trailers = sheetRow['Вшитые трейлеры'] || sheetRow['Трейлеры'];
          if (trailers) embeddedAds = parseDurationString(trailers);
      }

      let movieDurationRaw = movie?.duration;
      if (!movieDurationRaw && movie?.releases && Array.isArray(movie.releases) && movie.releases.length > 0) {
          movieDurationRaw = movie.releases[0].duration;
      }

      const movieDurationMinutes = parseDurationToMinutes(movieDurationRaw);
      
      let commercialAds: {name: string, duration: number}[] = [];
      if (ad) {
          let rawAds: any[] = [];
          if (Array.isArray(ad.advertisements)) {
            if (ad.advertisements.length > 0 && ad.advertisements[0] && Array.isArray(ad.advertisements[0].advertisements)) {
                rawAds = ad.advertisements[0].advertisements;
            } else {
                rawAds = ad.advertisements;
            }
          }
          commercialAds = rawAds.map((a: any) => ({
              name: a.name || 'Реклама',
              duration: Number(a.duration) || 0
          }));
      }

      const commercialAdsDuration = ad?.total_duration || 0;
      const totalAdsSeconds = commercialAdsDuration + embeddedAds;
      const totalSessionMinutes = movieDurationMinutes + (totalAdsSeconds / 60);

      const start = new Date(show.start_time);
      const startTimeStr = isNaN(start.getTime()) ? '00:00' : start.toTimeString().slice(0, 5);
      
      const calculatedEndTime = calculateEndTime(startTimeStr, totalSessionMinutes);

      return {
        id: show.id.toString(),
        hall_name: hall?.name || '?',
        date: String(show.start_time).split('T')[0],
        time: startTimeStr,
        end_time: calculatedEndTime,
        duration: movieDurationMinutes,
        ads_duration: totalAdsSeconds,
        embedded_trailers_duration: embeddedAds,
        commercial_ads: commercialAds,
        age_limit: movie?.age_limit || 0,
        name: rawTitle,
        dcp_package_name: dcpName === 'DCP_NOT_SET' ? 'Нет данных' : dcpName,
        Format: data.formats.find(f => f.id === show.format_id)?.name || '2D',
        Tickets: ticket?.occupied_count || 0,
        vertical_poster: movie?.poster_path || '',
        time_status: 'active',
        content_status: (show.content_status as ContentStatus) || 'no_status',
        status_updated_at: show.status_updated_at || 0,
        distributor,
        credits_display_from_start: creditsStart,
        credits_display_from_end: creditsEnd,
        memorandum_period_end: null, credits_offset_from_end: 0, is_new: false, is_subtitled: false
      } as MovieSession;
    }) as MovieSession[]).sort((a, b) => a.time.localeCompare(b.time));
  }

  public async getDailySchedule(date: string) {
    const data = await LocalDB.getAllMetadata();
    const filtered = data.shows.filter(s => s && s.start_time && s.start_time.startsWith(date));
    return this.mapShowsToSessions(filtered);
  }

  public async getWeeklyHallSchedule(hallName: string, date: string) {
    const data = await LocalDB.getAllMetadata();
    const hall = data.halls.find(h => h.name === hallName);
    if (!hall) return [];
    const filtered = data.shows.filter(s => s && s.hall_id === hall.id);
    return this.mapShowsToSessions(filtered);
  }

  public async setSessionStatus(session: MovieSession, status: ContentStatus) {
    const ts = Date.now();
    
    // 1. Update In-Memory Object (handled by UI Optimistic Update)
    session.content_status = status;
    session.status_updated_at = ts;
    
    // 2. Update LocalDB (Persist immediately)
    await LocalDB.updateShowStatus(Number(session.id), status, ts);
    
    // 3. Push to Remote DB (Background)
    // We must AWAIT this to ensure the remote update is attempted before we try to sync again.
    // This fixes the race condition where the pull request might finish before the push request creates the data.
    const halls = await this.getHalls();
    const hall = halls.find(h => h.name === session.hall_name);
    const hallId = hall ? hall.id : null;
    
    // Use normalized title as key
    const normalizedKey = normalizeMovieTitle(session.name);
    
    await this.pushRemoteStatus(normalizedKey, hallId, status, ts);
  }
}

export const BackendService = new AggregationService();
