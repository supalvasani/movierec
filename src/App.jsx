import React, { useState, useEffect } from 'react';
import Search from "./Components/Search.jsx";
import Spinner from './Components/Spinner.jsx'; // Assuming you have a Spinner component

const API_KEY = import.meta.env.VITE_TRAK_API_KEY;

const API_OPTIONS = {
    method: 'GET',
    headers: {
        'Content-Type': 'application/json',
        'trakt-api-version': '2',
        'trakt-api-key': API_KEY
    }
};

const App = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [movieList, setMovieList] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchMovies = async () => {
        setIsLoading(true);
        setErrorMessage('');
        console.log("Starting movie fetch...");

        if (!API_KEY) {
            console.error("API Key is missing! Check your .env.local file.");
            setErrorMessage("API Key is missing. Please check your configuration.");
            setIsLoading(false);
            return;
        }

        try {
            // --- FIX: Changed endpoint from /shows/trending to /movies/trending ---
            const endpoint = 'https://api.trakt.tv/movies/trending';
            const response = await fetch(endpoint, API_OPTIONS);
            console.log("API Response Status:", response.status);

            if (!response.ok) {
                throw new Error(`Failed to fetch movies: ${response.statusText} (check API key)`);
            }
            const data = await response.json();
            console.log("Data received from API:", data);

            if (Array.isArray(data)) {
                setMovieList(data);
            } else {
                setMovieList([]);
                setErrorMessage("Received an unexpected response from the server.");
            }

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
                    <h2 className="text-2xl font-bold text-white sm:text-3xl mb-5">
                        Trending Movies
                    </h2>

                    {isLoading ? (
                        <Spinner />
                    ) : errorMessage ? (
                        <p className="text-red-500">{errorMessage}</p>
                    ) : (
                        movieList.length > 0 ? (
                            <ul className="space-y-4"> {/* Added spacing between list items */}
                                {movieList.map(item => (
                                    <li key={item.movie.ids.trakt}>
                                        <p className="text-white text-lg">{item.movie.title}</p>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-white">No movies found.</p>
                        )
                    )}
                </section>
            </div>
        </main>
    );
};

export default App;