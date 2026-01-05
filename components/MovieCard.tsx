import React, { useState, useRef, memo, useCallback, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MovieSession, CONTENT_STATUS_CONFIG, AppSettings, ContentStatus } from '../types';
import { Play, Hourglass, Clock, ChevronDown, ChevronUp, Check, Monitor, RefreshCw, Sun, Truck } from 'lucide-react';
import { BackendService } from '../backend/aggregator';

// Detect if it's a touch device once
const isTouchDevice = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);

interface MovieCardProps {
  session: MovieSession;
  settings: AppSettings;
  index?: number;
  selectedMovieName: string | null;
  onSelectMovie: (name: string) => void;
  onStatusChange?: (id: string, status: ContentStatus) => void;
  updateSetting?: (key: keyof AppSettings, value: any) => void;
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
            className=""
            onWheel={handleWheel}
        >
            {/* 1. Main List Panel */}
            <div 
                className="flex-1 bg-[#0f172a] border border-indigo-500/50 rounded-xl overflow-hidden box-border flex flex-col"
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
                className="w-8 bg-[#0f172a] border border-indigo-500/30 rounded-xl flex flex-col items-center justify-between py-1 shrink-0 box-border"
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
                                    rounded-full w-1.5 cursor-pointer
                                    ${isCurrentPage 
                                        ? 'h-8 bg-indigo-500' 
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
    <div className="w-full h-[168px] rounded-xl border border-slate-700/50 p-3 overflow-hidden select-none animate-cascade-in skeleton-shimmer relative">
      {/* Имитация структуры карточки */}
      <div className="absolute top-0 bottom-0 left-0 w-1 bg-slate-700/50" />
      
      <div className="pl-3 pr-2 flex flex-col w-full h-full">
        {/* Верхняя строка: время и бейджи */}
        <div className="flex-none flex justify-between items-center leading-none border-b border-slate-700/50 pb-2">
          <div className="flex items-center gap-2">
            <div className="w-16 h-6 bg-slate-700/50 rounded" />
            <div className="w-16 h-4 bg-slate-700/30 rounded" />
          </div>
          <div className="flex gap-1">
            <div className="w-8 h-4 bg-slate-700/30 rounded-[4px]" />
            <div className="w-8 h-4 bg-slate-700/30 rounded-[4px]" />
          </div>
        </div>

        {/* Название фильма */}
        <div className="flex-1 flex flex-col justify-center py-2">
          <div className="w-3/4 h-6 bg-slate-700/40 rounded mb-2" />
          <div className="w-1/2 h-4 bg-slate-700/30 rounded" />
        </div>

        {/* Нижняя строка: статус и титры */}
        <div className="flex-none flex justify-between items-center border-t border-slate-700/50 pt-1.5">
          <div className="w-24 h-6 bg-slate-700/40 rounded" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-4 bg-slate-700/30 rounded" />
            <div className="w-8 h-4 bg-slate-700/30 rounded" />
          </div>
        </div>
      </div>

      {/* Иконка загрузки в центре */}
      <div className="absolute inset-0 flex items-center justify-center opacity-20">
        <RefreshCw size={32} className="text-slate-400 animate-spin" />
      </div>
    </div>
  );
};

type TooltipType = 'small' | 'medium' | 'large';

interface TooltipPosition {
    x: number;
    y: number;
}

