
import React, { useState, useEffect, PropsWithChildren } from 'react';
import { Settings, Globe, Eye, EyeOff, Zap, CheckCircle, XCircle, AlertTriangle, Type, Brush, Rows, KeyRound, RefreshCw, Timer, Database, Network, LayoutGrid, PlayCircle, Activity, Terminal, FlaskConical, Clock } from 'lucide-react';
import { AppSettings, ContentStatus, CONTENT_STATUS_CONFIG } from '../../types';
import { BackendService } from '../../backend/aggregator';
import { ViewContainer, GridSection, Card, InputGroup, ToggleCard, SegmentedControl, ColorPicker, Equalizer, SystemHint, TimeRangePicker } from './SystemUI';

interface SettingsViewProps {
  settings: AppSettings;
  onUpdate: (key: keyof AppSettings, value: any) => void;
}

const SettingsBlock: React.FC<PropsWithChildren<{ label: string, desc: string, icon: any }>> = ({ label, desc, icon: Icon, children }) => (
    <Card className="flex flex-col gap-5 border border-indigo-500/5 hover:border-indigo-500/20 transition-all duration-500 h-full group">
        <div className="flex items-start gap-4">
            <div className="p-3 bg-slate-800/50 rounded-xl text-indigo-400 shrink-0 group-hover:bg-indigo-500/10 transition-colors">
                <Icon size={24} />
            </div>
            <div className="flex flex-col min-w-0">
                <h3 className="text-lg font-bold text-white truncate group-hover:text-indigo-200 transition-colors uppercase tracking-tight">{label}</h3>
                <p className="text-[11px] font-bold text-slate-500 leading-relaxed uppercase tracking-wider opacity-70">{desc}</p>
            </div>
        </div>
        <div className="pt-2 flex-1 flex flex-col justify-end">
            {children}
        </div>
    </Card>
);

