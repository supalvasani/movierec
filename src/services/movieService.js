/**
 * Movie Service — fetches live data for movie details, trailers, and search
 * Uses OMDb API for search + details with fallback logic for upcoming titles.
 */

const OMDB_KEY = import.meta.env.VITE_OMDB_API_KEY || 'trilogy';
const OMDB_BASE = 'https://www.omdbapi.com';

const SCRAPE_QUERIES = [
    'Batman', 'Spider-Man', 'Marvel', 'Avengers', 'Star', 'Dark', 'Mission',
    'Kingdom', 'World', 'Fast', 'Matrix', 'Alien', 'Super', 'Agent', 'God', 'Life'
];

/**
 * Live Scrape function called when user reaches end of list — scrapes new movies on demand
 */
export async function scrapeMoreMovies(scrapeIndex = 0) {
    try {
        const query = SCRAPE_QUERIES[scrapeIndex % SCRAPE_QUERIES.length];
        const page = Math.floor(scrapeIndex / SCRAPE_QUERIES.length) + 1;
        
        const res = await fetch(
            `${OMDB_BASE}/?apikey=${OMDB_KEY}&s=${encodeURIComponent(query)}&type=movie&page=${page}`
        );
        const data = await res.json();
        if (data.Response === 'False') return [];

        const detailed = await Promise.allSettled(
            (data.Search || []).slice(0, 8).map(m => fetchMovieDetail(m.imdbID))
        );
        
        return detailed
            .map(r => r.status === 'fulfilled' ? r.value : null)
            .filter(m => m && m.poster_url && m.poster_url !== 'N/A')
            .map(m => ({
                ...m,
                status: 'CLASSIC',
                source: 'Dynamic Live Scraper'
            }));
    } catch (e) {
        console.error('Dynamic scraper error:', e);
        return [];
    }
}

/**
 * Search OMDb for a query — used for the search bar (older movies)
 */
export async function searchMovies(query, page = 1) {
    try {
        const res = await fetch(
            `${OMDB_BASE}/?apikey=${OMDB_KEY}&s=${encodeURIComponent(query)}&type=movie&page=${page}`
        );
        const data = await res.json();
        if (data.Response === 'False') return { movies: [], total: 0 };

        const detailed = await Promise.allSettled(
            (data.Search || []).map(m => fetchMovieDetail(m.imdbID))
        );
        return {
            movies: detailed.map(r => r.status === 'fulfilled' ? r.value : null).filter(Boolean),
            total: parseInt(data.totalResults || '0', 10)
        };
    } catch (e) {
        console.error('OMDb search error:', e);
        return { movies: [], total: 0 };
    }
}

/**
 * Fetch full movie detail by IMDb ID
 */
export async function fetchMovieDetail(imdbId) {
    try {
        const res = await fetch(`${OMDB_BASE}/?apikey=${OMDB_KEY}&i=${imdbId}&plot=full`);
        const d = await res.json();
        if (d.Response === 'False') return null;
        return normalizeOMDb(d);
    } catch (e) {
        console.error('OMDb detail error:', e);
        return null;
    }
}

/**
 * Fetch movie detail by title with fallback if strict year param fails
 */
export async function fetchMovieDetailByTitle(title, year) {
    try {
        if (year) {
            const res = await fetch(
                `${OMDB_BASE}/?apikey=${OMDB_KEY}&t=${encodeURIComponent(title)}&y=${year}&plot=full`
            );
            const d = await res.json();
            if (d.Response === 'True') {
                return normalizeOMDb(d);
            }
        }

        const resFallback = await fetch(
            `${OMDB_BASE}/?apikey=${OMDB_KEY}&t=${encodeURIComponent(title)}&plot=full`
        );
        const dFallback = await resFallback.json();
        if (dFallback.Response === 'True') {
            return normalizeOMDb(dFallback);
        }

        return null;
    } catch (e) {
        console.error('OMDb title lookup error:', e);
        return null;
    }
}

/**
 * Fetch official HD movie trailer video preview URL dynamically from iTunes Catalog
 */
export async function fetchTrailerVideo(title) {
    try {
        const cleanTitle = title.replace(/[^a-zA-Z0-9\s]/g, '').trim();
        const res = await fetch(
            `https://itunes.apple.com/search?media=movie&entity=movie&term=${encodeURIComponent(cleanTitle)}`
        );
        const data = await res.json();
        if (data.results && data.results.length > 0) {
            const match = data.results.find(r => r.previewUrl) || data.results[0];
            return match.previewUrl || null;
        }
    } catch (e) {
        console.error('iTunes trailer preview fetch error:', e);
    }
    return null;
}

function normalizeOMDb(d) {
    return {
        imdb_id: d.imdbID,
        title: d.Title,
        year: d.Year,
        rating: d.imdbRating !== 'N/A' ? parseFloat(d.imdbRating) : null,
        votes: d.imdbVotes !== 'N/A' ? d.imdbVotes : null,
        poster_url: d.Poster !== 'N/A' ? d.Poster : null,
        genre: d.Genre !== 'N/A' ? d.Genre : 'Unknown',
        director: d.Director !== 'N/A' ? d.Director : 'Unknown',
        cast_members: d.Actors !== 'N/A' ? d.Actors : 'Unknown',
        plot: d.Plot !== 'N/A' ? d.Plot : null,
        runtime: d.Runtime !== 'N/A' ? d.Runtime : null,
        language: d.Language !== 'N/A' ? d.Language : null,
        country: d.Country !== 'N/A' ? d.Country : null,
        awards: d.Awards !== 'N/A' ? d.Awards : null,
        box_office: d.BoxOffice !== 'N/A' ? d.BoxOffice : null,
        rated: d.Rated !== 'N/A' ? d.Rated : null,
        ratings: d.Ratings || [],
    };
}

export function getTrailerSearchUrl(title, year) {
    const query = encodeURIComponent(`${title} ${year || ''} official trailer`);
    return `https://www.youtube.com/results?search_query=${query}`;
}
