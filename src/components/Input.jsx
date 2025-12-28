import React from 'react';

const Input = ({ label, placeholder, value, onChange, type = "text", icon: Icon }) => (
    <div className="flex flex-col gap-1.5 w-full">
        {label && <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">{label}</label>}
        <div className="relative">
            {Icon && <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />}
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className={`w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 ${Icon ? 'pl-11' : 'px-4'} pr-4 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium placeholder:text-slate-300`}
            />
        </div>
    </div>
);

export default Input;
