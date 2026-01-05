
import { AppSettings, MovieSession, ContentStatus, Hall, Advertisement } from '../types';
import { LocalDB } from './database';
import { formatDate, normalizeMovieTitle, calculateEndTime, parseDurationToMinutes, parseDurationToSeconds, minutesToShortTime, safeString } from '../services/dataService';
import { seedMockData } from '../services/mockDataService';

export type ConnectionStatus = 'connected' | 'error' | 'pending' | 'idle';

const SETTINGS_STORAGE_KEY = 'CineSchedule_Config_v4_Plain';

class AggregationService {
  public config: AppSettings;
  public connectionStatus: ConnectionStatus = 'idle';
  public serverVersion: string | null = null;
  public lastSyncStep: string = '';
  public lastSyncTimestamp: number | null = null;
  private isSyncingInProgress: boolean = false;
  private listeners: (() => void)[] = [];
  // Кэш ручных статусов в памяти для мгновенного доступа
  private manualStatusesCache = new Map<string, Record<string, ContentStatus>>();

  constructor() {
    this.config = this.getStoredSettings();
    const lastTime = localStorage.getItem('lastSyncTime');
    if (lastTime) this.lastSyncTimestamp = parseInt(lastTime);
    
    // Очистка старых статусов при запуске
    this.cleanupOldStatuses().catch(console.error);
    
    this.initNetwork().catch(console.error);
  }

  private getStoredSettings(): AppSettings {
    const defaults: AppSettings = { 
        serverUrl: '', apiKey: '', highlightCurrent: true, 
        highlightColor: '#6366f1',
        enableAnimations: true, 
        animationVariant: 'slide',
        fontSize: 'medium', cardDensity: 'standard', 
        gridColumns: 4, theme: 'default', 
        statusDisplayStyle: 'solid',
        customStatusColors: {
            ready_hall: '#10b981', on_storage: '#a3e635', download_hall: '#facc15',
            download_storage: '#f97316', distributor: '#a855f7', no_keys: '#3b82f6',
            no_status: '#64748b', missing: '#ef4444'
        },
        autoRefreshInterval: 15,
        urlBypass: false,
        useMockDataFallback: true,
        mockMode: false,
        workingHoursStart: '09:00',
        workingHoursEnd: '02:00'
    };
    
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (stored) {
        try { 
            const parsed = JSON.parse(stored);
            return { 
                ...defaults, 
                ...parsed,
                customStatusColors: { ...defaults.customStatusColors, ...(parsed.customStatusColors || {}) }
            }; 
        } catch (e) { 
            return defaults; 
        }
    }
    return defaults;
  }

  private async initNetwork() {
    if (this.config.serverUrl) {
        await this.checkConnection();
    }
    this.notify();
  }

  private normalizeUrl(url: string): string {
    if (!url) return '';
    let normalized = url.trim();
    if (!normalized.startsWith('http')) normalized = 'http://' + normalized;
    return normalized.replace(/\/+$/, '');
  }

