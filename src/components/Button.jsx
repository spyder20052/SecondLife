import React from 'react';
import { Loader2 } from 'lucide-react';
import { COLORS } from '../constants';

const Button = ({ children, onClick, variant = 'primary', className = '', disabled = false, type = 'button', loading = false }) => {
    const baseStyle = "px-6 py-4 rounded-2xl font-bold transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2";
    const variants = {
        primary: `${COLORS.primary} text-white shadow-xl shadow-indigo-100 hover:brightness-110`,
        secondary: `bg-slate-50 text-slate-800 border border-slate-200 hover:bg-slate-100`,
        ghost: `text-slate-600 hover:bg-slate-100/50`,
        accent: `${COLORS.accent} text-white shadow-xl shadow-emerald-100`,
        outline: `bg-transparent border-2 border-indigo-600 text-indigo-600`
    };
    return (
        <button type={type} disabled={disabled || loading} onClick={onClick} className={`${baseStyle} ${variants[variant]} ${className}`}>
            {loading && <Loader2 className="animate-spin" size={18} />}
            {children}
        </button>
    );
};

export default Button;
