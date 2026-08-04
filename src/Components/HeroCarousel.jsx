import React, { useState, useEffect, useRef, useCallback } from 'react';

const INTERVAL = 6000;

const HeroCarousel = ({ movies, onSelectMovie, onWatchlist, isWatchlisted }) => {
    const [current, setCurrent] = useState(0);
    const [transitioning, setTransitioning] = useState(false);
    const timerRef = useRef(null);
    const items = movies.slice(0, 5);

    // Seeded daily "Tonight's Pick" — deterministic per calendar date
    const todaysSeed = new Date().toDateString();
    const todayIndex = movies.length > 0
        ? [...todaysSeed].reduce((acc, c) => acc + c.charCodeAt(0), 0) % movies.length
        : 0;
    const tonightsPick = movies[todayIndex];

    const goTo = useCallback((idx) => {
        if (transitioning || idx === current) return;
        setTransitioning(true);
        setTimeout(() => {
            setCurrent(idx);
            setTransitioning(false);
        }, 320);
    }, [transitioning, current]);

    const next = useCallback(() => {
        goTo((current + 1) % items.length);
    }, [current, items.length, goTo]);

    const prev = useCallback(() => {
        goTo((current - 1 + items.length) % items.length);
    }, [current, items.length, goTo]);

    const resetTimer = useCallback(() => {
        clearInterval(timerRef.current);
        timerRef.current = setInterval(next, INTERVAL);
    }, [next]);

    useEffect(() => {
        timerRef.current = setInterval(next, INTERVAL);
        return () => clearInterval(timerRef.current);
    }, [next]);

    if (items.length === 0) return null;

    const m = items[current];
    const isTonight = tonightsPick && m.title === tonightsPick.title;
    const watchlisted = isWatchlisted(m);

    return (
        <div style={{
            position: 'relative',
            width: '100%',
            height: 460,
            overflow: 'hidden',
            background: '#09090b',
            borderBottom: '1px solid #27272a',
        }}>
            {/* Blurred background */}
            <div
                key={`bg-${current}`}
                style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: `url(${m.poster_url})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center 20%',
                    filter: 'blur(32px) brightness(0.2)',
                    transform: 'scale(1.12)',
                    opacity: transitioning ? 0 : 1,
                    transition: 'opacity 0.35s ease',
                    animation: 'kenBurns 12s ease-in-out infinite alternate',
                }}
            />

            {/* Gradient overlays */}
            <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(90deg, rgba(9,9,11,0.97) 0%, rgba(9,9,11,0.6) 55%, rgba(9,9,11,0.15) 100%)',
                pointerEvents: 'none',
            }} />
            <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(180deg, transparent 60%, rgba(9,9,11,0.95) 100%)',
                pointerEvents: 'none',
            }} />

            {/* ── Main layout: poster | info | thumbnails ── */}
            <div style={{
                position: 'relative',
                zIndex: 2,
                height: '100%',
                maxWidth: 1280,
                margin: '0 auto',
                padding: '0 64px 0 40px',   /* left pad for prev arrow, right pad for next arrow */
                display: 'flex',
                alignItems: 'center',
                gap: 28,
                opacity: transitioning ? 0 : 1,
                transition: 'opacity 0.3s ease',
            }}>

                {/* Poster */}
                <img
                    src={m.poster_url}
                    alt={m.title}
                    referrerPolicy="no-referrer"
                    style={{
                        width: 140,
                        height: 208,
                        objectFit: 'cover',
                        borderRadius: 8,
                        flexShrink: 0,
                        boxShadow: '0 20px 48px rgba(0,0,0,0.75)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        alignSelf: 'center',
                    }}
                />

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0, alignSelf: 'center' }}>

                    {/* Badges */}
                    <div style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                        {(m.source === 'BookMyShow' || m.status === 'IN_THEATERS') && (
                            <span style={{
                                fontSize: 10, fontWeight: 700,
                                color: '#10b981', background: 'rgba(16,185,129,0.12)',
                                border: '1px solid rgba(16,185,129,0.3)',
                                padding: '3px 8px', borderRadius: 4,
                                letterSpacing: '0.06em', textTransform: 'uppercase',
                            }}>
                                In Theaters Now
                            </span>
                        )}
                        {isTonight && (
                            <span style={{
                                fontSize: 10, fontWeight: 700,
                                color: '#f59e0b', background: 'rgba(245,158,11,0.12)',
                                border: '1px solid rgba(245,158,11,0.3)',
                                padding: '3px 8px', borderRadius: 4,
                                letterSpacing: '0.06em', textTransform: 'uppercase',
                            }}>
                                Tonight's Pick
                            </span>
                        )}
                    </div>

                    <h1 style={{
                        fontSize: 34,
                        fontWeight: 800,
                        color: '#ffffff',
                        lineHeight: 1.1,
                        marginBottom: 10,
                        letterSpacing: '-0.02em',
                        maxWidth: 520,
                    }}>
                        {m.title}
                    </h1>

                    <div style={{
                        display: 'flex', gap: 10, alignItems: 'center',
                        fontSize: 13, color: '#a1a1aa', marginBottom: 14, flexWrap: 'wrap',
                    }}>
                        {m.rating && (
                            <span style={{ color: '#f59e0b', fontWeight: 700 }}>
                                {Number(m.rating).toFixed(1)} IMDb
                            </span>
                        )}
                        {m.rating && <span style={{ color: '#3f3f46' }}>·</span>}
                        {m.year && <span>{m.year}</span>}
                        {m.runtime && <><span style={{ color: '#3f3f46' }}>·</span><span>{m.runtime}</span></>}
                        {m.genre && <><span style={{ color: '#3f3f46' }}>·</span><span>{m.genre.split(',')[0].trim()}</span></>}
                    </div>

                    {m.plot && (
                        <p style={{
                            fontSize: 13, color: '#a1a1aa', lineHeight: 1.65,
                            maxWidth: 500, marginBottom: 22,
                            display: '-webkit-box', WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical', overflow: 'hidden',
                        }}>
                            {m.plot}
                        </p>
                    )}

                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <button
                            onClick={() => onSelectMovie(m)}
                            style={{
                                padding: '10px 22px', borderRadius: 6,
                                fontWeight: 700, fontSize: 13,
                                background: '#f4f4f5', color: '#09090b',
                                border: 'none', cursor: 'pointer',
                                transition: 'background 0.15s ease',
                                flexShrink: 0,
                            }}
                            onMouseOver={(e) => e.currentTarget.style.background = '#e4e4e7'}
                            onMouseOut={(e) => e.currentTarget.style.background = '#f4f4f5'}
                        >
                            View Details
                        </button>
                        <button
                            onClick={() => { onWatchlist(m); }}
                            style={{
                                padding: '10px 22px', borderRadius: 6,
                                fontWeight: 600, fontSize: 13,
                                background: watchlisted ? 'rgba(99,102,241,0.15)' : 'rgba(24,24,27,0.8)',
                                color: watchlisted ? '#818cf8' : '#a1a1aa',
                                border: `1px solid ${watchlisted ? 'rgba(99,102,241,0.4)' : '#27272a'}`,
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                flexShrink: 0,
                                backdropFilter: 'blur(8px)',
                            }}
                        >
                            {watchlisted ? 'Saved' : 'Add to Watchlist'}
                        </button>
                    </div>
                </div>

                {/* Thumbnail strip — right side, vertically centered */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                    flexShrink: 0,
                    alignSelf: 'center',
                    marginRight: 8,  /* keeps it away from the right arrow */
                }}>
                    {items.map((item, idx) => (
                        <button
                            key={idx}
                            onClick={() => { goTo(idx); resetTimer(); }}
                            style={{
                                width: 44, height: 66,
                                borderRadius: 4, overflow: 'hidden',
                                border: `2px solid ${idx === current ? '#6366f1' : 'rgba(255,255,255,0.06)'}`,
                                cursor: 'pointer', padding: 0,
                                opacity: idx === current ? 1 : 0.4,
                                transition: 'all 0.25s ease',
                                flexShrink: 0,
                                background: 'transparent',
                            }}
                            onMouseOver={(e) => { if (idx !== current) e.currentTarget.style.opacity = '0.75'; }}
                            onMouseOut={(e) => { if (idx !== current) e.currentTarget.style.opacity = '0.4'; }}
                        >
                            <img
                                src={item.poster_url}
                                alt={item.title}
                                referrerPolicy="no-referrer"
                                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                            />
                        </button>
                    ))}
                </div>
            </div>

            {/* Prev arrow */}
            <button
                onClick={() => { prev(); resetTimer(); }}
                style={arrowStyle('left')}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(39,39,42,0.9)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'rgba(9,9,11,0.6)'}
            >
                ‹
            </button>

            {/* Next arrow */}
            <button
                onClick={() => { next(); resetTimer(); }}
                style={arrowStyle('right')}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(39,39,42,0.9)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'rgba(9,9,11,0.6)'}
            >
                ›
            </button>

            {/* Dot indicators */}
            <div style={{
                position: 'absolute', bottom: 14, left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex', gap: 6, zIndex: 5,
            }}>
                {items.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => { goTo(idx); resetTimer(); }}
                        style={{
                            width: idx === current ? 22 : 6,
                            height: 6, borderRadius: 3,
                            background: idx === current ? '#6366f1' : 'rgba(255,255,255,0.2)',
                            border: 'none', cursor: 'pointer', padding: 0,
                            transition: 'all 0.3s ease',
                        }}
                    />
                ))}
            </div>
        </div>
    );
};

const arrowStyle = (side) => ({
    position: 'absolute',
    top: '50%',
    [side]: 12,
    transform: 'translateY(-50%)',
    zIndex: 5,
    width: 34, height: 34,
    borderRadius: '50%',
    background: 'rgba(9,9,11,0.6)',
    border: '1px solid rgba(255,255,255,0.08)',
    color: '#d4d4d8',
    fontSize: 22,
    lineHeight: '1',
    cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'background 0.15s ease',
    backdropFilter: 'blur(6px)',
    paddingBottom: 2,  /* optical vertical centre for the › ‹ glyphs */
});

export default HeroCarousel;
