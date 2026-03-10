import React from 'react';

const Badge = ({ children, active, onClick }) => (
    <button
        onClick={onClick}
        className={`whitespace-nowrap flex-shrink-0 px-5 py-2.5 rounded-2xl text-sm font-bold transition-all ${active
            ? 'bg-brand-800 text-white shadow-lg shadow-brand-200 scale-105'
            : 'bg-white text-slate-500 border border-slate-100 hover:border-slate-300'
            }`}
    >
        {children}
    </button>
);

export default Badge;
