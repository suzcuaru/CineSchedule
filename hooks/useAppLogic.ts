
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { formatDate, getWeeklyDates } from '../services/dataService';
import { BackendService } from '../backend/aggregator'; 
import { MovieSession, ViewMode, AppSettings, Hall, ContentStatus } from '../types';

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
  const settingsDebounceRef = useRef<any>(null);

  const [halls, setHalls] = useState<Hall[]>([]);
  const [selectedMovieName, setSelectedMovieName] = useState<string | null>(null);

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    const hallsData = await BackendService.getHalls();
    setHalls(hallsData);

    if (viewMode.type === 'dashboard' || viewMode.type === 'schedule') {
        const sessions = await BackendService.getDailySchedule(currentDate);
        setCurrentDashboardSessions(sessions);
    } else if (viewMode.type === 'hall_weekly') {
        const sessions = await BackendService.getWeeklyHallSchedule(viewMode.hallName, currentDate);
        setCurrentWeeklyHallSessions(sessions);
    }
    if (!silent) setIsLoading(false);
  }, [currentDate, viewMode]);

  useEffect(() => {
    const interval = appSettings.autoRefreshInterval;
    if (interval === 0) return;

    const timer = setInterval(() => {
      BackendService.syncAllData(true); 
    }, interval * 60 * 1000);

    return () => clearInterval(timer);
  }, [appSettings.autoRefreshInterval]);

  useEffect(() => {
    return BackendService.subscribe(() => {
        const storedSettings = BackendService.config;
        if (storedSettings) {
            setAppSettings(prev => ({ ...prev, ...storedSettings }));
        }
        
        const serviceStatus = BackendService.connectionStatus;
        if (refreshStatus === 'idle' && (serviceStatus === 'connected' || serviceStatus === 'error')) {
            loadData(true);
        }
    });
  }, [loadData, refreshStatus]);

  const updateSetting = async (key: keyof AppSettings, value: any) => {
      setAppSettings(prev => ({ ...prev, [key]: value }));
      if (key === 'serverUrl') {
          if (settingsDebounceRef.current) clearTimeout(settingsDebounceRef.current);
          settingsDebounceRef.current = setTimeout(() => {
              BackendService.saveSetting(key, value);
          }, 500);
      } else {
          await BackendService.saveSetting(key, value);
      }
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = async () => {
    if (refreshStatus === 'loading') return;
    
    const startTime = Date.now();
    setRefreshStatus('loading');
    
    try {
        await BackendService.syncScheduleOnly(true);
        await loadData(true);
        
        const elapsedTime = Date.now() - startTime;
        const minWait = 1200; // Немного увеличили для "солидности"
        if (elapsedTime < minWait) {
            await new Promise(resolve => setTimeout(resolve, minWait - elapsedTime));
        }

        setRefreshKey(Date.now());
        setRefreshStatus('success');
    } catch (e) {
        setRefreshStatus('error');
    } finally {
        if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = setTimeout(() => {
            setRefreshStatus('idle');
        }, 2000);
    }
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

  const handleStatusChange = async (sessionId: string, newStatus: ContentStatus) => {
    let sessionToUpdate: MovieSession | undefined;

    setCurrentDashboardSessions(prev => {
        return prev.map(s => {
            if (s.id === sessionId) {
                sessionToUpdate = s;
                return { ...s, content_status: newStatus };
            }
            return s;
        });
    });

    setCurrentWeeklyHallSessions(prev => {
        return prev.map(s => {
             if (s.id === sessionId) {
                 sessionToUpdate = s;
                 return { ...s, content_status: newStatus };
             }
             return s;
        });
    });

    if (sessionToUpdate) {
        await BackendService.setSessionStatus(sessionToUpdate, newStatus);
        await BackendService.syncStatusesOnly(true);
    }
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
    handleStatusChange, 
    updateSetting,
    getWeeklyDates
  };
};
