import React from 'react';

const TabNav = ({ activeTab, setActiveTab }) => {
    const tabs = [
        { id: 'discover', label: 'Discover', desc: 'Browse Catalog' },
        { id: 'analytics', label: 'Analytics', desc: 'Dataset Insights' },
        { id: 'pipeline', label: 'Pipeline Monitor', desc: 'ETL Execution' },
        { id: 'explorer', label: 'Data Explorer', desc: 'Quality & Export' },
    ];

    return (
        <div className="w-full my-6">
            <div className="flex flex-wrap border-b border-slate-800 gap-2">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`py-3 px-5 text-sm font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
                                isActive
                                    ? 'border-indigo-500 text-indigo-400 bg-slate-900/40'
                                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
                            }`}
                        >
                            <span>{tab.label}</span>
                            <span className="text-[11px] text-slate-500 font-normal hidden sm:inline">({tab.desc})</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default TabNav;
