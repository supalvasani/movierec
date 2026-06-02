import React from 'react';

const FALLBACK_POSTER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='450' viewBox='0 0 300 450'%3E%3Crect width='300' height='450' fill='%230f0d23'/%3E%3Ctext x='50%25' y='45%25' dominant-baseline='middle' text-anchor='middle' fill='%23cecefb' font-size='18' font-family='sans-serif'%3ENo Poster%3C/text%3E%3Ctext x='50%25' y='58%25' dominant-baseline='middle' text-anchor='middle' fill='%23a8b5db' font-size='40'%3E%F0%9F%8E%AC%3C/text%3E%3C/svg%3E";

const MovieModal = ({ movie, onClose, theme }) => {
    if (!movie) return null;

    const isDark = theme !== 'light';

    const colors = isDark ? {
        panel:   '#0f0d23',
        border:  'rgba(206,206,251,0.15)',
        title:   '#ffffff',
        meta:    '#9ca4ab',
        plotBg:  'rgba(206,206,251,0.05)',
        plotBorder: 'rgba(206,206,251,0.1)',
        plotText: '#a8b5db',
        label:   '#9ca4ab',
        value:   '#ffffff',
        closeBg: 'rgba(0,0,0,0.5)',
        closeHover: 'rgba(255,255,255,0.1)',
    } : {
        panel:   '#ffffff',
        border:  'rgba(0,0,0,0.08)',
        title:   '#1a202c',
        meta:    '#6b7280',
        plotBg:  '#f8fafc',
        plotBorder: 'rgba(0,0,0,0.08)',
        plotText: '#374151',
        label:   '#6b7280',
        value:   '#1a202c',
        closeBg: 'rgba(0,0,0,0.08)',
        closeHover: 'rgba(0,0,0,0.15)',
    };

    const resolvedPoster = movie.poster_url || movie.poster_path || FALLBACK_POSTER;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            style={{ animation: 'modal-in 0.2s ease-out' }}
            onClick={onClose}
        >
            <div
                className="relative rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col md:flex-row overflow-hidden"
                style={{ background: colors.panel, border: `1px solid ${colors.border}` }}
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 p-2 rounded-full transition"
                    style={{ background: colors.closeBg, color: colors.title }}
                >
                    ✕
                </button>

                <div className="w-full md:w-2/5 shrink-0">
                    <img
                        src={resolvedPoster}
                        alt={movie.title}
                        className="w-full h-full object-cover object-center max-h-[300px] md:max-h-full"
                        onError={(e) => { e.target.src = FALLBACK_POSTER; }}
                    />
                </div>

                <div className="p-6 flex flex-col gap-4 w-full">
                    <div>
                        <h2 className="text-2xl font-bold mb-1" style={{ color: colors.title }}>{movie.title}</h2>
                        <div className="flex items-center gap-2 text-sm flex-wrap" style={{ color: colors.meta }}>
                            <span className="flex items-center gap-1 font-bold" style={{ color: colors.title }}>
                                <img src="star.svg" alt="Star" className="w-4 h-4" />
                                {movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'}
                            </span>
                            <span>•</span>
                            <span>{movie.release_date}</span>
                            <span>•</span>
                            <span className="uppercase">{movie.original_language}</span>
                            <span>•</span>
                            <span>{movie.runtime}</span>
                        </div>
                    </div>

                    <div className="p-3 rounded-lg" style={{ background: colors.plotBg, border: `1px solid ${colors.plotBorder}` }}>
                        <p className="text-sm leading-relaxed italic" style={{ color: colors.plotText }}>
                            "{movie.plot}"
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm mt-2">
                        <div>
                            <p className="font-semibold mb-1" style={{ color: colors.label }}>Genre</p>
                            <p style={{ color: colors.value }}>{movie.genre}</p>
                        </div>
                        <div>
                            <p className="font-semibold mb-1" style={{ color: colors.label }}>Director</p>
                            <p style={{ color: colors.value }}>{movie.director}</p>
                        </div>
                        <div className="col-span-2">
                            <p className="font-semibold mb-1" style={{ color: colors.label }}>Actors</p>
                            <p style={{ color: colors.value }}>{movie.actors}</p>
                        </div>
                        <div>
                            <p className="font-semibold mb-1" style={{ color: colors.label }}>Box Office</p>
                            <p style={{ color: colors.value }}>{movie.box_office}</p>
                        </div>
                        <div>
                            <p className="font-semibold mb-1" style={{ color: colors.label }}>Awards</p>
                            <p style={{ color: colors.value }}>{movie.awards}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MovieModal;
