import React, { useState } from 'react';
import { Info, User, Globe, Mail, Code, Hash, ChevronRight, Github, Download, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import { APP_INFO } from '../../config/appData';
import { ViewContainer, GridSection, Card } from './SystemUI';

const InfoRow: React.FC<{ icon: any; label: string; value: string; href?: string }> = ({ icon: Icon, label, value, href }) => (
  <a 
    href={href || undefined} 
    target="_blank" 
    rel="noopener noreferrer" 
    className={`flex items-center justify-between py-4 ${href ? 'hover:bg-slate-800/50 -mx-4 px-4 rounded-lg cursor-pointer' : ''} transition-colors group`}
    onClick={e => !href && e.preventDefault()}
  >
    <div className="flex items-center gap-4">
      <Icon size={18} className="text-slate-500 shrink-0" />
      <span className="text-base text-slate-400">{label}</span>
    </div>
    <div className="flex items-center gap-2 text-right">
        <span className="text-base font-medium text-slate-200 font-mono truncate">{value}</span>
        {href && <ChevronRight size={16} className="text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-1 transition-transform shrink-0" />}
    </div>
  </a>
);

type CheckState = {
    status: 'idle' | 'checking' | 'checked' | 'error';
    latestVersion?: string;
    downloadUrl?: string;
    errorMessage?: string;
}

export const UpdatesView: React.FC = () => {
    const [checkState, setCheckState] = useState<CheckState>({ status: 'idle' });

    const handleCheckUpdates = async () => {
        if (!APP_INFO.githubRepo || APP_INFO.githubRepo.split('/').length !== 2) {
             setCheckState({
                status: 'error',
                errorMessage: 'Репозиторий проекта не настроен.',
            });
            return;
        }

        setCheckState({ status: 'checking' });
        try {
            const response = await fetch(`https://api.github.com/repos/${APP_INFO.githubRepo}/releases`);
            
            if (!response.ok) {
                throw new Error(`Ошибка GitHub API: ${response.status}`);
            }

            const releases: { tag_name: string, html_url: string }[] = await response.json();

            if (!releases || releases.length === 0) {
                setCheckState({
                    status: 'error',
                    errorMessage: 'Релизы не найдены в репозитории.',
                });
                return;
            }

            const latestRelease = releases[0];
            const latestVersion = latestRelease.tag_name;
            const downloadUrl = latestRelease.html_url;

            setCheckState({
                status: 'checked',
                latestVersion,
                downloadUrl,
            });

        } catch (error: any) {
            console.error("Update check failed:", error);
            setCheckState({
                status: 'error',
                errorMessage: error.message || 'Не удалось проверить обновления. Попробуйте позже.',
            });
        }
    }

    const renderUpdateCheck = () => {
        const currentVersion = APP_INFO.version.replace('v', '');
        const latestVersion = checkState.latestVersion?.replace('v', '');
        const isNewVersionAvailable = checkState.status === 'checked' && latestVersion && currentVersion !== latestVersion;

        switch (checkState.status) {
            case 'checking':
                return (
                    <div className="flex items-center justify-center p-8 text-slate-400">
                        <RefreshCw size={24} className="animate-spin mr-3" />
                        <span className="text-lg font-bold">Проверка...</span>
                    </div>
                );
            case 'error':
                return (
                    <div className="flex flex-col items-center gap-4 p-6 text-center">
                        <AlertTriangle size={32} className="text-red-500" />
                        <p className="font-bold text-red-400">Ошибка</p>
                        <p className="text-sm text-slate-400">{checkState.errorMessage}</p>
                        <button onClick={() => setCheckState({ status: 'idle' })} className="mt-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 text-sm font-bold">Попробовать снова</button>
                    </div>
                );
            case 'checked':
                return isNewVersionAvailable ? (
                    <div className="flex flex-col md:flex-row gap-6 items-center p-4">
                        <div className="flex-1">
                            <h3 className="text-xl font-bold text-emerald-400 mb-1">Доступна новая версия!</h3>
                            <p className="text-slate-300 font-mono">
                                <span className="text-slate-500">{currentVersion}</span> → <span className="font-bold text-emerald-300">{latestVersion}</span>
                            </p>
                        </div>
                        <a 
                            href={checkState.downloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full md:w-auto shrink-0 flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-lg shadow-emerald-500/20"
                        >
                            <Download size={20} />
                            <span>Скачать</span>
                        </a>
                    </div>
                ) : (
                    <div className="flex items-center justify-center gap-4 p-8 text-center">
                        <CheckCircle size={28} className="text-emerald-500" />
                        <div>
                            <p className="text-lg font-bold text-emerald-400">У вас последняя версия</p>
                            <p className="text-sm text-slate-500 font-mono">{currentVersion}</p>
                        </div>
                    </div>
                );
            case 'idle':
            default:
                return (
                    <div className="flex flex-col md:flex-row gap-6 items-center p-4">
                        <div className="flex-1">
                            <h3 className="text-xl font-bold text-white mb-1">Актуальность версии</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                Проверьте, используете ли вы последнюю версию приложения, чтобы получить доступ ко всем новым функциям и исправлениям.
                            </p>
                        </div>
                        <button 
                            onClick={handleCheckUpdates}
                            className="w-full md:w-auto shrink-0 flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-lg shadow-indigo-500/20"
                        >
                            <RefreshCw size={20} />
                            <span>Проверить</span>
                        </button>
                    </div>
                );
        }
    };
    
    return (
        <ViewContainer title="О системе" icon={Info}>
            <GridSection title="Информация о приложении">
                <Card>
                    <InfoRow icon={Code} label="Версия" value={APP_INFO.version} />
                    <div className="my-2 border-t border-slate-700/50" />
                    <InfoRow icon={Hash} label="Сборка" value={APP_INFO.build} />
                </Card>
            </GridSection>

            <GridSection title="Проверка обновлений">
                <Card>
                   {renderUpdateCheck()}
                </Card>
            </GridSection>
            
            <GridSection title="Разработчик и поддержка">
                <Card>
                    <InfoRow icon={User} label="Разработчик" value={APP_INFO.developer} />
                    <div className="my-2 border-t border-slate-700/50" />
                    <InfoRow icon={Globe} label="Веб-сайт" value={APP_INFO.website} href={`https://${APP_INFO.website}`} />
                    <div className="my-2 border-t border-slate-700/50" />
                    <InfoRow icon={Mail} label="Почта поддержки" value={APP_INFO.supportEmail} href={`mailto:${APP_INFO.supportEmail}`} />
                    <div className="my-2 border-t border-slate-700/50" />
                    <InfoRow icon={Github} label="Профиль GitHub" value={APP_INFO.githubProfileUrl} href={APP_INFO.githubProfileUrl} />
                </Card>
            </GridSection>
        </ViewContainer>
    );
};