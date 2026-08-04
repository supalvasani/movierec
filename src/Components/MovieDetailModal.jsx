import React, { useState, useEffect, useRef } from 'react';
import { fetchMovieDetailByTitle, getTrailerSearchUrl, fetchTrailerVideo } from '../services/movieService.js';
import { toast } from './Toast.jsx';

const FALLBACK_POSTER = '/No-Poster.png';

// SVG Rating Ring
const RatingRing = ({ value, max = 10, size = 64, label }) => {
    const radius = (size - 8) / 2;
    const circ = 2 * Math.PI * radius;
    const pct = Math.min(value / max, 1);
    const dash = pct * circ;
    const color = value >= 8 ? '#10b981' : value >= 6 ? '#f59e0b' : '#ef4444';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
                <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#27272a" strokeWidth={4} />
                <circle
                    cx={size / 2} cy={size / 2} r={radius} fill="none"
                    stroke={color} strokeWidth={4}
                    strokeDasharray={`${dash} ${circ}`}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(0.16,1,0.3,1)' }}
                />
                <text
                    x="50%" y="50%"
                    dominantBaseline="middle" textAnchor="middle"
                    style={{ transform: 'rotate(90deg)', transformOrigin: 'center', fontSize: 13, fontWeight: 800, fill: color }}
                >
                    {value.toFixed(1)}
                </text>
            </svg>
            <span style={{ fontSize: 10, color: '#71717a', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                {label}
            </span>
        </div>
    );
};

// Compute similar movies from local dataset
const getSimilarMovies = (movie, allMovies, limit = 4) => {
    if (!allMovies || allMovies.length === 0) return [];
    const genres = new Set((movie.genre || '').split(',').map((g) => g.trim().toLowerCase()));

    return allMovies
        .filter((m) => m.title !== movie.title && m.poster_url && m.poster_url !== 'N/A')
        .map((m) => {
            const mGenres = (m.genre || '').split(',').map((g) => g.trim().toLowerCase());
            const overlap = mGenres.filter((g) => genres.has(g)).length;
            const ratingBonus = (m.rating || 0) / 10;
            return { ...m, _sim: overlap + ratingBonus };
        })
        .filter((m) => m._sim > 0)
        .sort((a, b) => b._sim - a._sim)
        .slice(0, limit);
};

const MovieDetailModal = ({ movie, onClose, allMovies, onSelectMovie, onToggleWatchlist, onToggleWatched, isWatchlisted, isWatched }) => {
    const [detail, setDetail] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [trailerUrl, setTrailerUrl] = useState(null);
    const [trailerLoading, setTrailerLoading] = useState(false);
    const overlayRef = useRef(null);

    useEffect(() => {
        const handleKeyDown = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    useEffect(() => {
        if (!movie) return;
        setLoading(true);
        setDetail(null);
        setTrailerUrl(null);
        setActiveTab('overview');

        const loadExtraDetail = async () => {
            try {
                if (movie.plot && movie.imdb_id) {
                    setDetail(movie);
                    setLoading(false);
                } else {
                    const extra = await fetchMovieDetailByTitle(movie.title, movie.year);
                    setDetail(extra ? { ...movie, ...extra } : movie);
                }
            } catch {
                setDetail(movie);
            } finally {
                setLoading(false);
            }
        };
        loadExtraDetail();
    }, [movie?.title]);

    useEffect(() => {
        if (activeTab === 'trailer' && !trailerUrl && movie) {
            setTrailerLoading(true);
            fetchTrailerVideo(movie.title)
                .then((url) => setTrailerUrl(url))
                .catch(() => setTrailerUrl(null))
                .finally(() => setTrailerLoading(false));
        }
    }, [activeTab, movie]);

    if (!movie) return null;

    const m = detail || movie;
    const poster = m.poster_url || FALLBACK_POSTER;
    const rating = m.rating || m.vote_average;
    const youtubeSearchUrl = getTrailerSearchUrl(m.title, m.year);

    const rtRating = m.ratings?.find((r) => r.Source === 'Rotten Tomatoes');
    const mcRating = m.ratings?.find((r) => r.Source === 'Metacritic');

    const similarMovies = getSimilarMovies(m, allMovies);

    const handleShare = () => {
        const url = `${window.location.origin}${window.location.pathname}?movie=${encodeURIComponent(m.title)}`;
        navigator.clipboard.writeText(url).then(() => {
            toast.success('Link copied to clipboard');
        }).catch(() => {
            toast.info('Copy this URL: ' + url);
        });
    };

    const watchlisted = isWatchlisted?.(m) ?? false;
    const watched = isWatched?.(m) ?? false;

    const tabs = ['overview', 'trailer', 'similar', 'details'];

    return (
        <div
            ref={overlayRef}
            onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
            style={{
                position: 'fixed', inset: 0, zIndex: 100,
                background: 'rgba(9,9,11,0.88)', backdropFilter: 'blur(8px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: 16,
            }}
        >
            <div
                className="modal-animate"
                style={{
                    position: 'relative', width: '100%', maxWidth: 880,
                    maxHeight: '92vh', overflow: 'hidden',
                    background: '#18181b', borderRadius: 12,
                    border: '1px solid #27272a',
                    boxShadow: '0 32px 64px -12px rgba(0,0,0,0.8)',
                    display: 'flex', flexDirection: 'column',
                }}
            >
                {/* Header backdrop */}
                <div style={{ position: 'relative', height: 210, overflow: 'hidden', flexShrink: 0, background: '#09090b' }}>
                    <div style={{
                        position: 'absolute', inset: 0,
                        backgroundImage: `url(${poster})`,
                        backgroundSize: 'cover', backgroundPosition: 'center 20%',
                        filter: 'blur(18px) brightness(0.28)', transform: 'scale(1.1)',
                    }} />
                    <div style={{
                        position: 'absolute', inset: 0,
                        background: 'linear-gradient(180deg, rgba(24,24,27,0.1) 0%, #18181b 100%)',
                    }} />

                    {/* Content row */}
                    <div style={{
                        position: 'relative', zIndex: 2,
                        display: 'flex', gap: 20, padding: '20px 24px',
                        alignItems: 'flex-end', height: '100%',
                    }}>
                        <img
                            src={poster} alt={m.title}
                            referrerPolicy="no-referrer"
                            style={{
                                width: 106, height: 158, objectFit: 'cover',
                                borderRadius: 7, flexShrink: 0,
                                boxShadow: '0 10px 24px rgba(0,0,0,0.6)',
                                border: '1px solid rgba(255,255,255,0.1)',
                            }}
                            onError={(e) => { e.target.src = FALLBACK_POSTER; }}
                        />

                        <div style={{ flex: 1, minWidth: 0 }}>
                            <h2 style={{ fontSize: 24, fontWeight: 800, color: '#f4f4f5', lineHeight: 1.2, marginBottom: 8, letterSpacing: '-0.01em' }}>
                                {m.title}
                            </h2>

                            {/* Rating chips */}
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 10 }}>
                                {rating && (
                                    <span style={ratingChip('#f59e0b')}>
                                        IMDb {Number(rating).toFixed(1)}
                                    </span>
                                )}
                                {rtRating && (
                                    <span style={ratingChip('#ef4444')}>
                                        RT {rtRating.Value}
                                    </span>
                                )}
                                {mcRating && (
                                    <span style={ratingChip('#f97316')}>
                                        MC {mcRating.Value}
                                    </span>
                                )}
                                <span style={{ fontSize: 12, color: '#71717a' }}>{m.year}</span>
                                {m.runtime && <><span style={{ fontSize: 12, color: '#52525b' }}>·</span><span style={{ fontSize: 12, color: '#71717a' }}>{m.runtime}</span></>}
                                {m.rated && (
                                    <span style={{
                                        fontSize: 10, fontWeight: 700, color: '#71717a',
                                        border: '1px solid #3f3f46', padding: '1px 5px', borderRadius: 3,
                                    }}>
                                        {m.rated}
                                    </span>
                                )}
                            </div>

                            {/* Genre chips */}
                            {m.genre && (
                                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                                    {m.genre.split(',').map((g, i) => (
                                        <span key={i} style={{
                                            fontSize: 11, padding: '2px 8px', borderRadius: 4,
                                            background: '#27272a', color: '#d4d4d8', fontWeight: 500,
                                        }}>
                                            {g.trim()}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Action buttons */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0, alignSelf: 'flex-end' }}>
                            <button
                                onClick={() => { onToggleWatchlist?.(m); toast.success(watchlisted ? 'Removed from Watchlist' : 'Added to Watchlist'); }}
                                style={actionBtnStyle(watchlisted, '#6366f1')}
                            >
                                {watchlisted ? 'Saved' : 'Save'}
                            </button>
                            <button
                                onClick={() => { onToggleWatched?.(m); toast.success(watched ? 'Removed from History' : 'Marked as Watched'); }}
                                style={actionBtnStyle(watched, '#10b981')}
                            >
                                {watched ? 'Watched' : 'Mark Watched'}
                            </button>
                            <button
                                onClick={handleShare}
                                style={{ ...actionBtnStyle(false, '#71717a'), borderColor: '#3f3f46' }}
                            >
                                Share
                            </button>
                        </div>
                    </div>

                    {/* Close */}
                    <button
                        onClick={onClose}
                        style={{
                            position: 'absolute', top: 14, right: 14, zIndex: 10,
                            width: 32, height: 32, borderRadius: 6,
                            background: 'rgba(9,9,11,0.7)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: '#a1a1aa', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 16, transition: 'all 0.15s ease',
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.background = '#27272a'; e.currentTarget.style.color = '#fff'; }}
                        onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(9,9,11,0.7)'; e.currentTarget.style.color = '#a1a1aa'; }}
                    >
                        ✕
                    </button>
                </div>

                {/* Tab bar */}
                <div style={{ display: 'flex', gap: 4, padding: '0 24px', borderBottom: '1px solid #27272a', background: '#18181b', flexShrink: 0 }}>
                    {tabs.map((tab) => (
                        <button key={tab} onClick={() => setActiveTab(tab)} style={{
                            padding: '11px 14px', fontSize: 13, fontWeight: 600,
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: activeTab === tab ? '#f4f4f5' : '#71717a',
                            borderBottom: activeTab === tab ? '2px solid #6366f1' : '2px solid transparent',
                            textTransform: 'capitalize', transition: 'color 0.15s ease',
                        }}>
                            {tab === 'similar' ? 'Similar Movies' : tab}
                        </button>
                    ))}
                </div>

                {/* Body */}
                <div style={{ overflowY: 'auto', flex: 1, padding: 24 }} className="hide-scrollbar">

                    {/* Overview */}
                    {activeTab === 'overview' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            {loading && <p style={{ fontSize: 12, color: '#71717a' }}>Loading movie details...</p>}

                            {/* Ratings ring row */}
                            {(rating || rtRating || mcRating) && (
                                <div style={{ display: 'flex', gap: 24, padding: '16px 0', borderBottom: '1px solid #27272a' }}>
                                    {rating && <RatingRing value={Number(rating)} label="IMDb" />}
                                    {rtRating && (
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                            <div style={{ fontSize: 18, fontWeight: 800, color: '#ef4444' }}>{rtRating.Value}</div>
                                            <span style={{ fontSize: 10, color: '#71717a', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Rotten Tomatoes</span>
                                        </div>
                                    )}
                                    {mcRating && (
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                            <div style={{ fontSize: 18, fontWeight: 800, color: '#f97316' }}>{mcRating.Value}</div>
                                            <span style={{ fontSize: 10, color: '#71717a', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Metacritic</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {m.plot && (
                                <div>
                                    <h4 style={sectionLabel}>Synopsis</h4>
                                    <p style={{ color: '#d4d4d8', fontSize: 14, lineHeight: 1.7 }}>{m.plot}</p>
                                </div>
                            )}

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
                                {m.director && m.director !== 'Unknown' && <InfoBox title="Director" value={m.director} />}
                                {m.studio && m.studio !== 'Unknown' && <InfoBox title="Studio" value={m.studio} />}
                                {(m.worldwide_gross || m.box_office) && (m.worldwide_gross || m.box_office) !== 'N/A' && (
                                    <InfoBox title="Box Office" value={m.worldwide_gross || m.box_office} highlight />
                                )}
                                {m.source && <InfoBox title="Data Source" value={m.source} />}
                            </div>

                            {m.cast_members && m.cast_members !== 'Unknown' && (
                                <div>
                                    <h4 style={sectionLabel}>Cast</h4>
                                    <p style={{ color: '#a1a1aa', fontSize: 13, lineHeight: 1.5 }}>{m.cast_members}</p>
                                </div>
                            )}

                            {m.awards && m.awards !== 'None' && (
                                <div style={{
                                    background: 'rgba(245,158,11,0.06)',
                                    border: '1px solid rgba(245,158,11,0.2)',
                                    borderRadius: 6, padding: '10px 14px',
                                }}>
                                    <h4 style={{ ...sectionLabel, marginBottom: 4 }}>Awards</h4>
                                    <p style={{ fontSize: 13, color: '#d4d4d8' }}>{m.awards}</p>
                                </div>
                            )}

                            <button
                                onClick={() => setActiveTab('trailer')}
                                style={{
                                    padding: '10px 20px', borderRadius: 6,
                                    background: '#f4f4f5', color: '#09090b',
                                    border: 'none', fontWeight: 700, fontSize: 13,
                                    cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8,
                                    alignSelf: 'flex-start',
                                }}
                            >
                                ► Watch Trailer
                            </button>
                        </div>
                    )}

                    {/* Trailer */}
                    {activeTab === 'trailer' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div style={{
                                borderRadius: 8, overflow: 'hidden',
                                border: '1px solid #27272a', background: '#000',
                                position: 'relative', minHeight: 320,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                {trailerLoading ? (
                                    <p style={{ fontSize: 13, color: '#a1a1aa' }}>Loading trailer preview...</p>
                                ) : trailerUrl ? (
                                    <video
                                        src={trailerUrl} controls autoPlay
                                        style={{ width: '100%', maxHeight: 420, display: 'block' }}
                                    />
                                ) : (
                                    <div style={{ padding: 32, textAlign: 'center' }}>
                                        <p style={{ fontSize: 14, color: '#f4f4f5', fontWeight: 600, marginBottom: 8 }}>
                                            HD Trailer on YouTube
                                        </p>
                                        <p style={{ fontSize: 12, color: '#71717a', marginBottom: 16 }}>
                                            Click below to open the official trailer on YouTube.
                                        </p>
                                        <a
                                            href={youtubeSearchUrl} target="_blank" rel="noopener noreferrer"
                                            style={{
                                                padding: '10px 20px', background: '#ef4444', color: '#fff',
                                                borderRadius: 6, fontSize: 13, fontWeight: 700, textDecoration: 'none',
                                                display: 'inline-flex', alignItems: 'center', gap: 8,
                                            }}
                                        >
                                            ► Open YouTube
                                        </a>
                                    </div>
                                )}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                                <span style={{ fontSize: 13, color: '#a1a1aa' }}>
                                    Official Trailer — <strong style={{ color: '#f4f4f5' }}>{m.title} ({m.year})</strong>
                                </span>
                                <a
                                    href={youtubeSearchUrl} target="_blank" rel="noopener noreferrer"
                                    style={{
                                        padding: '8px 16px', background: '#ef4444', color: '#fff',
                                        borderRadius: 6, fontSize: 12, fontWeight: 700,
                                        textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6,
                                    }}
                                >
                                    ► YouTube Search
                                </a>
                            </div>
                        </div>
                    )}

                    {/* Similar Movies */}
                    {activeTab === 'similar' && (
                        <div>
                            {similarMovies.length === 0 ? (
                                <p style={{ fontSize: 14, color: '#71717a', padding: '40px 0', textAlign: 'center' }}>
                                    No similar movies found in the current dataset.
                                </p>
                            ) : (
                                <>
                                    <p style={{ fontSize: 13, color: '#71717a', marginBottom: 20 }}>
                                        Ranked by genre overlap and IMDb rating similarity.
                                    </p>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16 }}>
                                        {similarMovies.map((sim, idx) => (
                                            <div
                                                key={idx}
                                                onClick={() => { onSelectMovie?.(sim); }}
                                                style={{
                                                    cursor: 'pointer',
                                                    borderRadius: 8, overflow: 'hidden',
                                                    background: '#09090b',
                                                    border: '1px solid #27272a',
                                                    transition: 'border-color 0.2s ease',
                                                }}
                                                onMouseOver={(e) => e.currentTarget.style.borderColor = '#3f3f46'}
                                                onMouseOut={(e) => e.currentTarget.style.borderColor = '#27272a'}
                                            >
                                                <div style={{ position: 'relative', aspectRatio: '2/3' }}>
                                                    <img
                                                        src={sim.poster_url} alt={sim.title}
                                                        referrerPolicy="no-referrer"
                                                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                                    />
                                                    {sim.rating && (
                                                        <span style={{
                                                            position: 'absolute', top: 6, right: 6,
                                                            background: 'rgba(9,9,11,0.85)', borderRadius: 4,
                                                            padding: '2px 5px', fontSize: 10, fontWeight: 700, color: '#f59e0b',
                                                        }}>
                                                            ★ {Number(sim.rating).toFixed(1)}
                                                        </span>
                                                    )}
                                                </div>
                                                <div style={{ padding: '8px 10px' }}>
                                                    <p style={{ fontSize: 12, fontWeight: 600, color: '#f4f4f5', marginBottom: 2, lineHeight: 1.3 }}>
                                                        {sim.title}
                                                    </p>
                                                    <p style={{ fontSize: 11, color: '#71717a' }}>{sim.year}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* Details */}
                    {activeTab === 'details' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                            {m.imdb_id && <DetailRow label="IMDb ID" value={<a href={`https://www.imdb.com/title/${m.imdb_id}`} target="_blank" rel="noopener noreferrer" style={{ color: '#f59e0b', textDecoration: 'none' }}>{m.imdb_id}</a>} />}
                            {m.rated && <DetailRow label="Content Rating" value={m.rated} />}
                            {m.language && <DetailRow label="Language" value={m.language} />}
                            {m.country && <DetailRow label="Country" value={m.country} />}
                            {m.awards && m.awards !== 'None' && <DetailRow label="Awards" value={m.awards} />}
                            {m.votes && <DetailRow label="IMDb Votes" value={m.votes} />}
                            {m.quality_score && <DetailRow label="Pipeline Quality Score" value={`${m.quality_score}%`} />}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const ratingChip = (color) => ({
    fontSize: 11, fontWeight: 700,
    color, background: `${color}18`,
    border: `1px solid ${color}35`,
    padding: '2px 7px', borderRadius: 4,
});

const actionBtnStyle = (active, color) => ({
    padding: '7px 14px', borderRadius: 6,
    fontSize: 11, fontWeight: 700,
    letterSpacing: '0.03em', textTransform: 'uppercase',
    background: active ? `${color}22` : 'rgba(24,24,27,0.85)',
    color: active ? color : '#a1a1aa',
    border: `1px solid ${active ? `${color}45` : '#3f3f46'}`,
    cursor: 'pointer', backdropFilter: 'blur(6px)',
    transition: 'all 0.15s ease', whiteSpace: 'nowrap',
});

const sectionLabel = {
    fontSize: 11, fontWeight: 700, color: '#52525b',
    textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10,
};

const InfoBox = ({ title, value, highlight }) => (
    <div style={{ padding: '11px 13px', borderRadius: 6, background: '#09090b', border: '1px solid #27272a' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{title}</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: highlight ? '#10b981' : '#f4f4f5', lineHeight: 1.3 }}>{value}</div>
    </div>
);

const DetailRow = ({ label, value }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 0', borderBottom: '1px solid #27272a', fontSize: 13, gap: 16 }}>
        <span style={{ color: '#71717a', flexShrink: 0 }}>{label}</span>
        <span style={{ color: '#f4f4f5', fontWeight: 500, textAlign: 'right' }}>{value}</span>
    </div>
);

export default MovieDetailModal;
