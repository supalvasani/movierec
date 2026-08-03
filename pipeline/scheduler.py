import time
import logging
from main import run_etl_pipeline

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ETLScheduler")

def start_daily_scheduler(interval_hours=24):
    """
    Automated Daily ETL Scheduler.
    Runs the full movie scraper pipeline every 24 hours to keep movie data, box office figures,
    posters, and release statuses 100% up to date in real time.
    """
    logger.info(f"=== INITIALIZING AUTOMATED DAILY ETL SCHEDULER (Interval: {interval_hours}h) ===")
    
    # Run pipeline immediately on startup
    logger.info("Executing initial pipeline sync on startup...")
    run_etl_pipeline()

    interval_seconds = interval_hours * 3600
    while True:
        logger.info(f"Scheduler sleeping for {interval_hours} hours until next sync...")
        time.sleep(interval_seconds)
        logger.info("=== STARTING SCHEDULED DAILY REFRESH ===")
        try:
            run_etl_pipeline()
        except Exception as e:
            logger.error(f"Error during scheduled ETL execution: {e}")

if __name__ == "__main__":
    start_daily_scheduler(24)
