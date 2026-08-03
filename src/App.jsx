import React, { useState, useEffect } from 'react';
import MovieCard from './Components/MovieCard.jsx';
import MovieDetailModal from './Components/MovieDetailModal.jsx';
import PipelineMonitor from './Components/PipelineMonitor.jsx';
import { searchMovies, scrapeMoreMovies } from './services/movieService.js';

const INITIAL_LIMIT = 8;

const App = () => {
    // URL State persistence helpers
    const getInitialParams = () => {
        const params = new URLSearchParams(window.location.search);
        return {
            tab: params.get('tab') || 'discovery',
            movie: params.get('movie') || null,
            q: params.get('q') || '',
        };
    };

    const initialParams = getInitialParams();

    const [activeTab, setActiveTab] = useState(initialParams.tab);
    const [movies, setMovies] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedMovie, setSelectedMovie] = useState(null);
    const [searchQuery, setSearchQuery] = useState(initialParams.q);
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isScrapingMore, setIsScrapingMore] = useState(false);
    const [scrapeCount, setScrapeCount] = useState(0);

    // Section pagination limits for seamless "Load More"
    const [inTheatersLimit, setInTheatersLimit] = useState(INITIAL_LIMIT);
    const [classicsLimit, setClassicsLimit] = useState(INITIAL_LIMIT);

    // Synchronize state with URL parameters for 100% reload persistence!
    const updateUrlParams = (newTab, newMovie, newQuery) => {
        const params = new URLSearchParams();
        if (newTab && newTab !== 'discovery') params.set('tab', newTab);
        if (newMovie && newMovie.title) params.set('movie', newMovie.title);
        if (newQuery) params.set('q', newQuery);

        const queryString = params.toString();
        const newUrl = queryString ? `${window.location.pathname}?${queryString}` : window.location.pathname;
        window.history.replaceState({}, '', newUrl);
    };

    const handleSelectTab = (tab) => {
        setActiveTab(tab);
        updateUrlParams(tab, selectedMovie, searchQuery);
    };

    const handleSelectMovie = (movie) => {
        setSelectedMovie(movie);
        updateUrlParams(activeTab, movie, searchQuery);
    };

    const handleCloseModal = () => {
        setSelectedMovie(null);
        updateUrlParams(activeTab, null, searchQuery);
    };

    const handleSearchChange = (query) => {
        setSearchQuery(query);
        updateUrlParams(activeTab, selectedMovie, query);
    };

    const handleScrapeMore = async () => {
        setIsScrapingMore(true);
        try {
            const newScraped = await scrapeMoreMovies(scrapeCount);
            if (newScraped && newScraped.length > 0) {
                setMovies(prev => {
                    const existingTitles = new Set(prev.map(m => m.title.toLowerCase().trim()));
                    const filtered = newScraped.filter(m => !existingTitles.has(m.title.toLowerCase().trim()));
                    return [...prev, ...filtered];
                });
                setClassicsLimit(prev => prev + newScraped.length);
                setScrapeCount(prev => prev + 1);
            }
        } catch (err) {
            console.error('Scrape error:', err);
        } finally {
            setIsScrapingMore(false);
        }
    };

    useEffect(() => {
        const loadDataset = async () => {
            setIsLoading(true);
            try {
                const res = await fetch(`/data/movies.json?t=${Date.now()}`);
                const data = await res.json();
                
                // Only keep movies with valid poster URLs
                const validMovies = (data || []).filter(m => m.poster_url && m.poster_url !== 'N/A');

                // Sort: movies with Amazon/IMDb or BMS CDN posters FIRST
                validMovies.sort((a, b) => {
                    const aReal = a.poster_url?.includes('m.media-amazon.com') || a.poster_url?.includes('bmscdn.com') ? 2 : 1;
                    const bReal = b.poster_url?.includes('m.media-amazon.com') || b.poster_url?.includes('bmscdn.com') ? 2 : 1;
                    if (aReal !== bReal) return bReal - aReal;
                    return (b.rating || 0) - (a.rating || 0);
                });

                setMovies(validMovies);

                // Auto-restore selected movie from URL parameter on page reload!
                if (initialParams.movie) {
                    const match = validMovies.find(m => m.title.toLowerCase() === initialParams.movie.toLowerCase());
                    if (match) {
                        setSelectedMovie(match);
                    }
                }
            } catch (err) {
                console.error('Failed to load local dataset:', err);
            } finally {
                setIsLoading(false);
            }
        };
        loadDataset();
    }, []);

    // Search handler via OMDb with cancellation
    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            setIsSearching(false);
            return;
        }

        let isCurrent = true;
        setIsSearching(true);

        const timer = setTimeout(async () => {
            try {
                const { movies: results } = await searchMovies(searchQuery);
                if (isCurrent) {
                    setSearchResults(results);
                }
            } catch (err) {
                console.error('Search error:', err);
            } finally {
                if (isCurrent) {
                    setIsSearching(false);
                }
            }
        }, 400);

        return () => {
            isCurrent = false;
            clearTimeout(timer);
        };
    }, [searchQuery]);

    // Distinct Categorized Movie Arrays
    const inTheaters = movies.filter(m => m.source === 'BookMyShow' || m.status === 'IN_THEATERS');
    const classics   = movies.filter(m => m.source !== 'BookMyShow' && m.status !== 'IN_THEATERS');
    
    const isSearchActive = searchQuery.trim().length > 0;

    // Featured hero movie prioritizes currently in-theaters releases (e.g. Spider-Man: Brand New Day)
    const featuredHeroMovie = inTheaters.length > 0 ? inTheaters[0] : movies[0];

    return (
        <div style={{ minHeight: '100vh', background: '#09090b', color: '#f4f4f5' }}>

            {/* Navigation Bar */}
            <nav style={{
                position: 'sticky',
                top: 0,
                zIndex: 40,
                background: 'rgba(9, 9, 11, 0.92)',
                backdropFilter: 'blur(12px)',
                borderBottom: '1px solid #27272a',
                padding: '0 32px',
                height: 64,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 24,
            }}>
                {/* Brand Logo & Tabs */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                    <div
                        onClick={() => { handleSearchChange(''); handleSelectTab('discovery'); }}
                        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
                    >
                        <span style={{ fontWeight: 800, fontSize: 18, tracking: '-0.02em', color: '#ffffff' }}>
                            MOVIEREC
                        </span>
                        <span style={{ fontSize: 11, color: '#71717a', fontWeight: 600, borderLeft: '1px solid #27272a', paddingLeft: 8 }}>
                            Realtime Pipeline
                        </span>
                    </div>

                    {/* Tab Navigation Switches */}
                    <div style={{ display: 'flex', gap: 4, background: '#18181b', padding: 3, borderRadius: 6, border: '1px solid #27272a' }}>
                        <button
                            onClick={() => { handleSelectTab('discovery'); handleSearchChange(''); }}
                            style={{
                                padding: '5px 14px',
                                fontSize: 12,
                                fontWeight: 600,
                                borderRadius: 4,
                                border: 'none',
                                cursor: 'pointer',
                                background: activeTab === 'discovery' ? '#27272a' : 'transparent',
                                color: activeTab === 'discovery' ? '#f4f4f5' : '#71717a',
                                transition: 'all 0.15s ease',
                            }}
                        >
                            Movie Discovery
                        </button>
                        <button
                            onClick={() => handleSelectTab('pipeline')}
                            style={{
                                padding: '5px 14px',
                                fontSize: 12,
                                fontWeight: 600,
                                borderRadius: 4,
                                border: 'none',
                                cursor: 'pointer',
                                background: activeTab === 'pipeline' ? '#27272a' : 'transparent',
                                color: activeTab === 'pipeline' ? '#f4f4f5' : '#71717a',
                                transition: 'all 0.15s ease',
                            }}
                        >
                            ETL Pipeline Monitor
                        </button>
                    </div>
                </div>

                {/* Search Input (Shown in Discovery tab) */}
                {activeTab === 'discovery' && (
                    <div style={{ flex: 1, maxWidth: 420, position: 'relative' }}>
                        <svg
                            style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#71717a' }}
                            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                        >
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                        
                        <input
                            value={searchQuery}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            placeholder="Search any movie (e.g. Spider-Man, Interstellar, Avatar)..."
                            style={{
                                width: '100%',
                                padding: '8px 36px 8px 36px',
                                background: '#18181b',
                                border: '1px solid #27272a',
                                borderRadius: 6,
                                color: '#f4f4f5',
                                fontSize: 13,
                                outline: 'none',
                            }}
                        />

                        {searchQuery && (
                            <button
                                onClick={() => handleSearchChange('')}
                                style={{
                                    position: 'absolute',
                                    right: 10,
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    color: '#71717a',
                                    cursor: 'pointer',
                                    fontSize: 14,
                                }}
                            >
                                ✕
                            </button>
                        )}
                    </div>
                )}

                <div style={{ fontSize: 12, color: '#71717a', fontWeight: 500 }}>
                    {movies.length} Pipeline Records
                </div>
            </nav>

            {/* TAB CONTENT 1: PIPELINE MONITOR */}
            {activeTab === 'pipeline' ? (
                <PipelineMonitor />
            ) : (
                /* TAB CONTENT 2: MOVIE DISCOVERY */
                <>
                    {/* Hero Featured Section */}
                    {!isSearchActive && featuredHeroMovie && (
                        <div style={{
                            position: 'relative',
                            width: '100%',
                            height: 440,
                            overflow: 'hidden',
                            background: '#09090b',
                            borderBottom: '1px solid #27272a',
                        }}>
                            <div style={{
                                position: 'absolute',
                                inset: 0,
                                backgroundImage: `url(${featuredHeroMovie.poster_url})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center 20%',
                                filter: 'blur(30px) brightness(0.25)',
                                transform: 'scale(1.1)',
                            }} />
                            <div style={{
                                position: 'absolute',
                                inset: 0,
                                background: 'linear-gradient(180deg, rgba(9,9,11,0.2) 0%, rgba(9,9,11,0.85) 70%, #09090b 100%)',
                            }} />

                            <div style={{
                                position: 'relative',
                                zIndex: 2,
                                maxWidth: 1280,
                                margin: '0 auto',
                                height: '100%',
                                display: 'flex',
                                alignItems: 'flex-end',
                                padding: '0 32px 40px',
                                gap: 28,
                            }}>
                                <img
                                    src={featuredHeroMovie.poster_url}
                                    alt={featuredHeroMovie.title}
                                    style={{
                                        width: 140,
                                        height: 208,
                                        objectFit: 'cover',
                                        borderRadius: 6,
                                        flexShrink: 0,
                                        boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                    }}
                                />

                                <div style={{ flex: 1 }}>
                                    <span style={{
                                        fontSize: 11,
                                        fontWeight: 700,
                                        color: '#10b981',
                                        background: 'rgba(16, 185, 129, 0.1)',
                                        border: '1px solid rgba(16, 185, 129, 0.3)',
                                        padding: '3px 8px',
                                        borderRadius: 4,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em',
                                    }}>
                                        ● In Theaters Now
                                    </span>

                                    <h1 style={{ fontSize: 36, fontWeight: 800, color: '#ffffff', marginTop: 10, marginBottom: 8, lineHeight: 1.1 }}>
                                        {featuredHeroMovie.title}
                                    </h1>

                                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', fontSize: 13, color: '#a1a1aa', marginBottom: 12 }}>
                                        {featuredHeroMovie.rating && (
                                            <span style={{ color: '#f59e0b', fontWeight: 700 }}>
                                                ★ {featuredHeroMovie.rating}
                                            </span>
                                        )}
                                        <span>•</span>
                                        <span>{featuredHeroMovie.year}</span>
                                        <span>•</span>
                                        <span>{featuredHeroMovie.genre}</span>
                                    </div>

                                    {featuredHeroMovie.plot && (
                                        <p style={{ fontSize: 13, color: '#a1a1aa', lineHeight: 1.5, maxWidth: 600, marginBottom: 20 }}>
                                            {featuredHeroMovie.plot}
                                        </p>
                                    )}

                                    <button
                                        onClick={() => handleSelectMovie(featuredHeroMovie)}
                                        style={{
                                            padding: '10px 20px',
                                            borderRadius: 6,
                                            fontWeight: 600,
                                            fontSize: 13,
                                            background: '#f4f4f5',
                                            color: '#09090b',
                                            border: 'none',
                                            cursor: 'pointer',
                                            transition: 'background 0.15s ease',
                                        }}
                                        onMouseOver={(e) => e.currentTarget.style.background = '#e4e4e7'}
                                        onMouseOut={(e) => e.currentTarget.style.background = '#f4f4f5'}
                                    >
                                        View Details & Trailer
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Main Page Layout */}
                    <main style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 32px 64px' }}>
                        {isSearchActive ? (
                            <section>
                                <div style={{ marginBottom: 20 }}>
                                    <h2 style={{ fontSize: 18, fontWeight: 700, color: '#f4f4f5' }}>
                                        Search Results for "{searchQuery}"
                                    </h2>
                                    <p style={{ fontSize: 12, color: '#71717a', marginTop: 2 }}>
                                        Live OMDb API query results
                                    </p>
                                </div>

                                {isSearching ? (
                                    <LoadingSkeletonGrid />
                                ) : searchResults.length === 0 ? (
                                    <div style={{ padding: '60px 0', textTransform: 'none', textAlign: 'center', color: '#71717a', fontSize: 14 }}>
                                        No movies found matching "{searchQuery}".
                                    </div>
                                ) : (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 20 }}>
                                        {searchResults.map((m, idx) => (
                                            <MovieCard key={idx} movie={m} onClick={handleSelectMovie} />
                                        ))}
                                    </div>
                                )}
                            </section>
                        ) : isLoading ? (
                            <LoadingSkeletonGrid />
                        ) : (
                            <>
                                {/* 1. Currently In Theaters */}
                                {inTheaters.length > 0 && (
                                    <section style={{ marginBottom: 56 }}>
                                        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                            <div>
                                                <h2 style={{ fontSize: 22, fontWeight: 800, color: '#f4f4f5', tracking: '-0.01em' }}>
                                                    In Theaters Now
                                                </h2>
                                                <p style={{ fontSize: 13, color: '#71717a', marginTop: 2 }}>
                                                    Real-time running theatrical releases scraped live from BookMyShow
                                                </p>
                                            </div>
                                            <span style={{ fontSize: 12, color: '#71717a' }}>
                                                Showing {Math.min(inTheatersLimit, inTheaters.length)} of {inTheaters.length}
                                            </span>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 20 }}>
                                            {inTheaters.slice(0, inTheatersLimit).map((m, idx) => (
                                                <MovieCard key={idx} movie={m} onClick={handleSelectMovie} badgeText="In Theaters" />
                                            ))}
                                        </div>

                                        {inTheatersLimit < inTheaters.length && (
                                            <div style={{ textAlign: 'center', marginTop: 24 }}>
                                                <button
                                                    onClick={() => setInTheatersLimit(prev => prev + 8)}
                                                    style={{
                                                        padding: '10px 24px',
                                                        background: '#18181b',
                                                        border: '1px solid #27272a',
                                                        borderRadius: 6,
                                                        color: '#f4f4f5',
                                                        fontSize: 13,
                                                        fontWeight: 600,
                                                        cursor: 'pointer',
                                                        transition: 'all 0.15s ease'
                                                    }}
                                                    onMouseOver={(e) => e.currentTarget.style.background = '#27272a'}
                                                    onMouseOut={(e) => e.currentTarget.style.background = '#18181b'}
                                                >
                                                    Load More In Theaters Movies
                                                </button>
                                            </div>
                                        )}
                                    </section>
                                )}

                                {/* 2. Top Rated Classics & All-Time Hits */}
                                {classics.length > 0 && (
                                    <section style={{ marginBottom: 56 }}>
                                        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                            <div>
                                                <h2 style={{ fontSize: 22, fontWeight: 800, color: '#f4f4f5', tracking: '-0.01em' }}>
                                                    Top Rated Classics & All-Time Hits
                                                </h2>
                                                <p style={{ fontSize: 13, color: '#71717a', marginTop: 2 }}>
                                                    Highest-rated classic masterpieces with verified official posters
                                                </p>
                                            </div>
                                            <span style={{ fontSize: 12, color: '#71717a' }}>
                                                Showing {Math.min(classicsLimit, classics.length)} of {classics.length}
                                            </span>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 20 }}>
                                            {classics.slice(0, classicsLimit).map((m, idx) => (
                                                <MovieCard key={idx} movie={m} onClick={handleSelectMovie} badgeText="Classic" />
                                            ))}
                                        </div>

                                        {classicsLimit < classics.length && (
                                            <div style={{ textAlign: 'center', marginTop: 24 }}>
                                                <button
                                                    onClick={() => setClassicsLimit(prev => prev + 8)}
                                                    style={{
                                                        padding: '10px 24px',
                                                        background: '#18181b',
                                                        border: '1px solid #27272a',
                                                        borderRadius: 6,
                                                        color: '#f4f4f5',
                                                        fontSize: 13,
                                                        fontWeight: 600,
                                                        cursor: 'pointer',
                                                        transition: 'all 0.15s ease'
                                                    }}
                                                    onMouseOver={(e) => e.currentTarget.style.background = '#27272a'}
                                                    onMouseOut={(e) => e.currentTarget.style.background = '#18181b'}
                                                >
                                                    Load More Movies
                                                </button>
                                            </div>
                                        )}
                                        {classicsLimit >= classics.length && (
                                            <div style={{ textAlign: 'center', marginTop: 24 }}>
                                                <button
                                                    onClick={handleScrapeMore}
                                                    disabled={isScrapingMore}
                                                    style={{
                                                        padding: '10px 24px',
                                                        background: '#18181b',
                                                        border: '1px solid #27272a',
                                                        borderRadius: 6,
                                                        color: '#f4f4f5',
                                                        fontSize: 13,
                                                        fontWeight: 600,
                                                        cursor: isScrapingMore ? 'not-allowed' : 'pointer',
                                                        transition: 'all 0.15s ease'
                                                    }}
                                                    onMouseOver={(e) => e.currentTarget.style.background = '#27272a'}
                                                    onMouseOut={(e) => e.currentTarget.style.background = '#18181b'}
                                                >
                                                    {isScrapingMore ? 'Loading More Movies...' : 'Load More Movies'}
                                                </button>
                                            </div>
                                        )}
                                    </section>
                                )}
                            </>
                        )}
                    </main>
                </>
            )}

            {/* Modal */}
            {selectedMovie && (
                <MovieDetailModal movie={selectedMovie} onClose={handleCloseModal} />
            )}

            {/* Footer */}
            <footer style={{ borderTop: '1px solid #27272a', padding: '24px 32px', fontSize: 12, color: '#71717a', textAlign: 'center' }}>
                Automated ETL Pipeline • Scraped from BookMyShow, BoxOfficeMojo & IMDb • Enriched via OMDb API • Synced to Supabase
            </footer>
        </div>
    );
};

const LoadingSkeletonGrid = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 20 }}>
        {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} style={{ borderRadius: 6, overflow: 'hidden' }}>
                <div className="skeleton" style={{ width: '100%', aspectRatio: '2/3' }} />
                <div className="skeleton" style={{ height: 14, marginTop: 8, borderRadius: 4 }} />
            </div>
        ))}
    </div>
);

export default App;