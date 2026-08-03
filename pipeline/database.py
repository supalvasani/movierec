import json
import os
import datetime
import logging
from dotenv import load_dotenv

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("DatabaseManager")

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL") or os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("VITE_SUPABASE_ANON_KEY") or os.getenv("SUPABASE_KEY")

def save_to_supabase(movies, pipeline_run):
    """
    Saves cleaned movies and pipeline run logs to Supabase if credentials and tables are set.
    """
    if not SUPABASE_URL or not SUPABASE_KEY or "your-supabase" in SUPABASE_URL:
        logger.info("Supabase credentials not configured yet. Skipping Supabase sync.")
        return False
        
    try:
        from supabase import create_client
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        
        # Save pipeline run audit log
        try:
            supabase.table("pipeline_runs").insert(pipeline_run).execute()
            logger.info("Synced pipeline run log to Supabase 'pipeline_runs'")
        except Exception as e1:
            logger.warning(f"Note: Could not insert into 'pipeline_runs': {e1}")
        
        # Upsert movies (filtering payload to standard schema columns)
        if movies:
            try:
                allowed_columns = {"title", "year", "rating", "votes", "director", "cast_members", "studio", "genre", "poster_url", "worldwide_gross", "source", "quality_score"}
                sanitized = [
                    {k: v for k, v in m.items() if k in allowed_columns}
                    for m in movies
                ]
                supabase.table("movies").upsert(sanitized, on_conflict="title").execute()
                logger.info("Synced movies dataset to Supabase 'movies'")
            except Exception as e2:
                logger.warning(f"Note: Could not insert into 'movies': {e2}")
                
        return True
    except Exception as e:
        logger.error(f"Failed to sync with Supabase: {e}")
        return False

def export_local_json(movies, pipeline_run):
    """
    Exports static JSON files into public/data/ directory so React can read them seamlessly.
    """
    output_dir = os.path.join(os.path.dirname(__file__), "..", "public", "data")
    os.makedirs(output_dir, exist_ok=True)
    
    # 1. Export movies.json
    movies_path = os.path.join(output_dir, "movies.json")
    with open(movies_path, "w", encoding="utf-8") as f:
        json.dump(movies, f, indent=2)
        
    # 2. Append/Update pipeline_runs.json
    runs_path = os.path.join(output_dir, "pipeline_runs.json")
    existing_runs = []
    if os.path.exists(runs_path):
        try:
            with open(runs_path, "r", encoding="utf-8") as f:
                existing_runs = json.load(f)
        except Exception:
            existing_runs = []
            
    existing_runs.insert(0, pipeline_run)
    # Keep last 50 runs
    existing_runs = existing_runs[:50]
    
    with open(runs_path, "w", encoding="utf-8") as f:
        json.dump(existing_runs, f, indent=2)
        
    logger.info(f"Exported {len(movies)} movies to {movies_path}")
    logger.info(f"Updated pipeline runs log at {runs_path}")

def save_pipeline_output(movies, pipeline_run):
    export_local_json(movies, pipeline_run)
    save_to_supabase(movies, pipeline_run)
