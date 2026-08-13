import pandas as pd
import math
import requests
import logging
import os
import re
import datetime
import urllib.parse
import concurrent.futures
from dotenv import load_dotenv

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("DataTransformer")

OMDB_API_KEY = os.getenv("VITE_OMDB_API_KEY") or "trilogy"

# Reusable HTTP Session with connection pooling for ultra-fast parallel requests
HTTP_SESSION = requests.Session()
adapter = requests.adapters.HTTPAdapter(pool_connections=25, pool_maxsize=25)
HTTP_SESSION.mount("https://", adapter)
HTTP_SESSION.mount("http://", adapter)

def clean_val(val):
    if val is None:
        return None
    if isinstance(val, float) and (math.isnan(val) or math.isinf(val)):
        return None
    if str(val).lower() in ["nan", "none"]:
        return None
    return val

def clean_bms_title(raw_text):
    if not raw_text:
        return ""
    cleaned = re.split(r'(?:UA\d*\+?|A|U|UA)\b', raw_text)[0].strip()
    return cleaned if len(cleaned) > 1 else raw_text.strip()

def fetch_omdb_metadata(title):
    if not OMDB_API_KEY:
        return {}
    
    clean_title = re.sub(r'\[.*?\]', '', title)
    clean_title = re.sub(r'\s+', ' ', clean_title).strip()
    
    try:
        url = f"https://www.omdbapi.com/?apikey={OMDB_API_KEY}&t={urllib.parse.quote(clean_title)}&plot=full"
        res = HTTP_SESSION.get(url, timeout=3.0)
        data = res.json() if res.status_code == 200 else {}
        
        if data.get("Response") != "True":
            search_url = f"https://www.omdbapi.com/?apikey={OMDB_API_KEY}&s={urllib.parse.quote(clean_title)}"
            s_res = HTTP_SESSION.get(search_url, timeout=3.0)
            if s_res.status_code == 200:
                s_data = s_res.json()
                if s_data.get("Response") == "True" and s_data.get("Search"):
                    first_match = s_data["Search"][0]
                    imdb_id = first_match.get("imdbID")
                    if imdb_id:
                        id_url = f"https://www.omdbapi.com/?apikey={OMDB_API_KEY}&i={imdb_id}&plot=full"
                        id_res = HTTP_SESSION.get(id_url, timeout=3.0)
                        if id_res.status_code == 200:
                            data = id_res.json()

        if data.get("Response") == "True":
            poster = data.get("Poster")
            rating = data.get("imdbRating")
            year_str = data.get("Year", "")
            parsed_year = int(year_str[:4]) if year_str[:4].isdigit() else 2000
            box_office = data.get("BoxOffice")

            return {
                "poster_url": poster if poster and poster != "N/A" else None,
                "rating": float(rating) if rating and rating != "N/A" else None,
                "director": data.get("Director") if data.get("Director") != "N/A" else None,
                "cast_members": data.get("Actors") if data.get("Actors") != "N/A" else None,
                "genre": data.get("Genre") if data.get("Genre") != "N/A" else None,
                "plot": data.get("Plot") if data.get("Plot") != "N/A" else None,
                "runtime": data.get("Runtime") if data.get("Runtime") != "N/A" else None,
                "year": parsed_year,
                "box_office": box_office if box_office and box_office != "N/A" else None
            }
    except Exception as e:
        logger.debug(f"OMDb lookup error for '{title}': {e}")
    return {}

def enrich_movie_record(m):
    meta = fetch_omdb_metadata(m["title"])
    if meta:
        if meta.get("poster_url"):
            m["poster_url"] = meta["poster_url"]
        if not m.get("rating") and meta.get("rating"):
            m["rating"] = meta["rating"]
        if not m.get("plot") and meta.get("plot"):
            m["plot"] = meta["plot"]
        if not m.get("runtime") and meta.get("runtime"):
            m["runtime"] = meta["runtime"]
        if meta.get("year"):
            m["year"] = meta["year"]
        if m.get("director") in [None, "Unknown"] and meta.get("director"):
            m["director"] = meta["director"]
        if m.get("genre") in [None, "Unknown", "Action / Drama", "Theatrical Release"] and meta.get("genre"):
            m["genre"] = meta["genre"]
        if m.get("cast_members") in [None, "Unknown"] and meta.get("cast_members"):
            m["cast_members"] = meta["cast_members"]
    return m

def calculate_quality_score(record):
    score = 0
    if record.get("title") and str(record["title"]).strip().lower() not in ["none", "nan", "unknown"]:
        score += 20
    year = record.get("year")
    # Upper year bound: 5 years ahead of today — accommodates announced future releases
    # without ever needing a manual update.
    upper_year_bound = datetime.datetime.now().year + 5
    if year and isinstance(year, (int, float)) and 1900 <= year <= upper_year_bound:
        score += 20
    if record.get("rating") is not None and record["rating"] > 0:
        score += 20
    if record.get("poster_url"):
        score += 20
    if record.get("genre") and record["genre"] != "Unknown":
        score += 20
    return score

