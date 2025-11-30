import React, { useState, useRef, memo, useCallback, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MovieSession, CONTENT_STATUS_CONFIG, AppSettings, ContentStatus } from '../types';
import { Play, Hourglass, Clock, ChevronDown, ChevronUp, Check, Monitor, RefreshCw } from 'lucide-react';
import { BackendService } from '../backend/aggregator';

// Detect if it's a touch device once
const isTouchDevice = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);

interface MovieCardProps {
  session: MovieSession;
  settings: AppSettings;
  index?: number;
  selectedMovieName: string | null;
  onSelectMovie: (name: string) => void;
}

// --- STATUS SELECT DROPDOWN (PORTAL) ---
const StatusSelect = ({ 
    session,
    isOpen, 
    onClose, 
    triggerRef,
    onSelect
}: { 
    session: MovieSession;
    isOpen: boolean; 
    onClose: () => void; 
    triggerRef: React.RefObject<HTMLElement>;
    onSelect: (s: ContentStatus) => void;
}) => {
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [page, setPage] = useState(0);

    // Constants for Layout
    const ITEM_HEIGHT = 48;
    const ITEMS_PER_PAGE = 3;
    const MAX_PANEL_HEIGHT = ITEM_HEIGHT * ITEMS_PER_PAGE; // 144px
    const MAIN_WIDTH = 420; 
    const GAP = 8;
    const INDICATOR_WIDTH = 32; 
    const BORDER_OFFSET = 2; 

    // Sorting Logic: Hall Specific first
    const sortedStatusKeys = useMemo(() => {
        const hallSpecificKeys = ['ready_hall', 'download_hall', 'no_keys'];
        const allKeys = Object.keys(CONTENT_STATUS_CONFIG) as ContentStatus[];
        
        return allKeys.sort((a, b) => {
            const aIsHall = hallSpecificKeys.includes(a);
            const bIsHall = hallSpecificKeys.includes(b);
            
            if (aIsHall && !bIsHall) return -1;
            if (!aIsHall && bIsHall) return 1;
            return 0;
        });
    }, []);

    const totalPages = Math.ceil(sortedStatusKeys.length / ITEMS_PER_PAGE);
    
    // Calculate which page currently holds the selected status (for indicator highlight)
    const selectedIndex = sortedStatusKeys.indexOf(session.content_status);
    const selectedPage = selectedIndex >= 0 ? Math.floor(selectedIndex / ITEMS_PER_PAGE) : -1;
    
    // Reset page on open
    useEffect(() => {
        if (isOpen) {
            // Always open on the first page so the user sees the most important statuses first
            setPage(0);
        }
    }, [isOpen]);

    const visibleItems = sortedStatusKeys.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);

    // Navigation Handlers
    const handleNext = useCallback(() => {
        setPage(p => Math.min(p + 1, totalPages - 1));
    }, [totalPages]);

    const handlePrev = useCallback(() => {
        setPage(p => Math.max(p - 1, 0));
    }, []);

    const handleWheel = (e: React.WheelEvent) => {
        e.stopPropagation();
        if (e.deltaY > 0) handleNext();
        else handlePrev();
    };

    // Close on click outside or scroll
    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) && 
                triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
                onClose();
            }
        };

        const handleGlobalScroll = (e: Event) => {
            if (dropdownRef.current && dropdownRef.current.contains(e.target as Node)) {
                return;
            }
            onClose(); 
        };

        document.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('scroll', handleGlobalScroll, { capture: true });
        
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', handleGlobalScroll, { capture: true });
        };
    }, [isOpen, onClose, triggerRef]);

    if (!isOpen || !triggerRef.current) return null;

    const rect = triggerRef.current.getBoundingClientRect();
    const viewportWidth = document.documentElement.clientWidth;
    const totalPanelHeight = MAX_PANEL_HEIGHT + BORDER_OFFSET;
    
    // Dynamic Width Calculation
    const fullRequiredWidth = MAIN_WIDTH + GAP + INDICATOR_WIDTH;
    const availableScreenWidth = viewportWidth - 24; 
    const isSmallScreen = availableScreenWidth < fullRequiredWidth;
    
    const actualMainWidth = isSmallScreen 
        ? availableScreenWidth - GAP - INDICATOR_WIDTH 
        : MAIN_WIDTH;
        
    const actualTotalWidth = actualMainWidth + GAP + INDICATOR_WIDTH;

    // Position Logic
    let left = rect.left;
    let top = rect.bottom + 8;

    if (top + totalPanelHeight > window.innerHeight) {
        top = rect.top - totalPanelHeight - 8;
    }
    if (left + actualTotalWidth > viewportWidth) {
        left = viewportWidth - actualTotalWidth - 12;
    }
    if (left < 12) left = 12;

    const style: React.CSSProperties = {
        position: 'fixed',
        left,
        top,
        zIndex: 9999,
        display: 'flex',
        gap: `${GAP}px`, 
        alignItems: 'flex-start'
    };

    return createPortal(
        <div 
            ref={dropdownRef}
            style={style}
            className="animate-in fade-in zoom-in-95 duration-150"
            onWheel={handleWheel}
        >
            {/* 1. Main List Panel */}
            <div 
                className="flex-1 bg-[#0f172a] border border-indigo-500/50 rounded-xl shadow-2xl shadow-indigo-500/20 overflow-hidden box-border flex flex-col"
                style={{ 
                    width: `${actualMainWidth}px`,
                    height: `${MAX_PANEL_HEIGHT}px`
                }}
            >
                <div className="flex-1 w-full">
                    {visibleItems.map((statusKey, idx) => {
                        const config = CONTENT_STATUS_CONFIG[statusKey];
                        const isSelected = session.content_status === statusKey;
                        const isHallSpecific = ['ready_hall', 'download_hall', 'no_keys'].includes(statusKey);
                        
                        const globalIdx = (page * ITEMS_PER_PAGE) + idx;
                        const nextGlobalKey = sortedStatusKeys[globalIdx + 1];
                        
                        const showSeparator = isHallSpecific && nextGlobalKey && !['ready_hall', 'download_hall', 'no_keys'].includes(nextGlobalKey);

                        return (
                            <button
                                key={statusKey}
                                onClick={(e) => { e.stopPropagation(); onSelect(statusKey); }}
                                className={`
                                    w-full flex items-center justify-between px-4 text-left transition-colors group relative
                                    ${isSelected ? 'bg-indigo-500/10' : 'hover:bg-slate-800'}
                                    ${showSeparator && idx < ITEMS_PER_PAGE - 1 ? 'border-b border-slate-700/60' : ''}
                                `}
                                style={{ height: `${ITEM_HEIGHT}px` }}
                            >
                                <div className="flex items-center gap-3 w-full overflow-hidden">
                                    <div className={`w-2.5 h-2.5 rounded-full ${config.bg} ${config.glow} shrink-0 shadow-sm`}></div>
                                    
                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                        <span className={`
                                            text-sm font-bold uppercase tracking-wide truncate block w-full
                                            ${isSelected ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}
                                        `}>
                                            {config.label}
                                        </span>
                                        {isHallSpecific && (
                                            <Monitor size={14} className="text-slate-600 shrink-0" />
                                        )}
                                    </div>
                                </div>
                                {isSelected && <Check size={16} className="text-indigo-400 shrink-0 ml-3" />}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* 2. Side Panel (Pagination & Indicators) */}
            <div 
                className="w-8 bg-[#0f172a] border border-indigo-500/30 rounded-xl flex flex-col items-center justify-between py-1 shadow-xl shadow-indigo-500/10 shrink-0 select-none transition-all box-border"
                style={{ height: `${totalPanelHeight}px` }}
            >
                {/* UP BUTTON */}
                <button 
                    onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                    disabled={page === 0}
                    className={`
                        w-full h-6 flex items-center justify-center transition-colors
                        ${page === 0 ? 'text-slate-700 cursor-default' : 'text-indigo-400 hover:text-white hover:bg-slate-800 cursor-pointer'}
                    `}
                >
                    <ChevronUp size={16} />
                </button>

                {/* PAGE INDICATORS (STRIPS) */}
                <div className="flex flex-col items-center justify-center gap-2 flex-1 w-full">
                    {Array.from({ length: totalPages }).map((_, idx) => {
                        const isCurrentPage = idx === page;
                        const isPageWithSelection = idx === selectedPage;
                        
                        return (
                            <div 
                                key={`page-indicator-${idx}`}
                                onClick={(e) => { e.stopPropagation(); setPage(idx); }}
                                className={`
                                    rounded-full transition-all duration-300 w-1.5 cursor-pointer
                                    ${isCurrentPage 
                                        ? 'h-8 bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.5)]' 
                                        : isPageWithSelection
                                            ? 'h-2 bg-emerald-500' 
                                            : 'h-2 bg-slate-700 hover:bg-slate-600'
                                    }
                                `}
                            />
                        );
                    })}
                </div>

                {/* DOWN BUTTON */}
                <button 
                    onClick={(e) => { e.stopPropagation(); handleNext(); }}
                    disabled={page >= totalPages - 1}
                    className={`
                        w-full h-6 flex items-center justify-center transition-colors
                        ${page >= totalPages - 1 ? 'text-slate-700 cursor-default' : 'text-indigo-400 hover:text-white hover:bg-slate-800 cursor-pointer'}
                    `}
                >
                    <ChevronDown size={16} />
                </button>
            </div>
        </div>,
        document.body
    );
};


// --- SKELETON COMPONENT ---
export const SkeletonMovieCard = () => {
  return (
    <div className="w-full h-[168px] rounded-xl bg-[#1e293b] border border-slate-700/50 p-3 flex items-center justify-center select-none">
       <RefreshCw size={32} className="text-slate-600 animate-spin" />
    </div>
  );
};

const PortalTooltip = ({ 
    text, 
    visible, 
    position, 
    large = false,
    title
}: { 
    text: string, 
    visible: boolean, 
    position: { x: number, y: number }, 
    large?: boolean,
    title?: string
}) => {
    if (!visible) return null;

    let left = position.x + 15;
    let top = position.y + 15;
    
    if (left + (large ? 300 : 150) > window.innerWidth) {
        left = position.x - (large ? 310 : 160);
    }
    if (top + 100 > window.innerHeight) {
        top = position.y - 50;
    }

    return createPortal(
        <div 
            className={`
                fixed z-[9999] pointer-events-none
                bg-[#1e293b] text-slate-100 rounded-lg 
                border border-slate-600 shadow-2xl shadow-black/80 ring-1 ring-black/50
                backdrop-blur-sm
                ${large 
                    ? 'p-4 w-[360px] text-base font-mono break-all leading-relaxed tracking-tight' 
                    : 'px-3 py-2 text-sm font-medium whitespace-nowrap'
                }
                animate-in fade-in zoom-in-95 duration-200
            `}
            style={{ top, left }}
        >
            {title && (
                <div className="text-xs uppercase text-slate-500 font-bold mb-2 tracking-widest border-b border-slate-700 pb-1">
                    {title}
                </div>
            )}
            {text}
        </div>,
        document.body
    );
};

const MovieCardComponent: React.FC<MovieCardProps> = ({ session, settings, index = 0, selectedMovieName, onSelectMovie }) => {
  
  const statusConfig = CONTENT_STATUS_CONFIG[session.content_status];
  const isFinished = session.time_status === 'finished';
  
  const checkIsLive = () => {
      const now = new Date();
      const start = new Date(`${session.date}T${session.time}:00`);
      const end = new Date(`${session.date}T${session.end_time}:00`);
      if (end < start) {
          end.setDate(end.getDate() + 1);
      }
      return now >= start && now <= end;
  };

  const isLive = checkIsLive();
  const shouldHighlight = isLive && settings.highlightCurrent;
  const isCompact = settings.cardDensity === 'compact';
  const enableAnimations = settings.enableAnimations;

  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [tooltipState, setTooltipState] = useState<{ 
    visible: boolean; 
    text: string; 
    large: boolean; 
    title?: string;
    x: number;
    y: number 
  }>({ visible: false, text: '', large: false, x: 0, y: 0 });

  const [isStatusMenuOpen, setStatusMenuOpen] = useState(false);
  const statusTriggerRef = useRef<HTMLButtonElement>(null);

  const hoverTimeoutRef = useRef<any>(null);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);
  
  const isSelected = useMemo(() => selectedMovieName === session.name, [selectedMovieName, session.name]);

  const handleMouseEnter = (e: React.MouseEvent, text: string, large = false, title?: string) => {
      if (isTouchDevice || !text) return;
      
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);

      hoverTimeoutRef.current = setTimeout(() => {
          setTooltipState({
              visible: true,
              text,
              large,
              title,
              x: lastMousePosRef.current.x,
              y: lastMousePosRef.current.y
          });
      }, 600);
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
      if (isTouchDevice) return;
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };

      if (rafRef.current) return; 

      rafRef.current = requestAnimationFrame(() => {
          setTooltipState(prev => {
             if (!prev.visible) return prev;
             return { ...prev, x: lastMousePosRef.current.x, y: lastMousePosRef.current.y };
          });
          rafRef.current = null;
      });
  }, []);

  const handleMouseLeave = () => {
      if (hoverTimeoutRef.current) {
          clearTimeout(hoverTimeoutRef.current);
          hoverTimeoutRef.current = null;
      }
      if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
      }
      setTooltipState(prev => ({ ...prev, visible: false }));
  };

  const performCopy = (text: string, fieldName: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 1000);
  };

  const handleDesktopClick = (e: React.MouseEvent, text: string, fieldName: string) => {
      e.stopPropagation(); 
      performCopy(text, fieldName);
  };

  const handleStatusClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      setStatusMenuOpen(!isStatusMenuOpen);
  };

  const handleStatusSelect = (status: ContentStatus) => {
      BackendService.setSessionStatus(session, status);
      setStatusMenuOpen(false);
  };

  const durationHours = Math.floor(session.duration / 60);
  const durationMins = session.duration % 60;
  const durationStr = `${durationHours}ч ${durationMins.toString().padStart(2, '0')}м`;

  const hasCredits = session.credits_display_from_start || session.credits_display_from_end;
  const hasDCP = !!session.dcp_package_name;
  const hasDistributor = !!session.distributor;

  return (
    <>
        <div 
        onClick={() => onSelectMovie(session.name)}
        onMouseMove={handleMouseMove}
        style={{ 
            animationDelay: `${index * 35}ms`,
            animationFillMode: 'both',
            willChange: 'transform, opacity'
        }}
        className={`
            relative w-full rounded-xl border group cursor-pointer
            ${isFinished ? 'opacity-50 grayscale' : ''} 
            
            ${isStatusMenuOpen 
                ? 'bg-[#1e293b] border-indigo-500 ring-1 ring-indigo-500 shadow-2xl z-[50]' 
                : isSelected
                    ? 'border-amber-400/80 bg-[#1e293b] ring-2 ring-amber-400 shadow-2xl shadow-amber-500/10 z-[45]'
                    : shouldHighlight
                        ? 'bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-indigo-400/50 shadow-[inset_0_0_15px_rgba(99,102,241,0.15)] hover:z-[40]' 
                        : 'bg-[#1e293b] border-slate-700 hover:border-slate-500 hover:z-[40]'
            }
            animate-cascade-in transition-all duration-200
            overflow-hidden
        `}
        >
        <div className={`absolute top-0 bottom-0 left-0 w-1 ${statusConfig.bg}`} />

        <div className={`pl-3 pr-2 flex flex-col w-full card-content-wrapper ${isCompact ? 'py-1.5' : 'py-2'}`}>
            
            <div className={`flex-none flex justify-between items-center leading-none border-b border-slate-700/50 ${isCompact ? 'pb-1.5' : 'pb-2'}`}>
                <div className="flex items-baseline gap-2 font-mono">
                    <span className={`font-bold tracking-tight ${isCompact ? 'text-lg' : 'text-xl'} ${shouldHighlight ? 'text-indigo-200 drop-shadow-sm' : 'text-slate-100'}`}>
                        {session.time}
                    </span>
                    <span className={`text-slate-400 font-medium ${isCompact ? 'text-base' : 'text-base'}`}>
                        - {session.end_time}
                    </span>
                    <div className="flex items-center gap-0.5 text-xs text-slate-500 ml-1">
                        <Clock size={12} className="mt-[1px]" />
                        <span>{durationStr}</span>
                    </div>
                </div>

                <div className="flex items-center gap-1.5">
                    {session.is_new && (
                        <span className="px-1.5 py-0.5 text-[11px] font-bold bg-indigo-600 text-white rounded-[4px] uppercase tracking-wider leading-none shadow-sm shadow-indigo-500/50">
                            NEW
                        </span>
                    )}
                    {session.is_subtitled && (
                        <span className="px-1.5 py-0.5 text-[11px] font-bold bg-teal-500/10 text-teal-400 border border-teal-500/30 rounded-[4px] uppercase tracking-wider leading-none">
                            SUB
                        </span>
                    )}
                    <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-[4px] border leading-none ${session.Format === '3D' ? 'border-purple-500/40 text-purple-300 bg-purple-500/10' : 'border-slate-600 text-slate-400'}`}>
                        {session.Format}
                    </span>
                </div>
            </div>

            <div className={`w-full flex flex-col ${isCompact ? 'py-1.5' : 'py-2'}`}>
                <div className="w-full max-w-full">
                    <h3 
                        onClick={(e) => { handleDesktopClick(e, session.name, 'title') }}
                        onMouseEnter={(e) => handleMouseEnter(e, session.name, true, "ПОЛНОЕ НАЗВАНИЕ")}
                        onMouseLeave={handleMouseLeave}
                        className={`
                            font-bold leading-tight block truncate transition-colors
                            ${isCompact ? 'text-lg' : 'text-xl'}
                            ${copiedField === 'title' ? 'text-emerald-400' : 'text-slate-200 hover:text-indigo-300'}
                        `} 
                    >
                        {session.name}
                    </h3>
                </div>

                <div className="flex items-center gap-2 text-xs w-full overflow-hidden">
                    <div className="flex-1 min-w-0">
                        {hasDCP ? (
                             <p 
                                onClick={(e) => { handleDesktopClick(e, session.dcp_package_name, 'dcp') }}
                                onMouseEnter={(e) => handleMouseEnter(e, session.dcp_package_name, true, "FULL DCP NAME")}
                                onMouseLeave={handleMouseLeave}
                                className={`
                                    font-mono truncate leading-tight opacity-60 transition-colors
                                    ${isCompact ? 'text-xs' : 'text-sm'}
                                    ${copiedField === 'dcp' ? 'text-emerald-400' : 'text-slate-400 hover:text-indigo-300'}
                                `}
                            >
                                {session.dcp_package_name}
                            </p>
                        ) : (
                            <span className={`italic ${isCompact ? 'text-xs text-slate-600' : 'text-sm text-slate-600'}`}>Нет данных DCP</span>
                        )}
                    </div>
                    
                    <span className={`font-medium flex-shrink-0 px-1 border-l border-slate-600/50 whitespace-nowrap ${isCompact ? 'text-xs' : 'text-sm'} ${hasDistributor ? 'text-slate-200' : 'text-slate-600 italic'}`}>
                        {hasDistributor ? session.distributor : 'Нет данных'}
                    </span>
                </div>
            </div>

            <div className={`flex-none flex justify-between items-center border-t border-slate-700/50 ${isCompact ? 'pt-1' : 'pt-1.5'}`}>
                <button
                    ref={statusTriggerRef}
                    onClick={handleStatusClick}
                    className={`
                        text-sm font-bold uppercase tracking-wide truncate max-w-[65%] text-left
                        flex items-center gap-2 transition-all rounded -ml-1
                        ${isCompact ? 'py-1 px-2' : 'py-1.5 px-2'}
                        ${statusConfig.color}
                        ${isStatusMenuOpen ? 'bg-slate-700/50' : 'hover:bg-slate-800/50'}
                    `}
                >
                    <span className="truncate">{statusConfig.label}</span>
                    <ChevronDown size={14} className={`opacity-50 transition-transform ${isStatusMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {hasCredits ? (
                    <div className="flex items-center gap-2.5 font-mono leading-none">
                        {session.credits_display_from_start && (
                            <div 
                                onMouseEnter={(e) => handleMouseEnter(e, "Титры: От начала фильма")}
                                onMouseLeave={handleMouseLeave}
                                className={`flex items-center gap-1 text-slate-400 hover:text-white cursor-help transition-colors`}
                            >
                                <Play size={14} className="text-emerald-500" />
                                <span className="text-sm font-medium text-slate-300">
                                    {session.credits_display_from_start}
                                </span>
                            </div>
                        )}
                        
                        {session.credits_display_from_end && (
                            <div 
                                onMouseEnter={(e) => handleMouseEnter(e, "Титры: До конца фильма")}
                                onMouseLeave={handleMouseLeave}
                                className={`flex items-center gap-1 text-slate-400 hover:text-white cursor-help transition-colors`}
                            >
                                <span className="text-sm font-medium text-slate-300">
                                    -{session.credits_display_from_end}
                                </span>
                                <Hourglass size={14} className="text-orange-400" />
                            </div>
                        )}
                    </div>
                ) : (
                    <span className="text-sm text-slate-600 italic">Нет титров</span>
                )}
            </div>
        </div>
        </div>
        
        <PortalTooltip 
            visible={tooltipState.visible} 
            text={tooltipState.text} 
            position={{x: tooltipState.x, y: tooltipState.y}}
            large={tooltipState.large}
            title={tooltipState.title}
        />

        <StatusSelect 
            session={session}
            isOpen={isStatusMenuOpen}
            onClose={() => setStatusMenuOpen(false)}
            triggerRef={statusTriggerRef}
            onSelect={handleStatusSelect}
        />
    </>
  );
};

const arePropsEqual = (prev: MovieCardProps, next: MovieCardProps) => {
    const sessionUnchanged = 
        prev.session.id === next.session.id &&
        prev.session.content_status === next.session.content_status &&
        prev.session.time_status === next.session.time_status &&
        prev.session.is_new === next.session.is_new &&
        prev.session.name === next.session.name &&
        prev.session.dcp_package_name === next.session.dcp_package_name &&
        prev.session.time === next.session.time;

    const indexUnchanged = prev.index === next.index;
    const settingsUnchanged = prev.settings.cardDensity === next.settings.cardDensity 
        && prev.settings.highlightCurrent === next.settings.highlightCurrent
        && prev.settings.enableAnimations === next.settings.enableAnimations;

    // Rerender only if this card's own selection state changes
    const wasSelected = prev.selectedMovieName === prev.session.name;
    const isSelected = next.selectedMovieName === next.session.name;
    if (wasSelected !== isSelected) {
        return false;
    }
    
    return sessionUnchanged && indexUnchanged && settingsUnchanged;
};

export const MovieCard = memo(MovieCardComponent, arePropsEqual);