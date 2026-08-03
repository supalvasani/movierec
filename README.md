# 🎬 Movie Data Engineering Platform

> A production-ready, automated data engineering platform that scrapes, cleans, deduplicates, and analyzes multi-source movie data (Wikipedia, IMDb, BoxOfficeMojo). Features real-time ETL execution logging, field quality scoring, cloud database sync (Supabase), and an interactive React dashboard.

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                 Automated Scraper Pipeline                  │
│                                                             │
│  [ Wikipedia ]      [ IMDb MovieMeter ]   [ BoxOfficeMojo ] │
│  2025/2026 Film      In-Theaters          Top Grossing      │
│        │                     │                    │         │
└────────┼─────────────────────┼────────────────────┼─────────┘
         │                     │                    │
         └─────────────────────┼────────────────────┘
                               ▼
            ┌────────────────────────────────────┐
            │        Pandas Data Cleaning        │
            │  - Deduplication across sources    │
            │  - Data Quality Scoring (0-100%)   │
            │  - Format Normalization            │
            └──────────────────┬─────────────────┘
                               │
            ┌──────────────────┴─────────────────┐
            │                                    │
            ▼                                    ▼
 ┌──────────────────────┐             ┌─────────────────────┐
 │  Supabase PostgreSQL │             │  GitHub Actions /   │
 │   - movies           │             │  Local Airflow DAGs │
 │   - pipeline_runs    │             │  Scheduled Daily    │
 └──────────┬───────────┘             └─────────────────────┘
            │
            ▼
 ┌───────────────────────────────────────────────┐
 │            React Web Dashboard                │
 │  🎬 Discover     📊 Analytics Dashboard       │
 │  🔄 Pipeline     🗂️ Data Quality Explorer     │
 └───────────────────────────────────────────────┘
```

---

## ✨ Core Features & Data Engineering Concepts

* **Multi-Source Scraping**: Extract data from Wikipedia (release schedule), IMDb (ratings & popularity), and Box Office Mojo (revenue).
* **Data Quality Scoring (0–100%)**: Evaluates each record's attribute completeness (Title, Year, Rating, Genre, Director, Poster).
* **Cross-Source Deduplication**: Merges records for the same movie across different sources using normalized title keys.
* **Automated Cloud Scheduling**: Scheduled via GitHub Actions (`.github/workflows/scraper_pipeline.yml`) to scrape, transform, and update database automatically every day.
* **Airflow Compatible**: Easily wrappable in Apache Airflow DAGs (`airflow/dags`) for local pipeline monitoring at `localhost:8080`.
* **Database & Analytics Dashboard**: React dashboard built with Tailwind CSS featuring:
  - **Discover**: Client-side instant movie search & filter.
  - **Analytics**: Rating distribution histograms, top genre metrics, & source ingestion breakdowns.
  - **Pipeline Monitor**: Real-time ETL execution logs, status indicators, & audit trails.
  - **Data Explorer**: Raw dataset table with color-coded quality badges (🟢/🟡/🔴) and **CSV export**.

---

## 🛠️ Tech Stack

| Component | Technology |
|---|---|
| **Scrapers & Pipeline** | Python 3.11, BeautifulSoup4, Pandas, Requests |
| **Database** | Supabase (PostgreSQL) |
| **Orchestration** | GitHub Actions (Cloud Cron) / Apache Airflow (Local DAGs) |
| **Frontend** | React 19, Vite, Tailwind CSS |
| **Hosting** | Vercel (Frontend), Supabase (Database) |

---

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/supalvasani/movierec.git
cd movierec
```

### 2. Install Dependencies
```bash
# Install frontend dependencies
npm install

# Install Python pipeline dependencies
pip install -r pipeline/requirements.txt
```

### 3. Run the Scraper Pipeline Locally
```bash
python pipeline/main.py
```
This executes the scraper, cleans the records, computes data quality scores, and outputs dataset JSON files to `public/data/`.

### 4. Run the React Web Dashboard
```bash
npm run dev
```
Open `http://localhost:5173` to explore the dashboard across all 4 views.

---

## 🗄️ Database Setup (Supabase)

To enable live cloud database sync, run the following SQL script in your Supabase SQL Editor:

```sql
CREATE TABLE IF NOT EXISTS movies (
    title TEXT PRIMARY KEY,
    year INT,
    rating FLOAT,
    votes INT,
    director TEXT,
    cast_members TEXT,
    studio TEXT,
    genre TEXT,
    poster_url TEXT,
    worldwide_gross TEXT,
    source TEXT,
    quality_score INT
);

CREATE TABLE IF NOT EXISTS pipeline_runs (
    id TEXT PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT NOW(),
    status TEXT,
    raw_records_extracted INT,
    clean_records_output INT,
    records_dropped INT,
    avg_quality_score FLOAT,
    duration_seconds FLOAT,
    sources_scraped TEXT[]
);
```

Add your Supabase keys to `.env`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

---

## 📈 Pipeline Metrics & Quality Scoring

| Quality Score | Indicator | Definition |
|---|---|---|
| **90 - 100%** | 🟢 High | Complete record (Title, Year, Rating, Director, Genre, Poster) |
| **60 - 89%** | 🟡 Medium | Partial record (Missing poster or director) |
| **< 60%** | 🔴 Low | Sparse record (Missing rating or genre) |
