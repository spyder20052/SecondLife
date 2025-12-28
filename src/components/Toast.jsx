import React, { createContext, useContext, useState, useEffect } from 'react';
import { Check, Info, AlertCircle, X } from 'lucide-react';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = (message, type = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => removeToast(id), 3000);
    };

    const removeToast = (id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}
            <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-full max-w-sm px-4 pointer-events-none">
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        className="bg-slate-900/90 backdrop-blur-md text-white px-5 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-auto"
                    >
                        {toast.type === 'success' && <Check className="text-emerald-400" size={20} />}
                        {toast.type === 'error' && <AlertCircle className="text-rose-400" size={20} />}
                        {toast.type === 'info' && <Info className="text-indigo-400" size={20} />}
                        <span className="font-bold text-sm flex-1">{toast.message}</span>
                        <button onClick={() => removeToast(toast.id)} className="text-slate-500 hover:text-white"><X size={16} /></button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};
