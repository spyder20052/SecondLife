import React, { useMemo } from 'react';
import { MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function Messages({ user, conversations }) {
    const navigate = useNavigate();

    // Group conversations and find the correct names using senderId
    const uniqueConversations = useMemo(() => {
        const map = new Map();

        // First pass: group all messages by conversation
        const conversationGroups = new Map();
        conversations.forEach(msg => {
            const key = [msg.buyerId, msg.sellerId, msg.productId].sort().join('_');
            if (!conversationGroups.has(key)) {
                conversationGroups.set(key, []);
            }
            conversationGroups.get(key).push(msg);
        });

        // Second pass: for each conversation, find the correct names
        conversationGroups.forEach((msgs, key) => {
            // Sort by timestamp to get the latest message
            msgs.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
            const latestMsg = msgs[0];

            // Find the correct buyer name: look for a message sent BY the buyer
            // (senderId === buyerId means the buyer sent this message)
            let correctBuyerName = null;
            let correctSellerName = null;

            for (const msg of msgs) {
                // If this message was sent by the buyer, use buyerName from it
                if (msg.senderId === msg.buyerId && msg.buyerName && msg.buyerName !== 'Acheteur') {
                    correctBuyerName = msg.buyerName;
                }
                // If this message was sent by the seller, use sellerName from it
                if (msg.senderId === msg.sellerId && msg.sellerName && msg.sellerName !== 'Vendeur') {
                    correctSellerName = msg.sellerName;
                }
                // Stop early if we found both
                if (correctBuyerName && correctSellerName) break;
            }

            // Fallback: try to get names from any message
            if (!correctBuyerName) {
                for (const msg of msgs) {
                    if (msg.buyerName && msg.buyerName !== 'Acheteur') {
                        correctBuyerName = msg.buyerName;
                        break;
                    }
                }
            }
            if (!correctSellerName) {
                for (const msg of msgs) {
                    if (msg.sellerName && msg.sellerName !== 'Vendeur') {
                        correctSellerName = msg.sellerName;
                        break;
                    }
                }
            }

            map.set(key, {
                ...latestMsg,
                _correctBuyerName: correctBuyerName,
                _correctSellerName: correctSellerName
            });
        });

        return Array.from(map.values()).sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
    }, [conversations]);

    if (!user) return null;

    const handleSelectChat = (conv) => {
        // Sending chat details via state to ChatDetail with corrected names
        navigate('/chat/detail', {
            state: {
                activeChat: {
                    ...conv,
                    buyerName: conv._correctBuyerName || conv.buyerName || 'Acheteur',
                    sellerName: conv._correctSellerName || conv.sellerName || 'Vendeur'
                }
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
                        // Use the correct names to determine counterparty
                        const counterpartyName = isSeller
                            ? (conv._correctBuyerName || conv.buyerName || 'Acheteur')
                            : (conv._correctSellerName || conv.sellerName || 'Vendeur');

                        const isUnread = !conv.readBy?.includes(user?.uid) && conv.senderId !== user?.uid;

                        return (
                            <div key={conv.id} onClick={() => handleSelectChat(conv)} className={`p-4 sm:p-6 border-b border-slate-50 flex gap-4 items-center cursor-pointer transition-all group ${isUnread ? 'bg-indigo-50/40 relative' : 'hover:bg-slate-50'}`}>
                                {isUnread && (
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600 rounded-r-full" />
                                )}
                                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-xl sm:text-2xl uppercase flex-shrink-0 relative">
                                    {(counterpartyName || "?")[0]}
                                    {isUnread && <div className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-600 rounded-full border-2 border-white" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <h3 className={`font-black text-slate-800 truncate text-base sm:text-lg ${isUnread ? 'text-indigo-900' : ''}`}>{counterpartyName}</h3>
                                        {conv.timestamp && (
                                            <span className={`text-[10px] font-bold ml-2 hidden sm:block ${isUnread ? 'text-indigo-600' : 'text-slate-400'}`}>
                                                {new Date(conv.timestamp.seconds * 1000).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-indigo-600 text-[10px] font-black uppercase tracking-widest truncate mb-0.5">{conv.productTitle}</p>
                                    <p className={`text-sm truncate font-medium ${isUnread ? 'text-slate-900 font-bold' : 'text-slate-500'}`}>{conv.content}</p>
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
