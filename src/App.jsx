import React, { useState, useEffect } from 'react';
import Search from "./Components/Search.jsx";
import Spinner from './Components/Spinner.jsx'; // Assuming you have a Spinner component

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

    const fetchMovies = async () => {
        setIsLoading(true);
        setErrorMessage('');
        console.log("Starting movie fetch...");
        try {
            const endpoint = `${API_BASE_URL}/discover/movie?sort_by=popularity.desc`;
            const response = await fetch(endpoint, API_OPTIONS);
            console.log("API Response Status:", response.status);

            if (!response.ok) {
                throw new Error(`Failed to fetch movies: ${response.statusText} (check API key)`);
            }
            const data = await response.json();
            if(data.Response === 'False'){
                setErrorMessage(data.Error || 'Failed to fetch movies. ');
                setMovieList([]);
                return;
            }

            setMovieList(data.results || []);

        } catch (error) {
            console.error('Error fetching movies:', error);
            setErrorMessage(error.message);
        } finally {
            setIsLoading(false);
            console.log("Finished movie fetch.");
        }
    };

    useEffect(() => {
        fetchMovies();
    }, []);

    return (
        <main>
            <div className="pattern" />
            <div className="wrapper">
                <header>
                    <img src="./hero.png" alt={"Hero Banner"} />
                    <h1>Find <span className="text-gradient">Movies</span>You'll Enjoy Without Hassle!!</h1>
                </header>
                <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

                <section className="all-movies">
                    <h2 className="mt-[40px]">
                        Trending Movies
                    </h2>

                    {isLoading ? (
                      <Spinner />
                    ) : errorMessage ? (
                        <p className= "text-red-500">{errorMessage}</p>
                    ) : (
                        <ul>
                            {movieList.map(movie => (
                                <p key = {movie.id} className="text-white">{movie.title}</p>
                            ))}
                        </ul>
                    )
                    }
                </section>
            </div>
        </main>
    );
};

export default App;