import requests
from bs4 import BeautifulSoup
import logging
import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("BoxOfficeScraper")

def scrape_box_office_mojo(year=None):
    """
    Scrapes movies currently running in theaters for the specified year from Box Office Mojo.
    Defaults to the current calendar year at runtime — never hardcoded.
    """
    if year is None:
        year = datetime.datetime.now().year

    url = f"https://www.boxofficemojo.com/year/{year}/"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
    }

    logger.info(f"Fetching Box Office Mojo yearly theatrical chart: {url}")
    movies = []
    try:
        res = requests.get(url, headers=headers, timeout=15)
        if res.status_code != 200:
            logger.warning(f"Box Office Mojo status code: {res.status_code}")
            return []

        soup = BeautifulSoup(res.text, "html.parser")
        rows = soup.select("table tr")

        for row in rows[1:60]:
            cols = row.find_all("td")
            if len(cols) >= 6:
                title = cols[1].text.strip()
                gross = cols[5].text.strip()  # Total Gross
                # Fallback to current year string if release day column is missing
                release_day = cols[8].text.strip() if len(cols) > 8 else str(year)

                if title and gross and gross != "-":
                    movies.append({
                        "title": title,
                        "worldwide_gross": gross,
                        "year": year,
                        "release_day": release_day,
                        "source": "BoxOfficeMojo",
                        "status": "IN_THEATERS"
                    })

        logger.info(f"Scraped {len(movies)} theatrical movies from Box Office Mojo ({year})")
        return movies
    except Exception as e:
        logger.error(f"Error scraping Box Office Mojo: {e}")
        return []

if __name__ == "__main__":
    res = scrape_box_office_mojo()
    print(f"Scraped Box Office sample ({len(res)} total): {res[:3] if res else 'None'}")
