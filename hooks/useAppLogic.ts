
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { formatDate, getWeeklyDates } from '../services/dataService';
import { BackendService } from '../backend/aggregator'; 
import { MovieSession, ViewMode, AppSettings, Hall } from '../types';

export type RefreshStatus = 'idle' | 'loading' | 'success' | 'error';

export const useAppLogic = () => {
  const [currentDate, setCurrentDate] = useState<string>(formatDate(new Date()));
  const [viewMode, setViewMode] = useState<ViewMode>({ type: 'dashboard' });
  const [isLogoMenuOpen, setIsLogoMenuOpen] = useState(false);
  
  const [appSettings, setAppSettings] = useState<AppSettings>({
      serverUrl: '',
      apiKey: '',
      useMockDataFallback: false,
      highlightCurrent: true,
      fontSize: 'medium',
      cardDensity: 'default',
      theme: 'default',
      enableAnimations: true,
      autoRefreshInterval: 0,
  });

  const [currentDashboardSessions, setCurrentDashboardSessions] = useState<MovieSession[]>([]);
  const [currentWeeklyHallSessions, setCurrentWeeklyHallSessions] = useState<MovieSession[]>([]);
  
  const [isLoading, setIsLoading] = useState<boolean>(true); 
  const [refreshStatus, setRefreshStatus] = useState<RefreshStatus>('idle'); 
  const [refreshKey, setRefreshKey] = useState(Date.now());
  const refreshTimerRef = useRef<any>(null);

  const [halls, setHalls] = useState<Hall[]>([]);
  const [selectedMovieName, setSelectedMovieName] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    // Load halls alongside sessions
    const hallsData = await BackendService.getHalls();
    setHalls(hallsData);

    if (viewMode.type === 'dashboard' || viewMode.type === 'schedule') {
        const sessions = await BackendService.getDailySchedule(currentDate);
        setCurrentDashboardSessions(sessions);
    } else if (viewMode.type === 'hall_weekly') {
        const sessions = await BackendService.getWeeklyHallSchedule(viewMode.hallName, currentDate);
        setCurrentWeeklyHallSessions(sessions);
    }
    setIsLoading(false);
  }, [currentDate, viewMode]);

  // Sync effect based on interval
  useEffect(() => {
    const interval = appSettings.autoRefreshInterval;
    if (interval === 0) return;

    const timer = setInterval(() => {
      console.log("[AutoSync] Triggering scheduled update...");
      BackendService.syncAllData(); // Глобальная синхронизация в фоне
    }, interval * 60 * 1000);

    return () => clearInterval(timer);
  }, [appSettings.autoRefreshInterval]);

  // Подписка на изменения в BackendService
  useEffect(() => {
    return BackendService.subscribe(() => {
        // Синхронизируем настройки
        const storedSettings = BackendService.config;
        if (storedSettings) {
            setAppSettings(prev => ({ ...prev, ...storedSettings }));
        }
        
        const serviceStatus = BackendService.connectionStatus;
        
        // Переход в режим загрузки
        if (serviceStatus === 'pending') {
            if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
            setRefreshStatus('loading');
        }
        
        // Завершение загрузки (успех или ошибка)
        if (serviceStatus === 'connected' || serviceStatus === 'error') {
            // Сначала загружаем данные в UI, и только потом меняем статус кнопки
            loadData().then(() => {
                setRefreshKey(Date.now());
                
                setRefreshStatus(prev => {
                    // Реагируем на завершение только если мы были в состоянии loading
                    if (prev === 'loading') {
                        const finalStatus = serviceStatus === 'connected' ? 'success' : 'error';
                        
                        if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
                        // Возврат в idle через 10 секунд
                        refreshTimerRef.current = setTimeout(() => {
                            setRefreshStatus('idle');
                        }, 10000);
                        
                        return finalStatus;
                    }
                    return prev;
                });
            });
        }
    });
  }, [loadData]);

  const updateSetting = async (key: keyof AppSettings, value: any) => {
      const newSettings = { ...appSettings, [key]: value };
      setAppSettings(newSettings);
      await BackendService.configure(newSettings);
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = async () => {
    // Обновляем только Shows и Tickets по запросу пользователя
    await BackendService.syncScheduleOnly();
  };

  const handleHallClick = (hallName: string) => {
    setViewMode({ type: 'hall_weekly', hallName, centerDate: currentDate });
  };

  const handleNavigate = (mode: ViewMode) => {
    setViewMode(mode);
    setIsLogoMenuOpen(false);
  };

  const handleSelectMovie = (name: string) => {
      setSelectedMovieName(prev => prev === name ? null : name);
  };

  return {
    currentDate,
    setCurrentDate,
    viewMode,
    isLoading,
    refreshStatus,
    currentDashboardSessions,
    currentWeeklyHallSessions,
    appSettings,
    halls,
    refreshKey,
    selectedMovieName,
    isLogoMenuOpen,
    setIsLogoMenuOpen,
    handleRefresh,
    handleHallClick,
    handleNavigate,
    handleSelectMovie,
    updateSetting,
    getWeeklyDates
  };
};
