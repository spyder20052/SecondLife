import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, MessageCircle, Shield, ArrowRight, Zap, Heart, Users, ShoppingBag, Sparkles, CheckCircle, MapPin, Mail, User, Send, Star, Recycle, Lock } from 'lucide-react';

function LandingPage() {
    const navigate = useNavigate();
    const [waitlistCount, setWaitlistCount] = useState(0);
    const [formData, setFormData] = useState({ name: '', email: '', city: '' });
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');
    const formRef = useRef(null);

    useEffect(() => {
        fetch('/api/waitlist/count')
            .then(res => res.json())
            .then(data => setWaitlistCount(data.count || 0))
            .catch(() => setWaitlistCount(42));
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!formData.name.trim() || !formData.email.trim()) {
            setError('Le nom et l\'email sont obligatoires.');
            return;
        }
        setSubmitting(true);
        try {
            const res = await fetch('/api/waitlist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (res.ok) {
                setSubmitted(true);
                setWaitlistCount(data.count || waitlistCount + 1);
                localStorage.setItem('waitlist_registered', 'true');
            } else {
                setError(data.message || 'Erreur lors de l\'inscription.');
            }
        } catch {
            setError('Erreur de connexion. Réessayez plus tard.');
        } finally {
            setSubmitting(false);
        }
    };

    const scrollToForm = () => {
        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    const handleExplore = () => {
        navigate('/auth');
    };

    const handleAccessApp = () => {
        localStorage.setItem('waitlist_registered', 'true');
        navigate('/');
    };

    return (
        <div className="min-h-screen relative overflow-hidden font-sans text-white" style={{ background: 'linear-gradient(160deg, #0C2E2C 0%, #14443F 30%, #18534F 60%, #1A5E59 100%)' }}>

            {/* ===== ANIMATED BACKGROUND BLOBS ===== */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-15%] left-[-10%] w-[60vw] h-[60vw] rounded-full blur-[120px] animate-blob opacity-25" style={{ background: '#3BA09A' }} />
                <div className="absolute top-[10%] right-[-15%] w-[50vw] h-[50vw] rounded-full blur-[120px] animate-blob animation-delay-2000 opacity-20" style={{ background: '#5FBFB9' }} />
                <div className="absolute bottom-[-10%] left-[15%] w-[55vw] h-[55vw] rounded-full blur-[120px] animate-blob animation-delay-4000 opacity-15" style={{ background: '#226D68' }} />
            </div>

            <div className="relative z-10 max-w-lg mx-auto min-h-screen flex flex-col">

                {/* ===== NAVBAR ===== */}
                <nav className="flex justify-between items-center px-5 py-6 animate-fade-in-up">
                    <div className="font-black text-2xl tracking-tighter">
                        Second<span style={{ color: '#A5DDD9' }}>Life</span>.
                    </div>
                    <button
                        onClick={handleExplore}
                        className="text-[10px] font-black uppercase tracking-wider px-4 py-2.5 rounded-xl bg-white/10 text-white/80 backdrop-blur-md border border-white/10 hover:bg-white/20 transition-all active:scale-95"
                    >
                        Explorer
                    </button>
                </nav>

                {/* ===== HERO SECTION ===== */}
                <section className="flex-none px-5 pt-6 pb-4">
                    <div className="space-y-5 text-center">
                        {/* Badge */}
                        <div className="animate-fade-in-up delay-100 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/8 backdrop-blur-md border border-white/10 shadow-sm mx-auto">
                            <Zap size={14} className="text-emerald-300" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/70">Bientôt disponible au Bénin 🇧🇯</span>
                        </div>

                        {/* Title */}
                        <h1 className="animate-fade-in-up delay-200 text-4xl sm:text-5xl font-black leading-[0.95] tracking-tight">
                            Donnez une<br />
                            <span className="relative inline-block">
                                <span className="relative z-10" style={{ color: '#A5DDD9' }}>seconde vie</span>
                                <span className="absolute bottom-0 left-0 w-full h-3 rounded-full -z-0" style={{ background: 'rgba(165,221,217,0.15)' }} />
                            </span><br />
                            à vos objets.
                        </h1>

                        {/* Subtitle */}
                        <p className="animate-fade-in-up delay-300 text-sm sm:text-base font-medium text-white/50 max-w-[85%] mx-auto leading-relaxed">
                            La marketplace la plus simple du Bénin. Vendez, achetez et échangez dans votre ville.
                        </p>

                        {/* Incentive message */}
                        <p className="animate-fade-in-up delay-350 text-xs font-bold mt-1" style={{ color: '#6EE7B7' }}>
                            🎁 Inscrivez-vous et accédez à l'app en avant-première
                        </p>

                        {/* CTA Button */}
                        <div className="animate-fade-in-up delay-400 pt-2">
                            <button
                                onClick={scrollToForm}
                                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-base font-black shadow-2xl shadow-black/20 active:scale-95 transition-all animate-pulse-glow bg-white"
                                style={{ color: '#18534F' }}
                            >
                                S'inscrire à la Waitlist <ArrowRight size={18} />
                            </button>
                        </div>

                        {/* Counter */}
                        {waitlistCount > 0 && (
                            <div className="animate-fade-in-up delay-500 flex items-center justify-center gap-3">
                                <div className="flex -space-x-2">
                                    {[...Array(Math.min(waitlistCount, 4))].map((_, i) => (
                                        <div
                                            key={i}
                                            className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-[10px] font-black text-white shadow-md"
                                            style={{ borderColor: 'rgba(20,68,63,0.8)', background: `hsl(${170 + i * 8}, 40%, ${25 + i * 5}%)` }}
                                        >
                                            {String.fromCharCode(65 + i)}
                                        </div>
                                    ))}
                                </div>
                                <p className="text-xs font-bold text-white/40">
                                    <span className="text-white/80 font-black">{waitlistCount}+</span> déjà inscrits
                                </p>
                            </div>
                        )}
                    </div>
                </section>

                {/* ===== FLOATING CARDS ===== */}
                <section className="px-5 py-4 relative h-48 sm:h-56">
                    {/* Card 1 — Product */}
                    <div className="absolute top-2 left-4 w-[42%] max-w-[10rem] bg-white/12 backdrop-blur-xl p-3 rounded-2xl shadow-2xl shadow-black/10 transform -rotate-6 hover:rotate-0 transition-all duration-500 z-10 animate-float border border-white/15">
                        <div className="w-full h-24 rounded-xl mb-2 overflow-hidden relative" style={{ background: 'rgba(255,255,255,0.08)' }}>
                            <img src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400" className="w-full h-full object-cover" alt="Sneaker" />
                            <div className="absolute top-2 right-2 bg-white/20 backdrop-blur-md p-1.5 rounded-full">
                                <Heart size={10} className="text-white fill-white" />
                            </div>
                        </div>
                        <div className="flex justify-between items-center">
                            <div className="h-2 w-16 bg-white/15 rounded-full" />
                            <span className="text-[10px] font-black text-white/80">15,000 F</span>
                        </div>
                    </div>

                    {/* Card 2 — Chat */}
                    <div className="absolute top-6 right-4 w-[42%] max-w-[10rem] bg-white/12 backdrop-blur-xl p-3 rounded-2xl shadow-2xl shadow-black/10 transform rotate-6 hover:rotate-0 transition-all duration-500 z-20 animate-float-delay border border-white/15">
                        <div className="flex items-center gap-2.5 mb-2.5">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-black" style={{ background: 'rgba(165,221,217,0.25)' }}>A</div>
                            <div className="space-y-1">
                                <div className="h-1.5 w-14 bg-white/20 rounded-full" />
                                <div className="h-1.5 w-10 bg-white/10 rounded-full" />
                            </div>
                        </div>
                        <div className="p-2.5 rounded-xl text-[11px] font-bold mb-1.5" style={{ background: 'rgba(165,221,217,0.12)', color: '#A5DDD9' }}>
                            🤝 Je le prends !
                        </div>
                        <div className="p-2.5 rounded-xl text-[11px] font-bold text-right" style={{ background: 'rgba(52,211,153,0.1)', color: '#6EE7B7' }}>
                            Parfait ! 📦
                        </div>
                    </div>
                </section>

                {/* ===== HOW IT WORKS ===== */}
                <section className="px-5 py-6">
                    <h2 className="text-center text-xs font-black uppercase tracking-[0.25em] text-white/30 mb-5 animate-fade-in-up delay-500">
                        Comment ça marche
                    </h2>
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { icon: Camera, label: 'Photographiez', delay: 'delay-500' },
                            { icon: MessageCircle, label: 'Négociez', delay: 'delay-600' },
                            { icon: ShoppingBag, label: 'Vendez', delay: 'delay-700' },
                        ].map((step, i) => (
                            <div key={i} className={`animate-fade-in-up ${step.delay} bg-white/8 backdrop-blur-md rounded-2xl p-4 text-center border border-white/8 hover:bg-white/12 transition-all group`}>
                                <div className="w-10 h-10 mx-auto mb-2 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300" style={{ background: 'rgba(165,221,217,0.12)' }}>
                                    <step.icon size={18} style={{ color: '#A5DDD9' }} />
                                </div>
                                <p className="text-[10px] font-black uppercase tracking-wider text-white/60">{step.label}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ===== FEATURES ===== */}
                <section className="px-5 py-4">
                    <div className="space-y-3">
                        <FeatureCard
                            icon={Shield}
                            title="100% Sécurisé"
                            text="Transactions sécurisées et vérification des profils vendeurs."
                            delay="delay-600"
                        />
                        <FeatureCard
                            icon={MapPin}
                            title="Local & Pratique"
                            text="Trouvez des articles près de chez vous. Cotonou, Porto-Novo, Parakou..."
                            delay="delay-700"
                        />
                        <FeatureCard
                            icon={Sparkles}
                            title="Simple & Rapide"
                            text="Publiez une annonce en 30 secondes. C'est gratuit."
                            delay="delay-800"
                        />
                    </div>
                </section>

                {/* ===== SOCIAL PROOF ===== */}
                <section className="px-5 py-6">
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { value: '100%', label: 'Gratuit', icon: Heart },
                            { value: '24/7', label: 'Disponible', icon: Zap },
                            { value: '🇧🇯', label: 'Made in Bénin', icon: Star }
                        ].map((stat, i) => (
                            <div key={i} className="bg-white/8 backdrop-blur-md p-4 rounded-2xl text-center border border-white/8">
                                <p className="text-lg font-black text-white leading-none mb-1">{stat.value}</p>
                                <p className="text-[9px] font-bold uppercase tracking-wider text-white/30">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ===== WAITLIST FORM ===== */}
                <section ref={formRef} className="px-5 py-8">
                    <div className="bg-white/95 backdrop-blur-xl rounded-[28px] p-6 sm:p-8 shadow-2xl shadow-black/10 border border-white/50 relative overflow-hidden">
                        {/* Decorative */}
                        <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-[60px] opacity-10" style={{ background: '#226D68' }} />

                        {submitted ? (
                            <div className="text-center py-6 relative z-10 animate-fade-in-up">
                                <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center shadow-xl" style={{ background: 'linear-gradient(135deg, #18534F, #226D68)' }}>
                                    <CheckCircle size={36} className="text-white" />
                                </div>
                                <h3 className="text-xl font-black mb-2" style={{ color: '#18534F' }}>
                                    Bienvenue dans la famille ! 🎉
                                </h3>
                                <p className="text-sm text-slate-500 font-medium mb-2">
                                    Vous êtes le <span className="font-black" style={{ color: '#226D68' }}>#{waitlistCount}ème</span> inscrit.<br />
                                    On vous contacte très bientôt.
                                </p>
                                <p className="text-xs text-emerald-600 font-bold mb-4 bg-emerald-50 px-3 py-2 rounded-xl inline-block">
                                    🎁 Vous avez désormais accès à l'application !
                                </p>
                                <button
                                    onClick={handleAccessApp}
                                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black text-white active:scale-95 transition-all"
                                    style={{ background: 'linear-gradient(135deg, #18534F, #226D68)' }}
                                >
                                    Explorer l'app <ArrowRight size={16} />
                                </button>
                            </div>
                        ) : (
                            <div className="relative z-10">
                                <div className="text-center mb-6">
                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-3" style={{ background: '#ECF8F6' }}>
                                        <Users size={12} style={{ color: '#226D68' }} />
                                        <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: '#18534F' }}>
                                            Rejoignez {waitlistCount > 0 ? `${waitlistCount}+ personnes` : 'la communauté'}
                                        </span>
                                    </div>
                                    <h3 className="text-xl sm:text-2xl font-black leading-tight" style={{ color: '#18534F' }}>
                                        Inscrivez-vous à<br />la Waitlist
                                    </h3>
                                    <p className="text-xs text-slate-400 font-medium mt-2">
                                        Soyez les premiers informés du lancement. 🚀
                                    </p>
                                </div>

                                <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
                                    <div className="relative">
                                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                        <input type="text" placeholder="Votre nom complet" value={formData.name}
                                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                            className="w-full bg-[#ECF8F6] border-2 border-[#226D68]/25 rounded-xl py-3.5 pl-10 pr-4 outline-none focus:ring-2 focus:ring-[#226D68]/20 focus:border-[#226D68] transition-all text-sm font-medium placeholder:text-slate-400 text-slate-800"
                                        />
                                    </div>
                                    <div className="relative">
                                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                        <input type="email" placeholder="votre@email.com" value={formData.email}
                                            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                            className="w-full bg-[#ECF8F6] border-2 border-[#226D68]/25 rounded-xl py-3.5 pl-10 pr-4 outline-none focus:ring-2 focus:ring-[#226D68]/20 focus:border-[#226D68] transition-all text-sm font-medium placeholder:text-slate-400 text-slate-800"
                                        />
                                    </div>
                                    <div className="relative">
                                        <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                        <input type="text" placeholder="Votre ville (ex: Cotonou)" value={formData.city}
                                            onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                                            className="w-full bg-[#ECF8F6] border-2 border-[#226D68]/25 rounded-xl py-3.5 pl-10 pr-4 outline-none focus:ring-2 focus:ring-[#226D68]/20 focus:border-[#226D68] transition-all text-sm font-medium placeholder:text-slate-400 text-slate-800"
                                        />
                                    </div>

                                    {error && (
                                        <div className="bg-rose-50 text-rose-600 p-3 rounded-xl text-xs font-bold border border-rose-100 text-center">
                                            {error}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="w-full py-4 rounded-xl text-base font-black text-white shadow-xl active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                                        style={{ background: 'linear-gradient(135deg, #18534F, #226D68)' }}
                                    >
                                        {submitting ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                <Send size={16} /> Rejoindre la Waitlist
                                            </>
                                        )}
                                    </button>

                                    <p className="text-center text-[10px] text-slate-400 font-medium flex items-center justify-center gap-1">
                                        <Lock size={10} className="text-slate-300" /> Vos données sont en sécurité. Pas de spam.
                                    </p>
                                    <p className="text-center text-[10px] text-emerald-600 font-bold mt-1">
                                        ✨ L'inscription vous donne un accès immédiat à l'application
                                    </p>
                                </form>
                            </div>
                        )}
                    </div>
                </section>

                {/* ===== FOOTER ===== */}
                <footer className="px-5 py-8 text-center">
                    <div className="font-black text-lg tracking-tighter text-white/80 mb-2">
                        Second<span style={{ color: '#A5DDD9' }}>Life</span>.
                    </div>
                    <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">
                        © 2026 SecondLife — Made with ❤️ in Bénin
                    </p>
                </footer>

            </div>
        </div>
    );
}

const FeatureCard = ({ icon: Icon, title, text, delay }) => (
    <div className={`animate-fade-in-up ${delay} bg-white/8 backdrop-blur-md p-4 rounded-2xl flex items-center gap-4 border border-white/8 hover:bg-white/12 transition-all group`}>
        <div className="w-11 h-11 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 flex-shrink-0" style={{ background: 'rgba(165,221,217,0.12)', border: '1px solid rgba(165,221,217,0.1)' }}>
            <Icon size={18} style={{ color: '#A5DDD9' }} />
        </div>
        <div>
            <h3 className="font-black text-white text-sm leading-tight">{title}</h3>
            <p className="text-[11px] font-medium text-white/40 mt-0.5 leading-relaxed">{text}</p>
        </div>
    </div>
);

export default LandingPage;
