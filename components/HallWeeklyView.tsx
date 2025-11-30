
import React, { memo, useMemo, useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import { MovieSession, AppSettings } from '../types';
import { MovieCard, SkeletonMovieCard } from './MovieCard';
import { formatDate } from '../services/dataService';
import { CalendarDays, AlertCircle, CheckCircle2 } from 'lucide-react';
import { ScrollIndicator } from './ScrollIndicator';
import { VerticalScrollPanel } from './VerticalScrollPanel';

interface HallWeeklyViewProps {
  hallName: string;
  dates: Date[];
  sessions: MovieSession[];
  settings: AppSettings;
  loading: boolean;
  columnWidthClass?: string;
  selectedMovieName: string | null;
  onSelectMovie: (name: string) => void;
}

interface DayColumnProps {
    date: Date;
    todayStr: string;
    sessions: MovieSession[];
    settings: AppSettings;
    loading: boolean;
    index: number;
    widthClass: string;
    onVisibilityChange: (id: string, isVisible: boolean) => void;
    selectedMovieName: string | null;
    onSelectMovie: (name: string) => void;
}

const getColumnStatus = (sessions: MovieSession[]) => {
    if (!sessions || sessions.length === 0) return 'default';
    const hasWarning = sessions.some(s => s.content_status !== 'ready_hall' && s.content_status !== 'no_status');
    if (hasWarning) return 'warning';
    const isReady = sessions.some(s => s.content_status === 'ready_hall');
    if (isReady) return 'ready';
    return 'default';
};

const DayColumn = memo(({ date, todayStr, sessions, settings, loading, index, widthClass, onVisibilityChange, selectedMovieName, onSelectMovie }: DayColumnProps) => {
    const columnRef = useRef<HTMLDivElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const dateStr = formatDate(date);
    const isToday = dateStr === todayStr;
    const sortedSessions = useMemo(() => [...(sessions || [])].sort((a, b) => a.time.localeCompare(b.time)), [sessions]);
    const hasData = sortedSessions.length > 0;
    
    const weekDayName = date.toLocaleDateString('ru-RU', { weekday: 'short' });
    const dayNum = date.toLocaleDateString('ru-RU', { day: 'numeric' });
    const monthName = date.toLocaleDateString('ru-RU', { month: 'short' });

    const colStatus = useMemo(() => getColumnStatus(sessions), [sessions]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                onVisibilityChange(dateStr, entry.isIntersecting);
            },
            { threshold: 0.6 }
        );
        if (columnRef.current) observer.observe(columnRef.current);
        return () => observer.disconnect();
    }, [dateStr, onVisibilityChange]);

    // Header Styles
    let headerStyle = isToday 
        ? "bg-gradient-to-b from-indigo-900/40 to-indigo-900/20 border-indigo-500/30" 
        : "bg-gradient-to-b from-slate-800/40 to-slate-900/40 border-white/5";
    
    let textAccent = isToday ? "text-indigo-300" : "text-slate-400";
    let bgIcon = isToday ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/30" : "bg-slate-700/50 text-slate-300";

    if (colStatus === 'warning') {
        headerStyle = "bg-gradient-to-b from-amber-900/40 to-amber-900/10 border-amber-500/50";
        textAccent = "text-amber-300";
        bgIcon = "bg-amber-500 text-amber-950";
    } else if (colStatus === 'ready') {
        headerStyle = "bg-gradient-to-b from-emerald-900/40 to-emerald-900/10 border-emerald-500/50";
        textAccent = "text-emerald-300";
        bgIcon = "bg-emerald-500 text-white";
    }

    return (
        <div ref={columnRef} className={`
            flex flex-col h-full overflow-hidden snap-start shrink-0 px-0 
            ${widthClass} border-r border-white/5 last:border-none
            group/scroll relative
        `}>
            
            <div className={`
                flex-none relative z-20 p-4 mb-2 mx-2 rounded-xl overflow-hidden border
                ${headerStyle}
                backdrop-blur-md transition-colors
            `}>
                 <span className={`
                    absolute -right-2 -top-4 text-7xl font-black pointer-events-none select-none transition-colors
                    ${isToday ? 'text-indigo-500/10' : 'text-white/5'}
                 `}>
                    {dayNum}
                </span>

                 <div className="flex items-center gap-3 relative z-10">
                    <div className={`flex flex-col items-center justify-center w-10 h-10 rounded-lg ${bgIcon}`}>
                        <span className="text-lg font-bold leading-none">{dayNum}</span>
                    </div>
                    
                    <div className="flex flex-col leading-none">
                        <span className={`
                            text-sm font-bold uppercase tracking-widest flex items-center gap-2
                            ${textAccent}
                        `}>
                            {weekDayName}
                            {colStatus === 'warning' && <AlertCircle size={14} className="text-amber-400 animate-pulse" />}
                            {colStatus === 'ready' && <CheckCircle2 size={14} className="text-emerald-400" />}
                        </span>
                        <span className="text-xs text-slate-500 font-bold mt-1 uppercase">
                            {monthName}
                        </span>
                    </div>
                    
                    {isToday && (
                        <div className="ml-auto px-2 py-0.5 rounded bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[10px] font-bold uppercase tracking-widest">
                            Сегодня
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-1 relative overflow-hidden">
                <div 
                    ref={scrollRef}
                    className="absolute inset-0 overflow-y-auto px-4 pr-4 pt-3 pb-20 space-y-3 hide-scrollbar"
                >
                    {loading ? (
                        Array.from({ length: 8 }).map((_, i) => (
                            <SkeletonMovieCard key={`skel-day-${index}-${i}`} />
                        ))
                    ) : (
                        hasData ? (
                            sortedSessions.map((session, idx) => (
                                <MovieCard 
                                    key={session.id} 
                                    session={session} 
                                    settings={settings}
                                    index={idx}
                                    selectedMovieName={selectedMovieName}
                                    onSelectMovie={onSelectMovie}
                                />
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center h-32 mt-10 text-slate-700 animate-in fade-in duration-500">
                                <CalendarDays size={32} className="mb-2 opacity-50"/>
                                <span className="text-sm font-bold uppercase tracking-widest opacity-60">Нет данных</span>
                            </div>
                        )
                    )}
                </div>
                 {/* Custom Scroll Panel */}
                 <VerticalScrollPanel 
                    targetRef={scrollRef} 
                    topOffset="4px" 
                    bottomOffset="10px" 
                />
            </div>
        </div>
    );
});

export const HallWeeklyView: React.FC<HallWeeklyViewProps> = ({ 
  hallName, 
  dates, 
  sessions, 
  settings,
  loading,
  columnWidthClass = "w-full",
  selectedMovieName,
  onSelectMovie,
}) => {
  
  const todayStr = formatDate(new Date());
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const [visibleDates, setVisibleDates] = useState<Set<string>>(new Set());
  const [scrollRatio, setScrollRatio] = useState(0);
  const [isScrollable, setIsScrollable] = useState(false);

  const dateStrings = useMemo(() => dates.map(d => formatDate(d)), [dates]);

  const sessionsByDate = useMemo(() => {
    const map: Record<string, MovieSession[]> = {};
    sessions.forEach(session => {
        if (!map[session.date]) {
            map[session.date] = [];
        }
        map[session.date].push(session);
    });
    return map;
  }, [sessions]);

  useLayoutEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const checkScrollable = () => {
        setIsScrollable(container.scrollWidth > container.clientWidth);
    };

    const debouncedCheck = () => setTimeout(checkScrollable, 50);

    const observer = new ResizeObserver(debouncedCheck);
    observer.observe(container);
    if (container.firstElementChild) {
        observer.observe(container.firstElementChild);
    }
    
    debouncedCheck();

    return () => observer.disconnect();
  }, [loading]);

  const handleVisibilityChange = (id: string, isVisible: boolean) => {
    setVisibleDates(prev => {
        const next = new Set(prev);
        if (isVisible) next.add(id);
        else next.delete(id);
        return next;
    });
  };

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    const maxScroll = scrollWidth - clientWidth;
    const ratio = maxScroll > 0 ? scrollLeft / maxScroll : 0;
    setScrollRatio(ratio);
  };

  const handleScrub = useCallback((newRatio: number) => {
      if (!scrollContainerRef.current) return;
      const { scrollWidth, clientWidth } = scrollContainerRef.current;
      const maxScroll = scrollWidth - clientWidth;
      if (maxScroll > 0) {
          scrollContainerRef.current.scrollLeft = newRatio * maxScroll;
      }
  }, []);

  const handleStep = useCallback((direction: number) => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = scrollContainerRef.current.clientWidth;
    scrollContainerRef.current.scrollBy({ left: scrollAmount * direction, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
        if (!scrollContainerRef.current) return;
        const scrollAmount = scrollContainerRef.current.clientWidth;
        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            scrollContainerRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="w-full h-full flex flex-col relative">
      <div className="flex-none px-4 py-4 bg-[#0b0f19] relative z-30">
         <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2 md:gap-3">
             <div className="px-3 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-lg font-mono">
                Зал {hallName}
             </div>
             <span className="text-slate-600 text-xl md:text-2xl font-normal">/</span>
             <span className="text-slate-400 text-lg md:text-xl font-medium truncate">Расписание недели</span>
         </h2>
      </div>

      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-x-auto overflow-y-hidden snap-x snap-mandatory touch-pan-x hide-scrollbar pt-4"
      >
        <div className="flex h-full w-full">
          {dates.map((date, index) => {
             const dateStr = formatDate(date);
             const daySessions = sessionsByDate[dateStr] || [];
             
             return (
                <DayColumn 
                    key={dateStr}
                    date={date}
                    todayStr={todayStr}
                    sessions={daySessions}
                    settings={settings}
                    loading={loading}
                    index={index}
                    widthClass={columnWidthClass}
                    onVisibilityChange={handleVisibilityChange}
                    selectedMovieName={selectedMovieName}
                    onSelectMovie={onSelectMovie}
                />
             );
          })}
        </div>
      </div>

       <ScrollIndicator 
            items={dateStrings}
            visibleItems={visibleDates}
            scrollRatio={scrollRatio}
            onScrub={handleScrub}
            onStep={handleStep}
            isScrollable={isScrollable}
        />
    </div>
  );
};
