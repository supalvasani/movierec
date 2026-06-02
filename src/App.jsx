import React, { useState, useEffect } from 'react';
import Search from "./Components/Search.jsx";
import Spinner from './Components/Spinner.jsx';
import MovieCard from "./Components/MovieCard.jsx";
import { useDebounce } from "react-use";
import { fetchMoviesFromOMDb, fetchCuratedTrendingMovies } from "./services/omdb.js";
import { getTrendingMovies, updateSearchCount } from "./services/appwrite.js";
import MovieModal from "./Components/MovieModal.jsx";
import FilterSort from "./Components/FilterSort.jsx";
import ThemeToggle from "./Components/ThemeToggle.jsx";
const App = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [movieList, setMovieList] = useState([]);
    const [errorMessage, setErrorMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [trendingMovies, setTrendingMovies] = useState([]);

    const [page, setPage] = useState(1);
    const [selectedMovie, setSelectedMovie] = useState(null);
    const [theme, setTheme] = useState('dark');
    const [sortOption, setSortOption] = useState('default');
    const [hasMore, setHasMore] = useState(true);

    useDebounce(() => {
        setDebouncedSearchTerm(searchTerm);
        setPage(1);
        setMovieList([]);
    }, 500, [searchTerm]);

    const fetchMovies = async (query = '', pageNum = 1) => {
        if (pageNum === 1) setIsLoading(true);
        setErrorMessage('');
        try {
            const { movies, hasMore: apiHasMore } = await fetchMoviesFromOMDb(query, pageNum);
            setHasMore(apiHasMore);

            if (query && movies.length === 0 && pageNum === 1) {
                setErrorMessage('No movies found for that search term.');
                setMovieList([]);
            } else if (movies.length > 0) {
                setMovieList(prev => pageNum === 1 ? movies : [...prev, ...movies]);
            }

            if (query && movies.length > 0 && pageNum === 1) {
                await updateSearchCount(query, movies[0]);
                await loadTrendingMovies();
            }
        } catch (error) {
            console.error('Error fetching movies:', error);
            setErrorMessage(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const loadTrendingMovies = async () => {
        try {
            let dbMovies = await getTrendingMovies();
            if (!dbMovies || dbMovies.length < 5) {
                const curated = await fetchCuratedTrendingMovies();
                // Merge dbMovies with curated movies, avoiding duplicates (using movie_id or $id comparison)
                const merged = [...(dbMovies || [])];
                for (const cMovie of curated) {
                    if (merged.length >= 10) break;
                    if (!merged.some(m => m.movie_id === cMovie.$id)) {
                        merged.push({
                            $id: cMovie.$id,
                            movie_id: cMovie.$id,
                            title: cMovie.title,
                            poster_url: cMovie.poster_url
                        });
                    }
                }
                setTrendingMovies(merged);
            } else {
                setTrendingMovies(dbMovies);
            }
        } catch (error) {
            console.error('Error loading trending movies:', error);
        }
    };

    useEffect(() => {
        fetchMovies(debouncedSearchTerm, 1);
        setPage(1);
    }, [debouncedSearchTerm]);

    const handleLoadMore = async () => {
        const nextPage = page + 1;
        setPage(nextPage);
        await fetchMovies(debouncedSearchTerm, nextPage);
    };

    const getSortedMovies = () => {
        let sorted = [...movieList];
        sorted.sort((a, b) => {
            const hasPosterA = a.poster_url && a.poster_url !== 'N/A';
            const hasPosterB = b.poster_url && b.poster_url !== 'N/A';
            
            if (hasPosterA && !hasPosterB) return -1;
            if (!hasPosterA && hasPosterB) return 1;
            
            switch(sortOption) {
                case 'rating_desc':
                    return (b.vote_average || 0) - (a.vote_average || 0);
                case 'year_desc':
                    return parseInt(b.release_date || 0) - parseInt(a.release_date || 0);
                case 'year_asc':
                    return parseInt(a.release_date || 0) - parseInt(b.release_date || 0);
                case 'title_asc':
                    return a.title.localeCompare(b.title);
                default:
                    return 0;
            }
        });
        return sorted;
    };

    useEffect(() => {
        loadTrendingMovies();
    }, []);

    return (
        <main>
            <ThemeToggle theme={theme} setTheme={setTheme} />
            <MovieModal movie={selectedMovie} onClose={() => setSelectedMovie(null)} theme={theme} />
            
            <div className="pattern" />
            <div className="wrapper">
                <header>
                    <img src="./hero.png" alt="Hero Banner" />
                    <h1>Find <span className="text-gradient">Movies</span> You'll Enjoy Without Hassle!!</h1>
                </header>
                {trendingMovies && trendingMovies.length > 0 && (
                    <section className="trending">
                        <h2>Trending Movies</h2>
                        <ul>
                            {trendingMovies.map((movie, index) => (
                                <li key={movie.$id}>
                                    <p>{index + 1}</p>
                                    <img src={movie.poster_url} alt={movie.title} />
                                </li>
                            ))}
                        </ul>
                    </section>
                )}
                <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
                
                {movieList.length > 0 && (
                    <FilterSort sortOption={sortOption} setSortOption={setSortOption} />
                )}

                <section className="all-movies">
                    <h2>
                        {debouncedSearchTerm ? `Results for "${debouncedSearchTerm}"` : 'Popular Movies'}
                    </h2>

                    {isLoading && page === 1 ? (
                        <Spinner />
                    ) : errorMessage ? (
                        <p className="error-message">{errorMessage}</p>
                    ) : (
                        <>
                            <ul>
                                {getSortedMovies().map(movie => (
                                    <MovieCard key={`${movie.id}-${Math.random()}`} movie={movie} onClick={(m) => setSelectedMovie(m)} />
                                ))}
                            </ul>
                            
                            {movieList.length > 0 && hasMore && (
                                <div className="flex justify-center mt-10">
                                    <button 
                                        onClick={handleLoadMore}
                                        disabled={isLoading}
                                        className="bg-light-100/10 hover:bg-light-100/20 text-white px-8 py-3 rounded-full transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isLoading ? 'Loading...' : 'Load More'}
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </section>
            </div>
        </main>
    );
};

export default App;