import requests
from bs4 import BeautifulSoup
import re
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("WikipediaScraper")

def scrape_wikipedia_movies(year=2026, limit=40):
    """
    Dynamically scrapes upcoming and released movies from Wikipedia's year-in-film catalog.
    No hardcoded movie arrays.
    """
    urls = [
        f"https://en.wikipedia.org/wiki/{year}_in_film",
        f"https://en.wikipedia.org/wiki/List_of_American_films_of_{year}"
    ]
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
    }

    scraped_movies = []
    seen_titles = set()

    for url in urls:
        logger.info(f"Fetching Wikipedia film catalog: {url}")
        try:
            res = requests.get(url, headers=headers, timeout=10)
            if res.status_code != 200:
                logger.warning(f"Wikipedia returned status code {res.status_code} for {url}")
                continue

            soup = BeautifulSoup(res.text, "html.parser")
            tables = soup.find_all("table", class_="wikitable")

            for table in tables:
                if len(scraped_movies) >= limit:
                    break

                rows = table.find_all("tr")
                if not rows:
                    continue

                headers_list = [th.text.strip().lower() for th in rows[0].find_all(["th", "td"])]
                if any("title" in h for h in headers_list):
                    title_idx = next((i for i, h in enumerate(headers_list) if "title" in h), 0)
                    dir_idx = next((i for i, h in enumerate(headers_list) if "director" in h), -1)
                    studio_idx = next((i for i, h in enumerate(headers_list) if "studio" in h or "distributor" in h or "production" in h), -1)

                    for row in rows[1:]:
                        if len(scraped_movies) >= limit:
                            break

                        cols = row.find_all(["td", "th"])
                        if len(cols) > title_idx:
                            raw_title = cols[title_idx].text.strip()
                            clean_title = re.sub(r'\[.*?\]', '', raw_title).replace('†', '').strip()

                            director = cols[dir_idx].text.strip() if dir_idx != -1 and len(cols) > dir_idx else "Unknown"
                            studio = cols[studio_idx].text.strip() if studio_idx != -1 and len(cols) > studio_idx else "Unknown"

                            director = re.sub(r'\[.*?\]', '', director).strip()
                            studio = re.sub(r'\[.*?\]', '', studio).strip()

                            key = clean_title.lower()
                            if clean_title and len(clean_title) > 1 and key not in ["title", "nan", "none", "unknown"] and key not in seen_titles:
                                seen_titles.add(key)
                                scraped_movies.append({
                                    "title": clean_title,
                                    "year": year,
                                    "director": director if director else "Unknown",
                                    "studio": studio if studio else "Unknown",
                                    "source": "Wikipedia"
                                })
        except Exception as e:
            logger.error(f"Error scraping Wikipedia URL {url}: {e}")

    logger.info(f"Dynamically scraped {len(scraped_movies)} movies from Wikipedia ({year})")
    return scraped_movies

if __name__ == "__main__":
    res = scrape_wikipedia_movies(2026)
    print(f"Sample scraped titles ({len(res)} total): {[m['title'] for m in res[:5]]}")
