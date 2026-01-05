
import React, { useState, useRef, useEffect } from 'react';
import { ChevronRight, Pipette, Check, Info, CornerRightDown } from 'lucide-react';
import { VerticalScrollPanel } from '../VerticalScrollPanel';

export const Equalizer = ({ active, color, size = 'md' }: { active: boolean, color?: string, size?: 'sm' | 'md' | 'lg' }) => {
    const scaleMap = {
        sm: { height: 'h-4', width: 'w-[1.5px]', gap: 'gap-[1.5px]' },
        md: { height: 'h-6', width: 'w-[2px]', gap: 'gap-[2px]' },
        lg: { height: 'h-24', width: 'w-[5px]', gap: 'gap-[5px]' }
    };
    const style = scaleMap[size];
    
    const barColor = color || '#8b5cf6';
    const bars = Array.from({ length: 16 }, (_, i) => i);

    return (
        <div className={`flex items-end ${style.gap} ${style.height} px-1 overflow-hidden ${active ? 'animate-terminal-flicker' : ''}`}>
            {bars.map((i) => (
                <div 
                    key={i} 
                    className={`
                        ${style.width} rounded-sm 
                        ${active ? 'animate-terminal-scan' : ''}
                    `}
                    style={{ 
                        backgroundColor: barColor, 
                        height: active ? '100%' : '15%',
                        opacity: active ? 1 : 0.15,
                        animationDelay: active ? `${(i * 0.4) % 3.2}s` : '0s',
                        animationDuration: active ? `${2.8 + (i % 5) * 0.4}s` : '0s',
                        boxShadow: active && i % 4 === 0 ? `0 0 12px ${barColor}` : 'none'
                    }} 
                />
            ))}
        </div>
    );
};

export const SystemHint: React.FC<{ children?: React.ReactNode, title?: string }> = ({ children, title }) => (
    <div className="relative p-5 rounded-2xl border border-violet-500/20 bg-violet-500/5 group">
        <div className="flex items-center gap-3 mb-3">
            <Info size={18} className="text-violet-400" />
            <span className="text-xs md:text-sm font-mono font-black uppercase tracking-[0.2em] text-violet-400">
                {title || 'SYSTEM_NOTICE'}
            </span>
        </div>
        <div className="text-sm md:text-base text-slate-400 font-medium leading-relaxed">
            {children}
        </div>
        <div className="absolute bottom-2 right-2 opacity-20 text-violet-500">
            <CornerRightDown size={14} />
        </div>
    </div>
);

export const ViewContainer: React.FC<{ title: string, icon: any, children?: React.ReactNode }> = ({ title, icon: Icon, children }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  return (
    <div className="w-full h-full relative overflow-hidden bg-[#0b0f19]">
        <div 
            ref={scrollRef}
            className="w-full h-full overflow-y-auto custom-scrollbar"
        >
            <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-10 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-4 mb-10">
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-400 uppercase tracking-widest flex items-center gap-4 font-mono">
                        <Icon size={32} className="text-violet-500" />
                        <span className="text-violet-500/30 mr-1">&gt;</span>
                        {title}
                    </h1>
                </div>
                {children}
            </div>
        </div>
        <VerticalScrollPanel targetRef={scrollRef} topOffset="12px" bottomOffset="12px" />
    </div>
  );
};

export const GridSection: React.FC<{ title: string, children?: React.ReactNode, cols?: number }> = ({ title, children, cols=1 }) => (
    <div className="mb-12">
        <div className="flex items-center gap-3 mb-6">
            <div className="w-1.5 h-7 bg-violet-500 rounded-full shadow-[0_0_15px_rgba(139,92,246,0.6)]"></div>
            <h2 className="text-xl font-black text-slate-400 uppercase tracking-[0.15em]">{title}</h2>
        </div>
        <div className={`grid grid-cols-1 ${cols === 2 ? 'md:grid-cols-2' : ''} ${cols === 3 ? 'lg:grid-cols-3' : ''} gap-6`}>
            {children}
        </div>
    </div>
);

export const Card: React.FC<{ children?: React.ReactNode, className?: string }> = ({ children, className = "" }) => (
    <div className={`bg-[#0f172a]/80 backdrop-blur-md border border-violet-500/10 rounded-[24px] p-8 shadow-2xl ${className}`}>
        {children}
    </div>
);

