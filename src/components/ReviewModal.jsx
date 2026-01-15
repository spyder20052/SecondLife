import React, { useState } from 'react';
import { Star, X } from 'lucide-react';
import { useToast } from './Toast';
import Button from './Button';

function ReviewModal({ isOpen, onClose, sellerId, sellerName, productId, productTitle, buyerId, buyerName }) {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");
    const [hoverRating, setHoverRating] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const { addToast } = useToast();

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (rating === 0) {
            addToast("Veuillez sélectionner une note.", "error");
            return;
        }

        setSubmitting(true);
        try {
            const reviewData = {
                productId,
                productTitle: productTitle || "Produit",
                reviewerId: buyerId,
                reviewerName: buyerName || "Acheteur",
                sellerId,
                sellerName: sellerName || "Vendeur",
                rating,
                comment
            };

            const res = await fetch('/api/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reviewData)
            });

            if (!res.ok) throw new Error("API Error");

            addToast("Avis publié !", "success");
            onClose();
        } catch (err) {
            console.error("Review Error:", err);
            addToast("Erreur lors de la publication.", "error");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-sm rounded-[32px] p-6 shadow-2xl relative">
                <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-slate-50 rounded-full text-slate-400 hover:text-slate-900 transition-colors">
                    <X size={20} />
                </button>

                <div className="text-center mb-6">
                    <h3 className="text-xl font-black text-slate-900 mb-2">Notez votre expérience</h3>
                    <p className="text-sm text-slate-500">Comment s'est passée la transaction avec <span className="font-bold text-indigo-600">{sellerName}</span> ?</p>
                </div>

                <div className="flex justify-center gap-2 mb-6">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            className="transition-transform active:scale-90"
                        >
                            <Star
                                size={32}
                                className={`transition-colors ${star <= (hoverRating || rating) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
                            />
                        </button>
                    ))}
                </div>

                <textarea
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-medium text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none mb-6"
                    rows={3}
                    placeholder="Un petit commentaire ? (Optionnel)"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                />

                <Button onClick={handleSubmit} loading={submitting} className="w-full py-4 shadow-xl shadow-indigo-200">
                    Envoyer mon avis
                </Button>
            </div>
        </div>
    );
}

export default ReviewModal;