def transform_and_merge(wiki_data, imdb_data, bo_data, bms_data=None, classics_data=None):
    logger.info("Transforming and merging scraped datasets...")

    bms_data = bms_data or []
    bo_data = bo_data or []
    classics_data = classics_data or []

    all_records = []

    # 1. Process BookMyShow (In Theaters Now)
    for r in bms_data:
        raw_t = str(r.get("title", "")).strip()
        c_title = clean_bms_title(raw_t)
        if c_title:
            all_records.append({
                "title": c_title,
                "year": datetime.datetime.now().year,  # Placeholder; OMDb enrichment overwrites with real year
                "rating": clean_val(r.get("rating")),
                "votes": 0,
                "director": "Unknown",
                "cast_members": "Unknown",
                "studio": "Theatrical Release",
                "genre": "Action / Drama",
                "poster_url": clean_val(r.get("poster_url")),
                "worldwide_gross": "In Theaters Now",
                "status": "IN_THEATERS",
                "source": "BookMyShow"
            })

    # 2. Process Classics (IMDb Top Rated)
    for r in classics_data:
        t = str(r.get("title", "")).strip()
        if t:
            all_records.append({
                "title": t,
                "year": r.get("year", 2000),
                "rating": clean_val(r.get("rating", 8.5)),
                "votes": r.get("votes", 100000),
                "director": r.get("director", "Unknown"),
                "cast_members": r.get("cast_members", "Unknown"),
                "studio": "Classic Studio",
                "genre": r.get("genre", "Classic"),
                "poster_url": clean_val(r.get("poster_url")),
                "worldwide_gross": "Top Rated Classic",
                "status": "CLASSIC",
                "source": "IMDb Top Rated"
            })

    # 3. Process BoxOfficeMojo
    for r in bo_data:
        t = str(r.get("title", "")).strip()
        if t:
            all_records.append({
                "title": t,
                "year": datetime.datetime.now().year,  # Placeholder; OMDb enrichment overwrites with real year
                "rating": clean_val(r.get("rating")),
                "votes": 0,
                "director": "Unknown",
                "cast_members": "Unknown",
                "studio": r.get("studio", "Unknown"),
                "genre": "Theatrical Release",
                "poster_url": clean_val(r.get("poster_url")),
                "worldwide_gross": r.get("worldwide_gross", "Theatrical"),
                "status": "CLASSIC",
                "source": "BoxOfficeMojo"
            })

    if not all_records:
        logger.warning("No records to transform.")
        return [], 0

    df = pd.DataFrame(all_records)
    df["_key"] = df["title"].str.lower().str.replace(r"[^\w\s]", "", regex=True).str.strip()

    merged = {}
    for _, row in df.iterrows():
        key = row["_key"]
        if not key:
            continue
        if key not in merged:
            item = row.to_dict()
            item.pop("_key", None)
            merged[key] = item
        else:
            ex = merged[key]
            if row.get("source") == "BookMyShow":
                ex["status"] = "IN_THEATERS"
                ex["source"] = "BookMyShow"

            for field in ["rating", "poster_url", "director", "cast_members", "genre", "worldwide_gross", "studio", "plot", "runtime"]:
                if not ex.get(field) or ex.get(field) in ["Unknown", "N/A"]:
                    val = row.get(field)
                    if val and val not in ["Unknown", "N/A"]:
                        ex[field] = val

    cleaned = list(merged.values())
    logger.info(f"Deduplicated to {len(cleaned)} unique titles. Enriching in parallel via ThreadPoolExecutor & Session...")

    # MULTI-THREADED PARALLEL ENRICHMENT (20 concurrent workers with HTTP session pooling)
    with concurrent.futures.ThreadPoolExecutor(max_workers=20) as executor:
        cleaned = list(executor.map(enrich_movie_record, cleaned))

    # FILTER: ONLY KEEP MOVIES THAT HAVE A VALID REAL POSTER URL!
    cleaned = [m for m in cleaned if m.get("poster_url") and m.get("poster_url") != "N/A"]

    # RE-VALIDATE IN_THEATERS STATUS after OMDb enrichment may have overwritten the year.
    # A movie scraped from BookMyShow but confirmed by OMDb to be older than 2024
    # cannot actually be in current theaters — reclassify it to CLASSIC.
    current_year = datetime.datetime.now().year
    for m in cleaned:
        if m.get("status") == "IN_THEATERS":
            movie_year = m.get("year")
            if isinstance(movie_year, (int, float)) and movie_year < current_year:
                logger.info(f"Reclassifying '{m.get('title')}' ({movie_year}) from IN_THEATERS to CLASSIC — year too old.")
                m["status"] = "CLASSIC"
                m["source"] = "BookMyShow (Re-release)"
                m["worldwide_gross"] = "Classic Re-release"

    for m in cleaned:
        for k, v in m.items():
            m[k] = clean_val(v)
        m["quality_score"] = calculate_quality_score(m)

    # SORTING:
    # 1. Real Amazon/IMDb CDN or BMS CDN posters FIRST
    # 2. BookMyShow (In Theaters) FIRST
    # 3. High Rating
    def sort_key(m):
        poster_str = str(m.get("poster_url", ""))
        has_real_poster = 2 if ("m.media-amazon.com" in poster_str or "bmscdn.com" in poster_str) else (1 if poster_str else 0)
        source_priority = 2 if m.get("source") == "BookMyShow" else 1
        rating = m.get("rating") or 0
        return (has_real_poster, source_priority, rating)

    cleaned.sort(key=sort_key, reverse=True)

    avg_q = sum(m["quality_score"] for m in cleaned) / len(cleaned) if cleaned else 0
    logger.info(f"Transformed {len(cleaned)} unique movies with valid posters. Avg Quality Score: {avg_q:.1f}%")
    return cleaned, round(avg_q, 1)
