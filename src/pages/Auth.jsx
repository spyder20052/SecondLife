import React, { useState } from 'react';
import { XCircle, Info } from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { auth, db, appId } from '../firebase';
import { useNavigate } from 'react-router-dom';
import Input from '../components/Input';
import Button from '../components/Button';

function Auth() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [err, setErr] = useState("");
    const [authLoading, setAuthLoading] = useState(false);
    const navigate = useNavigate();

    const validate = () => {
        if (!email.includes('@')) return "Email invalide.";
        if (password.length < 6) return "Le mot de passe doit faire au moins 6 caractères.";
        if (!isLogin && !name.trim()) return "Veuillez entrer votre nom.";
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErr("");

        const validationError = validate();
        if (validationError) {
            setErr(validationError);
            return;
        }

        setAuthLoading(true);
        try {
            if (isLogin) {
                // Tentative de connexion
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                // Tentative d'inscription
                const res = await createUserWithEmailAndPassword(auth, email, password);
                await updateProfile(res.user, { displayName: name });
                // Sauvegarde profil Firestore
                await setDoc(doc(db, 'artifacts', appId, 'users', res.user.uid, 'profile', 'info'), {
                    email, name, createdAt: serverTimestamp(), city: ""
                });
            }
            navigate('/');
        } catch (error) {
            console.error("Auth Exception:", error);
            // Traduction des erreurs Firebase courantes
            switch (error.code) {
                case 'auth/email-already-in-use': setErr("Cet email est déjà utilisé."); break;
                case 'auth/invalid-email': setErr("Format d'email invalide."); break;
                case 'auth/weak-password': setErr("Mot de passe trop faible."); break;
                case 'auth/user-not-found': setErr("Utilisateur non trouvé."); break;
                case 'auth/wrong-password': setErr("Mot de passe incorrect."); break;
                default: setErr("Une erreur est survenue lors de l'authentification.");
            }
        } finally {
            setAuthLoading(false);
        }
    };

    return (
        <div className="p-10 flex flex-col h-full bg-white relative">
            <button onClick={() => navigate('/')} className="absolute top-8 right-8 text-slate-300 hover:text-slate-800 transition-colors"><XCircle size={32} strokeWidth={1.5} /></button>
            <div className="mt-20 flex flex-col gap-10">
                <div>
                    <h2 className="text-4xl font-black text-indigo-600 leading-tight">{isLogin ? "Ravi de vous revoir." : "Bienvenue à bord."}</h2>
                    <p className="text-slate-400 font-medium mt-3">{isLogin ? "Entrez vos identifiants pour continuer." : "Rejoignez la révolution de la seconde main."}</p>
                </div>
                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                    {!isLogin && <Input label="Nom complet" placeholder="Jean Dupont" value={name} onChange={setName} />}
                    <Input label="Email" type="email" placeholder="votre@email.com" value={email} onChange={setEmail} />
                    <Input label="Mot de passe" type="password" placeholder="••••••••" value={password} onChange={setPassword} />
                    {err && <div className="bg-rose-50 text-rose-600 p-4 rounded-2xl text-xs font-bold border border-rose-100 flex items-center gap-2"><Info size={14} /> {err}</div>}
                    <Button type="submit" loading={authLoading} className="mt-6 py-5">{isLogin ? "Se connecter" : "Créer mon compte"}</Button>
                </form>
                <div className="text-center">
                    <button onClick={() => { setIsLogin(!isLogin); setErr(""); }} className="text-xs font-black uppercase tracking-widest text-slate-400 group">
                        {isLogin ? "Pas encore de compte ? " : "Déjà membre ? "}
                        <span className="text-indigo-600 group-hover:underline">Cliquer ici</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Auth;
