import React, {useState, useEffect} from 'react'
import Search from "./Components/Search.jsx";

const API_BASE_URL = 'https://api.trakt.tv/shows/trending';
const API_KEY = import.meta.env.VITE_TRAK_API_KEY;
const API_OPTIONS = {
    method: 'GET',
    headers: {
        'Content-Type': 'application/json',
        'trakt-api-version': '2',
        'trakt-api-key': API_KEY
    }
}
const App = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [movieList, setMovieList] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchMovies = async () => {
        setIsLoading(true);
        setErrorMessage('');

        try {
            const endpoint = `${API_BASE_URL}`;
            const response = await fetch(endpoint,API_OPTIONS);
            if(!response.ok) {
                throw new Error(`Failed to fetch movies`);
            }
            const data = await response.json();
            if (Array.isArray(data)) {
                setMovieList(data);
            } else {
                setMovieList([]);
                setErrorMessage("Received an unexpected response from the server.");
            }
        }catch (error) {
            console.log('${error}', error);
            setErrorMessage(error.message + 'error fetching movies,please tryagain later');
        }finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchMovies();
    }, []);

    return (
        <main>
        <div className= "pattern" />
        <div className= "wrapper">
            <header>
                <img src="./hero.png" alt={"Hero Banner"}/>
                <h1>Find <span className="text-gradient">Movies</span>You'll Enjoy Without Hassle!!</h1>
                <Search searchTerm = {searchTerm} setSearchTerm={setSearchTerm} />
            </header>
            <section className= "all-movies">
                <h2>All Movies</h2>
                {isLoading ? (
                    <p className="text-white">Loading...</p>
                ):errorMessage ?(
                    <p className="text-red-500">{errorMessage}</p>
                ):(
                    <ul>
                        {movieList.map(item => (
                            <li key={item.movie.ids.trakt}>
                                <p className="text-white">{item.movie.title}</p>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

        </div>
        </main>
    )
}
export default App