export const ToggleCard: React.FC<{ label: string, desc: string, icon: any, enabled: boolean, onToggle: () => void }> = ({ label, desc, icon: Icon, enabled, onToggle }) => (
    <div 
        onClick={onToggle}
        className={`
            relative overflow-hidden cursor-pointer group select-none rounded-2xl border p-4 transition-all duration-300
            ${enabled ? 'bg-violet-900/20 border-violet-500/40 shadow-[0_0_20px_rgba(139,92,246,0.05)]' : 'bg-[#1e293b]/50 border-slate-800 hover:border-slate-700'}
        `}
    >
        <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl transition-all duration-300 ${enabled ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/30' : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700'}`}>
                    <Icon size={20} />
                </div>
                <div>
                    <h3 className={`text-base font-bold transition-colors duration-300 tracking-tight ${enabled ? 'text-white' : 'text-slate-300'}`}>{label}</h3>
                </div>
            </div>
            <div className={`w-11 h-6 rounded-full relative transition-colors duration-200 ease-in-out shrink-0 ${enabled ? 'bg-violet-500' : 'bg-slate-700'}`}>
                <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 ease-in-out ${enabled ? 'translate-x-5' : ''}`} />
            </div>
        </div>
        {desc && <p className="mt-2 text-sm text-slate-500 leading-relaxed transition-colors group-hover:text-slate-400">{desc}</p>}
    </div>
);

