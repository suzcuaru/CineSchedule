
import { LayoutDashboard, AlertCircle, PlayCircle, Film, ArrowRight, MonitorPlay, Ticket, CalendarSearch, Settings, Glasses, Layers, BarChart, RefreshCw } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { BackendService } from '../../backend/aggregator';
import { ContentStatus, CONTENT_STATUS_CONFIG, MovieSession, ViewMode } from '../../types';
import { Card, GridSection, ViewContainer } from './SystemUI';

interface DashboardViewProps {
  sessions: MovieSession[];
  onNavigate: (mode: ViewMode) => void;
  date: string;
}

const DashboardSkeleton = () => (
    <div className="animate-in fade-in duration-700">
        {/* Top metrics skeletons with Shimmer */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-36 bg-[#1e293b] rounded-2xl border border-slate-700/30 overflow-hidden relative">
                    <div className="absolute inset-0 animate-shimmer"></div>
                    <div className="p-6 relative z-10">
                        <div className="w-24 h-4 bg-slate-700/40 rounded-full mb-4"></div>
                        <div className="w-16 h-10 bg-slate-700/60 rounded-lg"></div>
                    </div>
                </div>
            ))}
        </div>
        
        {/* Halls loading grid skeleton */}
        <div className="mb-12">
            <div className="h-6 w-56 bg-slate-800/60 rounded-full mb-8 ml-1"></div>
            <div className="bg-[#1e293b]/40 rounded-2xl p-6 border border-slate-700/20 overflow-hidden relative">
                <div className="absolute inset-0 animate-shimmer opacity-50"></div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4 relative z-10">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                        <div key={i} className="h-24 bg-slate-800/40 rounded-xl border border-slate-700/30"></div>
                    ))}
                </div>
            </div>
        </div>

        {/* Content status skeleton */}
        <div>
            <div className="h-6 w-56 bg-slate-800/60 rounded-full mb-8 ml-1"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-20 bg-[#1e293b]/60 rounded-2xl border border-slate-700/30 overflow-hidden relative">
                             <div className="absolute inset-0 animate-shimmer opacity-30"></div>
                        </div>
                    ))}
                </div>
                <div className="space-y-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-20 bg-[#1e293b]/60 rounded-2xl border border-slate-700/30 overflow-hidden relative">
                             <div className="absolute inset-0 animate-shimmer opacity-30"></div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
);

