import requests
from bs4 import BeautifulSoup
import re
import logging
import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("BookMyShowScraper")

def clean_bms_title(raw_text):
    if not raw_text:
        return ""
    # Strip certification badges (UA13+, UA16+, A, U, etc.) and language suffixes
    cleaned = re.split(r'(?:UA\d*\+?|A|U|UA)\b', raw_text)[0]
    cleaned = cleaned.strip()
    return cleaned if len(cleaned) > 1 else raw_text.strip()

def scrape_bookmyshow_movies():
    """
    Dynamically scrapes movies currently showing and trending on BookMyShow India.
    Year is set to the current calendar year at runtime — never hardcoded.
    """
    current_year = datetime.datetime.now().year

    urls = [
        "https://in.bookmyshow.com/explore/movies-mumbai",
        "https://in.bookmyshow.com/explore/movies-national-capital-region-ncr"
    ]
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    }

    scraped_movies = []
    seen_titles = set()

    for url in urls:
        logger.info(f"Fetching BookMyShow theatrical movies: {url}")
        try:
            res = requests.get(url, headers=headers, timeout=12)
            if res.status_code != 200:
                logger.warning(f"BookMyShow returned status {res.status_code}")
                continue

            soup = BeautifulSoup(res.text, "html.parser")
            for a in soup.find_all("a", href=re.compile(r"/movies/")):
                img = a.find("img")
                raw_title = a.text.strip() or (img.get("alt") if img else None)
                poster = img.get("src") if img else None

                if raw_title:
                    clean_title = clean_bms_title(raw_title)
                    key = clean_title.lower()

                    if clean_title and len(clean_title) > 2 and key not in ["movies", "buy tickets", "see all"] and key not in seen_titles:
                        seen_titles.add(key)
                        scraped_movies.append({
                            "title": clean_title,
                            # Use current year as initial placeholder.
                            # OMDb enrichment in transform.py will overwrite this
                            # with the actual release year from the API.
                            "year": current_year,
                            "poster_url": poster,
                            "source": "BookMyShow",
                            "status": "IN_THEATERS",
                            "worldwide_gross": "In Theaters"
                        })
        except Exception as e:
            logger.error(f"Error scraping BookMyShow URL {url}: {e}")

    logger.info(f"Dynamically scraped {len(scraped_movies)} movies from BookMyShow")
    return scraped_movies

if __name__ == "__main__":
    res = scrape_bookmyshow_movies()
    print(f"BookMyShow sample ({len(res)} total):")
    for m in res[:5]:
        print(" -", m["title"], "| Poster:", bool(m["poster_url"]))
