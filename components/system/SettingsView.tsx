
import React, { useState, useEffect } from 'react';
import { Settings, Globe, Eye, EyeOff, Zap, CheckCircle, XCircle, AlertTriangle, Type, Brush, Rows, KeyRound, RefreshCw } from 'lucide-react';
import { AppSettings } from '../../types';
import { BackendService } from '../../backend/aggregator';
import { ViewContainer, GridSection, Card, InputGroup, ToggleCard, SegmentedControl } from './SystemUI';

interface SettingsViewProps {
  settings: AppSettings;
  onUpdate: (key: keyof AppSettings, value: any) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ settings, onUpdate }) => {
  const [status, setStatus] = useState(BackendService.connectionStatus);
  const [isKeyVisible, setIsKeyVisible] = useState(false);

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
          
          <GridSection title="Подключение к серверу">
              <Card className="border-l-4 border-l-indigo-500">
                  <div className="flex flex-col gap-6">
                      <div className="flex items-center justify-between">
                          <h3 className="text-xl font-bold text-white">Параметры соединения</h3>
                          {getStatusBadge()}
                      </div>
                      
                      <p className="text-slate-400 text-sm">
                          Укажите IP-адрес и ключ API для подключения к серверу. Если поля пустые, приложение будет работать в режиме демонстрации.
                          <br />
                          <strong className="text-slate-300">Данные хранятся локально в вашем браузере.</strong>
                      </p>

                      <div className="grid md:grid-cols-2 gap-6 max-w-4xl">
                          <InputGroup 
                            label="Адрес сервера (Host URL)" 
                            icon={Globe} 
                            value={settings.serverUrl} 
                            onChange={(v:string) => onUpdate('serverUrl',v)} 
                            placeholder="http://192.168.1.10:3000" 
                          />
                           <InputGroup 
                            label="Ключ API" 
                            icon={KeyRound} 
                            value={settings.apiKey} 
                            onChange={(v:string) => onUpdate('apiKey',v)} 
                            placeholder="Введите ваш API ключ"
                            type={isKeyVisible ? 'text' : 'password'}
                            endAdornment={
                                <button onClick={() => setIsKeyVisible(!isKeyVisible)} className="text-slate-500 hover:text-indigo-400 transition-colors">
                                    {isKeyVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            }
                          />
                      </div>
                  </div>
              </Card>
          </GridSection>

          <GridSection title="Оформление интерфейса">
              <Card>
                  <div className="space-y-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <Type size={20} className="text-slate-400"/>
                            <h4 className="font-bold text-slate-200">Размер шрифта</h4>
                          </div>
                          <SegmentedControl
                              value={settings.fontSize}
                              onChange={(v) => onUpdate('fontSize', v)}
                              options={[
                                  { label: 'Мелкий', value: 'small' },
                                  { label: 'Стандарт', value: 'medium' },
                                  { label: 'Крупный', value: 'large' }
                              ]}
                          />
                      </div>
                      
                      <div className="w-full h-px bg-slate-700/50"></div>

                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <Rows size={20} className="text-slate-400"/>
                            <h4 className="font-bold text-slate-200">Плотность карточек</h4>
                          </div>
                          <SegmentedControl
                              value={settings.cardDensity}
                              onChange={(v) => onUpdate('cardDensity', v)}
                              options={[
                                  { label: 'Компактно', value: 'compact' },
                                  { label: 'Стандарт', value: 'default' }
                              ]}
                          />
                      </div>

                      <div className="w-full h-px bg-slate-700/50"></div>
                      
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <Brush size={20} className="text-slate-400"/>
                            <h4 className="font-bold text-slate-200">Цветовая схема</h4>
                          </div>
                          <SegmentedControl
                              value={settings.theme}
                              onChange={(v) => onUpdate('theme', v)}
                              options={[
                                  { label: 'Стандарт', value: 'default' },
                                  { label: 'Сепия', value: 'sepia' },
                                  { label: 'Сумерки', value: 'dusk' }
                              ]}
                          />
                      </div>
                  </div>
              </Card>
          </GridSection>

          <GridSection title="Поведение и автоматизация" cols={2}>
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
             <Card>
                <div className="flex flex-col justify-between h-full">
                    <div>
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-lg bg-slate-800 text-slate-400">
                                <RefreshCw size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-200">Авто-обновление</h3>
                                <p className="text-sm text-slate-500 leading-relaxed">
                                    Фоновая синхронизация данных.
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="mt-4">
                        <div className="flex items-center bg-slate-950/70 border border-slate-800 rounded-lg p-1 w-full">
                            {[
                                { label: 'Выкл', value: '0' },
                                { label: '5 мин', value: '5' },
                                { label: '10 мин', value: '10' },
                                { label: '15 мин', value: '15' }
                            ].map(opt => (
                                <button
                                  key={opt.value}
                                  onClick={() => onUpdate('autoRefreshInterval', Number(opt.value))}
                                  className={`
                                    flex-1 px-2 py-2 text-sm font-bold rounded-md transition-all duration-200 text-center
                                    ${String(settings.autoRefreshInterval) === opt.value 
                                        ? 'bg-indigo-600 text-white shadow' 
                                        : 'text-slate-400 hover:bg-slate-700/50'}
                                  `}
                                >
                                  {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </Card>
          </GridSection>
      </ViewContainer>
  );
};
