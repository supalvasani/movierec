import React, { useState, useEffect } from 'react';
import MovieCard from './Components/MovieCard.jsx';
import MovieDetailModal from './Components/MovieDetailModal.jsx';
import PipelineMonitor from './Components/PipelineMonitor.jsx';
import AnalyticsDashboard from './Components/AnalyticsDashboard.jsx';
import HeroCarousel from './Components/HeroCarousel.jsx';
import WatchlistPanel from './Components/WatchlistPanel.jsx';
import ToastContainer, { toast } from './Components/Toast.jsx';
import useUserLibrary from './hooks/useUserLibrary.js';
import { searchMovies, scrapeMoreMovies } from './services/movieService.js';

const INITIAL_LIMIT = 8;

// Mood filter configuration — no emojis
const MOOD_FILTERS = [
    { id: 'all',       label: 'All',        genres: [] },
    { id: 'action',    label: 'Action',     genres: ['Action', 'Adventure'] },
    { id: 'thriller',  label: 'Thriller',   genres: ['Thriller', 'Crime', 'Mystery'] },
    { id: 'drama',     label: 'Drama',      genres: ['Drama'] },
    { id: 'comedy',    label: 'Comedy',     genres: ['Comedy'] },
    { id: 'scifi',     label: 'Sci-Fi',     genres: ['Sci-Fi', 'Fantasy'] },
    { id: 'romance',   label: 'Romance',    genres: ['Romance'] },
    { id: 'animated',  label: 'Animated',   genres: ['Animation'] },
];

