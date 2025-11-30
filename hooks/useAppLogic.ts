import React, { useState, useEffect, useCallback } from 'react';
import { formatDate, getWeeklyDates } from '../services/dataService';
import { BackendService } from '../backend/aggregator'; 
import { MovieSession, ContentStatus, ViewMode, AppSettings } from '../types';

export const useAppLogic = () => {
  const [currentDate, setCurrentDate] = useState<string>(formatDate(new Date()));
  const [viewMode, setViewMode] = useState<ViewMode>({ type: 'dashboard' });
  const [isLogoMenuOpen, setIsLogoMenuOpen] = useState(false);
  
  const [appSettings, setAppSettings] = useState<AppSettings>({
      serverUrl: '',
      apiKey: '',
      useMockDataFallback: true,
      highlightCurrent: true,
      fontSize: 'medium',
      cardDensity: 'default',
      theme: 'default',
      enableAnimations: true,
  });

  const [dashboardSessions, setDashboardSessions] = useState<MovieSession[]>([]);
  const [weeklyHallSessions, setWeeklyHallSessions] = useState<MovieSession[]>([]);
  
  const [isLoading, setIsLoading] = useState<boolean>(true); 
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false); 

  const [hallCount] = useState<number>(8);
  const [selectedMovieName, setSelectedMovieName] = useState<string | null>(null);

  // Subscribe to settings changes from the backend service (e.g., on initial load)
  useEffect(() => {
    return BackendService.subscribe(() => {
        const storedSettings = BackendService.config; // Access public config for sync
        if (storedSettings) {
            setAppSettings(prev => ({ ...prev, ...storedSettings }));
        }
    });
  }, []);

  const updateSetting = async (key: keyof AppSettings, value: any) => {
      const newSettings = { ...appSettings, [key]: value };
      setAppSettings(newSettings);
      await BackendService.configure(newSettings);
      // Re-fetch data for current view after settings change (e.g. serverUrl)
      if (viewMode.type === 'dashboard' || viewMode.type === 'schedule') {
        loadDashboard(currentDate);
      } else if (viewMode.type === 'hall_weekly') {
        loadWeeklyData(viewMode.hallName, currentDate);
      }
  };

  const loadDashboard = useCallback(async (date: string) => {
    setIsLoading(true);
    const sessions = await BackendService.getDailySchedule(date);
    setDashboardSessions(sessions);
    setIsLoading(false);
  }, []);

  const loadWeeklyData = useCallback(async (hallName: string, centerDate: string) => {
    setIsLoading(true);
    const sessions = await BackendService.getWeeklyHallSchedule(hallName, centerDate);
    setWeeklyHallSessions(sessions);
    setIsLoading(false);
  }, []);

  // Effect to load data based on viewMode and date changes
  useEffect(() => {
    if (viewMode.type === 'dashboard' || viewMode.type === 'schedule') {
        loadDashboard(currentDate);
    } else if (viewMode.type === 'hall_weekly') {
        loadWeeklyData(viewMode.hallName, viewMode.centerDate);
    }
  }, [currentDate, viewMode, loadDashboard, loadWeeklyData]);
  
  // Subscribe to live data updates from the backend
  useEffect(() => {
      return BackendService.subscribe(() => {
         if (viewMode.type === 'dashboard' || viewMode.type === 'schedule') {
             loadDashboard(currentDate);
         } else if (viewMode.type === 'hall_weekly') {
             loadWeeklyData(viewMode.hallName, viewMode.centerDate);
         }
      });
  }, [viewMode, currentDate, loadDashboard, loadWeeklyData]);

  const handleHallClick = (hallName: string) => {
    setViewMode({ type: 'hall_weekly', hallName, centerDate: currentDate });
  };

  const handleNavigate = (mode: ViewMode) => {
      setViewMode(mode);
      setIsLogoMenuOpen(false);
  };

  const handleRefresh = async () => {
      setIsRefreshing(true); 
      await BackendService.syncData();
      // The subscription will trigger a data reload automatically
      setIsRefreshing(false); 
  };

  const handleStatusChange = async (session: MovieSession, newStatus: ContentStatus) => {
      await BackendService.setSessionStatus(session, newStatus);
      // The subscription will trigger a data reload automatically
  };
  
  const handleSelectMovie = (name: string) => {
      setSelectedMovieName(prev => prev === name ? null : name);
  };

  return {
    currentDate,
    setCurrentDate,
    viewMode,
    isLogoMenuOpen,
    setIsLogoMenuOpen,
    appSettings,
    updateSetting,
    isLoading, 
    isRefreshing, 
    hallCount,
    handleNavigate,
    handleRefresh,
    handleHallClick,
    handleStatusChange,
    selectedMovieName,
    handleSelectMovie,
    currentDashboardSessions: dashboardSessions,
    currentWeeklyHallSessions: weeklyHallSessions, // NEW
    getWeeklyDates
  };
};