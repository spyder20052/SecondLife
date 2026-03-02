import React, { useState, useEffect, useCallback } from 'react';
import {
    Users, ShoppingBag, Package, MessageSquare, Star,
    TrendingUp, RefreshCw, AlertTriangle, BarChart2, Info, Target, CheckCircle2, XCircle
} from 'lucide-react';

// ─── Color scale ──────────────────────────────────────────────────────────────
function getRetentionColor(pct, isW1, pmfTarget) {
    if (pct === null || pct === undefined) return null;
    if (isW1) {
        if (pct >= pmfTarget) return { bg: '#4f46e5', text: '#fff', border: '#4338ca' }; // PMF atteint !
        if (pct >= pmfTarget * 0.7) return { bg: '#818cf8', text: '#fff', border: '#6366f1' };
        return { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' }; // Loin de l'objectif
    }
    if (pct >= 60) return { bg: '#16a34a', text: '#fff', border: '#15803d' };
    if (pct >= 45) return { bg: '#22c55e', text: '#fff', border: '#16a34a' };
    if (pct >= 30) return { bg: '#86efac', text: '#166534', border: '#4ade80' };
    if (pct >= 15) return { bg: '#d1fae5', text: '#065f46', border: '#6ee7b7' };
    if (pct >= 5) return { bg: '#fef9c3', text: '#713f12', border: '#fde047' };
    return { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' };
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, highlight, sub }) {
    return (
        <div style={{
            background: highlight ? 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' : '#fff',
            border: highlight ? 'none' : '1px solid #e2e8f0',
            borderRadius: 16,
            padding: '18px 22px',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            boxShadow: highlight ? '0 8px 32px rgba(79,70,229,0.25)' : '0 1px 4px rgba(15,23,42,0.06)',
            flex: '1 1 150px',
            minWidth: 140,
        }}>
            <div style={{
                width: 42, height: 42, borderRadius: 12,
                background: highlight ? 'rgba(255,255,255,0.18)' : '#f1f5f9',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
                <Icon size={19} color={highlight ? '#fff' : '#6366f1'} strokeWidth={2} />
            </div>
            <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: highlight ? '#fff' : '#0f172a', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
                    {value}
                </div>
                <div style={{ fontSize: 11, color: highlight ? 'rgba(255,255,255,0.8)' : '#64748b', fontWeight: 500, marginTop: 2 }}>
                    {label}
                </div>
                {sub && <div style={{ fontSize: 10, color: highlight ? 'rgba(255,255,255,0.6)' : '#94a3b8', marginTop: 1 }}>{sub}</div>}
            </div>
        </div>
    );
}

// ─── PMF Target Banner ────────────────────────────────────────────────────────
function PMFBanner({ avgW1, target }) {
    const reached = avgW1 >= target;
    const gap = target - avgW1;
    const pct = Math.min((avgW1 / target) * 100, 100);
    return (
        <div style={{
            background: '#fff',
            border: `2px solid ${reached ? '#4f46e5' : '#e2e8f0'}`,
            borderRadius: 16,
            padding: '20px 24px',
            boxShadow: reached ? '0 8px 32px rgba(79,70,229,0.12)' : '0 1px 4px rgba(15,23,42,0.06)',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: reached ? '#ede9fe' : '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Target size={20} color={reached ? '#6366f1' : '#dc2626'} />
                    </div>
                    <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Objectif PMF — Semaine 1</div>
                        <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                            {reached
                                ? `Objectif atteint — ${avgW1}% ≥ ${target}%`
                                : `Encore ${gap}% à gagner pour atteindre ${target}%`}
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {reached
                        ? <CheckCircle2 size={20} color="#6366f1" />
                        : <XCircle size={20} color="#dc2626" />}
                    <span style={{ fontSize: 22, fontWeight: 800, color: reached ? '#4f46e5' : '#dc2626' }}>{avgW1}%</span>
                    <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>/ {target}%</span>
                </div>
            </div>
            {/* Progress bar */}
            <div style={{ marginTop: 16, height: 8, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{
                    height: '100%',
                    width: `${pct}%`,
                    background: reached ? 'linear-gradient(90deg, #4f46e5, #7c3aed)' : 'linear-gradient(90deg, #f87171, #dc2626)',
                    borderRadius: 99,
                    transition: 'width 0.8s ease',
                }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                <span style={{ fontSize: 10, color: '#94a3b8' }}>0%</span>
                <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>Cible : {target}%</span>
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

    if (loading) return (
        <div style={S.center}>
            <div style={S.spinnerRing} />
            <p style={{ color: '#64748b', marginTop: 16, fontWeight: 500 }}>Chargement des données…</p>
        </div>
    );

    if (error) return (
        <div style={S.center}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle size={26} color="#dc2626" />
            </div>
            <p style={{ fontWeight: 700, color: '#0f172a', fontSize: 16, marginTop: 12 }}>Connexion impossible</p>
            <p style={{ color: '#64748b', fontSize: 13, textAlign: 'center', maxWidth: 300, marginTop: 4 }}>{error}</p>
            <button onClick={() => fetchData(true)} style={S.btnPrimary}><RefreshCw size={14} /> Réessayer</button>
        </div>
    );

    if (!data?.cohorts?.length) return (
        <div style={S.center}>
            <BarChart2 size={48} color="#cbd5e1" />
            <p style={{ color: '#94a3b8', marginTop: 12, fontWeight: 500 }}>Aucune donnée disponible</p>
        </div>
    );

    const { cohorts, overview = {}, pmfTarget = 70 } = data;
    const ov = {
        totalUsers: overview.totalUsers ?? 0,
        uniqueBuyers: overview.uniqueBuyers ?? 0,
        totalProducts: overview.totalProducts ?? 0,
        totalSold: overview.totalSold ?? 0,
        totalMessages: overview.totalMessages ?? 0,
        totalReviews: overview.totalReviews ?? 0,
        avgW1: overview.avgW1 ?? 0,
    };
    const maxWeeks = cohorts.length ? Math.max(...cohorts.map(c => c.retention.length)) : 1;

    const kpis = [
        { icon: Users, label: 'Utilisateurs inscrits', value: ov.totalUsers },
        { icon: ShoppingBag, label: 'Acheteurs uniques', value: ov.uniqueBuyers },
        { icon: Package, label: 'Produits vendus', value: ov.totalSold },
        { icon: MessageSquare, label: 'Messages échangés', value: ov.totalMessages },
        { icon: Star, label: 'Avis laissés', value: ov.totalReviews },
        { icon: TrendingUp, label: 'Rétention moy. S1', value: `${ov.avgW1}%`, highlight: true, sub: `Objectif : ${pmfTarget}%` },
    ];

    const legendItems = [
        { bg: '#4f46e5', text: '#fff', label: `S1 ≥ ${pmfTarget}% (PMF)` },
        { bg: '#818cf8', text: '#fff', label: 'S1 proche' },
        { bg: '#16a34a', text: '#fff', label: '≥ 60%' },
        { bg: '#22c55e', text: '#fff', label: '45–59%' },
        { bg: '#86efac', text: '#166534', label: '30–44%' },
        { bg: '#fef9c3', text: '#713f12', label: '5–29%' },
        { bg: '#fee2e2', text: '#991b1b', label: '< 5%' },
    ];

    return (
        <div style={S.page}>
            {/* ── Top bar ── */}
            <div style={S.topBar}>
                <div style={S.logoBlock}>
                    <div style={S.logoIcon}><Package size={17} color="#fff" /></div>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: 14, color: '#0f172a' }}>Second Life</div>
                        <div style={{ fontSize: 9, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Eco-responsable</div>
                    </div>
                </div>
                <div style={S.pageTitle}>
                    <BarChart2 size={18} color="#6366f1" />
                    <span>Métriques PMF — Analyse par Cohortes</span>
                </div>
                <div style={S.topRight}>
                    <span style={S.refreshLabel}>
                        Mis à jour {lastRefresh ? lastRefresh.toLocaleTimeString('fr-FR') : '—'}
                    </span>
                    <button onClick={() => fetchData(true)} style={S.btnOutline} disabled={refreshing}>
                        <RefreshCw size={13} style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }} />
                        Actualiser
                    </button>
                </div>
            </div>

            <div style={S.inner}>
                {/* ── KPI strip ── */}
                <div style={S.kpiGrid}>
                    {kpis.map(k => <KpiCard key={k.label} {...k} />)}
                </div>

                {/* ── PMF Target Banner ── */}
                <PMFBanner avgW1={ov.avgW1} target={pmfTarget} />

                {/* ── Table ── */}
                <div style={S.card}>
                    <div style={S.cardHeader}>
                        <div>
                            <span style={S.cardTitle}>Tableau de rétention hebdomadaire — Achats</span>
                            <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 10 }}>
                                S0 = semaine d'inscription · S1 = 1ère semaine suivante
                            </span>
                        </div>
                        <div style={S.legendRow}>
                            {legendItems.map(l => (
                                <span key={l.label} style={{ ...S.legendPill, background: l.bg, color: l.text }}>{l.label}</span>
                            ))}
                        </div>
                    </div>
                    <div style={S.tableScroll}>
                        <table style={S.table}>
                            <thead>
                                <tr>
                                    <th style={{ ...S.th, ...S.stickyCol1, textAlign: 'right' }}>Acquis</th>
                                    <th style={{ ...S.th, ...S.stickyCol2 }}>Cohorte</th>
                                    {Array.from({ length: maxWeeks }, (_, i) => (
                                        <th key={i} style={{
                                            ...S.th,
                                            ...(i === 1 ? { background: '#ede9fe', color: '#4f46e5', borderBottom: '2px solid #818cf8' } : {}),
                                        }}>
                                            {i === 1 ? (
                                                <span style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center' }}>
                                                    <Target size={11} /> S{i}
                                                </span>
                                            ) : `S${i}`}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {cohorts.map((cohort, rowIdx) => (
                                    <tr key={cohort.weekKey} style={{ background: rowIdx % 2 === 0 ? '#fff' : '#f8fafc' }}>
                                        <td style={{ ...S.tdFixed, ...S.stickyCol1, textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                                            {cohort.utilisateursAcquis}
                                        </td>
                                        <td style={{ ...S.tdFixed, ...S.stickyCol2, fontWeight: 600, color: '#334155', whiteSpace: 'nowrap', fontSize: 12 }}>
                                            {cohort.label}
                                        </td>
                                        {Array.from({ length: maxWeeks }, (_, wi) => {
                                            const pct = cohort.retention[wi];
                                            const isW1 = wi === 1;
                                            const colors = getRetentionColor(pct, isW1, pmfTarget);
                                            return (
                                                <td key={wi} style={{
                                                    ...S.tdCell,
                                                    background: colors ? colors.bg : 'transparent',
                                                    color: colors ? colors.text : '#cbd5e1',
                                                    fontWeight: pct !== null ? 700 : 400,
                                                    ...(isW1 && !colors ? { background: '#f5f3ff' } : {}),
                                                    fontSize: isW1 ? 14 : 13,
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
                    <Info size={12} color="#94a3b8" style={{ flexShrink: 0, marginTop: 1 }} />
                    <span>
                        Un utilisateur est comptabilisé s'il a effectué au moins 1 achat (produit marqué «&nbsp;vendu&nbsp;» avec son identifiant acheteur) durant cette semaine.
                        La colonne <strong style={{ color: '#4f46e5' }}>S1</strong> est l'objectif PMF clé : <strong>{pmfTarget}%</strong> d'acheteurs dans la 1ère semaine suivant l'inscription.
                        &nbsp;·&nbsp; Actualisation automatique toutes les 60&nbsp;s.
                    </span>
                </div>
            </div>
        </div>
    );
}

const S = {
    center: {
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', background: '#f8fafc', gap: 8,
    },
    spinnerRing: {
        width: 38, height: 38, border: '3px solid #e2e8f0',
        borderTop: '3px solid #6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite',
    },
    page: {
        minHeight: '100vh', background: '#f8fafc',
        fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif", color: '#0f172a',
    },
    topBar: {
        background: '#fff', borderBottom: '1px solid #e2e8f0',
        padding: '0 28px', height: 60,
        display: 'flex', alignItems: 'center', gap: 20,
        position: 'sticky', top: 0, zIndex: 30,
    },
    logoBlock: { display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 },
    logoIcon: {
        width: 34, height: 34, borderRadius: 9,
        background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 3px 10px rgba(79,70,229,0.3)',
    },
    pageTitle: {
        display: 'flex', alignItems: 'center', gap: 8,
        fontSize: 14, fontWeight: 700, color: '#0f172a', flex: 1,
    },
    topRight: { display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 },
    refreshLabel: { fontSize: 11, color: '#94a3b8', fontWeight: 500, whiteSpace: 'nowrap' },
    btnOutline: {
        display: 'flex', alignItems: 'center', gap: 5,
        padding: '6px 12px', border: '1.5px solid #e2e8f0', borderRadius: 9,
        background: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#334155',
        whiteSpace: 'nowrap',
    },
    btnPrimary: {
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '9px 18px', border: 'none', borderRadius: 9,
        background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
        color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, marginTop: 8,
    },
    inner: { maxWidth: 1400, margin: '0 auto', padding: '28px 28px 48px', display: 'flex', flexDirection: 'column', gap: 20 },
    kpiGrid: { display: 'flex', flexWrap: 'wrap', gap: 14 },
    card: { background: '#fff', borderRadius: 18, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 4px rgba(15,23,42,0.06)' },
    cardHeader: { padding: '18px 22px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 },
    cardTitle: { fontSize: 13, fontWeight: 700, color: '#0f172a' },
    legendRow: { display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' },
    legendPill: { fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20 },
    tableScroll: { overflowX: 'auto' },
    table: { borderCollapse: 'collapse', width: '100%', fontSize: 13 },
    th: {
        background: '#f8fafc', color: '#64748b', fontWeight: 700, fontSize: 11,
        padding: '10px 12px', borderBottom: '1px solid #e2e8f0',
        whiteSpace: 'nowrap', textAlign: 'center',
        letterSpacing: '0.04em', textTransform: 'uppercase',
    },
    stickyCol1: { position: 'sticky', left: 0, zIndex: 2, background: '#f8fafc', borderRight: '1px solid #e2e8f0', minWidth: 72 },
    stickyCol2: { position: 'sticky', left: 72, zIndex: 2, background: '#f8fafc', borderRight: '2px solid #e2e8f0', minWidth: 130 },
    tdFixed: { padding: '11px 12px', borderBottom: '1px solid #f1f5f9' },
    tdCell: {
        padding: '9px 10px', borderBottom: '1px solid #f1f5f9', borderLeft: '1px solid #f8fafc',
        textAlign: 'center', transition: 'background 0.2s', minWidth: 64,
    },
    noteRow: { display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: '#94a3b8', lineHeight: 1.7, padding: '0 2px' },
};