const PortalTooltip = ({ 
    text, 
    visible, 
    triggerRef,
    tooltipType = 'small',
    title,
    subtitle,
    shouldAnimate = false
}: { 
    text: string, 
    visible: boolean, 
    triggerRef: React.RefObject<HTMLElement>,
    tooltipType?: TooltipType,
    title?: string,
    subtitle?: string,
    shouldAnimate?: boolean
}) => {
    const [tooltipSize, setTooltipSize] = React.useState({ width: 0, height: 0 });
    const tooltipRef = React.useRef<HTMLDivElement>(null);

    // Измеряем размер подсказки после рендера
    React.useEffect(() => {
        if (visible && tooltipRef.current) {
            const rect = tooltipRef.current.getBoundingClientRect();
            setTooltipSize({ width: rect.width, height: rect.height });
        }
    }, [visible, text, tooltipType]);

    if (!visible || !triggerRef.current) return null;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Размеры подсказки по умолчанию (если еще не измерен)
    const tooltipWidth = tooltipSize.width > 0 ? tooltipSize.width : 
                        tooltipType === 'large' ? 480 : 
                        tooltipType === 'medium' ? 300 : 150;
    const tooltipHeight = tooltipSize.height > 0 ? tooltipSize.height : 
                         tooltipType === 'large' ? 300 : 
                         tooltipType === 'medium' ? 100 : 50;

    const GAP = 8; // Расстояние от элемента

    // Вертикальное позиционирование: проверяем свободное место
    let top: number;
    const spaceBelow = viewportHeight - triggerRect.bottom;
    const spaceAbove = triggerRect.top;
    
    if (spaceBelow >= tooltipHeight + GAP) {
        // Показываем под элементом
        top = triggerRect.bottom + GAP;
    } else if (spaceAbove >= tooltipHeight + GAP) {
        // Показываем над элементом
        top = triggerRect.top - tooltipHeight - GAP;
    } else {
        // Недостаточно места ни сверху ни снизу - показываем там, где больше места
        top = spaceBelow > spaceAbove ? triggerRect.bottom + GAP : triggerRect.top - tooltipHeight - GAP;
    }

    // Горизонтальное позиционирование: выравниваем по левому краю элемента
    let left = triggerRect.left;
    
    // Проверяем что не вылезает за правую границу
    if (left + tooltipWidth > viewportWidth - 12) {
        left = viewportWidth - tooltipWidth - 12;
    }
    if (left < 12) left = 12;

    return createPortal(
        <div 
            ref={tooltipRef}
            className={`
                fixed z-[9999] pointer-events-none
                bg-[#1e293b] text-slate-100 rounded-lg 
                border border-slate-600 shadow-2xl shadow-black/80 ring-1 ring-black/50
                backdrop-blur-sm
                ${tooltipType === 'large' 
                    ? 'p-4 text-sm font-mono whitespace-pre leading-relaxed tracking-tight overflow-y-auto max-h-[400px]' 
                    : tooltipType === 'medium'
                        ? 'px-4 py-2 text-sm font-medium break-words max-w-[400px]'
                        : 'px-3 py-2 text-xs font-medium whitespace-nowrap'
                }
                ${shouldAnimate ? 'animate-in fade-in zoom-in-95 duration-200' : ''}
            `}
            style={{ top, left }}
        >
            {title && (
                <div className="text-xs uppercase text-slate-500 font-bold mb-2 tracking-widest border-b border-slate-700 pb-1">
                    {title}
                </div>
            )}
            {subtitle && (
                <div className="text-sm font-medium mb-3 pb-2 border-b border-slate-700/60 text-slate-200">
                    {subtitle}
                </div>
            )}
            {text}
        </div>,
        document.body
    );
};

