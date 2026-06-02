/**
 * Fetch movies from OMDb API.
 * Normalizes movie items to match UI structure and performs parallel sub-queries
 * to retrieve details like imdbRating and Language.
 * @param {string} query Search query or defaults to popular search terms
 * @returns {Promise<Array>} List of movies
 */
export const fetchMoviesFromOMDb = async (query = '', page = 1) => {
    const apiKey = import.meta.env.VITE_OMDB_API_KEY;
    if (!apiKey) {
        console.error("OMDb API Key is not set in env variables.");
        return { movies: [], hasMore: false };
    }

    const searchTerm = query ? query.trim() : 'popular';
    const url = `https://www.omdbapi.com/?apikey=${apiKey}&s=${encodeURIComponent(searchTerm)}&type=movie&page=${page}`;

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch movies from OMDb: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.Response === "False") {
        return { movies: [], hasMore: false };
    }

    const searchResults = data.Search || [];

    // Fetch detail specs (like imdbRating and Language) in parallel for each movie
    const detailedMovies = await Promise.all(
        searchResults.map(async (movie) => {
            try {
                const detailUrl = `https://www.omdbapi.com/?apikey=${apiKey}&i=${movie.imdbID}`;
                const detailRes = await fetch(detailUrl);
                if (detailRes.ok) {
                    const detailData = await detailRes.json();
                    return {
                        id: movie.imdbID,
                        title: movie.Title,
                        poster_url: movie.Poster !== 'N/A' ? movie.Poster : null,
                        release_date: movie.Year,
                        vote_average: detailData.imdbRating && detailData.imdbRating !== 'N/A' ? parseFloat(detailData.imdbRating) : null,
                        original_language: detailData.Language ? detailData.Language.split(',')[0].trim() : 'en',
                        poster_path: movie.Poster !== 'N/A' ? movie.Poster : null,
                        // Extra modal data
                        plot: detailData.Plot !== 'N/A' ? detailData.Plot : 'No plot available.',
                        genre: detailData.Genre !== 'N/A' ? detailData.Genre : 'Unknown',
                        director: detailData.Director !== 'N/A' ? detailData.Director : 'Unknown',
                        actors: detailData.Actors !== 'N/A' ? detailData.Actors : 'Unknown',
                        runtime: detailData.Runtime !== 'N/A' ? detailData.Runtime : 'Unknown',
                        box_office: detailData.BoxOffice !== 'N/A' ? detailData.BoxOffice : 'N/A',
                        awards: detailData.Awards !== 'N/A' ? detailData.Awards : 'None'
                    };
                }
            } catch (e) {
                console.error("Error fetching movie details from OMDb:", e);
            }
            return {
                id: movie.imdbID,
                title: movie.Title,
                poster_url: movie.Poster !== 'N/A' ? movie.Poster : null,
                release_date: movie.Year,
                vote_average: null,
                original_language: 'en',
                poster_path: movie.Poster !== 'N/A' ? movie.Poster : null,
                plot: 'No plot available.',
                genre: 'Unknown',
                director: 'Unknown',
                actors: 'Unknown',
                runtime: 'Unknown',
                box_office: 'N/A',
                awards: 'None'
            };
        })
    );

    return { movies: detailedMovies, hasMore: searchResults.length === 10 };
};

export const fetchCuratedTrendingMovies = async () => {
    const apiKey = import.meta.env.VITE_OMDB_API_KEY;
    if (!apiKey) return [];

    const curatedIds = [
        'tt1375666', // Inception
        'tt0468569', // The Dark Knight
        'tt0816692', // Interstellar
        'tt0137523', // Fight Club
        'tt0110912', // Pulp Fiction
        'tt1160419', // Dune
        'tt1877830', // The Batman
        'tt3862712', // Spider-Man: Into the Spider-Verse
        'tt0109830', // Forrest Gump
        'tt0120737'  // The Lord of the Rings
    ];

    try {
        const movies = await Promise.all(
            curatedIds.map(async (id) => {
                const url = `https://www.omdbapi.com/?apikey=${apiKey}&i=${id}`;
                const res = await fetch(url);
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.Poster && data.Poster !== 'N/A') {
                        return {
                            $id: id,
                            title: data.Title,
                            poster_url: data.Poster
                        };
                    }
                }
                return null;
            })
        );
        return movies.filter(Boolean);
    } catch (e) {
        console.error("Error fetching curated trending movies:", e);
        return [];
    }
};
