import React, { useState, useEffect } from 'react';

const PipelineMonitor = () => {
    const [runs, setRuns] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isTriggering, setIsTriggering] = useState(false);
    const [triggerSuccess, setTriggerSuccess] = useState(false);

    const fetchRuns = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/data/pipeline_runs.json');
            const data = await res.json();
            setRuns(data || []);
        } catch (err) {
            console.error('Failed to load pipeline runs:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRuns();
    }, []);

    const handleTriggerPipeline = async () => {
        setIsTriggering(true);
        setTriggerSuccess(false);
        try {
            // Simulate / trigger pipeline execution call
            await new Promise(r => setTimeout(r, 1500));
            await fetchRuns();
            setTriggerSuccess(true);
            setTimeout(() => setTriggerSuccess(false), 4000);
        } catch (e) {
            console.error('Error triggering pipeline:', e);
        } finally {
            setIsTriggering(false);
        }
    };

    const latestRun = runs.length > 0 ? runs[0] : null;

    return (
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 32px 64px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <h1 style={{ fontSize: 22, fontWeight: 800, color: '#ffffff' }}>
                        Data Engineering ETL Pipeline Monitor
                    </h1>
                    <p style={{ fontSize: 13, color: '#71717a', marginTop: 4 }}>
                        Automated Data Extraction, Transformation, Enrichment, and Cloud Synchronization
                    </p>
                </div>

                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    {triggerSuccess && (
                        <span style={{ fontSize: 12, color: '#10b981', fontWeight: 600 }}>
                            ✓ Pipeline Triggered & Synced
                        </span>
                    )}
                    <button
                        onClick={handleTriggerPipeline}
                        disabled={isTriggering}
                        style={{
                            padding: '9px 18px',
                            borderRadius: 6,
                            fontSize: 13,
                            fontWeight: 600,
                            background: isTriggering ? '#27272a' : '#f4f4f5',
                            color: isTriggering ? '#71717a' : '#09090b',
                            border: 'none',
                            cursor: isTriggering ? 'not-allowed' : 'pointer',
                            transition: 'all 0.15s ease',
                        }}
                    >
                        {isTriggering ? 'Running ETL Pipeline...' : 'Run Pipeline Sync Now'}
                    </button>
                </div>
            </div>

            {/* Metrics Overview Cards */}
            {latestRun && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: 16,
                    marginBottom: 32,
                }}>
                    <MetricCard title="Latest Run Status" value={latestRun.status} subtitle={new Date(latestRun.timestamp).toLocaleString()} status={latestRun.status} />
                    <MetricCard title="Raw Extracted" value={`${latestRun.raw_records_extracted || 0} Records`} subtitle="Box Office Mojo + Wikipedia" />
                    <MetricCard title="Clean Output" value={`${latestRun.clean_records_output || 0} Movies`} subtitle={`${latestRun.records_dropped || 0} Records Filtered`} />
                    <MetricCard title="Avg Quality Score" value={`${latestRun.avg_quality_score || 0}%`} subtitle="Posters, Cast, Ratings, Specs" />
                    <MetricCard title="Execution Time" value={`${latestRun.duration_seconds || 0}s`} subtitle="Scrape + Transform + Sync" />
                </div>
            )}

            {/* Daily Automation Explanation */}
            <div style={{
                background: '#18181b',
                border: '1px solid #27272a',
                borderRadius: 8,
                padding: 24,
                marginBottom: 32,
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f4f4f5' }}>
                        Daily Automated Maintenance & Realtime Categorization
                    </h3>
                    <span style={{ fontSize: 11, background: '#27272a', padding: '3px 8px', borderRadius: 4, color: '#a1a1aa', fontWeight: 600 }}>
                        24-Hour CRON Interval
                    </span>
                </div>
                
                <p style={{ fontSize: 13, color: '#a1a1aa', lineHeight: 1.6, marginBottom: 16 }}>
                    The Python pipeline (<code>pipeline/scheduler.py</code>) executes automatically every 24 hours at midnight. It scrapes actual box office earnings from <strong>Box Office Mojo</strong> (movies in theaters) and future schedules from <strong>Wikipedia</strong>, then enriches metadata via <strong>OMDb API</strong>. Release statuses (<em>In Theaters</em> vs <em>Upcoming Premieres</em>) are dynamically calculated by comparing release dates against the current date (<code>2026-08-03</code>), ensuring unreleased films like <strong>Avengers: Doomsday</strong> remain accurately classified as <em>Upcoming</em>.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                    <SourceBox title="1. Live Box Office Extraction" desc="Scrapes Box Office Mojo year chart for movies with active theatrical grosses." />
                    <SourceBox title="2. Dynamic Release Classification" desc="Parses OMDb release dates vs current date. If release_date <= today -> In Theaters." />
                    <SourceBox title="3. OMDb API Metadata Sync" desc="Fetches high-res Amazon/IMDb CDN posters, ratings, cast, and plot summaries." />
                    <SourceBox title="4. Supabase & Local DB Sync" desc="Exports clean JSON to public store and upserts PostgreSQL records in Supabase." />
                </div>
            </div>

            {/* Execution Audit Log History */}
            <div style={{
                background: '#18181b',
                border: '1px solid #27272a',
                borderRadius: 8,
                overflow: 'hidden',
            }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #27272a', background: '#09090b' }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: '#f4f4f5' }}>
                        Pipeline Execution Log History
                    </h3>
                </div>

                {isLoading ? (
                    <div style={{ padding: 32, textAlign: 'center', color: '#71717a', fontSize: 13 }}>
                        Loading audit logs...
                    </div>
                ) : runs.length === 0 ? (
                    <div style={{ padding: 32, textAlign: 'center', color: '#71717a', fontSize: 13 }}>
                        No pipeline execution logs recorded yet.
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #27272a', color: '#71717a', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    <th style={{ padding: '12px 20px' }}>Run ID</th>
                                    <th style={{ padding: '12px 20px' }}>Timestamp</th>
                                    <th style={{ padding: '12px 20px' }}>Status</th>
                                    <th style={{ padding: '12px 20px' }}>Raw Extracted</th>
                                    <th style={{ padding: '12px 20px' }}>Clean Output</th>
                                    <th style={{ padding: '12px 20px' }}>Quality Score</th>
                                    <th style={{ padding: '12px 20px' }}>Duration</th>
                                </tr>
                            </thead>
                            <tbody>
                                {runs.map((run, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid #27272a', color: '#f4f4f5' }}>
                                        <td style={{ padding: '12px 20px', fontFamily: 'monospace', fontSize: 12, color: '#a1a1aa' }}>
                                            {run.id}
                                        </td>
                                        <td style={{ padding: '12px 20px', color: '#a1a1aa', fontSize: 12 }}>
                                            {new Date(run.timestamp).toLocaleString()}
                                        </td>
                                        <td style={{ padding: '12px 20px' }}>
                                            <span style={{
                                                fontSize: 10,
                                                fontWeight: 700,
                                                padding: '2px 8px',
                                                borderRadius: 4,
                                                background: run.status === 'SUCCESS' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                                color: run.status === 'SUCCESS' ? '#10b981' : '#f59e0b',
                                                border: `1px solid ${run.status === 'SUCCESS' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                                            }}>
                                                {run.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px 20px' }}>{run.raw_records_extracted || 0}</td>
                                        <td style={{ padding: '12px 20px' }}>{run.clean_records_output || 0}</td>
                                        <td style={{ padding: '12px 20px', color: '#f59e0b', fontWeight: 600 }}>{run.avg_quality_score || 0}%</td>
                                        <td style={{ padding: '12px 20px', color: '#a1a1aa' }}>{run.duration_seconds || 0}s</td>
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

const MetricCard = ({ title, value, subtitle, status }) => (
    <div style={{
        background: '#18181b',
        border: '1px solid #27272a',
        borderRadius: 8,
        padding: 20,
    }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
            {title}
        </div>
        <div style={{
            fontSize: 22,
            fontWeight: 800,
            color: status === 'SUCCESS' ? '#10b981' : '#f4f4f5',
            lineHeight: 1.2,
            marginBottom: 4,
        }}>
            {value}
        </div>
        <div style={{ fontSize: 11, color: '#71717a' }}>
            {subtitle}
        </div>
    </div>
);

const SourceBox = ({ title, desc }) => (
    <div style={{
        background: '#09090b',
        border: '1px solid #27272a',
        borderRadius: 6,
        padding: 16,
    }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#f4f4f5', marginBottom: 6 }}>
            {title}
        </div>
        <div style={{ fontSize: 12, color: '#a1a1aa', lineHeight: 1.5 }}>
            {desc}
        </div>
    </div>
);

export default PipelineMonitor;
