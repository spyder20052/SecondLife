import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, MessageCircle, Wallet, ArrowRight, Zap, Shield, Heart } from 'lucide-react';
import Button from '../components/Button';
import { COLORS } from '../constants';

function LandingPage() {
    const navigate = useNavigate();

    const handleStart = () => {
        localStorage.setItem('has_visited', 'true');
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-slate-50 relative overflow-hidden font-sans text-slate-900 selection:bg-indigo-500 selection:text-white">

            {/* Background Atmosphere */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] bg-indigo-400/20 rounded-full blur-[120px] mix-blend-multiply animate-blob" />
                <div className="absolute top-[-20%] right-[-10%] w-[70vw] h-[70vw] bg-fuchsia-400/20 rounded-full blur-[120px] mix-blend-multiply animate-blob animation-delay-2000" />
                <div className="absolute bottom-[-20%] left-[20%] w-[70vw] h-[70vw] bg-sky-400/20 rounded-full blur-[120px] mix-blend-multiply animate-blob animation-delay-4000" />
            </div>

            <div className="relative z-10 max-w-md mx-auto min-h-screen flex flex-col p-6">

                {/* Navbar Placeholder */}
                <div className="flex justify-between items-center py-6 animate-in fade-in slide-in-from-top-4 duration-1000">
                    <div className="font-black text-2xl tracking-tighter">
                        Second<span className="text-indigo-600">Life</span>.
                    </div>
                </div>

                {/* Hero Section */}
                <div className="flex-1 flex flex-col justify-center py-10">
                    <div className="space-y-6 text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 border border-white/50 shadow-sm backdrop-blur-md animate-in fade-in zoom-in duration-1000 delay-100 mx-auto">
                            <Zap size={14} className="text-amber-500 fill-amber-500" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">La référence du seconde main</span>
                        </div>

                        <h1 className="text-5xl sm:text-6xl font-black leading-[0.9] tracking-tight text-slate-900 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
                            Vendez.<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">Aimez.</span><br />
                            Revivez.
                        </h1>

                        <p className="text-lg font-medium text-slate-500 max-w-[80%] mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
                            La plateforme la plus simple pour donner une nouvelle vie à vos objets. Rejoignez la communauté.
                        </p>
                    </div>

                    {/* Floating Cards Graphic */}
                    <div className="my-12 relative h-64 w-full perspective-1000">
                        {/* Card 1: Left */}
                        <div className="absolute top-1/2 left-0 -translate-y-1/2 w-48 bg-white p-4 rounded-3xl shadow-2xl shadow-indigo-200 transform -rotate-6 hover:rotate-0 transition-transform duration-500 z-10 animate-in fade-in slide-in-from-left-8 duration-1000 delay-500 hover:scale-105 border border-slate-100">
                            <div className="w-full h-32 bg-slate-100 rounded-2xl mb-3 overflow-hidden relative">
                                <img src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400" className="w-full h-full object-cover" alt="Shoe" />
                                <div className="absolute top-2 right-2 bg-white/30 backdrop-blur-md p-1.5 rounded-full"><Heart size={12} className="text-white fill-white" /></div>
                            </div>
                            <div className="h-2 w-2/3 bg-slate-200 rounded-full mb-2" />
                            <div className="h-2 w-1/2 bg-indigo-100 rounded-full" />
                        </div>

                        {/* Card 2: Right */}
                        <div className="absolute top-1/2 right-0 -translate-y-1/2 w-48 bg-white p-4 rounded-3xl shadow-2xl shadow-fuchsia-200 transform rotate-6 hover:rotate-0 transition-transform duration-500 z-20 animate-in fade-in slide-in-from-right-8 duration-1000 delay-700 hover:scale-105 border border-slate-100">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500" />
                                <div className="space-y-1">
                                    <div className="h-1.5 w-16 bg-slate-200 rounded-full" />
                                    <div className="h-1.5 w-10 bg-slate-100 rounded-full" />
                                </div>
                            </div>
                            <div className="p-3 bg-indigo-50 rounded-xl text-xs font-bold text-indigo-900 mb-2">
                                🤝 Je le prends !
                            </div>
                            <div className="p-3 bg-fuchsia-50 rounded-xl text-xs font-bold text-fuchsia-900 text-right">
                                Parfait ! 📦
                            </div>
                        </div>
                    </div>

                    {/* Features Grid */}
                    <div className="grid grid-cols-1 gap-4 mb-8">
                        <FeatureRow
                            icon={Camera}
                            title="Snap & Sell"
                            text="Une photo, un prix, c'est en ligne."
                            delay={800}
                            color="bg-indigo-500"
                        />
                        <FeatureRow
                            icon={Shield}
                            title="100% Sécurisé"
                            text="Paiements et échanges protégés."
                            delay={900}
                            color="bg-emerald-500"
                        />
                    </div>
                </div>

                {/* CTA */}
                <div className="mt-auto pt-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-1000">
                    <Button onClick={handleStart} className="w-full py-6 text-lg shadow-xl shadow-indigo-300 active:scale-95 transition-transform">
                        Commencer l'expérience <ArrowRight className="ml-2" size={20} />
                    </Button>
                    <p className="text-center text-xs text-slate-400 font-bold mt-4 tracking-wide uppercase">Gratuit • Sans engagement</p>
                </div>
            </div>
        </div>
    );
}

const FeatureRow = ({ icon: Icon, title, text, delay, color }) => (
    <div className={`bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-backwards group hover:shadow-md transition-shadow`} style={{ animationDelay: `${delay}ms` }}>
        <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center text-white shadow-lg shadow-indigo-100 group-hover:scale-110 transition-transform duration-300`}>
            <Icon size={20} />
        </div>
        <div>
            <h3 className="font-black text-slate-900 leading-tight">{title}</h3>
            <p className="text-xs font-bold text-slate-400 mt-1">{text}</p>
        </div>
    </div>
);

export default LandingPage;