export const ColorPicker: React.FC<{ value: string, onChange: (v: string) => void, label?: string }> = ({ value, onChange, label }) => {
    const [isOpen, setIsOpen] = useState(false);
    const triggerRef = useRef<HTMLDivElement>(null);
    const presets = ['#ef4444', '#f97316', '#facc15', '#10b981', '#3b82f6', '#8b5cf6', '#a855f7', '#ec4899', '#64748b', '#ffffff'];

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (isOpen && triggerRef.current && !triggerRef.current.contains(e.target as Node)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    return (
        <div className="relative w-full" ref={triggerRef}>
            <div 
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-5 p-4 bg-slate-950/50 rounded-2xl border border-slate-800 cursor-pointer hover:border-violet-500/50 transition-all group w-full shadow-sm"
            >
                <div className="w-12 h-12 rounded-xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.3),0_1px_2px_rgba(255,255,255,0.1)] relative overflow-hidden shrink-0" style={{ backgroundColor: value }}>
                    <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent" />
                </div>
                {label && (
                    <div className="flex flex-col min-w-0 flex-1 overflow-hidden">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest truncate mb-1">{label}</span>
                        <span className="text-sm md:text-base font-mono text-slate-300 uppercase truncate">{value}</span>
                    </div>
                )}
                <Pipette size={20} className="ml-auto text-slate-600 group-hover:text-violet-400 transition-colors shrink-0" />
            </div>

            {isOpen && (
                <div className="absolute bottom-full mb-3 left-0 z-[110] w-72 p-5 bg-[#1e293b] border border-slate-700/50 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.6),0_0_20px_rgba(139,92,246,0.15)] animate-in zoom-in-95 fade-in slide-in-from-bottom-2 duration-200">
                    <div className="grid grid-cols-5 gap-3 mb-5">
                        {presets.map(c => (
                            <button 
                                key={c} 
                                onClick={() => { onChange(c); setIsOpen(false); }}
                                className="w-10 h-10 rounded-full border border-white/10 hover:scale-110 transition-all flex items-center justify-center shadow-[0_4px_10px_rgba(0,0,0,0.4)] hover:shadow-violet-500/20"
                                style={{ backgroundColor: c }}
                            >
                                {value.toLowerCase() === c && <Check size={18} className={c === '#ffffff' ? 'text-black' : 'text-white'} />}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-3 pt-4 border-t border-slate-700/50">
                        <div className="w-8 h-8 rounded-lg border border-white/10 shrink-0 shadow-inner" style={{ backgroundColor: value }} />
                        <input 
                            type="text" 
                            value={value} 
                            onChange={(e) => onChange(e.target.value)}
                            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm font-mono text-white w-full focus:outline-none focus:border-violet-500"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export const SegmentedControl: React.FC<{ options: {label: string, value: any, tooltip?: string}[], value: any, onChange: (v: any) => void }> = ({ options, value, onChange }) => {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    return (
        <div className="flex flex-wrap gap-3 w-full p-2 bg-slate-950/80 rounded-2xl border border-slate-800">
            {options.map((opt, idx) => (
                <div 
                    key={String(opt.value)} 
                    className="flex-1 min-w-[100px] relative group/btn"
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                >
                    <button
                        onClick={() => onChange(opt.value)}
                        className={`
                            w-full px-4 py-4 text-base font-black rounded-xl transition-all duration-300 text-center relative overflow-hidden flex items-center justify-center tracking-tight
                            ${value === opt.value 
                                ? 'bg-violet-600 text-white shadow-[0_0_20px_rgba(139,92,246,0.4)] z-10' 
                                : 'text-slate-500 hover:text-violet-300 hover:bg-violet-500/5'}
                        `}
                    >
                        {value === opt.value && <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none" />}
                        <span className="relative z-10">{opt.label}</span>
                    </button>
                    
                    {opt.tooltip && hoveredIndex === idx && (
                        <div className="hidden md:block absolute bottom-full left-1/2 -translate-x-1/2 mb-5 px-5 py-4 bg-[#0f172a] text-sm text-slate-200 rounded-2xl border border-slate-700/50 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.7),0_0_20px_rgba(139,92,246,0.15)] z-[120] animate-in fade-in slide-in-from-bottom-2 pointer-events-none w-[240px] text-center backdrop-blur-md whitespace-normal leading-relaxed border-white/5">
                            <p>{opt.tooltip}</p>
                            <div className="absolute top-full left-1/2 -translate-x-1/2 w-4 h-4 bg-[#0f172a] border-r border-b border-slate-700/50 rotate-45 -mt-2" />
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export const InputGroup: React.FC<any> = ({ label, icon: Icon, value, onChange, type="text", placeholder, endAdornment }) => (
    <div className="flex flex-col gap-3 w-full">
        <label className="text-base text-slate-400 font-black uppercase tracking-[0.1em] ml-2">{label}</label>
        <div className="relative group w-full">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-violet-400 transition-colors pointer-events-none">
                <Icon size={24} />
            </div>
            <input 
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 pl-14 pr-14 text-lg text-slate-200 placeholder:text-slate-800 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all shadow-inner font-mono"
            />
            {endAdornment && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    {endAdornment}
                </div>
            )}
        </div>
    </div>
);

export const TimeRangePicker: React.FC<{ 
    startValue: string; 
    endValue: string; 
    onStartChange: (v: string) => void; 
    onEndChange: (v: string) => void;
    startLabel?: string;
    endLabel?: string;
}> = ({ startValue, endValue, onStartChange, onEndChange, startLabel, endLabel }) => {
    return (
        <div className="flex gap-4 w-full">
            <div className="flex-1 flex flex-col gap-2">
                {startLabel && <label className="text-sm text-slate-500 font-bold uppercase tracking-wider ml-2">{startLabel}</label>}
                <input 
                    type="time"
                    value={startValue}
                    onChange={(e) => onStartChange(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-base text-slate-200 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all font-mono"
                />
            </div>
            <div className="flex items-center text-slate-600">
                <span className="text-2xl font-bold">—</span>
            </div>
            <div className="flex-1 flex flex-col gap-2">
                {endLabel && <label className="text-sm text-slate-500 font-bold uppercase tracking-wider ml-2">{endLabel}</label>}
                <input 
                    type="time"
                    value={endValue}
                    onChange={(e) => onEndChange(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-base text-slate-200 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all font-mono"
                />
            </div>
        </div>
    );
};

export const GestureItem: React.FC<{ icon: any, title: string, desc: string }> = ({ icon: Icon, title, desc }) => (
    <div className="flex gap-5 items-start p-7 bg-[#0f172a] border border-violet-500/10 rounded-3xl shadow-xl hover:border-violet-500/30 transition-all group font-mono">
        <div className="p-4 bg-violet-500/10 rounded-2xl text-violet-400 shrink-0 shadow-lg group-hover:scale-110 transition-transform">
            <Icon size={28} />
        </div>
        <div>
            <div className="flex items-center gap-3 mb-2">
                <span className="text-violet-500/50 font-black text-sm md:text-base">&gt;_</span>
                <h4 className="text-lg md:text-xl font-black text-slate-200 uppercase tracking-tighter">{title}</h4>
            </div>
            <p className="text-sm md:text-base text-slate-500 leading-relaxed font-bold uppercase tracking-wide">{desc}</p>
        </div>
    </div>
);
