import React, { useState } from 'react';

const FALLBACK_POSTER = '/No-Poster.png';

const MovieCard = ({ movie, onClick, badgeText }) => {
    const [imageError, setImageError] = useState(false);
    const poster = !imageError && movie.poster_url ? movie.poster_url : null;
    const releaseYear = movie.year || movie.release_date || '2026';
    const rating = movie.rating || movie.vote_average;
    const primaryGenre = (movie.genre || '').split(',')[0].trim();

    return (
        <div
            className="card-transition"
            onClick={() => onClick(movie)}
            style={{
                cursor: 'pointer',
                borderRadius: 8,
                overflow: 'hidden',
                background: '#18181b',
                border: '1px solid #27272a',
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
            }}
        >
            {/* Poster Aspect Ratio Container */}
            <div style={{ position: 'relative', aspectRatio: '2/3', background: '#09090b', overflow: 'hidden' }}>
                {poster ? (
                    <img
                        src={poster}
                        alt={movie.title}
                        referrerPolicy="no-referrer"
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            display: 'block',
                        }}
                        onError={() => setImageError(true)}
                    />
                ) : (
                    <div style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        padding: 16,
                        background: 'linear-gradient(180deg, #18181b 0%, #09090b 100%)',
                    }}>
                        <span style={{ fontSize: 11, color: '#71717a', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {primaryGenre || 'Film'}
                        </span>
                        <div>
                            <p style={{ fontSize: 13, fontWeight: 700, color: '#f4f4f5', lineHeight: 1.3 }}>
                                {movie.title}
                            </p>
                            <p style={{ fontSize: 11, color: '#a1a1aa', marginTop: 4 }}>
                                {releaseYear}
                            </p>
                        </div>
                    </div>
                )}

                {/* Rating Badge */}
                {rating && (
                    <div style={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        background: 'rgba(9, 9, 11, 0.85)',
                        backdropFilter: 'blur(6px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: 4,
                        padding: '2px 6px',
                        fontSize: 11,
                        fontWeight: 700,
                        color: '#f59e0b',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                    }}>
                        ★ {Number(rating).toFixed(1)}
                    </div>
                )}

                {/* Optional Status Tag */}
                {badgeText && (
                    <div style={{
                        position: 'absolute',
                        top: 8,
                        left: 8,
                        background: 'rgba(9, 9, 11, 0.85)',
                        backdropFilter: 'blur(6px)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: 4,
                        padding: '2px 6px',
                        fontSize: 9,
                        fontWeight: 700,
                        color: '#e4e4e7',
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase',
                    }}>
                        {badgeText}
                    </div>
                )}
            </div>

            {/* Movie Info Footer */}
            <div style={{ padding: 12, flex: 1, display: 'flex', flexDirection: 'column', justify: 'space-between' }}>
                <h3 style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#f4f4f5',
                    lineHeight: 1.3,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    marginBottom: 6,
                }}>
                    {movie.title}
                </h3>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: '#71717a' }}>
                    <span>{releaseYear}</span>
                    {primaryGenre && (
                        <span style={{ fontSize: 10, color: '#a1a1aa', background: '#27272a', padding: '2px 6px', borderRadius: 4 }}>
                            {primaryGenre}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MovieCard;
