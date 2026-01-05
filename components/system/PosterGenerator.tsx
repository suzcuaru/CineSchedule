
import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Image, Sparkles, Wand2, Download, RefreshCw, AlertCircle, Info, ScanLine, Terminal } from 'lucide-react';
import { ViewContainer, GridSection, Card, InputGroup, SystemHint } from './SystemUI';

export const PosterGenerator: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        setIsGenerating(true);
        setError(null);
        
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: {
                    parts: [
                        { text: `A cinematic movie poster for a cinema lobby. The poster should say "${prompt}". Highly detailed, professional lighting, 8k resolution, IMAX style.` }
                    ]
                },
                config: {
                    imageConfig: {
                        aspectRatio: "3:4"
                    }
                }
            });

            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                    const base64Data = part.inlineData.data;
                    setGeneratedImageUrl(`data:image/png;base64,${base64Data}`);
                    break;
                }
            }
        } catch (e) {
            console.error("Poster Generation Error:", e);
            setError("Ошибка генерации. Проверьте соединение или настройки API.");
        } finally {
            setIsGenerating(false);
        }
    };

    const downloadImage = () => {
        if (!generatedImageUrl) return;
        const link = document.createElement('a');
        link.href = generatedImageUrl;
        link.download = `cine-poster-${Date.now()}.png`;
        link.click();
    };

    return (
        <ViewContainer title="AI Генератор Объявлений" icon={Terminal}>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
                <div className="lg:col-span-5 flex flex-col gap-6">
                    <SystemHint title="LOBBY_VISUAL_ENGINE">
                        Используйте этот модуль для мгновенного создания объявлений для фойе. Введите текст (например, "Все билеты проданы" или "Скоро: Гладиатор 2") и нейросеть подготовит профессиональный постер.
                    </SystemHint>

                    <Card className="flex flex-col gap-6 bg-slate-900/60 border-violet-500/10">
                        <InputGroup 
                            label="Текст для постера" 
                            icon={Wand2} 
                            value={prompt} 
                            onChange={setPrompt} 
                            placeholder="Напр: ТЕХНИЧЕСКИЙ ПЕРЕРЫВ 15 МИН" 
                        />

                        <button 
                            onClick={handleGenerate}
                            disabled={isGenerating || !prompt.trim()}
                            className={`
                                w-full py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] border flex items-center justify-center gap-3 transition-all
                                ${isGenerating ? 'bg-slate-800 text-slate-500 border-slate-700' : 'bg-purple-600 hover:bg-purple-500 text-white shadow-xl shadow-purple-500/20 border-purple-400/30 active:scale-95'}
                            `}
                        >
                            {isGenerating ? <RefreshCw size={18} className="animate-spin" /> : <Sparkles size={18} />}
                            {isGenerating ? 'ОБРАБОТКА_ЯДРОМ...' : 'ГЕНЕРИРОВАТЬ_ПОСТЕР'}
                        </button>

                        {error && (
                            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-mono">
                                <AlertCircle size={14} />
                                {error}
                            </div>
                        )}
                    </Card>

                    <div className="mt-auto p-5 bg-indigo-500/5 rounded-2xl border border-indigo-500/10 font-mono">
                        <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <Info size={14} /> INFO_LOG
                        </h4>
                        <p className="text-[10px] text-slate-500 leading-relaxed uppercase">
                            Движок: Gemini 2.5 Flash Image<br/>
                            Разрешение: Optimized for Digital Signage<br/>
                            Время рендеринга: ~5-10 сек
                        </p>
                    </div>
                </div>

                <div className="lg:col-span-7">
                    <Card className="h-full min-h-[500px] flex flex-col items-center justify-center bg-slate-950/40 border-violet-500/10 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.05)_0%,transparent_70%)] pointer-events-none" />
                        
                        {generatedImageUrl ? (
                            <div className="relative w-full h-full flex flex-col items-center justify-center animate-in zoom-in-95 duration-500">
                                <div className="relative max-w-full max-h-full aspect-[3/4] rounded-lg overflow-hidden border border-violet-500/30 shadow-2xl">
                                    <img src={generatedImageUrl} alt="Generated" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 border-[20px] border-black/20 pointer-events-none" />
                                </div>
                                <button 
                                    onClick={downloadImage}
                                    className="absolute bottom-6 right-6 p-4 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all shadow-xl"
                                >
                                    <Download size={24} />
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-4 text-slate-700">
                                <div className="w-24 h-24 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center">
                                    <Image size={48} className="opacity-20" />
                                </div>
                                <span className="text-xs font-black uppercase tracking-[0.4em]">ОЖИДАНИЕ_ВВОДА</span>
                            </div>
                        )}

                        <div className="absolute top-4 left-4 flex gap-2">
                             <div className="w-1.5 h-1.5 rounded-full bg-violet-500/30" />
                             <div className="w-1.5 h-1.5 rounded-full bg-violet-500/30" />
                             <div className="w-1.5 h-1.5 rounded-full bg-violet-500/30" />
                        </div>
                    </Card>
                </div>
            </div>
        </ViewContainer>
    );
};
