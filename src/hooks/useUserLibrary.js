import { useState, useCallback } from 'react';

const WATCHLIST_KEY = 'movierec_watchlist';
const HISTORY_KEY = 'movierec_history';

const load = (key) => {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
};

const save = (key, data) => {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch {
        // quota exceeded — silently ignore
    }
};

const useUserLibrary = () => {
    const [watchlist, setWatchlist] = useState(() => load(WATCHLIST_KEY));
    const [watchedHistory, setWatchedHistory] = useState(() => load(HISTORY_KEY));

    const isWatchlisted = useCallback(
        (movie) => watchlist.some((m) => m.title === movie.title),
        [watchlist]
    );

    const isWatched = useCallback(
        (movie) => watchedHistory.some((m) => m.title === movie.title),
        [watchedHistory]
    );

    const toggleWatchlist = useCallback((movie) => {
        setWatchlist((prev) => {
            const exists = prev.some((m) => m.title === movie.title);
            const next = exists
                ? prev.filter((m) => m.title !== movie.title)
                : [movie, ...prev];
            save(WATCHLIST_KEY, next);
            return next;
        });
    }, []);

    const toggleWatched = useCallback((movie) => {
        setWatchedHistory((prev) => {
            const exists = prev.some((m) => m.title === movie.title);
            const next = exists
                ? prev.filter((m) => m.title !== movie.title)
                : [movie, ...prev];
            save(HISTORY_KEY, next);
            return next;
        });
    }, []);

    const clearWatchlist = useCallback(() => {
        setWatchlist([]);
        save(WATCHLIST_KEY, []);
    }, []);

    const clearHistory = useCallback(() => {
        setWatchedHistory([]);
        save(HISTORY_KEY, []);
    }, []);

    /**
     * Personalized recommendations:
     * Score each movie by how many genres overlap with the user's watched history,
     * weighted by IMDb rating. Returns top N matches not already watched.
     */
    const getRecommendations = useCallback(
        (allMovies, limit = 8) => {
            if (watchedHistory.length === 0) return [];

            const watchedGenres = {};
            watchedHistory.forEach((m) => {
                (m.genre || '').split(',').forEach((g) => {
                    const key = g.trim().toLowerCase();
                    if (key) watchedGenres[key] = (watchedGenres[key] || 0) + 1;
                });
            });

            const watchedTitles = new Set(watchedHistory.map((m) => m.title));

            return allMovies
                .filter((m) => !watchedTitles.has(m.title))
                .map((m) => {
                    const genres = (m.genre || '').split(',').map((g) => g.trim().toLowerCase());
                    const genreScore = genres.reduce((acc, g) => acc + (watchedGenres[g] || 0), 0);
                    const ratingBonus = (m.rating || 0) / 10;
                    return { ...m, _score: genreScore + ratingBonus };
                })
                .filter((m) => m._score > 0)
                .sort((a, b) => b._score - a._score)
                .slice(0, limit);
        },
        [watchedHistory]
    );

    return {
        watchlist,
        watchedHistory,
        isWatchlisted,
        isWatched,
        toggleWatchlist,
        toggleWatched,
        clearWatchlist,
        clearHistory,
        getRecommendations,
    };
};

export default useUserLibrary;
