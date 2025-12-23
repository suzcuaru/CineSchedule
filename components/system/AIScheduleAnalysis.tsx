
import React, { useState } from 'react';
import { Sparkles, Brain, AlertTriangle, CheckCircle2, Loader2, MessageSquare, ListChecks, Zap } from 'lucide-react';
import { MovieSession, AnalysisResult } from '../../types';
import { analyzeScheduleWithGemini } from '../../services/geminiService';
import { Card } from './SystemUI';

interface AIScheduleAnalysisProps {
  sessions: MovieSession[];
  date: string;
}

export const AIScheduleAnalysis: React.FC<AIScheduleAnalysisProps> = ({ sessions, date }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handleAnalyze = async () => {
    if (sessions.length === 0) return;
    setIsAnalyzing(true);
    try {
      const analysis = await analyzeScheduleWithGemini(sessions, date);
      setResult(analysis);
    } catch (error) {
      console.error("Analysis failed", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (sessions.length === 0) return null;

  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 bg-indigo-500 rounded-full"></div>
          <h2 className="text-lg font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Sparkles size={18} className="text-indigo-400" />
            AI Инсайты
          </h2>
        </div>
        {!result && !isAnalyzing && (
          <button 
            onClick={handleAnalyze}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 rounded-lg text-sm font-bold transition-all"
          >
            <Brain size={16} />
            Анализировать расписание
          </button>
        )}
      </div>

      {isAnalyzing && (
        <Card className="border-indigo-500/30 bg-indigo-500/5 animate-pulse">
          <div className="flex flex-col items-center justify-center py-10 gap-4">
            <Loader2 size={40} className="text-indigo-500 animate-spin" />
            <div className="text-center">
              <p className="text-white font-bold text-lg">CineSchedule AI анализирует данные...</p>
              <p className="text-slate-500 text-sm">Проверка технических стыковок и форматов</p>
            </div>
          </div>
        </Card>
      )}

      {result && !isAnalyzing && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Summary Section */}
          <Card className="lg:col-span-2 border-indigo-500/20">
            <div className="flex items-center gap-3 mb-4 text-indigo-400">
              <MessageSquare size={20} />
              <h3 className="font-bold uppercase tracking-wider">Общее резюме</h3>
            </div>
            <p className="text-slate-300 leading-relaxed text-lg">
              {result.summary}
            </p>
            <div className="mt-6 pt-6 border-t border-slate-700/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Zap size={18} className="text-amber-400" />
                <span className="text-sm font-bold text-slate-400 uppercase">Эффективность сетки:</span>
                <span className="text-sm font-mono text-white bg-slate-800 px-2 py-1 rounded border border-slate-700">
                  {result.schedule_efficiency}
                </span>
              </div>
              <button 
                onClick={handleAnalyze}
                className="text-xs font-bold text-indigo-400 hover:text-indigo-300 uppercase tracking-widest flex items-center gap-2 transition-colors"
              >
                <RefreshCw size={12} />
                Обновить анализ
              </button>
            </div>
          </Card>

          {/* Sidebar: Notes & Alerts */}
          <div className="flex flex-col gap-6">
            <Card className="border-emerald-500/20 bg-emerald-500/5">
              <div className="flex items-center gap-3 mb-4 text-emerald-400">
                <ListChecks size={20} />
                <h3 className="font-bold uppercase tracking-wider">Тех. заметки</h3>
              </div>
              <ul className="space-y-3">
                {result.technical_notes.map((note, idx) => (
                  <li key={idx} className="flex gap-3 text-sm text-slate-300">
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card className={`border-red-500/20 ${result.alerts.length > 0 ? 'bg-red-500/5' : 'opacity-50'}`}>
              <div className="flex items-center gap-3 mb-4 text-red-400">
                <AlertTriangle size={20} />
                <h3 className="font-bold uppercase tracking-wider">Внимание (Alerts)</h3>
              </div>
              {result.alerts.length > 0 ? (
                <ul className="space-y-3">
                  {result.alerts.map((alert, idx) => (
                    <li key={idx} className="flex gap-3 text-sm text-slate-300">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 mt-1.5" />
                      <span>{alert}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-500 text-sm italic">Критических проблем не обнаружено</p>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

import { RefreshCw } from 'lucide-react';
