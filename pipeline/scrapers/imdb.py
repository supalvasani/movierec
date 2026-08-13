import requests
from bs4 import BeautifulSoup
import json
import logging
import urllib.parse
import os

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("IMDbScraper")

OMDB_API_KEY = os.getenv("VITE_OMDB_API_KEY") or "trilogy"

def scrape_imdb_in_theaters():
    """
    Scrapes live trending movies from IMDb Movie Meter with fallback enrichment via OMDb API.
    """
    url = "https://www.imdb.com/chart/moviemeter/"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9"
    }

    logger.info(f"Fetching IMDb Movie Meter: {url}")
    scraped_movies = []
    try:
        res = requests.get(url, headers=headers, timeout=10)
        if res.status_code == 200:
            soup = BeautifulSoup(res.text, "html.parser")
            script = soup.find("script", id="__NEXT_DATA__")

            if script and script.string:
                data = json.loads(script.string)
                props = data.get("props", {}).get("pageProps", {})
                chart_titles = props.get("pageData", {}).get("chartTitles", {}).get("edges", [])

                for edge in chart_titles[:40]:
                    node = edge.get("node", {})
                    title = node.get("titleText", {}).get("text", "")
                    year = node.get("releaseYear", {}).get("year") or None
                    rating = node.get("ratingsSummary", {}).get("aggregateRating")
                    vote_count = node.get("ratingsSummary", {}).get("voteCount", 0)
                    poster = node.get("primaryImage", {}).get("url") if node.get("primaryImage") else None
                    genres_list = [g.get("text") for g in node.get("titleGenres", {}).get("genres", []) if g.get("text")]

                    if title:
                        scraped_movies.append({
                            "title": title,
                            "year": year,
                            "rating": float(rating) if rating else None,
                            "votes": vote_count,
                            "poster_url": poster,
                            "genre": ", ".join(genres_list) if genres_list else "Drama",
                            "source": "IMDb"
                        })
        else:
            logger.warning(f"IMDb direct scraper status code {res.status_code}. Initiating live OMDb trend search fallback...")
            fallback_terms = ["Marvel", "Avengers", "Spider-Man", "Batman", "Dune"]
            for term in fallback_terms:
                try:
                    search_url = f"https://www.omdbapi.com/?apikey={OMDB_API_KEY}&s={urllib.parse.quote(term)}&type=movie"
                    f_res = requests.get(search_url, timeout=5)
                    if f_res.status_code == 200:
                        f_data = f_res.json()
                        if f_data.get("Response") == "True" and f_data.get("Search"):
                            for item in f_data["Search"][:4]:
                                scraped_movies.append({
                                    "title": item.get("Title"),
                                    "year": int(item.get("Year", "2024")[:4]) if item.get("Year", "")[:4].isdigit() else 2024,
                                    "poster_url": item.get("Poster") if item.get("Poster") != "N/A" else None,
                                    "source": "IMDb"
                                })
                except Exception as ex:
                    logger.debug(f"OMDb fallback query error for term '{term}': {ex}")

    except Exception as e:
        logger.error(f"Error scraping IMDb: {e}")

    logger.info(f"Dynamically scraped {len(scraped_movies)} movies from IMDb/Trending source")
    return scraped_movies

if __name__ == "__main__":
    res = scrape_imdb_in_theaters()
    print(f"IMDb live sample: {res[:2] if res else 'None'}")
