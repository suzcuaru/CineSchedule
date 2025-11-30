
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
  // Range: Current Date to +5 days (6 days total)
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
    days.push({
      date: d,
      isCurrentMonth: false,
      isToday: formatDate(d) === todayStr,
      isSelected: formatDate(d) === currentDateStr
    });
  }

  for (let i = 1; i <= daysInMonth; i++) {
    const d = new Date(year, month, i);
    days.push({
      date: d,
      isCurrentMonth: true,
      isToday: formatDate(d) === todayStr,
      isSelected: formatDate(d) === currentDateStr
    });
  }

  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(year, month + 1, i);
    days.push({
      date: d,
      isCurrentMonth: false,
      isToday: formatDate(d) === todayStr,
      isSelected: formatDate(d) === currentDateStr
    });
  }

  return days;
};

export const generateDCPName = (movieName: string, format: string, dateStr: string, is3D: boolean, isSubtitled: boolean) => {
    // Generate a sanitized pseudo-DCP name if missing
    const dateClean = dateStr.replace(/-/g, '');
    const cleanName = movieName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 15);
    const langString = isSubtitled ? 'EN-RU' : 'RU-XX';
    return `${cleanName}_FTR_S_${langString}_51_2K_IOP_${dateClean}_SMPTE_${is3D ? '3D' : '2D'}_OV`;
};
