
import React, { useState, useEffect } from 'react';
import { Settings, Globe, Eye, EyeOff, Zap, CheckCircle, XCircle, AlertTriangle, Type, Brush, Rows, KeyRound, RefreshCw, Timer } from 'lucide-react';
import { AppSettings, RefreshInterval } from '../../types';
import { BackendService } from '../../backend/aggregator';
import { ViewContainer, GridSection, Card, InputGroup, ToggleCard, SegmentedControl } from './SystemUI';

interface SettingsViewProps {
  settings: AppSettings;
  onUpdate: (key: keyof AppSettings, value: any) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ settings, onUpdate }) => {
  const [status, setStatus] = useState(BackendService.connectionStatus);
  const [version, setVersion] = useState(BackendService.serverVersion);
  const [error, setError] = useState(BackendService.lastErrorMessage);
  const [isKeyVisible, setIsKeyVisible] = useState(false);

  useEffect(() => {
      return BackendService.subscribe(() => {
          setStatus(BackendService.connectionStatus);
          setVersion(BackendService.serverVersion);
          setError(BackendService.lastErrorMessage);
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
            <span className="text-sm font-bold uppercase tracking-tight">ONLINE {version ? `v${version}` : ''}</span>
        </div>
    );

    if (status === 'pending') return (
        <div className="flex items-center gap-2 text-indigo-400 bg-indigo-400/10 px-3 py-1 rounded-lg border border-indigo-400/20">
            <RefreshCw size={16} className="animate-spin" />
            <span className="text-sm font-bold">CHECKING...</span>
        </div>
    );

    return (
        <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2 text-red-400 bg-red-400/10 px-3 py-1 rounded-lg border border-red-400/20">
                <XCircle size={16} />
                <span className="text-sm font-bold uppercase">OFFLINE</span>
            </div>
        </div>
    );
  };

  const refreshOptions: { label: string, value: RefreshInterval }[] = [
    { label: 'Выкл', value: 0 },
    { label: '5 мин', value: 5 },
    { label: '15 мин', value: 15 },
    { label: '30 мин', value: 30 },
    { label: '1 час', value: 60 },
    { label: '1 день', value: 1440 }
  ];

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
                          Укажите IP адрес и порт сервера CineSchedule Backend (без http://). 
                          Если поле пустое, приложение будет работать в режиме демонстрации.
                      </p>

                      <div className="max-w-xl">
                          <InputGroup 
                            label="IP адрес и порт сервера" 
                            icon={Globe} 
                            value={settings.serverUrl} 
                            onChange={(v:string) => onUpdate('serverUrl',v)} 
                            placeholder="192.168.1.10:3000" 
                          />
                          
                          {/* Симпатичный блок ошибки */}
                          {status === 'error' && error && (
                             <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                                <AlertTriangle className="text-red-400 shrink-0 mt-0.5" size={18} />
                                <div className="flex flex-col gap-1">
                                    <span className="text-sm font-bold text-red-400">Ошибка соединения</span>
                                    <span className="text-xs text-red-300/80 font-mono break-all leading-tight">{error}</span>
                                </div>
                             </div>
                          )}
                      </div>

                      <div className="max-w-xl">
                         <InputGroup 
                            label="API Ключ (Bearer Token)" 
                            icon={KeyRound}
                            type={isKeyVisible ? "text" : "password"}
                            value={settings.apiKey} 
                            onChange={(v:string) => onUpdate('apiKey',v)} 
                            placeholder="Секретный ключ..."
                            endAdornment={
                                <button onClick={() => setIsKeyVisible(!isKeyVisible)} className="p-2 text-slate-500 hover:text-white transition-colors">
                                    {isKeyVisible ? <EyeOff size={18}/> : <Eye size={18}/>}
                                </button>
                            }
                          />
                      </div>
                  </div>
              </Card>
          </GridSection>

          <GridSection title="Персонализация" cols={2}>
              <Card>
                 <div className="flex items-center gap-3 mb-4 text-indigo-400">
                    <Brush size={24} />
                    <h3 className="text-lg font-bold text-white">Тема оформления</h3>
                 </div>
                 <SegmentedControl 
                    options={[
                        {label: 'Стандарт', value: 'default'},
                        {label: 'Сепия', value: 'sepia'},
                        {label: 'Сумерки', value: 'dusk'}
                    ]}
                    value={settings.theme}
                    onChange={(v) => onUpdate('theme', v)}
                 />
              </Card>
              <Card>
                 <div className="flex items-center gap-3 mb-4 text-indigo-400">
                    <Type size={24} />
                    <h3 className="text-lg font-bold text-white">Размер шрифта</h3>
                 </div>
                 <SegmentedControl 
                    options={[
                        {label: 'Мелкий', value: 'small'},
                        {label: 'Средний', value: 'medium'},
                        {label: 'Крупный', value: 'large'}
                    ]}
                    value={settings.fontSize}
                    onChange={(v) => onUpdate('fontSize', v)}
                 />
              </Card>
              <Card>
                 <div className="flex items-center gap-3 mb-4 text-indigo-400">
                    <Rows size={24} />
                    <h3 className="text-lg font-bold text-white">Плотность карточек</h3>
                 </div>
                 <SegmentedControl 
                    options={[
                        {label: 'Обычная', value: 'default'},
                        {label: 'Компактная', value: 'compact'}
                    ]}
                    value={settings.cardDensity}
                    onChange={(v) => onUpdate('cardDensity', v)}
                 />
              </Card>
              <Card>
                 <div className="flex items-center gap-3 mb-4 text-indigo-400">
                    <Timer size={24} />
                    <h3 className="text-lg font-bold text-white">Автообновление</h3>
                 </div>
                 <div className="grid grid-cols-3 gap-2 w-full">
                    {refreshOptions.map(opt => (
                        <button
                        key={opt.value}
                        onClick={() => onUpdate('autoRefreshInterval', opt.value)}
                        className={`
                            px-2 py-2 text-sm font-bold rounded-lg transition-all duration-200 text-center
                            ${settings.autoRefreshInterval === opt.value 
                                ? 'bg-indigo-600 text-white shadow ring-2 ring-indigo-500/50' 
                                : 'bg-slate-950/70 text-slate-400 hover:bg-slate-800 border border-slate-800'}
                        `}
                        >
                        {opt.label}
                        </button>
                    ))}
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
