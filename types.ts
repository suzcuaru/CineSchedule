
export type ContentStatus = 
  | 'ready_hall'        // Зеленый: В зале (готов к показу)
  | 'on_storage'        // Салатовый: На сервере хранения (надо перекинуть)
  | 'download_hall'     // Желтый: Качается в зал
  | 'download_storage'  // Оранжевый: Качается на сервер
  | 'distributor'       // Фиолетовый: На сервере дистрибьютора
  | 'no_keys'           // Синий: Нет ключей (KDM)
  | 'no_status'         // Серый: Статус не определен
  | 'missing';          // Красный: Не найден

export const HALL_SPECIFIC_STATUSES: ContentStatus[] = ['ready_hall', 'download_hall', 'no_keys'];
export const GLOBAL_STATUSES: ContentStatus[] = ['on_storage', 'download_storage', 'distributor', 'no_status', 'missing'];

export type ViewMode = 
  | { type: 'dashboard' } 
  | { type: 'schedule' }  
  | { type: 'hall_weekly', hallName: string, centerDate: string }
  | { type: 'settings' }
  | { type: 'info' }
  | { type: 'updates' };

export interface Hall {
  id: number;
  name: string;
  category_id?: number;
  hall_category?: HallCategory; // Вложенный объект категории, если есть
  // Новые поля для UI
  clean_name?: string;     // Имя только из цифр (например "1" из "1 Большой")
  category_name?: string;  // Название категории (например "VIP")
}

export interface MovieSession {
  id: string; 
  hall_name: string;
  date: string;
  time: string; 
  end_time: string; 
  duration: number; 
  ads_duration: number; // Общая длительность рекламного блока (включая вшитые)
  embedded_trailers_duration: number; // Длительность только вшитых трейлеров
  commercial_ads: { name: string, duration: number }[]; // Список коммерческих роликов
  age_limit: number;
  name: string;
  dcp_package_name: string;
  memorandum_period_end: string | null;
  Format: string; 
  Tickets: number;
  vertical_poster: string;
  time_status: 'active' | 'inactive' | 'cancelled' | 'finished' | 'running';
  content_status: ContentStatus;
  status_updated_at?: number; // Timestamp of last status change
  distributor: string;
  credits_offset_from_end: number; 
  credits_display_from_start: string; 
  credits_display_from_end: string; 
  is_new: boolean;
  is_subtitled: boolean;
}

export interface HallCategory {
  id: number;
  name: string;
  description: string;
}

export interface CinemaFormat {
  id: number;
  name: string; // 2D, 3D, IMAX etc
}

export interface Advertisement {
  id: number; // Это будет show_id
  total_duration: number; // Вычисленная сумма всех роликов
  advertisements?: any[]; // Список самих роликов
  title?: string;
  type?: string;
}

export interface GoogleSheetData {
  id: string;
  key: string;
  value: any;
  last_updated: string;
}

export type RefreshInterval = 0 | 5 | 15 | 30 | 60 | 1440; // minutes, 1440 = 1 day

export interface AppSettings {
  serverUrl: string;
  apiKey: string;
  useMockDataFallback: boolean;
  highlightCurrent: boolean;
  fontSize: 'small' | 'medium' | 'large';
  cardDensity: 'compact' | 'default';
  theme: 'default' | 'sepia' | 'dusk';
  enableAnimations: boolean;
  autoRefreshInterval: RefreshInterval;
}

export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
}

// Remote DB Interfaces
export interface RemoteTableColumn {
  name: string;
  type: string;
  not_null?: boolean;
  primary_key?: boolean;
}

// Updated to match the new wide-table structure
export interface RemoteStatusRecord {
  movies_name: string;
  status_global?: string;
  updated_at: number;
  [key: string]: any; // Allow dynamic status_halls_X keys
}

export interface AnalysisResult {
  summary: string;
  technical_notes: string[];
  schedule_efficiency: string;
  alerts: string[];
}

export const CONTENT_STATUS_CONFIG: Record<ContentStatus, { label: string, color: string, border: string, bg: string, glow: string }> = {
  ready_hall: { 
    label: 'В зале (Готов)', 
    color: 'text-emerald-400', 
    border: 'border-emerald-500',
    bg: 'bg-emerald-500',
    glow: 'shadow-emerald-500/20'
  },
  on_storage: { 
    label: 'На хранилище (TMS)', 
    color: 'text-lime-400', 
    border: 'border-lime-400',
    bg: 'bg-lime-400',
    glow: 'shadow-lime-400/20'
  },
  download_hall: { 
    label: 'Качается в зал', 
    color: 'text-yellow-400', 
    border: 'border-yellow-400',
    bg: 'bg-yellow-400',
    glow: 'shadow-yellow-400/20'
  },
  download_storage: { 
    label: 'Качается на TMS', 
    color: 'text-orange-400', 
    border: 'border-orange-500',
    bg: 'bg-orange-500',
    glow: 'shadow-orange-500/20'
  },
  distributor: { 
    label: 'У дистрибьютора', 
    color: 'text-purple-400', 
    border: 'border-purple-500',
    bg: 'bg-purple-500',
    glow: 'shadow-purple-500/20'
  },
  no_keys: { 
    label: 'Нет ключей (KDM)', 
    color: 'text-blue-400', 
    border: 'border-blue-500', 
    bg: 'bg-blue-500',
    glow: 'shadow-blue-500/20'
  },
  no_status: { 
    label: 'Без статуса', 
    color: 'text-slate-400', 
    border: 'border-slate-500', 
    bg: 'bg-slate-600', 
    glow: 'shadow-none' 
  },
  missing: { 
    label: 'Не найдено (SOS)', 
    color: 'text-red-500', 
    border: 'border-red-600',
    bg: 'bg-red-600',
    glow: 'shadow-red-600/20'
  }
};