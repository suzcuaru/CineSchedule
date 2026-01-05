
import React from 'react';
import { HelpCircle, Layers, Database, FileSpreadsheet, MousePointer, Fingerprint, ChevronRight, CheckCircle2, AlertTriangle, Server, LayoutDashboard, Keyboard, Move, AppWindow, Download, Cpu, Network, Terminal } from 'lucide-react';
import { CONTENT_STATUS_CONFIG } from '../../types';
import { ViewContainer, GridSection, GestureItem, Card } from './SystemUI';

const StatusLegendItem: React.FC<{ statusKey: string }> = ({ statusKey }) => {
    const config = CONTENT_STATUS_CONFIG[statusKey as keyof typeof CONTENT_STATUS_CONFIG];
    return (
        <div className="flex items-center p-4 bg-[#0f172a] rounded-xl border border-indigo-500/5 hover:border-indigo-500/20 transition-all font-mono">
            <div className={`w-3 h-3 rounded-full ${config.bg} ${config.glow} shadow-lg mr-4 shrink-0 animate-pulse`}></div>
            <div className="flex flex-col">
                <span className={`text-sm font-black uppercase tracking-tighter ${config.color}`}>{config.label}</span>
                <span className="text-[0.65rem] text-slate-600 font-black uppercase mt-0.5 tracking-widest">[{statusKey}]</span>
            </div>
        </div>
    );
};

export const HelpView = () => {
    return (
        <ViewContainer title="Справочный центр" icon={Terminal}>
            
            <div className="mb-12 bg-indigo-900/5 border border-indigo-500/10 rounded-3xl p-8 relative overflow-hidden font-mono text-center md:text-left">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:40px_40px] opacity-10 pointer-events-none"></div>
                
                <div className="relative z-10">
                    <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
                        <div className="p-3 bg-indigo-600/20 rounded-2xl text-indigo-400">
                            <Cpu size={32} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white uppercase tracking-tighter">Архитектура CineSchedule</h2>
                            <p className="text-[0.65rem] text-slate-500 uppercase tracking-widest">Autonomous Cinema Management Kernel</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl">
                            <h3 className="text-indigo-400 font-black text-xs uppercase mb-3 flex items-center justify-center md:justify-start gap-2">
                                <Layers size={14} /> UI_LAYER
                            </h3>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                Реактивный интерфейс, адаптированный под терминалы киномехаников. Поддержка мультитач и горячих клавиш.
                            </p>
                        </div>
                        <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl">
                            <h3 className="text-emerald-400 font-black text-xs uppercase mb-3 flex items-center justify-center md:justify-start gap-2">
                                <Network size={14} /> SYNC_CORE
                            </h3>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                Двусторонняя синхронизация с серверами TMS и CinemaBox. Автономный кэш для работы без интернета.
                            </p>
                        </div>
                        <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl">
                            <h3 className="text-purple-400 font-black text-xs uppercase mb-3 flex items-center justify-center md:justify-start gap-2">
                                <Database size={14} /> DATA_KERNEL
                            </h3>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                Агрегация данных из Google Sheets, SQLite и внешних API в единую матрицу готовности контента.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <GridSection title="Матрица статусов контента" cols={2}>
                {(Object.keys(CONTENT_STATUS_CONFIG) as string[]).map(status => (
                    <StatusLegendItem key={status} statusKey={status} />
                ))}
            </GridSection>

            <GridSection title="Командный ввод и жесты" cols={2}>
                <div className="contents">
                    <GestureItem 
                        icon={MousePointer} 
                        title="Клик / Тап" 
                        desc="Выбор сеанса для изменения статуса или копирования метаданных." 
                    />
                    <GestureItem 
                        icon={Fingerprint} 
                        title="Удержание" 
                        desc="Открытие детальной технической сводки по выбранному DCP-пакету." 
                    />
                    <GestureItem 
                        icon={Keyboard} 
                        title="Стрелки ← →" 
                        desc="Быстрая навигация по сетке залов в десктопном режиме." 
                    />
                    <GestureItem 
                        icon={Move} 
                        title="Свайп" 
                        desc="Перемещение между датами и залами на мобильных терминалах." 
                    />
                </div>
            </GridSection>

            <div className="mt-8 p-6 bg-slate-950/40 border border-indigo-500/10 rounded-2xl font-mono text-center">
                <span className="text-[0.65rem] text-indigo-500 font-black uppercase tracking-[0.4em] animate-pulse">
                    &gt; system_help_end_of_line &lt;
                </span>
            </div>

        </ViewContainer>
    );
};
