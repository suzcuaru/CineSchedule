
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { formatDate, getWeeklyDates } from '../services/dataService';
import { BackendService } from '../backend/aggregator'; 
import { MovieSession, ViewMode, AppSettings, Hall, ContentStatus } from '../types';

export type RefreshStatus = 'idle' | 'loading' | 'success' | 'error';

export const useAppLogic = () => {
  const [currentDate, setCurrentDate] = useState<string>(formatDate(new Date()));
  const [viewMode, setViewMode] = useState<ViewMode>({ type: 'dashboard' });
  const [viewHistory, setViewHistory] = useState<ViewMode[]>([]);
  const [isLogoMenuOpen, setIsLogoMenuOpen] = useState(false);
  
  // Загружаем настройки из BackendService (который уже загрузил их из localStorage)
  const [appSettings, setAppSettings] = useState<AppSettings>(BackendService.config);

  const [currentDashboardSessions, setCurrentDashboardSessions] = useState<MovieSession[]>([]);
  const [currentWeeklyHallSessions, setCurrentWeeklyHallSessions] = useState<MovieSession[]>([]);
  
  const [isLoading, setIsLoading] = useState<boolean>(true); 
  const [refreshStatus, setRefreshStatus] = useState<RefreshStatus>('idle'); 
  const [refreshKey, setRefreshKey] = useState(Date.now());
  const [halls, setHalls] = useState<Hall[]>([]);
  const [availableDates, setAvailableDates] = useState<string[]>([]); // New State
  const [selectedMovieName, setSelectedMovieName] = useState<string | null>(null);

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
        const hallsData = await BackendService.getHalls();
        setHalls(hallsData);

        const dates = await BackendService.getAvailableDates();
        setAvailableDates(dates);
        
        // Логика загрузки данных в зависимости от режима просмотра
        if (viewMode.type === 'dashboard' || viewMode.type === 'schedule') {
            const sessions = await BackendService.getDailySchedule(currentDate);
            setCurrentDashboardSessions(sessions);
        } else if (viewMode.type === 'hall_weekly') {
            const datesArr = getWeeklyDates(currentDate);
            const dateStrings = datesArr.map(d => formatDate(d));
            const sessions = await BackendService.getWeeklySchedule(viewMode.hallName, dateStrings);
            setCurrentWeeklyHallSessions(sessions);
        }

    } catch (e) {
        console.error("Data load failed", e);
    } finally {
        if (!silent) setIsLoading(false);
    }
  }, [currentDate, viewMode]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Подписка на обновления настроек из сервиса
  useEffect(() => {
    return BackendService.subscribe(() => {
        setAppSettings({...BackendService.config});
    });
  }, []);

  // Автообновление данных
  useEffect(() => {
    if (!appSettings.autoRefreshInterval || appSettings.autoRefreshInterval <= 0) {
        return;
    }

    const intervalMs = appSettings.autoRefreshInterval * 60 * 1000; // конвертируем минуты в миллисекунды
    
    const intervalId = setInterval(async () => {
        try {
            console.log(`[AutoRefresh] Updating data every ${appSettings.autoRefreshInterval}min`);
            await BackendService.syncAllData();
            await loadData(true);
            setRefreshKey(Date.now());
        } catch (e) {
            console.error('[AutoRefresh] Failed to update:', e);
        }
    }, intervalMs);

    return () => clearInterval(intervalId);
  }, [appSettings.autoRefreshInterval, loadData]);

  const handleStatusChange = async (sessionId: string, newStatus: ContentStatus) => {
    // Находим сессию для отправки на бэкенд
    const sessionToUpdate = [...currentDashboardSessions, ...currentWeeklyHallSessions].find(s => s.id === sessionId);
    
    if (!sessionToUpdate) return;
    
    // 1. Сначала мгновенно обновляем UI для всех сессий фильма в зале
    const updateSessionList = (list: MovieSession[]) => list.map(s => {
        // Обновляем если это та же сессия ИЛИ тот же фильм в том же зале
        if (s.id === sessionId || (s.name === sessionToUpdate.name && s.hall_name === sessionToUpdate.hall_name)) {
            return { ...s, content_status: newStatus };
        }
        return s;
    });
    
    setCurrentDashboardSessions(prev => updateSessionList(prev));
    setCurrentWeeklyHallSessions(prev => updateSessionList(prev));
    
    // 2. Асинхронно отправляем на бэкенд (не блокируя UI)
    // Данные сохраняются в фоне после визуального обновления
    BackendService.setSessionStatus(sessionToUpdate, newStatus).catch(console.error);
  };

  const updateSetting = async (key: keyof AppSettings, value: any) => {
      // Обновляем в сервисе (там же сохраняется в localStorage)
      await BackendService.saveSetting(key, value);
  };

  const handleRefresh = async () => {
      if (refreshStatus === 'loading') return;
      
      setRefreshStatus('loading');
      try {
          if (!appSettings.serverUrl) {
              // Если IP не указан, имитируем ошибку для UI
              throw new Error("No server URL configured");
          }
          await BackendService.syncAllData();
          await loadData(true);
          setRefreshStatus('success');
          setRefreshKey(Date.now());
      } catch (e) {
          setRefreshStatus('error');
      } finally {
          setTimeout(() => setRefreshStatus('idle'), 2000);
      }
  };

  const handleHallClick = (hallName: string) => {
      handleNavigate({ type: 'hall_weekly', hallName, centerDate: currentDate });
  };

  const handleNavigate = (m: ViewMode) => {
      // Avoid pushing to history if clicking the same main view, but otherwise push
      if (m.type !== viewMode.type || (m.type === 'hall_weekly' && viewMode.type === 'hall_weekly' && m.hallName !== viewMode.hallName)) {
        setViewHistory(prev => [...prev, viewMode]);
      }
      setViewMode(m);
  };

  const handleBack = () => {
      if (viewHistory.length > 0) {
          const newHistory = [...viewHistory];
          const prevView = newHistory.pop();
          setViewHistory(newHistory);
          if (prevView) setViewMode(prevView);
      } else {
          setViewMode({ type: 'dashboard' });
      }
  };

  return {
    currentDate, setCurrentDate, viewMode, isLoading, refreshStatus, 
    currentDashboardSessions, currentWeeklyHallSessions,
    appSettings, halls, refreshKey, selectedMovieName, availableDates,
    isLogoMenuOpen, setIsLogoMenuOpen, handleRefresh, handleHallClick,
    handleNavigate, handleBack, handleSelectMovie: (n: string) => setSelectedMovieName(p => p === n ? null : n),
    handleStatusChange, updateSetting, getWeeklyDates
  };
};