  private persistSettings() { 
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(this.config)); 
  }

  public subscribe(fn: () => void) {
    this.listeners.push(fn);
    return () => { this.listeners = this.listeners.filter(l => l !== fn); };
  }

  private notify() { this.listeners.forEach(fn => fn()); }

  public async testAndSaveConnection(url: string, apiKey: string): Promise<boolean> {
      this.config = { ...this.config, serverUrl: url, apiKey };
      this.persistSettings();
      const isAlive = await this.checkConnection(true);
      if (isAlive) { 
          await this.syncAllData(false); 
          return true; 
      }
      return false;
  }
  
  public async saveSetting(key: keyof AppSettings, value: any) {
      if (key === 'mockMode') {
          if (value === true) {
              await seedMockData();
              this.lastSyncStep = 'Загружены демо-данные';
              this.lastSyncTimestamp = Date.now();
          } else {
              await LocalDB.wipeAllData();
              this.lastSyncStep = 'Данные очищены';
              this.lastSyncTimestamp = null;
          }
      }
      
      // @ts-ignore
      this.config[key] = value;
      this.persistSettings();
      this.notify();
  }

  public async checkConnection(emitEvents: boolean = true): Promise<boolean> {
      if (this.config.mockMode) return true;
      if (!this.config.serverUrl) return false;
      const baseUrl = this.normalizeUrl(this.config.serverUrl);
      this.lastSyncStep = 'Проверка связи...';
      if (emitEvents) this.updateStatus('pending', this.serverVersion);
      
      try {
          const response = await fetch(`${baseUrl}/`, { method: 'GET', mode: 'cors' });
          const data = await response.json();
          if (data.status === 'running') {
              this.lastSyncStep = 'Сервер активен';
              if (emitEvents) this.updateStatus('connected', data.version);
              return true;
          }
          throw new Error("Service not ready");
      } catch (e: any) {
          this.lastSyncStep = 'Ошибка: ' + e.message;
          if (emitEvents) this.updateStatus('error', null);
          return false;
      }
  }

  private async authorizedFetch(url: string, timeout = 10000, method = 'GET', body?: any): Promise<Response> {
    const headers = new Headers();
    if (method !== 'GET') headers.set('Content-Type', 'application/json');
    headers.set('Accept', 'application/json');
    if (this.config.apiKey) headers.set('Authorization', `Bearer ${this.config.apiKey}`);
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
        const response = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined, signal: controller.signal, mode: 'cors' });
        clearTimeout(id);
        return response;
    } catch (e: any) { clearTimeout(id); throw e; }
  }

  public async syncAllData(silent: boolean = false) {
    if (this.config.mockMode) {
        await seedMockData();
        this.notify();
        return;
    }

    if (!this.config.serverUrl || this.isSyncingInProgress) return;
    this.isSyncingInProgress = true;
    if (!silent) this.updateStatus('pending', this.serverVersion);
    
    const baseUrl = this.normalizeUrl(this.config.serverUrl);
    const batchResources = ["movies", "halls", "hall_categories", "shows", "formats", "advertisements"];
    
    try {
      // Сначала загружаем пакетные данные
      this.lastSyncStep = 'Запрос пакетных данных...';
      this.notify();

      const batchResponse = await this.authorizedFetch(`${baseUrl}/batch`, 60000, 'POST', { resources: batchResources });
      if (!batchResponse.ok) throw new Error(`Server Error: ${batchResponse.status}`);
      
      const raw = await batchResponse.json();
      const d = raw.data || raw;
      
      // Обрабатываем пакетные данные
      for (const res of batchResources) {
          this.lastSyncStep = `Сохранение: ${res}...`;
          this.notify();

          let items: any[] = [];
          const rawResData = d[res];

          if (res === 'advertisements') {
              // Реклама приходит как массив объектов {show_id, advertisements}
              // Сохраняем в исходном формате без обработки
              items = Array.isArray(rawResData) ? rawResData : (rawResData?.data || []);
              console.log(`[Advertisements] Загружено ${items.length} записей`);
          }
          else {
              items = Array.isArray(rawResData) ? rawResData : (rawResData?.data || []);
          }
          
          if (!Array.isArray(items)) items = [];
          await LocalDB.clearAndSave(res as any, items);
      }

      // Отдельно загружаем билеты
      this.lastSyncStep = 'Загрузка билетов...';
      this.notify();
      try {
          const ticketsResponse = await this.authorizedFetch(`${baseUrl}/tickets`, 30000, 'GET');
          if (ticketsResponse.ok) {
              const ticketsData = await ticketsResponse.json();
              const ticketMap = ticketsData?.data || ticketsData;
              let ticketItems: any[] = [];
              
              if (ticketMap && typeof ticketMap === 'object' && !Array.isArray(ticketMap)) {
                  ticketItems = Object.entries(ticketMap).map(([key, value]) => ({
                      show_id: String(key),
                      count: Number(value)
                  }));
              }
              console.log(`[Billets] Загружено ${ticketItems.length} билетов`);
              await LocalDB.clearAndSave('tickets', ticketItems);
          } else {
              console.warn(`[Billets] Не удалось загрузить билеты: ${ticketsResponse.status}`);
          }
      } catch (e: any) {
          console.warn(`[Billets] Ошибка загрузки билетов: ${e.message}`);
      }

      // Отдельно загружаем Google Sheets
      this.lastSyncStep = 'Загрузка Google Sheets...';
      this.notify();
      try {
          const sheetsResponse = await this.authorizedFetch(`${baseUrl}/google-sheets`, 30000, 'GET');
          if (sheetsResponse.ok) {
              const sheetsData = await sheetsResponse.json();
              const sheetItems = Array.isArray(sheetsData) ? sheetsData : (sheetsData?.data || []);
              console.log(`[Google Sheets] Загружено ${sheetItems.length} записей`);
              await LocalDB.clearAndSave('google_sheets', sheetItems);
          } else {
              console.warn(`[Google Sheets] Не удалось загрузить данные: ${sheetsResponse.status}`);
          }
      } catch (e: any) {
          console.warn(`[Google Sheets] Ошибка загрузки данных: ${e.message}`);
      }

      this.lastSyncStep = 'Синхронизация завершена';
      this.lastSyncTimestamp = Date.now();
      localStorage.setItem('lastSyncTime', this.lastSyncTimestamp.toString());
      await LocalDB.saveSyncMeta('global_sync');
      if (!silent) this.updateStatus('connected', this.serverVersion);
    } catch (e: any) { 
      this.lastSyncStep = 'Сбой: ' + e.message;
      if (!silent) this.updateStatus('error', null); 
    }
    finally { 
      this.isSyncingInProgress = false; 
      this.notify(); 
    }
  }

  public async getDbStats() {
      const data = await LocalDB.getAllMetadata();
      return { movies: data.movies.length, halls: data.halls.length, shows: data.shows.length, tickets: data.tickets.length };
  }

  public async getHalls(): Promise<Hall[]> {
      const data = await LocalDB.getAllMetadata();
      const filteredHalls = data.halls.filter((h: any) => {
          if (h.name === 'Выставочный') return false;
          if (h.name && h.name.includes('_') && !h.name.includes('Большой')) return false; 
          return true;
      });

      return filteredHalls.map((h: any) => {
          const cat = data.hall_categories.find((c: any) => String(c.id) === String(h.category_id));
          const num = (safeString(h.name) || "").match(/\d+/)?.[0] || "0";
          const clean = (safeString(h.name) || "").match(/^(\d+)/)?.[1] || num; 
          return { ...h, name: safeString(h.name), category_name: safeString(cat?.name), clean_name: clean };
      }).sort((a: any, b: any) => Number(a.clean_name) - Number(b.clean_name));
  }

  public async getDailySchedule(date: string): Promise<MovieSession[]> {
      const data = await LocalDB.getAllMetadata();
      // Используем кэш в памяти, если он есть, для мгновенного доступа
      let manualStatusesMap = this.manualStatusesCache;
      
      // Если кэш пуст, загружаем из базы
      if (manualStatusesMap.size === 0) {
          const manualStatuses = await LocalDB.getAllManualStatuses();
          manualStatusesMap = new Map<string, Record<string, ContentStatus>>();
          manualStatuses.forEach(entry => {
              manualStatusesMap.set(entry.movie_name, entry.hall_statuses);
          });
          // Сохраняем в кэш
          this.manualStatusesCache = manualStatusesMap;
      }
      
      const validHallIds = new Set(data.halls.map((h: any) => String(h.id)));
      const shows = data.shows.filter((s: any) => {
          const showDate = (s.date || s.datetime?.split('T')[0] || s.start_time?.split(' ')?.[0]);
          return showDate === date && validHallIds.has(String(s.hall_id));
      });
      return this.mapShowsToSessions(shows, data, manualStatusesMap);
  }

  public async getWeeklySchedule(hallName: string, dateStrings: string[]): Promise<MovieSession[]> {
      const data = await LocalDB.getAllMetadata();
      // Используем кэш в памяти, если он есть, для мгновенного доступа
      let manualStatusesMap = this.manualStatusesCache;
      
      // Если кэш пуст, загружаем из базы
      if (manualStatusesMap.size === 0) {
          const manualStatuses = await LocalDB.getAllManualStatuses();
          manualStatusesMap = new Map<string, Record<string, ContentStatus>>();
          manualStatuses.forEach(entry => {
              manualStatusesMap.set(entry.movie_name, entry.hall_statuses);
          });
          // Сохраняем в кэш
          this.manualStatusesCache = manualStatusesMap;
      }
      
      let targetHall = data.halls.find((h: any) => safeString(h.name) === hallName);
      if (!targetHall) {
         targetHall = data.halls.find((h: any) => hallName.includes(safeString(h.name)) || safeString(h.name).includes(hallName));
      }
      if (!targetHall) return [];
      const targetHallId = String(targetHall.id);
      const allowedDates = new Set(dateStrings);
      const shows = data.shows.filter((s: any) => {
          const showDate = (s.date || s.datetime?.split('T')[0] || s.start_time?.split(' ')?.[0]);
          return String(s.hall_id) === targetHallId && allowedDates.has(showDate);
      });
      return this.mapShowsToSessions(shows, data, manualStatusesMap);
  }

  private parseTimeStr(timeStr: string | number | undefined): number {
    if (!timeStr) return 0;
    if (typeof timeStr === 'number') return timeStr;
    const parts = String(timeStr).trim().split(':').map(Number);
    if (parts.length === 3) return parts[0] * 60 + parts[1] + parts[2]/60;
    if (parts.length === 2) return parts[0] + parts[1]/60;
    return Number(timeStr) || 0;
  }

  private mapShowsToSessions(shows: any[], data: any, manualStatuses?: Map<string, Record<string, ContentStatus>>): MovieSession[] {
      // Создаем единую обработку рекламы - Map по show_id
      const adsMap = new Map<number, { 
          ads: { name: string; duration: number }[], 
          totalDuration: number 
      }>();
      
      if (data.advertisements && Array.isArray(data.advertisements)) {
          data.advertisements.forEach((item: any) => {
              const showId = Number(item.show_id);
              if (showId && item.advertisements && Array.isArray(item.advertisements)) {
                  const ads = item.advertisements.map((ad: any) => ({
                      name: safeString(ad.name),
                      duration: Number(ad.duration) || 0
                  }));
                  const totalSeconds = ads.reduce((sum, ad) => sum + ad.duration, 0);
                  adsMap.set(showId, {
                      ads: ads,
                      totalDuration: totalSeconds / 60
                  });
              }
          });
      }

      return shows.map((s: any) => {
          const m = data.movies.find((x: any) => String(x.id) === String(s.movie_id));
          const h = data.halls.find((x: any) => String(x.id) === String(s.hall_id));
          const f = data.formats.find((x: any) => String(x.id) === String(s.format_id));
          const start = (s.time || s.datetime?.split('T')[1]?.substring(0, 5) || s.start_time?.split(' ')?.[1]?.substring(0, 5) || "00:00").substring(0, 5);
          const showDate = (s.date || s.datetime?.split('T')[0] || s.start_time?.split(' ')?.[0]);
          const movieName = safeString(m?.name) || "Неизвестный фильм";
          let moviePoster = m?.poster || null;
          if (!moviePoster && m?.vertical_poster && typeof m.vertical_poster === 'object' && m.vertical_poster.image) {
              moviePoster = m.vertical_poster.image;
          }
          let ticketsSold = 0;
          if (data.tickets) {
             const ticketEntry = data.tickets.find((t: any) => String(t.show_id) === String(s.id));
             if (ticketEntry) ticketsSold = Number(ticketEntry.count) || 0;
          }
          const normalizedTitle = normalizeMovieTitle(movieName);
          const sheetData = data.google_sheets?.find((row: any) => {
             // Поддерживаем как русские, так и английские названия полей
             const rowName = row.movie_name || row['Название кинофильма'] || row['Название фильма'] || row['Movie Name'] || row['Фильм'];
             if (!rowName) return false;
             return normalizeMovieTitle(safeString(rowName)) === normalizedTitle || String(rowName).trim() === movieName.trim();
          });
          
          // Парсим продолжительность фильма: сначала из releases[0].duration, потом из duration в базе, потом из Google Sheets
          let movieDuration = 0;
          if (m?.releases && Array.isArray(m.releases) && m.releases.length > 0 && m.releases[0].duration) {
              movieDuration = Number(m.releases[0].duration) || 0;
          }
          if (!movieDuration) {
              movieDuration = m?.duration || 0;
          }
          if (!movieDuration && sheetData && sheetData['Продолжительность']) {
              movieDuration = this.parseTimeStr(sheetData['Продолжительность']);
          }
          
          // Вшитая реклама из Google Sheets
          const embeddedStr = sheetData ? (sheetData['Вшитые трейлеры'] || sheetData['embedded_trailers'] || sheetData['Вшитая реклама']) : undefined;
          const embeddedAdsDuration = this.parseTimeStr(embeddedStr);
          
          // Коммерческая реклама из единой карты (adsMap)
          const showId = Number(s.id);
          const adsEntry = adsMap.get(showId);
          const commercialAdsList = adsEntry?.ads || [];
          const commercialAdsDuration = adsEntry?.totalDuration || 0;
          
          const totalAdsDuration = embeddedAdsDuration + commercialAdsDuration;
          const endTime = calculateEndTime(start, movieDuration + totalAdsDuration);
          
          // Конвертируем время в минуты для сравнения
          const timeToMinutes = (timeStr: string) => {
              const [hours, minutes] = timeStr.split(':').map(Number);
              return hours * 60 + minutes;
          };
          
          const startMinutes = timeToMinutes(start);
          const endMinutes = timeToMinutes(endTime);
          const workStartMinutes = timeToMinutes(this.config.workingHoursStart);
          const workEndMinutes = timeToMinutes(this.config.workingHoursEnd);
          
          // Определяем, является ли сеанс ночным
          let isNightSession = false;
          let sessionDayOffset = 0; // 0 = тот же день, 1 = следующий день
          
          if (workEndMinutes < workStartMinutes) {
              // Рабочий день переходит через полночь (например, 09:00 - 02:00)
              if (startMinutes >= workStartMinutes) {
                  // Дневной сеанс (09:00 - 23:59)
                  isNightSession = false;
                  sessionDayOffset = 0;
              } else if (startMinutes >= 0 && startMinutes < workEndMinutes) {
                  // Ночной сеанс (00:00 - 02:00) - конец рабочего дня
                  isNightSession = true;
                  sessionDayOffset = 1; // Следующий календарный день
              } else {
                  // Сеансы между 02:00 и 09:00 - также ночные, следующий день
                  isNightSession = true;
                  sessionDayOffset = 1;
              }
          } else {
              // Обычный рабочий день (например, 09:00 - 23:00)
              if (startMinutes >= workStartMinutes && startMinutes < workEndMinutes) {
                  isNightSession = false;
                  sessionDayOffset = 0;
              } else {
                  // Ночные сеансы
                  isNightSession = true;
                  sessionDayOffset = 1;
              }
          }
          
          // Создаём корректные даты для начала и конца сеанса
          const now = new Date();
          let sStart = new Date(`${showDate}T${start}`);
          let sEnd = new Date(`${showDate}T${endTime}`);
          
          // Если это ночной сеанс, смещаем дату на следующий день
          if (sessionDayOffset > 0) {
              sStart.setDate(sStart.getDate() + sessionDayOffset);
              sEnd.setDate(sEnd.getDate() + sessionDayOffset);
          } else if (sEnd < sStart) {
              // Если время конца меньше начала в рамках одного дня, переносим конец на следующий день
              sEnd.setDate(sEnd.getDate() + 1);
          }
          
          // Определяем статус сеанса
          let timeStatus: 'future' | 'upcoming' | 'playing' | 'finished' = 'future';
          if (now > sEnd) timeStatus = 'finished';
          else if (now >= sStart) timeStatus = 'playing';
          else if ((sStart.getTime() - now.getTime()) < 30 * 60000) timeStatus = 'upcoming';

          // Применяем ручной статус из базы данных, если он есть
          let contentStatus = (s.content_status as ContentStatus) || 'no_status';
          if (manualStatuses && h) {
              const movieStatuses = manualStatuses.get(movieName);
              if (movieStatuses) {
                  const hallId = String(h.id);
                  const manualStatus = movieStatuses[hallId];
                  if (manualStatus) {
                      contentStatus = manualStatus;
                  }
              }
          }

          return {
              id: String(s.id), name: movieName, hall_name: safeString(h?.name) || "", time: start, end_time: endTime,
              duration: movieDuration, Format: safeString(f?.name) || "2D", Tickets: ticketsSold, 
              content_status: contentStatus, date: showDate, 
              ads_duration: totalAdsDuration, embedded_ads_duration: embeddedAdsDuration, commercial_ads_duration: commercialAdsDuration,
              commercial_ads: commercialAdsList,
              age_limit: m?.age_limit || 0, poster: moviePoster,
              dcp_package_name: safeString(sheetData?.['Наименование DCP-пакета'] || sheetData?.['dcp_name']),
              distributor: safeString(sheetData?.['Дистрибьютор'] || sheetData?.['distributor']),
              delivery_type: safeString(sheetData?.['Доставка'] || sheetData?.['delivery_type']),
              time_status: timeStatus,
              credits_display_from_start: safeString(sheetData?.['Титры начало'] || sheetData?.['credits_start']),
              credits_display_from_end: safeString(sheetData?.['Титры конец'] || sheetData?.['credits_end']),
              light_on_start: safeString(sheetData?.['Свет ON 100% (с начала)'] || sheetData?.['light_on_start']),
              light_on_end_half: safeString(sheetData?.['Свет ON 50% (с конца)'] || sheetData?.['light_on_end_half']),
              light_on_end: safeString(sheetData?.['Свет ON 100% (с конца)'] || sheetData?.['light_on_end']),
              is_subtitled: (safeString(f?.name) || "").toLowerCase().includes("sub") || (movieName || "").toLowerCase().includes("sub")
          } as MovieSession;
      }).sort((a, b) => a.time.localeCompare(b.time));
  }

  public async setSessionStatus(session: MovieSession, status: ContentStatus) {
      // 1. Получаем ID зала
      const data = await LocalDB.getAllMetadata();
      const hall = data.halls.find((h: any) => safeString(h.name) === session.hall_name);
      
      if (!hall) {
          console.error('[setSessionStatus] Зал не найден:', session.hall_name);
          return;
      }
      
      const hallId = String(hall.id);
      
      // 2. Сначала обновляем кэш в памяти для мгновенного визуального эффекта
      let movieStatuses = this.manualStatusesCache.get(session.name);
      if (!movieStatuses) {
          movieStatuses = {};
          this.manualStatusesCache.set(session.name, movieStatuses);
      }
      movieStatuses[hallId] = status;
      
      // 3. Сразу уведомляем UI об изменении - визуально статус обновится мгновенно
      this.notify();
      
      // 4. Асинхронно обновляем в базе данных
      const updateDatabase = async () => {
          // Сохраняем статус в ручной таблице для фильма и зала (используем hallId)
          await LocalDB.saveManualStatus(session.name, hallId, status);
          
          // Обновляем статус конкретного сеанса
          await LocalDB.updateShowStatus(session.id, status, Date.now());
          
          // Обновляем все сеансы этого фильма в этом зале
          const movieShows = data.shows.filter((s: any) => {
              const m = data.movies.find((x: any) => String(x.id) === String(s.movie_id));
              const h = data.halls.find((x: any) => String(x.id) === String(s.hall_id));
              if (!m || !h) return false;
              return safeString(m.name) === session.name && String(h.id) === hallId;
          });
          
          // Массово обновляем все найденные сеансы
          const db = await LocalDB['dbPromise'];
          const tx = db.transaction('shows', 'readwrite');
          const store = tx.objectStore('shows');
          
          for (const show of movieShows) {
              if (show.id !== session.id) {
                  show.content_status = status;
                  show.status_updated_at = Date.now();
                  await store.put(show);
              }
          }
          await tx.done;
          
          // Отправляем на сервер
          if (this.config.serverUrl && !this.config.mockMode) {
              const baseUrl = this.normalizeUrl(this.config.serverUrl);
              this.authorizedFetch(`${baseUrl}/status`, 5000, 'POST', { session_id: session.id, status }).catch(() => {});
          }
      };
      
      // Запускаем обновление в фоне, не блокируя UI
      updateDatabase().catch(console.error);
  }

  public async getAvailableDates(): Promise<string[]> {
      const data = await LocalDB.getAllMetadata();
      const dates = new Set<string>();
      data.shows.forEach((s: any) => {
          const d = s.date || s.datetime?.split('T')[0] || s.start_time?.split(' ')?.[0];
          if (d) dates.add(d);
      });
      return Array.from(dates).sort();
  }

  private async cleanupOldStatuses() {
      // Очистка старых статусов (неиспользуемых)
      await LocalDB.cleanupOldStatuses();
  }

  private updateStatus(newStatus: ConnectionStatus, version: string | null) {
      this.connectionStatus = newStatus;
      if (version) this.serverVersion = version;
  }
}

export const BackendService = new AggregationService();
