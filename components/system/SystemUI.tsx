
import React from 'react';
import { ChevronRight } from 'lucide-react';

export const ViewContainer: React.FC<{ title: string, icon: any, children?: React.ReactNode }> = ({ title, icon: Icon, children }) => (
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

export const GridSection: React.FC<{ title: string, children?: React.ReactNode, cols?: number }> = ({ title, children, cols=1 }) => (
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

export const Card: React.FC<{ children?: React.ReactNode, className?: string }> = ({ children, className = "" }) => (
    <div className={`bg-[#1e293b] border border-slate-700/50 rounded-2xl p-6 shadow-xl ${className}`}>
        {children}
    </div>
);

export const ToggleCard: React.FC<{ label: string, desc: string, icon: any, enabled: boolean, onToggle: () => void }> = ({ label, desc, icon: Icon, enabled, onToggle }) => (
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

export const InputGroup: React.FC<any> = ({ label, icon: Icon, value, onChange, type="text", placeholder, endAdornment }) => (
    <div className="flex flex-col gap-2">
        <label className="text-sm text-slate-400 font-bold uppercase tracking-wide ml-1">{label}</label>
        <div className="relative group w-full">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors pointer-events-none">
                <Icon size={20} />
            </div>
            <input 
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className={`w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-12 text-base text-slate-200 placeholder:text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all ${endAdornment ? 'pr-12' : 'pr-4'}`}
            />
            {endAdornment && (
                 <div className="absolute right-0 top-0 bottom-0 flex items-center pr-3">
                    {endAdornment}
                 </div>
            )}
        </div>
    </div>
);

export const GestureItem: React.FC<{ icon: any, title: string, desc: string }> = ({ icon: Icon, title, desc }) => (
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

export const SegmentedControl: React.FC<{ options: {label: string, value: string}[], value: string, onChange: (v: string) => void }> = ({ options, value, onChange }) => (
    <div className="flex items-center bg-slate-950/70 border border-slate-800 rounded-lg p-1 w-full md:w-auto">
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`
            flex-1 px-3 py-1.5 md:px-4 md:py-2 text-sm font-bold rounded-md transition-all duration-200
            ${value === opt.value ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:bg-slate-700/50'}
          `}
        >
          {opt.label}
        </button>
      ))}
    </div>
);