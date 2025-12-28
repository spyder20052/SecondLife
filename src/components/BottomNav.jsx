import React from 'react';
import { Home, Search, PlusCircle, MessageCircle, User } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { COLORS } from '../constants';

function BottomNav({ user }) {
    const location = useLocation();
    const navigate = useNavigate();
    const currentPath = location.pathname;

    const checkAccess = (e, targetPath) => {
        if (!user || user.isAnonymous) {
            e.preventDefault();
            navigate('/auth');
        }
    };

    return (
        <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/90 backdrop-blur-xl border-t border-slate-100 flex justify-around items-center py-4 px-6 z-50 rounded-t-[32px] shadow-2xl">
            <NavButton active={currentPath === '/'} icon={Home} label="Accueil" to="/" />
            <NavButton active={currentPath === '/discover'} icon={Search} label="Découvrir" to="/discover" />
            <NavButton active={currentPath === '/post'} icon={PlusCircle} label="Vendre" to="/post" onClick={(e) => checkAccess(e, '/post')} special />
            <NavButton active={currentPath === '/messages'} icon={MessageCircle} label="Messages" to="/messages" onClick={(e) => checkAccess(e, '/messages')} />
            <NavButton active={currentPath === '/profile'} icon={User} label="Profil" to="/profile" />
        </nav>
    );
}

function NavButton({ active, icon: Icon, label, to, onClick, special = false }) {
    if (special) return (
        <Link to={to} onClick={onClick} className="flex flex-col items-center -mt-12 group">
            <div className={`w-16 h-16 rounded-[24px] bg-gradient-to-br ${COLORS.gradient} flex items-center justify-center text-white shadow-2xl shadow-indigo-300 transform transition-all group-active:scale-90 group-hover:rotate-6`}>
                <PlusCircle size={32} />
            </div>
            <span className="text-[10px] mt-2 font-black text-indigo-600 uppercase tracking-tighter">Vendre</span>
        </Link>
    );

    return (
        <Link to={to} onClick={onClick} className="flex flex-col items-center gap-1.5 group">
            <div className={`transition-all ${active ? 'text-indigo-600 scale-110' : 'text-slate-300 group-hover:text-slate-500'}`}>
                <Icon size={24} strokeWidth={active ? 2.5 : 2} />
            </div>
            <span className={`text-[9px] font-black uppercase tracking-wider transition-all ${active ? 'text-indigo-600' : 'text-slate-300'}`}>{label}</span>
        </Link>
    );
}

export default BottomNav;
