import React from 'react';

const Badge = ({ children, active, onClick }) => (
    <button
        onClick={onClick}
        className={`whitespace-nowrap px-5 py-2.5 rounded-2xl text-sm font-bold transition-all ${active
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 scale-105'
                : 'bg-white text-slate-500 border border-slate-100 hover:border-slate-300'
            }`}
    >
        {children}
    </button>
);

export default Badge;
