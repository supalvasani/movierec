import requests
from bs4 import BeautifulSoup
import json
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("IMDbScraper")

def scrape_imdb_in_theaters():
    """
    Scrapes live top movies and movie meter titles from IMDb.
    """
    url = "https://www.imdb.com/chart/moviemeter/"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9"
    }

    logger.info(f"Fetching IMDb Movie Meter: {url}")
    scraped_movies = []
    try:
        res = requests.get(url, headers=headers, timeout=12)
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
                    year = node.get("releaseYear", {}).get("year", 2026)
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
            logger.warning(f"IMDb response status: {res.status_code}")
    except Exception as e:
        logger.error(f"Error scraping IMDb: {e}")

    logger.info(f"Dynamically scraped {len(scraped_movies)} movies from IMDb")
    return scraped_movies

if __name__ == "__main__":
    res = scrape_imdb_in_theaters()
    print(f"IMDb live sample: {res[:2] if res else 'None'}")
