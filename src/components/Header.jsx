import React from 'react';
import { Package } from 'lucide-react';
import { Link } from 'react-router-dom';
import { COLORS } from '../constants';

function Header({ user }) {
    // Using Link to /auth instead of setView

    // Note: logic for hiding header on specific pages will be handled by where it's placed in the layout or by using useLocation hooks

    return (
        <header className="px-6 py-5 bg-white flex justify-between items-center sticky top-0 z-40">
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${COLORS.gradient} flex items-center justify-center text-white shadow-lg shadow-indigo-200`}>
                    <Package size={20} />
                </div>
                <div>
                    <h1 className="text-xl font-black tracking-tight leading-none">Second Life</h1>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">Eco-responsable</p>
                </div>
            </div>
            {(user?.isAnonymous || !user) && (
                <Link
                    to="/auth"
                    className="text-[11px] font-black bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl uppercase tracking-wider active:scale-95 transition-all text-center"
                >
                    Connexion
                </Link>
            )}
        </header>
    );
}

export default Header;