const MovieCardComponent: React.FC<MovieCardProps> = ({ session, settings, index = 0, selectedMovieName, onSelectMovie, onStatusChange }) => {
  
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
  
  // State для tooltip с поддержкой refs и типов
  const [tooltipState, setTooltipState] = useState<{
    visible: boolean;
    text: string;
    tooltipType: TooltipType;
    title?: string;
    triggerRef: React.RefObject<HTMLElement>;
    shouldAnimate: boolean; // Флаг для управления анимацией
  }>({ 
    visible: false, 
    text: '', 
    tooltipType: 'small',
    triggerRef: { current: null },
    shouldAnimate: false
  });

  const [isStatusMenuOpen, setStatusMenuOpen] = useState(false);
  const statusTriggerRef = useRef<HTMLButtonElement>(null);

  const hoverTimeoutRef = useRef<any>(null);
  
  // Refs для всех элементов с подсказками
  const timeTooltipRef = useRef<HTMLDivElement>(null);
  const titleTooltipRef = useRef<HTMLHeadingElement>(null);
  const dcpTooltipRef = useRef<HTMLParagraphElement>(null);
  const adsTooltipRef = useRef<HTMLDivElement>(null);
  const creditsStartTooltipRef = useRef<HTMLDivElement>(null);
  const creditsEndTooltipRef = useRef<HTMLDivElement>(null);
  
  const isSelected = useMemo(() => selectedMovieName === session.name, [selectedMovieName, session.name]);

  const handleMouseEnter = (
    e: React.MouseEvent, 
    text: string, 
    tooltipType: TooltipType = 'small', 
    triggerRef: React.RefObject<HTMLElement>,
    title?: string
  ) => {
      if (isTouchDevice || !text) return;
      
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);

      hoverTimeoutRef.current = setTimeout(() => {
          // Сначала показываем подсказку без анимации
          setTooltipState({
              visible: true,
              text,
              tooltipType,
              title,
              triggerRef,
              shouldAnimate: false
          });
          
          // Затем через 50ms включаем анимацию для плавного появления
          setTimeout(() => {
              setTooltipState(prev => ({
                  ...prev,
                  shouldAnimate: true
              }));
          }, 50);
      }, 600);
  };

  const handleMouseLeave = () => {
      if (hoverTimeoutRef.current) {
          clearTimeout(hoverTimeoutRef.current);
          hoverTimeoutRef.current = null;
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
      if (onStatusChange) {
          onStatusChange(session.id, status);
      } else {
          BackendService.setSessionStatus(session, status);
      }
      setStatusMenuOpen(false);
  };

  // Формат рекламы в карточке как мм:сс
  const adsTotalSeconds = session.commercial_ads_duration * 60;
  const adsMins = Math.floor(adsTotalSeconds / 60);
  const adsSecs = Math.round(adsTotalSeconds % 60);
  const adsDurationStr = `${adsMins.toString().padStart(2, '0')}:${adsSecs.toString().padStart(2, '0')}`;
  
  // Длительность фильма с учётом коммерческой рекламы
  const totalDuration = session.duration + session.commercial_ads_duration;
  const totalHours = Math.floor(totalDuration / 60);
  const totalMins = totalDuration % 60;
  const movieDurationStr = `${totalHours.toString().padStart(2, '0')}:${totalMins.toString().padStart(2, '0')}`;

  // Создаем tooltip текст для рекламы (технический стиль)
  const adsTooltipParts: string[] = [];
  
  // Вшитая реклама - переводим в секунды
  const embeddedSeconds = session.embedded_ads_duration * 60;
  
  const commercialTotalSeconds = session.commercial_ads && session.commercial_ads.length > 0 
      ? session.commercial_ads.reduce((sum, ad) => sum + ad.duration, 0)
      : session.commercial_ads_duration * 60;
  
  const commercialMins = Math.floor(commercialTotalSeconds / 60);
  const commercialSecs = commercialTotalSeconds % 60;
  const totalFormatted = `${commercialMins.toString().padStart(2, '0')}:${commercialSecs.toString().padStart(2, '0')}`;
  
  // > EMBEDDED: mm:cc (XXm YYs)
  if (session.embedded_ads_duration > 0) {
      const mins = Math.floor(embeddedSeconds / 60);
      const secs = embeddedSeconds % 60;
      const minutes = mins.toString().padStart(2, '0');
      const seconds = secs.toString().padStart(2, '0');
      adsTooltipParts.push(`> EMBEDDED: ${minutes}:${seconds} (${mins}m ${secs}s)`);
  }
  
  // > COMMERCIAL: mm:cc (XXm YYs)
  if (session.commercial_ads_duration > 0) {
      const mins = Math.floor(commercialTotalSeconds / 60);
      const secs = commercialTotalSeconds % 60;
      const minutes = mins.toString().padStart(2, '0');
      const seconds = secs.toString().padStart(2, '0');
      adsTooltipParts.push(`> COMMERCIAL: ${minutes}:${seconds} (${mins}m ${secs}s)`);
  }
  
  // > AD BREAKDOWN:
  if (session.commercial_ads && session.commercial_ads.length > 0) {
      adsTooltipParts.push('');
      adsTooltipParts.push('> AD BREAKDOWN:');
      
      // Группируем по 2 в строку
      for (let i = 0; i < session.commercial_ads.length; i += 2) {
          const ad1 = session.commercial_ads[i];
          const ad2 = session.commercial_ads[i + 1];
          
          const idx1 = (i + 1).toString().padStart(2, '0');
          // Обрезаем название до 15 символов, добавляем ... если длиннее
          const name1Truncated = ad1.name.length > 15 ? ad1.name.substring(0, 15) + '...' : ad1.name;
          const name1 = name1Truncated.padEnd(18, '.');
          const duration1 = `${ad1.duration}s`;
          
          let line = `  [${idx1}] ${name1} ${duration1}`;
          
          if (ad2) {
              const idx2 = (i + 2).toString().padStart(2, '0');
              const name2Truncated = ad2.name.length > 15 ? ad2.name.substring(0, 15) + '...' : ad2.name;
              const name2 = name2Truncated.padEnd(18, '.');
              const duration2 = `${ad2.duration}s`;
              line += `  [${idx2}] ${name2} ${duration2}`;
          }
          
          adsTooltipParts.push(line);
      }
      
      adsTooltipParts.push('  ' + '─'.repeat(50));
      adsTooltipParts.push(`  [TOTAL]: ${commercialTotalSeconds} seconds (${totalFormatted})`);
  }
  
  const adsTooltipText = adsTooltipParts.length > 0 ? adsTooltipParts.join('\n') : '> NO ADS DATA';
  const adsTitle = '[R] РЕКЛАМА DATA';
  const adsTooltipTitle = 'РЕКЛАМА';

  const hasCredits = session.credits_display_from_start || session.credits_display_from_end;
  const hasDCP = !!session.dcp_package_name;
  const hasDistributor = !!session.distributor;
  const hasDelivery = !!session.delivery_type;
  const hasLightStart = !!session.light_on_start;
  const hasLightEnd = !!session.light_on_end;
  const hasLightEndHalf = !!session.light_on_end_half;
  
  const hasLightData = hasLightStart || hasLightEnd || hasLightEndHalf;

  return (
    <>
        <div 
        onClick={() => onSelectMovie(session.name)}
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
            ${enableAnimations ? 'animate-cascade-in' : ''} transition-all duration-200
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
                    <div 
                        ref={adsTooltipRef}
                        className="flex items-center gap-0.5 text-xs text-slate-500 ml-1 cursor-help"
                        onMouseEnter={(e) => handleMouseEnter(e, adsTooltipText, 'large', adsTooltipRef, adsTitle)}
                        onMouseLeave={handleMouseLeave}
                    >
                        <Clock size={12} className="mt-[1px]" />
                        <span>{adsDurationStr}</span>
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
                    <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-[4px] border leading-none bg-amber-500/10 border-amber-500/40 text-amber-300`}>
                        {session.Tickets}
                    </span>
                    <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-[4px] border leading-none ${session.Format === '3D' ? 'border-purple-500/40 text-purple-300 bg-purple-500/10' : 'border-slate-600 text-slate-400'}`}>
                        {session.Format}
                    </span>
                    {session.age_limit && session.age_limit > 0 && (
                        <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-[4px] ${session.age_limit >= 18 ? 'bg-red-600 text-white' : 'bg-slate-600 text-slate-200'}`}>
                            {session.age_limit}+
                        </span>
                    )}
                </div>
            </div>

            <div className={`w-full flex flex-col ${isCompact ? 'py-1.5' : 'py-2'}`}>
                <div className="w-full max-w-full">
                    <h3 
                        ref={titleTooltipRef}
                        onClick={(e) => { handleDesktopClick(e, session.name, 'title') }}
                        onContextMenu={(e) => { e.preventDefault(); performCopy(session.name, 'title'); }}
                        onMouseEnter={(e) => handleMouseEnter(e, session.name, 'medium', titleTooltipRef, "ПОЛНОЕ НАЗВАНИЕ")}
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

                <div className="flex items-center gap-1.5 text-xs w-full overflow-hidden">
                    {hasDCP && (
                        <p 
                            ref={dcpTooltipRef}
                            onClick={(e) => { handleDesktopClick(e, session.dcp_package_name, 'dcp') }}
                            onContextMenu={(e) => { e.preventDefault(); performCopy(session.dcp_package_name, 'dcp'); }}
                            onMouseEnter={(e) => handleMouseEnter(e, session.dcp_package_name, 'medium', dcpTooltipRef, "FULL DCP NAME")}
                            onMouseLeave={handleMouseLeave}
                            className={`
                                font-mono truncate leading-tight opacity-60 transition-colors flex-1 min-w-0
                                ${isCompact ? 'text-xs' : 'text-sm'}
                                ${copiedField === 'dcp' ? 'text-emerald-400' : 'text-slate-400 hover:text-indigo-300'}
                            `}
                        >
                            {session.dcp_package_name}
                        </p>
                    )}
                    
                    {hasDistributor && (
                        <span className={`font-medium flex-shrink-0 px-1 whitespace-nowrap ${isCompact ? 'text-xs' : 'text-sm'} text-slate-200`}>
                            {session.distributor}
                        </span>
                    )}

                    {/* Доставка */}
                    {hasDelivery && (
                        <div 
                            className="flex items-center gap-0.5 text-xs font-mono text-slate-400 hover:text-indigo-300 cursor-help transition-colors flex-shrink-0"
                            onMouseEnter={(e) => handleMouseEnter(e, `Тип доставки: ${session.delivery_type}`, 'small', { current: e.target as HTMLElement })}
                            onMouseLeave={handleMouseLeave}
                        >
                            <Truck size={11} className="text-amber-400" />
                            <span className="text-slate-300">{session.delivery_type}</span>
                        </div>
                    )}
                </div>
            </div>

            <div className={`flex-none flex justify-between items-center border-t border-slate-700/50 ${isCompact ? 'pt-1' : 'pt-1.5'}`}>
                <button
                    ref={statusTriggerRef}
                    onClick={handleStatusClick}
                    className={`
                        text-sm font-bold uppercase tracking-wide truncate max-w-[55%] text-left
                        flex items-center gap-2 transition-all rounded -ml-1
                        ${isCompact ? 'py-1 px-2' : 'py-1.5 px-2'}
                        ${statusConfig.color}
                        ${isStatusMenuOpen ? 'bg-slate-700/50' : 'hover:bg-slate-800/50'}
                    `}
                >
                    <span className="truncate">{statusConfig.label}</span>
                    <ChevronDown size={14} className={`opacity-50 transition-transform ${isStatusMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                <div className="flex items-center gap-1.5 font-mono leading-none">
                    {session.light_on_start && (
                        <div 
                            className="flex items-center gap-0.5 text-xs text-slate-400 hover:text-white cursor-help transition-colors"
                            onMouseEnter={(e) => handleMouseEnter(e, "Свет ON 100% (с начала)", 'small', { current: e.target as HTMLElement })}
                            onMouseLeave={handleMouseLeave}
                        >
                            <Sun size={12} className="text-yellow-400" />
                            <span className="text-slate-300">{session.light_on_start}</span>
                        </div>
                    )}

                    {session.credits_display_from_start && (
                        <div 
                            ref={creditsStartTooltipRef}
                            onMouseEnter={(e) => handleMouseEnter(e, "Титры: От начала фильма", 'small', creditsStartTooltipRef)}
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
                            ref={creditsEndTooltipRef}
                            onMouseEnter={(e) => handleMouseEnter(e, "Титры: До конца фильма", 'small', creditsEndTooltipRef)}
                            onMouseLeave={handleMouseLeave}
                            className={`flex items-center gap-1 text-slate-400 hover:text-white cursor-help transition-colors`}
                        >
                            <span className="text-sm font-medium text-slate-300">
                                -{session.credits_display_from_end}
                            </span>
                            <Hourglass size={14} className="text-orange-400" />
                        </div>
                    )}

                    {session.light_on_end && (
                        <div 
                            className="flex items-center gap-0.5 text-xs text-slate-400 hover:text-white cursor-help transition-colors"
                            onMouseEnter={(e) => handleMouseEnter(e, "Свет ON 100% (с конца)", 'small', { current: e.target as HTMLElement })}
                            onMouseLeave={handleMouseLeave}
                        >
                            <span className="text-slate-300">-{session.light_on_end}</span>
                            <Sun size={12} className="text-yellow-400" />
                        </div>
                    )}
                </div>
            </div>
        </div>
        </div>
        
        <PortalTooltip 
            visible={tooltipState.visible} 
            text={tooltipState.text} 
            triggerRef={tooltipState.triggerRef}
            tooltipType={tooltipState.tooltipType}
            title={tooltipState.title}
            shouldAnimate={tooltipState.shouldAnimate}
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
