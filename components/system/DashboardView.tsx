
import { LayoutDashboard, AlertCircle, PlayCircle, Film, ArrowRight, MonitorPlay, Ticket, CalendarSearch, Settings, Glasses, Layers, BarChart, RefreshCw, BarChart3, Clock, TrendingUp, Terminal } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { BackendService } from '../../backend/aggregator';
import { ContentStatus, CONTENT_STATUS_CONFIG, MovieSession, ViewMode } from '../../types';
import { Card, GridSection, ViewContainer, Equalizer } from './SystemUI';
import { TodaysMoviesCarousel } from './TodaysMoviesCarousel';

interface DashboardViewProps {
  sessions: MovieSession[];
  onNavigate: (mode: ViewMode) => void;
  date: string;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ sessions, onNavigate, date }) => {
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
    return BackendService.subscribe(() => { loadStats(); });
  }, []);

  const stats = useMemo(() => {
    const total = sessions.length;
    const statusCounts: Record<ContentStatus, number> = { ready_hall: 0, on_storage: 0, download_hall: 0, download_storage: 0, distributor: 0, no_keys: 0, no_status: 0, missing: 0 };
    let format2D = 0, format3D = 0, issues = 0, totalTickets = 0;
    const hallCounts: Record<string, number> = {};
    const timeDistribution: Record<string, number> = { "10:00": 0, "13:00": 0, "16:00": 0, "19:00": 0, "22:00": 0 };

    sessions.forEach(s => {
        if (statusCounts[s.content_status] !== undefined) statusCounts[s.content_status]++;
        if (s.Format.toUpperCase().includes('3D')) format3D++; else format2D++;
        if (['no_keys', 'missing', 'distributor'].includes(s.content_status)) issues++;
        totalTickets += (s.Tickets || 0);
        hallCounts[s.hall_name] = (hallCounts[s.hall_name] || 0) + 1;

        const hour = parseInt(s.time.split(':')[0]);
        if (hour < 13) timeDistribution["10:00"]++;
        else if (hour < 16) timeDistribution["13:00"]++;
        else if (hour < 19) timeDistribution["16:00"]++;
        else if (hour < 22) timeDistribution["19:00"]++;
        else timeDistribution["22:00"]++;
    });
    return { total, statusCounts, format2D, format3D, issues, hallCounts, totalTickets, timeDistribution };
  }, [sessions]);

  const hallStatsArray = (Object.entries(stats.hallCounts) as [string, number][]).sort((a, b) => a[0].localeCompare(b[0]));
  const maxHallSessions = Math.max(...(Object.values(stats.hallCounts) as number[]), 1);
  const maxTimeSessions = Math.max(...(Object.values(stats.timeDistribution) as number[]), 1);

  return (
      <ViewContainer title="Консоль управления" icon={Terminal}>
          {!sessions.length ? (
               <div className="flex flex-col items-center justify-center min-h-[calc(100vh-280px)] py-8 md:py-12 text-center bg-[#0f172a]/40 rounded-[32px] md:rounded-[48px] border border-indigo-500/10 mb-8 animate-in fade-in duration-700 font-mono overflow-hidden relative">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.05)_0%,transparent_70%)] pointer-events-none" />
                  
                  <div className="relative mb-6 md:mb-8 group">
                      <div className="w-16 h-16 md:w-24 md:h-24 rounded-2xl md:rounded-3xl bg-indigo-500/5 flex items-center justify-center relative border border-indigo-500/10 shadow-2xl transition-transform duration-500 group-hover:scale-110">
                        <CalendarSearch size={40} className="text-indigo-500/60 relative z-10" />
                        <div className="absolute inset-0 bg-indigo-500/10 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                  </div>
                  
                  <div className="space-y-1 md:space-y-3 mb-6 md:mb-8 px-6 relative z-10">
                      <h3 className="text-base md:text-2xl font-black text-slate-500 flex items-center justify-center gap-3 tracking-[0.2em] uppercase">
                        <span className="text-indigo-500/40">&gt;</span> СКАНИРОВАНИЕ_СИСТЕМЫ
                      </h3>
                      <div className="text-4xl md:text-7xl font-black text-white tracking-tighter">
                        {date}
                      </div>
                  </div>
                  
                  <div className="max-w-[320px] md:max-w-md space-y-6 md:space-y-10 mb-4 px-6 relative z-10">
                    <p className="text-slate-500 text-sm md:text-base leading-relaxed uppercase font-bold tracking-widest text-center opacity-70">
                        Данные в локальном хранилище не обнаружены. Ожидайте синхронизации с ядром TMS.
                    </p>
                    <div className="flex justify-center items-center h-12 md:h-20">
                        <Equalizer active={true} color="#6366f1" size={window.innerWidth < 768 ? 'md' : 'lg'} />
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-2 mt-6 relative z-10">
                      <span className="text-xs text-indigo-500/30 font-black uppercase tracking-[1em]">СВЯЗЬ_УСТАНОВЛЕНА</span>
                  </div>
              </div>
          ) : (
            <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8 md:mb-12">
                <div className="bg-[#0f172a] border border-indigo-500/10 rounded-2xl p-5 md:p-7 overflow-hidden relative font-mono shadow-lg">
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-3 text-indigo-400 font-black"><Film size={18} /><span className="text-[0.75rem] md:text-[0.85rem] uppercase tracking-[0.15em]">Сеансы</span></div>
                        <span className="text-4xl md:text-6xl font-black text-white tracking-tighter">{stats.total}</span>
                    </div>
                </div>
                <div className="bg-[#0f172a] border border-red-500/10 rounded-2xl p-5 md:p-7 overflow-hidden relative font-mono shadow-lg">
                    <div className="relative z-10">
                        <div className={`flex items-center gap-2 mb-3 ${stats.issues > 0 ? 'text-red-400' : 'text-emerald-400'} font-black`}><AlertCircle size={18} /><span className="text-[0.75rem] md:text-[0.85rem] uppercase tracking-[0.15em]">Проблемы</span></div>
                        <span className={`text-4xl md:text-6xl font-black tracking-tighter ${stats.issues > 0 ? 'text-red-500' : 'text-emerald-500'}`}>{stats.issues}</span>
                    </div>
                </div>
                <div className="bg-[#0f172a] border border-amber-500/10 rounded-2xl p-5 md:p-7 overflow-hidden relative font-mono shadow-lg">
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-3 text-amber-400 font-black"><Ticket size={18} /><span className="text-[0.75rem] md:text-[0.85rem] uppercase tracking-[0.15em]">Билеты</span></div>
                        <span className="text-4xl md:text-6xl font-black text-white tracking-tighter">{stats.totalTickets}</span>
                    </div>
                </div>
                <div className="bg-[#0f172a] border border-indigo-500/10 rounded-2xl p-5 md:p-7 overflow-hidden relative font-mono shadow-lg">
                    <div className="relative z-10 h-full flex flex-col justify-between">
                        <div className="flex items-center gap-2 mb-3 text-slate-500 font-black"><PlayCircle size={18} /><span className="text-[0.75rem] md:text-[0.85rem] uppercase tracking-[0.15em]">Форматы</span></div>
                        <div className="flex items-end justify-between gap-2">
                            <div className="flex flex-col"><span className="text-3xl md:text-5xl font-black text-indigo-400 tracking-tighter">{stats.format2D}</span><span className="text-[0.65rem] md:text-[0.75rem] uppercase font-black text-slate-600">2D_DCP</span></div>
                            <div className="flex flex-col text-right"><span className="text-3xl md:text-5xl font-black text-purple-400 tracking-tighter">{stats.format3D}</span><span className="text-[0.65rem] md:text-[0.75rem] uppercase font-black text-slate-600">3D_ACTIVE</span></div>
                        </div>
                    </div>
                </div>
            </div>

            <TodaysMoviesCarousel sessions={sessions} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-8 md:mb-12">
              <Card className="bg-slate-900/40 border-indigo-500/5 font-mono p-6 md:p-8">
                  <div className="flex items-center justify-between mb-8 md:mb-10">
                      <h3 className="text-sm md:text-base font-black text-indigo-400 flex items-center gap-3 uppercase tracking-[0.2em]">
                          <Clock size={20} />
                          АКТИВНОСТЬ_СМЕНЫ
                      </h3>
                  </div>
                  <div className="flex items-end justify-between h-40 md:h-52 px-1 md:px-2 gap-3 md:gap-5">
                      {(Object.entries(stats.timeDistribution) as [string, number][]).map(([time, count]) => (
                          <div key={time} className="flex-1 flex flex-col items-center gap-3 md:gap-4 group">
                              <div className="relative w-full flex flex-col items-center">
                                  <div 
                                      className="w-full bg-indigo-600/30 border border-indigo-500/20 rounded-t-lg transition-all duration-1000 ease-out group-hover:bg-indigo-500 group-hover:shadow-[0_0_20px_rgba(99,102,241,0.3)]" 
                                      style={{ height: `${(count / maxTimeSessions) * (window.innerWidth < 768 ? 120 : 160)}px` }}
                                  />
                                  <span className="absolute -top-7 text-xs font-mono font-black text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">{count}</span>
                              </div>
                              <span className="text-xs md:text-sm font-black text-slate-500 tracking-tighter">{time}</span>
                          </div>
                      ))}
                  </div>
              </Card>

              <Card className="bg-slate-900/40 border-indigo-500/5 overflow-hidden font-mono p-6 md:p-8">
                  <h3 className="text-sm md:text-base font-black text-indigo-400 flex items-center gap-3 mb-6 md:mb-8 uppercase tracking-[0.2em]">
                      <BarChart3 size={20} />
                      ЗАГРУЗКА_ЗАЛОВ
                  </h3>
                  <div className="space-y-4 md:space-y-6 max-h-48 md:max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                      {hallStatsArray.map(([hall, count]) => (
                          <div key={hall} className="flex flex-col gap-2 group">
                              <div className="flex justify-between text-xs md:text-sm font-black uppercase tracking-wide">
                                  <span className="text-slate-400 group-hover:text-white transition-colors">ЗАЛ {hall}</span>
                                  <span className="text-indigo-400">{count} ЕД.</span>
                              </div>
                              <div className="h-2 md:h-3 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-900 shadow-inner">
                                  <div 
                                      className="h-full bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.5)] transition-all duration-1000 ease-out" 
                                      style={{ width: `${(count / maxHallSessions) * 100}%` }} 
                                  />
                              </div>
                          </div>
                      ))}
                  </div>
              </Card>
            </div>

            <GridSection title="Матрица состояния контента" cols={1}>
                <Card className="bg-slate-950/20 border-indigo-500/5 grid grid-cols-2 xs:grid-cols-4 lg:grid-cols-8 gap-4 md:gap-5 font-mono p-6 md:p-8">
                    {Object.entries(CONTENT_STATUS_CONFIG).map(([key, config]) => {
                        const count = stats.statusCounts[key as ContentStatus] || 0;
                        if (count === 0 && key !== 'no_status') return null;
                        return (
                          <div key={key} className="flex flex-col items-center gap-3 p-4 md:p-5 bg-slate-900/40 border border-indigo-500/5 rounded-2xl hover:border-indigo-500/20 transition-all group">
                              <div className={`w-2 h-2 rounded-full ${config.bg} shadow-lg animate-pulse group-hover:scale-125 transition-transform`} />
                              <span className="text-[0.65rem] md:text-[0.75rem] font-black text-slate-500 text-center leading-tight uppercase tracking-tight truncate w-full group-hover:text-slate-300 transition-colors">
                                  {config.label.split('(')[0]}
                              </span>
                              <span className="text-2xl md:text-4xl font-black text-white tracking-tighter group-hover:text-indigo-400 transition-colors">{count}</span>
                          </div>
                        )
                    })}
                </Card>
            </GridSection>
            </>
          )}
      </ViewContainer>
  );
};
