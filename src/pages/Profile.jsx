import React, { useState, useEffect } from 'react';
import { User, LogOut, ChevronRight, Package, ShoppingBag, Heart, Edit2, Camera, Save, X, MapPin, Star } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '../components/Button';
import Input from '../components/Input';
import { compressImage } from '../utils/image';
import { useToast } from '../components/Toast';

function Profile({ user: currentUser, products }) {
    const navigate = useNavigate();
    const { id } = useParams(); // If present, we are viewing another user's profile
    const { addToast } = useToast();

    // Determine which profile to show
    const isPublicView = id && currentUser?.uid !== id;
    const profileId = isPublicView ? id : currentUser?.uid;

    const [profileUser, setProfileUser] = useState(isPublicView ? null : currentUser);
    const [loadingProfile, setLoadingProfile] = useState(isPublicView);

    const [activeTab, setActiveTab] = useState('selling');
    const [soldCount, setSoldCount] = useState(0);
    const [soldProducts, setSoldProducts] = useState([]);
    const [reviews, setReviews] = useState([]);

    // Edit Mode State (Private Only)
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState("");
    const [editCity, setEditCity] = useState("");
    const [editPassword, setEditPassword] = useState("");
    const [editPhoto, setEditPhoto] = useState(null); // File
    const [editPhotoPreview, setEditPhotoPreview] = useState(null); // URL/Base64
    const [saving, setSaving] = useState(false);

    // Fetch Profile Data (Public or Private extra data like city/ratings)
    useEffect(() => {
        if (!profileId) return;

        const fetchProfileData = async () => {
            try {
                const res = await fetch(`/api/users/${profileId}`);
                if (res.ok) {
                    const data = await res.json();
                    if (isPublicView) {
                        setProfileUser(data);
                    } else {
                        // For private view, sync city if needed
                        setEditCity(data.city || "");
                        // Also fetch reviews for this user
                        fetchReviews(profileId);
                    }
                }
            } catch (err) { console.error("Error fetching profile", err); } finally {
                setLoadingProfile(false);
            }
        };

        const fetchReviews = async (uid) => {
            try {
                const res = await fetch(`/api/reviews/seller/${uid}`);
                if (res.ok) {
                    setReviews(await res.json());
                }
            } catch (e) { console.error(e); }
        };

        fetchProfileData();
        if (isPublicView) fetchReviews(profileId);
    }, [profileId, isPublicView]);

    // Fetch Sold Count (still relies on local products prop)
    useEffect(() => {
        if (!profileId) return;
        const usersSold = products.filter(p => p.sellerId === profileId && p.status === 'sold');
        setSoldCount(usersSold.length);
        setSoldProducts(usersSold);
    }, [profileId, products]);


    const handleSignOut = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/'; // Hard reload to clear state
    };

    const startEditing = () => {
        if (!currentUser) return;
        setEditName(currentUser.displayName || "");
        setEditCity(profileUser?.city || "");
        setEditPhotoPreview(currentUser.photoURL);
        setIsEditing(true);
    };

    const handlePhotoChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            setEditPhoto(file);
            setEditPhotoPreview(URL.createObjectURL(file));
        }
    };

    const handleSaveProfile = async () => {
        if (!editName.trim()) {
            addToast("Le nom est obligatoire", "error");
            return;
        }
        if (!currentUser) return;
        setSaving(true);
        try {
            let photoURL = currentUser.photoURL;
            if (editPhoto) {
                photoURL = await compressImage(editPhoto, 0.5, 300, 300);
            }

            const updateData = {
                displayName: editName,
                city: editCity,
                photoURL: photoURL
            };
            if (editPassword) updateData.password = editPassword;

            const res = await fetch(`/api/users/${currentUser.uid}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData)
            });

            if (!res.ok) throw new Error("Update failed");

            // Update local storage to reflect changes immediately
            const updatedUser = { ...currentUser, ...updateData };
            localStorage.setItem('user', JSON.stringify(updatedUser));

            // Force reload or callback to update App state would be better, 
            // but for now relying on App.jsx polling to pick it up eventually, 
            // or we could manually trigger a refresh if we had a context.
            // window.location.reload(); // A bit harsh, but ensures consistency.
            // Instead, let's just update local view state
            setProfileUser(prev => ({ ...prev, ...updateData }));

            addToast("Profil mis à jour !", "success");
            setIsEditing(false);
        } catch (err) {
            console.error("Error updating profile:", err);
            addToast("Erreur lors de la mise à jour", "error");
        } finally {
            setSaving(false);
        }
    };

    const handleRelist = (product) => {
        // Redirect to Post page with pre-filled data
        navigate('/post', { state: { productToRelist: product } });
    };

    if (loadingProfile) return <div className="p-10 text-center">Chargement du profil...</div>;

    // Show Login if trying to access private profile without auth
    if (!isPublicView && (!currentUser || currentUser.isAnonymous)) return (
        <div className="p-10 flex flex-col items-center justify-center text-center gap-8 h-full">
            <div className="w-24 h-24 bg-indigo-50 rounded-[40px] flex items-center justify-center text-indigo-600 shadow-2xl shadow-indigo-100"><User size={48} /></div>
            <h2 className="text-3xl font-black">Rejoignez-nous !</h2>
            <Button onClick={() => navigate('/auth')} className="w-full py-5">Se connecter / S'inscrire</Button>
        </div>
    );

    // Use local profileUser state (which gets optimistic updates) or fall back to currentUser
    const displayUser = profileUser || currentUser;

    // Sync effect removed to prevent overwriting optimistic updates with stale prop data.

    if (!displayUser) return <div className="p-10 text-center">Utilisateur introuvable</div>;

    const userProducts = products.filter(p => p.sellerId === profileId && (p.status === 'available' || p.status === 'active'));

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

    if (isEditing) {
        return (
            <div className="flex flex-col h-full bg-white animate-in slide-in-from-bottom duration-300">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="text-xl font-black text-slate-900">Modifier le profil</h2>
                    <button onClick={() => setIsEditing(false)} className="p-2 bg-slate-50 rounded-full text-slate-400 hover:text-slate-900"><X size={24} /></button>
                </div>
                <div className="p-8 flex-1 overflow-y-auto flex flex-col gap-6">
                    {/* Photo Upload */}
                    <div className="flex justify-center">
                        <label className="relative cursor-pointer group">
                            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-slate-100 group-hover:border-indigo-100 transition-colors">
                                {editPhotoPreview ? (
                                    <img src={editPhotoPreview} className="w-full h-full object-cover" alt="Preview" />
                                ) : (
                                    <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-300"><User size={48} /></div>
                                )}
                            </div>
                            <div className="absolute bottom-0 right-0 bg-indigo-600 text-white p-2.5 rounded-full shadow-lg border-2 border-white">
                                <Camera size={20} />
                            </div>
                            <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                        </label>
                    </div>

                    <div className="flex flex-col gap-5">
                        <Input label="Nom complet" value={editName} onChange={setEditName} icon={User} placeholder="Votre nom" />
                        <Input label="Ville" value={editCity} onChange={setEditCity} icon={MapPin} placeholder="Votre ville" />
                        <Input label="Nouveau mot de passe" type="password" value={editPassword} onChange={setEditPassword} icon={LogOut} placeholder="Laisser vide pour ne pas changer" />
                    </div>
                </div>
                <div className="p-6 border-t border-slate-100">
                    <Button onClick={handleSaveProfile} loading={saving} className="py-4 shadow-xl shadow-indigo-200">
                        <Save size={20} className="mr-2" /> Enregistrer
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-slate-50">
            {/* Header */}
            <div className={`p-8 pb-10 bg-white rounded-b-[40px] shadow-sm z-10 relative ${isPublicView ? 'pt-12' : ''}`}>
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-xl font-black text-slate-900">{isPublicView ? 'Profil Vendeur' : 'Mon Profil'}</h1>
                    {!isPublicView && (
                        <div className="flex gap-2">
                            <button onClick={startEditing} className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl active:scale-90 hover:bg-indigo-100 transition-colors" title="Modifier">
                                <Edit2 size={20} />
                            </button>
                            <button onClick={handleSignOut} className="p-3 bg-rose-50 text-rose-500 rounded-2xl active:scale-90 hover:bg-rose-100 transition-colors" title="Déconnexion">
                                <LogOut size={20} />
                            </button>
                        </div>
                    )}
                    {isPublicView && (
                        <button onClick={() => navigate(-1)} className="p-3 bg-slate-50 text-slate-400 rounded-2xl active:scale-90 hover:bg-slate-100 transition-colors">
                            <X size={20} />
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-6 mb-8">
                    <div className="w-24 h-24 rounded-[32px] bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-4xl font-black shadow-2xl shadow-indigo-200 overflow-hidden">
                        {displayUser.photoURL ? <img src={displayUser.photoURL} className="w-full h-full object-cover" alt="Profile" /> : (displayUser.displayName || displayUser.email || 'U')[0].toUpperCase()}
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-900">{displayUser.displayName || 'Utilisateur'}</h2>
                        <p className="text-xs text-slate-400 font-bold tracking-widest mt-1 flex items-center gap-1">
                            {displayUser.city && <><MapPin size={12} /> {displayUser.city} • </>} {isPublicView ? 'Membre vérifié' : displayUser.email}
                        </p>
                        <div className="mt-3 flex gap-2">
                            <div className="inline-flex items-center px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-wide">
                                Vendeur Vérifié
                            </div>
                            {displayUser.ratingCount > 0 && (
                                <div className="inline-flex items-center px-2 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-wide gap-1">
                                    <Heart size={10} className="fill-amber-500" />
                                    {(displayUser.ratingSum / displayUser.ratingCount).toFixed(1)} / 5
                                </div>
                            )}
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
                    {['selling', 'reviews'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`text-sm font-black transition-colors ${activeTab === tab ? 'text-slate-900' : 'text-slate-300 hover:text-slate-400'}`}
                        >
                            {tab === 'selling' && 'En vente'}
                            {tab === 'reviews' && `Avis (${reviews.length})`}
                        </button>
                    ))}
                    {!isPublicView && (
                        <button onClick={() => setActiveTab('sold')} className={`text-sm font-black transition-colors ${activeTab === 'sold' ? 'text-slate-900' : 'text-slate-300 hover:text-slate-400'}`}>
                            Vendus
                        </button>
                    )}
                </div>

                <div className="flex flex-col gap-4 pb-20">
                    {activeTab === 'selling' && (
                        userProducts.length > 0 ? userProducts.map(p => (
                            <div key={p.id} className="bg-white p-4 rounded-[28px] border border-slate-100 flex gap-5 items-center shadow-sm active:scale-95 transition-transform" onClick={() => navigate(`/product/${p.id}`)}>
                                <div className="w-16 h-16 rounded-2xl bg-slate-50 overflow-hidden"><img src={p.imageUrl} alt="" className="w-full h-full object-cover" /></div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-black text-slate-800 truncate text-sm">{p.title}</h4>
                                    <p className="text-indigo-600 font-black text-sm">{p.price} FCFA</p>
                                </div>
                                <div className="p-3 bg-slate-50 text-slate-400 rounded-xl"><ChevronRight size={18} /></div>
                            </div>
                        )) : <div className="text-center text-slate-400 text-sm font-bold mt-10">Aucune annonce en cours</div>
                    )}

                    {activeTab === 'reviews' && (
                        reviews.length > 0 ? reviews.map(r => (
                            <div key={r.id} className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h5 className="font-bold text-slate-900 text-sm">{r.reviewerName || 'Acheteur'}</h5>
                                        <div className="flex text-amber-400 mt-0.5">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} size={12} className={i < r.rating ? "fill-amber-400" : "text-slate-200"} />
                                            ))}
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : 'Récemment'}
                                    </span>
                                </div>
                                <p className="text-sm font-medium text-slate-700 italic">"{r.comment || 'Aucun commentaire'}"</p>
                            </div>
                        )) : <div className="text-center text-slate-400 text-sm font-bold mt-10">Aucun avis pour le moment</div>
                    )}

                    {!isPublicView && activeTab === 'sold' && (
                        soldProducts.length > 0 ? soldProducts.map(p => (
                            <div key={p.id} onClick={() => handleRelist(p)} className="bg-white/50 p-4 rounded-[28px] border border-slate-100 flex gap-5 items-center opacity-70 hover:opacity-100 cursor-pointer transition-all active:scale-95 hover:bg-white hover:shadow-lg border-2 border-transparent hover:border-indigo-100">
                                <div className="w-16 h-16 rounded-2xl bg-slate-50 overflow-hidden grayscale group-hover:grayscale-0"><img src={p.imageUrl} alt="" className="w-full h-full object-cover" /></div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-black text-slate-800 truncate text-sm line-through">{p.title}</h4>
                                    <div className="text-indigo-600 font-bold text-[10px] uppercase tracking-wide flex items-center gap-1">
                                        <Package size={12} /> Remettre en vente
                                    </div>
                                </div>
                            </div>
                        )) : <div className="text-center text-slate-400 text-sm font-bold mt-10">Aucune vente pour le moment</div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Profile;
