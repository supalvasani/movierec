import time
import logging
from main import run_etl_pipeline

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ETLScheduler")

def start_scheduler(interval_hours=12):
    """
    Automated ETL Scheduler — runs the full movie scraper pipeline on a fixed interval.

    Default: every 12 hours (twice per day), matching the GitHub Actions cron schedule:
      - 6:00 AM IST  (00:30 UTC) — morning refresh
      - 6:00 PM IST  (12:30 UTC) — evening refresh, catches Friday new releases

    New movies release daily (and especially on Fridays), so twice-a-day ensures
    the dataset is always current without hammering the scraped sources.
    """
    logger.info(f"=== INITIALIZING ETL SCHEDULER (Interval: {interval_hours}h) ===")

    # Run pipeline immediately on startup so data is fresh right away
    logger.info("Executing initial pipeline sync on startup...")
    run_etl_pipeline()

    interval_seconds = interval_hours * 3600
    while True:
        logger.info(f"Scheduler sleeping for {interval_hours} hours until next sync...")
        time.sleep(interval_seconds)
        logger.info("=== STARTING SCHEDULED REFRESH ===")
        try:
            run_etl_pipeline()
        except Exception as e:
            logger.error(f"Error during scheduled ETL execution: {e}")

if __name__ == "__main__":
    start_scheduler(12)
