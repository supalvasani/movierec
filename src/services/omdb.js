/**
 * Fetch movies from OMDb API.
 * Normalizes movie items to match UI structure and performs parallel sub-queries
 * to retrieve details like imdbRating and Language.
 * @param {string} query Search query or defaults to popular search terms
 * @returns {Promise<Array>} List of movies
 */
export const fetchMoviesFromOMDb = async (query = '') => {
    const apiKey = import.meta.env.VITE_OMDB_API_KEY;
    if (!apiKey) {
        console.error("OMDb API Key is not set in env variables.");
        return [];
    }

    const searchTerm = query ? query.trim() : 'Avengers';
    const url = `https://www.omdbapi.com/?apikey=${apiKey}&s=${encodeURIComponent(searchTerm)}&type=movie`;

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch movies from OMDb: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.Response === "False") {
        return [];
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
                        poster_path: movie.Poster !== 'N/A' ? movie.Poster : null
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
                poster_path: movie.Poster !== 'N/A' ? movie.Poster : null
            };
        })
    );

    return detailedMovies;
};
