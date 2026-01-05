
import React, { useRef, useState, useEffect } from 'react';
import { RefreshCw, Terminal, ChevronDown, Check, X } from 'lucide-react';
import { CustomDatePicker } from './CustomDatePicker';
import { NavigationMenus } from './NavigationMenus';
import { ViewMode, AppSettings } from '../types';
import { RefreshStatus } from '../hooks/useAppLogic';
import { BackendService } from '../backend/aggregator';
import { Equalizer } from './system/SystemUI';

interface NavbarProps {
  currentDate: string;
  setCurrentDate: (d: string) => void;
  viewMode: ViewMode;
  onNavigate: (mode: ViewMode) => void;
  handleBack: () => void;
  onRefresh: () => void;
  isLoading: boolean;
  refreshStatus: RefreshStatus;
  isLogoMenuOpen: boolean;
  setIsLogoMenuOpen: (v: boolean) => void;
  appSettings: AppSettings;
  updateSetting: (key: keyof AppSettings, value: any) => void;
  availableDates: string[];
}

export const Navbar: React.FC<NavbarProps> = ({
  currentDate,
  setCurrentDate,
  viewMode,
  onNavigate,
  handleBack,
  onRefresh,
  isLoading,
  refreshStatus,
  isLogoMenuOpen,
  setIsLogoMenuOpen,
  appSettings,
  updateSetting,
  availableDates
}) => {
  
  const isWeeklyView = viewMode.type === 'hall_weekly';
  const isSystemView = ['settings', 'info', 'updates', 'releases'].includes(viewMode.type);
  const logoMenuRef = useRef<HTMLDivElement>(null);
  
  const [syncStep, setSyncStep] = useState(BackendService.lastSyncStep);
  const [connStatus, setConnStatus] = useState(BackendService.connectionStatus);
  const [lastSyncTime, setLastSyncTime] = useState<string>('');

  useEffect(() => {
      const updateTimes = () => {
          if (BackendService.lastSyncTimestamp) {
              const date = new Date(BackendService.lastSyncTimestamp);
              setLastSyncTime(date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }));
          } else {
              setLastSyncTime('');
          }
      };
      updateTimes();
      return BackendService.subscribe(() => {
          setSyncStep(BackendService.lastSyncStep);
          setConnStatus(BackendService.connectionStatus);
          updateTimes();
      });
  }, []);

  const isBackMode = isWeeklyView;

  const handleIconClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isBackMode) {
          handleBack();
      } else {
          setIsLogoMenuOpen(!isLogoMenuOpen);
      }
  };

  const handleMouseLeave = () => {
      if (window.innerWidth >= 768 && isLogoMenuOpen) {
          setIsLogoMenuOpen(false);
      }
  };

  const renderRefreshIcon = () => {
    const isPending = connStatus === 'pending' || refreshStatus === 'loading';
    const isError = connStatus === 'error' || refreshStatus === 'error';
    const isSuccess = refreshStatus === 'success';

    return (
        <div className="flex items-center gap-3">
            {/* Mobile View Icon */}
            <div className={`
                md:hidden flex items-center justify-center w-11 h-11 rounded-xl border transition-all active:scale-90
                ${isPending ? 'bg-violet-500/10 border-violet-500/40' : 'bg-[#1e293b]/40 border-violet-500/10'}
            `}>
                <RefreshCw 
                    size={20} 
                    className={`${isPending ? 'animate-spin text-violet-400' : isError ? 'text-red-400' : 'text-slate-400'}`} 
                />
            </div>

            {/* Fixed height h-11 to match others */}
            <div className={`
                hidden md:flex items-center gap-2 px-3 py-2 border rounded-xl transition-all duration-300 shrink-0 overflow-hidden h-11
                md:w-[240px] md:min-w-[240px] md:max-w-[240px] xl:w-[275px] xl:min-w-[275px] xl:max-w-[275px]
                ${isPending ? 'bg-violet-500/10 border-violet-500/30 shadow-lg shadow-violet-500/5' : 
                  isError ? 'bg-red-500/10 border-red-500/30 animate-shake' : 
                  appSettings.mockMode ? 'bg-amber-500/5 border-amber-500/20' : 'bg-slate-800/50 border-slate-700 hover:border-slate-500'}
            `}>
                <div className="flex flex-col items-end flex-1 min-w-0">
                    <span className={`text-[0.6rem] font-black uppercase tracking-widest leading-none truncate w-full text-right ${isPending ? 'text-violet-400' : isError ? 'text-red-400' : appSettings.mockMode ? 'text-amber-500' : 'text-slate-500'}`}>
                        {isPending ? 'СИНХРОНИЗАЦИЯ' : isError ? 'ОШИБКА СВЯЗИ' : appSettings.mockMode ? 'DEMO MODE ACTIVE' : 'БАЗА ДАННЫХ'}
                    </span>
                    <span className={`text-[0.7rem] font-bold font-mono truncate w-full text-right leading-tight mt-0.5 ${isPending ? 'text-violet-200' : isError ? 'text-red-300' : 'text-slate-400'}`}>
                        {isPending ? syncStep : lastSyncTime ? lastSyncTime : (appSettings.mockMode ? 'SEED_ACTIVE' : 'READY')}
                    </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 border-l border-white/5 pl-2 h-full">
                    <div className="w-[32px] xl:w-[44px] flex items-center justify-center">
                        <Equalizer active={isPending} size="sm" color={appSettings.mockMode ? '#f59e0b' : undefined} />
                    </div>
                    <div className="relative w-5 h-5 flex items-center justify-center shrink-0">
                        {isPending ? <RefreshCw size={14} className="animate-spin text-violet-400" /> :
                         isError ? <X size={14} className="text-red-500" /> :
                         isSuccess ? <Check size={14} className="text-emerald-400 animate-in zoom-in" /> :
                         <RefreshCw size={14} className="text-slate-500" />}
                    </div>
                </div>
            </div>
        </div>
    );
  };

  return (
    <header className="flex-none bg-[#0b0f19] border-b border-violet-500/10 px-4 md:px-6 py-3 z-[100] relative h-16 md:h-[72px]">
        <div className="flex items-center justify-between gap-4 w-full h-full mx-auto">
            
            {/* Left Section: Menu / Back Button */}
            <div className="flex items-center shrink-0 z-20 relative min-w-[50px]" ref={logoMenuRef} onMouseLeave={handleMouseLeave}>
                <div 
                    onClick={handleIconClick}
                    className="flex items-center cursor-pointer group"
                >
                    <div className={`
                        h-11 w-11 flex items-center justify-center rounded-xl shadow-lg transition-all duration-500 shrink-0 z-50 overflow-hidden relative border
                        ${isBackMode 
                            ? 'bg-slate-900 text-violet-400 border-violet-500/30' 
                            : 'bg-violet-600 text-white border-violet-400/30'
                        }
                    `}>
                        <div className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ${isBackMode ? 'opacity-0 scale-50 rotate-90 translate-y-4' : 'opacity-100 scale-100 rotate-0 translate-y-0'}`}>
                            <Terminal size={20} />
                        </div>
                        <div className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ${isBackMode ? 'opacity-100 scale-100 rotate-0 translate-y-0' : 'opacity-0 scale-50 -rotate-90 -translate-y-4'}`}>
                            <span className="font-mono text-lg font-black">&lt;_</span>
                        </div>
                    </div>

                    <div className={`
                        hidden lg:flex items-center px-4 h-11 bg-[#1e293b]/20 border border-violet-500/10 rounded-r-xl -ml-2 transition-all
                        ${isBackMode ? 'opacity-100' : 'opacity-100 group-hover:border-violet-500/30'}
                    `}>
                        <h1 className="text-xl md:text-2xl font-black text-white tracking-tighter leading-none flex items-center gap-2 font-mono animate-terminal-glow">
                            <span className="text-violet-500/50 font-bold">&gt;</span>
                            <span className="drop-shadow-[0_0_10px_rgba(139,92,246,0.6)]">CineSchedule</span>
                            <ChevronDown size={18} className={`text-slate-600 group-hover:text-violet-400 transition-all duration-300 ${isLogoMenuOpen ? 'rotate-180' : ''}`} />
                        </h1>
                    </div>
                </div>

                <NavigationMenus 
                    isOpen={isLogoMenuOpen} 
                    setIsOpen={setIsLogoMenuOpen} 
                    onNavigate={onNavigate}
                    logoRef={logoMenuRef}
                    currentViewMode={viewMode}
                />
            </div>

            {/* Middle Section: Date Picker */}
            <div className="flex-1 flex justify-center items-center h-full min-w-0 px-2 md:px-4">
                {!isSystemView && (
                    <CustomDatePicker currentDate={currentDate} onChange={setCurrentDate} availableDates={availableDates} />
                )}
            </div>

            {/* Right Section: Refresh / Status */}
            <div className="flex items-center shrink-0 z-20 justify-end min-w-[50px]">
                {!isSystemView && (
                    <button 
                        onClick={(e) => { e.preventDefault(); onRefresh(); }}
                        disabled={refreshStatus === 'loading'}
                        className="outline-none"
                    >
                        {renderRefreshIcon()}
                    </button>
                )}
            </div>
        </div>
      </header>
  );
};
