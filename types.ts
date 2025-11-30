
export type ContentStatus = 
  | 'ready_hall'        // Зеленый: В зале (готов к показу)
  | 'on_storage'        // Салатовый: На сервере хранения (надо перекинуть)
  | 'download_hall'     // Желтый: Качается в зал
  | 'download_storage'  // Оранжевый: Качается на сервер
  | 'distributor'       // Фиолетовый: На сервере дистрибьютора
  | 'no_keys'           // Синий: Нет ключей (KDM)
  | 'no_status'         // Серый: Статус не определен
  | 'missing';          // Красный: Не найден

export type ViewMode = 
  | { type: 'dashboard' } // NEW: Summary Home Page
  | { type: 'schedule' }  // RENAMED: Old Dashboard (Grid)
  | { type: 'hall_weekly', hallName: string, centerDate: string }
  | { type: 'settings' }
  | { type: 'info' }
  | { type: 'updates' };

export interface MovieSession {
  id: string; 
  hall_name: string;
  date: string;
  time: string; 
  end_time: string; 
  duration: number; 
  age_limit: number;
  name: string;
  dcp_package_name: string;
  memorandum_period_end: string | null;
  Format: string; 
  Tickets: number;
  vertical_poster: string;
  time_status: 'active' | 'inactive' | 'cancelled' | 'finished' | 'running';
  content_status: ContentStatus;
  distributor: string;
  credits_offset_from_end: number; 
  credits_display_from_start: string; 
  credits_display_from_end: string; 
  is_new: boolean;
  is_subtitled: boolean;
}

export interface AppSettings {
  serverUrl: string;
  apiKey: string;
  useMockDataFallback: boolean;
  highlightCurrent: boolean;
  fontSize: 'small' | 'medium' | 'large';
  cardDensity: 'compact' | 'default';
  theme: 'default' | 'matrix' | 'cinema';
  // FIX: Added 'enableAnimations' property to resolve type errors in components/SystemViews.tsx and backend/aggregator.ts.
  enableAnimations: boolean;
}

// --- UI HELPERS ---

export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
}

// --- AI ANALYSIS ---

export interface AnalysisResult {
  summary: string;
  technical_notes: string[];
  schedule_efficiency: string;
  alerts: string[];
}

// --- DB STATUS RECORD ---
export interface StatusRecord {
    id: string; 
    session_id: string; 
    status: ContentStatus;
}

// --- CONFIG & STATUS ---

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