export const DashboardView: React.FC<DashboardViewProps> = ({ sessions, onNavigate, date }) => {
  const [dbStats, setDbStats] = useState({ movies: 0, halls: 0, shows: 0, tickets: 0 });
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [connectionStatus, setConnectionStatus] = useState(BackendService.connectionStatus);
  const [isStatsLoading, setIsStatsLoading] = useState(true);

  const loadStats = async (isInitial = false) => {
      const stats = await BackendService.getDbStats();
      const dates = await BackendService.getAvailableDates();
      
      // Добавляем искусственную задержку для плавности анимации скелета только при первой загрузке
      if (isInitial) {
          await new Promise(resolve => setTimeout(resolve, 800));
      }
      
      setDbStats(stats);
      setAvailableDates(dates);
      setIsStatsLoading(false);
  };

  useEffect(() => {
    loadStats(true);
    return BackendService.subscribe(() => {
        loadStats(false);
        setConnectionStatus(BackendService.connectionStatus);
    });
  }, []);

  const stats = useMemo(() => {
    const total = sessions.length;
    const statusCounts: Record<ContentStatus, number> = {
        ready_hall: 0, on_storage: 0, download_hall: 0, download_storage: 0,
        distributor: 0, no_keys: 0, no_status: 0, missing: 0
    };
    let format2D = 0;
    let format3D = 0;
    let issues = 0;
    let totalTickets = 0;
    const hallCounts: Record<string, number> = {};

    sessions.forEach(s => {
        if (statusCounts[s.content_status] !== undefined) {
            statusCounts[s.content_status]++;
        }
        if (s.Format.toUpperCase().includes('3D')) format3D++;
        else format2D++;
        
        if (['no_keys', 'missing', 'distributor'].includes(s.content_status)) {
            issues++;
        }
        totalTickets += (s.Tickets || 0);
        hallCounts[s.hall_name] = (hallCounts[s.hall_name] || 0) + 1;
    });

    return { total, statusCounts, format2D, format3D, issues, hallCounts, totalTickets };
  }, [sessions]);

  const extractHallNumber = (name: string): number => {
      const match = name.match(/(\d+)/);
      return match ? parseInt(match[0], 10) : 9999;
  };

  const sortedHalls = useMemo(() => {
      return Object.keys(stats.hallCounts).sort((a, b) => {
          return extractHallNumber(a) - extractHallNumber(b);
      });
  }, [stats.hallCounts]);

  const isDbEmpty = dbStats.shows === 0;
  const hasDataButDifferentDate = !isDbEmpty && sessions.length === 0;
  const isOnline = connectionStatus === 'connected';

  // --- LOADING STATE ---
  if (isStatsLoading) {
      return (
        <ViewContainer title="Главная Панель" icon={LayoutDashboard}>
            <DashboardSkeleton />
        </ViewContainer>
      );
  }

  // --- EMPTY STATE VIEW ---
  if (isDbEmpty) {
      return (
        <ViewContainer title="Главная Панель" icon={LayoutDashboard}>
            <div className="flex flex-col items-center justify-center py-20 text-center bg-slate-900/30 rounded-3xl border-2 border-dashed border-slate-800">
                <MonitorPlay size={64} className="text-slate-700 mb-6" />
                <h3 className="text-2xl font-bold text-slate-400 mb-2">База данных пуста</h3>
                <p className="text-slate-500 max-w-md mb-10">
                    {isOnline 
                        ? "Для работы приложения необходимо загрузить данные с сервера." 
                        : "Нет подключения к серверу. Проверьте настройки или соединение."}
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                    <button 
                        onClick={() => BackendService.syncAllData()} 
                        disabled={!isOnline}
                        className={`
                            px-8 py-3 font-bold rounded-xl transition-all shadow-lg flex items-center gap-2
                            ${isOnline 
                                ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20' 
                                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'}
                        `}
                    >
                        Синхронизировать сейчас
                    </button>
                    <button 
                        onClick={() => onNavigate({ type: 'settings' })} 
                        className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-all border border-slate-700 flex items-center gap-2"
                    >
                        <Settings size={18} />
                        Перейти к настройкам
                    </button>
                </div>
            </div>
        </ViewContainer>
      );
  }

  // --- NORMAL DASHBOARD VIEW ---
  return (
      <ViewContainer title="Главная Панель" icon={LayoutDashboard}>
          
          {hasDataButDifferentDate ? (
               <div className="flex flex-col items-center justify-center py-20 text-center bg-indigo-900/10 rounded-3xl border-2 border-dashed border-indigo-500/20 mb-12">
                  <CalendarSearch size={64} className="text-indigo-400 mb-6" />
                  <h3 className="text-2xl font-bold text-white mb-2">Нет сеансов на {date}</h3>
                  <p className="text-slate-400 max-w-md mb-10">
                    В базе данных найдены сеансы на другие даты ({availableDates.length} дн.). 
                    Пожалуйста, выберите корректную дату в календаре.
                  </p>
                  <div className="flex flex-wrap justify-center gap-4">
                      <button onClick={() => onNavigate({ type: 'schedule' })} className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/20">Перейти к сетке</button>
                  </div>
              </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 transition-none">
                <div className="bg-[#1e293b] border border-slate-700/50 rounded-2xl p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-20 bg-indigo-500/10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-indigo-500/20 transition-colors"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2 text-indigo-400">
                            <Film size={20} />
                            <span className="text-sm font-bold uppercase tracking-widest">Сеансов</span>
                        </div>
                        <span className="text-5xl font-black text-white">{stats.total}</span>
                        <p className="text-slate-500 text-sm mt-2">на {date}</p>
                    </div>
                </div>

                <div className="bg-[#1e293b] border border-slate-700/50 rounded-2xl p-6 relative overflow-hidden group">
                    <div className={`absolute top-0 right-0 p-20 rounded-full -translate-y-1/2 translate-x-1/2 transition-colors ${stats.issues > 0 ? 'bg-red-500/10 group-hover:bg-red-500/20' : 'bg-emerald-500/10'}`}></div>
                    <div className="relative z-10">
                        <div className={`flex items-center gap-2 mb-2 ${stats.issues > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                            <AlertCircle size={20} />
                            <span className="text-sm font-bold uppercase tracking-widest">Критические</span>
                        </div>
                        <span className={`text-5xl font-black ${stats.issues > 0 ? 'text-red-500' : 'text-emerald-500'}`}>{stats.issues}</span>
                        <p className="text-slate-500 text-sm mt-2">Требуют внимания</p>
                    </div>
                </div>

                <div className="bg-[#1e293b] border border-slate-700/50 rounded-2xl p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-20 bg-amber-500/10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-amber-500/20 transition-colors"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2 text-amber-400">
                            <Ticket size={20} />
                            <span className="text-sm font-bold uppercase tracking-widest">Билетов</span>
                        </div>
                        <span className="text-5xl font-black text-white">{stats.totalTickets}</span>
                        <p className="text-slate-500 text-sm mt-2">Всего продано</p>
                    </div>
                </div>

                <div className="bg-[#1e293b] border border-slate-700/50 rounded-2xl p-6 relative overflow-hidden">
                    <div className="relative z-10 h-full flex flex-col justify-between">
                        <div className="flex items-center gap-2 mb-2 text-slate-400">
                            <PlayCircle size={20} />
                            <span className="text-sm font-bold uppercase tracking-widest">Форматы</span>
                        </div>
                        
                        <div className="flex items-end justify-between gap-4 mt-1">
                            <div className="flex flex-col flex-1">
                                <span className="text-4xl font-black text-blue-400 leading-none">{stats.format2D}</span>
                                <div className="flex items-center gap-1.5 mt-1 text-blue-500/80">
                                    <Layers size={14} />
                                    <span className="text-xs font-bold uppercase tracking-wider">2D Flat/Scope</span>
                                </div>
                            </div>
                            <div className="w-px h-12 bg-slate-700/50"></div>
                            <div className="flex flex-col flex-1 text-right">
                                <span className="text-4xl font-black text-purple-400 leading-none">{stats.format3D}</span>
                                <div className="flex items-center justify-end gap-1.5 mt-1 text-purple-500/80">
                                    <span className="text-xs font-bold uppercase tracking-wider">3D Digital</span>
                                    <Glasses size={14} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
          )}

          {sessions.length > 0 && (
            <div className="transition-none">
                <GridSection title="Загрузка залов">
                        <Card>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                                {sortedHalls.length > 0 ? sortedHalls.map(hallName => {
                                    const count = stats.hallCounts[hallName];
                                    const isBusy = count > 5;
                                    const isVeryBusy = count > 8;
                                    return (
                                        <div key={hallName} className={`flex flex-col items-center p-3 rounded-xl border transition-colors ${isVeryBusy ? 'bg-indigo-900/20 border-indigo-500/30' : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800'}`}>
                                            <div className="w-full flex justify-between items-start mb-1">
                                                 <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate max-w-full" title={hallName}>
                                                    {hallName.includes('Зал') ? hallName : `Зал ${hallName}`}
                                                 </span>
                                                 {isBusy && <BarChart size={12} className="text-indigo-400" />}
                                            </div>
                                            <span className={`text-3xl font-black ${isVeryBusy ? 'text-indigo-300' : 'text-white'}`}>{count}</span>
                                            <span className="text-[9px] text-slate-600 uppercase mt-0.5 font-bold tracking-wider">Сеансов</span>
                                        </div>
                                    );
                                }) : (
                                    <div className="col-span-full py-10 text-center text-slate-500 italic">
                                        В базе данных нет сеансов на выбранную дату
                                    </div>
                                )}
                            </div>
                        </Card>
                </GridSection>

                <GridSection title="Состояние Контента" cols={2}>
                    <div className="space-y-4">
                        {(['ready_hall', 'download_hall', 'no_keys', 'missing'] as ContentStatus[]).map(status => {
                            const count = stats.statusCounts[status];
                            const config = CONTENT_STATUS_CONFIG[status];
                            return (
                                <div key={status} className="flex items-center justify-between p-4 bg-[#161e2e] rounded-xl border border-slate-700/50">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-3 h-3 rounded-full ${config.bg} ${config.glow} shadow-sm`}></div>
                                        <span className={`font-bold ${config.color}`}>{config.label}</span>
                                    </div>
                                    <span className="text-xl font-mono font-bold text-white">{count}</span>
                                </div>
                            );
                        })}
                    </div>
                    <div className="space-y-4">
                        {(['on_storage', 'download_storage', 'distributor', 'no_status'] as ContentStatus[]).map(status => {
                            const count = stats.statusCounts[status];
                            const config = CONTENT_STATUS_CONFIG[status];
                            return (
                                <div key={status} className="flex items-center justify-between p-4 bg-[#161e2e] rounded-xl border border-slate-700/50">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-3 h-3 rounded-full ${config.bg} ${config.glow} shadow-sm`}></div>
                                        <span className={`font-bold ${config.color}`}>{config.label}</span>
                                    </div>
                                    <span className="text-xl font-mono font-bold text-white">{count}</span>
                                </div>
                            );
                        })}
                    </div>
                </GridSection>
            </div>
          )}
      </ViewContainer>
  );
};
