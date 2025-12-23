
import { AppSettings, MovieSession, ContentStatus, Hall } from '../types';
import { LocalDB } from './database';
import { formatDate, normalizeMovieTitle, parseDurationString, calculateEndTime, parseDurationToMinutes } from '../services/dataService';

export type ConnectionStatus = 'connected' | 'error' | 'pending' | 'idle';

const SETTINGS_STORAGE_KEY = 'CineSchedule_Settings_v2';

class AggregationService {
  public config: AppSettings | null = null;
  public connectionStatus: ConnectionStatus = 'idle';
  public serverVersion: string | null = null;
  public lastSyncTime: Date | null = null;
  public lastErrorMessage: string | null = null;
  private listeners: (() => void)[] = [];

  constructor() {
    this.loadInitialSettings();
  }

  private normalizeUrl(url: string): string {
    if (!url) return '';
    let normalized = url.trim();
    if (!/^https?:\/\//i.test(normalized)) normalized = 'http://' + normalized;
    return normalized.replace(/\/+$/, '');
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
    this.notify();
  }

  public subscribe(fn: () => void) {
    this.listeners.push(fn);
    return () => { this.listeners = this.listeners.filter(l => l !== fn); };
  }

  private notify() { this.listeners.forEach(fn => fn()); }

  public async configure(settings: AppSettings) {
    const normalizedUrl = this.normalizeUrl(settings.serverUrl);
    this.config = { ...settings, serverUrl: normalizedUrl };
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(this.config));
    this.syncAllData();
    this.notify();
  }

  private async authorizedFetch(url: string, timeout = 120000): Promise<Response> {
    const controller = new AbortController();
    const id = setTimeout(() => {
        try {
            // Попытка передать причину отмены
            controller.abort("Request timed out");
        } catch {
            controller.abort();
        }
    }, timeout);

    const headers = new Headers();
    if (this.config?.apiKey) headers.set('Authorization', `Bearer ${this.config.apiKey}`);
    
    try {
      const response = await fetch(url, { headers, signal: controller.signal, mode: 'cors', cache: 'no-cache' });
      clearTimeout(id);
      
      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }
      
      return response;
    } catch (e: any) {
      clearTimeout(id);
      // Обработка различных вариантов ошибок отмены/таймаута
      const isAbort = e.name === 'AbortError' || 
                      e.message?.includes('aborted') || 
                      e.message === 'Request timed out' ||
                      (typeof e === 'string' && e === 'Request timed out');
                      
      if (isAbort) {
          throw new Error(`Connection timed out (${timeout/1000}s). Check server URL or network.`);
      }
      throw e;
    }
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

