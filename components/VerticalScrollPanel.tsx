
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface VerticalScrollPanelProps {
    targetRef: React.RefObject<HTMLDivElement>;
    topOffset?: string;
    bottomOffset?: string;
}

export const VerticalScrollPanel: React.FC<VerticalScrollPanelProps> = ({
    targetRef,
    topOffset = "0px",
    bottomOffset = "0px"
}) => {
    const [scrollRatio, setScrollRatio] = useState(0);
    const [thumbHeight, setThumbHeight] = useState(20);
    const [hasOverflow, setHasOverflow] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [isScrolling, setIsScrolling] = useState(false);

    const trackRef = useRef<HTMLDivElement>(null);
    const dragOffsetRef = useRef<number>(0);
    const observerRef = useRef<ResizeObserver | null>(null);
    const scrollTimeoutRef = useRef<any>(null);

    const updateMetrics = useCallback(() => {
        if (!targetRef.current || !trackRef.current) return;

        const { scrollTop, scrollHeight, clientHeight } = targetRef.current;
        const trackHeight = trackRef.current.clientHeight;

        const canScroll = scrollHeight > clientHeight + 1;
        setHasOverflow(canScroll);

        if (!canScroll) {
            setScrollRatio(0);
            return;
        }

        const ratio = clientHeight / scrollHeight;
        const newThumbHeight = Math.max(30, Math.min(trackHeight, ratio * trackHeight));
        setThumbHeight(newThumbHeight);

        if (!isDragging) {
            const maxScroll = scrollHeight - clientHeight;
            const currentRatio = maxScroll > 0 ? scrollTop / maxScroll : 0;
            setScrollRatio(Math.min(1, Math.max(0, currentRatio)));
        }
    }, [targetRef, isDragging]);

    useEffect(() => {
        let pollInterval: any = null;
        let scrollCleanup: (() => void) | null = null;

        const attachListeners = () => {
            const el = targetRef.current;
            if (!el) return false;

            const handleScroll = () => {
                requestAnimationFrame(updateMetrics);
                setIsScrolling(true);
                if (scrollTimeoutRef.current) {
                    clearTimeout(scrollTimeoutRef.current);
                }
                scrollTimeoutRef.current = setTimeout(() => {
                    setIsScrolling(false);
                }, 1000); // Сокращено до 1 сек для эффекта авто-скрытия
            };

            el.addEventListener('scroll', handleScroll, { passive: true });
            scrollCleanup = () => {
                el.removeEventListener('scroll', handleScroll);
                if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
            };

            if (observerRef.current) observerRef.current.disconnect();
            observerRef.current = new ResizeObserver(() => requestAnimationFrame(updateMetrics));
            observerRef.current.observe(el);
            
            Array.from(el.children).forEach(child => observerRef.current?.observe(child));

            updateMetrics();
            return true;
        };

        if (!attachListeners()) {
            pollInterval = setInterval(() => {
                if (attachListeners()) {
                    clearInterval(pollInterval);
                }
            }, 100);
        }

        return () => {
            if (pollInterval) clearInterval(pollInterval);
            if (scrollCleanup) scrollCleanup();
            if (observerRef.current) observerRef.current.disconnect();
        };
    }, [targetRef, updateMetrics]);


    const handleScrollButton = (direction: 'up' | 'down') => {
        if (!targetRef.current) return;
        const step = 200;
        targetRef.current.scrollBy({
            top: direction === 'up' ? -step : step,
            behavior: 'smooth'
        });
    };

    const handleTrackClick = (e: React.MouseEvent) => {
        if (!trackRef.current || !targetRef.current || isDragging) return;

        const rect = trackRef.current.getBoundingClientRect();
        const clickY = e.clientY - rect.top;

        const trackH = rect.height;
        const availableSpace = trackH - thumbHeight;
        const thumbY = scrollRatio * availableSpace;

        const direction = clickY < thumbY ? -1 : 1;
        const step = targetRef.current.clientHeight * 0.8;

        targetRef.current.scrollBy({
            top: step * direction,
            behavior: 'smooth'
        });
    };

    const handleThumbMouseDown = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();

        const thumbEl = e.currentTarget as HTMLDivElement;
        const thumbRect = thumbEl.getBoundingClientRect();

        setIsDragging(true);
        dragOffsetRef.current = e.clientY - thumbRect.top;

        document.body.style.cursor = 'grabbing';
        document.addEventListener('mousemove', handleGlobalMouseMove);
        document.addEventListener('mouseup', handleGlobalMouseUp);
    };

    const handleGlobalMouseMove = useCallback((e: MouseEvent) => {
        if (!trackRef.current || !targetRef.current) return;

        const trackRect = trackRef.current.getBoundingClientRect();
        const { scrollHeight, clientHeight } = targetRef.current;
        const maxScroll = scrollHeight - clientHeight;

        const trackHeight = trackRect.height;
        const effectiveTrackHeight = trackHeight - thumbHeight;

        if (effectiveTrackHeight <= 0) return;

        const thumbTop = e.clientY - trackRect.top - dragOffsetRef.current;

        let newRatio = thumbTop / effectiveTrackHeight;
        newRatio = Math.max(0, Math.min(1, newRatio));

        setScrollRatio(newRatio);
        targetRef.current.scrollTop = newRatio * maxScroll;
    }, [thumbHeight, targetRef]);

    const handleGlobalMouseUp = useCallback(() => {
        setIsDragging(false);
        document.body.style.cursor = '';
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);
    }, [handleGlobalMouseMove]);

    const getThumbTopPercent = () => {
        if (!trackRef.current) return 0;
        const trackH = trackRef.current.clientHeight;
        const availableSpace = trackH - thumbHeight;
        if (availableSpace <= 0) return 0;
        return (scrollRatio * availableSpace / trackH) * 100;
    };

    if (!hasOverflow) return null;

    return (
        <div
            className={`
                absolute right-1 z-[100] flex flex-col items-center w-[6px] md:w-2
                bg-slate-900/30 rounded-full py-1 select-none
                ${(isScrolling || isDragging) ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2 pointer-events-none'}
            `}
            style={{
                top: topOffset,
                bottom: bottomOffset,
            }}
        >
            <div
                ref={trackRef}
                onClick={handleTrackClick}
                className={`flex-1 w-full relative group/track py-1 min-h-[50px] cursor-pointer`}
            >
                <div
                    onMouseDown={handleThumbMouseDown}
                    className={`
                        absolute left-1/2 -translate-x-1/2 w-full rounded-full cursor-grab active:cursor-grabbing
                        ${isDragging
                            ? 'bg-indigo-500'
                            : 'bg-indigo-600/60 hover:bg-indigo-500'
                        }
                    `}
                    style={{
                        height: thumbHeight,
                        top: `${getThumbTopPercent()}%`
                    }}
                />
            </div>
        </div>
    );
};
