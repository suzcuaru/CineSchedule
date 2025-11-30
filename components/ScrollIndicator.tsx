import React, { useRef, useState, useCallback, useLayoutEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
    const [trackWidth, setTrackWidth] = useState(0);
    const dragInfo = useRef({ startX: 0, startRatio: 0 });

    const VIEWPORT_WIDTH = 300; 

    useLayoutEffect(() => {
        if (trackRef.current) {
            setTrackWidth(trackRef.current.scrollWidth);
        }
    }, [items, visibleItems]);

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

    if (!isScrollable) {
        return null;
    }

    return (
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 z-50 w-[380px] h-16 pointer-events-auto group hidden md:block">
            <div 
                ref={indicatorRef}
                className={`
                    absolute bottom-0 left-1/2 -translate-x-1/2 w-full
                    transition-transform duration-300 ease-out will-change-transform
                    translate-y-[calc(100%-8px)] group-hover:-translate-y-2 group/panel
                    ${isDragging ? '!-translate-y-2' : ''}
                `}
            >
                <div 
                    className={`
                        flex items-center gap-1 p-1
                        bg-[#1e293b] rounded-full border border-slate-700/50 
                        transition-all duration-300 ease-out origin-center
                        group-hover/panel:scale-105 group-hover/panel:bg-[#253248] group-hover/panel:border-indigo-500/30
                        ${isDragging ? 'border-indigo-500/50 ring-1 ring-indigo-500/30' : ''}
                    `}
                >
                    {/* Left Button */}
                    <button 
                        onClick={(e) => { e.stopPropagation(); onStep?.(-1); }}
                        className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors shrink-0"
                        aria-label="Scroll Left"
                    >
                        <ChevronLeft size={18} />
                    </button>

                    {/* Track Area */}
                    <div 
                        onMouseDown={handleMouseDown}
                        className={`
                            h-6 relative overflow-hidden rounded-md
                            ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}
                        `}
                        style={{ width: `${VIEWPORT_WIDTH}px` }}
                    >
                         <div 
                            ref={trackRef}
                            className="absolute top-0 bottom-0 left-0 flex items-center gap-1.5 transition-transform duration-75 ease-linear will-change-transform whitespace-nowrap px-1"
                            style={{ transform: `translateX(${translateX}px)` }}
                         >
                            {items.map(id => {
                                const isVisible = visibleItems.has(id);
                                return (
                                    <div 
                                        key={id}
                                        className={`
                                            rounded-full transition-all duration-300 flex-shrink-0 inline-block
                                            ${isVisible 
                                                ? 'w-10 h-1.5 bg-indigo-500 shadow-[0_0_12px_2px_rgba(99,102,241,0.6)]' 
                                                : 'w-4 h-1.5 bg-slate-600 group-hover/panel:bg-slate-500'
                                            }
                                        `}
                                    />
                                );
                            })}
                        </div>
                        
                        {/* Gradients */}
                        {isOverflowing && (
                            <>
                                <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#1e293b] via-[#1e293b]/80 to-transparent pointer-events-none transition-colors group-hover/panel:from-[#253248] group-hover/panel:via-[#253248]/80"></div>
                                <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#1e293b] via-[#1e293b]/80 to-transparent pointer-events-none transition-colors group-hover/panel:from-[#253248] group-hover/panel:via-[#253248]/80"></div>
                            </>
                        )}
                    </div>

                    {/* Right Button */}
                    <button 
                        onClick={(e) => { e.stopPropagation(); onStep?.(1); }}
                        className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors shrink-0"
                        aria-label="Scroll Right"
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};
