import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, Camera, Wallet, X, Check } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { collection, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db, appId } from '../firebase';
import { compressImage } from '../utils/image';
import { useToast } from '../components/Toast';
import Button from '../components/Button';
import { sendMessageNotificationEmail } from '../services/emailService';

function ChatDetail({ user }) {
    const { addToast } = useToast();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [sending, setSending] = useState(false);
    const [imageFile, setImageFile] = useState(null); // For chat images
    const [imagePreview, setImagePreview] = useState(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);

    const messagesEndRef = useRef(null);
    const location = useLocation();
    const navigate = useNavigate();
    const activeChat = location.state?.activeChat;

    // Determine if current user is the seller - needed for correct name handling
    const isSeller = user && activeChat ? user.uid === activeChat.sellerId : false;
    const counterpartyName = isSeller ? (activeChat?.buyerName || 'Acheteur') : (activeChat?.sellerName || 'Vendeur');

    useEffect(() => {
        if (!activeChat || !user) {
            navigate('/');
            return;
        }
        const q = collection(db, 'artifacts', appId, 'public', 'data', 'messages');
        return onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
                // Filter by productId AND the specific buyer-seller pair
                .filter(m =>
                    m.productId === activeChat.productId &&
                    m.buyerId === activeChat.buyerId &&
                    m.sellerId === activeChat.sellerId
                )
                .sort((a, b) => (a.timestamp?.seconds || 0) - (b.timestamp?.seconds || 0));

            setMessages(msgs);

            // Mark unread messages as read
            msgs.forEach(msg => {
                if (msg.senderId !== user.uid && (!msg.readBy || !msg.readBy.includes(user.uid))) {
                    const msgRef = doc(db, 'artifacts', appId, 'public', 'data', 'messages', msg.id);
                    updateDoc(msgRef, {
                        readBy: arrayUnion(user.uid)
                    }).catch(err => console.error('Error marking message as read:', err));
                }
            });

            // Scroll to bottom
            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
        });
    }, [activeChat, user, navigate]);

    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            const preview = await compressImage(file); // Re-using compress for preview is fine, acts as Base64
            setImagePreview(preview);
        }
    };

    const cancelImage = () => {
        setImageFile(null);
        setImagePreview(null);
    };

    const sendMessage = async (e) => {
        e?.preventDefault();
        if ((!newMessage.trim() && !imageFile) || !user || sending || !activeChat) return;
        setSending(true);
        try {
            let contentImage = null;
            if (imageFile) {
                contentImage = await compressImage(imageFile);
            }

            await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'messages'), {
                productId: activeChat.productId, productTitle: activeChat.productTitle,
                senderId: user.uid, buyerId: activeChat.buyerId, sellerId: activeChat.sellerId,
                buyerName: isSeller ? (activeChat.buyerName || 'Acheteur') : (user.displayName || 'Acheteur'),
                sellerName: isSeller ? (user.displayName || 'Vendeur') : (activeChat.sellerName || 'Vendeur'),
                participants: [activeChat.buyerId, activeChat.sellerId],
                content: newMessage,
                type: imageFile ? 'image' : 'text',
                imageUrl: contentImage,
                timestamp: serverTimestamp(),
                readBy: [user.uid] // Sender has read their own message
            });

            // Send email notification to recipient
            const recipientId = isSeller ? activeChat.buyerId : activeChat.sellerId;
            const recipientName = isSeller ? activeChat.buyerName : activeChat.sellerName;
            const senderName = user.displayName || (isSeller ? 'Vendeur' : 'Acheteur');

            // Try to get email from activeChat first, then from Firestore
            let recipientEmail = isSeller ? activeChat.buyerEmail : activeChat.sellerEmail;

            if (!recipientEmail && recipientId) {
                // Import dynamically to avoid circular dependencies
                const { getUserEmail } = await import('../services/userService');
                recipientEmail = await getUserEmail(recipientId);
            }

            if (recipientEmail) {
                sendMessageNotificationEmail({
                    toEmail: recipientEmail,
                    toName: recipientName,
                    fromName: senderName,
                    message: newMessage || 'Image envoyée',
                    productTitle: activeChat.productTitle
                }).catch(err => console.log('Email notification skipped:', err));
            } else {
                console.log('[Email] No recipient email found for:', recipientId);
            }

            setNewMessage("");
            cancelImage();
        } catch (err) { console.error(err); } finally { setSending(false); }
    };

    const sendPaymentRequest = async () => {
        if (!user || sending || !activeChat) return;
        setSending(true);
        try {
            await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'messages'), {
                productId: activeChat.productId, productTitle: activeChat.productTitle,
                senderId: user.uid, buyerId: activeChat.buyerId, sellerId: activeChat.sellerId,
                buyerName: isSeller ? (activeChat.buyerName || 'Acheteur') : (user.displayName || 'Acheteur'),
                sellerName: isSeller ? (user.displayName || 'Vendeur') : (activeChat.sellerName || 'Vendeur'),
                participants: [activeChat.buyerId, activeChat.sellerId],
                content: "Demande de paiement envoyée",
                type: 'payment_request',
                timestamp: serverTimestamp(),
                readBy: [user.uid]
            });
            setShowPaymentModal(false);
        } catch (err) { console.error(err); } finally { setSending(false); }
    };

    const handlePayment = async (msgId) => {
        if (!user || sending || !activeChat) return;
        // In a real app, integrate Stripe here.
        // For MVP, we send a "Payment Confirmed" system message.
        setSending(true);
        try {
            await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'messages'), {
                productId: activeChat.productId, productTitle: activeChat.productTitle,
                senderId: user.uid, buyerId: activeChat.buyerId, sellerId: activeChat.sellerId,
                buyerName: isSeller ? (activeChat.buyerName || 'Acheteur') : (user.displayName || 'Acheteur'),
                sellerName: isSeller ? (user.displayName || 'Vendeur') : (activeChat.sellerName || 'Vendeur'),
                participants: [activeChat.buyerId, activeChat.sellerId],
                content: "Paiement effectué ! L'article est vendu.",
                type: 'payment_confirmed',
                timestamp: serverTimestamp(),
                readBy: [user.uid]
            });
            addToast("Paiement effectué !", "success");
        } catch (err) { console.error(err); } finally { setSending(false); }
    };

    // isSeller and counterpartyName are now defined at the top of the component

    return (
        <div className="flex flex-col h-full bg-slate-50 relative">
            <div className="p-4 border-b border-slate-100 flex items-center gap-4 bg-white/80 backdrop-blur-xl sticky top-0 z-10">
                <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center bg-slate-50 rounded-xl text-slate-500"><ArrowLeft size={20} /></button>
                <div className="flex-1"><h3 className="font-black text-slate-900 leading-none">{counterpartyName}</h3><p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest mt-1">{activeChat.productTitle}</p></div>
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
                            ) : msg.type === 'payment_confirmed' ? (
                                <div className="flex items-center justify-center gap-2 font-black">
                                    <Check size={18} /> VENTE CONFIRMÉE
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

                <form onSubmit={sendMessage} className="flex gap-3 items-end">
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
        </div>
    );
}

export default ChatDetail;
