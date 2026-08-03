import React, { useState, useEffect, useRef } from 'react';
import { fetchMovieDetailByTitle, getTrailerSearchUrl, fetchTrailerVideo } from '../services/movieService.js';

const FALLBACK_POSTER = '/No-Poster.png';

const MovieDetailModal = ({ movie, onClose }) => {
    const [detail, setDetail] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [trailerUrl, setTrailerUrl] = useState(null);
    const [trailerLoading, setTrailerLoading] = useState(false);
    const overlayRef = useRef(null);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };
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

    // Load trailer preview when trailer tab is selected
    useEffect(() => {
        if (activeTab === 'trailer' && !trailerUrl && movie) {
            setTrailerLoading(true);
            fetchTrailerVideo(movie.title)
                .then(url => {
                    setTrailerUrl(url);
                })
                .catch(() => setTrailerUrl(null))
                .finally(() => setTrailerLoading(false));
        }
    }, [activeTab, movie]);

    if (!movie) return null;

    const m = detail || movie;
    const poster = m.poster_url || FALLBACK_POSTER;
    const rating = m.rating || m.vote_average;
    const youtubeSearchUrl = getTrailerSearchUrl(m.title, m.year);

    const rtRating = m.ratings?.find(r => r.Source === 'Rotten Tomatoes');

    return (
        <div
            ref={overlayRef}
            onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 100,
                background: 'rgba(9, 9, 11, 0.88)',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 16,
            }}
        >
            <div
                className="modal-animate"
                style={{
                    position: 'relative',
                    width: '100%',
                    maxWidth: 840,
                    maxHeight: '90vh',
                    overflow: 'hidden',
                    background: '#18181b',
                    borderRadius: 12,
                    border: '1px solid #27272a',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                {/* Header Backdrop */}
                <div style={{ position: 'relative', height: 200, overflow: 'hidden', flexShrink: 0, background: '#09090b' }}>
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundImage: `url(${poster})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center 20%',
                        filter: 'blur(16px) brightness(0.3)',
                        transform: 'scale(1.1)',
                    }} />
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(180deg, rgba(24, 24, 27, 0.2) 0%, #18181b 100%)',
                    }} />

                    {/* Movie Information Row */}
                    <div style={{
                        position: 'relative',
                        zIndex: 2,
                        display: 'flex',
                        gap: 20,
                        padding: '20px 24px',
                        alignItems: 'flex-end',
                        height: '100%',
                    }}>
                        <img
                            src={poster}
                            alt={m.title}
                            referrerPolicy="no-referrer"
                            style={{
                                width: 100,
                                height: 148,
                                objectFit: 'cover',
                                borderRadius: 6,
                                flexShrink: 0,
                                boxShadow: '0 8px 20px rgba(0,0,0,0.5)',
                                border: '1px solid rgba(255,255,255,0.1)',
                            }}
                            onError={(e) => { e.target.src = FALLBACK_POSTER; }}
                        />
                        
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <h2 style={{ fontSize: 24, fontWeight: 700, color: '#f4f4f5', lineHeight: 1.2, marginBottom: 8 }}>
                                {m.title}
                            </h2>
                            
                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', fontSize: 13, color: '#a1a1aa' }}>
                                {rating && (
                                    <span style={{ fontWeight: 700, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 4 }}>
                                        ★ {Number(rating).toFixed(1)}
                                    </span>
                                )}
                                <span>•</span>
                                <span>{m.year}</span>
                                {m.runtime && (
                                    <>
                                        <span>•</span>
                                        <span>{m.runtime}</span>
                                    </>
                                )}
                                {rtRating && (
                                    <span style={{ fontSize: 12, color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>
                                        RT {rtRating.Value}
                                    </span>
                                )}
                            </div>

                            {m.genre && (
                                <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                                    {m.genre.split(',').map((g, i) => (
                                        <span key={i} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: '#27272a', color: '#d4d4d8', fontWeight: 500 }}>
                                            {g.trim()}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        style={{
                            position: 'absolute',
                            top: 16,
                            right: 16,
                            zIndex: 10,
                            width: 32,
                            height: 32,
                            borderRadius: 6,
                            background: 'rgba(9, 9, 11, 0.7)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            color: '#a1a1aa',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 16,
                            transition: 'all 0.15s ease',
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.background = '#27272a'; e.currentTarget.style.color = '#fff'; }}
                        onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(9, 9, 11, 0.7)'; e.currentTarget.style.color = '#a1a1aa'; }}
                    >
                        ✕
                    </button>
                </div>

                {/* Tab Controls */}
                <div style={{ display: 'flex', gap: 8, padding: '0 24px', borderBottom: '1px solid #27272a', background: '#18181b', flexShrink: 0 }}>
                    {['overview', 'trailer', 'details'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            style={{
                                padding: '12px 16px',
                                fontSize: 13,
                                fontWeight: 600,
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: activeTab === tab ? '#f4f4f5' : '#71717a',
                                borderBottom: activeTab === tab ? '2px solid #f4f4f5' : '2px solid transparent',
                                textTransform: 'capitalize',
                                transition: 'color 0.15s ease',
                            }}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Modal Tab Body */}
                <div style={{ overflowY: 'auto', flex: 1, padding: 24 }} className="hide-scrollbar">
                    {activeTab === 'overview' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            {loading && (
                                <p style={{ fontSize: 12, color: '#71717a' }}>Loading movie details...</p>
                            )}

                            {m.plot && (
                                <div>
                                    <h4 style={{ fontSize: 12, fontWeight: 700, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                                        Synopsis
                                    </h4>
                                    <p style={{ color: '#d4d4d8', fontSize: 14, lineHeight: 1.6 }}>
                                        {m.plot}
                                    </p>
                                </div>
                            )}

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginTop: 8 }}>
                                {m.director && m.director !== 'Unknown' && (
                                    <InfoBox title="Director" value={m.director} />
                                )}
                                {m.studio && m.studio !== 'Unknown' && (
                                    <InfoBox title="Studio / Distributor" value={m.studio} />
                                )}
                                {m.worldwide_gross && m.worldwide_gross !== 'N/A' && (
                                    <InfoBox title="Box Office" value={m.worldwide_gross} highlight />
                                )}
                                {m.source && (
                                    <InfoBox title="Scraped Data Source" value={m.source} />
                                )}
                            </div>

                            {m.cast_members && m.cast_members !== 'Unknown' && (
                                <div style={{ marginTop: 8 }}>
                                    <h4 style={{ fontSize: 12, fontWeight: 700, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                                        Cast
                                    </h4>
                                    <p style={{ color: '#a1a1aa', fontSize: 13, lineHeight: 1.5 }}>
                                        {m.cast_members}
                                    </p>
                                </div>
                            )}

                            <div style={{ marginTop: 12 }}>
                                <button
                                    onClick={() => setActiveTab('trailer')}
                                    style={{
                                        padding: '10px 20px',
                                        borderRadius: 6,
                                        background: '#f4f4f5',
                                        color: '#09090b',
                                        border: 'none',
                                        fontWeight: 700,
                                        fontSize: 13,
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 8,
                                    }}
                                >
                                    ► Watch Official Trailer
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'trailer' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div style={{
                                borderRadius: 8,
                                overflow: 'hidden',
                                border: '1px solid #27272a',
                                background: '#000',
                                position: 'relative',
                                minHeight: 320,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                {trailerLoading ? (
                                    <p style={{ fontSize: 13, color: '#a1a1aa' }}>Loading official trailer preview...</p>
                                ) : trailerUrl ? (
                                    <video
                                        src={trailerUrl}
                                        controls
                                        autoPlay
                                        style={{ width: '100%', maxHeight: 400, display: 'block' }}
                                    />
                                ) : (
                                    <div style={{ padding: 32, textAlign: 'center' }}>
                                        <p style={{ fontSize: 14, color: '#f4f4f5', fontWeight: 600, marginBottom: 8 }}>
                                            HD Trailer Available on YouTube
                                        </p>
                                        <p style={{ fontSize: 12, color: '#71717a', marginBottom: 16 }}>
                                            Click below to play the high-definition trailer directly on YouTube.
                                        </p>
                                        <a
                                            href={youtubeSearchUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{
                                                padding: '10px 20px',
                                                background: '#ef4444',
                                                color: '#ffffff',
                                                borderRadius: 6,
                                                fontSize: 13,
                                                fontWeight: 700,
                                                textDecoration: 'none',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: 8
                                            }}
                                        >
                                            ► Watch Official Trailer on YouTube
                                        </a>
                                    </div>
                                )}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                                <span style={{ fontSize: 13, color: '#a1a1aa' }}>
                                    Official Trailer for <strong>{m.title} ({m.year})</strong>
                                </span>

                                <a
                                    href={youtubeSearchUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        padding: '8px 16px',
                                        background: '#ef4444',
                                        color: '#ffffff',
                                        borderRadius: 6,
                                        fontSize: 12,
                                        fontWeight: 700,
                                        textDecoration: 'none',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 6
                                    }}
                                >
                                    ► Open YouTube Search
                                </a>
                            </div>
                        </div>
                    )}

                    {activeTab === 'details' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {m.imdb_id && <DetailRow label="IMDb ID" value={m.imdb_id} />}
                            {m.rated && <DetailRow label="Content Rating" value={m.rated} />}
                            {m.language && <DetailRow label="Language" value={m.language} />}
                            {m.country && <DetailRow label="Country" value={m.country} />}
                            {m.awards && m.awards !== 'None' && <DetailRow label="Awards" value={m.awards} />}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const InfoBox = ({ title, value, highlight }) => (
    <div style={{
        padding: '12px 14px',
        borderRadius: 6,
        background: '#09090b',
        border: '1px solid #27272a',
    }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
            {title}
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: highlight ? '#10b981' : '#f4f4f5', lineHeight: 1.3 }}>
            {value}
        </div>
    </div>
);

const DetailRow = ({ label, value }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #27272a', fontSize: 13 }}>
        <span style={{ color: '#71717a' }}>{label}</span>
        <span style={{ color: '#f4f4f5', fontWeight: 500 }}>{value}</span>
    </div>
);

export default MovieDetailModal;
