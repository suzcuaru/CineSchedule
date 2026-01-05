import React, { useMemo, useRef, WheelEvent, useEffect } from 'react';
import { MovieSession } from '../../types';
import { Ticket, Film, Calendar, Clock } from 'lucide-react';

interface MovieSummary {
    name: string;
    poster: string | null;
    totalTickets: number;
    sessionCount: number;
    formats: string[];
    ageLimit?: number;
    duration?: number;
    adDuration?: number;
}

interface TodaysMoviesCarouselProps {
    sessions: MovieSession[];
}

const formatAdDuration = (minutes?: number): string => {
    if (!minutes) return '';
    const totalSeconds = minutes * 60;
    const mins = Math.floor(totalSeconds / 60);
    const secs = Math.round(totalSeconds % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

export const TodaysMoviesCarousel: React.FC<TodaysMoviesCarouselProps> = ({ sessions }) => {
    const carouselRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const scrollPositionRef = useRef<number>(0);
    
    // Глобальный обработчик колёсика для блокировки прокрутки страницы
    const handleGlobalWheel = (e: WheelEvent) => {
        if (containerRef.current && containerRef.current.contains(e.target as Node)) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            
            // Перенаправляем на карусель
            if (carouselRef.current) {
                const scrollAmount = e.deltaY || e.deltaX;
                carouselRef.current.scrollBy({
                    left: scrollAmount,
                    behavior: 'smooth'
                });
            }
            return false;
        }
    };
    
    // Блокируем прокрутку страницы при наведении на карусель
    const handleMouseEnter = () => {
        scrollPositionRef.current = window.scrollY;
        document.body.classList.add('scroll-locked');
        document.documentElement.classList.add('scroll-locked');
        
        // Добавляем глобальный слушатель колёсика с capture
        document.addEventListener('wheel', handleGlobalWheel, { passive: false, capture: true });
    };
    
    const handleMouseLeave = () => {
        document.body.classList.remove('scroll-locked');
        document.documentElement.classList.remove('scroll-locked');
        
        // Удаляем глобальный слушатель колёсика
        document.removeEventListener('wheel', handleGlobalWheel, { capture: true } as any);
    };
    
    // Очистка при размонтировании компонента
    useEffect(() => {
        return () => {
            document.body.classList.remove('scroll-locked');
            document.documentElement.classList.remove('scroll-locked');
            document.removeEventListener('wheel', handleGlobalWheel, { capture: true } as any);
        };
    }, []);
    
    const movieSummaries = useMemo(() => {
        // Сначала группируем все сеансы по названию фильма
        const sessionsByMovie = new Map<string, MovieSession[]>();
        
        sessions.forEach(session => {
            const name = session.name;
            if (!sessionsByMovie.has(name)) {
                sessionsByMovie.set(name, []);
            }
            sessionsByMovie.get(name)!.push(session);
        });
        
        // Для каждого фильма берём первый по времени сеанс
        const moviesMap = new Map<string, MovieSummary>();
        
        sessionsByMovie.forEach((movieSessions, movieName) => {
            // Сортируем по времени и берём первый (создаём копию через spread чтобы не менять оригинальный массив)
            const sortedSessions = [...movieSessions].sort((a, b) => a.time.localeCompare(b.time));
            const firstSession = sortedSessions[0];
            
            // Считаем общее количество билетов и собираем форматы
            const totalTickets = movieSessions.reduce((sum, s) => sum + (s.Tickets || 0), 0);
            const formats = Array.from(new Set(movieSessions.map(s => s.Format).filter(Boolean)));
            
            // Рассчитываем время рекламы: берём все загруженные сцены и находим среднее самое большое время
            const adDurations = movieSessions
                .map(s => s.commercial_ads_duration)
                .filter((d): d is number => d != null && d > 0);
            
            let adDuration: number | undefined;
            if (adDurations.length > 0) {
                // Находим уникальные значения времени рекламы
                const uniqueDurations = Array.from(new Set(adDurations));
                // Берём среднее значение
                adDuration = uniqueDurations.reduce((sum, d) => sum + d, 0) / uniqueDurations.length;
            }
            
            moviesMap.set(movieName, {
                name: movieName,
                poster: firstSession.poster || null,
                totalTickets,
                sessionCount: movieSessions.length,
                formats,
                ageLimit: firstSession.age_limit,
                duration: firstSession.duration,
                adDuration
            });
        });
        
        return Array.from(moviesMap.values()).sort((a, b) => {
            // Сортируем по количеству билетов (по убыванию)
            return b.totalTickets - a.totalTickets;
        });
    }, [sessions]);

    if (movieSummaries.length === 0) {
        return null;
    }

    return (
        <div className="mb-8 md:mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-1.5 h-7 bg-amber-500 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.6)]"></div>
                <h2 className="text-xl font-black text-slate-400 uppercase tracking-[0.15em]">ФИЛЬМЫ ДНЯ</h2>
            </div>
            
            <div 
                ref={containerRef}
                className="relative group"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                {/* Горизонтальный скролл */}
                <div 
                    ref={carouselRef}
                    className="flex gap-4 md:gap-6 overflow-x-auto pb-4 px-1 custom-scrollbar snap-x snap-mandatory scroll-smooth"
                    style={{
                        overscrollBehavior: 'contain',
                        touchAction: 'pan-x'
                    }}
                    onWheel={(e: WheelEvent<HTMLDivElement>) => {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        const target = e.currentTarget;
                        const scrollAmount = e.deltaY || e.deltaX;
                        target.scrollBy({
                            left: scrollAmount,
                            behavior: 'smooth'
                        });
                    }}
                >
                    {movieSummaries.map((movie, index) => (
                        <div 
                            key={movie.name}
                            className="flex-shrink-0 w-[200px] md:w-[240px] snap-start"
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <div className="bg-[#0f172a]/80 backdrop-blur-md border border-amber-500/10 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-amber-500/10 hover:border-amber-500/30 transition-all duration-300 group/card h-full flex flex-col">
                                {/* Постер */}
                                <div className="relative w-full aspect-[2/3] overflow-hidden bg-slate-900">
                                    {movie.poster ? (
                                        <img 
                                            src={movie.poster} 
                                            alt={movie.name}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-110"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
                                            <Film size={48} className="text-slate-700" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-transparent to-transparent opacity-80" />
                                </div>
                                
                                {/* Информация о фильме */}
                                <div className="p-3 flex-1 flex flex-col">
                                    <h3 className="text-xs md:text-sm font-black text-white mb-1.5 leading-tight line-clamp-2 min-h-[32px]">
                                        {movie.name}
                                    </h3>
                                    
                                    {/* Информация о фильме */}
                                    <div className="flex flex-wrap items-center gap-1 mb-2">
                                        {movie.ageLimit && (
                                            <span className="text-[9px] font-black px-1.5 py-0.5 bg-red-500/20 border border-red-500/30 text-red-400 rounded uppercase tracking-wider">
                                                {movie.ageLimit}+
                                            </span>
                                        )}
                                        {movie.duration && (
                                            <span className="text-[9px] font-bold text-slate-500 flex items-center gap-0.5">
                                                <Clock size={8} />
                                                {movie.duration} мин
                                            </span>
                                        )}
                                        {movie.adDuration && (
                                            <span className="text-[9px] font-bold text-slate-600">
                                                {formatAdDuration(movie.adDuration)} реклама
                                            </span>
                                        )}
                                    </div>
                                    
                                    {/* Статистика */}
                                    <div className="flex flex-col gap-1.5 mt-auto">
                                        {/* Билеты */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1.5">
                                                <Ticket size={12} className="text-amber-400" />
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Билеты</span>
                                            </div>
                                            <div className="text-xl font-black text-amber-300 tracking-tight">
                                                {movie.totalTickets}
                                            </div>
                                        </div>
                                        
                                        {/* Дополнительная информация */}
                                        <div className="flex items-center justify-between mt-1 pt-1.5 border-t border-slate-800">
                                            <div className="flex items-center gap-1">
                                                <Calendar size={10} className="text-slate-600" />
                                                <span className="text-[10px] font-bold text-slate-500">{movie.sessionCount}</span>
                                            </div>
                                            <div className="flex gap-0.5">
                                                {movie.formats.map(format => (
                                                    <span 
                                                        key={format} 
                                                        className={`text-[9px] font-bold px-1 py-0.5 rounded border leading-none ${format === '3D' ? 'border-purple-500/40 text-purple-300 bg-purple-500/10' : 'border-slate-600 text-slate-500'}`}
                                                    >
                                                        {format}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                
                {/* Индикаторы прокрутки (всегда легкие, при наведении полноценные) */}
                <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-[#0b0f19] to-transparent pointer-events-none opacity-30 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#0b0f19] to-transparent pointer-events-none opacity-30 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
        </div>
    );
};
