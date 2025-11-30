import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, Settings, HelpCircle, Info, Database, LayoutDashboard } from 'lucide-react';
import { ViewMode } from '../types';
import { APP_INFO } from '../config/appData';

interface NavigationMenusProps {
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
  onNavigate: (mode: ViewMode) => void;
  logoRef: React.RefObject<HTMLDivElement | null>;
}

export const NavigationMenus: React.FC<NavigationMenusProps> = ({ 
  isOpen, 
  setIsOpen, 
  onNavigate,
  logoRef
}) => {
  
  const [isRendered, setIsRendered] = useState(isOpen);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const menuStartY = useRef<number | null>(null);
  const [menuDragY, setMenuDragY] = useState(0);

  useEffect(() => {
    if (isOpen) {
        setIsRendered(true);
        setIsAnimatingOut(false);
    } else if (isRendered) { // An external event (like onMouseLeave) set isOpen to false
        setIsAnimatingOut(true);
        setTimeout(() => {
            setIsRendered(false);
        }, 300); // Animation duration. MUST match tailwind duration-300
    }
  }, [isOpen, isRendered]);

  const handleRequestClose = () => {
    // Internal actions (like clicking a menu item) now just tell the parent to close.
    // The useEffect will then handle the animation.
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

  const MenuItems = () => (
    <div className="p-2 space-y-1.5">
        <button onClick={() => handleNavigate({type: 'dashboard'})} className="w-full flex items-center gap-5 px-5 py-4 rounded-lg hover:bg-slate-700/50 text-slate-300 hover:text-white transition-colors text-lg font-medium">
            <LayoutDashboard size={24} className="text-indigo-400" />
            <span>Главная</span>
        </button>
        <button onClick={() => handleNavigate({type: 'schedule'})} className="w-full flex items-center gap-5 px-5 py-4 rounded-lg hover:bg-slate-700/50 text-slate-300 hover:text-white transition-colors text-lg font-medium">
            <Calendar size={24} className="text-slate-400" />
            <span>Расписание (Сетка)</span>
        </button>
        <div className="h-px bg-slate-700/50 my-1 mx-2" />
        <button onClick={() => handleNavigate({type: 'settings'})} className="w-full flex items-center gap-5 px-5 py-4 rounded-lg hover:bg-slate-700/50 text-slate-300 hover:text-white transition-colors text-lg font-medium">
            <Settings size={24} className="text-slate-400" />
            <span>Настройки</span>
        </button>
        <button onClick={() => handleNavigate({type: 'info'})} className="w-full flex items-center gap-5 px-5 py-4 rounded-lg hover:bg-slate-700/50 text-slate-300 hover:text-white transition-colors text-lg font-medium">
            <HelpCircle size={24} className="text-slate-400" />
            <span>Справка</span>
        </button>
        <button onClick={() => handleNavigate({type: 'updates'})} className="w-full flex items-center gap-5 px-5 py-4 rounded-lg hover:bg-slate-700/50 text-slate-300 hover:text-white transition-colors text-lg font-medium">
            <Info size={24} className="text-slate-400" />
            <span>О системе</span>
        </button>
    </div>
  );

  if (!isRendered) return null;

  return (
    <>
        {/* MOBILE MENU (Portal) */}
        {createPortal(
            <>
                <div 
                    className={`md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] ${isAnimatingOut ? 'animate-mobile-fade-out' : 'animate-mobile-fade-in'}`}
                    onClick={handleRequestClose}
                />
                <div 
                    className={`md:hidden fixed top-0 left-0 w-full z-[101] bg-[#1e293b] border-b border-slate-700 rounded-b-2xl shadow-2xl ${isAnimatingOut ? 'animate-mobile-slide-out-up' : 'animate-mobile-slide-down'} overflow-hidden ease-out will-change-transform`}
                    style={{ 
                        transform: menuDragY !== 0 ? `translateY(${menuDragY}px)` : undefined,
                        transition: menuDragY !== 0 ? 'none' : 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)'
                    }}
                >
                    {/* Removed Close Button */}
                    <div className="flex justify-center items-center p-5 border-b border-slate-800/50">
                            <span className="text-white font-bold flex items-center gap-3 text-lg">
                            <Database size={22} className="text-indigo-400"/>
                            Меню приложения
                            </span>
                    </div>

                    <MenuItems />
                    
                    <div className="bg-slate-900/50 p-4 border-t border-slate-700 text-center">
                        <span className="text-sm font-mono text-slate-600">Version {APP_INFO.version}-mobile</span>
                    </div>

                    <div 
                        className="w-full py-4 flex justify-center cursor-grab active:cursor-grabbing touch-none bg-[#1e293b]"
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

        {/* DESKTOP MENU (Inline Absolute) */}
        <div className="hidden md:block absolute top-full left-0 pt-4 w-80 z-[60]">
            <div className={`
                bg-[#1e293b]/95 backdrop-blur-lg 
                border border-slate-700/80 rounded-xl 
                shadow-2xl shadow-indigo-950/50 
                overflow-hidden 
                ${isAnimatingOut 
                    ? 'animate-out fade-out slide-out-to-top-4 zoom-out-95 duration-300 ease-in' 
                    : 'animate-in fade-in slide-in-from-top-4 zoom-in-95 duration-300 ease-out'
                }`
            }>
                <MenuItems />
                <div className="bg-slate-900/50 p-3 border-t border-slate-700 text-center">
                    <span className="text-sm font-mono text-slate-600">Version {APP_INFO.version}</span>
                </div>
            </div>
        </div>
    </>
  );
};