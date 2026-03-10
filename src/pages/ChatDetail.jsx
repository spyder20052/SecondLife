import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, Camera, Wallet, X, Check, Smartphone, Upload, CheckCircle, XCircle } from 'lucide-react';
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
    const [sellerMomoNumber, setSellerMomoNumber] = useState('');
    const [loadingMomo, setLoadingMomo] = useState(false);
    const [paymentProofFile, setPaymentProofFile] = useState(null);
    const [paymentProofPreview, setPaymentProofPreview] = useState(null);
    const [sendingProof, setSendingProof] = useState(false);

    const messagesEndRef = useRef(null);
    const location = useLocation();
    const navigate = useNavigate();
    const activeChat = location.state?.activeChat;
    const [productPrice, setProductPrice] = useState(activeChat?.productPrice || 0);

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

    const handleOpenPaymentModal = async () => {
        if (!user || !activeChat) return;
        setLoadingMomo(true);
        try {
            // Fetch seller's MoMo number
            const res = await fetch(`/api/users/${user.uid}`);
            if (res.ok) {
                const data = await res.json();
                if (data.momoNumber) {
                    setSellerMomoNumber(data.momoNumber);
                } else {
                    addToast("Configurez d'abord votre numéro MoMo dans votre profil", "error");
                    setLoadingMomo(false);
                    return;
                }
            }

            // Fetch product price if not already available
            if (!productPrice && activeChat.productId) {
                const prodRes = await fetch(`/api/products/${activeChat.productId}`);
                if (prodRes.ok) {
                    const prodData = await prodRes.json();
                    setProductPrice(prodData.price || 0);
                }
            }

            setShowPaymentModal(true);
        } catch (err) {
            console.error(err);
            addToast("Erreur lors de la récupération du profil", "error");
        } finally {
            setLoadingMomo(false);
        }
    };

    const sendPaymentRequest = async () => {
        if (!user || sending || !activeChat || !sellerMomoNumber) return;
        setSending(true);
        const amount = productPrice || 0;
        const instructions = `📱 PAIEMENT MOMO — ${activeChat.productTitle}\n\n💰 Montant : ${amount.toLocaleString()} FCFA\n📞 Numéro MoMo : ${sellerMomoNumber}\n\n📋 ÉTAPES À SUIVRE :\n\n1️⃣ Ouvrez votre application Mobile Money (MoMo)\n2️⃣ Allez dans « Envoyer de l'argent »\n3️⃣ Entrez le numéro : ${sellerMomoNumber}\n4️⃣ Entrez le montant : ${amount.toLocaleString()} FCFA\n5️⃣ Confirmez le transfert\n6️⃣ Faites une capture d'écran de la confirmation\n7️⃣ Envoyez la capture ci-dessous comme preuve\n\n⚠️ Ne payez que si vous êtes sûr(e) de votre achat.`;
        try {
            const messageData = {
                productId: activeChat.productId, productTitle: activeChat.productTitle,
                senderId: user.uid, buyerId: activeChat.buyerId, sellerId: activeChat.sellerId,
                buyerName: isSeller ? (activeChat.buyerName || 'Acheteur') : (user.displayName || 'Acheteur'),
                sellerName: isSeller ? (user.displayName || 'Vendeur') : (activeChat.sellerName || 'Vendeur'),
                participants: [activeChat.buyerId, activeChat.sellerId],
                content: instructions,
                type: 'payment_request',
                paymentAmount: amount,
                momoNumber: sellerMomoNumber,
                timestamp: new Date().toISOString(),
                readBy: [user.uid]
            };

            await fetch('/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(messageData)
            });

            setShowPaymentModal(false);
            setMessages(prev => [...prev, { ...messageData, id: 'temp-' + Date.now() }]);

        } catch (err) { console.error(err); } finally { setSending(false); }
    };

    const handlePaymentProofChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            setPaymentProofFile(file);
            const preview = await compressImage(file);
            setPaymentProofPreview(preview);
        }
    };

    const sendPaymentProof = async () => {
        if (!user || sendingProof || !activeChat || !paymentProofFile) return;
        setSendingProof(true);
        try {
            const proofImage = await compressImage(paymentProofFile, 0.6, 600, 600);
            const messageData = {
                productId: activeChat.productId, productTitle: activeChat.productTitle,
                senderId: user.uid, buyerId: activeChat.buyerId, sellerId: activeChat.sellerId,
                buyerName: isSeller ? (activeChat.buyerName || 'Acheteur') : (user.displayName || 'Acheteur'),
                sellerName: isSeller ? (user.displayName || 'Vendeur') : (activeChat.sellerName || 'Vendeur'),
                participants: [activeChat.buyerId, activeChat.sellerId],
                content: '📸 Preuve de paiement envoyée',
                type: 'payment_proof',
                imageUrl: proofImage,
                timestamp: new Date().toISOString(),
                readBy: [user.uid]
            };

            await fetch('/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(messageData)
            });

            setPaymentProofFile(null);
            setPaymentProofPreview(null);
            setMessages(prev => [...prev, { ...messageData, id: 'temp-' + Date.now() }]);
            addToast("Preuve de paiement envoyée !", "success");
        } catch (err) {
            console.error(err);
            addToast("Erreur lors de l'envoi de la preuve", "error");
        } finally {
            setSendingProof(false);
        }
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
            <div className="p-3 sm:p-4 border-b border-slate-100 flex items-center gap-3 sm:gap-4 bg-white/80 backdrop-blur-xl sticky top-0 z-10">
                <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center bg-slate-50 rounded-xl text-slate-500"><ArrowLeft size={20} /></button>
                <div className="flex-1"><h3 className="font-black text-slate-900 leading-none">{counterpartyName}</h3><p className="text-[9px] font-black text-brand-800 uppercase tracking-widest mt-1">{activeChat.productTitle}</p></div>
                {isSeller && !isSaleConfirmed && (
                    <button onClick={confirmSale} disabled={sending} className="bg-brand-800 text-white px-3 py-2 rounded-lg text-xs font-bold shadow-lg shadow-brand-200 active:scale-95">
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

            <div className="flex-1 overflow-y-auto p-3 sm:p-6 flex flex-col gap-3 sm:gap-4">
                {messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.senderId === user.uid ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] px-5 py-3 rounded-[24px] text-sm font-medium shadow-sm 
                            ${msg.type === 'payment_confirmed' ? 'bg-emerald-500 text-white w-full text-center' :
                                msg.senderId === user.uid ? 'bg-brand-800 text-white rounded-tr-none' : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'}`}>

                            {/* Content Rendering */}
                            {msg.type === 'image' && msg.imageUrl && (
                                <div className="mb-2 rounded-xl overflow-hidden">
                                    <img src={msg.imageUrl} alt="" className="w-full h-auto" />
                                </div>
                            )}

                            {msg.type === 'payment_request' ? (
                                <div className="flex flex-col gap-3 w-full">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center">
                                            <Smartphone size={16} className="text-white" />
                                        </div>
                                        <span className="font-black text-xs uppercase tracking-wider">Paiement MoMo</span>
                                    </div>
                                    {msg.momoNumber && (
                                        <div className={`p-4 rounded-2xl text-sm space-y-2 ${msg.senderId === user.uid ? 'bg-white/15' : 'bg-brand-50 border border-brand-100'}`}>
                                            <div className={`font-black text-base ${msg.senderId === user.uid ? 'text-white' : 'text-brand-700'}`}>
                                                💰 {(msg.paymentAmount || 0).toLocaleString()} FCFA
                                            </div>
                                            <div className={`text-xs font-bold ${msg.senderId === user.uid ? 'text-brand-100' : 'text-brand-500'}`}>
                                                📞 Numéro : {msg.momoNumber}
                                            </div>
                                            <hr className={`${msg.senderId === user.uid ? 'border-white/20' : 'border-brand-100'}`} />
                                            <div className={`text-xs space-y-1.5 ${msg.senderId === user.uid ? 'text-brand-100' : 'text-slate-600'}`}>
                                                <p className="font-bold">📋 Étapes :</p>
                                                <p>1️⃣ Ouvrez votre app MoMo</p>
                                                <p>2️⃣ « Envoyer de l'argent »</p>
                                                <p>3️⃣ Numéro : <span className="font-bold">{msg.momoNumber}</span></p>
                                                <p>4️⃣ Montant : <span className="font-bold">{(msg.paymentAmount || 0).toLocaleString()} FCFA</span></p>
                                                <p>5️⃣ Confirmez le transfert</p>
                                                <p>6️⃣ Capture d'écran de la confirmation</p>
                                                <p>7️⃣ Envoyez la capture ci-dessous</p>
                                            </div>
                                            <div className={`text-[10px] font-bold mt-2 ${msg.senderId === user.uid ? 'text-amber-200' : 'text-amber-600'}`}>
                                                ⚠️ Ne payez que si vous êtes sûr(e)
                                            </div>
                                        </div>
                                    )}
                                    {!msg.momoNumber && (
                                        <div className="p-3 bg-white/10 rounded-xl flex items-center gap-3">
                                            <Wallet size={20} />
                                            <span>{msg.content}</span>
                                        </div>
                                    )}
                                    {msg.senderId !== user.uid && !messages.some(m => m.type === 'payment_proof') && (
                                        <label className="bg-white text-brand-800 py-3 px-4 rounded-xl font-bold text-xs shadow-md active:scale-95 cursor-pointer flex items-center justify-center gap-2 hover:bg-brand-50 transition-colors">
                                            <Upload size={16} /> Envoyer la preuve de paiement
                                            <input type="file" accept="image/*" onChange={handlePaymentProofChange} className="hidden" />
                                        </label>
                                    )}
                                </div>
                            ) : msg.type === 'payment_proof' ? (
                                <div className="flex flex-col gap-3 w-full">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="w-6 h-6 rounded-full bg-blue-400 flex items-center justify-center">
                                            <Camera size={12} className="text-white" />
                                        </div>
                                        <span className="font-black text-[10px] uppercase tracking-wider">Preuve de paiement</span>
                                    </div>
                                    {msg.imageUrl && (
                                        <div className="rounded-xl overflow-hidden border-2 border-white/20">
                                            <img src={msg.imageUrl} alt="Preuve de paiement" className="w-full h-auto" />
                                        </div>
                                    )}
                                    {isSeller && msg.senderId !== user.uid && !messages.some(m => m.type === 'payment_confirmed') && (
                                        <div className="flex gap-2 mt-1">
                                            <button onClick={() => handlePayment(msg.id)} disabled={sending} className="flex-1 bg-emerald-500 text-white py-2.5 rounded-xl font-bold text-xs shadow-md active:scale-95 flex items-center justify-center gap-1.5 hover:bg-emerald-600 transition-colors">
                                                <CheckCircle size={14} /> Confirmer
                                            </button>
                                            <button onClick={() => handleSend('text', '❌ Preuve de paiement refusée. Veuillez renvoyer une capture valide.')} disabled={sending} className="flex-1 bg-rose-500 text-white py-2.5 rounded-xl font-bold text-xs shadow-md active:scale-95 flex items-center justify-center gap-1.5 hover:bg-rose-600 transition-colors">
                                                <XCircle size={14} /> Refuser
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : msg.type === 'payment_confirmed' || msg.type === 'sale_confirmed' ? (
                                <div className="flex items-center justify-center gap-2 font-black text-emerald-600 bg-emerald-50 p-3 rounded-xl">
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
            <div className="p-3 sm:p-4 bg-white border-t border-slate-100">
                {imagePreview && (
                    <div className="mb-4 relative inline-block">
                        <img src={imagePreview} className="h-20 w-20 object-cover rounded-xl border border-slate-200" alt="" />
                        <button onClick={cancelImage} className="absolute -top-2 -right-2 bg-slate-900 text-white rounded-full p-1"><X size={12} /></button>
                    </div>
                )}

                <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2 sm:gap-3 items-end">
                    <label className="p-3 sm:p-4 text-slate-400 hover:text-brand-800 cursor-pointer transition-colors bg-slate-50 rounded-xl sm:rounded-2xl active:scale-95">
                        <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                        <Camera size={24} />
                    </label>
                    {isSeller && (
                        <button type="button" onClick={handleOpenPaymentModal} disabled={loadingMomo} className="p-3 sm:p-4 text-slate-400 hover:text-emerald-500 cursor-pointer transition-colors bg-slate-50 rounded-xl sm:rounded-2xl active:scale-95 disabled:opacity-50">
                            <Wallet size={24} />
                        </button>
                    )}
                    <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Message..." className="flex-1 min-w-0 bg-slate-50 rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3 sm:py-4 text-sm sm:text-base font-medium outline-none" />
                    <button type="submit" className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-brand-800 text-white flex items-center justify-center shadow-xl shadow-brand-100 active:scale-90 flex-shrink-0">
                        <Send size={24} />
                    </button>
                </form>
            </div>

            {/* MoMo Payment Modal */}
            {showPaymentModal && (
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6">
                    <div className="bg-white p-6 rounded-[32px] w-full max-w-sm shadow-2xl animate-in fade-in zoom-in duration-200 max-h-[80vh] overflow-y-auto">
                        <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4"><Smartphone size={32} /></div>
                        <h3 className="text-xl font-black text-center mb-2">Demande de paiement MoMo</h3>
                        <p className="text-center text-slate-500 text-sm mb-4">L'acheteur recevra un message avec les instructions détaillées pour envoyer le paiement.</p>

                        <div className="bg-slate-50 p-4 rounded-2xl mb-4 space-y-2 text-sm">
                            <div className="flex justify-between items-center">
                                <span className="text-slate-500 font-medium">Article</span>
                                <span className="font-bold text-slate-800 text-right max-w-[60%] truncate">{activeChat.productTitle}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-500 font-medium">Montant</span>
                                <span className="font-black text-brand-800">{(productPrice || 0).toLocaleString()} FCFA</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-500 font-medium">N° MoMo</span>
                                <span className="font-bold text-slate-800">{sellerMomoNumber}</span>
                            </div>
                        </div>

                        <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl mb-5 text-xs text-amber-700 font-medium">
                            ⚠️ L'acheteur devra envoyer une capture d'écran après le transfert pour validation.
                        </div>

                        <div className="flex gap-3">
                            <Button onClick={() => setShowPaymentModal(false)} variant="secondary" className="flex-1 py-4">Annuler</Button>
                            <Button onClick={sendPaymentRequest} loading={sending} className="flex-1 py-4">Envoyer</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Payment Proof Preview Modal */}
            {paymentProofPreview && (
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
                    <div className="bg-white p-6 rounded-[32px] w-full max-w-sm shadow-2xl animate-in fade-in zoom-in duration-200">
                        <h3 className="text-lg font-black text-center mb-4">Confirmer l'envoi de la preuve</h3>
                        <div className="rounded-2xl overflow-hidden border-2 border-slate-100 mb-4">
                            <img src={paymentProofPreview} alt="Preuve" className="w-full h-auto" />
                        </div>
                        <p className="text-center text-slate-500 text-xs mb-4">Cette capture d'écran sera envoyée au vendeur comme preuve de paiement.</p>
                        <div className="flex gap-3">
                            <Button onClick={() => { setPaymentProofFile(null); setPaymentProofPreview(null); }} variant="secondary" className="flex-1 py-4">Annuler</Button>
                            <Button onClick={sendPaymentProof} loading={sendingProof} className="flex-1 py-4 bg-emerald-500 hover:bg-emerald-600">Envoyer</Button>
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
