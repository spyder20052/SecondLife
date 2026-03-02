import React, { useState, useEffect, useCallback } from 'react';
import {
    Users, CheckCircle, Package, MessageSquare, Star,
    TrendingUp, RefreshCw, AlertTriangle, BarChart2, Info
} from 'lucide-react';

// ─── Color scale ──────────────────────────────────────────────────────────────
function getRetentionColor(pct) {
    if (pct === null || pct === undefined) return null;
    if (pct >= 60) return { bg: '#16a34a', text: '#fff', ring: '#15803d' };
    if (pct >= 45) return { bg: '#22c55e', text: '#fff', ring: '#16a34a' };
    if (pct >= 30) return { bg: '#86efac', text: '#166534', ring: '#4ade80' };
    if (pct >= 20) return { bg: '#d1fae5', text: '#065f46', ring: '#6ee7b7' };
    if (pct >= 10) return { bg: '#fef9c3', text: '#713f12', ring: '#fde047' };
    if (pct >= 5) return { bg: '#fef08a', text: '#713f12', ring: '#facc15' };
    return { bg: '#fee2e2', text: '#991b1b', ring: '#fca5a5' };
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, highlight }) {
    return (
        <div style={{
            background: highlight ? 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' : '#fff',
            border: highlight ? 'none' : '1px solid #e2e8f0',
            borderRadius: 16,
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            boxShadow: highlight
                ? '0 8px 32px rgba(79,70,229,0.25)'
                : '0 1px 4px rgba(15,23,42,0.06)',
            flex: '1 1 160px',
            minWidth: 140,
        }}>
            <div style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: highlight ? 'rgba(255,255,255,0.18)' : '#f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
            }}>
                <Icon size={20} color={highlight ? '#fff' : '#6366f1'} strokeWidth={2} />
            </div>
            <div>
                <div style={{
                    fontSize: 24,
                    fontWeight: 800,
                    color: highlight ? '#fff' : '#0f172a',
                    lineHeight: 1.1,
                    letterSpacing: '-0.02em',
                }}>
                    {value}
                </div>
                <div style={{
                    fontSize: 12,
                    color: highlight ? 'rgba(255,255,255,0.8)' : '#64748b',
                    fontWeight: 500,
                    marginTop: 2,
                }}>
                    {label}
                </div>
            </div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function PMFCohortTable() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastRefresh, setLastRefresh] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = useCallback(async (manual = false) => {
        if (manual) setRefreshing(true);
        try {
            const res = await fetch('/api/analytics/pmf-cohorts');
            if (!res.ok) throw new Error(`Erreur serveur ${res.status}`);
            const json = await res.json();
            setData(json);
            setLastRefresh(new Date());
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
            if (manual) setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        const interval = setInterval(() => fetchData(), 60_000);
        return () => clearInterval(interval);
    }, [fetchData]);

    // ── Loading ──
    if (loading) return (
        <div style={S.fullPage}>
            <div style={S.loader}>
                <div style={S.spinnerRing} />
                <p style={{ color: '#64748b', marginTop: 16, fontWeight: 500 }}>
                    Chargement des données…
                </p>
            </div>
        </div>
    );

    // ── Error ──
    if (error) return (
        <div style={S.fullPage}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <AlertTriangle size={28} color="#dc2626" />
                </div>
                <p style={{ fontWeight: 700, color: '#0f172a', fontSize: 16 }}>Connexion impossible</p>
                <p style={{ color: '#64748b', fontSize: 13, textAlign: 'center', maxWidth: 320 }}>{error}</p>
                <button onClick={() => fetchData(true)} style={S.btnPrimary}>
                    <RefreshCw size={14} />
                    Réessayer
                </button>
            </div>
        </div>
    );

    // ── Empty ──
    if (!data?.cohorts?.length) return (
        <div style={S.fullPage}>
            <BarChart2 size={48} color="#cbd5e1" />
            <p style={{ color: '#94a3b8', marginTop: 12, fontWeight: 500 }}>Aucune donnée disponible</p>
        </div>
    );

    const { cohorts, overview } = data;
    const maxMonths = Math.max(...cohorts.map(c => c.retention.length));

    const kpis = [
        { icon: Users, label: 'Utilisateurs totaux', value: overview.totalUsers },
        { icon: CheckCircle, label: 'Utilisateurs actifs', value: overview.activeUsers },
        { icon: Package, label: 'Annonces publiées', value: overview.totalProducts },
        { icon: MessageSquare, label: 'Messages envoyés', value: overview.totalMessages },
        { icon: Star, label: 'Avis laissés', value: overview.totalReviews },
        { icon: TrendingUp, label: 'Rétention moy. M1', value: `${overview.avgRetentionM1}%`, highlight: true },
    ];

    const legendItems = [
        { color: '#16a34a', text: '#fff', label: '≥ 60%' },
        { color: '#22c55e', text: '#fff', label: '45–59%' },
        { color: '#86efac', text: '#166534', label: '30–44%' },
        { color: '#d1fae5', text: '#065f46', label: '20–29%' },
        { color: '#fef9c3', text: '#713f12', label: '10–19%' },
        { color: '#fef08a', text: '#713f12', label: '5–9%' },
        { color: '#fee2e2', text: '#991b1b', label: '< 5%' },
    ];

    return (
        <div style={S.page}>
            {/* ── Top bar ── */}
            <div style={S.topBar}>
                <div style={S.logoBlock}>
                    <div style={S.logoIcon}>
                        <Package size={18} color="#fff" />
                    </div>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: 15, color: '#0f172a', letterSpacing: '-0.01em' }}>Second Life</div>
                        <div style={{ fontSize: 9, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Eco-responsable</div>
                    </div>
                </div>
                <div style={S.pageTitle}>
                    <BarChart2 size={20} color="#6366f1" />
                    <span>Métriques PMF — Analyse par Cohortes</span>
                </div>
                <div style={S.topRight}>
                    <span style={S.refreshLabel}>
                        Mis à jour {lastRefresh ? lastRefresh.toLocaleTimeString('fr-FR') : '—'}
                    </span>
                    <button
                        onClick={() => fetchData(true)}
                        style={{ ...S.btnOutline, ...(refreshing ? { opacity: 0.6 } : {}) }}
                        disabled={refreshing}
                    >
                        <RefreshCw size={14} style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }} />
                        Actualiser
                    </button>
                </div>
            </div>

            <div style={S.inner}>
                {/* ── KPI strip ── */}
                <div style={S.kpiGrid}>
                    {kpis.map(k => (
                        <KpiCard key={k.label} icon={k.icon} label={k.label} value={k.value} highlight={k.highlight} />
                    ))}
                </div>

                {/* ── Table ── */}
                <div style={S.card}>
                    <div style={S.cardHeader}>
                        <span style={S.cardTitle}>Tableau de rétention</span>
                        <div style={S.legendRow}>
                            <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>Légende :</span>
                            {legendItems.map(l => (
                                <span key={l.label} style={{ ...S.legendPill, background: l.color, color: l.text }}>
                                    {l.label}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div style={S.tableScroll}>
                        <table style={S.table}>
                            <thead>
                                <tr>
                                    <th style={{ ...S.th, ...S.stickyCol1, textAlign: 'right' }}>Acquis</th>
                                    <th style={{ ...S.th, ...S.stickyCol2 }}>Cohorte</th>
                                    {Array.from({ length: maxMonths }, (_, i) => (
                                        <th key={i} style={S.th}>M{i}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {cohorts.map((cohort, rowIdx) => (
                                    <tr key={cohort.cohortKey} style={{ background: rowIdx % 2 === 0 ? '#fff' : '#f8fafc' }}>
                                        <td style={{ ...S.tdFixed, ...S.stickyCol1, textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                                            {cohort.utilisateursAcquis}
                                        </td>
                                        <td style={{ ...S.tdFixed, ...S.stickyCol2, fontWeight: 600, color: '#334155', whiteSpace: 'nowrap' }}>
                                            {cohort.mois} {cohort.annee !== new Date().getFullYear() ? cohort.annee : ''}
                                        </td>
                                        {Array.from({ length: maxMonths }, (_, mi) => {
                                            const pct = cohort.retention[mi];
                                            const colors = getRetentionColor(pct);
                                            return (
                                                <td key={mi} style={{
                                                    ...S.tdCell,
                                                    background: colors ? colors.bg : 'transparent',
                                                    color: colors ? colors.text : 'transparent',
                                                    fontWeight: pct !== null ? 700 : 400,
                                                }}>
                                                    {pct !== null && pct !== undefined ? `${pct}%` : ''}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* ── Note ── */}
                <div style={S.noteRow}>
                    <Info size={13} color="#94a3b8" />
                    <span>
                        M0 = mois d'inscription &nbsp;·&nbsp; M1 = 1 mois après inscription &nbsp;·&nbsp;
                        Un utilisateur est «&nbsp;actif&nbsp;» s'il a publié une annonce, envoyé un message ou laissé un avis ce mois-là.
                        &nbsp;·&nbsp; Actualisation automatique toutes les 60&nbsp;s.
                    </span>
                </div>
            </div>
        </div>
    );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const S = {
    fullPage: {
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8fafc',
        flexDirection: 'column',
        gap: 8,
    },
    loader: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
    },
    spinnerRing: {
        width: 40,
        height: 40,
        border: '3px solid #e2e8f0',
        borderTop: '3px solid #6366f1',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
    },
    page: {
        minHeight: '100vh',
        background: '#f8fafc',
        fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
        color: '#0f172a',
    },
    topBar: {
        background: '#fff',
        borderBottom: '1px solid #e2e8f0',
        padding: '0 32px',
        height: 64,
        display: 'flex',
        alignItems: 'center',
        gap: 24,
        position: 'sticky',
        top: 0,
        zIndex: 30,
    },
    logoBlock: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        flexShrink: 0,
    },
    logoIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 12px rgba(79,70,229,0.3)',
    },
    pageTitle: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontSize: 15,
        fontWeight: 700,
        color: '#0f172a',
        flex: 1,
        // hide label on very small screens via JS or just keep it
    },
    topRight: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        flexShrink: 0,
    },
    refreshLabel: {
        fontSize: 12,
        color: '#94a3b8',
        fontWeight: 500,
        whiteSpace: 'nowrap',
    },
    btnOutline: {
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '7px 14px',
        border: '1.5px solid #e2e8f0',
        borderRadius: 10,
        background: '#fff',
        cursor: 'pointer',
        fontSize: 13,
        fontWeight: 600,
        color: '#334155',
        transition: 'border-color 0.15s',
        whiteSpace: 'nowrap',
    },
    btnPrimary: {
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '10px 20px',
        border: 'none',
        borderRadius: 10,
        background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
        color: '#fff',
        cursor: 'pointer',
        fontSize: 14,
        fontWeight: 600,
    },
    inner: {
        maxWidth: 1400,
        margin: '0 auto',
        padding: '32px 32px 48px',
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
    },
    kpiGrid: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: 16,
    },
    card: {
        background: '#fff',
        borderRadius: 20,
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        boxShadow: '0 1px 4px rgba(15,23,42,0.06)',
    },
    cardHeader: {
        padding: '20px 24px',
        borderBottom: '1px solid #f1f5f9',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: 700,
        color: '#0f172a',
        letterSpacing: '-0.01em',
    },
    legendRow: {
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        flexWrap: 'wrap',
    },
    legendPill: {
        fontSize: 11,
        fontWeight: 700,
        padding: '3px 9px',
        borderRadius: 20,
    },
    tableScroll: {
        overflowX: 'auto',
    },
    table: {
        borderCollapse: 'collapse',
        width: '100%',
        fontSize: 13,
    },
    th: {
        background: '#f8fafc',
        color: '#64748b',
        fontWeight: 700,
        fontSize: 12,
        padding: '11px 14px',
        borderBottom: '1px solid #e2e8f0',
        whiteSpace: 'nowrap',
        textAlign: 'center',
        letterSpacing: '0.02em',
        textTransform: 'uppercase',
    },
    stickyCol1: {
        position: 'sticky',
        left: 0,
        zIndex: 2,
        background: '#f8fafc',
        borderRight: '1px solid #e2e8f0',
        minWidth: 80,
    },
    stickyCol2: {
        position: 'sticky',
        left: 80,
        zIndex: 2,
        background: '#f8fafc',
        borderRight: '2px solid #e2e8f0',
        minWidth: 120,
    },
    tdFixed: {
        padding: '12px 14px',
        borderBottom: '1px solid #f1f5f9',
    },
    tdCell: {
        padding: '10px 12px',
        borderBottom: '1px solid #f1f5f9',
        borderLeft: '1px solid #f8fafc',
        textAlign: 'center',
        fontSize: 13,
        fontWeight: 700,
        transition: 'background 0.2s',
        minWidth: 64,
    },
    noteRow: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: 8,
        fontSize: 12,
        color: '#94a3b8',
        lineHeight: 1.7,
        padding: '0 4px',
    },
};
