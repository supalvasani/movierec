import React, { useState, useEffect, useRef } from 'react';

// ─── Animated horizontal bar ─────────────────────────────────────────────────
const AnimatedBar = ({ label, value, max, color, suffix = '' }) => {
    const [width, setWidth] = useState(0);
    useEffect(() => {
        const t = setTimeout(() => setWidth((value / max) * 100), 80);
        return () => clearTimeout(t);
    }, [value, max]);

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{ width: 100, fontSize: 12, color: '#a1a1aa', textAlign: 'right', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {label}
            </div>
            <div style={{ flex: 1, height: 8, background: '#27272a', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{
                    height: '100%', borderRadius: 4,
                    background: color,
                    width: `${width}%`,
                    transition: 'width 0.8s cubic-bezier(0.16,1,0.3,1)',
                }} />
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#f4f4f5', width: 48, textAlign: 'right', flexShrink: 0 }}>
                {value}{suffix}
            </div>
        </div>
    );
};

// ─── SVG Donut Chart ─────────────────────────────────────────────────────────
const DonutChart = ({ segments, size = 120 }) => {
    const r = 44;
    const circ = 2 * Math.PI * r;
    const cx = size / 2;
    const total = segments.reduce((a, s) => a + s.value, 0) || 1;

    let offset = 0;
    const slices = segments.map((s) => {
        const dash = (s.value / total) * circ;
        const gap = circ - dash;
        const slice = { ...s, dash, gap, offset };
        offset += dash;
        return slice;
    });

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <circle cx={cx} cy={cx} r={r} fill="none" stroke="#27272a" strokeWidth={10} />
            {slices.map((s, i) => (
                <circle
                    key={i}
                    cx={cx} cy={cx} r={r}
                    fill="none"
                    stroke={s.color}
                    strokeWidth={10}
                    strokeDasharray={`${s.dash} ${s.gap}`}
                    strokeDashoffset={-s.offset + circ / 4}
                    style={{ transition: 'stroke-dasharray 0.7s cubic-bezier(0.16,1,0.3,1)' }}
                />
            ))}
        </svg>
    );
};

// ─── KPI Stat Card ────────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, color = '#f4f4f5' }) => (
    <div style={{
        background: '#18181b', border: '1px solid #27272a',
        borderRadius: 8, padding: '18px 20px',
    }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
            {label}
        </div>
        <div style={{ fontSize: 28, fontWeight: 800, color, lineHeight: 1.1, marginBottom: 4 }}>
            {value}
        </div>
        {sub && <div style={{ fontSize: 11, color: '#52525b' }}>{sub}</div>}
    </div>
);

const GENRE_PALETTE = [
    '#6366f1', '#10b981', '#f59e0b', '#ef4444',
    '#8b5cf6', '#06b6d4', '#f97316', '#ec4899',
];

