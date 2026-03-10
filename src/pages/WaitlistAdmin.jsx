import React, { useState, useEffect } from 'react';
import { Users, Mail, MapPin, Calendar, Download, Search, ArrowLeft, Trash2, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function WaitlistAdmin() {
    const navigate = useNavigate();
    const [entries, setEntries] = useState([]);
    const [count, setCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [error, setError] = useState('');

    const fetchEntries = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/waitlist/all');
            const data = await res.json();
            if (res.ok) {
                setEntries(data.entries || []);
                setCount(data.count || 0);
            } else {
                setError(data.message || 'Erreur de chargement.');
            }
        } catch {
            setError('Impossible de charger les données.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchEntries(); }, []);

    const filtered = entries.filter(e =>
        e.name?.toLowerCase().includes(search.toLowerCase()) ||
        e.email?.toLowerCase().includes(search.toLowerCase()) ||
        e.city?.toLowerCase().includes(search.toLowerCase())
    );

    const exportCSV = () => {
        const header = 'Nom,Email,Ville,Date\n';
        const rows = entries.map(e =>
            `"${e.name}","${e.email}","${e.city || ''}","${new Date(e.createdAt).toLocaleDateString('fr-FR')}"`
        ).join('\n');
        const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `waitlist_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const formatDate = (d) => {
        const date = new Date(d);
        return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const formatTime = (d) => {
        const date = new Date(d);
        return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    };

    // Cities breakdown
    const cityStats = entries.reduce((acc, e) => {
        const city = e.city?.trim() || 'Non renseigné';
        acc[city] = (acc[city] || 0) + 1;
        return acc;
    }, {});
    const topCities = Object.entries(cityStats).sort((a, b) => b[1] - a[1]).slice(0, 5);

    return (
        <div className="min-h-screen font-sans antialiased" style={{ background: '#0C2E2C' }}>
            <div className="max-w-3xl mx-auto px-4 py-6">

                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate('/welcome')} className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white/60 hover:bg-white/20 transition-all">
                            <ArrowLeft size={16} />
                        </button>
                        <div>
                            <h1 className="text-xl font-black text-white">Waitlist Dashboard</h1>
                            <p className="text-xs text-white/40">Données complètes des inscrits</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={fetchEntries} className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white/60 hover:bg-white/20 transition-all" title="Rafraîchir">
                            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                        </button>
                        <button onClick={exportCSV} disabled={entries.length === 0} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 text-white/80 text-xs font-bold hover:bg-white/20 transition-all disabled:opacity-30">
                            <Download size={13} /> CSV
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                    <div className="bg-white/8 backdrop-blur-md rounded-2xl p-4 border border-white/8">
                        <Users size={16} className="text-white/40 mb-2" />
                        <p className="text-2xl font-black text-white">{count}</p>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-white/30">Total inscrits</p>
                    </div>
                    <div className="bg-white/8 backdrop-blur-md rounded-2xl p-4 border border-white/8">
                        <MapPin size={16} className="text-white/40 mb-2" />
                        <p className="text-2xl font-black text-white">{Object.keys(cityStats).length}</p>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-white/30">Villes</p>
                    </div>
                    <div className="bg-white/8 backdrop-blur-md rounded-2xl p-4 border border-white/8">
                        <Calendar size={16} className="text-white/40 mb-2" />
                        <p className="text-2xl font-black text-white">
                            {entries.length > 0 ? formatDate(entries[0]?.createdAt).split(' ')[0] : '—'}
                        </p>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-white/30">Dernier inscrit</p>
                    </div>
                </div>

                {/* Top cities */}
                {topCities.length > 0 && (
                    <div className="bg-white/8 backdrop-blur-md rounded-2xl p-4 border border-white/8 mb-6">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-white/30 mb-3">Top villes</p>
                        <div className="space-y-2">
                            {topCities.map(([city, n], i) => (
                                <div key={city} className="flex items-center gap-3">
                                    <span className="text-[10px] font-black text-white/30 w-4">{i + 1}</span>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-xs font-bold text-white/80">{city}</span>
                                            <span className="text-[10px] font-black text-white/40">{n}</span>
                                        </div>
                                        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                            <div className="h-full rounded-full" style={{ width: `${(n / count) * 100}%`, background: '#5FBFB9' }} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Search */}
                <div className="relative mb-4">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" size={15} />
                    <input
                        type="text"
                        placeholder="Rechercher par nom, email ou ville..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-white/8 border border-white/8 rounded-xl py-3 pl-10 pr-4 outline-none focus:ring-2 focus:ring-white/10 focus:border-white/20 transition-all text-sm font-medium placeholder:text-white/25 text-white"
                    />
                </div>

                {/* Error */}
                {error && (
                    <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 p-3 rounded-xl text-xs font-bold text-center mb-4">
                        {error}
                    </div>
                )}

                {/* Loading */}
                {loading ? (
                    <div className="text-center py-12">
                        <div className="w-8 h-8 border-2 border-white/10 border-t-white/50 rounded-full animate-spin mx-auto mb-3" />
                        <p className="text-xs text-white/30">Chargement...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-12">
                        <Users size={32} className="mx-auto text-white/15 mb-3" />
                        <p className="text-sm font-bold text-white/30">
                            {search ? 'Aucun résultat pour cette recherche' : 'Aucun inscrit pour le moment'}
                        </p>
                    </div>
                ) : (
                    /* Entries List */
                    <div className="space-y-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-white/20 mb-2">
                            {filtered.length} inscrit{filtered.length > 1 ? 's' : ''} {search ? 'trouvé' + (filtered.length > 1 ? 's' : '') : ''}
                        </p>
                        {filtered.map((entry, i) => (
                            <div key={entry._id || i} className="bg-white/6 backdrop-blur-md rounded-2xl p-4 border border-white/6 hover:bg-white/10 transition-all group">
                                <div className="flex items-start gap-3">
                                    {/* Avatar */}
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0"
                                        style={{ background: `hsl(${(i * 37) % 360}, 35%, 30%)`, color: `hsl(${(i * 37) % 360}, 50%, 80%)` }}>
                                        {entry.name?.charAt(0)?.toUpperCase() || '?'}
                                    </div>
                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-bold text-white text-sm truncate">{entry.name}</h3>
                                            <span className="text-[9px] font-bold text-white/20 flex-shrink-0 ml-2">
                                                #{count - i}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5 mt-1">
                                            <Mail size={10} className="text-white/25 flex-shrink-0" />
                                            <p className="text-xs text-white/50 truncate">{entry.email}</p>
                                        </div>
                                        <div className="flex items-center gap-3 mt-1.5">
                                            {entry.city && (
                                                <div className="flex items-center gap-1">
                                                    <MapPin size={10} className="text-white/20" />
                                                    <span className="text-[10px] font-medium text-white/35">{entry.city}</span>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-1">
                                                <Calendar size={10} className="text-white/20" />
                                                <span className="text-[10px] font-medium text-white/35">{formatDate(entry.createdAt)} à {formatTime(entry.createdAt)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Footer */}
                <div className="text-center py-8 mt-4">
                    <p className="text-[10px] text-white/15 font-bold uppercase tracking-widest">
                        SecondLife — Waitlist Admin
                    </p>
                </div>
            </div>
        </div>
    );
}
