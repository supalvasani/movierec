import React from 'react';

const Sidebar = ({ activeTab, setActiveTab }) => {
    const navItems = [
        { id: 'discover', label: 'Movies & Series' },
        { id: 'analytics', label: 'Analytics' },
        { id: 'pipeline', label: 'Pipelines' },
        { id: 'explorer', label: 'Data Explorer' },
    ];

    return (
        <aside className="w-60 bg-[#050507] border-r border-[#15151f] flex flex-col justify-between h-screen sticky top-0 shrink-0 select-none">
            <div>
                {/* Brand Header */}
                <div className="p-5 border-b border-[#15151f]">
                    <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center text-white font-bold text-xs">
                            C
                        </div>
                        <div>
                            <h1 className="font-bold text-white tracking-wide text-xs">CINEDATA</h1>
                            <p className="text-[9px] text-slate-500 font-mono uppercase">Data Platform</p>
                        </div>
                    </div>
                </div>

                {/* Navigation Menu */}
                <nav className="p-3 space-y-1">
                    <p className="px-3 text-[9px] font-mono text-slate-500 uppercase tracking-wider mb-2">Menu</p>
                    {navItems.map((item) => {
                        const isActive = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                                    isActive
                                        ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 font-semibold'
                                        : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                                }`}
                            >
                                {item.label}
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Sidebar System Widget */}
            <div className="p-3 m-3 bg-[#0a0a0f] border border-[#15151f] rounded-lg text-[11px] space-y-1.5">
                <div className="flex items-center justify-between">
                    <span className="text-slate-500">Pipeline</span>
                    <span className="text-emerald-400 font-mono text-[10px]">Active</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-slate-500">Database</span>
                    <span className="text-slate-300 font-mono text-[10px]">Supabase</span>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
