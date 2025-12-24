import React, { useState } from 'react';
import { Sparkles, Brain, AlertTriangle, CheckCircle2, Loader2, MessageSquare, Zap, RefreshCw, BarChart3, ScanLine, Lightbulb } from 'lucide-react';
import { MovieSession, AnalysisResult } from '../../types';
import { analyzeScheduleWithGemini } from '../../services/geminiService';

interface AIScheduleAnalysisProps {
  sessions: MovieSession[];
  date: string;
}

// Helper: Visual Gauge for Efficiency
const EfficiencyMeter: React.FC<{ value: string }> = ({ value }) => {
  const normalized = value.toLowerCase();
  let width = '50%';
  let color = 'bg-slate-500';
  let labelColor = 'text-slate-400';
  let glow = '';

  if (normalized.includes('высок') || normalized.includes('high') || normalized.includes('отлич')) {
    width = '95%';
    color = 'bg-emerald-500';
    labelColor = 'text-emerald-400';
    glow = 'shadow-[0_0_15px_rgba(16,185,129,0.4)]';
  } else if (normalized.includes('средн') || normalized.includes('medium') || normalized.includes('норм')) {
    width = '70%';
    color = 'bg-amber-400';
    labelColor = 'text-amber-400';
    glow = 'shadow-[0_0_15px_rgba(251,191,36,0.4)]';
  } else if (normalized.includes('низк') || normalized.includes('low') || normalized.includes('плох')) {
    width = '30%';
    color = 'bg-red-500';
    labelColor = 'text-red-400';
    glow = 'shadow-[0_0_15px_rgba(239,68,68,0.4)]';
  }

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex justify-between items-end">
        <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Оценка эффективности</span>
        <span className={`text-sm font-bold font-mono ${labelColor}`}>{value}</span>
      </div>
      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden relative">
        <div className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out ${color} ${glow}`} style={{ width }} />
      </div>
    </div>
  );
};

export const AIScheduleAnalysis: React.FC<AIScheduleAnalysisProps> = ({ sessions, date }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (sessions.length === 0) return;
    setIsAnalyzing(true);
    setError(null);
    try {
        const analysis = await analyzeScheduleWithGemini(sessions, date);
        setResult(analysis);
    } catch (e) {
        setError("Не удалось выполнить анализ. Проверьте API ключ.");
    } finally {
        setIsAnalyzing(false);
    }
  };

  if (sessions.length === 0) return null;

  return (
    <div className="w-full mt-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-6 bg-purple-500 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)]"></div>
            <h2 className="text-lg font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                <Sparkles size={18} className="text-purple-400" />
                AI Ассистент
            </h2>
        </div>

        {!result ? (
             <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border border-purple-500/30 rounded-2xl p-8 relative overflow-hidden group">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#8b5cf6_1px,transparent_1px),linear-gradient(to_bottom,#8b5cf6_1px,transparent_1px)] bg-[size:40px_40px] opacity-[0.03] pointer-events-none"></div>
                
                <div className="relative z-10 flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-4 border border-purple-500/20 shadow-xl shadow-purple-500/5">
                        <Brain size={32} className="text-purple-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Интеллектуальный анализ расписания</h3>
                    <p className="text-slate-400 max-w-lg mb-8 text-sm leading-relaxed">
                        Gemini Pro проанализирует текущую сетку сеансов, найдет технические конфликты, оценит эффективность плотности показов и подготовит чек-лист для киномехаников.
                    </p>
                    
                    <button 
                        onClick={handleAnalyze}
                        disabled={isAnalyzing}
                        className={`
                            relative overflow-hidden px-8 py-3 rounded-xl font-bold text-white transition-all
                            ${isAnalyzing ? 'bg-slate-700 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-500 shadow-lg shadow-purple-500/25 active:scale-95'}
                        `}
                    >
                        {isAnalyzing ? (
                            <span className="flex items-center gap-2">
                                <Loader2 size={18} className="animate-spin" />
                                Анализирую...
                            </span>
                        ) : (
                            <span className="flex items-center gap-2">
                                <Zap size={18} />
                                Запустить анализ
                            </span>
                        )}
                    </button>
                    {error && <p className="mt-4 text-red-400 text-sm">{error}</p>}
                </div>
             </div>
        ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Summary Card */}
                <div className="lg:col-span-2 bg-[#1e293b] border border-slate-700/50 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                    <div className="flex items-start gap-4 mb-6">
                         <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/20 text-purple-400">
                            <MessageSquare size={24} />
                         </div>
                         <div>
                            <h3 className="text-lg font-bold text-white mb-1">Резюме смены</h3>
                            <p className="text-slate-300 text-sm leading-relaxed">{result.summary}</p>
                         </div>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700/50">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <ScanLine size={14} /> Технические заметки
                            </h4>
                            <ul className="space-y-2">
                                {result.technical_notes.map((note, idx) => (
                                    <li key={idx} className="flex items-start gap-2 text-sm text-slate-300">
                                        <div className="mt-1.5 w-1 h-1 bg-purple-500 rounded-full shrink-0" />
                                        {note}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Sidebar Stats */}
                <div className="flex flex-col gap-6">
                    {/* Efficiency Score */}
                    <div className="bg-[#1e293b] border border-slate-700/50 rounded-2xl p-6 shadow-xl flex flex-col justify-center">
                        <div className="flex items-center gap-3 mb-4 text-slate-200">
                            <BarChart3 size={20} className="text-emerald-400" />
                            <span className="font-bold">Эффективность</span>
                        </div>
                        <EfficiencyMeter value={result.schedule_efficiency} />
                    </div>

                    {/* Alerts */}
                    <div className="bg-[#1e293b] border border-slate-700/50 rounded-2xl p-6 shadow-xl flex-1">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <AlertTriangle size={14} className="text-amber-400" />
                            Внимание
                        </h4>
                        {result.alerts.length > 0 ? (
                            <ul className="space-y-3">
                                {result.alerts.map((alert, idx) => (
                                    <li key={idx} className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs font-medium text-amber-200 leading-snug">
                                        {alert}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-6 text-slate-500 gap-2">
                                <CheckCircle2 size={32} className="text-emerald-500/30" />
                                <span className="text-xs font-bold uppercase">Без замечаний</span>
                            </div>
                        )}
                    </div>

                     <button 
                        onClick={handleAnalyze} 
                        disabled={isAnalyzing}
                        className="w-full py-3 rounded-xl border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors text-sm font-bold flex items-center justify-center gap-2"
                    >
                        <RefreshCw size={14} className={isAnalyzing ? "animate-spin" : ""} />
                        Обновить анализ
                    </button>
                </div>
            </div>
        )}
    </div>
  );
};