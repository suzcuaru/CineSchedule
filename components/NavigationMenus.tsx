
import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, Settings, HelpCircle, Info, Database, LayoutDashboard, ChevronRight, Sparkles, Film, Gamepad2, Check } from 'lucide-react';
import { ViewMode } from '../types';
import { APP_INFO } from '../config/appData';

interface NavigationMenusProps {
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
  onNavigate: (mode: ViewMode) => void;
  logoRef: React.RefObject<HTMLDivElement | null>;
  currentViewMode: ViewMode;
}

export const NavigationMenus: React.FC<NavigationMenusProps> = ({ 
  isOpen, 
  setIsOpen, 
  onNavigate,
  logoRef,
  currentViewMode
}) => {
  
  const [isRendered, setIsRendered] = useState(isOpen);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const menuStartY = useRef<number | null>(null);
  const [menuDragY, setMenuDragY] = useState(0);

  useEffect(() => {
    if (isOpen) {
        setIsRendered(true);
        setIsAnimatingOut(false);
    } else if (isRendered) {
        setIsAnimatingOut(true);
        setTimeout(() => {
            setIsRendered(false);
        }, 300);
    }
  }, [isOpen, isRendered]);

  const handleRequestClose = () => {
    setIsOpen(false);
  };

  const handleNavigate = (mode: ViewMode) => {
      onNavigate(mode);
      handleRequestClose();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    menuStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (menuStartY.current !== null) {
      const delta = e.touches[0].clientY - menuStartY.current;
      if (delta < 0) { 
        setMenuDragY(delta);
      }
    }
  };

  const handleTouchEnd = () => {
    if (menuDragY < -60) handleRequestClose();
    setMenuDragY(0);
    menuStartY.current = null;
  };

  const NavItem = ({ icon: Icon, label, onClick, accent = false, active = false }: any) => (
    <button 
        onClick={onClick} 
        className={`
            w-full flex items-center justify-between px-5 py-4 rounded-xl border group
            ${active
                ? 'bg-indigo-600 border-indigo-500 text-white'
                : accent
                    ? 'bg-indigo-600/50 border-indigo-500/50 text-white'
                    : 'bg-slate-900/50 border-slate-800 text-slate-300'
            }
        `}
    >
        <div className="flex items-center gap-4">
            <div className={`${active ? 'text-indigo-200' : accent ? 'text-indigo-200' : 'text-slate-500'}`}>
                <Icon size={20} />
            </div>
            <div className="flex flex-col items-start leading-none">
                <span className="hidden md:inline-block text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-1 font-mono">
                    LEVEL_AUTH: 01
                </span>
                <span className="text-sm font-mono font-bold uppercase tracking-widest flex items-center">
                    {active && <span className="mr-2 text-indigo-200">●</span>}
                    {label}
                </span>
            </div>
        </div>
        {active ? <Check size={16} className="text-white" /> : <ChevronRight size={16} className={accent ? 'text-white' : 'text-slate-700'} />}
    </button>
  );

  const MenuItems = () => (
    <div className="p-3 space-y-2">
        <NavItem 
            icon={LayoutDashboard} 
            label="Консоль управления" 
            onClick={() => handleNavigate({type: 'dashboard'})} 
            active={currentViewMode.type === 'dashboard'} 
        />
        <NavItem 
            icon={Calendar} 
            label="Сетка расписания" 
            onClick={() => handleNavigate({type: 'schedule'})} 
            active={currentViewMode.type === 'schedule' || currentViewMode.type === 'hall_weekly'} 
        />
        <NavItem 
            icon={Gamepad2} 
            label="Пульт управления" 
            onClick={() => handleNavigate({type: 'remote_control'})} 
            active={currentViewMode.type === 'remote_control'} 
        />
        <NavItem 
            icon={Sparkles} 
            label="Релизы проката" 
            onClick={() => handleNavigate({type: 'releases'})} 
            active={currentViewMode.type === 'releases'} 
        />
        
        <div className="flex items-center gap-4 px-2 py-4">
            <div className="h-px flex-1 bg-slate-800" />
            <span className="text-[10px] font-black text-slate-700 uppercase tracking-[0.2em] font-mono">SYS_PARAMS</span>
            <div className="h-px flex-1 bg-slate-800" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <button 
                onClick={() => handleNavigate({type: 'settings'})} 
                className={`flex flex-col items-center justify-center p-4 rounded-xl group border ${
                    currentViewMode.type === 'settings' 
                        ? 'bg-indigo-600 border-indigo-500 text-white' 
                        : 'bg-slate-900/50 border-slate-800 text-slate-500'
                }`}
            >
                <Settings size={20} className="mb-2" />
                <span className="text-[10px] font-mono font-bold uppercase tracking-tighter">Настройки</span>
                {currentViewMode.type === 'settings' && <Check size={12} className="mt-1 text-white" />}
            </button>
            <button 
                onClick={() => handleNavigate({type: 'info'})} 
                className={`flex flex-col items-center justify-center p-4 rounded-xl group border ${
                    currentViewMode.type === 'info' 
                        ? 'bg-indigo-600 border-indigo-500 text-white' 
                        : 'bg-slate-900/50 border-slate-800 text-slate-500'
                }`}
            >
                <HelpCircle size={20} className="mb-2" />
                <span className="text-[10px] font-mono font-bold uppercase tracking-tighter">Справка</span>
                {currentViewMode.type === 'info' && <Check size={12} className="mt-1 text-white" />}
            </button>
            <button 
                onClick={() => handleNavigate({type: 'updates'})} 
                className={`flex flex-col items-center justify-center p-4 rounded-xl group border ${
                    currentViewMode.type === 'updates' 
                        ? 'bg-indigo-600 border-indigo-500 text-white' 
                        : 'bg-slate-900/50 border-slate-800 text-slate-500'
                }`}
            >
                <Info size={20} className="mb-2" />
                <span className="text-[10px] font-mono font-bold uppercase tracking-tighter">О системе</span>
                {currentViewMode.type === 'updates' && <Check size={12} className="mt-1 text-white" />}
            </button>
        </div>
    </div>
  );

  if (!isRendered) return null;

  return (
    <>
        {/* MOBILE MENU (Portal) */}
        {createPortal(
            <>
                <div 
                    className={`md:hidden fixed inset-0 bg-black/80 z-[100]`}
                    onClick={handleRequestClose}
                />
                <div 
                    className={`cineschedule-nav-menu md:hidden fixed top-0 left-0 w-full z-[101] bg-[#0f172a] border-b border-indigo-500/20 rounded-b-3xl overflow-hidden`}
                    style={{ 
                        transform: menuDragY !== 0 ? `translateY(${menuDragY}px)` : undefined,
                        transition: menuDragY !== 0 ? 'none' : 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)'
                    }}
                >
                    <div className="flex flex-col items-center p-6 border-b border-slate-800/50 bg-slate-950/30">
                            <span className="text-indigo-500 text-2xl font-black select-none tracking-tighter mb-1 font-mono">&gt;_ СИСТЕМНОЕ_МЕНЮ</span>
                            <span className="text-[9px] text-slate-600 uppercase tracking-[0.4em] font-black">Доступ только для персонала</span>
                    </div>

                    <MenuItems />
                    
                    <div className="bg-slate-950/50 p-4 border-t border-slate-900 text-center">
                        <span className="text-[10px] font-mono text-indigo-400 tracking-widest uppercase">KERNEL_ID {APP_INFO.version}-MOB</span>
                    </div>

                    <div 
                        className="w-full py-4 flex justify-center cursor-grab active:cursor-grabbing touch-none"
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                    >
                        <div className="w-16 h-1 bg-indigo-500/20 rounded-full" />
                    </div>
                </div>
            </>,
            document.body
        )}

        {/* DESKTOP MENU (Inline Absolute) */}
        <div className="hidden md:block absolute top-full left-0 pt-4 w-[360px] z-[60]">
            <div className={`
                cineschedule-nav-menu menu-fade-in
                bg-[#0f172a]/95 
                border border-indigo-500/20 rounded-2xl 
                overflow-hidden 
            }`
            }>
                <div className="p-4 bg-slate-950/50 border-b border-slate-800/50 flex items-center justify-between">
                    <span className="text-xs font-mono font-black text-indigo-400 tracking-widest uppercase">&gt; CMD_ВЫБОР</span>
                    <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 text-[9px] font-black uppercase font-mono tracking-tighter">Root_Auth</span>
                </div>
                
                <MenuItems />

                <div className="bg-slate-950/50 p-3 border-t border-slate-900 flex justify-between items-center px-5">
                    <span className="text-[10px] font-mono text-indigo-400 tracking-tighter uppercase">REL_BUILD: {APP_INFO.version}</span>
                    <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    </div>
                </div>
            </div>
        </div>
    </>
  );
};
