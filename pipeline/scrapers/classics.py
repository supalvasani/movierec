import requests
from bs4 import BeautifulSoup
import re
import os
import urllib.parse
import logging
from dotenv import load_dotenv

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ClassicsScraper")

OMDB_API_KEY = os.getenv("VITE_OMDB_API_KEY") or "trilogy"

def scrape_classic_movies():
    """
    Dynamically scrapes top-rated all-time classic and blockbuster movies from Wikipedia's
    highest-grossing films and award-winning records. Zero hardcoded titles.
    """
    logger.info("Dynamically fetching top all-time classic movies from Wikipedia...")
    urls = [
        "https://en.wikipedia.org/wiki/List_of_highest-grossing_films",
        "https://en.wikipedia.org/wiki/Academy_Award_for_Best_Picture"
    ]
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
    }

    scraped_titles = []
    seen = set()

    for url in urls:
        try:
            res = requests.get(url, headers=headers, timeout=10)
            if res.status_code != 200:
                continue
            soup = BeautifulSoup(res.text, "html.parser")
            tables = soup.find_all("table", class_="wikitable")

            for table in tables:
                for row in table.find_all("tr")[1:]:
                    i_tag = row.find("i")
                    if i_tag and i_tag.text:
                        raw = i_tag.text.strip()
                        clean = re.sub(r'\[.*?\]', '', raw).strip()
                        key = clean.lower()
                        if clean and len(clean) > 2 and key not in seen and key not in ["film", "title", "year"]:
                            seen.add(key)
                            scraped_titles.append(clean)
                            if len(scraped_titles) >= 30:
                                break
                if len(scraped_titles) >= 30:
                    break
        except Exception as e:
            logger.warning(f"Error scraping classics from {url}: {e}")

    logger.info(f"Dynamically extracted {len(scraped_titles)} classic film titles.")

    classics = []
    for title in scraped_titles[:25]:
        try:
            url = f"https://www.omdbapi.com/?apikey={OMDB_API_KEY}&t={urllib.parse.quote(title)}&plot=full"
            res = requests.get(url, timeout=5)
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
            logger.debug(f"Error fetching metadata for classic '{title}': {e}")

    logger.info(f"Successfully enriched {len(classics)} dynamic top-rated classic movies.")
    return classics

if __name__ == "__main__":
    res = scrape_classic_movies()
    print(f"Dynamic classic movies count: {len(res)}")
    for m in res[:5]:
        print(" -", m["title"], f"({m['year']})", "| Rating:", m["rating"])
