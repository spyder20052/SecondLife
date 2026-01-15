import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { User, Mail, Lock, Upload, Info, XCircle, MapPin } from 'lucide-react';
import Button from '../components/Button';
import Input from '../components/Input';
import { useToast } from '../components/Toast';

export default function Auth() {
    const [searchParams] = useSearchParams();
    const resetToken = searchParams.get('resetToken');

    const [isLogin, setIsLogin] = useState(true);
    const [isForgot, setIsForgot] = useState(false);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");

    // Form State
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [city, setCity] = useState("");
    const [file, setFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    const navigate = useNavigate();
    const { addToast } = useToast();

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const f = e.target.files[0];
            setFile(f);
            setPreviewUrl(URL.createObjectURL(f));
        }
    };

    const handleReset = async (e) => {
        e.preventDefault();
        setErr("");
        if (password.length < 6) {
            setErr("Le mot de passe doit faire au moins 6 caractères.");
            return;
        }
        setLoading(true);
        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: resetToken, newPassword: password })
            });

            if (res.ok) {
                addToast("Mot de passe modifié ! Connectez-vous.", "success");
                navigate('/auth'); // Remove token from URL
                // Force reload to ensure clean state
                window.location.reload();
            } else {
                const data = await res.json();
                throw new Error(data.message || "Erreur.");
            }
        } catch (e) {
            setErr(e.message);
            addToast("Échec de la réinitialisation", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleForgot = async (e) => {
        e.preventDefault();
        setErr("");
        if (!email.includes('@')) {
            setErr("Email invalide.");
            return;
        }
        setLoading(true);
        try {
            const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            if (res.ok) {
                addToast("Lien de réinitialisation envoyé par email !", "success");
                setIsForgot(false);
                setIsLogin(true);
            } else {
                const data = await res.json();
                throw new Error(data.message || "Erreur lors de l'envoi.");
            }
        } catch (e) {
            setErr(e.message);
            addToast("Échec de l'envoi", "error");
        } finally {
            setLoading(false);
        }
    };

    const validate = () => {
        if (!email.includes('@')) return "Email invalide.";
        if (password.length < 6) return "Le mot de passe doit faire au moins 6 caractères.";
        if (!isLogin) {
            if (!name.trim()) return "Veuillez entrer votre nom.";
            if (!city.trim()) return "Veuillez entrer votre ville.";
        }
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErr("");

        const errorMsg = validate();
        if (errorMsg) {
            setErr(errorMsg);
            return;
        }

        setLoading(true);

        try {
            let photoURL = null;

            // Handle Image Compression only if registering and file exists
            if (!isLogin && file) {
                const { compressImage } = await import('../utils/image');
                photoURL = await compressImage(file, 0.5, 300, 300);
            }

            const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
            const body = isLogin
                ? { email, password }
                : { email, password, displayName: name, city, photoURL }; // Sending photoURL if any

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Authentication failed');
            }

            // Success
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user)); // Cache user

            addToast(isLogin ? "Bon retour !" : "Compte créé !", "success");

            // Navigate to Home
            window.location.href = '/';

        } catch (err) {
            console.error("Auth Error:", err);
            let msg = err.message;
            if (msg.includes('duplicate')) msg = "Cet email est déjà utilisé.";
            setErr(msg);
            addToast(msg, "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white relative overflow-y-auto">
            <button onClick={() => navigate('/')} className="absolute top-6 right-6 text-slate-400 hover:text-slate-800 transition-colors z-10">
                <XCircle size={32} strokeWidth={1.5} />
            </button>

            <div className="flex-1 flex flex-col justify-center p-8 max-w-sm mx-auto w-full">
                <div className="mb-8">
                    <h2 className="text-3xl font-black text-indigo-600 leading-tight mb-2">
                        {resetToken ? "Nouveau mot de passe" : (isForgot ? "Mot de passe oublié ?" : (isLogin ? "Bon retour." : "Rejoignez-nous."))}
                    </h2>
                    <p className="text-slate-500">
                        {resetToken ? "Définissez votre nouveau mot de passe sécurisé." : (isForgot ? "Entrez votre email pour recevoir un lien." : (isLogin ? "Connectez-vous à votre compte Node.js." : "Créez votre profil sur notre serveur custom."))}
                    </p>
                </div>

                {resetToken ? (
                    <form onSubmit={handleReset} className="flex flex-col gap-4">
                        <Input label="Nouveau mot de passe" type="password" placeholder="••••••••" value={password} onChange={setPassword} />
                        {err && (
                            <div className="bg-rose-50 text-rose-600 p-3 rounded-xl text-xs font-bold border border-rose-100 flex items-center gap-2">
                                <Info size={14} className="shrink-0" /> {err}
                            </div>
                        )}
                        <Button type="submit" loading={loading} className="mt-4 py-4 text-base shadow-lg shadow-indigo-200">
                            Modifier le mot de passe
                        </Button>
                        <button type="button" onClick={() => navigate('/auth')} className="text-center text-sm font-bold text-slate-400 mt-4 hover:text-slate-600">
                            Annuler
                        </button>
                    </form>
                ) : isForgot ? (
                    <form onSubmit={handleForgot} className="flex flex-col gap-4">
                        <Input label="Email" type="email" placeholder="votre@email.com" value={email} onChange={setEmail} />
                        {err && (
                            <div className="bg-rose-50 text-rose-600 p-3 rounded-xl text-xs font-bold border border-rose-100 flex items-center gap-2">
                                <Info size={14} className="shrink-0" /> {err}
                            </div>
                        )}
                        <Button type="submit" loading={loading} className="mt-4 py-4 text-base shadow-lg shadow-indigo-200">
                            Envoyer le lien
                        </Button>
                        <button type="button" onClick={() => { setIsForgot(false); setErr(""); }} className="text-center text-sm font-bold text-slate-400 mt-4 hover:text-slate-600">
                            Retour à la connexion
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        {!isLogin && (
                            <div className="flex flex-col items-center mb-4">
                                <div className="relative w-24 h-24 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden cursor-pointer hover:border-indigo-500 transition-colors">
                                    <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                    {previewUrl ? (
                                        <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="text-center p-2">
                                            <Upload size={20} className="mx-auto text-slate-400" />
                                            <span className="text-[10px] text-slate-400 block mt-1">Photo</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {!isLogin && (
                            <>
                                <Input label="Nom complet" placeholder="Jean Dupont" value={name} onChange={setName} icon={User} />
                                <Input label="Ville" placeholder="Cotonou" value={city} onChange={setCity} icon={MapPin} />
                            </>
                        )}

                        <Input label="Email" type="email" placeholder="votre@email.com" value={email} onChange={setEmail} />
                        <Input label="Mot de passe" type="password" placeholder="••••••••" value={password} onChange={setPassword} />

                        {isLogin && (
                            <div className="text-right">
                                <button type="button" onClick={() => { setIsForgot(true); setErr(""); }} className="text-xs font-bold text-indigo-600 hover:underline">
                                    Mot de passe oublié ?
                                </button>
                            </div>
                        )}

                        {err && (
                            <div className="bg-rose-50 text-rose-600 p-3 rounded-xl text-xs font-bold border border-rose-100 flex items-center gap-2">
                                <Info size={14} className="shrink-0" /> {err}
                            </div>
                        )}

                        <Button type="submit" loading={loading} className="mt-4 py-4 text-base shadow-lg shadow-indigo-200">
                            {isLogin ? "Se connecter" : "Créer mon compte"}
                        </Button>
                    </form>
                )}

                {(!isForgot && !resetToken) && (
                    <div className="mt-8 text-center">
                        <button
                            onClick={() => { setIsLogin(!isLogin); setErr(""); }}
                            className="text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors"
                        >
                            {isLogin ? "Pas de compte ? Créer" : "Déjà membre ? Se connecter"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
