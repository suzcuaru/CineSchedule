import React, { useState, useEffect } from 'react';
import { Settings, HelpCircle, Zap, Database, User, Globe, FileSpreadsheet, Bell, Eye, MousePointer, Touchpad, Fingerprint, Info, Layers, HardDrive, ChevronRight, Shield, Activity, Cpu, Network, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { AppSettings, CONTENT_STATUS_CONFIG } from '../types';
import { BackendService } from '../backend/aggregator';

// --- UI PRIMITIVES ---

const ViewContainer = ({ title, icon: Icon, children }: { title: string, icon: any, children?: React.ReactNode }) => (
  <div className="w-full h-full overflow-y-auto bg-[#0b0f19] custom-scrollbar">
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-10 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4 mb-10">
         <h1 className="text-3xl md:text-2xl font-bold text-slate-400 uppercase tracking-widest flex items-center gap-3">
            <Icon size={28} className="text-indigo-500" />
            {title}
         </h1>
      </div>
      {children}
    </div>
  </div>
);

const GridSection = ({ title, children, cols=1 }: { title: string, children?: React.ReactNode, cols?: number }) => (
    <div className="mb-12">
        <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-6 bg-indigo-500 rounded-full"></div>
            <h2 className="text-lg font-bold text-slate-400 uppercase tracking-widest">{title}</h2>
        </div>
        <div className={`grid grid-cols-1 ${cols === 2 ? 'md:grid-cols-2' : ''} ${cols === 3 ? 'lg:grid-cols-3' : ''} gap-6`}>
            {children}
        </div>
    </div>
);

const Card = ({ children, className = "" }: { children?: React.ReactNode, className?: string }) => (
    <div className={`bg-[#1e293b] border border-slate-700/50 rounded-2xl p-6 shadow-xl ${className}`}>
        {children}
    </div>
);

const ToggleCard = ({ label, desc, icon: Icon, enabled, onToggle }: { label: string, desc: string, icon: any, enabled: boolean, onToggle: () => void }) => (
    <div 
        onClick={onToggle}
        className={`
            relative overflow-hidden cursor-pointer group select-none rounded-2xl border p-6 transition-all duration-200
            ${enabled ? 'bg-indigo-900/20 border-indigo-500/40' : 'bg-[#1e293b] border-slate-700 hover:border-slate-600'}
        `}
    >
        <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${enabled ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                    <Icon size={24} />
                </div>
                <div>
                    <h3 className={`text-lg font-bold transition-colors ${enabled ? 'text-white' : 'text-slate-300'}`}>{label}</h3>
                </div>
            </div>
            <div className={`w-12 h-7 rounded-full relative transition-colors duration-200 ease-in-out shrink-0 ${enabled ? 'bg-indigo-500' : 'bg-slate-700'}`}>
                <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 ease-in-out ${enabled ? 'translate-x-5' : ''}`} />
            </div>
        </div>
        <p className="mt-4 text-base text-slate-500 leading-relaxed">{desc}</p>
    </div>
);

const InputGroup = ({ label, icon: Icon, value, onChange, type="text", placeholder }: any) => (
    <div className="flex flex-col gap-2">
        <label className="text-sm text-slate-400 font-bold uppercase tracking-wide ml-1">{label}</label>
        <div className="relative group w-full">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                <Icon size={20} />
            </div>
            <input 
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-base text-slate-200 placeholder:text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
        </div>
    </div>
);

// --- SETTINGS VIEW ---
interface SettingsViewProps {
  settings: AppSettings;
  onUpdate: (key: keyof AppSettings, value: any) => void;
}

// FIX: Replaced obsolete SettingsView with the current implementation to fix type errors.
export const SettingsView: React.FC<SettingsViewProps> = ({ settings, onUpdate }) => {
  const [status, setStatus] = useState(BackendService.connectionStatus);

  useEffect(() => {
      return BackendService.subscribe(() => {
          setStatus(BackendService.connectionStatus);
      });
  }, []);

  const getStatusBadge = () => {
    if (!settings.serverUrl) return (
        <div className="flex items-center gap-2 text-yellow-400 bg-yellow-400/10 px-3 py-1 rounded-lg border border-yellow-400/20">
            <AlertTriangle size={16} />
            <span className="text-sm font-bold">MOCK MODE</span>
        </div>
    );

    if (status === 'connected') return (
        <div className="flex items-center gap-2 text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-lg border border-emerald-400/20">
            <CheckCircle size={16} />
            <span className="text-sm font-bold">ONLINE</span>
        </div>
    );

    return (
        <div className="flex items-center gap-2 text-red-400 bg-red-400/10 px-3 py-1 rounded-lg border border-red-400/20">
            <XCircle size={16} />
            <span className="text-sm font-bold">OFFLINE</span>
        </div>
    );
  };

  return (
      <ViewContainer title="Настройки Приложения" icon={Settings}>
          
          <GridSection title="Подключение к серверу" cols={1}>
              <Card className="border-l-4 border-l-indigo-500">
                  <div className="flex flex-col gap-6">
                      <div className="flex items-center justify-between">
                          <h3 className="text-xl font-bold text-white">Параметры соединения</h3>
                          {getStatusBadge()}
                      </div>
                      
                      <p className="text-slate-400 text-sm">
                          Укажите IP адрес или полный URL сервера CineSchedule Backend. 
                          Если поле пустое, приложение будет работать в режиме демонстрации.
                      </p>

                      <div className="max-w-xl">
                          <InputGroup 
                            label="Адрес сервера (Host URL)" 
                            icon={Globe} 
                            value={settings.serverUrl} 
                            onChange={(v:string) => onUpdate('serverUrl',v)} 
                            placeholder="http://192.168.1.10:3000" 
                          />
                      </div>
                  </div>
              </Card>
          </GridSection>

          <GridSection title="Поведение Приложения" cols={2}>
             <ToggleCard 
                label="Аварийный режим" 
                desc="При недоступности сервера, показывать демонстрационные данные. Если отключено, будет показан пустой экран." 
                icon={AlertTriangle}
                enabled={settings.useMockDataFallback}
                onToggle={() => onUpdate('useMockDataFallback', !settings.useMockDataFallback)}
             />
             <ToggleCard 
                label="Live-подсветка сеансов" 
                desc="Визуально выделять текущие сеансы в реальном времени. Может незначительно влиять на производительность." 
                icon={Eye}
                enabled={settings.highlightCurrent}
                onToggle={() => onUpdate('highlightCurrent', !settings.highlightCurrent)}
             />
             <ToggleCard 
                label="Анимации интерфейса" 
                desc="Плавные переходы и эффекты. Отключение может повысить производительность на слабых устройствах." 
                icon={Zap}
                enabled={settings.enableAnimations}
                onToggle={() => onUpdate('enableAnimations', !settings.enableAnimations)}
             />
          </GridSection>
      </ViewContainer>
  );
};

// --- HELP VIEW ---

const StatusLegendItem: React.FC<{ statusKey: string }> = ({ statusKey }) => {
    const config = CONTENT_STATUS_CONFIG[statusKey as keyof typeof CONTENT_STATUS_CONFIG];
    return (
        <div className="flex items-center p-4 bg-[#161e2e] rounded-xl border border-slate-700/50">
            <div className={`w-4 h-4 rounded-full ${config.bg} ${config.glow} shadow-lg mr-4 shrink-0`}></div>
            <div className="flex flex-col">
                <span className={`text-base font-bold ${config.color}`}>{config.label}</span>
                <span className="text-xs text-slate-500 font-mono uppercase mt-0.5">{statusKey}</span>
            </div>
        </div>
    );
};

const GestureItem = ({ icon: Icon, title, desc }: { icon: any, title: string, desc: string }) => (
    <div className="flex gap-4 items-start p-4 bg-gradient-to-br from-[#1e293b] to-[#0f172a] rounded-2xl border border-slate-700">
        <div className="p-3 bg-slate-800 rounded-xl text-indigo-400 shrink-0">
            <Icon size={24} />
        </div>
        <div>
            <h4 className="text-base font-bold text-slate-200 mb-1">{title}</h4>
            <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
        </div>
    </div>
);

export const HelpView = () => {
    return (
        <ViewContainer title="Архитектура и Справка" icon={HelpCircle}>
            
            {/* Architecture Diagram */}
            <div className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-1 h-6 bg-indigo-500 rounded-full"></div>
                    <h2 className="text-lg font-bold text-slate-400 uppercase tracking-widest">System Architecture (Split-Process)</h2>
                </div>

                <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-8 relative overflow-hidden">
                    {/* Background Grid */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:40px_40px] opacity-20 pointer-events-none"></div>
                    
                    <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12">
                        
                        {/* BLOCK 1: UI */}
                        <div className="flex flex-col items-center gap-4 flex-1">
                            <div className="w-full bg-slate-800/50 border border-slate-600 rounded-2xl p-6 flex flex-col items-center relative shadow-xl">
                                <div className="absolute -top-3 bg-slate-900 px-3 py-1 border border-slate-600 rounded-full text-xs font-bold text-slate-400 uppercase tracking-widest">
                                    Presentation Layer
                                </div>
                                <Layers size={40} className="text-indigo-400 mb-3" />
                                <h3 className="text-lg font-bold text-white">UI App</h3>
                                <span className="text-xs text-slate-500 font-mono text-center mt-2">
                                    React Client<br/>Views & Controls
                                </span>
                            </div>
                        </div>

                        {/* ARROW 1 */}
                        <div className="flex flex-col items-center gap-2">
                            <div className="h-px w-16 lg:w-24 bg-gradient-to-r from-slate-600 to-slate-600 border-t border-dashed border-slate-500"></div>
                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase bg-slate-900 px-2 py-1 rounded border border-slate-800">
                                <Network size={12} /> Function Calls
                            </div>
                        </div>

                        {/* BLOCK 2: BACKEND CORE */}
                        <div className="flex flex-col items-center gap-4 flex-1">
                            <div className="w-full bg-indigo-900/20 border border-indigo-500/50 rounded-2xl p-6 flex flex-col items-center relative shadow-2xl shadow-indigo-500/10">
                                <div className="absolute -top-3 bg-slate-900 px-3 py-1 border border-indigo-500 rounded-full text-xs font-bold text-indigo-400 uppercase tracking-widest">
                                    Autonomous Core
                                </div>
                                <Cpu size={40} className="text-indigo-400 mb-3" />
                                <h3 className="text-lg font-bold text-white">Backend Service</h3>
                                <span className="text-xs text-indigo-300/70 font-mono text-center mt-2">
                                    Aggregator<br/>Business Logic
                                </span>
                            </div>
                        </div>

                        {/* ARROW 2 */}
                        <div className="flex flex-col items-center gap-2">
                            <div className="h-px w-16 lg:w-24 bg-slate-600"></div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase">I/O</span>
                        </div>

                        {/* BLOCK 3: DATA SOURCES */}
                        <div className="flex flex-col gap-4">
                            {/* CinemaBox */}
                            <div className="flex items-center gap-3 bg-[#1e293b] border border-slate-700 p-3 rounded-xl w-48">
                                <div className="p-2 bg-orange-500/20 rounded text-orange-400"><Database size={16} /></div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-white">CinemaBox</span>
                                    <span className="text-[9px] text-slate-500">Hardware API</span>
                                </div>
                            </div>
                            {/* SQLite */}
                            <div className="flex items-center gap-3 bg-[#1e293b] border border-slate-700 p-3 rounded-xl w-48">
                                <div className="p-2 bg-indigo-500/20 rounded text-indigo-400"><HardDrive size={16} /></div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-white">SQLite</span>
                                    <span className="text-[9px] text-slate-500">Local Storage</span>
                                </div>
                            </div>
                            {/* Sheets */}
                            <div className="flex items-center gap-3 bg-[#1e293b] border border-slate-700 p-3 rounded-xl w-48">
                                <div className="p-2 bg-emerald-500/20 rounded text-emerald-400"><FileSpreadsheet size={16} /></div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-white">Google Sheets</span>
                                    <span className="text-[9px] text-slate-500">Metadata</span>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            <GridSection title="Статусы контента (Legend)" cols={2}>
                {(Object.keys(CONTENT_STATUS_CONFIG) as string[]).map(status => (
                    <StatusLegendItem key={status} statusKey={status} />
                ))}
            </GridSection>

            <GridSection title="Жесты и Управление" cols={2}>
                <GestureItem 
                    icon={MousePointer} 
                    title="Клик (Desktop)" 
                    desc="Нажмите на карточку сеанса, чтобы открыть меню изменения статуса DCP." 
                />
                <GestureItem 
                    icon={Touchpad} 
                    title="Тап (Mobile)" 
                    desc="Открывает панель статусов в нижней части экрана (Bottom Sheet)." 
                />
                <GestureItem 
                    icon={Fingerprint} 
                    title="Long Press (Копирование)" 
                    desc="Удерживайте палец на названии фильма или имени DCP пакета, чтобы скопировать текст." 
                />
                <GestureItem 
                    icon={ChevronRight} 
                    title="Навигация" 
                    desc="Используйте свайпы по датам для переключения дней. Клик по логотипу открывает меню." 
                />
            </GridSection>

        </ViewContainer>
    );
};

export const UpdatesView = () => {
    return (
        <ViewContainer title="История обновлений" icon={Zap}>
             <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                 <Info size={48} className="mb-4 opacity-50" />
                 <p>Раздел обновлений в разработке</p>
             </div>
        </ViewContainer>
    );
};
