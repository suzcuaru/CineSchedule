
export type ContentStatus = 
  | 'ready_hall'        // Зеленый: В зале (готов к показу)
  | 'on_storage'        // Салатовый: На сервере хранения (надо перекинуть)
  | 'download_hall'     // Желтый: Качается в зал
  | 'download_storage'  // Оранжевый: Качается на сервер
  | 'distributor'       // Фиолетовый: На сервере дистрибьютора
  | 'no_keys'           // Синий: Нет ключей (KDM)
  | 'no_status'         // Серый: Статус не определен
  | 'missing';          // Красный: Не найден

export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
}

export interface HallCategory {
  id: number;
  name: string;
}

export interface CinemaFormat {
  id: number;
  name: string;
}

export interface Advertisement {
  id: number;
  name: string;
  duration?: number;
}

export interface GoogleSheetData {
  id: string;
  [key: string]: any;
}

export type ViewMode = 
  | { type: 'dashboard' } 
  | { type: 'schedule' }  
  | { type: 'releases' }
  | { type: 'remote_control' }
  | { type: 'hall_weekly', hallName: string, centerDate: string }
  | { type: 'settings' }
  | { type: 'info' }
  | { type: 'updates' };

export interface Hall {
  id: number;
  name: string;
  category_id?: number;
  category_name?: string;
  clean_name?: string;     
}

export interface Movie {
  id: string | number;
  name: string;
  duration?: number;
  age_limit?: number;
  poster?: string; // Старый формат (URL или Base64)
  vertical_poster?: { // Новый формат из базы
      image: string; // Base64 string
      [key: string]: any;
  };
  description?: string;
  genres?: string[];
  releases?: { duration: number; [key: string]: any }[];
  date_start?: string;
  [key: string]: any;
}

export interface MovieSession {
  id: string;
  name: string;
  hall_name: string;
  time: string;
  end_time: string;
  duration: number; // Duration in minutes
  Format: string;
  Tickets: number;
  content_status: ContentStatus;
  date: string;
  
  // New Extended Fields
  ads_duration: number; // Total ads (embedded + commercial) in minutes
  embedded_ads_duration: number; // Specifically embedded ("Вшитые")
  commercial_ads_duration: number; // Commercial ("Таблица")
  commercial_ads?: { name: string; duration: number }[]; // List of commercial ads
  
  age_limit: number;
  is_new?: boolean;
  poster?: string;
  
  // Google Sheets Specific
  dcp_package_name?: string;
  delivery_type?: string;
  
  // Additional fields for UI
  time_status?: 'future' | 'upcoming' | 'playing' | 'finished';
  credits_display_from_start?: string;
  credits_display_from_end?: string;
  light_on_start?: string; // Свет ON 100% (с начала)
  light_on_end?: string; // Свет ON 100% (с конца)
  light_on_end_half?: string; // Свет ON 50% (с конца)
  distributor?: string;
  is_subtitled?: boolean;
}

export interface AppSettings {
  serverUrl: string;
  apiKey: string;
  highlightCurrent: boolean;
  highlightColor: string; 
  fontSize: 'small' | 'medium' | 'large';
  cardDensity: 'compact' | 'standard' | 'expanded';
  gridColumns: 3 | 4 | 5;
  theme: 'default' | 'sepia' | 'dusk';
  enableAnimations: boolean;
  animationVariant: 'fade' | 'slide' | 'zoom';
  statusDisplayStyle: 'solid' | 'outline' | 'dot';
  customStatusColors: Record<ContentStatus, string>;
  autoRefreshInterval: number;
  urlBypass?: boolean;
  useMockDataFallback: boolean;
  mockMode: boolean; // New Field
  workingHoursStart: string; // Start of working day (e.g., "09:00")
  workingHoursEnd: string; // End of working day (e.g., "02:00" for next day)
}

export const CONTENT_STATUS_CONFIG: Record<ContentStatus, { label: string, color: string, border: string, bg: string, glow: string }> = {
  ready_hall: { label: 'В зале (Готов)', color: 'text-emerald-400', border: 'border-emerald-500', bg: 'bg-emerald-500', glow: 'shadow-emerald-500/20' },
  on_storage: { label: 'На хранилище (TMS)', color: 'text-lime-400', border: 'border-lime-400', bg: 'bg-lime-400', glow: 'shadow-lime-400/20' },
  download_hall: { label: 'Качается в зал', color: 'text-yellow-400', border: 'border-yellow-400', bg: 'bg-yellow-400', glow: 'shadow-yellow-400/20' },
  download_storage: { label: 'Качается на TMS', color: 'text-orange-400', border: 'border-orange-500', bg: 'bg-orange-500', glow: 'shadow-orange-500/20' },
  distributor: { label: 'У дистрибьютора', color: 'text-purple-400', border: 'border-purple-500', bg: 'bg-purple-500', glow: 'shadow-purple-500/20' },
  no_keys: { label: 'Нет ключей (KDM)', color: 'text-blue-400', border: 'border-blue-500', bg: 'bg-blue-500', glow: 'shadow-blue-500/20' },
  no_status: { label: 'Без статуса', color: 'text-slate-400', border: 'border-slate-500', bg: 'bg-slate-600', glow: 'shadow-none' },
  missing: { label: 'Не найдено (SOS)', color: 'text-red-500', border: 'border-red-600', bg: 'bg-red-600', glow: 'shadow-red-600/20' }
};
