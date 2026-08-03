import React from 'react';

const AnalyticsDashboard = ({ movies }) => {
    if (!movies || movies.length === 0) {
        return (
            <div className="text-center py-20 text-slate-400">
                <p>No movie dataset available for analytics.</p>
            </div>
        );
    }

    const totalMovies = movies.length;
    const moviesWithRatings = movies.filter(m => m.rating);
    const avgRating = moviesWithRatings.length > 0 
        ? (moviesWithRatings.reduce((acc, m) => acc + m.rating, 0) / moviesWithRatings.length).toFixed(1)
        : 'N/A';
        
    const avgQuality = (movies.reduce((acc, m) => acc + (m.quality_score || 0), 0) / totalMovies).toFixed(1);

    const genreCounts = {};
    movies.forEach(m => {
        if (m.genre && m.genre !== 'Unknown') {
            m.genre.split(',').forEach(g => {
                const cleanG = g.trim();
                genreCounts[cleanG] = (genreCounts[cleanG] || 0) + 1;
            });
        }
    });
    const sortedGenres = Object.entries(genreCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);

    const sourceCounts = {};
    movies.forEach(m => {
        const sources = (m.source || 'Scraper').split(',');
        sources.forEach(s => {
            const cleanS = s.trim();
            sourceCounts[cleanS] = (sourceCounts[cleanS] || 0) + 1;
        });
    });

    const ratingBuckets = { '9+': 0, '8-8.9': 0, '7-7.9': 0, '6-6.9': 0, '<6': 0 };
    movies.forEach(m => {
        if (!m.rating) return;
        if (m.rating >= 9) ratingBuckets['9+']++;
        else if (m.rating >= 8) ratingBuckets['8-8.9']++;
        else if (m.rating >= 7) ratingBuckets['7-7.9']++;
        else if (m.rating >= 6) ratingBuckets['6-6.9']++;
        else ratingBuckets['<6']++;
    });

    const maxBucketCount = Math.max(...Object.values(ratingBuckets), 1);

    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
                    <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Total Records</p>
                    <h3 className="text-2xl sm:text-3xl font-bold text-white mt-1">{totalMovies}</h3>
                    <p className="text-xs text-indigo-400 mt-1">Cross-source catalog</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
                    <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Avg IMDb Rating</p>
                    <h3 className="text-2xl sm:text-3xl font-bold text-amber-400 mt-1">{avgRating} / 10</h3>
                    <p className="text-xs text-slate-400 mt-1">Weighted rating average</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
                    <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Quality Score</p>
                    <h3 className="text-2xl sm:text-3xl font-bold text-emerald-400 mt-1">{avgQuality}%</h3>
                    <p className="text-xs text-slate-400 mt-1">Completeness rating</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
                    <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Scraper Sources</p>
                    <h3 className="text-2xl sm:text-3xl font-bold text-indigo-400 mt-1">{Object.keys(sourceCounts).length}</h3>
                    <p className="text-xs text-slate-400 mt-1">Wiki, IMDb, BoxOffice</p>
                </div>
            </div>

            {/* Visual Charts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Genre Frequency */}
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
                    <h4 className="text-base font-semibold text-white mb-4">Genre Frequency Breakdown</h4>
                    <div className="space-y-3">
                        {sortedGenres.map(([genre, count]) => {
                            const percent = Math.round((count / totalMovies) * 100);
                            return (
                                <div key={genre} className="space-y-1">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-200 font-medium">{genre}</span>
                                        <span className="text-slate-400">{count} movies ({percent}%)</span>
                                    </div>
                                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                                        <div 
                                            className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                                            style={{ width: `${Math.min(percent * 2.5, 100)}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Rating Distribution Histogram */}
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
                    <h4 className="text-base font-semibold text-white mb-4">IMDb Rating Distribution</h4>
                    <div className="h-44 flex items-end justify-between gap-3 pt-6 px-2">
                        {Object.entries(ratingBuckets).map(([bucket, count]) => {
                            const heightPercent = Math.round((count / maxBucketCount) * 100);
                            return (
                                <div key={bucket} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                                    <span className="text-xs text-slate-400 font-medium">{count}</span>
                                    <div 
                                        className="w-full bg-amber-500/80 rounded-t transition-all duration-300 min-h-[4px]"
                                        style={{ height: `${heightPercent}%` }}
                                    />
                                    <span className="text-xs text-slate-400">{bucket}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Ingestion Breakdown */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
                <h4 className="text-base font-semibold text-white mb-4">Ingestion Inflow by Source</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {Object.entries(sourceCounts).map(([src, count]) => (
                        <div key={src} className="p-4 bg-slate-950/60 rounded-lg border border-slate-800 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-slate-200">{src}</p>
                                <p className="text-xs text-slate-500">Scraped & normalized</p>
                            </div>
                            <span className="px-2.5 py-1 bg-slate-800 text-slate-300 font-mono text-xs rounded">
                                {count} records
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;
