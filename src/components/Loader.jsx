import React from 'react';
import { Loader2 } from 'lucide-react';

const Loader = () => (
    <div className="h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">Second Life</p>
        </div>
    </div>
);

export default Loader;
