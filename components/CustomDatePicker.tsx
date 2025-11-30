
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { formatDate, getCalendarDays } from '../services/dataService';
import { CalendarDay } from '../types';

interface CustomDatePickerProps {
  currentDate: string;
  onChange: (date: string) => void;
}

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({ currentDate, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [browsingDate, setBrowsingDate] = useState(currentDate);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const [dragY, setDragY] = useState(0);
  const startY = useRef<number | null>(null);

  const mainSwipeStartX = useRef<number | null>(null);
  const mainSwipeEndX = useRef<number | null>(null);

  const calSwipeStartX = useRef<number | null>(null);
  const calSwipeEndX = useRef<number | null>(null);

  useEffect(() => {
    setBrowsingDate(currentDate);
  }, [currentDate]);

  useEffect(() => {
    setDragY(0);
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        if (window.innerWidth >= 768) {
             if (isOpen) handleGracefulClose();
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleGracefulClose = () => {
      setIsClosing(true);
      setTimeout(() => {
          setIsOpen(false);
          setIsClosing(false);
      }, 300);
  };

  const shiftDay = (amount: number) => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + amount);
    onChange(formatDate(d));
  };

  const shiftMonth = (amount: number) => {
    const d = new Date(browsingDate);
    d.setMonth(d.getMonth() + amount);
    setBrowsingDate(formatDate(d));
  };

  const selectDate = (d: Date) => {
    onChange(formatDate(d));
    handleGracefulClose();
  };

  // --- Vertical Swipe Handlers (Top Sheet Drag) ---
  const handleTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startY.current !== null) {
        const delta = e.touches[0].clientY - startY.current;
        if (delta < 0) { // Dragging UP
            setDragY(delta);
        }
    }
  };

  const handleTouchEnd = () => {
    if (dragY < -60) {
        handleGracefulClose();
    }
    setDragY(0);
    startY.current = null;
  };

  // --- Horizontal Swipe Handlers ---
  const handleMainTouchStart = (e: React.TouchEvent) => {
      mainSwipeStartX.current = e.touches[0].clientX;
      mainSwipeEndX.current = null;
  };
  const handleMainTouchMove = (e: React.TouchEvent) => {
      mainSwipeEndX.current = e.touches[0].clientX;
  };
  const handleMainTouchEnd = () => {
      if (mainSwipeStartX.current === null || mainSwipeEndX.current === null) return;
      const diff = mainSwipeStartX.current - mainSwipeEndX.current;
      const threshold = 50;
      if (diff > threshold) shiftDay(1);
      else if (diff < -threshold) shiftDay(-1);
      mainSwipeStartX.current = null;
      mainSwipeEndX.current = null;
  };

  const handleCalTouchStart = (e: React.TouchEvent) => {
      e.stopPropagation(); 
      calSwipeStartX.current = e.touches[0].clientX;
      calSwipeEndX.current = null;
  };
  const handleCalTouchMove = (e: React.TouchEvent) => {
      e.stopPropagation();
      calSwipeEndX.current = e.touches[0].clientX;
  };
  const handleCalTouchEnd = (e: React.TouchEvent) => {
      e.stopPropagation();
      if (calSwipeStartX.current === null || calSwipeEndX.current === null) return;
      const diff = calSwipeStartX.current - calSwipeEndX.current;
      const threshold = 50;
      if (diff > threshold) shiftMonth(1);
      else if (diff < -threshold) shiftMonth(-1);
      calSwipeStartX.current = null;
      calSwipeEndX.current = null;
  };
  
  const handleToggle = () => {
      if (isOpen) handleGracefulClose();
      else {
          setIsOpen(true);
      }
  };

  const dateObj = new Date(currentDate);
  const fullFormat = dateObj.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
  const shortFormat = dateObj.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  
  const browsingDateObj = new Date(browsingDate);
  const calendarTitle = browsingDateObj.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
  const daysGrid = getCalendarDays(browsingDate);

  const CalendarContent = () => (
      <>
          <div className="flex items-center justify-between p-4 border-b border-slate-700/50 bg-[#1e293b]">
             <button onClick={() => shiftMonth(-1)} className="p-2 hover:bg-slate-700 rounded text-slate-400 hover:text-white"><ChevronLeft size={20} /></button>
             <span className="text-lg font-bold text-white capitalize select-none">{calendarTitle}</span>
             <button onClick={() => shiftMonth(1)} className="p-2 hover:bg-slate-700 rounded text-slate-400 hover:text-white"><ChevronRight size={20} /></button>
          </div>
          <div className="grid grid-cols-7 gap-1 px-3 pt-3 text-center bg-[#1e293b] select-none">
             {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(d => (
               <span key={d} className="text-sm font-bold text-slate-500">{d}</span>
             ))}
          </div>
          <div 
            className="grid grid-cols-7 gap-1.5 p-3 bg-[#1e293b] touch-pan-y"
            onTouchStart={handleCalTouchStart}
            onTouchMove={handleCalTouchMove}
            onTouchEnd={handleCalTouchEnd}
          >
             {daysGrid.map((day, idx) => (
               <button 
                 key={idx}
                 onClick={() => selectDate(day.date)}
                 className={`
                   h-10 md:h-9 rounded text-base font-medium transition-all select-none
                   ${!day.isCurrentMonth ? 'text-slate-600' : day.isSelected ? 'bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-500/30' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}
                   ${day.isToday && !day.isSelected ? 'border border-indigo-500/50 text-indigo-300' : ''}
                 `}
               >
                 {day.date.getDate()}
               </button>
             ))}
          </div>
      </>
  );

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div 
        className="flex items-center bg-[#1e293b] rounded-xl border border-slate-700 p-0 shadow-sm w-full touch-pan-y h-11 overflow-hidden"
        onTouchStart={handleMainTouchStart}
        onTouchMove={handleMainTouchMove}
        onTouchEnd={handleMainTouchEnd}
      >
        <button onClick={() => shiftDay(-1)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors shrink-0 h-full w-10 flex items-center justify-center"><ChevronLeft size={22} /></button>
        <button 
          ref={buttonRef}
          onClick={handleToggle}
          className="flex-1 min-w-0 flex items-center justify-center gap-3 px-2 md:px-5 py-1 hover:bg-slate-700/50 rounded transition-colors group h-full"
        >
          <CalendarDays size={22} className="text-indigo-400 group-hover:text-indigo-300 shrink-0" />
          <span className="text-lg font-mono font-bold text-white capitalize leading-none pt-0.5 truncate select-none">
             <span className="hidden sm:inline">{fullFormat}</span>
             <span className="sm:hidden">{shortFormat}</span>
          </span>
        </button>
        <button onClick={() => shiftDay(1)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors shrink-0 h-full w-10 flex items-center justify-center"><ChevronRight size={22} /></button>
      </div>

      {isOpen && (
        <div className="hidden md:block absolute top-full mt-3 left-1/2 -translate-x-1/2 z-50 bg-[#1e293b] border border-slate-700 rounded-xl shadow-2xl w-80 animate-in fade-in zoom-in-95 duration-150 origin-top overflow-hidden">
           <CalendarContent />
        </div>
      )}

      {(isOpen || isClosing) && createPortal(
          <>
            <div className={`md:hidden fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm ${isClosing ? 'animate-mobile-fade-out' : 'animate-mobile-fade-in'}`} onClick={handleGracefulClose} />
            <div 
                className={`md:hidden fixed top-0 left-0 w-full z-[10000] bg-[#1e293b] border-b border-slate-700 rounded-b-2xl shadow-2xl overflow-hidden ${isClosing ? 'animate-mobile-slide-out-up' : 'animate-mobile-slide-down'} ease-out will-change-transform`}
                style={{ 
                    transform: dragY !== 0 ? `translateY(${dragY}px)` : undefined,
                    transition: dragY !== 0 ? 'none' : 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)'
                }}
            >
                 {/* Removed Close Button */}
                 <div className="flex justify-center items-center p-5 border-b border-slate-800/50">
                     <span className="text-white text-xl font-bold flex items-center gap-3">
                        <CalendarDays size={24} className="text-indigo-400"/>
                        Выбор даты
                     </span>
                 </div>
                 <CalendarContent />
                 <div 
                    className="w-full py-4 flex justify-center cursor-grab active:cursor-grabbing touch-none bg-[#1e293b] hover:bg-slate-800/50 transition-colors"
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                 >
                     <div className="w-14 h-1.5 bg-slate-600/50 rounded-full" />
                 </div>
            </div>
          </>,
          document.body
      )}
    </div>
  );
};
