
import { LayoutDashboard, AlertCircle, PlayCircle, Film, ArrowRight, MonitorPlay, Ticket, CalendarSearch } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { BackendService } from '../../backend/aggregator';
import { ContentStatus, CONTENT_STATUS_CONFIG, MovieSession } from '../../types';
import { Card, GridSection, ViewContainer } from './SystemUI';
import { AIScheduleAnalysis } from './AIScheduleAnalysis';

interface DashboardViewProps {
  sessions: MovieSession[];
  onNavigateToSchedule: () => void;
  date: string;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ sessions, onNavigateToSchedule, date }) => {
  const [dbStats, setDbStats] = useState({ movies: 0, halls: 0, shows: 0, tickets: 0 });
  const [availableDates, setAvailableDates] = useState<string[]>([]);

  const loadStats = async () => {
      const stats = await BackendService.getDbStats();
      const dates = await BackendService.getAvailableDates();
      setDbStats(stats);
      setAvailableDates(dates);
  };

  useEffect(() => {
    loadStats();
    return BackendService.subscribe(loadStats);
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

  const sortedHalls = Object.keys(stats.hallCounts).sort((a,b) => Number(a) - Number(b));

  const isDbEmpty = dbStats.shows === 0;
  const hasDataButDifferentDate = !isDbEmpty && sessions.length === 0;

  return (
      <ViewContainer title="Главная Панель" icon={LayoutDashboard}>
          
          {hasDataButDifferentDate ? (
               <div className="flex flex-col items-center justify-center py-20 text-center bg-indigo-900/10 rounded-3xl border-2 border-dashed border-indigo-500/20 mb-12">
                  <CalendarSearch size={64} className="text-indigo-400 mb-6" />
                  <h3 className="text-2xl font-bold text-white mb-2">Нет сеансов на {date}</h3>
                  <p className="text-slate-400 max-w-md mb-10">
                    В базе данных найдены сеансы на другие даты ({availableDates.length} дн.). 
                    Пожалуйста, выберите корректную дату в календаре или перейдите к сетке расписания.
                  </p>
                  <div className="flex flex-wrap justify-center gap-4">
                      <button onClick={onNavigateToSchedule} className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/20">Перейти к сетке</button>
                      <button onClick={() => BackendService.syncAllData()} className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-all border border-slate-700">Обновить из облака</button>
                  </div>
              </div>
          ) : (
            <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
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
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-4 text-slate-400">
                                <PlayCircle size={20} />
                                <span className="text-sm font-bold uppercase tracking-widest">Форматы</span>
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-bold text-slate-200 uppercase">2D: {stats.format2D}</span>
                                    <span className="text-sm font-bold text-slate-400 uppercase">3D: {stats.format3D}</span>
                                </div>
                                <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden flex">
                                    <div className="h-full bg-indigo-500" style={{ width: `${stats.total > 0 ? (stats.format2D / stats.total) * 100 : 0}%` }}></div>
                                    <div className="h-full bg-purple-500" style={{ width: `${stats.total > 0 ? (stats.format3D / stats.total) * 100 : 0}%` }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <AIScheduleAnalysis sessions={sessions} date={date} />
            </>
          )}

          {!isDbEmpty && sessions.length > 0 && (
            <>
                <GridSection title="Состояние Контента" cols={2}>
                    <div className="space-y-4">
                        {(['ready_hall', 'download_hall', 'no_keys', 'missing'] as ContentStatus[]).map(status => {
                            const count = stats.statusCounts[status];
                            const config = CONTENT_STATUS_CONFIG[status];
                            return (
                                <div key={status} className="flex items-center justify-between p-4 bg-[#161e2e] rounded-xl border border-slate-700/50">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-3 h-3 rounded-full ${config.bg} ${config.glow}`}></div>
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
                                        <div className={`w-3 h-3 rounded-full ${config.bg} ${config.glow}`}></div>
                                        <span className={`font-bold ${config.color}`}>{config.label}</span>
                                    </div>
                                    <span className="text-xl font-mono font-bold text-white">{count}</span>
                                </div>
                            );
                        })}
                    </div>
                </GridSection>

                <GridSection title="Загрузка залов">
                        <Card>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                                {sortedHalls.length > 0 ? sortedHalls.map(hall => (
                                    <div key={hall} className="flex flex-col items-center p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Зал {hall}</span>
                                        <span className="text-2xl font-black text-white">{stats.hallCounts[hall]}</span>
                                        <span className="text-[10px] text-slate-600 uppercase mt-1">Сеансов</span>
                                    </div>
                                )) : (
                                    <div className="col-span-full py-10 text-center text-slate-500 italic">
                                        В базе данных нет сеансов на выбранную дату
                                    </div>
                                )}
                            </div>
                        </Card>
                </GridSection>

                <div className="mt-8 mb-12">
                    <button 
                        onClick={onNavigateToSchedule}
                        className="w-full py-6 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xl uppercase tracking-widest shadow-2xl shadow-indigo-500/20 transition-all flex items-center justify-center gap-3 group"
                    >
                        <MonitorPlay size={28} />
                        <span>Открыть сетку расписания</span>
                        <ArrowRight size={28} className="group-hover:translate-x-2 transition-transform" />
                    </button>
                </div>
            </>
          )}

          {isDbEmpty && (
              <div className="flex flex-col items-center justify-center py-20 text-center bg-slate-900/30 rounded-3xl border-2 border-dashed border-slate-800">
                  <MonitorPlay size={64} className="text-slate-700 mb-6" />
                  <h3 className="text-2xl font-bold text-slate-400 mb-2">База данных пуста</h3>
                  <p className="text-slate-500 max-w-md mb-10">Для работы приложения необходимо синхронизировать данные с вашим сервером. Проверьте настройки подключения.</p>
                  <div className="flex flex-wrap justify-center gap-4">
                      <button onClick={() => BackendService.syncAllData()} className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/20">Синхронизировать сейчас</button>
                      <button onClick={onNavigateToSchedule} className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-all border border-slate-700">Перейти к расписанию</button>
                  </div>
              </div>
          )}

      </ViewContainer>
  );
};
