import React, { useState } from 'react';
import MovieCard from './MovieCard.jsx';

const WatchlistPanel = ({
    watchlist,
    watchedHistory,
    recommendations,
    onSelectMovie,
    onToggleWatchlist,
    onToggleWatched,
    isWatchlisted,
    isWatched,
    onClearWatchlist,
    onClearHistory,
}) => {
    const [section, setSection] = useState('watchlist'); // 'watchlist' | 'history' | 'recommended'

    const tabs = [
        { id: 'watchlist',   label: 'Watchlist',    count: watchlist.length },
        { id: 'history',     label: 'Watch History', count: watchedHistory.length },
        { id: 'recommended', label: 'Recommended',  count: recommendations.length },
    ];

    const sectionMap = {
        watchlist:   watchlist,
        history:     watchedHistory,
        recommended: recommendations,
    };

    const current = sectionMap[section] || [];

    const emptyMessages = {
        watchlist:   'No movies saved yet. Click "Add to Watchlist" on any movie to save it here.',
        history:     'No watch history yet. Mark movies as watched to track them here.',
        recommended: 'Watch some movies first — recommendations are generated from your history.',
    };

    return (
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 32px 64px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <h1 style={{ fontSize: 22, fontWeight: 800, color: '#ffffff' }}>
                        Your Library
                    </h1>
                    <p style={{ fontSize: 13, color: '#71717a', marginTop: 4 }}>
                        Saved movies, watch history, and personalized picks — all stored locally.
                    </p>
                </div>

                {/* Clear buttons */}
                <div style={{ display: 'flex', gap: 10 }}>
                    {section === 'watchlist' && watchlist.length > 0 && (
                        <button
                            onClick={onClearWatchlist}
                            style={dangerBtnStyle}
                        >
                            Clear Watchlist
                        </button>
                    )}
                    {section === 'history' && watchedHistory.length > 0 && (
                        <button
                            onClick={onClearHistory}
                            style={dangerBtnStyle}
                        >
                            Clear History
                        </button>
                    )}
                </div>
            </div>

            {/* Tab bar */}
            <div style={{
                display: 'flex', gap: 0,
                borderBottom: '1px solid #27272a',
                marginBottom: 28,
            }}>
                {tabs.map((t) => (
                    <button
                        key={t.id}
                        onClick={() => setSection(t.id)}
                        style={{
                            padding: '10px 20px',
                            fontSize: 13,
                            fontWeight: 600,
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: section === t.id ? '#f4f4f5' : '#71717a',
                            borderBottom: section === t.id ? '2px solid #6366f1' : '2px solid transparent',
                            transition: 'color 0.15s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                        }}
                    >
                        {t.label}
                        {t.count > 0 && (
                            <span style={{
                                fontSize: 10, fontWeight: 700,
                                background: section === t.id ? '#6366f1' : '#27272a',
                                color: '#fff',
                                padding: '1px 6px', borderRadius: 10,
                                transition: 'background 0.15s ease',
                            }}>
                                {t.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Recommended explanation */}
            {section === 'recommended' && current.length > 0 && (
                <div style={{
                    background: 'rgba(99,102,241,0.08)',
                    border: '1px solid rgba(99,102,241,0.2)',
                    borderRadius: 8,
                    padding: '12px 16px',
                    marginBottom: 24,
                    fontSize: 13,
                    color: '#a1a1aa',
                }}>
                    Recommendations are ranked by genre overlap with your watch history, weighted by IMDb rating.
                </div>
            )}

            {/* Movie Grid */}
            {current.length === 0 ? (
                <div style={{
                    padding: '80px 0',
                    textAlign: 'center',
                    color: '#52525b',
                    fontSize: 14,
                    maxWidth: 400,
                    margin: '0 auto',
                }}>
                    {emptyMessages[section]}
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 20 }}>
                    {current.map((m, idx) => (
                        <MovieCard
                            key={idx}
                            movie={m}
                            onClick={onSelectMovie}
                            onWatchlist={onToggleWatchlist}
                            onWatched={onToggleWatched}
                            isWatchlisted={isWatchlisted(m)}
                            isWatched={isWatched(m)}
                            badgeText={section === 'history' ? 'Watched' : undefined}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

const dangerBtnStyle = {
    padding: '8px 16px',
    background: 'transparent',
    border: '1px solid #3f3f46',
    borderRadius: 6,
    color: '#71717a',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
};

export default WatchlistPanel;
