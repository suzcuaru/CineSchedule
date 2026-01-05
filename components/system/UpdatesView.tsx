
import React, { useState, useEffect } from 'react';
import { Info, User, Globe, Mail, Code, Hash, ChevronRight, Github, Download, RefreshCw, AlertTriangle, CheckCircle, FileText, Terminal, Box, ShieldCheck, Send, Sparkles } from 'lucide-react';
import { APP_INFO } from '../../config/appData';
import { ViewContainer, GridSection, Card } from './SystemUI';

const InfoRow: React.FC<{ icon: any; label: string; value: string; href?: string }> = ({ icon: Icon, label, value, href }) => (
  <a 
    href={href || undefined} 
    target="_blank" 
    rel="noopener noreferrer" 
    className={`flex items-center justify-between py-4 ${href ? 'hover:bg-indigo-500/5 -mx-4 px-4 rounded-lg cursor-pointer' : ''} transition-all group font-mono`}
    onClick={e => !href && e.preventDefault()}
  >
    <div className="flex items-center gap-4">
      <Icon size={18} className="text-slate-600 group-hover:text-indigo-400 shrink-0 transition-colors" />
      <span className="text-xs font-black text-slate-500 uppercase tracking-widest leading-none">{label}</span>
    </div>
    <div className="flex items-center gap-2 text-right min-w-0">
        <span className="text-sm font-bold text-slate-200 truncate group-hover:text-indigo-200 transition-colors">{value}</span>
        {href && <ChevronRight size={16} className="text-slate-800 group-hover:text-indigo-500 group-hover:translate-x-1 transition-transform shrink-0" />}
    </div>
  </a>
);

