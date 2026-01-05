import React, { useRef, useState, useCallback, useLayoutEffect, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Terminal, Cpu } from 'lucide-react';

interface ScrollIndicatorProps {
    items: string[];
    visibleItems: Set<string>;
    scrollRatio: number;
    onScrub: (ratio: number) => void;
    onStep?: (direction: number) => void;
    isScrollable: boolean;
}

export const ScrollIndicator: React.FC<ScrollIndicatorProps> = ({ 
    items, 
    visibleItems, 
    scrollRatio,
    onScrub,
    onStep,
    isScrollable
}) => {
    const trackRef = useRef<HTMLDivElement>(null);
    const indicatorRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isHoveredZone, setIsHoveredZone] = useState(false);
    const [isZoneStable, setIsZoneStable] = useState(false);
    const [trackWidth, setTrackWidth] = useState(0);
    const dragInfo = useRef({ startX: 0, startRatio: 0 });
    const zoneTimeoutRef = useRef<any>(null);

    const VIEWPORT_WIDTH = 300;
    const BAR_WIDTH = 420;
    const ZONE_DELAY = 300;

    useLayoutEffect(() => {
        if (trackRef.current) {
            setTrackWidth(trackRef.current.scrollWidth);
        }
    }, [items, visibleItems]);

    useEffect(() => {
        const handleGlobalMouseMove = (e: MouseEvent) => {
            const zoneHeight = 120;
            const isInZone = e.clientY > window.innerHeight - zoneHeight;
            
            let isOverBar = false;
            if (indicatorRef.current) {
                const rect = indicatorRef.current.getBoundingClientRect();
                const padding = 30;
                isOverBar = (
                    e.clientX >= rect.left - padding && 
                    e.clientX <= rect.right + padding && 
                    e.clientY >= rect.top - padding && 
                    e.clientY <= rect.bottom + padding
                );
            }

            // Проверка на курсор над карточкой фильма
            const target = e.target as Element;
            const isOverMovieCard = target.closest('[class*="MovieCard"]') || target.closest('[class*="movie-card"]');

            setIsHoveredZone(isInZone);

            // Панель появляется только если мышь не зажата, не над карточкой и курсор в зоне достаточно долго
            if (e.buttons === 0 && !isOverMovieCard) {
                if (isInZone || isOverBar || isDragging) {
                    if (zoneTimeoutRef.current) clearTimeout(zoneTimeoutRef.current);
                    
                    if (!isZoneStable) {
                        zoneTimeoutRef.current = setTimeout(() => {
                            setIsZoneStable(true);
                        }, ZONE_DELAY);
                    }
                } else {
                    if (zoneTimeoutRef.current) clearTimeout(zoneTimeoutRef.current);
                    setIsZoneStable(false);
                }
            } else if (isOverMovieCard) {
                // Если курсор над карточкой - сразу скрываем панель
                if (zoneTimeoutRef.current) clearTimeout(zoneTimeoutRef.current);
                setIsZoneStable(false);
            }
        };

        window.addEventListener('mousemove', handleGlobalMouseMove);
        return () => {
            window.removeEventListener('mousemove', handleGlobalMouseMove);
            if (zoneTimeoutRef.current) clearTimeout(zoneTimeoutRef.current);
        };
    }, [isDragging, isZoneStable]);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        const deltaX = e.clientX - dragInfo.current.startX;
        let newRatio = dragInfo.current.startRatio + (deltaX / VIEWPORT_WIDTH);
        newRatio = Math.max(0, Math.min(1, newRatio));
        onScrub(newRatio);
    }, [onScrub, VIEWPORT_WIDTH]);
    
    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
        document.body.style.cursor = '';
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    }, [handleMouseMove]);

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
        dragInfo.current = {
            startX: e.clientX,
            startRatio: scrollRatio
        };
        document.body.style.cursor = 'grabbing';
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };


    const isOverflowing = trackWidth > VIEWPORT_WIDTH;
    let translateX = 0;

    if (isOverflowing) {
        translateX = -1 * scrollRatio * (trackWidth - VIEWPORT_WIDTH);
    } else {
        translateX = trackWidth > 0 ? (VIEWPORT_WIDTH - trackWidth) / 2 : 0;
    }

    if (!isScrollable) return null;

    const isVisible = isZoneStable || isDragging;

    return (
        <div 
            className={`fixed bottom-2 z-[100] transition-all duration-300 ease-out pointer-events-auto hidden md:block ${isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-12 scale-90 pointer-events-none'}`}
            style={{ left: '50%', transform: `translateX(-50%)`, width: `${BAR_WIDTH}px` }}
        >
            <div 
                ref={indicatorRef}
                className={`
                    relative bg-[#0f172a]/95 backdrop-blur-2xl border rounded-2xl p-2.5 shadow-[0_25px_60px_rgba(0,0,0,0.6),0_0_20px_rgba(99,102,241,0.1)] transition-all duration-300 group
                    ${isDragging 
                        ? 'border-indigo-500/60 shadow-[0_0_40px_rgba(99,102,241,0.2)]' 
                        : 'border-indigo-500/20 hover:border-indigo-500/40'
                    }
                `}
            >
                {/* Header */}
                <div className="w-full px-2 mb-2 flex justify-between items-center opacity-60 group-hover:opacity-100 transition-opacity">
                    <div className="flex items-center gap-2">
                        <span className="text-[0.5rem] font-black font-mono text-indigo-400 uppercase tracking-[0.35em]">
                            :: SCROLL_SYS ::
                        </span>
                        <div className="w-1 h-1 bg-indigo-500 rounded-full animate-pulse" />
                    </div>
                    <div className="flex items-center gap-1.5 text-indigo-500">
                        <Terminal size={11} />
                        <Cpu size={11} />
                    </div>
                </div>

                {/* Control Bar */}
                <div className="flex items-center gap-2 w-full">
                    {/* Left Button */}
                    <button 
                        onClick={(e) => { e.stopPropagation(); onStep?.(-1); }}
                        className={`
                            w-8 h-8 flex items-center justify-center rounded-xl border transition-all duration-300 shrink-0
                            ${isDragging 
                                ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-400' 
                                : 'border-slate-700/50 bg-slate-900/50 text-slate-500 hover:border-indigo-500/30 hover:text-indigo-400 hover:bg-indigo-500/5 active:scale-90'
                            }
                        `}
                        aria-label="Scroll Left"
                    >
                        <ChevronLeft size={18} strokeWidth={2.5} />
                    </button>

                    {/* Track Area */}
                    <div 
                        onMouseDown={handleMouseDown}
                        className={`
                            h-8 relative overflow-hidden rounded-xl border flex items-center
                            ${isDragging 
                                ? 'cursor-grabbing border-indigo-500/40 bg-indigo-500/5' 
                                : 'cursor-grab border-slate-800 bg-black/40 hover:border-indigo-500/20'
                            }
                        `}
                        style={{ width: `${VIEWPORT_WIDTH}px` }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-transparent to-indigo-500/5 pointer-events-none" />
                        
                        <div 
                            ref={trackRef}
                            className="absolute top-0 bottom-0 left-0 flex items-center gap-2 px-3 transition-transform duration-75 ease-linear will-change-transform whitespace-nowrap"
                            style={{ transform: `translateX(${translateX}px)` }}
                        >
                            {items.map((id, index) => {
                                const isVisible = visibleItems.has(id);
                                return (
                                    <div 
                                        key={id}
                                        className={`
                                            font-mono text-[10px] font-black uppercase tracking-tighter flex-shrink-0 transition-all duration-300
                                            ${isVisible 
                                                ? 'text-indigo-400 scale-100 shadow-[0_0_15px_rgba(99,102,241,0.8)] px-1.5 py-0.5 bg-indigo-500/20 border border-indigo-500/50 rounded-md' 
                                                : 'text-slate-700 scale-75 hover:text-slate-600 hover:scale-90'
                                            }
                                        `}
                                    >
                                        [{index.toString().padStart(2, '0')}]
                                    </div>
                                );
                            })}
                        </div>
                        
                        {/* Gradients */}
                        {isOverflowing && (
                            <>
                                <div className="absolute left-0 top-0 bottom-0 w-10 bg-gradient-to-r from-[#0f172a] via-[#0f172a]/90 to-transparent pointer-events-none" />
                                <div className="absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-[#0f172a] via-[#0f172a]/90 to-transparent pointer-events-none" />
                            </>
                        )}
                    </div>

                    {/* Right Button */}
                    <button 
                        onClick={(e) => { e.stopPropagation(); onStep?.(1); }}
                        className={`
                            w-8 h-8 flex items-center justify-center rounded-xl border transition-all duration-300 shrink-0
                            ${isDragging 
                                ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-400' 
                                : 'border-slate-700/50 bg-slate-900/50 text-slate-500 hover:border-indigo-500/30 hover:text-indigo-400 hover:bg-indigo-500/5 active:scale-90'
                            }
                        `}
                        aria-label="Scroll Right"
                    >
                        <ChevronRight size={18} strokeWidth={2.5} />
                    </button>
                </div>

                {/* Drag Indicator */}
                {isDragging && (
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-indigo-600 text-white text-[0.6rem] font-black rounded-lg shadow-lg animate-pulse uppercase tracking-widest flex items-center gap-2 whitespace-nowrap">
                        <span className="animate-pulse">●</span>
                        Перемещение активировано
                    </div>
                )}
            </div>
        </div>
    );
};
