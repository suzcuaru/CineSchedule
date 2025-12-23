
import React, { useRef } from 'react';
import { RefreshCw, Database, ChevronDown, ArrowLeft, Check, X } from 'lucide-react';
import { CustomDatePicker } from './CustomDatePicker';
import { NavigationMenus } from './NavigationMenus';
import { ViewMode } from '../types';
import { RefreshStatus } from '../hooks/useAppLogic';

interface NavbarProps {
  currentDate: string;
  setCurrentDate: (d: string) => void;
  viewMode: ViewMode;
  onNavigate: (mode: ViewMode) => void;
  onRefresh: () => void;
  isLoading: boolean;
  refreshStatus: RefreshStatus;
  isLogoMenuOpen: boolean;
  setIsLogoMenuOpen: (v: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentDate,
  setCurrentDate,
  viewMode,
  onNavigate,
  onRefresh,
  isLoading,
  refreshStatus,
  isLogoMenuOpen,
  setIsLogoMenuOpen
}) => {
  
  const isWeeklyView = viewMode.type === 'hall_weekly';
  const isSystemView = ['settings', 'info', 'updates'].includes(viewMode.type);
  const logoMenuRef = useRef<HTMLDivElement>(null);

  const handleIconClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isWeeklyView) {
          onNavigate({ type: 'schedule' }); // Return to Grid
      } else {
          setIsLogoMenuOpen(!isLogoMenuOpen);
      }
  };

  const handleTextClick = () => {
      setIsLogoMenuOpen(!isLogoMenuOpen);
  };

  const handleMouseLeave = () => {
      if (window.innerWidth >= 768 && isLogoMenuOpen) {
          setIsLogoMenuOpen(false);
      }
  };

  const renderRefreshIcon = () => {
    switch (refreshStatus) {
        case 'loading':
            return <RefreshCw size={24} className="animate-smooth-spin text-indigo-400" />;
        case 'success':
            return <Check size={26} className="text-emerald-400 animate-check-pop" />;
        case 'error':
            return <X size={26} className="text-red-500 animate-error-pop" />;
        default:
            return <RefreshCw size={24} />;
    }
  };

  const getRefreshButtonClasses = () => {
    const base = "h-11 w-11 flex items-center justify-center border rounded-xl transition-all duration-300 active:scale-90 shrink-0 disabled:cursor-not-allowed bg-[#1e293b] ";
    
    if (refreshStatus === 'loading') {
        return base + "border-indigo-500/60 animate-breathing-glow text-indigo-400";
    }
    if (refreshStatus === 'success') {
        return base + "border-emerald-500/40 shadow-lg shadow-emerald-500/5";
    }
    if (refreshStatus === 'error') {
        return base + "border-red-500/40 shadow-lg shadow-red-500/5";
    }
    
    return base + "text-slate-400 hover:text-white hover:bg-slate-700 border-slate-700";
  };

  return (
    <header className="flex-none bg-[#0f172a] border-b border-slate-800 px-4 md:px-6 py-3 z-40 shadow-lg shadow-black/20 relative transition-all duration-300 h-16 md:h-[72px]">
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4 w-full h-full md:gap-8 xl:grid-cols-[1fr_auto_1fr]">
            
            {/* --- LEFT GROUP: Morphing Icon + Text --- */}
            <div className="flex items-center shrink-0 z-20 gap-0 relative md:justify-start" ref={logoMenuRef} onMouseLeave={handleMouseLeave}>
                
                {/* Morphing Button (Nav/Menu) */}
                <button
                    onClick={handleIconClick}
                    className={`
                        h-11 w-11 flex items-center justify-center rounded-xl shadow-lg transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] shrink-0 z-50 relative
                        ${isWeeklyView 
                            ? 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700' 
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20'
                        }
                    `}
                    aria-label={isWeeklyView ? "Back" : "Menu"}
                >
                    <div className="icon-swap-container">
                        {/* Primary Icon: Database (Menu) */}
                        <div className={`icon-swap-item icon-primary ${!isWeeklyView ? 'active' : 'inactive'}`}>
                            <Database size={24} />
                        </div>
                        {/* Secondary Icon: Arrow (Back) */}
                        <div className={`icon-swap-item icon-secondary ${isWeeklyView ? 'active' : 'inactive'}`}>
                            <ArrowLeft size={24} />
                        </div>
                    </div>
                </button>

                {/* Text Label (Always opens Menu) */}
                <div 
                    onClick={handleTextClick}
                    className={`hidden md:flex items-center gap-2 md:ml-4 cursor-pointer group select-none transition-opacity duration-300 min-w-0 ${isWeeklyView ? 'opacity-0 pointer-events-none w-0 overflow-hidden md:opacity-100 md:w-auto md:pointer-events-auto' : 'opacity-100'}`}
                >
                    <div className="flex flex-col min-w-0">
                        <h1 className="text-2xl md:text-2xl font-bold text-white tracking-tight leading-none group-hover:text-indigo-300 transition-colors flex items-center gap-1 md:gap-2 truncate">
                            <span className="hidden sm:inline truncate">CineSchedule</span>
                            <ChevronDown size={20} className={`hidden md:block text-slate-500 transition-transform duration-200 shrink-0 ${isLogoMenuOpen ? 'rotate-180' : ''}`} />
                        </h1>
                        <span className="text-sm md:text-sm text-slate-500 uppercase tracking-widest font-medium hidden sm:block truncate">CMS Control Panel</span>
                    </div>
                </div>

                <NavigationMenus 
                    isOpen={isLogoMenuOpen} 
                    setIsOpen={setIsLogoMenuOpen} 
                    onNavigate={onNavigate}
                    logoRef={logoMenuRef}
                />
            </div>

            {/* --- CENTER GROUP: Date Picker --- */}
            {!isSystemView && (
                <div className="flex justify-center w-full max-w-xs px-2 sm:px-0 mx-auto md:w-auto md:max-w-none md:justify-start xl:justify-center">
                    <div className="w-full md:w-[280px] lg:w-[320px]">
                        <CustomDatePicker 
                            currentDate={currentDate} 
                            onChange={setCurrentDate} 
                        />
                    </div>
                </div>
            )}

            {/* --- RIGHT GROUP: Refresh --- */}
            {!isSystemView && (
                <div className="flex items-center shrink-0 z-20 justify-end">
                    <button 
                        onClick={onRefresh}
                        disabled={refreshStatus === 'loading'}
                        className={getRefreshButtonClasses()}
                    >
                        {renderRefreshIcon()}
                    </button>
                </div>
            )}
        </div>
      </header>
  );
};
