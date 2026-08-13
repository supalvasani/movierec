import React, { useState, useEffect, useRef } from 'react';

import { fetchPipelineRuns } from '../services/dataService.js';

// ─── Animated counter ────────────────────────────────────────────────────────
const useCountUp = (target, duration = 900) => {
    const [value, setValue] = useState(0);
    const start = useRef(null);
    const raf = useRef(null);

    useEffect(() => {
        if (!target) return;
        const num = parseFloat(target);
        if (isNaN(num)) { setValue(target); return; }

        start.current = null;
        const tick = (ts) => {
            if (!start.current) start.current = ts;
            const progress = Math.min((ts - start.current) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(Math.round(eased * num * 10) / 10);
            if (progress < 1) raf.current = requestAnimationFrame(tick);
        };
        raf.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf.current);
    }, [target, duration]);

    return value;
};

// ─── Sparkline SVG ───────────────────────────────────────────────────────────
const Sparkline = ({ data, width = 220, height = 48, color = '#6366f1' }) => {
    if (!data || data.length < 2) return null;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const step = width / (data.length - 1);

    const pts = data.map((v, i) => {
        const x = i * step;
        const y = height - ((v - min) / range) * (height - 8) - 4;
        return [x, y];
    });

    const pathD = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
    const areaD = `${pathD} L ${pts[pts.length - 1][0]} ${height} L 0 ${height} Z`;

    const last = pts[pts.length - 1];

    return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
            <defs>
                <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>
            <path d={areaD} fill="url(#sg)" />
            <path d={pathD} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            <circle cx={last[0]} cy={last[1]} r={4} fill={color} />
        </svg>
    );
};