export const UpdatesView: React.FC = () => {
    const [isChecking, setIsChecking] = useState(false);
    const [latestVersion, setLatestVersion] = useState<string | null>(null);
    const [hasUpdate, setHasUpdate] = useState(false);
    const [error, setError] = useState(false);
    const [checked, setChecked] = useState(false);

    // Функция семантического сравнения версий
    const isNewer = (current: string, latest: string) => {
        const c = current.replace(/^v/, '').split('.').map(Number);
        const l = latest.replace(/^v/, '').split('.').map(Number);
        
        for (let i = 0; i < Math.max(c.length, l.length); i++) {
            const cVal = c[i] || 0;
            const lVal = l[i] || 0;
            if (lVal > cVal) return true;
            if (lVal < cVal) return false;
        }
        return false;
    };

    const handleCheckUpdates = async () => {
        setIsChecking(true);
        setError(false);
        try {
            const response = await fetch(`https://api.github.com/repos/${APP_INFO.githubRepo}/releases/latest`);
            if (!response.ok) throw new Error();
            const data = await response.json();
            const ver = data.tag_name;
            setLatestVersion(ver);
            
            // Если найденная версия новее текущей
            if (ver && isNewer(APP_INFO.version, ver)) {
                setHasUpdate(true);
            } else {
                setHasUpdate(false);
            }
            setChecked(true);
        } catch (e) {
            setError(true);
            console.error("Update check failed", e);
        } finally {
            setIsChecking(false);
        }
    };

    const openLink = (url: string) => window.open(url, '_blank');

    return (
        <ViewContainer title="Системная информация" icon={Terminal}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                <Card className="bg-slate-900/40 border-indigo-500/10 font-mono overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-12 bg-indigo-600/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
                    
                    <h3 className="text-xs font-black text-indigo-400 flex items-center gap-3 mb-8 uppercase tracking-[0.3em] relative z-10">
                        <Box size={18} />
                        Core_Environment
                    </h3>
                    
                    <div className="space-y-1 relative z-10">
                        <InfoRow icon={Code} label="Версия ядра" value={APP_INFO.version} />
                        <div className="h-px bg-slate-800/50 w-full" />
                        <InfoRow icon={Hash} label="ID сборки" value={`${APP_INFO.build}-FINAL`} />
                        <div className="h-px bg-slate-800/50 w-full" />
                        <InfoRow icon={ShieldCheck} label="Режим защиты" value="AES-256 Active" />
                    </div>

                    <div className="mt-8 p-4 bg-indigo-500/5 rounded-xl border border-indigo-500/10 flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className="text-[0.55rem] font-black text-slate-600 uppercase">Status</span>
                            <span className="text-xs font-bold text-indigo-400 uppercase">System_Optimal</span>
                        </div>
                        <div className="flex gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse delay-75" />
                        </div>
                    </div>
                </Card>

                <Card className="bg-slate-900/40 border-indigo-500/10 font-mono relative overflow-hidden">
                    {hasUpdate && <div className="absolute -right-12 -top-12 p-24 bg-indigo-600/10 rounded-full blur-3xl animate-pulse" />}
                    
                    <h3 className="text-xs font-black text-indigo-400 flex items-center gap-3 mb-8 uppercase tracking-[0.3em] relative z-10">
                        <RefreshCw size={18} className={isChecking ? 'animate-spin' : ''} />
                        Update_Center
                    </h3>
                    
                    <div className="flex flex-col items-center justify-center py-6 text-center relative z-10">
                        <div className="w-20 h-20 rounded-full border border-slate-800 flex items-center justify-center mb-6 relative">
                            {hasUpdate ? (
                                <Sparkles size={32} className="text-indigo-400 animate-bounce" />
                            ) : error ? (
                                <AlertTriangle size={32} className="text-red-500" />
                            ) : checked && !hasUpdate ? (
                                <CheckCircle size={32} className="text-emerald-500" />
                            ) : (
                                <Box size={32} className="text-slate-700" />
                            )}
                            {hasUpdate && <div className="absolute inset-0 border border-indigo-500/40 rounded-full animate-ping" />}
                        </div>
                        
                        <p className="text-sm font-bold text-white uppercase mb-2">
                            {hasUpdate ? `Доступно ядро ${latestVersion}` : error ? 'Ошибка синхронизации' : checked && !hasUpdate ? 'Ядро актуально' : 'Проверка не проводилась'}
                        </p>
                        <p className="text-[0.65rem] text-slate-500 uppercase tracking-widest mb-8">
                            {hasUpdate ? 'Рекомендуется обновление безопасности' : checked && !hasUpdate ? 'Установлена последняя стабильная сборка' : 'Синхронизация с GitHub API'}
                        </p>
                        
                        <div className="flex flex-col gap-3 w-full">
                            <button 
                                onClick={handleCheckUpdates}
                                disabled={isChecking}
                                className={`
                                    w-full py-3 font-black text-[0.65rem] uppercase tracking-[0.2em] rounded-xl transition-all border
                                    ${isChecking ? 'bg-slate-800 text-slate-500 border-slate-700' : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border-slate-800'}
                                `}
                            >
                                {isChecking ? 'Scanning...' : 'Выполнить поиск обновлений'}
                            </button>

                            {hasUpdate && (
                                <button 
                                    onClick={() => openLink(`https://github.com/${APP_INFO.githubRepo}/releases`)}
                                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[0.65rem] uppercase tracking-[0.2em] rounded-xl shadow-lg shadow-indigo-500/20 border border-indigo-400/30 animate-in fade-in slide-in-from-bottom-2 duration-500"
                                >
                                    <span className="flex items-center justify-center gap-2">
                                        <Download size={14} /> Скачать ядро {latestVersion}
                                    </span>
                                </button>
                            )}
                        </div>
                    </div>
                </Card>
            </div>

            <GridSection title="Узлы поддержки и связи" cols={1}>
                <Card className="bg-slate-950/30 border-indigo-500/5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 font-mono">
                    <div 
                        onClick={() => openLink(APP_INFO.githubProfileUrl)}
                        className="p-6 bg-[#0f172a] border border-slate-800 rounded-2xl group hover:border-indigo-500/30 transition-all cursor-pointer active:scale-95"
                    >
                        <Send size={24} className="text-indigo-500 mb-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                        <h4 className="text-[0.65rem] font-black text-slate-600 uppercase tracking-widest mb-1">Lead_Dev</h4>
                        <p className="text-sm font-bold text-slate-200">{APP_INFO.developer}</p>
                    </div>
                    <div 
                        onClick={() => openLink('https://' + APP_INFO.website)}
                        className="p-6 bg-[#0f172a] border border-slate-800 rounded-2xl group hover:border-indigo-500/30 transition-all cursor-pointer active:scale-95"
                    >
                        <Globe size={24} className="text-blue-500 mb-4 group-hover:rotate-12 transition-transform" />
                        <h4 className="text-[0.65rem] font-black text-slate-600 uppercase tracking-widest mb-1">Network</h4>
                        <p className="text-sm font-bold text-slate-200">{APP_INFO.website}</p>
                    </div>
                    <div 
                        onClick={() => openLink(APP_INFO.supportEmail)}
                        className="p-6 bg-[#0f172a] border border-slate-800 rounded-2xl group hover:border-indigo-500/30 transition-all cursor-pointer active:scale-95"
                    >
                        <ShieldCheck size={24} className="text-purple-500 mb-4 group-hover:scale-110 transition-transform" />
                        <h4 className="text-[0.65rem] font-black text-slate-600 uppercase tracking-widest mb-1">Comm_Channel</h4>
                        <p className="text-sm font-bold text-slate-200">Support_Node</p>
                    </div>
                    <div 
                        onClick={() => openLink('https://github.com/' + APP_INFO.githubRepo)}
                        className="p-6 bg-[#0f172a] border border-slate-800 rounded-2xl group hover:border-indigo-500/30 transition-all cursor-pointer active:scale-95"
                    >
                        <Github size={24} className="text-slate-400 mb-4 group-hover:scale-110 transition-transform" />
                        <h4 className="text-[0.65rem] font-black text-slate-600 uppercase tracking-widest mb-1">Source_Code</h4>
                        <p className="text-sm font-bold text-slate-200">Repository</p>
                    </div>
                </Card>
            </GridSection>

            <div className="mt-12 text-center font-mono">
                <p className="text-[0.55rem] text-slate-700 uppercase tracking-[0.5em] mb-4">Proprietary Software © 2024 Cinetech Systems</p>
                <div className="flex justify-center gap-4">
                    <FileText size={16} className="text-slate-800 hover:text-indigo-500 cursor-pointer" />
                    <Info size={16} className="text-slate-800 hover:text-indigo-500 cursor-pointer" />
                    <Globe size={16} className="text-slate-800 hover:text-indigo-500 cursor-pointer" />
                </div>
            </div>
        </ViewContainer>
    );
};
