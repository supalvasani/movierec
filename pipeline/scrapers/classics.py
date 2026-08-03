import requests
import os
import urllib.parse
import logging
from dotenv import load_dotenv

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ClassicsScraper")

OMDB_API_KEY = os.getenv("VITE_OMDB_API_KEY") or "trilogy"

TOP_CLASSIC_TITLES = [
    "The Shawshank Redemption", "The Godfather", "The Dark Knight",
    "Pulp Fiction", "Schindler's List", "Inception", "Interstellar",
    "Fight Club", "Forrest Gump", "Spirited Away", "The Matrix",
    "Goodfellas", "Parasite", "Oppenheimer", "Gladiator", "Whiplash",
    "Spider-Man: Into the Spider-Verse", "The Prestige", "Se7en", "The Silence of the Lambs"
]

def scrape_classic_movies():
    logger.info("Fetching IMDb Top Rated classic movies...")
    classics = []
    
    for title in TOP_CLASSIC_TITLES:
        try:
            url = f"https://www.omdbapi.com/?apikey={OMDB_API_KEY}&t={urllib.parse.quote(title)}&plot=full"
            res = requests.get(url, timeout=6)
            if res.status_code == 200:
                d = res.json()
                if d.get("Response") == "True":
                    rating_val = d.get("imdbRating")
                    year_val = d.get("Year", "2000")
                    year_int = int(year_val[:4]) if year_val[:4].isdigit() else 2000
                    poster = d.get("Poster")
                    
                    if poster and poster != "N/A":
                        classics.append({
                            "title": d.get("Title"),
                            "year": year_int,
                            "rating": float(rating_val) if rating_val and rating_val != "N/A" else 8.5,
                            "votes": 1000000,
                            "director": d.get("Director", "Unknown"),
                            "cast_members": d.get("Actors", "Unknown"),
                            "studio": "Classic Studio",
                            "genre": d.get("Genre", "Classic / Drama"),
                            "poster_url": poster,
                            "worldwide_gross": "Top Rated Classic",
                            "status": "CLASSIC",
                            "plot": d.get("Plot"),
                            "runtime": d.get("Runtime"),
                            "imdb_id": d.get("imdbID"),
                            "source": "IMDb Top Rated"
                        })
        except Exception as e:
            logger.debug(f"Error fetching classic {title}: {e}")
            
    logger.info(f"Dynamically scraped {len(classics)} top rated classic movies.")
    return classics

if __name__ == "__main__":
    res = scrape_classic_movies()
    print(f"Classic movies count: {len(res)}")
    for m in res[:5]:
        print(" -", m["title"], f"({m['year']})", "| Rating:", m["rating"])
