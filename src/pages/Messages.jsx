import React, { useMemo } from 'react';
import { MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function Messages({ user, conversations }) {
    const navigate = useNavigate();

    const uniqueConversations = useMemo(() => {
        const map = new Map();
        conversations.forEach(msg => {
            const key = [msg.buyerId, msg.sellerId, msg.productId].sort().join('_');
            if (!map.has(key) || (msg.timestamp?.seconds || 0) > (map.get(key).timestamp?.seconds || 0)) map.set(key, msg);
        });
        return Array.from(map.values()).sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
    }, [conversations]);

    if (!user) return null;

    const handleSelectChat = (conv) => {
        // Sending chat details via state to ChatDetail
        navigate('/chat/detail', {
            state: {
                activeChat: conv
            }
        });
    };

    return (
        <div className="flex flex-col h-full bg-white">
            <div className="p-8 border-b border-slate-50"><h2 className="text-3xl font-black">Messages</h2></div>
            <div className="flex-1">
                {uniqueConversations.length > 0 ? (
                    uniqueConversations.map(conv => {
                        const isSeller = user.uid === conv.sellerId;
                        const counterpartyName = isSeller ? (conv.buyerName || 'Acheteur') : (conv.sellerName || 'Vendeur');

                        return (
                            <div key={conv.id} onClick={() => handleSelectChat(conv)} className="p-4 sm:p-6 border-b border-slate-50 flex gap-4 items-center cursor-pointer hover:bg-slate-50 transition-colors group">
                                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-xl sm:text-2xl uppercase flex-shrink-0">
                                    {(counterpartyName || "?")[0]}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <h3 className="font-black text-slate-800 truncate text-base sm:text-lg">{counterpartyName}</h3>
                                        {conv.timestamp && (
                                            <span className="text-[10px] text-slate-400 font-bold ml-2 hidden sm:block">
                                                {new Date(conv.timestamp.seconds * 1000).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-indigo-600 text-[10px] font-black uppercase tracking-widest truncate mb-0.5">{conv.productTitle}</p>
                                    <p className="text-sm text-slate-500 truncate font-medium">{conv.content}</p>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="flex flex-col items-center justify-center py-32 text-slate-300 gap-4"><MessageCircle size={48} /><p className="font-bold uppercase tracking-widest text-xs">Aucun message</p></div>
                )}
            </div>
        </div>
    );
}

export default Messages;