const App = () => {
    // URL state
    const getInitialParams = () => {
        const p = new URLSearchParams(window.location.search);
        return { tab: p.get('tab') || 'discovery', movie: p.get('movie') || null, q: p.get('q') || '' };
    };
    const initialParams = getInitialParams();

    // Core state
    const [activeTab, setActiveTab] = useState(initialParams.tab);
    const [movies, setMovies] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedMovie, setSelectedMovie] = useState(null);
    const [searchQuery, setSearchQuery] = useState(initialParams.q);
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isScrapingMore, setIsScrapingMore] = useState(false);
    const [scrapeCount, setScrapeCount] = useState(0);
    const [inTheatersLimit, setInTheatersLimit] = useState(INITIAL_LIMIT);
    const [classicsLimit, setClassicsLimit] = useState(INITIAL_LIMIT);
    const [activeMood, setActiveMood] = useState('all');
    const [pipelineStatus, setPipelineStatus] = useState(null); // { status, timestamp }

    // User library
    const {
        watchlist, watchedHistory,
        isWatchlisted, isWatched,
        toggleWatchlist, toggleWatched,
        clearWatchlist, clearHistory,
        getRecommendations,
    } = useUserLibrary();

    // URL sync
    const updateUrl = (tab, movie, q) => {
        const p = new URLSearchParams();
        if (tab && tab !== 'discovery') p.set('tab', tab);
        if (movie?.title) p.set('movie', movie.title);
        if (q) p.set('q', q);
        const qs = p.toString();
        window.history.replaceState({}, '', qs ? `${window.location.pathname}?${qs}` : window.location.pathname);
    };

    const handleSelectTab = (tab) => { setActiveTab(tab); updateUrl(tab, selectedMovie, searchQuery); };
    const handleSelectMovie = (movie) => { setSelectedMovie(movie); updateUrl(activeTab, movie, searchQuery); };
    const handleCloseModal = () => { setSelectedMovie(null); updateUrl(activeTab, null, searchQuery); };
    const handleSearchChange = (q) => { setSearchQuery(q); updateUrl(activeTab, selectedMovie, q); };

    const handleToggleWatchlist = (movie) => {
        const wasIn = isWatchlisted(movie);
        toggleWatchlist(movie);
        toast.success(wasIn ? 'Removed from Watchlist' : 'Added to Watchlist');
    };

    const handleToggleWatched = (movie) => {
        const wasIn = isWatched(movie);
        toggleWatched(movie);
        toast.success(wasIn ? 'Removed from History' : 'Marked as Watched');
    };

    const handleScrapeMore = async () => {
        setIsScrapingMore(true);
        try {
            const newScraped = await scrapeMoreMovies(scrapeCount);
            if (newScraped?.length > 0) {
                setMovies((prev) => {
                    const existing = new Set(prev.map((m) => m.title.toLowerCase().trim()));
                    const filtered = newScraped.filter((m) => !existing.has(m.title.toLowerCase().trim()));
                    return [...prev, ...filtered];
                });
                setClassicsLimit((prev) => prev + newScraped.length);
                setScrapeCount((prev) => prev + 1);
            }
        } catch (err) {
            console.error('Scrape error:', err);
        } finally {
            setIsScrapingMore(false);
        }
    };

    // Load movies.json
    useEffect(() => {
        const load = async () => {
            setIsLoading(true);
            try {
                const res = await fetch(`/data/movies.json?t=${Date.now()}`);
                const data = await res.json();
                const valid = (data || []).filter((m) => m.poster_url && m.poster_url !== 'N/A');
                valid.sort((a, b) => {
                    const aR = a.poster_url?.includes('m.media-amazon.com') || a.poster_url?.includes('bmscdn.com') ? 2 : 1;
                    const bR = b.poster_url?.includes('m.media-amazon.com') || b.poster_url?.includes('bmscdn.com') ? 2 : 1;
                    if (aR !== bR) return bR - aR;
                    return (b.rating || 0) - (a.rating || 0);
                });
                setMovies(valid);
                if (initialParams.movie) {
                    const match = valid.find((m) => m.title.toLowerCase() === initialParams.movie.toLowerCase());
                    if (match) setSelectedMovie(match);
                }
            } catch (err) {
                console.error('Failed to load dataset:', err);
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, []);

    // Load pipeline status
    useEffect(() => {
        fetch('/data/pipeline_runs.json')
            .then((r) => r.json())
            .then((data) => {
                if (data?.[0]) {
                    setPipelineStatus({ status: data[0].status, timestamp: data[0].timestamp });
                }
            })
            .catch(() => {});
    }, []);

    // Search
    useEffect(() => {
        if (!searchQuery.trim()) { setSearchResults([]); setIsSearching(false); return; }
        let current = true;
        setIsSearching(true);
        const t = setTimeout(async () => {
            try {
                const { movies: results } = await searchMovies(searchQuery);
                if (current) setSearchResults(results);
            } catch (err) {
                console.error('Search error:', err);
            } finally {
                if (current) setIsSearching(false);
            }
        }, 400);
        return () => { current = false; clearTimeout(t); };
    }, [searchQuery]);

    // Derived
    // Strict accuracy guard: a movie only shows as "In Theaters" if:
    //   (a) it is tagged IN_THEATERS / BookMyShow by the pipeline, AND
    //   (b) its year is recent (current year or the year before).
    // This prevents old films whose status was incorrectly inherited from showing
    // in the theater section — catches both pipeline misclassifications and live scraper results.
    const currentYear = new Date().getFullYear();
    const inTheaters = movies.filter((m) => {
        const isTagged = m.source === 'BookMyShow' || m.status === 'IN_THEATERS';
        const movieYear = parseInt(m.year) || 0;
        const isRecent = movieYear >= currentYear - 1;
        return isTagged && isRecent;
    });
    const classics = movies.filter((m) => {
        const isTagged = m.source === 'BookMyShow' || m.status === 'IN_THEATERS';
        const movieYear = parseInt(m.year) || 0;
        const isRecent = movieYear >= currentYear - 1;
        // Classic = not a valid in-theaters movie (either not tagged, or tagged but year is too old)
        return !isTagged || !isRecent;
    });
    const isSearchActive = searchQuery.trim().length > 0;
    const recommendations = getRecommendations(movies);

    // Mood filter
    const applyMoodFilter = (list) => {
        if (activeMood === 'all') return list;
        const mf = MOOD_FILTERS.find((m) => m.id === activeMood);
        if (!mf || mf.genres.length === 0) return list;
        return list.filter((m) => {
            const mGenres = (m.genre || '').split(',').map((g) => g.trim());
            return mf.genres.some((g) => mGenres.includes(g));
        });
    };

    const filteredInTheaters = applyMoodFilter(inTheaters);
    const filteredClassics = applyMoodFilter(classics);

    // Carousel movies: top-rated in-theaters + top classics
    const carouselMovies = [
        ...inTheaters.slice(0, 3),
        ...classics.slice(0, 2),
    ].filter((m, i, arr) => arr.findIndex((x) => x.title === m.title) === i).slice(0, 5);

    const pipelineOk = pipelineStatus?.status === 'SUCCESS';

    return (
        <div style={{ minHeight: '100vh', background: '#09090b', color: '#f4f4f5' }}>
            <ToastContainer />

            {/* Navigation Bar */}
            <nav style={{
                position: 'sticky', top: 0, zIndex: 40,
                background: 'rgba(9,9,11,0.92)', backdropFilter: 'blur(14px)',
                borderBottom: '1px solid #27272a',
                padding: '0 32px', height: 60,
                display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', gap: 20,
            }}>
                {/* Brand + tabs */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                    <div
                        onClick={() => { handleSearchChange(''); handleSelectTab('discovery'); }}
                        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
                    >
                        <span style={{ fontWeight: 800, fontSize: 17, color: '#ffffff', letterSpacing: '-0.02em' }}>
                            MOVIEREC
                        </span>
                        {pipelineStatus && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, borderLeft: '1px solid #27272a', paddingLeft: 10 }}>
                                <div
                                    className="pulse-dot"
                                    style={{
                                        width: 7, height: 7, borderRadius: '50%',
                                        background: pipelineOk ? '#10b981' : '#f59e0b',
                                    }}
                                />
                                <span style={{ fontSize: 10, color: '#52525b', fontWeight: 600 }}>
                                    Pipeline {pipelineOk ? 'OK' : 'WARN'}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Tab switcher */}
                    <div style={{ display: 'flex', gap: 2, background: '#18181b', padding: 3, borderRadius: 6, border: '1px solid #27272a' }}>
                        {[
                            { id: 'discovery', label: 'Discovery' },
                            { id: 'watchlist', label: 'Library', badge: watchlist.length + watchedHistory.length },
                            { id: 'analytics', label: 'Analytics' },
                            { id: 'pipeline',  label: 'Pipeline' },
                        ].map(({ id, label, badge }) => (
                            <button
                                key={id}
                                onClick={() => { handleSelectTab(id); handleSearchChange(''); }}
                                style={{
                                    padding: '5px 12px', fontSize: 12, fontWeight: 600,
                                    borderRadius: 4, border: 'none', cursor: 'pointer',
                                    background: activeTab === id ? '#27272a' : 'transparent',
                                    color: activeTab === id ? '#f4f4f5' : '#71717a',
                                    transition: 'all 0.15s ease',
                                    display: 'flex', alignItems: 'center', gap: 6,
                                }}
                            >
                                {label}
                                {badge > 0 && (
                                    <span style={{
                                        fontSize: 9, fontWeight: 700, background: '#6366f1',
                                        color: '#fff', padding: '1px 5px', borderRadius: 8,
                                    }}>
                                        {badge}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Search + record count */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, maxWidth: 480, justifyContent: 'flex-end' }}>
                    {activeTab === 'discovery' && (
                        <div style={{ position: 'relative', flex: 1, maxWidth: 380 }}>
                            <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#52525b' }}
                                width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                            <input
                                value={searchQuery}
                                onChange={(e) => handleSearchChange(e.target.value)}
                                placeholder="Search any movie..."
                                style={{
                                    width: '100%', padding: '7px 32px 7px 32px',
                                    background: '#18181b', border: '1px solid #27272a',
                                    borderRadius: 6, color: '#f4f4f5', fontSize: 13, outline: 'none',
                                    transition: 'border-color 0.15s ease',
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#3f3f46'}
                                onBlur={(e) => e.target.style.borderColor = '#27272a'}
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => handleSearchChange('')}
                                    style={{
                                        position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)',
                                        background: 'none', border: 'none', color: '#52525b',
                                        cursor: 'pointer', fontSize: 13, lineHeight: 1,
                                    }}
                                >✕</button>
                            )}
                        </div>
                    )}
                    <span style={{ fontSize: 11, color: '#3f3f46', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {movies.length} records
                    </span>
                </div>
            </nav>

            {/* ── PIPELINE MONITOR ── */}
            {activeTab === 'pipeline' && <PipelineMonitor />}

            {/* ── ANALYTICS ── */}
            {activeTab === 'analytics' && <AnalyticsDashboard movies={movies} />}

            {/* ── LIBRARY / WATCHLIST ── */}
            {activeTab === 'watchlist' && (
                <WatchlistPanel
                    watchlist={watchlist}
                    watchedHistory={watchedHistory}
                    recommendations={recommendations}
                    onSelectMovie={handleSelectMovie}
                    onToggleWatchlist={handleToggleWatchlist}
                    onToggleWatched={handleToggleWatched}
                    isWatchlisted={isWatchlisted}
                    isWatched={isWatched}
                    onClearWatchlist={clearWatchlist}
                    onClearHistory={clearHistory}
                />
            )}

            {/* ── DISCOVERY ── */}
            {activeTab === 'discovery' && (
                <>
                    {/* Hero Carousel (only when not searching and movies loaded) */}
                    {!isSearchActive && !isLoading && carouselMovies.length > 0 && (
                        <HeroCarousel
                            movies={carouselMovies}
                            onSelectMovie={handleSelectMovie}
                            onWatchlist={handleToggleWatchlist}
                            isWatchlisted={isWatchlisted}
                        />
                    )}

                    <main style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 32px 64px' }}>

                        {/* ── Mood Filter Bar ── */}
                        {!isSearchActive && !isLoading && (
                            <div style={{ marginBottom: 32 }}>
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                    {MOOD_FILTERS.map((f) => (
                                        <button
                                            key={f.id}
                                            onClick={() => setActiveMood(f.id)}
                                            style={{
                                                padding: '7px 16px', borderRadius: 20,
                                                fontSize: 12, fontWeight: 600,
                                                border: `1px solid ${activeMood === f.id ? '#6366f1' : '#27272a'}`,
                                                background: activeMood === f.id ? 'rgba(99,102,241,0.15)' : 'transparent',
                                                color: activeMood === f.id ? '#818cf8' : '#71717a',
                                                cursor: 'pointer', transition: 'all 0.15s ease',
                                            }}
                                        >
                                            {f.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Search results */}
                        {isSearchActive ? (
                            <section>
                                <div style={{ marginBottom: 20 }}>
                                    <h2 style={{ fontSize: 18, fontWeight: 700, color: '#f4f4f5' }}>
                                        Results for "{searchQuery}"
                                    </h2>
                                    <p style={{ fontSize: 12, color: '#52525b', marginTop: 2 }}>Live OMDb API query</p>
                                </div>
                                {isSearching ? (
                                    <LoadingSkeletonGrid />
                                ) : searchResults.length === 0 ? (
                                    <div style={{ padding: '60px 0', textAlign: 'center', color: '#52525b', fontSize: 14 }}>
                                        No results for "{searchQuery}".
                                    </div>
                                ) : (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 20 }}>
                                        {searchResults.map((m, idx) => (
                                            <MovieCard
                                                key={idx} movie={m} onClick={handleSelectMovie}
                                                onWatchlist={handleToggleWatchlist}
                                                onWatched={handleToggleWatched}
                                                isWatchlisted={isWatchlisted(m)}
                                                isWatched={isWatched(m)}
                                            />
                                        ))}
                                    </div>
                                )}
                            </section>
                        ) : isLoading ? (
                            <LoadingSkeletonGrid />
                        ) : (
                            <>
                                {/* In Theaters */}
                                {filteredInTheaters.length > 0 && (
                                    <Section
                                        title="In Theaters Now"
                                        subtitle="Live theatrical releases scraped from BookMyShow"
                                        shown={Math.min(inTheatersLimit, filteredInTheaters.length)}
                                        total={filteredInTheaters.length}
                                    >
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 20 }}>
                                            {filteredInTheaters.slice(0, inTheatersLimit).map((m, idx) => (
                                                <MovieCard
                                                    key={idx} movie={m} onClick={handleSelectMovie}
                                                    onWatchlist={handleToggleWatchlist}
                                                    onWatched={handleToggleWatched}
                                                    isWatchlisted={isWatchlisted(m)}
                                                    isWatched={isWatched(m)}
                                                    badgeText="In Theaters"
                                                />
                                            ))}
                                        </div>
                                        {inTheatersLimit < filteredInTheaters.length && (
                                            <LoadMoreBtn onClick={() => setInTheatersLimit((p) => p + 8)} label="Load More" />
                                        )}
                                    </Section>
                                )}

                                {/* Classics */}
                                {filteredClassics.length > 0 && (
                                    <Section
                                        title="Top Rated Classics"
                                        subtitle="Highest-rated all-time hits with verified official posters"
                                        shown={Math.min(classicsLimit, filteredClassics.length)}
                                        total={filteredClassics.length}
                                    >
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 20 }}>
                                            {filteredClassics.slice(0, classicsLimit).map((m, idx) => (
                                                <MovieCard
                                                    key={idx} movie={m} onClick={handleSelectMovie}
                                                    onWatchlist={handleToggleWatchlist}
                                                    onWatched={handleToggleWatched}
                                                    isWatchlisted={isWatchlisted(m)}
                                                    isWatched={isWatched(m)}
                                                    badgeText="Classic"
                                                />
                                            ))}
                                        </div>
                                        {classicsLimit < filteredClassics.length ? (
                                            <LoadMoreBtn onClick={() => setClassicsLimit((p) => p + 8)} label="Load More" />
                                        ) : (
                                            <LoadMoreBtn
                                                onClick={handleScrapeMore}
                                                label={isScrapingMore ? 'Loading...' : 'Load More from OMDb'}
                                                disabled={isScrapingMore}
                                            />
                                        )}
                                    </Section>
                                )}

                                {/* No results for mood filter */}
                                {filteredInTheaters.length === 0 && filteredClassics.length === 0 && (
                                    <div style={{ padding: '80px 0', textAlign: 'center', color: '#52525b', fontSize: 14 }}>
                                        No movies match the selected filter.
                                    </div>
                                )}
                            </>
                        )}
                    </main>
                </>
            )}

            {/* Movie detail modal */}
            {selectedMovie && (
                <MovieDetailModal
                    movie={selectedMovie}
                    onClose={handleCloseModal}
                    allMovies={movies}
                    onSelectMovie={handleSelectMovie}
                    onToggleWatchlist={handleToggleWatchlist}
                    onToggleWatched={handleToggleWatched}
                    isWatchlisted={isWatchlisted}
                    isWatched={isWatched}
                />
            )}

            {/* Footer */}
            <footer style={{ borderTop: '1px solid #27272a', padding: '20px 32px', fontSize: 12, color: '#3f3f46', textAlign: 'center' }}>
                ETL Pipeline · BookMyShow · BoxOfficeMojo · IMDb · OMDb API · Supabase
            </footer>
        </div>
    );
};

// ─── Reusable section wrapper ─────────────────────────────────────────────────
const Section = ({ title, subtitle, shown, total, children }) => (
    <section style={{ marginBottom: 56 }}>
        <div style={{ marginBottom: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 8 }}>
            <div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: '#f4f4f5', letterSpacing: '-0.01em' }}>{title}</h2>
                <p style={{ fontSize: 13, color: '#52525b', marginTop: 3 }}>{subtitle}</p>
            </div>
            <span style={{ fontSize: 12, color: '#3f3f46' }}>
                {shown} of {total}
            </span>
        </div>
        {children}
    </section>
);

// ─── Load more button ─────────────────────────────────────────────────────────
const LoadMoreBtn = ({ onClick, label, disabled }) => (
    <div style={{ textAlign: 'center', marginTop: 24 }}>
        <button
            onClick={onClick}
            disabled={disabled}
            style={{
                padding: '10px 24px',
                background: '#18181b', border: '1px solid #27272a',
                borderRadius: 6, color: disabled ? '#52525b' : '#f4f4f5',
                fontSize: 13, fontWeight: 600,
                cursor: disabled ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s ease',
            }}
            onMouseOver={(e) => { if (!disabled) e.currentTarget.style.background = '#27272a'; }}
            onMouseOut={(e) => e.currentTarget.style.background = '#18181b'}
        >
            {label}
        </button>
    </div>
);

// ─── Loading skeleton ─────────────────────────────────────────────────────────
const LoadingSkeletonGrid = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 20 }}>
        {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} style={{ borderRadius: 8, overflow: 'hidden' }}>
                <div className="skeleton" style={{ width: '100%', aspectRatio: '2/3' }} />
                <div className="skeleton" style={{ height: 14, marginTop: 8, borderRadius: 4 }} />
                <div className="skeleton" style={{ height: 10, marginTop: 6, borderRadius: 4, width: '60%' }} />
            </div>
        ))}
    </div>
);

export default App;