import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, Camera, Wallet, X, Check } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { compressImage } from '../utils/image';
import { useToast } from '../components/Toast';
import Button from '../components/Button';
import { sendMessageNotificationEmail } from '../services/emailService';
import { sendReviewInvitationEmail } from '../services/emailService';
import ReviewModal from '../components/ReviewModal';

function ChatDetail({ user }) {
    const { addToast } = useToast();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [sending, setSending] = useState(false);
    const [imageFile, setImageFile] = useState(null); // For chat images
    const [imagePreview, setImagePreview] = useState(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [hasReviewed, setHasReviewed] = useState(false);

    const messagesEndRef = useRef(null);
    const location = useLocation();
    const navigate = useNavigate();
    const activeChat = location.state?.activeChat;

    // Determine if current user is the seller
    const isSeller = user && activeChat ? user.uid === activeChat.sellerId : false;
    const counterpartyName = isSeller ? (activeChat?.buyerName || 'Acheteur') : (activeChat?.sellerName || 'Vendeur');
    const isSaleConfirmed = messages.some(m => m.type === 'sale_confirmed');

    useEffect(() => {
        if (!activeChat || !user) {
            navigate('/');
            return;
        }

        // Auto-scroll to bottom on load
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }

        // Check if Buyer has already reviewed this product
        if (!isSeller) {
            const checkReview = async () => {
                try {
                    const res = await fetch(`/api/reviews/check?productId=${activeChat.productId}&buyerId=${user.uid}`);
                    if (res.ok) {
                        const data = await res.json();
                        if (data.exists) setHasReviewed(true);
                    }
                } catch (err) {
                    console.error("Check review error", err);
                }
            };
            checkReview(); // Backend endpoint might not exist yet, defaulting to false is fine for now
        }

        const fetchMessages = async () => {
            try {
                const queryParams = new URLSearchParams({
                    productId: activeChat.productId,
                    buyerId: activeChat.buyerId,
                    sellerId: activeChat.sellerId
                });

                const res = await fetch(`/api/messages/conversation?${queryParams}`);
                if (!res.ok) throw new Error('Failed to fetch messages');
                const msgs = await res.json();

                // Sort by timestamp (ISO string)
                msgs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

                setMessages(msgs);

                // Mark unread as read
                msgs.forEach(async (m) => {
                    if (m.senderId !== user.uid && (!m.readBy || !m.readBy.includes(user.uid))) {
                        try {
                            await fetch(`/api/messages/read/${m.id}`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ userId: user.uid })
                            });
                        } catch (readErr) {
                            console.error('Error marking message as read:', readErr);
                        }
                    }
                });

                // Scroll to bottom
                setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);

            } catch (err) {
                console.error("Chat Fetch Error:", err);
            }
        };

        fetchMessages();
        const interval = setInterval(fetchMessages, 3000); // 3s polling
        return () => clearInterval(interval);
    }, [activeChat, user, navigate, isSeller]);

    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            const preview = await compressImage(file);
            setImagePreview(preview);
        }
    };

    const cancelImage = () => {
        setImageFile(null);
        setImagePreview(null);
    };

    const handleSend = async (type = 'text', contentOrUrl = null) => {
        const msgContent = contentOrUrl || newMessage;

        // Detect image sending if type is default text
        const effectiveType = (type === 'text' && imageFile) ? 'image' : type;

        if ((!msgContent.trim() && effectiveType === 'text') && !imageFile || !user || sending || !activeChat) return;
        setSending(true);

        let contentImage = null;
        if (imageFile) {
            contentImage = await compressImage(imageFile, 0.5, 500, 500);
        }

        const messageData = {
            productId: activeChat.productId,
            productTitle: activeChat.productTitle,
            senderId: user.uid,
            buyerId: activeChat.buyerId,
            sellerId: activeChat.sellerId,
            buyerName: isSeller ? (activeChat.buyerName || 'Acheteur') : (user.displayName || 'Acheteur'),
            sellerName: isSeller ? (user.displayName || 'Vendeur') : (activeChat.sellerName || 'Vendeur'),
            participants: [activeChat.buyerId, activeChat.sellerId],
            content: effectiveType === 'text' ? msgContent : (effectiveType === 'image' ? 'Image envoyée' : msgContent),
            type: effectiveType === 'image' ? 'image' : effectiveType,
            imageUrl: effectiveType === 'image' ? contentImage : null,
            timestamp: new Date().toISOString(),
            readBy: [user.uid]
        };

        try {
            // Optimistic Update
            setMessages(prev => [...prev, { ...messageData, id: 'temp-' + Date.now() }]);
            setNewMessage("");
            cancelImage();

            await fetch('/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(messageData)
            });

            // Email Notification Logic
            const recipientId = isSeller ? activeChat.buyerId : activeChat.sellerId;
            const recipientName = isSeller ? activeChat.buyerName : activeChat.sellerName;
            const senderName = user.displayName || (isSeller ? 'Vendeur' : 'Acheteur');

            // Import services dynamically if needed
            const { getUserEmail, isUserOnline } = await import('../services/userService');

            // Check if recipient is online
            const recipientOnline = await isUserOnline(recipientId);

            if (!recipientOnline) {
                let recipientEmail = isSeller ? activeChat.buyerEmail : activeChat.sellerEmail;
                if (!recipientEmail && recipientId) {
                    recipientEmail = await getUserEmail(recipientId);
                }

                if (recipientEmail) {
                    sendMessageNotificationEmail({
                        toEmail: recipientEmail,
                        toName: recipientName,
                        fromName: senderName,
                        message: newMessage || 'Image envoyée',
                        productTitle: activeChat.productTitle
                    }).catch(console.error);
                }
            }

            setNewMessage("");
            cancelImage();
        } catch (err) { console.error(err); } finally { setSending(false); }
    };

    const sendPaymentRequest = async () => {
        if (!user || sending || !activeChat) return;
        setSending(true);
        try {
            const messageData = {
                productId: activeChat.productId, productTitle: activeChat.productTitle,
                senderId: user.uid, buyerId: activeChat.buyerId, sellerId: activeChat.sellerId,
                buyerName: isSeller ? (activeChat.buyerName || 'Acheteur') : (user.displayName || 'Acheteur'),
                sellerName: isSeller ? (user.displayName || 'Vendeur') : (activeChat.sellerName || 'Vendeur'),
                participants: [activeChat.buyerId, activeChat.sellerId],
                content: "Demande de paiement envoyée",
                type: 'payment_request',
                timestamp: new Date().toISOString(),
                readBy: [user.uid]
            };

            await fetch('/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(messageData)
            });

            setShowPaymentModal(false);
            // Manually add to view to feel responsive
            setMessages(prev => [...prev, { ...messageData, id: 'temp-' + Date.now() }]);

        } catch (err) { console.error(err); } finally { setSending(false); }
    };

    const handlePayment = async (msgId) => {
        if (!user || sending || !activeChat) return;
        setSending(true);
        try {
            const messageData = {
                productId: activeChat.productId, productTitle: activeChat.productTitle,
                senderId: user.uid, buyerId: activeChat.buyerId, sellerId: activeChat.sellerId,
                buyerName: isSeller ? (activeChat.buyerName || 'Acheteur') : (user.displayName || 'Acheteur'),
                sellerName: isSeller ? (user.displayName || 'Vendeur') : (activeChat.sellerName || 'Vendeur'),
                participants: [activeChat.buyerId, activeChat.sellerId],
                content: "Paiement effectué ! L'article est vendu.",
                type: 'payment_confirmed',
                timestamp: new Date().toISOString(),
                readBy: [user.uid]
            };

            await fetch('/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(messageData)
            });

            addToast("Paiement effectué !", "success");
            setMessages(prev => [...prev, { ...messageData, id: 'temp-' + Date.now() }]);
        } catch (err) { console.error(err); } finally { setSending(false); }
    };

    const confirmSale = async () => {
        if (!user || sending || !activeChat) return;
        if (!window.confirm(`Confirmer la vente à ${activeChat.buyerName || 'l\'acheteur'} ?`)) return;

        setSending(true);
        try {
            // 1. Update Product status API
            await fetch(`/api/products/${activeChat.productId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: 'sold',
                    buyerId: activeChat.buyerId,
                    soldToName: activeChat.buyerName,
                    soldAt: new Date().toISOString()
                })
            });

            // 2. Send confirmation message API
            const messageData = {
                productId: activeChat.productId, productTitle: activeChat.productTitle,
                senderId: user.uid, buyerId: activeChat.buyerId, sellerId: activeChat.sellerId,
                buyerName: activeChat.buyerName, sellerName: activeChat.sellerName,
                participants: [activeChat.buyerId, activeChat.sellerId],
                content: `🤝 Vente confirmée avec ${activeChat.buyerName || 'l\'acheteur'} !`,
                type: 'sale_confirmed',
                timestamp: new Date().toISOString(),
                readBy: [user.uid]
            };

            await fetch('/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(messageData)
            });

            setMessages(prev => [...prev, { ...messageData, id: 'temp-' + Date.now() }]);

            // 3. Send Invitation Email to Buyer
            let buyerEmail = activeChat.buyerEmail;

            if (!buyerEmail && activeChat.buyerId) {
                const { getUserEmail } = await import('../services/userService');
                buyerEmail = await getUserEmail(activeChat.buyerId);
            }

            if (buyerEmail) {
                sendReviewInvitationEmail({
                    toEmail: buyerEmail,
                    toName: activeChat.buyerName,
                    sellerName: activeChat.sellerName,
                    productTitle: activeChat.productTitle
                });
            }

            addToast("Vente confirmée !", "success");
        } catch (err) {
            console.error("Error confirming sale:", err);
            addToast("Erreur lors de la confirmation", "error");
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 relative">
            <div className="p-4 border-b border-slate-100 flex items-center gap-4 bg-white/80 backdrop-blur-xl sticky top-0 z-10">
                <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center bg-slate-50 rounded-xl text-slate-500"><ArrowLeft size={20} /></button>
                <div className="flex-1"><h3 className="font-black text-slate-900 leading-none">{counterpartyName}</h3><p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest mt-1">{activeChat.productTitle}</p></div>
                {isSeller && !isSaleConfirmed && (
                    <button onClick={confirmSale} disabled={sending} className="bg-indigo-600 text-white px-3 py-2 rounded-lg text-xs font-bold shadow-lg shadow-indigo-200 active:scale-95">
                        Valider la vente
                    </button>
                )}
                {!isSeller && isSaleConfirmed && !hasReviewed && (
                    <button onClick={() => setShowReviewModal(true)} className="bg-amber-400 text-white px-3 py-2 rounded-lg text-xs font-bold shadow-lg shadow-amber-200 active:scale-95 animate-pulse">
                        Laisser un avis
                    </button>
                )}
                {!isSeller && isSaleConfirmed && hasReviewed && (
                    <div className="text-xs font-bold text-amber-500 bg-amber-50 px-3 py-2 rounded-lg">Avis envoyé</div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
                {messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.senderId === user.uid ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] px-5 py-3 rounded-[24px] text-sm font-medium shadow-sm 
                            ${msg.type === 'payment_confirmed' ? 'bg-emerald-500 text-white w-full text-center' :
                                msg.senderId === user.uid ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'}`}>

                            {/* Content Rendering */}
                            {msg.type === 'image' && msg.imageUrl && (
                                <div className="mb-2 rounded-xl overflow-hidden">
                                    <img src={msg.imageUrl} alt="" className="w-full h-auto" />
                                </div>
                            )}

                            {msg.type === 'payment_request' ? (
                                <div className="flex flex-col gap-3">
                                    <span className="font-black opacity-90 uppercase tracking-wider text-[10px]">Demande de paiement</span>
                                    <div className="p-3 bg-white/10 rounded-xl flex items-center gap-3">
                                        <Wallet size={20} />
                                        <span>Procéder au paiement</span>
                                    </div>
                                    {msg.senderId !== user.uid && (
                                        <button onClick={() => handlePayment(msg.id)} disabled={sending} className="bg-white text-indigo-600 py-2 rounded-lg font-bold text-xs shadow-md active:scale-95">Payer maintenant</button>
                                    )}
                                </div>
                            ) : msg.type === 'payment_confirmed' || msg.type === 'sale_confirmed' ? (
                                <div className="flex items-center justify-center gap-2 font-black text-emerald-600 bg-emerald-50 p-2 rounded-lg">
                                    <Check size={18} /> {msg.content || (msg.type === 'sale_confirmed' ? 'VENTE CONFIRMÉE' : 'PAIEMENT REÇU')}
                                </div>
                            ) : (
                                <span>{msg.content}</span>
                            )}

                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-slate-100">
                {imagePreview && (
                    <div className="mb-4 relative inline-block">
                        <img src={imagePreview} className="h-20 w-20 object-cover rounded-xl border border-slate-200" alt="" />
                        <button onClick={cancelImage} className="absolute -top-2 -right-2 bg-slate-900 text-white rounded-full p-1"><X size={12} /></button>
                    </div>
                )}

                <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-3 items-end">
                    <label className="p-4 text-slate-400 hover:text-indigo-600 cursor-pointer transition-colors bg-slate-50 rounded-2xl active:scale-95">
                        <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                        <Camera size={24} />
                    </label>
                    {isSeller && (
                        <button type="button" onClick={() => setShowPaymentModal(true)} className="p-4 text-slate-400 hover:text-emerald-500 cursor-pointer transition-colors bg-slate-50 rounded-2xl active:scale-95">
                            <Wallet size={24} />
                        </button>
                    )}
                    <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Message..." className="flex-1 min-w-0 bg-slate-50 rounded-2xl px-5 py-4 font-medium outline-none" />
                    <button type="submit" className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xl shadow-indigo-100 active:scale-90 flex-shrink-0">
                        <Send size={24} />
                    </button>
                </form>
            </div>

            {/* Mock Payment Modal */}
            {showPaymentModal && (
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
                    <div className="bg-white p-6 rounded-[32px] w-full max-w-sm shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4"><Wallet size={32} /></div>
                        <h3 className="text-xl font-black text-center mb-2">Envoyer une demande</h3>
                        <p className="text-center text-slate-500 text-sm mb-6">Demander à l'acheteur de payer pour valider la vente.</p>
                        <div className="flex gap-3">
                            <Button onClick={() => setShowPaymentModal(false)} variant="secondary" className="flex-1 py-4">Annuler</Button>
                            <Button onClick={sendPaymentRequest} className="flex-1 py-4">Envoyer</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Review Modal */}
            <ReviewModal
                isOpen={showReviewModal}
                onClose={() => {
                    setShowReviewModal(false);
                    // Refresh review state after close (optimistic update)
                    setHasReviewed(true);
                }}
                sellerId={activeChat?.sellerId}
                sellerName={activeChat?.sellerName}
                productId={activeChat?.productId}
                buyerId={user?.uid}
                productTitle={activeChat?.productTitle}
                buyerName={user?.displayName}
            />
        </div>
    );
}

export default ChatDetail;
