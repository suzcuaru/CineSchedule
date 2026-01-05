
import React, { useEffect, useState, useMemo } from 'react';
import { Film, Search, Clock, CalendarDays, Terminal } from 'lucide-react';
import { LocalDB } from '../../backend/database';
import { GridSection, ViewContainer, InputGroup } from './SystemUI';
import { Movie } from '../../types';

// Helper function to extract genre name
const getGenreName = (genre: any): string => {
    if (typeof genre === 'string') return genre;
    if (genre && typeof genre === 'object' && genre.name) return String(genre.name);
    return 'Unknown';
};

// Helper function to format release date
const formatDateStart = (dateStr?: string) => {
    if (!dateStr) return 'СКОРО';
    try {
        return new Date(dateStr).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch (e) {
        return dateStr;
    }
};

// Moved MoviePosterCard outside to resolve TypeScript strictness with 'key' prop 
// and prevent component recreation on every render of ReleasesView.
// FIX: Using React.FC to explicitly handle standard props like 'key' in JSX.
const MoviePosterCard: React.FC<{ movie: Movie }> = ({ movie }) => {
    // Extract poster from either flat property or vertical_poster object
    const posterSrc = movie.vertical_poster?.image || movie.poster;
    const hasPoster = !! posterSrc;

    // Get duration from releases array or fallback to root duration
    const releaseDuration = movie.releases && movie.releases.length > 0 ? movie.releases[0].duration : null;
    const displayDuration = releaseDuration || movie.duration || 0;

    return (
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl overflow-hidden shadow-lg group hover:border-violet-500/50 hover:shadow-violet-500/20 transition-all duration-300 relative flex flex-col h-full">
            {/* Poster Area - Vertical Aspect Ratio 2:3 */}
            <div className="relative aspect-[2/3] w-full bg-slate-900 overflow-hidden">
                {hasPoster ? (
                    <img 
                        src={posterSrc} 
                        alt={movie.name} 
                        className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105 group-hover:brightness-[0.25]"
                        loading="lazy"
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-b from-slate-800 to-slate-900 text-slate-600 transition-all duration-500 group-hover:brightness-[0.25]">
                        <Film size={48} className="mb-2 opacity-20" />
                        <span className="text-[0.65rem] uppercase font-black tracking-widest text-center opacity-40">Нет постера</span>
                    </div>
                )}

                {/* Description Overlay (Visible on Hover) */}
                <div className="absolute inset-0 flex items-center justify-center p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-30 pointer-events-none group-hover:pointer-events-auto">
                    <div className="w-full max-h-full overflow-y-auto custom-scrollbar text-center">
                        <p className="text-sm font-medium text-slate-200 leading-relaxed drop-shadow-md">
                            {movie.description || "Описание отсутствует."}
                        </p>
                    </div>
                </div>

                {/* Age Limit Badge Overlay */}
                <div className="absolute top-2 right-2 z-10 group-hover:opacity-20 transition-opacity">
                    <div className={`
                        w-8 h-8 flex items-center justify-center rounded-lg backdrop-blur-md border border-white/20 font-black text-xs shadow-xl
                        ${(movie.age_limit || 0) >= 18 ? 'bg-red-600/80 text-white' : 
                          (movie.age_limit || 0) >= 16 ? 'bg-orange-500/80 text-white' : 
                          (movie.age_limit || 0) >= 12 ? 'bg-blue-500/80 text-white' : 'bg-green-500/80 text-white'}
                    `}>
                        {movie.age_limit}+
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="p-4 flex flex-col flex-1 bg-gradient-to-b from-[#0f172a] to-[#0b0f19]">
                <h3 className="text-sm font-black text-white uppercase tracking-tight leading-tight mb-3 line-clamp-2 group-hover:text-violet-400 transition-colors">
                    {movie.name}
                </h3>

                <div className="mt-auto space-y-2">
                    {/* Meta Row 1: Duration & Date */}
                    <div className="flex items-center justify-between text-[0.65rem] font-mono text-slate-500 border-t border-slate-800 pt-2">
                        <div className="flex items-center gap-1.5">
                            <Clock size={12} className="text-slate-600" />
                            <span>{displayDuration} мин</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <CalendarDays size={12} className="text-slate-600" />
                            <span>{formatDateStart(movie.date_start)}</span>
                        </div>
                    </div>

                    {/* Meta Row 2: Genres */}
                    <div className="flex flex-wrap gap-1 pt-1">
                        {movie.genres && movie.genres.length > 0 ? (
                            movie.genres.slice(0, 2).map((g: any, i: number) => (
                                <span key={i} className="px-1.5 py-0.5 rounded bg-slate-800 text-[0.55rem] font-bold text-slate-400 uppercase tracking-wider">
                                    {getGenreName(g)}
                                </span>
                            ))
                        ) : (
                            <span className="text-[0.55rem] text-slate-700 italic">Жанр не указан</span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export const ReleasesView: React.FC = () => {
    const [movies, setMovies] = useState<Movie[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadMovies = async () => {
            const data = await LocalDB.getAllMetadata();
            setMovies(data.movies || []);
            setIsLoading(false);
        };
        loadMovies();
    }, []);

    const filteredMovies = useMemo(() => {
        return movies.filter(m => 
            m.name.toLowerCase().includes(searchQuery.toLowerCase())
        ).sort((a, b) => Number(b.id) - Number(a.id));
    }, [movies, searchQuery]);

    return (
        <ViewContainer title="Релизы и Прокат" icon={Terminal}>
            <GridSection title="Фильтр контента" cols={1}>
                <div className="max-w-xl">
                    <InputGroup 
                        label="Поиск по названию" 
                        icon={Search} 
                        value={searchQuery} 
                        onChange={setSearchQuery} 
                        placeholder="Введите название фильма..." 
                    />
                </div>
            </GridSection>

            <div className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-1 h-6 bg-violet-500 rounded-full shadow-[0_0_15px_rgba(139,92,246,0.6)]"></div>
                    <h2 className="text-lg font-bold text-slate-400 uppercase tracking-widest">
                        {isLoading ? 'Загрузка базы данных...' : `Доступно релизов: ${filteredMovies.length}`}
                    </h2>
                </div>
                
                {isLoading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                        {Array.from({ length: 10 }).map((_, i) => (
                            <div key={i} className="aspect-[2/3] rounded-xl bg-slate-900/50 animate-pulse border border-slate-800" />
                        ))}
                    </div>
                ) : filteredMovies.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {filteredMovies.map(movie => (
                            <MoviePosterCard key={movie.id} movie={movie} />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 border border-dashed border-slate-800 rounded-3xl bg-slate-900/20">
                        <Film size={48} className="text-slate-700 mb-4" />
                        <p className="text-slate-500 font-mono text-sm uppercase tracking-widest">Ничего не найдено</p>
                    </div>
                )}
            </div>
        </ViewContainer>
    );
};
