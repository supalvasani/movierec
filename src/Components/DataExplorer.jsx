import React, { useState } from 'react';

const DataExplorer = ({ movies }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSource, setSelectedSource] = useState('ALL');

    if (!movies || movies.length === 0) {
        return (
            <div className="text-center py-20 text-slate-400">
                <p>No movie records available in data explorer.</p>
            </div>
        );
    }

    const filteredMovies = movies.filter(m => {
        const matchesTitle = m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             (m.director && m.director.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesSource = selectedSource === 'ALL' || (m.source && m.source.includes(selectedSource));
        return matchesTitle && matchesSource;
    });

    const handleExportCSV = () => {
        if (!filteredMovies.length) return;
        
        const headers = ["Title", "Year", "IMDb Rating", "Quality Score", "Director", "Genre", "Box Office", "Source"];
        const rows = filteredMovies.map(m => [
            `"${m.title.replace(/"/g, '""')}"`,
            m.year || '',
            m.rating || '',
            `${m.quality_score || 0}%`,
            `"${(m.director || 'Unknown').replace(/"/g, '""')}"`,
            `"${(m.genre || 'Unknown').replace(/"/g, '""')}"`,
            `"${(m.worldwide_gross || 'N/A').replace(/"/g, '""')}"`,
            `"${(m.source || 'Scraper').replace(/"/g, '""')}"`
        ]);

        const csvContent = "data:text/csv;charset=utf-8," 
            + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `movie_dataset_export_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6">
            {/* Header & Controls */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                    <h3 className="text-lg font-semibold text-white">
                        Dataset Quality & Attribute Explorer
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                        Showing {filteredMovies.length} of {movies.length} ingested dataset records
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    <input
                        type="text"
                        placeholder="Search title or director..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-slate-950/80 border border-slate-700 text-white text-xs rounded-lg px-3.5 py-2 outline-none focus:border-indigo-500 w-full sm:w-60"
                    />

                    <select
                        value={selectedSource}
                        onChange={(e) => setSelectedSource(e.target.value)}
                        className="bg-slate-950/80 border border-slate-700 text-white text-xs rounded-lg px-3 py-2 outline-none focus:border-indigo-500"
                    >
                        <option value="ALL">All Sources</option>
                        <option value="Wikipedia">Wikipedia</option>
                        <option value="IMDb">IMDb</option>
                        <option value="BoxOfficeMojo">BoxOfficeMojo</option>
                    </select>

                    <button
                        onClick={handleExportCSV}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-4 py-2 rounded-lg transition shadow cursor-pointer"
                    >
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Data Table */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-300">
                        <thead className="text-slate-400 uppercase bg-slate-950/60 border-b border-slate-800">
                            <tr>
                                <th className="py-3 px-4">Quality Index</th>
                                <th className="py-3 px-4">Title</th>
                                <th className="py-3 px-4">Year</th>
                                <th className="py-3 px-4">IMDb Rating</th>
                                <th className="py-3 px-4">Director</th>
                                <th className="py-3 px-4">Genre</th>
                                <th className="py-3 px-4">Box Office</th>
                                <th className="py-3 px-4">Sources</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                            {filteredMovies.map((movie, idx) => {
                                const score = movie.quality_score || 0;
                                let badgeClass = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
                                let label = "HIGH";

                                if (score < 60) {
                                    badgeClass = "bg-rose-500/10 text-rose-400 border-rose-500/20";
                                    label = "LOW";
                                } else if (score < 85) {
                                    badgeClass = "bg-amber-500/10 text-amber-400 border-amber-500/20";
                                    label = "MEDIUM";
                                }

                                return (
                                    <tr key={`${movie.title}-${idx}`} className="hover:bg-slate-800/40 transition">
                                        <td className="py-3 px-4 whitespace-nowrap">
                                            <span className={`px-2 py-0.5 text-[11px] font-mono font-semibold rounded border ${badgeClass}`}>
                                                {label} ({score}%)
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 font-semibold text-white">{movie.title}</td>
                                        <td className="py-3 px-4 text-slate-400 font-mono">{movie.year || 'N/A'}</td>
                                        <td className="py-3 px-4 font-mono font-semibold text-amber-400">
                                            {movie.rating ? movie.rating : 'N/A'}
                                        </td>
                                        <td className="py-3 px-4 text-slate-300">{movie.director || 'Unknown'}</td>
                                        <td className="py-3 px-4 text-slate-400 max-w-xs truncate">{movie.genre || 'Unknown'}</td>
                                        <td className="py-3 px-4 text-emerald-400 font-mono">{movie.worldwide_gross || 'N/A'}</td>
                                        <td className="py-3 px-4 font-mono text-xs text-indigo-400">{movie.source || 'Scraper'}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default DataExplorer;
