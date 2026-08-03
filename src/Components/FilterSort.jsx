import React from 'react';

const FilterSort = ({ sortOption, setSortOption }) => {
    return (
        <div className="flex justify-end items-center my-2">
            <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="bg-[#0a0a0f] border border-[#181826] text-slate-300 text-xs rounded-lg px-3 py-1.5 outline-none focus:border-indigo-500 cursor-pointer"
            >
                <option value="default">Sort by: Default</option>
                <option value="rating_desc">Highest Rating</option>
                <option value="year_desc">Latest Release</option>
                <option value="year_asc">Oldest Release</option>
                <option value="title_asc">Title A-Z</option>
            </select>
        </div>
    );
};

export default FilterSort;
