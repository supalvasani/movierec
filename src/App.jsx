import React, { useState, useEffect } from 'react';
import Search from "./Components/Search.jsx";
import Spinner from './Components/Spinner.jsx';
import MovieCard from "./Components/MovieCard.jsx";
import { useDebounce } from "react-use";
import { getTrendingMovies, updateSearchCount } from "./appwrite.js";

const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const API_BASE_URL = 'https://api.themoviedb.org/3/';
const API_OPTIONS = {
    method: 'GET',
    headers: {
        accept: 'application/json',
        authorization: 'Bearer ' + API_KEY,
    }
};

const App = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [movieList, setMovieList] = useState([]);
    const [errorMessage, setErrorMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [trendingMovies, setTrendingMovies] = useState('');

    useDebounce(() => {
        setDebouncedSearchTerm(searchTerm);
    }, 500, [searchTerm]);

    const fetchMovies = async (query = '') => {
        setIsLoading(true);
        setErrorMessage('');
        try {
            const endpoint = query
                ? `${API_BASE_URL}/search/movie?query=${encodeURIComponent(query)}`
                : `${API_BASE_URL}/discover/movie?sort_by=popularity.desc`;

            const response = await fetch(endpoint, API_OPTIONS);

            if (!response.ok) {
                throw new Error(`Failed to fetch movies: ${response.statusText}`);
            }

            const data = await response.json();

            if (query && data.results.length === 0) {
                setErrorMessage('No movies found for that search term.');
                setMovieList([]); // Clear the list to show nothing
            } else {
                setMovieList(data.results || []);
            }

            if (query && data.results.length > 0) {
                await updateSearchCount(query, data.results[0]);
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
            setTrendingMovies(movies);
        } catch (error) {
            console.error('Error loading trending movies:', error);
        }
    }

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
                    <img src="./hero.png" alt={"Hero Banner"} />
                    <h1>Find <span className="text-gradient">Movies</span>You'll Enjoy Without Hassle!!</h1>
                </header>
                {trendingMovies.length > 0 && (
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