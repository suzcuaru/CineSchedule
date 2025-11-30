
import React, { useMemo } from 'react';
import { LayoutDashboard, AlertCircle, PlayCircle, Film, ArrowRight, MonitorPlay } from 'lucide-react';
import { MovieSession, CONTENT_STATUS_CONFIG, ContentStatus } from '../../types';
import { ViewContainer, GridSection, Card } from './SystemUI';

interface DashboardViewProps {
  sessions: MovieSession[];
  onNavigateToSchedule: () => void;
  date: string;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ sessions, onNavigateToSchedule, date }) => {

  const stats = useMemo(() => {
    const total = sessions.length;
    
    // Status Counts
    const statusCounts: Record<ContentStatus, number> = {
        ready_hall: 0, on_storage: 0, download_hall: 0, download_storage: 0,
        distributor: 0, no_keys: 0, no_status: 0, missing: 0
    };
    
    // Format Counts
    let format2D = 0;
    let format3D = 0;

    // Issues
    let issues = 0;

    // Hall Utilization
    const hallCounts: Record<string, number> = {};

    sessions.forEach(s => {
        if (statusCounts[s.content_status] !== undefined) {
            statusCounts[s.content_status]++;
        }
        
        if (s.Format === '3D') format3D++;
        else format2D++;

        if (['no_keys', 'missing'].includes(s.content_status)) {
            issues++;
        }

        hallCounts[s.hall_name] = (hallCounts[s.hall_name] || 0) + 1;
    });

    return { total, statusCounts, format2D, format3D, issues, hallCounts };
  }, [sessions]);

  const sortedHalls = Object.keys(stats.hallCounts).sort((a,b) => Number(a) - Number(b));

  return (
      <ViewContainer title="Главная (Дашборд)" icon={LayoutDashboard}>
          
          {/* TOP SUMMARY */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              {/* Total Card */}
              <div className="bg-[#1e293b] border border-slate-700/50 rounded-2xl p-6 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-20 bg-indigo-500/10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-indigo-500/20 transition-colors"></div>
                  <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-2 text-indigo-400">
                          <Film size={20} />
                          <span className="text-sm font-bold uppercase tracking-widest">Всего сеансов</span>
                      </div>
                      <span className="text-5xl font-black text-white">{stats.total}</span>
                      <p className="text-slate-500 text-sm mt-2">на {date}</p>
                  </div>
              </div>

              {/* Issues Card */}
              <div className="bg-[#1e293b] border border-slate-700/50 rounded-2xl p-6 relative overflow-hidden group">
                  <div className={`absolute top-0 right-0 p-20 rounded-full -translate-y-1/2 translate-x-1/2 transition-colors ${stats.issues > 0 ? 'bg-red-500/10 group-hover:bg-red-500/20' : 'bg-emerald-500/10'}`}></div>
                  <div className="relative z-10">
                      <div className={`flex items-center gap-2 mb-2 ${stats.issues > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                          <AlertCircle size={20} />
                          <span className="text-sm font-bold uppercase tracking-widest">Проблемы</span>
                      </div>
                      <span className={`text-5xl font-black ${stats.issues > 0 ? 'text-red-500' : 'text-emerald-500'}`}>{stats.issues}</span>
                      <p className="text-slate-500 text-sm mt-2">Нет ключей / Не найдено</p>
                  </div>
              </div>

               {/* Formats Card */}
               <div className="bg-[#1e293b] border border-slate-700/50 rounded-2xl p-6 relative overflow-hidden">
                  <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-4 text-slate-400">
                          <PlayCircle size={20} />
                          <span className="text-sm font-bold uppercase tracking-widest">Форматы</span>
                      </div>
                      <div className="space-y-3">
                          <div className="flex justify-between items-center">
                              <span className="text-xl font-bold text-slate-200">2D</span>
                              <span className="text-xl font-mono text-slate-400">{stats.format2D}</span>
                          </div>
                          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                              <div className="h-full bg-indigo-500" style={{ width: `${(stats.format2D / stats.total) * 100}%` }}></div>
                          </div>
                          
                          <div className="flex justify-between items-center pt-1">
                              <span className="text-xl font-bold text-slate-200">3D</span>
                              <span className="text-xl font-mono text-slate-400">{stats.format3D}</span>
                          </div>
                          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                              <div className="h-full bg-purple-500" style={{ width: `${(stats.format3D / stats.total) * 100}%` }}></div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>

          <GridSection title="Статусы контента" cols={2}>
            {/* Group 1: Ready & Hall */}
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

             {/* Group 2: Storage & Others */}
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

          <GridSection title="Загрузка залов" cols={1}>
                <Card>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                        {sortedHalls.map(hall => (
                            <div key={hall} className="flex flex-col items-center p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Зал {hall}</span>
                                <span className="text-2xl font-black text-white">{stats.hallCounts[hall]}</span>
                                <span className="text-[10px] text-slate-600 uppercase mt-1">Сеансов</span>
                            </div>
                        ))}
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

      </ViewContainer>
  );
};