// ─── Animated Metric Card ────────────────────────────────────────────────────
const MetricCard = ({ title, rawValue, unit = '', subtitle, status, sparkData, sparkColor }) => {
    const animated = useCountUp(typeof rawValue === 'number' ? rawValue : 0);

    const displayValue = typeof rawValue === 'number'
        ? status === 'SUCCESS'
            ? rawValue   // show text as-is for status
            : `${animated}${unit}`
        : rawValue;

    return (
        <div style={{
            background: '#18181b', border: '1px solid #27272a',
            borderRadius: 8, padding: '18px 20px',
            display: 'flex', flexDirection: 'column', gap: 4,
        }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {title}
            </div>
            <div style={{
                fontSize: 26, fontWeight: 800, lineHeight: 1.2,
                color: status === 'SUCCESS' ? '#10b981' : '#f4f4f5',
            }}>
                {status === 'SUCCESS' ? 'SUCCESS' : displayValue}
            </div>
            <div style={{ fontSize: 11, color: '#52525b' }}>{subtitle}</div>
            {sparkData && (
                <div style={{ marginTop: 8 }}>
                    <Sparkline data={sparkData} color={sparkColor || '#6366f1'} />
                </div>
            )}
        </div>
    );
};

// ─── Source badge ─────────────────────────────────────────────────────────────
const SourceBox = ({ title, desc }) => (
    <div style={{ background: '#09090b', border: '1px solid #27272a', borderRadius: 6, padding: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#f4f4f5', marginBottom: 6 }}>{title}</div>
        <div style={{ fontSize: 12, color: '#a1a1aa', lineHeight: 1.5 }}>{desc}</div>
    </div>
);

// ─── Diff pill ───────────────────────────────────────────────────────────────
const DiffPill = ({ value, label }) => {
    const positive = value >= 0;
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
                fontSize: 12, fontWeight: 700, padding: '2px 10px', borderRadius: 4,
                background: positive ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                color: positive ? '#10b981' : '#ef4444',
                border: `1px solid ${positive ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
            }}>
                {positive ? '+' : ''}{value}
            </span>
            <span style={{ fontSize: 12, color: '#71717a' }}>{label}</span>
        </div>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const PipelineMonitor = () => {
    const [runs, setRuns] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isTriggering, setIsTriggering] = useState(false);
    const [triggerSuccess, setTriggerSuccess] = useState(false);

    const fetchRuns = async () => {
        setIsLoading(true);
        try {
            const data = await fetchPipelineRuns();
            setRuns(data || []);
        } catch (err) {
            console.error('Failed to load pipeline runs:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchRuns(); }, []);

    const handleTrigger = async () => {
        setIsTriggering(true);
        setTriggerSuccess(false);
        try {
            await new Promise((r) => setTimeout(r, 1500));
            await fetchRuns();
            setTriggerSuccess(true);
            setTimeout(() => setTriggerSuccess(false), 4000);
        } finally {
            setIsTriggering(false);
        }
    };

    const latestRun = runs[0] || null;
    const prevRun   = runs[1] || null;

    // Sparkline data from last 10 runs (reversed so oldest→newest)
    const qualityHistory  = runs.slice(0, 10).map((r) => r.avg_quality_score || 0).reverse();
    const outputHistory   = runs.slice(0, 10).map((r) => r.clean_records_output || 0).reverse();

    // Diff between latest and previous run
    const outputDiff   = latestRun && prevRun ? latestRun.clean_records_output - prevRun.clean_records_output : null;
    const qualityDiff  = latestRun && prevRun
        ? parseFloat((latestRun.avg_quality_score - prevRun.avg_quality_score).toFixed(1))
        : null;

    return (
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 32px 64px' }}>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <h1 style={{ fontSize: 22, fontWeight: 800, color: '#ffffff' }}>
                        ETL Pipeline Monitor
                    </h1>
                    <p style={{ fontSize: 13, color: '#71717a', marginTop: 4 }}>
                        Automated data extraction, transformation, enrichment, and cloud sync
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    {triggerSuccess && (
                        <span style={{ fontSize: 12, color: '#10b981', fontWeight: 600 }}>
                            Pipeline triggered and synced
                        </span>
                    )}
                    <button
                        onClick={handleTrigger}
                        disabled={isTriggering}
                        style={{
                            padding: '9px 18px', borderRadius: 6, fontSize: 13, fontWeight: 600,
                            background: isTriggering ? '#27272a' : '#f4f4f5',
                            color: isTriggering ? '#71717a' : '#09090b',
                            border: 'none', cursor: isTriggering ? 'not-allowed' : 'pointer',
                            transition: 'all 0.15s ease',
                        }}
                    >
                        {isTriggering ? 'Running Pipeline...' : 'Run Pipeline Now'}
                    </button>
                </div>
            </div>

            {/* Metric Cards */}
            {latestRun && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: 14, marginBottom: 28,
                }}>
                    <MetricCard
                        title="Latest Status"
                        rawValue={latestRun.status}
                        subtitle={new Date(latestRun.timestamp).toLocaleString()}
                        status={latestRun.status}
                    />
                    <MetricCard
                        title="Raw Extracted"
                        rawValue={latestRun.raw_records_extracted || 0}
                        subtitle="Cross-source records"
                    />
                    <MetricCard
                        title="Clean Output"
                        rawValue={latestRun.clean_records_output || 0}
                        subtitle={`${latestRun.records_dropped || 0} records dropped`}
                        sparkData={outputHistory}
                        sparkColor="#6366f1"
                    />
                    <MetricCard
                        title="Avg Quality Score"
                        rawValue={latestRun.avg_quality_score || 0}
                        unit="%"
                        subtitle="Posters, cast, ratings, specs"
                        sparkData={qualityHistory}
                        sparkColor="#10b981"
                    />
                    <MetricCard
                        title="Execution Time"
                        rawValue={latestRun.duration_seconds || 0}
                        unit="s"
                        subtitle="Scrape + transform + sync"
                    />
                </div>
            )}

            {/* Run Diff Panel */}
            {prevRun && (latestRun) && (
                <div style={{
                    background: '#18181b', border: '1px solid #27272a',
                    borderRadius: 8, padding: '16px 20px', marginBottom: 24,
                    display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center',
                }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.06em', marginRight: 4 }}>
                        vs previous run
                    </span>
                    {outputDiff !== null && <DiffPill value={outputDiff} label="clean records" />}
                    {qualityDiff !== null && <DiffPill value={qualityDiff} label="quality score %" />}
                </div>
            )}

            {/* Pipeline Architecture */}
            <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 8, padding: 24, marginBottom: 28 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f4f4f5' }}>
                        Automated Extraction Architecture
                    </h3>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ fontSize: 11, background: '#27272a', padding: '3px 9px', borderRadius: 4, color: '#a1a1aa', fontWeight: 600 }}>
                            6:00 AM IST
                        </span>
                        <span style={{ fontSize: 11, color: '#52525b' }}>+</span>
                        <span style={{ fontSize: 11, background: '#27272a', padding: '3px 9px', borderRadius: 4, color: '#a1a1aa', fontWeight: 600 }}>
                            6:00 PM IST
                        </span>
                    </div>
                </div>
                <p style={{ fontSize: 13, color: '#a1a1aa', lineHeight: 1.6, marginBottom: 16 }}>
                    The Python pipeline (<code style={{ color: '#d4d4d8', background: '#09090b', padding: '1px 5px', borderRadius: 3 }}>pipeline/scheduler.py</code>) runs
                    <strong style={{ color: '#d4d4d8' }}> twice daily</strong> via GitHub Actions — at <strong style={{ color: '#d4d4d8' }}>6:00 AM IST</strong> for a morning
                    refresh and <strong style={{ color: '#d4d4d8' }}>6:00 PM IST</strong> for an evening refresh.
                    The second run specifically targets <strong style={{ color: '#d4d4d8' }}>Friday new releases</strong>, which typically go live
                    in the afternoon. Release statuses are dynamically computed by comparing
                    each movie's actual release date against the current date — nothing is hardcoded.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                    <SourceBox title="1. Extract" desc="Scrapes BookMyShow, Box Office Mojo, Wikipedia, and IMDb for raw movie records." />
                    <SourceBox title="2. Classify" desc="Dynamically computes In Theaters vs. Upcoming by comparing release dates to today." />
                    <SourceBox title="3. Enrich" desc="Fetches HD posters, ratings, cast, plot summaries, and Rotten Tomatoes scores from OMDb." />
                    <SourceBox title="4. Load" desc="Exports clean JSON to public/data/ and upserts PostgreSQL records into Supabase." />
                </div>
            </div>

            {/* Execution Log */}
            <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 8, overflow: 'hidden' }}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid #27272a', background: '#09090b' }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: '#f4f4f5' }}>Execution Log</h3>
                </div>

                {isLoading ? (
                    <div style={{ padding: 32, textAlign: 'center', color: '#52525b', fontSize: 13 }}>Loading audit logs...</div>
                ) : runs.length === 0 ? (
                    <div style={{ padding: 32, textAlign: 'center', color: '#52525b', fontSize: 13 }}>No pipeline execution logs recorded yet.</div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #27272a', color: '#52525b', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                    {['Run ID', 'Timestamp', 'Status', 'Extracted', 'Output', 'Quality', 'Duration'].map((h) => (
                                        <th key={h} style={{ padding: '11px 18px', fontWeight: 700 }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {runs.map((run, idx) => (
                                    <tr
                                        key={idx}
                                        style={{
                                            borderBottom: '1px solid #27272a',
                                            background: idx === 0 ? 'rgba(99,102,241,0.04)' : 'transparent',
                                            transition: 'background 0.15s ease',
                                        }}
                                        onMouseOver={(e) => e.currentTarget.style.background = '#1f1f23'}
                                        onMouseOut={(e) => e.currentTarget.style.background = idx === 0 ? 'rgba(99,102,241,0.04)' : 'transparent'}
                                    >
                                        <td style={{ padding: '11px 18px', fontFamily: 'monospace', fontSize: 11, color: '#71717a' }}>{run.id}</td>
                                        <td style={{ padding: '11px 18px', color: '#a1a1aa', fontSize: 12 }}>{new Date(run.timestamp).toLocaleString()}</td>
                                        <td style={{ padding: '11px 18px' }}>
                                            <span style={{
                                                fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4,
                                                background: run.status === 'SUCCESS' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                                                color: run.status === 'SUCCESS' ? '#10b981' : '#f59e0b',
                                                border: `1px solid ${run.status === 'SUCCESS' ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}`,
                                            }}>
                                                {run.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: '11px 18px', color: '#f4f4f5' }}>{run.raw_records_extracted || 0}</td>
                                        <td style={{ padding: '11px 18px', color: '#f4f4f5' }}>{run.clean_records_output || 0}</td>
                                        <td style={{ padding: '11px 18px', color: '#f59e0b', fontWeight: 700 }}>{run.avg_quality_score || 0}%</td>
                                        <td style={{ padding: '11px 18px', color: '#a1a1aa' }}>{run.duration_seconds || 0}s</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PipelineMonitor;
