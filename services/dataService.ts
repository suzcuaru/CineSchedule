
import { CalendarDay } from '../types';

export const formatTime = (date: Date): string => date.toTimeString().slice(0, 5);

export const minutesToFullTime = (totalMinutes: number): string => {
  const hours = Math.floor(totalMinutes / 60);
  const mins = Math.floor(totalMinutes % 60);
  const secs = Math.floor((totalMinutes * 60) % 60);
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const minutesToShortTime = (minutes: number): string => {
  const mins = Math.floor(minutes);
  const secs = Math.floor((minutes * 60) % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const calculateEndTime = (startTime: string, durationMinutes: number): string => {
  if (!startTime) return '00:00';
  const [hours, mins] = startTime.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, mins, 0, 0);
  date.setMinutes(date.getMinutes() + durationMinutes);
  return date.toTimeString().slice(0, 5);
};

export const formatDate = (date: Date): string => {
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - (offset*60*1000));
  return localDate.toISOString().split('T')[0];
};

export const getWeeklyDates = (centerDateStr: string): Date[] => {
  const center = new Date(centerDateStr);
  const dates: Date[] = [];
  for (let i = 0; i <= 5; i++) {
    const d = new Date(center);
    d.setDate(center.getDate() + i);
    dates.push(d);
  }
  return dates;
};

export const getCalendarDays = (currentDateStr: string): CalendarDay[] => {
  const current = new Date(currentDateStr);
  const year = current.getFullYear();
  const month = current.getMonth(); 
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  let startingDayOfWeek = firstDayOfMonth.getDay(); 
  if (startingDayOfWeek === 0) startingDayOfWeek = 7; 
  const days: CalendarDay[] = [];
  const todayStr = formatDate(new Date());
  for (let i = 1; i < startingDayOfWeek; i++) {
    const d = new Date(year, month, 1 - (startingDayOfWeek - i));
    days.push({ date: d, isCurrentMonth: false, isToday: formatDate(d) === todayStr, isSelected: formatDate(d) === currentDateStr });
  }
  for (let i = 1; i <= daysInMonth; i++) {
    const d = new Date(year, month, i);
    days.push({ date: d, isCurrentMonth: true, isToday: formatDate(d) === todayStr, isSelected: formatDate(d) === currentDateStr });
  }
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(year, month + 1, i);
    days.push({ date: d, isCurrentMonth: false, isToday: formatDate(d) === todayStr, isSelected: formatDate(d) === currentDateStr });
  }
  return days;
};

/**
 * Normalizes movie title for comparison.
 */
export const normalizeMovieTitle = (title: string): string => {
    if (!title) return '';
    let normalized = String(title).toLowerCase();
    
    // Удаляем шумные приставки
    const noise = [
      'предсеансовое обслуживание', 'предсеансовое обсл.', 
      'предсеансовое', 'предсеанс. обсл.', 'предсеанс', 'обслуживание'
    ];
    noise.forEach(n => {
        if (normalized.includes(n)) normalized = normalized.split(n)[0];
    });

    // Удаляем спецсимволы и скобки
    normalized = normalized.replace(/\(.*\)/g, '').replace(/\[.*\]/g, '');
    
    // Оставляем только буквы и цифры
    return normalized.replace(/[^a-zа-яё0-9]/gi, '').trim();
};

export const parseDurationToMinutes = (duration: string | number | undefined | null): number => {
    if (!duration) return 0;
    if (typeof duration === 'number') return duration;
    
    const parts = String(duration).trim().split(':').map(Number);
    if (parts.length === 3) {
        // H:MM:SS
        return parts[0] * 60 + parts[1] + (parts[2] / 60);
    }
    if (parts.length === 2) {
        // MM:SS
        return parts[0] + (parts[1] / 60);
    }
    return Number(duration) || 0;
};

export const parseDurationToSeconds = (duration: string | number | undefined | null): number => {
    if (!duration) return 0;
    if (typeof duration === 'number') return duration;
    
    const parts = String(duration).trim().split(':').map(Number);
    if (parts.length === 3) {
        // H:MM:SS
        return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    if (parts.length === 2) {
        // MM:SS
        return parts[0] * 60 + parts[1];
    }
    return Number(duration) || 0;
};

// Helper to ensure we never pass an object to React children
export const safeString = (val: any): string => {
    if (!val) return "";
    if (typeof val === 'string') return val;
    if (typeof val === 'number') return String(val);
    if (typeof val === 'object') {
        // If it's a related model object (common in Laravel/API responses), try to find a name
        if (val.name && typeof val.name === 'string') return val.name;
        // Fallback for unexpected objects
        return ""; 
    }
    return String(val);
};
