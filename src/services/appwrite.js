import { Client, Databases, Query, ID } from 'appwrite';

const PROJECT_ID = import.meta.env.VITE_APPWRITE_PROJECT_ID;
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE;
const COLLECTION_ID = import.meta.env.VITE_APPWRITE_COLLECTION_ID;

const ENDPOINT = import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';

const client = new Client()
    .setEndpoint(ENDPOINT)
    .setProject(PROJECT_ID);

const database = new Databases(client);

/**
 * Increments the search count for a term, or creates a new entry if it doesn't exist.
 * @param {string} searchTerm The search term entered by the user
 * @param {object} movie The first movie result from the search
 */
export const updateSearchCount = async (searchTerm, movie) => {
    try {
        const result = await database.listDocuments(DATABASE_ID, COLLECTION_ID, [
            Query.equal('searchTerm', searchTerm),
        ]);
        
        if (result.documents.length > 0) {
            const doc = result.documents[0];
            await database.updateDocument(DATABASE_ID, COLLECTION_ID, doc.$id, {
                count: doc.count + 1,
            });
        } else {
            // Strip any non-numeric characters from the movie ID (e.g., 'tt123456' -> 123456)
            // since the Appwrite database schema defines movie_id as an Integer attribute.
            const cleanMovieId = typeof movie.id === 'string'
                ? parseInt(movie.id.replace(/\D/g, ''), 10)
                : parseInt(movie.id, 10) || 0;

            await database.createDocument(DATABASE_ID, COLLECTION_ID, ID.unique(), {
                searchTerm,
                count: 1,
                movie_id: cleanMovieId,
                poster_url: movie.poster_url || movie.poster_path || '',
            });
        }
    } catch (e) {
        console.error('Error updating search count in Appwrite:', e);
    }
};

/**
 * Retrieves the trending movies from Appwrite database based on search counts.
 * @returns {Promise<Array>} List of trending movie documents
 */
export const getTrendingMovies = async () => {
    try {
        const result = await database.listDocuments(DATABASE_ID, COLLECTION_ID, [
            Query.limit(10),
            Query.orderDesc('count'),
        ]);
        return result.documents;
    } catch (error) {
        console.error('Error getting trending movies from Appwrite:', error);
        return [];
    }
};
