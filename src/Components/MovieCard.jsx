import React, { useState } from 'react';

const FALLBACK_POSTER = '/No-Poster.png';

// Genre → accent color map (no emojis)
const GENRE_COLORS = {
    Action:      '#ef4444',
    Adventure:   '#f97316',
    Animation:   '#a855f7',
    Comedy:      '#eab308',
    Crime:       '#6b7280',
    Documentary: '#06b6d4',
    Drama:       '#6366f1',
    Family:      '#10b981',
    Fantasy:     '#8b5cf6',
    History:     '#a16207',
    Horror:      '#dc2626',
    Music:       '#ec4899',
    Mystery:     '#6366f1',
    Romance:     '#f43f5e',
    'Sci-Fi':    '#0ea5e9',
    Thriller:    '#e11d48',
    War:         '#78716c',
    Western:     '#d97706',
};

const getGenreColor = (genre) => {
    if (!genre) return '#71717a';
    const first = genre.split(',')[0].trim();
    return GENRE_COLORS[first] || '#71717a';
};

const MovieCard = ({ movie, onClick, onWatchlist, onWatched, isWatchlisted, isWatched, badgeText }) => {
    const [imageError, setImageError] = useState(false);
    const [hovered, setHovered] = useState(false);

    const poster = !imageError && movie.poster_url ? movie.poster_url : null;
    const releaseYear = movie.year || movie.release_date || '—';
    const rating = movie.rating || movie.vote_average;
    const primaryGenre = (movie.genre || '').split(',')[0].trim();
    const genreColor = getGenreColor(movie.genre);

    const handleWatchlist = (e) => {
        e.stopPropagation();
        onWatchlist?.(movie);
    };

    const handleWatched = (e) => {
        e.stopPropagation();
        onWatched?.(movie);
    };

    return (
        <div
            className="card-transition"
            onClick={() => onClick(movie)}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                cursor: 'pointer',
                borderRadius: 8,
                overflow: 'hidden',
                background: '#18181b',
                border: `1px solid ${hovered ? '#3f3f46' : '#27272a'}`,
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                transition: 'border-color 0.2s ease',
                position: 'relative',
            }}
        >
            {/* Poster */}
            <div style={{ position: 'relative', aspectRatio: '2/3', background: '#09090b', overflow: 'hidden' }}>
                {poster ? (
                    <img
                        src={poster}
                        alt={movie.title}
                        referrerPolicy="no-referrer"
                        style={{
                            width: '100%', height: '100%', objectFit: 'cover', display: 'block',
                            transition: 'transform 0.4s cubic-bezier(0.16,1,0.3,1)',
                            transform: hovered ? 'scale(1.05)' : 'scale(1)',
                        }}
                        onError={() => setImageError(true)}
                    />
                ) : (
                    <div style={{
                        width: '100%', height: '100%',
                        display: 'flex', flexDirection: 'column',
                        justifyContent: 'space-between', padding: 16,
                        background: 'linear-gradient(180deg, #18181b 0%, #09090b 100%)',
                    }}>
                        <span style={{ fontSize: 11, color: '#71717a', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {primaryGenre || 'Film'}
                        </span>
                        <div>
                            <p style={{ fontSize: 13, fontWeight: 700, color: '#f4f4f5', lineHeight: 1.3 }}>{movie.title}</p>
                            <p style={{ fontSize: 11, color: '#a1a1aa', marginTop: 4 }}>{releaseYear}</p>
                        </div>
                    </div>
                )}

                {/* Hover overlay with actions */}
                <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(180deg, rgba(9,9,11,0.0) 30%, rgba(9,9,11,0.92) 100%)',
                    opacity: hovered ? 1 : 0,
                    transition: 'opacity 0.25s ease',
                    display: 'flex', flexDirection: 'column',
                    justifyContent: 'flex-end', padding: 10, gap: 6,
                }}>
                    {(onWatchlist || onWatched) && (
                        <div style={{ display: 'flex', gap: 6 }}>
                            {onWatchlist && (
                                <ActionButton
                                    onClick={handleWatchlist}
                                    active={isWatchlisted}
                                    activeColor="#6366f1"
                                    label={isWatchlisted ? 'Saved' : 'Watchlist'}
                                />
                            )}
                            {onWatched && (
                                <ActionButton
                                    onClick={handleWatched}
                                    active={isWatched}
                                    activeColor="#10b981"
                                    label={isWatched ? 'Watched' : 'Mark Watched'}
                                />
                            )}
                        </div>
                    )}
                </div>

                {/* Rating badge */}
                {rating && (
                    <div style={{
                        position: 'absolute', top: 8, right: 8,
                        background: 'rgba(9,9,11,0.85)',
                        backdropFilter: 'blur(6px)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 4,
                        padding: '2px 6px', fontSize: 11, fontWeight: 700, color: '#f59e0b',
                        display: 'flex', alignItems: 'center', gap: 2,
                    }}>
                        ★ {Number(rating).toFixed(1)}
                    </div>
                )}

                {/* Watched stamp */}
                {isWatched && (
                    <div style={{
                        position: 'absolute', inset: 0,
                        background: 'rgba(9,9,11,0.55)',
                        display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-start',
                        padding: 8,
                        pointerEvents: 'none',
                    }}>
                        <span style={{
                            fontSize: 9, fontWeight: 800,
                            color: '#10b981',
                            background: 'rgba(9,9,11,0.85)',
                            border: '1px solid rgba(16,185,129,0.4)',
                            borderRadius: 3,
                            padding: '2px 6px',
                            letterSpacing: '0.06em',
                            textTransform: 'uppercase',
                        }}>
                            Watched
                        </span>
                    </div>
                )}

                {/* Status badge (In Theaters / Classic / etc.) */}
                {badgeText && !isWatched && (
                    <div style={{
                        position: 'absolute', top: 8, left: 8,
                        background: 'rgba(9,9,11,0.85)',
                        backdropFilter: 'blur(6px)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        borderRadius: 4,
                        padding: '2px 6px', fontSize: 9, fontWeight: 700,
                        color: '#e4e4e7', letterSpacing: '0.05em', textTransform: 'uppercase',
                    }}>
                        {badgeText}
                    </div>
                )}
            </div>

            {/* Info footer */}
            <div style={{ padding: 12, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <h3 style={{
                    fontSize: 13, fontWeight: 600, color: '#f4f4f5', lineHeight: 1.3,
                    display: '-webkit-box', WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: 6,
                }}>
                    {movie.title}
                </h3>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: '#71717a' }}>
                    <span>{releaseYear}</span>
                    {primaryGenre && (
                        <span style={{
                            fontSize: 10,
                            color: genreColor,
                            background: `${genreColor}18`,
                            border: `1px solid ${genreColor}30`,
                            padding: '2px 6px', borderRadius: 4,
                            fontWeight: 600,
                        }}>
                            {primaryGenre}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

const ActionButton = ({ onClick, active, activeColor, label }) => (
    <button
        onClick={onClick}
        style={{
            flex: 1,
            padding: '5px 8px',
            borderRadius: 5,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            border: `1px solid ${active ? `${activeColor}55` : 'rgba(255,255,255,0.15)'}`,
            background: active ? `${activeColor}22` : 'rgba(9,9,11,0.75)',
            color: active ? activeColor : '#d4d4d8',
            cursor: 'pointer',
            backdropFilter: 'blur(6px)',
            transition: 'all 0.15s ease',
            whiteSpace: 'nowrap',
        }}
    >
        {label}
    </button>
);

export default MovieCard;