// ─── Main Component ───────────────────────────────────────────────────────────
const AnalyticsDashboard = ({ movies }) => {
    if (!movies || movies.length === 0) {
        return (
            <div style={{ padding: '80px 0', textAlign: 'center', color: '#52525b', fontSize: 14 }}>
                No movie dataset available for analytics.
            </div>
        );
    }

    const totalMovies = movies.length;
    const moviesWithRatings = movies.filter((m) => m.rating);
    const avgRating = moviesWithRatings.length > 0
        ? (moviesWithRatings.reduce((a, m) => a + m.rating, 0) / moviesWithRatings.length).toFixed(1)
        : 'N/A';
    const avgQuality = (movies.reduce((a, m) => a + (m.quality_score || 0), 0) / totalMovies).toFixed(1);
    const inTheaters = movies.filter((m) => m.source === 'BookMyShow' || m.status === 'IN_THEATERS').length;

    // Genre counts
    const genreCounts = {};
    movies.forEach((m) => {
        if (m.genre && m.genre !== 'Unknown') {
            m.genre.split(',').forEach((g) => {
                const k = g.trim();
                if (k) genreCounts[k] = (genreCounts[k] || 0) + 1;
            });
        }
    });
    const topGenres = Object.entries(genreCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const maxGenre = topGenres[0]?.[1] || 1;

    // Source distribution
    const sourceCounts = {};
    movies.forEach((m) => {
        (m.source || 'Unknown').split(',').forEach((s) => {
            const k = s.trim();
            sourceCounts[k] = (sourceCounts[k] || 0) + 1;
        });
    });
    const sourceEntries = Object.entries(sourceCounts).sort((a, b) => b[1] - a[1]);
    const sourceSegments = sourceEntries.map((([name, value], i) => ({
        name, value, color: GENRE_PALETTE[i % GENRE_PALETTE.length],
    })));

    // Rating distribution buckets
    const buckets = [
        { label: '9+',   min: 9,   max: 10, color: '#10b981' },
        { label: '8–8.9',min: 8,   max: 9,  color: '#6366f1' },
        { label: '7–7.9',min: 7,   max: 8,  color: '#f59e0b' },
        { label: '6–6.9',min: 6,   max: 7,  color: '#f97316' },
        { label: 'Under 6', min: 0, max: 6, color: '#ef4444' },
    ];
    const ratingData = buckets.map((b) => ({
        ...b,
        count: movies.filter((m) => m.rating && m.rating >= b.min && m.rating < b.max).length,
    }));
    const maxRating = Math.max(...ratingData.map((b) => b.count), 1);

    // Box office data (top 8 with valid revenue)
    const parseRevenue = (str) => {
        if (!str || str === 'N/A') return 0;
        return parseInt(str.replace(/[^0-9]/g, ''), 10) || 0;
    };
    const boxOfficeMovies = movies
        .filter((m) => m.worldwide_gross || m.box_office)
        .map((m) => ({ title: m.title, revenue: parseRevenue(m.worldwide_gross || m.box_office) }))
        .filter((m) => m.revenue > 0)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 8);
    const maxRevenue = boxOfficeMovies[0]?.revenue || 1;

    return (
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 32px 64px' }}>

            <div style={{ marginBottom: 28 }}>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: '#ffffff' }}>Analytics Dashboard</h1>
                <p style={{ fontSize: 13, color: '#71717a', marginTop: 4 }}>
                    Dataset statistics derived from the latest ETL pipeline run
                </p>
            </div>

            {/* KPI row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 28 }}>
                <StatCard label="Total Records" value={totalMovies} sub="Cross-source catalog" />
                <StatCard label="Avg IMDb Rating" value={avgRating} sub={`From ${moviesWithRatings.length} rated movies`} color="#f59e0b" />
                <StatCard label="Avg Quality Score" value={`${avgQuality}%`} sub="Poster + cast + specs" color="#6366f1" />
                <StatCard label="In Theaters" value={inTheaters} sub="Live theatrical releases" color="#10b981" />
            </div>

            {/* Two-column charts */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>

                {/* Genre chart */}
                <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 8, padding: 24 }}>
                    <h3 style={chartTitle}>Genre Distribution</h3>
                    <p style={chartSub}>Top 8 genres across all pipeline records</p>
                    <div style={{ marginTop: 18 }}>
                        {topGenres.map(([genre, count], i) => (
                            <AnimatedBar
                                key={genre}
                                label={genre}
                                value={count}
                                max={maxGenre}
                                color={GENRE_PALETTE[i % GENRE_PALETTE.length]}
                            />
                        ))}
                    </div>
                </div>

                {/* Rating histogram */}
                <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 8, padding: 24 }}>
                    <h3 style={chartTitle}>IMDb Rating Distribution</h3>
                    <p style={chartSub}>Breakdown of quality tiers across the catalog</p>
                    <div style={{ marginTop: 18 }}>
                        {ratingData.map((b) => (
                            <AnimatedBar
                                key={b.label}
                                label={b.label}
                                value={b.count}
                                max={maxRating}
                                color={b.color}
                                suffix=" films"
                            />
                        ))}
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

                {/* Source donut */}
                <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 8, padding: 24 }}>
                    <h3 style={chartTitle}>Data Source Breakdown</h3>
                    <p style={chartSub}>Records by scrape origin</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 28, marginTop: 18 }}>
                        <DonutChart segments={sourceSegments} />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {sourceSegments.map((s) => (
                                <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <div style={{ width: 10, height: 10, borderRadius: 2, background: s.color, flexShrink: 0 }} />
                                    <span style={{ fontSize: 12, color: '#a1a1aa' }}>{s.name}</span>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: '#f4f4f5', marginLeft: 'auto', paddingLeft: 12 }}>{s.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Box office */}
                <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 8, padding: 24 }}>
                    <h3 style={chartTitle}>Box Office Revenue</h3>
                    <p style={chartSub}>Top 8 grossing movies in the dataset</p>
                    <div style={{ marginTop: 18 }}>
                        {boxOfficeMovies.length === 0 ? (
                            <p style={{ fontSize: 13, color: '#52525b', paddingTop: 16 }}>No box office data available.</p>
                        ) : (
                            boxOfficeMovies.map((m, i) => (
                                <AnimatedBar
                                    key={m.title}
                                    label={m.title.length > 18 ? m.title.slice(0, 16) + '…' : m.title}
                                    value={Math.round(m.revenue / 1_000_000)}
                                    max={Math.round(maxRevenue / 1_000_000)}
                                    color={GENRE_PALETTE[i % GENRE_PALETTE.length]}
                                    suffix="M"
                                />
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const chartTitle = { fontSize: 15, fontWeight: 700, color: '#f4f4f5', marginBottom: 2 };
const chartSub   = { fontSize: 12, color: '#52525b' };

export default AnalyticsDashboard;
