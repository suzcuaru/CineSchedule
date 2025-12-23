
import React, { useMemo, memo, useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import { MovieSession, AppSettings, Hall } from '../types';
import { MovieCard, SkeletonMovieCard } from './MovieCard';
import { ArrowRight, MonitorPlay, AlertCircle, CheckCircle2 } from 'lucide-react';
import { ScrollIndicator } from './ScrollIndicator';
import { VerticalScrollPanel } from './VerticalScrollPanel';

interface ScheduleGridProps {
  sessions: MovieSession[];
  halls: Hall[];
  onHallClick: (hallName: string) => void;
  settings: AppSettings;
  isLoading: boolean;
  columnWidthClass?: string; 
  selectedMovieName: string | null;
  onSelectMovie: (name: string) => void;
  refreshKey: number;
}

interface HallColumnProps {
    hall: Hall;
    sessions: MovieSession[];
    onHallClick: (hallName: string) => void;
    settings: AppSettings;
    isLoading: boolean;
    widthClass: string;
    onVisibilityChange: (id: string, isVisible: boolean) => void;
    selectedMovieName: string | null;
    onSelectMovie: (name: string) => void;
    refreshKey: number;
}

// --- HELPER: Determine Column Status ---
// Returns: 'warning' | 'ready' | 'default'
const getColumnStatus = (sessions: MovieSession[]) => {
    if (!sessions || sessions.length === 0) return 'default';

    // 1. Check for WARNINGS (Any status that isn't 'ready_hall' and isn't 'no_status')
    const hasWarning = sessions.some(s => 
        s.content_status !== 'ready_hall' && 
        s.content_status !== 'no_status'
    );
    if (hasWarning) return 'warning';

    // 2. Check for READY (If we have ready_hall and no warnings)
    const isReady = sessions.some(s => s.content_status === 'ready_hall');
    if (isReady) return 'ready';

    return 'default';
};

const HallColumn = memo(({ hall, sessions, onHallClick, settings, isLoading, widthClass, onVisibilityChange, selectedMovieName, onSelectMovie, refreshKey }: HallColumnProps) => {
    const columnRef = useRef<HTMLDivElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const colStatus = useMemo(() => getColumnStatus(sessions), [sessions]);

    // Use cleaned name if available, otherwise original name
    const displayName = hall.clean_name || hall.name;
    const categoryName = hall.category_name || '';

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                onVisibilityChange(hall.name, entry.isIntersecting);
            },
            { threshold: 0.6 } // 60% visibility required to be "Active"
        );

        if (columnRef.current) observer.observe(columnRef.current);
        return () => observer.disconnect();
    }, [hall.name, onVisibilityChange]);

    // Header Styles based on Status
    let headerStyle = "bg-gradient-to-b from-slate-800/40 to-slate-900/40 border-white/5 group-hover/hall:bg-slate-800/60";
    let textStyle = "text-white group-hover/hall:text-indigo-200";
    let iconColor = "text-slate-400 group-hover/hall:text-indigo-400";
    let bgIcon = "bg-white/5 group-hover/hall:bg-indigo-500/20";

    if (colStatus === 'warning') {
        headerStyle = "bg-gradient-to-b from-amber-900/40 to-amber-900/10 border-amber-500/50";
        textStyle = "text-amber-100";
        iconColor = "text-amber-400";
        bgIcon = "bg-amber-500/20";
    } else if (colStatus === 'ready') {
        headerStyle = "bg-gradient-to-b from-emerald-900/40 to-emerald-900/10 border-emerald-500/50";
        textStyle = "text-emerald-100";
        iconColor = "text-emerald-400";
        bgIcon = "bg-emerald-500/20";
    }

    return (
        <div ref={columnRef} className={`
            flex flex-col 
            ${widthClass}
            min-w-0 shrink-0 h-full group/hall overflow-hidden snap-start px-0 
            border-r border-white/5 last:border-none bg-transparent relative
            group/scroll
        `}>
            
            {/* Hall Header */}
            <div 
                onClick={() => onHallClick(hall.name)}
                className={`
                    flex-none relative z-20 p-4 mb-2 mx-2 rounded-xl cursor-pointer overflow-hidden border
                    transition-all duration-300 backdrop-blur-md
                    ${headerStyle}
                `}
            >
                {/* Background Text (Number + Category) */}
                <span className={`absolute -right-2 -top-4 text-7xl font-black pointer-events-none select-none whitespace-nowrap transition-colors ${colStatus === 'default' ? 'text-white/5 group-hover/hall:text-indigo-500/10' : 'text-white/5'}`}>
                    {displayName} {categoryName}
                </span>

                <div className="flex justify-between items-end relative z-10">
                    <div className="flex flex-col">
                         <span className={`hall-header-subtitle text-xs font-bold uppercase tracking-widest mb-0.5 ${colStatus === 'default' ? 'text-slate-500' : 'text-white/60'}`}>Кинозал</span>
                         <h2 className={`text-2xl font-black transition-colors flex items-center gap-2 ${textStyle}`}>
                            <span>{displayName}</span>
                            {categoryName && <span>{categoryName}</span>}
                         </h2>
                    </div>
                    
                    <div className="flex items-center gap-2">
                         {colStatus === 'warning' && <AlertCircle size={20} className="text-amber-400 animate-pulse" />}
                         {colStatus === 'ready' && <CheckCircle2 size={20} className="text-emerald-400" />}
                         
                         <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${bgIcon}`}>
                             <ArrowRight size={16} className={`${iconColor} -rotate-45 group-hover/hall:rotate-0 transition-transform duration-300`} />
                         </div>
                    </div>
                </div>
            </div>

            {/* Sessions Scrollable Area - WRAPPED for Custom Scrollbar */}
            <div className="flex-1 relative overflow-hidden">
                <div 
                    ref={scrollRef}
                    className="absolute inset-0 overflow-y-auto overflow-x-hidden px-4 pr-4 pb-20 space-y-3 hide-scrollbar"
                >
                    <div className="absolute left-[39px] top-0 bottom-0 w-px bg-gradient-to-b from-slate-800 to-transparent -z-10"></div>

                    {isLoading ? (
                        Array.from({ length: 8 }).map((_, i) => (
                            <SkeletonMovieCard key={`skeleton-${hall.id}-${i}`} />
                        ))
                    ) : (
                        sessions && sessions.length > 0 ? (
                            sessions.map((session, idx) => (
                                <MovieCard 
                                    key={`${session.id}-${refreshKey}`} 
                                    session={session} 
                                    settings={settings}
                                    index={idx}
                                    selectedMovieName={selectedMovieName}
                                    onSelectMovie={onSelectMovie}
                                />
                            ))
                        ) : (
                            <div className="mt-20 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-300 opacity-40">
                                <MonitorPlay size={48} className="mb-2 text-slate-600"/>
                                <span className="text-lg font-bold text-slate-500 font-mono uppercase tracking-widest">Нет сеансов</span>
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

export const ScheduleGrid: React.FC<ScheduleGridProps> = ({ sessions, halls, onHallClick, settings, isLoading, columnWidthClass = "w-full", selectedMovieName, onSelectMovie, refreshKey }) => {

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [visibleHalls, setVisibleHalls] = useState<Set<string>>(new Set());
  const [scrollRatio, setScrollRatio] = useState(0);
  const [isScrollable, setIsScrollable] = useState(false);

  const hallNames = useMemo(() => halls.map(h => h.name), [halls]);

  const sessionsByHall = useMemo(() => {
    const grouped: Record<string, MovieSession[]> = {};
    // Initialize for all halls present in DB
    halls.forEach(h => {
        grouped[h.name] = [];
    });
    
    if (sessions) {
        sessions.forEach(session => {
          // If session belongs to a hall not in our list (e.g. deleted), add it dynamically or skip
          if (!grouped[session.hall_name]) {
            grouped[session.hall_name] = [];
          }
          grouped[session.hall_name].push(session);
        });
    }

    Object.keys(grouped).forEach(key => {
        grouped[key].sort((a, b) => a.time.localeCompare(b.time));
    });

    return grouped;
  }, [sessions, halls]);

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
  }, [isLoading, halls]);

  const handleVisibilityChange = (id: string, isVisible: boolean) => {
      setVisibleHalls(prev => {
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

  // --- Keyboard & Wheel Navigation ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        // Prevent scrolling if user is typing in a form field
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

        if (!scrollContainerRef.current) return;
        
        // Scroll by the viewport width (exactly the amount of visible columns)
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
    <div className="w-full h-full relative">
        <div 
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="w-full h-full overflow-x-auto overflow-y-hidden snap-x snap-mandatory touch-pan-x hide-scrollbar"
        >
            <div className="flex h-full w-full">
                {halls.length > 0 ? (
                    halls.map((hall) => (
                    <HallColumn 
                        key={hall.id}
                        hall={hall}
                        sessions={sessionsByHall[hall.name]}
                        onHallClick={onHallClick}
                        settings={settings}
                        isLoading={isLoading}
                        widthClass={columnWidthClass}
                        onVisibilityChange={handleVisibilityChange}
                        selectedMovieName={selectedMovieName}
                        onSelectMovie={onSelectMovie}
                        refreshKey={refreshKey}
                    />
                    ))
                ) : (
                    // Fallback if no halls found in DB, just to show something or empty state
                     <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
                        <MonitorPlay size={64} className="mb-4 opacity-50"/>
                        <p className="text-xl font-bold">Залы не найдены</p>
                        <p className="text-sm">Синхронизируйте базу данных</p>
                    </div>
                )}
            </div>
        </div>
        
        {halls.length > 0 && (
            <ScrollIndicator 
                items={hallNames}
                visibleItems={visibleHalls}
                scrollRatio={scrollRatio}
                onScrub={handleScrub}
                onStep={handleStep}
                isScrollable={isScrollable}
            />
        )}
    </div>
  );
};
