import React from 'react';

const Search = ({ searchTerm, setSearchTerm }) => {
    return (
        <div className="relative flex items-center w-64 sm:w-72">
            <input
                type="text"
                placeholder="Search movies, series..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#08080d] border border-[#161622] focus:border-indigo-500/60 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 outline-none transition-all"
            />
            {searchTerm && (
                <button 
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 text-xs text-slate-500 hover:text-white"
                >
                    ✕
                </button>
            )}
        </div>
    );
};

export default Search;
