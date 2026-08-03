import time
import datetime
import logging
from scrapers.wikipedia import scrape_wikipedia_movies
from scrapers.imdb import scrape_imdb_in_theaters
from scrapers.boxoffice import scrape_box_office_mojo
from scrapers.bookmyshow import scrape_bookmyshow_movies
from scrapers.classics import scrape_classic_movies
from transform import transform_and_merge
from database import save_pipeline_output

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ETLPipelineMaster")

def run_etl_pipeline():
    """
    Master ETL Orchestrator function.
    Executes: Scrape BookMyShow -> Scrape BoxOffice -> Scrape Wikipedia -> Scrape IMDb Classics -> Transform/Clean -> Save
    """
    logger.info("=== STARTING MOVIE DATA PIPELINE ===")
    start_time = time.time()

    # 1. EXTRACT
    bms_movies = scrape_bookmyshow_movies()
    bo_movies = scrape_box_office_mojo()
    wiki_movies = scrape_wikipedia_movies()
    classics_movies = scrape_classic_movies()

    total_raw = len(bms_movies) + len(bo_movies) + len(wiki_movies) + len(classics_movies)
    logger.info(f"Raw Extraction Complete: BMS({len(bms_movies)}), BoxOffice({len(bo_movies)}), Wiki({len(wiki_movies)}), Classics({len(classics_movies)})")

    # 2. TRANSFORM & CLEAN & SCORE QUALITY
    cleaned_movies, avg_quality = transform_and_merge(wiki_movies, [], bo_movies, bms_movies, classics_movies)

    duration = round(time.time() - start_time, 2)

    # 3. AUDIT METRICS
    pipeline_run = {
        "id": f"run-{int(time.time())}",
        "timestamp": datetime.datetime.now().isoformat(),
        "status": "SUCCESS" if cleaned_movies else "WARNING",
        "raw_records_extracted": total_raw,
        "clean_records_output": len(cleaned_movies),
        "records_dropped": total_raw - len(cleaned_movies),
        "avg_quality_score": avg_quality,
        "duration_seconds": duration,
        "sources_scraped": ["BookMyShow", "BoxOfficeMojo", "Wikipedia", "IMDb Top Rated"]
    }

    # 4. LOAD / EXPORT
    save_pipeline_output(cleaned_movies, pipeline_run)

    logger.info(f"=== PIPELINE COMPLETED IN {duration}s ===")
    logger.info(f"Summary: {len(cleaned_movies)} cleaned movies. Quality score: {avg_quality}%.")
    return cleaned_movies, pipeline_run

if __name__ == "__main__":
    run_etl_pipeline()