  private normalizeTickets(data: any): any[] {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.tickets)) return data.tickets;

    let mapData = data;
    if (data.tickets && typeof data.tickets === 'object' && !Array.isArray(data.tickets)) {
      mapData = data.tickets;
    }

    if (typeof mapData === 'object') {
      return Object.entries(mapData).map(([key, value]) => {
        const showId = Number(key);
        if (!isNaN(showId)) {
          return {
            show_id: showId,
            occupied_count: Number(value) || 0
          };
        }
        return null;
      }).filter(item => item !== null);
    }

    return [];
  }

  private sanitizeData(items: any[], keyName: string, entityType?: string): any[] {
      return items.filter((item, index) => {
          if (!item || typeof item !== 'object') return false;

          // 1. Обработка Рекламы
          if (entityType === 'advertisements') {
              if (item.show_id !== undefined) item.id = Number(item.show_id);
              item.total_duration = Array.isArray(item.advertisements) 
                ? item.advertisements.reduce((sum: number, ad: any) => sum + (Number(ad.duration) || 0), 0)
                : (Number(item.duration) || 0);
          }

          // 2. Обработка Билетов
          if (keyName === 'show_id') {
              const possibleIdFields = ['show_id', 'showId', 'ShowID', 'id', 'ID'];
              let finalShowId = null;
              for (const f of possibleIdFields) {
                  if (item[f] !== undefined && item[f] !== null) {
                      finalShowId = Number(item[f]);
                      break;
                  }
              }
              
              if (finalShowId !== null && !isNaN(finalShowId)) {
                  item.show_id = finalShowId;
              }

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

          // 3. Обработка Google Таблиц
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

          // 4. Общая нормализация числовых ID
          if (item[keyName] === undefined || item[keyName] === null) {
              if (keyName === 'id') {
                  const idVal = item.id ?? item.ID ?? item.pk;
                  item.id = idVal !== undefined ? Number(idVal) : index + 1;
              }
          }

          // 5. Нормализация времени начала
          if (!item.start_time && entityType !== 'google_sheets') {
              item.start_time = item.start_time || item.startTime || item.start || item.datetime;
              if (!item.start_time && item.date && item.time) item.start_time = `${item.date}T${item.time}`;
          }

          const val = item[keyName];
          const isValid = val !== undefined && val !== null && !isNaN(Number(val));
          return isValid;
      });
  }

  public async syncAllData() {
    if (!this.config?.serverUrl) return;
    this.updateStatus('pending', this.serverVersion);
    try {
      const endpoints = [
        ['movies', 'cinema/movies'], ['halls', 'cinema/halls'], ['hall_categories', 'cinema/hall_categories'],
        ['formats', 'cinema/formats'], ['shows', 'cinema/shows'], ['tickets', 'cinema/tickets'],
        ['advertisements', 'cinema/advertisements'], ['google_sheets', 'cinema/google-sheets']
      ];
      // Увеличили таймаут до 120 сек в authorizedFetch
      const responses = await Promise.all(endpoints.map(([_, path]) => this.authorizedFetch(`${this.config!.serverUrl}/${path}`)));
      const rawData = await Promise.all(responses.map(async (r) => r.ok ? await r.json() : null));
      
      const movies = this.sanitizeData(this.ensureArray(rawData[0], 'movies'), 'id');
      const halls = this.sanitizeData(this.ensureArray(rawData[1], 'halls'), 'id');
      const cats = this.sanitizeData(this.ensureArray(rawData[2], 'hall_categories'), 'id');
      const formats = this.sanitizeData(this.ensureArray(rawData[3], 'formats'), 'id');
      const shows = this.sanitizeData(this.ensureArray(rawData[4], 'shows'), 'id');
      
      const ticketsRaw = this.normalizeTickets(rawData[5]);
      const tickets = this.sanitizeData(ticketsRaw, 'show_id');
      
      const ads = this.sanitizeData(this.ensureArray(rawData[6], 'advertisements'), 'id', 'advertisements');
      const sheets = this.sanitizeData(this.ensureArray(rawData[7], 'google_sheets'), 'id', 'google_sheets'); 

      console.log(`[Sync] Summary: movies:${movies.length}, halls:${halls.length}, shows:${shows.length}, tickets:${tickets.length}, sheets:${sheets.length}`);

      await Promise.all([
        LocalDB.clearAndSave('movies', movies), LocalDB.clearAndSave('halls', halls),
        LocalDB.clearAndSave('hall_categories', cats), LocalDB.clearAndSave('formats', formats),
        LocalDB.clearAndSave('shows', shows), LocalDB.clearAndSave('tickets', tickets),
        LocalDB.clearAndSave('advertisements', ads), LocalDB.clearAndSave('google_sheets', sheets),
        LocalDB.saveSyncMeta('global_sync')
      ]);
      this.updateStatus('connected', '3.2');
    } catch (e: any) {
      console.error("[Sync] Error:", e);
      this.lastErrorMessage = e.message;
      this.updateStatus('error', null);
    }
  }

  public async syncScheduleOnly() {
    if (!this.config?.serverUrl) return;
    this.updateStatus('pending', this.serverVersion);
    try {
      const endpoints = [
        ['shows', 'cinema/shows'], ['tickets', 'cinema/tickets']
      ];
      const responses = await Promise.all(endpoints.map(([_, path]) => this.authorizedFetch(`${this.config!.serverUrl}/${path}`)));
      const rawData = await Promise.all(responses.map(async (r) => r.ok ? await r.json() : null));
      
      const shows = this.sanitizeData(this.ensureArray(rawData[0], 'shows'), 'id');
      
      const ticketsRaw = this.normalizeTickets(rawData[1]);
      const tickets = this.sanitizeData(ticketsRaw, 'show_id');

      console.log(`[ScheduleSync] shows:${shows.length}, tickets:${tickets.length}`);

      await Promise.all([
        LocalDB.clearAndSave('shows', shows), 
        LocalDB.clearAndSave('tickets', tickets),
        LocalDB.saveSyncMeta('schedule_sync')
      ]);
      this.updateStatus('connected', this.serverVersion);
    } catch (e: any) {
      console.error("[ScheduleSync] Error:", e);
      this.lastErrorMessage = e.message;
      this.updateStatus('error', null);
    }
  }

  private updateStatus(newStatus: ConnectionStatus, version: string | null) {
      this.connectionStatus = newStatus;
      this.serverVersion = version;
      this.lastSyncTime = new Date();
      this.notify();
  }

  public async getDbStats() {
      const data = await LocalDB.getAllMetadata();
      return { movies: data.movies.length, halls: data.halls.length, shows: data.shows.length, tickets: data.tickets.length, formats: data.formats.length };
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
      const totalAdsSeconds = (ad?.total_duration || 0) + embeddedAds;
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
        age_limit: movie?.age_limit || 0,
        name: rawTitle,
        dcp_package_name: dcpName === 'DCP_NOT_SET' ? 'Нет данных' : dcpName,
        Format: data.formats.find(f => f.id === show.format_id)?.name || '2D',
        Tickets: ticket?.occupied_count || 0,
        vertical_poster: movie?.poster_path || '',
        time_status: 'active',
        content_status: (show.content_status as ContentStatus) || 'no_status',
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

  public async getAvailableDates(): Promise<string[]> {
      const data = await LocalDB.getAllMetadata();
      const dates: string[] = (data.shows || [])
          .filter((s: any) => s && s.start_time)
          .map((s: any) => String(s.start_time).split('T')[0]);
      return Array.from(new Set<string>(dates)).sort();
  }

  public async getWeeklyHallSchedule(hallName: string, date: string) {
    const data = await LocalDB.getAllMetadata();
    const hall = data.halls.find(h => h.name === hallName);
    if (!hall) return [];
    const filtered = data.shows.filter(s => s && s.hall_id === hall.id);
    return this.mapShowsToSessions(filtered);
  }

  public async setSessionStatus(session: MovieSession, status: ContentStatus) {
    session.content_status = status;
    this.notify();
  }
}

export const BackendService = new AggregationService();
