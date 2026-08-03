import React, { useState } from 'react';

const FALLBACK_POSTER = "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=500&auto=format&fit=crop";

const MovieModal = ({ movie, onClose }) => {
    if (!movie) return null;

    const resolvedPoster = movie.poster_url || movie.poster_path || FALLBACK_POSTER;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in"
            onClick={onClose}
        >
            <div
                className="relative bg-[#0a0a0f] border border-[#1e1e2d] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/60 hover:bg-white/20 text-white flex items-center justify-center text-sm transition"
                >
                    ✕
                </button>

                {/* Poster Side */}
                <div className="w-full md:w-2/5 shrink-0 bg-black">
                    <img
                        src={resolvedPoster}
                        alt={movie.title}
                        referrerPolicy="no-referrer"
                        crossOrigin="anonymous"
                        className="w-full h-full object-cover max-h-[280px] md:max-h-full"
                        onError={(e) => { e.target.src = FALLBACK_POSTER; }}
                    />
                </div>

                {/* Content Side */}
                <div className="p-6 flex flex-col justify-between w-full space-y-4 overflow-y-auto">
                    <div>
                        <h2 className="text-xl font-bold text-white mb-2">{movie.title}</h2>
                        <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
                            {movie.vote_average && (
                                <span className="text-amber-400 font-bold flex items-center gap-1">
                                    ★ {Number(movie.vote_average).toFixed(1)}
                                </span>
                            )}
                            <span>•</span>
                            <span>{movie.release_date || '2024'}</span>
                            <span>•</span>
                            <span className="text-indigo-400">{movie.genre || 'Action/Drama'}</span>
                        </div>
                    </div>

                    <div className="bg-[#050508] p-3.5 rounded-xl border border-[#161622] text-xs text-slate-300 leading-relaxed">
                        <p>{movie.plot || `Directed by ${movie.director || 'Unknown'}. Ingested into database via multi-source scraper pipeline.`}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs border-t border-[#181824] pt-3">
                        <div>
                            <span className="text-slate-500 block text-[10px] uppercase font-mono">Director</span>
                            <span className="text-slate-200 font-medium">{movie.director || 'Unknown'}</span>
                        </div>
                        <div>
                            <span className="text-slate-500 block text-[10px] uppercase font-mono">Box Office</span>
                            <span className="text-emerald-400 font-mono font-medium">{movie.box_office || 'N/A'}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MovieModal;
