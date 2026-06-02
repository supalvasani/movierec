import React from 'react';

const FilterSort = ({ sortOption, setSortOption }) => {
    return (
        <div className="flex justify-between items-center bg-light-100/5 px-4 py-3 rounded-lg max-w-3xl mx-auto mb-6 mt-4 border border-light-100/10">
            <div className="flex items-center gap-3">
                <span className="text-gray-100 text-sm font-medium hidden sm:inline">Sort By:</span>
                <select 
                    className="bg-dark-100 text-white text-sm rounded-md px-3 py-1.5 border border-light-100/10 outline-none focus:border-light-100/30"
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value)}
                >
                    <option value="default">Default</option>
                    <option value="rating_desc">Rating (High to Low)</option>
                    <option value="year_desc">Year (Newest to Oldest)</option>
                    <option value="year_asc">Year (Oldest to Newest)</option>
                    <option value="title_asc">Title (A-Z)</option>
                </select>
            </div>
            
            <div className="text-xs text-gray-100/70 italic">
                Applies to loaded results
            </div>
        </div>
    );
};

export default FilterSort;
