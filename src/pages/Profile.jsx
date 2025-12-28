import React, { useState, useEffect } from 'react';
import { User, LogOut, ChevronRight, Package, ShoppingBag, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import { auth, db, appId } from '../firebase';
import { signOut } from 'firebase/auth';
import { collection, onSnapshot, query, where } from 'firebase/firestore';

function Profile({ user, products }) {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('selling');
    const [soldCount, setSoldCount] = useState(0);
    const [soldProducts, setSoldProducts] = useState([]);

    useEffect(() => {
        if (!user || user.isAnonymous) return;

        // Listen for sold items (based on payment_confirmed messages)
        // Ideally, we'd have a 'status' field on the product, but for now we infer from messages or just show products
        // Let's stick to showing products user is selling for now, and maybe a "Sold" tab if we had that data.
        // Since we don't strictly update product status to 'sold' in DB yet (only message), we'll simulate "Sold" 
        // by checking if there's a payment_confirmed message for the product.

        const q = query(
            collection(db, 'artifacts', appId, 'public', 'data', 'messages'),
            where('type', '==', 'payment_confirmed'),
            where('sellerId', '==', user.uid)
        );

        const unsub = onSnapshot(q, (snapshot) => {
            const soldIds = new Set(snapshot.docs.map(d => d.data().productId));
            setSoldCount(soldIds.size);
            // In a real app, we'd filter products by this ID list
            // For now, let's just use a dummy list or the actual logic if we can match IDs
            const sold = products.filter(p => soldIds.has(p.id));
            setSoldProducts(sold);
        });

        return () => unsub();
    }, [user, products]);

    const handleSignOut = () => {
        signOut(auth);
    };

    if (!user) return null;

    // Products user is selling (excluding sold ones ideally, but let's just show all for now minus sold)
    const userProducts = products.filter(p => p.sellerId === user.uid);

    if (user.isAnonymous) return (
        <div className="p-10 flex flex-col items-center justify-center text-center gap-8 h-full">
            <div className="w-24 h-24 bg-indigo-50 rounded-[40px] flex items-center justify-center text-indigo-600 shadow-2xl shadow-indigo-100"><User size={48} /></div>
            <h2 className="text-3xl font-black">Rejoignez-nous !</h2>
            <Button onClick={() => navigate('/auth')} className="w-full py-5">Se connecter / S'inscrire</Button>
        </div>
    );

    const StatCard = ({ label, value, color, icon: Icon }) => (
        <div className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center text-white`}>
                <Icon size={20} />
            </div>
            <div>
                <p className="text-2xl font-black text-slate-900 leading-none mb-1">{value}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{label}</p>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-slate-50">
            {/* Header */}
            <div className="p-8 pb-10 bg-white rounded-b-[40px] shadow-sm z-10">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-xl font-black text-slate-900">Mon Profil</h1>
                    <button onClick={handleSignOut} className="p-3 bg-rose-50 text-rose-500 rounded-2xl active:scale-90"><LogOut size={20} /></button>
                </div>

                <div className="flex items-center gap-6 mb-8">
                    <div className="w-24 h-24 rounded-[32px] bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-4xl font-black shadow-2xl shadow-indigo-200">
                        {user.photoURL ? <img src={user.photoURL} className="w-full h-full object-cover rounded-[32px]" /> : (user.displayName || user.email || 'U')[0]}
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-900">{user.displayName || 'Utilisateur'}</h2>
                        <p className="text-xs text-slate-400 font-bold tracking-widest mt-1">{user.email}</p>
                        <div className="mt-3 inline-flex items-center px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-wide">
                            Vendeur Vérifié
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <StatCard label="En ligne" value={userProducts.length} color="bg-indigo-500" icon={Package} />
                    <StatCard label="Ventes" value={soldCount} color="bg-emerald-500" icon={ShoppingBag} />
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-6">
                <div className="flex gap-6 mb-6 px-2">
                    {['selling', 'sold', 'likes'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`text-sm font-black transition-colors ${activeTab === tab ? 'text-slate-900' : 'text-slate-300 hover:text-slate-400'}`}
                        >
                            {tab === 'selling' && 'En vente'}
                            {tab === 'sold' && 'Vendus'}
                            {tab === 'likes' && 'Favoris'}
                        </button>
                    ))}
                </div>

                <div className="flex flex-col gap-4 pb-20">
                    {activeTab === 'selling' && (
                        userProducts.length > 0 ? userProducts.map(p => (
                            <div key={p.id} className="bg-white p-4 rounded-[28px] border border-slate-100 flex gap-5 items-center shadow-sm" onClick={() => navigate(`/product/${p.id}`)}>
                                <div className="w-16 h-16 rounded-2xl bg-slate-50 overflow-hidden"><img src={p.imageUrl} alt="" className="w-full h-full object-cover" /></div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-black text-slate-800 truncate text-sm">{p.title}</h4>
                                    <p className="text-indigo-600 font-black text-sm">{p.price} FCFA</p>
                                </div>
                                <div className="p-3 bg-slate-50 text-slate-400 rounded-xl"><ChevronRight size={18} /></div>
                            </div>
                        )) : <div className="text-center text-slate-400 text-sm font-bold mt-10">Aucune annonce en cours</div>
                    )}

                    {activeTab === 'sold' && (
                        soldProducts.length > 0 ? soldProducts.map(p => (
                            <div key={p.id} className="bg-white/50 p-4 rounded-[28px] border border-slate-100 flex gap-5 items-center opacity-70">
                                <div className="w-16 h-16 rounded-2xl bg-slate-50 overflow-hidden grayscale"><img src={p.imageUrl} alt="" className="w-full h-full object-cover" /></div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-black text-slate-800 truncate text-sm line-through">{p.title}</h4>
                                    <div className="text-emerald-500 font-black text-[10px] uppercase tracking-wide">Vendu</div>
                                </div>
                            </div>
                        )) : <div className="text-center text-slate-400 text-sm font-bold mt-10">Aucune vente pour le moment</div>
                    )}

                    {activeTab === 'likes' && (
                        <div className="text-center text-slate-400 text-sm font-bold mt-10 flex flex-col items-center gap-4">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-300"><Heart size={24} /></div>
                            Vos coups de cœur apparaîtront ici
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Profile;
