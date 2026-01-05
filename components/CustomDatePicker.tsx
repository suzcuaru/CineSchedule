
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Calendar, Terminal, Search } from 'lucide-react';
import { formatDate, getCalendarDays } from '../services/dataService';

interface CustomDatePickerProps {
  currentDate: string;
  onChange: (date: string) => void;
  availableDates?: string[];
}

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({ currentDate, onChange, availableDates = [] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [browsingDate, setBrowsingDate] = useState(currentDate);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const availableSet = new Set(availableDates);

  useEffect(() => { setBrowsingDate(currentDate); }, [currentDate]);

  useEffect(() => {
    const close = (e: MouseEvent) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setIsOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const dateObj = new Date(currentDate);
  const formatted = dateObj.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
  const browseObj = new Date(browsingDate);
  const days = getCalendarDays(browsingDate);

  const shiftDay = (n: number) => {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + n);
      onChange(formatDate(d));
  };

  const shiftMonth = (n: number) => {
      const d = new Date(browsingDate);
      d.setMonth(d.getMonth() + n);
      setBrowsingDate(formatDate(d));
  };

  return (
    <div className="relative w-full md:w-[320px] lg:w-[360px] shrink-0 z-50" ref={dropdownRef}>
      {/* Высота h-11 (44px) для точного соответствия кнопке логотипа */}
      <div className={`flex items-center h-11 bg-slate-900 border rounded-2xl transition-all shadow-xl overflow-hidden ${isOpen ? 'border-indigo-500 ring-4 ring-indigo-500/10' : 'border-white/5 hover:border-white/20'}`}>
        <button onClick={() => shiftDay(-1)} className="px-4 h-full text-slate-500 hover:text-white border-r border-white/5 transition-colors active:bg-white/5">
            <ChevronLeft size={18} />
        </button>
        <button onClick={() => setIsOpen(!isOpen)} className="flex-1 h-full flex items-center justify-center gap-2 px-3 group">
            <Calendar size={16} className="text-indigo-400 opacity-60 group-hover:opacity-100 transition-opacity" />
            <span className="font-mono font-black text-white uppercase tracking-tighter text-sm truncate">
                {formatted}
            </span>
        </button>
        <button onClick={() => shiftDay(1)} className="px-4 h-full text-slate-500 hover:text-white border-l border-white/5 transition-colors active:bg-white/5">
            <ChevronRight size={18} />
        </button>
      </div>

      {isOpen && (
        <div className="absolute top-full mt-3 left-0 right-0 bg-slate-900/95 backdrop-blur-2xl border border-indigo-500/30 rounded-3xl shadow-[0_35px_80px_rgba(0,0,0,0.7)] p-5 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between mb-4 px-2">
              <button onClick={() => shiftMonth(-1)} className="p-2 hover:bg-white/5 rounded-xl text-slate-400 transition-colors"><ChevronLeft size={18} /></button>
              <div className="flex flex-col items-center">
                  <span className="text-[0.6rem] font-black text-indigo-500 uppercase tracking-[0.4em] mb-1">Сетка_Месяца</span>
                  <span className="text-xs font-black uppercase tracking-widest text-white font-mono">
                    {browseObj.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
                  </span>
              </div>
              <button onClick={() => shiftMonth(1)} className="p-2 hover:bg-white/5 rounded-xl text-slate-400 transition-colors"><ChevronRight size={18} /></button>
          </div>
          
          <div className="grid grid-cols-7 gap-1 mb-1">
              {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(d => (
                  <div key={d} className="text-center text-[0.6rem] font-black text-slate-600 uppercase py-1 tracking-widest">{d}</div>
              ))}
              {days.map((day, i) => {
                  const dStr = formatDate(day.date);
                  const isAvailable = availableSet.size === 0 || availableSet.has(dStr);
                  return (
                      <button 
                        key={i} 
                        onClick={() => { if (isAvailable) { onChange(dStr); setIsOpen(false); } }}
                        disabled={!day.isCurrentMonth}
                        className={`
                            aspect-square rounded-lg flex items-center justify-center text-xs font-mono transition-all relative border
                            ${!day.isCurrentMonth ? 'opacity-0 pointer-events-none' : 
                              day.isSelected ? 'bg-indigo-600 text-white border-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.5)] z-10' : 
                              isAvailable ? 'text-slate-200 border-white/5 hover:bg-indigo-500/10 hover:border-indigo-500/40 hover:text-indigo-300' : 'text-slate-700 border-transparent cursor-not-allowed'}
                            ${day.isToday && !day.isSelected ? 'border-indigo-500/40 text-indigo-400 bg-indigo-500/5' : ''}
                        `}
                      >
                        {day.date.getDate()}
                        {isAvailable && !day.isSelected && <div className="absolute bottom-1 w-1 h-1 rounded-full bg-indigo-500/40" />}
                      </button>
                  );
              })}
          </div>
        </div>
      )}
    </div>
  );
};
