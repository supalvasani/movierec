import React, { useState, useEffect } from 'react';
import Search from "./Components/Search.jsx";
import Spinner from './Components/Spinner.jsx';
import MovieCard from "./Components/MovieCard.jsx";
import { useDebounce } from "react-use";
import { fetchMoviesFromOMDb } from "./services/omdb.js";
import { getTrendingMovies, updateSearchCount } from "./services/appwrite.js";

const App = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [movieList, setMovieList] = useState([]);
    const [errorMessage, setErrorMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [trendingMovies, setTrendingMovies] = useState([]);

    useDebounce(() => {
        setDebouncedSearchTerm(searchTerm);
    }, 500, [searchTerm]);

    const fetchMovies = async (query = '') => {
        setIsLoading(true);
        setErrorMessage('');
        try {
            const movies = await fetchMoviesFromOMDb(query);

            if (query && movies.length === 0) {
                setErrorMessage('No movies found for that search term.');
                setMovieList([]);
            } else {
                setMovieList(movies);
            }

            if (query && movies.length > 0) {
                await updateSearchCount(query, movies[0]);
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
            const movies = await getTrendingMovies();
            setTrendingMovies(movies || []);
        } catch (error) {
            console.error('Error loading trending movies:', error);
        }
    };

    useEffect(() => {
        if (debouncedSearchTerm) {
            fetchMovies(debouncedSearchTerm);
        } else {
            fetchMovies();
        }
    }, [debouncedSearchTerm]);

    useEffect(() => {
        loadTrendingMovies();
    }, []);

    return (
        <main>
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

                <section className="all-movies">
                    <h2>
                        {debouncedSearchTerm ? `Results for "${debouncedSearchTerm}"` : 'Popular Movies'}
                    </h2>

                    {isLoading ? (
                        <Spinner />
                    ) : errorMessage ? (
                        <p className="error-message">{errorMessage}</p>
                    ) : (
                        <ul>
                            {movieList.map(movie => (
                                <MovieCard key={movie.id} movie={movie} />
                            ))}
                        </ul>
                    )}
                </section>
            </div>
        </main>
    );
};

export default App;