export const SettingsView: React.FC<SettingsViewProps> = ({ settings, onUpdate }) => {
  const [status, setStatus] = useState(BackendService.connectionStatus);
  const [lastStep, setLastStep] = useState(BackendService.lastSyncStep);
  const [isKeyVisible, setIsKeyVisible] = useState(false);
  const [serverUrlInput, setServerUrlInput] = useState(settings.serverUrl);
  const [apiKeyInput, setApiKeyInput] = useState(settings.apiKey);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showError, setShowError] = useState(false);

  useEffect(() => {
      setServerUrlInput(settings.serverUrl);
      setApiKeyInput(settings.apiKey);
  }, [settings.serverUrl, settings.apiKey]);

  useEffect(() => {
      return BackendService.subscribe(() => {
          setStatus(BackendService.connectionStatus);
          setLastStep(BackendService.lastSyncStep);
          
          if (BackendService.connectionStatus === 'error') {
              setShowError(true);
              const timer = setTimeout(() => setShowError(false), 5000);
              return () => clearTimeout(timer);
          }
      });
  }, []);

  const handleConnect = async () => {
      if (!serverUrlInput) return;
      setIsProcessing(true);
      try {
          await BackendService.testAndSaveConnection(serverUrlInput, apiKeyInput);
      } catch (e) {
          console.error(e);
      } finally {
          setIsProcessing(false);
      }
  };

  const getStatusDisplay = () => {
    const isPending = status === 'pending' || isProcessing;
    const isError = status === 'error' && showError;

    return (
        <div className={`
            flex-1 flex items-center justify-between gap-4 px-6 py-4 rounded-2xl border transition-all duration-700 min-h-[84px]
            ${isPending ? 'bg-indigo-500/5 border-indigo-500/30 shadow-[0_0_40px_rgba(99,102,241,0.1)]' : 
              isError ? 'bg-red-500/5 border-red-500/30 animate-shake' : 
              'bg-[#0f172a] border-indigo-500/10'}
        `}>
            <div className="flex items-center gap-5 flex-1 min-w-0">
                <div className={`shrink-0 transition-colors ${isPending ? 'text-indigo-400' : isError ? 'text-red-400' : 'text-slate-600'}`}>
                    <span className="text-2xl font-mono font-black select-none tracking-tighter">&gt;_</span>
                </div>
                
                <div className="flex flex-col gap-0.5 min-w-0">
                    <span className={`text-[10px] font-black uppercase tracking-[0.2em] leading-none ${isPending ? 'text-indigo-500' : isError ? 'text-red-500' : 'text-indigo-500/60'}`}>
                        {isError ? 'System Failure' : isPending ? 'Network Activity' : 'System Standby'}
                    </span>
                    <span className={`text-base font-mono font-bold truncate leading-tight tracking-tight ${isError ? 'text-red-400' : 'text-slate-100'}`}>
                        {isPending ? lastStep : isError ? (lastStep || 'Connection lost') : (settings.mockMode ? 'Демо-режим активен. Сервер игнорируется.' : 'Система готова к синхронизации. . .')}
                    </span>
                </div>
            </div>
            
            <div className="shrink-0 flex items-center gap-6">
                <Equalizer active={isPending} color={isPending ? '#6366f1' : isError ? '#ef4444' : (settings.mockMode ? '#f59e0b' : '#334155')} />
                
                <div className={`
                    min-w-[64px] px-3 py-1.5 rounded-lg border font-mono font-black text-[11px] uppercase tracking-wider text-center transition-all duration-300
                    ${isPending ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300' : 
                      isError ? 'bg-red-500/20 border-red-500/40 text-red-400' :
                      (settings.mockMode ? 'bg-amber-500/20 border-amber-500/40 text-amber-400' : 'bg-slate-800/40 border-slate-700 text-slate-500')}
                `}>
                    {isPending ? 'BUSY' : isError ? 'ERR' : (settings.mockMode ? 'DEMO' : 'IDLE')}
                </div>
            </div>
        </div>
    );
  };

  return (
      <ViewContainer title="Настройки Системы" icon={Settings}>
          <GridSection title="Соединение с сервером" cols={1}>
              <div className="flex flex-col gap-6">
                  <SystemHint title="СЕТЕВАЯ_КОНФИГУРАЦИЯ">
                      Настройте параметры связи с центральным ядром CineSchedule. Убедитесь, что адрес сервера доступен из локальной сети кинотеатра.
                  </SystemHint>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <SettingsBlock label="Адрес хоста" desc="URL-адрес терминала управления Backend." icon={Globe}>
                          <InputGroup 
                            label="Server URL" 
                            icon={Network} 
                            value={serverUrlInput} 
                            onChange={setServerUrlInput} 
                            placeholder="127.0.0.1:8000" 
                          />
                      </SettingsBlock>
                      <SettingsBlock label="Ключ авторизации" desc="Уникальный токен доступа к API." icon={KeyRound}>
                          <InputGroup 
                            label="Secret API Key" 
                            icon={Database} 
                            type={isKeyVisible ? "text" : "password"} 
                            value={apiKeyInput} 
                            onChange={setApiKeyInput} 
                            placeholder="Bearer..."
                            endAdornment={
                                <button onClick={() => setIsKeyVisible(!isKeyVisible)} className="p-2 text-slate-500 hover:text-white transition-colors">
                                    {isKeyVisible ? <EyeOff size={18}/> : <Eye size={18}/>}
                                </button>
                            }
                          />
                      </SettingsBlock>
                      <SettingsBlock label="Демо-режим" desc="" icon={FlaskConical}>
                           <ToggleCard 
                                label="Mock Mode" 
                                desc="" 
                                icon={FlaskConical}
                                enabled={settings.mockMode}
                                onToggle={() => onUpdate('mockMode', !settings.mockMode)}
                           />
                      </SettingsBlock>
                  </div>
                  
                  <div className="flex flex-col md:flex-row items-stretch gap-4 mt-2">
                      <button 
                        onClick={handleConnect} 
                        disabled={isProcessing || !serverUrlInput || settings.mockMode} 
                        className={`
                            md:w-64 px-8 py-4 rounded-2xl font-black flex items-center justify-center gap-3 transition-all active:scale-[0.98] uppercase tracking-[0.15em] text-[11px] border
                            ${isProcessing || settings.mockMode ? 'bg-slate-800 text-slate-500 border-slate-700' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-500/20 border-indigo-400/30'}
                        `}
                      >
                          {isProcessing ? <RefreshCw size={18} className="animate-spin" /> : <RefreshCw size={18} />}
                          {isProcessing ? 'Синхронизация...' : 'Синхронизировать'}
                      </button>
                      {getStatusDisplay()}
                  </div>
              </div>
          </GridSection>

          <GridSection title="Интерфейс и Данные" cols={2}>
              <SettingsBlock label="Размер текста" desc="Глобальный масштаб шрифтов системы." icon={Type}>
                  <SegmentedControl options={[{label: 'Мелкий', value: 'small'},{label: 'Средний', value: 'medium'},{label: 'Крупный', value: 'large'}]} value={settings.fontSize} onChange={(v) => onUpdate('fontSize', v)} />
              </SettingsBlock>
              <SettingsBlock label="Сетка (ПК)" desc="Количество столбцов залов в один ряд." icon={LayoutGrid}>
                  <SegmentedControl options={[{label: '3', value: 3},{label: '4', value: 4},{label: '5', value: 5}]} value={settings.gridColumns} onChange={(v) => onUpdate('gridColumns', Number(v))} />
              </SettingsBlock>
              <SettingsBlock label="Автообновление" desc="Периодичность опроса сервера на изменения." icon={Timer}>
                 <SegmentedControl options={[{label: '5 мин', value: 5},{label: '15 мин', value: 15},{label: '30 мин', value: 30}]} value={settings.autoRefreshInterval} onChange={(v) => onUpdate('autoRefreshInterval', v)} />
              </SettingsBlock>
          </GridSection>

          <GridSection title="Рабочее время" cols={1}>
              <SettingsBlock label="Настройка диапазона" desc="Укажите начало и конец рабочего дня для корректного отображения ночных сеансов." icon={Clock}>
                  <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-xl border border-slate-700/50">
                          <Activity size={20} className="text-indigo-400 shrink-0" />
                          <p className="text-sm text-slate-400 leading-relaxed">
                              <span className="text-slate-300 font-semibold">Ночные сеансы</span> (например, 00:30) будут отображаться в конце списка после дневных.
                          </p>
                      </div>
                      <TimeRangePicker 
                          startValue={settings.workingHoursStart}
                          endValue={settings.workingHoursEnd}
                          onStartChange={(v) => onUpdate('workingHoursStart', v)}
                          onEndChange={(v) => onUpdate('workingHoursEnd', v)}
                          startLabel="Начало дня"
                          endLabel="Конец дня"
                      />
                  </div>
              </SettingsBlock>
          </GridSection>

          <GridSection title="Цветовая схема статусов" cols={1}>
              <Card className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-4 bg-[#0b0f19]/40 border-indigo-500/5">
                  {(Object.keys(CONTENT_STATUS_CONFIG) as ContentStatus[]).map(key => (
                      <ColorPicker 
                        key={key} 
                        label={CONTENT_STATUS_CONFIG[key].label} 
                        value={settings.customStatusColors[key]} 
                        onChange={(c) => onUpdate('customStatusColors', {...settings.customStatusColors, [key]: c})} 
                      />
                  ))}
              </Card>
          </GridSection>

      </ViewContainer>
  );
};
